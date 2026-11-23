---
{
  "id": "slm-specialization-edge-deployment",
  "title": "SLM Specialization & Edge Deployment",
  "slug": "slm-specialization-edge-deployment",
  "section": "Inference & Production Scale",
  "category": "Inference Optimization",
  "difficulty": "Hard",
  "order": 20,
  "companies": [
    "Meta",
    "Microsoft",
    "Apple",
    "Google DeepMind",
    "Qualcomm",
    "MLC AI",
    "Ollama"
  ],
  "shortDescription": "Fit a small model to an offline device job, then check whether quality, heat, privacy, and updates still hold after the weights leave the server.",
  "keyConceptsTested": [
    "LLM knowledge distillation",
    "MobileLLM architecture choices",
    "Phi-style data-centric recipe",
    "On-device runtimes and compilers",
    "Edge deployment constraints",
    "Data-flow boundaries for local inference and permitted cloud routes",
    "Quantization and weight sharing impact on mobile decode speed and quality"
  ],
  "prerequisites": [
    "local-llm-deployment-hardware-quantization",
    "model-quantization-gptq-awq-gguf",
    "kv-cache-paged-attention-llm-serving",
    "knowledge-distillation-llms"
  ],
  "relatedQuestions": [
    "speculative-decoding",
    "long-context-window-management",
    "model-gateways-routing-fallbacks",
    "llm-deployment-gpu-serving-autoscaling",
    "knowledge-distillation-llms",
    "local-llm-deployment-hardware-quantization"
  ],
  "coverImage": "illustrations/_generated/edge_deployment_stack_dark.png"
}
---

Running language models on mobile, industrial, and embedded hardware flips every cloud-serving assumption. On an offline terminal or smartphone SoC, you operate without datacenter connectivity under tight unified-memory caps, fanless thermal dissipation, and strict battery budgets. Suppose a portable field unit enforces a 4 GB model residency limit, a 50 GB/s unified memory bus, and a 3.5 W sustained power envelope while targeting under 250 ms time to first token (TTFT), at least 18 generated tokens/s after ten minutes of continuous load, and an eight-hour operating shift. Meeting all four constraints simultaneously forces quantization, distillation, and runtime lowering choices long before deployment.

Not every device task requires autoregressive generation, and matching model complexity to the error budget prevents unnecessary compute. A lookup index already resolves exact specification tables, and a compact classifier routes fault reports in a few milliseconds. Generating cited, multi-sentence explanations from retrieved local manuals carries a much higher latency and verification cost, so checkpoint residency is only one dimension alongside tail latency, energy draw, application isolation, and safety validation. Offline execution simply means no network path exists; true device isolation depends on OS sandboxing and explicit data-flow controls rather than a single inference flag.

A <span data-glossary="small-language-model">small language model (SLM)</span> is defined by its parameter and compute footprint relative to a baseline, spanning anything from 125M-parameter mobile decoders to 4B-class edge models. **Specialization** adapts model behavior to a narrow domain through curated training data, knowledge distillation, retrieval, or structured decoding, without discarding general reasoning unless weights are pruned or overwritten. **Edge deployment** covers any environment executing close to the data source, spanning phones, embedded NPUs, and workstation appliances. Building directly on [local memory and hardware sizing](/learn/local-llm-deployment-hardware-quantization) and [knowledge distillation](/learn/knowledge-distillation-llms), we now quantify how weight precision, KV-cache geometry, and speculative drafts fit within edge hardware ceilings.

<figure>
  <img src="illustrations/_generated/edge_deployment_stack_dark.png" alt="Comparison across four edge configurations under a 4 GB RAM budget, 50 GB/s memory bus, and 18 tokens/s decode floor: 8B FP16 needs 16 GB and exceeds RAM at 3.1 t/s; 3.8B INT8 takes 3.8 GB weights plus KV and hits 13.2 t/s; distilled 3.8B INT4 fits in 1.9 GB and clears 18 t/s at 26.3 t/s; distilled 1.7B INT4 with a 0.3B speculative draft cuts active memory to 1.1 GB and raises effective decode speed past 38 t/s." />
  <figcaption>Under a 50 GB/s bus and 4 GB RAM cap, moving from 8-bit to distilled 4-bit weights halves streaming traffic and clears the 18 t/s decode floor, while pairing a 1.7B student with a speculative draft pushes throughput even higher.</figcaption>
</figure>

```checkpoint
Which device and task constraints determine whether an edge SLM is viable?
---
A viable model must satisfy a specific offline job, latency target, privacy boundary, resident memory budget, power draw, and sustained thermal limit on real hardware. Those physical constraints decide the model size and runtime.
```

## Start from the physical constraint, not the model size

Broad capability can be useful, but the terminal's job is narrower: extract error codes, locate approved manual passages, and explain the retrieved evidence. Start by measuring those behaviors. A specialist can outperform a larger baseline on a particular evaluation; transfer to other tasks depends on training and workload. Specialization is not equivalent to pruning, and local execution removes an inference round-trip only when the rest of the pipeline is local too.

Before picking weights, define each offline job and quantify its failure cost. Ask whether a deterministic lookup, a classical classifier, an extractive retrieval pipeline, or a generative SLM is required. "What model fits in 4 GB of RAM?" supplies one capacity constraint; it is not a complete engineering specification.

For an industrial inspection handheld, candidate operational bars span four distinct device tasks that demand completely different inference architectures:

| Job on device | Proposed latency target | Privacy rule | Baseline to try first |
|---------------|----------------|--------------|---------------------|
| Basic intent routing ("is this a fault or escalation?") | p95 < 60 ms per classification | Local only | Rules or a compact classifier |
| Field policy Q&A with citations | p95 < 250 ms <span data-glossary="ttft">time to first token (TTFT)</span>; 18 t/s at ten minutes | Local only | Local retrieval plus an instruct SLM, compared with extractive answers |
| Damaged-item photo + text decision support | p95 < 400 ms for the defined output | Local only | A vision classifier or two-stage vision/text pipeline |
| Facility policy lookup while offline | p95 < 60 ms per lookup | Local only | Indexed local documents, without generation |

Notice how no single row mandates a parameter count. An image classifier's total inference latency differs completely from a generative model's first-token latency. Time to first token (TTFT) must also measure the complete pipeline: application dispatch, local retrieval, prompt templating, tokenization, and prefill compute until the first visible answer token arrives. If a model emits hidden reasoning tokens first, track both first-generated-token latency and first-visible-token latency.

The following filter screens candidate task routes against their privacy flags, latency ceilings, and minimum accuracy gates, assuming a separate security pass sets `privacy_local` before execution:

<!-- leetllm: test, output=show -->
```python title="edge-job-admission.py"
jobs = [
    {
        "name": "intent",
        "privacy_local": True,
        "p95_ms": 42,
        "max_p95_ms": 60,
        "quality": 0.98,
        "min_quality": 0.97,
    },
    {
        "name": "policy_qa",
        "privacy_local": True,
        "p95_ms": 228,
        "max_p95_ms": 250,
        "quality": 0.93,
        "min_quality": 0.92,
    },
    {
        "name": "photo_support",
        "privacy_local": True,
        "p95_ms": 470,
        "max_p95_ms": 400,
        "quality": 0.91,
        "min_quality": 0.92,
    },
]

approved = [
    job["name"]
    for job in jobs
    if job["privacy_local"] is True
    and job["p95_ms"] < job["max_p95_ms"]
    and job["quality"] >= job["min_quality"]
]
print(f"routes passing device thresholds: {approved}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
routes passing device thresholds: ['intent', 'policy_qa']
```
<!-- leetllm: output:end -->

Photo support misses both its latency ceiling and quality threshold because vision-encoder prefill blows past the 400 ms budget. Intent routing and policy Q&A clear these preliminary numerical checks, though final qualification still depends on hardware thermal and memory soak tests. Even among passing rows, workloads differ fundamentally: intent routing chooses an execution lane in one forward pass, whereas policy Q&A must retrieve passages, ground claims with exact citations, and abstain cleanly when evidence is missing.

```checkpoint
In the inspection handheld example, why is "maintenance policy Q&A with citations" a different model target than "basic intent routing"?
---
Routing selects an execution path. Policy Q&A needs correct retrieval, citations that support the claims, and abstention when evidence is insufficient. Compare extractive answers with generation; latency and required parameter counts depend on workload measurements.
```

## A bandwidth worksheet, with its assumptions visible

For a dense model whose matrix weights exceed cache capacity, batch-1 decode often spends much of its time moving weights. Compute, attention, small kernel launches, format conversion, and runtime scheduling can also limit it. Embedding lookups, inactive experts, cached weights, and immediate reuse invalidate an assumption that every stored parameter is read from DRAM on every token.

Let $P$ count active matrix weights touched in a decode step, assuming one packed-weight read from DRAM and two floating-point operations per multiply-accumulate with negligible KV traffic. Dividing those operations by the packed byte payload produces an arithmetic-intensity baseline per weight width. With that baseline fixed, hardware utilization depends primarily on how fast DRAM supplies each weight block:

$$
\text{Arithmetic Intensity} = \frac{\text{FLOPs per token}}{\text{Bytes moved per token}} \approx \frac{2 \times P}{P \times \frac{\text{bits}}{8}} = \frac{16}{\text{bits}} \text{ FLOPs/byte}
$$

This streaming ratio gives $1$ FLOP/byte for $16$-bit weights and $4$ FLOPs/byte for $4$-bit weights. Over a $50$ GB/s bus, 4-bit weights reach $50\text{ GB/s} \times 4\text{ FLOP/byte} = 200\text{ GFLOP/s}$ of effective matrix work before dequantization, scale reads, or cache traffic. Because integer TOPS, sparse operation counts, and floating-point FLOPs measure completely different hardware units, dividing this work rate by an NPU's headline TOPS metric does not determine actual utilization or idle bubbles. Combining active parameter bytes with bus bandwidth yields a clean upper bound on decode rate:

