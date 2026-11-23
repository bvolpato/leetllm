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

An assistant reading a 2,000-line Python ML codebase may be asked to tag technical notes by topic, pull out the exact parameter name `rope_theta`, and explain why grouped-query attention saves KV memory. Classic NLP pipelines solve those jobs with separate models, whereas one autoregressive language model can attempt all three through the same text prompt. Understanding when that shared interface succeeds, and when a simpler encoder or exact string match works better, connects Transformer mechanics directly to modern LLM engineering.

**GPT** stands for *Generative Pre-trained Transformer*, the causal model family introduced by OpenAI, while **large language model (LLM)** names the broader category. A GPT-style decoder generates text by predicting the next <span data-glossary="token">token</span> conditioned on a prefix. That single continuation mechanism can express topic classification, span lookup, and multi-sentence explanation, even though format validity and factual accuracy still demand task-level evaluation.

The original <span data-glossary="transformer">Transformer</span> debuted in 2017 as an encoder-decoder model for machine translation.[^vaswani2017] Later research diverged along overlapping axes covering attention visibility, compute allocation, post-training alignment, and serving memory efficiency. Tracing how those design choices fit together clarifies what each modern improvement buys in practice. More importantly, it highlights which engineering checks remain mandatory even on frontier checkpoints.

## One generation loop, many tasks

Dedicated task architectures solve classification and span extraction directly by fitting specialized output heads. A classifier maps a pooled representation to logits over a closed label set such as `{"Attention", "Training", "Serving"}`, while an extraction model scores start and end indices `[start_idx, end_idx]` inside a document. An autoregressive decoder takes a different route, framing every task as next-token completion from a formatted prompt. Left-to-right self-attention conditions each decoding step on the task instruction, any in-context demonstrations, and the partial reply emitted so far.

Writing `Topic:` or `Key:` steers next-token probability mass toward valid continuations like `Attention` or `rope_theta`, even when those answers span multiple subword tokens. Base pretraining checkpoints often continue raw patterns unpredictably unless adapted, whereas instruction-tuned or chat checkpoints expect the conversation delimiters used during post-training. Across engineering workflows, a technical documentation assistant encounters three recurring task patterns:

1. **Classification:** Given a snippet such as `"Scales query-key dot products by 1/sqrt(d_k)"`, return one category from `{"Attention", "Training", "Serving"}`.
2. **Extraction:** Given a module line `"rotary_pos.py sets rope_theta = 10000"`, copy the exact parameter identifier `rope_theta`.
3. **Synthesis:** Given the question `"Why does GQA cut KV cache size?"`, produce a clear technical explanation grounded in the source paragraph.

Bidirectional encoders such as BERT excel when trained with task-specific classification or span heads because every token reads both left and right context simultaneously.[^devlin2019] Causal decoders instead make left-to-right generation native, allowing a single unified prompt to express classification, verbatim extraction, and technical explanation without swapping network heads. When the goal is rapid tagging over fixed schemas, small encoders still win easily on latency and compute per token. Below, a few-shot prompt translates classification into plain next-token completion:

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

The decoder encodes the entire prefix, attends over the task rules and worked pairs, and predicts the next token immediately following the trailing `Topic:` cue. Because every demonstration outputs one category word right after `Topic:`, well-calibrated models concentrate probability mass onto valid labels such as `Attention`. Free-form generation can still drift into conversational replies such as `"The topic is Attention"`, so applications rely on constrained schema decoding or post-hoc validation paired with held-out accuracy checks. For exact substring lookup like `rope_theta`, matching extracted strings verbatim against the source code catches hallucinated edits reliably.

<figure>
  <img src="illustrations/_generated/decoder_task_interface_dark.png" alt="A single autoregressive next-token loop expresses three distinct NLP tasks: classifying a technical snippet as Attention, extracting the exact parameter name rope_theta from source text, and synthesizing why GQA saves memory, with each output verified by its own check." />
  <figcaption>One prompt-to-next-token loop can express classification, exact span lookup, and grounded explanation. Label membership, verbatim source matching, and claim support each require an independent verification step.</figcaption>
</figure>

The Python snippet below pairs that exact few-shot prompt builder with a NumPy softmax distribution over candidate next-token logits at the trailing `Topic:` position. Adjusting the score gap demonstrates how vocabulary probabilities concentrate onto valid class labels without updating model weights. Even small logit shifts between valid and competing tokens rapidly push the top label toward full confidence.

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

Notice how in-context prompting shifts next-token probabilities solely by conditioning the hidden representation on the prefix, without modifying a single model weight. At position $t$, the attention mechanism pulls context from earlier worked pairs and aligns the final hidden vector with rows of the unembedding matrix corresponding to allowed class names. That property makes few-shot prompting fast to iterate on, though output reliability still hinges on prompt wording, decoding constraints, and empirical evaluation.

```checkpoint
Why can a decoder-only model classify a technical note even though its pretraining objective was next-token prediction?
---
In-context demonstrations cast classification as pattern completion ending at `Topic:`. A capable decoder uses that prefix to concentrate probability on valid category tokens without modifying its vocabulary head, though multi-token labels and off-schema phrasing require parsing, schema validation, and accuracy evaluation on held-out examples.
```

<span id="the-fork-reading-and-writing-split-apart"></span>
## Why encoders read both ways and decoders write left to right

