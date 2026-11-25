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
  "section": "Applied LLM Engineering & RAG",
  "order": 10
}
---

<!-- leetllm: edition:reference:start -->

Suppose your ingestion pipeline extracted a key specification cleanly from `inference-api-spec-v2.md` (covered in [File Ingestion for AI](/learn/file-ingestion-pdfs-html-ocr-markdown)):

> `inference-api-spec-v2.md`, section 4.2: **Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames.**

To answer a developer's question about connection drops, the language model needs the trigger (`idle SSE connections`), the threshold (`90 seconds`), and the exception (`without heartbeat frames`) together. Slice the sentence so one chunk holds `"Streaming timeout: close idle SSE connections after"` and the next holds `"90 seconds without heartbeat frames."`, and neither chunk alone tells the truth.

<span data-glossary="chunking">Chunking</span> divides source documents into the units a retriever indexes and returns in <span data-glossary="rag">retrieval-augmented generation (RAG)</span>.[^lewis2020] Where you place each cut directly determines both what a query matches and what the model can truthfully state.

<figure>
  <img src="illustrations/_generated/chunking_strategies_dark.png" alt="Fixed-size overlapping windows sever a specification mid-clause between a number and its unit, whereas heading-aware section chunking keeps the full condition, threshold, exception, and source locator intact." />
  <figcaption>Fixed windows split a rule right between its numeric threshold and its qualifying clause. A heading-aware section keeps the condition, value, and source locator together.</figcaption>
</figure>

## What an answerable chunk preserves

Before comparing splitters, define what a complete passage looks like for a concrete query: *"Why did my idle streaming connection close, and how do I keep it open?"*

| Candidate chunk | Searchable? | Answerable? | Defect |
| --- | ---: | ---: | --- |
| `Streaming timeout: close idle SSE connections after` | yes | no | Drops the 90-second limit and heartbeat exception |
| `90 seconds without heartbeat frames. Batch retention: expire JSONL outputs after 14 days.` | yes | no | Drops the SSE trigger and mixes in an unrelated retention rule |
| `Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames.` | yes | yes | Keeps trigger, threshold, and exception intact |

Small chunks still work well as sharp search targets when a downstream step reliably expands them into their parent section before generation. Always evaluate the complete assembled text that actually enters the generator under your context budget.

## Fixed windows and the real cost of overlap

The simplest splitter walks across text in fixed windows of $N$ <span data-glossary="token">tokens</span> with overlap $O$, advancing by stride $N - O$. The examples below split on whitespace so cut boundaries stay easy to inspect; in production, always count lengths with your <span data-glossary="embedding">embedding</span> model's tokenizer (including prepended headings and special tokens) so oversized inputs are never silently truncated.

What does increasing overlap actually buy? Our streaming-timeout rule is 12 words long. Inside a 7-word window, ramping overlap from 0 to 4 nearly doubles the total indexed words while keeping complete coverage of the 12-word rule at zero:

<!-- leetllm: test, output=show, deps=numpy -->
```python title="fixed-windows-and-overlap-cost.py"
import numpy as np


def fixed_windows(text: str, size: int, overlap: int) -> list[str]:
    if not 0 <= overlap < size:
        raise ValueError("require size > overlap >= 0")
    words = text.split()
    chunks = []
    for start in range(0, len(words), size - overlap):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
    return chunks


spec = (
    "Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames. "
    "Batch retention: expire JSONL outputs after 14 days."
)
for i, chunk in enumerate(fixed_windows(spec, size=6, overlap=2)):
    print(f"win[{i}]: {chunk}")

full_rule = ("streaming timeout", "90 seconds", "heartbeat frames")
short_fact = ("90 seconds without heartbeat",)

for overlap in (0, 2, 4):
    chunks = fixed_windows(spec, size=7, overlap=overlap)
    indexed_words = sum(len(c.split()) for c in chunks)
    has_rule = sum(all(p in c.lower() for p in full_rule) for c in chunks)
    has_short = sum(all(p in c.lower() for p in short_fact) for c in chunks)
    print(f"size=7 overlap={overlap}: chunks={len(chunks)} words={indexed_words:2d} full_rule={has_rule} short_fact={has_short}")
    assert has_rule == 0
```

<!-- leetllm: output:start -->
```text title="Output" output compact
win[0]: Streaming timeout: close idle SSE connections
win[1]: SSE connections after 90 seconds without
win[2]: seconds without heartbeat frames. Batch retention:
win[3]: Batch retention: expire JSONL outputs after
win[4]: outputs after 14 days.
size=7 overlap=0: chunks=3 words=20 full_rule=0 short_fact=1
size=7 overlap=2: chunks=4 words=26 full_rule=0 short_fact=1
size=7 overlap=4: chunks=6 words=40 full_rule=0 short_fact=1
```
<!-- leetllm: output:end -->

