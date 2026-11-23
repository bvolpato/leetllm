# Softmax second-writer review

The running example is the dog continuation with scores `[3, 1, 0]` and observed word `slept`. Preserve the narration and the existing board handovers from the opening through temperature.

| Scene | Visual question and change |
| --- | --- |
| intro | Which word happened? Separate the favorite from the observation. |
| scores | What survives a common shift? Keep the score gaps fixed. |
| exponentials | What survives max subtraction? Keep the weight ratio fixed. |
| mass | Who gives up probability when slept gains? Recompute the entire budget. |
| loss | Why does the surprising observation cost more? Move on the log curve. |
| gradient-chain | How does one score change every share? Follow the coupled derivatives, dim the matching factors, and reveal the simplified gradient after its clause. |
| gradient | Which score should rise? Subtract the one-hot target. |
| update | Does the correction help? Carry colored dots through the score crossing and restore names afterward. |
| temperature | Does sharpness change ranking? Preserve the board and distinguish the two controls. |
| transfer | Can the learner correct a new prefix? Keep candidate identities during the crossing. |
| entropy-reference | What remains at a matching soft target? Separate uncertainty and mismatch. |
| squared-vs-ce | Why can a confident error learn slowly? Compare gradients at the same prediction. |
| loss-input-contract | Does a smaller printed loss imply improvement? Keep the prediction board fixed and repair an extra normalizer in a separate loss path with fixed class columns. |
| temperature-limits | Which arithmetic remains valid near the limits? Show unique and tied maxima, huge equal logits, failed all-masked normalization, and teacher and student distributions that share one temperature. |
| smoothing-equilibrium | Can the optimum have a finite gap? Match strictly positive targets. |
| teacher-forcing | Which observed token belongs to each input? Establish the table skeleton first and move dots through the headings. |
| token-reduction | What leaves the denominator? Keep a visible numerator/count construction through pooling and the empty case. |
| class-not-position | Does ignoring a position remove a class? Change candidate support explicitly. |
| weighted-reduction | How can the same predictions report different means? Conserve six units of weighted loss, divide them into six shares or two groups, and expose the threefold difference. |
| vocabulary-tiles | What allocation can fusion avoid? Rescale the prior sum by exp(2 − 4), then merge the incoming sum on the same baseline. |
| earned-transfer | Can the learner repair the denominator? Preserve predictions while correcting the dashboard. |

The recorded narration uses the reviewed script `4453689c0d9f0240`. It gives the update step size, distinguishes a weighted objective from an invalid target, and scopes the empty-denominator result to batched mean cross-entropy.

## Review repairs

| Finding | Result |
| --- | --- |
| 1 | Keep the three factual corrections and bind each cue to the approved recording. |
| 2 | Keep tied maxima in separate columns. Show three equal huge inputs with equal shares, then remove every valid share for an all-masked row. Soften teacher and student from the same live temperature. |
| 3 | Keep the model prediction fixed. Insert and remove the extra normalizer in the loss path. Its internal distribution keeps three class columns and numeric readouts. |
| 4 | Name the raised logit, probability derivative, loss slope, and logit gradient. Include derivative notation above the signed values. |
| 5 | Show exp(z_i/T) during temperature control. Dim the historical training formulas and hide the old gap readout before the learned ranking settles. |
| 6 | Construct the target and competitor derivative products. Dim the matching factors on cancellation and reveal each simplified result after its clause. |
| 7 | Retain four loss rows through pooling and the empty case. Group individual losses or sequence means. Gray the targets and update the numerator and count as each row leaves. |
| 8 | Shrink the prior exponential sum before merging the incoming contribution. Keep the baseline, maximum change, and running sum beside the moving strip. |
| 9 | Raise a dashed positive target on an excluded class while its predicted share stays zero. Remove the finite minimum and reveal infinite loss after the consequence. |
| 10 | Establish two binary prediction rows and dim reduction lanes at the start. Attach weights and move their contributions into the numerator strip. Remove the placeholder frames as the partition strips open. |
| 11 | Use red for malformed targets and yellow for active arithmetic. Preserve the candidate colors. |

## Validation

The whole-lesson motion check passed on the measured recording. Decoded clips cover the weight-ratio reveal, temperature controls, the all-masked row, loss inputs, and both transitions in token reduction. In the ratio clip, the spoken clause ends at 01:15.483. The first visible digit pixels appear at 01:15.600. Both repaired transition clips keep content on the screen throughout.

A complete revised export still needs independent encoded-frame review and full-speed playback with sound.