$$
\text{Weight-streaming ceiling (tokens/s)} = \frac{\text{Memory bandwidth (GB/s)}}{\text{Active weight footprint (GB)}}
$$

Assume a dense 3.8B-parameter model streams all active matrix weights once per generated token over a 50 GB/s bus, totaling 3.8 GB at 8-bit precision or 1.9 GB at 4-bit precision. That calculation leaves out quantization group scales, KV reads, activation traffic, and kernel launch gaps, so any speed it produces is strictly an optimistic ceiling. Even so, testing candidate bit widths against this simple bound immediately rules out architectures that cannot reach interactive throughput:

<!-- leetllm: test, output=show -->
```python title="phone-bandwidth-ceiling.py"
def weight_gb(params_billion: float, bits: int) -> float:
    return params_billion * bits / 8


def weight_streaming_ceiling(bandwidth_gbs: float, active_weight_gb: float) -> float:
    return bandwidth_gbs / active_weight_gb


params_b = 3.8
bandwidth_gbs = 50.0  # 50 GB/s mobile unified-memory bus
floor_tps = 18.0

for bits in (8, 4):
    artifact_gb = weight_gb(params_b, bits)
    ceiling = weight_streaming_ceiling(bandwidth_gbs, artifact_gb)
    print(
        f"{bits}-bit: {artifact_gb:.1f} GB weights, "
        f"ceiling {ceiling:.1f} t/s, "
        f"not ruled out by this bound: {ceiling >= floor_tps}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
8-bit: 3.8 GB weights, ceiling 13.2 t/s, not ruled out by this bound: False
4-bit: 1.9 GB weights, ceiling 26.3 t/s, not ruled out by this bound: True
```
<!-- leetllm: output:end -->

Under these assumptions, the eight-bit candidate misses the $18$ steps/s target: $50/3.8 \approx 13.2$ steps/s. The four-bit estimate clears this throughput gate at $26.3$ steps/s, pending a working kernel and device measurement. Changing the model's active weights, cache reuse, or decoding algorithm changes the worksheet; measure token rates on the target device.

<figure>
  <img src="illustrations/_generated/bandwidth_streaming_ceiling_dark.png" alt="The same 3.8 billion active matrix weights stream over a 50 GB/s mobile memory bus. One full read occupies 3.8 GB at 8 bits and 1.9 GB at 4 bits, producing conditional ceilings of 13.2 and 26.3 tokens per second on one shared scale. The 18-token-per-second target falls between them. Packet widths use the byte counts and the rate markers use the displayed calculations." />
  <figcaption>One full active-weight read caps the 8-bit worksheet at 13.2 t/s. The 4-bit estimate clears the 18 t/s target before compute, cache, kernel, and scheduling costs.</figcaption>
</figure>

Total runtime memory footprint requires accounting for every active buffer beyond the raw checkpoint file size. Quantized model weights sit alongside growing KV cache pages, intermediate activation buffers, and framework allocator overhead that often live in separate pools. Summing those components predicts whether a process survives sustained multi-turn load on a memory-constrained device:

$$
\text{Memory}_{\text{total}} = \text{Weights} + \text{KV Cache} + \text{Activation Buffers} + \text{Runtime Overhead}
$$

Flash storage, general system RAM, and accelerator-mapped heaps operate as separate allocation pools. An archive can fit cleanly on disk while serving fails at load time or triggers an OS low-memory kill once tokenizer tables, retrieval indexes, multimodal encoders, and scratch workspaces expand simultaneously. Architectural designs such as MobileLLM tackle these sub-billion constraints directly through deeper, thinner topologies and weight reuse, yet measured residency and throughput on target hardware still remain decisive.[^liu2024mobilellm]

```checkpoint
Why does an NPU with $45$ TOPS of compute still struggle to generate $20$ tokens per second for a $3$B-parameter model?
---
If its active matrix weights require $1.5$ GB of DRAM traffic per step and only $50$ GB/s is available, that traffic alone takes $1.5\text{ GB}/(50\text{ GB/s}) = 30\text{ ms}$, giving about $33$ steps/s before other work. Compute TOPS remain largely idle while waiting on memory transactions.
```

## Distillation: transferring dark knowledge to compact silicon

A weight-streaming bound rules out checkpoints that exceed memory bandwidth, yet shrinking parameter counts alone cannot preserve multi-step citation accuracy or tool calling. Knowledge distillation bridges this capability gap by training a compact student directly on a larger teacher's probability distributions and intermediate representations. Neither a frontier teacher nor identical student-teacher architectures are required, and once training finishes, the teacher weights never ship to the edge device.[^hinton2015]

In classification, hard labels tell the student which class won, but hide how the teacher ranked the alternatives. In language modeling, teacher <span data-glossary="logits">logits</span> provide a dense probability distribution over the entire vocabulary. This distribution contains "dark knowledge": the subtle semantic relationships between runner-up tokens that were plausible versus those that were absurd.

### The distillation objective

During token-level distillation, training minimizes a weighted sum of standard cross-entropy against hard target labels and forward Kullback-Leibler (KL) divergence between temperature-scaled teacher and student distributions. Hard cross-entropy anchors the student to the ground-truth token observed in the corpus, while forward KL asks the student to allocate probability across plausible runner-up alternatives suggested by the teacher. Balancing both terms with a scalar weight and squared temperature scaling prevents either objective from dominating gradient magnitude:

$$
\begin{aligned}
\mathcal{L}_{\text{distill}}
=&\;\alpha \tau^2 \cdot \text{KL}\left(
\sigma\left(\frac{z_T}{\tau}\right)
\parallel
\sigma\left(\frac{z_S}{\tau}\right)
\right) \\
&+ (1-\alpha) \cdot \text{CE}(y, z_S)
\end{aligned}
$$

Here $z_T$ and $z_S$ denote aligned teacher and student logits, positive $\tau$ sets the <span data-glossary="temperature">temperature</span>, $\sigma$ is the softmax function, and $0 \leq \alpha \leq 1$ mixes soft and hard supervision. While the cross-entropy term evaluates unscaled student logits, both distributions in the KL divergence share the same temperature $\tau$ so probability mass shifts smoothly toward lower-ranked alternatives without inverting token order. Inspecting the softmax probability ratio between any two runner-up logits makes that smoothing effect explicit:

$$
p_i(\tau) = \frac{\exp(z_i / \tau)}{\sum_j \exp(z_j / \tau)}, \qquad \frac{p(B)}{p(C)} = \exp\left(\frac{z_B - z_C}{\tau}\right)
$$

Because temperature divides the logit gap $z_B - z_C$, larger values of $\tau$ compress relative odds between plausible runner-up tokens and make their gradients far more informative to the student. Without raising $\tau$, a sharp teacher probability vector pushes almost all mass onto the winning token and leaves zero gradient contrast across plausible near-ties. For a fixed teacher, differentiating the unscaled forward KL divergence with respect to a student logit reveals a clean dependence on temperature:[^hinton2015]

$$
\frac{\partial \mathcal{L}_{\text{KL}}}{\partial z_{S,i}} = \frac{p_{S,i}-p_{T,i}}{\tau}
$$

Two temperature factors combine here: the chain rule introduces $1/\tau$, and at high temperature the probability residual $p_{S,i} - p_{T,i}$ itself shrinks roughly as $1/\tau$. Subtracting each logit vector's mean (denoted $\widetilde{z}$ over vocabulary size $V$) yields the high-temperature approximation $(\widetilde{z}_{S,i} - \widetilde{z}_{T,i}) / (V \tau^2)$. Multiplying the KL term by $\tau^2$ keeps gradient magnitudes roughly comparable as $\tau$ varies, though validation still tunes optimal temperature and loss weights alongside finite-difference verification:

<!-- leetllm: test, output=show -->
```python title="distillation-gradient-check.py"
import math

teacher = [4.0, 2.0, 1.0]
student = [3.2, 2.4, 1.1]


def probabilities(logits, tau):
    peak = max(logits)
    values = [math.exp((v - peak) / tau) for v in logits]
    return [v / sum(values) for v in values]


def loss(logits, tau):
    p, q = probabilities(teacher, tau), probabilities(logits, tau)
    return sum(a * math.log(a / b) for a, b in zip(p, q))


for tau in (1.0, 3.0, 100.0):
    p, q = probabilities(teacher, tau), probabilities(student, tau)
    exact = (q[0] - p[0]) / tau
    step = 1e-4
    plus, minus = student.copy(), student.copy()
    plus[0] += step
    minus[0] -= step
    numeric = (loss(plus, tau) - loss(minus, tau)) / (2 * step)
    assert math.isclose(numeric, exact, rel_tol=1e-6, abs_tol=1e-10)
    print(f"tau={tau:.0f}: gradient={exact:.6f}, scaled={tau*tau*exact:.6f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tau=1: gradient=-0.207576, scaled=-0.207576
tau=3: gradient=-0.029854, scaled=-0.268686
tau=100: gradient=-0.000024, scaled=-0.235045
```
<!-- leetllm: output:end -->

The scaled values remain of comparable order, but are not equal. For these centered logits, the high-temperature limit is about -0.233333 for the first coordinate. The example checks one derivative; a trained model's behavior requires an evaluation on its outputs.

<figure>
  <img src="illustrations/_generated/distillation_gradient_temperature_dark.png" alt="For teacher logits [4, 2, 1] and student logits [3.2, 2.4, 1.1], the first unscaled forward-KL gradient is −0.207576, −0.029854, and −0.000024 at temperatures 1, 3, and 100. On a second shared −0.30-to-0 axis, multiplying each gradient by temperature squared gives −0.207576, −0.268686, and −0.235045, with the high-temperature limit −0.233333. Bars extend left from zero to show negative derivative values; values remain temperature-dependent." />
  <figcaption>Each bar keeps the signed derivative on one scale. The scaled values approach a high-temperature limit while the exact values remain temperature-dependent.</figcaption>
