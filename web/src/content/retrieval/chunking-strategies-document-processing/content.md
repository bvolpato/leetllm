---
{
  "id": "chunking-strategies-document-processing",
  "title": "Chunking Strategies",
  "slug": "chunking-strategies-document-processing",
  "category": "RAG & Retrieval",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/chunking_comparison_dark.png",
  "shortDescription": "Turn clean documents into retrieval units that preserve answers, citations, and measurable search quality.",
  "keyConceptsTested": [
    "Chunk answerability and boundaries",
    "Fixed windows and overlap",
    "Structure-aware recursive splitting",
    "Parent-child context expansion",
    "Semantic and late chunking",
    "Retrieval evaluation with labeled queries"
  ],
  "companies": [
    "OpenAI",
    "Anthropic",
    "Cohere",
    "Pinecone",
    "Google",
    "Jina"
  ],
  "section": "Core LLM Foundations",
  "order": 6
}
---

<!-- leetllm: edition:reference:start -->

Suppose your ingestion pipeline extracted a single critical sentence from `incident-runbook-v3.pdf` (covered in [File Ingestion for AI](/learn/file-ingestion-pdfs-html-ocr-markdown)):

> `incident-runbook-v3.pdf`, page 7: **<span data-glossary="rollback">Rollback</span> failure: page on-call within 15 minutes with deploy ID.**

To answer a question about that rule, the model needs the trigger condition, the 15-minute deadline, and the required deploy ID together. Split the sentence so one chunk holds `"Rollback failure: page on-call within"` and the next holds `"15 minutes with deploy ID"`, and neither retrieved passage tells the whole story.

<span data-glossary="chunking">Chunking</span> divides source documents into the units a retriever indexes and returns to a generator in <span data-glossary="rag">retrieval-augmented generation (RAG)</span>.[^lewis2020] Where you place each cut directly determines what a retrieved passage can support.

<figure>
  <img src="illustrations/_generated/chunking_strategies_dark.png" alt="Two size-6 windows overlap by two words: the first ends after 15, and the next reuses within 15 before completing minutes with deploy ID. A hit on the first window carries the condition and number but lacks the full deadline and ID. Both retain page=7 metadata; a heading-aware section keeps the whole rule together." />
  <figcaption>Two six-word windows with a two-word overlap split the sentence between `15` and `minutes`. A heading-aware section keeps the trigger, deadline, and deploy ID together alongside the page 7 locator.</figcaption>
</figure>

## What a useful chunk must preserve

Before comparing splitters, define what an answerable passage looks like for a real query: *"A rollback failed after deploy `pay-742`. When do I page, and what ID do I include?"*

| Candidate retrieval unit | Searchable? | Answerable? | Problem |
| --- | ---: | ---: | --- |
| `Rollback failure: page on-call within` | yes | no | deadline and required ID are missing |
| `15 minutes with deploy ID. Routine deploy notes: archive within 14 days.` | yes | no | trigger condition is missing and an unrelated rule is mixed in |
| `Rollback failure: page on-call within 15 minutes with deploy ID.` | yes | yes | keeps condition, deadline, and required ID together |

Small fragments can still serve as sharp search targets if a downstream step reliably expands them into their parent section before generation. Either way, evaluate the complete text that reaches the model under your actual context budget.

<!-- leetllm: test, output=show -->

```python title="check-answerable-chunks.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    text: str
    source_id: str
    locator: str


def is_answerable(chunk: Chunk) -> bool:
    required = ["rollback failure", "15 minutes", "deploy id"]
    lowered = chunk.text.lower()
    return all(phrase in lowered for phrase in required)


chunks = [
    Chunk("broken-condition", "Rollback failure: page on-call within", "incident-runbook-v3.pdf", "page=7"),
    Chunk("broken-window", "15 minutes with deploy ID. Routine deploy notes archive within 14 days.", "incident-runbook-v3.pdf", "page=7"),
    Chunk("complete", "Rollback failure: page on-call within 15 minutes with deploy ID.", "incident-runbook-v3.pdf", "page=7"),
]

results = [is_answerable(chunk) for chunk in chunks]
for chunk, ok in zip(chunks, results):
    print(f"{chunk.chunk_id}: answerable={ok}")
assert results == [False, False, True]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
broken-condition: answerable=False
broken-window: answerable=False
complete: answerable=True
```
<!-- leetllm: output:end -->

A keyword check catches dropped clauses cleanly, though real evaluations also inspect negation and exceptions (`"do not page within 15 minutes"` matches all three phrases while flipping the meaning).

## Fixed windows sever logical units

The simplest splitter slices text into fixed-size windows of $N$ <span data-glossary="token">tokens</span> with overlap $O$, advancing by stride $N - O$.

The examples below split on whitespace so cut positions are easy to read. In production, always count lengths with your <span data-glossary="embedding">embedding</span> model's actual tokenizer (including prepended headings and special tokens) so oversized inputs are never silently truncated.

With $N = 6$ and $O = 2$ over our 17-word excerpt, the first window stops right between `15` and `minutes`:

<!-- leetllm: test, output=show -->

```python title="split-fixed-windows.py"
def fixed_windows(text: str, size: int, overlap: int) -> list[str]:
    if size <= 0 or overlap < 0 or overlap >= size:
        raise ValueError("require size > overlap >= 0")
    words = text.split()
    step = size - overlap
    chunks = []
    for start in range(0, len(words), step):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
    return chunks


policy = (
    "Rollback failure page on-call within 15 minutes with deploy ID. "
    "Routine deploy notes archive within 14 days."
)

for index, chunk in enumerate(fixed_windows(policy, size=6, overlap=2)):
    print(f"{index}: {chunk}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0: Rollback failure page on-call within 15
1: within 15 minutes with deploy ID.
2: deploy ID. Routine deploy notes archive
3: notes archive within 14 days.
```
<!-- leetllm: output:end -->

Window 3 (`notes archive within 14 days.`) shows a second problem: a trailing fragment loses the subject (`Routine deploy notes`) that tells you what the 14-day rule governs.

```checkpoint
Why can't the trailing `notes archive within 14 days.` window serve as sufficient evidence by itself?
---
It drops the subject ("Routine deploy notes") that determines when the 14-day archive rule applies. It can only work as a search candidate if a later step expands it to the full section before generation.
```

What does increasing overlap actually buy? Our rollback rule is 10 words long. In a 7-word window, ramping overlap from 0 to 4 nearly doubles the indexed words while keeping complete coverage at zero:

<!-- leetllm: test, output=show -->

