# Lesson 010 editorial review

Reviewed the active narration and Canvas source, both editions of the companion article, and the delivered `010-gradients-backprop.mp4`. FFprobe reported 55,975 H.264 frames at 1920 × 1080 and 30 fps. The movie runs for 1,865.833 seconds and has a four-second opener and 28 teaching chapters. The movie SHA-256 was `dad71ddc355a4c78e4232f1a180e4abd4664c653a71107cf0091c51aee6b3b30`.

## Chapter samples

Inspected 68 decoded stills, including opener samples at 0 and 2 seconds. Times below are seconds from the start of the delivered movie. The samples cover the first and last video frames and each teaching chapter. The movie can be an adjacent revision of the active source.

| Chapter | Sample times (s) | Observation |
| --- | --- | --- |
| c01 | 4, 4.2, 14, 28, 34, 49 | Two 100-token spans share a weight. The first nudge moves the join by 0.1 s and the tip by 0.2 s against the fixed 5 s mark. |
| c02 | 81 | The 2 s miss forms a square with four unit cells, which makes the quadratic penalty visible. |
| c03 | 120, 148 | Weight 2.25 gives 0.25 s² on the parabola. With two weights, the two marked settings lie on the same zero-loss line. |
| c04 | 173 | The enlarged interval shows loss rising from 1 to 1.004004 after a +0.001 change in weight. |
| c05 | 213, 224 | As the secant gap shrinks, its slope moves from 4.16 toward 4 while the denominator stays positive. |
| c06 | 256, 265 | The horizontal prompt component 4 and vertical queue component 2 assemble into one gradient arrow. |
| c07 | 305 | The uphill gradient crosses the contours at a right angle. A scaled step in the reverse direction reaches loss 0.04. |
| c08 | 340 | Rate 0.1 moves the weight from 3 to 2.6 and reduces squared loss to 0.04. |
| c09 | 365, 375, 403 | Rate 1 crosses the minimum and lands at weight −1 and loss 49. Rate 1/8 lands at the minimum. |
| c10 | 441, 475 | Rate 0.26 sends successive offsets farther from zero. Counting raw tokens preserves the 6 s prediction while changing the gradient to 400. |
| c11 | 521 | The two forward branches produce 4 s and 2 s, then the graph combines them into prediction 6, error 1, and loss 1. |
| c12 | 527, 543.5, 545, 558, 566 | Both branches are gray near the end of the spoken split at 543.5 s. Their traces begin with the later individual weight rules. |
| c13 | 573, 630 | The screw drops below the shoulder, but the pointer stops at 2 s. The prompt gradient becomes zero even as loss rises to 9. |
| c14 | 685, 688, 699 | The centered secant is near −6 across the kink. Moving right from the corner lowers loss from 9 to 6.25. |
| c15 | 761 | The prompt contribution 4 and queue contribution 2 return to the same stored weight and add to 6. |
| c16 | 850, 873, 901, 955 | Batch loss falls quickly and then slowly. Equal-length weight changes cross different numbers of contours and give different losses. |
| c17 | 991 | The forward sum stays at 6 while the reverse pass sends 12 to all six weights through addition. |
| c18 | 1063 | The seed [−1, 1] makes the two queue contributions cancel while the prompt-weight sensitivity ends at 2. |
| c19 | 1124, 1138 | The Float64 centered ratio reads near 4. The same requested spacing in Float32 gives about 3.814697. |
| c20 | 1208 | Restoring the square's factor of two makes the proposed backward slopes meet both centered checks. |
| c21 | 1260, 1263 | The same incoming gradient [4, 2] leaves [4, 2] in the cleared buffer and [8, 4] in the retained buffer. |
| c22 | 1289, 1305, 1315 | The in-place write creates a version mismatch. Writing to a new tensor preserves the sigmoid output and its backward path. |
| c23 | 1342, 1361, 1376 | The expanded view points to one slot. The clone has three slots and still contributes three copies of 2 to the gradient at x. |
| c24 | 1418, 1465, 1478 | Two bends change the slope of the forward curve. The single-unit graph then routes a gradient to each of four parameters. |
| c25 | 1565 | Both rates cross the same 5 s target. Rate 0.025 lands closer to the target than the shared 4.5 s start. |
| c26 | 1608, 1636, 1647, 1658 | The identity path carries a unit signal beside the learned branch. A later panel shows the forward activation that backward needs. |
| c27 | 1680, 1696, 1727 | The three-block exercise begins with its answer fields covered. The fitted weights later predict 5.5 s on the held-out 4 s request. |
| c28 | 1755, 1806, 1835, 1864, 1865.8 | The replay keeps the one-block request, target and rate fixed. The fresh gradient misses by 0.0325 s and the copied one misses by 0.23 s. |

## Picture edit

In `routes.mjs`, c12-b01 uses the same graph as the forward pass and draws the returning trace from loss through square and subtraction. The seed 1 and the sensitivities of 2 appear after their spoken clauses. In c12-b02, the green trace splits on the addition cue and arrives as the same 2 on both branches. The individual weight rules then show how the saved features 2 and 1 turn that shared signal into gradients 4 and 2. The last beat retraces the prompt path alone and assembles `1 × 2 × 1 × 2 = 4`. Each result uses its clause-end timing, and caption breaks start when the voice reaches the result phrase. The narration and beat identities are unchanged.

## Checks

- `node --check` passed for `routes.mjs`. The requested full-director load and timeline check printed `Gradients and Backprop 60015`.
- Ran all 60,015 estimated body frames through the drawing code with a recording Canvas stub. Checked both sides of five result boundaries, the branch split before, during and after motion, the replay reset, and three generated SRT cue starts.
- Inspected four final Canvas stills at 480 × 270, covering the split in motion, the two arrivals, the settled gradients and the replay result. The stills and checks used estimated word timing. The delivered MP4 was sampled without audio. Measured timing and encoded playback of the edit require the coordinator's render.
