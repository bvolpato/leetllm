# Lesson 012 editorial review

The selected movie, `012-linear-algebra.mp4`, matches the indexed SHA-256 `57ceba41ae0abff5b491dbb0aaa58e882b68e82a0d93cbf980257801b33926f1` for source commit `4db99b556b4644dff36cb6fca213ca2089a0edc5`. FFprobe reported 41,136 video frames at 30 fps, a duration of 1,371.2 seconds, AAC audio, and an English subtitle track. The review used the narration, Canvas source, both article editions, subtitle timestamps, and 54 decoded stills. The official introduction sample is at 2.0 seconds. The table lists the teaching samples in seconds from the start of the movie. FFmpeg confirmed each timestamp, with zero-based frame numbers equal to the sample time multiplied by 30.

| Chapter | Sample times (s) | Observation |
| --- | --- | --- |
| c01 | 4.1, 14.3, 23.7, 28.1 | The cut opens on a stationary blank ticket. The blue and pink holes differ, but both readings eventually occupy the same tick. |
| c02 | 50.3, 68.3 | Each ticket becomes a point in feature order. Looking up ID 1 retrieves the existing rollback row `[0, 1]`. |
| c03 | 115.1, 126.3, 133.6 | The common and contrast steps build `[3, 1]`. Removing contrast leaves the right-angle foot at `[2, 2]`. |
| c04 | 169.3 | The common score rails show why the joint ticket contributes two of the three units of squared output length. |
| c05 | 183.1, 188.0, 203.8 | The single-issue scores straddle zero. The joint row waits until the answer to show its zero mark. |
| c06 | 232.8, 250.9 | Reversing the column order keeps one shared row. The final Gram matrix places that same count in both off-diagonal cells. |
| c07 | 277.2 | The open circles preserve the unit tips while the common arrow triples and the contrast arrow keeps its length. |
| c08 | 303.9 | The green input tip reaches common and contrast coordinates `[0.707, −0.707]` after the tracing rotates. |
| c09 | 318.7 | The tracing stretches horizontally to an ellipse. The green tip moves to `[1.225, −0.707]`. |
| c10 | 359.1 | The middle output visibly returns to zero when the contrast track cancels the common half. |
| c11 | 379.3 | The common pair shows reversed signs while the three output readings remain `[1, 0, 1]`. |
| c12 | 415.5, 435.2 | Both single-issue tickets land at the same point and rebuild the same row. The four half-unit misses give Frobenius error 1. |
| c13 | 467.8, 478.5, 510.9 | Three tied cosines leave the result slots open. Ticket order puts rollback second, and the later grid shows six query-ticket scores. |
| c14 | 540.0 | The ghost triangle makes it possible to see that subtracting the mean moves all three points without changing their spacing. |
| c15 | 599.0, 620.7 | The signed products `1/6` and `−1/6` cancel. Contrast has squared spread 1, compared with `1/3` along common. |
| c16 | 654.2 | The centered rows differ by `[1, 1]`, so both project to the same point on the fitted contrast ruler. |
| c17 | 698.9 | The sparse grid holds six entries. Subtracting the mean gives the formerly empty cells negative values and raises the count to 36. |
| c18 | 734.7, 757.0, 781.5 | The joint prediction stays hidden during the question. The fitted point leaves three misses of magnitude `1/3`. |
| c19 | 807.0 | The two copied tracks have identical pulses and move the reachable prediction along the same line. |
| c20 | 835.9 | The first and third tickets share 1.5, halfway between their two targets. The second prediction stays at zero. |
| c21 | 855.8, 910.7 | Opposite gain changes leave the summed pulse fixed. Delaying the second track exposes separate crests at 0.25 and 1.25 V. |
| c22 | 935.9 | The fixed horizontal tip and compressed vertical tip distinguish the two scales that give condition number 100. |
| c23 | 954.1 | The open rings keep the clean values in view as a 0.001 output error becomes a 0.1 input error. |
| c24 | 1013.9, 1040.1, 1055.1 | On the normal-equation route, the coefficient rises from 0.0008 to 0.0012 and the right-hand remainder falls from 0.00162 to 0.00138. The direct weights stay fixed. |
| c25 | 1100.0, 1115.2 | The squares contribute 36, 9, and 1 units of energy. The first two move the retained total past 95%, leaving error 1. |
| c26 | 1143.9, 1150.1, 1188.9 | The rotating input changes the sign of a scalar while the output stays on one line. The width-eight factors show the parameter cost of a wider update. |
| c27 | 1274.4 | Returning to the common ruler separates `[0, 0]` from `[4, 4]` so the counter can recover totals 0 and 8. |
| c28 | 1314.0, 1335.7, 1340.0, 1361.0, 1370.9 | Billing and the joint ticket both score zero, then the cut replaces the contrast column with weighted codes. The final frame loses the evidence that made the new code necessary. |

The article uses document features in place of ticket flags and chooses the opposite sign for the contrast direction. It gives the same Gram matrix, strengths, common projection, and rank-one loss. Its examples for rounding and LoRA use different inputs.

## Picture changes

In `tickets.mjs`, the blue ticket slides in during the first 0.8 seconds of c01-b01. The counter holds the blue reading and its tick position through the prediction in c01-b02. On “One again” in c01-b03, the pink mark joins the blue mark over the same tick.

In `dispatch.mjs`, c28-b03 leaves the billing and joint destinations open. In c28-b04, a bracket joins their zero contrast scores. As the narration names the weights, `×1` and `×2` appear directly over the corresponding flag columns. The original scores stay in place while the weighted codes and their destinations appear. In c28-b05, the binary column shows `00` beside Billing and `11` beside Both teams. The final note asks viewers to check whether cases that require different actions get different codes. The position parameter in `studio.mjs` raises the notes in the two edited chapters to make room for a two-line caption.

## Verification

The three changed JavaScript modules passed Node syntax checks. The required full-director command ran the model assertions and built an estimated timeline of 42,627 body frames over 77 beats. A Canvas command scan resolved the cues across that timeline. The targeted checks confirmed the two opener marks share a tick, both closing contrast scores stay zero, the weighted routes wait for their answer cues, and the final decimal codes, bits, and destinations agree. Estimated subtitles had positive duration and did not overlap. Thirteen source stills at 480 × 270 were inspected with an estimated caption overlay, including motion, prediction, and answer states. The final two-line caption cleared the closing note in the sampled layout. The narration and its chapter and beat identities match the selected source.

| Edited source | SHA-256 |
| --- | --- |
| `tickets.mjs` | `72f71f8ba94345bb880077dbec0c2b74ab9668ad164c8c72a74ce2676ff2bef3` |
| `dispatch.mjs` | `5ca234d86157bc1651f9e4fa4e114dcb7b53e323758cbb8c37725d1b2525fffd` |
| `studio.mjs` | `dc1ff1a085747af2c954ae3b45a5e2dd233a6e8f860b13f23b1c754e05fa31a8` |

The delivered movie review was limited to sampled frames and subtitle timing. The edited source stills use estimated narration timing and a simulated caption position. A full render and continuous playback with sound remain for delivery review.
