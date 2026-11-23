When comparing two repository snapshots, a path can be new, removed, unchanged, or still present with different content. Report those changes clearly without treating equal content at a different path as a rename.

Implement `diff_repositories(old_files, new_files)` as a deterministic file-level diff.

## Requirements

- Inputs are dictionaries from path to <span data-glossary="checksum">content hash</span>.
- Return a list of `(status, path)` pairs.
- Status must be `"ADDED"`, `"REMOVED"`, or `"MODIFIED"`.
- Unchanged files must not appear.
- Output must be sorted by path. At most one event is emitted per path, so a secondary status sort never changes order.
- Treat renames as remove plus add.
- Raise `ValueError` for invalid paths with empty segments, `.` segments, or `..` traversal (validate keys in **both** `old_files` and `new_files`).
- Leave `old_files` and `new_files` unchanged.

## Example

`README.md` is present with the same hash in both snapshots, so it produces no row. `src/app.py` changes hash, and `src/test.py` appears only in the new snapshot:

```python
old = {"README.md": "a", "src/app.py": "1"}
new = {"README.md": "a", "src/app.py": "2", "src/test.py": "3"}

assert diff_repositories(old, new) == [
    ("MODIFIED", "src/app.py"),
    ("ADDED", "src/test.py"),
]
```

Decide by path presence before comparing values. An empty string is still a supplied hash label; it doesn't mean that a file is missing.

| Path in old? | Path in new? | Hash comparison | Result |
| --- | --- | --- | --- |
| No | Yes | No old value | `ADDED` |
| Yes | No | No new value | `REMOVED` |
| Yes | Yes | Different | `MODIFIED` |
| Yes | Yes | Equal | No event |

For `old={"old.py": "same"}` and `new={"new.py": "same"}`, predict the output order. It is `[("ADDED", "new.py"), ("REMOVED", "old.py")]`: equal hashes describe content, while path presence determines identity. Sorting follows the path. Validate paths even when their hashes are equal; an unchanged invalid path remains invalid input.

## Constraints

- Keep the implementation deterministic.
- Use the provided content hashes directly.
- Matching content hashes indicate unchanged content only within this exercise; authenticity requires a trusted hash algorithm and trusted snapshot roots.
- Don't try to infer renames unless a follow-up asks for it.
