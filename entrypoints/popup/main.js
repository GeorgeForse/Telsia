import "./style.css";
import "@melloware/coloris/dist/coloris.css";
import Coloris from "@melloware/coloris";

Coloris.init();
Coloris({ el: "#colour-picker" });

document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM Elements ---
  const toggle = document.getElementById("enabled-toggle");
  const opacitySlider = document.getElementById("opacity-slider");
  const colorPicker = document.getElementById("colour-picker");
  const blendModeSelect = document.getElementById("blend-mode");
  const toggleWarning = document.getElementById("toggle-warning");
  const presetsContainer = document.getElementById("presets-container");
  const helpIcon = document.getElementById("help-icon");

  // --- State ---
  let saveTimeout = null;
  let toggleTimestamps = [];

  // --- Data ---
  const presets = [
    { name: "Soft Rose", color: "#fadadd", opacity: 0.25 },
    { name: "Warm Peach", color: "#ffdab9", opacity: 0.25 },
    { name: "Golden Yellow", color: "#fffacd", opacity: 0.25 },
    { name: "Sky Blue", color: "#add8e6", opacity: 0.25 },
    { name: "Aqua Marine", color: "#afeeee", opacity: 0.25 },
    { name: "Seafoam Green", color: "#b2d8b2", opacity: 0.25 },
    { name: "Calm Lavender", color: "#e6e6fa", opacity: 0.25 },
    { name: "Cool Grey", color: "#d3d3d3", opacity: 0.3 },
  ];

  // --- Helper Functions ---

  const isColorDark = (hexColor) => {
    try {
      const r = parseInt(hexColor.substring(1, 3), 16);
      const g = parseInt(hexColor.substring(3, 5), 16);
      const b = parseInt(hexColor.substring(5, 7), 16);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return luminance < 0.5;
    } catch (e) {
      return false;
    }
  };

  const updateUiState = () => {
    const isEnabled = toggle.checked;
    opacitySlider.disabled = !isEnabled;
    colorPicker.disabled = !isEnabled;
    blendModeSelect.disabled = !isEnabled;
    presetsContainer.style.opacity = isEnabled ? 1 : 0.5;
    presetsContainer.style.pointerEvents = isEnabled ? "auto" : "none";
  };

  const saveSettings = async () => {
    await browser.storage.sync.set({
      enabled: toggle.checked,
      color: colorPicker.value,
      opacity: parseFloat(opacitySlider.value),
      mixBlendMode: blendModeSelect.value,
    });
  };

  const throttledSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSettings, 500);
  };

  const handleToggleSpam = () => {
    const now = Date.now();
    toggleTimestamps = toggleTimestamps.filter((ts) => now - ts < 5000);
    toggleTimestamps.push(now);
    if (toggleTimestamps.length > 10) {
      toggle.disabled = true;
      let countdown = 10;
      toggleWarning.innerHTML = `Too many toggles!<br>Re-enabling in ${countdown}s...`;
      // Use textContent with pre-line to show newline safely
      toggleWarning.style.whiteSpace = "pre-line";
      toggleWarning.textContent = `Too many toggles!\nRe-enabling in ${countdown}s...`;
      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          toggleWarning.textContent = `Too many toggles!\nRe-enabling in ${countdown}s...`;
        } else {
          clearInterval(interval);
          toggle.disabled = false;
          toggleWarning.textContent = "";
          toggleTimestamps = [];
        }
      }, 1000);
    }
  };

  const populatePresets = () => {
    // Clear previous contents safely
    presetsContainer.textContent = "";
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "preset-buttons";

    presets.forEach((preset) => {
      const button = document.createElement("button");
      button.className = "preset-button";
      button.dataset.color = preset.color;
      button.dataset.opacity = preset.opacity;
      // Apply background color directly to the button (no transparency on the button)
      button.style.backgroundColor = preset.color;
      // Set text color based on background luminance for readability
      button.style.color = isColorDark(preset.color) ? "#fff" : "#333";
      const nameSpan = document.createElement("span");
      nameSpan.className = "preset-name";
      nameSpan.textContent = preset.name;
      button.appendChild(nameSpan);
      buttonsContainer.appendChild(button);
    });

    presetsContainer.appendChild(buttonsContainer);
  };

  // --- Initialization ---
  const initialSettings = await browser.storage.sync.get({
    enabled: false,
    color: "#7f7f7f",
    opacity: 0.3,
    mixBlendMode: "normal",
  });

  toggle.checked = initialSettings.enabled;
  opacitySlider.value = initialSettings.opacity;
  colorPicker.value = initialSettings.color;
  blendModeSelect.value = initialSettings.mixBlendMode || "normal";

  // Ensure Coloris wrapper preview uses the initial value (some listeners run earlier)
  try {
    // Update wrapper color if Coloris wrapped the input
    const wrapper = colorPicker.parentElement;
    if (
      wrapper &&
      wrapper.classList &&
      wrapper.classList.contains("clr-field")
    ) {
      wrapper.style.color = colorPicker.value;
    }
    // Notify Coloris/listeners about the initial value
    colorPicker.dispatchEvent(new Event("input", { bubbles: true }));
    colorPicker.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (err) {
    console.warn("Error setting initial Coloris preview:", err);
  }

  populatePresets();
  updateUiState();

  helpIcon.addEventListener("click", () => {
    const url =
      typeof browser !== "undefined" &&
      browser.runtime &&
      browser.runtime.getURL
        ? browser.runtime.getURL("onboarding.html")
        : "onboarding.html";
    try {
      if (
        typeof browser !== "undefined" &&
        browser.tabs &&
        browser.tabs.create
      ) {
        browser.tabs.create({ url });
      } else {
        window.open(url, "_blank");
      }
    } catch (e) {
      window.open(url, "_blank");
    }
  });

  toggle.addEventListener("change", () => {
    updateUiState();
    saveSettings();
    handleToggleSpam();
  });

  colorPicker.addEventListener("input", throttledSave);
  opacitySlider.addEventListener("input", throttledSave);
  blendModeSelect.addEventListener("change", saveSettings);

  presetsContainer.addEventListener("click", (e) => {
    const button = e.target.closest(".preset-button");
    if (button) {
      const { color, opacity } = button.dataset;
      colorPicker.value = color;
      opacitySlider.value = opacity;
      // Notify listeners and update Coloris wrapper preview (if present)
      try {
        colorPicker.dispatchEvent(new Event("input", { bubbles: true }));
        colorPicker.dispatchEvent(new Event("change", { bubbles: true }));
        const wrapper = colorPicker.parentElement;
        if (wrapper && wrapper.classList.contains("clr-field")) {
          wrapper.style.color = color;
        }
      } catch (err) {
        console.warn("Error updating Coloris preview:", err);
      }

      saveSettings(); // Save immediately on preset click
    }
  });

  // Initialize Coloris (library is loaded from popup.html).
  // Set parent to `body` and force `inline: false` so the picker floats above the popup UI.
  if (typeof Coloris !== "undefined") {
    try {
      Coloris({
        el: "#colour-picker",
        parent: "body",
        inline: false,
        wrap: false,
        alpha: false,
        forceAlpha: false,
        themeMode: "auto",
      });
    } catch (e) {
      console.warn("Coloris init failed:", e);
    }
  }
});