Look at `win[4]` (`outputs after 14 days.`): a trailing fragment drops its subject (`Batch retention: expire JSONL`) so the 14-day window floats without context. Meanwhile, overlap 2 rescues the 4-word phrase `"90 seconds without heartbeat"` at the cost of 6 extra words, yet no amount of overlap can ever fit a 12-word rule inside a 7-word window.

<figure>
  <img src="illustrations/_generated/chunking_comparison_dark.png" alt="Three interval maps compare size-7 windows across overlaps 0, 2, and 4. Higher overlap duplicates more tokens across chunks, darkening the repeated coverage bands, yet a multi-word rule longer than the window never fits inside any single window." />
  <figcaption>Higher overlap multiplies indexed tokens (roughly 1 / (1 - O/N)), giving short facts a second chance across boundaries while never fitting a fact longer than the window itself.</figcaption>
</figure>

> **Key insight:** Overlap multiplies indexed tokens by roughly $1 / (1 - O/N)$ (20% overlap embeds ~25% more tokens). It rescues facts *shorter* than the window that straddled a cut; it can never capture a fact longer than the window.

Bennani and Moslonka found no measurable answer-quality gain from up to 20% overlap on Natural Questions with sentence-aware splitting and SPLADE retrieval.[^bennani2026chunking] Measure overlap on your own labeled queries before paying the storage and latency tax.

## Split on document structure first

Technical documentation, API references, and research papers already mark logical boundaries with headings, tables, paragraphs, and fenced code blocks. Use that structure before falling back to fixed windows.

For plain prose without headings, LangChain's `RecursiveCharacterTextSplitter` tries paragraph breaks (`"\n\n"`), line breaks (`"\n"`), spaces (`" "`), and characters (`""`) in sequence.[^langchain2023] Watch two defaults: it counts Python characters (`len`) unless you pass a tokenizer-backed `length_function`, and its default separators do not detect sentence boundaries.

Keep three structural rules intact when splitting technical docs:

1. **Prepend headings to body text:** Attach each Markdown heading (or heading hierarchy) to the embedded string while storing raw text and source locators separately so citations stay verbatim.
2. **Keep table headers with every row group:** Detaching `| /v1/batches | 100 MB | 24h |` from `| Endpoint | Max Payload | TTL |` strips every cell of its meaning. Repeat column headers on every split group.
3. **Never split fenced code blocks mid-function, and enforce hard size caps:** If an oversized section must be split under a hard cap (for instance, 15 words at max size 7), distribute words evenly (`5, 5, 5`) rather than merging a 1-word tail into an 8-word overflow that exceeds the embedding limit.

<!-- leetllm: test, output=show -->
```python title="structure-aware-spec-splitting.py"
import math
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SpecChunk:
    heading: str
    body: str
    indexed_text: str
    locator: str


def split_markdown_sections(markdown: str, source: str) -> list[SpecChunk]:
    chunks, heading, buf = [], "Document", []

    def flush() -> None:
        text = "\n".join(buf).strip()
        if text:
            chunks.append(SpecChunk(heading, text, f"{heading}\n{text}", f"{source}#sec={len(chunks)}"))
        buf.clear()

    for line in markdown.strip().splitlines():
        if line.startswith("## "):
            flush()
            heading = line[3:].strip()
        else:
            buf.append(line)
    flush()
    return chunks


def split_table_with_headers(lines: list[str], heading: str, max_rows: int = 2) -> list[str]:
    header, sep, rows = lines[0], lines[1], lines[2:]
    return [
        f"{heading}\n{header}\n{sep}\n" + "\n".join(rows[i:i + max_rows])
        for i in range(0, len(rows), max_rows)
    ]


def balanced_cap_split(text: str, max_words: int) -> list[tuple[str, tuple[int, int]]]:
    spans = list(re.finditer(r"\S+", text))
    count = math.ceil(len(spans) / max_words)
    base, extra = divmod(len(spans), count)
    out, cursor = [], 0
    for i in range(count):
        n = base + int(i < extra)
        s, e = spans[cursor].start(), spans[cursor + n - 1].end()
        out.append((text[s:e], (s, e)))
        cursor += n
    return out


doc = """## Streaming timeout
Close idle SSE connections after 90 seconds without heartbeat frames.
## Batch retention
Expire completed JSONL output files after 14 days."""

for ch in split_markdown_sections(doc, "inference-api-spec-v2.md"):
    print(ch.locator, "|", ch.indexed_text.replace("\n", " :: "))

table = [
    "| Endpoint | Max Payload | Timeout |",
    "| --- | --- | --- |",
    "| /v1/embeddings | 16 MB | 30s |",
    "| /v1/chat/completions | 32 MB | 90s |",
    "| /v1/batches | 100 MB | 24h |",
]
table_chunks = split_table_with_headers(table, "API Endpoint Limits", max_rows=2)
print("Table groups:", len(table_chunks), "| all carry header:", all("| Endpoint |" in g for g in table_chunks))

balanced = balanced_cap_split(
    "Close idle SSE connections after 90 seconds unless clients send periodic keepalive heartbeat frames over HTTP.",
    max_words=7,
)
print("Balanced spans:", [(len(t.split()), span) for t, span in balanced])
assert all(len(t.split()) <= 7 for t, _ in balanced)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
inference-api-spec-v2.md#sec=0 | Streaming timeout :: Close idle SSE connections after 90 seconds without heartbeat frames.
inference-api-spec-v2.md#sec=1 | Batch retention :: Expire completed JSONL output files after 14 days.
Table groups: 2 | all carry header: True
Balanced spans: [(6, (0, 35)), (5, (36, 72)), (5, (73, 110))]
```
<!-- leetllm: output:end -->

