# AGENTS.md - ChromaKey Palette Alfred Workflow

This document provides guidance for AI coding agents working in this repository.

## Project Overview

**ChromaKey Palette** is an Alfred workflow that generates 9 color variations from
any hex color input, displayed in an interactive 3x3 grid. It creates: lighter tint,
darker shade, analogous colors, muted/saturated versions, triadic shift, and complement.

- **Type:** Alfred Workflow for macOS
- **Language:** TypeScript (compiled to JavaScript for JXA)
- **Runtime:** macOS `osascript -l JavaScript` interpreter (NOT Node.js)
- **Build Tool:** Bun + just
- **Bundle ID:** `com.whomwah.alfred.chromakey`
- **Repository:** https://github.com/whomwah/alfred-chromakey-workflow

## Project Structure

```
alfred-chromakey-workflow/
├── src/
│   ├── index.ts              # Main source (TypeScript)
│   └── types/
│       └── jxa.d.ts          # JXA type definitions
├── scripts/
│   └── build.ts              # Build script (Bun)
├── workflow.json             # Metadata config
├── CHANGELOG.md              # Changelog
├── justfile                  # Build commands
├── tsconfig.json             # TypeScript config
├── info.plist                # Alfred workflow (modified by build)
├── icon.png                  # Workflow icon
├── README.md                 # Documentation
└── AGENTS.md                 # This file
```

## Build/Lint/Test Commands

### Building the Workflow

```bash
# Build (compile TS and inject into info.plist)
just build

# Type check only
just check

# Install to Alfred (creates symlink)
just install

# Full setup (build + install)
just setup

# Uninstall from Alfred
just uninstall
```

### Running the Workflow

The code executes directly through Alfred. To test:

1. Run `just setup` to build and install the workflow
2. Trigger with keyword `c` followed by a hex color (e.g., `c ff5500`)
3. Check Alfred's debug console for errors

## External Dependencies

- **ImageMagick:** The `magick` CLI must be available in PATH
  - Used to generate color swatch PNG icons
  - Install via: `brew install imagemagick`

## Code Style Guidelines

### Language Context: JXA (Not Node.js)

This is JavaScript for Automation (JXA), Apple's JavaScript API for macOS:

- **No `require()` or `import`** - Uses ES6 `export function` for Alfred
- **Global `Application` object** - Access macOS applications and scripting
- **`app.doShellScript()`** - Execute shell commands (not `child_process`)
- **No npm packages** - Pure JavaScript with JXA APIs only

### Naming Conventions

```javascript
// Functions: camelCase
function rgbToHsl(r, g, b) { ... }
const hexToRgb = (hex) => ...;

// Variables: camelCase
const tmpDir = "/tmp/alfred_colors/";
const iconPath = `${tmpDir}${rawHex}.png`;

// No UPPER_SNAKE_CASE constants in this codebase
```

### Formatting

- **Indentation:** 2 spaces
- **Semicolons:** Always use semicolons
- **Quotes:** Double quotes for strings (`"text"`)
- **Template literals:** Use for interpolation (`` `${var}` ``)
- **Trailing commas:** Use in multi-line arrays/objects
- **Line length:** ~100 characters max (soft limit)

### Function Style

```javascript
// Arrow functions for simple transformations
const hexToRgb = (hex) =>
  [0, 2, 4].map((p) => parseInt(hex.substring(p, p + 2), 16));

// Regular functions for complex logic with multiple statements
function rgbToHsl(r, g, b) {
  // ... multiple lines of logic
  return [h, s, l];
}
```

### Comment Style

```javascript
// --- Section Headers ---
// Use triple dashes for major sections

// Inline explanatory comments
const variations = [
  { name: "Lighter Tint", hex: hslToHex(h, s, l + 0.2) },  // 1
  { name: "Original", hex: "#" + query.toUpperCase() },    // 5 (Center)
];
```

### Error Handling

```javascript
// Input validation: Return early with error JSON
if (!/^([0-9A-F]{3}){1,2}$/i.test(query)) {
  return JSON.stringify({ items: [{ title: "Invalid Hex Code" }] });
}

// Shell commands: Silent catch (workflow should not crash)
try {
  app.doShellScript(`command here`);
} catch (e) {}
```

### Alfred Workflow Patterns

```javascript
// Main entry point - Alfred calls this function
function run(argv) {
  let query = argv[0].replace("#", "").trim();
  
  // ... processing ...
  
  // Return Alfred JSON format
  return JSON.stringify({ items });
}

// JXA Application access
const app = Application.currentApplication();
app.includeStandardAdditions = true;

// Shell command execution
app.doShellScript(`mkdir -p "${tmpDir}"`);

// Alfred item structure
const item = {
  title: "#FF5500",           // Main display text
  subtitle: "Original",       // Secondary text
  arg: "#FF5500",             // Value passed to next action
  icon: { path: iconPath },   // Icon file path
};
```

### Import Organization

This single-file project has no imports. If adding structure:

```javascript
// JXA has no module system like Node.js
// All code lives in a single file
// Helper functions are defined inside the main run() function
```

## Architecture Notes

### Single-File Design

The entire workflow is contained in `src/index.ts`. Helper functions are defined
inside `run()` to keep the scope contained and avoid globals.

### Color Processing Pipeline

1. **Input:** Hex color (3 or 6 chars, with/without `#`)
2. **Normalize:** Expand 3-char hex to 6-char
3. **Convert:** Hex -> RGB -> HSL
4. **Generate:** 9 variations by adjusting H/S/L values
5. **Output:** Alfred JSON with generated PNG icons

### Icon Generation

Icons are cached in `/tmp/alfred_colors/` to avoid regenerating on each run.
Each color swatch is a 128x128 PNG created by ImageMagick.

## Common Tasks

### Adding a New Color Variation

1. Add entry to the `variations` array in `src/index.ts:72-82`
2. Use `hslToHex()` with adjusted H/S/L values
3. Keep the grid-friendly naming convention

### Modifying Icon Generation

Edit the shell command in `src/index.ts:98-100`:

```javascript
app.doShellScript(
  `if [ ! -f "${iconPath}" ]; then ${magickPath} -size 128x128 xc:"${v.hex}" "${iconPath}"; fi`
);
```

### Debugging

1. Open Alfred Preferences -> Workflows -> ChromaKey Palette
2. Click the bug icon to open Debug Console
3. Run the workflow and check for errors
