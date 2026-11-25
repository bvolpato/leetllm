---
{
  "id": "transformer-architecture-end-to-end",
  "title": "The Transformer Architecture End-to-End",
  "slug": "transformer-architecture-end-to-end",
  "section": "Core LLM Foundations",
  "category": "Transformer Architecture",
  "difficulty": "Medium",
  "order": 3,
  "coverImage": "illustrations/_generated/transformer_full_architecture_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple",
    "Hugging Face"
  ],
  "shortDescription": "Follow `function returns the` through a causal decoder until the last row becomes a score for the next token.",
  "keyConceptsTested": [
    "Decoder-only Transformer forward path from tokens to next-token logits",
    "Queries, keys, values, scaled dot-product attention, and causal masking",
    "Multi-head shape bookkeeping",
    "Feed-forward sublayers, residual connections, and normalization",
    "Encoder-only, decoder-only, and encoder-decoder visibility rules",
    "Diagnosing mask leakage and shape errors"
  ],
  "aliases": [
    "gpt-to-modern-llms",
    "llm-lifecycle-training-to-deployment"
  ]
}
---

Imagine a model whose training loss plunges toward zero while its generated text is gibberish. The learning rate, data, and optimizer all look fine. The culprit is one missing mask that lets every <span data-glossary="token">token</span> position read the answer in the next column during training.

To catch bugs like that, you have to trace tensors end to end. Follow the prompt `function returns the` through a small decoder-only <span data-glossary="transformer">Transformer</span>: three token IDs become positioned vectors, causal <span data-glossary="self-attention">self-attention</span> lets each position read earlier context without peeking ahead, stacked blocks refine every row while keeping its shape fixed, and a final linear head scores the six-word vocabulary (`function`, `returns`, `the`, `result`, `None`, `value`). At the end, we train a tiny <span data-glossary="pytorch">PyTorch</span> decoder on two contrasting prompts so you can watch attention learn to pull context from position 0 on its own.

<figure>
  <img src="illustrations/_generated/transformer_full_architecture_dark.png" alt="A compact decoder processes the prompt function returns the. Three token IDs map to a 3 by 4 matrix of positioned vectors, pass through repeated causal decoder blocks while keeping shape 3 by 4, and multiply by a vocabulary head to yield 3 by 6 logits. The last row converts to next-token probabilities: result 35.3 percent, value 27.3, None 17.6, the 10.4, returns 6.9, and function 2.5." />
  <figcaption>The hidden stream keeps shape `[B, T, d_model]` (drawn here without its batch axis as `[3, 4]`) through every decoder block, then projects the final row into six next-token scores.</figcaption>
</figure>

Notice what the blocks never change: tensor shape. Three positions and four features go in, and three positions and four features come out, no matter how many blocks you stack.

## Tokens become positioned vectors

Our hidden stream carries shape `[B, T, d_model]` (batch size, sequence length, features per token). Each token ID looks up a row in the embedding table, and positional information marks where that token sits in the sequence. Without position information, unmasked self-attention is permutation equivariant: shuffle input rows and output rows shuffle the same way.[^vaswani2017]

Models inject position in several ways:

1. **Fixed sinusoidal encodings:** The original 2017 Transformer added fixed sine/cosine waves of varying frequencies.[^vaswani2017]
2. **Learned absolute positional embeddings:** GPT and BERT learn a lookup table $W_{\text{pos}} \in \mathbb{R}^{T_{\max} \times d_{\text{model}}}$ and add row $t$ to token $t$ (positions past $T_{\max}$ have no row without modifying the model).[^radford2018][^devlin2019]
3. **Rotary Position Embedding (RoPE):** LLaMA and modern decoders rotate query and key coordinate pairs by position-dependent angles so their dot product depends on relative offset $(m - n)$ via $R_{\Theta, m}^\top R_{\Theta, n} = R_{\Theta, n - m}$.[^su2021][^touvron2023][^dubey2024]
4. **Relative-position biases:** T5 adds learned relative distance biases directly to attention scores.[^raffel2020]

For our tiny hand example, adding explicit position vectors turns `the` (`[0.0, 0.3, 0.8, 1.0]`) at position 2 (`[0.10, 0.0, 0.0, 0.10]`) into `[0.10, 0.3, 0.8, 1.1]`.

## Scaled dot-product attention and the causal mask

