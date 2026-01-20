# AGENTS.md - ChromaKey Palette Alfred Workflow

## Project Overview

Alfred workflow generating 9 color variations from hex input in a 3x3 grid.

- **Language:** TypeScript compiled to JXA (NOT Node.js)
- **Runtime:** macOS `osascript -l JavaScript`
- **Build:** Bun + just
- **Dependency:** ImageMagick (`brew install imagemagick`)

## Commands

```bash
just build     # Compile TS, inject into info.plist
just check     # Type check only
just setup     # Build + install to Alfred
just install   # Symlink to Alfred
just uninstall # Remove from Alfred
```

## Key Files

- `src/index.ts` - Main source (single-file design)
- `scripts/build.ts` - Build script
- `workflow.json` - Metadata (injected into info.plist)
- `CHANGELOG.md` - Version history (injected into readme)

## JXA Context

This is JavaScript for Automation, not Node.js:

- No `require()`/`import` - single file, no modules
- `Application.currentApplication()` for macOS scripting
- `app.doShellScript()` for shell commands (not `child_process`)
- No npm packages

## Code Style

- 2-space indent, semicolons, double quotes
- camelCase for functions/variables
- Arrow functions for simple transforms, regular functions for complex logic
- Return early with error JSON for validation failures
- Silent catch for shell commands (workflow shouldn't crash)

## Architecture

1. Input: Hex color (3/6 chars, with/without `#`)
2. Convert: Hex -> RGB -> HSL
3. Generate: 9 variations via H/S/L adjustments
4. Output: Alfred JSON with cached PNG icons (`/tmp/alfred_colors/`)

## Commits

Semantic style: `type(scope): subject`

Types: feat, fix, docs, style, refactor, test, chore
