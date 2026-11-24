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

Move a language model from a datacenter GPU onto a fanless handheld terminal and every cloud assumption breaks at once. You have a 4 GB RAM cap, a 50 GB/s unified memory bus, a 3.5 W sustained thermal envelope, and an eight-hour battery shift, yet technicians still expect answers in under 250 ms time to first token (TTFT) at 18 tokens/s even ten minutes into continuous use.

Fitting a **<span data-glossary="small-language-model">small language model (SLM)</span>** inside those walls takes more than picking the smallest checkpoint on Hugging Face. You have to match the model class to the job, check the memory-bandwidth roofline, distill domain knowledge from a stronger teacher, pick a mobile-friendly architecture, lower the graph cleanly onto the device's NPU, and handle thermal throttling, privacy boundaries, and crash-safe over-the-air updates.

<figure>
  <img src="illustrations/_generated/edge_deployment_stack_dark.png" alt="Comparison across four edge configurations under a 4 GB RAM budget, 50 GB/s memory bus, and 18 tokens/s decode floor: 8B FP16 needs 16 GB and exceeds RAM at 3.1 t/s; 3.8B INT8 takes 3.8 GB weights plus KV and hits 13.2 t/s; distilled 3.8B INT4 fits in 1.9 GB and clears 18 t/s at 26.3 t/s; distilled 1.7B INT4 with a 0.3B speculative draft cuts active memory to 1.1 GB and raises effective decode speed past 38 t/s." />
  <figcaption>Under a 50 GB/s bus and 4 GB RAM cap, moving from 8-bit to distilled 4-bit weights halves streaming traffic and clears the 18 t/s floor, while pairing a 1.7B student with a speculative draft pushes throughput past 38 t/s.</figcaption>
</figure>

```checkpoint
Which device and task constraints determine whether an edge SLM is viable?
---
A viable model must satisfy a specific offline job, latency target, privacy boundary, resident memory budget, power draw, and sustained thermal limit on real hardware. Those physical constraints decide the model size and runtime.
```

## Start from the physical constraint, not the model size

Not every device task needs autoregressive generation. Match model complexity to the job before choosing parameter counts:

| Device job | Latency target | Privacy boundary | First baseline to try |
|---|---|---|---|
| Fault intent routing | p95 < 60 ms | Local only | Rules or compact classifier |
| Field manual Q&A with citations | p95 < 250 ms <span data-glossary="ttft">TTFT</span>; 18 t/s sustained | Local only | Local retrieval + instruct SLM (vs. extractive baseline) |
| Damaged-item photo + text triage | p95 < 400 ms | Local only | Vision classifier or two-stage pipeline |
| Offline manual lookup | p95 < 60 ms | Local only | Indexed local search, no generation |

Remember that TTFT covers the *entire* pipeline: retrieval, templating, tokenization, and prefill until the first **visible** answer token arrives (if the model emits hidden reasoning tokens, track first-visible-token latency separately).

## A bandwidth worksheet, with its assumptions visible

During single-user (`batch = 1`) decode, reading model weights from DRAM dominates latency. Counting 2 FLOPs per multiply-accumulate over $P$ active weights yields a simple arithmetic-intensity ratio:

$$
\text{Arithmetic Intensity} \approx \frac{2P}{P \cdot (\text{bits}/8)} = \frac{16}{\text{bits}} \text{ FLOPs/byte}
$$

That is only **1 FLOP/byte** at 16-bit and **4 FLOPs/byte** at 4-bit. That explains why a mobile NPU advertising 45 TOPS still crawls during decode: its compute units sit mostly idle waiting for memory! Dividing bus bandwidth by active weight size gives an optimistic upper bound on decode speed:

$$
\text{Weight-streaming ceiling (tokens/s)} = \frac{\text{Memory bandwidth (GB/s)}}{\text{Active weight footprint (GB)}}
$$

