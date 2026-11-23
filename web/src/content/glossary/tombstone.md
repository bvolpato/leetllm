---
title: Tombstone
aliases: ["deletion tombstone"]
importance: 70
---
A **tombstone** is an explicit marker recording that a key or object has been deleted, even when an older value remains visible in a lower storage layer. It distinguishes `this key was intentionally removed here` from `this layer has no opinion about this key`.

## Missing versus explicitly deleted

Nested transactions commonly store only changes made in each transaction layer. When an active transaction deletes a key from the base store, record a tombstone in the active layer so lookup stops there instead of rediscovering the base value.

Store a unique deletion sentinel instead. A lookup scans layers from newest to oldest; encountering the sentinel returns missing immediately. Committing propagates that deletion into the parent layer, while rolling back discards it and reveals the previous value again.


## Example

A store contains `model=fast`. An outer transaction deletes `model`, so `get("model")` returns `None` even though the base dictionary still contains `fast`. A nested transaction then sets `model=accurate`; its value shadows the tombstone. Rolling back the nested layer reveals the outer deletion again. Rolling back the outer layer finally restores `fast`.

Use an identity-based sentinel such as `DELETED = object()` when ordinary stored values may include `None`. Otherwise a genuine `None` value and an intentional delete become indistinguishable, and nested reads cannot preserve the correct contract.

## Why it matters here

Tombstones teach correct layered-state lookup, nested commit behavior, rollback, and deletion visibility. The same idea appears in storage engines, replicated state, and durable event-processing systems.

## Related terms

- [Rollback](glossary://rollback)
- [State machine](glossary://state-machine)
- [Idempotency](glossary://idempotency)
- [Workflow checkpoint](glossary://workflow-checkpoint)
