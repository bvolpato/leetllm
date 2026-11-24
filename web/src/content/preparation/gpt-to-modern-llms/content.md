---
{
  "id": "gpt-to-modern-llms",
  "title": "From GPT to Modern LLMs",
  "slug": "gpt-to-modern-llms",
  "section": "Preparation & Prerequisites",
  "category": "NLP Fundamentals",
  "difficulty": "Easy",
  "order": 7,
  "coverImage": "illustrations/_generated/llm_evolution_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic"
  ],
  "shortDescription": "One autoregressive model handles classification, span extraction, and grounded synthesis through a shared token interface while scaling laws, KV caches, and context position determine real behavior.",
  "keyConceptsTested": [
    "The split between Encoder-only (BERT) and Decoder-only (GPT) models",
    "Scaling laws: why model size, data, and compute must be balanced",
    "Chinchilla compute-optimal training versus token-starved large models",
    "Few-shot in-context evaluation without parameter updates",
    "Open-weight models: LLaMA, deployment choices, and license checks",
    "Modern architectural shifts: mixture-of-experts routing and reasoning budgets",
    "The life of a token: tokenization, embedding, attention, and KV cache",
    "Context window behavior: lost in the middle and prompt placement",
    "How to evaluate model announcements against a real workload"
  ],
  "prerequisites": [
    "transformer-architecture-end-to-end",
    "language-modeling-next-token-prediction"
  ]
}
---

An assistant reading a 2,000-line Python ML codebase gets three completely different jobs in one afternoon: classify a technical note by topic, extract the exact parameter name `rope_theta`, and explain why grouped-query attention shrinks the KV cache. Classic NLP builds three separate models for those tasks. A modern decoder language model handles all three through the exact same text-completion loop.

**GPT** (*Generative Pre-trained Transformer*) names OpenAI's causal decoder family, while **large language model (LLM)** covers the broader class of large pretrained language models. Starting from the original 2017 encoder-decoder <span data-glossary="transformer">Transformer</span>,[^vaswani2017] modern LLMs evolved along four axes: causal next-token framing, compute-optimal scaling, leaner inner blocks (RMSNorm, SwiGLU, RoPE, GQA, MoE), and post-training alignment. Understanding how each choice works tells you when one big decoder wins and when a small encoder or exact lookup beats it.

## One generation loop, many tasks

Dedicated models wire a separate output head to every job: a linear layer over `{"Attention", "Training", "Serving"}` for classification, or `[start_idx, end_idx]` pointers for span extraction. An autoregressive decoder instead turns every task into next-<span data-glossary="token">token</span> prediction from a formatted prompt. Left-to-right self-attention reads the instruction, any few-shot examples, and the partial answer emitted so far:

1. **Classification:** Map `"Scales query-key dot products by 1/sqrt(d_k)"` to one label in `{"Attention", "Training", "Serving"}`.
2. **Extraction:** Copy the exact identifier `rope_theta` from `"rotary_pos.py sets rope_theta = 10000"`.
3. **Synthesis:** Explain why GQA reduces KV cache memory using a source paragraph.

Bidirectional encoders like BERT still dominate fast, low-cost tagging over fixed label sets because every token attends left and right at once.[^devlin2019] Causal decoders win on flexibility: one prompt format handles classification, verbatim lookup, and prose explanation without changing a single head weight. Ending a few-shot prompt with `Topic:` concentrates next-token probability onto the valid labels:

```text
Classify the ML note into Attention, Training, or Serving.

Note: Multi-head dot products divide by sqrt(d_k).
Topic: Attention

Note: AdamW updates weights using cosine learning-rate decay.
Topic: Training

Note: Paged blocks reduce wasted KV memory across concurrent batches.
Topic: Serving

---

Note: Causal masks set future key scores to negative infinity before softmax.
Topic:
```

Unconstrained generation can still emit conversational wrappers like `"The topic is Attention"`, so applications pair prompts with constrained decoding or strict parsing and check extracted strings verbatim against the source.

<figure>
  <img src="illustrations/_generated/decoder_task_interface_dark.png" alt="A single autoregressive next-token loop expresses three distinct NLP tasks: classifying a technical snippet as Attention, extracting the exact parameter name rope_theta from source text, and synthesizing why GQA saves memory, with each output verified by its own check." />
  <figcaption>One prompt-to-next-token loop can express classification, exact span lookup, and grounded explanation. Label membership, verbatim source matching, and claim support each require an independent verification step.</figcaption>
</figure>

The snippet below builds that few-shot prompt and computes the softmax probabilities over candidate next tokens at the trailing `Topic:` cue:

<!-- leetllm: test, deps=numpy, output=show, output_title="Prompt framing output" -->
```python title="prompt-framing-as-generation.py"
import numpy as np


def build_topic_prompt(note: str) -> str:
    examples = [
        ("Multi-head dot products divide by sqrt(d_k).", "Attention"),
        ("AdamW updates weights using cosine learning-rate decay.", "Training"),
        ("Paged blocks reduce wasted KV memory across concurrent batches.", "Serving"),
    ]
    header = "Classify the ML note into Attention, Training, or Serving."
    shots = "\n\n".join(f"Note: {text}\nTopic: {label}" for text, label in examples)
    return f"{header}\n\n{shots}\n\n---\n\nNote: {note}\nTopic:"


prompt = build_topic_prompt(
    "Causal masks set future key scores to negative infinity before softmax."
)
candidates = ["Attention", "Training", "Serving", "The"]
next_token_logits = np.array([3.1, 0.8, 0.4, -0.5])
shifted = next_token_logits - next_token_logits.max()
probs = np.exp(shifted) / np.exp(shifted).sum()

print(prompt)
for token, prob in zip(candidates, probs):
    print(f"P({token:9s} | prompt) = {prob:.3f}")
```

<!-- leetllm: output:start -->
```text title="Prompt framing output" output compact
Classify the ML note into Attention, Training, or Serving.

Note: Multi-head dot products divide by sqrt(d_k).
Topic: Attention

Note: AdamW updates weights using cosine learning-rate decay.
Topic: Training

Note: Paged blocks reduce wasted KV memory across concurrent batches.
Topic: Serving

---

Note: Causal masks set future key scores to negative infinity before softmax.
Topic:
P(Attention | prompt) = 0.837
P(Training  | prompt) = 0.084
P(Serving   | prompt) = 0.056
P(The       | prompt) = 0.023
```
<!-- leetllm: output:end -->

> **Key insight:** Few-shot prompting updates zero model weights. Attention over the prefix steers the final hidden state so its dot product with the unembedding matrix favors valid label tokens.

```checkpoint
Why can a decoder-only model classify a technical note even though its pretraining objective was next-token prediction?
---
In-context demonstrations cast classification as pattern completion ending at `Topic:`. A capable decoder uses that prefix to concentrate probability on valid category tokens without modifying its vocabulary head, though multi-token labels and off-schema phrasing require parsing, schema validation, and accuracy evaluation on held-out examples.
```

<span id="the-fork-reading-and-writing-split-apart"></span>
## Why encoders read both ways and decoders write left to right

