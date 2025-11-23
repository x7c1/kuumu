# GitHub Repository Creation Script

## Overview

Create a shell script to automate GitHub repository creation with predefined settings and branch protection rules. This eliminates the need to manually configure repository settings through the GitHub web interface.

## Requirements

### Functional Requirements

- Create a shell script `scripts/new-github-repo.sh` that accepts a YAML configuration file path as an argument
- Read repository settings from YAML configuration file
- Use GitHub CLI (`gh`) to create and configure repositories
- Create initial empty files: README.md and .gitignore
- Configure repository settings (from YAML configuration):
  - Visibility (configurable, default: public)
  - Default branch (configurable, default: main)
  - Enable automatic branch deletion after PR merge (configurable, default: true)
  - Merge method settings (configurable):
    - Allow squash merge (default: true)
    - Allow merge commit (default: false)
    - Allow rebase merge (default: false)
  - Labels: Use GitHub's default labels (bug, documentation, enhancement, etc.)
- Apply branch protection rules to the default branch (from YAML configuration):
  - Required approving review count (configurable, default: 1)
  - Require status checks to pass before merging (configurable, default: true)
  - Allow force pushes (configurable, default: false)
  - Enforce rules for administrators (configurable, default: true)

### Technical Requirements

- Use bash for script implementation
- Depend on GitHub CLI (`gh`) for API interactions
- Use a YAML parser (e.g., `yq`) or implement basic YAML parsing in the script
- Provide clear error messages and validation
- Make the script executable with appropriate permissions

#### Script Structure

- Define `main` function at the beginning of the script
- Separate each logical process into dedicated functions
- Define all functions below the `main` function
- Call `main` at the end of the script
- Use descriptive function names that clearly indicate their purpose

### YAML Configuration File Structure

The configuration file should include:
- Repository name (required)
- Repository description (optional)
- Repository visibility (optional, default: public)
- Default branch name (optional, default: main)
- Delete branch on merge (optional, default: true)
- Merge method settings (optional):
  - Allow squash merge (default: true)
  - Allow merge commit (default: false)
  - Allow rebase merge (default: false)
- Branch protection rules (optional):
  - Required approving review count (default: 1)
  - Require status checks (default: true)
  - Allow force pushes (default: false)
  - Enforce admins (default: true)

See `example.yaml` in this directory for a complete example configuration file with all available options and their default values.

## Implementation Plan

### Research and Design Phase

- Research GitHub CLI capabilities for repository creation
  - `gh repo create` command options
  - `gh api` endpoints for branch protection rules
  - Repository settings API
- Design YAML configuration file schema
  - Define required and optional fields
  - Create example configuration file (see `example.yaml` for reference)
- Identify YAML parsing approach
  - Evaluate available tools (yq, Python, etc.)
  - Choose implementation method

### Script Implementation

- Create `scripts/new-github-repo.sh` skeleton
  - Add shebang and basic structure
  - Define `main` function at the beginning
  - Implement argument parsing in `main`
  - Add usage/help message function
  - Add script invocation (`main "$@"`) at the end
- Implement YAML configuration parsing function(s)
  - Create `parse_yaml` or similar function
  - Read and validate configuration file
  - Extract repository settings (name, description, visibility, etc.)
  - Extract merge method settings
  - Extract branch protection settings
  - Apply default values for optional fields
  - Handle missing or invalid fields
- Implement repository creation function
  - Create `create_repository` or similar function
  - Use `gh repo create` with appropriate flags
  - Handle errors and edge cases
  - Verify repository was created successfully
- Implement initial files creation function
  - Create `create_initial_files` or similar function
  - Generate empty README.md
  - Generate empty .gitignore
  - Commit and push initial files
- Implement repository settings configuration function
  - Create `configure_repository_settings` or similar function
  - Enable automatic branch deletion after PR merge (based on YAML)
  - Configure merge methods (squash, merge commit, rebase) (based on YAML)
  - Set any additional repository options from YAML
- Implement branch protection rules function
  - Create `apply_branch_protection` or similar function
  - Use `gh api` to configure default branch protection
  - Set required approving review count (from YAML)
  - Enable required status checks (from YAML)
  - Configure force push settings (from YAML)
  - Enforce rules for administrators (from YAML)
  - Verify protection rules were applied

### Testing and Validation

- Create test YAML configuration file (can use `example.yaml` as a base)
- Test script with test configuration
  - Verify repository is created correctly with specified settings
  - Verify initial files exist
  - Verify merge method settings are applied correctly
  - Verify branch protection rules are applied correctly
  - Test with custom configuration values
  - Test with minimal configuration (using defaults)
  - Test error handling with invalid inputs
- Document any limitations or known issues
- Create usage examples in documentation

### Documentation

- Add inline comments to the script
- Example YAML configuration file (`example.yaml`) is already provided
- Document script usage in project README or separate doc
  - Installation requirements (gh, yq if needed)
  - Usage examples (referencing `example.yaml`)
  - Configuration file format
  - Troubleshooting common issues

## Timeline

Estimated effort in points:

- Research and Design Phase: 2 points
- Script Implementation: 5 points
- Testing and Validation: 2 points
- Documentation: 1 point

Total: 10 points

## Success Criteria

- Script successfully creates GitHub repositories from YAML configuration
- All specified settings and branch protection rules are applied automatically
- Script provides clear error messages for invalid inputs
- Documentation is complete and includes usage examples
- Script reduces manual repository setup time significantly