An <span data-glossary="recurrent-neural-network">RNN</span> compresses history into one recurrent vector. Self-attention lets every position compute a soft, weighted read directly from visible positions. Each position projects its hidden vector into three learned roles: a **query** ($Q = XW_q$, what this position seeks), a **key** ($K = XW_k$, what each position advertises), and a **value** ($V = XW_v$, what gets blended when matched). Separate $Q$ and $K$ projections allow asymmetric matching instead of symmetric $XX^\top$ raw scores.[^vaswani2017]

For one <span data-glossary="attention-head">attention head</span> of width $d_k$:

$$
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}} + M\right) V
$$

Why divide by $\sqrt{d_k}$? If query and key entries are independent with mean 0 and variance 1, each product $q_i k_i$ has variance 1, so the sum $q \cdot k = \sum_{i=1}^{d_k} q_i k_i$ has variance $d_k$ and standard deviation $\sqrt{d_k}$ (8 at $d_k = 64$, 11.3 at $d_k = 128$). Large score gaps saturate <span data-glossary="softmax">softmax</span> near one-hot weights where gradients vanish; dividing by $\sqrt{d_k}$ restores unit variance at initialization.[^vaswani2017]

Watch one 2D read at `the` (`q = [0.2, 1.2]`): raw dot products `[0.20, 1.28, 0.96]` divided by $\sqrt{2}$ give `[0.141, 0.905, 0.679]`, softmax produces weights `[0.21, 0.44, 0.35]`, and blending the three value vectors returns feature vector `[0.34, 0.65]` (never confuse attention weights with next-token vocabulary probabilities, which arrive only at the final output head!).

<figure>
  <img src="illustrations/_generated/shape_trace_pipeline_dark.png" alt="A separate two-dimensional hand calculation follows the query for the token the. Its scaled dot scores produce attention weights of about 0.21, 0.44, and 0.35 for function, returns, and the, and their value vectors combine to about [0.34, 0.65]. In the four-token training sequence, the future target result is masked from the query at the, and it is absent from the three-token inference calculation." />
  <figcaption>One weighted attention read at `the`. During training on the full four-token sequence, the causal mask blocks the future target `result` by setting its pre-softmax score to $-\infty$.</figcaption>
</figure>

During training on `function returns the result`, every position sits in memory at once. To stop `the` from peeking at `result`, the **<span data-glossary="causal-mask">causal mask</span>** $M$ adds $-\infty$ to every cell where key position $j > i$ before softmax. Setting forbidden cells to `0` fails because $e^0 = 1$ still leaves positive attention mass, whereas $e^{-\infty} = 0$ eliminates future leakage completely:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="detect-mask-leakage.py"
import numpy as np

scores = np.array([
    [2.0, 5.0, 4.0],
    [1.0, 2.0, 6.0],
    [0.5, 1.0, 2.0],
])
future = np.triu(np.ones_like(scores, dtype=bool), k=1)