The 2017 Transformer paired a bidirectional encoder reading the source text with a causal decoder writing the target via cross-attention.[^vaswani2017] A year later, BERT and GPT split those halves into two standalone families:

1. **BERT (2018):** A bidirectional encoder lets every non-padding token attend both left and right.[^devlin2019] It pretrains with masked language modeling (corrupting 15% of tokens: 80% `[MASK]`, 10% random, 10% unchanged) and next-sentence prediction; contrastive variants like Sentence-BERT turn pooled encoder states into strong retrieval embeddings.[^reimers2019]
2. **GPT (2018):** A causal decoder keeps masked self-attention and MLPs while dropping cross-attention.[^radford2018] Its lower-triangular <span data-glossary="causal-mask">causal mask</span> restricts query $i$ to keys $j \le i$, training every position to predict $x_{i+1}$ from preceding context alone.

| System task | Encoder-only (BERT-style) | Decoder-only (GPT-style) |
|---|---|---|
| Categorize a code review comment | Fine-tuned linear head over `[CLS]` or pooled states | Prompted completion or attached linear head |
| Write a grounded explanation | Needs a separate decoder | Native autoregressive generation |
| Dense semantic search | Contrastive bi-encoder trained for retrieval | Possible, usually heavier per query |
| Multi-turn assistant | Fast reranker or classifier inside the pipeline | Instruction-tuned generator with conversation history |

Encoder-decoder hybrids like T5 still read prompts bidirectionally while generating left to right.[^raffel2020] Generalist assistants converged on decoder-only stacks because one causal loop scales cleanly to long multi-turn prefixes, while lightweight encoders keep winning fast search and tagging jobs.

### A decoder writes left to right

Under a causal mask, query $t$ attends only to keys $j \le t$. Setting future scores ($j > t$) to $-\infty$ before softmax zeroes all future attention weights, allowing all $T$ positions to train in parallel with zero leakage across time. Compare masked causal weights against unmasked bidirectional weights on identical $Q$ and $K$ projections for `["<bos>", "rope", "scales", "<eos>"]`:

<!-- leetllm: test, deps=numpy, output=show, output_title="Visibility mask output" -->
```python title="visibility-masks.py"
import numpy as np

tokens = ["<bos>", "rope", "scales", "<eos>"]
rng = np.random.default_rng(7)
q = rng.normal(size=(4, 4))
k = rng.normal(size=(4, 4))
scores = (q @ k.T) / np.sqrt(q.shape[-1])

future = np.triu(np.ones((4, 4), dtype=bool), k=1)
causal_scores = np.where(future, -np.inf, scores)

def row_softmax(matrix):
    shifted = matrix - matrix.max(axis=-1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=-1, keepdims=True)

causal_weights = row_softmax(causal_scores)
bidir_weights = row_softmax(scores)

print("tokens:", tokens)
print("causal weights row 2 ('scales'):", np.round(causal_weights[2], 3))
print("bidir weights row 2 ('scales'): ", np.round(bidir_weights[2], 3))
print("future mass in causal row 2:    ", float(causal_weights[2, 3]))
```

<!-- leetllm: output:start -->
```text title="Visibility mask output" output compact
tokens: ['<bos>', 'rope', 'scales', '<eos>']
causal weights row 2 ('scales'): [0.307 0.5   0.192 0.   ]
bidir weights row 2 ('scales'):  [0.249 0.405 0.155 0.192]
future mass in causal row 2:     0.0
```
<!-- leetllm: output:end -->

Every entry above the diagonal in `causal_weights` is exact zero, while each row still sums to one over its visible prefix.

```checkpoint
What mathematical property distinguishes a causal decoder attention matrix from an encoder attention matrix?
---
In causal self-attention, query $i$ attends only to keys $j \le i$, including the diagonal, by setting scores for $j > i$ to $-\infty$ before softmax so probabilities normalize cleanly over visible keys. Bidirectional encoders permit keys on both sides up to padding masks.
```

## The life of a token: prefill, KV cache, and decode

Follow the five-token prompt `"Why is RoPE relative ?"` through a pre-norm decoder. Each token ID looks up a $d_{\text{model}}$ embedding, passes through stacked blocks (normalization, causal self-attention, residual addition, normalized MLP), and finally projects the last hidden state through $W_{\text{vocab}} \in \mathbb{R}^{d_{\text{model}} \times |V|}$ (often stored transposed as $[|V|, d_{\text{model}}]$) into <span data-glossary="logits">logits</span> and <span data-glossary="softmax">softmax</span> probabilities.[^radford2019code]

To avoid recomputing earlier key and value vectors on every generated token, serving splits inference into two phases:

1. **Prefill:** Run all $T$ prompt tokens together in parallel, filling each layer's **<span data-glossary="kv-cache">KV cache</span>** and emitting the first generated token from position $T$. Processing many token rows at once reuses loaded weights heavily, making long prefills compute-bound.
2. **Cached decode:** Feed only the newly chosen token at step $T + 1$, append its single new $(K, V)$ pair to each layer's cache, and attend $Q_{T+1}$ across $K_1 \dots K_{T+1}$. At small batch sizes, streaming full layer weights and past caches for one query row shifts the bottleneck to HBM memory bandwidth.[^pope2023]

<figure>
  <img src="illustrations/_generated/token_lifecycle_decoder_dark.png" alt="Prefill processes five prompt tokens Why, is, RoPE, relative, and question mark, caching keys and values at positions 1 to 5. Selecting Because with logit 0.38 leaves 6 text tokens and 5 cached positions. The next decode step passes Because at position 6, lets Q6 attend to K1 through K6, and extends the cache to six positions." />
  <figcaption>Immediately after sampling `Because`, the text sequence holds six tokens while the KV cache still holds five positions. The decode step feeds `Because` at position 6, computes K₆ and V₆, attends Q₆ across K₁ through K₆, and updates the cache to length six.</figcaption>
</figure>

This NumPy calculation runs the exact output projection behind the figure and tracks how the per-layer KV cache expands from 5 to 6 positions:

<!-- leetllm: test, deps=numpy, output=show, output_title="Decoder shape trace output" -->
```python title="decoder-output-and-cache-shapes.py"
import numpy as np

prompt_tokens = 5
last_hidden = np.array([0.6, -0.2, 0.4, 0.1])
output_rows = np.array([
    [0.8, 0.1, -0.2, 0.0],
    [0.2, 0.5, 0.1, -0.1],
    [-0.1, 0.2, 0.4, 0.3],
    [0.0, -0.3, 0.2, 0.4],
])
labels = ["Because", "The", "It", "Since"]

logits = output_rows @ last_hidden
exp = np.exp(logits - logits.max())
probs = exp / exp.sum()

layers, batch, kv_heads, head_dim = 4, 1, 2, 2
prefill_kv_shape = (2, batch, kv_heads, prompt_tokens, head_dim)
decode_kv_shape = (2, batch, kv_heads, prompt_tokens + 1, head_dim)

print("last-position logits:", np.round(logits, 2))
print("selected token:      ", labels[int(np.argmax(probs))])
print("prob sum:            ", round(float(probs.sum()), 4))
print("prefill KV per layer:", prefill_kv_shape)
print("decode  KV per layer:", decode_kv_shape)
```

