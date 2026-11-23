---
query: "We are creating a research-backed page for the following: \"Pre-training Data at Scale\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: training\nCurrent page scope: Understand how web-scale pre-training data is extracted, filtered, deduplicated, mixed, tokenized, and packed into training-ready shards, including decontamination, late-stage annealing, and synthetic-data tradeoffs.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 2 opaque source annotation(s) without direct URLs\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "21e28dd04006c4eefb2f89e7df9e1c29"
status: "completed"
---

Manually corrected September 22, 2026. Data curation changes what a model practices and how reproducibly it trains. Data, architecture, optimization, and evaluation interact; the earlier packet overstated several causal claims. The historical query and generation metadata above are preserved.

## Pedagogical Sequence & Prerequisites

Start with token inventory and source coverage, then make each processing decision inspectable. Memorization, distribution loss, and evaluation leakage are risks to measure. Cross-document attention is an objective choice, not an established universal cause of hallucinations.

### Recommended Prerequisites

- **Transformer Mechanics:** Basic understanding of token embeddings, self-attention complexity, and context window limits.
- **Distributed Systems:** Familiarity with MapReduce paradigms, shard management, and out-of-core processing (e.g., Apache Spark or Ray).
- **Basic Probability:** Understanding hash functions and set intersection metrics.

### Narrative Teaching Order

1. **The Raw Crawl Problem:** What Common Crawl actually looks like (HTML boilerplate, tracking scripts, machine-generated SEO spam, and duplicated text).
2. **The Stage-by-Stage Filtering Pipeline:** Moving sequentially from extraction to heuristic cleaning, model-based filtering, and fuzzy deduplication.
3. **Benchmark Decontamination:** Preventing data leakage before tokenization occurs.
4. **Tokenization & Packing:** Define separator, attention, padding, and label-shifting contracts, then test them.
5. **Advanced Training Dynamics:** Curriculum mixing, late-stage annealing, and the mathematical trade-offs of synthetic data.

## Stage-by-Stage Pipeline: Core Mechanics & Trade-offs

### 1. Extraction and Heuristic Filtering

WARC stores archived responses, including HTML that an extractor can parse. Extraction choices can lose reading order, equations, or code structure; preserving those features requires source-specific inspection.

- **HTML Parsing:** FineWeb and DCLM compared WET extraction with WARC-based tools. Better measured model results don't guarantee preservation of every table or code block. Check their controlled comparisons: https://arxiv.org/html/2406.17557 and https://arxiv.org/html/2406.11794.
- **Heuristic (Rule-Based) Filtering:** Before deploying expensive ML classifiers, datasets undergo fast statistical pruning:

- **Source-specific gates:** Measure length and symbol ratios under a declared policy. Don't treat punctuation or uppercase letters alone as evidence that technical text is bad.
- **Repetition controls:** Limit repeated training exposure; don't claim that a filter guarantees the absence of repetition at inference. Gopher's actual prose gates include separate symbol ratios, stopwords, line/paragraph duplication, and character-based n-gram rules: https://arxiv.org/html/2112.11446.
- **Language identification:** CCNet uses fastText to identify languages. Low confidence can also reflect code or legitimate mixed-language text; audit routing and rejection separately: https://arxiv.org/html/1911.00359.

### 2. Model-Based Quality Filtering

Classifiers predict their labels, not an objective universal quality measure. Evaluate retained source coverage and controlled downstream training, alongside score and token yield.

- **Reference-Based Classifiers:** A classifier can distinguish selected reference material from other web pages. The selected positives encode a preference, not a truth label; DCLM's actual positives and controlled evaluations are documented at https://arxiv.org/html/2406.11794.
- **DCLM selection:** fastText positives combined OpenHermes 2.5 and highly rated ELI5 answers. The top-10% cutoff is one stage in a larger recipe, not a 10% token-yield promise: https://arxiv.org/html/2406.11794.
- **Educational scoring:** FineWeb's paper reports 460k annotations on a 0–5 scale, split into 410k training and 50k validation records. The dataset card checked September 22, 2026 instead describes scoring 500k samples. Don't invent an explanation for the difference or silently conflate the artifacts. Neither count makes the educational score a factuality certificate: https://arxiv.org/html/2406.17557 and https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu.
- **Perplexity:** CCNet's language-specific Wikipedia models split data into head/middle/tail tiers. Low perplexity indicates reference-domain similarity; the pipeline doesn't universally drop both extremes: https://arxiv.org/html/1911.00359.