def softmax_rows(matrix):
    exp = np.exp(matrix - matrix.max(axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)

unmasked = softmax_rows(scores)
masked = softmax_rows(np.where(future, -np.inf, scores))
print("unmasked future mass across rows:", f"{unmasked[future].sum():.3f}")
print("masked future mass across rows:", f"{masked[future].sum():.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
unmasked future mass across rows: 1.940
masked future mass across rows: 0.000
```
<!-- leetllm: output:end -->

Notice also why standard attention scales quadratically in sequence length $T$: forming $QK^\top$ builds a `[T, T]` score matrix per head, so doubling $T$ quadruples score entries while only doubling hidden states and FFN activations.

## Multi-head attention, FFNs, residuals, and normalization

**Multi-head attention** runs $h$ parallel heads of width $d_{\text{head}} = d_{\text{model}} / h$ inside one block, reshaping `[B, T, d_model]` to `[B, h, T, d_head]`, computing attention per head, concatenating back to `[B, T, d_model]`, and applying output projection $W^O$.[^vaswani2017] Keep heads distinct from depth: **heads** run in parallel inside one block on the same input, whereas **blocks** run sequentially with block 2 consuming block 1.

After attention exchanges information across positions, a position-wise **<span data-glossary="feed-forward-network">feed-forward network</span>** (FFN) transforms every token row independently (without mixing positions), expanding to $d_{\text{ff}}$ and projecting back to `d_model` so blocks stay stackable:

$$
\operatorname{FFN}(x) = \operatorname{ReLU}(xW_1 + b_1)W_2 + b_2
$$

Removing the nonlinearity collapses two affine layers into one affine map ($W_1W_2$ with bias $b_1W_2 + b_2$). Modern models like LLaMA use gated **<span data-glossary="swiglu">SwiGLU</span>** ($\operatorname{SwiGLU}(x) = (\operatorname{SiLU}(xW_{\text{gate}}) \odot (xW_{\text{up}})) W_{\text{down}}$) with width $d_{\text{ff}} = \frac{8}{3}d_{\text{model}}$ so its three matrices match the parameter count of a two-matrix $4d_{\text{model}}$ FFN.[^shazeer2020][^touvron2023] Gemma uses **GeGLU**.[^gemmaTeam2024Architecture]

**Residual connections** add each sublayer's update back to its input stream ($x + \operatorname{SubLayer}(x)$), creating an identity path through deep stacks.[^he2015] Normalization placement and statistic shape gradient flow:

- **Post-LN (2017 original):** $x_{l+1} = \operatorname{LayerNorm}(x_l + \operatorname{SubLayer}(x_l))$ puts normalization on the main residual spine, producing large output-layer gradients at initialization that typically require learning-rate warmup.[^vaswani2017][^xiong2020]
- **Pre-LN (GPT-2, LLaMA, our decoder):** $x_{l+1} = x_l + \operatorname{SubLayer}(\operatorname{Norm}(x_l))$ leaves the main residual addition clean (branch derivatives still contribute to total gradients), and adds a final `ln_f` before the vocabulary head.[^radford2019code][^xiong2020]
- **LayerNorm vs RMSNorm:** LayerNorm subtracts feature mean $\mu$ and divides by $\sqrt{\sigma^2 + \epsilon}$ (flattening a constant nonzero row like `[5, 5, 5]` to zeros before affine terms),[^ba2016] whereas **RMSNorm** divides by $\sqrt{\frac{1}{d}\sum x_i^2 + \epsilon}$ without centering (mapping `[5, 5, 5]` near ones), simplifying kernels with comparable quality.[^zhang2019][^touvron2023]

<figure>
  <img src="illustrations/_generated/pre_ln_transformer_block_dark.png" alt="Pre-LN and Post-LN blocks compared left to right across the same 3 by 4 stream. In Pre-LN, a direct identity skip path runs unbroken from input X through two residual additions to output Y while each branch applies LayerNorm before Attention or FFN. In Post-LN, LayerNorm sits directly on the main spine after each residual addition." />
  <figcaption>Pre-LN preserves an unbroken identity path through residual additions while normalizing each branch input; Post-LN places normalization directly on the residual spine.</figcaption>
</figure>

## Build and train a causal decoder in PyTorch

Wire the full causal multi-head attention layer first, asserting zero future attention mass:

<!-- leetllm: test, id=causal-attention, deps=torch, output=show -->
```python title="causal-self-attention.py"
import math
import torch
from torch import nn

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model=8, heads=2):
        super().__init__()
        if d_model <= 0 or heads <= 0 or d_model % heads != 0:
            raise ValueError("d_model and heads must be positive; heads must divide d_model")
        self.heads = heads
        self.d_head = d_model // heads
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.out = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x):
        if x.ndim != 3 or x.shape[-1] != self.qkv.in_features:
            raise ValueError("expected [batch, tokens, d_model] input")
        if x.shape[1] == 0:
            raise ValueError("at least one token is required")
        batch, tokens, d_model = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        def split_heads(tensor):
            return tensor.view(batch, tokens, self.heads, self.d_head).transpose(1, 2)
        q, k, v = map(split_heads, (q, k, v))

        scores = q @ k.transpose(-2, -1) / math.sqrt(self.d_head)
        future = torch.triu(
            torch.ones(tokens, tokens, dtype=torch.bool, device=x.device),
            diagonal=1,
        )
        weights = torch.softmax(scores.masked_fill(future, float("-inf")), dim=-1)
        mixed = weights @ v
        merged = mixed.transpose(1, 2).contiguous().view(batch, tokens, d_model)
        return self.out(merged), weights

