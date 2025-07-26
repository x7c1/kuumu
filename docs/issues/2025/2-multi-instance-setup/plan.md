# Multi-Instance Claude Code Setup

This document outlines the steps needed to enable multiple Claude Code instances for a single project.

## Overview

The goal is to allow multiple Claude Code instances (e.g., frontend, backend, testing) to work on the same project simultaneously while being recognized as separate projects by Claude Code.

## Implementation Checklist

### 1. Update Dockerfile ⏳
- [ ] Change `WORKDIR /workspace` to `WORKDIR /projects`
- [ ] Update ownership command from `/workspace` to `/projects`
- [ ] Ensure all references to `/workspace` are updated to `/projects`

**File:** `Dockerfile`
```dockerfile
# Change these lines:
WORKDIR /projects
RUN chown -R developer:developer /projects
```

### 2. Update docker-compose.yml ⏳
- [ ] Add `ROLE` environment variable support
- [ ] Update container naming to use `${ROLE}`
- [ ] Update volume mounting to use `/projects/${ROLE}`
- [ ] Update working directory to `/projects/${ROLE}`
- [ ] Keep shared Claude config (`claude.local/shared`) for all instances
- [ ] Use instance-specific bash history (`claude.local/${ROLE}/.bash_history`)

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  claude-code:
    build: ../..
    container_name: claude-code-${ROLE}
    volumes:
      - .:/projects/${ROLE}
      - ./claude.local/shared:/home/developer/.claude
      - ./claude.local/shared/.claude.json:/home/developer/.claude.json
      - ./claude.local/${ROLE}/.bash_history:/home/developer/.bash_history
      - ~/.claude/CLAUDE.md:/home/developer/.claude/CLAUDE.md
      - ~/.claude/.credentials.json:/home/developer/.claude/.credentials.json
      - ~/.gitconfig:/home/developer/.gitconfig
    working_dir: /projects/${ROLE}
    stdin_open: true
    tty: true
    command: bash -c "claude; exec bash"
```

### 3. Update Makefile ⏳
- [ ] Add validation for `ROLE` environment variable
- [ ] Show clear error message when `ROLE` is not provided
- [ ] Update existing targets to work with new structure

**File:** `Makefile`
```makefile
.PHONY: claude-setup claude-run claude setup-instance

claude-setup:
	./scripts/setup-claude-container.sh

setup-instance:
	./scripts/setup-claude-role.sh

claude-run: claude-setup setup-instance
	docker-compose run --rm claude-code

claude: claude-run
```

### 4. Create new setup-instance script ⏳
- [ ] Create `scripts/setup-claude-role.sh` for instance-specific setup
- [ ] Add ROLE environment variable validation
- [ ] Create shared and instance-specific directories
- [ ] Initialize required files (bash_history, etc.)

**File:** `scripts/setup-claude-role.sh`
```bash
#!/bin/bash

if [ -z "$ROLE" ]; then
    echo "Error: ROLE environment variable is required"
    echo "Usage: ROLE=frontend make workspace"
    exit 1
fi

echo "Setting up instance: $ROLE"

# Create directories
mkdir -p claude.local/shared
mkdir -p claude.local/${ROLE}

# Create bash history file if it doesn't exist
touch claude.local/${ROLE}/.bash_history

# Create shared config if it doesn't exist
if [ ! -f claude.local/shared/.claude.json ]; then
    echo "{}" > claude.local/shared/.claude.json
fi

echo "Instance $ROLE setup complete"
```

### 5. Update existing setup script ⏳
- [ ] Keep `setup-claude-container.sh` for Docker environment setup only
- [ ] Remove instance-specific logic from this script

**File:** `scripts/setup-claude-container.sh`

### 5. Documentation ⏳
- [ ] Create usage examples
- [ ] Document directory structure
- [ ] Add troubleshooting section

## Usage

After implementation, use the following commands:

```bash
# Start frontend instance
ROLE=frontend make workspace

# Start backend instance (in another terminal)
ROLE=backend make workspace

# Start testing instance (in another terminal)
ROLE=testing make workspace
```

## Directory Structure

```
my-tauri-app/
├── claude.local/
│   ├── shared/                # Shared Claude configuration
│   │   ├── .claude.json
│   │   └── ...
│   ├── frontend/              # Frontend instance history
│   │   └── .bash_history
│   ├── backend/               # Backend instance history
│   │   └── .bash_history
│   └── testing/               # Testing instance history
│       └── .bash_history
├── docker-compose.yml
├── Dockerfile
├── Makefile
└── src/
```

## Benefits

- **Multiple instances**: Run multiple Claude Code sessions simultaneously
- **Project isolation**: Each instance sees a different project name (`frontend`, `backend`, etc.)
- **Shared configuration**: All instances use the same Claude settings
- **Separate history**: Each instance maintains its own command history
- **Single Docker image**: One shared base image for all instances

## Notes

- Each instance will see the same project files but under different project names
- Claude Code will treat each instance as a separate project
- All instances share the same Docker image to save disk space
- Only command history is kept separate per instance
