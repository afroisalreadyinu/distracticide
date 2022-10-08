function logURL(requestDetails) {
  if (["main_frame", "object"].includes(requestDetails.type)) {
    console.log("Loading: " + requestDetails.url + " with type " + requestDetails.type);
  }
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
  {urls: ["<all_urls>"]}
);