torch.manual_seed(4)
x = torch.randn(1, 4, 8)
attention = CausalSelfAttention()
output, weights = attention(x)
future = torch.triu(torch.ones(4, 4, dtype=torch.bool), diagonal=1)
assert torch.all(weights[0, :, future] == 0)
assert torch.allclose(weights.sum(dim=-1), torch.ones_like(weights.sum(dim=-1)))

print("attention output shape:", tuple(output.shape))
print("weights shape:", tuple(weights.shape))
print("largest future weight:", f"{weights[0, :, future].max().item():.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
attention output shape: (1, 4, 8)
weights shape: (1, 2, 4, 4)
largest future weight: 0.000000
```
<!-- leetllm: output:end -->

Production code delegates to `F.scaled_dot_product_attention` (SDPA), which dispatches fused GPU kernels.[^pytorchSdpaDocs2026] Watch two subtle SDPA contracts: boolean `True` means **allow** (the inverse of `masked_fill`), and on non-square KV-cached decoding (`[1, 4]`), `is_causal=True` uses upper-left alignment and silently blinds a query at position 3 to every key except key `0`! Pass an explicit position-aligned mask instead:

<!-- leetllm: test, id=sdpa-comparison, continue=causal-attention, deps=torch, output=show -->
```python title="sdpa-mask-and-cache-alignment.py"
from torch.nn import functional as F

torch.manual_seed(11)
q, k, v = [torch.randn(1, 2, 4, 4) for _ in range(3)]
future = torch.triu(torch.ones(4, 4, dtype=torch.bool), diagonal=1)
scores = q @ k.transpose(-2, -1) / math.sqrt(4)
dense = scores.masked_fill(future, float("-inf")).softmax(-1) @ v
causal = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)
allowed = F.scaled_dot_product_attention(q, k, v, attn_mask=~future, dropout_p=0.0)

# One query at absolute position 3 may read all cached keys at positions 0..3.
last_query = F.scaled_dot_product_attention(
    q[:, :, -1:, :], k, v,
    attn_mask=torch.ones(1, 4, dtype=torch.bool), dropout_p=0.0,
)
misaligned = F.scaled_dot_product_attention(
    q[:, :, -1:, :], k, v, is_causal=True, dropout_p=0.0,
)
only_first_key = torch.allclose(misaligned, v[:, :, :1, :], atol=1e-6)
assert only_first_key and not torch.allclose(misaligned, last_query)
checks = [torch.allclose(causal, dense, atol=1e-6),
          torch.allclose(allowed, dense, atol=1e-6),
          torch.allclose(last_query, dense[:, :, -1:, :], atol=1e-6)]
assert all(checks)
print("causal API matches dense:", checks[0])
print("True-means-allow mask matches:", checks[1])
print("cached last query matches:", checks[2])
print("misaligned cached query reads only key zero:", only_first_key)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
causal API matches dense: True
True-means-allow mask matches: True
cached last query matches: True
misaligned cached query reads only key zero: True
```
<!-- leetllm: output:end -->

Now wrap `CausalSelfAttention` inside a Pre-LN `DecoderBlock` with GELU[^hendrycks2016] and train `TinyDecoder` on two sequences sharing the exact same ending (`returns the`): `function returns the -> result` vs `value returns the -> None`. Because the last two tokens are identical, the model can only separate `result` from `None` by learning causal attention back to position 0:

<!-- leetllm: test, id=decoder-block, continue=sdpa-comparison, deps=torch, output=show -->
```python title="decoder-block.py"
class DecoderBlock(nn.Module):
    def __init__(self, d_model=8, heads=2, d_ff=24):
        super().__init__()
        self.norm1 = nn.LayerNorm(d_model)
        self.attention = CausalSelfAttention(d_model, heads)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Linear(d_ff, d_model),
        )

    def forward(self, x):
        update, _ = self.attention(self.norm1(x))
        x = x + update
        x = x + self.ffn(self.norm2(x))
        return x

torch.manual_seed(5)
x = torch.randn(2, 4, 8, requires_grad=True)
block = DecoderBlock()
output = block(x)
output.square().mean().backward()
assert output.shape == x.shape
assert x.grad is not None and torch.isfinite(x.grad).all()