For a dense 3.8B model on a 50 GB/s bus:
- **8-bit (3.8 GB):** $50 / 3.8 \approx 13.2\text{ t/s}$ (already misses our 18 t/s target before KV cache or kernel overhead!).
- **4-bit (1.9 GB):** $50 / 1.9 \approx 26.3\text{ t/s}$ (clears 18 t/s with headroom for KV traffic and dequantization).

<figure>
  <img src="illustrations/_generated/bandwidth_streaming_ceiling_dark.png" alt="The same 3.8 billion active matrix weights stream over a 50 GB/s mobile memory bus. One full read occupies 3.8 GB at 8 bits and 1.9 GB at 4 bits, producing conditional ceilings of 13.2 and 26.3 tokens per second on one shared scale. The 18-token-per-second target falls between them. Packet widths use the byte counts and the rate markers use the displayed calculations." />
  <figcaption>A 3.8B model on a 50 GB/s bus caps at 13.2 t/s in 8-bit (below 18 t/s) and 26.3 t/s in 4-bit before KV cache, activation, and kernel overhead.</figcaption>
</figure>

Always budget **total runtime RAM**, not just checkpoint size on disk:

$$
\text{Memory}_{\text{total}} = \text{Weights} + \text{KV Cache} + \text{Activation Buffers} + \text{Runtime Overhead}
$$

## Distillation: transferring dark knowledge to compact silicon

Shrinking weights clears the bandwidth bar, but smaller models often lose accuracy on structured citations and tool calls. **Knowledge distillation** trains a compact student on a stronger teacher's soft probability distributions, transferring "dark knowledge" about how plausible runner-up tokens rank against absurd ones.[^hinton2015]

Token-level distillation combines hard cross-entropy with temperature-scaled forward KL divergence:

$$
\mathcal{L}_{\text{distill}} = \alpha \tau^2 \cdot \text{KL}\!\left(\sigma\!\left(\frac{z_T}{\tau}\right) \Big\| \sigma\!\left(\frac{z_S}{\tau}\right)\right) + (1 - \alpha)\,\text{CE}(y, z_S)
$$

Why raise temperature $\tau$ and multiply by $\tau^2$?
- **Raising $\tau$** softens the teacher's probabilities while preserving rank order: on logits `[4.0, 2.0, 1.0]`, $\tau = 1$ puts `84.4%` on token A and only `4.2%` on C, whereas $\tau = 3$ lifts B and C to `27.3%` and `19.6%` so the student gets rich gradient contrast on runner-ups.
- **Multiplying by $\tau^2$** compensates for gradient shrinkage: the exact unscaled KL derivative is $\frac{\partial \mathcal{L}_{\text{KL}}}{\partial z_{S,i}} = \frac{p_{S,i} - p_{T,i}}{\tau}$, and at large $\tau$ the probability gap $p_{S,i} - p_{T,i}$ itself shrinks as $1/\tau$, giving an approximate $1/\tau^2$ decay.[^hinton2015]

<figure>
  <img src="illustrations/_generated/soft_target_temperature_dark.png" alt="Aligned probability bars on a 0 to 1 scale compare one-hot target [1, 0, 0] with teacher logits [4, 2, 1] at temperatures 1 and 3. At T=1, token probabilities are 0.844, 0.114, and 0.042 with B/C odds exp(1) = 2.72. At T=3, probabilities flatten to 0.532, 0.273, and 0.196 with B/C odds exp(1/3) = 1.40 while keeping A > B > C." />
  <figcaption>Raising temperature from 1 to 3 preserves rank order (A > B > C) while lifting runner-up probabilities from [0.114, 0.042] to [0.273, 0.196].</figcaption>
</figure>