</figure>

The derivative used centered logits. A three-way teacher target is the case that matters for a token. Start from logits `[4.0, 2.0, 1.0]` and see which alternatives keep probability when the temperature rises:

<!-- leetllm: test, output=show -->
```python title="soft-teacher-target.py"
import math


def softmax(values, temperature):
    shifted = [value / temperature for value in values]
    peak = max(shifted)
    weights = [math.exp(value - peak) for value in shifted]
    total = sum(weights)
    return [weight / total for weight in weights]


teacher_logits = [4.0, 2.0, 1.0]
for temperature in (1.0, 3.0):
    probs = softmax(teacher_logits, temperature)
    print(f"temperature={temperature:.0f}: {[round(p, 3) for p in probs]}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
temperature=1: [0.844, 0.114, 0.042]
temperature=3: [0.532, 0.273, 0.196]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/soft_target_temperature_dark.png" alt="Aligned probability bars on a 0 to 1 scale compare one-hot target [1, 0, 0] with teacher logits [4, 2, 1] at temperatures 1 and 3. At T=1, token probabilities are 0.844, 0.114, and 0.042 with B/C odds exp(1) = 2.72. At T=3, probabilities flatten to 0.532, 0.273, and 0.196 with B/C odds exp(1/3) = 1.40 while keeping A > B > C." />
  <figcaption>Dividing logits by temperature preserves rank order while shifting mass toward runner-up tokens. The B/C odds narrow from 2.72 to 1.40, whereas one-hot targets erase all relative preference beyond the top token.</figcaption>
</figure>

At $\tau=1$, token A receives 84.4% and C gets only 4.2%. Raising $\tau=3$ preserves A at the top while pushing B and C up to 27.3% and 19.6%, giving gradients richer ranking information than a one-hot `[1, 0, 0]` label. Of course, if the teacher model makes a confident mistake, soft targets transfer that bias into the student as well.

### Distillation with execution-based verifiers

Direct token-level KL requires distributions aligned over the same token vocabulary at identical prefixes. Matching token IDs across incompatible tokenizers breaks supervision, so cross-family teacher-student pairs require vocabulary mapping or sequence-level distillation on teacher text retokenized by the student. Closed API models that return only sampled text or top-k log probabilities cannot supply full-vocabulary logit vectors, pushing teams toward rejection-sampled or verifier-checked trajectories.

Phi-3 demonstrated how combining filtered web data with high-signal synthetic examples improves compact-model reasoning.[^abdin2024] For domain specialization, blend verified documentation, curated human interactions, explicit unanswerable prompts, and automatically generated edge cases. Partition evaluation splits by document, machine model, or site before synthesizing variants so reworded duplicates never leak across train and test sets.

Verify every synthetic training target against explicit acceptance rules before admitting it into the distillation set:

1. **Code and tool-use verification:** Run bounded tests inside sandboxed workers with tight CPU, memory, and network limits and zero ambient credentials. Because container escapes and resource exhaustion remain risks under untrusted outputs, treat unit tests as necessary partial filters rather than complete behavioral guarantees.
2. **Schema validation:** Enforce required JSON keys, value types, and domain bounds programmatically. Syntactically valid output can still hallucinate wrong arguments or unsafe field values.
3. **Retrieval grounding:** Check source document identity, version tags, equipment applicability, and entailment against retrieved context. Matching a section identifier or numeric substring alone fails whenever numbers belong to a different unit.

Consider a concrete equipment-manual example showing why naive string-plus-number verification lets errors slip into training data:

<!-- leetllm: test, output=show -->
```python title="citation-check-counterexample.py"
manual = {
    "M-7": {"equipment": "pump-A", "torque_nm": 12},
    "M-8": {"equipment": "pump-B", "torque_nm": 30},
}
question_equipment = "pump-A"
answers = [
    {"citation": "M-7", "torque_nm": 12},
    {"citation": "M-8", "torque_nm": 30},
]
for answer in answers:
    source = manual[answer["citation"]]
    naive_pass = source["torque_nm"] == answer["torque_nm"]
    applicable_pass = naive_pass and source["equipment"] == question_equipment
    print(f'{answer["citation"]}: naive={naive_pass}, applicable={applicable_pass}')
```

<!-- leetllm: output:start -->
```text title="Output" output compact
M-7: naive=True, applicable=True
M-8: naive=True, applicable=False
```
<!-- leetllm: output:end -->

Although the second answer cites a genuine manual entry (`M-8`) and reproduces its exact torque value (`30`), it applies to `pump-B` instead of `pump-A`. Automated checks should therefore verify applicability predicates alongside citation resolution, while human spot checks and held-out evaluations confirm that curated data improves accuracy and abstention on the target student.

<figure>
  <img src="illustrations/_generated/verified_data_applicability_dark.png" alt="A query asks about pump-A. Manual M-7 gives pump-A and 12 Nm, so its citation, number, and equipment checks pass. Manual M-8 gives pump-B and 30 Nm; its citation and number match their source, but its equipment check fails and the example is rejected. This worked example demonstrates source applicability and gives no maintenance instruction." />
  <figcaption>M-7 matches the requested pump. M-8 passes source and number checks, then fails the equipment-applicability check.</figcaption>
</figure>

Beyond forward KL, MiniLLM applies on-policy reverse KL optimization, $\text{KL}(p_S \parallel p_T)$, paired with variance reduction, teacher-mixed sampling, and length normalization.[^gu2024] Reverse KL pushes the smaller student to concentrate on high-probability teacher modes instead of spreading probability thin across all plausible phrasings. Which divergence performs better depends on the task, so factual accuracy and abstention still require held-out evaluation.

The following numerical walkthrough combines hard cross-entropy, temperature-scaled KL, and hidden-state mean-squared error in a single objective step. Full training loops must freeze teacher parameters, mask padding tokens, align sequence positions, and project hidden states whenever teacher and student widths differ:

<!-- leetllm: test, output=show -->
```python title="distill-three-signals.py"
import math


def log_softmax(logits, temperature=1.0):
    if not logits or temperature <= 0:
        raise ValueError("nonempty logits and positive temperature required")
    shifted = [value / temperature for value in logits]
    peak = max(shifted)
    centered = [value - peak for value in shifted]
    normalizer = math.log(sum(math.exp(value) for value in centered))
    return [value - normalizer for value in centered]


def cross_entropy(logits, label):
    return -log_softmax(logits)[label]


def kl_divergence(target_logs, candidate_logs):
    if len(target_logs) != len(candidate_logs):
        raise ValueError("aligned vocabulary sizes required")
    return sum(
        math.exp(p_log) * (p_log - q_log)
        for p_log, q_log in zip(target_logs, candidate_logs)
    )


teacher_logits = [4.0, 2.0, 1.0]
student_logits = [3.2, 2.4, 1.1]
label = 0
temperature = 2.0
assert cross_entropy([0.0, -1000.0], 1) == 1000.0
assert kl_divergence(log_softmax([0.0, -1000.0]),
                     log_softmax([-1000.0, 0.0])) == 1000.0

hard_loss = cross_entropy(student_logits, label)
soft_loss = kl_divergence(
    log_softmax(teacher_logits, temperature),
    log_softmax(student_logits, temperature),
) * (temperature * temperature)

teacher_hidden = [0.4, -0.1, 0.2]
student_hidden = [0.3, 0.0, 0.1]
assert len(teacher_hidden) == len(student_hidden) > 0
hidden_loss = sum(
    (s - t) ** 2 for s, t in zip(student_hidden, teacher_hidden)
) / len(teacher_hidden)