## Parent-child retrieval: search small, answer big

Often the sharpest embedding target is a single sentence, while the generator needs the entire surrounding section (including caveats and parameter tables). **Parent-child retrieval** indexes narrow child spans for matching and expands each hit to its parent section before generation.[^langchain_parent_document_retriever]

<figure>
  <img src="illustrations/_generated/parent_child_evidence_dark.png" alt="A query matches a narrow indexed child span, then follows its pointer to expand and return the complete cited parent section with its source locator." />
  <figcaption>The retriever matches a compact child excerpt, then follows its pointer to assemble the complete cited parent section for generation.</figcaption>
</figure>

Expansion introduces three serving-time invariants:
1. **Deduplicate parents** when two matched children point to the same parent section.
2. **Verify version agreement and caller permissions** on the parent itself.
3. **Reject budget overflows** (or drop lower-ranked parents) rather than silently truncating a parent mid-clause.

<!-- leetllm: test, output=show -->
```python title="parent-child-expansion.py"
parents = {
    "sec-4-2": {
        "text": "Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames. Send `: ping` every 30 seconds.",
        "source": "inference-api-spec-v2.md",
        "version": 2,
    },
}
hits = [
    {"text": "90 seconds without heartbeat frames", "parent_id": "sec-4-2", "version": 2},
    {"text": "Send `: ping` every 30 seconds", "parent_id": "sec-4-2", "version": 2},
]


def expand_parents(matches: list[dict], allowed: set[str], word_budget: int) -> list[dict]:
    selected = {}
    for m in matches:
        pid = m["parent_id"]
        if pid not in allowed:
            raise PermissionError("parent access denied")
        parent = parents[pid]
        if m["version"] != parent["version"]:
            raise ValueError("stale child-to-parent version")
        selected[pid] = parent
    if sum(len(p["text"].split()) for p in selected.values()) > word_budget:
        raise ValueError("context budget exceeded")
    return list(selected.values())


expanded = expand_parents(hits, allowed={"sec-4-2"}, word_budget=25)
print(f"child_hits={len(hits)} -> deduplicated_parents={len(expanded)}")
print("expanded:", expanded[0]["text"])

for label, args in [
    ("stale", ([{**hits[0], "version": 1}], {"sec-4-2"}, 25)),
    ("denied", (hits, set(), 25)),
    ("overflow", (hits, {"sec-4-2"}, 10)),
]:
    try:
        expand_parents(*args)
    except (ValueError, PermissionError) as err:
        print(f"{label}: {err}")
assert len(expanded) == 1
```

<!-- leetllm: output:start -->
```text title="Output" output compact
child_hits=2 -> deduplicated_parents=1
expanded: Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames. Send `: ping` every 30 seconds.
stale: stale child-to-parent version
denied: parent access denied
overflow: context budget exceeded
```
<!-- leetllm: output:end -->

## Semantic chunking and late chunking

Structure-aware splitting plus parent expansion handles most technical corpora cleanly. Reach for heavier splitters only when labeled errors reveal a specific failure:

| Observed failure | Technique | What to verify |
| --- | --- | --- |
| Long unstructured prose drifts across topics | Semantic boundary detection | Hard size cap and labeled recall vs. sentence splits |
| Short matched span misses caveats | Parent-child expansion | Deduplication, version match, and token budget |
| Pronouns depend on earlier paragraphs | Late chunking | Encoder token-state access and permission isolation |

Bennani and Moslonka observed that sentence-preserving splits matched semantic chunking up to ~5,000 tokens of retrieved context on Natural Questions.[^bennani2026chunking] Always benchmark the simpler structural baseline first.

