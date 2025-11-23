# Kuumu

Tauri + Vanilla TS Monorepo

A scalable monorepo structure supporting multiple applications and shared libraries.

## Git Submodules and Shared Resources

This repository uses the [strata](https://github.com/x7c1/strata) submodule to share common scripts, slash commands, and Claude Code skills across multiple projects.

### Cloning with Submodules

```bash
git clone --recurse-submodules https://github.com/x7c1/kuumu.git
```

### Initializing Submodules in Existing Clones

```bash
git submodule update --init --recursive
```

### Updating Submodules to Latest Version

```bash
git submodule update --remote vendor/strata
```

### Strata as Claude Code Plugin

The strata submodule is configured as a Claude Code plugin, providing shared scripts, commands, and skills.

**Shared Resources from Strata:**
- **Plugin Configuration**: `vendor/strata/.claude-plugin/`
  - plugin.json: Plugin metadata and configuration
  - marketplace.json: Marketplace listing information
- **Shared Scripts**: `vendor/strata/scripts/`
  - new-github-repo.sh
  - setup-claude-container.sh
  - setup-claude-role.sh
  - start-claude-code.sh
- **Slash Commands**: `vendor/strata/commands/`
  - `/git-commit`: Format staged files and create commits
  - `/update-pr`: Update PR title and description
  - `/create-pr`: Create draft pull requests
  - `/new-issue`: Start new issue planning process
- **Claude Code Skills**: `vendor/strata/skills/`
  - git-commit: Auto-invoked when committing changes
  - update-pr: Auto-invoked when updating PRs
  - create-pr: Auto-invoked when creating PRs

**Usage:**
- **Commands**: Explicitly invoke with `/git-commit`, `/update-pr`, `/create-pr`, or `/new-issue`
- **Skills**: Automatically invoked by Claude Code based on context (git-commit, update-pr, create-pr)

**Troubleshooting:**
- Empty vendor/strata directory → Run `git submodule update --init --recursive`
- Skills not available → Restart Claude Code or check vendor/strata/skills/ exists
- Script permission errors → Run `chmod +x vendor/strata/scripts/*.sh vendor/strata/skills/*/*.sh`

## Development Commands

### Frontend Development

```bash
# Build all TypeScript projects in the workspace
npm run build --workspaces
```

#### Layouter Demo

```bash
# Start development server for layouter-demo app
npm run dev:layouter-demo
```

- During development, logs are also saved to `frontend/apps/layouter-demo/logs/layouter-demo.log`

#### Font Management

After cloning the repository, set up fonts for the layouter example:

```bash
npm run fonts:setup
```

**Font Configuration**

Fonts are configured in `scripts/font-config.json`. To switch fonts:
1. Update `VITE_KUUMU_FONT_PATH` in `.envrc`
2. Run `direnv allow` to reload environment  
3. Run `npm run fonts:setup` to download new font

**Available Fonts**
- See `scripts/font-config.json` for configured fonts

**Adding New Fonts**
1. Add font entry to `scripts/font-config.json`
2. Update `.envrc` to use new font path
3. Run font setup to download

#### Graph Drawing Demo

```bash
# Start development server for graph drawing demo app
npm run dev:graph-drawing-demo

# Build graph drawing demo app
npm run build:graph-drawing-demo
```

### Desktop Application

```bash
# Start development server with hot reload
npm run tauri:desktop -- dev

# Build frontend only
npm run build:desktop

# Preview built frontend
npm run preview:desktop

# Build complete desktop application
npm run tauri:desktop -- build
```

### Backend Development

```bash
# Run all tests
make cargo-test

# Run clippy linting
make cargo-clippy

# Format code
make cargo-fmt
```
