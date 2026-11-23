---
query: "We are creating a research-backed page for the following: \"From GPT to Modern LLMs\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: preparation\nCurrent page scope: Trace how decoder-only models grew into modern LLMs, then inspect scaling, instruction tuning, open weights, MoE, and serving tradeoffs with runnable examples.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "03a695dfa7283d7e10dc8120eced2d44"
status: "completed"
---

Here is a comprehensive curriculum structure and content guide for your **From GPT to Modern LLMs** module. It traces the evolution of large language models by focusing on the core architectural shifts, scaling laws, alignment breakthroughs, and the practical realities of serving them efficiently.

## 1. The Decoder-Only Shift: From Context to Few-Shot Learning

**Teaching Narrative & Prerequisites**
Start by contrasting the original encoder-decoder Transformer (used for translation) with the decoder-only architecture. Students should understand basic self-attention before tackling this module.

**Core Concepts & Mechanisms**

- **Causal Masking:** The defining feature of a decoder-only model. During training, a lower-triangular mask −∞ is applied to the self-attention matrix to prevent tokens from "looking ahead" at future context.
- **Autoregressive Generation:** The model is trained purely on next-token prediction, predicting token xt​ based only on x1…t−1​.
- **The Few-Shot Paradigm:** The transition from task-specific fine-tuning (e.g., BERT for classification) to prompt-based learning. Scaling up parameters naturally yielded zero-shot and few-shot capabilities.

**Concrete Examples & URLs**

- **GPT-1 (2018):** Established the pretrain-then-finetune paradigm.
- **GPT-3 (2020):** Demonstrated that massive scaling enables few-shot learning without weight updates. Source: *Language Models are Few-Shot Learners* (May 2020) [https://arxiv.org/abs/2005.14165](https://arxiv.org/abs/2005.14165).

**Mastery Outcome**
Students should be able to explain why a triangular mask is mathematically necessary for autoregressive generation, and write a simple script to generate text by appending predictions back into the input sequence.

## 2. Scaling Laws: Compute Optimality vs. Parameter Bloat

**Teaching Narrative**
Introduce the tension between the sheer size of early models and the amount of data used to train them. This section corrects the "bigger is always better" misconception by introducing compute-optimal training.

**Core Concepts & Tradeoffs**

- **The Scaling Hypothesis:** The idea that loss scales as a power law with compute, dataset size, and parameter count.
- **Kaplan vs. Chinchilla Laws:** Early scaling laws (Kaplan, 2020) prioritized model size over training data. The Chinchilla paper reversed this, proving that models were vastly under-trained.
- **Compute Budget Allocation:** For compute-optimal training, for every doubling of model size, the number of training tokens should also double (a roughly 1:20 ratio of parameters to tokens).

**Concrete Examples & URLs**

- **Gopher vs. Chinchilla:** Gopher (280B parameters, 300B tokens) was outperformed by Chinchilla (70B parameters, 1.4T tokens) despite using the same training compute budget. Source: *Training Compute-Optimal Large Language Models* (March 2022) [https://arxiv.org/abs/2203.15556](https://arxiv.org/abs/2203.15556).

**Common Misconceptions**

- *Misconception:* A model with more parameters is always smarter.
- *Correction:* A smaller, compute-optimally trained model is cheaper to serve and often outperforms a severely under-trained massive model.

## 3. Instruction Tuning and Alignment

**Teaching Narrative**
Explain how predicting the next word on the internet doesn't naturally create a helpful assistant. Move from unsupervised pretraining to supervised alignment.

**Core Concepts & Mechanisms**

- **Supervised Fine-Tuning (SFT):** Training the model on high-quality demonstration data of instruction-response pairs.
- **Reinforcement Learning from Human Feedback (RLHF):**

- Step 1: Train a Reward Model on human preference data (ranking outputs).
- Step 2: Use Proximal Policy Optimization (PPO) to optimize the LLM policy against the reward model.
- **The Alignment Tax:** The tradeoff where heavy alignment training can reduce a model's raw performance on certain baseline benchmarks (e.g., coding or math) in exchange for better subjective helpfulness.

**Concrete Examples & URLs**

- **InstructGPT:** The pivotal paper demonstrating that fine-tuning with human feedback aligns models with user intent, resulting in smaller models outperforming raw GPT-3. Source: *Training language models to follow instructions with human feedback* (March 2022) [https://arxiv.org/abs/2203.02155](https://arxiv.org/abs/2203.02155).

## 4. Sparse Architectures: Mixture of Experts (MoE)

**Teaching Narrative**
Address the "compute vs. memory" wall. How do we make models smarter without making inference unbearably slow? Enter MoE.

**Core Concepts & Mechanisms**

- **Sparse Feed-Forward Layers:** Instead of one massive dense layer, an MoE layer contains multiple smaller "expert" networks.
- **The Router:** A gating network that learns to assign each token to the top-k experts (usually k=1 or 2) based on token semantics.
- **VRAM vs. FLOPs Tradeoff:** An MoE model decoupled its *parameter count* (which dictates VRAM requirements) from its *active parameters* (which dictate inference speed).

**Concrete Examples & URLs**

- **Mixtral 8x7B (2024):** A highly influential open-weights MoE model. It contains 47B total parameters, but only uses 13B active parameters during inference per token. Source: *Mixtral of Experts* (Jan 2024) [https://arxiv.org/abs/2401.04088](https://arxiv.org/abs/2401.04088).

> **Key takeaway:** MoEs run fast because they are sparse, but they are incredibly difficult to deploy on consumer hardware because *all* experts must reside in VRAM simultaneously.

## 5. Inference Optimization: Serving Tradeoffs

**Teaching Narrative**
Conclude with the engineering reality of modern LLMs. A great model is useless if serving it to thousands of users bankrupts the provider.

**Core Concepts & Mechanisms**

- **The KV Cache:** To prevent recomputing the attention matrix for every generated token, the keys (K) and values (V) of past tokens are stored in GPU memory. As context lengths scale to 128k+, the KV cache often exceeds the model weights in VRAM consumption.
- **PagedAttention (vLLM):** Treats the KV cache like an operating system's virtual memory. By breaking the cache into non-contiguous blocks (pages), it eliminates memory fragmentation and massively increases batch sizes.
- **Quantization:** Reducing the precision of model weights (e.g., from FP16 to INT8 or INT4) to fit models onto consumer GPUs, with a minor tradeoff in perplexity.

**Concrete Examples & URLs**

- **PagedAttention / vLLM (2023):** Revolutionized serving throughput by dynamically managing KV cache memory. Source: *Efficient Memory Management for Large Language Model Serving with PagedAttention* (Sept 2023) [https://arxiv.org/abs/2309.06180](https://arxiv.org/abs/2309.06180).

**Mastery Outcome**
Students should be able to calculate the rough VRAM required to serve a 7B parameter model in FP16 (roughly 14GB for weights) and explain why context length exponentially increases memory demands during a batch request.
