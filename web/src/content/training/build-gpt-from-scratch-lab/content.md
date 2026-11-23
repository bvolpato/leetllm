---
{
  "id": "build-gpt-from-scratch-lab",
  "title": "Build GPT from Scratch Lab",
  "slug": "build-gpt-from-scratch-lab",
  "aliases": [
    "decoder-only-lm-pretraining-lab"
  ],
  "section": "Advanced Training & Adaptation",
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
    "jax-for-ml-research",
    "continued-pretraining-domain-adaptation",
    "supervised-fine-tuning-pipeline",
    "scaling-laws-compute-optimal-training"
  ]
}
---

An early checkpoint produces fragments such as `And the I the`. After another 240 updates, the same prompt produces contractions and phrases such as `I'll do`, alongside grammatical errors and repetition. Which changes indicate learning, and which checks would uncover a target-shift bug or future-token leakage?

Those checks work only if tokenization, vocabulary compaction, next-token targets, causal attention, optimization, and generation agree on token meanings and permitted information flow.[^cs336Stanford2026] Compaction, Pre-LN, AdamW, and top-k sampling are design choices in this lab, not requirements of every autoregressive model. A descending loss alone doesn't verify the pipeline.

Karpathy's `nanoGPT` offers a historical reference with a character-level Shakespeare demo. Its README marked it deprecated in November 2025 and points to [nanochat](https://github.com/karpathy/nanochat) for the newer end-to-end project.[^karpathy2025nanogpt] Here we retain a small teaching model and use GPT-2's published byte-level <span data-glossary="bpe">byte pair encoding (BPE)</span>.[^radford2019] That matches GPT-2's tokenizer, not every current decoder's vocabulary.

Download the bundled Princeton course corpus: [Download `shakespeare.txt`](assets/shakespeare.txt). This file is 4,538,523 bytes, larger than nanoGPT's roughly 1 MB Tiny Shakespeare example.[^princeton2020shakespeare] The lab tokenizes the entire bundled file and trains on random windows from its first 90%. Its 321 updates consume 184,896 target positions, about 16.4% of the training stream's length, with possible overlaps. We don't claim to visit every passage. Small width, context, and update count keep the CPU exercise bounded.

The prerequisites cover PyTorch tensors and Transformer blocks. The new work is making batching, <span data-glossary="causal-mask">causal masking</span>, decoder blocks, the training loop, checkpoint handling, and generation agree. PyTorch supplies autograd, layers, cross-entropy, and AdamW. tiktoken supplies the already-trained GPT-2 <span data-glossary="tokenization">tokenizer</span>. We initialize model parameters from scratch and load no pretrained language-model weights.

Before training, verify the next-token target and visibility boundary separately. At positions before the final input, omitting the causal mask allows attention to read the exact successor being scored. That can lower loss through leakage, even when the labels are correctly shifted.

## The causal LM contract

Every autoregressive language model obeys one core rule: at position $t$, the network observes prefix tokens $x_{\le t}$ and outputs a probability distribution over the vocabulary for token $x_{t+1}$. Because PyTorch executes arbitrary code without verifying theoretical validity, keep the five contractual steps visible across every metric:

- Convert raw text into discrete BPE token IDs
- Restrict position $t$ to attend only to historical keys $s \le t$
- Compute cross-entropy loss against target token $x_{t+1}$
- Optimize parameters on sampled windows, which can overlap
- Validate quality through held-out loss curves and controlled generation

When one component drifts, error messages won't always sound an alarm. Tokenizer, batching, attention masks, and sampling logic have to agree on vocabulary bounds and causal boundaries. We establish those agreements directly before spending training updates.

## Five moving parts

Our training run uses batch size 12, context length $T = 48$, hidden dimension $d_{\text{model}} = 96$, 4 attention heads, and 2 decoder layers. These values serve as an operational ledger: a batch enters as integer IDs of shape `[12, 48]` and leaves as next-token logit vectors across all 48 sequence positions.

| Component | Responsibility | Primary failure mode |
|---|---|---|
| **Corpus** | Supplies the empirical language distribution | Confusing the available inventory with passages actually sampled |
| **Tokenizer** | Converts Unicode text into GPT-2 <span data-glossary="subword-tokenization">subword</span> IDs | Forgetting that token IDs depend entirely on the tokenizer vocabulary |
| **Active-vocab remap** | Compresses sparse GPT-2 IDs into a dense local range | Confusing a smaller output support with a loss-preserving relabeling |
| **Block packer** | Slices the token stream into context windows and targets | Off-by-one label alignment, or interleaving held-out chunks into synthetic boundaries |
| **Decoder loop** | Computes masked <span data-glossary="self-attention">self-attention</span>, loss, and checkpoints | Omitting the causal mask, or evaluating loss without sampling generated text |

Audit the vocabulary footprint first. GPT-2 has 50,257 token IDs, and this bundled file activates 17,485. Remapping them to `0..17484` preserves the active pieces while removing 65.2% of the tied vocabulary matrix's rows. In this architecture, absent-piece rows would account for about 62.3% of the full-vocabulary model's parameters, not over 70%. The complete GPT-2 byte vocabulary covers UTF-8 text; our restricted subset loses that general coverage.[^radford2019]

This remap acts as an efficiency technique for a fixed corpus rather than a new tokenizer. Our architecture mirrors GPT-2's weight-tying design: the model shares weights between the input token <span data-glossary="embedding">embedding</span> and the final unembedding projection layer.[^radford2019code] Projecting the final hidden state back to vocabulary <span data-glossary="logits">logits</span> uses the transpose of the token embedding table:

$$
\text{logits}_t = h_t W_e^T, \quad W_e \in \mathbb{R}^{V_{\text{active}} \times d_{\text{model}}}
$$

We build the map across the full file before splitting, so validation pieces remain representable. This uses unlabeled held-out token identities to choose the output support: validation doesn't participate in gradient updates, but it isn't completely unseen by preprocessing. There are 335 IDs found only in the validation portion. For an independent evaluation, choose a tokenizer and support without inspecting held-out data, or declare an explicit unknown-piece policy. In this lab, prompts with any missing piece raise an error, and sampled local IDs must be reverse-mapped before decoding.

<figure>
  <img src="illustrations/_generated/active_vocabulary_remap_dark.png" alt="GPT-2's 50,257 IDs are compared with the 17,485 active IDs in this corpus. Six example BPE pieces map GPT-2 IDs to local IDs. The tied embedding and output table contains 4,824,672 weights at full size and 1,678,560 with the active vocabulary. The inverse map converts sampled local IDs back to GPT-2 IDs." />
  <figcaption>The sorted active-ID map has an inverse lookup, so generated local IDs can be decoded. It reduces this tied 96-wide embedding/output table from 50,257 to 17,485 rows. The mapping is built across the file before the split, including 335 validation-only token identities.</figcaption>
</figure>

