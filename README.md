# Kuumu

Tauri + Vanilla TS Monorepo

A scalable monorepo structure supporting multiple applications and shared libraries.

## Development Commands

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
