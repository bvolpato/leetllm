# Training Run Operations: manual evidence notes

Checked September 22, 2026. Full article, metadata, questions, original four examples, all four illustration sources, banner source, and banner prompt read individually. These notes record source checks; they are not generated article-improvement instructions.

## Recovery is more than weights

- [AdamW](https://arxiv.org/abs/1711.05101): the adaptive gradient term and decoupled weight decay are distinct. Fresh moments plus a fresh bias-correction counter give a first adaptive scalar update bounded by the learning rate, not an arbitrarily huge update for tiny gradients. The new scalar exercise checks that arithmetic. The existing JSON Adam exercise isolates lost moments while preserving the old counter; it models continuity, not a GPU checkpoint.
- [torchtune checkpointer](https://meta-pytorch.org/torchtune/stable/deep_dives/checkpointer.html): relevant intermediate-versus-final checkpoint passages checked. Its documented recipe-state checkpoint is currently saved at epoch boundaries; don't imply every recipe supports arbitrary mid-window recovery.
- [AMP effective-batch guidance](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html): gradients remain scaled during accumulation, and the scale is constant until the effective-batch boundary. Overflow can skip an optimizer step while data and scaler state advance. A successful-update scheduler must follow successful updates, not attempted windows or the optimizer's often-None return value.

## Checkpoint timing, completeness, and topology

- [Llama 3 report](https://arxiv.org/html/2407.21783): Table 4 includes 16,384-GPU configurations. The 54-day interruption report distinguishes 419 unexpected and 47 planned interruptions, including six silent data corruption incidents. It doesn't establish the old 26,000-hour per-server MTBF or a universal 90-minute cluster fault cadence. The inverse-count MTBF formula is retained only as a stated independent, equal-rate device model.
- [DCP asynchronous recipe](https://docs.pytorch.org/tutorials/recipes/distributed_async_checkpoint_recipe.html): standard asynchronous saving has blocking staging; DefaultStager, introduced in 2.9, can stage in a background thread. Staging and upload completion are separate. Reserved pinned buffers and the staging thread consume resources; no fixed transfer-duration guarantee is supported.
- [DCP 2.14 API](https://docs.pytorch.org/docs/2.14/distributed.checkpoint.html): staged state must be independent of subsequent training mutations. The application must coordinate tensor and progress snapshots before publishing recoverability. Compatibility is not guaranteed across PyTorch versions, including within a major version.
- [DCP 2.14 filesystem implementation](https://github.com/pytorch/pytorch/blob/v2.14.0/torch/distributed/checkpoint/filesystem.py): read_data loads a serialized tensor on CPU before narrowing to the requested logical slice. The loader's local_step reads metadata per rank. Corrected byte-range and destination-only-memory promises without changing the valid coordinate mapping.
- [DeepSpeed Universal guide](https://www.deepspeed.ai/tutorials/universal-checkpointing/): regular ZeRO save, explicit conversion, then Universal load. Target topology and model identities/shapes must remain compatible; supported AutoEP changes have divisibility and metadata requirements. No arbitrary model-family conversion claim.
- [Linux fsync](https://man7.org/linux/man-pages/man2/fsync.2.html): syncing file data alone doesn't ensure its directory entry reached storage. Filesystem publication needs backend-appropriate synchronization.
- [GCS consistency](https://docs.cloud.google.com/storage/docs/consistency) and [request preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions): single-object writes are atomic; multi-object batches aren't. Generation-match updates can protect a recovery pointer against competing writers. Complete shards first, then publish the pointer; validate on load.
- [TorchData StatefulDataLoader](https://meta-pytorch.org/data/main/torchdata.stateful_dataloader.html): default batch-count fast-forwarding can restore simple deterministic iteration; datasets and samplers may provide custom state. Worker state is aggregated, distributed-rank state isn't. Prefetch producer position isn't the consumed training boundary.

Authored run: four data-parallel replicas, microbatch two, accumulation eight, 64 examples per successful update. With no skipped windows, update 1840 corresponds to 117,760 globally consumed examples; this isn't a file offset or row ID. The warning timings are illustrative estimates: 20 seconds remaining computation, 90 through saving/publication, ten margin. The list-based reshard example deliberately gathers centrally and verifies only ranges, gaps, overlaps, and reconstruction.

## Batch, scheduler, and diagnostics

- [DDP 2.14](https://docs.pytorch.org/docs/2.14/generated/torch.nn.parallel.DistributedDataParallel.html): ordinary distributed gradient reduction averages replicas. For a global supervised-token mean over the whole accumulation window, local summed loss needs the corresponding replica factor and global denominator. The new arithmetic exercise contrasts token weighting with equal replica weighting; it doesn't execute distributed communication. An intentionally per-example objective is a different valid choice.
- [Goyal et al.](https://arxiv.org/html/1706.02677): linear SGD scaling with warmup, approximate gradient-stability argument, and ResNet-50 batch 8,192 on 256 GPUs checked. The rule predates this paper; don't credit its invention or transfer its guarantee to AdamW SFT.
- [Malladi et al., revised v3](https://arxiv.org/html/2205.10287): Definition 5.2 changes Adam's learning rate, both moment coefficients, and epsilon together. Theorem 5.3 assumes the stated noise and moment conditions. Removed the unsupported universal 0.5–0.7 exponent and inevitable-divergence claims.
- [McCandlish et al.](https://arxiv.org/html/1812.06162): gradient-noise scale predicts a useful batch scale in studied settings and describes a steps-versus-compute tradeoff, not guaranteed linear wall-clock speedup. Schedule milestones expressed in updates move to later data volumes when tokens per update increase, rather than traversing twice as fast.
- [NVIDIA-SMI](https://docs.nvidia.com/deploy/nvidia-smi/): PERFORMANCE information includes clock event reasons. Removed fabricated clock thresholds, fixed bandwidth-drop consequences, automatic node-eviction advice, and canary detection guarantees. Diagnostics distinguish plausible causes from confirmed faults.

The rollback thresholds, checkpoint distance, quarantine, and seed perturbation were unsupported as a universal harness recipe. Replaced with an evidence-preserving policy: don't publish nonfinite state, diagnose reproducibly, bound retries, and record deliberate changes to the data trajectory.

## Adaptation and memory

- [QLoRA](https://arxiv.org/abs/2305.14314): its reported 65B/48GB experiment isn't a fit guarantee for a different model, backend, sequence length, or device.
- Authored lower bound: 70 billion four-bit values need 35 decimal GB, about 32.6 GiB. The 24/48 GiB usable capacities are hypothetical, not advertised product capacities. Remaining memory must cover all omitted state; the illustration no longer labels the 48 GiB plan as proven to fit.
- BF16 weights plus two FP32 Adam moments for 70B are 140 + 280 + 280 = 700 decimal GB, before additional saved state. Corrected the missing second moment in the old 420 GB claim.
- [Sequence-level distillation](https://aclanthology.org/D16-1139/): author/year metadata, abstract, and relevant introductory PDF passage checked. Teacher-generated sequences are a valid distillation signal; logits aren't universally required.

Validation results are recorded in the manual-review ledger after execution and visual inspection. No multi-GPU recovery drill, cloud preemption, CUDA training, or hardware fault injection was performed locally.