Remapping also modifies the softmax denominator. Absent vocabulary tokens no longer compete for probability mass. In a full table, a row can receive an output-side gradient even when its piece is neither an input nor a target. Loss values between compact and full-vocabulary runs aren't directly interchangeable.

Check the output-side gradient on a three-piece fixture. Row 2 is neither the input nor the target, yet it receives a gradient through the tied output matrix:

<!-- leetllm: test, deps=torch, output=show -->
```python title="unused-piece-still-receives-gradient.py"
import torch
import torch.nn.functional as F

weights = torch.tensor([[1., 0.], [0., 1.], [1., 1.]], dtype=torch.float64, requires_grad=True)
hidden = weights[0:1]
logits = hidden @ weights.T
loss = F.cross_entropy(logits, torch.tensor([1]))
loss.backward()
assert weights.grad[2].abs().sum() > 0
print("input ID=0, target ID=1")
print("row 2 receives gradient:", bool(weights.grad[2].abs().sum() > 0))
print("row 2 gradient:", [round(float(value), 6) for value in weights.grad[2]])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
input ID=0, target ID=1
row 2 receives gradient: True
row 2 gradient: [0.422319, 0.0]
```
<!-- leetllm: output:end -->

<!-- leetllm: test, output=show -->
```python title="active-vocabulary-parameter-cost.py"
import math

gpt2_vocab = 50_257
active_vocab = 17_485
d_model = 96

# GPT-2 reuses token-embedding weights for output logits, so one
# vocabulary-sized matrix determines this part of parameter cost.
full_weights = gpt2_vocab * d_model
compact_weights = active_vocab * d_model
reduction = 1 - compact_weights / full_weights
chance_ce = math.log(active_vocab)

print(f"full vocab tied weights: {full_weights:,}")
print(f"compact tied weights:    {compact_weights:,}")
print(f"vocabulary-weight reduction: {reduction:.1%}")
print(f"uniform next-token CE: {chance_ce:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full vocab tied weights: 4,824,672
compact tied weights:    1,678,560
vocabulary-weight reduction: 65.2%
uniform next-token CE: 9.769
```
<!-- leetllm: output:end -->

A uniform random guess across 17,485 active IDs yields an expected cross-entropy loss of:

$$
\mathcal{L}_{\text{uniform}} = -\ln\left(\frac{1}{V_{\text{active}}}\right) = \ln(17485) \approx 9.769\text{ nats/token}
$$

The first logged batch has loss `9.775`, close to this uniform reference. Random initialization does not produce exactly uniform logits. If loss is much lower, inspect targets, masks, initialization, and the data distribution. A biased predictor can score well on a skewed distribution without seeing future inputs. Use $\ln(V_{\text{active}})$ as the appropriate uniform reference, rather than $\ln(50257) \approx 10.825$.

Could a predictor with no input access beat that reference? In this authored four-piece dataset, every target has ID 0. A constant predictor assigning it probability 0.9 scores well without reading any tokens:

<!-- leetllm: test, output=show -->
```python title="low-loss-does-not-prove-leakage.py"
import math

targets = [0] * 20
probabilities = [0.9, 1 / 30, 1 / 30, 1 / 30]
constant_loss = -sum(math.log(probabilities[target]) for target in targets) / len(targets)
print(f"uniform reference: {math.log(4):.3f}")
print(f"constant predictor: {constant_loss:.3f}")
print("predictor reads inputs: False")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
uniform reference: 1.386
constant predictor: 0.105
predictor reads inputs: False
```
<!-- leetllm: output:end -->

## Audit the causal target before training

A silent bug that ruins autoregressive models is training tokens to predict themselves ($x_t \to x_t$) instead of predicting their successor ($x_t \to x_{t+1}$). Before writing any network modules, verify the label shift on a concrete token sequence. The sample below shows the running prompt we'll test during checkpoint generation:

<!-- leetllm: test, output=show -->
```python title="shifted-next-token-labels.py"
block = ["Good", " sir", ",", "\n", "Spe", "ak", " plain", "."]
x = block[:-1]
y = block[1:]

for current, target in zip(x, y):
    print(f"{current!r:>8} -> {target!r}")

assert y[0] == " sir" and y[-1] == "."
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

The shifted target specifies the supervision label, while the causal mask governs what information reaches that prediction. In each forward pass, the model emits logits: raw unnormalized scores for all 17,485 vocabulary tokens at each of the 48 positions. The causal language-modeling objective computes the mean negative log-likelihood of the ground-truth successor token:[^radford2019]

$$
\mathcal{L} = -\frac{1}{T} \sum_{t=1}^{T} \log p_\theta\!\left(x_{t+1} \mid x_{\le t}\right) = \frac{1}{T} \sum_{t=1}^{T} \left( -z_{t, y_t} + \log \sum_{v=0}^{V-1} \exp(z_{t, v}) \right)
$$

Here $z_t \in \mathbb{R}^V$ represents the logit vector emitted at position $t$, and $y_t = x_{t+1}$ is the target token ID. In PyTorch, flattening logits of shape `[12, 48, 17485]` into `[576, 17485]` and targets `[12, 48]` into `[576]` enables `F.cross_entropy` to score every position in parallel using numerically stable log-sum-exp arithmetic.

Inside self-attention, future keys $s>t$ receive an additive bias of $-\infty$. Their <span data-glossary="softmax">softmax</span> weights are zero when each row has valid finite scores and at least one allowed key. Together with per-position normalization and MLPs, this blocks dependence on future **input positions**. It doesn't make the target statistically independent of the prefix: learning that dependency is the objective.

Predict the visibility pattern for row 2 in a 4-token sequence. It should observe keys 0, 1, and 2, while key 3 remains strictly invisible:

<!-- leetllm: test, output=show -->
```python title="causal-mask-visibility.py"
n = 4
mask = [[col <= row for col in range(n)] for row in range(n)]

for row in mask:
    print(" ".join("1" if visible else "0" for visible in row))

assert mask[2] == [True, True, True, False]
print("position 2 can read positions:", [index for index, visible in enumerate(mask[2]) if visible])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
1 0 0 0
1 1 0 0
1 1 1 0
1 1 1 1
position 2 can read positions: [0, 1, 2]
```
<!-- leetllm: output:end -->

The visibility rule is unchanged with BPE pieces. GPT-2 encodes `Good sir,\nSpeak` into **six** IDs. Verify the complete sequence rather than silently dropping the final `ak`:

```text
x: [10248, 15967, 11, 198, 5248]
y: [15967,    11, 198, 5248, 461]
```

Token `10248` is `Good`, `15967` is ` sir`, `11` is `,`, and `198` is a newline. Notice that `Speak` spans two distinct subwords: `5248` for `Spe`, followed by `461` for `ak`. Autoregressive targets don't require clean word boundaries; the network learns subword morphology and sentence syntax through the exact same transition loss.

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show -->
```python title="inspect-the-complete-gpt2-sequence.py"
import tiktoken

