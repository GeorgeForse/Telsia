const defaultSettings = { enabled: false, color: "#FADADD", opacity: 0.25 };
const overlayId = "TelsiaOverlay";

async function updateOverlay() {
  let overlay = document.getElementById(overlayId);
  const userSettings = await chrome.storage.sync.get(defaultSettings);

  const settings = userSettings;

  if (settings.enabled) {
    if (!overlay) {
      // 1. CREATE THE OVERLAY IF IT DOESN'T EXIST
      overlay = document.createElement("div");
      overlay.id = overlayId;
      Object.assign(overlay.style, {
        position: "fixed",
        left: "0",
        right: "0",
        top: "0",
        bottom: "0",
        zIndex: "2147483647",
        pointerEvents: "none",
        // Add transition for smooth animation of color and opacity
        transition: "background-color 0.3s ease, opacity 0.3s ease",
      });
      document.body.appendChild(overlay);
    }

    // 2. APPLY SETTINGS (triggers animation)
    // We set the color directly and control the transparency via opacity
    // to ensure both properties can be transitioned independently.
    Object.assign(overlay.style, {
      backgroundColor: settings.color,
      opacity: settings.opacity,
    });
  } else if (overlay) {
    // 3. FADE OUT AND REMOVE THE OVERLAY IF DISABLED
    overlay.style.opacity = "0";
    // Wait for the fade-out transition to finish before removing the element
    setTimeout(() => {
      overlay.remove();
    }, 300); // Must match the transition duration
  }
}

// --- Event Listeners ---

// Update the overlay when settings are changed in the popup
chrome.storage.sync.onChanged.addListener(updateOverlay);

// Update the overlay when the script is first loaded (e.g., on a new page)
updateOverlay();
