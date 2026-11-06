# Automatic Testing and Git Micro-Commit Rules

Whenever you complete a discrete feature, bug fix, refactoring, or enhancement, follow this workflow automatically.

## 1. Validate Changes
- Run relevant unit and integration tests.
- Run the production build.
- Run lint and TypeScript checks when available.
- Fix errors introduced by your changes.
- Never skip validation.

## 2. Git Safety Check
- Run `git status` and inspect existing changes.
- Never overwrite, discard, or stage unrelated user modifications.
- Stage only files modified for the current task.
- Never stage `.env`, credentials, secrets, or sensitive files.

## 3. Automatic Micro-Commit
Only when all relevant validations pass:
- Stage the relevant modified files.
- Create a Git commit automatically.
- Use Conventional Commit naming.

Examples:
- `feat: add student attendance module`
- `fix: resolve payment calculation bug`
- `perf: optimize dashboard loading`
- `refactor: improve authentication middleware`

## 4. Failure Rules
- If tests or builds fail, DO NOT commit.
- Report the failing command and error.
- Never bypass tests or hide failures.
- If validation cannot run, explain why and do not commit.

## 5. Git Restrictions
- Never force push.
- Never run destructive Git commands.
- Never amend existing commits.
- Never commit unrelated changes.
- Never push automatically.

## 6. Final Report
After every completed task, report:
1. Features or bugs addressed.
2. Tests executed and results.
3. Build status.
4. Files staged.
5. Commit message.
6. Commit hash.

IMPORTANT: This workflow is mandatory after every completed discrete development task. Do not wait for the user to request a commit.