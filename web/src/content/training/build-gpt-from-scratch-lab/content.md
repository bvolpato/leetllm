---
{
  "id": "build-gpt-from-scratch-lab",
  "title": "Build GPT from Scratch Lab",
  "slug": "build-gpt-from-scratch-lab",
  "aliases": [
    "decoder-only-lm-pretraining-lab"
  ],
  "section": "Training, Fine-Tuning & Alignment",
  "category": "Fine-Tuning & Training",
  "difficulty": "Hard",
  "order": 3,
  "coverImage": "illustrations/_generated/pretraining_lab_dark.png",
  "companies": [
    "OpenAI",
    "Meta",
    "Anthropic",
    "Google",
    "DeepMind"
  ],
  "shortDescription": "A tiny Shakespeare model can move from `And the I the` to `I'll do` and still be wrong. Train the pipeline, then separate learning from a shifted target or a leaked future token.",
  "keyConceptsTested": [
    "decoder-only causal LM objective",
    "GPT-style subword tokenization",
    "active-vocabulary remapping",
    "shifted labels for next-token loss",
    "train vs validation splits",
    "sampling from a trained checkpoint",
    "checkpoint save and resume",
    "failure modes in tiny pretraining runs",
    "why pretraining is one integrated pipeline"
  ],
  "prerequisites": [
    "transformer-architecture-end-to-end",
    "language-modeling-next-token-prediction",
    "pytorch-training-loops",
    "pre-training-data-pipelines-scale"
  ],
  "relatedQuestions": [
    "pytorch-training-loops",
    "pre-training-data-pipelines-scale",
    "supervised-fine-tuning-pipeline",
    "scaling-laws-compute-optimal-training"
  ]
}
---

Start from random weights and run 81 gradient steps on Shakespeare. Prompt the network with `Good sir,\nSpeak plain.\n` and it babbles: `And the I the`. Keep training for another 240 updates, and the exact same prompt starts producing English contractions, speaker cadence, and phrases like `I'll do` and `The lord ?` right on your CPU.

Yet a falling training loss can fool you completely. Forget the causal attention mask, or forget to shift labels by one token, and the loss plummets toward zero while the model learns nothing but to copy its own input. Building a GPT from scratch is the fastest way to see how tokenization, vocabulary compaction, shifted targets, causal masking, optimization, checkpointing, and sampling lock together as one system.[^cs336Stanford2026]

Inspired by Karpathy's `nanoGPT` (and its successor [nanochat](https://github.com/karpathy/nanochat)), this lab builds a clean, self-contained decoder-only Transformer using GPT-2's byte-level <span data-glossary="bpe">byte pair encoding (BPE)</span>.[^karpathy2025nanogpt][^radford2019] Download the bundled Shakespeare corpus here: [Download `shakespeare.txt`](assets/shakespeare.txt) (4.5 MB, larger than Tiny Shakespeare).[^princeton2020shakespeare] Everything runs on a single CPU in float32 using PyTorch and `tiktoken`, starting from freshly initialized random weights with zero pretrained weights loaded.

## The causal LM contract

Every autoregressive language model obeys one core rule: at position $t$, the network reads only the prefix $x_{\le t}$ and outputs a probability distribution over the vocabulary for the next token $x_{t+1}$. Because PyTorch happily executes a buggy training loop without raising an error, keep five pieces aligned from end to end:

- Convert raw text into discrete BPE token IDs
- Restrict position $t$ to attend only to keys $s \le t$
- Compute cross-entropy loss against the shifted target token $x_{t+1}$
- Update parameters on random context windows from the training stream
- Judge progress with both held-out validation loss and real generated samples

When any one of those pieces drifts, loss can still look healthy while generation breaks. Let's inspect the architecture and check every boundary before running our first gradient step.

## Five moving parts

Our compact GPT uses batch size 12, context length $T = 48$, hidden dimension $d_{\text{model}} = 96$, 4 attention heads, and 2 Pre-LN decoder layers. A batch enters as integer token IDs of shape `[12, 48]` and leaves as next-token logits of shape `[12, 48, 17485]`.

| Component | Responsibility | Classic bug |
|---|---|---|
| **Corpus** | Supplies the empirical token stream | Confusing total corpus size with the fraction actually sampled |
| **Tokenizer** | Maps UTF-8 text into GPT-2 <span data-glossary="subword-tokenization">subword</span> IDs | Decoding individual multi-byte pieces separately |
| **Active-vocab remap** | Compresses sparse GPT-2 IDs into a dense local range | Comparing loss values across different vocabulary sizes |
| **Block packer** | Slices the stream into windows `x` and shifted targets `y` | Off-by-one labels, or splicing distant chunks together |
| **Decoder loop** | Runs masked <span data-glossary="self-attention">self-attention</span>, updates, and checkpoints | Missing the causal mask, or trusting loss without sampling text |

