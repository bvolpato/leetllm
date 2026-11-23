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
    "Semantic and late chunking escalation",
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

In [File Ingestion for AI](/learn/file-ingestion-pdfs-html-ocr-markdown), you already turned `incident-runbook-v3.pdf` into a located, checksummed record:

> `incident-runbook-v3.pdf`, page 7: **<span data-glossary="rollback">Rollback</span> failure: page on-call within 15 minutes with deploy ID.**

To answer from that sentence, the generator needs its condition, deadline, and required ID together in the returned context. Split it so one chunk has "Rollback failure" and another has "15 minutes with deploy ID," and a single search hit can retrieve only part of the rule.

<span data-glossary="chunking">Chunking</span> is the cut that turns those records into searchable evidence units. In a <span data-glossary="rag">retrieval-augmented generation (RAG)</span> system, a retriever selects passages from an external index and the generator answers from those passages.[^lewis2020] Your chunk boundaries decide what a retrieved passage can prove.

<figure>
  <img src="illustrations/_generated/chunking_strategies_dark.png" alt="Two size-6 windows overlap by two words: the first ends after 15, and the next reuses within 15 before completing minutes with deploy ID. A hit on the first window carries the condition and number but lacks the full deadline and ID. Both retain page=7 metadata; a heading-aware section keeps the whole rule together." />
  <figcaption>The second six-word window reuses “within 15” and adds “minutes with deploy ID.” A hit on the first carries the condition and number but lacks the unit; both windows retain the page 7 locator.</figcaption>
</figure>

## What a useful chunk must preserve

Before comparing splitters, define success in answer terms. Suppose an engineer asks, "A rollback failed after deploy `pay-742`. When do I page, and what ID do I include?"

| Candidate retrieval unit | Searchable? | Answerable? | Problem |
| --- | ---: | ---: | --- |
| `Rollback failure: page on-call within` | yes | no | deadline and required ID are missing |
| `15 minutes with deploy ID. Routine deploy notes: archive within 14 days.` | yes | no | condition is missing and a competing rule is present |
| `Rollback failure: page on-call within 15 minutes with deploy ID.` | yes | yes | preserves condition, deadline, and required ID |

For this question, a complete retrieval unit must connect the rollback condition to the deadline and required identifier.

The final context can contain one complete chunk or several complementary passages. Smaller fragments can be useful search candidates when retrieval reliably supplies their missing context through parent expansion or another explicit assembly step. Check the combined, permitted source passages under the generation budget; neither a parent pointer nor a hope that another hit will appear establishes sufficiency. The first lab deliberately evaluates one chunk at a time.

<!-- leetllm: test, output=show -->

