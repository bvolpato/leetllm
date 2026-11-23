---
query: "We are creating a research-backed page for the following: \"Language Modeling & Next Tokens\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: preparation\nCurrent page scope: Learn how next-token prediction becomes a trainable language model, from bigram counts and neural n-grams to causal Transformer generation and KV-cache serving.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "f856a7fcd1b7a3bebcd622918103dc10"
status: "completed"
---

A curriculum page on language modeling should follow a historical and computational progression, guiding students from discrete frequency counting to dense vector spaces, self-attention mechanisms, and the hardware-level realities of serving LLMs in production.

## Curriculum Architecture & Pedagogical Progression

The module is structured into four sequential learning phases, moving from classical statistical NLP to modern production infrastructure:

1. **Discrete Statistical Counting:** Understanding probability distributions over sequences, Markov assumptions, and sparse bigram frequency matrices.
2. **Distributed Representations:** Overcoming the exponential sparsity of discrete n-grams by embedding tokens into continuous geometric vector spaces.
3. **Autoregressive Self-Attention:** Parallelizing sequence training via masked lower-triangular attention and teacher-forced cross-entropy optimization.
4. **Production Serving Mechanics:** Deconstructing the two-phase inference lifecycle (prefill vs. decode) and quantifying the memory bandwidth bottlenecks solved by Key-Value (KV) caching.

## Module 1: Statistical Foundations & Discrete Bigrams

Students must first master how sequence generation is mathematically formalized as computing the joint probability of a token sequence via the chain rule of probability:

P(w1​,w2​,…,wn​)=i=1∏n​P(wi​∣w1​,w2​,…,wi−1​)

### Core Mechanisms & Equations

Because estimating full historical context is intractable in discrete frequency counts, the **First-Order Markov Assumption** truncates the history to just the immediately preceding token (wi−1​). The Maximum Likelihood Estimation (MLE) for a bigram transition probability is calculated from raw frequency counts:

P(wi​∣wi−1​)=C(wi−1​)C(wi−1​,wi​)​

### Worked Pedagogical Example

Given a miniature training corpus of three sentences:

- `<s> i like ai </s>`
- `<s> i like code </s>`
- `<s> code is ai </s>`

To evaluate the probability of the sequence `<s> i like code </s>`:

1. **Count frequencies:** C(<s>)=3, C(<s>, i)=2, C(i)=2, C(i, like)=2, C(like)=2, C(like, code)=1, C(code)=2, C(code, </s>)=1.
2. **Compute bigram probabilities:**

- P(i∣<s>)=32​
- P(like∣i)=22​=1.0
- P(code∣like)=21​=0.5
- P(</s>∣code)=21​=0.5
3. **Sequence probability:** 32​×1.0×0.5×0.5≈0.167.

**The Sparsity Failure:** If evaluated on the unseen bigram `"ai code"`, the frequency count C(ai, code)=0, collapsing the entire sentence probability to zero. Teach **Laplace (Add-One) Smoothing** to resolve zero-probability failure modes:

PLaplace​(wi​∣wi−1​)=C(wi−1​)+∣V∣C(wi−1​,wi​)+1​

- **Primary Source Reference:** Foundations of statistical language modeling and smoothing techniques are documented in Jurafsky & Martin's *Speech and Language Processing*, Chapter 3: [https://web.stanford.edu/~jurafsky/slp3/3.pdf](https://web.stanford.edu/~jurafsky/slp3/3.pdf)

## Module 2: Overcoming the Curse of Dimensionality via Neural N-Grams

As context window length n increases, the number of possible parameter combinations scales exponentially as ∣V∣n. In a vocabulary of ∣V∣=50,000, a 4-gram model requires storing 50,0004=6.25×1018 discrete probability values, rendering lookup tables computationally impossible.

### Distributed Representations

Instead of treating words as orthogonal, discrete atomic indices where similarity is zero (one-hot(i)⊤one-hot(j)=0), neural language models project discrete tokens into a low-dimensional continuous geometric space Rm. Semantically related words (e.g., "cat" and "dog") share similar vector orientations, allowing the model to generalize probability mass to unseen sequences without explicit count smoothing.

### Architecture of a Neural Language Model

1. **Embedding Layer:** A shared matrix C∈R∣V∣×m maps context word indices to continuous vectors.
2. **Concatenation:** Context vectors are concatenated into a single input layer x=[C(wt−n+1​);…;C(wt−1​)].
3. **Hidden Layer:** A linear projection with non-linear activation (tanh or ReLU): a=tanh(Wx+d).
4. **Output Projection & Softmax:** Unnormalized log-probabilities (logits) u=Ua+b are transformed into a valid probability distribution over the entire vocabulary:

P(wt​=i∣context)=∑j=1∣V∣​exp(uj​)exp(ui​)​

