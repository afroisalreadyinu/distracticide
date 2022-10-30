"use strict";

let assert = chai.assert;
const VERY_RANDOM_ID = 58;

class FakeBrowser {
  constructor(domains=[], deactivatedOnTabs=[], activities=[]) {
    let fb = this;
    this.deactivatedOnTabs = deactivatedOnTabs;
    this.sync = {blockedHosts: domains, activities: activities};
    this.local = { deactivatedOnTabs: fb.deactivatedOnTabs };
    this.storage = {
      local: {
        async get(key) { return fb.local; },
        async set(values) { Object.assign(fb.local, values); }
      },
      sync: {
        async get(key) { return fb.sync; },
        async set(values) { Object.assign(fb.sync, values); }
      },
    };
    this.tabs = {
      async getCurrent() {
        return {id: VERY_RANDOM_ID};
      }
    };
    this.runtime = {
      getURL(targetURL) {
        fb.targetURL = targetURL;
        return "REDIRECT";
      }
    };
  };
}

class FakeWindow {
  eventListeners = {}
  constructor(blockedUrl) {
    this.location = { href: `moz-extension://blah-yada/page.html?blocked=${encodeURIComponent(blockedUrl)}`};
  }
  addEventListener(eventName, listener) {
    this.eventListeners[eventName] = listener;
  };
};

class FakeUL {
  items = []
  listeners = {}
  append(item) {
    this.items.push(item);
  }
  addEventListener(event, listener) {
    this.listeners[event] = listener;
  }
}

class FakeDocument {
  constructor(elements) {
    this.elements = {'add-hostname-button': {},
                     'add-activity-button': {},
                     'hostname-list': new FakeUL(),
                     'activity-list': new FakeUL(),
                     'disable-button': {what: "now"},
                     'dest-hostname': {}};
  }
  getElementById(id) {
    return this.elements[id];
  }
  createElement(tag) {
    return {};
  }
}

class FakeElement {
  removed = false;
  constructor(subelements) {
    this.subelements = subelements;
  }
  getElementsByTagName(tag) {
    return this.subelements.filter((e) => e.tag == tag);
  }
  getElementsByClassName(klass) {
    return this.subelements.filter((e) => e.klass == klass);
  }
  remove() {
    this.removed = true;
  }
}


describe("Background scripts", () => {

  it("Skips requests that are not main_from or object", async function() {
    let [checkURL, _] = getHandlers(null);
    let retval = await checkURL({type: "", url: "https://twitter.com"});
    assert.deepEqual(retval, {});
  });

  it("Returns empty object if domain not in list", async function() {
    const fakeBrowser = new FakeBrowser([]);
    let [checkURL, _] = getHandlers(fakeBrowser);
    let retval = await checkURL({type: "object", url: "https://twitter.com"});
    assert.deepEqual(retval, {});
  });

  it("Checks domain and not URL", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com", "blah.org"]);
    let [checkURL, _] = getHandlers(fakeBrowser);
    const url = "https://twitter.com/some/path";
    let retval = await checkURL({type: "object", url: url});
    assert.deepEqual(retval, {redirectUrl: "REDIRECT"});
    assert.equal(fakeBrowser.targetURL, `page.html?blocked=${encodeURIComponent(url)}`);
  });

  it("Skips if deactivated on tab", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [72]);
    let [checkURL, _] = getHandlers(fakeBrowser);
    const url = "https://twitter.com/some/path";
    let retval = await checkURL({type: "object", url: url, tabId: 72});
    assert.deepEqual(retval, {});
  });

  it("Does nothing if tab not in blocked", function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [64, 72]);
    let [_, tabClosed] = getHandlers(fakeBrowser);
    tabClosed(54);
    assert.deepEqual(fakeBrowser.local.deactivatedOnTabs, [64, 72]);
  });

  it("Pops tab ID if tab in blocked", function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [64, 72]);
    let [_, tabClosed] = getHandlers(fakeBrowser);
    let promise = tabClosed(72);
    promise.then(() => assert.deepEqual(fakeBrowser.local.deactivatedOnTabs, [64]));
  });

});

describe("Extension page", () => {

  it("Intro text updated", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    assert.equal(Object.keys(fakeWindow.eventListeners).length, 1);
    assert("load" in fakeWindow.eventListeners);
    await fakeWindow.eventListeners.load();
    assert.equal(fakeDocument.elements['dest-hostname'].textContent, 'twitter.com');
  });

  it("Tasks are loaded from storage", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [], ["Do something"]);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    let activities = fakeDocument.elements['activity-list'].items;
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    await fakeWindow.eventListeners.load();
    assert.equal(activities.length, 1);
    assert.equal(activities[0].innerHTML,
                 '<span class="activity">Do something</span> <a href="#" class="remove-link">Remove</a>');
  });

  it("Blocked hosts are loaded from storage", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    let activities = fakeDocument.elements['hostname-list'].items;
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    await fakeWindow.eventListeners.load();
    assert.equal(activities.length, 1);
    assert.equal(activities[0].innerHTML,
                 '<span class="hostname">twitter.com</span> <a href="#" class="remove-link">Remove</a>');
  });

  it("Deactivate button navigates away and deactivates", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    await fakeWindow.eventListeners.load();
    let onclick = fakeDocument.elements['disable-button'].onclick;
    assert.notEqual(onclick, undefined);
    await onclick();
    assert.deepEqual(fakeBrowser.local.deactivatedOnTabs, [VERY_RANDOM_ID]);
    assert.equal(fakeWindow.location.href, "https://twitter.com");
  });

  it("You can add new hostnames", async function() {
    const fakeBrowser = new FakeBrowser([], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    await fakeWindow.eventListeners.load();
    let onclick = fakeDocument.elements['add-hostname-button'].onclick;
    assert.notEqual(onclick, undefined);
    let fakeForm = new FakeElement([{tag: 'input', value: 'spiegel.de'}, {klass: 'form-error'}]);
    let event = { target: {closest: function(tag) {if (tag == 'form') return fakeForm; return null;} } };
    await onclick(event);
    assert.deepEqual(fakeBrowser.sync.blockedHosts, ['spiegel.de']);
  });

  it("You can remove hostnames", async function() {
    const fakeBrowser = new FakeBrowser(['spiegel.de', 'twitter.com'], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    await fakeWindow.eventListeners.load();
    let onclick = fakeDocument.elements['hostname-list'].listeners['click'];
    assert.notEqual(onclick, undefined);
    let parent = new FakeElement([{klass: 'hostname', innerHTML: 'spiegel.de'}]);
    let target = {parentElement: parent, matches: function(spec) {if (spec == '.remove-link') return true; return false;} };
    await onclick({target});
    assert.deepEqual(fakeBrowser.sync.blockedHosts, ['twitter.com']);
    assert.isTrue(parent.removed);
  });

});
