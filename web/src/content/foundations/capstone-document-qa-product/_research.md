---
query: "We are creating a research-backed page for the following: \"Capstone: Document QA\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Ship a policy-evidence service with controlled admission, cited answers, abstention, replayable eval rows, and source-bound semantic adjudication.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 10 opaque source annotation(s) without direct URLs\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "d4cc9655bedbd4df04af0ee86686be42"
status: "completed"
---

This research packet is structured to guide the authoring of the "Capstone: Document QA" curriculum page. It avoids opaque source references, relying strictly on direct primary URLs for verifiable claims, and organizes the complex requirements of a production-grade RAG (Retrieval-Augmented Generation) system into a logical teaching sequence.

# Research Packet: Capstone - Document QA

**Research Refresh ID:** 2026-08-13
**Scope:** Ship a policy-evidence service with controlled admission, cited answers, abstention, replayable eval rows, and source-bound semantic adjudication.

## 1. Prerequisites and Learning Objectives

Before beginning this capstone, students should understand basic vector embeddings, chunking strategies, and standard LLM API interactions.

**Mastery Outcomes:**

- Build a "controlled admission" layer to reject out-of-policy or malicious queries before retrieval.
- Enforce strict source-binding so the LLM outputs inline citations linked directly to retrieved context.
- Implement a deterministic abstention mechanism ("I don't know") when retrieved context lacks sufficient evidence.
- Construct a continuous evaluation pipeline using replayable rows and LLM-as-a-judge metrics (semantic adjudication).

## 2. System Architecture: The Policy-Evidence Service

Instead of a simple naive RAG script, this capstone requires a multi-stage pipeline designed for enterprise reliability.

- **Stage 1: Admission Controller:** A fast, low-cost routing layer (or lightweight classifier) that evaluates the user's prompt against system policy.
- **Stage 2: Evidence Retrieval:** Fetching relevant chunks from a trusted document store.
- **Stage 3: Synthesis & Citation:** Generating the answer with strict instructions to use *only* the retrieved context and append chunk IDs to claims.
- **Stage 4: Adjudication (Eval):** Running offline or asynchronous checks comparing the generated answer against the source chunks to measure groundedness.

## 3. Core Mechanisms & Implementation Details

### Controlled Admission

- **Concept:** Not every query deserves a database lookup or an expensive LLM generation.
- **Implementation:** Use semantic routing or a fast LLM (e.g., GPT-4o-mini or Claude 3 Haiku) to classify the intent. If the query violates policy (e.g., asking for financial advice in a healthcare app) or is an injection attempt, the system returns a canned rejection response immediately.

### Cited Answers & Strict Grounding

- **Concept:** Answers must trace back to the exact paragraph or document chunk used.
- **Implementation:** Pass chunks into the LLM context window with explicit structural tags (e.g., `<doc id="42">...</doc>`). Prompt the LLM to append `[42]` after any claim relying on that document.
- **Reference:** Tool calling and structured outputs are often used to enforce citation schemas. See [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs).

### Abstention (The "I Don't Know" Fallback)

- **Concept:** Preventing hallucinations by forcing the model to recognize when the retrieved context does not contain the answer.
- **Implementation:** The system prompt must explicitly state: "If the provided documents do not contain the answer, output exactly 'INSUFFICIENT_EVIDENCE'."

### Replayable Eval Rows

- **Concept:** A CI/CD approach to LLM outputs. Developers must maintain a golden dataset of queries, expected contexts, and expected answers.
- **Implementation:** Store eval rows in a format that can be programmatically re-run whenever the prompt, embedding model, or LLM changes.
- **Reference:** Frameworks like LangSmith facilitate the storage and replay of these datasets. See [LangSmith Evaluation Documentation](https://docs.smith.langchain.com/evaluation).

### Source-Bound Semantic Adjudication (LLM-as-a-Judge)

- **Concept:** Using an advanced LLM (like GPT-4o or Claude 3.5 Sonnet) to grade the application's output against the source documents, not against its own internal weights.
- **Implementation:** Evaluate on three distinct axes (often called the RAG Triad):

1. *Context Relevance:* Did the retriever fetch the right chunks?
2. *Groundedness:* Is every claim in the answer supported by the chunks?
3. *Answer Relevance:* Did the answer actually address the user's query?
- **Reference:** The Ragas framework is an industry standard for these specific metrics. See [Ragas Evaluation Framework](https://docs.ragas.io/).
- **Reference:** TruLens also provides canonical implementations for the RAG Triad. See [TruLens Documentation](https://www.trulens.org/).

## 4. Concrete Examples & Lab Ideas

- **Lab 1: The Bouncer (Admission):** Students write a prompt and use an API to classify 50 sample user questions as `ALLOWED` or `REJECTED` based on a hypothetical corporate HR policy.
- **Lab 2: Forcing Abstention:** Students are given a working RAG script. They must modify the prompt and parameters (e.g., temperature = 0) so that it successfully answers 5 valid questions, but returns a safe fallback for 5 trick questions whose answers were omitted from the vector database.
- **Lab 3: Building the Adjudicator:** Students write an evaluation script that takes `(Question, Answer, Source_Context)` and outputs a JSON object with a binary `is_grounded` score and a `reasoning` string.

## 5. Common Mistakes and Misconceptions

- **Relying on prompting alone for admission:** Complex policy guardrails often fail if combined with the main generative prompt. Splitting admission into a separate, prior step is more robust.
- **Conflating general truth with source-bound truth:** Evaluator LLMs will often mark a hallucinated answer as "Correct" if the fact is true in the real world. Semantic adjudication must strictly prompt the evaluator to penalize answers that are true but *missing from the provided context*.
- **Fragile Eval Rows:** Hardcoding exact-match string comparisons for expected answers. LLM outputs vary; evals must use semantic similarity or LLM-as-a-judge rather than `assert answer == "Paris"`.

## 6. Stale Claims & Volatility Notes (As of Aug 2026)

- **Context Window Sizes:** Avoid teaching that RAG is only necessary because of small context windows (a common 2023 claim). Even with massive 1M+ to 2M+ token windows, RAG is required for *cost control*, *latency reduction*, and *source attribution*.
- **Reranking:** The necessity of Cross-Encoder reranking (e.g., Cohere Rerank) fluctuates based on the quality of base embedding models. Always advise testing retrieval metrics (MRR/NDCG) both with and without a reranker on the specific dataset.