- **Primary Source Reference:** Bengio et al. (2003), "A Neural Probabilistic Language Model", Journal of Machine Learning Research: [https://www.jmlr.org/papers/v3/bengio03a.html](https://www.jmlr.org/papers/v3/bengio03a.html)

## Module 3: Causal Transformers & Autoregressive Generation

While neural n-grams and Recurrent Neural Networks (RNNs) process tokens sequentially, they suffer from vanishing gradients across long sequences and cannot be parallelized across time steps during training. The Transformer architecture eliminates recurrence entirely in favor of self-attention.

### Causal Self-Attention Mechanics

To train autoregressively, the model must learn to predict token wt+1​ using only information from positions 1…t. In standard self-attention, every token attends to every other token. In **Causal (Decoder-Only) Self-Attention**, a lower-triangular mask M is added to the attention score matrix before the softmax operation, setting all future token interactions to −∞:

Attention(Q,K,V)=softmax(dk​![Image](<data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"%3E<path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"%3E</path%3E</svg%3E>)​QK⊤​+M)V

Where Mij​=0 if i≤j (past and present tokens) and Mij​=−∞ if i>j (future tokens). Because exp(−∞)=0, future tokens receive exactly zero attention weight during training.

### Teacher-Forced Cross-Entropy Optimization

During training, the entire ground-truth sequence is fed into the Transformer in a single parallel forward pass. The objective is to minimize the average Cross-Entropy Loss (negative log-likelihood) over all sequence positions simultaneously:

LCE​=−N1​i=1∑N​k=1∑∣V∣​yi,k​logy^​i,k​

- **Primary Source Reference:** Vaswani et al. (2017), "Attention Is All You Need", Advances in Neural Information Processing Systems: [https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf)
- **Primary Source Reference:** Radford et al. (2019), "Language Models are Unsupervised Multitask Learners" (GPT-2 architecture): [https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)

## Module 4: Production Serving Mechanics & KV-Cache

When transitioning a trained Transformer from parallel training to real-time production inference, the computational paradigm shifts fundamentally from compute-bound optimization to memory-bandwidth-bound optimization.

### The Two Phases of LLM Inference

- **The Prefill Phase:** When a user submits a prompt, the engine processes all prompt tokens in parallel (similar to training). It computes the initial logits, outputs the first generated token, and writes the computed Key (K) and Value (V) tensors for all prompt layers into GPU High Bandwidth Memory (HBM). This phase is heavily **compute-bound** (limited by GPU arithmetic FLOPs).
- **The Decode Phase:** The model generates subsequent tokens autoregressively one by one. In step t, without caching, computing attention requires re-evaluating linear projections for all t−1 historical tokens, resulting in O(t2) redundant operations over the sequence generation lifecycle.

### The Key-Value (KV) Cache Solution

To achieve linear O(t) decoding complexity, inference engines preserve the evaluated K and V matrices of all previous positions in High Bandwidth Memory. During decode step t, the GPU only computes the query, key, and value vectors (qt​,kt​,vt​) for the single newly generated token. It appends kt​ and vt​ to the cached matrices and computes attention against the historical HBM memory block.

### Quantifying the KV-Cache Memory Footprint

Because every decoding step requires fetching the entire historical KV-cache from GPU memory to compute dot products, decoding speed is strictly governed by **memory bandwidth** (bytes loaded per second), not arithmetic speed. The raw memory footprint of a standard KV-cache per request is calculated as:

Memory (bytes)=2×L×H×dh​×S×B×P

Where:

- 2 accounts for storing both Key and Value matrices
- L = number of Transformer layers
- H = number of query attention heads
- dh​ = dimension per head
- S = sequence length (prompt + generated tokens)
- B = batch size
- P = precision size in bytes (2 bytes for FP16/BF16, 1 byte for INT8)

**Worked Hardware Calculation:** For a 32-layer, 32-head model with head dimension dh​=128 running in FP16 (P=2) at a context length of 4,096 tokens for a single request (B=1):

Memory=2×32×32×128×4,096×2=2,147,483,648 bytes≈2.0 GB

If a production server attempts to process a concurrent batch size of 32 requests at this sequence length, the KV-cache alone consumes **64 GB of GPU VRAM**, often exceeding the memory required to store the model weights themselves.

- **Primary Source Reference:** Kwon et al. (2023), "Efficient Memory Management for Large Language Model Serving with PagedAttention" (vLLM specification): [https://arxiv.org/abs/2309.06180](https://arxiv.org/abs/2309.06180)

## Architecture Comparison: Evolution of Sequence Modeling

| Metric / Dimension | Discrete Bigrams / N-Grams | Neural N-Grams (FNN) | Causal Transformers |
| --- | --- | --- | --- |
| Context Window ( N ) | Strictly local ( 1 to 4 tokens); scales exponentially as ∣ V ∣ n . | Fixed local window ( 5 to 10 tokens); limited by input layer concatenation size. | Global ( 4 , 000 to 1 , 000 , 000 + tokens); bounded only by memory and attention complexity. |
| Training Complexity | O ( L ) frequency counting over corpus length L . | O ( L ⋅ m ⋅ ∣ V ∣ ) sequential gradient descent; computationally bottlenecked by softmax over ∣ V ∣ . | O ( L ⋅ S 2 ⋅ d ) highly parallelized matrix multiplications across sequence length S . |
| Inference Footprint | Sparse hash tables or N -dimensional arrays; massive RAM consumption for N > 3 . | Lightweight static weight matrices ( C , W , U ); low memory footprint, no dynamic history cache. | Heavy dynamic footprint; requires preserving continuous Key/Value tensors in HBM for every token. |
| Generalization Capability | Zero without smoothing; fails completely on unseen token combinations. | Moderate; generalizes across synonyms via geometric similarity in embedding space R m . | Strong; captures long-range syntax, multi-step logic, and complex in-context demonstrations. |

## Common Misconceptions & Failure Modes

- **Misconception: "Language models plan sentence endings before outputting the first word."**

- **Correction:** Pure autoregressive models operate via greedy or stochastic token-by-token sampling over local conditional probability distributions. They possess no forward-planning buffer or lookahead verification during standard decoding unless augmented with external search algorithms or reasoning scaffolding.
- **Misconception: "Increasing batch size during inference proportionally improves per-user response time."**

- **Correction:** In the decode phase, GPU execution threads are starved waiting for large KV-cache tensors to transfer from High Bandwidth Memory to SRAM compute units. While increasing batch size improves overall server throughput (tokens per second across all users), it can increase per-user latency due to memory contention and queue delays.
- **Misconception: "The KV-cache stores raw word embeddings."**

- **Correction:** The cache stores layer-specific linear projections, specifically the Key (K=XWk​) and Value (V=XWv​) matrices produced inside every individual self-attention block across all L layers of the network.
- **Misconception: "Zero-probability sequences in n-grams indicate grammatically incorrect text."**

- **Correction:** A zero count in a discrete n-gram model merely indicates that the specific sequence did not occur in the training sample. This illustrates the fundamental weakness of empirical frequency estimation when applied to the infinite generative capacity of human language.

## Stale Claims, Disputed Paradigms & Industry Realities

- **Stale Claim: KV-caches must be stored in contiguous GPU memory blocks.**

- **Current Reality:** Early serving architectures required allocating contiguous memory blocks for the maximum possible sequence length of a request, leading to internal memory fragmentation waste of up to 60–80%. Modern serving engines use paged memory management (**PagedAttention**, introduced by vLLM), dynamically allocating non-contiguous memory blocks in fixed-size pages (e.g., 16 or 32 tokens per block) similar to operating system virtual memory.
- **Primary Source:** vLLM PagedAttention System Documentation: [https://docs.vllm.ai/en/latest/concepts/paged_attention.html](https://www.google.com/search?q=https://docs.vllm.ai/en/latest/concepts/paged_attention.html)
- **Disputed Paradigm: Next-token prediction alone is sufficient for complex multi-step reasoning.**

- **Current Reality:** While scaling autoregressive next-token prediction improves zero-shot and few-shot generalization, industry consensus has shifted toward supplementing raw next-token training with **test-time compute scaling** (e.g., OpenAI o1/o3, DeepSeek-R1). These systems use reinforcement learning to generate internal chain-of-thought reasoning tokens, exploring search trees and verifying intermediate logic before outputting a final response.
- **Primary Source:** Brown et al. (2020), "Language Models are Few-Shot Learners" (GPT-3 scaling analysis): [https://arxiv.org/abs/2005.14165](https://arxiv.org/abs/2005.14165)
- **Stale Claim: Context windows are strictly limited by quadratic O(N2) attention memory.**

- **Current Reality:** Modern architectures routinely serve context windows exceeding 100,000 tokens without quadratic memory scaling bottlenecks. This is achieved through architectural modifications such as **Grouped-Query Attention (GQA)**, which shares Key and Value heads across multiple Query heads to shrink the KV-cache footprint, and **Rotary Position Embeddings (RoPE)**, which allow context length extrapolation beyond training boundaries.
- **Primary Source:** Ainslie et al. (2023), "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints": [https://arxiv.org/abs/2305.13245](https://arxiv.org/abs/2305.13245)

Understanding the journey from statistical probability estimates to hardware-bound memory optimization provides engineers with the practical foundations needed to train, debug, and scale modern language models. Mastery of these mechanisms ensures that system designers can balance model capacity, inference latency, and infrastructure costs when deploying generative AI in production environments.