<!-- leetllm: output:start -->
```text title="Decoder shape trace output" output compact
last-position logits: [0.38 0.05 0.09 0.18]
selected token:       Because
prob sum:             1.0
prefill KV per layer: (2, 1, 2, 5, 2)
decode  KV per layer: (2, 1, 2, 6, 2)
```
<!-- leetllm: output:end -->

Right after sampling `Because`, the text stream has six tokens while the KV cache holds only five positions. Feeding `Because` back into the decoder computes its sixth key-value pair and aligns text length with cache length before predicting token seven. Every subsequent token repeats that single-step loop until generation hits a stop token or length cap.

```checkpoint
Why might small-batch decode achieve much lower arithmetic utilization than a long prefill?
---
Prefill multiplies each weight matrix across hundreds or thousands of prompt rows at once, reusing loaded weights heavily. Batch-one decode loads the entire layer weights and past KV cache just to advance a single token row, shifting the bottleneck toward memory bandwidth unless concurrency increases.
```

<span id="the-evolution-trajectory-gpt-1-to-aligned-assistants"></span>
## How GPT grew from text completion into assistants

Modern LLMs did not arrive from one tweak. Between 2018 and 2024, three parallel advances transformed raw text predictors into fast, helpful assistants: prompting and preference alignment, compute-balanced scaling, and sparse Mixture-of-Experts routing.

<figure>
  <img src="illustrations/_generated/llm_evolution_dark.png" alt="Three LLM design axes from 2018 to 2024: prompting and alignment moving from GPT-1 through GPT-3 to InstructGPT, compute-optimal allocation comparing Gopher 280B on 300B tokens with Chinchilla 70B on 1.4T tokens at matched compute, and Mixtral sparse routing executing 2 of 8 experts for 13B active out of 47B total parameters." />
  <figcaption>Three parallel axes reshaped LLMs: prompting and alignment (GPT-1 through InstructGPT), balanced parameter-to-token compute allocation (Gopher versus Chinchilla), and sparse Mixture-of-Experts routing (Mixtral 8x7B).</figcaption>
</figure>

### 1. GPT-1 to GPT-3: scaling unlocks in-context learning

- **GPT-1 (2018, 117M parameters):** Pretrained on BooksCorpus, then fine-tuned per task with a linear head and auxiliary LM loss.[^radford2018]
- **GPT-2 (2019, 1.5B parameters):** Trained on ~40 GB of WebText and evaluated zero-shot through prompt cues like `Sentiment:` with no task-specific weight updates.[^radford2019]
- **GPT-3 (2020, 175B parameters, 300B tokens):** Showed strong **few-shot in-context learning**, where placing solved demonstrations in the prefix lifts accuracy dramatically without gradient steps.[^brown2020]

### 2. InstructGPT and DPO: aligning with human preference

A raw pretrained model completes documents rather than answering questions: given `"Explain causal masking"`, it may happily generate three more quiz questions instead of an explanation. **InstructGPT (2022)** established the three-stage **RLHF** alignment recipe:[^ouyang2022]

1. **Supervised Fine-Tuning (SFT):** Fine-tune on curated human prompt-response demonstrations to teach assistant turn structure.
2. **Reward Modeling (RM):** Train a scalar reward model on human pairwise rankings of candidate replies.
3. **Reinforcement Learning (PPO):** Maximize predicted reward while a KL penalty anchors the policy near the SFT model.

On InstructGPT's API prompts, human raters preferred a **1.3B aligned model** over the **175B raw GPT-3 base model**.[^ouyang2022] Later methods like **Direct Preference Optimization (DPO)** remove the separate reward model and optimize directly on `(prompt, chosen, rejected)` log-probability margins:

<!-- leetllm: test, deps=numpy, output=show, output_title="Preference record output" -->
```python title="preference-records.py"
import numpy as np

comparisons = [
    {
        "topic": "GQA memory reduction",
        "chosen": "Grouped-query attention shares each K/V head across a group of query heads.",
        "rejected": "Grouped-query attention deletes key vectors during training.",
        "chosen_logp_diff": 2.1,
        "rejected_logp_diff": -1.4,
    },
    {
        "topic": "Causal mask role",
        "chosen": "Setting future scores to -inf forces softmax weights above the diagonal to 0.",
        "rejected": "Causal masking reverses positional embeddings after layer normalization.",
        "chosen_logp_diff": 1.8,
        "rejected_logp_diff": -0.9,
    },
]

beta = 0.1
margins = np.array([
    beta * (row["chosen_logp_diff"] - row["rejected_logp_diff"])
    for row in comparisons
])
win_probs = 1.0 / (1.0 + np.exp(-margins))

for row, margin, prob in zip(comparisons, margins, win_probs):
    print(f"{row['topic']:22s} | margin={margin:.3f} | P(chosen>rejected)={prob:.3f}")
    print(f"  chosen: {row['chosen']}")
```

<!-- leetllm: output:start -->
```text title="Preference record output" output compact
GQA memory reduction   | margin=0.350 | P(chosen>rejected)=0.587
  chosen: Grouped-query attention shares each K/V head across a group of query heads.
Causal mask role       | margin=0.270 | P(chosen>rejected)=0.567
  chosen: Setting future scores to -inf forces softmax weights above the diagonal to 0.
```
<!-- leetllm: output:end -->

Match the checkpoint type to the workload:

| Checkpoint type | Training objective | Typical use |
|---|---|---|
| **Base** | Next-token pretraining | Continued pretraining, domain fine-tuning, likelihood scoring |
| **Instruct** | SFT + preference / RL optimization | Single-turn instructions, extraction, synthesis |
| **Chat** | Multi-turn role-delimited post-training | Interactive assistants with external memory and tools |

A **chat template** serializes message roles into the exact control tokens the checkpoint learned during post-training.[^huggingface2026chattemplates] Templates vary across families (some releases like DeepSeek-V4.1-Flash ship a custom encoding helper alongside weights),[^deepseek2026v41flash] and stateless APIs hold no server-side memory between requests, so your application re-sends the serialized conversation prefix on each turn.

<span id="scaling-laws-and-compute-optimality"></span>
## What scaling laws say about a fixed training budget

Given a fixed training compute budget $C$, how should you split FLOPs between parameter count $N$ and training tokens $D$? Kaplan et al. (2020) fitted power laws recommending much faster growth in parameters than data ($N \propto C^{0.73}, D \propto C^{0.27}$),[^kaplan2020] which led 2020-2021 models like GPT-3 (175B) and Gopher (280B) to train on just 300B tokens (~1.1-1.7 tokens per parameter).[^hoffmann2022]

Hoffmann et al. (2022) re-ran over 400 Transformer experiments while matching each run's cosine learning-rate decay to its exact token horizon.[^hoffmann2022] Their **Chinchilla** scaling law found equal scaling ($N \propto C^{0.5}, D \propto C^{0.5}$), roughly **20 tokens per parameter**: at the exact same compute budget as 280B Gopher, 70B Chinchilla trained on 1.4T tokens beat Gopher across MMLU and BIG-bench.