Why did causal decoders become the default backbone for modern conversational assistants? Autoregressive prediction unifies open-ended text generation, tool invocation, and multi-turn replies behind a single interface, whereas task quality still hinges on training data and evaluation. Going back to the 2018 split between BERT and GPT reveals how the attention mask separates representation learning from left-to-right synthesis.

Vaswani et al.'s 2017 architecture paired a bidirectional encoder stack reading the source sentence with an autoregressive decoder stack generating target translations via cross-attention.[^vaswani2017] Within a year, researchers showed that standalone single-stack variants could excel when specialized for understanding versus generation. Each branch trades bidirectional token visibility for autoregressive simplicity in distinct ways:

1. **BERT (2018):** A bidirectional encoder lets every non-padding token attend to both earlier and later tokens in the sequence.[^devlin2019] Original BERT pretrained with masked language modeling (masking 15% of tokens, replacing 80% with `[MASK]`, 10% with random tokens, and keeping 10% unchanged) alongside next-sentence prediction. Sentence-BERT further trains pooled encoder states with contrastive pairs for semantic similarity, since raw pooled embeddings from masked models need task tuning for strong retrieval.[^reimers2019]
2. **GPT (2018):** A causal decoder retains masked self-attention and feed-forward layers while removing encoder cross-attention.[^radford2018] Its lower-triangular <span data-glossary="causal-mask">causal mask</span> allows query position $i$ to attend to keys $j \le i$, so every sequence position simultaneously learns to predict $x_{i+1}$ from preceding tokens only.

| System task | Encoder-only (BERT-style) | Decoder-only (GPT-style) |
|---|---|---|
| Categorize a code review comment | Fine-tuned classification head over `[CLS]` or pooled states | Prompted category completion or attached linear head |
| Write a grounded explanation | Requires specialized generation adaptations or separate decoder | Native autoregressive interface backed by retrieval checks |
| Dense semantic search | Contrastive or bi-encoder model trained for retrieval | Decoder-based embedding models exist, needing size and quality tradeoffs |
| Multi-turn assistant | Strong candidate for reranking and classification stages inside pipelines | Instruction- and chat-trained generator paired with external state |

Keeping architecture distinct from training objective prevents common confusion across NLP system design. Text-to-text encoder-decoder models such as T5 generate text fluently while reading input prompts bidirectionally.[^raffel2020] Decoders dominate generalist assistants because one next-token loop scales cleanly to multi-turn prompts and long-form outputs, while lightweight encoders continue to power fast search and classification stages.

### A decoder writes left to right

Under a causal mask, query position $t$ may attend only to keys at positions $j \le t$. When predicting the continuation after `scales`, the model mixes value vectors from `<bos>`, `rope`, and `scales` while strictly zeroing attention weights onto later positions such as `<eos>`. During teacher-forced training, all $T$ positions compute logits in parallel within each layer because future-key scores receive $-\infty$ before softmax, guaranteeing zero information leakage across time. The NumPy check below compares masked causal attention weights directly against unmasked bidirectional weights on identical query-key projections for `["<bos>", "rope", "scales", "<eos>"]`:

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

Every entry above the main diagonal in `causal_weights` is exact zero before any output projection runs. A bidirectional encoder computes full attention over all unpadded tokens, whereas a causal decoder enforces this lower-triangular visibility rule so training on complete text matches sequential generation step for step. Each query row still sums to one over its visible prefix, preventing probability leakage into unseen tokens while keeping gradient computation vectorized.

```checkpoint
What mathematical property distinguishes a causal decoder attention matrix from an encoder attention matrix?
---
In causal self-attention, query $i$ attends only to keys $j \le i$, including the diagonal, by setting scores for $j > i$ to $-\infty$ before softmax so probabilities normalize cleanly over visible keys. Bidirectional encoders permit keys on both sides up to padding masks.
```

## The life of a token: prefill, KV cache, and decode

Tracing a single question, `"Why is RoPE relative ?"`, clarifies how text generation executes across layers and why inference splits into two phases. A tokenizer converts the string into integer token IDs, an embedding table maps each ID to a vector of width $d_{\text{model}}$, and positional information encodes token order. Inside each pre-normalization decoder block, the hidden state passes through RMSNorm or LayerNorm, causal self-attention with its output projection, a residual addition, and a normalized feed-forward branch before reaching the next layer.

After the final block and normalization layer, the last prompt position's hidden vector multiplies the vocabulary head $W_{\text{vocab}} \in \mathbb{R}^{d_{\text{model}} \times |V|}$ to produce raw <span data-glossary="logits">logits</span> (some libraries store this matrix transposed as $[|V|, d_{\text{model}}]$).[^radford2019code] Applying <span data-glossary="softmax">softmax</span> turns those logits into normalized probabilities over candidate next tokens. In our worked five-token prompt, `Because` scores highest with logit `0.38`, ahead of `Since`, `It`, and `The`. Efficient serving avoids recomputing earlier key and value projections on every generated word by splitting execution into two distinct phases:

1. **Prefill:** All $T$ prompt tokens run forward together, populating the **<span data-glossary="kv-cache">KV cache</span>** at every layer while emitting next-token logits from the final position. Processing $BT$ rows simultaneously lets matrix multiplications reuse model weights heavily across tokens, and very long prompts may run in chunks.
2. **Cached decode:** Only the newly sampled token enters the next forward step. Each layer computes one new key and value vector, appends them to the cache, and computes attention from the new query against all prior cached keys plus itself.

