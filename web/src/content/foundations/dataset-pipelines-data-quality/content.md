---
{
  "id": "dataset-pipelines-data-quality",
  "title": "Dataset Pipelines and Data Quality",
  "slug": "dataset-pipelines-data-quality",
  "section": "ML Algorithms & Evaluation",
  "category": "MLOps & Deployment",
  "difficulty": "Medium",
  "order": 15,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Records that differ only by whitespace can place the same conversation in both train and test. Schema validation, grouped splits, deduplication, and versioned manifests prevent that leakage.",
  "keyConceptsTested": [
    "schema and semantic validation",
    "normalization and exact fingerprints",
    "conflicting duplicate quarantine",
    "stable grouped split assignment",
    "benchmark contamination checks",
    "near-duplicate review",
    "dataset manifest and datasheet"
  ]
}
---

Rows 101 and 102 look like two separate training examples because one says `"Build is still failing"` and the other says `"  BUILD is still failing  "`. Both come from the same conversation thread, `c-51`. If a random split sends row 101 to training and row 102 to test, your held-out score measures whether the model memorized a sentence it already saw rather than whether it generalizes to new conversations.

Clean models start long before the training loop. We will trace raw exported records through schema validation, deterministic text normalization, label-conflict quarantine, conversation-grouped splits, MinHash LSH near-deduplication, and SHA-256 dataset manifests so every held-out metric actually reflects unseen data.

## Schema validation and type enforcement

Start by writing down the exact schema your text router expects:

| Field | Type | Meaning | Why it matters |
|---|---|---|---|
| `ticket_id` | `int` | Unique exported row identifier | Traces errors back to the source record. |
| `conversation_id` | `str` | Multi-turn thread identifier | Keeps every turn of a thread in one split. |
| `text` | `str` | Raw message text | Becomes the model input after normalization. |
| `label` | `str` | `standard` or `escalate` | Supervised target class. |

Even a four-row batch exposes two classic ingestion hazards: row 102 repeats row 101 with extra whitespace and uppercase letters, while row 104 has no label at all:

| Ticket | Raw message | Label | Diagnosis |
|---:|---|---|---|
| 101 | `Build is still failing` | `escalate` | Valid annotated example. |
| 102 | `  BUILD is still failing  ` | `escalate` | Normalized duplicate of row 101 in `c-51`. |
| 103 | `Where is the tokenizer config?` | `standard` | Valid annotated example. |
| 104 | `Validation batch has no reviewed label` | `None` | Missing required target label. |

Reliable ingestion separates three layers of validation: **structural checks** (column presence and strict types so `"101"` or `True` cannot silently coerce to an integer ID), **domain checks** (valid label vocabularies and numeric ranges), and **distributional checks** (sudden spikes in nulls or class skew).

In Python, Pydantic validates strict row schemas (`StrictInt`, `extra="ignore"` vs `"forbid"`),[^pydanticStrict2026][^pydanticModels2026] Pandera checks DataFrame columns and ranges in batches,[^panderaSchemas2026] and Great Expectations runs multi-rule validation suites.[^gxCheckpoints2026] Here Pydantic catches missing or malformed fields before rows reach a DataFrame:

<!-- leetllm: test, output=show, output_title="Schema validation" -->

```python title="01-schema-validation.py"
from typing import Literal
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr, ValidationError


class SupportTicket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ticket_id: StrictInt = Field(gt=0)
    conversation_id: StrictStr = Field(min_length=1)
    text: StrictStr = Field(min_length=1)
    label: Literal["standard", "escalate"]


raw_rows = [
    {"ticket_id": 101, "conversation_id": "c-51", "text": "Build is still failing", "label": "escalate"},
    {"ticket_id": 102, "conversation_id": "c-51", "text": "  BUILD is still failing  ", "label": "escalate"},
    {"ticket_id": 103, "conversation_id": "c-52", "text": "Where is the tokenizer config?", "label": "standard"},
    {"ticket_id": 104, "conversation_id": "c-53", "text": "Validation batch has no reviewed label", "label": None},
]

accepted, rejected = [], []
for row in raw_rows:
    try:
        record = SupportTicket.model_validate(row)
        if not record.text.strip() or record.conversation_id != record.conversation_id.strip():
            raise ValueError("whitespace rule violated")
        accepted.append(record.model_dump())
    except (ValidationError, ValueError) as exc:
        rejected.append({"ticket_id": row.get("ticket_id"), "reason": type(exc).__name__})

df_accepted = pd.DataFrame(accepted)
print("accepted ids:", df_accepted["ticket_id"].tolist())
print("rejected:", rejected)
```

<!-- leetllm: output:start -->
```text title="Schema validation" output compact
accepted ids: [101, 102, 103]
rejected: [{'ticket_id': 104, 'reason': 'ValidationError'}]
```
<!-- leetllm: output:end -->

> **Common mistake:** Schema validation verifies data types and allowed labels, not annotation accuracy. A mislabeled row (`escalate` instead of `standard`) passes Pydantic cleanly; track human annotation review separately.

## Deterministic normalization and exact fingerprinting

Whitespace and capitalization in row 102 do not change routing intent, though real engineering text can contain case-sensitive symbols (`Prod` vs `prod`) or meaningful code indentation. Keep unmodified raw records in archive storage so you can re-normalize later without losing information.

Unicode provides canonical (`NFC`, `NFD`) and compatibility (`NFKC`, `NFKD`) normalization forms; `NFKC` folds compatibility variants like ligature `ﬁ` to `fi` and superscript `²` to `2`.[^unicodeNormalization2026] Combining `NFKC`, `str.casefold()` (which maps German `ß` to `ss`), and whitespace collapse yields a deterministic equivalence key without stripping negation words like `not`. Hashing that normalized string with SHA-256 gives a compact **exact fingerprint** (record Python and Unicode versions alongside it for reproducibility):[^pythonUnicodeData2026][^pythonHashlib2026]

