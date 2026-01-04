"use strict";

function hostsMatch(configHost: string, pageHost: string) {
    if (configHost === pageHost) return true;
    if (configHost === `www.${pageHost}`) return true;
    if (`www.${configHost}` === pageHost) return true;
    return false;
}

// taken from https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
type WebRequestResourceType = "beacon" | "csp_report" | "font" | "image" | "imageset" | "json" | "main_frame" | "media" | "object" | "object_subrequest" | "ping" | "script" | "speculative" | "stylesheet" | "sub_frame" | "web_manifest" | "websocket" | "xml_dtd" | "xmlhttprequest" | "xslt" | "other" ;

// Taken from https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest#details
interface OnBeforeRequestDetails {
    type: WebRequestResourceType;
    tabId: number;
    requestId: string;
    timeStamp: number;
    url: string;
    documentUrl?: string;
    cookieStoreId?: string | undefined;
};

async function checkURL(requestDetails: OnBeforeRequestDetails) {
    if (!["main_frame", "object"].includes(requestDetails.type)) return {};
    let pageUrl = new URL(requestDetails.url);
    const data = await browser.storage.local.get('deactivatedOnTabs');
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    if (deactivatedOnTabs.includes(requestDetails.tabId)) return {};
    const blockedHostsData = await browser.storage.sync.get('blockedHosts');
    const blockedHosts = blockedHostsData['blockedHosts'] || [];
    for (const url of blockedHosts) {
	if (hostsMatch(url, pageUrl.hostname)) {
	    let blocked = encodeURIComponent(requestDetails.url);
	    const hideButtonStorage = await browser.storage.sync.get('hideGoThereButton');
	    const hideButton = hideButtonStorage['hideGoThereButton'] || false;
	    const hideButtonParam = hideButton ? 1 : 0;
	    return {redirectUrl: browser.runtime.getURL(`page.html?blocked=${blocked}&hideButton=${hideButtonParam}`)};
	}
    }
    return {};
};

// This can't be async, unfortunately, so we have to do a callback
function tabClosed(tabId: number) {
    return browser.storage.local.get('deactivatedOnTabs').then(function(data) {
	let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
	if (deactivatedOnTabs.includes(tabId)) {
	    deactivatedOnTabs = deactivatedOnTabs.filter((id: number) => id !== tabId);
	    browser.storage.local.set({deactivatedOnTabs});
	};
    });
};

function init() {
    browser.webRequest.onBeforeRequest.addListener(
	checkURL,
	{urls: ["<all_urls>"]},
	['blocking']
    );
    browser.tabs.onRemoved.addListener(tabClosed);
}

if (typeof browser !== "undefined") init();
