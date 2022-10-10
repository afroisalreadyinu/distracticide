var state = {};

function updateText() {
  const pageUrl = new URL(window.location.href);
  const blocked = pageUrl.searchParams.get("blocked");
  if (!blocked) return;
  const blockedUrl = new URL(blocked);
  document.getElementById("dest-hostname").textContent = blockedUrl.hostname;
  state['blockedUrl'] = blocked;
}

function appendToHostnames(hostname) {
  const hostnameList = document.getElementById("hostname-list");
  const li = document.createElement('li');
  li.innerHTML = `<span class='hostname'>${hostname}</span> <a href="#" class="remove-link">Remove</a>`;
  hostnameList.append(li);
}

function showHostnames() {
  browser.storage.sync.get('blockedHosts').then((values) => {
    const hostnames = values['blockedHosts'] || [];
    for (const hostname of hostnames) {
      appendToHostnames(hostname);
    }
  });
}
function removeHostname(event) {
  if (!event.target.matches('.remove-link')) return false;
  const hostname = event.target.parentElement.getElementsByClassName('hostname')[0].innerHTML;
  browser.storage.sync.get('blockedHosts').then((values) => {
    let hostnames = values['blockedHosts'] || [];
    if (hostnames.includes(hostname)) {
      hostnames = hostnames.filter(hn => hn !== hostname);
      browser.storage.sync.set({blockedHosts: hostnames}).then(() => {
        event.target.parentElement.remove();
      });
    };
  });
  return false;
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

function addHostname(event) {
  const hostnameField = event.target.closest('form').getElementsByTagName("input")[0];
  const newHostname = hostnameField.value;
  browser.storage.sync.get('blockedHosts').then((values) => {
    let blockedHosts = values['blockedHosts'] || [];
    if (!blockedHosts.includes(newHostname)) {
      blockedHosts.push(newHostname);
      browser.storage.sync.set({blockedHosts}).then(() => {
        hostnameField.value = "";
        appendToHostnames(newHostname);
      });
    };
  });
  return false;
}

window.addEventListener('load', function(event) {
  updateText();
  showHostnames();
  const button = document.getElementById("disable-button");
  if (button) {
    button.onclick = deactivateOnTab;
  }
  const addHostnameButton = document.getElementById("add-hostname-button");
  addHostnameButton.onclick = addHostname;
  const hostnameList = document.getElementById("hostname-list");
  hostnameList.addEventListener('click', removeHostname);
});
