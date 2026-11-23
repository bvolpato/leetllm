Repository cleanup often turns up copies whose names differ but whose contents are identical. Group those files deterministically, and reject any supplied path that's malformed.

Implement `find_duplicate_files(files)`.

## Requirements

- Input is a <span data-glossary="hash-map">dictionary</span> from path to text content.
- Return only duplicate groups with at least two paths.
- Sort paths inside each group.
- Sort groups by their first path.
- Raise `ValueError` if any path is invalid: an empty path or a path segment equal to `""`, `"."`, or `".."` after splitting on `/` (covering empty paths, `.`, `..`, repeated slashes, and trailing slashes such as `""`, `../secret`, `src//app.py`, `src/./app.py`, `src/`).
- Different paths are distinct files; group by exact content equality.
- Empty file content is valid and can form a duplicate group; only invalid paths are rejected.

## Example

Two paths have the same complete text. The third path is unique and disappears from the result. Empty text still counts as content:

```python
files = {"a.py": "x", "b.py": "x", "c.py": "y"}
assert find_duplicate_files(files) == [["a.py", "b.py"]]
assert find_duplicate_files({"empty-a.py": "", "empty-b.py": ""}) == [
    ["empty-a.py", "empty-b.py"]
]
```

Sorting applies to paths, not to content or insertion order. For `{"z": "x", "b": "y", "a": "y", "c": "x"}`, first form the groups `["z", "c"]` and `["b", "a"]`. Sorting their paths gives `["c", "z"]` and `["a", "b"]`; sorting by the first path then returns `[["a", "b"], ["c", "z"]]`.

## Content identity and path identity

Compare the exact strings. A final newline changes content, so `"x"` and `"x\n"` aren't duplicates. Validation is independent of duplicate detection: `{"only//file": "unique"}` must raise `ValueError` even though it can't form a duplicate group. The function doesn't read a filesystem, resolve symlinks, or repair invalid path segments.

## Constraints

- Keep the scan in memory.
- Work only from the input map.
- Make output deterministic.