```python title="check-answerable-chunks.py"
from dataclasses import dataclass
import numpy as np


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

A substring check is only a basic verification test, not a general answerability detector. `Rollback failure: do not page within 15 minutes with deploy ID` passes it while reversing the instruction. Review negation, exceptions, and which condition governs each value. If this chunk is the only passage the generator sees, can it cite the paging rule without guessing?

So what happens if you ignore the heading ingestion already preserved and cut the page by word count instead?

## Fixed windows sever logical units

Start with a mechanical baseline: windows of <span data-glossary="token">tokens</span>. If a window has size $N$ and overlap $O$, the next window starts after $N - O$ tokens. Overlap repeats window edge text, which can help continuity, but it can't guarantee that a complete policy rule survives.

The Python examples below tokenize on whitespace so chunk boundaries remain human-readable. A production pipeline should measure the final input with the tokenizer used by its <span data-glossary="embedding">embedding</span> model, including added headings, prompts, and special tokens. Word counts aren't embedding-token counts. Oversized inputs may be rejected or truncated, depending on the model and API. Check before encoding; don't rely on either behavior to preserve a rule.

Predict the first window before running the splitter. The two-rule sample text has 17 words. With $N = 6$, that first window reads `Rollback failure page on-call within 15`. The cut falls between the number `15` and its unit `minutes`, already breaking the paging rule.

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
            break  # Don't emit a tail already covered by this window.
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

Window 3 (`notes archive within 14 days.`) exposes a second failure: a tail can lose the condition that gives a value meaning. The loop stops once a window reaches the end, so it doesn't emit an extra, fully duplicated `days.` chunk. Removing that redundancy still doesn't make the tail sufficient evidence. Adjust the chunk size, expand to its parent before generation, or send it for review. Merging without checking length can break the size cap.

```checkpoint
Why can't the trailing `notes archive within 14 days.` window serve as sufficient evidence by itself?
---
It no longer says that the archive window belongs to routine deploy notes. It can be a search candidate if the serving path reliably returns that missing condition too. Returning only this fragment leaves the number without the context needed to cite or apply it correctly.
```

Now measure what overlap bought you. The rollback rule is ten words long; no seven-word window can contain it, however far adjacent windows overlap. Repetition may help shorter facts cross a window edge, but it can't enlarge a window.

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
  <figcaption>Overlap 0, 2, and 4 index 17, 21, and 33 words across 3, 3, and 5 chunks. Stronger coverage fills mark words that appear in more windows. The ten-word rule exceeds each seven-word window; these counts describe this test sample, not overall corpus quality.</figcaption>
</figure>

For a long document, ignoring end effects, overlap fraction $r = O/N$ multiplies window count and processed text by approximately $1/(1-r)$. A 20% overlap therefore costs about $1.25$ times as many windows. The short sample text has large end effects, so use its exact counts rather than that approximation.

> **🔬 Research insight:** Bennani and Moslonka report no measurable answer-quality gain from overlap in their Natural Questions experiments using SPLADE retrieval and Ministral-8B generation.[^bennani2026chunking] Their result is specific to that Wikipedia setup, and they tie it to sentence-aware splitting and a sparse retriever. Compare complete evidence and duplication on your own labeled runbook questions.

Ingestion already kept headings and source locations. If word windows can't reconstruct the rule, those headings give us natural structural divisions to test.

## Prefer policy structure when you have it

Overlap made more copies but never restored the rule. Use the source's own structure when it tells you which text belongs together.

LangChain's `RecursiveCharacterTextSplitter` is a generic-text baseline. It tries separators in order, defaulting to `["\n\n", "\n", " ", ""]`: paragraph breaks, line breaks, spaces, then individual characters.[^langchain2023] There's no sentence-split detector in that default list. Languages without space-separated words need different separators or a language-aware splitter.

That splitter measures size with `length_function`, which defaults to Python `len` (characters), not embedding tokens. Start with explicit heading divisions when the source provides them. Use the smaller-cut fallback only for sections that still exceed your size limit, and measure that limit with the embedding tokenizer.

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

Each chunk's `indexed_text` includes its heading, so searchable text keeps the condition attached to the deadline. This small parser handles flat `##` sections only, not arbitrary Markdown with nested headings or fenced code. Section ordinals distinguish repeated heading names within this version; they're application metadata, not native PDF anchors. In production, retain the ingestion record's raw-to-normalized offset map and page coordinates rather than rebuilding origin metadata from heading text.

Tables create the next structural challenge. Splitting a row away from its column names turns exact information into ambiguous fragments.

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

This check recognizes our test table header; it isn't an arbitrary Markdown table validator. If a table exceeds the budget, repeat its column names with each row group. Keep row spans and the table locator so a value can be traced to its original cell.

For a long section, a hard size cap must remain hard. Fifteen words cut into windows of seven give lengths `7, 7, 1`. Merging the last two produces `7, 8`, which breaks the cap. The fallback below balances those fifteen words across three children of five words each. It preserves exact substrings and half-open character offsets into the normalized section, but it doesn't promise semantic split points.

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

