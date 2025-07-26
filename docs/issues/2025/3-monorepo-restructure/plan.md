# Monorepo Structure Restructure Plan

## Overview
Restructure the current Tauri application (kuumu) from a single-package structure to a scalable monorepo structure that can support multiple packages and large-scale development.

## Current State
- **Frontend**: Single package in `src/` (TypeScript/Vite)
- **Backend**: Single package in `src-tauri/` (Rust/Tauri)
- **Package management**: Standard Tauri setup with single npm + cargo packages

## Target Structure
```
./frontend/
  apps/
    kuumu-desktop/  # Desktop application (Tauri) - migrated from current src/
    kuumu-web/      # Web application (future)
  libs/
    kuumu-models/   # Shared models/types (future)
    [other shared libraries] (future)

./backend/
  apps/
    kuumu-tauri/    # Tauri backend for desktop app - migrated from current src-tauri/
    [other backend applications] (future)
  libs/
    [shared Rust libraries] (future)
```

## Migration Strategy

### Phase 1: Directory Structure Setup
- Create new monorepo directory structure
- Set up npm workspace configuration in root package.json
- Set up Cargo workspace configuration in root Cargo.toml

### Phase 2: Code Migration
- Migrate existing `src/` code to `frontend/apps/kuumu-desktop/`
- Migrate existing `src-tauri/` code to `backend/apps/kuumu-tauri/`
- Extract shared components into `frontend/libs/` (if applicable)

### Phase 3: Build System Integration
- Set up TypeScript project references for cross-package compilation
- Configure workspace-level build scripts
- Update Tauri configuration for new structure
- Set up development environment for monorepo

### Phase 4: Testing & Verification
- Verify all existing functionality works
- Test build processes
- Validate development workflow

## Success Criteria
- [ ] Monorepo structure created and functional
- [ ] Existing application maintains all functionality
- [ ] Development workflow supports multiple packages
- [ ] Build system works for all apps and libraries
- [ ] Ready for future package additions

## Timeline
**Estimated effort**: 8-13 points
- Phase 1: 2-3 points
- Phase 2: 3-5 points  
- Phase 3: 2-3 points
- Phase 4: 1-2 points

## Risks & Mitigation
- **Risk**: Breaking existing functionality during migration
  - **Mitigation**: Incremental migration with testing at each step
- **Risk**: Complex workspace configuration
  - **Mitigation**: Start with minimal config, iterate as needed
- **Risk**: Build system complexity
  - **Mitigation**: Leverage standard workspace tools (npm workspaces, Cargo workspaces)