encoder = tiktoken.get_encoding("gpt2")
text = "Good sir,\nSpeak"
ids = encoder.encode(text)
print("IDs:", ids)
print("pieces:", [encoder.decode([token]) for token in ids])
print("round trip:", encoder.decode(ids) == text)
assert ids == [10248, 15967, 11, 198, 5248, 461]
```

<!-- leetllm: output:start -->
```text title="Output" output compact
IDs: [10248, 15967, 11, 198, 5248, 461]
pieces: ['Good', ' sir', ',', '\n', 'Spe', 'ak']
round trip: True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/causal_target_contract_dark.png" alt="Six GPT-2 BPE pieces for Good sir, newline, Speak appear with their IDs. In row q2, at the comma, only keys 0 through 2 are available; future keys are masked. Next-token loss scores z2 against y2 equals x3, the newline token with ID 198." />
  <figcaption>The query at comma position 2 uses the prefix through its own token. With shifted labels, its logit vector is scored against the next token, newline ID 198. The mask controls what the query can read; the target controls what the loss rewards.</figcaption>
</figure>

```checkpoint
Each target is the next token, but attention can still read every position in the block. Has the model learned a valid causal objective?
---
No. Shifted labels define the next-token target, while the causal mask prevents each position from reading future inputs. Both invariants are required; without the mask, training leaks the answer into the hidden state.
```

One decoding detail matters beyond the ASCII prompt. A byte-level BPE token does not always contain a complete UTF-8 character. For inspecting pieces, use `decode_single_token_bytes`; decoding each piece to a string and concatenating the strings can insert replacement characters. Decode the complete ID sequence together, as `sample_completion` does, after reversing the local map.[^tiktoken014Core2026]

This independent snippet uses the full GPT-2 tokenizer, since the lab's compact Shakespeare dataset does not include these multi-byte emoji pieces:

<!-- leetllm: test, deps=tiktoken==0.14.0, output=show -->
```python title="decode-byte-pieces-together.py"
import tiktoken

encoder = tiktoken.get_encoding("gpt2")
text = "🙂"
ids = encoder.encode(text)
pieces = [encoder.decode_single_token_bytes(token) for token in ids]
separate = "".join(encoder.decode([token]) for token in ids)
print("piece bytes:", [piece.hex() for piece in pieces])
print("separate decoding loses text:", separate != text)
print("replacement characters:", separate.count("\ufffd"))
assert b"".join(pieces) == text.encode("utf-8")
print("whole sequence round trip:", encoder.decode(ids, errors="strict") == text)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
piece bytes: ['f09f', '9982']
separate decoding loses text: True
replacement characters: 3
whole sequence round trip: True
```
<!-- leetllm: output:end -->

Arbitrary sampled IDs can form invalid UTF-8. `tiktoken` defaults to replacing invalid bytes; `errors="strict"` detects them. A streaming decoder must retain incomplete bytes across token boundaries instead of replacing them immediately.

## Split the stream without inventing boundaries

We treat the file as one continuous stream and split by its existing order: first 90% training, final 10% validation. This preserves neighboring tokens within each portion. It does not recover chronological authorship or remove duplicated phrases across portions. Deduplicate across the split if needed. No training window crosses the split, and the transition across the split itself isn't scored.

Splicing distant chunks creates new transitions. Whether those are acceptable depends on the intended objective. Ordinary causal pre-training can concatenate documents with separators; independent-document objectives need both attention isolation and boundary-target handling. Resetting positions alone doesn't isolate attention. Here we preserve within-portion order and draw random slices of length $T+1$:

<!-- leetllm: test, output=show -->
```python title="avoid-fake-split-boundaries.py"
tokens = list(range(20))
chunks = [tokens[start:start + 4] for start in range(0, len(tokens), 4)]

interleaved_train = chunks[0] + chunks[2]
fake_transition = (interleaved_train[3], interleaved_train[4])

split_at = int(0.8 * len(tokens))
contiguous_train = tokens[:split_at]
contiguous_validation = tokens[split_at:]

print("interleaved concatenation transition:", fake_transition)
print("was adjacent in source:", fake_transition[1] == fake_transition[0] + 1)
print("contiguous split sizes:", len(contiguous_train), len(contiguous_validation))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
interleaved concatenation transition: (3, 8)
was adjacent in source: False
contiguous split sizes: 16 4
```
<!-- leetllm: output:end -->

With our data pipeline established, trace the tensor transformations across one forward pass. Input IDs of shape `[12, 48]` expand into embedding vectors `[12, 48, 96]`, split into four attention heads of shape `[12, 4, 48, 24]`, form attention score matrices `[12, 4, 48, 48]`, pass through the GELU feed-forward layer, and project into `[12, 48, 17485]` output logits. If your final tensor dimension doesn't match $V_{\text{active}}$, that's a shape mismatch bug, not an optimization quirk.

<figure>
  <img src="illustrations/_generated/pretraining_lab_dark.png" alt="Token IDs of shape 12 by 48 combine with learned positions to make hidden states of shape 12 by 48 by 96. Each repeated Pre-LN block forms four attention heads, then adds their joined output to h to form u = h + attention(LN1(h)). A second LayerNorm feeds a 96-to-384-to-96 GELU MLP, whose output adds back u to form h-prime. After block two, final normalization and the tied token-embedding transpose produce 17,485 logits at each of 48 positions. Boxes are schematic; dimensions come from the lab configuration." />
  <figcaption>Each Pre-LN block normalizes before attention and adds the joined attention output to h to form u. A second LayerNorm feeds the 96→384→96 GELU MLP, whose output adds back u to form h′. After two blocks, the output head reuses the input embedding table to produce logits for 17,485 active tokens. Dimensions are exact; boxes show the flow.</figcaption>
</figure>

## Train, sample, then keep going

Execute the six main lab blocks in order, from `build_gpt_from_scratch.py` through `probe-causality-and-boundaries.py`, in one Python session. Alternatively, combine them into `build_gpt_from_scratch.py`. The earlier small demonstrations and final SDPA comparison are independent. Put the downloaded corpus at `assets/shakespeare.txt` relative to your working directory. Run the pinned environment with:

```bash title="Run the CPU lab with pinned dependencies"
uv run --python 3.12 --with torch==2.13.0 --with tiktoken==0.14.0 build_gpt_from_scratch.py
```

On a cache miss, tiktoken downloads GPT-2's vocabulary and merge files. The model runs on CPU in float32. Package pins, one CPU thread, and separate random generators make comparisons controlled within this environment; they don't promise matching logs or text on another machine or release.[^pytorchReproducibility2026] A CUDA-capable wheel can print a `+cu130` version suffix while all model tensors remain on CPU.

Our training script follows a four-step progression:

1. Train an initial phase (81 updates, with a constant learning rate)
2. Sample text from the early checkpoint
3. Continue training the exact same model and optimizer state to 321 updates
4. Sample again and compare improvements and remaining failures

