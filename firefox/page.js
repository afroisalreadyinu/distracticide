var state = {};

function updateText(saved) {
  state['pageUrl'] = saved["lastBlocked"];
  const pageUrl = new URL(saved["lastBlocked"]);
  document.getElementById("dest-hostname").textContent = pageUrl.hostname;
  browser.storage.local.remove("lastBlocked");
}

function deactivateOnTab() {
  console.log("CLICKED");
  browser.storage.local.get('deactivatedOnTab').then(function(data) {
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    const currentTabId = browser.tabs.getCurrent().then(function(ct) {
      deactivatedOnTabs.push(ct.id);
      browser.storage.local.set({deactivatedOnTabs}).then(function() {
        window.location.href = state['pageUrl'];
      });
    });
  });
}

window.addEventListener('load', function(event) {
  browser.storage.local.get('lastBlocked').then(updateText);
  const button = document.getElementById("disable-button");
  button.onclick = deactivateOnTab;
});
