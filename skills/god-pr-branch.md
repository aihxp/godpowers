---
name: god-pr-branch
description: |
  Create a clean PR branch by filtering out .godpowers/ commits. Useful when
  shipping to a public repo where reviewers don't need the planning artifacts.

  Triggers on: "god pr branch", "/god-pr-branch", "clean PR", "PR ready",
  "filter planning"
---

# /god-pr-branch

Create a code-only branch for PR review.

## When to use

- Open source repo where .godpowers/ shouldn't ship
- Working repo separate from planning repo
- PR reviewers complaining about noise

## Process

1. From current branch, identify commits since main
2. For each commit:
   - If it touches code only: cherry-pick to new branch
   - If it touches both code and .godpowers/: split. Keep the code commit;
     drop the .godpowers/ commit (already exists on the original branch).
   - If it touches only .godpowers/: skip
3. Create new branch `pr/<original-branch-name>`
4. Push to remote
5. Show the user the PR URL to create

## Output

```
PR branch created: pr/feature-x
Commits: N (filtered from M originals)
Push: success

Create PR: https://github.com/<repo>/compare/main...pr/feature-x

Original branch (with planning artifacts): feature-x
PR branch (code only): pr/feature-x
```

## Have-Nots

- PR branch contains .godpowers/ files (filter failed)
- PR branch is missing code changes that the original had
- Force-pushed over an existing PR branch (must be a new branch each run)
