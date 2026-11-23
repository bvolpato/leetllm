---
query: "We are creating a research-backed page for the following: \"Build GPT from Scratch Lab\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: training\nCurrent page scope: Build and train a tiny GPT end to end on Shakespeare: tokenize with GPT-style subwords, remap active token IDs, run causal self-attention, track validation loss, save a checkpoint, and sample text.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "a4355e2810a6148ef15a3ac06b282cf6"
status: "completed"
---

Manually corrected September 22, 2026. Follow the actual bundled corpus and runnable model. The earlier packet conflated Tiny Shakespeare with this larger file, character-level loss with BPE loss, and useful architectural choices with universal guarantees. Historical query and generation metadata above are preserved.

## 1. Pedagogical Progression and Prerequisites

Start the article by establishing a clear contract of what the student will build and the foundational skills required before writing code.

- **Prerequisites:** State explicitly that learners should be comfortable with basic Python, PyTorch tensor manipulation, matrix multiplication, and the cross-entropy loss function.
- **The Narrative Arc:** Structure the lesson to follow the flow of data through a Transformer: text string → subword tokens → remapped vocabulary IDs → token and position embeddings → causal self-attention blocks → logits → autoregressive text sampling.
- **Historical reference:** nanoGPT's November 2025 README update marks it deprecated and points to nanochat. Keep the older code as a historical example, not a current maintenance recommendation: https://github.com/karpathy/nanoGPT and https://github.com/karpathy/nanochat.

## 2. Tokenization and Active Token Remapping

Character and BPE examples use different units and output supports. Don't rank one pedagogy as inherently better or compare their nats/token directly. This lab uses a trained GPT-2 tokenizer and randomly initialized language-model weights.

- **Corpus and tokenizer:** The bundled Princeton file is 4,538,523 bytes, with SHA-256 `6f9c770efced5c3d87efa6197cd3091b982341372e36c6357f865df91ddecde6`. GPT-2 produces 1,255,253 tokens and 17,485 active IDs. It isn't nanoGPT's roughly 1 MB Tiny Shakespeare file. Use the declared `gpt2` encoding; `cl100k_base` has different patterns and IDs, so substituting it invalidates the stored mapping. Sources: https://www.cs.princeton.edu/courses/archive/spring20/cos302/files/shakespeare.txt and https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py.
- **Parameter accounting:** The tied compact matrix has 1,678,560 parameters at width 96, versus 4,824,672 for GPT-2's full 50,257 rows. That's a 65.2% vocabulary-matrix reduction. The whole lab model has 1,907,040 parameters; absent-piece rows would be about 62.3% of the corresponding full-vocabulary model, not over 70%. Rows absent from input can still receive output-softmax gradients. Weight tying in the actual GPT-2 source: https://github.com/openai/gpt-2/blob/master/src/model.py.
- **The Active Remapping Mechanism:** Provide a concrete, step-by-step algorithm to compress the vocabulary:

1. State which text determines the support. This lab scans the entire file before splitting, including 335 IDs exclusive to the held-out portion. That preprocessing access must be disclosed.
2. Sort these active IDs and construct a dense bijective forward mapping dictionary `forward_map = {orig_id: dense_id}` that maps the active vocabulary into a contiguous integer range [0,Vactive​−1].
3. Construct the corresponding inverse mapping `reverse_map = {dense_id: orig_id}` to store for inference decoding.
4. Instantiate the tied matrix with the compact size. Removing output candidates changes the softmax denominator, loss baseline, and prompt coverage; it isn't guaranteed to accelerate convergence or preserve the full model's loss.

## 3. Causal Self-Attention and Decoder Architecture

This section forms the core engineering lab, where students transition from conceptual diagrams to writing the mathematical machinery of a decoder-only Transformer block.

- **Scaled Dot-Product Attention:** Present the canonical self-attention equation and break down each matrix operation:

Attention(Q,K,V) = softmax(Q K^T / sqrt(d_k) + M) V.

Q, K, and V are per-position projections. The square-root factor controls dot-product scale under an initialization model; it doesn't guarantee the absence of vanishing gradients. M blocks future keys. This architecture's per-position normalization and MLPs preserve that input boundary: https://github.com/openai/gpt-2/blob/master/src/model.py.
- **Enforcing Causality:** Show learners how to construct the lower-triangular causal mask M∈RT×T using `torch.tril`. Explain that setting all upper-triangular elements (where j>i) to −∞ ensures that when the softmax operator is applied, future tokens receive an attention weight of exactly zero, preventing information leakage during autoregressive training.
- **Manual versus API:** The lab implements fused QKV projection and splits heads manually. Its CPU SDPA comparison checks numerical closeness; API use alone doesn't prove FlashAttention ran. Backend eligibility and floating-point ordering matter: https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html.
- **Pre-LN:** Identity residual paths are useful, not universal training-stability guarantees. Xiong et al. analyzed large Post-LN output-side initialization gradients, not the earlier claimed universal vanishing-gradient cause: https://arxiv.org/html/2002.04745.