### 3. Deduplication (Exact and Fuzzy)

Lee et al. reported less emitted memorized text and fewer steps for similar or better accuracy in their experiments. That doesn't guarantee privacy, remove all memorization, or establish the earlier double-descent claim: https://arxiv.org/html/2107.06499.

- **Exact deduplication:** Hashing takes time proportional to input bytes; expected constant-cost lookup doesn't make the whole operation O(1). Compare grouped strings if actual equality is required. Bloom filters have false positives and aren't exact equality checks.
- **Fuzzy Deduplication (MinHash + LSH):** To catch near-duplicates (e.g., a news article republished with different ads or timestamps):

1. Convert normalized text to contiguous word-shingle sets. FineWeb used 5-grams; the lesson's English-only toy uses bigrams. Benchmark 13-gram checks are a separate policy.
2. Estimate Jaccard similarity between two sets A and B:

J(A,B) = |A ∩ B| / |A ∪ B| for nonempty sets.
3. Use **MinHash** to approximate Jaccard similarity by generating signatures via independent hash functions.
4. LSH proposes pairs probabilistically. Under independent ideal rows, candidate probability is 1 - (1 - s^r)^b. Crowded buckets can still require quadratic comparisons. FineWeb used 112 hashes and 14 bands of eight rows, then clustered collisions without exact Jaccard verification. The lesson deliberately adds verification: https://arxiv.org/html/2406.17557.

Connected components needn't be all-similar clusters. The authored A={1,2,3,4}, B={1,2,3,4,5,6}, C={3,4,5,6} fixture has A-B=B-C=2/3 and A-C=1/3. At threshold 0.6, keeping only A removes C despite their low direct overlap.

### 4. Decontamination

Question/answer exposure can inflate evaluation scores, but overlap isn't proof that every answer was memorized. Check pinned splits and distinguish source passages from benchmark question-answer pairs.

- **Literal matching:** GPT-3's initial filter used 13-grams; its later overlap analysis used task-dependent lengths capped at 13. Removal had a bug, and common-phrase controls addressed false positives: https://arxiv.org/html/2005.14165.
- **Code and semantic candidates:** Token or AST rules and embeddings can add candidates, but don't guarantee complete detection or semantic equivalence. The executable lesson screen is lexical, not an AST parser. Its marker is invented; marker presence can indicate lineage, and absence doesn't prove cleanliness.

### 5. Tokenization and Shard Packing

Once text is clean, it must be transformed into efficient integer matrices for GPU ingestion.

- **Tokenizer distinctions:** The lesson's toy is character-level, within-word BPE. Unigram prunes pieces, not merges; SentencePiece supports both BPE and Unigram. Gemma uses BPE. Vocabulary size alone doesn't guarantee compression: https://huggingface.co/docs/transformers/main/tokenizer_summary and https://github.com/google/sentencepiece.
- **Pre-tokenization:** A regex defines merge regions and may attach leading spaces; punctuation and whitespace aren't universally separate pieces: https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py.
- **Packing:** Best-fit decreasing doesn't guarantee no padding or 90% utilization. Three length-6 records in capacity-10 blocks reach only 60%. Include separators in length accounting and define splitting and streaming-buffer policies.
- **Objective choice:** Gopher concatenated documents with boundary markers. Independent-document objectives require attention isolation and boundary-loss handling; markers and position resets don't remove attention edges: https://arxiv.org/html/2112.11446. Already-shifted targets and internally shifted labels place ignore values at different positions.
- **Restarts:** A manifest hash alone doesn't verify referenced shard bytes. Training, optimizer, random-generator, and consumed-data state must agree at a completed step; prefetched records aren't necessarily consumed.

## Advanced Training Dynamics: Mixing, Annealing & Synthetic Data

