# Architecture Decision Record: GitHub CLI Installation Strategy

## Context
The automated PR workflow requires GitHub CLI (gh) to be available in the Docker development environment. We need to decide when and how to install GitHub CLI to ensure it's reliably available when needed.

## Decision Drivers
- Reliability: GitHub CLI must be available when `make pr` is executed
- Performance: Minimize delays during PR creation process
- Maintainability: Simple setup and troubleshooting
- Consistency: Predictable behavior across different environments
- Resource efficiency: Balance between convenience and resource usage

## Considered Options

### Option 1: Install during Docker build (Dockerfile)
- Install GitHub CLI as part of the Docker image build process
- CLI becomes part of the base image

### Option 2: Install at container startup (runtime)
- Check and install GitHub CLI when container starts
- Use volume persistence for the installed binary

### Option 3: Install on demand (make pr execution)
- Check for GitHub CLI existence when `make pr` is called
- Install if not present, with caching mechanism

### Option 4: Install to shared directory with PATH modification
- Install to `claude.local/shared/bin/` directory
- Modify PATH to include the shared binary location

## Decision
**Chosen Option: Install during Docker build (Dockerfile)**

We will install GitHub CLI as part of the Docker image build process using the official GitHub CLI APT repository.

## Rationale

### Pros of Chosen Option
- **Reliability**: GitHub CLI is guaranteed to be available in every container
- **Performance**: Zero installation delay during `make pr` execution
- **Simplicity**: No complex installation scripts or PATH management required
- **Consistency**: Same version across all environments and team members
- **Standard practice**: Follows Docker best practices for development tools
- **No permission issues**: Installed with proper system permissions during build

### Cons of Chosen Option
- **Image size increase**: Approximately 50MB addition to Docker image
- **Version updates**: Requires image rebuild to update GitHub CLI version
- **Build time**: Slightly longer Docker build process

### Why Other Options Were Rejected

#### Option 2: Runtime Installation
- **Complexity**: Requires volume mounting and PATH management
- **Startup delay**: Container initialization becomes slower
- **Permission issues**: Runtime installation can face permission challenges

#### Option 3: On-demand Installation  
- **User experience**: Delays PR creation with installation process
- **Error prone**: Network issues during PR creation can cause failures
- **Complexity**: Requires caching and error handling logic

#### Option 4: Shared Directory Installation
- **PATH complexity**: Requires environment variable management
- **Permission issues**: Directory permissions and execution rights complexity
- **Dependency problems**: System libraries may not be available in shared directory context
- **Debugging difficulty**: PATH ordering and binary location issues
- **Team consistency**: Different setup procedures can lead to environment inconsistencies

## Consequences

### Positive
- `make pr` command executes immediately without installation delays
- Consistent GitHub CLI version across all development environments
- Simplified troubleshooting (CLI is always available at system level)
- No need for complex installation scripts or environment setup

### Negative
- Docker image size increases by ~50MB
- GitHub CLI version updates require Docker image rebuild
- Cannot easily test with different GitHub CLI versions

### Mitigation Strategies
- Use multi-stage Docker builds to minimize final image size if needed
- Document GitHub CLI version in Dockerfile for transparency
- Establish process for periodic GitHub CLI version updates

## Notes
- GitHub CLI authentication will still be handled at runtime through volume-mounted configuration
- This decision only affects the installation method, not the authentication or usage patterns
- Future ADRs may address GitHub CLI configuration and authentication strategies
