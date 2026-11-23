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
    "Floating-point serialization drift and pytest numerical invariants"
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

Every language model training run and evaluation harness sits on top of two worlds at once. Inside the inner loop, compiled C++, CUDA, and Metal kernels multiply dense rectangular arrays at hardware speed. Everything wrapping that inner loop runs in Python: reading sharded <a href="/glossary/jsonl" data-glossary="jsonl">JSONL</a> corpora from disk, filtering noisy records, shuffling examples cleanly across restarts, padding variable-length sequences into uniform batches, and writing experiment checkpoints.

That division of labor creates a distinct style of Python engineering. Standard web tutorials treat Python dictionaries, nested lists, and dynamic loops as interchangeable conveniences because request payloads are tiny. In AI systems, a careless `json.load` over a two-gigabyte shard exhausts host memory before training step one, an unseeded global random call breaks reproducibility across runs, and a list of boxed Python `float` objects wastes eight times more memory than a contiguous `float32` buffer ready for NumPy or PyTorch.

The diagram below traces the pipeline this lesson builds from end to end. Typed configuration enters a lazy streaming iterator, passes through a seeded batcher that pads ragged token sequences with an explicit mask, and lands in packed C-contiguous memory with zero redundant Python object headers.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Four-stage Python data preparation flow from a frozen dataclass RunConfig to a lazy JSONL yield generator, into a seeded batcher and padder emitting B by L grids, and finally into a contiguous array of C floats shared with NumPy." />
  <figcaption>The four stages of an AI-engineering Python data pipeline: immutable experiment configuration, constant-memory record streaming, deterministic rectangular batching, and contiguous buffer handoff.</figcaption>
</figure>

## Reproducible Python Environments with `uv`

Machine learning libraries upgrade rapidly, and small numerical shifts across releases can invalidate days of training comparisons. Pinning Python `3.12`, NumPy, and test tooling inside an isolated <a href="/glossary/virtual-environment" data-glossary="virtual-environment">virtual environment</a> backed by a <a href="/glossary/dependency-lockfile" data-glossary="dependency-lockfile">lockfile</a> makes every notebook, script, and container build resolve the exact same package graph[^uv2026sync]. A plain `requirements.txt` with unpinned ranges installs whichever wheel happened to be published that morning, whereas `uv sync --locked` hashes exact transitive dependencies and fails immediately if `pyproject.toml` and `uv.lock` drift out of sync. Once synchronized, `uv run` executes scripts and `pytest` inside that locked environment without manual shell activation or accidental fallback to global system packages.

```bash title="Initialize and verify a reproducible ML Python environment with uv"
uv init --python 3.12 ml-data-prep
cd ml-data-prep
uv add numpy pytest
uv sync --locked
uv run python -c "import sys, numpy as np; print(sys.version.split()[0], np.__version__)"
```

## Structured Configs, Serialization, and Aliasing Bugs

Unstructured nested dictionaries turn subtle typos into silent bugs during long experiments. Misspelling `lr` as `learning_rate` or mutating a shared dictionary key mid-epoch leaves no trace until a metric stalls hours later. Using `@dataclass(frozen=True, slots=True)` turns experiment hyperparameters into immutable, self-documenting Python objects whose attributes cannot be reassigned after startup[^python_docs]. Setting `frozen=True` prevents accidental in-place edits to configuration fields, `slots=True` eliminates per-instance `__dict__` hash tables across thousands of metadata records, and `dataclasses.asdict` converts any config cleanly into JSON for logging or checkpoint metadata[^pythonJson2026].

Immutable top-level wrappers still leave one notorious Python trap open when batch records carry nested lists or dictionaries. Calling `.copy()` or `dict(sample)` performs only a shallow copy: outer dictionary keys move to a new container, yet `batch["token_ids"]` still aliases the exact same inner list object in memory, so padding that list in place silently mutates cached inputs. Isolating nested structures with `copy.deepcopy` prevents that corruption completely, though in hot data loops pure functions (`tokens[:max_len] + [pad_id] * pad_count`) that construct fresh output lists are even cleaner because they preserve source inputs with zero deep-copy overhead.

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

```checkpoint
Why does mutating a shallow copy of a cached dataset record alter the original record's token list?
---
A shallow dictionary copy creates a new top-level container, but nested mutable objects such as Python lists remain shared references. Modifying `shallow_copy["token_ids"]` mutates the exact same list in memory. Deep copying recursively allocates independent copies of all nested collections.
```

## Streaming Large JSONL Datasets in Constant Memory

Training corpora and evaluation logs rarely fit comfortably inside RAM as one monolithic JSON array. Loading a single `[...]` array with `json.load` requires parsing the entire file at once and holding every string, dictionary, and integer object alive simultaneously in Python heap memory. JSON Lines (<a href="/glossary/jsonl" data-glossary="jsonl">JSONL</a>) avoids that bottleneck by storing one self-contained JSON <a href="/glossary/dataset-record" data-glossary="dataset-record">dataset record</a> per line. Pairing JSONL with a Python generator using `yield` turns disk reads into a pull-based stream where each record is parsed, transformed, and reclaimed immediately so peak memory remains flat across corpora of any size.

