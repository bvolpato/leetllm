# LoRA and parameter-efficient tuning: manual evidence notes

Reviewed September 22, 2026. These notes record source checks and corrections; they aren't a generated outline or a record of GPU experiments.

## Low-rank updates and initialization

- Intrinsic dimensionality concerns free coordinates in a global parameter subspace. It doesn't imply that each adapted matrix has low rank. A one-coordinate family ΔW = θI is a counterexample. The article treats low-rank adaptation as a useful constraint to evaluate, rather than a consequence proved by the intrinsic-dimension study. Original study and author order: https://arxiv.org/html/2012.13255
- LoRA's original linear-layer recipe uses random Gaussian A, zero B, and α/r scaling. Zero B gives a no-op; its first loss gradient can be nonzero, while A's is zero. Nonzero A and x do not imply Ax ≠ 0. The new CPU cell demonstrates ordinary, null-space, both-zero, and reversed initialization. Original mechanism and scoped GPT-3 memory/parameter comparisons: https://arxiv.org/html/2106.09685v2
- PEFT 0.20.0 defaults to Kaiming-uniform A and zero B for ordinary linear LoRA. Other initialization modes and layer types differ. Source version matches the tiny CPU fixtures: https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/src/peft/tuners/lora/layer.py
- rsLoRA uses α/√r. Its limiting-rank theorem has initialization and moment assumptions, and its experiments don't establish a universal rank-32 or rank-64 cliff. Check the scaling definition, theorem, and tested ranks: https://arxiv.org/html/2312.03732

## PEFT contracts and targeting

- Architecture names and grouped-query projection sizes matter. QLoRA's all-linear result is a particular LLaMA-7B/Alpaca ablation, not a rule that every procedural task needs MLP adapters or that coverage always beats rank. Paper targeting experiment: https://arxiv.org/html/2305.14314
- Inspect actual wrapped modules; `all-linear` excludes the output layer for supported PreTrainedModel instances. Targeting and initialization options: https://huggingface.co/docs/peft/developer_guides/lora
- Supported adapters ordinarily promote BF16/FP16 parameters to FP32. `autocast_adapter_dtype=False` changes that storage behavior. The new CPU dtype probe verifies both settings against PEFT 0.20.0: https://huggingface.co/docs/peft/developer_guides/troubleshooting
- Preparing a k-bit model freezes existing parameters and promotes eligible non-quantized tensors to FP32. Frozen parameter gradients and gradients flowing through operations are different: https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/src/peft/utils/other.py
- The tiny, locally initialized Qwen2 fixture checks first-step no-op, frozen base weights, second-step A learning, adapter save/reload against the exact base, and merge equivalence. It downloads no model and doesn't establish useful task behavior. Dependency pins are reproducibility choices, not a latest-version recommendation.

## QLoRA memory and quantization

- QLoRA demonstrated 65B fine-tuning on a 48 GB GPU with a particular configuration. Ideal packed-weight arithmetic omits adapters, their state, unquantized tensors, activations, metadata, and temporary buffers. The memory figure now compares explicitly different inventories and makes no fit guarantee: https://arxiv.org/html/2305.14314
- NF4 uses a finite, asymmetric 16-value lookup containing exact zero. It isn't a miniature sign/exponent/mantissa format, and normal-distribution motivation doesn't prove universal minimum-MSE performance. The new standard-library cell checks a rounded codebook lookup, not CUDA behavior or quantization quality: https://github.com/bitsandbytes-foundation/bitsandbytes/blob/833649043474794b8fe7a4136e0c40faf077b2e0/bitsandbytes/functional.py
- The paper describes 64-weight blocks and second-stage 256-scale blocks. Ideal scale overhead is 8/64 + 32/(64×256) bits per weight. Current bitsandbytes stores mean-centered scale codes and an associated codebook; these codes need not be literal FP8 values. Paper appendix and pinned implementation: https://arxiv.org/html/2305.14314 and https://github.com/bitsandbytes-foundation/bitsandbytes/blob/833649043474794b8fe7a4136e0c40faf077b2e0/bitsandbytes/functional.py
- Paged optimizer state uses CUDA managed memory, not ordinary pinned CPU tensors. Migration can cost time and doesn't repair every activation or temporary-buffer OOM. The paper's batch-16 runtime observation doesn't guarantee negligible overhead for other workloads: https://huggingface.co/docs/bitsandbytes/explanations/optimizers
- Packed storage doesn't mean that dequantized weights live only in registers or SRAM. The pinned standard four-bit backward path materializes a dequantized weight matrix for input gradients; the current forward path uses four-bit GEMM. Relevant functions checked: https://github.com/bitsandbytes-foundation/bitsandbytes/blob/833649043474794b8fe7a4136e0c40faf077b2e0/bitsandbytes/autograd/_functions.py

## Serving and DoRA

- Merging removes ordinary adapter work from the inference graph. It doesn't establish equal latency for every serving configuration or imply that all merged artifacts must be GPU-resident. The 700 GB versus 20.4 GB worked comparison is assumed artifact storage, excluding runtime memory: https://arxiv.org/html/2106.09685v2
- Punica names its kernel SGMV, not BGMV. For row-batched tokens and PyTorch output-by-input weights, the article consistently uses XW₀ᵀ and (XᵢAᵢᵀ)Bᵢᵀ. Relevant architecture and kernel description: https://arxiv.org/html/2310.18547
- S-LoRA jointly manages adapter and KV-cache memory in a paged GPU pool. This differs from managed-memory optimizer paging; it reduces fragmentation and prefetches anticipated adapters without eliminating I/O costs: https://arxiv.org/html/2311.03285
- DoRA's reported correlations come from its VL-BART query/value case study. They aren't universal properties or proof that additive updates cannot separate magnitude and direction. Its paper also detaches the normalization denominator during training: https://arxiv.org/html/2402.09353
- PyTorch linear weights use row norms and one magnitude per output channel. The rectangular CPU fixture exposes this axis, and the article distinguishes the forward equation from the detached training graph. Relevant PEFT 0.20.0 implementation: https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/src/peft/tuners/lora/dora.py
- Soft prompt and prefix tuning are separate learned-input parameterizations. Their original task results don't support a universal capacity ranking: https://aclanthology.org/2021.emnlp-main.243/ and https://aclanthology.org/2021.acl-long.353/

No GPU fine-tune, serving benchmark, or quantized CUDA reproduction was run for this review. Relevant source methods and implementation functions were checked; complete appendices and every backend aren't claimed.
