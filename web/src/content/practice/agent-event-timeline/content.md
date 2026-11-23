Two agent runs can interleave their updates, and their timestamps may not match the order in which those updates were stored. Give each event a stable place in the shared history, then let a reader page through one run without seeing another's events.

Implement `EventTimeline`, an append-only <span data-glossary="observability">event log</span> for agent runs. Its cursor follows append order, so clock skew cannot change event order.

## Requirements

- `append(run_id, kind, timestamp, message)` stores an event and returns its sequence number.
- Sequence numbers span all runs in one `EventTimeline` instance and start at `1`. Each instance has its own counter.
- `list_events(run_id, after_seq=0, limit=100)` returns events for one run with `seq > after_seq`.
- Output events are dictionaries with `seq`, `kind`, `timestamp`, and `message`.
- Messages must <span data-glossary="secrets-management">redact tokens</span> matching the exact pattern `sk-[A-Za-z0-9_-]+`: lowercase `sk-` followed by one or more ASCII letters, ASCII digits, underscores, or hyphens. Match substrings without requiring a word boundary.
- Replace each match with the literal string `[REDACTED]`.
- Results are ordered by sequence and respect `limit`.
- If `limit <= 0`, return an empty list.
- Return fresh dictionaries so a caller can't change stored events by editing a listing. Inputs have the types shown in the starter code; no field validation or concurrent calls are required.

## Example

Append one event per run, then ask for only the first run's events after its initial cursor:

```python title="timeline-examples.py"
timeline = EventTimeline()
timeline.append("r1", "log", 1.0, "started")
assert timeline.list_events("r1")[0]["message"] == "started"
timeline.append("r2", "log", 2.0, "secret sk-live_42")
assert timeline.list_events("r1", after_seq=1) == []
assert timeline.list_events("r2")[0]["message"] == "secret [REDACTED]"
```

After these appends, run `r1` has sequence `1` and run `r2` has sequence `2`. If the next `r1` event arrives with an earlier timestamp, it still gets sequence `3`. Listing `r1` after cursor `1` returns that event; it doesn't reorder events by timestamp or renumber sequences per run.

The pattern is intentionally narrow. `sk-` alone and `SK-live` don't match; `prefixsk-live!` becomes `prefix[REDACTED]!`. Before storing production events, apply credential-specific detection, retention, and access policies.

## Constraints

- Keep state in memory.
- Never expose events from other runs.
- Run filtering is the storage rule here. A production API must also authorize the caller to read the requested run.
