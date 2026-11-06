# Agent guidelines

SlugNav is a four-person UCSC CSE 115A project. Favor solutions the whole team
can understand and maintain.

## Understand the task

- Read the relevant files before changing them. Use `README.md` for setup and
  the sprint/release plans when scope or task ownership matters.
- Check what exists on the current branch. Plans describe intended work, not
  necessarily completed features.
- For larger changes, briefly explain the approach first. Ask when missing
  information would materially change the result; handle routine choices yourself.

## Keep changes simple

- Make the smallest complete change that solves the task. Avoid unrelated
  cleanup, extra features, and abstractions for hypothetical future needs.
- Follow existing conventions and reuse existing code and dependencies.
  Explain why a new dependency or major design change is necessary.
- Prefer clear names and straightforward code. Use comments to explain decisions
  that would otherwise be hard to understand.
- Check current official documentation when unsure about an API or setup step.
- Keep documentation useful and concise. Update it when behavior changes.

## Work carefully with Git

- Check the branch and working tree before editing. Preserve other people's
  changes; do not reset, discard, or overwrite unrelated work.
- Normally work on a feature branch and use a PR into `main`, unless the user
  requests a particular branch.
- Leave changes uncommitted unless explicitly asked to commit. Pushes, merges,
  deployments, and changes to shared services need authorization for that action.
- Keep local environment files, credentials, dependencies, and generated output
  out of commits. Review the files being included rather than staging everything.

## Privacy and data security

- Enforce database security with Supabase Row-Level Security (RLS) on all tables;
  never rely on frontend UI checks alone to restrict data access.
- Student account data and schedules are private by default; scope queries and
  policies to the authenticated owner (`auth.uid() = user_id`).
- Protect private user data: use synthetic data in tests and examples, keep
  secrets out of code and logs, and never weaken access controls to pass a test.

## Verify and hand off

- Use the project's existing checks and tests. Choose checks relevant to the
  change; add regression coverage for meaningful behavior changes.
- For documentation-only edits, check accuracy, links, and formatting. An app
  build is unnecessary.
- Review the final diff. Report what changed, what was checked, and any remaining
  limitations or manual steps. Do not claim checks passed if they were not run.

Keep this file focused on lasting team conventions. Remove outdated guidance
instead of accumulating task history and one-off instructions.