<figure>
  <img src="illustrations/_generated/distillation_gradient_temperature_dark.png" alt="For teacher logits [4, 2, 1] and student logits [3.2, 2.4, 1.1], the first unscaled forward-KL gradient is −0.207576, −0.029854, and −0.000024 at temperatures 1, 3, and 100. On a second shared −0.30-to-0 axis, multiplying each gradient by temperature squared gives −0.207576, −0.268686, and −0.235045, with the high-temperature limit −0.233333. Bars extend left from zero to show negative derivative values; values remain temperature-dependent." />
  <figcaption>Unscaled forward-KL gradients collapse by ~10,000x at $\tau=100$, while $\tau^2$ scaling keeps them steady near the high-temperature limit $-0.233$.</figcaption>
</figure>

<!-- leetllm: test, deps=numpy, output=show -->
```python title="distillation-signals-and-gradients.py"
import numpy as np

teacher = np.array([4.0, 2.0, 1.0])
student = np.array([3.2, 2.4, 1.1])

def softmax(z, tau=1.0):
    s = (z - np.max(z)) / tau
    e = np.exp(s)
    return e / e.sum()

for tau in (1.0, 3.0, 100.0):
    p, q = softmax(teacher, tau), softmax(student, tau)
    grad = (q[0] - p[0]) / tau
    print(f"tau={tau:3.0f} | teacher probs={np.round(p, 3).tolist()} | grad0={grad:.6f} | tau^2*grad0={tau**2 * grad:.6f}")

# Combine hard CE, tau^2-scaled KL (tau=2), and hidden-state MSE
p_t, p_s = softmax(teacher, 2.0), softmax(student, 2.0)
hard_loss = -np.log(softmax(student)[0])
soft_loss = 4.0 * np.sum(p_t * np.log(p_t / p_s))
hidden_loss = np.mean((np.array([0.3, 0.0, 0.1]) - np.array([0.4, -0.1, 0.2])) ** 2)
total = 0.2 * hard_loss + 0.8 * soft_loss + 0.2 * hidden_loss
print(f"hard={hard_loss:.4f}, soft={soft_loss:.4f}, hidden={hidden_loss:.4f} -> total={total:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
tau=  1 | teacher probs=[0.844, 0.114, 0.042] | grad0=-0.207576 | tau^2*grad0=-0.207576
tau=  3 | teacher probs=[0.532, 0.273, 0.196] | grad0=-0.029854 | tau^2*grad0=-0.268686
tau=100 | teacher probs=[0.339, 0.332, 0.329] | grad0=-0.000024 | tau^2*grad0=-0.235045
hard=0.4522, soft=0.1480, hidden=0.0100 -> total=0.2109
```
<!-- leetllm: output:end -->

When teacher and student use different tokenizers (or a closed API teacher only returns text), teams use **sequence-level distillation** on verifier-filtered synthetic data, following Phi-3's textbook-quality data recipe[^abdin2024], or **reverse KL** ($\text{KL}(p_S \parallel p_T)$ as in MiniLLM[^gu2024]) so small students focus on high-probability teacher modes instead of spreading thin across every phrasing.

> **Common mistake:** Naive string-plus-number filtering lets poisoned examples into synthetic training sets. If a technician asks about `pump-A` (`M-7`: 12 Nm) and a synthetic answer cites `M-8` (`pump-B`: 30 Nm), the citation ID exists and the number `30` appears verbatim in `M-8`, yet the answer applies to the **wrong machine**. Always verify entity applicability alongside citation lookup and schema checks.

<figure>
  <img src="illustrations/_generated/verified_data_applicability_dark.png" alt="A query asks about pump-A. Manual M-7 gives pump-A and 12 Nm, so its citation, number, and equipment checks pass. Manual M-8 gives pump-B and 30 Nm; its citation and number match their source, but its equipment check fails and the example is rejected. This worked example demonstrates source applicability and gives no maintenance instruction." />
  <figcaption>M-8 passes naive citation and number checks while failing equipment applicability (`pump-B` vs. `pump-A`).</figcaption>
</figure>

After distillation, re-evaluate every **quantized export**: a distilled student can hold quality at INT8 (`0.938` vs. `0.940` baseline, `104 ms`) while dropping sharply at INT4 (`0.887`, violating a `0.02` drop budget even though latency hits `71 ms`).

