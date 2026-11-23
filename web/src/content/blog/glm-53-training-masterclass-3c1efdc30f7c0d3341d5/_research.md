# Private research brief: GLM-5.3 migration, post-training correctness, and operations

Manually checked September 23, 2026. This brief follows the article's GLM-5.2-to-5.3 migration; retained 5.2 sources document lineage rather than a 5.3 private training run.

## Confidentiality and evidence classification

This packet supports the existing **private** GLM-5.3 masterclass. Keep the bundle private, avoid exposing internal hostnames, credentials, customer data, unreleased measurements, or organization-specific infrastructure identifiers, and use only publicly accessible original papers, vendor documentation, model artifacts, and upstream source repositories for external links.

Classify every statement before repeating it:

1. **Public architecture fact:** confirmed by the released checkpoint configuration, tensor index, official model release, or original paper.
2. **Requested private-run configuration:** present in the masterclass/job settings, though settings alone do not confirm runtime activation.
3. **Public upstream behavior:** verified for an identified repository commit, release, or published documentation page.
4. **Observed private execution:** requires actual local startup logs, profiler traces, versioned trajectory records, fixed-input comparisons, or evaluation outputs. Public docs cannot manufacture this evidence.
5. **Engineering inference or risk:** explain the reasoning and name the experiment that could falsify it; never present it as an observed incident or published vendor result.

## Released GLM-5.3 architecture and size conventions

- GLM-5.3 BF16 configuration and tokenizer/template evidence is pinned to revision `304b8051cfb2b260b61ce0cbe330e02a98e73639`: https://huggingface.co/zai-org/GLM-5.3-BF16/tree/304b8051cfb2b260b61ce0cbe330e02a98e73639
- The FP8 release and artifact terms are pinned to revision `187fb9fff6319062325ff825627ef6db084d9bc6`: https://huggingface.co/zai-org/GLM-5.3/tree/187fb9fff6319062325ff825627ef6db084d9bc6
- Current product behavior and the retained-base claim are first-party documentation: https://docs.z.ai/guides/llm/glm-5.3 and https://docs.z.ai/guides/overview/migrate-to-glm-new
- The September 18 serving recipe recommends `glm47` for both reasoning and tool parsing. Its version badge and install example disagree, so verify the installed build rather than silently choosing a minimum: https://recipes.vllm.ai/zai-org/GLM-5.3

The following 5.2 sources document the migration baseline and family context:

- The official Hugging Face model page identifies the released checkpoint, model family, revision, artifact terms, and publicly stated capabilities: https://huggingface.co/zai-org/GLM-5.2
- Released `config.json` is the direct source for layer counts, hidden size, experts, selected experts, attention dimensions, position limit, rotary settings, and MTP-related configuration: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json
- The checkpoint tensor index shows which parameter keys and module namespaces exist in the actual downloadable artifact: https://huggingface.co/zai-org/GLM-5.2/blob/main/model.safetensors.index.json
- Z.AI's project repository and GLM-5.2 announcement document vendor naming and public product-level claims: https://github.com/zai-org/GLM-5 and https://z.ai/blog/glm-5.2
- The GLM-5 technical report provides family-level architecture, sparse-attention, routed-expert, post-training, and parameter-count context: https://arxiv.org/abs/2602.15763
- Z.AI's first-party Hugging Face post describes the published GLM-5.2 post-training stack and its slime/SGLang/On-Policy Distillation narrative: https://huggingface.co/blog/zai-org/glm-52-blog

The article distinguishes the vendor label `744B-A40B`, the family report's counting convention, and the approximately `753,329,940,480` stored checkpoint parameters. These are different evidence/denominator categories. Untied embedding plus output tables contribute only approximately `154,880 * 6,144 * 2 = 1.90B`; they do not by themselves explain the entire gap. Do not invent a reconciliation beyond what the vendor note and tensor manifest confirm.

The released configuration describes `78` main layers, hidden size `6,144`, three initial dense layers, `75` routed MoE layers, `256` routed experts per MoE layer, top-`8` routed experts, one shared expert, expert intermediate width `2,048`, `64` attention heads, a `512`-dimensional KV latent, `192 + 64` query/key content-plus-RoPE dimensions, vocabulary `154,880`, a `1,048,576` maximum position limit, and one decoder-style MTP module in the released graph. Match each field to the pinned configuration; model maximum, private job cap, and actually validated long-context quality are separate claims.

## One action must stay the same across six handoffs

The masterclass follows one model-generated tool-call token from rollout to optimizer update. Preserve a typed record containing prompt/tokenizer/template revision, exact sampled IDs, policy-versus-observation loss mask, trajectory/group ID, reward, sampled log probability, policy version, routed expert IDs, selected attention positions, packed offsets, learner log probability, and checkpoint version.

