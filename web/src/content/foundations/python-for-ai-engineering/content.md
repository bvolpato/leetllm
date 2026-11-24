---
{
  "id": "python-for-ai-engineering",
  "title": "Python for AI Engineering",
  "slug": "python-for-ai-engineering",
  "section": "Computing Foundations",
  "category": "MLOps & Deployment",
  "difficulty": "Easy",
  "order": 3,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Build reproducible Python data pipelines for ML using frozen dataclasses, constant-memory JSONL generators, deterministic batch padding, contiguous buffers, and pytest checks.",
  "keyConceptsTested": [
    "Reproducible Python environments with uv lockfiles",
    "Frozen dataclasses, JSON config serialization, and aliasing bugs",
    "Constant-memory JSONL streaming with yield generators",
    "Deterministic seeded shuffling and ragged-to-rectangular batch padding",
    "Memory profiling, array('f') layout, and zero-copy NumPy buffers",
    "Floating-point serialization drift and pytest numerical checks"
  ],
  "prerequisites": [
    "git-shell-linux-reproducible-ai",
    "docker-containerization-reproducible-ai"
  ],
  "relatedQuestions": [
    "numpy-and-tensor-shapes",
    "data-structures-for-ai-systems"
  ]
}
---

A training job can crash before gradient step one without touching a single GPU kernel. One careless `json.load` over a two-gigabyte shard blows past host RAM. One unseeded global `random.shuffle` makes yesterday's run irreproducible. One shallow `.copy()` on a cached sample silently appends padding zeros into your source dataset mid-epoch.

Modern AI systems split work cleanly across two worlds. Compiled C++, CUDA, and Metal kernels execute dense matrix math inside the inner loop, while Python runs everything around it: reading sharded <a href="/glossary/jsonl" data-glossary="jsonl">JSONL</a> corpora, filtering records, shuffling deterministically across restarts, padding ragged token sequences into uniform grids, and packing raw numbers into contiguous buffers for NumPy or PyTorch. Standard web tutorials treat nested dictionaries and dynamic lists as interchangeable conveniences because request payloads are tiny. At ML scale, container overhead and hidden mutations decide whether a pipeline stays fast and reproducible.

The figure below traces the four-stage pipeline we will build end to end: immutable configuration, lazy record streaming, deterministic rectangular batching, and zero-copy handoff to contiguous C floats.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Four-stage Python data preparation flow from a frozen dataclass RunConfig to a lazy JSONL yield generator, into a seeded batcher and padder emitting B by L grids, and finally into a contiguous array of C floats shared with NumPy." />
  <figcaption>The four stages of an AI data pipeline: immutable experiment configuration, constant-memory record streaming, deterministic rectangular batching, and contiguous buffer handoff.</figcaption>
</figure>

## Reproducible Python Environments with `uv`

ML packages evolve quickly, and minor dependency upgrades can shift tokenization or numerical behavior between runs. Pinning Python `3.12`, NumPy, and `pytest` inside an isolated <a href="/glossary/virtual-environment" data-glossary="virtual-environment">virtual environment</a> backed by a <a href="/glossary/dependency-lockfile" data-glossary="dependency-lockfile">lockfile</a> keeps every laptop, script, and CI runner on the exact same dependency graph[^uv2026sync].

Unlike a loose `requirements.txt` with version ranges, `uv sync --locked` verifies exact hashes for every transitive dependency and exits immediately if `pyproject.toml` and `uv.lock` fall out of sync. Running commands through `uv run` executes them inside that locked environment without manual shell activation or accidental fallback to global packages.

```bash title="Initialize and verify a reproducible ML Python environment with uv"
uv init --python 3.12 ml-data-prep
cd ml-data-prep
uv add numpy pytest
uv sync --locked
uv run python -c "import sys, numpy as np; print(sys.version.split()[0], np.__version__)"
```

## Structured Configs, Serialization, and Aliasing Bugs

