---
title: Hash map
aliases: ["hash table"]
importance: 91
---
A **hash map** stores values under keys and uses a hash function to locate candidate storage positions. Python's built-in `dict` is a hash-map implementation. Looking up a well-distributed, stable key is typically expected constant time, but collisions, key equality checks, resizing, and hashing the key itself still contribute work.

Keys must be hashable: their hash and equality behavior must remain consistent while they are in the map, and keys that compare equal must have equal hashes. Unequal keys may share a hash; equality checks resolve these collisions. Strings, integers, and tuples of hashable values work; mutable lists and ordinary dictionaries don't. A dictionary preserves insertion order in modern Python, but its ordering guarantee isn't the reason lookup is fast.

## Fast lookup isn't free query execution

If `postings["token"]` returns a set containing one million document IDs, reaching that set quickly doesn't process its million members. Similarly, hashing a long string must inspect the relevant input characters. State exactly which operation has expected constant cost before making a broader performance claim.


## Example

```python
documents = {"auth-fixture": "fixture expired", "ci-timeout": "job timed out"}
assert documents["auth-fixture"] == "fixture expired"
assert documents.get("missing") is None
```

`get` returns its default for a missing key without inserting that key. A `defaultdict` can behave differently when indexed directly, so choose the access method deliberately.

## Why it matters here

Term postings, feature dictionaries, permission caches, document lookups, and retry ledgers all rely on key-to-value access. Correct keys and honest complexity claims prevent accidental full scans, stale identity matches, and misleading performance expectations.

## Related terms

- [Inverted index](glossary://inverted-index)
- [Big-O notation](glossary://big-o-notation)
- [LRU cache](glossary://lru-cache)
- [Idempotency](glossary://idempotency)
