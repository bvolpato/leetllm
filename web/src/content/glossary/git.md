---
title: Git
importance: 94
---
A **Git** repository records snapshots of a project's files and the history connecting those snapshots. Git is a distributed version-control system: a normal clone receives history reachable from the fetched references, rather than only the original author's current files. Shallow and partial clones deliberately limit downloaded history or objects. Each commit identifies a particular recorded state, and a branch is a movable reference to a commit.

Git tracks file content that has been added and committed. It doesn't automatically preserve untracked datasets, shell aliases, local virtual environments, installed hooks, running processes, or secret values. A clean clone is therefore a useful reproducibility check: if the project only works after copying hidden laptop state, its repository doesn't yet contain a complete setup schema.

## What actually travels

Tracked source code, small evaluation test cases, dependency manifests, and documented setup commands travel with the repository. An ignored `.env` file, `.venv` directory, and `.git/hooks/pre-commit` installation don't. Record the required variable names without values, commit hook source plus an installer, and rebuild the environment on the receiving machine.


## Example

```bash
git add eval/access_requests.jsonl scripts/run_eval.sh
git commit -m "Track the reproducible evaluation test case"
git status --short
```

A teammate can recover those committed files through a clone. They still need to create their own virtual environment and provide their own credentials.

## Why it matters here

Every later model experiment needs evidence connecting code, data schemas, and results to a recoverable project state. Git supplies the history, but reproducibility also depends on explicitly tracking the inputs Git doesn't infer.

## Related terms

- [Reproducible environment](glossary://reproducible-environment)
- [Dependency lockfile](glossary://dependency-lockfile)
- [Git LFS](glossary://git-lfs)
- [Pre-commit hook](glossary://pre-commit-hook)
