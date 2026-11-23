A repository snapshot needs one stable fingerprint that incorporates all of its files. Adding those same files in a different order should leave the root digest unchanged.

Implement `RepoHashTree`, an in-memory <span data-glossary="merkle-tree">Merkle-style hash tree</span>.

## Requirements

- `set_file(path, content)` stores or replaces one file.
- `delete_path(path)` removes a file or directory and returns whether anything was deleted.
- `root_hash()` returns a deterministic hash for the whole tree.
- File order must not change the root hash.
- Directory hashes must depend on sorted child names, child types, and child hashes.
- Reject empty paths, `..` traversal, and file/directory conflicts on **both** `set_file` and `delete_path` (raise `ValueError` for invalid paths).
- After deleting a leaf file, **empty intermediate directories may remain** and still contribute to the directory hash of their parent. Automatic pruning occurs only when the caller deletes that directory path. Deleting a directory path removes that subtree entry from its parent.
- Normalize both operations the same way: treat backslashes as `/`, discard empty and `.` segments, and reject every `..` segment before traversal. Leading, repeated, and trailing separators are ignored. A path that normalizes to no segments is invalid. All paths refer to the in-memory tree; host filesystem paths are outside the scope.
- A file can replace an existing file, but can't replace a directory. Traversing through a file is a conflict; deleting an existing file or directory itself is valid. Deleting a missing path returns `False`.

## Example

```python
left = RepoHashTree()
left.set_file("src/app.py", b"print('hi')")
left.set_file("README.md", b"hello")

right = RepoHashTree()
right.set_file("README.md", b"hello")
right.set_file("src/app.py", b"print('hi')")

assert left.root_hash() == right.root_hash()
```

## Constraints

- Keep the tree in memory.
- Use a deterministic stable hash. Avoid process-randomized hashes.
- The classroom hash supports deterministic comparison. Repository authenticity requires a cryptographic hash and a trusted way to verify its root.
- Treat paths as POSIX-style `/` paths after normalization.
- Exact hexadecimal values and a cross-language wire format aren't prescribed. Consistently include file content and normalized path, plus sorted directory child names, types, and digests. Different stable hash implementations do not need to produce identical roots.