Long prefill passes tend to be compute-bound with strong weight reuse across many prompt rows, whereas small-batch decode often becomes constrained by HBM memory bandwidth as accelerators stream large weight matrices and cached tensors for a handful of query rows.[^pope2023] Increasing concurrent batch size raises weight reuse during decode, while quantization, head sharing, and fused kernels alter where hardware bottlenecks sit. Notice in the lifecycle diagram below how sampling advances the text stream one token ahead of cached key-value positions until the next decode step processes that token.

<figure>
  <img src="illustrations/_generated/token_lifecycle_decoder_dark.png" alt="Prefill processes five prompt tokens Why, is, RoPE, relative, and question mark, caching keys and values at positions 1 to 5. Selecting Because with logit 0.38 leaves 6 text tokens and 5 cached positions. The next decode step passes Because at position 6, lets Q6 attend to K1 through K6, and extends the cache to six positions." />
  <figcaption>Immediately after sampling `Because`, the text sequence holds six tokens while the KV cache still holds five positions. The decode step feeds `Because` at position 6, computes K₆ and V₆, attends Q₆ across K₁ through K₆, and updates the cache to length six.</figcaption>
</figure>

This NumPy calculation runs the exact final projection behind the figure, maps `h5` to next-token probabilities, and tracks how the per-layer KV tensor expands from five cached positions to six during decode. Running each tensor step explicitly verifies why batch and sequence shapes change between prefill, token selection, and cached decode. Inspecting those tensor shapes side by side prevents common off-by-one indexing bugs in custom serving loops:

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

Turning a raw next-token predictor into a helpful assistant required advances across training objectives, scaling budgets, and model architecture simultaneously. Rather than unfolding as one linear progression, modern LLMs combine distinct research tracks pursued between 2017 and 2024. Those parallel threads span prompt-driven task transfer and alignment, balanced compute-data scaling, and sparse parameter routing across specialized sub-networks.

<figure>
  <img src="illustrations/_generated/llm_evolution_dark.png" alt="Three LLM design axes from 2018 to 2024: prompting and alignment moving from GPT-1 through GPT-3 to InstructGPT, compute-optimal allocation comparing Gopher 280B on 300B tokens with Chinchilla 70B on 1.4T tokens at matched compute, and Mixtral sparse routing executing 2 of 8 experts for 13B active out of 47B total parameters." />
  <figcaption>Three parallel axes reshaped LLMs: prompting and alignment (GPT-1 through InstructGPT), balanced parameter-to-token compute allocation (Gopher versus Chinchilla), and sparse Mixture-of-Experts routing (Mixtral 8x7B).</figcaption>
</figure>

### 1. GPT-1: Generative pretraining and fine-tuning (2018)

Transfer from unlabeled text predates the Transformer, and GPT-1 demonstrated how effectively a 12-layer, 117-million-parameter causal decoder adapts across NLP tasks after pretraining on BooksCorpus (over 7,000 books).[^radford2018] Its two-stage workflow combined unsupervised next-token pretraining with supervised fine-tuning paired with a linear output head and an auxiliary language-modeling loss. Even while relying primarily on task-specific weights, the authors observed early zero-shot generalization emerging from raw pretraining alone.

### 2. GPT-2: Zero-shot task framing (2019)

Scaling the decoder to 1.5 billion parameters on WebText (roughly 40 GB of curated web text), GPT-2 evaluated benchmarks purely through prompts without updating weights per task.[^radford2019] Appending cues like `Input: The derivation was crystal clear. Sentiment:` primes a pretrained model to assign probability to `positive`. Zero-shot results varied sharply across tasks, yet they demonstrated that broad text pretraining internalizes substantial task structure directly inside the continuation distribution.

### 3. GPT-3: Few-shot in-context conditioning (2020)

Brown et al. scaled autoregressive decoders to **175 billion parameters** trained on 300 billion tokens.[^brown2020] Across diverse language benchmarks, placing solved demonstrations directly inside the prefix improved task scores dramatically without gradient updates, though several reasoning and comparison tasks remained brittle. Because in-context predictions are sensitive to example ordering, prompt wording, and label formatting, prompt engineering emerged as an empirical discipline alongside training.

### 4. InstructGPT: Aligning with human preference (2022)

A pure pretraining checkpoint optimizes document continuation rather than helpful conversation, so asking `"Explain causal masking"` might yield another quiz question or a bibliography instead of an answer. Ouyang et al.'s **InstructGPT** popularized a three-stage **RLHF** alignment recipe to steer pretrained models toward following user intent.[^ouyang2022] Each stage shapes output style and reward adherence through distinct signals:

1. **Supervised Fine-Tuning (SFT):** Fine-tune the pretrained model on curated human-written prompt-and-response demonstrations so it adopts an assistant turn structure.
2. **Reward Modeling (RM):** Sample multiple candidate replies per prompt, collect human pairwise rankings, and train a scalar reward model to assign higher scores to preferred completions.
3. **Reinforcement Learning (PPO):** Optimize the policy to maximize predicted reward while applying a KL-divergence penalty relative to the SFT reference so text fluency stays intact (their PPO-ptx variant also mixed pretraining gradients to curb benchmark regressions).

On InstructGPT's API evaluation distribution, human labelers preferred outputs from a 1.3B aligned model over the 175B pretrained GPT-3 baseline.[^ouyang2022] Preference alignment improves helpfulness and instruction adherence, though reward models can still reinforce confident-sounding factual errors unless verified against evidence. Modern preference optimization methods such as Direct Preference Optimization (DPO) simplify that final step by optimizing directly on `(prompt, chosen, rejected)` triples using Bradley-Terry preference probabilities over log-likelihood margins. Run this NumPy calculation to compute pairwise preference probabilities and DPO implicit reward margins on grounded technical explanations:

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