<!-- leetllm: test, output=show, output_title="Exact fingerprints" -->

```python title="02-normalize-and-fingerprint.py"
import hashlib
import unicodedata


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    return " ".join(normalized.casefold().split())


def fingerprint(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


messages = [
    "Build is still failing",
    "  BUILD is still failing  ",
    "Build is not failing",
]
hashes = [fingerprint(m) for m in messages]
for message, digest in zip(messages, hashes):
    print(normalize_text(message), digest[:12])
print("first two match:", hashes[0] == hashes[1])
print("negation distinct:", hashes[0] != hashes[2])
```

<!-- leetllm: output:start -->
```text title="Exact fingerprints" output compact
build is still failing c53011fb9834
build is still failing c53011fb9834
build is not failing e038c1b99d05
first two match: True
negation distinct: True
```
<!-- leetllm: output:end -->

Rows 101 and 102 collapse to the same prefix `c53011fb9834`, while `"Build is not failing"` keeps a distinct digest `e038c1b99d05`. (Key production indexes on the full 64-character SHA-256 string rather than a truncated prefix.)

```checkpoint
Why normalize text before computing its exact fingerprint?
---
Normalization defines which surface variants, such as capitalization and extra spaces, map to the same lookup key while preserving semantic distinctions like negation. Keep the unnormalized source text intact and verify the equivalence rule on realistic code and identifier examples before dropping duplicates.
```

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Tickets 101 and 102 from conversation c-51 differ in case and outer spaces, but NFKC normalization, case folding, whitespace collapse, and SHA-256 give them the same fingerprint prefix c53011fb9834. A row split can place the normalized copies in train and test; grouping by conversation keeps both in one partition." />
  <figcaption>A row-level split places ticket 101 in train and its normalized duplicate 102 in test, splitting conversation <code>c-51</code> across partitions. Grouping by <code>conversation_id</code> keeps every message from the thread in a single split.</figcaption>
</figure>

## Quarantine for conflicting duplicate labels

What if rows 201, 202, and 203 all normalize to `"migration blocked for 12 days"`, yet rows 201 and 202 are labeled `escalate` while row 203 is labeled `standard`? Keeping the first row silently hides label disagreement caused by annotation drift or missing context. Quarantine the entire conflicting group for review instead:

<!-- leetllm: test, output=show, output_title="Conflict quarantine" -->

```python title="03-conflicting-labels.py"
import unicodedata
import pandas as pd


def normalize_key(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


df = pd.DataFrame([
    {"ticket_id": 201, "text": "Migration blocked for 12 days", "label": "escalate"},
    {"ticket_id": 202, "text": " migration blocked for 12 days ", "label": "escalate"},
    {"ticket_id": 203, "text": "Migration blocked for 12 days", "label": "standard"},
    {"ticket_id": 204, "text": "Tokenizer config updated", "label": "standard"},
])
df["norm_key"] = df["text"].map(normalize_key)

kept, quarantined = [], []
for _, group in df.groupby("norm_key", sort=False):
    if group["label"].nunique() > 1:
        quarantined.extend(group["ticket_id"].tolist())
    else:
        kept.append(int(group.iloc[0]["ticket_id"]))

print("kept representative rows:", kept)
print("quarantined label conflict:", quarantined)
```

<!-- leetllm: output:start -->
```text title="Conflict quarantine" output compact
kept representative rows: [204]
quarantined label conflict: [201, 202, 203]
```
<!-- leetllm: output:end -->

Grouping on normalized strings directly keeps rows 201–203 in quarantine and passes singleton row 204 through cleanly. In the full pipeline builder below, we also flag exact repeats that appear across *different* conversations so boilerplate macros cannot silently skew class counts.

## Grouped splits and leakage prevention

When your model must generalize to **unseen conversations**, every turn of thread `c-51` must stay on one side of the split. Splitting turns across train and test creates **entity leakage** through shared phrasing, hostnames, and context. Match the grouping key to your real generalization unit (for example, group by incident if multiple threads discuss the same outage).[^sklearn_groupkfold]

On a static snapshot, scikit-learn's `GroupShuffleSplit` keeps groups intact. For growing datasets where new conversations arrive daily, hashing `conversation_id` with SHA-256 assigns each thread deterministically so existing splits stay stable as data grows. For forecasting tasks, combine group isolation with a chronological cutoff and fit tokenizers or scalers solely on the training split:

<!-- leetllm: test, output=show, output_title="Grouped split" -->

```python title="04-stable-grouped-split.py"
import hashlib
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit


def split_for_conversation(conversation_id: str) -> str:
    bucket = int(hashlib.sha256(conversation_id.encode("utf-8")).hexdigest()[:8], 16) % 100
    if bucket < 70:
        return "train"
    if bucket < 85:
        return "validation"
    return "test"


df = pd.DataFrame([
    {"ticket_id": 301, "conversation_id": "build-001"},
    {"ticket_id": 315, "conversation_id": "build-001"},
    {"ticket_id": 303, "conversation_id": "build-005"},
    {"ticket_id": 304, "conversation_id": "build-006"},
])
df["hash_split"] = df["conversation_id"].map(split_for_conversation)

gss = GroupShuffleSplit(n_splits=1, test_size=0.33, random_state=42)
train_idx, test_idx = next(gss.split(df, groups=df["conversation_id"]))
print("hash assignments:", list(zip(df["ticket_id"], df["hash_split"])))
print("build-001 hash match:", len(df.loc[df["conversation_id"] == "build-001", "hash_split"].unique()) == 1)
print("GroupShuffleSplit train ids:", df.iloc[train_idx]["ticket_id"].tolist(), "test ids:", df.iloc[test_idx]["ticket_id"].tolist())
```

