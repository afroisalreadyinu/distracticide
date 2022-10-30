"use strict";

function loadDistracticide(browser, window, document) {

  function updateText(theWindow) {
    const pageUrl = new URL(theWindow.location.href);
    const blocked = pageUrl.searchParams.get("blocked");
    if (!blocked) return;
    const blockedUrl = new URL(blocked);
    document.getElementById("dest-hostname").textContent = blockedUrl.hostname;
    window.state['blockedUrl'] = blocked;
  }

  function appendToHostnames(hostname) {
    const hostnameList = document.getElementById("hostname-list");
    const li = document.createElement('li');
    li.innerHTML = `<span class='hostname'>${hostname}</span> <a href="#" class="remove-link">Remove</a>`;
    hostnameList.append(li);
  }

  function appendToActivities(activity) {
    const activityList = document.getElementById("activity-list");
    const li = document.createElement('li');
    li.innerHTML = `<span class='activity'>${activity}</span> <a href="#" class="remove-link">Done</a>`;
    activityList.append(li);
  }


  function showHostnames() {
    browser.storage.sync.get('blockedHosts').then((values) => {
      const hostnames = values['blockedHosts'] || [];
      for (const hostname of hostnames) {
        appendToHostnames(hostname);
      }
    });
  }

  function showActivities() {
    browser.storage.sync.get('activities').then((values) => {
      const activities = values['activities'] || [];
      for (const activity of activities) {
        appendToActivities(activity);
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

  function removeActivity(event) {
    if (!event.target.matches('.remove-link')) return false;
    const activity = event.target.parentElement.getElementsByClassName('activity')[0].innerHTML;
    browser.storage.sync.get('activities').then((values) => {
      let activities = values['activities'] || [];
      if (activities.includes(activity)) {
        activities = activities.filter(act => act !== activity);
        browser.storage.sync.set({activities}).then(() => {
          event.target.parentElement.remove();
        });
      };
    });
    return false;
  }


  async function deactivateOnTab() {
    browser.storage.local.get('deactivatedOnTabs').then(function(data) {
      let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
      const currentTabId = browser.tabs.getCurrent().then(function(ct) {
        deactivatedOnTabs.push(ct.id);
        browser.storage.local.set({deactivatedOnTabs}).then(function() {
          window.location.href = window.state['blockedUrl'];
        });
      });
    });
  }

  function addHostname(event) {
    const form = event.target.closest('form');
    const hostnameField = form.getElementsByTagName("input")[0];
    const errorField = form.getElementsByClassName("form-error")[0];
    const newHostname = hostnameField.value;
    if (newHostname.trim() === "") {
      errorField.innerHTML = "Provide non-empty host";
      return false;
    }
    browser.storage.sync.get('blockedHosts').then((values) => {
      let blockedHosts = values['blockedHosts'] || [];
      if (!blockedHosts.includes(newHostname)) {
        blockedHosts.push(newHostname);
        browser.storage.sync.set({blockedHosts}).then(() => {
          hostnameField.value = "";
          errorField.innerHTML = "";
          appendToHostnames(newHostname);
        });
      } else {
        errorField.innerHTML = "Host already in list";
      };
    });
    return false;
  }

  const LINK_RE = /(https\:\/\/[0-9a-zA-Z.\/]*)/g;
  const LINK_TEXT_LENGTH = 15;

  function processLinks(activity) {
    var retval = activity;
    const links = activity.match(LINK_RE) || [];
    links.forEach((link) => {
      const linkText = link.length > LINK_TEXT_LENGTH ? link.slice(0, LINK_TEXT_LENGTH) + "..." : link;
      retval = retval.replace(link, `<a class="extlink" href="${link}">${linkText}</a>`);
    });
    return retval;
  }


  function addActivity(event) {
    const form = event.target.closest('form');
    const activityField = form.getElementsByTagName("input")[0];
    const errorField = form.getElementsByClassName("form-error")[0];
    const newActivity = processLinks(activityField.value);
    if (newActivity.trim() === "") {
      errorField.innerHTML = "Provide non-empty activity";
      return false;
    }
    browser.storage.sync.get('activities').then((values) => {
      let activities = values['activities'] || [];
      if (!activities.includes(newActivity)) {
        activities.push(newActivity);
        browser.storage.sync.set({activities}).then(() => {
          activityField.value = "";
          errorField.innerHTML = "";
          appendToActivities(newActivity);
        });
      };
    });
    return false;
  }

  window.addEventListener('load', function(event) {
    window.state = {};
    updateText(window);
    showHostnames();
    showActivities();
    const button = document.getElementById("disable-button");
    if (button) {
      console.log(button)
      button.onclick = deactivateOnTab;
    }
    const addHostnameButton = document.getElementById("add-hostname-button");
    addHostnameButton.onclick = addHostname;

    const addActivityButton = document.getElementById("add-activity-button");
    addActivityButton.onclick = addActivity;

    const hostnameList = document.getElementById("hostname-list");
    hostnameList.addEventListener('click', removeHostname);

    const activityList = document.getElementById("activity-list");
    activityList.addEventListener('click', removeActivity);
  });

};

if (typeof browser !== "undefined") loadDistracticide(browser, window, document);