### Curriculum Mixing

Pre-training does not consume shards uniformly. Data engineers define domain weights that govern the sampling probability of each dataset during training.

- **Domain weighting:** Code and mathematics can receive larger sampling weights than their share of the retained inventory. Check the mixture and ablation results instead of assuming every increase improves reasoning: https://arxiv.org/html/2407.21783.
- **Dynamic Schedules:** Sampling distributions can shift over the course of training, moving from broad web diversity early on to dense, analytical reasoning datasets later.

### Late-Stage Annealing

Llama 3 reports linear cooldown over its final 40M tokens, high-quality source upsampling, and checkpoint averaging. It doesn't prescribe a universal 1–5% interval or wholesale replacement of web text. Separate final training from annealing probes: https://arxiv.org/html/2407.21783.

Repeated exposure also has no universal safe epoch count by domain. Data-constrained experiments found up to four passes similar to unique-data training in their tested setting, then diminishing returns: https://arxiv.org/abs/2305.16264.

### Synthetic Data Trade-offs

Generated data can supplement a training inventory. Its usefulness depends on the tasks, validation, and feedback regime.

- **Benefits and limits:** Generation can target tasks and format, but answers, structure, privacy, provenance, and licenses still need checks. Phi-1 mixed filtered real code with synthetic textbooks/exercises; it wasn't a synthetic-only demonstration of universal model superiority: https://arxiv.org/abs/2306.11644.
- **Recursive learning:** Collapse results concern studied feedback regimes and distribution tails, not every use of synthetic text. Accumulating initial and generated data avoided collapse in tested language models and had bounded error in a linear framework; don't generalize to every architecture: https://www.nature.com/articles/s41586-024-07566-y and https://arxiv.org/html/2404.01413.

## Open-Source Tooling, Datasets & Primary Sources

Use dated releases and specific processing decisions rather than calling every public corpus an open standard:

| Tool / Dataset | Primary Focus | Direct Primary Source URL |
| --- | --- | --- |
| FineWeb / FineWeb-Edu | Historical 15T/1.3T corpora and controlled processing comparisons | https://arxiv.org/html/2406.17557 |
| Dolma | Documented 3T English mixture and curation toolkit; ACL 2024 | https://aclanthology.org/2024.acl-long.840/ |
| FineWeb2 | June 2025 multilingual adaptation and duplication-informed upsampling | https://arxiv.org/html/2506.20920 |
| Nemotron-CC | Original 4.4T web + 1.9T synthetic corpus; subset-specific controlled results | https://arxiv.org/html/2412.02595 |
| Nemotron-CC-v2.1 | December 2025 addition with organic, translated, and synthetic categories; terms apply | https://huggingface.co/datasets/nvidia/Nemotron-CC-v2.1 |

## Common Misconceptions & Failure Modes

Include a dedicated section addressing these frequent reader traps:

- **Misconception: "More data is always better."**

- *Correction:* Selection and volume interact. Don't assert an unsupported universal 1T-versus-5T winner; compare compute, domains, exposure, and task quality under a controlled recipe.
- **Misconception: "Deduplication is only about reducing dataset storage size."**

- *Correction:* Storage, repeated exposure, memorization, and train-test overlap can all matter. Deduplication doesn't guarantee privacy or that every retained record adds novel knowledge.
- **Failure Mode: Silent Evaluation Leakage.**

- *Symptom:* A model achieves state-of-the-art benchmark numbers during internal testing but fails on novel, real-world prompts.
- *Possible cause:* Evaluation material survived literal checks. Alternative explanations include distribution mismatch or flawed evaluation design; audit before assigning causality.
- **Failure Mode: Incorrect Packing Contracts.**

- *Symptom:* Attention edges or next-token targets disagree with the intended objective.
- *Check:* Inspect separators, causal order, document isolation when required, and single label shifting. Topic drift alone doesn't establish a packing cause.

Keep authored examples separate from measured corpus results. The revised lesson includes a probabilistic LSH gate, a similarity-chain counterexample, a lexical false positive, a 60% packing case, and two equivalent single-shift label layouts.
