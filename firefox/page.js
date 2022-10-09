function updateText(saved) {
  const pageUrl = new URL(saved["lastBlocked"]);
  document.getElementById("dest-hostname").textContent = pageUrl.hostname;
}

window.addEventListener('load', function(event) {
  browser.storage.local.get('lastBlocked').then(updateText);
});
