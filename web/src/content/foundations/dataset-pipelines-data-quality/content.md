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
    "benchmark contamination audit",
    "near-duplicate review",
    "dataset manifest and datasheet"
  ]
}
---

Records 101 and 102 look like two separate training examples in a support export because they differ in leading spaces and letter case, yet both belong to conversation `c-51`. If row 101 trains a routing classifier while row 102 evaluates it, the held-out score measures memorization of phrasing the model already saw rather than generalization to an unseen conversation. Earlier chapters trained models from clean numerical arrays; a reliable dataset pipeline traces backward from those arrays to decide which raw records become supervised examples and which held-out scores an engineer can trust. Recording origin metadata, transformations, and validation checks together creates clear data lineage, while schema checks, grouped splitting, and <span data-glossary="benchmark-contamination">contamination</span> audits each protect a distinct part of model evaluation.

## Schema validation and type enforcement

The text router consumes features built from exported developer-support messages and triage labels. Every supervised export begins with a fixed table or stream of named fields whose types and nullability determine what downstream stages may assume. Defining those fields upfront turns implicit expectations into concrete, testable code checks. The table below summarizes the four columns of our minimal support dataset:

| Field | Type | Meaning | Why it matters |
|---|---|---|---|
| `ticket_id` | `int` | Exported row identifier, unique per row | Traces rejections and model errors back to the source record. |
| `conversation_id` | `str` | Thread identifier for a multi-turn conversation | Keeps all turns of a thread in one split when evaluating unseen threads. |
| `text` | `str` | Raw message text | Becomes the model input after normalization. |
| `label` | `str` | `standard` or `escalate` | Serves as the target class after human annotation. |

Consider four concrete records from a single export batch, shown in the table below, where seemingly innocent surface variations hide duplicate messages and missing supervision. Row 102 repeats row 101 inside thread `c-51` with surrounding whitespace and uppercase text, while row 104 carries valid message text without a target label. Catching row 104 before normalization or splitting prevents unlabeled text from entering supervised training sets or breaking batch loss computations.

| Ticket | Raw message | Label | Diagnosis |
|---:|---|---|---|
| 101 | `Build is still failing` | `escalate` | Valid annotated example. |
| 102 | `  BUILD is still failing  ` | `escalate` | Normalized duplicate of row 101 in the same thread. |
| 103 | `Where is the tokenizer config?` | `standard` | Valid annotated example. |
| 104 | `Validation batch has no reviewed label` | `None` | Missing required target label. |

An **ingestion validation gate** separates three complementary levels of checking before any downstream processing runs:

1. **Structural checks:** Verify column presence, non-nullity, and strict field types so a string `"101"`, a Boolean `True`, or a missing key never silently coerces into a valid integer ID.
2. **Domain checks:** Verify numeric bounds, regex patterns, and categorical vocabularies, such as restricting labels strictly to `{"standard", "escalate"}`.
3. **Distributional checks:** Flag batch-level shifts, including spikes in null rates or skews in label proportions, which point to upstream collection changes even when every single row matches the schema.

Modern validation tools implement different combinations of those checks depending on whether input arrives row by row or in batches. Pydantic enforces strict per-field schemas that reject coerced values like `"101"` or `True` when a `StrictInt` is expected, while offering explicit settings (`extra="ignore"` versus `extra="forbid"`) to control unknown columns.[^pydanticStrict2026][^pydanticModels2026] Pandera checks DataFrame columns, ranges, and distributions directly across batches, whereas Great Expectations compiles multi-rule validation suites that orchestration code can route to hard failures or quarantine logs.[^panderaSchemas2026][^gxCheckpoints2026] The schema validator below uses Pydantic to isolate invalid rows before assembling a clean pandas DataFrame, leaving batch-level drift and annotation audit history to later stages:

<!-- leetllm: test, output=show, output_title="Schema gate" -->

