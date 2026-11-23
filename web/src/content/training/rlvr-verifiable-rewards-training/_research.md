# RLVR: manual evidence review

Checked September 22, 2026. Editorial notes, not rendered content. Replaces a generated outline that conflated R1 with R1-Zero, critic removal with reward-model removal, and checkable rewards with complete correctness. Unverified variant descriptions from that outline aren't used as evidence.

## Rewards and algorithms

- Tülu 3 section 6 defines verifier rewards, uses PPO, sets success reward 10, and retains a value model. Table 21 separately gives a -10 missing-EOS penalty. It builds on earlier execution-feedback methods rather than originating every form of reward-driven checking: https://arxiv.org/html/2411.15124
- RLVR identifies executable supervision. GRPO is one optimizer; DPO can use verifier-ordered pairs and online DPO can refresh them. The original DPO mechanism is a different paired objective: https://arxiv.org/html/2305.18290
- DeepSeekMath's tokenwise ratio, per-response token average, and sample reference term differ from raw response-ratio clipping. Removing a critic saves its state/work, not a universal half of peak VRAM: https://arxiv.org/html/2402.03300
- R1 uses response-level notation. Its expanded report supplies additional training settings and reflective-word observations; a missing preliminary SFT stage doesn't establish that pretraining never contained reflection demonstrations: https://arxiv.org/html/2501.12948
- DAPO sections 2.3 and 3 explain omitted KL, asymmetric clipping, active-token reduction, dynamic filtering of uniform groups, and soft overlong penalties. Filtering changes sampling and can require extra generation. Length shaping doesn't guarantee preserving every valid long solution: https://arxiv.org/html/2503.14476
- Current TRL guide, checked September 22, defaults to DAPO reduction, group scaling, token ratios, and beta=0. It supports other objectives and correction settings. Record configuration, not just the trainer class: https://huggingface.co/docs/trl/grpo_trainer

## Version-specific R1 case study

- Original January 2025 v1 reports R1-Zero's AIME curve 15.6 to 71.0%, averages 16 sampled labels per question for that figure, and reports 86.7% cons@64 in Table 2. The expanded report instead gives 77.9% as its curve endpoint. These aren't interchangeable versions or aggregation methods: https://arxiv.org/html/2501.12948v1 and https://arxiv.org/html/2501.12948
- Original sections 2.3.1-2.3.4 describe cold-start SFT, reasoning RL, rejection sampling/SFT, and final RL. Reasoning domains include science. Language consistency is a positive target-language word-proportion reward, summed with accuracy, with a reported small capability/readability tradeoff: https://arxiv.org/html/2501.12948v1
- Original rejection sampling gathers about 600k reasoning and 200k non-reasoning samples; some reasoning judgments use DeepSeek-V3. The combined 800k train DeepSeek-V3-Base for two epochs and also support student distillation. They aren't all programmatically proven reasoning traces: https://arxiv.org/html/2501.12948v1
- Original final RL scores helpfulness on final summaries and harmlessness on complete responses. Table 6's distilled-versus-RL 32B comparison is setup-specific and isn't a controlled universal compute-efficiency ranking: https://arxiv.org/html/2501.12948v1
- Spurious Rewards reports Qwen2.5-Math-7B MATH-500 gains of 21.4 points with random rewards versus 29.1 with ground truth. Other tested families generally respond differently; clipping ablations constrain interpretation. This is within-study evidence, not an independent replication: https://arxiv.org/html/2506.10947

## Checking boundaries

- Math-Verify README distinguishes extraction priorities, SymPy representation, and comparison, including configurable tolerance and ordered gold/prediction arguments. Flexible extraction and strict final fields answer different contracts: https://github.com/huggingface/Math-Verify
- Firecracker host recommendations require maintained kernels, seccomp, and operational controls including bounded output. gVisor supplies an application-kernel boundary with its own threat model. Neither automatically implements every mount/network/resource policy: https://github.com/firecracker-microvm/firecracker/blob/main/docs/prod-host-setup.md and https://gvisor.dev/docs/architecture_guide/security/
- Python's `-I` changes import paths and environment handling. It isn't a filesystem or kernel security boundary: https://docs.python.org/3/using/cmdline.html#cmdoption-I
- Lean axiom documentation explains transitive dependencies, sorryAx, legitimate standard axioms, and native evaluation's compiler-dependent assumptions. Freeze intended statements and imports; successful compilation alone isn't a completed proof audit: https://lean-lang.org/doc/reference/latest/Axioms/
- SQLite documents undefined row ordering without ORDER BY and undefined tie order on equal keys. Compare multisets when order is irrelevant and preserve duplicate semantics: https://sqlite.org/lang_select.html
- Lightman et al.'s MATH study labels intermediate steps and selects among a fixed generator's outputs. It isn't evidence that every process-supervised policy receives correct dense gradients: https://arxiv.org/html/2305.20050

## Authored exercises

- Eleven marked CPU exercises use authored candidates and outcomes. The local subprocess exercise runs fixed trusted strings, not arbitrary model code, microVMs, or gVisor. The proof exercise consumes synthetic audit records and doesn't call Lean.
- Invalid references raise separately from candidate reward zero. The bullet exercise exposes extra-prose and empty-bullet loopholes. The decimal lab uses exact Fraction arithmetic after bounded Decimal parsing, including a 40-digit edge case and tolerance boundaries.
- The mixed-group probability 1-p^G-(1-p)^G assumes independent binary outcomes; correlated generations need separate measurement. A 1% success chance with G=64 gives only about 47.4% probability of a mixed group.
- The categorical PyTorch fixture enumerates eight outcomes and one small update. It isn't transformer training or a complete online RLVR implementation. Its initial KL sample term/gradient are zero.
- Capability scores, thresholds, nominal cluster capacity, and checker attacks are synthetic. No actual policy, cluster, GPU training, sandbox, proof engine, benchmark reproduction, or deployment was exercised.

Source scope: relevant report passages, equations, README policies, and checking/security documentation were read. Complete papers, all optional backends, and all listed research variants aren't claimed.
