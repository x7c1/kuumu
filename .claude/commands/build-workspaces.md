# Build Workspaces Command

## Summary
Execute `npm run build --workspaces` and fix any errors that occur during the build process.

## Command
```bash
npm run build --workspaces
```

## Process
- Run `npm run biome:check` to format and lint code
- If there are any warnings from biome, fix them before proceeding
- Run the build command across all workspaces
- If there are any errors, analyze and fix them
- Re-run the build command to verify fixes
- Ensure all workspaces build successfully

## Usage
Use this command when you need to build all workspaces in the monorepo and ensure there are no build errors.
