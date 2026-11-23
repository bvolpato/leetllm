Two changes can target the same file, and one may be based on text that has already changed. Check every expected slice before applying anything, so a conflict leaves the original files untouched.

Implement `apply_patches(files, patches)` with <span data-glossary="time-of-check-time-of-use">optimistic conflict checks</span>.

## Requirements

- `files` maps file path to text.
- Each patch is `(path, start, end, expected_old_text, replacement)`.
- Validate all patches before mutating anything.
- Raise `ValueError` for invalid ranges (`start < 0`, `end < start`, or `end > len(text)`), missing files, overlapping patches in the same file, and expected-text mismatches.
- Adjacent ranges that only touch at an endpoint are allowed. Multiple empty inserts at the same offset are allowed and preserve input order. Order by `(start, end)` stably within each file; an insert at a replacement's start appears before the replacement, and an insert at its end appears after.
- An empty insert strictly inside a nonempty patch range is an overlap conflict. An insertion must have `expected_old_text=""`.
- Apply patches from the end of each file so offsets stay stable.
- Return a new dictionary and leave input untouched.

## Example

The first patch succeeds without changing `files`. The stale patch then fails against the same input, which remains untouched.

```python
files = {"app.py": "print('old')\n"}
patches = [("app.py", 6, 11, "'old'", "'new'")]
assert apply_patches(files, patches)["app.py"] == "print('new')\n"
assert files["app.py"] == "print('old')\n"

try:
    apply_patches(files, [("app.py", 6, 11, "'stale'", "'new'")])
except ValueError:
    pass
else:
    raise AssertionError("expected stale patch conflict")

assert files["app.py"] == "print('old')\n"
```

## Constraints

- No diff parser is required.
- Every offset uses the file's original text, so applying one edit leaves the coordinates of the other edits unchanged. Use Python code-point indexes or Java UTF-16 code-unit indexes for the selected language.

## What the expected text proves

Expected text checks a particular slice of the input snapshot. If `"hello!"` replaces an earlier `"hello"`, a patch expecting `"hello"` at `[0, 5)` still matches: the changed suffix is outside its checked range. If you need to reject any change to the file, require an expected whole-file hash or version as a follow-up.

All-or-nothing here means returning a fully built new map or raising without changing the caller's map. The helper operates on in-memory data; filesystem writes and concurrent writers are outside its scope. A later invalid file must prevent the whole call from returning a partially patched result.

For `files={"a": "abc"}`, patches `[("a", 1, 2, "b", "R"), ("a", 1, 1, "", "L"), ("a", 2, 2, "", "E")]` produce `{"a": "aLREc"}`. Both expected slices are checked against the original `abc`; right-to-left application avoids shifting the remaining original offsets. Sorting by start alone is insufficient because an input replacement can precede an insert at that same start.