```python title="01-schema-gate.py"
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
```text title="Schema gate" output compact
accepted ids: [101, 102, 103]
rejected: [{'ticket_id': 104, 'reason': 'ValidationError'}]
```
<!-- leetllm: output:end -->

Row 104 exits during ingestion because `label=None` violates literal class membership against the permitted set. By contrast, a human annotation slip that accidentally selected `escalate` instead of `standard` would pass schema validation cleanly because the value itself has the right type and spelling. Keeping structural schema checks separate from human annotation logs ensures teams never mistake clean types for ground-truth accuracy. Cross-row ID uniqueness is added next inside the complete pipeline builder.

## Deterministic normalization and exact fingerprinting

Extra outer spaces and uppercase letters in row 102 do not alter the routing meaning here, whereas real engineering text often mixes code snippets, case-sensitive symbols like `Prod` versus `prod`, indentation, and meaningful newlines. Always retain unmodified raw records in archive storage so pipeline refinements can reprocess original text later without data loss. Decode incoming byte streams under an explicit encoding policy rather than stripping punctuation or Unicode characters indiscriminately, and tailor normalization rules directly to the downstream modeling task.

Unicode defines canonical normalization forms (`NFC`, `NFD`) and compatibility forms (`NFKC`, `NFKD`), where `NFKC` folds compatibility variants such as turning the ligature `ﬁ` into `fi` and superscript `²` into `2`.[^unicodeNormalization2026] Combining `NFKC`, `str.casefold()` (which also folds German `ß` to `ss`), and whitespace collapsing defines a deterministic equivalence key for duplicate lookup. Never strip negation tokens such as `not` or environment identifiers, because merging `build passed` with `build not passed` destroys label validity. Hashing the normalized string with SHA-256 produces a compact **exact fingerprint** for indexing, though final equality checks should compare normalized strings directly whenever exact identity is critical, and reproducible builds should log both Python and Unicode database versions alongside the code.[^pythonUnicodeData2026][^pythonHashlib2026]

<!-- leetllm: test, output=show, output_title="Exact fingerprints" -->

```python title="02-normalize-and-fingerprint.py"
import hashlib
import unicodedata
import numpy as np


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
hashes = np.array([fingerprint(m) for m in messages])
for message, digest in zip(messages, hashes):
    print(normalize_text(message), digest[:12])
print("first two match:", bool(hashes[0] == hashes[1]))
print("negation distinct:", bool(hashes[0] != hashes[2]))
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

Notice how `Build is still failing` and `  BUILD is still failing  ` collapse to the identical prefix `c53011fb9834`, confirming their canonical equivalence. Meanwhile, `Build is not failing` retains a completely separate digest `e038c1b99d05`, proving that negation tokens remain intact. Although logs display truncated 12-character prefixes for readability, production deduplication indexes always key on full 64-character SHA-256 digests.

```checkpoint
Why normalize text before computing its exact fingerprint?
---
Normalization defines which surface variants, such as capitalization and extra spaces, map to the same lookup key while preserving semantic distinctions like negation. Keep the unnormalized source text intact and verify the equivalence rule on realistic code and identifier examples before dropping duplicates.
```

Running schema validation and normalization across tickets 101 through 104 cleanly quarantines row 104 for missing supervision while collapsing rows 101 and 102 onto one normalized lookup key. Even with exact fingerprinting in place, splitting un-deduplicated rows independently at random could still assign ticket 101 to training and ticket 102 to held-out testing. Enforcing splits at the conversation level guarantees that surface variants from the same thread never straddle training and evaluation partitions, as illustrated below:

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Tickets 101 and 102 from conversation c-51 differ in case and outer spaces, but NFKC normalization, case folding, whitespace collapse, and SHA-256 give them the same fingerprint prefix c53011fb9834. A row split can place the normalized copies in train and test; grouping by conversation keeps both in one partition." />
  <figcaption>A row-level split places ticket 101 in train and its normalized duplicate 102 in test, splitting conversation <code>c-51</code> across partitions. Grouping by <code>conversation_id</code> keeps every message from the thread in a single split.</figcaption>
</figure>

## Quarantine for conflicting duplicate labels

Suppose rows 201, 202, and 203 all normalize to `"migration blocked for 12 days"`, but row 203 is labeled `standard` while rows 201 and 202 are labeled `escalate`. Adopting a "first-in-wins" heuristic would silently discard disagreement and leave label noise inside training and evaluation sets. Disagreement among normalized copies usually signals annotation guideline drift, ambiguous prompts, or missing context such as customer service tier. Isolating any conflicting group into an **anomaly quarantine** turns hidden label corruption into a concrete review queue:

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

