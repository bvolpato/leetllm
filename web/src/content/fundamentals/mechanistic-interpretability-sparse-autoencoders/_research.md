---
query: "We are creating a research-backed page for the following: \"Mechanistic Interpretability\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: fundamentals\nCurrent page scope: Learn how sparse autoencoders decompose transformer activations into candidate interpretable features, support circuit tracing, and enable controlled activation-steering experiments.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 6 opaque source annotation(s) without direct URLs\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "ca5a2bd1bb7e80ec587f39e709c27536"
status: "completed"
---

# Curriculum Article Outline: Mechanistic Interpretability

**Research Refresh ID:** 2026-08-13
**Curriculum Section:** Fundamentals

**Manual verification:** September 22, 2026. Keep the 2023/2024 dictionary-learning results, 2025 local circuit-tracing method, and 2026 evaluation/readout developments distinct. Reconstruction, label quality, edit consequences, and complete mechanism are separate claims.

## 1. Prerequisites and Mastery Outcomes

**Prerequisites:**

- Understanding of the standard Transformer architecture (multi-head attention, MLP layers, layer normalization, residual streams).
- Familiarity with standard deep learning training loops and PyTorch.
- Basic understanding of computational graphs and causal interventions (e.g., patching or ablation).

**Mastery Outcomes:**
By the end of this module, learners will be able to:

1. Explain superposition as a hypothesis and distinguish it from polysemantic coordinates alone.
2. Implement a minimal SAE and evaluate reconstruction, support, held-out data, and generating-direction alignment separately.
3. Form a feature-circuit hypothesis and test specified edits with matched controls and preserved reconstruction error.
4. Explain why a cached coefficient edit need not fix its re-encoded value, and why behavioral effects require measurement.

## 2. Core Concept: Superposition and Polysemanticity

Before understanding SAEs, learners must understand the problem they solve.