<!-- leetllm: output:start -->
```text title="Grouped split" output compact
hash assignments: [(301, 'train'), (315, 'train'), (303, 'validation'), (304, 'test')]
build-001 hash match: True
GroupShuffleSplit train ids: [303, 304] test ids: [301, 315]
```
<!-- leetllm: output:end -->

Both turns of `build-001` stay together under deterministic hashing and `GroupShuffleSplit`. Because conversation lengths vary widely, check split counts and class balance right after assigning groups.

```checkpoint
Two rows come from the same conversation. Why isn't a random row-level split enough?
---
Evaluating generalization on unseen conversations requires keeping every turn of each conversation on one side of the split. Beyond group keys, production splits must still check for shared underlying incidents, near-duplicate copy-paste, and future-timestamp feature leakage.
```

## Benchmark contamination and deduplication checks

Web crawls and vendor datasets frequently absorb public evaluation benchmarks. During GPT-3 pretraining, a bug in an overlap filter missed matches inside long documents and forced the authors to withdraw four benchmarks.[^brown2020] An exact normalized fingerprint check catches verbatim overlaps immediately:

<!-- leetllm: test, output=show, output_title="Exact contamination check" -->

```python title="05-exact-contamination.py"
import hashlib
import unicodedata


def clean(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def fp(text: str) -> str:
    return hashlib.sha256(clean(text).encode("utf-8")).hexdigest()


training = ["check gradient norms every 50 steps", "tokenizer config updated"]
locked_eval = ["CHECK GRADIENT norms every 50 steps", "held-out split check pending"]
train_keys = {fp(text) for text in training}
collisions = [text for text in locked_eval if fp(text) in train_keys]

print("exact collisions:", collisions)
print("clean of exact matches:", len(collisions) == 0)
```

<!-- leetllm: output:start -->
```text title="Exact contamination check" output compact
exact collisions: ['CHECK GRADIENT norms every 50 steps']
clean of exact matches: False
```
<!-- leetllm: output:end -->

Exact hashing misses benchmark questions embedded inside longer prose or light paraphrases. Pair it with $n$-gram substring scans (reviewing boilerplate false positives) and keep held-out tasks isolated across pretraining, fine-tuning, retrieval indexes, and few-shot prompts. When training corpora are private, black-box membership probes like Min-K% offer noisy signals rather than definitive proof, as Samuel et al. (2025) demonstrated across instruction-tuned rewrites.[^samuel2025Contamination]

## Near-duplicate detection: MinHash, shingling, and LSH

Adding one word turns `"build has not passed"` into `"my build has not passed"` and produces a completely different SHA-256 hash, even though three of four adjacent word pairs match. Breaking text into contiguous word $n$-grams (**shingles**) and computing **Jaccard similarity** $J(A, B) = |A \cap B| / |A \cup B|$ recovers that overlap (`3 / 4 = 0.75`):

<!-- leetllm: test, output=show, output_title="Near-duplicate review queue" -->

```python title="06-shingle-overlap.py"
def shingles(text: str, width: int = 2) -> set[tuple[str, ...]]:
    words = text.casefold().split()
    if not words:
        return set()
    if len(words) < width:
        return {tuple(words)}
    return {tuple(words[index:index + width]) for index in range(len(words) - width + 1)}


def jaccard(left: str, right: str) -> float:
    a, b = shingles(left), shingles(right)
    union = a | b
    return len(a & b) / len(union) if union else 0.0


score = jaccard("build has not passed", "my build has not passed")
print("shared pair score:", round(score, 2))
print("send to human review:", score >= 0.70)
```

<!-- leetllm: output:start -->
```text title="Near-duplicate review queue" output compact
shared pair score: 0.75
send to human review: True
```
<!-- leetllm: output:end -->

Comparing all pairs takes $O(N^2)$ time, which explodes at web scale. **MinHash** compresses each shingle set into $K$ minimum hash ranks using $K$ hash functions.[^broder1997] Because the smallest element of $A \cup B$ under a random permutation is equally likely to be any union member, two sets share the same minimum rank at coordinate $k$ with probability equal to their Jaccard similarity:

$$
P\left(s_k(A) = s_k(B)\right) = J(A, B).
$$

**Locality-Sensitive Hashing (LSH)** splits those $K = br$ signature values into $b$ bands of $r$ rows each. Two documents become candidate pairs if *every* row in at least one band matches, giving candidate probability $P(\text{candidate} \mid s) = 1 - (1 - s^r)^b$ under independent hashes. Using FineWeb's configuration ($b = 14$ bands of $r = 8$ rows) produces a sharp S-curve around $J \approx 0.70$–$0.80$:[^penedo2024]

<!-- leetllm: test, output=show, output_title="LSH candidate probabilities" -->

```python title="06b-lsh-recall.py"
import numpy as np

bands, rows_per_band = 14, 8
similarities = np.array([0.50, 0.70, 0.75, 0.85])
probs = 1.0 - (1.0 - similarities ** rows_per_band) ** bands
for s, p in zip(similarities, probs):
    print(f"J={s:.2f}: candidate probability {p:.1%}")
```