**Semantic chunking** embeds adjacent sentences and proposes a split wherever cosine similarity drops below a tuned threshold. **Late chunking** solves cross-sentence coreference (such as a paper introducing *"Rotary Position Embeddings (RoPE)"* and later saying *"the method"*): Günther et al. run the full document through the <span data-glossary="transformer">transformer</span> encoder first, then mean-pool contextual token states inside each chunk span.[^gunther2024]

<figure>
  <img src="illustrations/_generated/late_vs_early_chunking_dark.png" alt="Side-by-side comparison of early and late chunking on an eight-word sequence split into 3, 3, and 2 tokens. Early chunking restricts self-attention to block-diagonal chunk spans, while late chunking applies full-sequence attention before pooling token states into chunk vectors." />
  <figcaption>Early chunking restricts self-attention to isolated spans. Late chunking encodes the full sequence first and pools token hidden states afterward, letting each vector absorb surrounding document context.</figcaption>
</figure>

Keep three constraints in mind for late chunking:
1. **Vectors gain context, raw text does not:** The stored chunk still reads `"the method"`, so the generator still needs parent expansion to name RoPE clearly.
2. **Encoder requirements:** You need access to token-level hidden states plus exact character-to-token offset alignment (unlike ColBERT late interaction, late chunking still stores a single pooled vector per chunk).[^gunther2024]
3. **Permission isolation:** Never encode public and restricted sections in the same transformer forward pass, because cross-token attention lets restricted text shape the public chunk's vector even if the restricted chunk is filtered out later.

## Evaluate splitters at a fixed generation budget

> **Common mistake:** Comparing chunking strategies at equal `top_k` biases results toward giant chunks because five 800-token sections supply four times more text than five 200-token chunks. Hold the **final generation token budget** fixed, and anchor ground-truth labels to stable character spans in the normalized source document rather than volatile chunk IDs.

The script below compares broken fixed windows against heading-aware sections using `TfidfVectorizer` cosine retrieval and a semantic-boundary check over technical paper sentences:

<!-- leetllm: test, output=show, deps=numpy,scikit-learn -->
```python title="evaluate-splitters-and-semantic-cuts.py"
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

query = "idle SSE connection timeout seconds heartbeat"
required_phrases = ("sse connections", "90 seconds", "heartbeat")

configs = {
    "broken_fixed": [
        "Streaming timeout: close idle SSE connections after",
        "90 seconds without heartbeat frames. Batch retention: expire JSONL outputs after 14 days.",
    ],
    "heading_aware": [
        "Streaming timeout\nClose idle SSE connections after 90 seconds without heartbeat frames.",
        "Batch retention\nExpire completed JSONL output files after 14 days.",
    ],
}

for name, chunks in configs.items():
    vec = TfidfVectorizer(stop_words="english")
    mat = vec.fit_transform(chunks)
    top_hit = chunks[int(np.argmax(cosine_similarity(vec.transform([query]), mat)[0]))]
    answerable = all(p in top_hit.lower() for p in required_phrases)
    print(f"{name:14} | answerable={answerable} | hit={top_hit.splitlines()[0]}")

# Semantic similarity drop between topic-coherent vs topic-shifted sentences
sentences = [
    "Rotary position embeddings rotate query and key pairs by token index.",
    "The rotary matrix preserves relative position inside dot-product attention.",
    "KV cache paging allocates fixed blocks to eliminate external memory fragmentation.",
]
s_vec = TfidfVectorizer(stop_words="english").fit_transform(sentences).toarray()
for i in range(len(sentences) - 1):
    sim = float(cosine_similarity(s_vec[i:i + 1], s_vec[i + 1:i + 2])[0, 0])
    action = "split" if sim < 0.15 else "keep"
    print(f"boundary {i}->{i + 1}: cosine={sim:.2f} -> {action}")

assert not all(p in configs["broken_fixed"][0].lower() for p in required_phrases)
assert all(p in configs["heading_aware"][0].lower() for p in required_phrases)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
broken_fixed   | answerable=False | hit=Streaming timeout: close idle SSE connections after
heading_aware  | answerable=True | hit=Streaming timeout
boundary 0->1: cosine=0.14 -> split
boundary 1->2: cosine=0.00 -> split
```
<!-- leetllm: output:end -->

## Production chunking checklist

