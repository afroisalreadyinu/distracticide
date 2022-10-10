var state = {};

function updateText(saved) {
  const pageUrl = new URL(window.location.href);
  const blocked = pageUrl.searchParams.get("blocked");
  if (!blocked) return;
  const blockedUrl = new URL(blocked);
  document.getElementById("dest-hostname").textContent = blockedUrl.hostname;
  state['blockedUrl'] = blocked;
}

function deactivateOnTab() {
  browser.storage.local.get('deactivatedOnTabs').then(function(data) {
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    const currentTabId = browser.tabs.getCurrent().then(function(ct) {
      deactivatedOnTabs.push(ct.id);
      browser.storage.local.set({deactivatedOnTabs}).then(function() {
        window.location.href = state['blockedUrl'];
      });
    });
  });
}

// TODO form field validation
function addHostname(event) {
  const hostnameField = event.target.closest('form').getElementsByTagName("input")[0];
  const newHostname = hostnameField.value;
  browser.storage.sync.get('blockedHosts').then((values) => {
    let blockedHosts = values['blockedHosts'] || [];
    if (!blockedHosts.includes(newHostname)) {
      blockedHosts.push(newHostname);
      browser.storage.sync.set({blockedHosts}).then(() => {
        hostnameField.value = "";
      });
    };
  });
  return false;
}

window.addEventListener('load', function(event) {
  updateText();
  const button = document.getElementById("disable-button");
  button.onclick = deactivateOnTab;
  const addHostnameButton = document.getElementById("add-hostname-button");
  addHostnameButton.onclick = addHostname;
});
