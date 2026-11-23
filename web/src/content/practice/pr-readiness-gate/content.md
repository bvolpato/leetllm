An agent can produce a polished diff while tests or approvals are still missing. Build a <span data-glossary="validation-gate">merge-readiness gate</span> that returns the specific blockers before a pull request can satisfy the merge policy.

Implement `pr_blockers(checks, reviews, artifacts, required_checks)`.

## Requirements

- `checks` is a list of dictionaries with `name` and `status`.
- Required <span data-glossary="continuous-integration">check</span> names must exist and have status `"passed"`.
- Missing checks produce `missing_check:<name>`.
- Failing checks produce `failing_check:<name>` (any status other than `"passed"` counts as failing for a required check).
- Checks whose names are not in `required_checks` are ignored, even if they failed.
- If multiple checks share a name, the last entry in `checks` wins (in list order).
- At least one review with state `"approved"` is required.
  Missing approval produces `approval_required`.
- Any review with state `"changes_requested"` blocks merge and produces
  `changes_requested` (even when an approval is also present).
- Artifacts must contain `"diff"` and `"tests"`.
  Missing required artifacts produce `missing_artifact:diff` and
  `missing_artifact:tests` respectively.
- Return blockers sorted lexicographically.
- Check names, artifact names, and review states use exact, case-sensitive strings. Extra artifact names and other review states are ignored.

Review entries are evaluated directly as given: any `"changes_requested"` entry blocks merge even if an `"approved"` entry is also present.

## Example

One passing required check, one approval, and both required artifacts leave no blockers:

```python
checks = [{"name": "test", "status": "passed"}]
reviews = [{"user": "u", "state": "approved"}]
assert pr_blockers(checks, reviews, ["diff", "tests"], ["test"]) == []
```

## Constraints

- Keep the result deterministic.
- Leave inputs untouched.
