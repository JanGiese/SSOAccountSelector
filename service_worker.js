// Constants
const MICROSOFT_LOGIN_URL = "https://login.microsoftonline.com/";

const STORAGE_KEY = 'tenants';

async function getCurrentTab() {
    const queryOptions = {active: true, lastFocusedWindow: true};
    const result = await chrome.tabs.query(queryOptions);
    return result[0];
}

async function retrieveEmailForUrlFromConfig(url) {
    const urlWithoutBase = url.replace(MICROSOFT_LOGIN_URL, '');
    const tenantId = urlWithoutBase.split('/')[0];
    if (!tenantId) {
        return;
    }

    const config = await chrome.storage.sync.get(STORAGE_KEY);
    if (!config.tenants) {
        return;
    }
    let tenant = config.tenants[tenantId];
    if (!tenant) {
        return;
    }
    return tenant.text;
}

function findAndClickAccount(email) {
    const element = document.querySelector(`[data-test-id="${email}"]`);
    if (element) {
        console.debug("Element for account found, clicking:", email);
        element.click();
    } else {
        console.warn("Element not found for email:", email);
    }
}

// Initialize storage if empty
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(STORAGE_KEY, (data) => {
        if (!data.tenants) {
            chrome.storage.sync.set({[STORAGE_KEY]: {}});
        }
    });
});

chrome.tabs.onUpdated.addListener(async (details) => {
    const currentTab = await getCurrentTab();
    const url = currentTab.url;
    if (!url.startsWith(MICROSOFT_LOGIN_URL)) {
        return;
    }
    const email = await retrieveEmailForUrlFromConfig(currentTab.url);
    if (!email) {
        return;
    }
    chrome.scripting.executeScript({
            target: {tabId: currentTab.id},
            func: findAndClickAccount,
            args: [email]
        });
});