Deployment checkpoints reflect distinct post-training stages, and developers match those roles carefully to application requirements. Selecting a base checkpoint when an interactive interface expects instruction formatting causes rambling continuations, whereas using a chat checkpoint for raw log-likelihood scoring adds template overhead. Understanding what each stage optimizes makes checkpoint selection predictable:

| Checkpoint type | Primary training objective | Expected behavior | Typical production use |
|---|---|---|---|
| **Base model** | Next-token pretraining on large corpora | Continues text naturally with weak turn discipline | Continued pretraining, domain fine-tuning, or likelihood scoring |
| **Instruct model** | Instruction SFT paired with preference or RL optimization | Follows explicit task instructions and formats | Classification, structured extraction, and single-turn synthesis |
| **Chat model** | Conversation-formatted multi-turn post-training | Respects system, user, and assistant role delimiters | Interactive assistants paired with external memory and tools |

A **chat template** serializes message turns into the exact control tokens a checkpoint learned during post-training.[^huggingface2026chattemplates] Templates differ even across models sharing a base family, and releases such as DeepSeek-V4.1-Flash distribute a custom encoding helper alongside model weights rather than a single Jinja template.[^deepseek2026v41flash] Always invoke the checkpoint's official template cleanly without double-wrapping special tokens. Because stateless inference endpoints retain no memory between HTTP requests, applications store conversation turns explicitly and re-send the serialized prefix on each turn.

```checkpoint
What does the 1.3B InstructGPT preference comparison prove, and what does it leave unresolved?
---
It shows that instruction and preference tuning can outweigh two orders of magnitude in raw parameter count for human-judged helpfulness on API prompts. It does not prove superior factual recall, math accuracy, or reasoning ability, which must be evaluated separately.
```

<span id="scaling-laws-and-compute-optimality"></span>
## What scaling laws say about a fixed training budget

Every large pretraining run confronts a constrained allocation decision over parameter count $N$ and training token count $D$ given a fixed floating-point compute budget $C$. Kaplan et al. (2020) fitted empirical power laws connecting validation cross-entropy loss to $N$, $D$, and compute $C$, concluding that parameter count should grow substantially faster than dataset size.[^kaplan2020] Guided partly by those early curves, major 2020-2021 models pushed parameters upward toward 175B in GPT-3 (~1.7 tokens per parameter) and 280B in **Gopher** (~1.1 tokens per parameter), while keeping pretraining corpora near 300 billion tokens.[^hoffmann2022]

$$
N \propto C^{0.73}, \quad D \propto C^{0.27} \quad \text{(Kaplan 2020)}
$$

Hoffmann et al. (2022) revisited that trade-off across more than 400 Transformer runs spanning 70M to over 16B parameters, matching each model's cosine learning-rate decay horizon directly to its target token budget rather than slicing checkpoints from one shared run.[^hoffmann2022] Under matched decay schedules, **Chinchilla** observed near-equal optimal scaling ($N \propto C^{0.5}, D \propto C^{0.5}$), meaning doubling model weights calls for roughly doubling training tokens around **20 tokens per parameter**. At the same reported compute budget as 280B Gopher, 70B Chinchilla trained on 1.4 trillion tokens and outperformed Gopher on aggregate MMLU and BIG-bench evaluations, though modern checkpoints like Llama 3 8B overtrain past `15T` repeated high-value tokens to minimize downstream inference costs.[^hoffmann2022][^dubey2024]

| Model run | Parameters ($N$) | Training tokens ($D$) | Tokens per parameter | Training regime |
|---|---:|---:|---:|---|
| Gopher | 280B | 300B | ~1.1 | Undertrained relative to Chinchilla frontier |
| GPT-3 | 175B | 300B | ~1.7 | Undertrained under matched-compute comparison |
| Chinchilla | 70B | 1.4T | 20.0 | Tests compute-optimal training ratio |
| LLaMA 1 | 65B | 1.4T | ~21.5 | Public-data training targeting strong smaller models |
| Llama 3 | 8B | >15T | >1,875 | Overtrained beyond 20:1 to shrink inference cost |

Vectorized NumPy code makes it straightforward to compare tokens-per-parameter ratios alongside Hoffmann et al.'s parametric loss decomposition $L(N, D) = E + A / N^{\alpha} + B / D^{\beta}$. Because the fitted curve models loss under fixed corpus statistics, real models like Llama 3 8B achieve lower real-world perplexity than the 2022 fit predicts thanks to multi-stage filtering and curriculum improvements. Run the calculation below to verify how published parameter counts compare on ratios and raw fitted loss:

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

Dense Transformer training cost follows the standard approximation $C \approx 6ND$ FLOPs, counting forward pass ($2ND$ FLOPs for one multiply-add per weight per token) and backward pass ($4ND$ FLOPs for activation and weight gradients).[^hoffmann2022] Embeddings, attention softmax, and MoE routing shift exact counts at very small widths or sparse designs, yet $6ND$ makes training budget trade-offs transparent across candidate runs. Notice in the NumPy calculation below how changing $N$ or $D$ impacts both total compute and tokens per parameter:

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