<figure>
  <img src="illustrations/_generated/distillation_export_quality_dark.png" alt="Top panel shows the weighted distillation loss breakdown totaling 0.2109: hard cross-entropy contributes 0.0904 (0.4522 x 0.20), temperature-scaled KL contributes 0.1184 (0.1480 x 0.80), and hidden-state MSE contributes 0.0020 (0.0100 x 0.20). Bottom panel plots export quality versus p95 latency against a feasible zone (quality >= 0.92 and latency <= 120 ms): Baseline sits at (132 ms, 0.940), INT8 lands inside at (104 ms, 0.938), and INT4 misses quality at (71 ms, 0.887)." />
  <figcaption>Distillation loss breakdown (total 0.2109) paired with post-quantization trade-offs: only INT8 stays inside both the quality floor (0.92) and latency cap (120 ms).</figcaption>
</figure>

## Architecture choices that matter at small scale

Meta's **MobileLLM** study identified four structural levers for sub-billion and compact edge decoders:[^liu2024mobilellm]

1. **Deep and thin beats shallow and wide** at 125M–350M scale.
2. **Embedding tying** shares input and output embedding tables, reclaiming ~10–15% of total parameters.
3. **Immediate block weight sharing** (MobileLLM-LS) repeats adjacent layers to improve weight cache locality.
4. **Grouped-Query Attention (GQA)** cuts KV-cache RAM dramatically: for a 24-layer model with head dim 64 at 4,096 tokens in FP16, dropping from 16 KV heads to 4 cuts KV cache 4x from **384 MiB** to **96 MiB**.

<figure>
  <img src="illustrations/_generated/kv_cache_geometry_dark.png" alt="Sixteen query-head tiles are grouped four at a time onto four trained KV heads. Across 24 layers, each layer stores separate K and V values for 4096 positions, head width 64, and two bytes per value. The head-by-layer grids contain 384 MiB at 16 KV heads and 96 MiB at four KV heads, a fourfold cache reduction for this architecture. The grid cells represent one head in one layer for one K or V stream." />
  <figcaption>Grouping 16 query heads onto 4 trained KV heads shrinks a 24-layer, 4K-context FP16 KV cache from 384 MiB to 96 MiB.</figcaption>
</figure>

| Model family | Scale | Notable edge design choices |
|---|---|---|
| **MobileLLM / LS**[^liu2024mobilellm] | 125M / 350M | Deep-thin layers, tied embeddings, GQA, block reuse |
| **Phi-4-mini**[^microsoft2025phi4mini] | 3.8B | GQA, tied embeddings, 128K context, synthetic textbook tuning |
| **Gemma 4 E2B / E4B**[^gemma4modelcard2026] | 2.3B / 4.5B effective (5.1B / 8B with embeddings) | Per-layer lookup embeddings; budget full stored tensors, not just effective params |
| **Qwen3-1.7B**[^qwen32025] | 1.7B | 28 layers, 16Q/8KV GQA, toggleable thinking/non-thinking modes |

> **Common mistake:** Never budget device RAM from an "effective parameter" headline alone. Gemma 4 E2B reports 2.3B effective parameters, yet totals **5.1B parameters including per-layer embeddings**, which still require storage and memory mapping on device!

## On-device runtimes: mapping graphs to silicon

| Runtime | Format | Targets | Primary engineering check |
|---|---|---|---|
| **ExecuTorch**[^executorchBackends2026] | `.pte` | Core ML, MLX, Qualcomm, Vulkan, XNNPACK | Delegated partitions & CPU fallback boundaries |
| **Apple Core ML**[^appleCoreMLPreparation2024] | `.mlpackage` | ANE, GPU, CPU | Inspect actual compute plan (ANE vs. GPU/CPU) |
| **MLC LLM (TVM)**[^mlc2024] | Compiled library + weights | Metal, Vulkan, WebGPU | Target-matched compiled kernels |
| **ONNX Runtime Mobile / GenAI**[^onnxruntime2026mobile][^onnxGenAIGenerate2026] | `.onnx` / `.ort` | CPU + execution providers | Operator coverage & GenAI provider support |
| **llama.cpp**[^llamacpp2023] | GGUF | CPU, Metal, CUDA, Vulkan | Quantization kernel support & layer placement |