Examine the architectural components in the implementation:

- **Pre-LN block:** <span data-glossary="layernorm">Layer normalization</span> precedes each attention or MLP branch. The residual addition provides an identity derivative path, alongside the branch's derivative. Ba et al. introduced LayerNorm, not this Transformer arrangement.[^ba2016] Xiong et al. analyzed large output-side initialization gradients in Post-LN and better-behaved gradients in Pre-LN, including experiments without learning-rate warmup. That isn't a universal stability guarantee.[^xiong2020]
- **Causal Self-Attention:** Projects input vectors into query, key, and value matrices via a single fused linear layer. It splits the 96 hidden units into 4 heads of dimension 24 ($d_{\text{head}} = 24$), computes scaled dot products $Q K^T / \sqrt{d_{\text{head}}}$, applies the lower-triangular causal mask with $-\infty$, normalizes via softmax, and recombines output values through a projection layer.
- **GELU MLP:** Expands $96\to384\to96$ and applies $\operatorname{GELU}(x)=x\Phi(x)$, where $\Phi$ is the standard Gaussian CDF.[^hendrycks2016] Smooth gating describes the activation's shape. Measure its effect on convergence in the chosen training setup. PyTorch's default exact GELU also differs from the tanh approximation in GPT-2's original source.[^radford2019code]
- **Tied output head:** `self.head.weight = self.token_emb.weight` makes the two modules share one parameter. This saves 1,678,560 parameters relative to a separate bias-free compact output matrix. Both input lookup and output scoring contribute to its gradient. Evaluate semantic quality on downstream tasks.[^radford2019code]

This GPT-style teaching model has no dropout. It doesn't apply the depth-scaled residual initialization described in the GPT-2 paper and uses a 48-token context. Those choices matter if you try to reproduce GPT-2 rather than study the training loop.[^radford2019]

At this model size, one float32 logit tensor requires $12 \times 48 \times 17,485 \times 4\text{ bytes} \approx 40.3\text{ MB}$ of memory per batch before allocating gradients or backward activation caches.

<!-- leetllm: test, id=mini-gpt-early-train, deps=torch==2.13.0,tiktoken==0.14.0, output=show, output_title="Initial training log" -->

```python title="build_gpt_from_scratch.py"
from pathlib import Path
import copy
import hashlib
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import tiktoken

# Control this CPU run without promising cross-platform bitwise equality.
torch.set_num_threads(1)
torch.manual_seed(7)
print(f"torch={torch.__version__} tiktoken={tiktoken.__version__} device=cpu")

# Load raw text exactly as learner will download it.
all_text = Path("assets/shakespeare.txt").read_text(encoding="utf-8")
corpus = all_text
corpus_sha256 = hashlib.sha256(corpus.encode("utf-8")).hexdigest()

# Use GPT-2 BPE so tokenization matches GPT-2's published input representation.
encoding_name = "gpt2"
encoder = tiktoken.get_encoding(encoding_name)
corpus_token_ids = encoder.encode(corpus)

# GPT-2 token ids are sparse across a 50k vocabulary. This run only needs
# tokens that actually appear inside bundled Shakespeare corpus, so remap them to 0..N-1.
# That keeps tied embedding/output weights much smaller without changing
# which subword pieces the tokenizer produced.
active_token_ids = sorted(set(corpus_token_ids))
token_to_local = {token_id: idx for idx, token_id in enumerate(active_token_ids)}
local_to_token = {idx: token_id for token_id, idx in token_to_local.items()}
ids = [token_to_local[token_id] for token_id in corpus_token_ids]

# Each training example needs block_size input tokens plus 1 next-token label.
block_size = 48

# Split once along original stream. Concatenating interleaved held-out chunks
# would create fake transitions where non-adjacent Shakespeare passages meet.
split_index = int(0.9 * len(ids))
train_ids = torch.tensor(ids[:split_index], dtype=torch.long)
val_ids = torch.tensor(ids[split_index:], dtype=torch.long)
batch_size = 12

# Keep training, validation, and text-sampling randomness independent. Logging
# one sample should never change which training windows the model sees next.
train_generator = torch.Generator().manual_seed(101)
val_generator = torch.Generator().manual_seed(202)

print(
    f"tokens={len(ids)} active_vocab={len(active_token_ids)} "
    f"train={len(train_ids)} val={len(val_ids)}"
)

def sample_batch(
    source: torch.Tensor,
    *,
    generator: torch.Generator,
) -> tuple[torch.Tensor, torch.Tensor]:
    if source.ndim != 1 or len(source) <= block_size:
        raise ValueError("source must be a 1-D stream with at least block_size + 1 tokens")
    # Pick random starting positions from long token stream.
    starts = torch.randint(
        0,
        len(source) - block_size,
        (batch_size,),
        generator=generator,
    )

    # x is current context window.
    x = torch.stack([source[s:s + block_size] for s in starts])

    # y is the same window shifted one token to the right: each x[t] predicts y[t].
    y = torch.stack([source[s + 1:s + block_size + 1] for s in starts])
    return x, y

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model: int = 96, n_heads: int = 4):
        super().__init__()
        if n_heads <= 0 or d_model <= 0 or d_model % n_heads:
            raise ValueError("d_model must be positive and divisible by n_heads")
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads

        # One linear layer projects each position into query, key, and value vectors.
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)

        # Lower-triangular mask blocks attention to future positions.
        self.register_buffer(
            "mask",
            torch.tril(torch.ones(block_size, block_size, dtype=torch.bool)),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size, seqlen, width = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)

        def split_heads(tensor: torch.Tensor) -> torch.Tensor:
            # Turn [batch, time, width] into [batch, heads, time, head_dim].
            return tensor.view(batch_size, seqlen, self.n_heads, self.head_dim).transpose(1, 2)

        q = split_heads(q)
        k = split_heads(k)
        v = split_heads(v)

        # Attention score = query-key similarity, scaled to keep softmax stable.
        attn = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)

        # Any position above diagonal is future token, so hide it from model.
        attn = attn.masked_fill(~self.mask[:seqlen, :seqlen], float("-inf"))
        attn = attn.softmax(dim=-1)

        # Weighted sum of value vectors produces contextualized representation.
        out = attn @ v
        out = out.transpose(1, 2).contiguous().view(batch_size, seqlen, width)
        return self.proj(out)

class Block(nn.Module):
    def __init__(self, d_model: int = 96, n_heads: int = 4):
        super().__init__()

        # Pre-LN transformer block: normalize, attend, add residual, then MLP.
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

        # Token embeddings say "which subword is this?".
        self.token_emb = nn.Embedding(vocab_size, d_model)

        # Position embeddings say "where is this token inside current window?".
        self.pos_emb = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([Block(d_model, n_heads) for _ in range(n_layers)])
        self.ln_f = nn.LayerNorm(d_model)

        # GPT-2 reuses token embedding weights for its output logits.
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.apply(self._init_weights)
        self.head.weight = self.token_emb.weight

    @staticmethod
    def _init_weights(module: nn.Module) -> None:
        # GPT-style small initialization is important once output weights are tied.
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
        if isinstance(module, nn.Linear) and module.bias is not None:
            nn.init.zeros_(module.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, seqlen = x.shape
        if not 1 <= seqlen <= block_size:
            raise ValueError("context length must be between 1 and block_size")
        positions = torch.arange(seqlen, device=x.device)

        # GPT adds token meaning and position meaning before any attention happens.
        h = self.token_emb(x) + self.pos_emb(positions)[None, :, :]
        for block in self.blocks:
            h = block(h)
        h = self.ln_f(h)
        return self.head(h)

# Build model and optimizer.
model_config = {"d_model": 96, "n_heads": 4, "n_layers": 2}
model = TinyGPT(vocab_size=len(active_token_ids), **model_config)
optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3)

def evaluate(source: torch.Tensor) -> tuple[float, float]:
    # Average across a few validation batches so accuracy is less noisy.
    was_training = model.training
    model.eval()
    losses = []
    accuracies = []
    with torch.no_grad():
        for _ in range(8):
            x, y = sample_batch(source, generator=val_generator)
            logits = model(x)
            losses.append(F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1)).item())
            accuracies.append((logits.argmax(dim=-1) == y).float().mean().item())
    model.train(was_training)
    return sum(losses) / len(losses), sum(accuracies) / len(accuracies)

def sample_completion(prompt: str, steps: int = 80) -> str:
    if not prompt or type(steps) is not int or steps < 0:
        raise ValueError("provide a nonempty prompt and a nonnegative integer step count")
    # Use a local generator so fixed-prompt monitoring cannot perturb training.
    sampling_generator = torch.Generator().manual_seed(17)

    prompt_token_ids = encoder.encode(prompt)
    missing_ids = sorted(set(prompt_token_ids) - set(active_token_ids))
    if missing_ids:
        raise ValueError(f"Prompt uses token ids outside compact corpus vocabulary: {missing_ids}")
    prompt_local_ids = [token_to_local[token_id] for token_id in prompt_token_ids]
    context = torch.tensor([prompt_local_ids], dtype=torch.long)

    was_training = model.training
    model.eval()
    with torch.no_grad():
        for _ in range(steps):
            # If sample gets longer than block size, GPT only sees most recent window.
            x = context[:, -block_size:]
            logits = model(x)

            # Only final position matters for next-token sampling.
            next_logits = logits[:, -1, :]

            # Restrict sampling to the top-k highest-logit tokens.
            top_values, top_indices = torch.topk(next_logits, k=min(8, next_logits.size(-1)), dim=-1)
            probs = torch.softmax(top_values / 0.9, dim=-1)
            sampled_index = torch.multinomial(
                probs,
                num_samples=1,
                generator=sampling_generator,
            )
            next_local_id = top_indices.gather(-1, sampled_index)

            # Append sampled token and continue autoregressive loop.
            context = torch.cat([context, next_local_id], dim=1)

    # Convert local ids back to original GPT-2 token ids, then decode to text.
    sample = encoder.decode([local_to_token[int(idx)] for idx in context[0]])
    model.train(was_training)
    return sample

for updates in range(1, 82):
    # 1. Draw random training batch.
    x, y = sample_batch(train_ids, generator=train_generator)

    # 2. Predict next-token logits for every position.
    logits = model(x)

    # 3. Compare logits against shifted targets.
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1))

    # 4. Backpropagate and update weights.
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    # Print occasional train/val snapshots so learner can watch first useful learning happen.
    if updates in (1, 41, 81):
        val_loss, val_acc = evaluate(val_ids)
        print(
            f"updates={updates:03d} train_before_update={loss.item():.3f} "
            f"val={val_loss:.3f} val_acc={val_acc:.3f}"
        )

# Save first-checkpoint metrics so later cell can compare improvement directly.
early_val_loss = val_loss
early_val_acc = val_acc

# Save enough state to keep sampling compatible with trained weights.
checkpoint = copy.deepcopy({
    "encoding_name": encoding_name,
    "active_token_ids": active_token_ids,
    "model_config": model_config,
    "block_size": block_size,
    "split_index": split_index,
    "corpus_sha256": corpus_sha256,
    "completed_updates": updates,
    "torch_version": str(torch.__version__),
    "tiktoken_version": tiktoken.__version__,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "train_generator_state": train_generator.get_state(),
    "val_generator_state": val_generator.get_state(),
})
```

