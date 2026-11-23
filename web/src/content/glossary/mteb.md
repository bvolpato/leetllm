---
title: MTEB
aliases: ["Massive Text Embedding Benchmark"]
importance: 84
---
**MTEB** (Massive Text Embedding Benchmark) is a multi-task evaluation suite and [eval harness](glossary://eval-harness) for text [embedding](glossary://embedding) models. It scores each encoder across task families that consume fixed-size vectors: retrieval, clustering, classification, reranking, bitext mining, pair classification, semantic textual similarity (STS), and summarization. Muennighoff, Tazi, Magne, and Reimers introduced it (arXiv 2022; EACL 2023) with **8 task types**, **58 datasets**, and coverage of **112 languages**. The public Hugging Face leaderboard and the open-source `mteb` package made it the default shortlist signal when engineers pick embedding models for [RAG](glossary://rag), search, and semantic tooling.

The central finding of the original paper still drives how you should read scores: **no single method dominates every task**. A model that tops STS can lag on clustering or BEIR-style retrieval. An aggregate "MTEB average" summarizes a portfolio of tasks. Check the relevant task scores, then evaluate your queries, chunk lengths, languages, and hard negatives.

## Intuition

Before MTEB, embedding papers often reported only SemEval-style STS, a small classification suite, or a single IR collection. That is like judging a search engine only on paraphrase pairs: useful geometry for "are these two sentences similar?" is not the same geometry for "find the right policy chunk among 2M documents." STS and real retrieval correlate poorly in several studies the paper cites; MTEB makes that mismatch visible by putting both (and more) under one API.

Think of MTEB as a **shared test battery**:

1. In the original text-embedding recipes, the model is a function $f$ that maps a string to a vector $e \in \mathbb{R}^{d}$.
2. Each task type freezes a standard evaluation recipe on top of those vectors (logistic regression, k-means, cosine ranking, and so on).
3. The leaderboard reports per-task, per-category, and average scores so you can filter by the use case you care about.

The suite also unifies datasets that BEIR (Thakur et al., 2021) standardized for zero-shot IR with SemEval STS and many classification/clustering sets, so you do not reimplement eight pipelines to compare two encoders.

## How it works

**Contract.** The original text-embedding recipes consume same-shaped vectors from sentence-transformers, API embedding endpoints, decoder bi-encoders, or custom towers through the package's model interface. The harness does not retrain the encoder; it consumes frozen embeddings (except where a probe head is part of the *task* recipe, as in classification). The current package also evaluates multimodal embeddings and retrieval systems; some tasks require additional interfaces, such as pair scoring for a cross-encoder.

**Original eight task families** (primary metric in parentheses; Muennighoff et al. §3.2):

| Family | Setup | Main metric |
| --- | --- | --- |
| **Bitext mining** | Two sentence pools (often translations); nearest neighbor by cosine | F1 |
| **Classification** | Embed train/test; train logistic regression on train embeddings | Accuracy |
| **Clustering** | Mini-batch k-means on embeddings ($k$ = number of gold labels) | V-measure |
| **Pair classification** | Embed both texts; score pair with cosine (and other distances) | Average precision |
| **Reranking** | Query + candidate list; rank candidates by cosine to query | MAP (also MRR@k) |
| **Retrieval** | Query + corpus; rank all docs by cosine (BEIR-style) | **nDCG@10** |
| **STS** | Sentence pairs with continuous similarity labels | Spearman (cosine) |
| **Summarization** | Machine vs human summaries via embedding distances | Spearman (cosine) |

Retrieval reuses BEIR datasets and ranking metrics. After ranking corpus documents for a query by cosine similarity, the harness reports nDCG@k, MRR@k, MAP@k, precision@k, and recall@k; **nDCG@10** is the headline retrieval number on the leaderboard. STS and summarization compare embedding similarities to human labels with Spearman rank correlation (cosine is the default similarity).

**Aggregation.** The original English table averages each dataset's main metric; its overall average weights categories by their number of datasets. Averaging category means equally gives a different result. Record the benchmark version and aggregation method shown by the board you use. Treat the overall number as a rough multi-objective summary. For product work, open the **Retrieval** (and language) tabs first.

**Length settings.** Datasets mix sentence-to-sentence (S2S), paragraph-to-paragraph (P2P), and sentence-to-paragraph (S2P) setups. The benchmark does not enforce a global max length; models truncate according to their own context window, which is one reason long-doc performance can diverge from short STS scores.

## Formula

**Retrieval (headline).** For each query, documents are ordered by cosine similarity between query and document embeddings. With graded relevance $rel_i$ at rank $i$, discounted cumulative gain at cutoff $p$ is

$$
\mathrm{DCG}_p = \sum_{i=1}^{p} \frac{rel_i}{\log_2(i+1)}, \qquad
\mathrm{nDCG}_p = \frac{\mathrm{DCG}_p}{\mathrm{IDCG}_p}
$$

MTEB reports **nDCG@10** ($p=10$) as the main retrieval metric, macro-averaged over queries. See [NDCG](glossary://ndcg).

**STS (headline).** For each pair $(x,y)$, the model score is usually

$$
s(x,y) = \cos\!\big(f(x), f(y)\big)
$$

The dataset supplies human labels $\ell$. The task score is the **Spearman rank correlation** between the list of $s$ and the list of $\ell$ (higher is better). Cosine is the primary similarity; Pearson is often reported as a secondary number.

**Classification probe.** Embeddings $X_{\mathrm{train}} = f(T_{\mathrm{train}})$ fit a logistic regression with a fixed iteration budget (paper default: 100 max iterations); accuracy on $f(T_{\mathrm{test}})$ is the main metric. The probe is intentionally weak and standardized so the score reflects the frozen representation, not a heavy fine-tune.

## Example

You are choosing an embedding model for support RAG over 800k policy and ticket chunks (mostly English, some Spanish, average chunk ~400 tokens).

1. **Shortlist with task-specific MTEB results.** On the Hugging Face [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard), filter **English → Retrieval** (nDCG@10). Prefer models strong on retrieval over ones that only lead the overall average because of classification or STS.
2. **Run a slice yourself** so dimensions and truncation match production:

```python
import mteb

model = mteb.get_model("sentence-transformers/all-MiniLM-L6-v2")
tasks = mteb.get_tasks(tasks=["NFCorpus", "FiQA2018"])  # BEIR-style retrieval tasks
results = mteb.evaluate(model, tasks=tasks)
```

3. **Check the domain gap.** Model A might lead public nDCG@10 yet have lower [Recall@k](glossary://recall-at-k) on your held-out tickets because your queries are jargon-heavy, chunks are longer than BEIR passages, or Spanish tickets are outside the model's strengths.
4. **Ship checklist after the shortlist:** re-embed a golden query set with *your* chunker; measure nDCG@10 / Recall@50 on that set; record embedding dimension, max sequence length, tokens/sec at batch size, index RAM, license, and whether instruction prefixes are required.

The original English table makes the distinction concrete: MiniLM-L6 scored 56.26 overall, GTR-XXL 58.97, and ST5-XXL 59.51. Yet GTR-XXL's retrieval score was 48.48 versus ST5-XXL's 42.24, while ST5-XXL led those two on STS (82.63 versus 78.38). In that historical comparison, GTR-XXL had better retrieval despite ST5-XXL's higher overall average. Consult the current board for current rankings.

## MMTEB and leaderboard variants

The community later expanded the suite under **MMTEB** (Massive Multilingual Text Embedding Benchmark; Enevoldsen et al., arXiv 2025): **500+** quality-controlled tasks across **250+** languages, plus harder settings such as instruction following, long-document retrieval, and code retrieval. From that collection the project builds named benchmarks you will see on the leaderboard and in `mteb.get_benchmark(...)`:

- **MTEB(eng, v1):** original English-heavy suite people still cite casually as "MTEB."
- **MTEB(eng, v2):** reduced inter-task correlation and evaluation cost, with updated task versions and an emphasis on tasks not commonly used for fine-tuning. The v1 MS MARCO and Natural Questions tasks are absent; that reduces familiar training-set overlap but does not prove a model is contamination-free.
- **MTEB(Multilingual)**, **MTEB(Europe)**, **MTEB(Indic):** language-scoped aggregates; also language packs (French, Chinese, Polish, Scandinavian, and others) and domain packs (code, long embed).

MMTEB also reduced evaluation cost through smaller retrieval corpora with hard negatives and revised clustering evaluations. Actual runtime depends on the model, tasks, hardware, batching, and cache state. Always name **which benchmark version** you cite; "top of MTEB" without `(eng, v2)` vs multilingual vs retrieval-only is not a reproducible claim.

## What fails in production

| Failure mode | What happens | Mitigation |
| --- | --- | --- |
| **Task mismatch** | You optimize overall average; product needs retrieval. STS winner under-retrieves. | Filter leaderboard by Retrieval (and your language). |
| **Domain / length mismatch** | BEIR news/wiki nDCG looks great; 2k-token policies and ticket IDs do not. | Golden set with *your* chunking and hard negatives. |
| **Train-eval leakage** | Model fine-tuned on MS MARCO / NQ inflated old English retrieval tabs. | Prefer zero-shot suites (eng v2); hold out private queries. |
| **Language skew** | English top-10 model collapses on your secondary language. | Check MTEB(Multilingual) / language tabs; eval bilingual queries. |
| **Cost and dimension tax** | Moving from 512 to 1024 dimensions doubles raw vector storage at the same count and precision; total index RAM and latency also depend on the index. | Measure bytes, QPS, and [Matryoshka](glossary://matryoshka-representation-learning) truncation. |
| **Instruction / prefix drift** | Instruct models need task prompts; you ship bare strings. | Pin the same prefixes used in the paper/model card at index and query time. |
| **Metric worship** | nDCG@10 up, user "wrong doc" rate unchanged. | Pair offline MTEB-style metrics with online or task success. |

The original embedding recipes use a [bi-encoder](glossary://bi-encoder) path for retrieval and reranking: embed query and documents independently, then compare vectors. The current harness also supports [cross-encoder](glossary://cross-encoder) scoring and two-stage reranking evaluations. A bi-encoder's retrieval rank alone does not prove the quality of a production two-stage stack; evaluate that stack with its candidate cutoff.

## Trade-offs

- **Breadth vs your distribution.** Multi-task averages summarize generalist geometry; a product may depend on a narrower slice, such as retrieval in one domain. Use breadth to shortlist candidates and task-specific evaluation to make release decisions.
- **Public leaderboard vs private offline eval.** Public numbers are comparable across vendors; private golden sets catch chunking, metadata filters, and jargon the public set never saw.
- **Speed of eng v2 vs completeness of full suites.** Fast benchmarks improve iteration; full multilingual or long-doc packs still matter when those are production requirements.
- **Frozen probes vs full fine-tunes.** Classification accuracy on a logistic probe is a representation test, not the accuracy you would get after task fine-tuning.

## Why it matters here

LeetLLM material on RAG, dense retrieval, and embedding choice will keep citing MTEB numbers. Read the task family, language, version, and metric before applying a result: a model's overall rank may differ from its retrieval score for your index. Use MTEB to shortlist candidates, then run an [offline evaluation](glossary://offline-evaluation) on the corpus you will actually serve.

## Related terms

- [Embedding](glossary://embedding)
- [Dense retrieval](glossary://dense-retrieval)
- [NDCG](glossary://ndcg)
- [Recall@k](glossary://recall-at-k)
- [Bi-encoder](glossary://bi-encoder)