- Original Transformer attention and the policy's token-level architecture are grounded in the original paper: https://arxiv.org/abs/1706.03762
- Rotary positional encoding is grounded in the original RoFormer paper: https://arxiv.org/abs/2104.09864
- DeepSeek-V2 defines the MLA design that motivates compressed KV representations: https://arxiv.org/abs/2405.04434
- The original multi-token-prediction paper separates auxiliary future-token prediction from ordinary next-token decoding: https://arxiv.org/abs/2404.19737
- SkyRL's generator tutorial is the primary source for token-in/token-out and explicit response observation masks: https://docs.skyrl.ai/docs/tutorials/skyrl_gym_generator
- slime's agent documentation describes the analogous `Sample`/trajectory structure in the vendor-published alternative stack: https://thudm.github.io/slime/get_started/agent.html

A configured optimized MLA path does not prove the runtime stores compressed KV. A model checkpoint containing MTP tensors does not prove the learner trains them or that the serving engine uses MTP speculation. A valid-looking decoded transcript does not prove its token IDs and observation masks match the trajectory that was actually sampled.

## Sparse attention and expert replay are distinct correctness gates

The pinned GLM-5.3 configuration retains a DSA shortlist of `2,048` positions. Relative to a private `100,000`-token job cap, that is `2.048%`; relative to the model's `1,048,576` maximum, it is `0.1953125%`. Those percentages describe shortlist size, not the total cost of the indexer.

The stated IndexShare schedule yields `21` fresh-indexer and `57` shared-indexer main layers under the particular configuration. Z.AI's published `2.9x` per-token FLOP statement is tied to its stated million-token comparison; it isn't measured private-run throughput: https://z.ai/blog/glm-5.2

- The original routing-replay paper explains why expert-selection drift can destabilize MoE reinforcement learning: https://arxiv.org/abs/2510.11370
- NVIDIA's routing-replay documentation explains replaying selected expert IDs while retaining gradient flow through current router scores: https://docs.nvidia.com/nemo/automodel/nemo-automodel/nemo_automodel/components/moe/router_replay
- SkyRL's release notes scope its public routing-replay integration and version/topology restrictions: https://github.com/NovaSky-AI/SkyRL/releases/tag/skyrl-v0.2.0
- The pinned SkyRL validation code is direct evidence that some public routed-expert/Ray-executor combinations are explicitly rejected: https://github.com/NovaSky-AI/SkyRL/blob/bce9ee9a80fbd262db44c79d5af12291ced5492d/skyrl/train/utils/utils.py#L563-L584

R3 fixes the trajectory's discrete expert-selection mask; it does not freeze router weights, repair tokenizer mismatches, correct DSA selection, or eliminate policy staleness. If a custom branch claims routed-expert replay with a Ray executor or cross-node inference engine, verify that exact custom source and a fixed-rollout integration test rather than inferring support from upstream flags.

## Distributed learner, conversion, and MTP graph agreement

The optimizer-group follow-up checked upstream commit `8971d19dda0f2bda87783353dde93a5134422a96` (August 11, 2026), not merely current head. In optimizer/__init__.py, non-expert groups pass `intra_dp_cp_group` and expert groups pass `intra_expt_dp_group` to the distributed optimizer. process_groups_config.py maps these to partial DP-with-CP and expert-DP groups; parallel_state.py builds their sizes separately. With world size 64, TP8, CP8, PP1, EP64, ETP1, one optimizer instance, and default rematerialization factors, the non-expert group has size 8 and the expert group size 1. DP1 counts independent batch replicas; it does not force a size-one optimizer group for all parameters. The conventional 6+12/d memory example now separates these domains and does not claim to measure precision-aware private-run allocations. The article's SkyRL smoke revision does not resolve the production learner's Megatron fork; actual group membership and state residency remain required evidence.

- NVIDIA's Megatron Core parallelism guide defines TP, PP, CP, EP, DP, and supported group combinations: https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/parallelism-guide.html
- Official distributed checkpointing defines persistence and recovery rules for a configured Megatron Bridge job: https://docs.nvidia.com/nemo/megatron-bridge/latest/training/checkpointing.html
- Bridge's AutoBridge API reference defines model-specific conversion responsibilities and destination graph requirements: https://docs.nvidia.com/nemo/megatron-bridge/nightly/apidocs/bridge/bridge.models.conversion.auto_bridge.html
- MTP training documentation defines version-specific support and incompatibilities such as sequence-packing limitations: https://docs.nvidia.com/nemo/megatron-bridge/nightly/training/multi-token-prediction.html
- NVIDIA's performance guide bounds recomputation, overlap, and throughput recommendations by actual model/hardware recipes: https://docs.nvidia.com/nemo/megatron-bridge/latest/performance-guide.html
- NVIDIA's GB200 NVL72 page is hardware-capability evidence, not evidence that any particular private cluster uses that topology: https://www.nvidia.com/en-us/data-center/gb200-nvl72/

A `64`-rank factorization is arithmetic until launcher logs confirm node mapping, process groups, actual interconnect, and effective model-parallel settings. HF-to-Megatron conversion must preserve all required tensor names, shapes, dtypes, embedding tying, experts, DSA/MLA parameters, and the MTP module when the destination graph includes it. A loadable checkpoint directory doesn't prove semantic equivalence.

