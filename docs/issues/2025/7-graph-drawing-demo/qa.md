# Pre-Implementation Q&A

## Questions

1. **Existing project structure**: We need to add a frontend application to the current workspace, maintaining consistency with the existing structure (especially the `frontend/` directory).

2. **Dependency direction**: In the plan, `a->b` is defined as "a depends on b", but this seems opposite to general graph notation. Usually `a->b` means "from a to b". We need to clarify this point in UI display and internal data structures.

3. **Hot reload target**: Algorithm changes triggering hot reload means detecting layout algorithm code changes and automatically re-layouting, right? This is great for developer experience but we need to consider implementation complexity.

4. **Package manager**: We need to confirm and standardize the package manager (npm/yarn/pnpm) used in the existing project.

## Answers

1. That's correct. Please refer to other projects in apps for vite.config.ts writing style.

2. "From a to b" is the same as "a depends on b", isn't it?

3. That's a Vite feature so no problem.

4. We'll standardize on npm.

## Clarification

Point 2: The interpretation of `a->b` as "a depends on b" is correct. The understanding was unclear initially.