Untyped nested dictionaries turn small typos into silent bugs. Writing `cfg["learning_rate"] = 1e-4` when the trainer reads `cfg["lr"]`, or mutating a shared config key mid-epoch, leaves no traceback until validation stalls hours later. Decorating a config class with `@dataclass(frozen=True, slots=True)` turns hyperparameters into immutable, self-documenting objects[^python_docs]: `frozen=True` blocks attribute reassignment after startup, `slots=True` removes per-instance `__dict__` hash tables across large metadata collections, and `dataclasses.asdict` serializes the config cleanly to JSON for checkpoint logs[^pythonJson2026].

Immutability at the outer layer still leaves a classic Python trap when records contain nested lists or dictionaries. Calling `.copy()` or `dict(sample)` performs a **shallow copy**: it allocates a new outer dictionary, yet `batch["token_ids"]` still points to the same inner list object. Appending a pad token in place quietly corrupts the cached original. `copy.deepcopy` breaks that link, and in hot loops pure functions (`tokens[:max_len] + [pad_id] * pad_count`) are even better because they build fresh output lists without deep-copy overhead.

<!-- leetllm: test, id=config-copy, output=show -->
```python title="Frozen dataclass configuration and shallow vs. deep batch aliasing"
import copy
import json
from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class BatchConfig:
    batch_size: int = 4
    max_seq_len: int = 5
    pad_id: int = 0
    seed: int = 42


cfg = BatchConfig()
config_json = json.dumps(asdict(cfg), sort_keys=True)
reloaded = BatchConfig(**json.loads(config_json))
assert reloaded == cfg

# Shallow copy shares the inner token list; deep copy isolates it.
cached_record = {"id": "doc_0", "token_ids": [12, 84, 39, 2]}
shallow_copy = cached_record.copy()
shallow_copy["token_ids"].append(cfg.pad_id)
print("After mutating shallow copy, cached_record['token_ids']:", cached_record["token_ids"])

cached_record = {"id": "doc_0", "token_ids": [12, 84, 39, 2]}
safe_copy = copy.deepcopy(cached_record)
safe_copy["token_ids"].append(cfg.pad_id)
print("After mutating deep copy, cached_record['token_ids']:   ", cached_record["token_ids"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
After mutating shallow copy, cached_record['token_ids']: [12, 84, 39, 2, 0]
After mutating deep copy, cached_record['token_ids']:    [12, 84, 39, 2]
```
<!-- leetllm: output:end -->

> **Common mistake:** `frozen=True` blocks attribute rebinding (`cfg.lr = ...`), not in-place mutation of a mutable list stored inside an attribute. Use `tuple` fields in configs or copy nested containers before mutating them.

```checkpoint
Why does mutating a shallow copy of a cached dataset record alter the original record's token list?
---
A shallow dictionary copy creates a new top-level container, but nested mutable objects such as Python lists remain shared references. Modifying `shallow_copy["token_ids"]` mutates the exact same list in memory. Deep copying recursively allocates independent copies of all nested collections.
```

## Streaming Large JSONL Datasets in Constant Memory

Training corpora rarely fit inside RAM as a single JSON `[...]` array. Calling `json.load` on a giant array forces Python to parse the entire file upfront and keep every string, integer, and dictionary alive on the heap at once. JSON Lines (<a href="/glossary/jsonl" data-glossary="jsonl">JSONL</a>) stores one self-contained <a href="/glossary/dataset-record" data-glossary="dataset-record">dataset record</a> per line. Pairing JSONL with a `yield` generator turns disk I/O into a pull-based stream: each record is parsed, processed, and freed immediately, keeping peak RAM flat regardless of corpus size.

### Lazy Generators and Deterministic Sequence Batching

Writing `def stream_jsonl(path):` with `yield json.loads(line)` produces a single-pass iterator. Chaining filtering, tokenization, and batching as generators keeps line ten million untouched on disk until earlier batches finish. Because a generator is exhausted after one pass and has no `len()`, wrap multi-epoch datasets in an iterable class whose `__iter__` returns a fresh generator each epoch.

Pure sequential reads introduce statistical skew whenever shards are grouped by domain or sequence length, because correlated mini-batches bias gradient updates. Rather than loading the whole file to call `random.shuffle`, maintain a bounded sliding shuffle buffer (`buffer_size`) driven by a private `random.Random(seed)` instance[^pythonRandom2026]. A local RNG object keeps batch ordering reproducible even if another library touches global `random.seed(...)`. Once `batch_size` ragged sequences exit the shuffler, `pad_batch` right-pads shorter rows into a uniform `[B, L]` matrix alongside a binary `[B, L]` attention mask marking real tokens `1` and padding `0`.

