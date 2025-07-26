# Update PR

Identify the current branch's pull request and update its title and description based on commit history.

## Usage

```
/update-pr
```

## Description

This command will:
- Check for staged but uncommitted changes with `git diff --cached`
- If staged changes exist, automatically run `/git-commit` to commit them first
- Push the committed changes to the remote repository with `git push`
- Use `./scripts/get-current-branch-pr.sh` to identify the pull request associated with the current branch
- Analyze the commit history of the branch to understand the changes
- Generate an appropriate title and description based on the commits
- Select and apply appropriate labels based on the type and scope of changes
- Update the pull request with the generated title, description, and labels

## Title Generation

The title will be generated within 60 characters based on:
- Primary type of changes (feat, fix, docs, etc.)
- Main scope or component affected
- Most concise description of the key change

## Description Generation

If an existing description exists, it will be updated and enhanced rather than completely replaced:
- Preserve existing content that is still relevant
- Add new information based on recent commits
- Update outdated sections with current information
- Maintain the overall structure and formatting

If no description exists, a new one will be created including:
- Summary of changes made
- List of key commits and their purposes
- Any breaking changes or important notes
- Test plan if applicable

## Label Assignment

Labels will be automatically applied only when applicable:
- `enhancement` - for feat/refactor/perf commits
- `bug` - for fix commits  
- `documentation` - for docs commits

No labels will be applied for chore, test, or other commit types.

## Prerequisites

- Current branch must have an associated pull request
- GitHub CLI (`gh`) must be installed and authenticated
- Must be in a git repository with a remote origin

## Examples

For a branch with commits like:
- `feat(auth): add OAuth2 integration`
- `fix(auth): handle token refresh errors`
- `docs(auth): update authentication guide`

Would generate:
- **Title**: `feat(auth): add OAuth2 integration` (34 characters)
- **Description**: Summary of OAuth2 implementation, token refresh fixes, and documentation updates