The heading and locator on a child record provide <span data-glossary="provenance">source tracking</span>; answerable text still needs the underlying facts. The first child now contains `Page on-call within 15 minutes` but omits `deploy ID`. Balancing repaired length without restoring evidence completeness. If the section is too short to meet `min_tail_words`, it stays under the hard cap and is flagged for review. The cap here counts body words only; the final embedding input needs a separate token-budget check. Before indexing children:

1. Prepend the section heading (and any required condition) into the string you embed, as in the `prepend-section-context` lab below, and/or
2. Treat incomplete children as search candidates only when parent expansion is mandatory on every hit.

Don't return an incomplete child as sufficient evidence merely because a heading or parent pointer exists elsewhere in storage.

The headed chunks look right on the page. Test whether the retriever selects them and whether selected text answers the question.

## Evaluate chunking with labeled questions

Once a chunk looks coherent, test whether retrieval can find it for a labeled question. A complete rule that's never selected won't help the answer.

Start with a tiny, transparent score before involving a <span data-glossary="vector">vector</span> database. For the query terms `{rollback, failure, deploy, minutes}`, the complete rollback-runbook chunk matches all four. A fragment that contains only `{rollback, failure}` may rank, but it can't answer the question.

| Chunk | Matching query terms | Contains answer? |
| --- | ---: | ---: |
| complete rollback rule | 4 / 4 | yes |
| rollback-condition fragment | 2 / 4 | no |
| routine archive rule | 1 / 4 | no |

This lexical scorer is deliberately simple. It isolates how text fragmentation impacts retrieval. Replace its score with real embeddings after the benchmark dataset and expected evidence are stable.

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

Now compare two chunking configurations using the same question and expected evidence phrase. This isolates one splitting failure; benchmark library splitters separately on representative documents. Both broken fragments tie on this scorer, which selects the first. Neither contains the complete rule, so the conclusion doesn't depend on that tie.

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

One question proves little. This three-case smoke test checks the paging rule, archive deadline, and commander instruction. Extend it with policy exceptions, tables, and boundary failures before comparing real splitters.

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

When you replace this lexical baseline with embeddings, retain the two checks: correct evidence source and sufficient returned text. These test cases can assert chunk IDs. Across splitter configurations, label stable source versions and answer-bearing spans instead, since chunk IDs and split points change. Score the final context after any parent expansion, under the same generation-token budget. Equal top-k isn't equal context when chunks have different lengths. Also measure duplicate source spans, retrieval latency, and index size.

Sometimes the right search unit is smaller than the unit a faithful answer needs. That's a different failure from broken fragmentation, and it needs a different design.

## Search small, answer with enough context

Some questions match a narrow sentence, while a faithful answer needs its surrounding section. A parent-child design indexes small children for search and stores a pointer to the larger source section returned for generation.[^langchain_parent_document_retriever]

The parent can be a section or the whole document. For this runbook, expand to the section, not the entire handbook.

<figure>
  <img src="illustrations/_generated/parent_child_evidence_dark.png" alt="Page 7 contains the complete rollback section. A split stores 15 minutes with deploy ID as an indexed child; an engineer query searches that child, and its pointer returns the full cited parent section with the page locator." />
  <figcaption>Page 7 contains the full rollback rule. The index matches a child excerpt, then follows its pointer to return the complete cited section and page locator.</figcaption>
</figure>

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
        selected[parent_id] = parent  # Two child hits need one parent copy.
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

The allowed IDs come from a serving-time authorization decision. Production links need immutable document and chunking versions, and access checks must cover the expanded parent as well as its child. This lab deduplicates parents and rejects oversized context using words for visibility. Use the generator's tokenizer for the real context budget, reserving space for instructions, question, and output. Never silently truncate the deadline to make an expansion fit. The three rejection traces exercise separate invariants: the child points to the current parent, that parent is permitted, and its complete text fits. More child hits don't satisfy any of those checks.

