"use strict";

interface DistracticideState {
    blocked_url: string | null;
}

let distracticide_state: DistracticideState = { blocked_url: null };

function cleanHostname(url: string) {
    let parsedUrl = null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
	parsedUrl = new URL(url)
    } else {
	parsedUrl = new URL(`https://${url}`);
    }
    return parsedUrl.hostname;
};

function updatePage() {
    const pageUrl = new URL(window.location.href);
    const blocked = pageUrl.searchParams.get("blocked");
    if (!blocked) return;
    const blockedUrl = new URL(blocked);
    document.querySelector("#dest-hostname")!.textContent = blockedUrl.hostname;
    distracticide_state.blocked_url = blocked;
    const hide_button_arg = pageUrl.searchParams.get("hideButton");
    if (hide_button_arg === null) return;
    const hide_button = parseInt(hide_button_arg);
    if (hide_button == 0) {
	const button = document.querySelector(".bail-out");
	if (button instanceof HTMLElement) {
	    button.style.display = "flex";
	}
    };
}

function appendToHostnames(hostname: string) {
    const hostnameList = document.querySelector("#hostname-list");
    if (hostnameList instanceof HTMLUListElement) {
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
}

function appendToActivities(activity: string) {
    const activityList = document.querySelector("#activity-list");
    if (activityList instanceof HTMLUListElement) {
	const li = document.createElement('li');
	li.innerHTML = `<span class="activity">${activity}</span> <a href="#" class="remove-link">Remove</a>`;
	activityList.append(li);
    }
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

async function removeHostname(_event: Event) {
    const event = _event as PointerEvent;
    event.preventDefault();
    const target = event.target as Element;
    if (!target.matches('.remove-link')) return;
    const hostname = target.parentElement!.getElementsByClassName('hostname')[0].innerHTML;
    if (hostname === null) return;
    let values = await browser.storage.sync.get('blockedHosts');
    let hostnames = values['blockedHosts'] || [];
    if (hostnames.includes(hostname)) {
	hostnames = hostnames.filter((hn: string) => hn !== hostname);
	await browser.storage.sync.set({blockedHosts: hostnames});
	target.parentElement!.remove();
    };
}

function removeActivity(_event: Event) {
    const event = _event as PointerEvent;
    event.preventDefault();
    const target = event.target as Element;
    if (!target.matches('.remove-link')) return false;
    const activity = target.parentElement!.getElementsByClassName('activity')[0].innerHTML;
    if (!activity) return;
    browser.storage.sync.get('activities').then((values) => {
	let activities = values['activities'] || [];
	if (activities.includes(activity)) {
            activities = activities.filter((act: string) => act !== activity);
            browser.storage.sync.set({activities}).then(() => {
		target.parentElement!.remove();
            });
	};
    });
    return false;
}

async function deactivateOnTab() {
    let data = await browser.storage.local.get('deactivatedOnTabs');
    let deactivatedOnTabs = data['deactivatedOnTabs'] || [];
    const ct = await browser.tabs.getCurrent();
    if (!ct) return;
    deactivatedOnTabs.push(ct.id);
    await browser.storage.local.set({deactivatedOnTabs});
    if (distracticide_state.blocked_url !== null) {
	window.location.href = distracticide_state.blocked_url;
    }
}

async function addHostname(_event: Event) {
    const event = _event as SubmitEvent;
    event.preventDefault();
    const target = event.target as Element;
    const form = target.closest('form');
    if (!form) return;
    const hostnameField = form.getElementsByTagName("input")[0];
    const errorField = form.getElementsByClassName("form-error")[0];
    let newHostname = "";
    try {
	newHostname = cleanHostname(hostnameField.value);
    } catch (e) {
	errorField.innerHTML = "Please provide a valid URL";
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

function processLinks(activity: string) {
    var retval = activity;
    const links = activity.match(LINK_RE) || [];
    links.forEach((link) => {
	const linkText = link.length > LINK_TEXT_LENGTH ? link.slice(0, LINK_TEXT_LENGTH) + "..." : link;
	retval = retval.replace(link, `<a class="extlink" href="${link}">${linkText}</a>`);
    });
    return retval;
}


function addActivity(_event: Event) {
    const event = _event as SubmitEvent;
    event.preventDefault();
    const target = event.target as Element;
    const form = target.closest('form');
    if (!form) return;
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

function toggleInput(containerDiv: Element | null) {
    if (!containerDiv) return;
    if (containerDiv.classList.contains("options")) return;
    let link = containerDiv.querySelector("a");
    if (!link) return;
    link.style.display = link.style.display == "none" ? "inline" : "none";
    let form = containerDiv.querySelector("form");
    if (!form) return;
    form.style.display = link.style.display == "none" ? "block" : "none";
}

async function toggleHideGoThere(_event: Event) {
    const event = _event as UIEvent;
    const target = event.target as HTMLInputElement;
    if (!target) return;
    const hideButton = target.checked;
    await browser.storage.sync.set({hideGoThereButton: hideButton});
}

window.addEventListener('load', async function(event) {
    /* Register even handlers for links and form submits and load blocked
     * hostnames and activities from storage.
     */
    updatePage();
    await showActivities();
    await showHostnames();
    const button: Element | HTMLButtonElement | null = document.querySelector("#disable-button");
    if (button instanceof HTMLButtonElement) {
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
        addActivityInput.addEventListener('keyup', (event: Event) => {
	    const key_event = event as KeyboardEvent;
            if (key_event.key === "Escape") {
		let target = event.target as HTMLInputElement;
		target.value = "";
		toggleInput(document.querySelector(".add-activity"));
            }
        });
    };

    document.querySelector(".add-hostname form")!.addEventListener("submit", addHostname);

    let addHostnameButton = document.querySelector(".add-hostname a");
    if (addHostnameButton) {
        addHostnameButton.addEventListener('click', (event) => {
            event.preventDefault();
            toggleInput(document.querySelector(".add-hostname"));
        });
    };
    document.querySelector(".add-hostname input")!.addEventListener('keyup', (event: Event) => {
	const key_event = event as KeyboardEvent;
	if (key_event.key === "Escape") {
	    let target = event.target as HTMLInputElement;
            target.value = "";
            toggleInput(document.querySelector(".add-hostname"));
	}
    });


    const hostnameList = document.querySelector("#hostname-list");
    hostnameList!.addEventListener('click', removeHostname);

    const activityList = document.querySelector("#activity-list");
    if (activityList) {
	activityList.addEventListener('click', removeActivity);
    };

    const hideGoThereButton = document.querySelector("#hide-gothere");
    if (hideGoThereButton) {
	hideGoThereButton.addEventListener('change', toggleHideGoThere);
    };

});
