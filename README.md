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
# Build Rust backend
cargo build

# Run tests
cargo test

# Check code without building
cargo check
```