| Decision | Default starting point | What to check |
| --- | --- | --- |
| **Primary splitter** | Heading- and table-aware splitting with recursive fallback | Answerable-chunk rate on labeled queries |
| **Token budget** | Measure full embedded string (heading + body + special tokens) with embedder tokenizer | Zero silent truncation |
| **Tables & code** | Repeat column headers on row splits; keep fenced blocks intact | Exact-value and API-parameter queries |
| **Overlap** | Off for complete sections; benchmark on prose fallbacks | Token inflation $1/(1 - O/N)$ vs. recall lift |
| **Metadata** | `source_id`, `locator`, `heading`, `version`, SHA-256 <span data-glossary="checksum">checksum</span> | Verbatim citations back to normalized spans |
| **Advanced splitters** | Parent expansion first; semantic/late chunking only on measured misses | Fair comparison at a fixed generation token budget |

```mastery-quiz
[
  {
    "question": "A fixed splitter processes 20 words with window size 8 and overlap 3, stopping once a window reaches the end. What are the zero-based start offsets and total indexed word occurrences?",
    "options": [
      "Starts [0, 5, 10, 15], totaling 29 words.",
      "Starts [0, 3, 6, 9, 12], totaling 40 words.",
      "Starts [0, 8, 16], totaling 20 words.",
      "Starts [0, 5, 10, 15], totaling 32 words."
    ],
    "answer": "Starts [0, 5, 10, 15], totaling 29 words.",
    "explanation": "Stride is 8 - 3 = 5. Windows cover [0:8], [5:13], [10:18], and [15:20], totaling 8 + 8 + 8 + 5 = 29 indexed words."
  },
  {
    "question": "An API spec contains a 12-word constraint. A splitter uses 9-word windows with overlaps of 0, 3, and 6. What holds for single-chunk coverage versus assembled multi-chunk context?",
    "options": [
      "No single 9-word window can hold the 12-word constraint at any overlap, though multiple retrieved windows assembled in order can cover it.",
      "Overlap 6 allows a single window to hold all 12 words.",
      "Overlap 3 fits all 12 words into one chunk without extra index growth.",
      "Even multiple assembled windows can never cover a 12-word constraint."
    ],
    "answer": "No single 9-word window can hold the 12-word constraint at any overlap, though multiple retrieved windows assembled in order can cover it.",
    "explanation": "Overlap never expands window width beyond 9 words. Coverage must still be evaluated on the final assembled context budget reaching the model."
  },
  {
    "question": "An embedding tokenizer counts 47 body tokens, 4 prepended heading tokens, and 2 special tokens, while the encoder limit is 48 tokens. What happens if you embed without resplitting?",
    "options": [
      "Total input is 53 tokens, exceeding the 48-token cap by 5 tokens and silently truncating the tail.",
      "Total input is 47 tokens, fitting safely inside the 48-token limit.",
      "Total input is 49 tokens because headings are excluded from attention.",
      "The encoder automatically expands its positional limit to 53 tokens."
    ],
    "answer": "Total input is 53 tokens, exceeding the 48-token cap by 5 tokens and silently truncating the tail.",
    "explanation": "Count body + prepended heading + special tokens (47 + 4 + 2 = 53 > 48) with the embedder's actual tokenizer so trailing conditions are never silently truncated."
  },
  {
    "question": "Two matched child chunks point to parent P (18 generator tokens), and a third points to parent Q (11 tokens). Both parents are permitted and current, and the evidence budget is 25 tokens. Under deduplicated whole-parent packing, what is the cost and decision?",
    "options": [
      "29 tokens; reject overflow (or send only top-ranked P) rather than truncating Q mid-clause.",
      "47 tokens; reject both parents.",
      "29 tokens; truncate Q to 7 tokens so both fit.",
      "18 tokens; Q is ignored automatically."
    ],
    "answer": "29 tokens; reject overflow (or send only top-ranked P) rather than truncating Q mid-clause.",
    "explanation": "Deduplicating P counts its 18 tokens once, plus 11 for Q = 29 tokens > 25. Keep whole parents intact instead of cutting mid-specification."
  },
  {
    "question": "During late chunking, a public API guide and an internal restricted architecture note are encoded in one shared transformer forward pass before mean-pooling each span. Filtering removes the restricted chunk at query time. What security flaw remains?",
    "options": [
      "Self-attention let restricted tokens influence the public chunk's pooled vector, so the public section must be re-encoded within public context alone.",
      "None, because filtering the restricted chunk text removes all influence.",
      "Only the restricted chunk's vector is affected; public vectors stay isolated.",
      "Late chunking uses independent block-diagonal attention so no cross-leakage occurs."
    ],
    "answer": "Self-attention let restricted tokens influence the public chunk's pooled vector, so the public section must be re-encoded within public context alone.",
    "explanation": "Full-sequence self-attention mixes token representations across the entire input window. Keep shared late-chunking passes strictly inside one permission boundary."
  }
]
```

> **Next:** Continue to [Embedding Similarity & Quantization](/learn/embeddings-cosine-dot-product-quantization).
<!-- leetllm: edition:reference:end -->

