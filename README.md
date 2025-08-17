# Kuumu

Tauri + Vanilla TS Monorepo

A scalable monorepo structure supporting multiple applications and shared libraries.

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
