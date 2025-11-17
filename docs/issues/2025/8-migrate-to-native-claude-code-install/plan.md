# Migrate to Native Claude Code Installation

## Overview
Migrate the Docker-based Claude Code installation from npm-based method to the officially recommended native installer.

## Background
- Current setup uses `npm install -g @anthropic-ai/claude-code` in `scripts/start-claude-code.sh`
- Anthropic now recommends native installation via `curl -fsSL https://claude.ai/install.sh | bash`
- Native installer offers:
  - Self-contained executable
  - No Node.js dependency requirement
  - Better auto-updater stability
- Current npm-based installation is working without issues, but we want to follow latest best practices

## Goals
- Update Docker setup to use native Claude Code installer
- Maintain existing functionality (auto-install on first run, update check on subsequent runs)
- Keep the setup simple and maintainable

## Scope
**In scope:**
- Update `Dockerfile` to use native installer
- Update `scripts/start-claude-code.sh` to use native installation method
- Verify compatibility with existing volume mounts and configurations

**Out of scope:**
- Full migration to Anthropic's official devcontainer reference implementation
- Adding firewall/security features from official devcontainer
- Changing docker-compose.yml structure or volume mount configuration

## Technical Approach

### Investigation Phase
- Research how native installer works in containerized environment
- Check if native installer requires any special dependencies in Dockerfile
- Verify that native installer can run non-interactively in startup script

### Implementation Phase

**1. Update Dockerfile**
- Remove or adjust Node.js installation if no longer needed for Claude Code
- Ensure all dependencies required by native installer are present
- Update any npm-related PATH configurations if necessary

**2. Update start-claude-code.sh**
- Replace npm install/update commands with native installer
- Implement first-run detection and update checking for native installer
- Ensure script maintains existing behavior (auto-install, update checks)

**3. Testing**
- Test fresh container startup (first-run install)
- Test subsequent container restarts (update check behavior)
- Verify Claude Code launches correctly with `exec claude`
- Confirm all existing configurations and credentials still work

## Risks and Considerations
- Native installer might have different behavior in containerized environments
- Update mechanism for native installer might differ from npm
- Need to ensure backward compatibility with existing `.claude` configuration directory
- Should verify that native installer respects existing authentication/credentials

## Timeline Estimate
- Investigation: 1 point
- Implementation: 2 points
- Testing: 1 point
- **Total: 4 points**

## Success Criteria
- Docker container starts successfully with native Claude Code installation
- First-run install works automatically
- Update checks work on subsequent runs
- Claude Code launches and functions correctly
- All existing configuration and credentials are preserved
