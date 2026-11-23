# Document Permission Filter

A relevant document can still be the wrong document to show. Apply <span data-glossary="permission-boundary">user permissions</span> before ranking chunks so a high score never overrides an access boundary.

## Requirements

- Define `filter_chunks(chunks, user, k)`.
- Each chunk has `id`, `score`, `visibility`, and optional `tenant`, `groups`, `owner`.
- `visibility == "public"` is visible to everyone.
- `visibility == "tenant"` is visible when <span data-glossary="tenant-isolation">chunk tenant matches user tenant</span>.
- `visibility == "group"` is visible when tenant matches and at least one group overlaps.
- `visibility == "private"` is visible only to the owner.
- Missing tenant or owner identities never authorize a protected chunk.
- Omit chunks with unknown or missing `visibility` to <span data-glossary="fail-closed">fail closed</span>.
- Return selected chunk IDs sorted by score descending, then ID alphabetically.
- Return at most `k` IDs.
- If `k <= 0`, return an empty list.

## Example

```python
chunks = [{"id": "a", "score": 1, "visibility": "public"}]
assert filter_chunks(chunks, {"id": "u", "tenant": "t", "groups": []}, 3) == ["a"]

protected = [{"id": "hidden", "score": 9, "visibility": "tenant"}]
assert filter_chunks(protected, {"id": "u", "tenant": None, "groups": []}, 3) == []
```

## Constraints

- Never return unauthorized chunks.
- Don't mutate input chunks.
- Missing or null group lists count as empty.
- Chunk IDs are unique, case-sensitive ASCII strings; scores are finite numbers and `k` is an integer. Present tenant, owner, user and group identities are nonempty, case-sensitive strings. Group fields contain lists of those strings, `None`, or are absent.
- User IDs are globally unique in this exercise. Private visibility checks ownership alone, even if tenant metadata differs; tenant and group visibility require the tenant check described above.
- Filter all candidates before applying the result limit. If the highest-scoring chunk is denied, a lower-scoring authorized chunk can still fill the slot.

The function receives trusted identity and permission metadata. In a real service, derive the user from authentication and obtain ACLs from an authoritative source. [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) recommends denying access by default and checking permissions on every request. This exercise models the selection step, not authentication or retrieval of protected text.