alpha, beta = 0.8, 0.2
total_loss = (1 - alpha) * hard_loss + alpha * soft_loss + beta * hidden_loss
print(f"hard_loss={hard_loss:.4f}")
print(f"soft_loss={soft_loss:.4f}")
print(f"hidden_loss={hidden_loss:.4f}")
print(f"total_loss={total_loss:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
hard_loss=0.4522
soft_loss=0.1480
hidden_loss=0.0100
total_loss=0.2109
```
<!-- leetllm: output:end -->

Once the student finishes training, re-evaluate every exported and quantized artifact because post-training compression interacts strongly with distillation sharpness. Accuracy retention depends on model family, quantization granularity, calibration samples, kernel numerics, and prompt distribution rather than any fixed parameter threshold. Applying explicit quality-loss and tail-latency acceptance checks makes export tradeoffs concrete:

<!-- leetllm: test, output=show -->
```python title="exported-student-gate.py"
baseline = {"quality": 0.94, "p95_ms": 132}
exports = [
    {"name": "int8", "quality": 0.938, "p95_ms": 104},
    {"name": "int4", "quality": 0.887, "p95_ms": 71},
]
max_quality_drop = 0.02
latency_gate_ms = 120

approved = [
    item["name"]
    for item in exports
    if baseline["quality"] - item["quality"] <= max_quality_drop
    and item["p95_ms"] <= latency_gate_ms
]
print(f"approved exports: {approved}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
approved exports: ['int8']
```
<!-- leetllm: output:end -->

Here INT4 loses 0.053 quality points and violates the 0.02 drop tolerance, while INT8 drops only 0.002 points and meets the 120 ms p95 target. Passing this gate narrows candidate formats, though release qualification still requires measuring citation accuracy, abstention, memory footprint, and sustained thermal behavior on device rather than relying on perplexity alone.

<figure>
  <img src="illustrations/_generated/distillation_export_quality_dark.png" alt="Top panel shows the weighted distillation loss breakdown totaling 0.2109: hard cross-entropy contributes 0.0904 (0.4522 x 0.20), temperature-scaled KL contributes 0.1184 (0.1480 x 0.80), and hidden-state MSE contributes 0.0020 (0.0100 x 0.20). Bottom panel plots export quality versus p95 latency against a feasible zone (quality >= 0.92 and latency <= 120 ms): Baseline sits at (132 ms, 0.940), INT8 lands inside at (104 ms, 0.938), and INT4 misses quality at (71 ms, 0.887)." />
  <figcaption>The weighted distillation loss totals 0.2109 across hard, KL, and hidden terms. On the quantized export scatter plot, only INT8 lands inside the feasible region (quality >= 0.92 and p95 <= 120 ms).</figcaption>
</figure>

```checkpoint
What does multiplying the KL distillation loss by $\tau^2$ compensate for, and which outcomes still need separate validation?
---
The exact unscaled gradient is $\frac{p_{\text{student}} - p_{\text{teacher}}}{\tau}$. At high temperature, the probability difference itself is approximately proportional to $1/\tau$, giving the familiar approximate $1/\tau^2$ shrinkage. The multiplier compensates in that regime; gradient magnitudes and optimization behavior still vary with temperature.
```

## Architecture choices that matter at small scale

The distillation loss changes only the training objective, leaving model topology, layer widths, and attention head layout fixed by the student architecture. At sub-billion and single-digit-billion scales, structural choices determine compute density, cache locality, and memory bandwidth pressure just as strongly as training loss. Meta's MobileLLM experiments identified four architectural patterns tailored to mobile NPUs and tight DRAM budgets:[^liu2024mobilellm]

1. **Depth versus width:** The paper's approximately 125M/350M experiments favored deeper, thinner designs. Scaling laws do not require equal parameter allocation to depth and width; test the balance for the target training recipe and device.
2. **Embedding tying:** Sharing input and output weights reduces storage. One ablation reduced 135M to 119M parameters, with a small accuracy drop; reallocating some savings to depth recovered it.
3. **Immediate block reuse:** MobileLLM-LS repeats each block with shared weights. Cache locality can reduce repeat weight traffic, while compute and attention state still cost resources. Measure cache residency and DRAM traffic. Its iPhone 13 FP16/MPS experiment measured 15.6 versus 16.0 ms execution, averaged over 50 iterations; measure sustained token rate on the target terminal.
4. **GQA:** Fewer KV heads reduce cache payload for otherwise equal dimensions. Choose a trained architecture; replacing an existing model's attention heads is not an inference-time switch.

Significantly, the same MobileLLM study found that distilling from Llama-v2 7B ran slower and scored slightly worse than standard hard-label training on its tested benchmarks, demonstrating that architectural improvements and distillation gains must be validated independently.[^liu2024mobilellm]

Beyond weight matrices, KV cache growth can quickly exhaust RAM during multi-turn sessions on a 4 GB device. For a 24-layer model with head dimension 64 and a 4,096-token window, grouped-query attention with 4 KV heads dramatically cuts persistent memory relative to 16-head multi-head attention:

<!-- leetllm: test, output=show -->
```python title="kv-head-device-budget.py"
def kv_mib(layers, kv_heads, head_dim, tokens, bytes_per_value=2):
    return 2 * layers * kv_heads * head_dim * tokens * bytes_per_value / 2**20


mha = kv_mib(layers=24, kv_heads=16, head_dim=64, tokens=4096)
gqa = kv_mib(layers=24, kv_heads=4, head_dim=64, tokens=4096)
print(f"MHA KV cache: {mha:.1f} MiB")
print(f"GQA KV cache: {gqa:.1f} MiB")
print(f"cache reduction for this architecture: {mha / gqa:.1f}x")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
MHA KV cache: 384.0 MiB
GQA KV cache: 96.0 MiB
cache reduction for this architecture: 4.0x
```
<!-- leetllm: output:end -->

The homogeneous cache calculation shrinks from $384$ to $96$ MiB, a $4\times$ reduction. Because real runtimes also allocate page pools, block tables, quantization scale buffers, and temporary scratchpad tensors, this payload reduction alone neither determines peak total residency nor guarantees a proportional fourfold speedup. Hybrid architectures mixing full attention with sliding-window or recurrent layers require summing each layer type's exact state formula individually.

<figure>
  <img src="illustrations/_generated/kv_cache_geometry_dark.png" alt="Sixteen query-head tiles are grouped four at a time onto four trained KV heads. Across 24 layers, each layer stores separate K and V values for 4096 positions, head width 64, and two bytes per value. The head-by-layer grids contain 384 MiB at 16 KV heads and 96 MiB at four KV heads, a fourfold cache reduction for this architecture. The grid cells represent one head in one layer for one K or V stream." />
  <figcaption>Four query heads share each trained KV head. This design stores 384 MiB at 16 KV heads and 96 MiB at four; the cache saving does not change an existing model architecture at inference time.</figcaption>
</figure>

Recent open-weight SLMs illustrate how model families trade parameter counts, embedding layouts, and context capacities across mobile and edge targets. Always verify current release weights and measure task accuracy alongside peak memory before selecting one:

- **Phi-4-mini-instruct (3.8B):** Employs GQA, shared input-output embeddings, a 128K context window, and high-density synthetic data tuning for tool calling.[^microsoft2025phi4mini]
- **Gemma 4 E2B and E4B:** The card lists 2.3B/4.5B effective parameters and 5.1B/8B including embeddings. Per-layer embeddings use token lookups rather than acting like MoE experts, so an edge budget must account for the artifact's actual stored tensors, multimodal encoders, KV cache, and serving residency instead of the effective parameter label alone.[^gemma4modelcard2026]
- **Qwen3-1.7B:** Its card documents 28 layers, 16 query/8 KV heads, a 32,768-token context, and thinking/non-thinking chat-template modes.[^qwen32025] Thinking tokens consume generation work before the visible answer. Budget and evaluate both modes under the installed runtime; an output cap can truncate the answer rather than improve it.

```checkpoint
Why can a model advertised as "2.3B effective parameters" still cause an out-of-memory crash on a 4 GB mobile device?
---
The effective label excludes large lookup embeddings. E2B lists 5.1B parameters including embeddings, before considering the chosen representation and additional components. A memory budget needs artifact bytes, allocations, cache, workspaces, and device coexistence. Parameter labels alone cannot predict peak residency.
```

## On-device runtimes: mapping graphs to silicon

A thinner stack can fit the worksheet and still fail as a graph the handheld cannot run. A runtime may use supported accelerator kernels, native CPU kernels, or both. CPU execution is not necessarily emulation.

| Runtime | Primary export format | Hardware backends | Key engineering check |
|---------|-----------------------|-------------------|-----------------------|
| ExecuTorch[^executorchBackends2026] | Backend-specific `.pte` plus required assets | Core ML, MLX, Qualcomm, Vulkan, XNNPACK, others | Inspect delegated partitions, CPU fallback, supported models and target versions. |
| Apple Core ML[^appleCoreMLPreparation2024] | `.mlpackage`, compiled for execution | ANE, GPU, CPU according to supported operations and configuration | Inspect the actual compute plan; compressed weights do not imply integer NPU execution. |
| MLC LLM (Apache TVM)[^mlc2024] | Converted weights, configuration, compiled model library | Platform-specific GPU backends including Metal, Vulkan, WebGPU | Ship the correct library and assets; measure the supported model on the target. |
| ONNX Runtime Mobile[^onnxruntime2026mobile] | ONNX or optimized ORT model | CPU and platform/package-dependent execution providers | Check operator coverage and partitions in the mobile build. |
| ONNX Runtime GenAI[^onnxGenAIGenerate2026] | Compatible ONNX model, generation configuration and tokenizer | Supported providers for the selected GenAI build | Verify model-builder, provider, and platform support separately from general ORT Mobile. |
| llama.cpp[^llamacpp2023] | GGUF and any separate modality assets | CPU/GPU backends selected at build/runtime | Match model architecture, quantization type, backend kernels and placement. |

### Mobile NPUs and the danger of CPU fallback

An NPU can lower decode energy dramatically for supported matrix operators, yet vendor TOPS/W specifications depend on specific precisions, sparsity modes, and synthetic clock assumptions rather than reflecting end-to-end token energy in your app. Before targeting an accelerator backend, check three runtime constraints carefully:

1. **Shape support:** Shapes, ranges, and cache updates may impose restrictions. Buckets can help some backends, but padding can waste work and change state if masking is wrong.
2. **Numerical support:** Weight storage, multiply format, and accumulator precision are separate choices. Check this backend's exact support rather than assuming all NPUs use INT4/INT8 with FP16 accumulation.
3. **Operator support:** An unsupported operation can remain on CPU, cause export failure, or require a different lowering. Check placement and partition boundaries, not only a percentage of delegated operators.

Partial delegation can add synchronization, layout conversion, intermediate materialization, or copies. Unified physical memory does not remove all those costs, and it does not imply a mandatory copy between two private memories either. Some partitions are beneficial. Profile their frequency and critical-path time, then compare a supported fused graph and an optimized CPU path.[^executorchBackends2026][^onnxruntime2026mobile]

<figure>
  <img src="illustrations/_generated/delegate_critical_path_dark.png" alt="Three execution paths run the same operation order. A split delegate sends operation 1 to the NPU, operation 2 to CPU fallback, and operation 3 back to the NPU, with synchronization and layout or materialization boundaries where required. A supported partition keeps operations together on the NPU; a CPU path keeps them together on CPU. The diagram shows execution order and boundary types without timing data or a required private-memory copy." />
  <figcaption>The lanes preserve operation order. Split delegation adds conversion and synchronization boundaries to inspect; operator coverage and critical-path time require device profiling.</figcaption>
</figure>

Apple's deployment documentation separates quantization schemes by execution target, highlighting GPU-oriented 4-bit weight compression alongside stateful KV-cache updates. After converting a model to Core ML or ExecuTorch, inspect the generated compute plan directly to verify which subgraphs actually execute on the Neural Engine versus falling back to CPU or GPU.[^appleCoreMLPreparation2024]

### Testing graph export on CPU

Before lowering to a mobile delegate, verify graph capture, `.pt2` serialization, and dynamic-shape guards on CPU. While `torch.export` produces a clean intermediate program rather than an ExecuTorch binary or NPU kernel, running a save-and-reload round-trip on CPU immediately catches unsupported control flow and violated batch bounds.[^pytorch2026export]

<!-- leetllm: test, deps=torch,numpy, output=show -->
```python title="export-reload-contract.py"
from pathlib import Path
from tempfile import TemporaryDirectory
import torch
from torch import nn
torch.set_num_threads(1)


class NumericRouter(nn.Module):
    def __init__(self):
        super().__init__()
        self.projection = nn.Linear(3, 2)
        with torch.no_grad():
            self.projection.weight.copy_(torch.tensor([
                [-1.0, -1.0, -1.0], [1.0, 1.0, 1.0],
            ]))
            self.projection.bias.zero_()

    def forward(self, features):
        return self.projection(features.clamp(-1.0, 1.0))


model = NumericRouter().eval()
example = torch.tensor([[-0.5, -0.2, 0.1], [0.8, 0.7, 0.6]])
batch = torch.export.Dim("batch", min=1, max=8)
program = torch.export.export(
    model, (example,), dynamic_shapes=({0: batch},),
)

with TemporaryDirectory() as directory:
    artifact = Path(directory) / "router.pt2"
    torch.export.save(program, artifact)
    restored = torch.export.load(artifact).module()
    with torch.inference_mode():
        for size in (1, 2, 5, 8):
            inputs = torch.linspace(-2, 2, size * 3).reshape(size, 3)
            expected, actual = model(inputs), restored(inputs)
            torch.testing.assert_close(actual, expected)
            assert torch.equal(actual.argmax(-1), expected.argmax(-1))
        classes = restored(example).argmax(-1).tolist()
    assert classes == [0, 1]
    for shape in ((2, 4), (9, 3)):
        try:
            restored(torch.zeros(shape))
        except (AssertionError, RuntimeError):
            pass
        else:
            raise AssertionError(f"exported graph accepted invalid shape {shape}")

print(f"restored class choices: {classes}")
print("logits match for batches 1, 2, 5, 8; feature width 4 and batch 9 rejected")
print("CPU graph round-trip only: no mobile runtime or accelerator measured")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
restored class choices: [0, 1]
logits match for batches 1, 2, 5, 8; feature width 4 and batch 9 rejected
CPU graph round-trip only: no mobile runtime or accelerator measured
```
<!-- leetllm: output:end -->

These assertions check four valid batch dimensions while confirming that both a mismatched feature width (`4`) and an out-of-range batch (`9`) raise an error after reload. Because eager execution places no cap at batch size 8, comparing eager and exported runs isolates graph-capture constraints from downstream backend lowering, mobile packaging, and on-device quantization accuracy.

<figure>
  <img src="illustrations/_generated/exported_graph_contract_dark.png" alt="NumericRouter clamps 3-feature rows to [-1, 1] and projects with weights [[-1,-1,-1],[1,1,1]], mapping [-0.5,-0.2,0.1] to logits [0.6,-0.6] (class 0) and [0.8,0.7,0.6] to [-2.1,2.1] (class 1). After save and reload of router.pt2, exported dynamic batch bounds accept feature width 3 across batches 1 through 8, reject width 4 and batch 9, whereas eager execution accepts batch 9." />
  <figcaption>The saved CPU graph enforces declared feature-width and dynamic-batch bounds across reload. Mobile lowering and accelerator execution still require device testing.</figcaption>
</figure>

```checkpoint
Why can an unoptimized NPU deployment be significantly slower than running the exact same model entirely on CPU?
---
Unsupported operators can add expensive partition boundaries. Synchronization, conversion, materialization, and sometimes copies may outweigh the acceleration. This depends on the memory architecture and partition schedule; measure the critical path rather than assuming every fallback is fatal.
```

## Heat, battery, and physical edge limits

Cooling depends on the enclosure, contact with the user, ambient temperature, workload, and any active cooling. A fanless device transfers heat through conduction, convection, and radiation. There is no universal 3-to-5 W sustained limit for all handhelds. Our 3.5 W allowance is an assumed product budget, not a chip TDP or a regulatory threshold.

### Dynamic voltage and frequency scaling (DVFS)

**Dynamic voltage and frequency scaling (DVFS)** changes operating points to manage performance and power. Thermal control can also limit available performance. Junction, battery, and chassis temperatures are different measurements; throttling thresholds and touch-temperature requirements depend on the device and applicable conditions. Neither 85°C nor 42°C is a universal rule.

Android's Thermal API exposes thermal status and headroom metrics, though documentation warns that sensor mappings vary across hardware and even `THERMAL_STATUS_NONE` gives no guarantee against localized clock throttling.[^androidThermalAPI2026] Sustained inference warms the SoC and surrounding chassis gradually, so a short ten-second smoke test never catches throttling that appears minutes into a shift. Whenever diagnosing sustained speed drops, log device SKU, OS/runtime version, ambient temperature, battery charging state, sequence length, and measurement interval together.

<figure>
  <img src="illustrations/_generated/thermal_privacy_budget_dark.png" alt="Three workload throughput readings share one time and throughput scale: 23.0 tokens/s at the start, 19.4 at 90 seconds, and 16.8 at 600 seconds. Dashed connectors link only the sample points. A horizontal 18 tokens/s requirement shows the final sample below the target. Thermal state, power, placement, ambient conditions, and workload telemetry identify what drove the decline." />
  <figcaption>Throughput readings over a 600-second soak drop below the 18 t/s floor. Pair rate logs with thermal, clock, and power telemetry to isolate throttling.</figcaption>
</figure>

The simple throughput check below catches sustained regression from initial burst speed (`23.0` t/s) down to the 10-minute mark (`16.8` t/s). Evaluating `min(samples_tps)` against the deployment floor ensures that tail slowdown triggers an automatic failure rather than hiding behind a high initial burst average. That signal tells engineers to inspect device clock traces and schedule longer thermal soak tests before approving the release:

<!-- leetllm: test, output=show -->
```python title="sustained-throughput-gate.py"
samples_tps = [23.0, 19.4, 16.8]
minimum_sustained_tps = 18.0
burst_tps = samples_tps[0]
floor_tps = min(samples_tps)

print(f"burst throughput: {burst_tps:.1f} t/s")
print(f"lowest sampled throughput: {floor_tps:.1f} t/s")
print(f"sampled throughput gate passes: {floor_tps >= minimum_sustained_tps}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
burst throughput: 23.0 t/s
lowest sampled throughput: 16.8 t/s
sampled throughput gate passes: False
```
<!-- leetllm: output:end -->

Because the 600-second reading falls below 18 tokens/s, remediation requires either shrinking active weight traffic, switching to lower-power NPU kernels, tuning duty cycles, or capping response length. Each adjustment trades away headroom elsewhere, such as quantization conversion overhead or tighter answer budgets. Validate every fix across full shift duty cycles including warm starts and elevated ambient temperatures.

### Battery energy accounting

Consider a $15$ Wh battery, roughly $4{,}000$ mAh at $3.7$ V nominal before accounting for converter efficiency, reserve capacity, and cell aging. Measuring steady whole-device power $P_{\text{avg}}$ alongside decode throughput directly translates compute rate into energy per 1,000 tokens. Dividing power in watts by token rate converts instantaneous wattage into watt-hours drawn over the fixed generation interval:

$$
E_{\text{1K tokens}} = \frac{P_{\text{avg}} \times 1000}{\text{Tokens per second} \times 3600} \text{ Wh}
$$

Decoding at $18$ tokens/s spends $1000/18 \approx 55.6$ seconds per 1,000 tokens, so a $3.5$ W total draw during generation consumes $3.5 \times 1000 / (18 \times 3600) \approx 0.054\text{ Wh} = 54\text{ mWh}$. That calculation shows why sustained decode speed matters as much for battery capacity as instantaneous wattage. Slowing generation down without lowering platform baseline draw extends active screen-on time and erodes energy savings per query:

$$
E_{\text{1K tokens}} = \frac{3.5 \times 1000}{18 \times 3600} \approx 0.054 \text{ Wh} = 54 \text{ mWh}
$$

Always verify whether reported wattage reflects whole-system power (display, storage, retrieval, radios, and cooling) or incremental accelerator power alone. A higher-wattage model that finishes decoding twice as fast can draw less cumulative shift energy because it spends far more hours in low-power idle states. Comparing two eight-hour duty-cycle budgets quantitatively makes that race-to-idle tradeoff explicit:

<!-- leetllm: test, output=show -->
```python title="shift-energy-budget.py"
shift_seconds = 8 * 3600
generated_tokens = 30_000
battery_wh = 15
retrieval_prefill_seconds = 600
retrieval_prefill_watts = 4
idle_watts = 1.2

for name, decode_watts, tokens_per_second in [("candidate-A", 3.5, 18), ("candidate-B", 6, 10)]:
    decode_seconds = generated_tokens / tokens_per_second
    idle_seconds = shift_seconds - decode_seconds - retrieval_prefill_seconds
    assert idle_seconds >= 0
    decode_wh = decode_watts * decode_seconds / 3600
    total_wh = (decode_watts * decode_seconds
                + retrieval_prefill_watts * retrieval_prefill_seconds
                + idle_watts * idle_seconds) / 3600
    print(f"{name}: decode={decode_wh:.2f} Wh, shift={total_wh:.2f} Wh, below nominal={total_wh < battery_wh}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
candidate-A: decode=1.62 Wh, shift=11.13 Wh, below nominal=True
candidate-B: decode=5.00 Wh, shift=14.07 Wh, below nominal=True
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/shift_energy_budget_dark.png" alt="Across an 8-hour duty cycle generating 30,000 tokens plus 600 s prefill at 4 W and 1.2 W idle, Candidate A decodes for 1,666.7 s at 3.5 W (18 t/s) and uses 11.13 Wh total (1.62 Wh decode, 54 mWh per 1k tokens). Candidate B decodes for 3,000 s at 6 W (10 t/s) and uses 14.07 Wh total (5.00 Wh decode), leaving minimal headroom under a 15 Wh nominal battery." />
  <figcaption>Total shift energy integrates prefill, decode, and idle intervals over eight hours. Candidate A uses 11.13 Wh versus Candidate B's 14.07 Wh against the 15 Wh nominal cell rating.</figcaption>
</figure>

Battery qualification must account for reserve, usable capacity, aging, and longer prompts, which can erase a margin below nominal capacity. For varying power, integrate $P(t)$ over time; dividing average power by average token rate requires a consistent measurement interval. Measure total energy for a complete task when comparing classifiers, extractive answers, and generators of different lengths.

```checkpoint
What can a 10-second token generation benchmark establish, and what does it miss?
---
It measures the workload under the recorded initial conditions and can help debug regressions. Use representative longer runs and thermal/energy measurements to estimate an eight-hour battery budget and sustained behavior; determine warm-up time and slowdown on the target device.
```

## Hybrid edge-cloud routing by confidence and privacy class

Some products permit a cloud route for selected inputs; our restricted facility task does not, because a hard question is no reason by itself to send data off the device. On an isolated terminal, a question the local model cannot answer from evidence needs local abstention or review. The router below describes a different product mode, one with a cloud route reserved for public data, rather than an exception to the terminal's offline requirement.

### Mathematical confidence routing

Neither self-reported confidence nor token probabilities prove an answer is correct. Some useful diagnostic features are:

1. **Predictive entropy:** Calculate the entropy of the next-token probability distribution:
   $$
   H(p) = -\sum_{i=1}^{V} p_i \log_2 p_i
   $$
   Low next-token entropy means a concentrated distribution over the tokens being considered. A confidently wrong number can have low entropy; several equally correct phrasings can have high entropy. Temperature, logits filtering, vocabulary, and prefix affect this statistic.
2. **Top-2 softmax margin:** Measure the gap between the most likely token and the runner-up:
   $$
   \Delta p = p_{(1)} - p_{(2)}
   $$
   A small margin means the two token probabilities are close. Calibrate statistical significance and escalation thresholds against held-out task outcomes.
3. **Evidence checks:** Verify that cited passages apply and support the answer, then confirm their identifiers resolve.

If you combine these into a routing score, fit the map from raw statistics to the probability of a correct answer on held-out examples, using Platt scaling or isotonic regression, and refit it whenever quantization, prompts, or sampling settings change. Report answered coverage alongside the selective error rate, so a threshold such as `0.80` means "about 80% of answers at this confidence were correct on held-out data" rather than an arbitrary cutoff. When calibrated confidence falls below the threshold, the request becomes a candidate for cloud fallback, and the privacy class of its payload decides whether that fallback is allowed:

- **Classify the whole payload:** The class covers everything that would leave the device, including the user query, retrieved passages, conversation history, attachments, and tool responses. Mixed or unknown labels take the strictest class present.
- **Keep restricted data on the device:** Requests that touch confidential or restricted data, or that arrive while offline, never leave the device. The app answers from verified local evidence, queues the request for local review, or abstains.
- **Watch the side channels:** Telemetry, crash dumps, sync queues, backups, and download caches can leak payloads even when inference itself runs locally, so they need the same classification as the request path.

<figure>
  <img src="illustrations/_generated/trusted_payload_router_dark.png" alt="Five requests sit on a calibrated-confidence axis from 0 to 1 with a threshold at 0.80, sorted into three lanes. The grounded public FAQ lookup at 0.96 answers on device. The grounded public long-tail query at 0.43 falls back to the cloud. A restricted private note at 0.72, an ungrounded answer at 0.97, and an offline query at 0.30 all abstain locally." />
  <figcaption>Only a grounded request above the 0.80 threshold answers on device. Below it, privacy class and connectivity decide between cloud fallback and local abstention, and a confident ungrounded answer still abstains.</figcaption>
</figure>

The router below maps two token statistics to a calibrated probability with a fitted logistic curve, then applies the grounding, privacy, and connectivity checks in order. The weights stand in for values fit on a held-out set of graded answers:

<!-- leetllm: test, output=show -->
```python title="calibrated-edge-router.py"
import math


def calibrated_confidence(entropy_bits, margin, w_entropy=-1.6, w_margin=4.2, bias=1.1):
    """Platt-style map from token statistics to P(answer is correct)."""
    z = bias + w_entropy * entropy_bits + w_margin * margin
    return 1.0 / (1.0 + math.exp(-z))


def route(confidence, grounded, data_class, online, threshold=0.80):
    if grounded and confidence >= threshold:
        return "answer_on_device"
    if data_class == "public" and online:
        return "cloud_fallback"
    return "abstain_locally"


requests = [
    # name, entropy (bits), top-2 margin, grounded, data class, online
    ("faq_lookup", 0.35, 0.62, True, "public", True),
    ("long_tail_public", 1.40, 0.20, True, "public", True),
    ("private_note", 0.90, 0.30, True, "restricted", True),
    ("ungrounded_answer", 0.30, 0.70, False, "internal", True),
    ("offline_query", 1.60, 0.15, True, "public", False),
]
for name, entropy, margin, grounded, data_class, online in requests:
    p = calibrated_confidence(entropy, margin)
    print(f"{name:18s} p={p:.3f} -> {route(p, grounded, data_class, online)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
faq_lookup         p=0.959 -> answer_on_device
long_tail_public   p=0.426 -> cloud_fallback
private_note       p=0.715 -> abstain_locally
ungrounded_answer  p=0.972 -> abstain_locally
offline_query      p=0.304 -> abstain_locally
```
<!-- leetllm: output:end -->

Only `faq_lookup` answers on device. `ungrounded_answer` carries the highest calibrated confidence in the batch, yet no retrieved evidence supports it, so the router declines to answer locally, and its internal payload rules out cloud fallback as well. `private_note` sits below the threshold and its restricted class keeps it on the device, so the app abstains or queues it for review. `offline_query` would qualify for cloud fallback on a connection, but offline it abstains too. In production, the fallback path also binds a digest of the redacted payload to the destination, so nothing can change between the check and the transmission.

```checkpoint
Why can't a calibrated confidence of 0.97 by itself justify answering on device or sending a request to the cloud?
---
Calibration says how often answers at that confidence were correct on held-out data. It says nothing about whether this particular answer rests on retrieved evidence, and nothing about whether the payload may leave the device. Grounding and privacy class are separate checks that the router applies alongside confidence.
```

## Candidate selection and over-the-air deployment gates

Once workload constraints, thermal limits, and routing gates are specified, compare candidate open-weight model families side by side on your target hardware SKU:

| Model family | Parameters | Key architectural focus | Target operational job |
|--------------|------------|-------------------------|------------------------|
| MobileLLM / MobileLLM-LS (Meta)[^liu2024mobilellm] | 125M / 350M research variants | Depth/tying/GQA; immediate reuse in LS | Candidate routing or extraction, with task evaluation |
| Phi-4-mini (Microsoft)[^microsoft2025phi4mini] | 3.8B | GQA, 128K context, synthetic textbook training | Policy Q&A, structured tool calling |
| Gemma 4 E2B/E4B (Google)[^gemma4modelcard2026] | 2.3B / 4.5B effective; 5.1B / 8B with embeddings | Per-layer embeddings, text/image/audio inputs | Candidate multimodal assistant, with all required assets budgeted |
| Qwen3 (Qwen Team)[^qwen32025] | 1.7B | Code generation, dual thinking/non-thinking modes | Multilingual field forms, structured data extraction |

Filtering benchmark rows against task quality (`>= 0.92`) and warmed sustained decode speed (`>= 18 t/s`) separates candidates ready for full soak validation from models that violate device limits:

<!-- leetllm: test, output=show -->
```python title="device-shortlist-scorecard.py"
candidates = [
    {"name": "tiny_policy", "quality": 0.88, "sample_min_tps": 33},
    {"name": "policy_student", "quality": 0.93, "sample_min_tps": 19},
    {"name": "hot_policy", "quality": 0.95, "sample_min_tps": 11},
]
min_quality, min_sample_tps = 0.92, 18

approved = [
    item["name"]
    for item in candidates
    if item["quality"] >= min_quality
    and item["sample_min_tps"] >= min_sample_tps
]
assert approved == ["policy_student"]
print(f"candidates passing thresholds: {approved}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
candidates passing thresholds: ['policy_student']
```
<!-- leetllm: output:end -->

Here `policy_student` clears both initial screening gates, while `tiny_policy` falls short on accuracy and `hot_policy` drops below the 18 tokens/s floor under heat. Final device release still depends on inspecting thermal telemetry alongside peak memory, battery drain, and held-out citation accuracy across sustained field workloads.

### Over-the-air (OTA) lifecycle and dual-slot rollback

An interrupted in-place update can leave an offline terminal unable to load its weights or parse prompts cleanly. Preserving the last working bundle in an active slot while staging updates in a separate inactive slot prevents partial downloads from corrupting inference, following the A/B update model used in Android system updates.[^androidABUpdates2026] Structure device model updates around four operational checks:

1. **What is authorized?** Authenticate a manifest against trusted keys, binding SHA-256 digests, byte lengths, model configuration, tokenizer, chat template, runtime requirements, compatibility flags, monotonic version, and expiry to signed metadata. Separate build and evaluation verification confirms safety and quality before signing, while TUF-style key rotation and version checks prevent rollback attacks.[^tufSpecification2026]
2. **What survives interruption?** Stream weights into inactive Slot B with strict disk quotas and path validation, verifying every byte against the signed manifest prior to activation. Test truncated transfers, full storage, and sudden power loss using platform durable-write semantics, or stage via verified physical media on air-gapped terminals.
3. **What is compatible?** Load the staged bundle inside target memory budgets and run tokenizer/template checks, reference outputs, abstention cases, and thermal smoke workloads on each supported hardware SKU before exposing it to users.
4. **Who decides recovery?** Flip the active slot pointer only after verification succeeds, invalidate stale KV cache entries left over from different weights or tokenizers, and roll back cleanly to Slot A if startup or post-activation health probes fail within anti-replay rules.

<figure>
  <img src="illustrations/_generated/dual_slot_update_dark.png" alt="Dual-slot OTA model staging keeps verified Slot A untouched while Candidate B downloads to inactive Slot B. Before activation, B passes signed manifest checks (Ed25519 signature, SHA-256 digests, monotonic version, expiry, device match) and single-model smoke verification within the memory budget. Activating B points fresh sessions at B and clears incompatible KV state; any error falls back to Slot A." />
  <figcaption>Slot B verifies signed metadata, hashes, single-model residency, and smoke tests before moving the active pointer, keeping Slot A intact as an automatic rollback target.</figcaption>
</figure>

```checkpoint
Why must an on-device over-the-air model update verify both an Ed25519 cryptographic signature and a SHA-256 checksum?
---
A digest binds file bytes only when the expected digest comes from trusted metadata. An Ed25519 signature authenticates that manifest under trusted keys, preventing an attacker from swapping an unsigned model file alongside a recomputed checksum, while version and compatibility checks protect against replay or runtime mismatch.
```

## Diagnosing edge deployment breakdowns

On edge silicon, symptoms rarely point to a single cause in isolation, so systematic diagnostics trace throughput, accuracy, memory, and update telemetry across the stack:

### 1. The model draws 6W and runs at 5 tokens per second

**Symptom:** A 1B candidate runs at 35 tokens/s on the developer laptop but only 5 on the terminal, where whole-system power reaches 6 W and the enclosure feels hot. Because laptop desktop chips deliver far higher memory bandwidth and thermal dissipation than pocket terminals, mismatched speed alone rarely identifies whether memory stalls or CPU fallback caused the slowdown.

**Investigate:** Check delegate placement, partition timing, synchronization barriers, tensor layouts, clock frequencies, and competing background load across both devices. Compare supported accelerator and CPU execution paths using the identical quantized weights and sequence lengths. Plotting operator placement alongside DRAM throughput separates a bandwidth limit from unexpected CPU fallback cleanly.

**Change after diagnosis:** Choose a supported lowering or switch to an architecture with operators supported natively on the target NPU. Replacing activation functions such as SiLU or GELU changes the mathematical computation and may require distillation or fine-tuning to recover lost accuracy. After every runtime or operator change, re-verify task accuracy, energy per 1,000 tokens, and sustained latency on target hardware.

### 2. INT4 quantization destroys citation accuracy

**Symptom:** The unquantized FP16 model cites maintenance manual paragraphs with 96% accuracy, but the INT4 quantized model fabricates non-existent section numbers and numerical bounds. Aggressive 4-bit rounding often clips outlier activations in attention projections or perturbs fragile numerical tokens that encode identifiers and tolerances.

**Investigate:** Compare tokenization, retrieval passages, prompt templating, sampling configuration, conversion scripts, and paired reference outputs before attributing the regression to particular layers. Because a text-only decoder has no cross-attention blocks, accuracy losses stem either from host-side prompt drift or from weight and activation rounding inside self-attention and MLP projections. Checking intermediate logits against the FP16 teacher immediately pinpoints which layer or conversion step introduced the divergence.

**Change after diagnosis:** Switch to a calibrated quantization recipe such as AWQ or GPTQ, keep demonstrably sensitive layers in higher precision, or choose a compact architecture that quantizes more gracefully. Remember that restoring FP16 embedding tables raises resident memory rapidly and may break tight mobile RAM limits unless compensated elsewhere. Always repeat held-out source-support and abstention evaluation on the exact quantized binary destined for the terminal.

### 3. Application crashes after fifteen minutes of continuous conversation

**Symptom:** The handheld app operates smoothly during brief queries, yet terminates abruptly without a clean Python exception or user-facing error log during prolonged multi-turn diagnostic sessions. Silent mid-session termination strongly suggests an out-of-memory kill from the mobile operating system rather than a numerical runtime failure.

**Investigate:** Inspect OS termination records, allocator high-water marks, retained session objects, KV cache reservations, and system memory pressure logs over long runs. Unbounded KV cache growth is one frequent cause in full-attention transformers, though a background watchdog timeout, unsupported graph op, or host memory leak points to a different root fix. Measuring allocated resident pages per appended turn distinguishes a steady linear cache leak from a sudden threshold crash cleanly.

**Change after diagnosis:** Enforce strict session and context caps, free abandoned conversation handles promptly, or choose a trained Grouped-Query Attention or sliding-window architecture with bounded memory growth. If enabling KV cache quantization to reclaim headroom, verify runtime kernel support and evaluate multi-turn retrieval accuracy first. Evicting arbitrary attention keys changes the tokens a full-attention model can reference, whereas explicit prompt trimming and session compaction preserve predictable context state.

### 4. Throughput collapses halfway through a work shift

**Symptom:** The model performs well during brief morning benchmarks, yet field technicians experience unacceptable slowdowns halfway through continuous afternoon inspections. Because short smoke runs complete before the aluminum chassis or battery pack warms up, steady-state thermal behavior never appears in quick developer benchmarks.

**Investigate:** Correlate decode throughput and per-token latency directly with thermal governor status, ambient room temperature, USB charging draw, background indexing, and battery discharge rate. A drop in tokens per second alone cannot isolate thermal throttling from active host power-saving policies or memory compression pressure. Capturing time-series clock frequencies alongside whole-device wattage over a ten-minute soak exposes exactly when and why the SoC steps down.

**Change after diagnosis:** Evaluate smaller checkpoints, energy-efficient NPU delegate lowerings, shorter generation ceilings, or staggered duty cycles that let the chassis cool between bursts. Smaller parameter counts alone never guarantee sub-3 W whole-system power while displays, cameras, and radios remain active. Any hard cap on output tokens must also preserve complete answer formatting and pass full held-out quality checks.

### 5. Over-the-air update bricks offline functionality

**Symptom:** Technicians install a freshly published model update before leaving the depot, only to watch the application crash immediately on launch once cellular connectivity drops. Even though model files downloaded intact over Wi-Fi, runtime initialization still attempted an uncached network check or referenced missing sidecar files.

**Investigate:** Reproduce the full startup and first-query flow inside a strict offline network sandbox with airplane mode active. Inspect missing tokenizer files, lazy Hub downloads, template format mismatches, missing multimodal assets, license refresh pings, and ABI incompatibilities with the installed runtime library. A missing Hugging Face hub token exception is only one common symptom of an incomplete deployment bundle.

**Change after diagnosis:** Package all tokenizer tables, chat templates, config manifests, and quantized weights into one cryptographically verified offline directory tree, and verify cold-start execution with networking disabled before signing. Use dual-slot A/B staging so an incomplete download or failing smoke test never corrupts the known-working resident slot. Maintain an attested offline recovery trigger so devices automatically revert to Slot A on consecutive startup probe failures.

## Core takeaways for edge engineering

Treat target hardware constraints as hard rejection gates before evaluating download sizes or benchmark hype. Mapping weight traffic, memory pools, distillation losses, and delegate graphs quantitatively early in design prevents expensive rewrites after model selection. Five device-level checks carry an edge SLM from prototype to reliable production deployment:

1. **Match model scope to task requirements:** Compare deterministic lookups, lightweight classifiers, extractive retrieval, and generative SLMs against the real error budget, remembering that arithmetic worksheets filter bad fits rather than qualifying good ones.
2. **Separate training signals from verification truth:** Soft teacher logits transmit runner-up structure at elevated temperatures, while explicit unit, schema, and applicability verifiers catch grounded failures before training; note that exact forward-KL gradients scale as $1/\tau$, making $\tau^2$ a high-temperature approximation.
3. **Budget the actual architecture:** Account for stored artifact weights, active streaming traffic, KV or recurrent state, multimodal encoders, runtime heaps, and temporary workspaces together rather than relying on effective parameter headlines.
4. **Inspect the installed runtime and physical envelope:** Lower and profile graphs directly on target mobile delegates, inspecting operator partitions alongside sustained shift thermal, clock, and battery energy integration rather than brief burst benchmarks.
5. **Route by calibrated confidence and privacy class, with dual-slot recovery:** Calibrate confidence on held-out answers and classify the full payload outside generation before allowing cloud fallback, and verify signed OTA manifests into an inactive slot while preserving a tested rollback path.

### Follow-up architectural questions

- Assume $34$ GB/s and one active-weight stream per step. A $15$-step/s target permits at most about $34/15 \approx 2.27$ GB for that traffic before other costs. What evidence would invalidate this assumption, and why does it not select a quantization method by itself?
- An NPU delegate reports 98% operator coverage but misses latency. Which partition boundaries occur per generated token, and how will you separate synchronization, conversion, copies, and compute?
- Derive the exact forward-KL gradient and its high-temperature approximation. What changes when teacher and student token events cannot be directly aligned?
- A validly signed update changes the tokenizer and prompt template. What cache/session transition, offline test, and recovery evidence must precede activation?

### Evaluation rubric

- Differentiate parameter count from memory bandwidth and thermal dissipation constraints.
- Derive the Hinton knowledge distillation loss and explain the mathematical role of temperature scaling and gradient compensation.
- Calculate KV cache memory savings from Grouped-Query Attention.
- Diagnose and resolve mobile NPU operator fallbacks and CPU memory thrashing.
- Combine calibrated confidence, grounding, and payload privacy class into an edge-cloud router, and verify signed edge model artifacts.

```mastery-quiz
[
  {
    "question": "A new dense candidate streams all 4.8 B active matrix weights once per step over an assumed 80 GB/s bus. Compare raw 4-bit and 8-bit payloads against a 25-step/s requirement, excluding other traffic. Which pair follows?",
    "options": [
      "4-bit: 2.4 GB,33.33 steps/s; 8-bit: 4.8 GB,16.67 steps/s; only 4-bit remains possible under the bound.",
      "4-bit: 4.8 GB,16.67 steps/s; 8-bit: 2.4 GB,33.33 steps/s; only 8-bit remains possible under the bound.",
      "4-bit: 2.4 GB,16.67 steps/s; 8-bit: 4.8 GB,33.33 steps/s; only 8-bit remains possible under the bound.",
      "4-bit: 4.8 GB,33.33 steps/s; 8-bit: 2.4 GB,16.67 steps/s; only 4-bit remains possible under the bound."
    ],
    "explanation": "Raw payloads are 4.8×4/8=2.4 GB and 4.8 GB. 80 divided by those sizes gives 33.33 and 16.67. The first ceiling exceeds 25; the second does not. Other work and target-device execution still need measurement.",
    "answer": "4-bit: 2.4 GB,33.33 steps/s; 8-bit: 4.8 GB,16.67 steps/s; only 4-bit remains possible under the bound."
  },
  {
    "question": "At temperature 3, the student assigns probability 0.65 to a token and the fixed teacher assigns 0.35 to the same token at the same prefix. Take one plain gradient-descent step directly on that student logit, using only temperature-squared forward KL and a learning rate of 0.2. What are the derivatives before and after loss scaling, and the signed change in the logit, in that order?",
    "options": [
      "(+0.10, +0.90, +0.18)",
      "(+0.10, +0.90, −0.18)",
      "(+0.10, +0.30, −0.06)",
      "(−0.10, −0.90, +0.18)"
    ],
    "explanation": "The student gives the token too much probability. The unscaled derivative is (0.65 − 0.35) / 3 = +0.10. Scaling the loss by 3² gives +0.90. Descent subtracts 0.2 × 0.90, so the logit falls by 0.18. A rise of 0.18 with positive derivatives takes an ascent step. A scaled derivative of +0.30 uses just one factor of 3. A negative first derivative reverses the probability difference.",
    "answer": "(+0.10, +0.90, −0.18)"
  },
  {
    "question": "A student model has a hard-label cross-entropy loss of 0.4, a soft KL loss of 0.2 that already includes temperature-squared scaling, and a hidden-state mean squared error of 0.05. When mixing the hard and soft losses, use α = 0.7 as the weight on the teacher’s soft loss. Add the hidden loss with its own weight of β = 0.1. What are the hard, soft, and hidden contributions and their total?",
    "options": [
      "Contributions 0.28+0.06+0.005; total 0.345.",
      "Contributions 0.12+0.14+0.05; total 0.310.",
      "Contributions 0.12+0.14+0.005; total 0.265.",
      "Contributions 0.40+0.20+0.005; total 0.605."
    ],
    "explanation": "The hard label gets the remaining share, 1 − 0.7 = 0.3. Its contribution is 0.3 × 0.4 = 0.12. The soft loss already includes temperature squared, so its contribution is 0.7 × 0.2 = 0.14. The hidden loss adds 0.1 × 0.05 = 0.005, giving a total of 0.265. A total of 0.345 swaps the hard and soft shares. A total of 0.310 adds the full hidden loss. A total of 0.605 adds both the hard and soft losses at full weight.",
    "answer": "Contributions 0.12+0.14+0.005; total 0.265."
  },
  {
    "question": "A homogeneous cache has 16 layers, head width 32, 1024 positions and 2-byte values. The trained designs use 8 or 4 KV heads with the same query-head count. Which payload pair and ratio follow?",
    "options": [
      "32 MiB and 16 MiB; 2×.",
      "16 MiB and 4 MiB; 4×.",
      "8 MiB and 4 MiB; 2×.",
      "16 MiB and 8 MiB; 2×."
    ],
    "explanation": "Multiply 2×16×8×32×1024×2=16,777,216 bytes=16 MiB. Halving KV heads halves this payload to 8 MiB. This excludes pool/metadata overhead and does not guarantee a speed ratio.",
    "answer": "16 MiB and 8 MiB; 2×."
  },
  {
    "question": "NumericRouter clips each feature to [−1, 1], sums the clipped values, and returns logits [−sum, sum] for classes 0 and 1. In eager mode it accepts any positive number of three-feature rows. The export declares batches of 1 through 8 rows. For a single row [−3, 0.75, 0.5], what are the logits and winning class? Which models accept ten such rows in one batch after the export is reloaded?",
    "options": [
      "[1.75, −1.75], class 0. Only the eager model runs.",
      "[−0.25, 0.25], class 1. Both models run.",
      "[−0.25, 0.25], class 1. Only the eager model runs.",
      "[1.75, −1.75], class 0. Both models run."
    ],
    "explanation": "Clipping −3 to −1 gives a sum of −1 + 0.75 + 0.5 = 0.25. Class 1 has the larger logit. The logits [1.75, −1.75] come from summing the raw row. The eager model can process ten rows of the required width. Expecting both models to run overlooks the export’s upper bound of eight. Predicting class 0 and success in both models makes both mistakes.",
    "answer": "[−0.25, 0.25], class 1. Only the eager model runs."
  },
  {
    "question": "Three ordered operations have CPU costs [3, 2, 4] ms and supported accelerator costs [0.5, 0.25, 0.5] ms. Each device transition adds 6 ms of synchronization and layout cost. What total latencies follow for CPU-only, accelerator/CPU/accelerator, and all-accelerator execution?",
    "options": [
      "9 ms; 3 ms; 1.25 ms.",
      "9 ms; 15 ms; 13.25 ms.",
      "9 ms; 15 ms; 1.25 ms.",
      "15 ms; 9 ms; 1.25 ms."
    ],
    "explanation": "CPU execution totals 3+2+4=9 ms. Splitting execution incurs two device transitions: 0.5+6+2+6+0.5=15 ms. Keeping all three operations on the accelerator totals 0.5+0.25+0.5=1.25 ms without transition overhead.",
    "answer": "9 ms; 15 ms; 1.25 ms."
  },
  {
    "question": "A four-hour worksheet generates 6000 tokens at 25 tokens/s and 3 W, spends 120 seconds at 4 W on retrieval/prefill, and idles at 1.1 W for all remaining seconds. All powers are mutually exclusive whole-system values. Against 4.5 usable Wh, what follows, rounded to two decimals?",
    "options": [
      "4.62 Wh; above usable budget.",
      "0.33 Wh; below usable budget.",
      "4.40 Wh; below usable budget.",
      "4.84 Wh; above usable budget."
    ],
    "explanation": "Decode takes 240 seconds. Idle is 14,400−240−120=14,040 seconds. Energy is (3×240+4×120+1.1×14,040)/3600=4.6233 Wh, exceeding 4.5.",
    "answer": "4.62 Wh; above usable budget."
  },
  {
    "question": "A baseline quality is 0.96. A release worksheet permits at most 0.015 quality drop and latency at most 100 ms. Exports A/B/C are (0.948,101 ms),(0.944,88 ms),(0.946,99 ms). Which set passes both numerical predicates?",
    "options": [
      "A and C.",
      "B and C.",
      "A and B.",
      "C only."
    ],
    "explanation": "The quality floor is 0.945. A passes quality but misses latency; B passes latency but misses quality; C passes both. These point estimates do not complete hardware or uncertainty qualification.",
    "answer": "C only."
  },
  {
    "question": "An edge router answers on device when a request is grounded and its calibrated confidence is at least 0.80. Otherwise it falls back to the cloud only for a public payload while online, and it abstains locally in every other case. A is grounded, public and online with confidence 0.93. B is ungrounded, public and online with confidence 0.97. C is grounded, restricted and offline with confidence exactly 0.80. Which decisions follow for A, B and C, in order?",
    "options": [
      "On device, on device, abstain locally.",
      "On device, cloud fallback, on device.",
      "Cloud fallback, cloud fallback, abstain locally.",
      "On device, cloud fallback, abstain locally."
    ],
    "explanation": "A is grounded and above the threshold, so it answers on device. B has the highest confidence but no grounding, so it cannot answer on device; its public payload and connection allow cloud fallback. C meets the threshold exactly while grounded, so it answers on device even though it is restricted and offline. Treating 0.97 alone as sufficient answers B on device, and reading the threshold as strict sends C to abstention.",
    "answer": "On device, cloud fallback, on device."
  },
  {
    "question": "An updater checks four signed update packages for a compatible device and runtime at time 100. Staging requires version 7 or later, an expiry strictly after the check time, and artifact bytes that match the signed manifest. A and B are version 8 and expire at 140. A’s bytes differ and B’s match. C is version 7 and expires at 100. D is version 6 and expires at 140. The bytes match for both C and D. Which packages qualify for staging?",
    "options": [
      "B and C.",
      "D only.",
      "B only.",
      "A and B."
    ],
    "explanation": "B meets the version floor, has 40 time units left and matches the manifest. Including C would accept a package at its expiry instant. Selecting only D treats version 7 as a maximum and reverses the version check. Including A would trust authenticated metadata without checking the artifact against it.",
    "answer": "B only."
  }
]
```

> **Next:** Continue to [Speculative Decoding](/learn/speculative-decoding), where a smaller draft model proposes tokens for a target to verify. Acceptance, verification cost, and sampling correctness decide whether the extra model produces a speedup.
