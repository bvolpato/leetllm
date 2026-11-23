# Multimodal LLM architecture: manual source notes

Reviewed September 23, 2026. Read all 1,263 original article lines, metadata, eleven CPU cells, ten questions, twenty-two reference records, all 106 generated research lines, ten native sources (374 lines), 44-line banner source, and three-line banner note manually. Replaced the generated packet with these notes. No authoring/review script or delegated article pass was used.

## Two different zero limits

[MPnP's published paper](https://sites.pitt.edu/~weigao/publications/mobicom25_mpnp.pdf): relevant design, multi-level encoder, aligner, weighting/Equation 2, adaptation-cost, backbone/device, and evaluation selections read. Its inserted modality K/V pairs join text K/V in one attention module; this isn't Flamingo's separate cross-attention residual. The paper's paragraph after Equation 2 overstates the zero-weight limit: zeroed values still have positions in the shared denominator unless masked or removed. The article now states the narrower, mathematically supported distinction.

Added a literal one-dimensional calculation to the existing attention cell: text key logit 0/value 2 returns 2 alone, but an unmasked zero key/value makes both weights 0.5 and returns 1. Removing the extra position returns the original fixture output. Assertions and a question expose the effect. This follows the displayed attention equation; no MPnP implementation or trained model was run. Flamingo's zero residual gate leaves its separate base path unchanged.

Kept MPnP's intermediate-feature/last-decoder-block choices and scoped runtime-training discussion. The studied OPT/BLOOMZ backbones, Orin adaptation, RGB/LiDAR and VQA workloads don't establish universal production inference savings. Didn't copy the generated packet's “deeper connectors now preferred” prescription.

## Chronology and representation interfaces

The incident example previously explained time uncertainty without working through it. Added a manually chosen event-order fixture: deploy 14:02 ±15 seconds; chart rise 14:03 ±90 seconds gives overlapping bounds and unresolved order. A separately justified ±10-second rise interval establishes “after.” Touching inclusive intervals don't establish strict order. A new question distinguishes these outcomes from utterance time and causation. Bounds assume resolved event identities and one UTC clock/date; the helper doesn't infer evidence, synchronize clocks, or prove causation.

[Qwen2.5-VL report](https://arxiv.org/pdf/2502.13923): relevant input resize/14px patch, four-patch merger, dynamic FPS/MRoPE, and training-stage selections read. Added the distinction between video-time position spacing and external recording-to-UTC/event mapping. Kept this published architecture example rather than presenting it as the latest dashboard-quality ranking or a provider billing formula.

[Mind the Gap](https://arxiv.org/abs/2203.02053): complete abstract/metadata checked. Added the original contrastive-learning definition: geometric separation of image/text representations within a shared space, associated with initialization/optimization/temperature. Repaired the article and checkpoint that conflated this with any image-to-decoder interface mismatch. A nonzero geometric gap alone doesn't prove poor grounding. Added the paper citation.

Added explicit modality directions to complete the metadata's any-to-any scope. Consuming images/audio and generating cited text doesn't imply image/waveform output support; input connectors aren't output decoders. Relaxed the encoder-from-scratch advice to admit architecture/objective choices, not only poor domain overlap.

## Historical recipes and source boundaries

- [PaLI](https://arxiv.org/pdf/2209.06794): relevant training selections confirm frozen vision during initial pretraining and all-parameter updates in the largest model's high-resolution continuation. Joint scaling doesn't specify a universal freeze schedule.
- [LLaVA-1.5](https://arxiv.org/pdf/2310.03744): relevant data/configuration/training-cost selections confirm 558K/665K examples, 336px input, and about 6+20 hours on eight A100s. Original LLaVA's 595K/158K counts, teacher provenance, linear/MLP distinction, BLIP-2 query bottleneck, and Flamingo's separate visual bank reuse the immediately preceding manual review's primary selections.
- [Whisper publisher page](https://proceedings.mlr.press/v202/radford23a.html) and [paper](https://arxiv.org/pdf/2212.04356): publisher metadata/abstract and relevant spectrogram/stem/relative-timestamp selections checked. Corrected citation title and ICML 2023 publication year/venue while retaining the historical key/arXiv URL. The lesson's hypothetical 100-Hz grouping isn't asserted to be Whisper encoder output or API billing.
- [CLAP](https://arxiv.org/abs/2206.04769), [TimeSformer](https://arxiv.org/abs/2102.05095), and [VideoMAE](https://arxiv.org/abs/2203.12602): complete abstracts/metadata checked. Contrastive audio retrieval isn't timestamped transcription; temporal attention isn't necessarily sequence reduction.
- [Meta's Llama 4 announcement](https://ai.meta.com/blog/llama-4-multimodal-intelligence/): relevant indexed primary early-fusion/MetaCLIP/frozen-Llama and MoE selections checked. [OpenAI's original GPT-4o announcement](https://openai.com/index/hello-gpt-4o/): relevant modality and single-network training statements checked after finding no local provider runtime. These remain dated architecture disclosures, not current API support guarantees.
- Gemini's 2023 report abstract and Google's December 2023 [training explanation](https://blog.google/innovation-and-ai/technology/ai/google-gemini-ai/) support pretraining on different modalities from the start. The arXiv PDF fetch failed and the official PDF exceeded the web parser's size limit; the full PDF was not reviewed. The preceding manual reviews' CLIP/SigLIP, DPO, Switch/PagedAttention, prefix-cache, OWASP, and dataset mechanisms retain their original scope.

## Removed packet and validation scope

Removed the generated packet's mislabeled cross-attention-as-late-fusion, universal audio/video token rates, unrestricted ceiling patch rule, blended provider/model billing table, mandatory gateway resize/frame/query settings, asserted five-turn visual-KV eviction, and automatic human-identification/security-feed design. Compression cost/quality and commercial API rates need the selected implementation's contract; they aren't fixed by accepting a modality.

Removed eighteen repeated setup paragraphs by hand. Scoped the pooled-score late-fusion example and clarified that extra reasoning can combine partial evidence or request a tool when that route exists, while decoding alone doesn't restore a missing chart label.

Read the local BarChart primitive and found its fixed four-pixel minimum inflated the 256-token bar on the shared 36,000-token axis. Increased this chart's plot height so even that smallest value exceeds the minimum and all bars retain their numeric proportions. The larger chart still uses one shared axis.

Kept the full 5,380/2,660 token ledgers, separate upload/decoded-resource limits, cache stages, 340-MiB logical visual-KV difference, crop coverage, transcript/raw-audio choice, partial-answer gate, authorization on hits, and perception-versus-behavior evaluation. Counts, scores, time bounds, and targets are illustrative. No provider/checkpoint call, timestamp extractor, MPnP implementation, learned-vector experiment, clock-synchronization system, GPU/serving benchmark, live cache/index change, or deployment was performed. Relevant source selections were read, not every full paper or entire upstream project.
