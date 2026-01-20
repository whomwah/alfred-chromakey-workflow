/**
 * Build script for ChromaKey Palette Alfred Workflow
 *
 * Responsibilities:
 * 1. Transpile TypeScript source to JavaScript using Bun
 * 2. Read workflow.json metadata
 * 3. Inject compiled JS and metadata into info.plist
 */

const PLIST_PATH = "info.plist";
const WORKFLOW_JSON_PATH = "workflow.json";
const SOURCE_PATH = "src/index.ts";
const CHANGELOG_PATH = "CHANGELOG.md";

interface WorkflowConfig {
  name: string;
  bundleid: string;
  description: string;
  createdby: string;
  webaddress: string;
  category: string;
}

/**
 * Parse CHANGELOG.md and extract recent entries for the readme
 * Returns a formatted string with recent changelog content
 */
function parseChangelog(changelog: string): string {
  const lines = changelog.split("\n");
  const entries: string[] = [];
  let currentVersion = "";
  let inSection = false;
  let sectionContent: string[] = [];
  let versionsFound = 0;
  const maxVersions = 3; // Include up to 3 recent versions

  for (const line of lines) {
    // Match version headers like "## [1.0.0]" or "## [Unreleased]"
    const versionMatch = line.match(/^## \[([^\]]+)\]/);
    if (versionMatch) {
      // Save previous version's content
      if (currentVersion && sectionContent.length > 0) {
        entries.push(`${currentVersion}\n${sectionContent.join("\n")}`);
        versionsFound++;
        if (versionsFound >= maxVersions) break;
      }
      currentVersion = versionMatch[1];
      sectionContent = [];
      inSection = true;
      continue;
    }

    // Skip the main header and preamble
    if (line.startsWith("# ") || line.includes("Keep a Changelog")) {
      continue;
    }

    // Collect content under a version
    if (inSection && line.trim()) {
      // Convert ### headers to simpler format
      if (line.startsWith("### ")) {
        sectionContent.push(line.replace("### ", ""));
      } else if (line.startsWith("- ")) {
        sectionContent.push("  " + line);
      }
    }
  }

  // Don't forget the last version
  if (currentVersion && sectionContent.length > 0 && versionsFound < maxVersions) {
    entries.push(`${currentVersion}\n${sectionContent.join("\n")}`);
  }

  return entries.join("\n\n");
}

/**
 * Build the readme content from description and changelog
 */
function buildReadme(description: string, changelog: string): string {
  const changelogContent = parseChangelog(changelog);
  
  const readme = `${description}

Usage: Type 'c' followed by a hex color (e.g., 'c ff5500')

---

Recent Changes:

${changelogContent}`;

  return readme;
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

  // 1. Transpile TypeScript to JavaScript
  console.log("1. Transpiling TypeScript...");
  const sourceCode = await Bun.file(SOURCE_PATH).text();
  const transpiler = new Bun.Transpiler({
    loader: "ts",
    target: "browser",
  });
  const compiledJs = transpiler.transformSync(sourceCode);
  console.log(`   Transpiled ${SOURCE_PATH} (${compiledJs.length} bytes)`);

  // 2. Read workflow.json
  console.log("2. Reading workflow.json...");
  const workflowConfig: WorkflowConfig = await Bun.file(
    WORKFLOW_JSON_PATH,
  ).json();
  console.log(`   Loaded metadata for "${workflowConfig.name}"`);

  // 3. Read and parse CHANGELOG.md
  console.log("3. Building readme from changelog...");
  const changelog = await Bun.file(CHANGELOG_PATH).text();
  const readme = buildReadme(workflowConfig.description, changelog);
  console.log("   Generated readme with recent changelog entries");

  // 4. Read and update info.plist
  console.log("4. Updating info.plist...");
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
  plist = replacePlistValue(plist, "readme", xmlEscape(readme));

  // 5. Write updated plist
  await Bun.write(PLIST_PATH, plist);
  console.log("   Updated info.plist");

  console.log("\nBuild complete!");
}

build().catch((err) => {
  console.error("Build error:", err);
  process.exit(1);
});
