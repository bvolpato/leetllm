---
title: Pretraining
importance: 88
---
**Pretraining** is the large-scale stage where a model learns general patterns from broad data, usually by predicting missing or next tokens, before task-specific adaptation. For modern decoder-only LLMs, that usually means **causal language modeling**: maximize the probability of each token given only the left context. The result is a base (foundation) checkpoint whose weights encode syntax, facts, code structure, and other regularities present in the mixture. Reliable adherence to product policy and correct tool use require suitable adaptation and serving controls.

## Intuition

Think of pretraining as self-supervised compression of a huge text stream into weights. The next-token objective learns from the corpus directly, which can contain instructions, answers, and demonstrations as text. The model is scored on whether it assigned high probability to what actually came next. Scale that over trillions of tokens and the same next-token skill starts to support many downstream behaviors: complete code, answer trivia that appeared in the data, continue a few-shot prompt. [GPT-3](https://arxiv.org/abs/2005.14165) demonstrated many such behaviors before task-specific fine-tuning. Adaptation stages (SFT, preference tuning) reshape and can extend those capabilities for the intended use.

## Formula

**Causal LM objective.** For a tokenized sequence $x = (x_1,\ldots,x_T)$ and model $p_\theta$:

$$
\mathcal{L}(\theta) = -\frac{1}{T}\sum_{t=1}^{T} \log p_\theta(x_t \mid x_{<t})
$$

This is average per-token [cross-entropy](glossary://cross-entropy) under [teacher forcing](glossary://teacher-forcing). [Perplexity](glossary://perplexity) is $\exp(\mathcal{L})$ under the same masking and tokenizer. Training minimizes $\mathcal{L}$ with AdamW (or similar) over a data mixture; evaluation often reports held-out loss or PPL plus downstream tasks.

**Compute budget (dense transformers).** A common accounting approximation ([Kaplan et al., 2020](https://arxiv.org/abs/2001.08361); used throughout Hoffmann et al., 2022) is:

$$
C \approx 6\,N\,D
$$

where $C$ is training FLOPs, $N$ is non-embedding parameter count, and $D$ is tokens processed. Forward pass $\approx 2ND$ FLOPs and backward $\approx 2\times$ that give the factor of six. Exact counts depend on attention implementation, sequence length, and whether embeddings are included in $N$.

**Compute-optimal scaling (Chinchilla).** [Hoffmann et al. (2022)](https://arxiv.org/abs/2203.15556) model final pretraining loss as:

$$
\hat{L}(N, D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}
$$

and find that, for a fixed FLOP budget $C$, optimal $N$ and $D$ should grow roughly equally ($N_{\mathrm{opt}} \propto C^{a}$, $D_{\mathrm{opt}} \propto C^{b}$ with $a,b \approx 0.5$). This is often summarized as about **20 tokens per parameter** (e.g. 70B parameters on 1.4T tokens for Chinchilla); the best ratio varies across data mixtures and training recipes. Later systems can **overtrain** smaller models relative to their own compute-optimal allocation for cheaper inference. The [Llama 3 report](https://arxiv.org/html/2407.21783v3) makes that choice for its smaller models while describing the 405B flagship as approximately compute-optimal for its budget.

## Worked numbers

| Model | Parameters $N$ | Tokens $D$ | Rough $D/N$ | Notes |
|-------|---------------:|-----------:|------------:|-------|
| GPT-3 (Brown et al., 2020) | 175B | 300B | $\approx 1.7$ | Same ~300B-token regime as many 2020–21 models |
| Gopher | 280B | 300B | $\approx 1.1$ | Same compute class as Chinchilla |
| Chinchilla (Hoffmann et al., 2022) | 70B | 1.4T | $20$ | Same FLOP budget as Gopher; smaller $N$, more $D$ |
| Llama 3 405B (Meta, 2024) | 405B | 15.6T | $\approx 38.5$ | Approximately compute-optimal under Meta's own scaling fit |

Chinchilla's result is the clean teaching contrast: **same compute, better allocation**. A 70B model on 1.4T tokens beat a 280B model on 300B tokens on MMLU and other suites, and inference got cheaper because the deployed network was smaller.

**Toy loss step.** Context ends with `... write to the`, gold token `cache`. After softmax, $p(\texttt{cache})=0.25$. This token's NLL is $-\ln 0.25 \approx 1.386$ nats; its contribution to a mean over $T$ scored tokens is $1.386/T$. Raise that probability to $0.5$ and its NLL is $\approx 0.693$ nats. Pretraining averages these losses over scored, non-masked positions, over trillions of tokens.

## Example

You want a code-heavy base model for an internal tools product.

1. **Tokenizer:** train or freeze a BPE/SentencePiece artifact; later stages must preserve its token-ID/embedding contract. Vocabulary changes require deliberate updates and training of the affected embeddings alongside the tokenizer file.
2. **Mixture:** e.g. filtered web, books, code, math, multilingual docs, with explicit sampling weights that control each source's contribution. Llama 3-style mixes put large mass on general text plus elevated code and math.
3. **Objective:** causal next-token CE for context length $L$ (say 8K), packed documents into sequences, loss on all non-pad tokens.
4. **Scale:** pick $N$ and $D$ from FLOP budget and whether you care more about train-compute optimality or cheap inference (overtrain small $N$).
5. **Run:** distributed training (data/tensor/pipeline parallel, FSDP/ZeRO), cosine LR with warmup, periodic [model checkpoints](glossary://model-checkpoint), held-out loss by domain slice.
6. **After:** [supervised fine-tuning](glossary://supervised-fine-tuning) on instruction pairs, then optional preference methods; product RAG and guardrails sit outside weights.

If you start from an open base and run **continued pretraining** on 50B internal API docs with the same CE objective, you are doing domain language-model adaptation. These runs target natural document continuations; SFT begins when targets are *desired responses*.

## How it works

1. **Data pipeline:** crawl or license corpora; filter quality; dedupe; remove PII/toxicity where required; fix train/eval contamination; define mixture weights and packing.
2. **Tokenize:** map text to integer ids with a frozen vocabulary; special tokens for document boundaries if used.
3. **Batch:** pack sequences of length $L$; shift labels by one for next-token prediction; mask pads.
4. **Forward:** decoder-only [transformer](glossary://transformer) with causal mask produces logits over the vocab at each position.
5. **Loss / backward:** average CE; clip grads; step optimizer; update LR schedule tied to total tokens or steps.
6. **Monitor:** train loss, held-out loss/PPL by slice, gradient norms, throughput (tokens/s), checkpoint evals on smoke tasks.
7. **Stop:** at planned token/FLOP budget, or when held-out curves and early downstream probes plateau.
8. **Handoff:** publish base weights + tokenizer + data/model cards; post-train for chat/tools separately.

Masked LM (BERT-style) and encoder-decoder span corruption (T5-style) are also pretraining objectives. Production chat LLMs today are dominated by decoder-only causal LM, sometimes with multi-stage pretraining (standard context, then long-context continued pretraining).

## What fails in production

**Wrong stage attribution.** A base model can *state* a policy or complete an API call sketch and still ignore your product rules. Use SFT/preference data, tools, and serving controls to teach and enforce the intended behavior.

**Data quality and mix.** Duplicate spam, low-quality crawl, or a mix starved of code/math shows up as domain PPL and task gaps. Deduplicate and rebalance the data mix to address these gaps; tune LR to optimize training on that mix. Eval-set contamination (train on test) deflates held-out loss and inflates benchmark scores.

**Compute vs inference goals.** Chinchilla-optimal training minimizes train loss for a FLOP budget. Deployed products often prefer **smaller, overtrained** bases because decode cost scales with $N$. Choosing $N$ only from train-optimal tables can leave you with an expensive-to-serve model.

**Knowledge freshness.** A checkpoint reflects its training mixture, which can include public, licensed, private or synthetic data with different collection dates. New information requires retrieval, tools, or continued training before the model can use it.

**Metrics that lie.** Falling train CE means the mixture is being fit. Track slice loss and task evals to assess instruction quality, tool reliability, and safety before promoting a checkpoint.

## Why it matters here

Almost every LLM product sits on someone else's (or your) pretraining run. Curriculum topics on transformers, tokenization, loss, scaling, checkpoints, and post-training all assume you can separate **what the base learned from next-token statistics** from **what adaptation and systems still have to add**. Reading a model report without that boundary leads to bad bets on data, compute, and product architecture.

## Related terms

- [Transformer](glossary://transformer)
- [Cross-entropy](glossary://cross-entropy)
- [Perplexity](glossary://perplexity)
- [Teacher forcing](glossary://teacher-forcing)
- [Supervised fine-tuning](glossary://supervised-fine-tuning)