Scaling both $N$ and $D$ by $2\times$ multiplies training FLOPs by **four**, matching the compute cost of expanding only parameters $4\times$ or only tokens $4\times$ while preserving balanced capacity and data. Chinchilla optimality minimizes pretraining loss for that fixed training FLOP budget, ignoring inference economics. Once a model serves millions or billions of requests, inference cost dominates total spend, making smaller "overtrained" checkpoints economically superior.[^touvron2023][^dubey2024] Investing extra training compute into an 8B model rather than stopping at a 20:1 Chinchilla split cuts memory footprint, batch latency, and GPU count per served request across the entire operational lifetime of the checkpoint.

```checkpoint
Why do modern labs intentionally train 8B models on 15 trillion tokens, far beyond Chinchilla's 20:1 training ratio?
---
Chinchilla's ratio minimizes pretraining loss for a fixed training budget. When a model serves heavy production traffic, extra pretraining on a smaller checkpoint pays for itself by reducing weight memory, GPU count, and per-token latency across billions of inference tokens.
```

<span id="modern-frontier-architectures-rmsnorm-swiglu-and-rope"></span>
## Three newer building blocks: RMSNorm, SwiGLU, and RoPE

Modern decoder architectures also refined three inner components introduced after the original 2017 Transformer, popularized widely by LLaMA and subsequent open models.[^touvron2023] Specific releases still mix alternatives, such as original Gemma's GeGLU feed-forward block.[^gemmaTeam2024Architecture] Comparing normalization, gated MLPs, and rotary position encodings highlights how small mathematical edits simplify kernels and support longer sequences.

### 1. Root Mean Square Normalization (RMSNorm)

Standard LayerNorm centers activations by subtracting mean $\mu$ and dividing by centered standard deviation $\sqrt{\sigma^2 + \epsilon}$, followed by learned scale $\gamma$ and bias $\beta$.[^pytorch_layernorm] Zhang and Sennrich (2019) showed that dropping both mean centering and the bias offset leaves stability and perplexity competitive in tested Transformers while simplifying the statistic to root-mean-square magnitude $\text{RMS}(x) = \sqrt{\frac{1}{d} \sum_{i=1}^d x_i^2 + \epsilon}$ and output $\frac{x}{\text{RMS}(x)} \odot \gamma$.[^zhang2019][^pytorch_rmsnorm] LayerNorm removes common-mode offsets across features before rescaling, whereas RMSNorm preserves non-zero constant offsets while normalizing vector energy. Fused CUDA kernels determine concrete speedups on modern accelerators, making empirical profiling necessary when benchmarking either normalization layer.

### 2. SwiGLU activations and Rotary Position Embeddings (RoPE)

Early Transformer MLPs applied ReLU or GELU inside a two-matrix expansion $\text{activation}(xW_1)W_2$, whereas Gated Linear Units multiply two parallel projections so one learned gate modulates the linear value stream.[^shazeer2020] **SwiGLU** applies $\operatorname{SiLU}(z) = z\,\sigma(z)$ to the gate branch inside $(\operatorname{SiLU}(x W_{\text{gate}}) \odot (x W_{\text{up}})) W_{\text{down}}$. Because SwiGLU replaces two $d \times d_{\text{ff}}$ matrices with three, keeping parameter count matched to a $4d$ standard FFN shrinks hidden width to $\frac{8}{3}d$ (often rounded up to hardware-friendly multiples).[^shazeer2020] Unlike sigmoid gating clamped inside $[0, 1]$, SiLU gating permits negative values and unrestricted positive scaling.

Rather than adding static position vectors solely at the embedding table, Su et al.'s **Rotary Position Embeddings (RoPE)** rotate 2D coordinate pairs inside each head's $Q$ and $K$ projections by angles $m\theta_i$ proportional to token index $m$, giving $\mathbf{q}_m = R_{\Theta, m}^d \mathbf{q}$ and $\mathbf{k}_n = R_{\Theta, n}^d \mathbf{k}$.[^su2021] Because orthogonal rotations satisfy $R_{\Theta, m}^T R_{\Theta, n} = R_{\Theta, n - m}$, the inner product $\langle \mathbf{q}_m, \mathbf{k}_n \rangle = \mathbf{q}^T R_{\Theta, n - m} \mathbf{k}$ depends strictly on relative displacement $(n - m)$ whenever unrotated content vectors stay fixed. Verify both RMSNorm stabilization and SwiGLU activation shapes directly in NumPy below:

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

With $\epsilon = 10^{-6}$ in the denominator, the output vector's root-mean-square norm sits just under `1.0`, rounding cleanly to `1.0` at four decimals. Learned per-channel weights $\gamma$ scale features freely afterward so downstream residual additions maintain arbitrary dynamic range. Without mean centering, RMSNorm skips the pass over activation averages while stabilizing forward and gradient norms cleanly.

```checkpoint
What does the RoPE identity prove about shifting a fixed query/key pair, and what does it not prove?
---
Holding unrotated $q$ and $k$ fixed, RoPE makes their dot product invariant to shared shifts in absolute position, depending solely on $n - m$. In deep trained networks, hidden representations vary with context and rotary frequencies can decay differently across dimensions, so long-context extrapolation must be tested empirically.
```

<span id="attention-scaling-and-kv-cache-bandwidth-reduction"></span>
## How attention design changes KV cache costs

