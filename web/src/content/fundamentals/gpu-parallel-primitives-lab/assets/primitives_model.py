#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""CPU index/phase models, not a GPU simulator or synchronization test.

Each copied phase assumes its preceding GPU barrier has completed. These models
check arithmetic and indexing; they cannot validate a CUDA memory model, compiler,
warp scheduling, barriers, resource use or performance.
"""
from math import exp, fsum, inf, isclose, isfinite
from random import Random

I64_MIN, I64_MAX = -(1 << 63), (1 << 63) - 1


def add64(left, right):
    result = left + right
    if not I64_MIN <= result <= I64_MAX:
        raise OverflowError("Signed 64-bit intermediate overflow")
    return result


def warp_sum(lanes, active=None):
    """Full-warp shuffle tree; raise for a requested nonparticipating source."""
    if len(lanes) != 32:
        raise ValueError("Expected exactly 32 lane values")
    active = set(range(32)) if active is None else set(active)
    if not active <= set(range(32)) or 0 not in active:
        raise ValueError("Invalid participating lanes")
    values = list(lanes)
    for offset in (16, 8, 4, 2, 1):
        before = values.copy()  # All shuffle sources use pre-instruction values.
        for lane in sorted(active):
            source = lane + offset
            if source < 32:
                if source not in active:
                    raise ValueError("Shuffle reads a nonparticipating lane")
                values[lane] = add64(before[lane], before[source])
    return values[0]


def hierarchical_sum(values):
    if not values:
        return 0
    current = list(values)
    while True:
        partials = []
        for start in range(0, len(current), 512):
            tile = current[start:start + 512]
            tile += [0] * (512 - len(tile))
            local = [add64(tile[t], tile[t + 256]) for t in range(256)]
            warps = [warp_sum(local[w:w + 32]) for w in range(0, 256, 32)]
            partials.append(warp_sum(warps + [0] * 24))
        if len(partials) == 1:
            return partials[0]
        current = partials


def block_scan(values, width=512, *, trace=None):
    if width < 2 or width & (width - 1):
        raise ValueError("Width must be a power of two, at least two")
    if len(values) > width:
        raise ValueError("Input exceeds one block")
    shared = list(values) + [0] * (width - len(values))
    stride = 1
    while stride < width:
        before = shared.copy()  # Assumed block barrier between phases.
        destinations = set()
        for thread in range(width // 2):
            index = (thread + 1) * stride * 2 - 1
            if index < width:
                assert index not in destinations
                destinations.add(index)
                shared[index] = add64(before[index - stride], before[index])
        if trace is not None:
            trace.append((f"up {stride}", shared.copy()))
        stride *= 2
    total = shared[-1]
    shared[-1] = 0
    if trace is not None:
        trace.append(("root = 0", shared.copy()))
    stride = width // 2
    while stride:
        before = shared.copy()
        destinations = set()
        for thread in range(width // 2):
            index = (thread + 1) * stride * 2 - 1
            if index < width:
                assert not {index - stride, index} & destinations
                destinations.update((index - stride, index))
                shared[index - stride] = before[index]
                shared[index] = add64(before[index], before[index - stride])
        if trace is not None:
            trace.append((f"down {stride}", shared.copy()))
        stride //= 2
    return shared[:len(values)], total


def device_scan(values, width=512):
    if not values:
        return []
    local, totals = [], []
    for start in range(0, len(values), width):
        prefixes, total = block_scan(values[start:start + width], width)
        local.append(prefixes)
        totals.append(total)
    offsets = [0] if len(totals) == 1 else device_scan(totals, width)
    return [add64(prefix, offsets[block])
            for block, prefixes in enumerate(local) for prefix in prefixes]


def merge_states(left, right):
    """Merge valid states produced by softmax_state, including its empty identity."""
    ma, da = left
    mb, db = right
    if da == 0:
        return right
    if db == 0:
        return left
    maximum = max(ma, mb)
    return maximum, da * exp(ma - maximum) + db * exp(mb - maximum)


def softmax_state(values):
    state = (-inf, 0.0)
    for value in values:
        if value is None:  # Explicitly masked; contributes the empty identity.
            continue
        if not isfinite(value):
            raise ValueError("Unmasked logits must be finite")
        state = merge_states(state, (value, 1.0))
    return state


def softmax(values):
    """Two-pass output; requires a reusable iterable, not a one-shot iterator."""
    if iter(values) is values:
        raise ValueError("Softmax output requires reusable logits")
    maximum, denominator = softmax_state(values)
    if denominator == 0:
        raise ValueError("No unmasked logits")
    return [0.0 if value is None else exp(value - maximum) / denominator
            for value in values]


def reference_scan(values):
    result, running = [], 0
    for value in values:
        result.append(running)
        running += value
    return result


def expect_error(kind, operation):
    try:
        operation()
    except kind:
        return
    raise AssertionError(f"Expected {kind.__name__}")


def run_checks():
    rng = Random(2026)
    sizes = [0, 1, 7, 8, 31, 32, 33, 255, 256, 257, 511, 512, 513,
             1023, 1024, 1025, 512 * 512 + 1]
    for n in sizes:
        values = [rng.randrange(-9, 10) for _ in range(n)]
        assert hierarchical_sum(values) == sum(values)
        assert device_scan(values) == reference_scan(values)
    # Smaller blocks force many recursive offset-propagation shapes.
    for width in (2, 4, 8, 16):
        for n in range(65):
            values = [rng.randrange(-9, 10) for _ in range(n)]
            assert device_scan(values, width) == reference_scan(values)
    assert warp_sum([0] * 31 + [I64_MAX]) == I64_MAX
    expect_error(ValueError, lambda: warp_sum([1] * 20 + [0] * 12, range(20)))
    expect_error(OverflowError, lambda: warp_sum([I64_MAX, 1] + [0] * 30))
    expect_error(OverflowError, lambda: block_scan([I64_MIN, -1], 2))
    expect_error(ValueError, lambda: block_scan([1], 3))
    for n in (1, 2, 3, 7, 32):
        values = [rng.uniform(-1000, 1000) for _ in range(n)]
        reference_max = max(values)
        reference_denom = fsum(exp(v - reference_max) for v in values)
        expected = [exp(v - reference_max) / reference_denom for v in values]
        actual = softmax(values)
        assert all(isclose(a, b, rel_tol=1e-12, abs_tol=1e-15)
                   for a, b in zip(actual, expected))
        for split in range(n + 1):
            merged = merge_states(softmax_state(values[:split]),
                                  softmax_state(values[split:]))
            assert merged[0] == reference_max
            assert isclose(merged[1], reference_denom, rel_tol=1e-12)
    assert merge_states((-inf, 0), (-inf, 0)) == (-inf, 0)
    assert softmax([None, 5, None]) == [0, 1, 0]
    for values in ([], [None], [inf], [-inf], [float('nan')]):
        expect_error(ValueError, lambda: softmax(values))
    print(f"CPU models: {len(sizes)} hierarchy sizes and 260 recursive scan cases pass")
    print("Overflow, absent shuffle sources, invalid widths and masked/nonfinite rows checked")
    print("No CUDA compilation, GPU synchronization, sanitizer or performance claim")


if __name__ == "__main__":
    run_checks()