| Model run | Parameters ($N$) | Training tokens ($D$) | Tokens / param | Regime |
|---|---:|---:|---:|---|
| Gopher | 280B | 300B | ~1.1 | Undertrained vs. Chinchilla frontier |
| GPT-3 | 175B | 300B | ~1.7 | Undertrained |
| Chinchilla | 70B | 1.4T | 20.0 | Compute-optimal training ratio |
| LLaMA 1 | 65B | 1.4T | ~21.5 | Strong smaller open-weight model |
| Llama 3 | 8B | >15T | >1,875 | Overtrained to minimize serving cost |

Compare tokens-per-parameter ratios and Hoffmann et al.'s parametric loss curve $L(N, D) = E + A / N^{\alpha} + B / D^{\beta}$ directly:

<!-- leetllm: test, deps=numpy, output=show, output_title="Scaling allocation output" -->
```python title="tokens-per-parameter.py"
import numpy as np

names = ["Gopher", "GPT-3", "Chinchilla", "Llama-3-8B"]
params_b = np.array([280.0, 175.0, 70.0, 8.0])
tokens_b = np.array([300.0, 300.0, 1400.0, 15000.0])

ratios = tokens_b / params_b
# Published Approach-3 constants from Hoffmann et al. (2022) on raw scale:
E, A, alpha, B, beta = 1.69, 406.4, 0.34, 410.7, 0.28
N = params_b * 1e9
D = tokens_b * 1e9
est_loss = E + A / (N ** alpha) + B / (D ** beta)

for name, r, loss in zip(names, ratios, est_loss):
    print(f"{name:12s} | tokens/param={r:7.1f} | fitted_loss={loss:.3f}")
```

<!-- leetllm: output:start -->
```text title="Scaling allocation output" output compact
Gopher       | tokens/param=    1.1 | fitted_loss=1.993
GPT-3        | tokens/param=    1.7 | fitted_loss=2.002
Chinchilla   | tokens/param=   20.0 | fitted_loss=1.937
Llama-3-8B   | tokens/param= 1875.0 | fitted_loss=1.949
```
<!-- leetllm: output:end -->

Dense Transformer training uses approximately $C \approx 6ND$ FLOPs ($2ND$ forward, $4ND$ backward).[^hoffmann2022] Doubling both $N$ and $D$ multiplies total training compute by $4\times$:

<!-- leetllm: test, deps=numpy, output=show, output_title="Fixed-budget allocation output" -->
```python title="compare-training-allocations.py"
import numpy as np

configs = ["baseline", "double both", "parameters only", "tokens only"]
params = np.array([1e9, 2e9, 4e9, 1e9])
tokens = np.array([20e9, 40e9, 20e9, 80e9])

flops = 6.0 * params * tokens
ratios = tokens / params
rel_cost = flops / flops[0]

for name, cost, ratio in zip(configs, rel_cost, ratios):
    print(f"{name:15s} | compute={cost:.1f}x | tokens/param={ratio:5.1f}")
```

<!-- leetllm: output:start -->
```text title="Fixed-budget allocation output" output compact
baseline        | compute=1.0x | tokens/param= 20.0
double both     | compute=4.0x | tokens/param= 20.0
parameters only | compute=4.0x | tokens/param=  5.0
tokens only     | compute=4.0x | tokens/param= 80.0
```
<!-- leetllm: output:end -->

> **Key insight:** Chinchilla's 20:1 ratio minimizes loss for a *fixed training budget*. Once a checkpoint serves billions of requests, inference dominates total spend, so labs intentionally overtrain compact models like Llama 3 8B past 15T tokens to cut serving memory and latency.[^touvron2023][^dubey2024]

<span id="modern-frontier-architectures-rmsnorm-swiglu-and-rope"></span>
## Three newer building blocks: RMSNorm, SwiGLU, and RoPE

