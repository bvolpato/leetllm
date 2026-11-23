# Codebase Symbol Index

When you're looking for a function in an unfamiliar codebase, a quick prefix search can narrow the hunt to the right file and line. Build a small in-memory index for that job.

Implement `SymbolIndex`.

## Requirements

- `update_file(path, content)` <span data-glossary="parsing">extracts symbols</span> from one file and replaces any old symbols for that path.
- `remove_file(path)` removes that file's symbols. If the path isn't indexed, it's a no-op.
- `search(prefix, limit=10)` returns matching symbols sorted by:
  1. Exact match first (case-insensitive name equal to prefix),
  2. Symbol `name` case-insensitively,
  3. File `path` alphabetically,
  4. `line` number in ascending order.
- A symbol is a dictionary with `name` (str), `path` (str), and `line` (1-indexed int).
- Extract symbols from lines whose first non-whitespace token is `def`, `class`, `function`, `const`, `let`, or `var` (optional leading indentation is allowed). The symbol name is the identifier immediately following the keyword.
- Prefix matching is case-insensitive.
- An empty prefix returns `[]`. A nonpositive integer `limit` also returns `[]`.
- Declarations in this exercise use ASCII identifiers: `[A-Za-z_][A-Za-z0-9_]*`. Keywords are lowercase. The line-based scan recognizes declarations at the start of a line; decorators, `async def`, `export const`, destructuring, and full language syntax require a parser.
- Returned dictionaries are snapshots; changing a search result mustn't change the index.

## Example

Updating a file indexes its declarations and allows case-insensitive prefix lookup.

```python
index = SymbolIndex()
index.update_file("src/cache.py", "class Cache:\n    pass\ndef clear_cache():\n    pass")

assert index.search("Ca")[0] == {"name": "Cache", "path": "src/cache.py", "line": 1}

index.update_file("src/cache.py", "class Store:\n    pass")
assert index.search("cache") == []  # the replaced file must not leave stale symbols
assert index.search("store")[0]["line"] == 1
```

## Constraints

- Keep state in memory.
- Don't use a parser library.
- File updates must remove stale symbols from previous content.
