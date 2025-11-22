# Add x7c1/strata as Git Submodule

## Overview

This project involves adding the x7c1/strata repository as a git submodule to enable sharing common shell scripts, slash commands, and Claude Code skills across multiple repositories. Strata is configured as a Claude Code plugin, making it easily installable and usable across different projects.

The strata repository will be mounted at `vendor/strata` and will contain:
- Plugin configuration in `.claude-plugin/` (plugin.json and marketplace.json)
- General-purpose shell scripts in `strata/scripts/`
- Slash commands in `strata/commands/` (thin wrappers for explicit skill invocation)
- Claude Code skills in `strata/skills/` with SKILL.md definitions (for auto-invocation)

Scripts and commands previously maintained in `scripts/` and `.claude/commands/` will be migrated to strata. The combination of commands (explicit) and skills (automatic) provides flexible usage: users can explicitly call `/git-commit` or let Claude auto-invoke the skill based on context. Some commands like `/new-issue` are standalone without corresponding skills.

## Objectives

- Add x7c1/strata as a git submodule at `vendor/strata`
- Migrate 10 general-purpose scripts to strata repository
- Create 4 slash commands:
  - /git-commit (skill wrapper)
  - /update-pr (skill wrapper)
  - /create-pr (skill wrapper)
  - /new-issue (standalone command)
- Create 3 Claude Code skills with SKILL.md files (for auto-invocation):
  - git-commit skill (format staged files and commit)
  - update-pr skill (update PR title and description)
  - create-pr skill (create draft pull request)
- Configure strata as a Claude Code plugin with `.claude-plugin/` directory:
  - plugin.json: Plugin metadata
  - marketplace.json: Marketplace listing
- Organize strata repository with `scripts/`, `commands/`, and `skills/` directories
- Update all script invocation paths throughout the codebase
- Delete 3 generic .claude/commands/ files (git-commit.md, update-pr.md, new-issue.md)
- Keep 2 project-specific .claude/commands/ files (build-workspaces.md, read-logs.md)
- Document submodule, commands, and skills usage in README.md

## Current Situation

The repository currently has:
- **12 shell scripts** in `scripts/` directory: 10 will be migrated to strata, 2 will remain
- **5 Claude Code commands** in `.claude/commands/`: 3 generic will be migrated to strata, 2 project-specific will remain

**Scripts to migrate** (10 files):
- create-pr-auto.sh → strata/skills/create-pr/
- ensure-newline.sh → strata/skills/git-commit/
- format-staged-files.sh → strata/skills/git-commit/
- get-current-branch-pr.sh → strata/skills/update-pr/
- new-github-repo.sh → strata/scripts/
- remove-trailing-whitespace.sh → strata/skills/git-commit/
- update-pr.sh → strata/skills/update-pr/
- setup-claude-container.sh → strata/scripts/
- setup-claude-role.sh → strata/scripts/
- start-claude-code.sh → strata/scripts/

**Commands to migrate** (3 files, generic commands):
- .claude/commands/git-commit.md → strata/commands/git-commit.md + strata/skills/git-commit/SKILL.md
- .claude/commands/update-pr.md → strata/commands/update-pr.md + strata/skills/update-pr/SKILL.md
- .claude/commands/new-issue.md → strata/commands/new-issue.md (command only, no skill)