```python title="measure-overlap-cost-and-coverage.py"
def fixed_windows(text: str, size: int, overlap: int) -> list[str]:
    if size <= 0 or overlap < 0 or overlap >= size:
        raise ValueError("require size > overlap >= 0")
    words = text.split()
    step = size - overlap
    chunks = []
    for start in range(0, len(words), step):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
    return chunks


def carries_rollback_rule(text: str) -> bool:
    lowered = text.lower()
    return all(term in lowered for term in ["rollback failure", "15 minutes", "deploy id"])


policy = "Rollback failure page on-call within 15 minutes with deploy ID. Routine deploy notes archive within 14 days."
for overlap in [0, 2, 4]:
    chunks = fixed_windows(policy, size=7, overlap=overlap)
    complete = sum(carries_rollback_rule(chunk) for chunk in chunks)
    indexed_words = sum(len(chunk.split()) for chunk in chunks)
    print(f"overlap={overlap}: chunks={len(chunks)} indexed_words={indexed_words} complete={complete}")
    assert complete == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
overlap=0: chunks=3 indexed_words=17 complete=0
overlap=2: chunks=3 indexed_words=21 complete=0
overlap=4: chunks=5 indexed_words=33 complete=0
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/chunking_comparison_dark.png" alt="Three interval maps show how size-7 windows cover the same 17 runbook words. Overlap 0, 2, and 4 index 17, 21, and 33 words in 3, 3, and 5 chunks. Coverage strip intensity rises as words repeat across windows; the rollback rule spans words 1–10, so no seven-word window contains it." />
  <figcaption>Overlap 0, 2, and 4 index 17, 21, and 33 words across 3, 3, and 5 chunks. Darker bands mark repeated words; because the 10-word rule exceeds the 7-word window, overlap duplicates text without ever capturing the full rule.</figcaption>
</figure>

> **Key insight:** Overlap gives facts *shorter* than the window a second chance to land unbroken, at an indexing cost of roughly $1 / (1 - O/N)$ (so 20% overlap indexes ~25% more tokens). It can never fit a fact longer than the window itself.

In fact, Bennani and Moslonka found no measurable answer-quality lift from overlap in their Natural Questions experiments with sentence-aware splitting and SPLADE retrieval.[^bennani2026chunking] Measure overlap on your own queries before paying the storage and latency overhead.

## Prefer document structure when you have it

Rather than slicing across headings and trying to glue fragments back together with overlap, split along the document's existing structure first.

For plain prose without headings, LangChain's `RecursiveCharacterTextSplitter` provides a pragmatic fallback: it tries paragraph breaks (`"\n\n"`), line breaks (`"\n"`), spaces (`" "`), and finally characters (`""`) in order.[^langchain2023] Remember two defaults: it measures length with Python `len` (characters) unless you pass a tokenizer-backed `length_function`, and its default separators do not detect sentence boundaries.

When headings are available, keep each heading attached to its body text so the condition stays searchable:

<!-- leetllm: test, output=show -->

```python title="split-markdown-policy-sections.py"
from dataclasses import dataclass


@dataclass(frozen=True)
class PolicyChunk:
    heading: str
    body: str
    indexed_text: str
    locator: str


def headed_chunks(markdown: str, source_locator: str) -> list[PolicyChunk]:
    chunks: list[PolicyChunk] = []
    heading = "Document"
    body: list[str] = []

    def flush() -> None:
        if any(line.strip() for line in body):
            body_text = "\n".join(body).strip()
            chunks.append(
                PolicyChunk(
                    heading,
                    body_text,
                    f"{heading}\n{body_text}",
                    f"{source_locator};section={len(chunks)}",
                )
            )
        body.clear()

    for line in markdown.strip().splitlines():
        if line.startswith("## "):
            flush()
            heading = line[3:]
        else:
            body.append(line)
    flush()
    return chunks


policy = """## Rollback failure
Page on-call within 15 minutes with deploy ID.
## Routine deploy notes
Archive within 14 days after release."""

for chunk in headed_chunks(policy, "page=7"):
    print(chunk.indexed_text.replace("\n", " | "), "|", chunk.locator)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Rollback failure | Page on-call within 15 minutes with deploy ID. | page=7;section=0
Routine deploy notes | Archive within 14 days after release. | page=7;section=1
```
<!-- leetllm: output:end -->

Tables require the same structural care: detaching a data row from its column header strips every cell of its meaning. When a large table must be split across chunks, repeat the column header on every row group and keep the table's source locator:

<!-- leetllm: test, output=show -->

```python title="keep-policy-table-with-header.py"
table = [
    "| Condition | Window | Required evidence |",
    "| --- | --- | --- |",
    "| Rollback failure | 15 minutes | Deploy ID |",
    "| Routine deploy notes | 14 days | Release summary |",
]


def table_chunk(lines: list[str], heading: str) -> dict[str, str]:
    if len(lines) < 3:
        raise ValueError("need column names, separator, and at least one row")
    return {
        "heading": heading,
        "text": heading + "\n" + "\n".join(lines),
        "quality_check": "header_present" if lines[0].startswith("| Condition |") else "review",
    }


chunk = table_chunk(table, "Runbook windows")
print(chunk["heading"], chunk["quality_check"], f"rows={len(table) - 2}")
print("15 minutes" in chunk["text"] and "Deploy ID" in chunk["text"])
assert chunk["quality_check"] == "header_present"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Runbook windows header_present rows=2
True
```
<!-- leetllm: output:end -->

When a single section still exceeds your embedding size limit, preserve the hard size cap instead of merging a tiny tail past the ceiling. For example, 15 words split at max size 7 naively produce `7, 7, 1`; merging the last two creates an 8-word overflow. Distributing words evenly (`5, 5, 5`) respects the hard cap while recording exact character spans:

<!-- leetllm: test, output=show -->

```python title="split-long-section-with-metadata.py"
import math
import re


def section_windows(
    text: str, heading: str, source: str, size: int, min_tail_words: int
) -> list[dict]:
    if not 0 < min_tail_words <= size:
        raise ValueError("require 0 < min_tail_words <= size")
    words = list(re.finditer(r"\S+", text))
    if not words:
        return []
    count = math.ceil(len(words) / size)
    base, extra = divmod(len(words), count)
    children = []
    cursor = 0
    for index in range(count):
        length = base + int(index < extra)
        start = words[cursor].start()
        end = words[cursor + length - 1].end()
        children.append({
            "text": text[start:end],
            "heading": heading,
            "source": source,
            "span": (start, end),
            "needs_review": length < min_tail_words,
            "chunk_id": f"{source}:chars={start}-{end}",
        })
        cursor += length
    return children


children = section_windows(
    "Page on-call within 15 minutes with deploy ID. Include the service name and rollback attempt.",
    heading="Rollback failure",
    source="incident-runbook-v3.pdf:page=7;section=0",
    size=7,
    min_tail_words=4,
)

