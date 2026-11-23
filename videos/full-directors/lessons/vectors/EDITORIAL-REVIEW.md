# Lesson 011 editorial review

I reviewed the narration, all lesson picture modules, the companion article, and 47 decoded stills from the selected movie. FFprobe reported 44,784 frames at 30 fps, 1920 × 1080, 1,492.800 seconds, and 23 teaching chapters after the four-second logo. The stills span frame 60 at 2.000 seconds through frame 44754 at 1491.800 seconds. Frame numbers are zero-based and include the logo. Times are decoded presentation times in seconds, rounded to three decimals.

The SHA-256 of `011-vectors.mp4` is `1d40726cc24fbe9e5393929330ea04cea6fc6dc552d4705108287176d507abbe`. It matches the selected-edition record for source commit `52b806db15d25bc124ea16bc6e478be987eccf97`. The selected-edition subtitle track was checked around c05.

## Selected movie

| Chapter | Frames (seconds) | Observation |
| --- | --- | --- |
| c01 | 120 (4.000), 320 (10.667), 744 (24.800), 1080 (36.000) | The pen moves horizontally while the three dials retain their black reference marks, so the viewer can predict which reading stays fixed. |
| c02 | 2280 (76.000) | Swapping reset’s entries moves its endpoint from the horizontal axis to the vertical axis while the vector still has two entries. |
| c03 | 3765 (125.500) | The blue and ochre unit-input directions trace the first and third outputs, while the coefficient table preserves the omitted middle output. |
| c04 | 4755 (158.500), 5178 (172.600), 5265 (175.500) | The ochre half-vector slides from the origin to the blue tip without changing length, and the endpoint reads [0.5, 0.5, 0.5]. |
| c05 | 5568 (185.600), 5715 (190.500), 5814 (193.800), 5831 (194.367), 6045 (201.500) | The delivered blue quarter was already on the ruler, but the ochre quarter grew in place during the instruction to slide it. |
| c06 | 8220 (274.000) | The three-step path through the second map and the two-step path through the product end at the same point, [1, 1]. |
| c07 | 9690 (323.000) | The highlighted password row crosses the same matrix as reset and my, preserving all three token positions while widening each row. |
| c08 | 10785 (359.500), 11445 (381.500), 12090 (403.000) | The selector finds H[1, 2, 0], then the projection keeps each token address and the larger example retains four prompt strips. |
| c09 | 13620 (454.000) | The changed password row gains 1 in x and 0.5 in average, while its y value and the other five rows hold still. |
| c10 | 15210 (507.000), 15405 (513.500) | The loss slopes produce steps of 0.4 and 0.2, then separate rulers show the weights moving from 2 to 1.6 and 1.8. |
| c11 | 17580 (586.000) | The swapped request still fills both slots, but the fixed multipliers turn its two contributions into 2 seconds each. |
| c12 | 19530 (651.000) | The same predictions 2, 5 and 7 end in a single column when the weights gain a singleton axis. |
| c13 | 20520 (684.000) | Request B stays highlighted while the selected coefficients switch to priority and the computation yields 1.9 beside its 5-second result. |
| c14 | 21450 (715.000), 22710 (757.000) | The three-feature map has no matching load measurement, and the later three copied rows show how a two-axis matrix can have rank one. |
| c15 | 24540 (818.000) | Vertical and horizontal offset arrows give B the same priority, while its time differs between 5.1 and 4.9 seconds. |
| c16 | 26460 (882.000), 28080 (936.000) | Editing password changes both reset-password intersections and the password self-score, while my-password stays at 0.5. |
| c17 | 28761 (958.700), 29160 (972.000), 29430 (981.000), 29925 (997.500) | Doubling the arrow doubles its horizontal shadow, while rotation changes the cosine and shrinking to zero makes it undefined. |
| c18 | 31890 (1063.000), 33210 (1107.000) | The wrong right operand comes from prompt 1 and gives 0.75, while swapping only token and feature axes preserves prompt 0’s 0.5 self-score. |
| c19 | 35040 (1168.000) | Moving password ahead of reset and my leaves all three one-half shares at the same endpoints. |
| c20 | 36240 (1208.000), 36900 (1230.000) | Two zero-padding rows leave both sums at 1 but halve the ordinary mean, and the boolean mask selects only the two real rows. |
| c21 | 39270 (1309.000) | The checklist admits the valid batch, then the known-value probe shows the edited password pair projecting to [1.5, 0.5, 1]. |
| c22 | 40590 (1353.000) | The weight table has one row per output, and the projected prompt shows the same three bias values added at every token position. |
| c23 | 42180 (1406.000), 42900 (1430.000), 43095 (1436.500), 44070 (1469.000), 44754 (1491.800) | Counting the real zero token leaves the projected rows and totals fixed, while the mean moves from [1, 2/3, 5/6] to [3/4, 1/2, 5/8]. |

## Picture change

In c05-b01 and c05-b02, the input coordinates and the average-column coefficients now line up by feature. The first product draws a fixed blue quarter. The second product appears as a full ochre quarter above the same ruler. It slides to the blue endpoint and drops into place without changing length. The `average = 0.5` label appears beside the joined endpoint after the spoken result clause. This carries the tip-to-tail addition from c04 into one dimension. The final beat of c05 keeps the joined result in view while explaining all three columns.

The picture change is in `coordinates.mjs` (SHA-256 `027fa0d4cf23b80da8f86aa28f2987020d30533433e29a60da71a7a596ed125c`). The narration has SHA-256 `571cf23a3bc3c7d1ebfd3f3f220013cf1d673ab00e5f8bcfc9f18ed7d96d29aa`.

## Validation

- Node syntax and the full director model and timeline checks passed. The estimated timeline has 47,953 body frames across 23 chapters and 95 beats.
- The production Canvas painter drew the first, middle, and last estimated frames of every beat. A geometry check across all 1,575 estimated c05 frames verified both quarter widths, the fixed blue origin, the slide and join, label bounds and clearance from the bars, and the timed product and result labels. Both selected caption break phrases resolved on the estimated timeline.
- I inspected nine 480 × 270 Canvas samples around the c05 cue boundaries and during the slide and join. The preceding export was sampled without sound. Revised preview cues used estimated words because a retained speech cache was unavailable to this run. Encoded playback and revised subtitle timing remain for the full render.