Start with the vocabulary footprint. Full GPT-2 has 50,257 token IDs, of which Shakespeare uses only 17,485. Remapping those active IDs into `0..17484` shrinks the tied embedding/output table by 65.2% (cutting ~62.3% of the model's total parameters) so training runs quickly on CPU.[^radford2019] Because our model shares weights between the input token <span data-glossary="embedding">embedding</span> and final output projection just like GPT-2,[^radford2019code] each hidden state projects back to <span data-glossary="logits">logits</span> through the transpose of the embedding matrix:

$$
\text{logits}_t = h_t W_e^T, \quad W_e \in \mathbb{R}^{V_{\text{active}} \times d_{\text{model}}}
$$

We build the active-ID map across the whole file before splitting (335 of the 17,485 IDs appear only in the final 10% validation slice) so validation tokens remain representable without an unknown-token fallback; in an independent benchmark, build the vocabulary from training data only. Sampled local IDs are reverse-mapped back to GPT-2 IDs before decoding.

<figure>
  <img src="illustrations/_generated/active_vocabulary_remap_dark.png" alt="GPT-2's 50,257 IDs are compared with the 17,485 active IDs in this corpus. Six example BPE pieces map GPT-2 IDs to local IDs. The tied embedding and output table contains 4,824,672 weights at full size and 1,678,560 with the active vocabulary. The inverse map converts sampled local IDs back to GPT-2 IDs." />
  <figcaption>Compacting GPT-2's 50,257 IDs down to Shakespeare's 17,485 active IDs trims the tied 96-wide embedding/output table by 65.2%, while the inverse map restores GPT-2 IDs for decoding.</figcaption>
</figure>

> **Key insight:** Compacting the vocabulary is *not* a loss-preserving relabeling. Removing unused tokens shrinks the softmax denominator, so absent tokens stop competing for probability mass and stop receiving negative output gradients.

Watch an unused token row receive a nonzero gradient through the tied output softmax even though it is neither the input nor the target:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unused-piece-still-receives-gradient.py"
import torch
import torch.nn.functional as F

weights = torch.tensor([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=torch.float64, requires_grad=True)
hidden = weights[0:1]
logits = hidden @ weights.T
F.cross_entropy(logits, torch.tensor([1])).backward()

print("input ID=0, target ID=1")
print("row 2 receives gradient:", bool(weights.grad[2].abs().sum() > 0))
print("row 2 gradient:", [round(float(v), 6) for v in weights.grad[2]])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input ID=0, target ID=1
row 2 receives gradient: True
row 2 gradient: [0.422319, 0.0]
```
<!-- leetllm: output:end -->

Before launching training, compute your **initial loss sanity check**. A uniform guess over $V_{\text{active}} = 17{,}485$ tokens gives an expected cross-entropy loss of:

$$
\mathcal{L}_{\text{uniform}} = -\ln\left(\frac{1}{V_{\text{active}}}\right) = \ln(17485) \approx 9.769\text{ nats/token}
$$

Sure enough, our first logged training batch below starts at `9.775`, right on top of `9.769` (not the full-vocab $\ln(50257) \approx 10.825$). If step 1 ever starts dramatically below $\ln(V)$, check for unshifted labels, a missing causal mask, or a heavily skewed target distribution.

<!-- leetllm: test, output=show -->
```python title="active-vocabulary-parameter-cost.py"
import math

gpt2_vocab, active_vocab, d_model = 50_257, 17_485, 96
full_weights = gpt2_vocab * d_model
compact_weights = active_vocab * d_model

print(f"full vocab tied weights:    {full_weights:,}")
print(f"compact tied weights:       {compact_weights:,} ({1 - compact_weights / full_weights:.1%} smaller)")
print(f"uniform next-token CE loss: {math.log(active_vocab):.3f} nats/token")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full vocab tied weights:    4,824,672
compact tied weights:       1,678,560 (65.2% smaller)
uniform next-token CE loss: 9.769 nats/token
```
<!-- leetllm: output:end -->

## Audit the causal target before training

The most common silent bug in a from-scratch GPT is training each position to predict *itself* ($x_t \to x_t$) instead of its successor ($x_t \to x_{t+1}$). Check the shift on our test prompt before writing any model code:

<!-- leetllm: test, output=show -->
```python title="shifted-next-token-labels.py"
block = ["Good", " sir", ",", "\n", "Spe", "ak", " plain", "."]
x, y = block[:-1], block[1:]

for current, target in zip(x, y):
    print(f"{current!r:>8} -> {target!r}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
  'Good' -> ' sir'
  ' sir' -> ','
     ',' -> '\n'
    '\n' -> 'Spe'
   'Spe' -> 'ak'
    'ak' -> ' plain'
' plain' -> '.'
```
<!-- leetllm: output:end -->

At every position $t$, the model outputs a logit vector $z_t \in \mathbb{R}^V$ scored against $y_t = x_{t+1}$ by cross-entropy:[^radford2019]

$$
\mathcal{L} = -\frac{1}{T} \sum_{t=1}^{T} \log p_\theta\!\left(x_{t+1} \mid x_{\le t}\right) = \frac{1}{T} \sum_{t=1}^{T} \left( -z_{t, y_t} + \log \sum_{v=0}^{V-1} \exp(z_{t, v}) \right)
$$

Flattening logits `[12, 48, 17485]` into `[576, 17485]` and targets `[12, 48]` into `[576]` lets `F.cross_entropy` score every position in one vectorized call. Meanwhile, inside self-attention, a lower-triangular causal mask adds $-\infty$ to all future keys $s > t$ before <span data-glossary="softmax">softmax</span>, ensuring position $t$ can only read keys $0 \dots t$:

```text
1 0 0 0   <- pos 0 sees [0]
1 1 0 0   <- pos 1 sees [0, 1]
1 1 1 0   <- pos 2 sees [0, 1, 2]
1 1 1 1   <- pos 3 sees [0, 1, 2, 3]
```

Now inspect how GPT-2's BPE actually tokenizes `Good sir,\nSpeak`. Notice that `Speak` splits into two subwords (`Spe` + `ak`), and next-token prediction learns both subword spelling and syntax through the exact same shifted loss:

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show -->
```python title="inspect-the-complete-gpt2-sequence.py"
import tiktoken

encoder = tiktoken.get_encoding("gpt2")
text = "Good sir,\nSpeak"
ids = encoder.encode(text)
print("IDs:       ", ids)
print("pieces:    ", [encoder.decode([t]) for t in ids])
print("round trip:", encoder.decode(ids) == text)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
IDs:        [10248, 15967, 11, 198, 5248, 461]
pieces:     ['Good', ' sir', ',', '\n', 'Spe', 'ak']
round trip: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/causal_target_contract_dark.png" alt="Six GPT-2 BPE pieces for Good sir, newline, Speak appear with their IDs. In row q2, at the comma, only keys 0 through 2 are available; future keys are masked. Next-token loss scores z2 against y2 equals x3, the newline token with ID 198." />
  <figcaption>At comma position 2, the causal mask restricts attention to keys 0..2 while shifted labels score its logits against the next token, newline ID 198. The mask governs visibility; the shift governs supervision.</figcaption>
</figure>

```checkpoint
Each target is the next token, but attention can still read every position in the block. Has the model learned a valid causal objective?
---
No. Shifted labels define the next-token target, while the causal mask prevents each position from reading future inputs. Without the mask, position t simply reads x_{t+1} directly from the input.
```

> **Common mistake:** Decoding byte-level BPE tokens one ID at a time and concatenating strings. Multi-byte UTF-8 characters (like emojis or accented symbols) often span multiple BPE tokens, so per-token string decoding corrupts them into `` replacement characters. Always decode the complete token sequence together (or buffer raw bytes via `decode_single_token_bytes` when streaming).[^tiktoken014Core2026]

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show -->
```python title="decode-byte-pieces-together.py"
import tiktoken

encoder = tiktoken.get_encoding("gpt2")
text = "🙂"
ids = encoder.encode(text)
pieces = [encoder.decode_single_token_bytes(t) for t in ids]
separate = "".join(encoder.decode([t]) for t in ids)

print("piece bytes:           ", [p.hex() for p in pieces])
print("separate decode broken:", separate != text, f"({separate.count(chr(0xfffd))} replacement chars)")
print("whole sequence intact: ", encoder.decode(ids, errors="strict") == text)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
piece bytes:            ['f09f', '9982']
separate decode broken: True (3 replacement chars)
whole sequence intact:  True
```
<!-- leetllm: output:end -->

## Split the stream without inventing boundaries

We treat `shakespeare.txt` as one continuous stream and split once along its order: the first 90% for training, the final 10% for validation. Splitting once preserves authentic neighboring transitions inside both splits (interleaving chunks and concatenating them back together creates fake transitions where distant passages collide).

Trace the exact tensor shapes through our two-layer decoder: input IDs `[12, 48]` map to embeddings `[12, 48, 96]`, split into four attention heads `[12, 4, 48, 24]`, form attention matrices `[12, 4, 48, 48]`, pass through the 4x GELU MLP (`96 -> 384 -> 96`), and project via the tied embedding matrix to `[12, 48, 17485]` logits (~40.3 MB in float32 per batch before activations).

<figure>
  <img src="illustrations/_generated/pretraining_lab_dark.png" alt="Token IDs of shape 12 by 48 combine with learned positions to make hidden states of shape 12 by 48 by 96. Each repeated Pre-LN block forms four attention heads, then adds their joined output to h to form u = h + attention(LN1(h)). A second LayerNorm feeds a 96-to-384-to-96 GELU MLP, whose output adds back u to form h-prime. After block two, final normalization and the tied token-embedding transpose produce 17,485 logits at each of 48 positions." />
  <figcaption>Each Pre-LN block normalizes before attention and before the 96→384→96 GELU MLP, adding residual skips around both. After two blocks, the output head reuses the input embedding matrix to emit 17,485 logits per position.</figcaption>
</figure>

## Train, sample, then keep going

Run the six main lab blocks below in sequence (or combine them into `build_gpt_from_scratch.py` beside `assets/shakespeare.txt`):

```bash title="Run the CPU lab"
uv run --python 3.12 --with torch==2.13.0 --with tiktoken==0.14.0 build_gpt_from_scratch.py
```

We train in two phases so you can watch text structure emerge in real time:
1. Train 81 steps with AdamW (`lr=2e-3`) and sample a continuation.
2. Resume the exact same model and optimizer for 240 more steps (321 total, ~185K target tokens) and sample the exact same prompt again.

Four architectural choices mirror GPT-2 cleanly:[^ba2016][^xiong2020][^hendrycks2016][^radford2019code]
- **Pre-LN blocks:** LayerNorm runs *before* attention and the MLP, leaving an unobstructed identity path through the residual stream for clean gradient flow.
- **Fused QKV causal attention:** One linear layer projects `[B, T, 96]` into Q, K, and V, splits into 4 heads (`head_dim=24`), applies the lower-triangular $-\infty$ mask, and recombines.
- **GELU MLP:** Smooth $96 \to 384 \to 96$ feed-forward expansion using $\operatorname{GELU}(x) = x\Phi(x)$.
- **Tied weights:** `self.head.weight = self.token_emb.weight` saves 1.68M parameters and feeds both input lookup and output scoring gradients into the same matrix.

<!-- leetllm: test, id=mini-gpt-early-train, deps=torch==2.13.0,tiktoken==0.14.0, output=show, output_title="Initial training log" -->

```python title="build_gpt_from_scratch.py"
# fold:start imports, BPE corpus loading & batch sampler
from pathlib import Path
import copy
import hashlib
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import tiktoken

torch.set_num_threads(1)
torch.manual_seed(7)

# Load Shakespeare and tokenize with GPT-2 BPE.
corpus = Path("assets/shakespeare.txt").read_text(encoding="utf-8")
corpus_sha256 = hashlib.sha256(corpus.encode("utf-8")).hexdigest()
encoding_name = "gpt2"
encoder = tiktoken.get_encoding(encoding_name)
corpus_token_ids = encoder.encode(corpus)

# Compact sparse GPT-2 IDs into dense local indices 0..V_active-1.
active_token_ids = sorted(set(corpus_token_ids))
token_to_local = {tid: idx for idx, tid in enumerate(active_token_ids)}
local_to_token = {idx: tid for tid, idx in token_to_local.items()}
ids = [token_to_local[tid] for tid in corpus_token_ids]

block_size = 48
batch_size = 12
split_index = int(0.9 * len(ids))
train_ids = torch.tensor(ids[:split_index], dtype=torch.long)
val_ids = torch.tensor(ids[split_index:], dtype=torch.long)

# Separate RNG streams keep validation and sampling from shifting training batches.
train_generator = torch.Generator().manual_seed(101)
val_generator = torch.Generator().manual_seed(202)

print(
    f"tokens={len(ids):,} active_vocab={len(active_token_ids):,} "
    f"train={len(train_ids):,} val={len(val_ids):,}"
)

def sample_batch(source: torch.Tensor, *, generator: torch.Generator) -> tuple[torch.Tensor, torch.Tensor]:
    if source.ndim != 1 or len(source) <= block_size:
        raise ValueError("source must be a 1-D stream with at least block_size + 1 tokens")
    starts = torch.randint(0, len(source) - block_size, (batch_size,), generator=generator)
    x = torch.stack([source[s:s + block_size] for s in starts])
    y = torch.stack([source[s + 1:s + block_size + 1] for s in starts])
    return x, y
# fold:end

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model: int = 96, n_heads: int = 4):
        super().__init__()
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.register_buffer("mask", torch.tril(torch.ones(block_size, block_size, dtype=torch.bool)))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        q = q.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)

        attn = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn = attn.masked_fill(~self.mask[:T, :T], float("-inf")).softmax(dim=-1)
        out = (attn @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.proj(out)

class Block(nn.Module):
    def __init__(self, d_model: int = 96, n_heads: int = 4):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = CausalSelfAttention(d_model, n_heads)
        self.ln2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, 4 * d_model),
            nn.GELU(),
            nn.Linear(4 * d_model, d_model),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.ln1(x))
        x = x + self.ff(self.ln2(x))
        return x

class TinyGPT(nn.Module):
    def __init__(self, vocab_size: int, d_model: int = 96, n_heads: int = 4, n_layers: int = 2):
        super().__init__()
        self.token_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([Block(d_model, n_heads) for _ in range(n_layers)])
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.apply(self._init_weights)
        self.head.weight = self.token_emb.weight  # GPT-2 weight tying

    @staticmethod
    def _init_weights(module: nn.Module) -> None:
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
        if isinstance(module, nn.Linear) and module.bias is not None:
            nn.init.zeros_(module.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, T = x.shape
        positions = torch.arange(T, device=x.device)
        h = self.token_emb(x) + self.pos_emb(positions)[None, :, :]
        for block in self.blocks:
            h = block(h)
        return self.head(self.ln_f(h))

model_config = {"d_model": 96, "n_heads": 4, "n_layers": 2}
model = TinyGPT(vocab_size=len(active_token_ids), **model_config)
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3)

# fold:start validation loss helper
def evaluate(source: torch.Tensor) -> tuple[float, float]:
    was_training = model.training
    model.eval()
    losses, accs = [], []
    with torch.no_grad():
        for _ in range(8):
            x, y = sample_batch(source, generator=val_generator)
            logits = model(x)
            losses.append(F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1)).item())
            accs.append((logits.argmax(dim=-1) == y).float().mean().item())
    model.train(was_training)
    return sum(losses) / len(losses), sum(accs) / len(accs)
# fold:end

def sample_completion(prompt: str, steps: int = 80) -> str:
    sampling_generator = torch.Generator().manual_seed(17)
    prompt_token_ids = encoder.encode(prompt)
    missing_ids = sorted(set(prompt_token_ids) - set(active_token_ids))
    if missing_ids:
        raise ValueError(f"Prompt uses token IDs outside compact vocabulary: {missing_ids}")
    context = torch.tensor([[token_to_local[tid] for tid in prompt_token_ids]], dtype=torch.long)

    was_training = model.training
    model.eval()
    with torch.no_grad():
        for _ in range(steps):
            logits = model(context[:, -block_size:])[:, -1, :]
            top_vals, top_idx = torch.topk(logits, k=min(8, logits.size(-1)), dim=-1)
            probs = torch.softmax(top_vals / 0.9, dim=-1)
            choice = torch.multinomial(probs, num_samples=1, generator=sampling_generator)
            context = torch.cat([context, top_idx.gather(-1, choice)], dim=1)
    model.train(was_training)
    return encoder.decode([local_to_token[int(idx)] for idx in context[0]])

for updates in range(1, 82):
    x, y = sample_batch(train_ids, generator=train_generator)
    logits = model(x)
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if updates in (1, 41, 81):
        val_loss, val_acc = evaluate(val_ids)
        print(f"updates={updates:03d} train={loss.item():.3f} val={val_loss:.3f} val_acc={val_acc:.3f}")

# fold:start save checkpoint snapshot
early_val_loss, early_val_acc = val_loss, val_acc

checkpoint = copy.deepcopy({
    "encoding_name": encoding_name,
    "active_token_ids": active_token_ids,
    "model_config": model_config,
    "block_size": block_size,
    "split_index": split_index,
    "corpus_sha256": corpus_sha256,
    "completed_updates": updates,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "train_generator_state": train_generator.get_state(),
    "val_generator_state": val_generator.get_state(),
})
# fold:end
```

<!-- leetllm: output:start -->
```text title="Initial training log" output compact
tokens=1,255,253 active_vocab=17,485 train=1,129,727 val=125,526
updates=001 train=9.775 val=9.535 val_acc=0.108
updates=041 train=6.428 val=6.416 val_acc=0.151
updates=081 train=5.911 val=6.050 val_acc=0.171
```
<!-- leetllm: output:end -->

In just 81 updates, validation loss drops from `9.535` down to `6.050` nats/token and next-token accuracy climbs to 17.1%. Now prompt this early checkpoint with `Good sir,\nSpeak plain.\n` and read what it generates:

<!-- leetllm: test, id=mini-gpt-early-sample, continue=mini-gpt-early-train, output=show, output_title="Checkpoint 1 sample (81 updates)" -->

```python title="build_gpt_from_scratch_warmup_sample.py"
prompt = "Good sir,\nSpeak plain.\n"
sample = sample_completion(prompt)
print(f"prompt_seen_verbatim={prompt in corpus}")
print("\n".join(line.rstrip() for line in sample.splitlines() if line.strip() or True))
```

<!-- leetllm: output:start -->
```text title="Checkpoint 1 sample (81 updates)" output compact
prompt_seen_verbatim=False
Good sir,
Speak plain.





And the I the

And it .


 and the my the I it ,


 and it and
The I and be I my the it the the my I ,












And

 and my


I
 and




 and

 II
```
<!-- leetllm: output:end -->

At 81 updates, the network has discovered blank lines, punctuation, and high-frequency words (`And`, `the`, `I`, `my`), but not grammar yet. Now keep training the exact same model and AdamW optimizer for another 240 steps (preserving AdamW's accumulated first and second gradient moments):

<!-- leetllm: test, id=mini-gpt-late-train, continue=mini-gpt-early-sample, output=show, output_title="Longer training log" -->

```python title="build_gpt_from_scratch_continue_training.py"
for updates in range(checkpoint["completed_updates"] + 1, 322):
    x, y = sample_batch(train_ids, generator=train_generator)
    logits = model(x)
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if updates in (161, 241, 321):
        late_val_loss, late_val_acc = evaluate(val_ids)
        print(f"updates={updates:03d} train={loss.item():.3f} val={late_val_loss:.3f} val_acc={late_val_acc:.3f}")

print(f"val_loss_improved_by={early_val_loss - late_val_loss:.3f}")
print(f"val_acc_improved_by={late_val_acc - early_val_acc:.3f}")

checkpoint = copy.deepcopy({
    "encoding_name": encoding_name,
    "active_token_ids": active_token_ids,
    "model_config": model_config,
    "block_size": block_size,
    "split_index": split_index,
    "corpus_sha256": corpus_sha256,
    "completed_updates": updates,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "train_generator_state": train_generator.get_state(),
    "val_generator_state": val_generator.get_state(),
})
```

<!-- leetllm: output:start -->
```text title="Longer training log" output compact
updates=161 train=5.775 val=5.747 val_acc=0.170
updates=241 train=5.751 val=5.721 val_acc=0.175
updates=321 train=5.635 val=5.550 val_acc=0.183
val_loss_improved_by=0.500
val_acc_improved_by=0.013
```
<!-- leetllm: output:end -->

Validation loss drops another `0.500` nats (`6.050 -> 5.550`) and accuracy reaches `18.3%`. Now run the exact same prompt and seed on Checkpoint 2:

<!-- leetllm: test, id=mini-gpt-late-sample, continue=mini-gpt-late-train, output=show, output_title="Checkpoint 2 sample (321 updates)" -->

```python title="build_gpt_from_scratch_late_sample.py"
sample = sample_completion(prompt)
print(f"prompt_seen_verbatim={prompt in corpus}")
print("\n".join(line.rstrip() for line in sample.splitlines()))
```

<!-- leetllm: output:start -->
```text title="Checkpoint 2 sample (321 updates)" output compact
prompt_seen_verbatim=False
Good sir,
Speak plain.
For I I will have my am not .
I'll do to I is my good ,

I is the king :
I is you , but you I ,
The lord ?

To you , but ,
I am it you I'll not , you do I have be not to you have you I , and I am not not you have not not the good ,
```
<!-- leetllm: output:end -->

Look at that side-by-side jump: from word soup (`And the I the`) to recognizable Early Modern English phrasing (`For I I will have`, `I'll do`, `I is the king :`, `The lord ?`) inside a 2-layer CPU model after only 321 steps! It still stumbles on agreement and drifts into repetition at the end, which is why looking at generated samples alongside scalar loss is so illuminating.

## How to read the two checkpoints

Held-out validation cross-entropy averages log-likelihood across thousands of positions, while generated samples expose repetition, collapse, and formatting quirks that a scalar average can hide. Read both together:

- Validation cross-entropy fell from `6.050` to `5.550` nats/token.
- Validation next-token accuracy rose from `17.1%` to `18.3%`.
- Fixed-prompt generation moved from disconnected stopwords to contractions, verse line breaks, and short Shakespearean clauses.

<figure>
  <img src="illustrations/_generated/sample_output_guide_dark.png" alt="Validation cross-entropy follows updates 1, 41, 81, 161, 241, and 321, falling from 9.535 to 5.550 nats per token against the analytic uniform reference 9.769. At updates 81 and 321, loss is 6.050 and 5.550, while accuracy is 17.1% and 18.3%. Two outputs use the same prompt and settings: And the I the and And it . at update 81, then I is the king colon and The lord question mark at update 321." />
  <figcaption>Validation cross-entropy drops from the 9.769 uniform baseline to 6.050 at step 81 and 5.550 at step 321, mirrored by the shift from fragmented stopwords to short Shakespearean clauses.</figcaption>
</figure>

Inside `sample_completion`, three levers shape the text you see:
1. **Top-$k$ truncation (`k=8`):** Keeps only the 8 highest-scoring tokens at each step, cutting off low-probability noise at the cost of narrowing tail diversity.[^holtzman2020]
2. **Temperature ($\tau = 0.9$):** Dividing logits by $\tau < 1$ sharpens probabilities toward high-logit tokens without changing their rank order. (For greedy $\tau = 0$, take `argmax` directly rather than dividing by zero.)
3. **Categorical draw (`torch.multinomial`):** Samples one token from the renormalized distribution using a local generator seeded at 17 so comparisons across checkpoints use the exact same randomness.

```checkpoint
Validation loss improves, but fixed-prompt samples become repetitive and collapse onto copied training phrases. Which evidence controls the decision?
---
Hold the checkpoint. Lower held-out loss is useful, but generation checks reveal a behavior regression the scalar average can hide. Compare fixed prompts, overlap checks, and held-out task metrics before picking a checkpoint.
```

## What a resume file has to remember

Saving only `model.state_dict()` is enough for inference, not for exact training continuation. AdamW tracks per-parameter first moments, second moments, and step counts; throwing them away alters the trajectory of future updates.[^loshchilov2019]

A complete resumable checkpoint stores:
- Model weights (`model.state_dict()`)
- Optimizer state (`optimizer.state_dict()`)
- Active vocabulary map (`active_token_ids`)
- Progressed RNG states (`train_generator.get_state()`, `val_generator.get_state()`)
- Model config, completed step count, tokenizer name, split index, and corpus hash

Note why we called `copy.deepcopy` earlier: in PyTorch, `model.state_dict()` returns live views into parameter tensors, so later optimizer steps overwrite an uncopied in-memory dictionary.[^pytorchSavingLoading2026]

<figure>
  <img src="illustrations/_generated/checkpoint_resume_equivalence_dark.png" alt="A checkpoint at update 321 keeps model weights, AdamW moments and step, train and validation RNG states, active vocabulary map, tokenizer, corpus hash, split, and model configuration. In one CPU process, the in-memory and restored paths use the same batch of shape 12 by 48 and run the same forward pass, cross-entropy, and AdamW step 322." />
  <figcaption>Saving weights, AdamW moments, and progressed RNG states at step 321 lets a restored model take step 322 on the exact same batch and land on identical post-update weights.</figcaption>
</figure>

Verify the complete save/reload round trip on step 322 right now (using `weights_only=True` for safe loading):[^pytorchReproducibility2026]

<!-- leetllm: test, id=mini-gpt-round-trip, continue=mini-gpt-late-sample, deps=torch, output=show, output_title="Checkpoint round trip" -->
```python title="build_gpt_checkpoint_round_trip.py"
checkpoint_path = Path("tiny_gpt_checkpoint.pt")
torch.save(checkpoint, checkpoint_path)
restored = torch.load(checkpoint_path, weights_only=True)

resumed_model = TinyGPT(vocab_size=len(restored["active_token_ids"]), **restored["model_config"])
resumed_model.load_state_dict(restored["model_state_dict"])
resumed_optimizer = torch.optim.AdamW(resumed_model.parameters(), lr=2e-3)
resumed_optimizer.load_state_dict(restored["optimizer_state_dict"])

resumed_train_gen = torch.Generator()
resumed_train_gen.set_state(restored["train_generator_state"])

probe_x, _ = sample_batch(val_ids, generator=torch.Generator().manual_seed(303))
model.eval(); resumed_model.eval()
with torch.no_grad():
    same_logits = torch.equal(model(probe_x), resumed_model(probe_x))

expected_x, expected_y = sample_batch(train_ids, generator=train_generator)
resumed_x, resumed_y = sample_batch(train_ids, generator=resumed_train_gen)
same_batch = torch.equal(expected_x, resumed_x) and torch.equal(expected_y, resumed_y)

def one_update(net, opt, x, y):
    net.train()
    loss = F.cross_entropy(net(x).reshape(-1, len(active_token_ids)), y.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()
    return loss.detach()

loss_orig = one_update(model, optimizer, expected_x, expected_y)
loss_resumed = one_update(resumed_model, resumed_optimizer, resumed_x, resumed_y)
same_weights = all(torch.equal(a, b) for a, b in zip(model.parameters(), resumed_model.parameters()))

print(f"checkpoint saved:          {checkpoint_path} (step {restored['completed_updates']})")
print(f"same probe logits:         {same_logits}")
print(f"same next training batch:  {same_batch}")
print(f"same step-322 loss:        {torch.equal(loss_orig, loss_resumed)}")
print(f"same post-update weights:  {same_weights}")
```

<!-- leetllm: output:start -->
```text title="Checkpoint round trip" output compact
checkpoint saved:          tiny_gpt_checkpoint.pt (step 321)
same probe logits:         True
same next training batch:  True
same step-322 loss:        True
same post-update weights:  True
```
<!-- leetllm: output:end -->

Finally, run the **causal perturbation probe** on the trained model: alter tokens at positions 3..7 and measure the maximum logit change at positions 0..2. With the causal mask active, the difference must be exactly `0.0`. Flip the mask to all-`True` and watch future tokens immediately leak backward:

<!-- leetllm: test, continue=mini-gpt-round-trip, deps=torch, output=show -->
```python title="probe-causality-and-boundaries.py"
model.eval()
prefix = train_ids[:8].unsqueeze(0)
changed = prefix.clone()
changed[:, 3:] = (changed[:, 3:] + 1) % len(active_token_ids)

with torch.no_grad():
    masked_diff = (model(prefix)[:, :3] - model(changed)[:, :3]).abs().max().item()

saved_masks = [block.attn.mask.clone() for block in model.blocks]
try:
    for block in model.blocks:
        block.attn.mask.fill_(True)
    with torch.no_grad():
        unmasked_diff = (model(prefix)[:, :3] - model(changed)[:, :3]).abs().max().item()
finally:
    for block, saved in zip(model.blocks, saved_masks):
        block.attn.mask.copy_(saved)

print(f"max logit diff at pos 0..2 WITH causal mask:    {masked_diff:.1e}")
print(f"max logit diff at pos 0..2 WITHOUT causal mask: {unmasked_diff:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
max logit diff at pos 0..2 WITH causal mask:    0.0e+00
max logit diff at pos 0..2 WITHOUT causal mask: 5.2415
```
<!-- leetllm: output:end -->

```checkpoint
A restored model produces identical logits, but its next training batch differs from the uninterrupted run. Is the checkpoint round trip complete?
---
No. Matching logits verifies model weights only. Exact continuation also needs optimizer state, scheduler state, and progressed data/RNG states so the next update sees the same batch and moments.
```

## What this lab kept from GPT-2

Our model follows GPT-2's classic architecture: learned absolute positional embeddings, Pre-LN LayerNorm, multi-head causal attention, a GELU MLP, and tied embeddings.[^radford2019][^radford2019code] Modern open-weight decoders like Llama keep the exact same autoregressive objective while upgrading four building blocks:[^touvron2023a]

| GPT-2 lab component | Modern Llama-style upgrade | Why it changed |
|---|---|---|
| Learned `pos_emb` table | Rotary Position Embeddings (RoPE) | Encodes relative distances directly in Q/K dot products and extends more gracefully to longer contexts[^su2021][^touvron2023a] |
| `nn.LayerNorm` | RMSNorm | Normalizes by root mean square without mean-centering, simplifying the layer norm kernel[^zhang2019][^touvron2023a] |
| GELU MLP ($4\times$ width) | SwiGLU feed-forward | Adds a multiplicative SiLU gate that consistently improves perplexity per FLOP[^shazeer2020][^touvron2023a] |
| Multi-Head Attention (MHA) | Grouped-Query Attention (GQA) | Shares key/value heads across query groups to cut KV-cache memory during inference[^ainslie2023][^touvron2023a] |

Manual attention also materializes the full `[B, H, T, T]` score matrix in memory. In production PyTorch, `F.scaled_dot_product_attention(..., is_causal=True)` computes the exact same mathematical result while automatically dispatching to fused kernels like FlashAttention on CUDA to avoid storing the quadratic score matrix in HBM:[^dao2022][^pytorchSdpaDocs2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="scaled-dot-product-attention-equivalence.py"
import math
import torch
import torch.nn.functional as F

torch.manual_seed(3)
q, k, v = torch.randn(1, 2, 4, 8), torch.randn(1, 2, 4, 8), torch.randn(1, 2, 4, 8)

scores = (q @ k.transpose(-2, -1)) / math.sqrt(q.size(-1))
mask = torch.tril(torch.ones(4, 4, dtype=torch.bool))
manual = scores.masked_fill(~mask, float("-inf")).softmax(dim=-1) @ v
sdpa = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)

print("output shape:    ", tuple(sdpa.shape))
print("max abs diff:    ", f"{(manual - sdpa).abs().max().item():.1e}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
output shape:     (1, 2, 4, 8)
max abs diff:     2.4e-07
```
<!-- leetllm: output:end -->

## Diagnostics and debugging failure modes

When a from-scratch GPT run goes sideways, match the symptom to its fastest diagnostic test:

- **Loss drops near 0.00 in a few steps, but generated text is gibberish:** Suspect unshifted targets (`y = x`) or a broken causal mask. Check the label shift first, then run the future-token perturbation probe above.
- **Scrambled output or index errors after reloading a checkpoint:** Check the inverse vocabulary map (`local_to_token`), prompt token coverage, and saved `model_config`. Decoding a local ID straight through GPT-2's decoder produces valid-looking nonsense without throwing an error.
- **Repetitive loops during generation (`the man to the man to the man`):** Compare across several prompts and decoding settings (higher temperature or wider top-$k$/top-$p$); aggressive truncation and undertrained models both trigger loops.
- **Loss spikes abruptly to NaN:** Locate the first nonfinite activation or gradient, check learning rate and mask rows (an all-masked row produces `softmax(-inf) = NaN`). Gradient clipping bounds finite norms but cannot rescue an already-NaN forward pass.
- **Resumed training diverges on the very next step:** Compare pre-update probe logits, next batch tensors, and AdamW state (`optimizer.state_dict()`). Remember that AdamW decouples weight decay from gradient scaling;[^loshchilov2019] larger runs like `nanoGPT` typically apply weight decay only to 2D weight matrices while excluding 1D biases and LayerNorm scales.[^karpathy2025nanogpt]

<details>
<summary>Additional worked practice</summary>

```checkpoint
Changing input positions 5–7 leaves logits at positions 0–4 unchanged. The same batch stores target y[t]=x[t]. Which diagnosis and repair follow?
---
The causal mask works, because future inputs cannot reach earlier positions, but unshifted labels y[t]=x[t] reward copying the current token. Shift labels to y[t]=x[t+1] while keeping the causal mask intact.
```

```checkpoint
A deterministic sampler draws starts [4, 1, 9, 6] from its initial state. A checkpoint is saved after consuming 4 and 1. What is the next draw after restoring only the initial seed versus restoring the progressed sampler state?
---
4 after restoring the initial seed (it restarts from the beginning); 9 after restoring the progressed state (it continues right where training paused).
```

</details>

```mastery-quiz
[
  {
    "question": "A separate teaching model has 100 vocabulary IDs, 25 active IDs and hidden width 8. It shares one input/output matrix. Which pair states the compact parameter count and the consequence of removing the other output rows?",
    "options": [
      "200 weights; the removed competitors change the softmax denominator.",
      "400 weights; the removed competitors change the softmax denominator.",
      "200 weights; the relabeling preserves the full-vocabulary denominator.",
      "800 weights; the relabeling preserves the full-vocabulary denominator."
    ],
    "answer": "200 weights; the removed competitors change the softmax denominator.",
    "explanation": "One tied matrix has V×d weights, so 25×8=200 instead of 100×8=800. There is no second independent output matrix to count. Reversible ID relabeling preserves retained piece identities, but deleting output competitors changes the normalization denominator and objective."
  },
  {
    "question": "A fresh local-ID stream is [3, 6, 10, 11, 15, 19]. A context uses its first five IDs. For input position 3, which attention-key indices and next-token target are correct?",
    "options": [
      "Keys 0 through 4; target 15.",
      "Keys 0 through 3; target 15.",
      "Keys 0 through 3; target 11.",
      "Keys 0 through 2; target 19."
    ],
    "answer": "Keys 0 through 3; target 15.",
    "explanation": "Position 3 contains 11 and can read keys through itself, indices 0–3. Its shifted successor is 15 at source position 4. Reading key 4 exposes the scored successor; target 11 rewards copying; excluding key 3 and choosing 19 breaks both rules."
  },
  {
    "question": "A loader joins [0, 1, 2] and [9, 10, 11] from a source that runs in order from 0 through 11. Which next-token pair does the loader introduce?",
    "options": [
      "1 → 2",
      "1 → 9",
      "2 → 9",
      "2 → 3"
    ],
    "answer": "2 → 9",
    "explanation": "The loader puts 9 immediately after 2, where the source had 3. The pair 1 → 2 already occurred in the source. Pairing 1 with 9 would skip the retained token 2. The splice removes the original pair 2 → 3."
  },
  {
    "question": "Two deterministic resume branches have identical weights, exact batch and pre-update loss. They use the same learning rate, but their weights differ after one optimizer step. Which missing state is consistent with that first discrepancy?",
    "options": [
      "Different Adam moments and step counters at the completed-step boundary.",
      "Different sampler RNG states after the same batch was supplied to both.",
      "Different decoding temperatures in the separate text-sampling routine.",
      "Different validation RNG states in the separate held-out evaluation."
    ],
    "answer": "Different Adam moments and step counters at the completed-step boundary.",
    "explanation": "Adam moments and its bias-correction counter affect the update, so they can change post-update weights while the same deterministic forward loss remains identical. Sampler progress cannot alter the already supplied identical batch, and the separate sampling temperature and validation RNG do not participate in this training update."
  },
  {
    "question": "A new decoder uses batch 3, context 10, hidden width 64, eight attention heads and 500 local vocabulary IDs. Which pair is its attention-score shape and final logit shape?",
    "options": [
      "Scores [3, 8, 10, 8]; logits [3, 10, 64].",
      "Scores [3, 8, 10, 10]; logits [3, 10, 500].",
      "Scores [3, 8, 10, 8]; logits [3, 10, 500].",
      "Scores [3, 8, 10, 10]; logits [3, 10, 64]."
    ],
    "answer": "Scores [3, 8, 10, 10]; logits [3, 10, 500].",
    "explanation": "Each head has 64/8 = 8 features. The dot product sums over those features to give one score for each of 10 queries against each of 10 keys. A score shape ending in 8 keeps the query’s feature axis. A logit shape ending in 64 stops at the hidden state. The output projection gives each of the 10 positions in all 3 examples one logit for each of 500 vocabulary IDs."
  },
  {
    "question": "A supplied logit vector [3, 2, 0] uses top-2 selection and temperature 1. Its saved map sends local IDs 0, 1, 2 to GPT-2 IDs 11, 198, 461. A CDF sampler draws u=0.80. Which token is appended and then decoded?",
    "options": [
      "Local 0, then GPT-2 ID 11; the first probability is about 0.731.",
      "Local 1, then GPT-2 ID 1; the first probability is about 0.731.",
      "Local 1, then GPT-2 ID 198; the first probability is about 0.731.",
      "Local 2, then GPT-2 ID 461; the retained scores have equal probabilities."
    ],
    "answer": "Local 1, then GPT-2 ID 198; the first probability is about 0.731.",
    "explanation": "Top-2 retains logits 3 and 2. Their normalized probabilities are e/(e+1)≈0.731 and 1/(e+1)≈0.269. The supplied draw 0.80 enters the second bin, local ID 1. Append that local ID and reverse-map it to GPT-2 ID 198, the newline, before decoding. Local 2 was truncated, and local 1 is not original GPT-2 ID 1."
  },
  {
    "question": "A streaming byte decoder receives hexadecimal E2 82 and then AC for one intended UTF-8 character. What preserves the supplied bytes and produces the intended text?",
    "options": [
      "Decode each fragment with replacement, then join the resulting strings.",
      "Discard the incomplete first fragment, then decode the second fragment.",
      "Convert each byte into an independent character, then join those characters.",
      "Buffer the first fragment, append the second, then decode the bytes once."
    ],
    "answer": "Buffer the first fragment, append the second, then decode the bytes once.",
    "explanation": "E2 starts a three-byte UTF-8 sequence. Keeping E2 82 until AC arrives lets the decoder read E2 82 AC as €. Decoding the fragments separately with replacement gives two replacement characters. Discarding E2 82 leaves AC without a leading byte. Treating each byte as a character turns one character into three."
  },
  {
    "question": "A compact checkpoint has a fixed 25-ID support and a saved inverse map. Its GPT-2 tokenizer emits valid original ID 50000 for a new prompt piece, but that ID has no local entry. Which action handles this safely?",
    "options": [
      "Reject the missing piece before lookup and keep the saved support unchanged.",
      "Use original ID 50000 as a local index and keep the saved support unchanged.",
      "Append a new local row with untrained weights and keep the same checkpoint claim.",
      "Retokenize the prompt with a different encoder and keep the saved inverse map."
    ],
    "answer": "Reject the missing piece before lookup and keep the saved support unchanged.",
    "explanation": "A valid full-tokenizer ID can be outside this checkpoint’s compact support. The lab declares rejection rather than inventing a local meaning. Original ID 50000 is outside local indices 0–24; a new row changes the model/support and needs its own training/version decision; another tokenizer invalidates the stored map."
  },
  {
    "question": "Two causal attention implementations run on the same CPU batch with the same mask. At one output coordinate they give 0.62 and 0.63. With the same upstream gradient, the gradients at one input coordinate are 0.14 and 0.18. Each check allows an absolute difference of 0.02. A separate GPU log identifies FlashAttention as the replacement kernel. Which conclusion belongs in the test report?",
    "options": [
      "Both CPU checks pass. A speed comparison still needs GPU timings.",
      "Only the CPU output check passes. The kernel name establishes a GPU speedup.",
      "Only the CPU output check passes. A speed comparison still needs GPU timings.",
      "Both CPU checks pass. The kernel name establishes a GPU speedup."
    ],
    "answer": "Only the CPU output check passes. A speed comparison still needs GPU timings.",
    "explanation": "The output difference is 0.01, within the 0.02 tolerance. The input gradients differ by 0.04, so reporting that both checks passed would hide a backward discrepancy. The log identifies the GPU kernel. A speedup claim requires timing both implementations on the same GPU workload."
  },
  {
    "question": "A lab selects the checkpoint with the lowest held-out loss among those that copy a training phrase in at most 10% of continuations. Each checkpoint uses the same held-out tokens, 40 fixed prompts, and decoding settings, with one continuation per prompt. A scores 3.7 nats/token with 2 flagged continuations, B scores 3.4 with 4, and C scores 3.1 with 6. Which decision follows the selection rule?",
    "options": [
      "Select checkpoint A.",
      "Select checkpoint B.",
      "Select checkpoint C.",
      "Hold all three checkpoints."
    ],
    "answer": "Select checkpoint B.",
    "explanation": "The limit is 4 of 40 continuations. A and B qualify, and B has the lower loss. Choosing A for its fewer copies would ignore that loss comparison. C has the lowest loss overall, but its 6 copies exceed the limit. Holding all three would treat even the permitted copies as grounds for rejection."
  }
]
```

> **Next:** Continue to [CUDA for ML Training](/learn/cuda-gpu-computing-for-ml).