At long context lengths or large batch sizes, storing and reading cached keys and values can rival or exceed model weights in GPU memory usage. With separate key and value tensors, uniform head dimension $d_{\text{head}}$, and precision $P$ bytes per element (typically `2` for FP16/BF16), total **raw KV payload** across $B$ requests of length $L$ satisfies:

$$
\text{Memory}_{\text{KV}} = 2 \times B \times L \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times P
$$

Factor `2` accounts for storing both keys and values, while ragged batches replace $BL$ with the sum of active sequence lengths and serving systems add quantization scales, page slack, and activation buffers. Because changing `n_kv_heads` scales KV cache traffic linearly, three head-sharing topologies trade cache footprint directly against head expressivity:

1. **Multi-Head Attention (MHA):** Every query head maintains its own key and value head ($n_{\text{kv\_heads}} = n_{\text{q\_heads}}$). Thirty-two query heads store 32 K heads and 32 V heads.
2. **Multi-Query Attention (MQA):** All query heads share a single K head and a single V head ($n_{\text{kv\_heads}} = 1$).[^shazeer2019] Raw KV payload drops by $1/32$ for 32 query heads, at the potential cost of quality regressions unless pretrained or uptrained carefully.
3. **Grouped-Query Attention (GQA):** Query heads partition into $g$ groups, each sharing one KV head ($n_{\text{kv\_heads}} = g$).[^ainslie2023] Using 8 KV heads across 32 query heads reduces KV memory and decode cache reads by $4\times$ while preserving perplexity close to MHA in published uptraining studies.

Compute exact raw KV cache footprints across MHA, GQA, and MQA in NumPy for an 8-request batch at 8,192 context length to see how dramatically head sharing shifts GPU RAM capacity. Notice how easily an unshared 32-head MHA cache fills a single workstation GPU before adding model weights or batch concurrency. Evaluating raw tensor byte counts explicitly keeps deployment capacity estimates realistic before writing custom kernels:

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

Moving from 32-head MHA to 8-head GQA saves **24 GiB** of raw cache memory in this configuration alone, freeing HBM headroom for larger batches or longer prompts. Next, run a NumPy 2D RoPE check confirming that rotating query and key matrices preserves dot products whenever relative displacement $m - n$ stays fixed. Verifying the shifted dot-product value directly confirms why positional offsets remain invariant under orthogonal rotation:

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

Alongside head sharing, modern runtimes pair **FlashAttention** and **PagedAttention** to eliminate attention bottlenecks cleanly. FlashAttention tiles score and probability blocks in fast GPU SRAM to avoid materializing $T \times T$ intermediate matrices in HBM, slashing memory traffic while keeping total arithmetic quadratic in $T$ with $\Theta(T^2 d^2 / M)$ HBM transfers.[^dao2022] PagedAttention manages logical KV caches via non-contiguous physical memory pages, eliminating fragmentation across varying prompt lengths and boosting batch throughput.[^kwon2023] Together, head sharing, SRAM tiling, and paged KV management lift maximum batch concurrency without altering exact mathematical attention outputs.

```checkpoint
Why can GQA lower decode latency, and why does a 75% KV reduction rarely cut end-to-end latency by 75%?
---
Reading 8 KV heads instead of 32 trims memory bandwidth spent streaming cached keys and values during attention. Total step latency also includes dense weight reads for Q/K/V/output projections, MLP layers, GPU synchronization, and scheduler overhead, so attention savings only affect attention's share of step time.
```

## Sparse architectures: Mixture of Experts (MoE)

Standard dense Transformers route every token through the same feed-forward network. **Sparsely gated Mixture-of-Experts (MoE)** layers replace that single wide MLP with $E$ parallel expert networks and a learned router that picks only the top-$k$ experts per token.[^shazeer2017][^jiang2024] Retaining the top-$k$ gating logits, masking remaining scores to $-\infty$, and applying softmax yields normalized sparse routing weights $H(x) = \text{Softmax}(\text{Top-}k(x \cdot W_g))$ and blended output $\sum_{i \in \text{Top-}k} H(x)_i \cdot \text{Expert}_i(x)$.

### The fundamental MoE tradeoff: VRAM versus FLOPs

Mixtral 8x7B holds **47 billion total parameters** across 8 experts per layer while activating only 2 experts per token, executing roughly **13 billion active parameters** per forward pass.[^jiang2024] Active parameter counts govern per-token projection FLOPs, whereas total parameters govern checkpoint memory: at 2 bytes per weight, 47B parameters occupy **94 GB (87.54 GiB)** before KV cache or activations.[^huggingface2026acceleratebigmodel] Training sparse routers cleanly also requires preventing expert collapse where every token picks the same two networks. Classical MoE adds an auxiliary load-balancing loss, whereas DeepSeek-V3 adjusts per-expert routing biases dynamically alongside a smaller sequence-level balance term.[^deepseekv3_2024]

Run a NumPy top-2 router simulation using the exact expert logits `[2.4, 0.3, 0.5, -0.2]` for `"import"` and `[0.1, 2.2, 0.7, 0.0]` for `"assertion"`, verifying both normalized weights and blended expert output vectors. Watching how top-$k$ selection masks out lower-scoring experts highlights why active FLOPs shrink even though all expert matrices sit loaded in device memory. Notice also how sharply slight logit differences steer token mass toward the leading expert:

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

Inactive experts still reside in VRAM unless offloaded across CPU/NVMe links with substantial transfer latency penalties. Consequently, sparse MoE models deliver strong FLOP efficiency only when batch sizes and cross-GPU communication stay well balanced. Serving engines must also budget full parameter VRAM even when per-token active counts look small on paper.