Modern decoders refined three inner blocks of the 2017 Transformer, popularized by LLaMA and widely adopted across open weights (with variants such as Gemma's GeGLU).[^touvron2023][^gemmaTeam2024Architecture]

### 1. Root Mean Square Normalization (RMSNorm)

LayerNorm subtracts the feature mean $\mu$, divides by centered standard deviation $\sqrt{\sigma^2 + \epsilon}$, and applies gain $\gamma$ and bias $\beta$.[^pytorch_layernorm] **RMSNorm** drops mean centering and bias, scaling directly by root-mean-square energy $\operatorname{RMS}(x) = \sqrt{\frac{1}{d}\sum_{i=1}^d x_i^2 + \epsilon}$ to output $\frac{x}{\operatorname{RMS}(x)} \odot \gamma$.[^zhang2019][^pytorch_rmsnorm]

### 2. SwiGLU activations and Rotary Position Embeddings (RoPE)

**SwiGLU** replaces a two-matrix FFN with a gated three-matrix block: $(\operatorname{SiLU}(x W_{\text{gate}}) \odot (x W_{\text{up}})) W_{\text{down}}$, where $\operatorname{SiLU}(z) = z\,\sigma(z)$.[^shazeer2020] Because three matrices replace two, matching the parameter count of a standard $4d$ FFN shrinks hidden width from $4d$ to $\frac{8}{3}d$.

**Rotary Position Embeddings (RoPE)** rotate 2D coordinate pairs of $Q$ and $K$ by angles $m\theta_i$ proportional to token position $m$: $\mathbf{q}_m = R_{\Theta, m}^d \mathbf{q}$ and $\mathbf{k}_n = R_{\Theta, n}^d \mathbf{k}$.[^su2021] Because orthogonal rotations satisfy $R_{\Theta, m}^T R_{\Theta, n} = R_{\Theta, n - m}$, the dot product $\langle \mathbf{q}_m, \mathbf{k}_n \rangle = \mathbf{q}^T R_{\Theta, n - m} \mathbf{k}$ depends purely on relative offset $n - m$ for fixed unrotated vectors.

Verify RMSNorm and SwiGLU in NumPy:

<!-- leetllm: test, deps=numpy, output=show, output_title="Frontier mechanics output" -->
```python title="frontier-architectures-rmsnorm-swiglu.py"
import numpy as np

def rms_norm(x: np.ndarray, gamma: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)
    return (x / rms) * gamma

def silu(z: np.ndarray) -> np.ndarray:
    return z * (1.0 / (1.0 + np.exp(-z)))

x = np.array([1.2, -0.8, 2.5, -1.5])
gamma = np.ones(4)
normed = rms_norm(x, gamma)

w_gate = np.array([[0.5, -0.3, 0.2, 0.1], [-0.4, 0.6, 0.1, -0.2]]).T
w_up = np.array([[1.2, 0.8, -0.3, 0.2], [0.5, -0.2, 0.4, 0.6]]).T
w_down = np.array([[0.6, -0.4], [0.3, 0.7], [-0.2, 0.5], [0.4, 0.1]]).T

hidden_swiglu = silu(x @ w_gate) * (x @ w_up)
out_swiglu = hidden_swiglu @ w_down

print("rms_norm output:  ", np.round(normed, 4))
print("output rms check: ", round(float(np.sqrt(np.mean(normed ** 2))), 4))
print("swiglu vector out:", np.round(out_swiglu, 4))
```

<!-- leetllm: output:start -->
```text title="Frontier mechanics output" output compact
rms_norm output:   [ 0.7379 -0.4919  1.5372 -0.9223]
output rms check:  1.0
swiglu vector out: [-0.0806 -0.1669 -0.0247 -0.1053]
```
<!-- leetllm: output:end -->

With $\epsilon = 10^{-6}$, the normalized vector's RMS sits at `1.0`, while learned gain $\gamma$ restores arbitrary channel scale.

<span id="attention-scaling-and-kv-cache-bandwidth-reduction"></span>
## How attention design changes KV cache costs

At long contexts or large batches, the KV cache easily rivals model weights in GPU memory. For $B$ requests of length $L$ at $P$ bytes per element (2 for FP16/BF16), raw KV payload is:

$$
\text{Memory}_{\text{KV}} = 2 \times B \times L \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times P
$$

Sharing key and value heads across queries shrinks that cache linearly:

1. **MHA:** Every query head owns its own K and V head ($n_{\text{kv\_heads}} = n_{\text{q\_heads}}$).
2. **MQA:** All query heads share a single K and V head ($n_{\text{kv\_heads}} = 1$).[^shazeer2019]
3. **GQA:** Query heads split into $g$ groups sharing one KV head each ($n_{\text{kv\_heads}} = g$), cutting cache size by $n_{\text{q\_heads}} / g$ while keeping quality near MHA.[^ainslie2023]

Compare raw KV cache footprints for an 8-request batch at 8,192 tokens:

<!-- leetllm: test, deps=numpy, output=show, output_title="KV cache comparison output" -->
```python title="gqa-kv-cache-accounting.py"
import numpy as np

batch, layers, tokens, head_dim, bytes_per_val = 8, 32, 8192, 128, 2
query_heads = 32
labels = ["MHA", "GQA", "MQA"]
kv_heads = np.array([32, 8, 1])

payload_bytes = 2 * batch * layers * tokens * kv_heads * head_dim * bytes_per_val
cache_gib = payload_bytes / (1024 ** 3)
relative = kv_heads / query_heads

for label, heads, gib, rel in zip(labels, kv_heads, cache_gib, relative):
    print(f"{label:3s} | kv_heads={heads:2d} | cache={gib:5.2f} GiB | relative={rel:.3f}")
```

<!-- leetllm: output:start -->
```text title="KV cache comparison output" output compact
MHA | kv_heads=32 | cache=32.00 GiB | relative=1.000
GQA | kv_heads= 8 | cache= 8.00 GiB | relative=0.250
MQA | kv_heads= 1 | cache= 1.00 GiB | relative=0.031
```
<!-- leetllm: output:end -->

8-head GQA saves **24 GiB** over 32-head MHA on this batch alone. Next, verify RoPE's shift invariance directly in 2D: shifting both positions `(4, 2)` to `(14, 12)` keeps the inner product identical while changing the gap to `(14, 2)` changes it:

<!-- leetllm: test, deps=numpy, output=show, output_title="RoPE relative position output" -->
```python title="rope-relative-position.py"
import numpy as np

def rot_2d(pos: int, theta: float = 0.4) -> np.ndarray:
    angle = pos * theta
    c, s = np.cos(angle), np.sin(angle)
    return np.array([[c, -s], [s, c]])

q = np.array([1.0, 0.2])
k = np.array([0.3, 0.9])

same_gap_early = float((rot_2d(4) @ q) @ (rot_2d(2) @ k))
same_gap_late = float((rot_2d(14) @ q) @ (rot_2d(12) @ k))
different_gap = float((rot_2d(14) @ q) @ (rot_2d(2) @ k))

print("same gap (4, 2):  ", round(same_gap_early, 6))
print("same gap (14, 12):", round(same_gap_late, 6))
print("diff gap (14, 2): ", round(different_gap, 6))
print("shift invariant:  ", bool(np.isclose(same_gap_early, same_gap_late)))
```

<!-- leetllm: output:start -->
```text title="RoPE relative position output" output compact
same gap (4, 2):   0.936998
same gap (14, 12): 0.936998
diff gap (14, 2):  -0.794779
shift invariant:   True
```
<!-- leetllm: output:end -->

Modern runtimes pair head sharing with **FlashAttention** (tiling attention in fast GPU SRAM to avoid writing $T \times T$ score matrices to HBM)[^dao2022] and **PagedAttention** (storing KV caches in non-contiguous physical pages to eliminate memory fragmentation).[^kwon2023]

## Sparse architectures: Mixture of Experts (MoE)

A **sparsely gated Mixture-of-Experts (MoE)** layer replaces one wide dense MLP with $E$ parallel experts and a router that activates only the top-$k$ experts per token:[^shazeer2017][^jiang2024] $H(x) = \operatorname{Softmax}(\operatorname{Top-}k(x W_g))$ and output $\sum_{i \in \text{Top-}k} H(x)_i \operatorname{Expert}_i(x)$.

### The fundamental MoE tradeoff: VRAM versus FLOPs

Mixtral 8x7B holds **47B total parameters** across 8 experts per layer while running only **13B active parameters** per token.[^jiang2024] Active parameters govern per-token FLOPs, whereas total parameters govern resident GPU VRAM: at 2 bytes per weight, 47B parameters still occupy **94 GB (87.54 GiB)** before KV cache or activations.[^huggingface2026acceleratebigmodel] Keeping routers balanced across experts requires either an auxiliary load-balancing loss or dynamic per-expert routing biases as in DeepSeek-V3.[^deepseekv3_2024]

Trace a top-2 router in NumPy across four experts:

<!-- leetllm: test, deps=numpy, output=show, output_title="MoE routing output" -->
```python title="top-two-expert-router.py"
import numpy as np

experts = ["E0", "E1", "E2", "E3"]
tokens = ["import", "assertion"]
router_logits = np.array([
    [2.4, 0.3, 0.5, -0.2],
    [0.1, 2.2, 0.7, 0.0],
])
expert_outputs = np.array([
    [1.0, 0.0, 0.5],
    [0.2, 1.0, -0.1],
    [0.0, 0.4, 1.2],
    [-0.5, 0.2, 0.3],
])

for token, logits in zip(tokens, router_logits):
    top_idx = np.argsort(-logits)[:2]
    top_logits = logits[top_idx]
    weights = np.exp(top_logits - top_logits.max())
    weights /= weights.sum()
    mixed = weights @ expert_outputs[top_idx]
    routes = [(experts[int(i)], round(float(w), 3)) for i, w in zip(top_idx, weights)]
    print(f"{token:10s} -> {routes} | out={np.round(mixed, 3)}")
```

<!-- leetllm: output:start -->
```text title="MoE routing output" output compact
import     -> [('E0', 0.87), ('E2', 0.13)] | out=[0.87  0.052 0.591]
assertion  -> [('E1', 0.818), ('E2', 0.182)] | out=[0.164 0.891 0.137]
```
<!-- leetllm: output:end -->

> **Common mistake:** Sizing GPU memory from a MoE model's *active* parameters. Unless experts are offloaded to CPU with heavy transfer latency, every inactive expert stays resident in VRAM, so budget weight memory from *total* parameters.

<span id="reasoning-models-and-test-time-compute"></span>
## Reasoning models and the cost of extra inference compute

Standard decoding writes answer tokens immediately after the prompt. **Test-time compute** spends extra generated tokens on internal verification, backtracking, or search to raise accuracy on multi-step math, code, and logic. OpenAI o1 and DeepSeek-R1 popularized training models with reinforcement learning to produce structured reasoning traces before answering.[^openai_learning_reasoning_2024][^deepseekr1_2025]

APIs such as OpenAI's Responses API expose a `reasoning.effort` control to dial that inference budget per request.[^openai2026reasoning] Because reasoning tokens consume context space and bill as output tokens even when hidden, leave sufficient `max_output_tokens` headroom and verify that higher effort improves held-out accuracy within your latency and cost limits.

## Open weights, licensing, and local serving

**"Open weights"** means you can download the tensor files, not that the checkpoint is unrestricted open source. Meta's original LLaMA release restricted weights to non-commercial research, establishing that license terms must be checked before commercial use.[^touvron2023][^meta2023OriginalLlamaRelease]

| Category | Meaning | What to check |
|---|---|---|
| **Open weights** | Tensors are downloadable under published terms | Commercial caps, acceptable use, redistribution |
| **Open-source software** | Code satisfies the Open Source Definition | Repository and dependency licenses |
| **Open-source AI (OSI)** | Freedom to use, study, modify, and share with documented data info | Training code and data information[^osi2024] |
| **Open data** | Datasets released under stated usage licenses | Downstream training permissions |

Comparing two open-weight releases shows why checkpoint manifests and license clauses matter:

| Model release | Published specifications | Operational implications |
|---|---|---|
| **GLM-5.3** | 1M-token context window atop GLM-5.2.[^zai2026glm53guide][^zai2026glm53] | Custom license adds review rules for large MaaS providers;[^zai2026glm53CurrentLicense] verify exact tensor sizes against the GLM-5 paper's 744B/40B specs.[^glm52026] |
| **DeepSeek-V4.1-Flash** | MIT-licensed 552B backbone, 1M context, 8B active prefill / 16B active decode.[^deepseek2026v41flash] | Uses compressed caches, conditional memory, and speculative decoding that require matching runtime kernels. |

Pin exact checkpoint hashes or versioned API snapshots rather than floating aliases (which providers can silently redirect, as with DeepSeek's `deepseek-flash` alias routing to newer snapshots).[^deepseek2026v4flash0731release]

## Evaluating a released model on your workload

Public leaderboards narrow the shortlist, but real deployment choices hinge on your prompts, latency ceiling, license rules, and unit cost. Score three candidates (`hosted-fast`, `hosted-deep`, `local-restricted`) across an interactive IDE budget (`p95 <= 750 ms`) and an offline batch job by masking out ineligible models with $-\infty$ before ranking:

<!-- leetllm: test, deps=numpy, output=show, output_title="Workload scorecard output" -->
```python title="model-workload-scorecard.py"
import numpy as np

names = np.array(["hosted-fast", "hosted-deep", "local-restricted"])
quality = np.array([0.86, 0.94, 0.90])
p95_ms = np.array([250.0, 1200.0, 500.0])
cost_usd = np.array([0.50, 1.50, 0.20])
license_ok = np.array([True, True, False])

scenarios = [
    ("interactive IDE", 750.0, 0.03, 8.0),
    ("batch benchmark", np.inf, 0.003, 4.0),
]

for title, max_p95, w_lat, w_cost in scenarios:
    eligible = license_ok & (p95_ms <= max_p95)
    scores = 100.0 * quality - w_lat * p95_ms - w_cost * cost_usd
    masked_scores = np.where(eligible, scores, -np.inf)
    best = int(np.argmax(masked_scores))
    elig_list = ",".join(names[eligible].tolist())
    print(f"{title:15s} | eligible={elig_list:23s} | winner={names[best]} ({masked_scores[best]:.2f})")
```

<!-- leetllm: output:start -->
```text title="Workload scorecard output" output compact
interactive IDE | eligible=hosted-fast             | winner=hosted-fast (74.50)
batch benchmark | eligible=hosted-fast,hosted-deep | winner=hosted-deep (84.40)
```
<!-- leetllm: output:end -->

Hard boolean masks disqualify ineligible models before linear scoring so high accuracy or low price can never override a missed latency deadline or license restriction.

<span id="context-window-scaling-and-lost-in-the-middle"></span>
## Longer context and the evidence that gets missed

Accepting 128k or 1M tokens proves input capacity, not uniform recall at every offset. Liu et al. (2023) shifted the single answer-bearing document across positions 1 to 20 and found a striking **U-shaped curve**: accuracy stayed high at the start and end while dropping sharply in the middle.[^liu2023lost]

<figure>
  <img src="illustrations/_generated/lost_in_the_middle_dark.png" alt="A 20-document context window tests evidence slots 1, 5, 10, 15, and 20 with 20 questions each. Accuracy forms a U-shaped curve: 15 of 20 at slot 1, 10 of 20 at slot 5, 7 of 20 in the middle at slot 10, 10 of 20 at slot 15, and 14 of 20 at slot 20." />
  <figcaption>Twenty retrieved documents hold one evidence passage shifted across positions 1, 5, 10, 15, and 20, illustrating the U-shaped middle retrieval drop characterized by Liu et al.</figcaption>
</figure>

To separate positional degradation from question difficulty, hold the exact passage constant while sweeping its slot across the prompt and fitting the accuracy curve:

<!-- leetllm: test, deps=numpy, output=show, output_title="Position sweep curve output" -->
```python title="position-sweep-curve.py"
import numpy as np

slots = np.array([1, 5, 10, 15, 20], dtype=float)
correct = np.array([15, 10, 7, 10, 14], dtype=float)
accuracy = correct / 20.0

edge_mean = float(0.5 * (accuracy[0] + accuracy[-1]))
mid_acc = float(accuracy[2])
quad_fit = np.polyfit(slots, accuracy, deg=2)

for slot, count, acc in zip(slots, correct, accuracy):
    print(f"slot={int(slot):2d} | {int(count):2d}/20 | accuracy={acc:.0%}")
print(f"edge_mean={edge_mean:.3f} | middle={mid_acc:.3f} | edge_minus_mid={edge_mean - mid_acc:.3f}")
print(f"quadratic x^2 coeff={quad_fit[0]:.5f} (positive confirms U-shape)")
```

<!-- leetllm: output:start -->
```text title="Position sweep curve output" output compact
slot= 1 | 15/20 | accuracy=75%
slot= 5 | 10/20 | accuracy=50%
slot=10 |  7/20 | accuracy=35%
slot=15 | 10/20 | accuracy=50%
slot=20 | 14/20 | accuracy=70%
edge_mean=0.725 | middle=0.350 | edge_minus_mid=0.375
quadratic x^2 coeff=0.00386 (positive confirms U-shape)
```
<!-- leetllm: output:end -->

### Practical prompt packing mitigations

Three habits counter positional forgetting and cut prefill cost:

1. **Separate instructions from retrieved text:** Keep directives in the system/developer role and delimit retrieved passages cleanly.
2. **Put decisive evidence at the edges:** Place top-ranked retrieved snippets near the start or right before the question, and test ordering on held-out queries.
3. **Prune low-value filler:** Trimming redundant chunks shrinks prefill FLOPs and KV memory while keeping relevant facts near high-attention regions.

Modeling combined primacy and recency weighting shows why placing the key `causal_mask` passage adjacent to the question lifts its salience:

<!-- leetllm: test, deps=numpy, output=show, output_title="Context packing output" -->
```python title="evidence-near-question.py"
import numpy as np

chunks = [
    "Instruction: explain attention behavior using cited source lines.",
    "Note A: RoPE applies pairwise 2D rotations to queries and keys.",
    "Note B: RMSNorm omits mean subtraction across features.",
    "Note C: Weight tying shares embedding and LM head matrices.",
    "Evidence: causal_mask sets future scores (j > i) to -inf before softmax.",
    "Question: how does causal_mask prevent future token leakage?",
]

# Positional query salience combining mild primacy (idx 0..1) and strong recency (idx -> end)
positions = np.arange(len(chunks) - 1, dtype=float)
primacy = np.exp(-0.5 * positions)
recency = np.exp(-0.7 * (positions.max() - positions))
attention = (primacy + 1.5 * recency)
attention /= attention.sum()

for i, (line, w) in enumerate(zip(chunks[:-1], attention), start=1):
    print(f"{i}: weight={w:.3f} | {line}")
print("evidence_adjacent_to_question:", chunks[-2].startswith("Evidence:"))
print("adjacent_evidence_weight:     ", round(float(attention[-1]), 3))
```

<!-- leetllm: output:start -->
```text title="Context packing output" output compact
1: weight=0.209 | Instruction: explain attention behavior using cited source lines.
2: weight=0.151 | Note A: RoPE applies pairwise 2D rotations to queries and keys.
3: weight=0.141 | Note B: RMSNorm omits mean subtraction across features.
4: weight=0.185 | Note C: Weight tying shares embedding and LM head matrices.
5: weight=0.313 | Evidence: causal_mask sets future scores (j > i) to -inf before softmax.
evidence_adjacent_to_question: True
adjacent_evidence_weight:      0.313
```
<!-- leetllm: output:end -->

## Match the architecture to the job

Production systems rarely send every task to one giant decoder. Match each stage to the lightest architecture that fits:

| NLP workload stage | Recommended architecture | Primary selection criterion |
|---|---|---|
| Large-scale document embedding & clustering | Contrastive bidirectional encoder | Evaluate retrieval recall, vector width, and indexing throughput |
| Low-latency code completion | Compact causal decoder (e.g., 1B-8B dense) | Measure time-to-first-token, acceptance rate, and VRAM fit |
| Multi-turn grounded assistant | Chat-tuned decoder or reasoning model | Measure verified grounding, abstention, and tool accuracy |
| High-throughput mixed API traffic | Dense or sparse MoE comparison | Benchmark end-to-end throughput, routing overhead, and VRAM footprint |
| Multi-step symbolic math & verification | Reasoning-tuned model with deterministic checks | Track pass rates alongside total reasoning token budget |

## Common misconceptions

| Misconception | Observable symptom | Root cause | Engineering fix |
|---|---|---|---|
| "GPT means any LLM." | Calling bidirectional encoders or MoE checkpoints "GPT" | Confusing one named architecture family with the whole category | Specify the exact model architecture, training objective, and checkpoint |
| "Encoders are obsolete." | Using a 70B causal generator to tag short text labels | Overlooking small encoder efficiency | Deploy lightweight bidirectional encoders for search, reranking, and tagging |
| "More parameters always win." | Selecting checkpoints by parameter count alone | Ignoring data tokens, training recipe, and serving cost | Compare held-out task quality alongside prefill, decode, and license limits |
| "Open weights mean open source." | Shipping a commercial API on non-commercial checkpoints | Treating downloadable weights as permissive licensing | Inspect checkpoint licenses, redistribution terms, and data notes |
| "Long context guarantees recall." | Burying critical evidence mid-prompt and assuming 100% lookup | Conflating context capacity with uniform retrieval accuracy | Position decisive evidence near prompt edges or queries and test slot sweeps |

## Practice: diagnose three failing deployments

Suppose a prototype documentation and coding assistant exhibits three distinct failures during offline evaluation. Each symptom traces cleanly back to either model checkpoint selection, positional context placement, or sparse parameter memory accounting. Identify the root diagnosis and practical fix for each case before checking the solutions below:

1. **Continuation failure:** Sending `"Explain why causal_mask sets future scores to -inf"` yields `"Explain why rope_theta defaults to 10000\nExplain why RMSNorm omits beta"`.
2. **Long-context miss:** Passing a 20-line module excerpt produces the correct answer, whereas burying those same 20 lines inside a 50,000-token codebase dump makes the assistant reply `"No relevant masking code was provided"`.
3. **GPU out-of-memory crash:** Attempting to load a 47B MoE model (advertising 13B active parameters) onto a single 24 GB GPU fails immediately with CUDA out-of-memory during weight allocation.

```checkpoint
How do you diagnose and resolve each of these three failures?
---
1. Verify you loaded an instruction or chat checkpoint rather than a base model, and inspect the exact chat template tokenization. Base pretraining checkpoints naturally extend prompt syntax by generating similar questions unless aligned and formatted properly.
2. Confirm tokenization did not truncate the context, then test moving the 20-line excerpt toward the beginning or right before the question. If accuracy rebounds at the edges, you are seeing a lost-in-the-middle effect best solved by selective retrieval or edge placement.
3. Active parameters cut per-token compute, not resident VRAM: 47B FP16 weights require roughly 94 GB (87.54 GiB) before any KV cache or activations. Shard across multiple GPUs, quantize aggressively with calibration checks, or move to a dense checkpoint sized cleanly for 24 GB.
```

```mastery-quiz
[
  {
    "question": "A generator outputs 'The category is Attention' when the application parser expects only Attention, Training, or Serving. What should the application do?",
    "options": [
      "Parse or constrain the output to the allowed schema, then score label accuracy on held-out notes.",
      "Strip leading and trailing spaces from the sentence, then accept the full sentence as a schema token.",
      "Append the extra words into the allowed set, then treat full sentences as standard categories.",
      "Match any substring containing a label word inside prose replies without checking negation."
    ],
    "answer": "Parse or constrain the output to the allowed schema, then score label accuracy on held-out notes.",
    "explanation": "Next-token generation can express classification, extraction, and synthesis, yet unconstrained output does not automatically enforce schema validity or correctness. Constraining or strictly parsing complete outputs and measuring held-out accuracy avoids false matches on negated prose such as 'not Attention'."
  },
  {
    "question": "A long prompt projection applies layer weights across 2,048 token rows simultaneously, whereas batch-one cached decode applies them to a single token row. Which hardware bottleneck diagnosis fits best?",
    "options": [
      "Prefill suffers poor weight reuse per row while single-token decode reuses weights heavily.",
      "Prefill achieves high weight reuse across rows while small-batch decode often stalls on memory bandwidth.",
      "Cached decode skips feed-forward projections because stored keys and values contain those activations.",
      "Concurrent batch decode keeps one projection row per step regardless of active request count."
    ],
    "answer": "Prefill achieves high weight reuse across rows while small-batch decode often stalls on memory bandwidth.",
    "explanation": "Applying weights across 2,048 rows amortizes memory loads across heavy matrix arithmetic. Batch-one decode streams weights and past KV tensors for just one token, often limiting speed by HBM bandwidth unless request batching raises row concurrency. Cached decode still computes every token's feed-forward and output projections."
  },
  {
    "question": "A team trains a dense model with 5 billion parameters on 48 billion training tokens. For the next run, it allocates nine times the training compute while scaling parameters and tokens by equal factors under balanced Chinchilla scaling. How many billion training tokens should the new run use?",
    "options": [
      "48",
      "144",
      "432",
      "16"
    ],
    "answer": "144",
    "explanation": "Because dense training compute scales roughly as 6ND, scaling both N and D by 3 multiplies compute by 3 * 3 = 9. Tripling 48 billion yields 144 billion tokens. Keeping 48 billion tokens with tripled parameters would consume only 3x compute, whereas 432 billion tokens with tripled parameters would consume 27x compute."
  },
  {
    "question": "A layer applies standard RMSNorm to [2, 4] with unit learned gain and negligible epsilon. What output values does it produce to three decimal places?",
    "options": [
      "[0.632, 1.265]",
      "[-1.000, 1.000]",
      "[0.447, 0.894]",
      "[0.849, 1.131]"
    ],
    "answer": "[0.632, 1.265]",
    "explanation": "The squared elements are 4 and 16, whose mean is 10. Dividing [2, 4] by sqrt(10) gives [0.632, 1.265]. Mean-centering first gives LayerNorm's [-1.000, 1.000], whereas dividing by L2 norm sqrt(20) gives [0.447, 0.894]."
  },
  {
    "question": "A standard two-matrix FFN has model width 18 and intermediate width 72 with no biases. What hidden width in a bias-free three-matrix SwiGLU branch preserves the exact total parameter count?",
    "options": [
      "72",
      "24",
      "48",
      "108"
    ],
    "answer": "48",
    "explanation": "The two-matrix FFN stores 2 * 18 * 72 = 2,592 weights. A SwiGLU branch splits that budget across three projections (gate, up, down) of width 18 each, leaving 2,592 / (3 * 18) = 48 hidden units."
  },
  {
    "question": "Holding unrotated query and key vectors fixed, what happens to their RoPE attention dot product when both token positions shift forward by seven?",
    "options": [
      "The score shifts with the sum of positions even though content vectors stay constant.",
      "The score remains unchanged because both content vectors and relative displacement n - m stay identical.",
      "The score flips sign because both rotary angles advance in the same positive direction.",
      "The score depends purely on distance and ignores the underlying query and key vectors."
    ],
    "answer": "The score remains unchanged because both content vectors and relative displacement n - m stay identical.",
    "explanation": "Orthogonal rotation matrices satisfy R_m^T R_n = R_{n-m}, so shifting both m and n by +7 cancels inside the inner product whenever unrotated projections are held constant. In trained multilayer models, upstream content vectors still vary with surrounding context."
  },
  {
    "question": "Two models each use 24 query heads, equal head dimensions, and BF16 precision. Model A uses MHA (24 KV heads) while Model B uses GQA (3 KV heads). What fraction of Model A's raw KV cache payload does Model B store?",
    "options": [
      "1/24",
      "1",
      "1/8",
      "7/8"
    ],
    "answer": "1/8",
    "explanation": "Eight query heads share each KV head in Model B, so caching 3 KV heads instead of 24 stores 3/24 = 1/8 of the raw KV payload. MQA would store 1/24, whereas 7/8 represents the fraction of memory saved rather than stored."
  },
  {
    "question": "A team deploys a 60B sparse MoE checkpoint fully resident on GPUs at two bytes per parameter, activating 16B parameters per token. Which memory and compute description is accurate?",
    "options": [
      "32 GB resident weights and 32 GB active weights because inactive experts automatically unload.",
      "120 GB resident weights and 32 GB active weights because inactive experts stay stored in memory.",
      "120 GB resident weights and 120 GB active weights because every token computes all experts.",
      "32 GB resident weights and 120 GB active weights because gating replicates shared matrices."
    ],
    "answer": "120 GB resident weights and 32 GB active weights because inactive experts stay stored in memory.",
    "explanation": "A fully GPU-resident 60B FP16/BF16 model requires 60B * 2 = 120 decimal GB of raw weight storage. Per-token sparse routing executes only the 16B active subset (32 GB worth of parameters) while unused experts remain resident for future tokens."
  },
  {
    "question": "A model accepts 100,000 input tokens yet misses critical facts placed inside long prompts. Which controlled evaluation best separates context length capacity from position-dependent evidence retrieval?",
    "options": [
      "Move the identical target passage across matched start, middle, and end positions and score grounded answers.",
      "Place different passages in the start, middle, and end slots and attribute score gaps strictly to position.",
      "Keep the target passage fixed at position 1 and use early-token attention mass as the retrieval accuracy score.",
      "Place the target passage adjacent to the question once and infer uniform recall over the full context."
    ],
    "answer": "Move the identical target passage across matched start, middle, and end positions and score grounded answers.",
    "explanation": "Holding question difficulty and source wording constant while shifting only the passage's slot isolates positional sensitivity cleanly. Context length capacity proves input acceptance rather than reliable retrieval, and raw attention weights alone do not verify correct synthesis."
  },
  {
    "question": "At low reasoning effort, an API model answers 30 of 50 held-out items correctly across four evaluation splits. High reasoning effort raises accuracy while changing p95 latency and batch spend. Requiring strict improvement over 30/50 verified answers, p95 latency at most 3.0 seconds, and batch cost at most 6 dollars, which split should switch to high effort?",
    "options": [
      "Syntax (44 confident replies, 29 verified correct, 2.4 seconds, 5 dollars)",
      "Extraction (40 confident replies, 38 verified correct, 3.5 seconds, 5 dollars)",
      "Reasoning (39 confident replies, 35 verified correct, 2.8 seconds, 5 dollars)",
      "Summarization (41 confident replies, 37 verified correct, 2.6 seconds, 7 dollars)"
    ],
    "answer": "Reasoning (39 confident replies, 35 verified correct, 2.8 seconds, 5 dollars)",
    "explanation": "Reasoning raises verified correctness from 30 to 35 while staying within both the 3.0-second latency limit (2.8 s) and 6-dollar budget (5 dollars). Syntax drops to 29 verified despite 44 confident replies, Extraction exceeds the 3.0-second latency cap, and Summarization exceeds the 6-dollar budget."
  }
]
```

> **Next:** Continue to [Prompt Engineering Fundamentals](/learn/prompt-engineering-fundamentals). A capable checkpoint still depends on grounded context, clear task framing, and verifiable output schemas. The next lesson examines how prompt design controls behavior when source evidence is partial or conflicting.
