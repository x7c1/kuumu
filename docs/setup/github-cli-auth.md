# GitHub CLI Authentication Setup

## Initial Setup

1. **Generate Personal Access Token**
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Generate new token with `repo` and `workflow` scopes
   - Copy the token (starts with `ghp_`)

2. **Create GitHub CLI configuration**
   ```bash
   mkdir -p claude.local/shared/.config/gh
   ```

3. **Create hosts.yml file**
   Create `claude.local/shared/.config/gh/hosts.yml`:
   ```yaml
   github.com:
       user: your_github_username
       oauth_token: ghp_your_personal_access_token_here
       git_protocol: https
   ```

4. **Restart container**
   ```bash
   make workspace
   ```

## Usage

Once authenticated, simply run:
```bash
make pr
```

This will:
- Push your current branch to remote
- Create a draft PR with title format "since YYYY-MM-DD"
- Display the PR URL

## Error Conditions

The script will exit with error if:
- Not in a git repository
- GitHub CLI not authenticated
- Currently on main branch
- Uncommitted changes exist
- PR already exists for the branch
- Failed to push to remote
- Could not determine first commit date