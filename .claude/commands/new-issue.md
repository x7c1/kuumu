# Start New Issue Planning

Initiates the planning process for any development task including new features, bug fixes, refactoring, or structural changes.

## Usage
```
/new-issue
```

## Process
1. Conduct requirements interview to understand the task
2. Determine appropriate directory name with sequential numbering
3. Create project directory structure in `docs/issues/{year}/{number}-{descriptive-name}/`
4. Create initial drafts of planning document (`plan.md`) and architecture decision record (`adr.md`)
5. Present drafts to user for review and feedback
6. Make requested modifications to the documents
7. Mark the planning documents as complete after user approval

---

Starting planning process for a new development task.

Please provide details about the work you want to implement or fix:

1. **What type of work do you want to perform?**
   - New feature addition, bug fix, refactoring, structural changes, etc.

2. **What is the specific content or purpose?**
   - Problems to solve or features to implement

3. **What is the current situation or challenge?**
   - Issues with existing code or constraints

4. **Are there any technical requirements or constraints?**
   - Compatibility with existing systems, performance requirements, etc.

5. **What is the priority and implementation schedule?**

Based on this information, I will create a project directory structure in `docs/issues/{current_year}/` with appropriate numbering and descriptive name.

First, I will:
1. Determine the current year
2. Create the year directory if it doesn't exist
3. Check existing items in that year's directory to determine the next sequential number (starting from 1 for each year)
4. Create project directory with format `{number}-{descriptive-name}`
5. Create initial drafts of `plan.md` and `adr.md` within the project directory
6. Present the drafts for your review and incorporate any requested changes
7. Mark the documents as complete once you approve the final versions

## Document Structure
Each planning project will contain:
- `plan.md`: Main planning document with requirements, implementation plan, and timeline
- `adr.md`: Architecture Decision Record documenting key technical decisions and rationale (optional for complex projects)

**Important**: When `adr.md` exists, the `plan.md` must reflect and be consistent with the decisions made in the ADR. 
Any technical approaches, implementation methods, or architectural choices documented in the ADR should be accurately represented in the planning document to avoid contradictions.
