---
query: "Context Engineering: Beyond Prompting"
model: "Pro"
task_id: "98f007c5d24bb5ab07fa7a9b092d3862"
status: "completed"
---

Reviewed November 15, 2026 against primary sources. This research packet summarizes architectural mechanisms, benchmarks, and citations for the article on context engineering.

## 1. Core Mechanisms

- **Context engineering vs. prompt engineering:** Prompt engineering adjusts instructions and few-shot formatting inside one request, whereas context engineering manages the full working token budget across system instructions, tool schemas, retrieved documents, compacted state, and output headroom ([Anthropic Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).
- **Four lifecycle actions:** Write external state, select evidence just in time via hybrid lexical/semantic retrieval plus reranking, compress history without losing file paths or failing assertions, and isolate sub-tasks or untrusted retrieved text.
- **Prefix caching:** Exact leading-token matches allow inference servers to reuse KV tensors across turns; keeping static instructions and sorted tool schemas at byte zero preserves cache hits ([OpenAI Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)).

## 2. Long-Context Behavior and Position Effects

- **Lost in the Middle:** Multi-document QA and key-value retrieval experiments show a U-shaped accuracy curve where information near the start or end is recovered more reliably than facts placed in the middle ([Liu et al., TACL 2024](https://aclanthology.org/2024.tacl-1.9/)).
- **Context rot:** Performance degrades as irrelevant distractors accumulate across long contexts even when facts technically fit within advertised limits ([Hong et al., Chroma Context Rot](https://research.trychroma.com/context-rot)).

## 3. Security, Permissions, and Evaluation

- **Query-time access filtering:** Apply tenant and repository ACLs inside retrieval queries and re-verify permissions at fetch time before material enters prompt context.
- **Indirect prompt injection:** External documents, web pages, and issue comments can carry hostile instructions; separate untrusted evidence in formatting and enforce tool permissions in application code ([Greshake et al., 2023](https://arxiv.org/abs/2302.12173)).
- **Evaluation separation:** Measure context precision, context recall, and faithfulness separately from final answer accuracy and deterministic tool-safety assertions ([Es et al., RAGAS 2023](https://arxiv.org/abs/2309.15217)).