<!-- leetllm: output:start -->
```text title="Initial training log" output compact
torch=2.13.0+cu130 tiktoken=0.14.0 device=cpu
tokens=1255253 active_vocab=17485 train=1129727 val=125526
updates=001 train_before_update=9.775 val=9.535 val_acc=0.108
updates=041 train_before_update=6.428 val=6.416 val_acc=0.151
updates=081 train_before_update=5.911 val=6.050 val_acc=0.171
```
<!-- leetllm: output:end -->

`train_before_update` scores the sampled training batch before its update; validation uses the updated weights. Eight sampled validation batches contain 4,608 evaluated positions, potentially overlapping rather than 4,608 distinct tokens. The displayed update-81 log has loss `6.050` and accuracy `0.171`, or 17.1%. The first logged validation accuracy is already 10.8% after one update; we didn't log a pre-update validation accuracy.

Now sample from this checkpoint using `Good sir,\nSpeak plain.\n`. The exact prompt isn't in the file. That avoids directly copying the prompt, but proves nothing about whether its completion is memorized. An unseen prompt can retrieve a familiar passage.

<!-- leetllm: test, id=mini-gpt-early-sample, continue=mini-gpt-early-train, output=folded, output_title="Initial sample" -->

```python title="build_gpt_from_scratch_warmup_sample.py"
# Prompt is intentionally not copied from training corpus verbatim.
prompt = "Good sir,\nSpeak plain.\n"

# This first sample should still look rough and undertrained.
sample = sample_completion(prompt)
print(f"prompt_seen_verbatim={prompt in corpus}")
print("sample:")
print("\n".join(line.rstrip() for line in sample.splitlines()))
```

<!-- leetllm: output:start -->
<details>
<summary>Initial sample</summary>