Grouping directly on normalized strings in pandas ensures hash collisions can never trigger false label conflicts across unrelated inputs. Here rows 201, 202, and 203 all land in quarantine because row 203 disagrees with 201 and 202, leaving only clean singleton row 204. While this targeted filter selects one representative per agreeing cluster, the assembled builder below tightens the rule further: it collapses exact repeats within the same conversation while flagging cross-conversation duplicates for review so boilerplate templates never skew class weights silently.

## Grouped splits and leakage prevention

Clean rows can still produce misleading test metrics if the train-test split leaks shared structure across partitions. When the target deployment evaluates accuracy on **unseen conversations**, placing turn 1 and turn 3 of `c-51` in training while turn 2 sits in validation creates **entity leakage**, because shared hostnames, timestamps, and phrasing leak across splits. Match the split unit directly to the deployment generalization claim: if multiple threads reference the same incident or copied document, group by that coarser incident identifier rather than conversation alone.[^sklearn_groupkfold]

For static snapshots, scikit-learn's `GroupShuffleSplit` assigns entire conversation groups cleanly without straddling partitions. When new threads arrive continuously over time, hashing `conversation_id` with SHA-256 maps each thread deterministically so existing assignments never shift when fresh records arrive. Beyond group keys, forecasting future incidents also demands a chronological cutoff date so post-event outcomes never bleed backward into training features. Tokenizers, normalization vocabularies, and scalers must likewise be fit solely on training partitions after splitting:

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

Both turns 301 and 315 from `build-001` stay in the same split under deterministic hashing and under scikit-learn's `GroupShuffleSplit`. Because real threads vary wildly in length, however, splitting distinct groups cleanly at 70/15/15 can still leave imbalanced row counts or skewed label ratios across splits. Auditing split coverage and class balance immediately after partition assignment catches skewed mixes before training begins.

```checkpoint
Two rows come from the same conversation. Why isn't a random row-level split enough?
---
Evaluating generalization on unseen conversations requires keeping every turn of each conversation on one side of the split. Beyond group keys, production splits must still check for shared underlying incidents, near-duplicate copy-paste, and future-timestamp feature leakage.
```

## Benchmark contamination and deduplication audits

Grouped splits keep internal conversation threads separate, yet web-scraped or vendor corpora can still absorb public benchmark questions, answers, and rewrites. During GPT-3 pre-training, an overlap filter bug missed matches in long documents and forced the authors to withdraw four benchmarks whose clean subsets could not be isolated reliably.[^brown2020] An exact normalized fingerprint check catches verbatim benchmark copies cheaply before scanning larger n-gram windows:

<!-- leetllm: test, output=show, output_title="Exact contamination gate" -->

```python title="05-exact-contamination.py"
import hashlib
import unicodedata
import numpy as np


def clean(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def fp(text: str) -> str:
    return hashlib.sha256(clean(text).encode("utf-8")).hexdigest()


training = ["check gradient norms every 50 steps", "tokenizer config updated"]
locked_eval = ["CHECK GRADIENT norms every 50 steps", "held-out split check pending"]
train_keys = np.array([fp(text) for text in training])
collisions = [text for text in locked_eval if fp(text) in set(train_keys)]

print("exact collisions:", collisions)
print("clean of exact matches:", len(collisions) == 0)
```

<!-- leetllm: output:start -->
```text title="Exact contamination gate" output compact
exact collisions: ['CHECK GRADIENT norms every 50 steps']
clean of exact matches: False
```
<!-- leetllm: output:end -->

Exact fingerprint checks only spot verbatim copies, missing benchmark questions embedded inside longer prose, paraphrases, or rewritten solutions. N-gram substring scans catch partial overlaps alongside a false-positive review log for common boilerplate strings. When training corpora themselves are private, black-box membership-inference probes such as Min-K% inspect output probabilities for memorization cues, though Samuel et al. (2025) show unstable accuracy across text difficulty and instruction-tuning rewrites.[^samuel2025Contamination] Reliable benchmark protection therefore requires separating held-out tasks early across pre-training, fine-tuning, retrieval indexes, few-shot prompts, and judge prompts.

## Near-duplicate detection: MinHash, shingling, and LSH

