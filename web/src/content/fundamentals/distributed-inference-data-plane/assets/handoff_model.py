#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Single-threaded protocol state model for KV handoff reservation, completion, and reclamation.

Transport callbacks model discrete state transitions cleanly: finish() marks DMA writes quiescent,
abort_ack() records cancelled-transfer quiescence, and consumer_stopped() records that the
decode reader has released the KV pages. Real distributed services enforce these transitions across
RDMA/NVLink handles and CUDA streams rather than a single-process clock loop.
"""
from dataclasses import dataclass, field
from itertools import permutations


def at_least(value, name, minimum=0):
    if value < minimum:
        raise ValueError(f"{name} must be >= {minimum}")
    return value


@dataclass(frozen=True)
class Manifest:
    request: str = "prompt_8k_kv"
    attempt: int = 4
    tenant: str = "pool_llama70b"
    layout: str = "llama3-70b/gqa8/bf16/hnd/tp2"
    prompt: str = "hash_8192_bf16"
    ranks: int = 2
    blocks: int = 512
    reserved: int = 2_726_297_600  # 8,192 + 128 positions, 320 KiB each


@dataclass
class Transfer:
    expected: Manifest
    deadline: int
    state: str = "RESERVED"
    quiet: bool = True
    reading: bool = False
    seen: set[tuple[int, int]] = field(default_factory=set)


class Receiver:
    def __init__(self, capacity: int):
        self.capacity = at_least(capacity, "capacity")
        self.current: dict[str, int] = {}
        self.transfers: dict[tuple[str, int], Transfer] = {}
        self.visible: set[str] = set()

    @property
    def free(self):
        return self.capacity - sum(t.expected.reserved for t in self.transfers.values()
                                   if t.state != "FREED")

    def reserve(self, expected: Manifest, now=0, ttl=10):
        # expected comes from the trusted router, not the received manifest.
        at_least(now, "destination clock")
        at_least(ttl, "lease duration", 1)
        at_least(expected.attempt, "attempt")
        for name in ("reserved", "ranks", "blocks"):
            at_least(getattr(expected, name), name, 1)
        for name in ("request", "tenant", "layout", "prompt"):
            if not getattr(expected, name):
                raise ValueError(f"{name} must be nonempty")
        if (expected.request in self.visible
                or expected.attempt <= self.current.get(expected.request, -1)
                or expected.reserved > self.free):
            raise ValueError("reservation rejected")
        for key, old in self.transfers.items():
            if key[0] == expected.request and old.state != "FREED":
                old.state = "RETIRED"  # fence, but keep its physical byte charge
        self.current[expected.request] = expected.attempt
        key = (expected.request, expected.attempt)
        self.transfers[key] = Transfer(expected, now + ttl)
        return key

    def live(self, key, now):
        at_least(now, "destination clock")
        t = self.transfers[key]
        if now >= t.deadline and t.state in ("RESERVED", "TRANSFERRING"):
            t.state = "RETIRED"
        if (t.state in ("RETIRED", "FREED")
                or self.current[key[0]] != key[1]):
            raise ValueError("expired or fenced")
        return t

    def begin(self, key, manifest, now=0):
        t = self.live(key, now)
        if t.state != "RESERVED" or manifest != t.expected:
            raise ValueError("state or manifest mismatch")
        t.state, t.quiet = "TRANSFERRING", False

    def arrive(self, key, rank, block):
        at_least(rank, "rank")
        at_least(block, "block")
        t = self.transfers[key]
        if (t.quiet or not 0 <= rank < t.expected.ranks
                or not 0 <= block < t.expected.blocks):
            raise ValueError("unexpected block or stopped transfer")
        # Late writes can still touch retired buffers. They never revive ownership.
        t.seen.add((rank, block))

    def finish(self, key):
        t = self.transfers[key]
        if t.state not in ("TRANSFERRING", "RETIRED"):
            raise ValueError("no submitted transfer")
        t.quiet = True

    def commit(self, key, now=1):
        t = self.live(key, now)
        expected = {(r, b) for r in range(t.expected.ranks)
                    for b in range(t.expected.blocks)}
        if (t.state not in ("TRANSFERRING", "READY") or not t.quiet
                or t.seen != expected):
            raise ValueError("incomplete or still writing")
        t.state = "READY"  # repeated commit is idempotent

    def stream(self, key, now=1):
        t = self.live(key, now)
        if t.state != "READY":
            raise ValueError("not committed")
        t.reading = True
        self.visible.add(key[0])  # authoritative frontend observation in this model

    def cancel(self, key):
        t = self.transfers[key]
        if t.state != "FREED":
            t.state = "RETIRED"

    def abort_ack(self, key):
        t = self.transfers[key]
        if t.state != "RETIRED":
            raise ValueError("cancel before abort acknowledgement")
        t.quiet = True

    def consumer_stopped(self, key):
        t = self.transfers[key]
        if t.state != "RETIRED":
            raise ValueError("retire before stopping consumer")
        t.reading = False

    def reclaim(self, key):
        t = self.transfers[key]
        if t.state == "FREED":
            return
        if t.state != "RETIRED" or not t.quiet or t.reading:
            raise ValueError("buffer is live or may still receive writes")
        t.state = "FREED"


def rejected(fn):
    try:
        fn()
    except ValueError:
        return
    raise AssertionError("expected rejection")


def run_checks():
    from dataclasses import replace
    m = Manifest(blocks=2, reserved=100)
    invalid = Receiver(200)
    for ttl in (0, -1):
        rejected(lambda: invalid.reserve(m, ttl=ttl))
    rejected(lambda: invalid.reserve(m, now=-1))
    for changed in (replace(m, reserved=0), replace(m, ranks=0),
                    replace(m, blocks=0), replace(m, attempt=-1),
                    replace(m, tenant=""), replace(m, reserved=201)):
        rejected(lambda: invalid.reserve(changed))
    assert invalid.free == 200 and not invalid.transfers and not invalid.current

    pool = Receiver(200)
    key = pool.reserve(m)
    for changed in (replace(m, tenant="other"), replace(m, layout="other"),
                    replace(m, prompt="other"), replace(m, attempt=3),
                    replace(m, blocks=1), replace(m, ranks=1),
                    replace(m, reserved=1), replace(m, request="other")):
        rejected(lambda: pool.begin(key, changed))
    pool.begin(key, m)
    for rank, block in ((2, 0), (0, 2), (-1, 0), (0, -1)):
        rejected(lambda: pool.arrive(key, rank, block))
    assert pool.transfers[key].seen == set()
    rejected(lambda: pool.stream(key))
    for r, b in ((1, 1), (0, 0), (0, 0), (1, 0)):
        pool.arrive(key, r, b)
    rejected(lambda: pool.commit(key))
    pool.arrive(key, 0, 1)
    rejected(lambda: pool.commit(key))  # all blocks, but writer not quiescent
    pool.finish(key)
    pool.commit(key)
    pool.commit(key)
    pool.stream(key, now=11)  # admission lease no longer expires a committed request
    rejected(lambda: pool.reserve(replace(m, attempt=5)))
    pool.cancel(key)
    rejected(lambda: pool.reclaim(key))
    pool.consumer_stopped(key)
    pool.reclaim(key)
    pool.reclaim(key)
    assert pool.free == 200

    pool = Receiver(200)
    old = pool.reserve(m)
    pool.begin(old, m)
    new = pool.reserve(replace(m, attempt=5))
    assert pool.free == 0
    rejected(lambda: pool.reserve(replace(m, request="other", reserved=1)))
    pool.arrive(old, 0, 0)  # a delayed write after logical fencing
    rejected(lambda: pool.commit(old))
    rejected(lambda: pool.reclaim(old))
    pool.abort_ack(old)
    pool.reclaim(old)
    assert pool.free == 100 and pool.transfers[new].state == "RESERVED"
    rejected(lambda: pool.begin(new, replace(m, attempt=5), now=10))
    pool.reclaim(new)
    assert pool.free == 200

    # Explore every ordering of two arrivals and four lifecycle events.
    # Invalid events must reject without permitting partial decode or early reuse.
    for events in permutations(("r0", "r1", "finish", "commit", "cancel", "reclaim")):
        one = replace(m, blocks=1)
        p = Receiver(100)
        k = p.reserve(one)
        p.begin(k, one)
        cancelled = False
        for event in events:
            cancelled |= event == "cancel"
            try:
                if event.startswith("r") and event != "reclaim":
                    p.arrive(k, int(event[1]), 0)
                else:
                    getattr(p, event)(k)
            except ValueError:
                pass
            t = p.transfers[k]
            assert p.free in (0, 100)
            if t.state == "READY":
                assert not cancelled and t.quiet and len(t.seen) == 2
            if t.state == "FREED":
                assert cancelled and t.quiet
    print("8 manifest mismatches, duplicate/missing blocks, stale attempts and expiry: pass")
    print("720 event orders: no partial commit or premature credit reuse")
    print("invalid leases, clock ticks, manifests and block identities: rejected")


if __name__ == "__main__":
    run_checks()
