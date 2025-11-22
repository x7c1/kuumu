# Migrate Docker and Makefile to Strata

## Overview

This project involves migrating Docker-related files (Dockerfile, docker-compose.yml) and Makefile to the strata repository as templates for the new-github-repo skill. These files will serve as starting templates when creating new repositories, providing a standardized development environment setup.

The new-github-repo script will be enhanced to copy these infrastructure files during repository initialization, creating a complete development environment from the start.

## Objectives

- Create `vendor/strata/skills/new-github-repo/` skill directory
- Move `vendor/strata/scripts/new-github-repo.sh` to `vendor/strata/skills/new-github-repo/`
- Create `vendor/strata/skills/new-github-repo/templates/` directory
- Create generic versions of infrastructure files in templates/:
  - Dockerfile.template (based on kuumu's but without project-specific dependencies)
  - docker-compose.yml (generic version)
  - Makefile (without cargo-* targets)
  - scripts/install-ubuntu-deps.sh (without Tauri-specific dependencies)
- Create SKILL.md for new-github-repo skill
- Create `vendor/strata/commands/new-github-repo.md` command (skill wrapper)
- Enhance new-github-repo.sh to:
  - Copy infrastructure files to new repository
  - Create scripts/ directory and copy install-ubuntu-deps.sh
  - Include infrastructure files in initial commit
- Update kuumu repository's Makefile, Dockerfile, docker-compose.yml to reference strata versions where appropriate

## Current Situation

The kuumu repository currently has:
- **Dockerfile**: Rust-based development environment with Tauri dependencies
- **docker-compose.yml**: Claude Code container configuration with volume mounts
- **Makefile**: Contains claude-setup, claude-run, and cargo-* targets
- **scripts/install-ubuntu-deps.sh**: Includes Tauri-specific system dependencies

The `vendor/strata/scripts/new-github-repo.sh` script currently:
- Creates GitHub repository with configuration from YAML file
- Creates initial README.md and .gitignore files
- Configures repository settings and branch protection

## Technical Requirements

### Template Files

**1. Dockerfile.template** (Generic version):
- Base image: rust:1.88 (placeholder - update to latest during skill execution)
- Essential tools: git, vim, zsh, sudo
- Node.js 20 installation (placeholder - update to latest LTS during skill execution)
- GitHub CLI installation
- Non-root user setup (developer:developer, uid:gid 1000:1000)
- Rust components: clippy, rustfmt
- npm user-level directory setup
- Remove: Tauri-specific dependencies from install-ubuntu-deps.sh
- Template file - requires version updates before use

**2. docker-compose.yml** (Generic version):
- Service name: claude-code
- Container name: claude-code-${ROLE}
- Volume mounts for Claude Code configuration
- Working directory: /projects/${ROLE}
- Command: start-claude-code.sh from vendor/strata/scripts/
- Replace specific project references with ${ROLE} variable

**3. Makefile** (Generic version):
- Keep targets:
  - help: Show help message
  - claude-setup: Setup Claude container
  - setup-role: Setup Claude role configuration
  - claude-run: Run Claude Code in Docker container
  - workspace: Alias for claude-run
  - pr: Create pull request automatically
- Remove targets:
  - cargo-test, cargo-clippy, cargo-fmt, cargo-fmt-check (Rust-specific)
- All script references should point to vendor/strata/ paths

**4. scripts/install-ubuntu-deps.sh** (Generic version):
- Keep essential dependencies:
  - build-essential
  - curl
  - pkg-config
  - libssl-dev
  - yq
  - jq
- Remove Tauri-specific dependencies:
  - libgtk-3-dev
  - libwebkit2gtk-4.1-dev
  - libayatana-appindicator3-dev
  - librsvg2-dev
  - patchelf
  - libsoup-3.0-dev
  - libjavascriptcoregtk-4.1-dev

### Script Enhancement

**new-github-repo.sh modifications**:
- Add function to copy infrastructure files to newly created repository
- Create directory structure in cloned repository:
  - Copy Dockerfile to repository root
  - Copy docker-compose.yml to repository root
  - Copy Makefile to repository root
  - Create scripts/ directory
  - Copy install-ubuntu-deps.sh to scripts/
- Update initial commit to include all infrastructure files
- Infrastructure files should be copied after repository creation but before initial commit

## Implementation Plan

### Phase 1: Create Skill Directory Structure

- Create `vendor/strata/skills/new-github-repo/` directory
- Create `vendor/strata/skills/new-github-repo/templates/` directory
- Create `vendor/strata/skills/new-github-repo/templates/scripts/` directory
- Move `vendor/strata/scripts/new-github-repo.sh` to `vendor/strata/skills/new-github-repo/new-github-repo.sh`

### Phase 2: Create Template Files

**Create generic Dockerfile.template**:
```dockerfile
FROM rust:<RUST_VERSION>

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    zsh \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Copy and run common dependency installation script
COPY scripts/install-ubuntu-deps.sh /tmp/install-ubuntu-deps.sh
RUN chmod +x /tmp/install-ubuntu-deps.sh && \
    /tmp/install-ubuntu-deps.sh && \
    rm /tmp/install-ubuntu-deps.sh && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js (replace <NODEJS_VERSION> with LTS version like 22)
RUN curl -fsSL https://deb.nodesource.com/setup_<NODEJS_VERSION>.x | bash - && \
    apt-get install -y nodejs

# Install GitHub CLI
RUN type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y) && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    sudo apt update && \
    sudo apt install gh -y

# Create a non-root user (replace existing node user)
RUN userdel -r node || true && \
    groupadd -g 1000 developer && \
    useradd -m -u 1000 -g 1000 -s /bin/zsh developer && \
    echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set working directory
WORKDIR /projects

# Change ownership of projects directory to developer user
RUN chown -R developer:developer /projects

# Switch to non-root user
USER developer

# Install Rust components
RUN rustup component add clippy rustfmt

# Set up npm user-level directory
RUN mkdir -p /home/developer/.npm-global

RUN mkdir -p /home/developer/.local

# Set up shell environment with npm user prefix
ENV NPM_CONFIG_PREFIX=/home/developer/.npm-global
ENV PATH=$PATH:/home/developer/.local/bin:/home/developer/.npm-global/bin:/usr/local/bin

# Default command
CMD ["zsh"]
```

**Create generic docker-compose.yml**:
```yaml
services:
  claude-code:
    build: .
    container_name: claude-code-${ROLE}
    volumes:
      - .:/projects/${ROLE}
      - ./claude.local/shared:/home/developer/.claude
      - ./claude.local/shared/.claude.json:/home/developer/.claude.json
      - ./claude.local/${ROLE}/.bash_history:/home/developer/.bash_history
      - ~/.claude/CLAUDE.md:/home/developer/.claude/CLAUDE.md
      - ~/.claude/.credentials.json:/home/developer/.claude/.credentials.json
      - ~/.config/git:/home/developer/.config/git
      - ~/.ssh:/home/developer/.ssh:ro
      - ./claude.local/shared/.npm-global:/home/developer/.npm-global
      - ./claude.local/shared/.config/gh:/home/developer/.config/gh
      - ./claude.local/shared/.local:/home/developer/.local
    stdin_open: true
    tty: true
    working_dir: /projects/${ROLE}
    command: bash -c "/projects/${ROLE}/vendor/strata/scripts/start-claude-code.sh; exec bash"
```

**Create generic Makefile**:
```makefile
.PHONY: help claude-setup setup-role claude-run workspace pr

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

claude-setup: ## Setup Claude container
	./vendor/strata/scripts/setup-claude-container.sh

setup-role: ## Setup Claude role configuration
	./vendor/strata/scripts/setup-claude-role.sh

claude-run: claude-setup setup-role ## Run Claude Code in Docker container
	@if [ -n "$$TMUX" ] && [ -n "$$ROLE" ]; then \
		tmux rename-window "$$ROLE"; \
	fi
	docker compose run --rm claude-code

workspace: claude-run ## Alias for claude-run

pr: ## Create pull request automatically
	./vendor/strata/skills/create-pr/create-pr-auto.sh
```

**Create generic install-ubuntu-deps.sh**:
```bash
#!/bin/bash

# Install common Ubuntu system dependencies
set -euo pipefail

echo "Installing common Ubuntu system dependencies..."

sudo apt-get update
sudo apt-get install -y \
    build-essential \
    curl \
    pkg-config \
    libssl-dev \
    yq \
    jq

echo "Common Ubuntu dependencies installed successfully!"
```

### Phase 3: Create SKILL.md and Command

Create `vendor/strata/skills/new-github-repo/SKILL.md`:
```markdown
---
name: new-github-repo
description: Create new GitHub repository with infrastructure setup and configuration
---

# New GitHub Repository Skill

Creates a new GitHub repository with predefined settings, branch protection rules, and infrastructure setup (Dockerfile, docker-compose.yml, Makefile).

## Instructions

1. Create YAML configuration file with repository settings
2. Before running the script, prepare Dockerfile from template:
   - Check latest Rust version: https://hub.docker.com/_/rust
   - Check latest Node.js LTS version: https://nodejs.org/
   - Copy templates/Dockerfile.template and replace placeholders:
     - Replace `<RUST_VERSION>` with latest stable version (e.g., 1.83)
     - Replace `<NODEJS_VERSION>` with latest LTS version (e.g., 22)
   - Save as Dockerfile (temporary file for this execution)
3. Run new-github-repo.sh with configuration file path
4. Script will:
   - Create GitHub repository
   - Copy infrastructure files (Dockerfile, docker-compose.yml, Makefile)
   - Copy scripts/install-ubuntu-deps.sh
   - Create initial commit with all files
   - Configure repository settings
   - Apply branch protection rules

## Usage

Create configuration file (example.yaml):
```yaml
name: my-repo
description: My new repository
visibility: public
default_branch: main
delete_branch_on_merge: true
merge_methods:
  allow_squash_merge: true
  allow_merge_commit: false
  allow_rebase_merge: false
branch_protection:
  required_approving_review_count: 1
  require_status_checks: true
  allow_force_pushes: false
  enforce_admins: true
```

Run the script:
```bash
bash new-github-repo.sh example.yaml
```

## Template Files

The skill includes the following templates:
- **Dockerfile.template**: Rust + Node.js development environment with Claude Code support
  - Contains placeholders: `<RUST_VERSION>` and `<NODEJS_VERSION>`
  - Skill checks latest versions and generates Dockerfile before repository creation
- **docker-compose.yml**: Docker Compose configuration for Claude Code
- **Makefile**: Common development tasks (claude-setup, claude-run, pr)
- **scripts/install-ubuntu-deps.sh**: Essential Ubuntu dependencies

## Notes

- Requires GitHub CLI (gh) to be installed and authenticated
- Requires yq for YAML parsing
- Templates assume vendor/strata submodule will be added to the repository
- Repository created with initial commit containing infrastructure files
```

Create `vendor/strata/commands/new-github-repo.md`:
```markdown
---
description: Create new GitHub repository with infrastructure files
---

Use the new-github-repo skill exactly as written
```

### Phase 4: Enhance new-github-repo.sh

Add new function `copy_infrastructure_files()` to new-github-repo.sh:

```bash
# Copy infrastructure files to repository
copy_infrastructure_files() {
    local temp_dir="$1"
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local templates_dir="$script_dir/templates"

    print_debug "Copying infrastructure files from: $templates_dir"

    # Copy Dockerfile (prepared from template before script execution)
    if [ -f "$templates_dir/../Dockerfile" ]; then
        cp "$templates_dir/../Dockerfile" "$temp_dir/repo/"
        print_debug "Copied Dockerfile"
    fi

    # Copy docker-compose.yml
    if [ -f "$templates_dir/docker-compose.yml" ]; then
        cp "$templates_dir/docker-compose.yml" "$temp_dir/repo/"
        print_debug "Copied docker-compose.yml"
    fi

    # Copy Makefile
    if [ -f "$templates_dir/Makefile" ]; then
        cp "$templates_dir/Makefile" "$temp_dir/repo/"
        print_debug "Copied Makefile"
    fi

    # Create scripts directory and copy install-ubuntu-deps.sh
    mkdir -p "$temp_dir/repo/scripts"
    if [ -f "$templates_dir/scripts/install-ubuntu-deps.sh" ]; then
        cp "$templates_dir/scripts/install-ubuntu-deps.sh" "$temp_dir/repo/scripts/"
        chmod +x "$temp_dir/repo/scripts/install-ubuntu-deps.sh"
        print_debug "Copied scripts/install-ubuntu-deps.sh"
    fi
}
```

Modify `create_initial_files()` function to call `copy_infrastructure_files()`:

```bash
# Create initial files
create_initial_files() {
    # Check if default branch already exists
    if gh api "repos/$REPO_OWNER/$REPO_NAME/branches/$DEFAULT_BRANCH" &> /dev/null; then
        print_info "Branch '$DEFAULT_BRANCH' already exists, skipping initial files creation"
        return 0
    fi

    local temp_dir
    temp_dir=$(mktemp -d)
    cd "$temp_dir" || exit 1

    # Clone the empty repository using gh (handles authentication automatically)
    gh repo clone "$REPO_OWNER/$REPO_NAME" repo
    cd repo || exit 1

    # Create default branch if needed
    git checkout -b "$DEFAULT_BRANCH" 2>/dev/null || git checkout "$DEFAULT_BRANCH"

    # Create empty README.md and .gitignore
    touch README.md
    touch .gitignore

    # Copy infrastructure files
    copy_infrastructure_files "$temp_dir"

    # Commit all files
    git add .
    git commit -m "Initial commit with infrastructure setup"

    # Push to remote (gh authentication is already configured)
    git push -u origin "$DEFAULT_BRANCH"

    # Clean up
    cd - > /dev/null || exit 1
    rm -rf "$temp_dir"

    print_debug "Initial infrastructure files created and pushed"
}
```

### Phase 5: Update Strata Repository

**Steps to execute in vendor/strata/**:

1. Create directory structure:
   ```bash
   cd /projects/developer/vendor/strata
   mkdir -p skills/new-github-repo/templates/scripts
   ```

2. Move and create files:
   ```bash
   # Move new-github-repo.sh
   mv scripts/new-github-repo.sh skills/new-github-repo/

   # Create template files
   # (Create Dockerfile, docker-compose.yml, Makefile, SKILL.md, install-ubuntu-deps.sh)
   ```

3. Commit and push to strata repository:
   ```bash
   git add .
   git commit -m "feat(skills): add new-github-repo skill with infrastructure setup"
   git push
   ```

### Phase 6: Update Kuumu Repository

1. Update submodule reference:
   ```bash
   cd /projects/developer
   git submodule update --remote vendor/strata
   git add vendor/strata
   ```

2. Update Makefile reference in kuumu (if needed):
   - The current Makefile already references vendor/strata paths correctly
   - Add cargo-* targets back to kuumu's Makefile as project-specific targets

3. Commit changes:
   ```bash
   git add Makefile vendor/strata
   git commit -m "feat(infra): update strata submodule with new-github-repo skill"
   ```

### Phase 7: Testing & Validation

**Test new-github-repo skill**:
- Create test configuration YAML file
- Check latest Rust version from https://hub.docker.com/_/rust
- Check latest Node.js LTS version from https://nodejs.org/
- Prepare Dockerfile from template with actual versions
- Run `bash vendor/strata/skills/new-github-repo/new-github-repo.sh test.yaml`
- Verify:
  - Repository is created on GitHub
  - Initial commit includes: README.md, .gitignore, Dockerfile (with actual versions), docker-compose.yml, Makefile, scripts/install-ubuntu-deps.sh
  - Dockerfile contains actual version numbers (not placeholders)
  - Repository settings are applied correctly
  - Branch protection rules are configured

**Test template files**:
- Clone the newly created repository
- Add vendor/strata as submodule
- Run `make claude-setup`
- Run `make claude-run`
- Verify Docker container starts correctly with Claude Code

**Verify file permissions**:
- Check that scripts/install-ubuntu-deps.sh is executable
- Check that new-github-repo.sh is executable

## Timeline Estimate

- Phase 1 (Directory Structure): 1 point
- Phase 2 (Template Files): 2 points
- Phase 3 (SKILL.md and Command): 1 point
- Phase 4 (Script Enhancement): 3 points
- Phase 5 (Update Strata): 2 points
- Phase 6 (Update Kuumu): 1 point
- Phase 7 (Testing): 2 points

Total: 12 points

## Success Criteria

- `vendor/strata/skills/new-github-repo/` directory exists
- `vendor/strata/skills/new-github-repo/templates/` contains all template files:
  - Dockerfile.template (with version placeholders)
  - docker-compose.yml
  - Makefile
  - scripts/install-ubuntu-deps.sh
- `vendor/strata/skills/new-github-repo/SKILL.md` is created
- `vendor/strata/commands/new-github-repo.md` is created (skill wrapper)
- `vendor/strata/skills/new-github-repo/new-github-repo.sh` (moved from scripts/)
- `/new-github-repo` slash command works and invokes the skill
- new-github-repo.sh successfully copies infrastructure files to new repositories
- Skill checks latest Rust and Node.js versions before repository creation
- Initial commit in new repositories includes Dockerfile with actual version numbers (not placeholders)
- SKILL.md includes clear instructions for checking versions and preparing Dockerfile
- Template files are generic (no project-specific dependencies)
- Makefile template excludes cargo-* targets
- install-ubuntu-deps.sh excludes Tauri-specific dependencies
- Test repository creation succeeds with all infrastructure files
- Docker environment builds and runs successfully with infrastructure files
- kuumu's Makefile retains cargo-* targets as project-specific

## Notes

- This migration makes new repository creation more complete and consistent
- Templates provide a standardized development environment setup
- Future repositories can modify templates as needed for specific requirements
- The generic templates can be enhanced over time based on common patterns
- Consider creating multiple template sets in the future (e.g., rust-tauri, node-only, python)

## Open Questions

None. Implementation plan is ready for execution.