Two messages like `"build has not passed"` and `"my build has not passed"` emit unrelated SHA-256 hashes despite sharing three out of four adjacent word pairs. Decomposing text into contiguous $n$-grams called **shingles** exposes local overlap, and **Jaccard similarity** $J(A, B) = |A \cap B| / |A \cup B|$ measures the fraction of shared shingles across the pair. Here document $A$ yields 3 bigrams, document $B$ yields 4, their intersection has 3, and $J(A, B) = 3/4 = 0.75$. Computing Jaccard overlap in Python flags the pair above a `0.70` review threshold while documenting single-word fallback handling and zero return on empty inputs:

<!-- leetllm: test, output=show, output_title="Near-duplicate review queue" -->

```python title="06-shingle-overlap.py"
import numpy as np


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
    return float(len(a & b) / len(union)) if union else 0.0


scores = np.array([jaccard("build has not passed", "my build has not passed")])
print("shared pair score:", np.round(scores[0], 2))
print("send to human review:", bool(scores[0] >= 0.70))
```

<!-- leetllm: output:start -->
```text title="Near-duplicate review queue" output compact
shared pair score: 0.75
send to human review: True
```
<!-- leetllm: output:end -->

Pairwise shingle checks scale as $O(N^2)$ over corpus size, which quickly becomes prohibitive at millions or billions of documents. **MinHash** compresses each shingle set into a fixed-length integer signature using $K$ random permutations (approximated in practice via salted hash functions).[^broder1997] Because the minimum element in $A \cup B$ under a uniform random permutation is equally likely to be any union member, two sets share the same minimum rank at coordinate $k$ with probability equal to their exact Jaccard similarity:

$$
P\left(s_k(A) = s_k(B)\right) = J(A, B)
$$

Locality-Sensitive Hashing (LSH) avoids $O(N^2)$ comparisons across signatures by splitting the $K$ MinHash values into $b$ bands of $r$ rows each ($K = b r$). Two documents become candidate duplicates whenever every hash inside at least one full band matches, yielding candidate probability $P(\text{candidate} \mid s) = 1 - (1 - s^r)^b$ under independent coordinates. Applying FineWeb's 2024 parameterization of $112$ hashes across $b = 14$ bands of $r = 8$ rows produces the steep selection curve shown below:[^penedo2024]

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

Under ideal independence at $J = 0.75$, about $77.2\%$ of near-duplicate pairs match inside at least one band while $22.8\%$ miss candidate generation altogether. Meanwhile, repetitive boilerplate shared by thousands of pages can swell individual LSH buckets and trigger quadratic candidate verification unless bucket caps are enforced. Selecting which document to drop after finding candidate pairs also requires care because thresholded similarity is **not transitive**:

<!-- leetllm: test, output=show, output_title="A duplicate chain isn't all-pairs agreement" -->

```python title="06c-duplicate-chain.py"
import numpy as np

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
    score = float(np.divide(len(a & b), len(a | b)))
    print(f"{left}/{right}: J={score:.3f}; matches at 0.60: {score >= 0.60}")
```

<!-- leetllm: output:start -->
```text title="A duplicate chain isn't all-pairs agreement" output compact
A/B: J=0.667; matches at 0.60: True
B/C: J=0.667; matches at 0.60: True
A/C: J=0.333; matches at 0.60: False
```
<!-- leetllm: output:end -->

Even though `A/B` and `B/C` both reach `0.667` above the `0.60` cutoff, `A/C` scores only `0.333` yet still merges into one cluster through transitive chaining. Dropping arbitrary cluster members can therefore erase genuinely distinct records alongside near-duplicates. At massive pre-training scale, controlled cluster pruning pays clear dividends: Lee et al. (2022) cut model memorization roughly tenfold while preserving benchmark accuracy, and Dolma combined memory-compact Bloom filters across URL, document, and paragraph scopes at a modest false-positive budget.[^lee2022][^soldaini2024]

<figure>
  <img src="illustrations/_generated/pipeline_contract_dark.png" alt="The LSH candidate curve uses the FineWeb 2024 configuration of 14 bands with 8 hash rows each. Under ideal independence, candidate probability is 1 − (1 − s⁸)¹⁴: 5.3% at Jaccard similarity 0.50, 56.5% at 0.70, 77.2% at 0.75, and 98.8% at 0.85. At 0.75, the remaining 22.8% are missed by candidate generation." />
  <figcaption>With 14 bands of 8 rows, candidate recall rises steeply from 5.3% at similarity 0.50 to 98.8% at 0.85, capturing 77.2% of pairs at 0.75 while monitoring bucket sizes prevents quadratic blowup.</figcaption>