Validate MTP in a separate lane: import, exact manifest comparison, export, deterministic base logits, MTP outputs, serving load, depth-one speculation, deeper speculation, one optimizer step, and a second round trip. SkyRL explicitly documents speculative-decoding features separately from ordinary inference: https://docs.skyrl.ai/docs/examples/spec_decode

## Asynchrony changes the statistical objective

- The documented fully asynchronous SkyRL tutorial explains intended queueing and worker-versus-batch capacity: https://docs.skyrl.ai/docs/tutorials/fully_async
- Its pinned tutorial source is the appropriate evidence for the public implementation at the inspected commit: https://github.com/NovaSky-AI/SkyRL/blob/bce9ee9a80fbd262db44c79d5af12291ced5492d/docs/content/docs/tutorials/fully_async.mdx
- The pinned off-policy-correction documentation distinguishes rollout importance sampling and token/sequence handling: https://github.com/NovaSky-AI/SkyRL/blob/bce9ee9a80fbd262db44c79d5af12291ced5492d/docs/content/docs/algorithms/off_policy_correction.mdx
- The DeepSeekMath paper grounds GRPO's group-relative objective and its original context: https://arxiv.org/abs/2402.03300
- vLLM's own guide defines processed versus raw log-probability semantics: https://docs.vllm.ai/en/latest/usage/v1_guide/#semantic-changes-to-logprobs

For the private illustrative settings `B=32`, `W=48`, and target staleness `S=2`, the public aggregate-capacity inequality is `32 <= 48 <= 96`. This does not prove a hard per-trajectory age limit: a long rollout can arrive after more than two learner updates. A custom policy loss absent from the pinned public tree needs its own source-level denominator, clipping, and correction audit.

Processed rollout log probabilities may include temperature, top-k/top-p, or other logits processors. Comparing them with an unprocessed learner log-softmax can manufacture a mismatch even before any optimizer update. A raw-target/processed-behavior ratio can also be a deliberately different objective; specify which one is intended. For same-support processed comparisons, preserve the rollout's retained token IDs and normalize current learner logits on those saved IDs. Recomputing top-k/top-p from updated logits changes support. vLLM's current sampling-mask interface describes this distribution replay, but requires Model Runner V2, disables FlashInfer sampling, and rejects speculative decoding: https://docs.vllm.ai/en/latest/training/sampling_mask/

Record behavior distribution, target distribution, masks, ratio direction, clipping branch, policy versions, and token denominator together. The public mask interface is not proof that this private SkyRL integration or its MTP lane supports it.

## Production observation and threat-model evidence

- NVIDIA's NCCL troubleshooting guide and maintained test suite distinguish communication-order failures from reproducible fabric faults: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html and https://github.com/NVIDIA/nccl-tests
- vLLM's CUDA-graph design explains why omitting an explicit override does not mean graph execution is disabled: https://docs.vllm.ai/en/latest/design/cuda_graphs/
- The upstream vLLM GLM-5.2 study is a model-specific public benchmark with its own B300/NVFP4/serving assumptions, not evidence for a private GB200/FP8 training run: https://github.com/vllm-project/vllm-project.github.io/blob/main/_posts/2026-07-23-glm-5.2-nvfp4-b300-pd.md
- Kubernetes pod-security standards, NIST's generative-AI risk profile, and the OWASP GenAI risk list support deployment threat modeling: https://kubernetes.io/docs/concepts/security/pod-security-standards/ ; https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence ; https://genai.owasp.org/llm-top-10/
- W3C PROV, the SPDX Dataset profile, and original Datasheets for Datasets research define distinct machine-readable versus human-readable dataset lineage formats: https://www.w3.org/TR/prov-dm/ ; https://spdx.org/rdf/3.0.1/terms/Dataset ; https://arxiv.org/abs/1803.09010
- OpenTelemetry's evolving GenAI semantic conventions are the direct source for instrumentation fields, with the deployed convention version recorded explicitly: https://github.com/open-telemetry/semantic-conventions-genai

## Non-claims and refresh schedule

Public Z.AI material documents a slime/SGLang/OPD path. The private masterclass analyzes a SkyRL/vLLM/Megatron/GRPO configuration. Shared invariants do not make the two vendor stacks, objectives, rollout executors, kernel versions, reward services, or results identical.

Configured flags are not observed runtime state. GPU allocation isn't proof of optimizer progress. A green process isn't proof of rollout/learner parity. A fast kernel isn't evidence of training throughput. Reward growth isn't proof of held-out causal improvement. Any claim about live policy quality, customer outcomes, private cost, cluster topology, or a specific incident requires the private run's actual contemporaneous evidence and must remain inside the private bundle.

Architecture/config links under `main`, upstream release notes, service features, package versions, model support, and provider recommendations can change. Pin revisions and dates when promoting a volatile claim; preserve the article's existing private visibility and refresh metadata rather than turning this packet into a public artifact.
