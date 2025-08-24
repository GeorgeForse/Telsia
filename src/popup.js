  document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM Elements ---
  const toggle = document.getElementById("enabled-toggle");
  const opacitySlider = document.getElementById("opacity-slider");
  const colorPicker = document.getElementById("color-picker");
  const toggleWarning = document.getElementById("toggle-warning");
  const presetsContainer = document.getElementById("presets-container");

  // --- State ---
  let saveTimeout = null;
  let toggleTimestamps = [];

  // --- Data ---
  const presets = [
    {
      group: "Warm & Calming Tones",
      colors: [
        { name: "Soft Rose", color: "#FADADD", opacity: 0.25 },
        { name: "Warm Peach", color: "#FFDAB9", opacity: 0.25 },
        { name: "Golden Yellow", color: "#FFFACD", opacity: 0.25 },
      ],
    },
    {
      group: "Cool & Focused Tones",
      colors: [
        { name: "Sky Blue", color: "#ADD8E6", opacity: 0.25 },
        { name: "Aqua Marine", color: "#AFEEEE", opacity: 0.25 },
        { name: "Seafoam Green", color: "#B2D8B2", opacity: 0.25 },
      ],
    },
    {
      group: "Neutral & Muted Tones",
      colors: [
        { name: "Calm Lavender", color: "#E6E6FA", opacity: 0.25 },
        { name: "Cool Grey", color: "#D3D3D3", opacity: 0.3 },
      ],
    },
  ];

  // --- Helper Functions ---

  // Function to determine if a hex color is dark or light
  const isColorDark = (hexColor) => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    // Perceived luminance (ITU-R BT.709)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.5; // Adjust threshold as needed
  };

  const updateUiState = () => {
    const isEnabled = toggle.checked;
    opacitySlider.disabled = !isEnabled;
    colorPicker.disabled = !isEnabled;
    presetsContainer.style.opacity = isEnabled ? 1 : 0.5;
    presetsContainer.style.pointerEvents = isEnabled ? "auto" : "none";
  };

  const saveSettings = async () => {
    await chrome.storage.sync.set({
      enabled: toggle.checked,
      color: colorPicker.value,
      opacity: parseFloat(opacitySlider.value),
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
      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          toggleWarning.innerHTML = `Too many toggles!<br>Re-enabling in ${countdown}s...`;
        } else {
          clearInterval(interval);
          toggle.disabled = false;
          toggleWarning.innerHTML = "";
          toggleTimestamps = [];
        }
      }, 1000);
    }
  };

  const populatePresets = () => {
    presets.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "preset-group";
      groupEl.innerHTML = `<h3>${group.group}</h3>`;

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "preset-buttons";

      group.colors.forEach((preset) => {
        const button = document.createElement("button");
        button.className = "preset-button";
        button.dataset.color = preset.color;
        button.dataset.opacity = preset.opacity;
        // Apply background color directly to the button
        button.style.backgroundColor = preset.color;
        // Set text color based on background luminance for readability
        button.style.color = isColorDark(preset.color) ? "#fff" : "#333";
        button.innerHTML = `<span>${preset.name}</span>`;
        buttonsContainer.appendChild(button);
      });

      groupEl.appendChild(buttonsContainer);
      presetsContainer.appendChild(groupEl);
    });
  };

  // --- Initialization ---

  // Load initial settings from storage.
  const initialSettings = await chrome.storage.sync.get({
    enabled: false,
    color: "#7f7f7f",
    opacity: 0.3,
  });

  // Set the initial state of the UI controls.
  toggle.checked = initialSettings.enabled;
  opacitySlider.value = initialSettings.opacity;
  colorPicker.value = initialSettings.color;

  // Create the preset buttons.
  populatePresets();

  // Set the initial enabled/disabled state of the controls.
  updateUiState();

  // --- Event Listeners ---

  toggle.addEventListener("change", () => {
    updateUiState();
    saveSettings();
    handleToggleSpam();
  });

  colorPicker.addEventListener("input", throttledSave);
  opacitySlider.addEventListener("input", throttledSave);

  presetsContainer.addEventListener("click", (e) => {
    const button = e.target.closest(".preset-button");
    if (button) {
      const { color, opacity } = button.dataset;
      colorPicker.value = color;
      opacitySlider.value = opacity;
      saveSettings(); // Save immediately on preset click
    }
  });
});