Child windows inside a longer section also benefit from their section label. Test contextual headers on your labeled set and compare retrieval quality before adopting them.

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

Measure the full string printed above. The heading and source label consume budget along with the body. Keep this retrieval representation separate from the original evidence span so an added label doesn't become a fabricated source quotation.

Some leftover failures aren't a size problem. A paragraph switches topic, or a local span is unclear without a name that appeared pages earlier. Those are candidates for a more expensive splitter after measuring the baseline.

## Semantic boundaries and late chunking

Structure-aware chunks handle many handbooks and policy pages. Some corpora force different choices:

| Failure after measuring baseline | Candidate experiment | What must still be checked |
| --- | --- | --- |
| one paragraph shifts between multiple topics | semantic transition detection | hard size cap and labeled-query score |
| tiny match lacks surrounding explanation | parent-child expansion | deduplication and generation budget |
| short child is ambiguous without its section | contextual header | retrieval comparison against no-header baseline |
| meaning depends on far-away document context | late chunking | model support, latency, and measured retrieval gain |

Bennani and Moslonka report that sentence-preserving splits matched semantic chunking up to roughly 5k retrieved-context tokens in their Wikipedia/Natural Questions setup.[^bennani2026chunking] That is a context budget, not a 5k-token chunk size. A headed runbook is a different document. Use the headings first, and treat semantic splits as an experiment for leftover topic shifts.

Semantic chunking proposes split points where neighboring sentence representations change sharply. The next lab uses transparent topic vectors, so you can see the split without trusting an external embedding service.

Count whole words, not substrings. Otherwise `id` matches `incident`, and the cosine stops meaning what you think.

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

The first two sentences activate the hand-written rollback/deploy axis, so cosine is 1.00. The commander sentence activates the other axis, giving cosine 0.00. This hand-written example shows threshold behavior. An unfamiliar sentence can map to `[0, 0]`; its cosine is undefined and gives no evidence of a topic change. With real embeddings, tune the threshold on labeled cases and inspect boundaries that detach exceptions or antecedents.

Late chunking is a different escalation. Günther et al. still run a chunker to get segment cues. They encode the longer text through the <span data-glossary="transformer">transformer</span> first, then mean-pool the token embeddings that fall inside each span.[^gunther2024]

The pooled ranges can stay the same while each child vector gains surrounding context. In the paper's example, the representation of "the city" gains information from the earlier name "Berlin." That doesn't insert Berlin into the returned chunk text. A generator receiving only the ambiguous sentence still needs the antecedent through explicit context or parent expansion.

The mean-pooling method needs an embedder that exposes contextual token states. Map source spans to tokenizer offsets and pool the corresponding content tokens, handling special tokens and model-specific normalization deliberately. Whole-document context is available only when the input fits the encoder and its attention pattern allows it. The paper's long-document variant uses overlapping larger windows, so context is still bounded.[^gunther2024] Compare its retrieval quality, encoding cost, and returned evidence against the baseline.

Averaging independently encoded chunk vectors isn't late chunking: those vectors were already formed without the other chunks' context. Late chunking pools token states after the shared encoder pass. It also differs from ColPali/ColBERT late interaction in the ingestion lesson: this mean-pooling method stores one vector per chunk, while late interaction retains multiple vectors for token-level matching.[^gunther2024]

The shared input introduces a security partition too. By construction, a public span encoded alongside restricted text can have a vector influenced by that restricted context. Filtering the returned chunk text leaves that dependence in the vector. Keep encoder contexts within the appropriate permission and trust scope, and retain the source/version of the context used to produce each vector. This risk follows from the encoding mechanism; evaluate extraction attacks separately on the target system.

