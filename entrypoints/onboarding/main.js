// Onboarding page entrypoint
import { defaultSettings, updateOverlayDOM } from "../../utils/overlay";

async function updateOverlay() {
  const userSettings = await browser.storage.sync.get(defaultSettings);
  updateOverlayDOM(userSettings);
}

browser.storage.sync.onChanged.addListener(updateOverlay);

updateOverlay();