<!-- leetllm: output:start -->
```text title="LSH candidate probabilities" output compact
J=0.50: candidate probability 5.3%
J=0.70: candidate probability 56.5%
J=0.75: candidate probability 77.2%
J=0.85: candidate probability 98.8%
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/pipeline_contract_dark.png" alt="The LSH candidate curve uses the FineWeb 2024 configuration of 14 bands with 8 hash rows each. Under ideal independence, candidate probability is 1 − (1 − s⁸)¹⁴: 5.3% at Jaccard similarity 0.50, 56.5% at 0.70, 77.2% at 0.75, and 98.8% at 0.85. At 0.75, the remaining 22.8% are missed by candidate generation." />
  <figcaption>With 14 bands of 8 rows, candidate recall rises steeply from 5.3% at similarity 0.50 to 98.8% at 0.85, capturing 77.2% of pairs at 0.75 while bucket caps prevent boilerplate pages from causing quadratic blowups.</figcaption>
</figure>

Thresholded similarity is **not transitive**: `A` can match `B` and `B` can match `C` while `A` and `C` share little overlap. Merging connected components blindly can collapse distinct documents into one cluster:

<!-- leetllm: test, output=show, output_title="A duplicate chain isn't all-pairs agreement" -->

```python title="06c-duplicate-chain.py"
messages = {
    "A": "build has failed",
    "B": "build has failed again",
    "C": "has failed again",
}


def pairs(text: str) -> set[tuple[str, str]]:
    words = text.split()
    return set(zip(words, words[1:]))


for left, right in [("A", "B"), ("B", "C"), ("A", "C")]:
    a, b = pairs(messages[left]), pairs(messages[right])
    score = len(a & b) / len(a | b)
    print(f"{left}/{right}: J={score:.3f}; matches at 0.60: {score >= 0.60}")
```

<!-- leetllm: output:start -->
```text title="A duplicate chain isn't all-pairs agreement" output compact
A/B: J=0.667; matches at 0.60: True
B/C: J=0.667; matches at 0.60: True
A/C: J=0.333; matches at 0.60: False
```
<!-- leetllm: output:end -->

At pretraining scale, careful deduplication pays off dramatically: Lee et al. (2022) reduced memorization roughly tenfold while preserving benchmark accuracy, and Dolma combined Bloom filters across URL, document, and paragraph scopes.[^lee2022][^soldaini2024]

```checkpoint
Two messages have Jaccard shingle similarity 0.92. Should the pipeline delete one automatically?
---
Wait before deleting solely on score: queue high-similarity pairs to verify whether context or labels differ across records. Automatic deletion can work on massive web corpora once bucket sizes and downstream task impact are validated, whereas smaller supervised sets benefit from human review.
```

## Privacy, PII detection, and data lineage

Support logs mix model inputs with **personally identifiable information (PII)** like emails, phone numbers, and internal IDs. Because language models can memorize rare strings, scrub sensitive data at ingestion using layered detectors: regex patterns for structured identifiers, NER models for names and locations, and toolkits like Presidio.[^presidio2023] Pipelines either drop PII-heavy documents (as Dolma did when more than five spans matched) or substitute typed placeholders like `<EMAIL>`.[^soldaini2024]

<!-- leetllm: test, output=show, output_title="Sensitive-data quarantine" -->

```python title="10-sensitive-data-quarantine.py"
import re
import pandas as pd

email_pattern = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
df = pd.DataFrame([
    {"ticket_id": 501, "text": "Build run #8841 mentions a private timeline"},
    {"ticket_id": 502, "text": "Send updates to alex@example.com please"},
])
has_email = df["text"].str.contains(email_pattern, regex=True)

print("no email match in this narrow scan:", df.loc[~has_email, "ticket_id"].tolist())
print("redaction review required:", df.loc[has_email, "ticket_id"].tolist())
```

<!-- leetllm: output:start -->
```text title="Sensitive-data quarantine" output compact
no email match in this narrow scan: [501]
redaction review required: [502]
```
<!-- leetllm: output:end -->

Notice that row 501 passed the email regex yet still carries an internal build identifier (`#8841`). Pair automated redaction with **origin metadata** (source, collection context, license) and **execution lineage** (such as OpenLineage run events).[^openLineageRun2026] Storage layers like DVC track immutable file hashes alongside Git, while Delta Lake and Apache Iceberg snapshots remain queryable until retention jobs (`VACUUM` or snapshot expiration) prune old versions.[^dvcCache2026][^deltaTimeTravel2026][^icebergMaintenance2026]

## Web-scale corpus filtering and synthetic data quality