print("input -> output:", tuple(x.shape), "->", tuple(output.shape))
print("input gradient is finite:", bool(torch.isfinite(x.grad).all()))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input -> output: (2, 4, 8) -> (2, 4, 8)
input gradient is finite: True
```
<!-- leetllm: output:end -->

<!-- leetllm: test, id=complete-decoder, continue=decoder-block, deps=torch, output=show -->
```python title="train-tiny-decoder.py"
vocab = ["function", "returns", "the", "result", "None", "value"]

class TinyDecoder(nn.Module):
    def __init__(self, vocab_size=6, max_len=4, d_model=8, heads=2, d_ff=16):
        super().__init__()
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(max_len, d_model)
        self.block = DecoderBlock(d_model=d_model, heads=heads, d_ff=d_ff)
        self.final_norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)

    def forward(self, ids):
        positions = torch.arange(ids.size(1), device=ids.device)
        x = self.tok_emb(ids) + self.pos_emb(positions)
        x = self.block(x)
        return self.head(self.final_norm(x))

torch.manual_seed(7)
model = TinyDecoder()
# Two sequences sharing "returns the" so attention must read token 0
seqs = torch.tensor([
    [0, 1, 2, 3],  # function returns the result
    [5, 1, 2, 4],  # value    returns the None
])
inputs, targets = seqs[:, :-1], seqs[:, 1:]

with torch.no_grad():
    p_before = model(inputs)[0, -1].softmax(dim=-1)[3].item()

opt = torch.optim.Adam(model.parameters(), lr=0.05)
for step in range(150):
    logits = model(inputs)
    loss = F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1))
    opt.zero_grad()
    loss.backward()
    opt.step()

model.eval()
with torch.no_grad():
    logits = model(inputs)
    probs = logits[:, -1].softmax(dim=-1)

assert logits.shape == (2, 3, len(vocab))
print(f"final cross-entropy loss: {loss.item():.4f}")
print(f"P(result | function returns the): {p_before:.3f} -> {probs[0, 3].item():.3f}")
print(f"P(None   | value    returns the): {probs[1, 4].item():.3f}")
print("top predictions:", [vocab[i] for i in probs.argmax(dim=-1).tolist()])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
final cross-entropy loss: 0.0001
P(result | function returns the): 0.077 -> 1.000
P(None   | value    returns the): 1.000
top predictions: ['result', 'None']
```
<!-- leetllm: output:end -->

> **Key insight:** Both sequences end with `returns the`, yet causal attention learned to pull position 0 (`function` vs `value`) into the final hidden row and separate `result` from `None` cleanly.

To verify causality across the entire network (catching leaks in normalization or any cross-position op, not just one mask), freeze dropout, alter the final token, and confirm earlier output rows stay identical:

<!-- leetllm: test, continue=complete-decoder, deps=torch, output=show -->
```python title="future-input-invariance.py"
prompt = inputs[:1]                # [function, returns, the]
changed = prompt.clone()
changed[:, -1] = 4                 # [function, returns, None]
with torch.no_grad():
    original_logits = model(prompt)
    changed_logits = model(changed)