```checkpoint
Why do active parameters alone fail to predict either GPU memory capacity or serving latency?
---
A sparse MoE checkpoint still stores all $E$ experts in memory (roughly 94 GB for 47B FP16 weights), so active count understates VRAM requirements. Latency also includes all-to-all expert communication, load imbalance, and memory transfers, which differentiate MoE execution from a 13B dense model.
```

<span id="reasoning-models-and-test-time-compute"></span>
## Reasoning models and the cost of extra inference compute

Standard autoregressive decoding commits directly to answer tokens one step after reading the prompt. **Test-time compute** trades extra generated tokens, verifier checks, or tree search for higher accuracy on multi-step math, code synthesis, and logic problems. OpenAI o1 (2024) and DeepSeek-R1 (2025) popularized training models via reinforcement learning to generate structured internal reasoning traces before emitting final answers.[^openai_learning_reasoning_2024][^deepseekr1_2025]

During multi-step reasoning, an internal or visible scratchpad lets the model test candidate hypotheses against the prompt, detect contradictions, backtrack, and reconcile constraints before finalizing output tokens. Checked on **30 October 2026**, OpenAI's Responses API exposes `reasoning.effort` controls across supported models so callers can adjust reasoning token budgets per request.[^openai2026reasoning] Because reasoning tokens consume context window capacity and bill as generated output tokens even when hidden from final text, reserving sufficient `max_output_tokens` headroom prevents answers from truncating mid-thought. Evaluating effort settings across identical held-out benchmarks lets teams measure verified accuracy improvements directly against latency and dollar spend.

```checkpoint
How do reasoning-trained models differ from standard chat models during inference?
---
Reasoning-trained checkpoints spend variable additional decoding steps on intermediate verification and backtracking before producing a final answer. That extra compute can raise accuracy on hard multi-step tasks while increasing context consumption, latency, and billed output tokens, without eliminating the need for source grounding.
```

## Open weights, licensing, and local serving

Publicly downloadable parameters empower self-hosting, custom quantization, and specialized fine-tuning, yet **"open weights"** does not automatically mean unrestricted commercial or open-source software rights. Meta's original 2023 LLaMA release restricted weights to approved non-commercial research, setting a clear precedent that license inspection precedes every deployment decision.[^touvron2023][^meta2023OriginalLlamaRelease] Reviewing four distinct open-release dimensions separately prevents engineering teams from conflating file access with permissive usage terms:

| Category | Meaning | Required check |
|---|---|---|
| **Open weights** | Checkpoint tensors are downloadable under published terms | Inspect commercial caps, acceptable-use clauses, and redistribution rules |
| **Open-source software** | Code meets the Open Source Definition | Verify repository code dependencies and redistribution terms |
| **Open-source AI (OSI)** | Freedom to use, study, modify, and share code, weights, and data info | Check training code availability and documented data information[^osi2024] |
| **Open data** | Datasets released under stated usage licenses | Confirm whether downstream training permits derivative models |

Note that OSI's Open Source AI definition requires sufficient **data information** describing how a model was trained rather than necessarily publishing every proprietary raw corpus example, and copyleft licenses can still qualify.[^osi2024] Two model releases checked on **30 October 2026** illustrate why model cards, legal terms, and architecture specifications each deserve independent verification before committing production pipelines. Reading release notes alongside actual checkpoint manifests prevents mismatches between paper tables and deployed artifacts:

| Model release | Published specifications | Operational implications |
|---|---|---|
| **GLM-5.3** | States a 1M-token context window with post-training advances atop GLM-5.2.[^zai2026glm53guide][^zai2026glm53] | Custom GLM-5.3 license requires security review for certain MaaS providers above \$10B trailing 12-month revenue.[^zai2026glm53CurrentLicense] Verify exact tensor sizes from the released checkpoint alongside the GLM-5 paper's 744B/40B figures.[^glm52026] |
| **DeepSeek-V4.1-Flash** | MIT-licensed release noting a 552B backbone, 1M context, 8B active prefill parameters, and 16B active decode parameters.[^deepseek2026v41flash] | Combines causal encoder-decoder staging, shared compressed caches, conditional memory, and speculative decoding, requiring runtime kernels matched to those modules. |

Always pin exact checkpoint hashes or versioned API identifiers rather than floating aliases across reproducible evaluations. DeepSeek's changelog notes that older API names route dynamically (`deepseek-flash` mapped to `V4.1-Flash-1017` on 17 October), whereas local weights remain frozen at their download snapshot.[^deepseek2026v4flash0731release] Auditing weights, tokenizer configs, and chat templates together ensures an evaluation benchmark measures the exact artifact deployed later.

```checkpoint
Why is labeling an open-weight checkpoint "open source" often imprecise?
---
Downloadable parameters alone omit training pipelines, data documentation, and unrestricted commercial redistribution rights. Inspect the exact checkpoint license separately from inference library code and verify compliance with OSI AI criteria when open-source status is required.
```

## Evaluating a released model on your workload

Public leaderboards narrow candidate shortlists cleanly, yet actual deployment decisions depend on domain prompts, schema adherence, latency budgets, and unit costs. Build a clean held-out evaluation split grouping related documents to prevent leakage, include ambiguous or missing-evidence prompts that test grounded abstention, and verify structured fields independently from explanation accuracy. The NumPy scorecard below evaluates three deployment candidates (`hosted-fast`, `hosted-deep`, and `local-restricted`) across an interactive IDE assistant scenario (`p95 <= 750 ms` deadline) and an offline batch benchmark job (no latency deadline). Both runs enforce mandatory license eligibility before ranking surviving candidates with explicit weighted quality, latency, and cost objectives:

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

