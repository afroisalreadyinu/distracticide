let BlockedPages = ["news.ycombinator.com", "reddit.com", "twitter.com"];

function checkURL(requestDetails) {
  if (["main_frame", "object"].includes(requestDetails.type)) {
    let pageUrl = new URL(requestDetails.url);
    for (const url of BlockedPages) {
      if (url === pageUrl.hostname) {
        browser.tabs.update(requestDetails.tabId, {"url": "/page.html"});
        return {cancel: true};
      }
    }
  };
}

browser.webRequest.onBeforeRequest.addListener(
  checkURL,
  {urls: ["<all_urls>"]},
  ['blocking']
);