<figure>
  <img src="illustrations/_generated/runtime_validation_contract_dark.png" alt="Four variable-length token sequences streamed from JSONL (lengths 4, 2, 5, and 3) are right-padded with pad_id 0 into a uniform 4 by 5 token ID matrix alongside a binary 4 by 5 attention mask marking real tokens with 1 and padding positions with 0." />
  <figcaption>Batch collation turns a ragged JSONL stream into a uniform [4 × 5] token matrix paired with a [4 × 5] attention mask so padding tokens never distort loss or attention weights.</figcaption>
</figure>

The script below runs all three pieces together and uses `tracemalloc` to measure the real memory gap between materializing 20,000 JSONL records in a list versus streaming them lazily.

<!-- leetllm: test, id=stream-batch, output=show -->
```python title="Constant-memory JSONL generator, local RNG shuffle buffer, and batch padder"
import io
import json
import random
import tracemalloc
from collections.abc import Iterator


def make_synthetic_jsonl(num_rows: int) -> str:
    rng = random.Random(7)
    lines = []
    for idx in range(num_rows):
        length = 2 + (idx % 4)
        tokens = [rng.randint(5, 95) for _ in range(length)]
        lines.append(json.dumps({"id": idx, "token_ids": tokens}))
    return "\n".join(lines)


def stream_jsonl(text_stream: io.StringIO) -> Iterator[dict]:
    for raw_line in text_stream:
        line = raw_line.strip()
        if line:
            yield json.loads(line)


def buffered_shuffle(records: Iterator[dict], buffer_size: int, seed: int) -> Iterator[dict]:
    rng = random.Random(seed)
    pool: list[dict] = []
    for rec in records:
        pool.append(rec)
        if len(pool) >= buffer_size:
            pick = rng.randrange(len(pool))
            pool[pick], pool[-1] = pool[-1], pool[pick]
            yield pool.pop()
    rng.shuffle(pool)
    yield from pool


def pad_batch(
    records: list[dict], pad_id: int = 0, max_seq_len: int = 5
) -> tuple[list[list[int]], list[list[int]]]:
    clipped = [rec["token_ids"][:max_seq_len] for rec in records]
    width = max(len(seq) for seq in clipped)
    token_matrix = [seq + [pad_id] * (width - len(seq)) for seq in clipped]
    mask_matrix = [[1] * len(seq) + [0] * (width - len(seq)) for seq in clipped]
    return token_matrix, mask_matrix


# 1. Peak memory check: materializing 20,000 JSONL records vs streaming one at a time.
raw_corpus = make_synthetic_jsonl(20_000)
stream_a = io.StringIO(raw_corpus)
stream_b = io.StringIO(raw_corpus)

tracemalloc.start()
all_rows = list(stream_jsonl(stream_a))
_, peak_list = tracemalloc.get_traced_memory()
tracemalloc.stop()
del all_rows

tracemalloc.start()
total_tokens = 0
for row in stream_jsonl(stream_b):
    total_tokens += len(row["token_ids"])
_, peak_stream = tracemalloc.get_traced_memory()
tracemalloc.stop()

ratio = peak_list / max(peak_stream, 1)
assert peak_list > 5 * 1024 * 1024 and peak_stream < 32 * 1024
print(
    f"Peak RAM: list > 5 MiB = {peak_list > 5 * 1024 * 1024}, "
    f"stream < 32 KiB = {peak_stream < 32 * 1024}, ratio > 100x = {ratio > 100}"
)
print(f"Lazy generator streamed tokens={total_tokens}")

# 2. Seeded shuffle + padding on a 4-example mini-batch.
mini_stream = stream_jsonl(io.StringIO(make_synthetic_jsonl(8)))
batch_records = list(buffered_shuffle(mini_stream, buffer_size=4, seed=42))[:4]
ids, mask = pad_batch(batch_records, pad_id=0, max_seq_len=5)
print("Batch IDs: ", ids)
print("Batch Mask:", mask)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Peak RAM: list > 5 MiB = True, stream < 32 KiB = True, ratio > 100x = True
Lazy generator streamed tokens=70000
Batch IDs:  [[46, 24, 0, 0, 0], [79, 12, 69, 32, 9], [14, 73, 17, 51, 0], [55, 88, 11, 0, 0]]
Batch Mask: [[1, 1, 0, 0, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 0], [1, 1, 1, 0, 0]]
```
<!-- leetllm: output:end -->

