chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install" || details.reason === "update") {
    // Set initial default settings for the extension
    await chrome.storage.sync.set({
      enabled: false,
      color: "#FADADD",
      opacity: 0.25,
    });

    // Onboarding logic
    if (details.reason === "install") {
      let showOnboarding = true;
      try {
        // Check for enterprise policy to disable onboarding.
        const managedConfig =
          await chrome.storage.managed.get("disableOnboarding");
        // Explicitly check for boolean true or string "true" to correctly handle
        // the "false" string from ADMX policies.
        if (
          managedConfig &&
          (managedConfig.disableOnboarding === true ||
            managedConfig.disableOnboarding === "true")
        ) {
          showOnboarding = false;
        }
      } catch (e) {
        console.warn(
          "Telsia: Could not read managed storage to check for onboarding policy.",
          e,
        );
      }

      if (showOnboarding) {
        chrome.tabs.create({ url: "onboarding.html" });
      }
    }

    // Inject content script into existing tabs
    const tabs = await chrome.tabs.query({
      url: ["http://*/*", "https://*/*"],
    });
    for (const tab of tabs) {
      // The query above filters for valid URLs, so we just need to ensure
      // the tab has an ID before we try to inject the script.
      if (tab.id) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          })
          .catch((err) =>
            console.error(
              `Telsia: Failed to inject content script into tab ${tab.id} (${tab.url}): ${err.message}`,
            ),
          );
      }
    }
  }
});