### Why partial NPU delegation can run slower than pure CPU

If ops 1 and 3 run on the NPU (0.5 ms each) while op 2 falls back to CPU (2 ms), each accelerator boundary can incur layout conversion and synchronization overhead (e.g., 6 ms each way): `0.5 + 6 + 2 + 6 + 0.5 = 15 ms`, **slower** than running all three ops cleanly on CPU (`3 + 2 + 4 = 9 ms`)! Always inspect partition boundaries before trusting a "98% delegated" badge.

<figure>
  <img src="illustrations/_generated/delegate_critical_path_dark.png" alt="Three execution paths run the same operation order. A split delegate sends operation 1 to the NPU, operation 2 to CPU fallback, and operation 3 back to the NPU, with synchronization and layout or materialization boundaries where required. A supported partition keeps operations together on the NPU; a CPU path keeps them together on CPU. The diagram shows execution order and boundary types without timing data or a required private-memory copy." />
  <figcaption>A single unsupported op in the middle of an NPU graph introduces two boundary transitions that can make split execution slower than staying on CPU.</figcaption>
</figure>

Before lowering to a mobile delegate, validate graph capture and dynamic-shape bounds on CPU with `torch.export`:[^pytorch2026export]

<!-- leetllm: test, deps=torch, output=show -->
```python title="export-reload-check.py"
from pathlib import Path
from tempfile import TemporaryDirectory
import torch
from torch import nn

class NumericRouter(nn.Module):
    def __init__(self):
        super().__init__()
        self.proj = nn.Linear(3, 2)
        with torch.no_grad():
            self.proj.weight.copy_(torch.tensor([[-1., -1., -1.], [1., 1., 1.]]))
            self.proj.bias.zero_()

    def forward(self, x):
        return self.proj(x.clamp(-1.0, 1.0))

model = NumericRouter().eval()
sample = torch.tensor([[-0.5, -0.2, 0.1], [0.8, 0.7, 0.6]])
batch = torch.export.Dim("batch", min=1, max=8)
program = torch.export.export(model, (sample,), dynamic_shapes=({0: batch},))

with TemporaryDirectory() as tmp:
    path = Path(tmp) / "router.pt2"
    torch.export.save(program, path)
    restored = torch.export.load(path).module()
    with torch.inference_mode():
        for b in (1, 2, 5, 8):
            x = torch.linspace(-2, 2, b * 3).reshape(b, 3)
            torch.testing.assert_close(restored(x), model(x))
        classes = restored(sample).argmax(-1).tolist()
    rejected = []
    for bad_shape in ((2, 4), (9, 3)):
        try:
            restored(torch.zeros(bad_shape))
        except (AssertionError, RuntimeError):
            rejected.append(bad_shape)

print("restored classes:", classes, "| rejected out-of-spec shapes:", rejected)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
restored classes: [0, 1] | rejected out-of-spec shapes: [(2, 4), (9, 3)]
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/exported_graph_contract_dark.png" alt="NumericRouter clamps 3-feature rows to [-1, 1] and projects with weights [[-1,-1,-1],[1,1,1]], mapping [-0.5,-0.2,0.1] to logits [0.6,-0.6] (class 0) and [0.8,0.7,0.6] to [-2.1,2.1] (class 1). After save and reload of router.pt2, exported dynamic batch bounds accept feature width 3 across batches 1 through 8, reject width 4 and batch 9, whereas eager execution accepts batch 9." />
  <figcaption>An exported `.pt2` graph enforces its declared width (3) and dynamic batch bounds (`1..8`) on reload, rejecting width 4 and batch 9 that eager PyTorch silently accepts.</figcaption>
</figure>

## Heat, battery, and physical edge limits

A 10-second burst benchmark on a cold phone tells you nothing about minute ten of a shift. Under continuous load, **dynamic voltage and frequency scaling (DVFS)** throttles clocks as the enclosure heats up.[^androidThermalAPI2026] A device starting at `23.0 t/s` can sag to `19.4 t/s` at 90 seconds and `16.8 t/s` at 10 minutes, missing an `18 t/s` floor. Always qualify on sustained thermal soak tests, not cold bursts.

<figure>
  <img src="illustrations/_generated/thermal_privacy_budget_dark.png" alt="Three workload throughput readings share one time and throughput scale: 23.0 tokens/s at the start, 19.4 at 90 seconds, and 16.8 at 600 seconds. Dashed connectors link only the sample points. A horizontal 18 tokens/s requirement shows the final sample below the target. Thermal state, power, placement, ambient conditions, and workload telemetry identify what drove the decline." />
  <figcaption>Sustained 10-minute soak throughput drops from 23.0 t/s down to 16.8 t/s, falling below the 18 t/s requirement.</figcaption>
</figure>

For battery sizing across an eight-hour shift, integrate **whole-system power** across decode, prefill, and idle intervals:

$$
E_{\text{1K tokens}} = \frac{P_{\text{avg}} \times 1000}{\text{tokens/s} \times 3600}\text{ Wh}
$$

At `3.5 W` and `18 t/s`, 1,000 tokens consume `54 mWh`. Across an 8-hour shift generating 30,000 tokens (plus 600 s prefill at 4 W and 1.2 W idle), Candidate A (`3.5 W` at `18 t/s`) uses **11.13 Wh**, while slower, hotter Candidate B (`6 W` at `10 t/s`) uses **14.07 Wh**, leaving almost no reserve on a 15 Wh cell. Faster decoding races back to low-power idle sooner!

<figure>
  <img src="illustrations/_generated/shift_energy_budget_dark.png" alt="Across an 8-hour duty cycle generating 30,000 tokens plus 600 s prefill at 4 W and 1.2 W idle, Candidate A decodes for 1,666.7 s at 3.5 W (18 t/s) and uses 11.13 Wh total (1.62 Wh decode, 54 mWh per 1k tokens). Candidate B decodes for 3,000 s at 6 W (10 t/s) and uses 14.07 Wh total (5.00 Wh decode), leaving minimal headroom under a 15 Wh nominal battery." />
  <figcaption>Full 8-hour shift energy across prefill, decode, and idle: Candidate A (11.13 Wh) preserves margin on a 15 Wh battery, whereas Candidate B (14.07 Wh) eats almost the entire nominal capacity.</figcaption>
</figure>

## Hybrid edge-cloud routing by confidence and privacy class

When a product allows cloud fallback for public queries, combine three independent signals rather than trusting raw token probabilities:

1. **Calibrated confidence:** Map next-token entropy $H(p) = -\sum_i p_i \log_2 p_i$ and top-2 margin $\Delta p = p_{(1)} - p_{(2)}$ to empirical accuracy via Platt scaling or isotonic regression fitted on held-out graded outputs.
2. **Evidence grounding:** Verify cited local passages exist and apply to the queried entity. Even `0.97` confidence must not answer locally if it is ungrounded!
3. **Whole-payload privacy class:** Classify the prompt, retrieved chunks, history, and attachments together (strictest class wins). Restricted or offline requests **never** leave the device; they answer from verified local evidence or abstain locally.

<figure>
  <img src="illustrations/_generated/trusted_payload_router_dark.png" alt="Five requests sit on a calibrated-confidence axis from 0 to 1 with a threshold at 0.80, sorted into three lanes. The grounded public FAQ lookup at 0.96 answers on device. The grounded public long-tail query at 0.43 falls back to the cloud. A restricted private note at 0.72, an ungrounded answer at 0.97, and an offline query at 0.30 all abstain locally." />
  <figcaption>A request answers on device only when both grounded and above the 0.80 confidence threshold. Restricted, ungrounded-internal, and offline queries stay on device and abstain when uncertain.</figcaption>
</figure>

<!-- leetllm: test, output=show -->
```python title="calibrated-edge-router.py"
import math

