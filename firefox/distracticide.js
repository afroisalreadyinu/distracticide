let BlockedPages = ["news.ycombinator.com", "reddit.com", "twitter.com"];

function checkURL(requestDetails) {
  if (["main_frame", "object"].includes(requestDetails.type)) {
    let pageUrl = new URL(requestDetails.url);
    for (const url of BlockedPages) {
      if (url === pageUrl.hostname) {
        browser.storage.local.get('deactivatedOnTabs').then(function(data) {
          let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
          if (deactivatedOnTabs.includes(requestDetails.tabId)) {
            return {};
          }
          browser.storage.local.set({lastBlocked: requestDetails.url});
          browser.tabs.update(requestDetails.tabId, {"url": "/page.html"});
          return {cancel: true};
        });
      }
    }
  };
};

browser.webRequest.onBeforeRequest.addListener(
  checkURL,
  {urls: ["<all_urls>"]},
  ['blocking']
);

function tabClosed(tabId) {
  browser.storage.local.get('deactivatedOnTabs').then(function(data) {
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    if (deactivatedOnTabs.includes(tabId)) {
      deactivatedOnTabs = deactivatedOnTabs.filter(id => id !== tabId);
      browser.storage.local.set({deactivatedOnTabs});
    };
  });
};

browser.tabs.onRemoved.addListener(tabClosed);