```text output compact bare
prompt_seen_verbatim=False
sample:
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

</details>
<!-- leetllm: output:end -->

This sample contains many newlines and common words, with broken syntax. It shows behavior under these decoding settings. Use targeted probes and held-out tasks to characterize what the model learned.

Continue the same model and optimizer for another 240 steps, reaching 321. AdamW retains first and second gradient moments and its step count. Recreating it would reset those states; it wouldn't automatically reset this lab's constant `lr=2e-3`.

<!-- leetllm: test, id=mini-gpt-late-train, continue=mini-gpt-early-sample, output=show, output_title="Longer training log" -->

```python title="build_gpt_from_scratch_continue_training.py"
# Continue from exact same checkpoint instead of restarting from scratch.
for updates in range(checkpoint["completed_updates"] + 1, 322):
    x, y = sample_batch(train_ids, generator=train_generator)
    logits = model(x)
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if updates in (161, 241, 321):
        late_val_loss, late_val_acc = evaluate(val_ids)
        print(
            f"updates={updates:03d} train_before_update={loss.item():.3f} "
            f"val={late_val_loss:.3f} val_acc={late_val_acc:.3f}"
        )

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
    "torch_version": str(torch.__version__),
    "tiktoken_version": tiktoken.__version__,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "train_generator_state": train_generator.get_state(),
    "val_generator_state": val_generator.get_state(),
})
```

<!-- leetllm: output:start -->
```text title="Longer training log" output compact
updates=161 train_before_update=5.775 val=5.747 val_acc=0.170
updates=241 train_before_update=5.751 val=5.721 val_acc=0.175
updates=321 train_before_update=5.635 val=5.550 val_acc=0.183
val_loss_improved_by=0.500
val_acc_improved_by=0.013
```
<!-- leetllm: output:end -->

The displayed Python 3.12 CPU run shows validation loss falling by `0.500` nats, from `6.050` at update 81 to `5.550` at update 321. Rounded accuracy rises from 17.1% to 18.3%. The printed `0.013` improvement uses unrounded values, so it can differ from subtracting those rounded log entries. These sampled estimates come from one run. Replicate seeds and report variation to characterize the learning curve.

Now sample text using the identical prompt and random seed:

<!-- leetllm: test, id=mini-gpt-late-sample, continue=mini-gpt-late-train, output=folded, output_title="Longer-training sample" -->

```python title="build_gpt_from_scratch_late_sample.py"
# Same prompt, same sampling settings. Only model weights changed.
sample = sample_completion(prompt)
print(f"prompt_seen_verbatim={prompt in corpus}")
print("sample:")
print("\n".join(line.rstrip() for line in sample.splitlines()))
```

<!-- leetllm: output:start -->
<details>
<summary>Longer-training sample</summary>

```text output compact bare
prompt_seen_verbatim=False
sample:
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

</details>
<!-- leetllm: output:end -->

The later sample includes fragments such as `I is the king :` and `The lord ?`, alongside an agreement error, repetition, and a long run-on stretch. It shows one response under one prompt and decoding setting. Loss fell while that prose stayed broken. Which measurements should decide whether the later checkpoint is better?

## How to read the two checkpoints

Held-out validation cross-entropy averages log-likelihood across thousands of positions. The sample above can still show repetition or collapse that this average hides. Read both before you treat the later checkpoint as better.

Between our two logged checkpoints:

- Sampled validation cross-entropy dropped from `6.050` to `5.550` nats/token
- Rounded validation next-token accuracy rose from 17.1% to 18.3%
- The fixed-prompt continuation gained some short phrases while retaining repetition and grammatical errors

<figure>
  <img src="illustrations/_generated/sample_output_guide_dark.png" alt="Validation cross-entropy follows updates 1, 41, 81, 161, 241, and 321, falling from 9.535 to 5.550 nats per token against the analytic uniform reference 9.769. At updates 81 and 321, loss is 6.050 and 5.550, while accuracy is 17.1% and 18.3%. Two outputs use the same prompt and settings: And the I the and And it . at update 81, then I is the king colon and The lord question mark at update 321." />
  <figcaption>The validation trace averages eight sampled batches, or 4,608 target positions, from one CPU run; windows may overlap. Both excerpts use `Good sir,\nSpeak plain.\n` with the same decoding settings, then compare one sample per checkpoint. The later sample adds a few phrases and still has grammar errors and repetition.</figcaption>
</figure>

In `sample_completion`, inspect three decoding decisions:

1. **Top-$k$ selection:** `torch.topk` retains exactly eight indices here. Tail removal changes the model's distribution and can discard useful candidates. Measure valid-continuation rates on target prompts when choosing the cutoff.[^holtzman2020]
2. **Temperature:** The selected logits are divided by $\tau=0.9$. Positive scaling leaves their ranking unchanged and sharpens probabilities relative to temperature 1. As $\tau\to0$, a unique maximum dominates; tied maxima retain equal limiting probability. Implement temperature-zero greedy decoding with an explicit argmax branch, not division by zero.
3. **Categorical draw:** `torch.multinomial` samples one retained candidate. This can vary tokens, but repetition remains possible. The function resets its local generator to seed 17 for each call; identical prompts and weights repeat the trace in this environment.

```checkpoint
Validation loss improves, but fixed-prompt samples become repetitive and collapse onto copied training phrases. Which evidence controls the decision?
---
Hold the checkpoint. Lower held-out loss is useful, but generation checks reveal a behavior regression the scalar average can hide. Compare fixed prompts, memorization or overlap checks, and held-out task metrics before selecting the run.
```

## What a resume file has to remember

Restoring model weights alone isn't an exact training continuation. AdamW's moments and step count affect the next update, so a fresh optimizer can change the trajectory.[^loshchilov2019] The size and usefulness of that change depend on the run; an immediate optimization shock isn't guaranteed.

A complete resume file must serialize:

