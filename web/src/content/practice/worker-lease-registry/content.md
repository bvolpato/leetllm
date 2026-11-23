A worker may pause, lose its lease, then wake after another worker has taken over the job. Give each new ownership generation a higher <span data-glossary="fencing-token">fencing token</span> so stale work can be recognized.

Implement `LeaseRegistry`, an in-memory lease table for long-running worker jobs.

## Requirements

- `LeaseRegistry(ttl_seconds)` initializes the registry with a default lease <span data-glossary="ttl-deadline">time-to-live</span> in seconds.
- `acquire(run_id, worker_id, now)` returns a lease dictionary or `None`.
- A successful `acquire` returns a dict with at least:
  `run_id`, `worker_id`, `lease_id`, `fencing_token`, and `expires_at` (`now + ttl_seconds`).
- `lease_id` is `"{run_id}:{worker_id}:{fencing_token}"` (e.g. `"run-1:worker-a:1"`).
- Only one active lease may exist per run.
- Acquiring an active run fails even for its current worker; renew through `heartbeat` instead. A failed acquire doesn't consume a token.
- An expired lease can be acquired by another worker.
- Expiry is inclusive: a lease is expired when `expires_at <= now`.
- Every new lease gets a monotonically increasing `fencing_token`.
- Fencing tokens are **registry-wide**: each successful `acquire` (any run) receives the next integer after the previous successful acquire. Tokens start at `1`.
- `heartbeat(lease_id, fencing_token, now)` extends the current lease (`expires_at = now + ttl_seconds`) and returns `True` or `False`. Heartbeat must not revive an expired lease; treat expiry like `validate`.
- `validate(run_id, lease_id, fencing_token, now)` returns whether a worker may still mutate the run (active lease for that run, matching ids/token, not expired).
- `release(lease_id, fencing_token)` releases only the current lease for that id/token and returns whether the release succeeded (`bool`). Release may succeed past `expires_at`, provided the lease remains current for its run.
- The returned lease is a snapshot. Changing its fields must not change the registry, and a later heartbeat doesn't update an earlier returned dictionary.

Assume single-threaded operations, string IDs, a finite positive TTL, and finite `now` values passed in nondecreasing order. Input validation and locking aren't required. Tokens increase for this registry instance's lifetime; persistence across restarts is a follow-up.

`validate` reports ownership at the specified time. A separate validation call followed by an external write isn't atomic: takeover can occur between them. A durable version must enforce ownership at the mutation point, using a transaction or storage-side fencing check. Fencing tokens aren't authentication credentials.[^redis2026DistributedLocks][^etcd2026ConcurrencyAPI]

## Example

For a ten-second lease, the ownership transition is exact:

| Time | Worker action | Fencing token | Result |
|---:|---|---:|---|
| `0` | Worker A acquires `run-1`. | `1` | Lease remains active before time `10`. |
| `5` | Worker B tries the same run. | not issued | Acquisition fails. |
| `10` | Worker B acquires the expired run. | `2` | Ownership moves to B. |
| `11` | Worker A validates token `1`. | `1` | Stale ownership is rejected. |

The assertions below establish the acquisition and expiry behavior:

```python
registry = LeaseRegistry(ttl_seconds=10)
lease = registry.acquire("run-1", "worker-a", now=0)
assert lease["fencing_token"] == 1
assert lease["lease_id"] == "run-1:worker-a:1"
assert registry.acquire("run-1", "worker-b", now=5) is None
assert registry.acquire("run-1", "worker-b", now=10)["fencing_token"] == 2
assert not registry.validate("run-1", lease["lease_id"], 1, now=11)
assert not registry.release(lease["lease_id"], 1)
```

## Constraints

- Keep it single-process and in memory.
- Use the provided `now` value. Don't call wall-clock time.
- Reject expired heartbeats; releasing an expired lease is allowed only while it remains the current owner.
