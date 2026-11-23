A generated directory may be too noisy to include wholesale, while its manifest still matters. Build an ordered path filter where a later exception can restore one file. The exercise uses a small exact/prefix language with its own matching rules.

Implement `filter_repo_paths(paths, rules)`.

Use this filter for deterministic path selection. Enforce filesystem authorization separately.

## Requirements

- Preserve the original order of kept paths.
- Preserve duplicate candidate paths when they are kept. Inputs are lists of strings.
- Match path and rule text case-sensitively; don't strip or normalize candidate paths.
- Raise `ValueError` for invalid paths with empty segments, `.` segments, or `..` traversal.
- Strip leading and trailing whitespace from each rule before <span data-glossary="parsing">parsing</span>. After strip, blank rules and rules starting with `#` are ignored.
- A rule ending in `/` is a directory **prefix** match: after stripping the trailing `/`, path `p` matches when `p.startswith(dir + "/")`. The bare directory path equal to `dir` (for example path `dist` under rule `dist/`) does **not** match; only paths strictly under that prefix do.
- Otherwise (after optional `!`), the pattern is an **exact full-path** match (`path == pattern`), even if the pattern contains `/` (e.g. `dist/manifest.json`).
- A rule starting with `!` re-includes paths matched by earlier rules (exact file or directory prefix, same match rules as non-negated forms).
- Later matching rules win.
- Each non-blank, non-comment rule body (after stripping a leading `!` and a trailing `/`) must also be a valid path; raise `ValueError` when the rule pattern is invalid (empty segments, `.`, or `..`).

## Example

Directory prefixes remove descendants. A later exact exception restores only the named file:

```python title="ignore-filter-examples.py"
paths = ["src/app.py", "node_modules/lib.js", "dist/app.js"]
rules = ["node_modules/", "dist/"]
assert filter_repo_paths(paths, rules) == ["src/app.py"]

# Exact full-path rules may contain `/`; later rules win (including reincludes).
paths = ["dist/app.js", "dist/manifest.json"]
rules = ["dist/", "!dist/manifest.json"]
assert filter_repo_paths(paths, rules) == ["dist/manifest.json"]
```

The slash matters. Under `dist/`, `dist/app.js` matches, while `dist` and `distance/app.js` remain outside that prefix. Glob expansion is absent: `*.log` matches only a candidate literally named `*.log`.

Track one Boolean per candidate. Start with `ignored = False`, update it for each matching rule, and append the original candidate only after the last rule. For `dist/manifest.json`, the rules `dist/`, `!dist/manifest.json`, `dist/manifest.json` produce ignored states `True`, `False`, `True`, so the file is excluded again.

## Constraints

- No glob engine is required.
- Keep matching deterministic and easy to explain.
- Validate every non-comment rule even when `paths` is empty. Validate every candidate even when an earlier rule would exclude it.
