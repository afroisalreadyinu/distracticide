"use strict";

function loadDistracticide(browser, window, document) {

  function updateText(theWindow) {
    const pageUrl = new URL(theWindow.location.href);
    const blocked = pageUrl.searchParams.get("blocked");
    if (!blocked) return;
    const blockedUrl = new URL(blocked);
    document.querySelector("#dest-hostname").textContent = blockedUrl.hostname;
    window.state['blockedUrl'] = blocked;
  }

  function appendToHostnames(hostname) {
    const hostnameList = document.querySelector("#hostname-list");
    const li = document.createElement('li');
    let span = document.createElement("span");
    span.className = "hostname";
    span.innerText = hostname;
    let link = document.createElement("a");
    link.className = "remove-link";
    link.href = "#";
    link.innerText = "Remove";
    li.appendChild(span);
    li.appendChild(link);
    hostnameList.append(li);
  }

  function appendToActivities(activity) {
    const activityList = document.querySelector("#activity-list");
    const li = document.createElement('li');
    li.innerHTML = `<span class="activity">${activity}</span> <a href="#" class="remove-link">Remove</a>`;
    activityList.append(li);
  }


  async function showHostnames() {
    let values = await browser.storage.sync.get('blockedHosts');
    const hostnames = values['blockedHosts'] || [];
    for (const hostname of hostnames) {
      appendToHostnames(hostname);
    }
  }

  async function showActivities() {
    browser.storage.sync.get('activities').then((values) => {
      const activities = values['activities'] || [];
      for (const activity of activities) {
        appendToActivities(activity);
      }
    });
  }

  async function removeHostname(event) {
    event.preventDefault();
    if (!event.target.matches('.remove-link')) return;
    const hostname = event.target.parentElement.getElementsByClassName('hostname')[0].innerHTML;
    let values = await browser.storage.sync.get('blockedHosts');
    let hostnames = values['blockedHosts'] || [];
    if (hostnames.includes(hostname)) {
      hostnames = hostnames.filter(hn => hn !== hostname);
      await browser.storage.sync.set({blockedHosts: hostnames});
      event.target.parentElement.remove();
    };
  }

  function removeActivity(event) {
    event.preventDefault();
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
    let data = await browser.storage.local.get('deactivatedOnTabs');
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    const ct = await browser.tabs.getCurrent();
    deactivatedOnTabs.push(ct.id);
    await browser.storage.local.set({deactivatedOnTabs});
    window.location.href = window.state['blockedUrl'];
  }

  async function addHostname(event) {
    event.preventDefault();
    const form = event.target.closest('form');
    const hostnameField = form.getElementsByTagName("input")[0];
    const errorField = form.getElementsByClassName("form-error")[0];
    const newHostname = hostnameField.value;
    if (newHostname.trim() === "") {
      errorField.innerHTML = "Provide non-empty host";
      return false;
    }
    let values = await browser.storage.sync.get('blockedHosts');
    let blockedHosts = values['blockedHosts'] || [];
    if (!blockedHosts.includes(newHostname)) {
      blockedHosts.push(newHostname);
      await browser.storage.sync.set({blockedHosts});
      hostnameField.value = "";
      errorField.innerHTML = "";
      appendToHostnames(newHostname);
      toggleInput(document.querySelector(".add-hostname"));
    } else {
      errorField.innerHTML = "Host already in list";
    };
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
    event.preventDefault();
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
          toggleInput(document.querySelector(".add-activity"));
        });
      };
    });
    return false;
  }

  function toggleInput(containerDiv) {
    let link = containerDiv.querySelector("a");
    link.style.display = link.style.display == "none" ? "inline" : "none";
    let form = containerDiv.querySelector("form");
    form.style.display = link.style.display == "none" ? "block" : "none";
  }

  window.addEventListener('load', async function(event) {
    /* Register even handlers for links and form submits and load blocked
     * hostnames and activities from storage.
     */
    window.state = {};
    updateText(window);
    await showActivities();
    await showHostnames();
    const button = document.querySelector("#disable-button");
    if (button) {
      button.onclick = deactivateOnTab;
    }
    let addActivityForm = document.querySelector(".add-activity form");
    if (addActivityForm) {
        addActivityForm.addEventListener("submit", addActivity);
    };

    let addActivityButton = document.querySelector(".add-activity a");
    if (addActivityButton) {
      addActivityButton.addEventListener('click', (event) => {
      event.preventDefault();
      toggleInput(document.querySelector(".add-activity"));
        });
    };

    let addActivityInput = document.querySelector(".add-activity input");
    if (addActivityInput) {
        addActivityInput.addEventListener('keyup', (event) => {
          if (event.key === "Escape") {
            event.target.value = "";
            toggleInput(document.querySelector(".add-activity"));
          }
        });
    };

    document.querySelector(".add-hostname form").addEventListener("submit", addHostname);

    let addHostnameButton = document.querySelector(".add-hostname a");
    if (addHostnameButton) {
        addHostnameButton.addEventListener('click', (event) => {
          event.preventDefault();
          toggleInput(document.querySelector(".add-hostname"));
        });
    };
    document.querySelector(".add-hostname input").addEventListener('keyup', (event) => {
      if (event.key === "Escape") {
        event.target.value = "";
        toggleInput(document.querySelector(".add-hostname"));
      }
    });


    const hostnameList = document.querySelector("#hostname-list");
    hostnameList.addEventListener('click', removeHostname);

    const activityList = document.querySelector("#activity-list");
    if (activityList) {
      activityList.addEventListener('click', removeActivity);
    };
  });

};

if (typeof browser !== "undefined") loadDistracticide(browser, window, document);