<figure>
  <img src="illustrations/_generated/late_vs_early_chunking_dark.png" alt="Side-by-side comparison of early and late chunking on an eight-word sentence split into spans of three, three, and two words. On the left (early), attention is constrained to block-diagonal spans so pooled states h4 to h6 lack sentence context. On the right (late), full cross-attention allows pooled states h4 to h6 to carry context from the entire sentence." />
  <figcaption>Eight display words stand in for model tokens. Early encoding limits each state to its 3/3/2 span; late encoding lets each state use the whole sentence. Both methods pool rows 4–6, while late-pooled states carry document-wide context. Cells show availability, not attention weights.</figcaption>
</figure>

Those cuts answer different failures, and several of them add cost. For this runbook, which of them belong in the first index you would ship?

## A release manifest for the runbook

For this runbook, a first release can look like this:

| Design choice | Initial decision | Evidence to collect |
| --- | --- | --- |
| Default split strategy | heading-aware sections, recursive fallback | answerable-chunk rate and retrieval regression suite |
| Size budget | measure final input with the embedding tokenizer | reject or split overflow before encoding; token length ≠ word count |
| Tables | keep header plus rows together | exact-value questions preserve correct row meaning |
| Overlap | off for complete policy sections; test for fallback text | index size, duplicate hits, and labeled-query results |
| Metadata | source, locator, heading, <span data-glossary="checksum">checksum</span> | cited answer can return to original record |
| Escalation | parent expansion before semantic or late chunking | failure examples that justify extra complexity |

The manifest check below enforces required metadata and a prior review decision. It doesn't calculate answerability: `quality="ready"` must come from the evidence checks, not from the splitter declaring itself successful.

<!-- leetllm: test, output=show -->

