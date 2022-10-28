let assert = chai.assert;

class FakeBrowser {
  constructor(domains=[]) {
    this.domains = domains;
    this.storage = {
      local: {
        async get(key) { return {}; }
      },
      sync: {
        async get(key) { return {}; }
      }
    };
  };
}

describe("Background scripts", () => {

  it("Skips requests that arenot main_from or object", async function() {
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
});