Materializing 20,000 tiny records takes over 5 MiB of traced heap memory, while streaming all 70,000 tokens stays below 32 KiB: more than a 100× reduction. Even after you stream records cleanly, per-object overhead still dominates whenever numbers stay inside plain Python lists.

## Memory Layout, Profiling, and Zero-Copy Handoff to NumPy

Every slot in a Python `list[float]` holds an 8-byte pointer to a separate 24-byte heap-allocated `PyFloatObject` (on 64-bit CPython). Wrapping each item in a dictionary adds a per-row hash table and scatters numbers across RAM, defeating CPU cache prefetching. By contrast, `array.array('f', values)` packs raw 4-byte IEEE-754 `float32` scalars contiguously: `400 KB` for 100,000 floats compared to `3.2 MB` for `list[float]` and `19.2 MB` for `list[dict]`[^python2026collections]. The `struct` module packs and unpacks binary shards using the same byte layout[^python2026struct].

Contiguous storage alone does not speed up a Python `for` loop. Running `sum(x * 1.5 for x in arr)` still boxes each C float into a temporary Python object on every iteration. The real speedup comes from handing that raw buffer directly to C-compiled vectorized routines with `np.frombuffer(arr, dtype=np.float32)` without copying a byte[^numpy2020]. Together, `array('f')` and `np.frombuffer` cut memory by 8× and accelerate the scaled sum by roughly 75×.

<figure>
  <img src="illustrations/_generated/ml_eval_safety_net_dark.png" alt="Two bar charts comparing 100,000 float32 records in Python. Memory drops from 19.2 MB for list of dicts and 3.2 MB for list of floats to 0.4 MB for contiguous array('f'). Scaled sum time stays near 1.20 to 1.48 ms in Python loops, then drops to 0.016 ms with zero-copy np.frombuffer." />
  <figcaption>Contiguous storage compresses 100,000 float32 values by 8× over a Python list of floats, while handing the buffer directly to NumPy removes bytecode loop overhead for a ~75× speedup.</figcaption>
</figure>

The benchmark below measures container sizes, verifies zero-copy sharing with `np.shares_memory(vec, buf)`, and uses `cProfile` to expose the 100,001 Python generator frames hidden inside a naive normalization loop[^python_docs].