### Lazy Generators and Deterministic Sequence Batching

Writing `def stream_jsonl(path):` with `yield json.loads(line)` returns a single-pass iterator rather than an in-memory list. Composing every filter, tokenizer call, and batcher as another generator creates a pipeline where the ten millionth record stays untouched on disk until batch ten million minus one finishes training. Because an exhausted generator yields nothing on a second loop and raises `TypeError` on `len(gen)`, wrap streaming corpora inside an iterable class whose `__iter__` builds a fresh generator at the start of each epoch.

Pure sequential streaming creates a subtle statistical skew whenever records on disk are sorted by source domain or sequence length, because correlated mini-batches bias gradient descent. Loading the full dataset into memory just to call `random.shuffle` would erase every streaming benefit, so scalable Python loaders maintain a bounded sliding reservoir (`buffer_size`) sampled by an explicit `random.Random(seed)` object[^pythonRandom2026]. Keeping RNG state inside a local `Random(seed)` instance isolates batch ordering from global `random.seed(...)` side effects elsewhere in your codebase. Once `batch_size` ragged sequences leave that shuffled stream, `pad_batch` extends shorter rows to a uniform rectangular `[B, L]` matrix alongside a binary `[B, L]` attention mask marking real tokens with `1` and padding columns with `0`.

<figure>
  <img src="illustrations/_generated/runtime_validation_contract_dark.png" alt="Four variable-length token sequences streamed from JSONL (lengths 4, 2, 5, and 3) are right-padded with pad_id 0 into a uniform 4 by 5 token ID matrix alongside a binary 4 by 5 attention mask marking real tokens with 1 and padding positions with 0." />
  <figcaption>Batch collation turns a ragged JSONL stream into a uniform [4 × 5] token matrix paired with an explicit [4 × 5] attention mask so padding tokens never distort loss or attention weights.</figcaption>
</figure>

Let's assemble that complete streaming generator, `tracemalloc` memory comparison, local-RNG reservoir shuffle, and batch padder in Python, and watch peak heap allocations drop dramatically when records stream lazily rather than materializing in a list.

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

Look closely at that `tracemalloc` gap: materializing 20,000 small records into a Python list exceeds 5 MiB of traced heap allocations, whereas streaming all 70,000 tokens one record at a time stays under 32 KiB, more than 100x smaller. Scaling that same ratio up to a 10-million-line corpus prevents out-of-memory crashes on training hosts before a single gradient step begins. Keep the same memory model in mind once JSON lines are parsed into numeric arrays, because per-object overhead remains expensive inside plain Python lists.

## Memory Layout, Profiling, and Zero-Copy Handoff to NumPy

Knowing why Python lists bloat in memory unlocks a critical rule for performance engineering. Every element in a standard Python `list[float]` requires an 8-byte pointer in the container array plus an independently heap-allocated `PyFloatObject` header and reference count (24 bytes in CPython on 64-bit Linux). Storing records as `list[dict]` adds per-dictionary hash tables on top of every field value, scattering numbers across the heap where CPU cache prefetchers cannot stream them sequentially. The standard library module `array` removes those object wrappers completely: `array('f', values)` stores raw 4-byte IEEE-754 `float32` scalars contiguously in RAM (`400,000` bytes for `100,000` numbers instead of `3.2 MB` for `list[float]` or `19.2 MB` for containers and dicts alone)[^python2026collections], while `struct` packs and unpacks binary shard files using the exact same byte layout[^python2026struct].

Wait before rewriting a slow loop to use `array('f')` by itself, because memory layout and interpreter dispatch are two separate bottlenecks. Even when numbers sit contiguously in `array('f')`, running a Python `for` loop (`sum(x * 1.5 for x in arr)`) still forces CPython's virtual machine to unbox each raw C float into a temporary Python `float` object on every iteration, run dynamic bytecode multiplication, and discard the temporary object. True acceleration happens when Python hands that contiguous buffer pointer directly to C-compiled vectorized code via `np.frombuffer(arr, dtype=np.float32)` without copying a single byte[^numpy2020]. As the benchmark below shows, combining `array('f')` storage with `np.frombuffer` cuts RAM by 8× and speeds up the reduction by roughly 75×.

<figure>
  <img src="illustrations/_generated/ml_eval_safety_net_dark.png" alt="Two bar charts comparing 100,000 float32 records in Python. Memory drops from 19.2 MB for list of dicts and 3.2 MB for list of floats to 0.4 MB for contiguous array('f'). Scaled sum time stays near 1.20 to 1.48 ms in Python loops, then drops to 0.016 ms with zero-copy np.frombuffer." />
  <figcaption>Contiguous storage compresses 100,000 float32 values by 8× relative to a list of floats, while handing that raw buffer directly to NumPy eliminates Python bytecode loop overhead for a ~75× speedup.</figcaption>
</figure>

Let's measure both the exact container footprints and timed `time.perf_counter()` loops on 100,000 values, verify `np.shares_memory(vec, buf)` with `cProfile` hotspot accounting[^python_docs], and observe how aliasing cuts both ways once zero-copy sharing is active.

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