</figure>

```checkpoint
Two messages have Jaccard shingle similarity 0.92. Should the pipeline delete one automatically?
---
Wait before deleting solely on score: queue high-similarity pairs to verify whether context or labels differ across records. Automatic deletion can work on massive web corpora once bucket sizes and downstream task impact are validated, whereas smaller supervised sets benefit from human review.
```

## Privacy, PII detection, and data lineage

Support logs routinely contain **personally identifiable information (PII)** such as emails, phone numbers, and personal names alongside sensitive operational IDs and secrets. Because trained language models can memorize and emit rare training strings, data minimization and access controls belong inside ingestion itself rather than being deferred until deployment. Practical redaction stacks layer three signals: pattern rules for structured identifiers (keeping in mind that syntax alone cannot distinguish public documentation addresses from private user emails), named-entity recognition (NER) models for unstructured names and locations, and extensible pipelines such as Presidio (maintainers emphasize automated scans reduce risk without guaranteeing zero leaks).[^presidio2023] Depending on policy, pipelines either drop dense-PII documents outright (as Dolma did for web documents exceeding five detected spans) or substitute typed surrogates such as `<EMAIL>` and `<PHONE_NUMBER>` when PII is sparse:[^soldaini2024]

<!-- leetllm: test, output=show, output_title="Sensitive-data quarantine" -->