def calibrated_confidence(entropy_bits, margin):
    z = 1.1 - 1.6 * entropy_bits + 4.2 * margin
    return 1.0 / (1.0 + math.exp(-z))

def route(conf, grounded, data_class, online, threshold=0.80):
    if grounded and conf >= threshold:
        return "answer_on_device"
    if data_class == "public" and online:
        return "cloud_fallback"
    return "abstain_locally"

requests = [
    ("faq_lookup",        0.35, 0.62, True,  "public",     True),
    ("long_tail_public",  1.40, 0.20, True,  "public",     True),
    ("private_note",      0.90, 0.30, True,  "restricted", True),
    ("ungrounded_answer", 0.30, 0.70, False, "internal",   True),
    ("offline_query",     1.60, 0.15, True,  "public",     False),
]
for name, ent, margin, grounded, cls, online in requests:
    p = calibrated_confidence(ent, margin)
    print(f"{name:18s} p={p:.3f} -> {route(p, grounded, cls, online)}")
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

## Candidate selection and safe over-the-air updates

An interrupted in-place weight download can brick an offline terminal. Follow the dual-slot A/B pattern used in Android system updates:[^androidABUpdates2026][^tufSpecification2026]

1. Keep the verified working bundle untouched in **Slot A** while streaming updates into inactive **Slot B**.
2. Authenticate a signed manifest (Ed25519 signature + SHA-256 digests + monotonic version + expiry + device/runtime match) so neither truncated downloads nor rollback attacks can activate.
3. Bundle tokenizer tables, chat templates, and config inside the offline tree, run a cold-start smoke test in airplane mode, clear incompatible KV caches on switchover, and fall back to Slot A automatically if startup probes fail.

