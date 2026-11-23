---
title: Continuous integration
aliases: ["CI"]
importance: 88
---
**Continuous integration** runs automated checks against shared source-code changes. A CI worker checks out the proposed repository state, prepares its declared environment, and executes tests, build steps, linters, or evaluation gates before the change is accepted. The useful property isn't that a job has a green icon; it's that another machine reproduced the required checks from tracked project inputs.

Local Git hooks provide quick feedback. Their files may not travel with a repository clone, and a developer can bypass a local pre-commit hook. Running the same evaluation command in CI gives the shared project an independent verification path.

## What a useful check must prove

The job should install from a committed dependency schema, use nonsecret test cases committed to the repository, obtain credentials from the CI platform's secret store when needed, and fail with a nonzero exit status on a real regression. Copying a developer's virtual environment or skipping evaluation when credentials are missing recreates the original hidden-state problem.


## Example

```bash
uv sync --locked
uv run pytest -q
./scripts/run_eval.sh
```

The first command reconstructs declared dependencies. The test command checks behavior. The repository-owned evaluation script verifies the same test case and threshold another developer can run locally.

## Why it matters here

AI projects change code, data processing, prompts, and model-facing behavior. A repeatable shared gate catches missing test cases, dependency drift, broken builds, and measurable quality regressions before those changes become the team's default state.

## Related terms

- [Eval gate](glossary://eval-gate)
- [Dependency lockfile](glossary://dependency-lockfile)
- [Pre-commit hook](glossary://pre-commit-hook)
- [Regression suite](glossary://regression-suite)
