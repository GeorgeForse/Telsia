chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Set initial default settings for the extension
    await chrome.storage.sync.set({
      enabled: false, // Default to false as per user's request
      color: "#7f7f7f", // Default color from popup.js
      opacity: 0.3      // Default opacity from popup.js
    });

    // Onboarding logic
    const managedConfig = await chrome.storage.managed.get('disableOnboarding');
    if (!managedConfig.disableOnboarding) {
      chrome.tabs.create({ url: 'onboarding.html' });
    }

    // Inject content script into existing tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).catch(err => console.error(`Telsia: Failed to inject content script into tab ${tab.id} (${tab.url}): ${err.message}`));
        }
      });
    });
  }
});