- Model weights (`model.state_dict()`)
- Optimizer moments (`optimizer.state_dict()`)
- Active vocabulary mapping tables (`token_to_local`, `local_to_token`)
- Current generator states for `train_generator` and `val_generator` (their initial seeds alone don't retain progress)
- Model and training configuration, completed updates, tokenizer identity/version, and split policy
- Source corpus hash to detect data drift across restarts

We use `copy.deepcopy` when saving in-memory checkpoints. In PyTorch, `model.state_dict()` contains references to tensor memory; subsequent in-place parameter mutations will overwrite the saved dictionary unless deep-copied.[^pytorchSavingLoading2026]

This CPU model has no dropout or stochastic forward layers; batching uses the two stored generators. A model with dropout, CUDA draws, a scheduler, or mixed-precision scaling would require those additional states too. The next block tests update 322 in the same process and environment. It reuses the current corpus and checks that its fingerprint and split match; it isn't a standalone inference loader.

<figure>
  <img src="illustrations/_generated/checkpoint_resume_equivalence_dark.png" alt="A checkpoint at update 321 keeps model weights, AdamW moments and step, train and validation RNG states, active vocabulary map, tokenizer, corpus hash, split, and model configuration. In one CPU process, the in-memory and restored paths use the same batch of shape 12 by 48 and run the same forward pass, cross-entropy, and AdamW step 322. Assertions compare probe logits, the next batch, pre-update loss, and weights after update 322." />
  <figcaption>The fixture saves at update 321, then compares the in-memory and restored paths in the same CPU process. Both use the saved train-generator state, receive the same `[12, 48]` batch, and run forward, cross-entropy, and AdamW step 322. Probe logits, the next batch, pre-update loss, and post-update weights match.</figcaption>
</figure>

We save the checkpoint, load it with `weights_only=True`, and compare the next batch, loss, and weights:

<!-- leetllm: test, id=mini-gpt-round-trip, continue=mini-gpt-late-sample, deps=torch, output=show, output_title="Checkpoint round trip" -->
```python title="build_gpt_checkpoint_round_trip.py"
checkpoint_path = Path("tiny_gpt_checkpoint.pt")
torch.save(checkpoint, checkpoint_path)
restored = torch.load(checkpoint_path, weights_only=True)

assert restored["corpus_sha256"] == hashlib.sha256(corpus.encode("utf-8")).hexdigest()
assert restored["encoding_name"] == encoding_name
assert restored["block_size"] == block_size
assert restored["split_index"] == split_index
assert restored["completed_updates"] == 321
resumed_model = TinyGPT(vocab_size=len(restored["active_token_ids"]), **restored["model_config"])
resumed_model.load_state_dict(restored["model_state_dict"])
resumed_optimizer = torch.optim.AdamW(resumed_model.parameters(), lr=2e-3)
resumed_optimizer.load_state_dict(restored["optimizer_state_dict"])

resumed_train_generator = torch.Generator()
resumed_train_generator.set_state(restored["train_generator_state"])
resumed_val_generator = torch.Generator()
resumed_val_generator.set_state(restored["val_generator_state"])

resumed_token_to_local = {
    token_id: idx for idx, token_id in enumerate(restored["active_token_ids"])
}
assert resumed_token_to_local == token_to_local
assert torch.equal(resumed_val_generator.get_state(), restored["val_generator_state"])

probe_generator = torch.Generator().manual_seed(303)
probe_x, _ = sample_batch(val_ids, generator=probe_generator)
model.eval()
resumed_model.eval()
with torch.no_grad():
    original_logits = model(probe_x)
    resumed_logits = resumed_model(probe_x)
assert torch.equal(original_logits, resumed_logits)

# Advance the actual uninterrupted sampler as well as the resumed sampler.
expected_x, expected_y = sample_batch(train_ids, generator=train_generator)
resumed_x, resumed_y = sample_batch(train_ids, generator=resumed_train_generator)
assert torch.equal(expected_x, resumed_x) and torch.equal(expected_y, resumed_y)
assert torch.equal(train_generator.get_state(), resumed_train_generator.get_state())

# Both paths take update 322 from the same frozen weights, moments, and batch.
def one_update(network, opt, x, y):
    network.train()
    logits = network(x)
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), y.reshape(-1))
    opt.zero_grad()
    loss.backward()
    opt.step()
    return loss.detach()

original_loss = one_update(model, optimizer, expected_x, expected_y)
resumed_loss = one_update(resumed_model, resumed_optimizer, resumed_x, resumed_y)
assert torch.equal(original_loss, resumed_loss)
same_updated_weights = all(
    torch.equal(original, resumed)
    for original, resumed in zip(model.parameters(), resumed_model.parameters())
)
assert same_updated_weights

print(f"saved checkpoint={checkpoint_path}")
print(f"restored encoding={restored['encoding_name']} active_vocab={len(restored['active_token_ids'])}")
print("same logits after round trip:", torch.equal(original_logits, resumed_logits))
print(
    "same next training batch after round trip:",
    torch.equal(expected_x, resumed_x) and torch.equal(expected_y, resumed_y),
)
print("same weights after the next optimizer update:", same_updated_weights)
```

<!-- leetllm: output:start -->
```text title="Checkpoint round trip" output compact
saved checkpoint=tiny_gpt_checkpoint.pt
restored encoding=gpt2 active_vocab=17485
same logits after round trip: True
same next training batch after round trip: True
same weights after the next optimizer update: True
```
<!-- leetllm: output:end -->

The assertions compare logits, batches, losses, and updated weights bit for bit within this controlled CPU run. They don't promise bitwise continuation across devices or releases.[^pytorchReproducibility2026]

Now probe the causal attention boundary directly in the trained model. Modify input tokens at positions 3 through 7 while keeping positions 0 through 2 untouched. In a causally masked architecture, logits at positions 0, 1, and 2 must remain perfectly identical. Next, temporarily disable the causal mask by setting all mask entries to `True`; logits at early positions will immediately change as future tokens leak backward:

<!-- leetllm: test, continue=mini-gpt-round-trip, deps=torch, output=show -->
```python title="probe-causality-and-boundaries.py"
model.eval()
prefix = train_ids[:8].unsqueeze(0)
changed = prefix.clone()
changed[:, 3:] = (changed[:, 3:] + 1) % len(active_token_ids)
with torch.no_grad():
    before = model(prefix)[:, :3]
    after = model(changed)[:, :3]
assert torch.equal(before, after)

saved_masks = [block.attn.mask.clone() for block in model.blocks]
try:
    for block in model.blocks:
        block.attn.mask.fill_(True)
    with torch.no_grad():
        leaked = not torch.equal(model(prefix)[:, :3], model(changed)[:, :3])
    assert leaked
finally:
    for block, saved in zip(model.blocks, saved_masks):
        block.attn.mask.copy_(saved)

# Exactly 49 tokens permit one length-48 window and its shifted labels.
edge = torch.arange(block_size + 1)
edge_x, edge_y = sample_batch(edge, generator=torch.Generator().manual_seed(1))
assert torch.equal(edge_y[:, :-1], edge_x[:, 1:])
assert (edge_y[:, -1] == block_size).all()
for invalid in (edge[:-1], edge[:0]):
    try:
        sample_batch(invalid, generator=torch.Generator())
    except ValueError:
        pass
    else:
        raise AssertionError("short stream was accepted")
print("causal prefix unchanged; unmasked leakage detected; window boundaries pass")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
causal prefix unchanged; unmasked leakage detected; window boundaries pass
```
<!-- leetllm: output:end -->

```checkpoint
A restored model produces identical logits, but its next training batch differs from the uninterrupted run. Is the checkpoint round trip complete?
---
No. Matching logits verifies model state only. Exact continuation also needs optimizer and scheduler state, data or sampler position, and relevant RNG state so the next update consumes the same batch and randomness.
```

## What this lab kept from GPT-2

Our architecture preserves the foundational choices of OpenAI's GPT-2: learned absolute positional embeddings, Pre-LN sub-block normalization, multi-head self-attention with causal masking, a GELU feed-forward network, and tied input/output embeddings.[^radford2019][^radford2019code]

Llama 2 is a historical 2023 comparison that retains the causal next-token objective while changing several components. Its released 7B and 13B models use MHA; 70B uses GQA.[^touvron2023a] These alternatives aren't a universal successor stack for every current model:

| GPT-style lab component | Alternative used in Llama 2 | Mechanism and tradeoff |
|---|---|---|
| Learned `pos_emb` table | Rotary Position Embeddings (RoPE) | Rotates query/key pairs so their dot products depend on relative positions. Evaluate extrapolation quality at the context lengths and scaling settings you plan to use.[^su2021][^touvron2023a] |
| `nn.LayerNorm` | Root Mean Square Normalization (RMSNorm) | Divides by root mean square without centering. Mean square is a second moment, not variance about the mean; runtime savings depend on the implementation.[^zhang2019][^touvron2023a] |
| GELU MLP ($4\times$ width) | SwiGLU feed-forward | Multiplies a linear branch by a SiLU/Swish gate, then applies an output projection. Shazeer's controlled experiments improved perplexity; measure sample efficiency for the target model and training setup.[^shazeer2020][^touvron2023a] |
| Multi-Head Attention (MHA) | Grouped-Query Attention (GQA) | Shares KV heads across query groups. With unchanged sequence length, head width, and dtype, ideal KV storage scales with KV-head count; serving speedups need measurement.[^ainslie2023][^touvron2023a] |

Manual attention materializes `[batch, heads, seqlen, seqlen]` scores. PyTorch's `scaled_dot_product_attention` is an API with multiple backends. On supported CUDA inputs it can select fused kernels; CPU execution doesn't demonstrate FlashAttention. FlashAttention avoids storing the full score matrix in high-bandwidth memory while still performing quadratic full-attention arithmetic.[^dao2022][^pytorchSdpaDocs2026]

<!-- leetllm: test, deps=torch, output=show -->
```python title="scaled-dot-product-attention-equivalence.py"
import math
import torch
import torch.nn.functional as F

torch.manual_seed(3)
q = torch.randn(1, 2, 4, 8)
k = torch.randn(1, 2, 4, 8)
v = torch.randn(1, 2, 4, 8)

scores = (q @ k.transpose(-2, -1)) / math.sqrt(q.size(-1))
mask = torch.tril(torch.ones(4, 4, dtype=torch.bool))
manual = scores.masked_fill(~mask, float("-inf")).softmax(dim=-1) @ v
fused_api = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=0.0)
assert torch.allclose(manual, fused_api, atol=1e-6)

print("output shape:", tuple(fused_api.shape))
print("numerically close:", torch.allclose(manual, fused_api, atol=1e-6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
output shape: (1, 2, 4, 8)
numerically close: True
```
<!-- leetllm: output:end -->

The CPU example verifies numerical closeness of two attention formulations, not which CUDA kernel ran, bitwise identity, lower memory, or faster training. Fused implementations can change floating-point accumulation order. Check backend eligibility and profile your workload; keep masking, label, and gradient checks when refactoring.[^pytorchSdpaDocs2026]

## Diagnostics and debugging failure modes

These symptoms suggest investigations. They don't uniquely identify a cause:

- **Symptom: Training loss drops toward 0.00 in a few steps, but generations are pure gibberish.**
  *Possible cause:* Self-copy targets or future-input leakage.
  *Check:* Verify the label shift separately, then run the causal perturbation probe. Prefix invariance alone can't detect unshifted labels. A strictly inverted mask can instead create an all-masked row and NaNs.
- **Symptom: Generation crashes with index errors or produces completely scrambled text after checkpoint resume.**
  *Possible cause:* Vocabulary mapping mismatch, missing prompt pieces, or a context/configuration mismatch.
  *Check:* Decode via the saved inverse map, validate prompt coverage, and match the model configuration. Decoding a local ID directly as a GPT-2 ID can produce plausible wrong text without raising an index error.
- **Symptom: Sampling gets trapped in infinite repetitive loops (`the man to the man to the man`).**
  *Possible cause:* Model distribution, repetitive data, context loss, or decoding settings.
  *Check:* Compare prompts and several decoding settings. Top-eight sampling at 0.9 is this lab's setting, not a cure; truncation and lower temperature can themselves reduce entropy.
- **Symptom: Training loss spikes abruptly to NaN.**
  *Possible cause:* Nonfinite activations or gradients, excessive update size, or an all-masked attention row. An untied head isn't inherently unstable.
  *Check:* Locate the first nonfinite tensor and inspect mask rows and scaling. Gradient clipping can limit a finite norm; it doesn't repair an already-NaN forward pass.
- **Symptom: Optimizer resume produces different losses on the next step.**
  *Possible cause:* Weights, batch/RNG state, configuration, or optimizer state differs.
  *Check:* Compare the pre-update weights and exact batch first. In this deterministic model, optimizer moments change the post-update result; they don't change the same batch's loss before an update.

AdamW **decouples decay from the adaptive gradient update**.[^loshchilov2019] That is separate from deciding which parameter groups receive decay. Our simple call applies PyTorch's default decay to every supplied parameter, including biases and LayerNorm scales. nanoGPT groups tensors by dimensionality, decaying matrices and excluding vectors. Evaluate this grouping on the target model and task to measure its effect on normalization parameters.[^karpathy2025nanogpt]

Follow one Shakespeare batch from its BPE IDs through the causal mask, the shifted label, the saved optimizer, and the sample. A lower loss doesn't replace those checks. The run still hides its changing state inside a module, an optimizer, and two generators.

**Additional worked practice**

```checkpoint
Changing input positions 5–7 leaves logits at positions 0–4 unchanged. The same batch stores target y[t]=x[t]. Which diagnosis and repair follow?
---
The visibility probe passed; shift the labels to the actual successors. The unchanged earlier logits support the tested causal boundary, while y[t]=x[t] separately rewards self-copy. Repair target alignment without admitting future keys. Causality alone does not validate the supervision label, and normalization or batch size does not fix that wrong target.
```

```checkpoint
An authored deterministic sampler draws starts [4, 1, 9, 6] from its initial state. A checkpoint is saved after consuming 4 and 1. What is the next draw after restoring only the initial seed versus the progressed sampler state?
---
4 after the initial seed; 9 after the progressed state. Resetting the initial state repeats its first draw, 4. Restoring the state saved after two draws continues at 9. This is a supplied deterministic sequence, not a claim that a particular library seed generates these starts. A seed identifies a stream’s beginning; the progressed state retains its position.
```

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
    "explanation": "Position 3 contains 11 and can read keys through itself, indices 0–3. Its shifted successor is 15 at source position 4. Reading key 4 exposes the scored successor; target 11 rewards copying; excluding key 3 and choosing 19 changes both contracts."
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
    "question": "A compact checkpoint has a fixed 25-ID support and a saved inverse map. Its GPT-2 tokenizer emits valid original ID 50000 for a new prompt piece, but that ID has no local entry. Which action preserves this checkpoint’s input contract?",
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

> **Next:** Continue to [JAX for PyTorch Researchers](/learn/jax-for-ml-research). This lab mutates a PyTorch module, an optimizer, and two random generators in place. The JAX chapter makes those changing values explicit returns, then adds compilation and timing.