<!-- leetllm: edition:reader:start -->

The API specification made it out of the Markdown parser intact:

> Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames.

Then the chunking step runs, and it does something that looks harmless. One chunk ends with `Streaming timeout: close idle SSE connections after`, and the next begins with `90 seconds without heartbeat frames.` A developer asks, "Why did my idle SSE connection close, and how do I keep it alive?" The second chunk matches `seconds` and `heartbeat` cleanly and ranks first. The model receives a timeout and an exception with nothing stating which protocol or condition they belong to.

Nothing crashed. Extraction succeeded, the vector index returned a high-scoring hit, and the answer still failed because the boundary landed right across the one sentence that mattered.

Chunking decides how documents are carved into the units a retriever indexes and hands to a language model in retrieval-augmented generation (RAG).[^lewis2020] Those cuts control two jobs at once: what a query can match, and what the matched text actually tells the model. Every embedding model also enforces a hard token ceiling while compressing an entire chunk into one vector; `all-MiniLM-L6-v2`, for example, outputs 384 dimensions and truncates inputs past 256 word pieces by default.[^allMiniLM2026]

## Define answerability before choosing a chunk size

It is tempting to treat chunk size as a tuning dial and ask whether 512 tokens beats 256. Start instead with what a complete passage must hold for a real question. For our streaming-timeout question, the model needs three pieces connected: the idle SSE trigger, the 90-second limit, and the heartbeat exception.

| Text reaching the model | What is missing? |
| --- | --- |
| `Streaming timeout: close idle SSE connections after` | The 90-second limit and heartbeat exception |
| `90 seconds without heartbeat frames.` | Which connection type and trigger the rule governs |
| The complete timeout sentence | Nothing for this question |

That framing frees up your design: a short fragment can still serve as a crisp search target as long as a downstream step expands it into its full section before generation. What counts is the assembled text that reaches the model after expansion, deduplication, permission checks, and token budgeting.

## Fixed windows, and what overlap actually buys

The simplest splitter steps across text in fixed windows of size $N$ with overlap $O$, advancing by stride $N - O$. The short program below splits a 20-word API excerpt on whitespace so every cut stays visible; in production, always measure lengths with the embedding model's tokenizer (including prepended headings and special tokens).

<!-- leetllm: test, output=show, id=reader-chunking-windows -->
```python title="window-cuts-and-overlap.py"
def windows(text: str, size: int, overlap: int) -> list[str]:
    if not 0 <= overlap < size:
        raise ValueError("require size > overlap >= 0")
    words = text.split()
    out = []
    for start in range(0, len(words), size - overlap):
        end = min(start + size, len(words))
        out.append(" ".join(words[start:end]))
        if end == len(words):
            break
    return out

text = (
    "Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames. "
    "Batch retention: expire JSONL outputs after 14 days."
)
FULL_RULE = ("streaming timeout", "90 seconds", "heartbeat frames")
SHORT_FACT = ("90 seconds without heartbeat",)

for idx, chunk in enumerate(windows(text, 6, 2)):
    print(f"{idx}: {chunk}")

for ov in (0, 2, 4):
    chunks = windows(text, 7, ov)
    total_words = sum(len(c.split()) for c in chunks)
    full = sum(all(p in c.lower() for p in FULL_RULE) for c in chunks)
    short = sum(all(p in c.lower() for p in SHORT_FACT) for c in chunks)
    print(f"overlap={ov}: words={total_words:2d} full_rule={full} short_fact={short}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
0: Streaming timeout: close idle SSE connections
1: SSE connections after 90 seconds without
2: seconds without heartbeat frames. Batch retention:
3: Batch retention: expire JSONL outputs after
4: outputs after 14 days.
overlap=0: words=20 full_rule=0 short_fact=1
overlap=2: words=26 full_rule=0 short_fact=1
overlap=4: words=40 full_rule=0 short_fact=1
```
<!-- leetllm: output:end -->

Look at the bottom three lines. Ramping overlap from 0 to 4 nearly doubles indexed words from 20 to 38 while `full_rule` stays pinned at zero. A 12-word specification can never fit inside a 7-word window, no matter how far you slide it. Overlap *does* rescue the 4-word `short_fact` (`90 seconds without heartbeat`), because that phrase is shorter than the window.

<figure>
  <img src="illustrations/_generated/chunking_comparison_dark.png" alt="Interval maps compare size-7 windows at overlaps 0, 2, and 4, showing darker bands of repeated tokens as overlap rises while a rule wider than the window never fits inside any single chunk." />
  <figcaption>Higher overlap repeats tokens across adjacent windows, rescuing short facts that straddled a cut while never fitting a specification longer than the window itself.</figcaption>
