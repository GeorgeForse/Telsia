import { defaultSettings, updateOverlayDOM } from "../utils/overlay";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_start",
  main() {
    async function updateOverlay() {
      const userSettings = await browser.storage.sync.get(defaultSettings);
      updateOverlayDOM(userSettings);
    }

    // --- Event Listeners ---

    // Update the overlay when settings are changed in the popup
    browser.storage.sync.onChanged.addListener(updateOverlay);

    // Running at document_start means the DOM may not be ready.
    // We must wait for it before trying to add the overlay.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateOverlay);
    } else {
      updateOverlay();
    }
  },
});
