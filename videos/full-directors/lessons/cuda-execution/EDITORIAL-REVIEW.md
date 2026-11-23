# Lesson 005 editorial review

The selected `005-cuda-execution.mp4` matches the SHA-256 in the selected-edition index. Its source commit is `8e43386982e0ff0880b190f346237acbe8e3329c`. FFprobe reports 1,920 × 1,080 H.264 at 30 fps, 60,346 video frames, and 2,011.533 seconds. The chapter markers cover the four-second brand opening and 24 teaching chapters.

FFmpeg decoded 64 sampled stills at 480 × 270. The review covers the brand at 2 seconds, the first teaching frame at 4 seconds, demonstrations in all chapters, and the last frame at 2,011.500 seconds. The table lists absolute movie times. I read the embedded subtitle text for cue context and reviewed the narration, Canvas modules, and both editions of the companion article.

## Selected movie by chapter

| Chapter | Sample times (seconds) | Observation |
| --- | --- | --- |
| c01 | 4, 22, 40, 49 | The short hand stops at 2 ms while the ticket stays blank, then 2.625 appears after the scalar returns. |
| c02 | 59, 71 | Token 6 stays at value 1 while the copy makes it visible in both host memory and device global memory. |
| c03 | 131, 159 | The Python environment can report no CUDA build even when the driver sees the card, and physical GPU 3 becomes cuda:0 inside the process. |
| c04 | 220, 233 | The four labels move from the CPU to cuda:0, then select one logit per row without changing either shape. |
| c05 | 288, 297, 317 | The split places token 6 in block 1, thread 2, and the ten-token replay shows two guarded workers past the row. |
| c06 | 348, 369 | Threads 31 and 32 land in different warp rows, and masking later dims odd lanes in place. |
| c07 | 388, 422 | The same eight lanes go from one aligned segment to eight, using 32 useful bytes out of a 256-byte segment footprint. |
| c08 | 474, 489 | Padding spreads distinct words to separate banks, while the broadcast routes eight reads for word 0 into one service round. |
| c09 | 570, 573, 583, 614 | Shifting a contiguous warp from byte 0 to 28 adds a fifth segment, while stride 34 sends two distinct words to each even bank. |
| c10 | 633, 655 | The early probe reaches incomplete shared memory, while the replay waits for four arrivals and reads a subtotal of 10. |
| c11 | 709, 734 | The recap shows a 40 ms stream interval and separates the 14 ms warmup from two completed 8 ms samples. |
| c12 | 760, 770 | Four 4-byte Adam slots yield a 16-byte per-parameter floor, which the scale-up expresses as 14.90 GiB for a billion parameters. |
| c13 | 838, 842, 857 | Both batches begin with 256 scores, then dropping examples leaves 128 while shortening both axes leaves 64. |
| c14 | 931, 998 | The FP32 dot moves while FP16 stays at one, and the later ruler marks the 65,520 overflow tie. |
| c15 | 1051, 1144, 1195, 1224 | The 24 GB line is crossed by weights and gradients alone, and the ticket replay shows why the divisor comes from the full batch and why zero total weight skips the update. |
| c16 | 1252, 1308 | Loss scaling preserves the tiny gradient in FP16, while reduced TF32 multiply inputs change the output value with FP32 storage still shown. |
| c17 | 1362, 1386 | Releasing the two cached blocks leaves 8 GiB allocated and 9 GiB driver-visible, and GPU activity later changes while those counters hold. |
| c18 | 1416, 1434, 1444, 1455, 1472 | Batch B is copied by 6 ms while A still owns the compute lane, and overlapping B's copy with A's kernel cuts completion from 20 to 17 ms. |
| c19 | 1535, 1547 | The fixed-work point reaches 100 GFLOP/s and then moves horizontally along the compute ceiling as traffic falls. |
| c20 | 1604, 1628 | Doubling shared memory per block drops occupancy to 25%, while the larger tile still serves two passes from eight global loads. |
| c21 | 1702, 1710 | Packed addresses route the same lane values into one aligned segment, and both the packed and reference sums read 21. |
| c22 | 1783, 1818 | Delaying the same scalar read reduces time inside item() from 40 to 10 ms while both runs still finish at 42 ms. |
| c23 | 1857, 1886 | The gold input zero counts in the divisor, the gray guard zeros do not, and the long FP32 spelling formats to 2.7. |
| c24 | 1933, 1947, 1978, 1983, 2009, 2011.5 | The final reduction shows 13 source reads, 16 barrier arrivals, and subtotals of 21 and 14 before the ticket logs 2.6923 and 20 ms. |

## Closing exercise revision

The closing exercise in `ticket.mjs` gave both clocks one dial and placed their timestamps in a footer. The viewer had to reconstruct what each pair meant. The revised picture in c24-b04 through c24-b07 keeps one scale for two rows and uses the same ticket throughout. It separates the return of the CUDA tensor at 6 ms, the stream event at 23 ms, and the scalar arrival at 24 ms. A moving dot carries the scalar from the stream to the host, where `2.6923` appears on the ticket.

The prediction holds both sets of endpoints on screen with the caller time field blank. The host bracket grows from 4 to 24 while the subtraction is spoken. The stream bracket grows from 5 to 23 while its endpoints are spoken. Each equation appears after its spoken clause. Only the resulting host interval of 20 ms enters the ticket. The CUDA stream interval of 18 ms stays beside its own bracket. The durations come from the existing model and match the article's timing quiz.

## Checks

- `node --check` passed for `ticket.mjs`. The required full-director command ran the model assertions and produced 63,070 estimated body frames. All 63,070 estimated Canvas states resolved their cues in a dry draw.
- Adjacent estimated frames kept the 6 ms return, 23 ms event end, scalar arrival, both equations, and the final ticket time behind their intended cue boundaries. The estimated subtitle for the stream answer starts at the first spoken word of that answer.
- Seven native Canvas samples at 480 × 270 covered the return, event end, moving scalar, prediction, host answer, both answers, and printed ticket. Eighteen opening and recap samples matched the pre-edit Canvas pixels. The scoped diff and `git diff --check` were reviewed.

The picture review used sampled stills and estimated word timings for the revision. Continuous playback, sound, measured speech alignment, and the next encoded export remain unverified.
