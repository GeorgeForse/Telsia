import { createWriteStream } from "node:fs";
import { readdir, readFile, mkdir } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

// This script uses the @zip.js/zip.js library to programmatically create
// the extension package. This approach offers more control than a simple
// CLI tool but requires more setup.

async function main() {
  // Get source directory and output file from command-line arguments
  const [sourceDir, outputBaseName] = process.argv.slice(2);
  const version = process.env.npm_package_version;

  if (!sourceDir || !outputBaseName || !version) {
    console.error(
      "Usage: node package.mjs <source_directory> <output_base_name>",
    );
    console.error(
      "Ensure 'npm_package_version' environment variable is set (usually by running via npm).",
    );
    process.exit(1);
  }

  const outputFile = `${outputBaseName}-v${version}.zip`;
  const absoluteSourceDir = resolve(sourceDir);
  const absoluteOutputFile = resolve(outputFile);

  // Ensure the output directory exists before trying to write to it.
  await mkdir(dirname(absoluteOutputFile), { recursive: true });

  console.log(
    `Zipping contents of ${absoluteSourceDir} to ${absoluteOutputFile}...`,
  );

  // 1. Create a ZipWriter to build the zip in memory (as a Blob).
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

  // 2. Recursively find and add all files from the source directory.
  async function addFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      const relativePath = relative(absoluteSourceDir, fullPath).replace(
        /\\/g,
        "/",
      );

      if (entry.isDirectory()) {
        await zipWriter.add(relativePath + "/", undefined); // Add directory entry
        await addFiles(fullPath); // Recurse into subdirectory
      } else {
        const fileData = await readFile(fullPath);
        await zipWriter.add(relativePath, new BlobReader(new Blob([fileData])));
      }
    }
  }

  await addFiles(absoluteSourceDir);

  // 3. Finalize the zip and stream the result to the output file.
  const zipBlob = await zipWriter.close();
  await pipeline(zipBlob.stream(), createWriteStream(absoluteOutputFile));

  console.log("Packaging complete!");
}

main().catch((err) => {
  console.error("Packaging failed:", err);
  process.exit(1);
});