</figure>

On long documents, overlap fraction $r = O / N$ multiplies embedded tokens by roughly $1 / (1 - r)$, so 20% overlap embeds ~25% more text. Bennani and Moslonka tested up to 20% overlap on Natural Questions with sentence-aware splitting and SPLADE retrieval and found no measurable answer-quality lift.[^bennani2026chunking] Measure overlap on your own queries instead of turning it on by default.

```checkpoint
You split a 10,000-token API manual into 200-token windows with 40 tokens of overlap. Roughly how many tokens do you embed, and how long can a fact be and still be sure to land unbroken in one window?
---
Overlap fraction is $40 / 200 = 0.2$, so you embed about $10{,}000 / 0.8 = 12{,}500$ tokens. Because adjacent windows overlap by 40 tokens, any fact of up to 40 tokens always lands intact inside at least one window; facts between 41 and 200 tokens depend on alignment, and anything past 200 tokens never fits.
```

## Use the structure the document already has

Technical manuals, API references, and papers already mark where each topic starts and ends. Throwing away Markdown headings and tables only to patch boundaries with overlap solves a problem you created yourself.

Keep each complete section as one retrieval unit whenever it fits the embedding limit, and prepend its heading to the embedded string while storing the raw text and locator separately for clean citations. For tables that exceed one chunk, repeat the column header row with every row group so numeric cells never lose their units or column names.

<!-- leetllm: test, output=show, deps=numpy,scikit-learn, id=reader-chunking-sections -->
```python title="reader-headed-sections.py"
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sections = [
    {"id": "sse-timeout", "heading": "Streaming timeout",
     "body": "Close idle SSE connections after 90 seconds without heartbeat frames.",
     "locator": "inference-api-spec-v2.md#sec=4.2"},
    {"id": "batch-retention", "heading": "Batch retention",
     "body": "Expire completed JSONL output files after 14 days.",
     "locator": "inference-api-spec-v2.md#sec=4.3"},
]
indexed = [f"{s['heading']}\n{s['body']}" for s in sections]

vec = TfidfVectorizer(stop_words="english")
sims = cosine_similarity(vec.fit_transform(["streaming SSE timeout heartbeat"]), vec.transform(indexed))[0]
best = sections[int(np.argmax(sims))]
print(best["id"], best["locator"])
print(f"{best['heading']} | {best['body']}")
assert best["id"] == "sse-timeout"
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sse-timeout inference-api-spec-v2.md#sec=4.2
Streaming timeout | Close idle SSE connections after 90 seconds without heartbeat frames.
```
<!-- leetllm: output:end -->

