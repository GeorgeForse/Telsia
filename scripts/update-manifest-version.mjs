import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// This script reads a manifest file, updates its version, and writes it back.
// It's used by the npm build scripts to ensure the version from package.json
// is correctly injected into the browser-specific manifests.

async function main() {
  // Get manifest path and version from command-line arguments
  const [manifestPath] = process.argv.slice(2);
  const version = process.env.npm_package_version;

  if (!manifestPath || !version) {
    console.error(
      "Usage: node scripts/update-manifest-version.mjs <manifest_path>",
    );
    console.error(
      "Ensure 'npm_package_version' environment variable is set (usually by running via npm).",
    );
    process.exit(1);
  }

  try {
    const absoluteManifestPath = resolve(manifestPath);
    const manifestContent = await readFile(absoluteManifestPath, "utf8");
    const manifest = JSON.parse(manifestContent);
    manifest.version = version;
    await writeFile(
      absoluteManifestPath,
      JSON.stringify(manifest, null, 2),
      "utf8",
    );
    console.log(`Updated version in ${absoluteManifestPath} to ${version}`);
  } catch (error) {
    console.error(
      `Error updating manifest version for ${manifestPath}:`,
      error,
    );
    process.exit(1);
  }
}

main().catch(console.error);