```checkpoint
Why does wrapping an `array.array('f', ...)` with `np.frombuffer` avoid copying data into NumPy?
---
`np.frombuffer` exposes Python's buffer protocol directly, pointing a NumPy array view at the existing C-contiguous memory block without allocating or copying raw bytes. Writing to either `buf` or the view mutates that single shared block in place.
```

Look closely at the `cProfile` count and container footprints together: profiling before optimizing reveals where time actually goes, because `slow_norm` executes 100,001 Python generator frames just to center and square a 100k-element vector. Keeping inputs contiguous lets C loops inside NumPy execute the reduction in microseconds while holding the <a href="/glossary/global-interpreter-lock" data-glossary="global-interpreter-lock">GIL</a> out of the inner arithmetic loop and keeping <a href="/glossary/memory-bandwidth" data-glossary="memory-bandwidth">memory bandwidth</a> saturated. Notice also one subtle engineering consequence of `np.shares_memory(vec, buf) == True`: mutating `buf[0]` immediately updates `vec[0]` and vice versa, so always copy out or freeze views before handing reusable buffers to asynchronous workers.

## Numeric Precision and Serialization Drift

Every JSON hyperparameter file, <a href="/glossary/dtype" data-glossary="dtype">dtype</a> downcast, and metric log passes through floating-point arithmetic. Python's built-in `float` uses IEEE-754 binary64 (`float64`), which represents decimal fractions like `0.1` and `0.2` only approximately, so `0.1 + 0.2 == 0.3` evaluates to `False`[^python2026floatingpoint]. Downcasting features or weights into 4-byte `float32` (`array('f')`) introduces roughly seven decimal digits of rounding precision on top of binary representation error. Whenever Python code compares computed losses, probabilities, or serialized checkpoint hyperparameters, replace exact `==` checks with `math.isclose(actual, expected, rel_tol=..., abs_tol=...)` tuned to your working precision (`1e-6` for `float32`, `1e-9` for `float64`)[^pythonMath2026] while keeping discrete counts (`correct_tokens`, `total_tokens`) as exact integers rather than pre-rounded ratios.

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

Checking tolerances explicitly prevents silent false alarms when loading `float32` weights or metrics stored in JSON, while still catching genuine regressions where a normalization step drops a factor of `len(batch)` or leaves stale padding values inside a mean. Keep exact integer counts separated from floating ratios so evaluation aggregations never drift under repeated serialization.

## Writing Fast `pytest` Regression Checks for Data Code

Silent data pipeline bugs rarely crash training with a Python traceback; instead they corrupt batch padding, break determinism across seeds, or leak target columns while training drifts smoothly toward worse perplexity. A small `pytest` suite running directly inside your `uv` environment catches shape, mask, conservation, and numerical tolerance invariants in milliseconds[^pytest_docs]. Notice what good data tests assert: structural batch invariants (`len(tokens) == len(mask)` and uniform row widths), conservation laws (mask sum equals original clipped sequence length), seed determinism (identical seed produces identical batch order across independent calls), and floating-point checks using `pytest.approx`. Writing those tests once turns every refactor of your dataset loader, batch collator, or feature serializer into a verified change rather than guesswork.

<!-- leetllm: test, id=pytest-suite, output=show -->
```python title="Self-contained pytest suite verifying batch invariants, determinism, and tolerances"
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

Three focused invariants finish in milliseconds inside the locked environment. Run that suite via `uv run pytest` before starting multi-hour training jobs or containerizing your code, because catching a masking off-by-one or an aliasing mutation locally saves every downstream GPU hour. Check all invariants again after changing sequence lengths, padding rules, or numerical serialization dtypes so downstream array code receives clean inputs.

## Putting It Together

Reproducible AI engineering in Python relies on separating flexible orchestration from high-throughput numeric storage cleanly. Lock dependencies with `uv`, hold experiment parameters in `@dataclass(frozen=True, slots=True)`, stream large JSONL corpora with `yield` generators rather than materializing full lists in memory, pass explicit local `random.Random(seed)` objects to shufflers, pack numeric buffers contiguously so NumPy or PyTorch can wrap them without copying, and guard batch invariants with `pytest` and explicit tolerances.

<details>
<summary>Quick reference: Python AI data engineering checklist</summary>

1. Lock Python and numeric packages with `uv sync --locked` and run every script inside `uv run`.
2. Store hyperparameters in `@dataclass(frozen=True, slots=True)` and never share mutable inner containers without pure list reconstruction or `copy.deepcopy`.
3. Stream JSONL files one record at a time with `yield`, using a bounded shuffle buffer driven by an explicit `random.Random(seed)`.
4. Pad ragged token sequences into uniform `[B, L]` matrices paired with a binary `[B, L]` attention mask so filler IDs never contribute to loss or attention.
5. Profile hotspots with `cProfile` and `time.perf_counter`, store flat numeric streams in `array('f')` or contiguous NumPy arrays, and verify invariants with `pytest` and `math.isclose`.

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
