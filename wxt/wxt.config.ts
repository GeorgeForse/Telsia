import { defineConfig, version } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    name: "Telsia: Eye Strain Reduction",
    short_name: "Telsia",
    homepage_url: "https://telsia.org",
    description:
      "Reduces eye strain with a custom colour overlay. Improves readability for users with Scotopic Sensitivity Syndrome, Dyslexia, Photophobia, Visual Stress, and other conditions that affect reading on a screen.",
    version: "1.2.0",
    permissions: ["storage", "scripting"],
    browser_specific_settings:
      browser === "firefox"
        ? {
            gecko: {
              id: "telsia@telsia.org",
              strict_min_version: "112.0",
              data_collection_permissions: {
                required: ["none"],
              },
            },
          }
        : undefined,
    // This is for Chrome/Edge to define the enterprise policy schema.
    // It's a top-level manifest key.
    storage:
      browser === "chrome"
        ? {
            managed_schema: "schema.json",
          }
        : undefined,
  }),
});
