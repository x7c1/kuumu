# Git Commit

Analyze staged changes and automatically commit with a generated message.

## Usage

```
/git-commit
```

## Description

This command will:
- Run `./scripts/format-staged-files.sh` to format staged files
- Re-stage any modified files with `git add`
- Analyze `git diff --cached` to understand what changes are staged
- Generate a Conventional Commits format commit message
- Automatically execute the commit

## Commit Message Format

Follow Conventional Commits specification:
- Format: `type(scope): description`
- Keep it concise (single line)
- Use lowercase for type and description
- Common types: feat, fix, docs, style, refactor, test, chore
- Scope should match the package/component being changed
- No additional metadata or footers unless specifically requested

## Important Notes

- **NEVER include co-author information, metadata, or footers in commit messages**
- **NEVER add "Generated with Claude Code" or similar footers**
- **ONLY use the simple format: `type(scope): description`**
- **Focus on the main functional change only - do not mention minor formatting or comment updates**

## Examples

- `docs(three-js-layouter-example): update README`
- `feat(models): add validation for TypeId`
- `fix(app): resolve camera positioning issue`
- `chore: update dependencies`