<!-- leetllm: test, id=layout-bench, output=show -->
```python title="Memory layout comparison, zero-copy np.frombuffer, and profiling"
import array
import cProfile
import io
import pstats
import struct
import sys
import time
import numpy as np

N = 100_000
dicts = [{"id": i, "score": (i % 97) * 0.01} for i in range(N)]
floats = [(i % 97) * 0.01 for i in range(N)]
buf = array.array("f", floats)
vec = np.frombuffer(buf, dtype=np.float32)

# Memory footprints: contiguous array('f') removes per-item pointer & PyFloat overhead.
dict_mb = (sys.getsizeof(dicts) + sum(sys.getsizeof(d) for d in dicts)) / 1e6
list_mb = (sys.getsizeof(floats) + sum(sys.getsizeof(x) for x in floats)) / 1e6
arr_mb = sys.getsizeof(buf) / 1e6

# Binary struct packing matches array('f') layout byte-for-byte.
packed_pair = struct.pack("<2f", floats[1], floats[2])
assert packed_pair == buf[1:3].tobytes()
assert np.shares_memory(vec, buf)


def best_ms(fn, runs: int = 10) -> float:
    best = float("inf")
    for _ in range(runs):
        t0 = time.perf_counter()
        fn()
        best = min(best, (time.perf_counter() - t0) * 1000.0)
    return best


py_list_ms = best_ms(lambda: sum(x * 1.5 for x in floats))
py_arr_ms = best_ms(lambda: sum(x * 1.5 for x in buf))
np_buf_ms = best_ms(lambda: float((vec * 1.5).sum()))
assert dict_mb > list_mb > arr_mb
assert np_buf_ms < min(py_list_ms, py_arr_ms)

print(f"Memory (100k items): list[dict]={dict_mb:.2f} MB, list[float]={list_mb:.2f} MB, array('f')={arr_mb:.2f} MB")
print(f"Zero-copy NumPy view shares memory: {np.shares_memory(vec, buf)}, vec.dtype={vec.dtype}")
print(f"Vectorized np.frombuffer beats Python loops: {np_buf_ms < min(py_list_ms, py_arr_ms)}")

# Profile a Python feature-normalization loop to locate the bytecode hotspot.
def slow_norm(values: list[float]) -> float:
    mean = sum(values) / len(values)
    return sum((v - mean) ** 2 for v in values)

prof = cProfile.Profile()
prof.enable()
_ = slow_norm(floats)
prof.disable()
stats = pstats.Stats(prof).stats
gen_calls = next(calls for (_, _, name), (calls, *_) in stats.items() if "genexpr" in name)
print(f"cProfile generator calls in slow_norm: {gen_calls}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Memory (100k items): list[dict]=19.20 MB, list[float]=3.20 MB, array('f')=0.40 MB
Zero-copy NumPy view shares memory: True, vec.dtype=float32
Vectorized np.frombuffer beats Python loops: True
cProfile generator calls in slow_norm: 100001
```
<!-- leetllm: output:end -->

> **Key insight:** Zero-copy sharing cuts both ways. Because `np.shares_memory(vec, buf)` is `True`, writing to `buf[0]` mutates `vec[0]` immediately. Always `.copy()` a view before handing a reusable buffer to an async worker.

Notice why profiling before optimizing pays off: `slow_norm` burns 100,001 Python generator calls to center and square 100k floats. Moving that reduction into a contiguous NumPy buffer runs in compiled C loops outside the <a href="/glossary/global-interpreter-lock" data-glossary="global-interpreter-lock">GIL</a> and saturates <a href="/glossary/memory-bandwidth" data-glossary="memory-bandwidth">memory bandwidth</a>.

```checkpoint
Why does wrapping an `array.array('f', ...)` with `np.frombuffer` avoid copying data into NumPy?
---
`np.frombuffer` exposes Python's buffer protocol directly, pointing a NumPy array view at the existing C-contiguous memory block without allocating or copying raw bytes. Writing to either `buf` or the view mutates that single shared block in place.
```

## Numeric Precision and Serialization Drift

Python's built-in `float` is IEEE-754 binary64 (`float64`), which represents decimal fractions such as `0.1` and `0.2` approximately, so `0.1 + 0.2 == 0.3` evaluates to `False`[^python2026floatingpoint]. Packing features or weights into 4-byte `float32` (`array('f')`) narrows precision to roughly seven decimal digits.

Whenever you compare losses, probabilities, or round-tripped hyperparameters across JSON or <a href="/glossary/dtype" data-glossary="dtype">dtype</a> casts, use `math.isclose(actual, expected, rel_tol=..., abs_tol=...)` matched to your working precision (`1e-6` for `float32`, `1e-9` for `float64`)[^pythonMath2026]. Keep discrete totals (`exact_matches`, `total_examples`) as exact integers and divide only at display time.

<!-- leetllm: test, id=float-json, output=show -->
```python title="Quantization drift from float64 JSON into float32 packed buffers"
import array
import json
import math

lr = 0.1 + 0.2
print("0.1 + 0.2 == 0.3:", lr == 0.3)
print("math.isclose(lr, 0.3, rel_tol=1e-9):", math.isclose(lr, 0.3, rel_tol=1e-9))

# Downcasting a probability vector to float32 drops from ~16 digits to ~7 digits.
probs_f64 = [0.123456789012345, 0.876543210987655]
packed_f32 = array.array("f", probs_f64)
reloaded_json = json.loads(json.dumps(list(packed_f32)))

print("Original f64[0]:", f"{probs_f64[0]:.15f}")
print("After f32 pack: ", f"{reloaded_json[0]:.15f}")
print("Passes f32 tol: ", math.isclose(reloaded_json[0], probs_f64[0], rel_tol=1e-6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0.1 + 0.2 == 0.3: False
math.isclose(lr, 0.3, rel_tol=1e-9): True
Original f64[0]: 0.123456789012345
After f32 pack:  0.123456791043282
Passes f32 tol:  True
```
<!-- leetllm: output:end -->