Large pretraining and post-training pipelines combine three filtering stages (FineWeb's ablations showed that snapshot-level deduplication plus targeted heuristics outperformed overly aggressive global pruning):[^penedo2024]

1. **Heuristic filtering:** Drop broken HTML and repetitive boilerplate using length ranges, symbol ratios (tuned carefully so source code and math survive), stopword counts, and repeated-line ratios. Measure drop rates per language and domain so a filter never silently wipes out code or non-English slices.
2. **Reference perplexity scoring:** Score candidate text under a fixed reference language model and tokenizer (as in CCNet):[^wenzek2019]

$$
\text{PPL}(X) = \exp\left( -\frac{1}{N} \sum_{i=1}^N \log P(x_i \mid x_{<i}) \right).
$$

   Very high perplexity catches garbled OCR alongside valid jargon or code; suspiciously low perplexity flags repetitive headers. Always measure downstream validation impact before locking cutoffs.
3. **Synthetic data verification:** Fluent teacher models still emit subtle logic or code bugs. Record the teacher model, decoding settings, and prompt template; keep held-out benchmarks out of teacher context; verify code and math with executable tests; and calibrate LLM-as-judge filters against human-labeled examples.

## Building a reproducible candidate artifact

Now assemble all stages into a deterministic builder that validates rows with Pydantic, normalizes text, quarantines label conflicts and cross-conversation duplicates, assigns conversation-grouped splits, and writes immutable JSONL files plus a SHA-256 manifest (paired with a structured datasheet in production).[^gebru2021]

<!-- leetllm: test, id=dataset-artifact, output=show, output_title="Versioned artifact" -->

```python title="07-build-dataset-artifact.py"
import hashlib
import json
import platform
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Literal
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr, ValidationError


class CleanTicket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ticket_id: StrictInt = Field(gt=0)
    conversation_id: StrictStr = Field(min_length=1)
    text: StrictStr = Field(min_length=1)
    label: Literal["standard", "escalate"]


raw_rows = [
    {"ticket_id": 401, "conversation_id": "c-a", "text": "Build is still failing", "label": "escalate"},
    {"ticket_id": 402, "conversation_id": "c-a", "text": " BUILD is still failing ", "label": "escalate"},
    {"ticket_id": 403, "conversation_id": "c-i", "text": "Tokenizer config seems stale", "label": "standard"},
    {"ticket_id": 404, "conversation_id": "c-c", "text": "Checkpoint save step has no label", "label": None},
    {"ticket_id": 405, "conversation_id": "c-002", "text": "Quantized model will not load", "label": "standard"},
    {"ticket_id": 406, "conversation_id": "c-e", "text": "Migration ran twice in production", "label": "escalate"},
    {"ticket_id": 407, "conversation_id": "c-l", "text": "Deploy completed this morning", "label": "standard"},
    {"ticket_id": 408, "conversation_id": "build-003", "text": "Build stalled after approval", "label": "escalate"},
    {"ticket_id": 409, "conversation_id": "c-m", "text": "Eval batch pending review", "label": "standard"},
    {"ticket_id": 410, "conversation_id": "c-m", "text": "Eval batch pending review", "label": "escalate"},
    {"ticket_id": 411, "conversation_id": "c-x", "text": "Adapter config file missing", "label": "standard"},
    {"ticket_id": 412, "conversation_id": "c-y", "text": "Adapter config file missing", "label": "standard"},
]


def normalize_text(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def text_fingerprint(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def validate_row(row: dict) -> tuple[CleanTicket | None, str | None]:
    try:
        rec = CleanTicket.model_validate(row)
    except ValidationError as exc:
        field = exc.errors()[0]["loc"][0] if exc.errors() else "schema"
        return None, f"invalid_{field}"
    if not rec.text.strip():
        return None, "blank_text"
    if rec.conversation_id != rec.conversation_id.strip():
        return None, "invalid_conversation_id"
    return rec, None


def stable_split(conversation_id: str) -> str:
    bucket = int(hashlib.sha256(conversation_id.encode("utf-8")).hexdigest()[:8], 16) % 100
    if bucket < 70:
        return "train"
    if bucket < 85:
        return "validation"
    return "test"


def prepare_rows(input_rows: list[dict]):
    validated, rejected = [], []
    for row in input_rows:
        rec, reason = validate_row(row)
        if reason:
            rejected.append({"ticket_id": row.get("ticket_id"), "reason": reason})
        else:
            validated.append(rec)

    id_counts = Counter(rec.ticket_id for rec in validated)
    prepared_by_text = defaultdict(list)
    for rec in validated:
        if id_counts[rec.ticket_id] > 1:
            rejected.append({"ticket_id": rec.ticket_id, "reason": "duplicate_ticket_id"})
            continue
        text = normalize_text(rec.text)
        prepared_by_text[text].append({
            "ticket_id": rec.ticket_id,
            "conversation_id": rec.conversation_id,
            "text": text,
            "label": rec.label,
            "text_sha256": text_fingerprint(text),
        })

    kept = []
    for duplicate_group in prepared_by_text.values():
        labels = {row["label"] for row in duplicate_group}
        conversations = {row["conversation_id"] for row in duplicate_group}
        reason = ("label_conflict" if len(labels) > 1 else
                  "cross_conversation_duplicate" if len(conversations) > 1 else None)
        if reason:
            rejected.extend({"ticket_id": row["ticket_id"], "reason": reason}
                            for row in duplicate_group)
            continue
        duplicate_group.sort(key=lambda row: row["ticket_id"])
        representative = duplicate_group[0]
        kept.append({**representative, "split": stable_split(representative["conversation_id"])})
        rejected.extend({"ticket_id": row["ticket_id"], "reason": "exact_duplicate"}
                        for row in duplicate_group[1:])

    kept.sort(key=lambda row: row["ticket_id"])
    rejected.sort(key=lambda row: (str(row["ticket_id"]), row["reason"]))
    return kept, rejected


kept, rejected = prepare_rows(raw_rows)
assert len(kept) + len(rejected) == len(raw_rows)

output = Path("artifacts")
output.mkdir(exist_ok=True)
rows_path = output / "dev_tickets.v1.jsonl"
rejects_path = output / "dev_tickets.v1.rejects.jsonl"
rows_path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in kept), encoding="utf-8", newline="\n")
rejects_path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rejected), encoding="utf-8", newline="\n")
artifact_sha256 = hashlib.sha256(rows_path.read_bytes()).hexdigest()
df_kept = pd.DataFrame(kept)
manifest = {
    "dataset_id": "developer-ticket-routing",
    "version": "v1",
    "status": "candidate_not_released",
    "pipeline_version": "nfkc-casefold-space__within-conversation-dedup__cross-group-review__v1",
    "source_snapshot": "support-routing-batch-v1",
    "source_sha256": hashlib.sha256(json.dumps(raw_rows, sort_keys=True).encode("utf-8")).hexdigest(),
    "python_version": platform.python_version(),
    "unicode_version": unicodedata.unidata_version,
    "split_rule": "sha256(conversation_id)[:8] modulo 100; 70/15/15 thresholds",
    "rows_raw": len(raw_rows),
    "rows_kept": len(kept),
    "reject_reasons": dict(Counter(row["reason"] for row in rejected)),
    "split_counts": df_kept["split"].value_counts().to_dict(),
    "artifact_sha256": artifact_sha256,
    "rejects_sha256": hashlib.sha256(rejects_path.read_bytes()).hexdigest(),
    "pending_reviews": ["split_coverage", "locked_benchmark_overlap", "near_duplicates", "privacy_and_license"],
}
(output / "dev_tickets.v1.manifest.json").write_text(
    json.dumps(manifest, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
    newline="\n",
)
print("kept rows:", manifest["rows_kept"], "rejected:", manifest["reject_reasons"])
print("split counts:", manifest["split_counts"])
print("artifact digest prefix:", artifact_sha256[:16])
print("status:", manifest["status"])
```

<!-- leetllm: output:start -->
```text title="Versioned artifact" output compact
kept rows: 6 rejected: {'exact_duplicate': 1, 'invalid_label': 1, 'label_conflict': 2, 'cross_conversation_duplicate': 2}
split counts: {'train': 3, 'validation': 2, 'test': 1}
artifact digest prefix: e105555ad3fab608
status: candidate_not_released
```
<!-- leetllm: output:end -->

## Verifying the candidate artifact before training

Training loaders should verify six properties before allocating GPUs: zero conversation overlap across splits, exact split hash adherence, matching SHA-256 digests for data and rejection logs, valid schemas, recomputed text fingerprints, and exact row conservation (`kept + rejected == raw`):

<!-- leetllm: test, continue=dataset-artifact, id=dataset-verified, output=show, output_title="Artifact check" -->

```python title="08-verify-artifact.py"
import hashlib
import json
from collections import Counter
import pandas as pd

rows = [json.loads(line) for line in rows_path.read_text(encoding="utf-8").splitlines()]
saved_manifest = json.loads((output / "dev_tickets.v1.manifest.json").read_text(encoding="utf-8"))
saved_rejects = [json.loads(line) for line in rejects_path.read_text(encoding="utf-8").splitlines()]
df_rows = pd.DataFrame(rows)

no_group_leakage = bool((df_rows.groupby("conversation_id")["split"].nunique() == 1).all())
split_rule_matches = bool((df_rows["split"] == df_rows["conversation_id"].map(stable_split)).all())
digest_matches = hashlib.sha256(rows_path.read_bytes()).hexdigest() == saved_manifest["artifact_sha256"]
reject_digest_matches = hashlib.sha256(rejects_path.read_bytes()).hexdigest() == saved_manifest["rejects_sha256"]
schema_valid = all(validate_row(row)[1] is None for row in rows)
fingerprints_match = all(
    row["text"] == normalize_text(row["text"]) and row["text_sha256"] == text_fingerprint(row["text"])
    for row in rows
)
identities_unique = df_rows["ticket_id"].is_unique and df_rows["text"].is_unique
counts_match = (
    len(rows) == saved_manifest["rows_kept"]
    and len(rows) + len(saved_rejects) == saved_manifest["rows_raw"]
    and df_rows["split"].value_counts().to_dict() == saved_manifest["split_counts"]
    and dict(Counter(row["reason"] for row in saved_rejects)) == saved_manifest["reject_reasons"]
)
checks = {
    "conversation and split rule": no_group_leakage and split_rule_matches,
    "artifact and rejection digests": digest_matches and reject_digest_matches,
    "row schema": schema_valid,
    "recomputed fingerprints": fingerprints_match,
    "unique IDs and normalized texts": identities_unique,
    "manifest counts": counts_match,
}
for name, passed in checks.items():
    print(f"{name}: {passed}")
if not all(checks.values()):
    raise ValueError(f"candidate verification failed: {checks}")
```

<!-- leetllm: output:start -->
```text title="Artifact check" output compact
conversation and split rule: True
artifact and rejection digests: True
row schema: True
recomputed fingerprints: True
unique IDs and normalized texts: True
manifest counts: True
```
<!-- leetllm: output:end -->

Recomputing SHA-256 digests catches file truncation or silent overwrites immediately. Store approved digests in your experiment tracker so loaders verify against an external reference rather than only a local unsigned file.

## Auditing distribution drift and split coverage

Clean schemas and digests still leave a crucial question open: does every split actually contain all target classes and comparable text lengths?

<!-- leetllm: test, continue=dataset-verified, output=show, output_title="Coverage check" -->

```python title="09-split-coverage.py"
import numpy as np
import pandas as pd
from scipy.stats import wasserstein_distance

required_labels = {"standard", "escalate"}
df_rows["word_len"] = df_rows["text"].str.split().str.len()
coverage = {split: sorted(grp["label"].unique().tolist()) for split, grp in df_rows.groupby("split")}
missing = {
    split: sorted(required_labels - set(coverage.get(split, [])))
    for split in ["train", "validation", "test"]
    if required_labels - set(coverage.get(split, []))
}
train_lens = df_rows.loc[df_rows["split"] == "train", "word_len"].to_numpy()
val_lens = df_rows.loc[df_rows["split"] == "validation", "word_len"].to_numpy()
len_shift = float(wasserstein_distance(train_lens, val_lens))

print("coverage:", coverage)
print("missing labels:", missing)
print("word-length Wasserstein distance (train vs val):", round(len_shift, 3))
print("label coverage passes:", not missing)
```

<!-- leetllm: output:start -->
```text title="Coverage check" output compact
coverage: {'test': ['standard'], 'train': ['escalate'], 'validation': ['standard']}
missing labels: {'train': ['standard'], 'validation': ['escalate'], 'test': ['escalate']}
word-length Wasserstein distance (train vs val): 0.333
label coverage passes: False
```
<!-- leetllm: output:end -->

Here `train` holds only `escalate` rows while `validation` and `test` hold only `standard` rows! Inspect raw class counts and length quantiles alongside formal distance metrics like Wasserstein distance or Kolmogorov-Smirnov tests.[^scipyKs2Sample2026][^scipyWasserstein2026] When coverage breaks, collect more annotated groups or use stratified group splitting rather than hand-moving rows after inspecting scores.

## Tracking dataset versions across pipeline evolutions

When cleaning rules change between `v1` and `v2` and validation accuracy shifts by two points, deterministic JSONL digests immediately tell you whether the training data actually changed (whereas cache keys in tools like Hugging Face Datasets are designed for local reuse rather than immutable experiment logging):[^hfDatasetsCache2026]

<!-- leetllm: test, output=show, output_title="Version comparison" -->

```python title="11-version-comparison.py"
import hashlib
import json


def digest(rows: list[dict]) -> str:
    payload = "\n".join(json.dumps(row, sort_keys=True) for row in rows) + "\n"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


v1 = [{"text": "build missing", "label": "escalate"}]
v2 = [*v1, {"text": "quantized checkpoint broken", "label": "standard"}]
d1, d2 = digest(v1), digest(v2)
print("v1:", d1[:12], "rows:", len(v1))
print("v2:", d2[:12], "rows:", len(v2))
print("version changed:", d1 != d2)
```

<!-- leetllm: output:start -->
```text title="Version comparison" output compact
v1: 6045599184e8 rows: 1
v2: 96cb882d3e5a rows: 2
version changed: True
```
<!-- leetllm: output:end -->

## Scaling small-batch safeguards to large AI corpora

The same mechanisms scale from twelve support tickets to billion-document pretraining corpora stored in Parquet or Iceberg:

| Small lesson mechanism | Large-scale AI and foundation model equivalent |
|---|---|
| Schema validation | Strict Pydantic/Pandera validators reject malformed records before storage. |
| Unicode `NFKC` + casefold | Normalizes lookup keys while guarding task-specific symbols like code identifiers. |
| Conflicting-label quarantine | Routes ambiguous supervision to human adjudication instead of training on noise. |
| Grouped split by conversation | Isolates threads, documents, and time cutoffs so evaluation reflects unseen entities. |
| MinHash LSH near-deduplication | Compresses crawl corpora into signatures while capping bucket sizes against chaining. |
| Benchmark contamination scan | Screens pretraining, fine-tuning, and retrieval pools for exact and $n$-gram overlap. |
| Sensitive-data review | Combines regex/NER detection, redaction rules, and access controls before release. |
| Manifest and datasheet | Pins byte digests, transform versions, split coverage, and open review items. |

## Controlled failure labs: break the pipeline on purpose

<details>
<summary>Try four quick mutations to verify each check catches its target failure</summary>

1. **Simulate entity leakage:** In `08-verify-artifact.py`, append `{**rows[0], "ticket_id": 999, "split": "test"}` to `rows` and watch `conversation and split rule`, `unique IDs and normalized texts`, and `manifest counts` fail together.
2. **Simulate file corruption:** Append an extra newline to `rows_path` after loading `saved_manifest` and watch `digest_matches` flip to `False`.
3. **Test shingling edges:** In `06-shingle-overlap.py`, call `jaccard("build", "build")` (`1.0`) and `jaccard("", "")` (`0.0`).
4. **Break group splitting:** In `04-stable-grouped-split.py`, hash `str(row["ticket_id"])` instead of `row["conversation_id"]` so tickets `301` and `315` from `build-001` split across `train` and `validation`.

</details>

## Carrying clean data into feature engineering

A versioned manifest locks raw snapshots, cleaning rules, grouped splits, and SHA-256 digests into one reproducible package. With clean, leak-free records in place, [Feature Engineering for Production ML](/learn/feature-engineering-production-ml) tackles the next step: keeping every derived feature knowable at decision time and identical between offline training and live serving.

```mastery-quiz
[
  {
    "question": "A validator uses the lesson’s strict positive-integer ticket ID rule and permits extra fields. Four otherwise valid rows have IDs 81, \"82\", true and 84; row 84 also has a locale field. Which IDs pass local schema validation, and does that certify human annotation review?",
    "options": [
      "81 only; the label vocabulary implies review.",
      "81 and \"82\"; the label vocabulary implies review.",
      "81 and 84; annotation review remains separate.",
      "81, true and 84; annotation review remains separate."
    ],
    "answer": "81 and 84; annotation review remains separate.",
    "explanation": "The exact type check accepts the two positive integers and rejects the string and Boolean. The extra field is permitted by this schema. Neither an allowed label nor a passing type check certifies that a human reviewer actually approved the row."
  },
  {
    "question": "Apply NFKC, full casefold and whitespace collapse to \"  ﬁle²  \", \"FILE2\" and \"file 2\". Which exact normalized-key grouping results?",
    "options": [
      "The first two share file2; the third retains a distinct key.",
      "The first and third share file 2; the second retains a distinct key.",
      "All three share file2 after compatibility normalization.",
      "All three retain distinct keys after whitespace collapse."
    ],
    "answer": "The first two share file2; the third retains a distinct key.",
    "explanation": "NFKC changes the fi ligature to fi and superscript two to 2. Casefold maps FILE2 to file2. Whitespace collapse removes outer space and reduces runs, but it does not delete the internal space in file 2, so that third key remains different."
  },
  {
    "question": "Rows 831 and 832 contain the same normalized text and label in conversation X. Row 833 repeats that text with the same label in conversation Y. Row 834 has different text. Under the reference builder’s deduplication rule, which records survive this duplicate-group step?",
    "options": [
      "831 and 834; the smallest-ID copy represents both conversations.",
      "831, 833 and 834; keep one representative within each conversation.",
      "832 and 834; the latest same-conversation copy represents the group.",
      "834 only; all three cross-conversation copies enter review."
    ],
    "answer": "834 only; all three cross-conversation copies enter review.",
    "explanation": "The reference excludes the entire same-text group when its conversation set has more than one member. Agreeing labels do not remove that branch. Lowest-ID representative selection applies only after the group passes the conflict and cross-conversation rules."
  },
  {
    "question": "A team evaluates unseen incidents next month. Conversations K and L concern the same incident, and a feature for today’s ticket uses tomorrow’s resolution. Which paired repair matches both failures?",
    "options": [
      "Group K and L separately; recompute the feature from decision-time inputs.",
      "Group K and L by incident; recompute the feature from decision-time inputs.",
      "Group K and L by incident; retain the feature because the test is later.",
      "Group K and L separately; retain the feature because the test is later."
    ],
    "answer": "Group K and L by incident; recompute the feature from decision-time inputs.",
    "explanation": "The held-out unit must match the unseen-incident claim, so related conversations stay together. A later test partition cannot make a future resolution available to an earlier prediction. Reconstruct features using the information available at decision time."
  },
  {
    "question": "Two six-position MinHash signatures are [1, 2, 3, 4, 5, 6] and [1, 2, 9, 4, 8, 7]. Consecutive positions form three bands of two. What are the matching-position estimate and the candidate decision?",
    "options": [
      "1/3; yes, one complete band matches.",
      "1/2; no complete band matches.",
      "2/3; no complete band matches.",
      "1/2; yes, one complete band matches."
    ],
    "answer": "1/2; yes, one complete band matches.",
    "explanation": "Positions 1, 2 and 4 match, giving 3/6. The first band [1, 2] matches in full, so the pair becomes a candidate. Scattered row matches do not count as an additional full band, and a candidate still undergoes review before deletion."
  },
  {
    "question": "Under ideal independent MinHash rows and bands, a pair has similarity 0.8 and uses two bands of two rows. What are its candidate and miss probabilities?",
    "options": [
      "0.8704 and 0.1296.",
      "0.6400 and 0.3600.",
      "0.4096 and 0.5904.",
      "0.9600 and 0.0400."
    ],
    "answer": "0.8704 and 0.1296.",
    "explanation": "A band matches with probability 0.8² = 0.64. Both bands miss with probability (1 − 0.64)² = 0.1296, so the candidate probability is 0.8704. Squaring the band-match probability instead requires both bands to match; requiring only an individual row uses a different rule."
  },
  {
    "question": "A generated nonnegative-count function passes its JSON schema and its empty-list test, but returns 2 for [−3, 2]. A separate email scanner flags an address in a public documentation example. Which next steps match these two observations?",
    "options": [
      "Accept the function; review the flagged span in its document context.",
      "Repair the function; delete the document from its email flag alone.",
      "Repair the function; review the flagged span in its document context.",
      "Accept the function; delete the document from its email flag alone."
    ],
    "answer": "Repair the function; review the flagged span in its document context.",
    "explanation": "Only 2 is nonnegative, so the required count is 1 and the generated function fails this test despite passing the earlier test and schema. An email-shaped span is a detection result. Its public-example context still determines whether to keep or mask it; a flag alone does not supply that decision."
  },
  {
    "question": "A fixed reference scorer assigns two scored tokens conditional probabilities 1/8 and 1/2. Its tokenizer and scoring positions are unchanged. Which perplexity and interpretation are justified for an unfamiliar but valid technical log?",
    "options": [
      "4; reject it as low quality from that score alone.",
      "4; evaluate its usefulness on your target domain before filtering.",
      "16; evaluate its usefulness on your target domain before filtering.",
      "16; reject it as low quality from that score alone."
    ],
    "answer": "4; evaluate its usefulness on your target domain before filtering.",
    "explanation": "The probability product is 1/16, so the inverse geometric mean over two tokens is 4. Perplexity measures predictability under the named scorer. The unfamiliar domain can raise it without showing that the log is useless; 16 omits the two-token root."
  },
  {
    "question": "A candidate’s dataset file is unchanged. One rejection-log entry changes reason from invalid_label to label_conflict; no records are added or removed, and the manifest stays fixed. Which verifier outcomes follow?",
    "options": [
      "The rejection digest and reason counts fail; the dataset digest passes.",
      "The rejection digest fails but reason counts pass; the dataset digest passes.",
      "The rejection digest passes but reason counts fail; the dataset digest fails.",
      "The rejection digest and reason counts pass; the dataset digest fails."
    ],
    "answer": "The rejection digest and reason counts fail; the dataset digest passes.",
    "explanation": "Changing the rejection-log bytes changes its digest. Moving one entry between reason categories also changes the reason histogram compared with the manifest, even though total kept plus rejected is unchanged. The separate dataset file did not change, so its own byte digest still passes."
  },
  {
    "question": "A candidate passes all loader integrity checks. Its label counts are train: 3 escalate and 1 standard; validation: 2 standard; test: 1 escalate and 1 standard. Which gap and next action follow before comparing models?",
    "options": [
      "Train lacks standard; move a test example into train after scoring.",
      "Test lacks escalate; collect reviewed groups for the next artifact.",
      "Validation lacks escalate; move a test example after scoring.",
      "Validation lacks escalate; collect reviewed groups for the next artifact."
    ],
    "answer": "Validation lacks escalate; collect reviewed groups for the next artifact.",
    "explanation": "Validation has no escalate examples, so its accuracy cannot evaluate escalation detection. Collect more reviewed groups or design a grouped stratified split before comparison and record a new artifact. Moving rows after observing test results spends that test on development, while passing structural checks does not supply class coverage."
  }
]
```

> **Next:** Continue to [Feature Engineering for Production ML](/learn/feature-engineering-production-ml). With schema validation, grouped splits, and versioned manifests protecting the raw records, make sure every feature computed from them stays identical between historical training and live inference.
