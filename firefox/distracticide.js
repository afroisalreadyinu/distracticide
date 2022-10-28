"use strict";

function getHandlers(browser) {

  async function checkURL(requestDetails) {
    if (!["main_frame", "object"].includes(requestDetails.type)) return {};
    let pageUrl = new URL(requestDetails.url);
    const data = await browser.storage.local.get('deactivatedOnTabs');
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    if (deactivatedOnTabs.includes(requestDetails.tabId)) return {};
    const blockedHostsData = await browser.storage.sync.get('blockedHosts');
    const blockedHosts = blockedHostsData['blockedHosts'] || [];
    for (const url of blockedHosts) {
      if (url === pageUrl.hostname) {
        let blocked = encodeURIComponent(requestDetails.url);
        return {redirectUrl: browser.runtime.getURL(`page.html?blocked=${blocked}`)};
      }
    }
    return {};
  };

  // This can't be async, unfortunately, so we have to do a callback
  function tabClosed(tabId) {
    browser.storage.local.get('deactivatedOnTabs').then(function(data) {
      let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
      if (deactivatedOnTabs.includes(tabId)) {
        deactivatedOnTabs = deactivatedOnTabs.filter(id => id !== tabId);
        browser.storage.local.set({deactivatedOnTabs});
      };
    });
  };

  return [checkURL, tabClosed];
}

function init(browser) {
  let [checkURL, tabClosed] = getHandlers(browser);
  browser.webRequest.onBeforeRequest.addListener(
    checkURL,
    {urls: ["<all_urls>"]},
    ['blocking']
  );
  browser.tabs.onRemoved.addListener(tabClosed);
}

if (typeof browser !== "undefined") init(browser);
