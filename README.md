# Kuumu

Tauri + Vanilla TS Monorepo

A scalable monorepo structure supporting multiple applications and shared libraries.

## Development Commands

### Frontend Development

```bash
# Build all TypeScript projects in the workspace
npm run build --workspaces
```

#### Layouter Example

```bash
# Start development server for three-js-layouter-example app
npm run dev:layouter-example
```

- During development, logs are also saved to `frontend/apps/three-js-layouter-example/three-js-layouter-example.logs.json`

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