When a single section exceeds the embedding limit, fall back to a structure-aware recursive splitter (such as LangChain's `RecursiveCharacterTextSplitter`, which tries paragraph breaks, line breaks, spaces, and characters in order; always pass a tokenizer-backed length function instead of raw character `len`).[^langchain2023]

Watch three details inside oversized sections:

1. **Tables and fenced code blocks:** Splitting a single data row away from its column header strips every cell of its role. When a specification table is too tall for one chunk, repeat the column header row (and any table-wide units or footnotes) on every row group:

| Split strategy | Indexed chunk text | Preserves meaning? |
| --- | --- | --- |
| Naive row cut | `/v1/batches`, `100 MB`, `24h` (no header row) | No: `100 MB` and `24h` lose their column roles |
| Header-preserving split | `Endpoint`, `Max Payload`, `Timeout` + `/v1/batches`, `100 MB`, `24h` | Yes: every value stays tied to its column name |

Apply the same discipline to fenced code blocks in SDK guides: splitting mid-function separates parameter types and imports from the logic that uses them, so treat each fenced block as an atomic unit unless it alone exceeds the encoder cap.
2. **Short tails vs. hard caps:** Suppose you split a 15-word sentence under a hard 7-word cap. You need at least 3 chunks, so you cannot simultaneously enforce a 6-word minimum ($3 \times 6 = 18 > 15$). Resist the urge to glue a 1-word tail onto the previous chunk and silently create an 8-word overflow; instead distribute evenly (`5, 5, 5`) or flag the short chunk for parent expansion so the embedder never truncates trailing tokens.
3. **Stable evaluation spans:** Chunk IDs change every time you tweak a splitter. Anchor your labeled test sets to half-open character offsets in a specific normalized version of the source document so every splitter experiment stays directly comparable, and keep the raw verbatim span separate from any prepended search heading so citations always quote the source faithfully.

## Search small, return the full section

A short sentence often makes a sharper vector target than a whole page, yet a short sentence rarely holds all the caveats a model needs. **Parent-child retrieval** bridges the two: index compact child spans for search, then follow each match's `parent_id` to load the full parent section for generation.[^langchain_parent_document_retriever]

<figure>
  <img src="illustrations/_generated/parent_child_evidence_dark.png" alt="A query matches a short indexed child excerpt, verifies version and permissions, and expands to return the complete cited parent section." />
  <figcaption>The index searches compact child spans; a hit follows its pointer back to the full parent section for the generator and citation map.</figcaption>
</figure>

Every pointer introduces failure modes you must guard at serving time: deduplicate parents when multiple children match, confirm the child and parent share the same version, check caller permissions on the parent, and reject budget overflows instead of silently chopping off the final sentence.

<!-- leetllm: test, output=show, id=reader-chunking-parent -->
```python title="reader-parent-expand.py"
parents = {
    "sec-4-2": {
        "version": 2,
        "text": "Streaming timeout: close idle SSE connections after 90 seconds without heartbeat frames.",
    }
}

def expand(matches: list[dict], allowed: set[str], word_budget: int) -> list[dict]:
    selected = {}
    for m in matches:
        pid = m["parent"]
        if pid not in allowed:
            raise PermissionError("parent access denied")
        parent = parents[pid]
        if m["version"] != parent["version"]:
            raise ValueError("stale parent link")
        selected[pid] = parent
    if sum(len(p["text"].split()) for p in selected.values()) > word_budget:
        raise ValueError("complete context exceeds budget")
    return list(selected.values())

hits = [{"parent": "sec-4-2", "version": 2}] * 2
print("deduplicated parents:", len(expand(hits, {"sec-4-2"}, 20)))
for case in [
    ([{"parent": "sec-4-2", "version": 1}], {"sec-4-2"}, 20),
    (hits, set(), 20),
    (hits, {"sec-4-2"}, 6),
]:
    try:
        expand(*case)
    except (ValueError, PermissionError) as err:
        print(err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
deduplicated parents: 1
stale parent link
parent access denied
complete context exceeds budget
```
<!-- leetllm: output:end -->

```checkpoint
Search matches children from three API sections (300, 300, and 500 generator tokens) under a 1,000-token evidence budget. A teammate suggests truncating the third section to 400 tokens so all three fit. Why is that risky?
---
Cutting the final 100 tokens can slice off the exact caveat or exception that parent expansion was supposed to restore. Send the top two complete sections (600 tokens), log that the third was skipped due to budget, or use smaller complete subsections.
```

## Save semantic and late chunking for measured misses

Two heavier techniques come up constantly, and both target narrow failure modes. Because sentence-preserving splits matched semantic chunking up to ~5,000 tokens of context on Natural Questions,[^bennani2026chunking] ship structural splitting and parent expansion first.

- **Semantic chunking** embeds adjacent sentences and inserts a cut where cosine similarity drops sharply. It helps on long unstructured prose that drifts across topics, though poorly calibrated thresholds can sever an exception from its rule, and out-of-vocabulary sentences can produce noisy vectors that trigger false cuts.
- **Late chunking** runs a full document through the transformer encoder first and mean-pools token hidden states inside each chunk span, letting a later paragraph mentioning `"the method"` inherit context from an earlier definition of `"Rotary Position Embeddings (RoPE)"`.[^gunther2024] Remember two limits: the stored *text* still says `"the method"` (so generation still needs parent context to name RoPE explicitly), and you must never encode public and restricted text in the same forward pass, because cross-token attention lets restricted tokens bleed into the public chunk's vector even if the restricted chunk is filtered out at query time.

<figure>
  <img src="illustrations/_generated/late_vs_early_chunking_dark.png" alt="Comparison of early chunking with block-diagonal attention isolated per chunk versus late chunking with full-sequence self-attention before pooling each chunk span." />
  <figcaption>Early chunking isolates attention inside each chunk; late chunking encodes the full sequence first and pools span hidden states afterward so pronouns and references carry document context.</figcaption>
</figure>

## Fair benchmarking at a fixed token budget

Never compare two splitters at equal `top_k`: five huge sections feed far more text to the generator than five short children. Fix the **final generation token budget**, label ground truth by stable source spans, and track five numbers side by side: retrieval hit rate, assembled-context answerability, duplicate-text ratio, query latency, and index size. Include real edge cases in your regression set: conditions split from thresholds, table rows detached from headers, code snippets cut mid-function, and exceptions sitting at the end of long sections.

Start with heading- and table-aware splitting, recursive fallback inside oversized sections, and parent expansion where sections run long. Let concrete, labeled misses justify any extra complexity beyond that clean baseline.

> **Next:** Continue to [Embedding Similarity & Quantization](/learn/embeddings-cosine-dot-product-quantization).
<!-- leetllm: edition:reader:end -->