- **Basis Choice:** Residual coordinates and MLP neurons are different candidate units; the MLP nonlinearity acts coordinate-wise. Mixed coordinates alone don't establish more features than dimensions.
- **Polysemanticity:** A single neuron might fire for "spiders", "the French Revolution", and "HTML syntax".
- **Superposition Hypothesis:** Features may occupy an overcomplete set of non-orthogonal directions. [Toy Models of Superposition](https://transformer-circuits.pub/2022/toy_model/index.html) studies sparse synthetic features and nonlinear filtering, not universal counts or guaranteed interference removal. Coherence bounds accumulate across active magnitudes.

## 3. Mechanism: Sparse Autoencoders (SAEs)

SAEs learn candidate sparse dictionaries from frozen-model activations. Proxy metrics don't guarantee a unique dictionary or recovery of true generating features. [Cunningham's study](https://arxiv.org/html/2309.08600) uses tied weights; [Gao's recipe](https://cdn.openai.com/papers/sparse-autoencoders.pdf) uses tied initialization followed by independent encoder/decoder training.

### Architecture & Equations

An SAE takes an activation vector x from a specific point in a transformer (e.g., the middle of an MLP or the residual stream) and attempts to reconstruct it using a wide, sparse bottleneck.

- **Encoder:** Maps the activation to a high-dimensional feature space.

`z = ReLU(W_enc @ (x-b_dec) + b_enc)` for a shared-reference formulation; pre-encoder subtraction is optional, and learned b_dec need not equal the data mean.
- **Decoder:** Reconstructs the original activation.

`x_hat = W_dec @ z + b_dec`.
- **Loss Function:** Balances reconstruction accuracy (Mean Squared Error) with sparsity (L1 penalty).

`loss = mean((x-x_hat)^2) + lambda * mean(abs(z))` in the lesson's minimal convention. Sum versus mean changes coefficient scaling.

The L1 penalty encourages smaller magnitudes; ReLU's threshold gives exact zeros. Active-latent count L0 must be measured rather than inferred from lambda.

### Tradeoffs & Implementation Details

- **Feature Shrinkage:** A fixed unit decoder with loss `(a-z)^2+lambda*z` has optimum `max(0,a-lambda/2)`. Decoder renormalization prevents a reparameterization loophole; it doesn't itself eliminate magnitude shrinkage. [Gated SAEs](https://arxiv.org/html/2404.16014) share projection directions and train rectified gate pre-activations with L1 plus an auxiliary reconstruction using detached decoder parameters. [JumpReLU](https://arxiv.org/html/2407.14435) uses learned positive thresholds and custom windowed threshold gradients for its L0 objective.
- **Dead Latents:** Specify inactivity window and data coverage. [Anthropic's 2023 resampling](https://transformer-circuits.pub/2023/monosemantic-features/index.html) checks 12.5k steps at 25k-step intervals, samples input vectors with squared-loss probabilities, and resets affected optimizer state. It doesn't initialize from reconstruction residuals. [Gao's AuxK](https://cdn.openai.com/papers/sparse-autoencoders.pdf) trains selected inactive latents on reconstruction error; neither method guarantees revival or is mandatory in every recipe.

## 4. Circuit Tracing with SAE Features

Traditional circuit tracing (like finding the Indirect Object Identification circuit) relies on attention heads and individual neurons. SAEs allow for higher-resolution circuit analysis.

- **Feature-Level Attribution:** Instead of asking "which attention head contributed to this output?", researchers ask "which SAE feature caused the downstream 'Eiffel Tower' feature to fire?"
- **Error Terms:** With `e = x-x_hat`, remove a feature as `x_new = x-z_f*d_f` rather than discarding e. Tiny activation MSE can still change a downstream readout sharply. [Sparse Feature Circuits](https://arxiv.org/html/2403.19647) includes error components and distinguishes Pythia-trained SAEs from existing Gemma Scope dictionaries with different hooks.
- **Local Attribution Graphs:** [Circuit Tracing methods](https://transformer-circuits.pub/2025/attribution-graphs/methods.html) uses CLT features that read at one layer and decode into that and later MLP outputs. Its prompt-local model freezes attention and normalization denominators and adds errors as constants. Direct contribution paths stop intervening MLP outputs; error and suppressed-feature mechanisms remain incomplete. Baseline agreement doesn't certify unchanged mechanisms under edits.

## 5. Activation Steering (Intervention)

A learned decoder direction supplies an edit to test, without guaranteed semantic purity or predictable behavior.

- **Forward-Pass Intervention:** By identifying the feature vector vfeature​ for a specific concept (e.g., "sycophancy" or a specific entity), you can manually add this vector to the model's residual stream during generation.
- **Formula for Steering:**

`x_steered = x + alpha*d_f`. Cached-coefficient clamping uses `(c-z_f(x))*d_f`; re-encoding the edited state need not return c.

*Where α is a scaling multiplier dictating the strength of the intervention.*
- **Concrete Example:** [Scaling Monosemanticity](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html) reports Golden Gate Bridge-related responses after large feature edits, with prompt/feature-dependent effects. It preserves reconstruction error and edits every token position; extreme scales can produce nonsense. These historical Sonnet results don't certify general-purpose semantic control.

## 6. Current Tools and Libraries

To implement labs and practice concepts, learners should utilize standard community tooling:

- **TransformerLens:** Cache/edit activations using the installed version's supported interface. Current README recommends TransformerBridge and states legacy HookedTransformer.from_pretrained was removed in 4.0; raw versus folded/centered weight conventions change activation coordinates. [TransformerLens GitHub](https://github.com/TransformerLensOrg/TransformerLens)
- **SAELens:** Train/analyze/load dictionaries; inference supports generic PyTorch activation extraction as well as TransformerLens integration. Its current docs describe the v6 training refactor. [SAELens GitHub](https://github.com/decoderesearch/SAELens)
- **Circuit-tracer:** Graph construction and interventions require a supported checkpoint and pretrained transcoders, not merely an arbitrary SAE. [Circuit-tracer GitHub](https://github.com/decoderesearch/circuit-tracer)

## 7. Common Mistakes & Failure Modes

- **Confusing Correlation with Causation:** An SAE feature firing strongly on a specific input does not mean it causally drives the output. Learners must verify features via causal scrubbing or ablation.
- **Ignoring the Error Term:** Treating the SAE decomposition as a mathematically perfect representation of the model's cognition. If the SAE only achieves 85% variance explained, the remaining 15% might contain the actual computation.
- **Over-interpreting Noisy Steering:** Steering vectors often capture correlated concepts (e.g., steering for "anger" might accidentally steer for "profanity").

## 8. Stale Claims and Disputed Research

- **"SAEs solve interpretability completely."** *Disputed.* While SAEs isolate features, they do not explain the non-linear interactions *between* features (how features are computed). Finding the features is only step one; mapping the full computational graph remains an unsolved scaling challenge.
- **Architecture Rankings:** Compare held-out reconstruction, support, downstream damage, and validation under matched recipes. JumpReLU's reported advantage concerns the paper's Gemma 2 9B sites; it isn't a universal ranking. [JumpReLU experiments](https://arxiv.org/html/2407.14435)
- **Metrics and Absorption:** Lower support can favor a specialized decoder that also writes broader information, harming the general detector's recall. Sweeping width/sparsity alone need not solve it. [Feature absorption](https://arxiv.org/html/2409.14507)
- **2026 Null Models:** Aggregate automated interpretability and reconstruction scores often fail to distinguish trained and randomized Pythia variants. Compare appropriate null models rather than dismissing every learned feature. [ICLR 2026 paper](https://proceedings.iclr.cc/paper_files/paper/2026/file/7ab63a5314680e2f083cb288abeaeb8e-Paper-Conference.pdf)
- **2026 Readouts:** Natural language autoencoders learn activation-to-text-to-activation reconstruction and support auditing hypotheses. Explanations can confabulate, infer beyond the activation, and lack circuit-level grounding. [NLA paper](https://transformer-circuits.pub/2026/nla/index.html), [official overview](https://www.anthropic.com/research/natural-language-autoencoders)