Explicit tolerances prevent spurious failures on legitimate `float32` rounding while still catching real bugs like dropping a `len(batch)` divisor or letting padding zeros leak into a mean.

## Writing Fast `pytest` Regression Checks for Data Code

Data bugs rarely crash with a traceback; they corrupt masks, break seed reproducibility, or quietly degrade perplexity. A fast `pytest` suite running inside your locked `uv` environment catches those failures in milliseconds[^pytest_docs].

Focus data tests on four concrete properties: rectangular shape agreement (`len(tokens) == len(mask)` and uniform row widths), mask conservation (`sum(mask[i])` equals the clipped sequence length), RNG isolation (same seed produces the same order even after `random.seed(999)` mutates global state), and floating-point checks using `pytest.approx`.

<!-- leetllm: test, id=pytest-suite, output=show -->
```python title="Self-contained pytest suite verifying batch shapes, determinism, and tolerances"
import contextlib
import io
import json
import tempfile
from pathlib import Path
import pytest


def run_batch_suite() -> tuple[int, str]:
    with tempfile.TemporaryDirectory() as tmp:
        test_file = Path(tmp) / "test_pipeline.py"
        test_file.write_text(
            '''
import io, json, random
import numpy as np
import pytest

def pad_batch(records, pad_id=0, max_seq_len=5):
    clipped = [r["token_ids"][:max_seq_len] for r in records]
    width = max(len(s) for s in clipped)
    tokens = [s + [pad_id] * (width - len(s)) for s in clipped]
    mask = [[1] * len(s) + [0] * (width - len(s)) for s in clipped]
    return tokens, mask

def test_pad_batch_shape_and_mask_conservation():
    rows = [{"token_ids": [12, 84, 39, 2]}, {"token_ids": [51, 90]}]
    tokens, mask = pad_batch(rows, pad_id=0, max_seq_len=5)
    assert len(tokens) == len(mask) == 2
    assert len(tokens[0]) == len(tokens[1]) == 4
    assert sum(mask[0]) == 4 and sum(mask[1]) == 2
    assert tokens[1][2:] == [0, 0] and mask[1][2:] == [0, 0]

def test_local_rng_determinism_independent_of_global_state():
    items = list(range(10))
    rng_a = random.Random(42)
    a = items[:]; rng_a.shuffle(a)
    random.seed(999)  # Pollute global RNG intentionally.
    rng_b = random.Random(42)
    b = items[:]; rng_b.shuffle(b)
    assert a == b

def test_normalized_probabilities_approx_unity():
    raw = np.array([1.2, 3.4, 2.1], dtype=np.float32)
    probs = raw / raw.sum()
    assert float(probs.sum()) == pytest.approx(1.0, abs=1e-6)
''',
            encoding="utf-8",
        )
        capture = io.StringIO()
        with contextlib.redirect_stdout(capture):
            code = pytest.main(["-q", "-W", "ignore", str(test_file)])
        summary = capture.getvalue().strip().splitlines()[-1].split(" in ")[0]
        return code, summary


exit_code, summary = run_batch_suite()
print("pytest summary:", summary)
print("pytest exit code:", exit_code)
assert exit_code == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
pytest summary: 3 passed
pytest exit code: 0
```
<!-- leetllm: output:end -->

Running `uv run pytest` before launching a GPU training job catches padding off-by-ones and aliasing bugs locally in milliseconds instead of wasting accelerator hours.

## Putting It Together

Clean AI engineering in Python separates flexible orchestration from compact numeric storage. Lock packages with `uv`, hold experiment settings in `@dataclass(frozen=True, slots=True)`, stream JSONL files with `yield` generators, isolate shuffle randomness inside a local `random.Random(seed)`, pack flat numeric buffers for zero-copy NumPy handoff, and guard padding, determinism, and tolerances with `pytest`.

