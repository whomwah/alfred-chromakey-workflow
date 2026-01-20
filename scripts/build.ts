/**
 * Build script for ChromaKey Palette Alfred Workflow
 *
 * Responsibilities:
 * 1. Bundle TypeScript source to JavaScript using Bun
 * 2. Read workflow.json metadata
 * 3. Inject compiled JS and metadata into info.plist
 */

import { $ } from "bun";

const PLIST_PATH = "info.plist";
const WORKFLOW_JSON_PATH = "workflow.json";
const SOURCE_PATH = "src/index.ts";

interface WorkflowConfig {
  name: string;
  bundleid: string;
  description: string;
  createdby: string;
  webaddress: string;
  category: string;
  readme: string;
}

/**
 * XML-escape a string for safe embedding in plist
 */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Replace a plist key's string value using regex
 */
function replacePlistValue(
  plist: string,
  key: string,
  value: string,
): string {
  // Match: <key>keyName</key> followed by whitespace and <string>...</string>
  // The [\s\S]*? handles multiline content in the string tag
  const regex = new RegExp(
    `(<key>${key}</key>\\s*<string>)[\\s\\S]*?(</string>)`,
    "g",
  );
  return plist.replace(regex, `$1${value}$2`);
}

async function build() {
  console.log("Building ChromaKey Palette workflow...\n");

  // 1. Bundle TypeScript to JavaScript
  console.log("1. Bundling TypeScript...");
  const buildResult = await Bun.build({
    entrypoints: [SOURCE_PATH],
    target: "browser", // Closest to JXA environment
    minify: false, // Keep readable for debugging
  });

  if (!buildResult.success) {
    console.error("Build failed:");
    for (const log of buildResult.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  const compiledJs = await buildResult.outputs[0].text();
  console.log(`   Compiled ${SOURCE_PATH} (${compiledJs.length} bytes)`);

  // 2. Read workflow.json
  console.log("2. Reading workflow.json...");
  const workflowConfig: WorkflowConfig = await Bun.file(
    WORKFLOW_JSON_PATH,
  ).json();
  console.log(`   Loaded metadata for "${workflowConfig.name}"`);

  // 3. Read and update info.plist
  console.log("3. Updating info.plist...");
  let plist = await Bun.file(PLIST_PATH).text();

  // Inject the compiled JavaScript (XML-escaped)
  const escapedJs = xmlEscape(compiledJs);
  plist = replacePlistValue(plist, "script", escapedJs);

  // Inject metadata from workflow.json
  plist = replacePlistValue(plist, "name", xmlEscape(workflowConfig.name));
  plist = replacePlistValue(plist, "bundleid", xmlEscape(workflowConfig.bundleid));
  plist = replacePlistValue(plist, "description", xmlEscape(workflowConfig.description));
  plist = replacePlistValue(plist, "createdby", xmlEscape(workflowConfig.createdby));
  plist = replacePlistValue(plist, "webaddress", xmlEscape(workflowConfig.webaddress));
  plist = replacePlistValue(plist, "category", xmlEscape(workflowConfig.category));
  plist = replacePlistValue(plist, "readme", xmlEscape(workflowConfig.readme));

  // 4. Write updated plist
  await Bun.write(PLIST_PATH, plist);
  console.log("   Updated info.plist");

  console.log("\nBuild complete!");
}

build().catch((err) => {
  console.error("Build error:", err);
  process.exit(1);
});
