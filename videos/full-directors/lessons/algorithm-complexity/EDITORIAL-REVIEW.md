# Lesson 009 editorial review

Reviewed the narration, Canvas implementation, companion article, and the selected `009-algorithm-complexity.mp4`. The MP4 contains 44,232 video frames at 30 fps and runs for 1,474.400 seconds, including the four-second course introduction. Its SHA-256 is `d6c7b4c886add074571ddbee7e3626449476ca77b42fbf2497edcac01074c9fb`. The unchanged narration has SHA-256 `067c1f4fb1edd8ac710b0ace9fdb0b781e284cf978cfd1fa09318021e619cef5`.

Decoded 67 stills at 480 × 270 and checked their presentation timestamps. Times below are seconds from the start of the MP4. The zero-based frame index is the time multiplied by 30.

| Chapter | Sample times (s) | Observation |
| --- | --- | --- |
| Intro | 2 | The LeetLLM ident precedes the hard cut to card A at 4 seconds. |
| c01 | 4, 22, 46 | The word reader marks login and test on A, then shows four visits, including two zero-hit cards. |
| c02 | 66, 76, 116, 134, 147 | The copied cards increase the visit count to eight. In the merge, E beats B for the second slot because E has two hits and B has one. |
| c03 | 191, 230, 238, 266 | The one-slot replay holds at three midpoint checks until slot zero is read. In the first lookup, the midpoint highlight and range update share a state. |
| c04 | 283, 302, 312 | The key lands in bucket 6, the forced collision case walks four stored keys, and the character trace accumulates 1,222 before taking the remainder. |
| c05 | 335, 354, 390, 409 | Twelve repeated letter checks give way to one child lookup and three checks on a shared radix edge. The token trace splits on its fourth ID. |
| c06 | 426, 435, 459 | The free fourth slot holds through the question. The eight occupied slots finish with eight arrival writes and six copies. |
| c07 | 505, 525, 546 | Zero-valued products grow the work counter while the sum stays fixed. Doubling both dimensions changes 12 products to 48. |
| c08 | 572, 584, 611, 629, 632, 634, 690 | The weaker winner sets the cutoff. The second repair trial displays zero swaps during the question at 629 seconds. |
| c09 | 742, 751, 774, 823, 846 | The triangle grows from 6 to 10 to 28 pairs. The distance trace reuses one sum, then the exact-string pass tracks first occurrences. |
| c10 | 885, 916, 938, 945, 951, 959, 963, 965, 991 | The prefill grid becomes causal. At 945 seconds the decode picture still shows ten keys as the answer caption says eleven. At 951 it already shows all thirty reads. |
| c11 | 1040, 1056, 1069, 1080 | Separate key and value planes give 128 KiB per token. The longer context takes raw cache storage from 2 GiB to 8 GiB and score area to 16 times its original size. |
| c12 | 1115, 1135, 1150, 1174 | The batch releases at 10 ms and the executor starts at 30 ms. Later pictures show worker overlap and the unreachable two-object cycle. |
| c13 | 1205, 1224, 1237, 1253, 1273 | Project and reader checks leave three rows in the small case. Removing a citation slot in the large case leaves the over-budget scoring rectangle intact. |
| c14 | 1325, 1344, 1380, 1401, 1428, 1458, 1473 | C and A form the reference. The third context read raises recall from 1/2 to 2/2. The fourth adds no hit, and the closing ruler moves the prediction from 6 s to 5.2 s against the measured 5 s. |

## Changes

- `scoring.mjs` keeps the 0.25 root and both child scores visible through c08-b05. In c08-b06, zero swaps appears after the answer clause, then a ring identifies the 0.30 child after the explanation. The first repair trial still moves down its two-swap path.
- `decoder.mjs` keeps the two finished rows visible through c10-b06. In c10-b07, the append adds key 11 and the third query row before the read sweep. A rectangle groups the three rows of eight starting-key reads. Counts beside the green cells identify the steps of one, two, and three. The subtotals appear after their spoken clauses, and c10-b08 completes the expression as 24 + 6 = 30 after the spoken total.
- `press.mjs` uses the Canvas word cue and frame clock for clause-end reveals. `film.mjs` checks both subtotals against the decode calculation.

## Checks

Node syntax checks passed on all four changed modules. The active director loaded, its model assertions passed, and the estimated timeline contained 46,739 body frames. A direct Canvas command check exercised all 14 chapters at 955 sampled frame and cue positions. Checks around the changed cue boundaries verified the hidden heap result, the weaker-child ring, the third row, each green step, and the two subtotals and total. Generated caption anchors were checked on the estimated timeline. Twelve revised 480 × 270 Canvas samples were inspected in memory.

The MP4 review sampled frames and extracted the existing subtitles. The revised picture and subtitle timing checks used estimated words. Continuous playback, retained provider word timing, and the next encoded export remain unverified.