<details>
<summary>Quick reference: Python AI data engineering checklist</summary>

1. Lock Python and numeric packages with `uv sync --locked` and run scripts via `uv run`.
2. Store hyperparameters in `@dataclass(frozen=True, slots=True)` and avoid mutating shared nested containers.
3. Stream JSONL files one record at a time with `yield`, shuffling through a bounded reservoir backed by `random.Random(seed)`.
4. Pad ragged token sequences into uniform `[B, L]` matrices paired with a binary `[B, L]` attention mask.
5. Profile hotspots with `cProfile` and `time.perf_counter`, store flat numeric streams in `array('f')` or contiguous NumPy arrays, and verify batch rules with `pytest` and `math.isclose`.

</details>

```mastery-quiz
[
  {
    "question": "An experiment defines `@dataclass(frozen=True, slots=True)` with `tags: list[str]`. A sweep derives `sweep_cfg = dataclasses.replace(base_cfg, lr=1e-4)` and calls `sweep_cfg.tags.append(\"canary\")`. What happens?",
    "options": [
      "`FrozenInstanceError` blocks attribute rebinding and list mutation on `sweep_cfg`, so `base_cfg.tags` remains unchanged.",
      "Rebinding attributes fails on `sweep_cfg`, while `sweep_cfg.tags.append(...)` mutates `base_cfg.tags` via a shared list reference.",
      "`slots=True` deep-copies mutable fields during `dataclasses.replace()`, isolating `base_cfg.tags` when `sweep_cfg.tags` grows.",
      "`dataclasses.replace()` freezes nested containers into tuples, raising `AttributeError` when `.append(\"canary\")` executes."
    ],
    "answer": "Rebinding attributes fails on `sweep_cfg`, while `sweep_cfg.tags.append(...)` mutates `base_cfg.tags` via a shared list reference.",
    "explanation": "A frozen dataclass blocks attribute reassignment (`cfg.lr = ...`) but leaves mutable containers inside those attributes mutable in place. Because `dataclasses.replace()` is a shallow copy, both configs hold the exact same list object unless you store a tuple or copy the container explicitly."
  },
  {
    "question": "A streaming dataset reader yields records line by line with `itertools.islice(..., 32)` and shuffles a bounded reservoir using `rng = random.Random(42)`. Midway through training, a tokenizer hook calls `random.seed(999)`. What follows?",
    "options": [
      "The file iterator buffers every line in RAM before `islice` starts, and `random.seed(999)` alters subsequent generator steps.",
      "Memory holds up to 32 slice items plus the reservoir buffer, and module-level `random.seed(999)` resets `rng`'s next draw.",
      "Memory holds up to 32 slice items plus the reservoir buffer, while `rng` retains its own isolated shuffle sequence.",
      "Calling `random.seed(999)` raises `RuntimeError` because an active `random.Random` instance locks Python's global RNG state."
    ],
    "answer": "Memory holds up to 32 slice items plus the reservoir buffer, while `rng` retains its own isolated shuffle sequence.",
    "explanation": "A `yield` generator paired with `islice` advances only as items are pulled, keeping memory proportional to the batch and buffer rather than the file size. Dedicated `random.Random(seed)` objects maintain private Mersenne Twister state independent of module-level `random.seed(...)`."
  },
  {
    "question": "You store 100,000 `float32` scores in `buf = array.array('f', scores)` and create `vec = np.frombuffer(buf, dtype=np.float32)`. Before an async worker computes `vec.sum()`, the producer writes `buf[0] = 9.0` to reuse memory. What happens?",
    "options": [
      "`np.frombuffer` copies raw bytes into an aligned NumPy allocation, leaving `vec[0]` unchanged while doubling memory.",
      "`vec` reads the same C buffer as `buf`, so writing `buf[0] = 9.0` updates `vec[0]` in place unless `vec` was copied earlier.",
      "Binding a NumPy view increments `buf`'s buffer export count, forcing `BufferError` on item assignment to `buf[0]`.",
      "`vec.sum()` reads Python `float` pointers stored alongside `buf`, ignoring later in-place updates inside raw bytes."
    ],
    "answer": "`vec` reads the same C buffer as `buf`, so writing `buf[0] = 9.0` updates `vec[0]` in place unless `vec` was copied earlier.",
    "explanation": "`np.frombuffer` returns a zero-copy view backed by the exact bytes inside `array('f')` (`np.shares_memory(vec, buf)` is `True`). Zero-copy aliasing removes duplication and speeds reductions, so callers must `.copy()` before reusing backing buffers across async stages."
  },
  {
    "question": "You serialize `float64` model probabilities `[0.123456789012345, ...]` through `float32` (`array('f')`) into JSON while tracking exact integer counts `exact_matches = 17` and `total_examples = 20`. Which rule handles both cleanly?",
    "options": [
      "Assert `math.isclose(..., rel_tol=1e-6)` on serialized floats, and preserve integer counts intact before dividing.",
      "Assert exact `==` equality on round-tripped floats, and store integer hit counts as pre-rounded decimal strings.",
      "Assert `math.isclose(..., rel_tol=1e-12)` on `float32` buffers, and apply `rel_tol=1e-6` when comparing exact counts.",
      "Downcast integer counts alongside probabilities to `float16` so JSON payloads stay compact with matching bit width."
    ],
    "answer": "Assert `math.isclose(..., rel_tol=1e-6)` on serialized floats, and preserve integer counts intact before dividing.",
    "explanation": "Downcasting `float64` to 4-byte `float32` leaves roughly seven significant decimal digits, so `1e-12` or `==` will spuriously fail while `rel_tol=1e-6` matches `float32` resolution. Discrete counts belong in exact integers so totals never accumulate rounding drift."
  },
  {
    "question": "Two tokenized sequences of lengths 4 and 2 are padded to width 4 with `pad_id = 0` inside rectangular arrays `tokens` and `mask`. Which test catches an off-by-one padding bug across arbitrary valid batches?",
    "options": [
      "Requiring `len(tokens) > 0` and verifying that at least one trailing slot inside the padded batch equals `pad_id`.",
      "Asserting identical row widths `len(row) == width`, `len(tokens) == len(mask)`, and `sum(mask[i]) == clipped_len` per sequence.",
      "Asserting that `mask` contains binary values `0` or `1` and that `tokens[-1][-1]` matches `pad_id` on short batches.",
      "Measuring whether the UTF-8 JSON byte length increases when variable-length lists are rewritten as nested tuples."
    ],
    "answer": "Asserting identical row widths `len(row) == width`, `len(tokens) == len(mask)`, and `sum(mask[i]) == clipped_len` per sequence.",
    "explanation": "Rectangle shape equality (`len(tokens) == len(mask)` and uniform column count) plus mask conservation (`sum(mask[i])` matching the clipped sequence length, with filler positions equal to `pad_id` and mask `0`) verifies every row without overfitting to specific IDs."
  },
  {
    "question": "A teammate adds a new library requirement to `pyproject.toml` without running `uv lock`, and CI executes the evaluation script with `uv run --locked eval.py`. What occurs?",
    "options": [
      "`uv` installs the missing dependency into `.venv`, rewrites `uv.lock` in place, and runs `eval.py` immediately.",
      "`uv` starts `eval.py` using the preinstalled environment packages while logging a warning for `pyproject.toml`.",
      "`uv` exits with an error before `eval.py` starts because `uv.lock` is stale against `pyproject.toml`.",
      "`uv` isolates the interpreter to standard-library modules alone, skipping third-party packages until unlocked."
    ],
    "answer": "`uv` exits with an error before `eval.py` starts because `uv.lock` is stale against `pyproject.toml`.",
    "explanation": "Passing `--locked` refuses to proceed when `uv.lock` falls out of sync with `pyproject.toml`, stopping execution before stale dependencies produce unrecorded results while never modifying `uv.lock` behind your back."
  }
]
```

> **Next:** Continue to [NumPy and Tensor Shapes](/learn/numpy-and-tensor-shapes). Your Python pipeline now streams records, isolates immutable configs, and packs raw floats into contiguous buffers. NumPy picks up directly from that zero-copy buffer: every axis gains an explicit shape, stride, and broadcasting rule so whole batches transform in compiled C loops instead of Python bytecode.