**Commands to keep in .claude/commands/** (2 files, project-specific):
- build-workspaces.md (npm workspaces specific to this project)
- read-logs.md (project-specific log reading)

**Scripts to keep** (2 files, project-specific):
- download-fonts.sh (depends on font-config.json)
- install-ubuntu-deps.sh (Tauri-specific dependencies)

These files are referenced from various locations in the codebase:

### Script Usage Locations

**Makefile**:
- `./scripts/setup-claude-container.sh` (line 12)
- `./scripts/setup-claude-role.sh` (line 15)
- `./scripts/create-pr-auto.sh` (line 26)

**docker-compose.yml**:
- `/projects/${ROLE}/scripts/start-claude-code.sh` (line 20)

**Dockerfile**:
- `scripts/install-ubuntu-deps.sh` (line 12)

**package.json**:
- `./scripts/download-fonts.sh` (line 23)

**.github/workflows/ci.yml**:
- `./scripts/install-ubuntu-deps.sh` (lines 55, 119)

**.claude/commands/git-commit.md**:
- `./scripts/format-staged-files.sh` (line 14)

**.claude/commands/update-pr.md**:
- `./scripts/get-current-branch-pr.sh` (line 17)
- `./scripts/update-pr.sh` (line 21)

**README.md**:
- References to `scripts/font-config.json` and font setup process

## Technical Requirements

- Submodule location: `vendor/strata`
- Maintain compatibility with existing tooling (Docker, CI/CD, npm scripts)
- Ensure all script references are updated to new paths
- Document initialization steps for new repository clones

## Implementation Plan

### Phase 1: Submodule Setup

- Add x7c1/strata repository as git submodule at `vendor/strata`
- Initialize and update the submodule
- Verify submodule is properly tracked in .gitmodules

#### Strata Repository Structure

The strata repository will have the following structure:

```
strata/
├── .claude-plugin/             # Plugin configuration for Claude Code
│   ├── plugin.json
│   └── marketplace.json
├── scripts/                    # Shared scripts not bundled with skills
│   ├── new-github-repo.sh
│   ├── setup-claude-container.sh
│   ├── setup-claude-role.sh
│   └── start-claude-code.sh
├── commands/                   # Slash commands
│   ├── git-commit.md         # Skill wrapper
│   ├── update-pr.md          # Skill wrapper
│   ├── create-pr.md          # Skill wrapper
│   └── new-issue.md          # Standalone command (no skill)
└── skills/                     # Claude Code skills
    ├── git-commit/
    │   ├── SKILL.md
    │   ├── format-staged-files.sh
    │   ├── ensure-newline.sh
    │   └── remove-trailing-whitespace.sh
    ├── update-pr/
    │   ├── SKILL.md
    │   ├── get-current-branch-pr.sh
    │   └── update-pr.sh
    └── create-pr/
        ├── SKILL.md
        └── create-pr-auto.sh
```

**Reference**:
- Claude Code Skills Documentation: https://code.claude.com/docs/en/skills.md
- Plugins Reference: https://code.claude.com/docs/en/plugins-reference.md
- Slash Commands Documentation: https://code.claude.com/docs/en/slash-commands.md
- Example Repository: https://github.com/obra/superpowers

### Phase 2: Script Migration Strategy

#### Files to Migrate to Strata

**A. Claude Code Skills** (`strata/skills/`):

Skills are auto-invoked by Claude based on task context. Each skill includes:
- `SKILL.md` - Skill definition with YAML frontmatter
- Associated shell scripts used by the skill

1. **git-commit skill** (`skills/git-commit/`)
   - SKILL.md
   - format-staged-files.sh
   - ensure-newline.sh
   - remove-trailing-whitespace.sh
   - Used in: .claude/commands/git-commit.md

2. **update-pr skill** (`skills/update-pr/`)
   - SKILL.md
   - get-current-branch-pr.sh
   - update-pr.sh
   - Used in: .claude/commands/update-pr.md

3. **create-pr skill** (`skills/create-pr/`)
   - SKILL.md
   - create-pr-auto.sh
   - Used in: Makefile:26

**B. Shared Scripts** (`strata/scripts/`):

General-purpose scripts not bundled with skills:

1. **new-github-repo.sh** - GitHub repository creation with configuration
   - Generic repository setup tool
   - No dependencies on project structure

2. **setup-claude-container.sh** - Claude container environment setup
   - Used in: Makefile:12
   - Generic Claude Code Docker setup (claude.local/ directory structure is standard)

3. **setup-claude-role.sh** - Claude role configuration
   - Used in: Makefile:15
   - Generic role-based directory setup for Claude Code multi-instance

4. **start-claude-code.sh** - Claude Code startup script
   - Used in: docker-compose.yml:20
   - Generic Claude Code installation and startup script

#### Command and Skill Content

**Commands** are thin wrappers that explicitly invoke skills when users type slash commands (e.g., `/git-commit`).
**Skills** are auto-invoked by Claude based on task context.

Both approaches work together: commands for explicit invocation, skills for automatic activation.

**1. commands/git-commit.md**:
```markdown
---
description: Format staged files and create conventional commit
---

Use the git-commit skill exactly as written
```

**2. commands/update-pr.md**:
```markdown
---
description: Update PR title and description from commit history
---

Use the update-pr skill exactly as written
```

**3. commands/create-pr.md**:
```markdown
---
description: Create draft pull request with automatic title
---

Use the create-pr skill exactly as written
```

**4. commands/new-issue.md**:
This is a standalone command (not a skill wrapper). Copy the existing content from .claude/commands/new-issue.md as-is to strata/commands/new-issue.md.

**5. .claude-plugin/plugin.json**:
```json
{
  "name": "strata",
  "description": "Shared shell scripts, commands, and skills for development workflows",
  "version": "1.0.0",
  "author": {
    "name": "x7c1",
    "email": ""
  },
  "homepage": "https://github.com/x7c1/strata",
  "repository": "https://github.com/x7c1/strata",
  "license": "MIT",
  "keywords": ["skills", "scripts", "git", "pr", "workflow", "automation"]
}
```

**6. .claude-plugin/marketplace.json**:
```json
{
  "name": "strata-marketplace",
  "description": "Marketplace for strata development workflows plugin",
  "owner": {
    "name": "x7c1",
    "email": ""
  },
  "plugins": [
    {
      "name": "strata",
      "description": "Shared shell scripts, commands, and skills for development workflows",
      "version": "1.0.0",
      "source": "./",
      "author": {
        "name": "x7c1",
        "email": ""
      }
    }
  ]
}
```

**7. skills/git-commit/SKILL.md**:
```markdown
---
name: git-commit
description: Format staged files and create git commit with conventional commit message
---

# Git Commit Skill

Analyzes staged changes and automatically creates a git commit with a properly formatted conventional commit message.

## Instructions

1. Run format-staged-files.sh to format staged files:
   - Removes trailing whitespace from text files (except markdown)
   - Ensures files end with newline characters
   - Re-stages modified files
2. Analyze git diff --cached to understand changes
3. Generate conventional commit message (type(scope): description)
4. Execute git commit

## Usage

```bash
bash format-staged-files.sh
```

The script will:
- Process all staged files
- Update formatting as needed
- Report modified files
```

**8. skills/update-pr/SKILL.md**:
```markdown
---
name: update-pr
description: Update current branch's pull request title and description based on commit history
---

# Update PR Skill

Identifies the current branch's pull request and updates its title and description based on recent commit history.

## Instructions

1. Use get-current-branch-pr.sh to find PR number for current branch
2. Analyze commit history to understand changes
3. Generate appropriate title (max 60 characters) and description
4. Use update-pr.sh to update the PR

## Usage

Get current PR:
```bash
bash get-current-branch-pr.sh
```

Update PR:
```bash
bash update-pr.sh <pr_number> <title> <description> [labels]
```

## Notes

- Title must not exceed 60 characters
- Description must not contain "Files Added", "Files Modified", "Generated with" sections
```

**9. skills/create-pr/SKILL.md**:
```markdown
---
name: create-pr
description: Create draft pull request from current branch with automatic title based on first commit date
---

# Create PR Skill

Creates a draft pull request for the current branch with title derived from the first commit date.

## Instructions

1. Verify not on main branch
2. Check for uncommitted changes
3. Push current branch to remote
4. Get first commit date from branch history
5. Create draft PR with title "since YYYY-MM-DD"

## Usage

```bash
bash create-pr-auto.sh
```

The script will:
- Validate current branch
- Push to origin with upstream tracking
- Create draft PR automatically
- Return PR URL
```

#### Migration Steps

**Step 1: Populate strata repository with scripts, commands, and skills**
1. Navigate to `vendor/strata/` directory
2. Create directory structure:
   ```bash
   mkdir -p .claude-plugin
   mkdir -p scripts
   mkdir -p commands
   mkdir -p skills/git-commit
   mkdir -p skills/update-pr
   mkdir -p skills/create-pr
   ```
3. Create plugin configuration:
   - **.claude-plugin/plugin.json** (content above)
   - **.claude-plugin/marketplace.json** (content above)
4. Copy shared scripts from `../../scripts/` to `scripts/`:
   - new-github-repo.sh
   - setup-claude-container.sh
   - setup-claude-role.sh
   - start-claude-code.sh
5. Create command files:
   - **commands/git-commit.md** (skill wrapper - content above)
   - **commands/update-pr.md** (skill wrapper - content above)
   - **commands/create-pr.md** (skill wrapper - content above)
   - **commands/new-issue.md** (standalone command - copy from ../../.claude/commands/new-issue.md)
6. Copy and organize skill files:
   - **skills/git-commit/**:
     - Create SKILL.md (content above)
     - Copy format-staged-files.sh from ../../scripts/
     - Copy ensure-newline.sh from ../../scripts/
     - Copy remove-trailing-whitespace.sh from ../../scripts/
   - **skills/update-pr/**:
     - Create SKILL.md (content above)
     - Copy get-current-branch-pr.sh from ../../scripts/
     - Copy update-pr.sh from ../../scripts/
   - **skills/create-pr/**:
     - Create SKILL.md (content above)
     - Copy create-pr-auto.sh from ../../scripts/
7. Commit changes in strata repository with message: "Add shared scripts, commands (4), skills (3), and plugin configuration (.claude-plugin)"
8. Push to strata repository

**Step 2: Update kuumu repository**
1. Navigate back to kuumu repository root
2. Update submodule reference to include the new strata commit:
   ```bash
   cd /projects/developer
   git add vendor/strata
   ```
3. Delete migrated files from local directories:
   - From `scripts/` (10 scripts):
     - create-pr-auto.sh
     - ensure-newline.sh
     - format-staged-files.sh
     - get-current-branch-pr.sh
     - new-github-repo.sh
     - remove-trailing-whitespace.sh
     - update-pr.sh
     - setup-claude-container.sh
     - setup-claude-role.sh
     - start-claude-code.sh
   - From `.claude/commands/` (3 generic commands):
     - git-commit.md
     - update-pr.md
     - new-issue.md
   - **Keep in .claude/commands/** (2 project-specific commands):
     - build-workspaces.md
     - read-logs.md
4. Update all path references (see Phase 3)
5. Test that all scripts and skills work from new location

#### Scripts Remaining in `scripts/` (Project-Specific)

The following scripts will remain in `scripts/` due to project-specific dependencies:

1. **download-fonts.sh** - Font download automation
   - Used in: package.json:23
   - Depends on: scripts/font-config.json (project-specific font configuration)
   - Hardcoded path: frontend/apps/layouter-demo/public/fonts

2. **install-ubuntu-deps.sh** - System dependencies installer
   - Used in: Dockerfile:12, .github/workflows/ci.yml:55,119
   - Contains Tauri-specific dependencies (libgtk-3-dev, libwebkit2gtk-4.1-dev, etc.)
   - Project-specific package list

### Phase 3: Path Updates

**Makefile**:
- Line 12: `./scripts/setup-claude-container.sh` → `./vendor/strata/scripts/setup-claude-container.sh`
- Line 15: `./scripts/setup-claude-role.sh` → `./vendor/strata/scripts/setup-claude-role.sh`
- Line 26: `./scripts/create-pr-auto.sh` → `./vendor/strata/skills/create-pr/create-pr-auto.sh`

**docker-compose.yml**:
- Line 20: `/projects/${ROLE}/scripts/start-claude-code.sh` → `/projects/${ROLE}/vendor/strata/scripts/start-claude-code.sh`

**Commands and Skills**:
- .claude/commands/git-commit.md → DELETE (replaced by vendor/strata/commands/git-commit.md + skills/git-commit/)
- .claude/commands/update-pr.md → DELETE (replaced by vendor/strata/commands/update-pr.md + skills/update-pr/)
- .claude/commands/new-issue.md → DELETE (replaced by vendor/strata/commands/new-issue.md)
- .claude/commands/build-workspaces.md → KEEP (project-specific)
- .claude/commands/read-logs.md → KEEP (project-specific)
- Commands from vendor/strata/commands/ will be available as slash commands
- Skills will be auto-invoked by Claude from vendor/strata/skills/

**Script internal references** (already using relative paths):
- format-staged-files.sh uses `$SCRIPT_DIR/ensure-newline.sh` and `$SCRIPT_DIR/remove-trailing-whitespace.sh`
- These will work as-is since all three files are in the same directory (skills/git-commit/)

**Note**: No symlinks will be maintained. All references will be updated directly to ensure clarity and avoid confusion.

### Phase 4: Documentation

Add comprehensive submodule documentation to README.md:

**New Section: "Git Submodules and Shared Resources"**

Add to README.md:

**Cloning with submodules**:
```bash
git clone --recurse-submodules https://github.com/x7c1/kuumu.git
```

**Initializing submodules in existing clones**:
```bash
git submodule update --init --recursive
```

**Updating submodules to latest version**:
```bash
git submodule update --remote vendor/strata
```

**Strata as Claude Code Plugin**:
The strata submodule is configured as a Claude Code plugin, providing shared scripts, commands, and skills.

**Shared Resources from Strata**:
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

**Usage**:
- **Commands**: Explicitly invoke with `/git-commit`, `/update-pr`, `/create-pr`, or `/new-issue`
- **Skills**: Automatically invoked by Claude Code based on context (git-commit, update-pr, create-pr)

**Troubleshooting**:
- Empty vendor/strata directory → Run `git submodule update --init --recursive`
- Skills not available → Restart Claude Code or check vendor/strata/skills/ exists
- Script permission errors → Run `chmod +x vendor/strata/scripts/*.sh vendor/strata/skills/*/*.sh`

### Phase 5: Testing & Validation

**Local Testing**:
- Test Makefile targets:
  - `make pr` (uses create-pr-auto.sh from skills/create-pr/)
  - `make claude-setup` (uses setup-claude-container.sh from strata/scripts/)
  - `make setup-role` (uses setup-claude-role.sh from strata/scripts/)
- Test slash commands (explicit invocation):
  - `/git-commit` → Should invoke git-commit skill
  - `/update-pr` → Should invoke update-pr skill
  - `/create-pr` → Should invoke create-pr skill
  - `/new-issue` → Should start new issue planning process
- Test Claude Code skills (auto-invocation):
  - Create staged changes and ask Claude to commit → Should invoke git-commit skill
  - Ask Claude to update PR → Should invoke update-pr skill
  - Ask Claude to create PR → Should invoke create-pr skill
- Verify skills are listed when asking "What skills are available?"
- Verify scripts execute correctly from new locations

**Docker Environment Testing**:
- Test Docker build: `docker compose build`
- Test Docker container startup with: `make claude-run` (uses start-claude-code.sh from strata/scripts/)
- Verify Claude Code installation and startup works correctly
- Confirm skills are available within Docker container
- Confirm project-specific scripts still work (download-fonts.sh, install-ubuntu-deps.sh)

**CI/CD Testing**:
- Verify GitHub Actions workflow completes successfully
- Confirm all CI steps that use scripts pass
- Verify CI can access submodule scripts

**Submodule Testing**:
- Test fresh clone with `--recurse-submodules`
- Test `git submodule update --init` in existing clone
- Verify vendor/strata directory structure:
  - .claude-plugin/ directory exists with plugin.json and marketplace.json
  - scripts/ directory exists with 4 scripts
  - commands/ directory exists with 4 command files (git-commit.md, update-pr.md, create-pr.md, new-issue.md)
  - skills/ directory exists with 3 skill directories
  - Each skill has SKILL.md and associated scripts
- Test script permissions (should be executable)
- Test that commands are discoverable (check `.claude/commands/` or equivalent)

## Timeline Estimate

- Phase 1 (Submodule Setup): 2 points
- Phase 2 (Script Migration): 3 points
- Phase 3 (Path Updates): 5 points
- Phase 4 (Documentation): 2 points
- Phase 5 (Testing & Validation): 3 points

Total: 15 points

## Success Criteria

- x7c1/strata is successfully added as a submodule at vendor/strata
- Strata repository structure created with .claude-plugin/, scripts/, commands/, and skills/ directories
- Plugin configuration files created:
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
- 10 scripts migrated to appropriate locations in strata
- 4 slash commands created:
  - commands/git-commit.md (skill wrapper)
  - commands/update-pr.md (skill wrapper)
  - commands/create-pr.md (skill wrapper)
  - commands/new-issue.md (standalone command)
- 3 Claude Code skills created with SKILL.md files:
  - git-commit skill with format-staged-files.sh and dependencies
  - update-pr skill with get-current-branch-pr.sh and update-pr.sh
  - create-pr skill with create-pr-auto.sh
- All script references in Makefile and docker-compose.yml updated
- 3 generic .claude/commands/ files deleted (git-commit.md, update-pr.md, new-issue.md)
- 2 project-specific .claude/commands/ files kept (build-workspaces.md, read-logs.md)
- Slash commands work: `/git-commit`, `/update-pr`, `/create-pr`, `/new-issue`
- Skills are auto-invoked by Claude Code when appropriate
- Docker build completes successfully
- CI/CD pipeline runs without errors
- README.md includes comprehensive submodule, commands, and skills documentation
- New contributors can clone and set up the repository following documented steps
- `What skills are available?` command shows the 3 migrated skills

## Notes

- This migration should be done carefully to avoid breaking existing workflows
- Consider creating a branch for this work to test changes before merging
- May need to coordinate with other repositories that will use strata
- Submodule commit SHA should be pinned in this repository for reproducibility
- Strata is configured as a Claude Code plugin via .claude-plugin/ directory (plugin.json and marketplace.json)
- Skills and commands will be automatically discovered by Claude Code from vendor/strata/
- Skills can be tested by asking Claude to perform tasks matching the skill descriptions
- Claude Code may need to be restarted after skills are first added to the submodule
- The plugin configuration allows strata to be used as a standard Claude Code plugin in any repository

## Open Questions

None. All scripts have been analyzed and categorized. Migration plan is ready for execution.