Disqualifying ineligible checkpoints via hard boolean masks before applying linear weights prevents high accuracy or low dollar cost from overriding non-negotiable latency or license rules. Even if a restricted checkpoint costs far less per token, masking its score to $-\infty$ ensures weighted scoring cannot promote a non-compliant candidate accidentally. Separating hard constraints from soft utility weights also lets product teams change latency deadlines cleanly without retuning quality multipliers.

```checkpoint
Why does the 94% accurate hosted-deep candidate lose in interactive IDE usage yet win in batch evaluation?
---
The 1,200 ms latency violates the hard 750 ms interactive deadline, removing hosted-deep before weighted ranking. Without a tight latency cap during batch scoring, its higher quality outweighs the extra latency and dollar spend.
```

<span id="context-window-scaling-and-lost-in-the-middle"></span>
## Longer context and the evidence that gets missed

Supporting 128k or 1M tokens in memory guarantees capacity, not uniform retrieval accuracy across every offset. Liu et al. (2023) tested multi-document question answering and key-value lookup while shifting the sole supporting document across context slots from start to finish.[^liu2023lost] Across many evaluated models, accuracy dropped markedly when decisive evidence sat in the middle compared with the beginning or end, forming a distinctive **U-shaped** performance curve.

<figure>
  <img src="illustrations/_generated/lost_in_the_middle_dark.png" alt="A 20-document context window tests evidence slots 1, 5, 10, 15, and 20 with 20 questions each. Accuracy forms a U-shaped curve: 15 of 20 at slot 1, 10 of 20 at slot 5, 7 of 20 in the middle at slot 10, 10 of 20 at slot 15, and 14 of 20 at slot 20." />
  <figcaption>Twenty retrieved documents hold one evidence passage shifted across positions 1, 5, 10, 15, and 20, illustrating the U-shaped middle retrieval drop characterized by Liu et al.</figcaption>
</figure>

While attention weights toward early tokens ("attention sinks") correlate with long-context stability, diagnosing a retrieval drop requires moving the exact evidence across matched positions and scoring end-task correctness directly. Repeating the task query both before and after context documents helped synthetic key-value lookup in Liu et al.'s experiments yet barely changed multi-document QA curves, underscoring why prompt layouts must be measured on the target task.[^liu2023lost] Computing the position-sweep accuracy curve, edge-versus-center drop, and quadratic curvature in NumPy quantifies that U-shaped degradation directly across slots:

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

When assembling long technical documents or retrieval chunks for an assistant, structured prompt packing reduces positional forgetting and trims prefill cost. Organizing the prompt explicitly keeps governing instructions separate from retrieved snippets while placing relevant facts near high-attention regions. Three concrete habits help stabilize long-context generation:

1. **Place governing instructions cleanly:** Put system instructions in the model's supported system or developer role and wrap retrieved documents inside explicit delimiters so untrusted source text stays separate from directives.
2. **Test task and evidence placement:** Compare instruction-before-context, instruction-after-context, and adjacent evidence ordering empirically while preserving logical chronology where needed.
3. **Prune low-value filler:** Trimming redundant background chunks shrinks prefill FLOPs and KV cache pressure while keeping decisive passages closer to attention peaks.

This NumPy simulation models attention weight landing on the decisive `causal_mask` snippet when placed at slot 1 (start), slot 4 (middle), or slot 6 (immediately adjacent to the trailing question) under combined primacy and recency weighting. Comparing slot weights quantitatively illustrates why placing retrieved evidence directly before the user query raises focus without rewriting prompt instructions. Running that packing sensitivity check on synthetic chunk sequences also mirrors how retrieval rerankers place top snippets last inside the prompt:

<!-- leetllm: test, deps=numpy, output=show, output_title="Context packing output" -->
```python title="evidence-near-question.py"
import numpy as np

chunks = [
    "Policy: explain attention behavior using cited source lines.",
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
1: weight=0.209 | Policy: explain attention behavior using cited source lines.
2: weight=0.151 | Note A: RoPE applies pairwise 2D rotations to queries and keys.
3: weight=0.141 | Note B: RMSNorm omits mean subtraction across features.
4: weight=0.185 | Note C: Weight tying shares embedding and LM head matrices.
5: weight=0.313 | Evidence: causal_mask sets future scores (j > i) to -inf before softmax.
evidence_adjacent_to_question: True
adjacent_evidence_weight:      0.313
```
<!-- leetllm: output:end -->

```checkpoint
Why does retrieval-augmented generation (RAG) remain useful even when models advertise 1-million-token context windows?
---
Retrieval surfaces focused, current evidence while shrinking prompt prefill latency and KV cache consumption compared with passing an entire repository or corpus raw. Large context windows still help when whole-document structure matters, so pairing selective retrieval with position-aware packing balances cost and accuracy.
```

## Match the architecture to the job

Complex language systems combine multiple specialized models instead of routing every task through one massive autoregressive decoder. Separating embedding lookup, rapid tagging, interactive conversation, and deliberate reasoning cuts latency and GPU memory per user request while keeping answer quality high. Use the matrix below to match each NLP workload stage with the right model family and measurement target:

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
