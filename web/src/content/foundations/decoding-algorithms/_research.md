---
query: "We are creating a research-backed page for the following: \"Decoding Algorithms\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Turn retrieved evidence into controlled text by implementing stable softmax, sampling filters, constrained decoding, beam search, and reproducible generation audits.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 1 direct URLs; minimum is 3\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "ca069e720b2e997efe456ca9f7db8488"
status: "completed"
---

# Decoding Algorithms

**Curriculum Section:** Foundations
**Research Refresh ID:** 2026-07-15-soft-v1

This research packet provides the editorial context, technical mechanisms, and current API realities required to draft or update the "Decoding Algorithms" curriculum page.

## 1. Teaching Order & Narrative Arc

A successful lesson should move from raw model outputs to controlled, production-ready text.

1. **Logits to Probabilities:** Start at the model head. Explain how raw scores are stabilized and converted to probabilities (Stable Softmax, Temperature).
2. **Sampling Filters:** Explain how we trim the "long tail" of bad tokens to prevent gibberish (Top-K, Top-P, and the newer Min-P).
3. **Search Strategies:** Compare greedy decoding (picking the single best token) with sequence exploration (Beam Search).
4. **Constrained Decoding:** Introduce hard constraints (Regex, JSON Schema) and why they are essential for safely turning retrieved evidence into controlled structural text.
5. **Reproducibility & Audits:** Conclude with the realities of production audits, seeding, and deterministic generation limits.

## 2. Core Concepts, Mechanisms, & Equations

### Stable Softmax & Temperature

- **Stable Softmax:** The standard softmax function converts unbounded raw predictions (logits) zi​ into a probability distribution pi​. To prevent catastrophic numerical overflow (e.g., calculating e1000 in floating-point math), implementations subtract the maximum logit value from all logits before exponentiation.

pi​=∑j​e(zj​−max(z))/Te(zi​−max(z))/T​
- **Temperature (T):** Scales the logits before the softmax operation. T<1 sharpens the distribution (making the model more confident/greedy), while T>1 flattens the distribution (increasing randomness and diversity).

### Sampling Filters

To avoid sampling wildly out-of-context tokens, we apply filters to the probability distribution before picking a token.

- **Top-K:** Retains only the K highest-probability tokens. **Tradeoff:** It cuts off valid tokens if the distribution is flat (many good options) and includes bad tokens if the distribution is highly peaked (few good options).
- **Top-P (Nucleus Sampling):** Retains the smallest set of tokens whose cumulative probability exceeds P. Dynamically adjusts the candidate pool size based on the model's confidence.
- **Min-P:** Scales the cutoff threshold dynamically based on the highest-probability token (Pmax​). If a token doesn't have a probability of at least Min-P×Pmax​, it is discarded. This is highly effective at maintaining diversity while preventing structural collapse.

### Beam Search

- **Mechanism:** Instead of committing to a single token at each step, Beam Search maintains the top B ("beam width") most probable *sequence prefixes* concurrently.
- **Tradeoffs:** It requires significantly more compute (O(B×V)). While excellent for constrained tasks like translation, it famously leads to repetitive, "bland" text in open-ended generation tasks compared to sampling.

### Constrained Decoding (JSON & Regex)

- **Mechanism:** Alters the decoding process by applying a finite-state machine (FSM) or context-free grammar to the vocabulary at every step. Any token that would violate the schema (e.g., an alphabet character when a JSON integer is expected) has its logit masked to −∞.

## 3. Current Tools, APIs, & Volatile Claims (July 2026)

The landscape of API parameters has shifted dramatically. Ensure the content reflects these current realities rather than stale 2024–2025 assumptions.

- **🚨 Stale Claim Alert: "Tune temperature and top_p on all major APIs."**

- **Reality:** As of the latest Anthropic models (Claude Sonnet 5, Claude Opus 4.8), setting `temperature`, `top_p`, or `top_k` to *any* non-default value returns a **400 error**. Anthropic has deprecated these parameters entirely for their newest models, requiring developers to guide behavior via prompting and configuration instead [1].
- **Source:** `[https://platform.claude.com/docs/en/about-claude/model-deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)`
- **OpenAI Structured Outputs vs. JSON Mode:**

- **Reality:** OpenAI strongly differentiates between "JSON Mode" (which merely guarantees valid JSON syntax) and "Structured Outputs" (which guarantees adherence to a specific developer-supplied schema). Structured Outputs leverages `response_format: { type: "json_schema", json_schema: { strict: true } }` to force constrained decoding at the API level [2].
- **Source:** `[https://developers.openai.com/api/docs/guides/structured-outputs](https://developers.openai.com/api/docs/guides/structured-outputs)`
- **Hugging Face Native `min_p` Support:**

- **Reality:** `min_p` is no longer a fringe technique requiring custom logits processors; it is a first-class parameter natively supported in the Hugging Face `transformers` GenerationConfig alongside `top_p` and `temperature` [3].
- **Source:** `[https://huggingface.co/docs/transformers/main_classes/text_generation](https://huggingface.co/docs/transformers/main_classes/text_generation)`

## 4. Labs, Practice Ideas, & Common Mistakes

### Worked Example / Lab Idea

- **The Sampling Matrix:** Have students use an open-weights model via Hugging Face or vLLM to generate text at a high temperature (e.g., T=1.5) using different filters. Compare `top_k=50`, `top_p=0.9`, and `min_p=0.1`. Students should observe that `min_p` prevents the text from devolving into complete gibberish at high temperatures far better than Top-P does. *(Note: explicitly tell students not to use Anthropic API for this lab due to their recent parameter deprecations).*

### Common Mistakes & Misconceptions

- **Misconception:** *"Strict schema decoding guarantees correct data."*

- **Correction:** Constrained decoding only enforces *syntax* (schema adherence), not *semantics* (factual accuracy). The model can still smoothly hallucinate perfectly typed, completely fabricated data.
- **Misconception:** *"Setting seed = 42 guarantees 100% reproducible text."*

- **Correction:** While seeding helps, exact match reproducibility in LLMs is notoriously difficult due to GPU floating-point non-determinism in parallel reductions, dynamic batching, and mixture-of-experts (MoE) routing. For true generation audits, logging the exact input context, software versions, and hardware targets is required alongside the seed.
- **Mistake:** Stacking conflicting parameters. Combining `top_k`, `top_p`, and `min_p` in a single API call often leads to unpredictable truncation. Students should learn to use Temperature + ONE filter method.