## 4. Training Loop, Validation Tracking, and Checkpointing

Guide students through the operational discipline of training language models, emphasizing how to evaluate model health and prevent memorization.

- **Autoregressive Batching:** Demonstrate how to slice continuous token streams into training batches of shape (B,T), where B is the batch size and T is the context block length. Emphasize that for an input sequence X=(t0​,t1​,…,tT−1​), the target supervision tensor Y is shifted by exactly one time step: Y=(t1​,t2​,…,tT​).
- **Exposure and evaluation:** The lab draws potentially overlapping windows; 321 updates supply 184,896 target positions, not a full pass. Eight validation batches score 4,608 positions, which needn't be distinct. Held-out loss and fixed-prompt samples offer limited evidence; a novel prompt doesn't rule out a memorized completion. Don't prescribe a universal memorization onset or early-stopping threshold.
- **Checkpoint scope:** Save frozen weights, optimizer state, completed updates, configuration, tokenizer/support, corpus fingerprint, split, and current batch-generator states. Initial seeds alone don't preserve progress. Extra stochastic layers, devices, schedulers, or scalers require their states too. This lab checks update 322 within one CPU process/environment, not a production deployment or cross-platform equality: https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html and https://docs.pytorch.org/docs/2.14/notes/randomness.html.

## 5. Text Sampling and Expected Mastery Outcomes

The final lab section closes the feedback loop, allowing learners to witness the generative results of their mathematical implementations.

- **The Generation Loop:** Step through the inference algorithm: feed a prompt string into the model, extract logits for the final temporal position t, apply temperature scaling li′​=li​/T, convert the scaled logits to a probability distribution via softmax, sample the next token ID from a multinomial distribution, and concatenate it back into the input window.
- **Decoding Remapped Tokens:** Remind students of the two-step decoding requirement: first, map the generated dense token ID back to the original BPE token ID using `reverse_map`, and second, pass the recovered BPE integer array to `tiktoken.decode()` to render readable text.
- **Measured scope:** Use this lab's displayed CPU logs and actual samples. The uniform reference is ln(17,485)=9.769 nats, not a measured step-zero checkpoint. Don't transfer character-level losses around 1.5 to this BPE objective or promise a GPU training time from a different model: https://github.com/karpathy/nanoGPT.
- **Visible behavior:** In the recorded Python 3.12 CPU run, the early sample has common words and many newlines. The later sample includes `I shall not` and `sir , my lord`, alongside `I'll I will` and broken grammar. It doesn't establish coherent drama, iambic rhythm, or a universal per-update milestone.

## 6. Common Pitfalls and Failure Modes

Include a troubleshooting reference section to help students independently debug the most frequent logical errors encountered during assembly:

- **Target Remapping Mismatch:** If training inputs X are translated to dense remapped IDs but the target targets Y remain in the raw BPE integer space, `torch.nn.CrossEntropyLoss` will throw out-of-bounds index exceptions or compute meaningless gradients against unmapped vocabulary rows.
- **Causal and target checks:** Future-input perturbation tests the input boundary, not label shifting. An inverted manual mask can create an all-masked row whose softmax is NaN. Low loss alone doesn't uniquely diagnose leakage; a constant biased predictor can beat the uniform reference on skewed targets.
- **Temperature:** Tensor division by zero can produce infinities/NaNs rather than a Python exception. Greedy needs an explicit argmax branch. The positive-temperature limit is uniform over tied maxima, not necessarily one deterministic token.
- **Evaluation mode:** Use `model.eval()` and restore the prior mode. This particular model has no dropout or BatchNorm, so mode doesn't alter those nonexistent layers. `no_grad()` separately disables gradient tracking.
- **Weight decay and resume:** Decoupling AdamW decay isn't the same as excluding vectors from decay. This lab decays all supplied parameters; nanoGPT uses dimensionality-based groups. Optimizer moments affect updates, not the same deterministic batch's pre-update forward loss: https://github.com/karpathy/nanoGPT/blob/master/model.py and https://arxiv.org/html/1711.05101.

Keep inference observations, deterministic contracts, and measured training estimates separate. The small CPU lab teaches their interaction; it doesn't validate frontier-scale training, production data quality, or serving performance.