prefix_unchanged = torch.allclose(original_logits[:, :-1], changed_logits[:, :-1], atol=1e-6)
last_changed = not torch.allclose(original_logits[:, -1], changed_logits[:, -1])
assert prefix_unchanged and last_changed
print("earlier outputs unchanged:", prefix_unchanged)
print("last output changed:", last_changed)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
earlier outputs unchanged: True
last output changed: True
```
<!-- leetllm: output:end -->

The vocabulary head projects `[B, T, d_model]` to `[B, T, V]` <span data-glossary="logits">logits</span>. **Weight tying** shares one $V \times d_{\text{model}}$ matrix between input embeddings and output head (halving those two tables' weight storage while keeping per-row projection compute unchanged).[^vaswani2017][^radford2019code] During sampling, dividing logits by temperature $T > 0$ before softmax ($P(w_i) = \exp(z_i/T)/\sum_j \exp(z_j/T)$) sharpens ($T < 1$) or flattens ($T > 1$) probabilities.

## Visibility families and modern scale upgrades

Changing the visibility mask adapts the same block across three Transformer families: **encoder-only** (full bidirectional visibility for classification, e.g. BERT[^devlin2019]), **decoder-only** (causal lower-triangular visibility for generation, e.g. GPT and Llama[^radford2018][^touvron2023]), and **encoder-decoder** (full source encoder + causal target self-attention + full <span data-glossary="cross-attention">cross-attention</span> from target queries to encoded source, e.g. T5[^raffel2020]).

<figure>
  <img src="illustrations/_generated/encoder_decoder_variants_dark.png" alt="Visibility grids for three Transformer families, where rows are queries and columns are keys. Encoder-only self-attention fills all sixteen cells. Decoder-only self-attention is lower triangular. An encoder-decoder model has two grids: causal target self-attention and full cross-attention, where each target query can read every source position." />
  <figcaption>Rows are queries and columns are keys. Encoder-only reads every position; decoder-only is lower triangular; encoder-decoder pairs causal target self-attention with full source cross-attention.</figcaption>
</figure>

Modern frontier LLMs keep this exact residual-stream skeleton while adding four scale upgrades:

- **From completion to chat:** GPT-1 (117M) pretrained and fine-tuned per task;[^radford2018] GPT-2 (1.5B) popularized Pre-LN and zero-shot prompting;[^radford2019] GPT-3 (175B) unlocked few-shot in-context learning;[^brown2020] InstructGPT used RLHF to turn text continuation into instruction following.[^ouyang2022] Match instruct checkpoints to their exact chat templates,[^huggingface2026chattemplates] and note that "open weights" carries specific licenses rather than automatic open-source status.[^meta2023OriginalLlamaRelease][^osi2024]
- **Prefill, decode, and GQA:** Serving runs parallel **prefill** (compute-bound, populating the <span data-glossary="kv-cache">KV cache</span>)[^huggingface2026kvcache] followed by token-by-token **decode** (memory-bandwidth bound). Raw KV cache scales with KV heads: $\text{Memory}_{\text{KV}} = 2 \cdot B \cdot L \cdot n_{\text{layers}} \cdot n_{\text{kv}} \cdot d_{\text{head}} \cdot P$. Sharing KV heads via **MQA** ($n_{\text{kv}} = 1$)[^shazeer2019] or **GQA**[^ainslie2023] cuts KV memory linearly ($4\times$ to $8\times$).
- **Sparse MoE:** Replaces each dense FFN with $E$ experts executing top-$k$ per token (e.g. Mixtral 8x7B: 47B total vs 13B active parameters).[^jiang2024] Active parameters govern FLOPs; *total* parameters still determine resident VRAM.
- **Long-context recall:** Accepting 128k tokens reflects input capacity rather than flat recall; retrieval often follows a U-shaped **lost-in-the-middle** curve favoring prompt start and end.[^liu2023lost]

| Model | Blocks | Width $d$ | Heads $h$ | Vocabulary $V$ |
|---|---:|---:|---:|---:|
| GPT-2 XL[^gpt2XlConfig2019] | 48 | 1,600 | 25 | 50,257 |
| Llama 3 405B[^dubey2024][^metaLlama3Tokenizer2024] | 126 | 16,384 | 128 | 128,256 |
| gpt-oss-120b[^gptOss120bConfig2025] | 36 | 2,880 | 64 | 201,088 |
| DeepSeek-V4-Pro[^deepseek2026v4modelcard] | 61 | 7,168 | 128 | 129,280 |
| Gemma 4 31B[^gemma431bConfig2026] | 60 | 5,376 | 32 | 262,144 |

## Diagnose a broken forward pass

| Symptom | Likely cause | Check |
|---|---|---|
| Tiny training loss, broken generation | Future tokens leaked through attention | Assert zero future mass and run future-input invariance (dropout off) |
| Head split crashes or scrambles tokens | `d_model % heads != 0` or wrong transpose | Trace `[B, H, T, d_head]`, then merge back to `[B, T, d_model]` |
| Works on CPU, fails on <span data-glossary="gpu">GPU</span> | Causal mask left on CPU | Create masks on `x.device` |
| Blocks refuse to stack | Sublayer changed width early | Keep block output at `d_model`; project to `V` only at the head |
| Softmax returns `NaN` | Row fully masked ($-\infty - (-\infty)$) | Ensure every real query has a visible key |
| Cached SDPA returns only key 0 | `is_causal=True` used on non-square `[1, L]` cache | Pass an explicit absolute-position mask (`True` = allow) |

```checkpoint
You double the prompt from 3 tokens to 6, keeping width 4 and two heads. Which explicit tensors grow fourfold, and which only double?
---
Each head's score and attention-weight matrices grow from `[3, 3]` to `[6, 6]` (4× entries). Hidden states, Q/K/V, and FFN activations double along the token axis; model weights stay fixed.
```

```mastery-quiz
[
  {
    "question": "A token embedding is [0.5, -1.0, 2.0] and its additive position vector is [0.2, 0.1, -0.3]. Which input row enters the first block?",
    "options": [
      "[0.5, -1.0, 2.0]",
      "[0.2, 0.1, -0.3]",
      "[0.7, -0.9, 1.7]",
      "[0.3, -1.1, 2.3]"
    ],
    "answer": "[0.7, -0.9, 1.7]",
    "explanation": "Add each position coordinate to the matching embedding coordinate. The sums are 0.5 + 0.2 = 0.7, -1.0 + 0.1 = -0.9, and 2.0 + (-0.3) = 1.7. The row [0.5, -1.0, 2.0] omits position, and [0.2, 0.1, -0.3] omits the embedding. Subtracting the position vector gives [0.3, -1.1, 2.3]."
  },
  {
    "question": "An attention query [1, -1] reads keys [2, 0] and [0, 1], with values [3, 0] and [0, 6]. At key width 2, which approximate read and interpretation follow?",
    "options": [
      "[2.679, 0.642] as a weighted feature mixture.",
      "[2.858, 0.285] as a weighted feature mixture.",
      "[2.679, 0.642] as next-token vocabulary probabilities.",
      "[1.500, 3.000] as next-token vocabulary probabilities."
    ],
    "answer": "[2.679, 0.642] as a weighted feature mixture.",
    "explanation": "Raw scores are 2 and -1. Dividing by sqrt(2) and normalizing exponentials gives weights near 0.893 and 0.107, so weighted values give [3*0.893, 6*0.107], near [2.679, 0.642]. Omitting scaling gives about [2.858, 0.285], and attention coordinates remain feature vectors rather than vocabulary probabilities."
  },
  {
    "question": "A cached SDPA query is at absolute position 7 and its keys are at positions 0 through 7. With shape [1,8], is_causal=True unexpectedly returns exactly the first key's value. Which fix and mask meaning fit this API?",
    "options": [
      "Keep the upper-left mask where boolean True means allow.",
      "Keep the upper-left mask where boolean True means block.",
      "Use an absolute-position-aligned mask where boolean True means block.",
      "Use an absolute-position-aligned mask where boolean True means allow."
    ],
    "answer": "Use an absolute-position-aligned mask where boolean True means allow.",
    "explanation": "The non-square upper-left causal bias permits only key zero for one query. The real last query may read all eight keys, so construct an explicit position-aligned mask. In SDPA a boolean True permits participation, unlike a future-is-True mask for masked_fill."
  },
  {
    "question": "An equal-split model receives [B=3,T=7,d=18] and has 3 query heads per block. Which query and score shapes and block dependency are correct?",
    "options": [
      "Q [3,3,7,6] and scores [3,3,7,7] while blocks share the original input in parallel.",
      "Q [3,3,7,6] and scores [3,3,7,7] where block 2 consumes block 1.",
      "Q [3,3,3,18] and scores [3,3,3,3] where block 2 consumes block 1.",
      "Q [3,3,7,18] and scores [3,3,7,7] while blocks share the original input in parallel."
    ],
    "answer": "Q [3,3,7,6] and scores [3,3,7,7] where block 2 consumes block 1.",
    "explanation": "Head width is 18/3=6, every head retains all seven positions, and each query scores seven keys. Heads may run in parallel inside a block, while blocks form a sequential residual-stream chain. Copying width 18 into each equal-split head or splitting tokens changes the attention layout."
  },
  {
    "question": "A constant row [5,5,5] uses unit learned scales, zero LayerNorm shift and a small positive epsilon. Which LayerNorm and RMSNorm outputs and Pre-LN gradient property follow?",
    "options": [
      "Near ones then zeros, with a direct path guaranteeing nonvanishing gradients.",
      "Zeros then near ones, with a direct path guaranteeing nonvanishing gradients.",
      "Near ones then zeros, while branch derivatives still affect gradients.",
      "Zeros then near ones, while branch derivatives still affect gradients."
    ],
    "answer": "Zeros then near ones, while branch derivatives still affect gradients.",
    "explanation": "Centering the constant row gives zeros before LayerNorm's affine terms. RMSNorm does not subtract its mean and returns values near one here. Pre-LN adds a direct identity path, while branch derivatives and products across updates still affect gradients."
  },
  {
    "question": "One FFN removes the activation between two affine layers. At model width 15, a separate bias-free SwiGLU branch must store the same number of matrix weights as a bias-free two-matrix FFN of intermediate width 60. What map does the first FFN now compute, and what intermediate width does SwiGLU need?",
    "options": [
      "The first becomes affine, and the gated width is 40.",
      "The first remains nonlinear, and the gated width is 40.",
      "The first becomes affine, and the gated width is 60.",
      "The first remains nonlinear, and the gated width is 60."
    ],
    "answer": "The first becomes affine, and the gated width is 40.",
    "explanation": "Without the activation, the two matrices multiply into one matrix and the biases combine into one offset. The resulting map is affine even if the intermediate layer is wide. The plain branch stores 2 * 15 * 60 = 1,800 weights. Each intermediate feature in SwiGLU uses 15 weights in each of three projections (gate, up, and down), so 1,800 / 45 = 40 features fit. Using width 60 would require 2,700 weights."
  },
  {
    "question": "Hidden states are [2,5,7] and the vocabulary has 19 entries. After tying compatible input and output tables, which logits shape, shared weight count and projection-work conclusion follow?",
    "options": [
      "[2,5,7] with 133 shared weights and unchanged projection work.",
      "[2,5,19] with 266 shared weights and halved projection work.",
      "[2,5,19] with 133 shared weights and unchanged projection work.",
      "[2,19] with 266 shared weights and halved projection work."
    ],
    "answer": "[2,5,19] with 133 shared weights and unchanged projection work.",
    "explanation": "The head maps each seven-feature row to 19 scores, producing [2,5,19]. One tied table holds 19 * 7 = 133 weights rather than 266 in two separate tables. Tying storage does not remove the per-row vocabulary matrix multiply."
  },
  {
    "question": "Task A uses an encoder to classify a complete product review. Task B uses an encoder-decoder to translate that review as target tokens arrive. Which paired attention visibility rule fits?",
    "options": [
      "A reads its input causally while B uses causal targets and all encoded source positions.",
      "A reads its whole input while B uses causal targets and all encoded source positions.",
      "A reads its whole input while B lets targets read future target tokens and all source positions.",
      "A reads its input causally while B lets targets read future target tokens and all source positions."
    ],
    "answer": "A reads its whole input while B uses causal targets and all encoded source positions.",
    "explanation": "The encoder can read both left and right input context. In the encoder-decoder, target self-attention is causal and cross-attention reads the completed encoded source. Future target access would leak unavailable answers."
  },
  {
    "question": "Trace A compares two runs of unchanged inputs with different active dropout masks. Trace B disables dropout, holds weights and earlier inputs fixed, changes only a future input, and observes earlier outputs change. Which trace proves a causal-path leak under these controls?",
    "options": [
      "B proves a failure, whereas A alone does not.",
      "A proves a failure, whereas B alone does not.",
      "Both prove a failure independently.",
      "Neither proves a failure under these controls."
    ],
    "answer": "B proves a failure, whereas A alone does not.",
    "explanation": "Trace A can differ because the random dropout masks differ. Trace B controls that source of variation and detects a violation of future-input invariance. Check earlier layers and other cross-position operations as well as the final attention mask."
  },
  {
    "question": "A two-entry vocabulary has logits [ln(16), 0]. Apply temperature 2 before softmax. What are the probabilities in the same order?",
    "options": [
      "[16/17, 1/17]",
      "[1/2, 1/2]",
      "[256/257, 1/257]",
      "[4/5, 1/5]"
    ],
    "answer": "[4/5, 1/5]",
    "explanation": "Divide both logits by 2 to get [ln(4), 0]. Their exponentials are 4 and 1, so dividing by their sum gives [4/5, 1/5]. Skipping temperature gives [16/17, 1/17]. Dividing those probabilities by 2 and renormalizing also leaves them unchanged. Multiplying the logits by 2 gives masses 256 and 1, hence [256/257, 1/257]. For these unequal logits, the shares approach [1/2, 1/2] as temperature grows, but they still differ at temperature 2."
  }
]
```

> **Next:** Continue to [Language Modeling & Next Tokens](/learn/language-modeling-next-token-prediction).
