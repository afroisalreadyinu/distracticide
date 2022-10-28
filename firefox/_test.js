let assert = chai.assert;

class FakeBrowser {
  constructor(domains=[], deactivatedOnTabs=[]) {
    let fb = this;
    this.storage = {
      local: {
        async get(key) { return { deactivatedOnTabs }; }
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
    console.log("Now this one");
    const fakeBrowser = new FakeBrowser(["twitter.com"], [72]);
    let [checkURL, _] = getHandlers(fakeBrowser);
    const url = "https://twitter.com/some/path";
    let retval = await checkURL({type: "object", url: url, tabId: 72});
    assert.deepEqual(retval, {});
  });

});