```python title="gate-indexable-policy-chunks.py"
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

The chunk checksum detects changes to this text; it isn't the original document checksum and doesn't certify meaning. Retain the ingestion checksum and immutable source version separately. Include the splitter configuration and source span in an index manifest so re-ingestion can replace old chunks rather than mixing versions.

The section ordinals are application locators within this test suite, not clickable anchors embedded in a PDF. This gate checks metadata presence, nonempty text, and the prior quality decision. Production records must also carry the ingestion trust labels and authorization scope, with quarantined evidence blocked and permissions enforced on the final expanded context.

## Practice: test chunking limits

The manifest records a decision. These changes ask whether that decision still holds when a split point moves.

1. Change the fixed-window size to ten and overlap to zero. Predict chunk lengths and complete rollback rules before running it.
2. Run the balanced fallback on fifteen words with size seven and minimum tail six. Can every child satisfy both length rules? Which rule must win?
3. Add `No action is required.` to the semantic lab. What happens to its topic vector, and why shouldn't that alone trigger a split?
4. In the parent-expansion lab, change one child's version to two, then remove permission, then reduce the budget to ten. Each run should fail before returning context. Restore valid inputs and confirm two hits still produce one parent.

```checkpoint
Check your predictions
---
Size ten produces lengths 10 and 7, with one complete rollback rule. For fifteen words, at least three children are needed under a seven-word cap; three children of at least six words would require eighteen words. The hard cap wins and the short children need review or another representation. The unfamiliar sentence maps to a zero vector, so cosine is undefined. Parent expansion rejects stale links, denied access, and insufficient budgets instead of silently returning partial evidence.
```

```checkpoint
Both halves of the paging sentence are retrieved from the same approved source version and are provided in source order. Must the answer fail because neither half is complete alone? What changes if the first half is omitted to fit the context budget?
---
The combined context can supply the whole rule. Evaluate its sufficiency and citations together. If the condition-bearing first half is omitted, the remaining deadline and ID no longer establish when the rule applies. Counting both retrieval hits before budget selection would hide that failure.
```

A span can rank well and still fail to prove the paging rule. The repair is a structural cut, a required parent, or a semantic or late-chunking experiment you still have to measure.

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
    "explanation": "The passage gives a ten-minute deadline and asks for the job ID. In the runbook, “if that happens” could refer to a failed backup or a failed restore. To decide whether the rule applies to B873, the model needs the words that name the trigger. Search found the passage, the page reference traces it to its source, and the runbook version is current."
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
    "explanation": "Each window advances by 8 − 3 = 5 words. The first three windows hold 8 words each. Only 5 words remain at offset 15, so the total is 24 + 5 = 29. Counting 32 charges for three words past the end. Stepping by 3 uses the overlap as the stride. Stepping by 8 skips the overlap entirely."
  },
  {
    "question": "A 23-word document contains a rule that spans 12 consecutive words. Nine-word windows with overlaps of 0, 3, and 6 index 23, 32, and 53 word occurrences, respectively. The retriever can return several windows. What do these measurements establish about coverage of the rule?",
    "options": [
      "At overlap 6, one hit can contain the rule. For several hits, check their combined coverage after applying the evidence budget.",
      "At overlap 6, one hit can contain the rule. Record a coverage failure whenever each of several returned hits lacks part of the rule.",
      "At every overlap, one hit is too short. For several hits, check their combined coverage after applying the evidence budget.",
      "At every overlap, one hit is too short. Record a coverage failure whenever each of several returned hits lacks part of the rule."
    ],
    "answer": "At every overlap, one hit is too short. For several hits, check their combined coverage after applying the evidence budget.",
    "explanation": "The 12-word rule exceeds the nine-word limit by three words. An overlap of 6 stores more copies of some words and leaves that limit in place. Two hits can each lack part of the rule yet cover all 12 words together. To score coverage, inspect the permitted text that actually reaches the generator in source order."
  },
  {
    "question": "A Markdown runbook has separate Rollback failure and Routine deploy notes sections, and each complete section fits the embedding budget. The baseline must preserve each condition with its rule in a separate indexed unit, retain source attribution, and avoid parent-expansion work or duplicated text. Which representation satisfies that requirement?",
    "options": [
      "Split sentences,store headings in metadata,and expand to the parent when a child ranks highly against the question.",
      "Merge both sections into one page chunk,preserve the locator,and use reranking to distinguish the two policy conditions.",
      "Apply recursive windows across both sections,and add overlap until each deadline appears twice in the searchable index.",
      "Create one chunk per section,prepend its heading to indexed text,and retain source and locator fields for citation."
    ],
    "answer": "Create one chunk per section,prepend its heading to indexed text,and retain source and locator fields for citation.",
    "explanation": "The author-supplied headings define which condition owns each deadline. Putting the heading in searchable text preserves meaning; source and locator fields preserve the route back to evidence."
  },
  {
    "question": "A returned table row group must be self-contained in its supplied indexed text,with no later metadata or header expansion. It contains Backup failure | 10 minutes | Job ID but omits Condition | Window | Required evidence. Which correction restores its semantics under this requirement?",
    "options": [
      "Repeat the prior data row beside this row,using neighboring examples as the source of the missing column meanings.",
      "Keep the header with relevant rows,and carry the table heading and locator for retrieval context and source citation.",
      "Index cells independently,retaining column names as metadata for later generation rather than in their searchable text.",
      "Embed the row without labels,and preserve its checksum as the integrity evidence from which the column roles follow."
    ],
    "answer": "Keep the header with relevant rows,and carry the table heading and locator for retrieval context and source citation.",
    "explanation": "Without column labels, `10 minutes` and `Job ID` have no defensible roles. The header restores those roles, while heading and locator metadata support discovery and audit."
  },
  {
    "question": "A supplied embedder-tokenizer measurement gives47 body tokens,4 added heading tokens and2 special tokens. The model limit is48. Which ingestion result follows?",
    "options": [
      "49 tokens: count body and special tokens; reject the encoded input as one position over the48-token limit.",
      "47 tokens: count the body but exclude retrieval labels and special tokens; accept it within the48-token limit.",
      "53 tokens: count body,heading and special tokens; reject or split it as five positions over the48-token limit.",
      "48 tokens: clamp the measured count to the model maximum; accept its vector as representing the complete input."
    ],
    "answer": "53 tokens: count body,heading and special tokens; reject or split it as five positions over the48-token limit.",
    "explanation": "47+4+2=53. The measured final representation exceeds the supplied limit by5. Word or character counts cannot replace this tokenizer measurement,and silent truncation can remove the answer-bearing tail."
  },
  {
    "question": "A regression case for a ferry cancellation policy expects the record ID `ferry-v3` and checks for the phrase `48 hours`. Search returns `ferry-v2`. Its entire text is `Cancel ferry bookings at least 48 hours before departure.` How should the ID check and the phrase check score this hit?",
    "options": [
      "The ID check passes and the phrase check fails.",
      "Both checks pass.",
      "The ID check fails and the phrase check passes.",
      "Both checks fail."
    ],
    "answer": "The ID check fails and the phrase check passes.",
    "explanation": "The expected ID ends in v3 and the returned ID ends in v2, so the source check fails. The returned sentence contains the exact phrase `48 hours`, so the phrase check passes. A matching deadline does not verify the version, and a wrong version cannot erase a phrase in the text. The regression as a whole needs both checks to pass."
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
    "explanation": "The two hits on P share one 18-token copy. Q adds 11 tokens, so the pair costs 29, four over budget. Charging 47 counts P twice. Sending the pair because each parent fits on its own applies a separate 25-token allowance to each. The host has one allowance for the whole request."
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
    "explanation": "The first dot product is 2. The vector lengths are 2 and √2, so the cosine is 2/(2 × √2) ≈ 0.707. That falls below 0.8. A cosine of 1 would require both vectors to point in the same direction, but the second vector also has a vertical component. At the next split point the dot product is zero and the denominator is zero. That makes the cosine undefined and calls for review."
  },
  {
    "question": "A public returns policy says, “Send the package to the assigned depot.” A restricted note names the depot. An encoder reads both passages together, then averages the public sentence’s token states into one vector. A filter returns only the public sentence. The index must keep public vectors independent of restricted text. How should the system handle the vector and a public query asking which depot to use?",
    "options": [
      "Keep the stored vector after filtering. Cite the public sentence as the source of the depot name.",
      "Re-encode the sentence using public context alone. Cite the public sentence as the source of the depot name.",
      "Keep the stored vector after filtering. Require a permitted passage that names the depot.",
      "Re-encode the sentence using public context alone. Require a permitted passage that names the depot."
    ],
    "answer": "Re-encode the sentence using public context alone. Require a permitted passage that names the depot.",
    "explanation": "The restricted note could shape the public token states before pooling. Filtering the returned text leaves that calculation intact. Encoding the sentence with public context alone removes that dependency. The public sentence refers to a depot without naming it. Even after re-encoding, the system needs permitted text that identifies the depot before it can give a name."
  }
]
```

> **Next:** Continue to [LLM Benchmarks & Limitations](/learn/llm-evaluation-benchmarks-limitations) to examine what an evaluation score actually establishes. Finding the paging rule is one test; getting a model to use it correctly is another.
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
import numpy as np


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

For long documents the cost has a simple form. Ignoring end effects, an overlap fraction $r=O/N$ multiplies the text you process by about $1/(1-r)$, so a 20% overlap means about 25% more text to embed and store. One January 2026 preprint gives you reason to check whether you are getting anything for it. Bennani and Moslonka tried up to 20% overlap on Natural Questions, with chunks of 50 to 500 tokens and context budgets from 500 to 10,000 tokens, and answer quality did not measurably move.[^bennani2026chunking] Their retriever was SPLADE, a learned form of word matching that [Hybrid search](/learn/hybrid-search-dense-sparse-retrieval) covers. Their explanation depends on sentence-aware splitting and that retriever, so test overlap on your own runbooks with your own retriever instead of copying a default.

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