for child in children:
    print(child["chunk_id"], "|", child["heading"], "|", child["text"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
incident-runbook-v3.pdf:page=7;section=0:chars=0-30 | Rollback failure | Page on-call within 15 minutes
incident-runbook-v3.pdf:page=7;section=0:chars=31-58 | Rollback failure | with deploy ID. Include the
incident-runbook-v3.pdf:page=7;section=0:chars=59-93 | Rollback failure | service name and rollback attempt.
```
<!-- leetllm: output:end -->

Notice that `heading` and `source` provide <span data-glossary="provenance">source tracking</span>, yet child 0 (`Page on-call within 15 minutes`) still dropped `deploy ID`. To keep split children usable, either prepend the section heading into the embedded string or expand every matched child back to its full parent section before generation.

## Evaluate chunking with labeled questions

Test every chunking strategy against labeled queries before touching your vector database. A simple word-overlap scorer makes the effect of fragmentation immediately visible:

| Chunk | Matching query terms | Contains answer? |
| --- | ---: | ---: |
| complete rollback rule | 4 / 4 | yes |
| rollback-condition fragment | 2 / 4 | no |
| routine archive rule | 1 / 4 | no |

<!-- leetllm: test, output=show -->

```python title="retrieve-complete-evidence.py"
import re


def terms(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def retrieve(query: str, chunks: list[dict[str, str]]) -> dict[str, str]:
    query_terms = terms(query)
    return max(chunks, key=lambda chunk: len(query_terms & terms(chunk["text"])))


query = "rollback failure deploy minutes"
chunks = [
    {"id": "rollback-rule", "text": "Rollback failure: page on-call within 15 minutes with deploy ID."},
    {"id": "routine-rule", "text": "Routine deploy notes: archive within 14 days."},
]

hit = retrieve(query, chunks)
print(hit["id"], hit["text"])
assert hit["id"] == "rollback-rule"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rollback-rule Rollback failure: page on-call within 15 minutes with deploy ID.
```
<!-- leetllm: output:end -->

Compare broken fixed windows against section-aware chunks on the same query:

<!-- leetllm: test, output=show -->

```python title="compare-chunking-configurations.py"
import re


def terms(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def top_chunk(query: str, chunks: list[str]) -> str:
    query_terms = terms(query)
    return max(chunks, key=lambda text: len(query_terms & terms(text)))


query = "rollback failure deploy id"
expected = "Rollback failure: page on-call within 15 minutes with deploy ID."
configs = {
    "broken-fixed": [
        "Rollback failure: page on-call within",
        "15 minutes with deploy ID. Routine deploy notes: archive within 14 days.",
    ],
    "section-aware": [
        "Rollback failure: page on-call within 15 minutes with deploy ID.",
        "Routine deploy notes: archive within 14 days.",
    ],
}

for name, chunks in configs.items():
    hit = top_chunk(query, chunks)
    print(f"{name}: complete={expected in hit}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
broken-fixed: complete=False
section-aware: complete=True
```
<!-- leetllm: output:end -->

Expand into a small labeled regression suite covering multiple sections, tables, and exceptions:

<!-- leetllm: test, output=show -->

```python title="run-chunk-regression-suite.py"
import re


def terms(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def retrieve(query: str, chunks: list[dict[str, str]]) -> dict[str, str]:
    query_terms = terms(query)
    return max(chunks, key=lambda chunk: len(query_terms & terms(chunk["text"])))


chunks = [
    {"id": "rollback", "text": "Rollback failure: page on-call within 15 minutes with deploy ID."},
    {"id": "routine", "text": "Routine deploy notes: archive within 14 days."},
    {"id": "commander", "text": "Commander handoff requires the active incident channel."},
]
cases = [
    ("rollback failure deploy id", "rollback", "15 minutes"),
    ("routine deploy archive", "routine", "14 days"),
    ("commander incident channel", "commander", "active incident"),
]

passed = 0
for query, expected_id, evidence in cases:
    hit = retrieve(query, chunks)
    ok = hit["id"] == expected_id and evidence in hit["text"]
    passed += int(ok)
    print(query, "PASS" if ok else "FAIL")
print(f"summary={passed}/{len(cases)}")
assert passed == len(cases)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rollback failure deploy id PASS
routine deploy archive PASS
commander incident channel PASS
summary=3/3
```
<!-- leetllm: output:end -->

> **Common mistake:** Comparing two chunking strategies at equal `top_k` biases the test toward larger chunks because five long sections pack far more tokens than five short chunks. Hold the final generation token budget fixed and label ground truth by stable source spans rather than volatile chunk IDs.

## Search small, answer with enough context

Often the ideal unit for semantic search is a crisp sentence, while the ideal unit for generation is the surrounding section. **Parent-child retrieval** indexes small child spans for matching and expands each hit to its parent section before sending context to the model.[^langchain_parent_document_retriever]

<figure>
  <img src="illustrations/_generated/parent_child_evidence_dark.png" alt="Page 7 contains the complete rollback section. A split stores 15 minutes with deploy ID as an indexed child; an engineer query searches that child, and its pointer returns the full cited parent section with the page locator." />
  <figcaption>The retriever matches a narrow child excerpt, then follows its pointer to return the complete cited parent section and page locator.</figcaption>
</figure>

Expansion introduces three checks you must enforce at serving time: deduplicate multiple children pointing to the same parent, verify version agreement and caller permissions on the parent itself, and reject overflow instead of silently truncating a rule mid-sentence:

<!-- leetllm: test, output=show -->

```python title="expand-child-match-to-parent-context.py"
parents = {
    "rollback": {
        "text": "Rollback failure: page on-call within 15 minutes with deploy ID. Include the service name.",
        "source": "incident-runbook-v3.pdf", "locator": "page=7", "version": 3,
    },
}
children = [
    {"text": "15 minutes with deploy ID", "parent_id": "rollback", "version": 3},
    {"text": "Include the service name", "parent_id": "rollback", "version": 3},
]


def expand(matches: list[dict], allowed_parent_ids: set[str], word_budget: int) -> list[dict]:
    selected = {}
    for match in matches:
        parent_id = match["parent_id"]
        if parent_id not in allowed_parent_ids:
            raise PermissionError("parent access denied")
        parent = parents[parent_id]
        if match["version"] != parent["version"]:
            raise ValueError("stale child-to-parent link")
        selected[parent_id] = parent
    if sum(len(parent["text"].split()) for parent in selected.values()) > word_budget:
        raise ValueError("context budget exceeded; select smaller complete evidence")
    return list(selected.values())


context = expand(children, allowed_parent_ids={"rollback"}, word_budget=20)
print(f"child_hits={len(children)} parent_copies={len(context)}")
print(context[0]["text"])
assert "Rollback failure" in context[0]["text"]

failure_cases = [
    ("stale", [{**children[0], "version": 2}], {"rollback"}, 20,
     ValueError, "stale child-to-parent link"),
    ("denied", children, set(), 20, PermissionError, "parent access denied"),
    ("too small", children, {"rollback"}, 10,
     ValueError, "context budget exceeded; select smaller complete evidence"),
]
for name, matches, allowed, budget, expected_error, expected_message in failure_cases:
    try:
        expand(matches, allowed, budget)
    except expected_error as error:
        assert str(error) == expected_message
        print(f"{name}: {error}")
    else:
        raise AssertionError(f"{name} returned context instead of rejecting")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
child_hits=2 parent_copies=1
Rollback failure: page on-call within 15 minutes with deploy ID. Include the service name.
stale: stale child-to-parent link
denied: parent access denied
too small: context budget exceeded; select smaller complete evidence
```
<!-- leetllm: output:end -->

You can also prepend source and section headers to each child's embedded string so short spans remain unambiguous during search (while keeping the raw source text separate for accurate citations):

<!-- leetllm: test, output=show -->

```python title="prepend-section-context.py"
def indexed_text(heading: str, text: str, source: str) -> str:
    return f"Source: {source}\nSection: {heading}\n{text}"


child = indexed_text(
    heading="Rollback failure",
    text="Page on-call within 15 minutes with deploy ID.",
    source="Incident Runbook",
)
print(child)
assert "Section: Rollback failure" in child
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Source: Incident Runbook
Section: Rollback failure
Page on-call within 15 minutes with deploy ID.
```
<!-- leetllm: output:end -->

## Semantic boundaries and late chunking

Structure-aware splitting handles most handbooks cleanly. Reach for more complex splitters only when labeled failures show a specific gap:

| Observed failure | Candidate technique | What to measure |
| --- | --- | --- |
| Single long paragraph shifts topics | Semantic transition detection | Hard size cap and labeled-query recall |
| Short hit lacks surrounding rule | Parent-child expansion | Deduplication and generation token budget |
| Short child is ambiguous out of context | Contextual header prefix | Retrieval lift vs. plain baseline |
| Pronouns depend on earlier paragraphs | Late chunking | Encoder support, latency, and permission scope |

Bennani and Moslonka observed that sentence-preserving splits matched semantic chunking up to roughly 5k tokens of retrieved context on Natural Questions.[^bennani2026chunking] Always benchmark simple structural splits first.

**Semantic chunking** compares embeddings of adjacent sentences and inserts a split wherever cosine similarity drops below a threshold:

<!-- leetllm: test, output=show -->

```python title="find-semantic-split-candidates.py"
import re
import numpy as np


def vector(sentence: str) -> np.ndarray:
    words = set(re.findall(r"[a-z0-9]+", sentence.lower()))
    return np.array([
        float(sum(word in words for word in ["rollback", "deploy", "minutes", "id"])),
        float(sum(word in words for word in ["commander", "handoff", "channel"])),
    ], dtype=np.float64)


def cosine(left: np.ndarray, right: np.ndarray) -> float | None:
    norm_l = np.linalg.norm(left)
    norm_r = np.linalg.norm(right)
    if norm_l == 0.0 or norm_r == 0.0:
        return None
    return float(np.dot(left, right) / (norm_l * norm_r))


sentences = [
    "Rollback failures require deploy IDs.",
    "Page on-call within 15 minutes.",
    "Commander handoff uses the active incident channel.",
]

for left, right in zip(sentences, sentences[1:]):
    similarity = cosine(vector(left), vector(right))
    if similarity is None:
        print("unknown: review split")
    else:
        print(f"{similarity:.2f}", "split" if similarity < 0.50 else "keep together")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1.00 keep together
0.00 split
```
<!-- leetllm: output:end -->

**Late chunking** tackles a different problem: cross-sentence references like *"Berlin"* followed later by *"the city."* Instead of embedding each chunk independently, Günther et al. pass the full document (or a long window) through the <span data-glossary="transformer">transformer</span> encoder first, then mean-pool the contextual token embeddings inside each chunk span.[^gunther2024]

<figure>
  <img src="illustrations/_generated/late_vs_early_chunking_dark.png" alt="Side-by-side comparison of early and late chunking on an eight-word sentence split into spans of three, three, and two words. On the left (early), attention is constrained to block-diagonal spans so pooled states h4 to h6 lack sentence context. On the right (late), full cross-attention allows pooled states h4 to h6 to carry context from the entire sentence." />
  <figcaption>Early chunking restricts self-attention to each 3/3/2 span independently. Late chunking encodes the full sequence first and pools token states 4 through 6 afterward, letting each chunk vector carry surrounding document context.</figcaption>
</figure>

Keep three constraints in mind for late chunking:
1. **Vectors improve, text does not:** The chunk text still reads `"the city"`, so the generator still needs parent expansion or antecedent context to write a clear answer.
2. **Token-state access required:** You need an encoder exposing token-level hidden states and careful character-to-token offset alignment (unlike ColBERT late interaction, late chunking still stores a single pooled vector per chunk).[^gunther2024]
3. **Permission isolation:** Never encode public text and restricted text in the same shared transformer pass, because attention allows restricted tokens to shape the public chunk's vector even if the restricted text is filtered later.

## Indexing checklist for production chunks

| Design choice | Recommended starting point | What to verify |
| --- | --- | --- |
| Default split strategy | Heading-aware sections with recursive fallback | Answerable-chunk rate on labeled queries |
| Size budget | Measure full indexed text with the embedding tokenizer | Zero silent truncation; token count ≠ word count |
| Tables | Repeat headers with every row group | Exact-value queries preserve column roles |
| Overlap | Off for complete sections; test only on prose fallbacks | Index growth, duplicates, and recall lift |
| Metadata | Source ID, locator, heading, <span data-glossary="checksum">checksum</span> | Every cited answer maps back to its source span |
| Next step | Parent expansion before semantic or late chunking | Concrete missed queries justifying extra complexity |

Before writing chunks to an index, verify that every chunk has non-empty text, required metadata, a content checksum, and passes quality review:

<!-- leetllm: test, output=show -->

```python title="validate-indexable-chunks.py"
from hashlib import sha256


chunks = [
    {
        "id": "rollback",
        "text": "Rollback failure: page on-call within 15 minutes with deploy ID.",
        "source": "incident-runbook-v3.pdf",
        "locator": "page=7;section=0",
        "heading": "Rollback failure",
        "quality": "ready",
    },
    {
        "id": "broken",
        "text": "15 minutes with deploy ID.",
        "source": "incident-runbook-v3.pdf",
        "locator": "page=7;section=1",
        "heading": "Fragment",
        "quality": "review",
    },
]

for chunk in chunks:
    chunk["chunk_checksum"] = sha256(chunk["text"].encode()).hexdigest()

required_metadata = ("source", "locator", "heading", "chunk_checksum")
indexable = [
    chunk for chunk in chunks
    if chunk.get("quality") == "ready"
    and bool(chunk.get("text", "").strip())
    and all(chunk.get(field) for field in required_metadata)
]
print(f"indexable={[chunk['id'] for chunk in indexable]}")
print(f"blocked={len(chunks) - len(indexable)}")
assert [chunk["id"] for chunk in indexable] == ["rollback"]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
indexable=['rollback']
blocked=1
```
<!-- leetllm: output:end -->

## Practice: test chunking limits

1. Change the fixed-window size to 10 with overlap 0. Check the resulting chunk lengths and how many complete rollback rules survive.
2. Run `section_windows` on 15 words with `size=7` and `min_tail_words=6`. Why can't every child satisfy both rules, and which rule must win?
3. Add `"No action is required."` to the semantic split script. What happens to its vector, and why shouldn't that alone trigger a split?
4. In `expand-child-match-to-parent-context.py`, mutate one child's version to 2, remove permission, then lower `word_budget` to 10. Confirm each case raises an error before returning context, while two valid hits still deduplicate to one parent.

```checkpoint
Compare your answers
---
Size 10 produces chunks of 10 and 7 words, capturing one complete rollback rule. For 15 words under a hard cap of 7, you need at least 3 chunks, which cannot all hold 6 words (3 × 6 = 18 > 15); the hard cap wins and short chunks are flagged for review. The unfamiliar sentence maps to [0, 0], making cosine undefined rather than zero. Parent expansion rejects stale links, denied permissions, and budget overflows rather than returning truncated text.
```

```checkpoint
Both halves of the paging sentence are retrieved from the same approved source version and are provided in source order. Must the answer fail because neither half is complete alone? What changes if the first half is omitted to fit the context budget?
---
Together in source order, the two halves provide the complete rule. If the condition-bearing first half is dropped to fit the context budget, the remaining deadline and ID lose their trigger condition. Always check coverage on the final assembled context, not raw retrieval hits.
```

```mastery-quiz
[
  {
    "question": "An engineer asks, “Backup job B873 failed. How soon should I page, and which ID should I include?” The only passage the model receives comes from page 8 of the current operations runbook. Its full text reads, “If that happens, page within 10 minutes and include the job ID.” Which property fails for this query?",
    "options": [
      "Answerability",
      "Searchability",
      "Data lineage",
      "Freshness"
    ],
    "answer": "Answerability",
    "explanation": "The passage gives a ten-minute deadline and asks for the job ID, yet “if that happens” could refer to a failed backup or a failed restore. The model needs the antecedent trigger to know whether the rule applies to B873."
  },
  {
    "question": "A fixed splitter processes 20 words with size 8 and overlap 3. It stops when a window reaches the source end. What are the zero-based start offsets and the total number of word occurrences indexed?",
    "options": [
      "Starts [0, 3, 6, 9, 12], totaling 40 words.",
      "Starts [0, 5, 10, 15], totaling 29 words.",
      "Starts [0, 8, 16], totaling 20 words.",
      "Starts [0, 5, 10, 15], totaling 32 words."
    ],
    "answer": "Starts [0, 5, 10, 15], totaling 29 words.",
    "explanation": "Each window advances by 8 − 3 = 5 words. The first three windows hold 8 words each and 5 words remain at offset 15, totaling 24 + 5 = 29 words."
  },
  {
    "question": "A 23-word document contains a rule spanning 12 consecutive words. Nine-word windows with overlaps of 0, 3, and 6 index 23, 32, and 53 word occurrences, respectively. The retriever can return several windows. What follows about coverage of the rule?",
    "options": [
      "At overlap 6, one hit can contain the rule. For several hits, check their combined coverage after applying the evidence budget.",
      "At overlap 6, one hit can contain the rule. Record a coverage failure whenever each of several returned hits lacks part of the rule.",
      "At every overlap, one hit is too short. For several hits, check their combined coverage after applying the evidence budget.",
      "At every overlap, one hit is too short. Record a coverage failure whenever each of several returned hits lacks part of the rule."
    ],
    "answer": "At every overlap, one hit is too short. For several hits, check their combined coverage after applying the evidence budget.",
    "explanation": "A 12-word rule cannot fit inside a 9-word window at any overlap. Multiple returned windows can still cover all 12 words together, so inspect the assembled context that reaches the generator."
  },
  {
    "question": "A Markdown runbook has separate Rollback failure and Routine deploy notes sections, and each complete section fits the embedding budget. The baseline must preserve each condition with its rule in a separate indexed unit, retain source attribution, and avoid parent-expansion work or duplicated text. Which representation satisfies that requirement?",
    "options": [
      "Split sentences, store headings in metadata, and expand to the parent when a child ranks highly against the question.",
      "Merge both sections into one page chunk, preserve the locator, and use reranking to distinguish the two conditions.",
      "Apply recursive windows across both sections, and add overlap until each deadline appears twice in the searchable index.",
      "Create one chunk per section, prepend its heading to indexed text, and retain source and locator fields for citation."
    ],
    "answer": "Create one chunk per section, prepend its heading to indexed text, and retain source and locator fields for citation.",
    "explanation": "Prepending each heading keeps the trigger condition attached to its deadline in searchable text, while source and locator metadata preserve citations without duplication."
  },
  {
    "question": "A returned table row group must be self-contained in its indexed text, with no later metadata or header expansion. It contains `Backup failure | 10 minutes | Job ID` but omits `Condition | Window | Required evidence`. Which correction restores its meaning?",
    "options": [
      "Repeat the prior data row beside this row, using neighboring examples as the source of the missing column meanings.",
      "Keep the header with relevant rows, and carry the table heading and locator for retrieval context and source citation.",
      "Index cells independently, retaining column names as metadata for later generation rather than in their searchable text.",
      "Embed the row without labels, and preserve its checksum as integrity evidence from which the column roles follow."
    ],
    "answer": "Keep the header with relevant rows, and carry the table heading and locator for retrieval context and source citation.",
    "explanation": "Without column names, `10 minutes` and `Job ID` lose their roles. Repeating the header on every row group preserves table semantics alongside heading and locator metadata."
  },
  {
    "question": "An embedder-tokenizer measurement gives 47 body tokens, 4 added heading tokens, and 2 special tokens. The model limit is 48. Which ingestion result follows?",
    "options": [
      "49 tokens: count body and special tokens; reject the encoded input as one position over the 48-token limit.",
      "47 tokens: count the body but exclude retrieval labels and special tokens; accept it within the 48-token limit.",
      "53 tokens: count body, heading, and special tokens; reject or split it as five positions over the 48-token limit.",
      "48 tokens: clamp the measured count to the model maximum; accept its vector as representing the complete input."
    ],
    "answer": "53 tokens: count body, heading, and special tokens; reject or split it as five positions over the 48-token limit.",
    "explanation": "47 + 4 + 2 = 53 tokens, which exceeds the 48-token ceiling by 5. Always measure the complete final input with the embedding tokenizer so silent truncation never drops trailing conditions."
  },
  {
    "question": "A regression case for a ferry cancellation rule expects record ID `ferry-v3` and checks for the phrase `48 hours`. Search returns `ferry-v2`, whose text reads `Cancel ferry bookings at least 48 hours before departure.` How should the ID check and phrase check score this hit?",
    "options": [
      "The ID check passes and the phrase check fails.",
      "Both checks pass.",
      "The ID check fails and the phrase check passes.",
      "Both checks fail."
    ],
    "answer": "The ID check fails and the phrase check passes.",
    "explanation": "The returned ID (`ferry-v2`) mismatches `ferry-v3`, so the source check fails, while the phrase `48 hours` is present so the text check passes. Both checks must pass for the regression case to succeed."
  },
  {
    "question": "Two child hits point to parent P, which contains 18 generator tokens. A third points to parent Q, which contains 11. Both parents are current and permitted. The host sends whole parents, deduplicates them, and has 25 tokens for evidence. What does the full expansion cost, and can the host send both parents?",
    "options": [
      "29 tokens. Send both parents.",
      "47 tokens. Reject the pair.",
      "29 tokens. Reject the pair.",
      "47 tokens. Send both parents."
    ],
    "answer": "29 tokens. Reject the pair.",
    "explanation": "Deduplicating P counts its 18 tokens once, plus 11 for Q = 29 tokens, which exceeds the 25-token budget. Rejecting the overflow avoids truncating a parent mid-rule."
  },
  {
    "question": "A semantic splitter receives consecutive vectors [2, 0], [1, 1], and [0, 0]. It proposes a cut for cosine similarity below 0.8 and sends undefined values to review. What happens at each split point?",
    "options": [
      "At the first split point, cut (cosine ≈ 0.707). At the second, cut (cosine = 0).",
      "At the first split point, cut (cosine ≈ 0.707). At the second, review (cosine undefined).",
      "At the first split point, keep together (cosine = 1). At the second, review (cosine undefined).",
      "At the first split point, keep together (cosine = 1). At the second, cut (cosine = 0)."
    ],
    "answer": "At the first split point, cut (cosine ≈ 0.707). At the second, review (cosine undefined).",
    "explanation": "Between [2, 0] and [1, 1], cosine is 2 / (2 * sqrt(2)) ≈ 0.707 < 0.8, triggering a cut. With [0, 0], norm is zero so cosine is undefined and routes to review."
  },
  {
    "question": "A public returns policy says, “Send the package to the assigned depot.” A restricted note names the depot. An encoder reads both passages together, then averages the public sentence's token states into one vector. A filter returns only the public sentence. How should the system handle the vector and a public query asking which depot to use?",
    "options": [
      "Keep the stored vector after filtering. Cite the public sentence as the source of the depot name.",
      "Re-encode the sentence using public context alone. Cite the public sentence as the source of the depot name.",
      "Keep the stored vector after filtering. Require a permitted passage that names the depot.",
      "Re-encode the sentence using public context alone. Require a permitted passage that names the depot."
    ],
    "answer": "Re-encode the sentence using public context alone. Require a permitted passage that names the depot.",
    "explanation": "Shared encoding lets restricted tokens influence the public sentence's vector even after text filtering, so re-encode within public context alone. Because the public sentence never names the depot, the answer still requires a permitted source that does."
  }
]
```

> **Next:** Continue to [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations) to examine what evaluation scores measure in practice. Finding the right chunk is one half of the pipeline; checking whether a model uses it accurately is the next.
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

The paging rule made it out of the PDF intact. We can read it in the record, and we trust it:

> Rollback failure: page on-call within 15 minutes with deploy ID.

Then we split the document into pieces for search, and the pipeline does something that looks harmless. One piece ends with `Rollback failure: page on-call within`, and the next begins with `15 minutes with deploy ID.` Now the engineer asks, "A rollback failed after deploy `pay-742`. When do I page, and what ID do I include?" The second piece can easily rank first: it shares "deploy" and "ID" with the question, and a search by meaning may well notice that it holds a time limit. So it goes to the model. The model reads a sentence with a deadline and a requirement, and nothing to say what they apply to.

Nothing crashed. Every stage did its job, the deadline survived extraction, and the retrieved passage scores well. The answer still fails, because the cut landed in the middle of the only sentence that mattered.

Chunking decides how documents get divided into the units a search system returns. Retrieval-augmented generation, or RAG, works by selecting passages from outside the model and handing them to it along with the question,[^lewis2020] so these cuts determine two things at once: what a query can match, and what a matched passage can tell the model. This chapter carries the same runbook through three approaches, from fixed windows to document structure to searching small and returning more, and measures each one by what finally reaches the model.

One piece of machinery shapes all of this. An embedding model turns a whole passage into one vector, a list of a few hundred numbers, so that passages with similar meanings land near each other. [Hybrid search](/learn/hybrid-search-dense-sparse-retrieval) runs a real one. For now you need two facts. The model accepts a limited number of tokens, and a long passage gets squeezed into one vector just as a short one does. `all-MiniLM-L6-v2`, a common small model, produces 384 numbers and by default cuts its input at 256 word pieces.[^allMiniLM2026] That cap is the embedding limit you will see in the rest of this chapter.

## Decide what success looks like before you cut

It is tempting to treat chunk size as a tuning knob, and start by asking whether 512 tokens beats 256. A better opening question is what a correct passage looks like for a real question. To answer the engineer, the model needs three things connected: the rollback-failure condition, the 15-minute deadline, and the deploy-ID requirement.

| Text the model receives | What is missing? |
|---|---|
| Rollback failure: page on-call within | The deadline and the required ID |
| 15 minutes with deploy ID | What situation any of this applies to |
| The complete paging sentence | Nothing, for this question |

This gives us a sharper test than any similarity score. It also frees up the design. The complete sentence can arrive in one chunk, or it can be assembled from several source spans the caller may read. Small pieces are fine as search targets as long as some later step restores their context. What matters is what the model receives after every serving step has run: expansion, deduplication, permission checks, and budget limits.

Two common misunderstandings live here. A page number in a citation helps a person find the original, but it does nothing for a model whose context lacks the deadline. And a stored pointer to a parent section is only a route to more text. Until the serving path follows it, the model has not seen a word of that section.

## Fixed windows, and what overlap really buys

The simplest splitter walks across the text in fixed steps. A window of size $N$ with overlap $O$ advances by $N-O$ positions, so that neighboring chunks share some text. Overlap is the standard first remedy for edge fragmentation problems, and it is worth seeing exactly what it does.

The next program splits a seventeen-word rule on whitespace so every boundary is easy to inspect; in production, measure chunk lengths with the embedding model's subword tokenizer including prepended headings and special tokens.

<!-- leetllm: test, output=show, id=reader-chunking-windows -->
```python title="see-a-window-cut-the-rule.py"
def windows(text, size, overlap):
    if not 0 <= overlap < size:
        raise ValueError("require size > overlap >= 0")
    words = text.split()
    result = []
    for start in range(0, len(words), size - overlap):
        end = min(start + size, len(words))
        result.append(" ".join(words[start:end]))
        if end == len(words):
            break
    return result

text = ("Rollback failure page on-call within 15 minutes with deploy "
        "ID. Routine deploy notes archive within 14 days.")
RULE = ["rollback failure", "15 minutes", "deploy id"]
FACT = ["15 minutes with deploy id"]

def holding(chunks, phrases):
    return sum(all(p in chunk.lower() for p in phrases)
               for chunk in chunks)

for index, chunk in enumerate(windows(text, 6, 2)):
    print(f"{index}: {chunk}")
for overlap in [0, 2, 4]:
    chunks = windows(text, 7, overlap)
    words = sum(len(chunk.split()) for chunk in chunks)
    rule, fact = holding(chunks, RULE), holding(chunks, FACT)
    print(f"overlap={overlap}: words={words} rule={rule} fact={fact}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0: Rollback failure page on-call within 15
1: within 15 minutes with deploy ID.
2: deploy ID. Routine deploy notes archive
3: notes archive within 14 days.
overlap=0: words=17 rule=0 fact=0
overlap=2: words=21 rule=0 fact=1
overlap=4: words=33 rule=0 fact=1
```
<!-- leetllm: output:end -->

The first window ends right after `15`, so the number has been separated from its unit. Now look at the bottom three lines, which run windows of seven words at three levels of overlap. Overlap climbs from 0 to 4, indexed words almost double from 17 to 33, and the count of chunks holding the complete rule stays at zero.

Of course it does. The rule is ten words long and the window holds seven. No amount of sliding will fit a ten-word fact into a seven-word window. Overlap cannot make a window bigger, and it charges you for every repeated word.

Now try a fact that fits, in the `fact` column. `15 minutes with deploy ID` is five words, and overlap 0 cuts it in two. Overlap 2 saves it for four extra words. Overlap 4 saves it too, for sixteen extra words. That is what overlap buys: a second chance for facts shorter than the window, at a price you can count.

<figure>
  <img src="illustrations/_generated/chunking_comparison_dark.png" alt="Three interval maps show size-7 windows over the same 17 runbook words. Overlap 0, 2, and 4 store 17, 21, and 33 words in 3, 3, and 5 chunks. A strip under each map darkens where words repeat across windows. The rollback rule spans words 1 to 10, so no seven-word window holds the whole rule at any overlap." />
  <figcaption>Overlap 0, 2, and 4 index 17, 21, and 33 words across 3, 3, and 5 chunks. Darker strips mark words stored in more windows. The ten-word rule spans the shaded region and never fits inside a single seven-word window, so for this rule the extra copies buy nothing.</figcaption>
</figure>

For long documents the cost has a simple form. Ignoring end effects, an overlap fraction $r=O/N$ multiplies the text you process by about $1/(1-r)$, so a 20% overlap means about 25% more text to embed and store. Experiments by Bennani and Moslonka give good reason to check whether overlap helps on your workload: across up to 20% overlap on Natural Questions, with chunks of 50 to 500 tokens and context budgets from 500 to 10,000 tokens, answer quality did not measurably move.[^bennani2026chunking] Their retriever was SPLADE, a learned form of word matching that [Hybrid search](/learn/hybrid-search-dense-sparse-retrieval) covers. Their explanation depends on sentence-aware splitting and that retriever, so test overlap on your own runbooks with your own retriever instead of copying a default.

```checkpoint
You split a 10,000-token document into windows of 200 tokens with 40 tokens of overlap. About how many tokens do you embed, and how long can a fact be and still be sure of landing whole inside one window?
---
The overlap fraction is $40/200=0.2$, so you embed about $10{,}000/(1-0.2)=12{,}500$ tokens. Windows start every 160 tokens, so any fact of about 40 tokens or fewer always fits inside one. A longer fact up to 200 tokens fits only if the cuts happen to fall well, and anything over 200 never fits.
```

## Use the structure ingestion preserved

Here is the frustrating part. The document already knows where its rules begin and end. Suppose the source groups the paging action under a heading called `Rollback failure`, and ingestion kept that heading. A fixed window throws it away and then tries to rediscover the relationship by repeating text.

So use it. Keep the section as one retrieval unit whenever it fits the embedding limit, and prepend its heading to the text you index. The body can then begin with "Page on-call," and the condition stays attached. Store the original span and locator separately from that search text, so the added label never turns into a false quotation when you cite the source.

We wrote the records below by hand. They show what a structure-aware adapter should give you: each section with its heading, body, source, and locator.

<!-- leetllm: test, output=show, id=reader-chunking-sections -->
```python title="index-preserved-sections.py"
import re

sections = [
    {"id": "rollback", "heading": "Rollback failure",
     "body": "Page on-call within 15 minutes with deploy ID.",
     "source": "incident-runbook-v3.pdf",
     "locator": "page=7;section=0"},
    {"id": "archive", "heading": "Routine deploy notes",
     "body": "Archive within 14 days after release.",
     "source": "incident-runbook-v3.pdf",
     "locator": "page=7;section=1"},
]
for s in sections:
    s["indexed_text"] = s["heading"] + "\n" + s["body"]

def terms(text):
    return set(re.findall(r"[a-z0-9]+", text.lower()))

query = "rollback failure deploy minutes"
hit = max(sections, key=lambda section:
          len(terms(query) & terms(section["indexed_text"])))
print(hit["id"], hit["locator"])
print(hit["indexed_text"].replace("\n", " | "))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rollback page=7;section=0
Rollback failure | Page on-call within 15 minutes with deploy ID.
```
<!-- leetllm: output:end -->

This scorer counts shared words, which keeps our attention on the cut itself before any vector index enters the picture. The heading makes the condition searchable, and the returned body brings the deadline and the ID along with it. Compare that with a candidate that ranks just as well and ends before `15 minutes`.

Tables need the same care. Split `Rollback failure | 15 minutes | Deploy ID` away from `Condition | Window | Required evidence`, and the values lose their roles. When a table is too long for one chunk, repeat the column names with each group of rows, keep the table's locator, and keep any qualifiers that apply to the whole table.

## When a section is too big

Some sections will exceed your embedding limit, and you will need a fallback inside them. LangChain's recursive splitter is the usual starting point: it tries paragraph breaks, then line breaks, then spaces, then individual characters.[^langchain2023] Know its defaults before you trust it. Its length function counts characters unless you say otherwise, which is a different budget from tokens, and nothing in its default separator list understands sentences.

Measure the final string you will embed, after adding headings, with the tokenizer of the embedding model. Then check the returned context again with the generator's tokenizer, since the two models can have different tokenizers and different limits.

Short tails force a choice, and it pays to make that choice on purpose. Say you split fifteen words into non-overlapping chunks of at most seven. You need at least three chunks. You might also want every chunk to have at least six words, so nothing looks too small to be useful, but that is impossible, since three such chunks need eighteen words. The tempting fix is to merge the tail into its neighbor, which quietly creates an eight-word chunk and breaks the cap you set in the first place. Keep the hard cap. Flag the short piece, and either pick a different representation or require expansion whenever it is retrieved.

Finally, keep track of where each chunk came from in terms that survive change. Store half-open character offsets into a specific normalized version of the source, along with a map back to the raw document. Chunk IDs change whenever your splitter changes, so label your evaluation sets by source span. Otherwise every improvement to your splitter invalidates your test data, and you can no longer compare before and after.

## Search small, return more

Here is an idea that dissolves much of the chunk-size argument: the best unit to search and the best unit to read need not be the same.

A short sentence often makes a sharp search target, because a vector for one precise idea is less diluted than a vector for a whole page. That same short sentence makes a poor thing to hand a model. Parent-child retrieval takes both sides seriously. It indexes the small child for matching, and it returns the larger parent section for generation.[^langchain_parent_document_retriever]

For our runbook, the child `15 minutes with deploy ID` points to the complete rollback section. The engineer's question matches the child, and the model reads the whole rule.

<figure>
  <img src="illustrations/_generated/parent_child_evidence_dark.png" alt="A query about a failed rollback on deploy pay-742 matches the short indexed child 15 minutes with deploy ID. After checks that the link is current, the caller may read the parent, and the section fits the budget, its pointer returns the complete rollback section from page 7 of incident-runbook-v3.pdf." />
  <figcaption>The index stores a short child for matching. A query that hits it follows the pointer back to the complete rollback section, which is what the model reads and what the answer cites.</figcaption>
</figure>

That pointer is new machinery, and it has its own ways to fail. The parent may have changed since the child was indexed. The caller may be allowed to read one and not the other. Two children of the same parent may both match, and you should send one copy of the parent rather than two. Several parents together may overflow your context budget. This small expansion function checks all four, and the output shows one success followed by each failure in turn.

<!-- leetllm: test, output=show, id=reader-chunking-parent -->
```python title="resolve-a-permitted-complete-parent.py"
parents = {"rollback": {
    "version": 3,
    "text": ("Rollback failure: page on-call within 15 minutes "
             "with deploy ID."),
}}

def expand(matches, allowed, word_budget):
    selected = {}
    for match in matches:
        parent_id = match["parent"]
        if parent_id not in allowed:
            raise PermissionError("parent access denied")
        parent = parents[parent_id]
        if match["version"] != parent["version"]:
            raise ValueError("stale parent link")
        selected[parent_id] = parent
    words = sum(len(p["text"].split()) for p in selected.values())
    if words > word_budget:
        raise ValueError("complete context exceeds budget")
    return list(selected.values())

hits = [{"parent": "rollback", "version": 3}] * 2
print("parent copies:", len(expand(hits, {"rollback"}, 20)))
for matches, allowed, budget in [
    ([{"parent": "rollback", "version": 2}], {"rollback"}, 20),
    (hits, set(), 20), (hits, {"rollback"}, 5),
]:
    try:
        expand(matches, allowed, budget)
    except (ValueError, PermissionError) as error:
        print(error)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
parent copies: 1
stale parent link
parent access denied
complete context exceeds budget
```
<!-- leetllm: output:end -->

Each of those errors protects a different property: the link is current, the reader is allowed, and the complete text fits. Notice that the budget failure raises an error instead of cutting the parent down to size. Silent truncation can remove the exact condition that expansion was meant to restore. If a parent is too large, choose a smaller complete unit, or report that you lack enough context. The real version counts budget with the generator's tokenizer, and it reserves room for instructions, the question, and the output.

```checkpoint
Search returns children from three parents, ranked first to third, of 300, 300, and 500 tokens, and your context budget is 1,000 tokens. `expand` raises an error. A teammate suggests cutting the third parent down to 400 tokens so that everything fits. What would you do?
---
Do not cut it, since the 100 tokens you remove may hold the condition that the expansion was meant to restore. Send the two highest-ranked parents, which use 600 tokens, record that the third was dropped, and check whether the answer still has what it needs. If the third parent holds a required condition, report that you lack enough context.
```

## Reach for fancier splitting only when something fails

Two more sophisticated techniques come up constantly, and both solve specific problems. Save them until your measurements show you have those problems. Bennani and Moslonka report that sentence-preserving splits matched semantic chunking up to roughly five thousand tokens of retrieved context in their Wikipedia setup, which is a useful reminder to measure the simple option first.[^bennani2026chunking]

**Semantic chunking** places cuts where the embeddings of neighboring sentences change sharply. This can help when one paragraph drifts between topics. Its threshold needs tuning on labeled cases, and it can detach things you wanted kept together, such as an exception from its rule, or a pronoun from what it refers to. A sentence the model represents poorly gives you no real signal about a topic change either, so inspect the cuts before you trust them.

**Late chunking** addresses a different problem. Consider a passage that mentions Berlin and later says "the city." Chunked and embedded separately, that later sentence has no idea which city. Late chunking runs the longer text through the encoder first, then averages the token representations falling inside each chunk, so the vector for "the city" can reflect the earlier mention of Berlin.[^gunther2024]

Two details limit what this buys you. The vector improved, but the text did not. The returned chunk still says "the city," so the model needs the antecedent from some other step. And the technique requires an embedding model that exposes token-level states, an input that fits the encoder, and care with offsets between source text and tokens. Averaging vectors from chunks that were encoded separately gives you none of this, since those vectors formed without seeing each other.

Late chunking also has a security consequence that is easy to miss. If a public paragraph is encoded alongside a restricted one, its vector is shaped by the restricted text. Filtering what you display does nothing about that. Keep shared encoder inputs inside one permission and trust scope, and record which context produced each vector.

## Compare what finally reaches the model

When you do compare splitters, the comparison has to be fair, but the common way of doing it is not. Comparing at equal top-$k$ favors long chunks: five long sections can consume far more of your context budget than five short children. So fix a token budget for generation, run each splitter through the same retrieval and assembly path, and evaluate what comes out at the end.

Use labeled questions with known source versions and answer-bearing spans, and measure five things: whether the right passage was found, whether the assembled context is enough to answer, how much duplicate text it holds, latency, and index size. Include the failures from this chapter in your test set: a condition split from its deadline, a table cut away from its header, an exception lost at the end of a section.

If you are starting today, here is what I would ship first. Split on document structure, prepend headings, fall back to a recursive splitter inside oversized sections, and add parent expansion for documents where sections are long. Leave semantic and late chunking out until a labeled failure asks for them. Every later comparison then has a clean baseline to beat.

The runbook now has a traceable path from source record to complete, permitted context. The next step is to build the service around that path. [Production RAG](/learn/design-production-rag-pipeline) follows one real request from a caller's question through retrieval to a cited answer, and shows where it can still go wrong.

<!-- leetllm: edition:reader:end -->
