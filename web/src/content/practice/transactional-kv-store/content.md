Implement `TransactionalKV`, an in-memory key/value store with <span data-glossary="database-transaction">nested transactions</span>. An explicit <span data-glossary="tombstone">tombstone</span> must hide a lower-layer value after a transactional delete.

## Requirements

- `set(key, value)` writes a value.
- `get(key)` returns the visible value or `None`.
- `None` is a valid stored value and must shadow lower layers, even though `get` can't distinguish it from absence.
- `delete(key)` removes the visible value.
- Deleting a missing key is harmless.
- `begin()` opens a transaction layer.
- `commit()` merges the current transaction into its parent layer or the base store.
- `rollback()` discards the current transaction.
- Both control operations close only the innermost layer. An inner commit can still be undone by rolling back its parent.
- Reads inside a transaction must see writes and deletes from that transaction first.
- Deleting a key inside a transaction must hide lower-layer values until rollback or commit.
- Calling `commit()` or `rollback()` without an active transaction raises `ValueError`.

## Example

Nested layers should make deletion and rollback observable:

| Operation | Visible `model` | Reason |
|---|---|---|
| Base `set("model", "fast")` | `"fast"` | Base value exists. |
| Outer `begin(); delete("model")` | `None` | Tombstone hides the base value. |
| Inner `begin(); set("model", "strong")` | `"strong"` | Inner write shadows the tombstone. |
| Inner `rollback()` | `None` | Outer deletion becomes visible again. |
| Outer `rollback()` | `"fast"` | Base value was never deleted. |

The smaller example below demonstrates the write-and-rollback path:

```python
store = TransactionalKV()
store.set("model", "fast")
store.begin()
store.set("model", "strong")
assert store.get("model") == "strong"
store.rollback()
assert store.get("model") == "fast"
```

## Constraints

- Keep it single-process and in memory, with sequential calls and one shared transaction stack.
- Treat values as opaque references. Transactions track `set` and `delete`; they don't undo in-place mutations to returned objects.
- Preserve nested transaction semantics.
- Don't use a database library.
- Distinguish a missing layer entry from an explicit deletion marker.