<figure>
  <img src="illustrations/_generated/dual_slot_update_dark.png" alt="Dual-slot OTA model staging keeps verified Slot A untouched while Candidate B downloads to inactive Slot B. Before activation, B passes signed manifest checks (Ed25519 signature, SHA-256 digests, monotonic version, expiry, device match) and single-model smoke verification within the memory budget. Activating B points fresh sessions at B and clears incompatible KV state; any error falls back to Slot A." />
  <figcaption>Dual-slot OTA staging verifies signatures, hashes, monotonic versions, and smoke tests inside Slot B before flipping the active pointer, keeping Slot A intact for automatic recovery.</figcaption>
</figure>

## Diagnosing edge deployment breakdowns

| Symptom | Likely root cause | First diagnostic & fix |
|---|---|---|
| **6 W draw at 5 t/s on device** (35 t/s on laptop) | NPU-to-CPU fallback partitions adding sync/conversion barriers | Inspect delegate compute plan; switch to natively supported operators or a pure optimized CPU path. |
| **INT4 breaks manual citations** | Aggressive 4-bit rounding distorts sensitive attention/MLP weights or host template drift | Compare intermediate logits against FP16; switch to AWQ/GPTQ calibration or keep sensitive layers at INT8. |
| **Silent crash after 15 minutes of chat** | OS low-memory kill from growing KV cache or retained session handles | Track peak RSS per turn; enforce context caps, free stale sessions, or use a GQA/sliding-window checkpoint. |
| **Speed collapses mid-shift** | DVFS thermal throttling after chassis warms up | Log clocks, power, and throughput over a 10-minute soak; shrink active traffic or lower duty cycle. |
| **Update crashes once offline** | Missing bundled tokenizer/template or lazy network Hub check | Test cold start in airplane mode before signing; stage updates in dual-slot A/B storage. |

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
