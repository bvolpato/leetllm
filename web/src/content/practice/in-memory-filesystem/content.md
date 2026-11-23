# In-memory Filesystem

For a path like `/docs/readme.md`, each step depends on what the previous step found: a directory can contain the next name, while a file cannot. Model that distinction in a tiny filesystem built as a <span data-glossary="trie">prefix tree</span>.

Each path component belongs to exactly one state: a directory containing named children, or a file containing text. Traversing through a file must fail without changing either state.

## Requirements

- Define `FileSystem`.
- `mkdir(path)` creates directories recursively. Creating an existing directory is a no-op.
- `mkdir` on an existing file raises `NotADirectoryError`.
- `write_file(path, content)` writes or overwrites a file. Parent directory must exist (the root `/` always exists, so `/file` needs no prior `mkdir`).
- Writing to an existing directory raises `IsADirectoryError`; it must not delete that directory's contents.
- `read_file(path)` returns file content.
- `ls(path)` returns sorted child names for a directory, or `[filename]` for a file.
- Missing paths raise `FileNotFoundError`.
- `read_file` on a directory raises `IsADirectoryError`.
- If a path component is a file, operations that would traverse through it
  (including `read_file` and `ls` under that path) raise `NotADirectoryError`.

## Example

```python
fs = FileSystem()
fs.mkdir("/docs")
fs.write_file("/docs/readme.md", "hello")
assert fs.ls("/") == ["docs"]
assert fs.ls("/docs/readme.md") == ["readme.md"]
assert fs.read_file("/docs/readme.md") == "hello"
```

## Constraints

- Use standard-library Python only.
- Paths are nonempty absolute strings beginning with `/`. Components never equal `.` or `..`; you don't need to implement relative paths or parent-directory navigation.
- Normalize repeated slashes and trailing slashes. For example, `/docs//guide/` and `/docs/guide` identify the same path.
- File contents are strings, including the empty string. A trailing slash doesn't force a path to be a directory in this simplified API.