```python title="10-sensitive-data-quarantine.py"
import re
import pandas as pd

email_pattern = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
df = pd.DataFrame([
    {"ticket_id": 501, "text": "Incident INC-10234 mentions a private timeline"},
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

Passing a narrow regex check confirms only that email patterns were absent; row 501 still embeds an internal incident identifier (`INC-10234`), and masking isolated spans never guarantees safe public release. Pairing explicit access controls with recorded **origin metadata** (source system, collection context, and license) and **execution lineage** (such as OpenLineage run events connecting input tables to output artifacts) keeps datasets auditable across teams.[^openLineageRun2026] Versioning layers like DVC track immutable hashes over Git and cloud buckets, whereas Delta Lake and Apache Iceberg snapshots remain queryable only until retention jobs (`VACUUM` or snapshot expiration) reclaim old files.[^dvcCache2026][^deltaTimeTravel2026][^icebergMaintenance2026]

## Web-scale corpus filtering and synthetic data quality

Foundation-model corpora combine heuristic quality filters, reference perplexity scoring, and synthetic verification gates because data composition directly governs model capabilities, as demonstrated by FineWeb's controlled ablations showing snapshot-level deduplication outperforming overly aggressive global pruning.[^penedo2024]

### 1. Heuristic text filtering

Fast rule-based filters drop broken HTML extractions and repetitive scraper noise without running neural inference. Typical heuristics check document length ranges (calibrated separately for short references versus long tutorials), symbol-to-word ratios (tuned carefully so code, formulas, and technical logs are not purged alongside garbage markup), language-calibrated stopword counts, and high rates of repeated lines or $n$-grams. Always measure removal percentages per language, source domain, and content type so an aggressive quality rule does not silently wipe out an entire coding or non-English subgroup.

### 2. Model-based perplexity filtering

A lightweight reference language model measures how closely candidate text resembles clean reference prose under a chosen tokenizer. Pipelines such as CCNet computed document perplexity to prioritize Wikipedia-like text:[^wenzek2019]

$$
\text{PPL}(X) = \exp\left( -\frac{1}{N} \sum_{i=1}^N \log P(x_i \mid x_{<i}) \right)
$$

Perplexity values remain comparable only when the reference model, tokenizer, and context slicing stay fixed. Elevated scores reveal garbled OCR text alongside valid technical jargon, source code, or non-standard prose, while suspiciously low perplexity often surfaces repetitive boilerplate headers. Always measure downstream validation impact on domain slices before setting permanent perplexity cutoffs.

### 3. Synthetic data quality gating

Generated instruction-tuning and preference pairs require verification beyond formatting checks because fluent synthetic teachers can produce subtle logical or code errors. Always record the teacher model, decoding parameters, and prompt template in lineage metadata, keep locked evaluation benchmarks excluded from teacher context, verify strict JSON and structural fields, run isolated unit tests or domain verifiers on code and math solutions, and calibrate any LLM-as-judge filter against human-verified gold examples so shared model blind spots do not amplify errors.

## Building a reproducible candidate artifact

Combining strict schema validation, text normalization, conflicting-label quarantine, cross-conversation deduplication, and deterministic grouped splitting produces clean JSONL partitions paired with a machine-readable manifest. Canonical JSON key sorting, UTF-8 encoding, and fixed LF line endings guarantee deterministic SHA-256 digests under the logged Python and Unicode runtimes. Production pipelines write each artifact to a fresh immutable path rather than overwriting earlier versions in place and attach a structured datasheet covering collection motivation, known biases, and intended scope.[^gebru2021] Note that building a clean **candidate artifact** only signals successful mechanical execution while keeping pending contamination, privacy, and coverage reviews explicitly tracked until cleared:

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


def reject_reason(row: object) -> str | None:
    if not isinstance(row, dict):
        return "not_an_object"
    try:
        rec = CleanTicket.model_validate(row)
    except ValidationError as exc:
        field = exc.errors()[0]["loc"][0] if exc.errors() else "schema"
        return f"invalid_{field}"
    if not rec.text.strip():
        return "blank_text"
    if rec.conversation_id != rec.conversation_id.strip():
        return "invalid_conversation_id"
    return None


def stable_split(conversation_id: str) -> str:
    bucket = int(hashlib.sha256(conversation_id.encode("utf-8")).hexdigest()[:8], 16) % 100
    if bucket < 70:
        return "train"
    if bucket < 85:
        return "validation"
    return "test"


def prepare_rows(input_rows):
    id_counts = Counter(
        row["ticket_id"] for row in input_rows
        if isinstance(row, dict) and isinstance(row.get("ticket_id"), int) and not isinstance(row.get("ticket_id"), bool)
    )
    rejected = []
    prepared_by_text = defaultdict(list)
    for row in input_rows:
        reason = reject_reason(row)
        ticket_id = row.get("ticket_id") if isinstance(row, dict) else None
        if reason is None and id_counts[ticket_id] > 1:
            reason = "duplicate_ticket_id"
        if reason:
            rejected.append({"ticket_id": ticket_id, "reason": reason})
            continue
        text = normalize_text(row["text"])
        prepared_by_text[text].append({
            "ticket_id": ticket_id,
            "conversation_id": row["conversation_id"],
            "text": text,
            "label": row["label"],
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
    "split_policy": "sha256(conversation_id)[:8] modulo 100; 70/15/15 thresholds",
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

Downstream training scripts should verify dataset invariants automatically before provisioning GPU workers rather than assuming files on disk are consistent. Pre-flight verification checks six properties together: zero group overlap across splits, exact split hash adherence, matching SHA-256 byte digests for both data and rejection logs, valid row schemas, recomputed text fingerprints, and exact row-count conservation (`kept + rejected == raw`):

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
schema_valid = all(reject_reason(row) is None for row in rows)
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

Recomputing SHA-256 digests catches accidental file truncation, partial writes, or format drift immediately when loaders mount a dataset. When release authenticity matters across shared storage buckets, teams record or cryptographically sign approved manifest digests inside a versioned experiment tracker instead of relying solely on an unsigned manifest JSON sitting next to the data files. Together, structural checks and checksums turn silent pipeline drift into immediate, actionable errors.

## Auditing distribution drift and split coverage

Passing every row-level schema and digest test still leaves open whether each evaluation split covers all target classes and comparable text lengths. If the validation split contains only `standard` tickets, validation accuracy cannot measure whether a router detects `escalate` cases. Auditing split coverage and length distributions together exposes this gap immediately:

<!-- leetllm: test, continue=dataset-verified, output=show, output_title="Coverage audit" -->

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
```text title="Coverage audit" output compact
coverage: {'test': ['standard'], 'train': ['escalate'], 'validation': ['standard']}
missing labels: {'train': ['standard'], 'validation': ['escalate'], 'test': ['escalate']}
word-length Wasserstein distance (train vs val): 0.333
label coverage passes: False
```
<!-- leetllm: output:end -->

Here training receives only `escalate` records while validation and test hold solely `standard` records, causing the coverage check to fail immediately. Before applying formal statistical tests such as chi-square, Wasserstein distance, or two-sample Kolmogorov-Smirnov tests, inspect raw class counts and quantile histograms first.[^scipyKs2Sample2026][^scipyWasserstein2026] Small batches violate asymptotic chi-square counts, grouped conversation turns violate row independence, massive datasets flag tiny harmless differences as significant, and live traffic naturally drifts over months. When coverage breaks, collect more annotated groups or use stratified group assignment instead of moving rows manually after inspecting evaluation scores.

## Tracking dataset versions across pipeline evolutions

When pipeline `v2` refines text cleaning or fixes label guidelines and validation accuracy shifts by two percentage points, content digests immediately distinguish a genuine data snapshot change from random seed variance. Serializing normalized JSONL records deterministically makes even single-row edits change the SHA-256 digest cleanly, whereas tools like Hugging Face Datasets compute transformation cache keys primarily for fast local reuse rather than immutable experiment logging.[^hfDatasetsCache2026] Recording explicit artifact digests inside every training run metadata entry ensures full reproducibility whenever teams compare architectures later:

<!-- leetllm: test, output=show, output_title="Version comparison" -->

```python title="11-version-comparison.py"
import hashlib
import json
import numpy as np


