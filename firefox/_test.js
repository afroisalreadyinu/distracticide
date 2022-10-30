"use strict";

let assert = chai.assert;

class FakeBrowser {
  constructor(domains=[], deactivatedOnTabs=[]) {
    let fb = this;
    this.deactivatedOnTabs = deactivatedOnTabs;
    this.storage = {
      local: {
        async get(key) { return { deactivatedOnTabs: fb.deactivatedOnTabs }; },
        async set(values) { for (const key in values) fb[key] = values[key]; }
      },
      sync: {
        async get(key) { return {blockedHosts: domains}; }
      },
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

class FakeDocument {
  constructor(elements) {
    this.elements = {'add-hostname-button': {},
                     'add-activity-button': {},
                     'hostname-list': {append: function(item) {}, addEventListener: function(listener) {}},
                     'activity-list': {append: function(item) {}, addEventListener: function(listener) {}},
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
    assert.deepEqual(fakeBrowser.deactivatedOnTabs, [64, 72]);
  });

  it("Pops tab ID if tab in blocked", function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], [64, 72]);
    let [_, tabClosed] = getHandlers(fakeBrowser);
    let promise = tabClosed(72);
    promise.then(() => assert.deepEqual(fakeBrowser.deactivatedOnTabs, [64]));
  });

});

describe("Extension page", () => {

  it("Intro text updated", function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    assert.equal(Object.keys(fakeWindow.eventListeners).length, 1);
    assert("load" in fakeWindow.eventListeners);
    fakeWindow.eventListeners.load();
    assert.equal(fakeDocument.elements['dest-hostname'].textContent, 'twitter.com');
  });

  it("Disable button navigates away and disables", async function() {
    const fakeBrowser = new FakeBrowser(["twitter.com"], []);
    const fakeWindow = new FakeWindow("https://twitter.com");
    const fakeDocument = new FakeDocument();
    loadDistracticide(fakeBrowser, fakeWindow, fakeDocument);
    fakeWindow.eventListeners.load();
    assert.notEqual(fakeDocument.elements['disable-button'].onclick, undefined);
  });

});
