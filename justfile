# Default recipe
default:
    @just --list

# Build the workflow (compile TS to JS, inject into plist)
build:
    bun run scripts/build.ts

# Type check without building
check:
    bunx tsc --noEmit

# Install workflow to Alfred (symlink)
install:
    #!/usr/bin/env bash
    WORKFLOW_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"
    LINK_NAME="alfred-chromakey-workflow"
    TARGET="$WORKFLOW_DIR/$LINK_NAME"
    
    if [ -L "$TARGET" ]; then
        echo "Symlink already exists at $TARGET"
    elif [ -e "$TARGET" ]; then
        echo "Error: $TARGET exists but is not a symlink"
        exit 1
    else
        ln -s "$(pwd)" "$TARGET"
        echo "Installed: $TARGET -> $(pwd)"
    fi

# Uninstall workflow from Alfred (remove symlink)
uninstall:
    #!/usr/bin/env bash
    WORKFLOW_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"
    TARGET="$WORKFLOW_DIR/alfred-chromakey-workflow"
    
    if [ -L "$TARGET" ]; then
        rm "$TARGET"
        echo "Uninstalled: removed $TARGET"
    else
        echo "No symlink found at $TARGET"
    fi

# Build and install
setup: build install