def digest(rows: list[dict]) -> str:
    payload = "\n".join(json.dumps(row, sort_keys=True) for row in rows) + "\n"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


v1 = [{"text": "build missing", "label": "escalate"}]
v2 = [*v1, {"text": "quantized checkpoint broken", "label": "standard"}]
digests = np.array([digest(v1), digest(v2)])
print("v1:", digests[0][:12], "rows:", len(v1))
print("v2:", digests[1][:12], "rows:", len(v2))
print("version changed:", bool(digests[0] != digests[1]))
```

<!-- leetllm: output:start -->
```text title="Version comparison" output compact
v1: 6045599184e8 rows: 1
v2: 96cb882d3e5a rows: 2
version changed: True
```
<!-- leetllm: output:end -->

Confirming a changed digest proves the underlying records differed between `v1` and `v2`. Keeping model architecture, optimizer schedules, and random seeds constant then lets teams attribute metric improvements directly to data changes rather than training variance. Pairing versioned digests with controlled ablations closes the feedback loop between raw collection and modeling gains.

## Scaling small-batch safeguards to large AI corpora

The exact same validation, grouping, and lineage decisions scale from a dozen support messages to billion-document pre-training corpora. At larger scale, storage formats switch to Parquet or Iceberg tables and near-duplicate scanners parallelize across distributed workers, yet the core correctness invariants remain identical. The table below maps each small lab mechanism to its production foundation-model counterpart:

| Small lesson mechanism | Large-scale AI and foundation model equivalent |
|---|---|
| Ingestion schema validation | Strict Pydantic/Pandera validators reject malformed instruction or fine-tuning records before storage. |
| Unicode `NFKC` + casefold | Normalizes lookup keys cleanly while guarding task-specific symbols like code identifiers. |
| Conflicting-label quarantine | Routes ambiguous supervision to human adjudication rather than letting label noise pollute training. |
| Grouped split by conversation | Isolates threads, documents, and temporal cutoffs so held-out evaluation reflects unseen entities. |
| MinHash LSH near-deduplication | Compresses massive crawl corpora into signatures while monitoring bucket sizes and cluster chaining. |
| Benchmark contamination audit | Scans pre-training, fine-tuning, and retrieval pools for exact and n-gram overlap against held-out evals. |
| Sensitive-data review | Combines regex/NER detection, minimization policies, and access controls before corpus release. |
| Manifest and datasheet | Tracks byte digests, transformation versions, coverage audits, and unresolved reviews together. |
| Distribution and drift audit | Compares label proportions and token-length distributions across partitions over time. |

Reporting a benchmark score without pinning its dataset digest, split policy, and contamination check leaves the metric unverifiable across runs. Storing all three artifacts inside your experiment registry makes performance comparisons reproducible as datasets evolve. Treating data pipelines with the same rigor as model architectures prevents invisible regressions later in deployment.

## Controlled failure labs: break the pipeline on purpose

Run four targeted mutations on the runnable scripts above to verify that each check catches the failure it was designed for:

1. **Simulate entity leakage:** In `08-verify-artifact.py`, append `{**rows[0], "ticket_id": 999, "split": "test"}` to `rows` before grouping by `conversation_id` to watch `conversation and split rule`, `unique IDs and normalized texts`, and `manifest counts` fail together.
2. **Simulate silent file corruption:** In `08-verify-artifact.py`, append an extra newline byte to `rows_path` after reading `saved_manifest` and watch `digest_matches` flip to `False`.
3. **Inspect shingling edge cases:** In `06-shingle-overlap.py`, call `jaccard("build", "build")` (returning `1.0`) and `jaccard("", "")` (returning `0.0`), verifying why ingestion validation must reject blank text before similarity checks run.
4. **Break group splitting:** In `04-stable-grouped-split.py`, hash `str(row["ticket_id"])` instead of `row["conversation_id"]` so tickets `301` and `315` from `build-001` split across `train` and `validation`, exposing leakage directly.

## Carrying clean data into feature engineering

A versioned manifest pairs input snapshots, transformation rules, split assignments, and output digests into a reproducible data record, leaving unresolved policy reviews clearly marked until resolved. Cleanly validated rows, conflict-free labels, and group-isolated partitions prepare the dataset for the next critical stage: [Feature Engineering for Production ML](/learn/feature-engineering-production-ml), where every feature must remain knowable at decision time and stay identical between batch training and online serving.

```mastery-quiz
[
  {
    "question": "A gate uses the lesson’s strict positive-integer ticket ID rule and permits extra fields. Four otherwise valid rows have IDs 81, \"82\", true and 84; row 84 also has a locale field. Which IDs pass the local schema gate, and does that certify human annotation review?",
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
    "question": "Rows 831 and 832 contain the same normalized text and label in conversation X. Row 833 repeats that text with the same label in conversation Y. Row 834 has different text. Under the reference builder’s policy, which records survive this duplicate-group step?",
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
    "explanation": "Positions 1, 2 and 4 match, giving 3/6. The first band [1, 2] matches in full, so the pair becomes a candidate. Scattered row matches do not count as an additional full band, and a candidate is still subject to the retention policy."
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
      "Accept the function; review the flagged span under the release policy.",
      "Repair the function; delete the document from its email flag alone.",
      "Repair the function; review the flagged span under the release policy.",
      "Accept the function; delete the document from its email flag alone."
    ],
    "answer": "Repair the function; review the flagged span under the release policy.",
    "explanation": "Only 2 is nonnegative, so the required count is 1 and the generated function fails this test despite passing the earlier test and schema. An email-shaped span is a detection result. Its public-example context and the applicable policy still determine retention or masking; a flag alone does not supply that decision."
  },
  {
    "question": "A fixed reference scorer assigns two scored tokens conditional probabilities 1/8 and 1/2. Its tokenizer and scoring positions are unchanged. Which perplexity and interpretation are justified for an unfamiliar but valid technical log?",
    "options": [
      "4; reject it as low quality from that score alone.",
      "4; evaluate its usefulness under the target-domain policy.",
      "16; evaluate its usefulness under the target-domain policy.",
      "16; reject it as low quality from that score alone."
    ],
    "answer": "4; evaluate its usefulness under the target-domain policy.",
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
    "question": "A candidate passes all loader invariants. Its label counts are train: 3 escalate and 1 standard; validation: 2 standard; test: 1 escalate and 1 standard. Which gap and next action follow before comparing models?",
    "options": [
      "Train lacks standard; move a test example into train after scoring.",
      "Test lacks escalate; collect reviewed groups for the next artifact.",
      "Validation lacks escalate; move a test example after scoring.",
      "Validation lacks escalate; collect reviewed groups for the next artifact."
    ],
    "answer": "Validation lacks escalate; collect reviewed groups for the next artifact.",
    "explanation": "Validation has no escalate examples, so its accuracy cannot evaluate escalation detection. Collect more reviewed groups or design a grouped stratified split before comparison and record a new artifact. Moving rows after observing test results spends that test on development, while passing structural invariants does not supply class coverage."
  }
]
```

> **Next:** Continue to [Feature Engineering for Production ML](/learn/feature-engineering-production-ml). With schema gates, grouped splits, and versioned manifests protecting the raw records, make sure every feature computed from them stays identical between historical training and live inference.
