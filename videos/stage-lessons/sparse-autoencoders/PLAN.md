# Plan: sparse-autoencoders as a narrated film

Status: all 14 scenes are in `index.mjs`. The check of the whole lesson has no finding. No speech and no render were made. See "What is not checked" at the end.

## The central example

One plane of activation space stays at the left of the frame. On it:

- the activation is a dot,
- a feature writes an arrow (coefficient times unit direction), and the arrows add tip to tail,
- a readout is a shadow: the foot of the perpendicular from the dot on a line through the origin.

The film has one rule of picture: **arrows write, shadows read**. The first activation is the one
of the lesson, `[2.3, 0.6] = 1.5 x [1, 0] + 1 x [0.8, 0.6]`, with the dictionary of five unit
columns of `films/sparse-autoencoders/fixtures.mjs` and the code `[1.5, 1, 0, 0, 0]`.

The code is a strip of five bars at the top of the right column: one bar for each column of the
dictionary, with a small arrow under each bar that points as its column does.

Later scenes put other activations on the same plane when the voice says their numbers
(`[1, 0.5]`, `[1, 0.1]`, `[2, 0.04]`), or when the model of the lesson has them (`[1, 0.1]` in
`ablation`, `[0.2, 0.1]` in `steering`, `[1, 1]` in `coverage`). The plane, its scale, the
colors and the rule of picture stay. The first activation is in `intro`, `dictionary`,
`objective`, `shrinkage`, `gated-learning`, the end of `coverage`, and the start of `feature-audit`.

The plane has one place and one size in every scene that shows it. Scene to scene it is handed
over with `c.keep` and `c.take`, from `intro` to `coverage`. `hook-and-circuit` shows a model and
no plane. `training-evidence` and `feature-audit` add the plane again.

## The job of each color

| Color | Job |
|---|---|
| `ink` | The observed activation: the dot `x`, and a known direction of the lab. |
| `blue` | The first feature: its direction, its arrow, its bar. |
| `pink` | The second feature, the one that overlaps: its direction, its arrow, its bar. |
| `cyan` | Another column of the dictionary, and an edit along a column. |
| `green` | The residual: the part of the activation that the code does not explain, and what is recovered. |
| `yellow` | What the voice points at now, and the one result that matters. |
| `red` | A failure or a wrong value: a false activation, a score that falls, a re-encoded value that misses. |
| `dim`, `faint` | A column that is not used, a part that is done, a place where the dot was. |

The names are in `COLOR` of `parts.mjs`.

## What `parts.mjs` holds

- `BOARD`, `SIDE`: the two regions of the frame. The plane is in `BOARD`; the code strip and what a scene adds are in `SIDE`.
- `board()`: the plane (axes with equal units), `P(v)` from plane coordinates to the stage, `foot`, and the makers of marks that follow live values: `arrowOf`, `dotOf`, `ringOf`, `segmentOf`, `shadowOf`, `rulerOf`, `tagOf`.
- `strip(s, region, options)`: the code strip. Five live values, their bars, the glyph of each slot, the share of each bar that a rule keeps, a threshold line.
- `slider(region, value, options)`: a knob on a rail.
- `rebuild(b, read)`: the first example as a rebuild: the two arrows of a live code, the rebuilt ring, the green error.
- `objectiveTerms(z, lambda)`, `decode(z)`: the costs of a code, with the averages that the voice states.
- `residualTest(s, b, band, test)`: the test of the residual that `ablation` and `feature-audit` share: the arrow, the residual, the edited dot, and the gauge with two scales.
- `readoutBars(region, items, max)`: live bars of readouts to one scale.
- `lossRuler(s, region, losses)`: the ruler of losses that `coverage` and `training-evidence` share.

## Scenes

For each scene: the question, what is on screen at the start, what moves, the result.

1. `intro`. Why is one coordinate hard to read? Start: the plane, a mark on axis 1, its reading large at the right. Moves: the reading rises with its cause hidden (the activation is somewhere on a dashed line); then the blue arrow stays and the pink arrow grows from its tip, and under the axis the reading is a blue part that stays and a pink part that grows. An orthogonal pair turns, and both of its arrows get a shadow on axis 1. Then the three steps of the lesson each move the example once. Result: 2.30 = 1.50 + 0.80.
2. `packing-bound`. How many directions fit, and what does overlap cost? Start: the plane with two arrows at a right angle and a third one. Moves: the third arrow sweeps and its two shadows are never both zero; the distance ratios of a sampled map spread on a ruler and stay in the band; a fan of 23 sampled directions stands at its true angles to a probe and closes on the perpendicular as the dimension grows, while the bound falls from 75 to under 0.001; twelve arrows of overlap 0.1 join tip to tail and their shadow on the probe passes the threshold. Result: 12 x 0.1 = 1.2, over 1.
3. `dictionary`. How does a code rebuild the activation? Start: the dot, the five unit columns, the strip empty. Moves: two bars rise; the two arrows take their lengths and join tip to tail on the dot, then in the other order; the dashed encoder rows show, each at a right angle to the column of the other feature, and the bars fill from their readings; tied weights swing the rows on the columns and the bars read 2.3 and 2.2; a tied start lets them swing back. Result: the code `[1.5, 1, 0, 0, 0]`, read and written by different directions.
4. `objective`. What does training reward? Start: the rebuilt example, the strip, the objective. Moves: the second coefficient goes between 1 and 0 as each term pulls; two cost bars show, made of the price of the blue bar, the price of the pink bar and the green error; the slider raises the weight and the bars change places at 2.5; then the code halves, its columns double, the rebuilt point stays, and the unit circle closes the trick. Result: the cheaper code changed.
5. `shrinkage`. What does an L1 penalty do to a coefficient that is right? Start: the example, the cost curve of the second coefficient, a slider at 0. Moves: the slider rises, the curve tilts, its lowest point slides left, the pink arrow shrinks, the rebuilt ring leaves the dot along a green error. Result: the count of active entries is 2 until the coefficient is zero, then 1.
6. `selection`. How does a rule choose the support? Start: the five candidates in the strip, and their arrows tip to tail on the plane. Moves: TopK cuts three bars to outlines; a threshold line rises and cuts by height, and another input keeps one entry under the same line; contexts pass and a tally counts; a rare context wakes slot 5; the residual casts a shadow on the silent columns; a silent column turns to the residual. Result: silent is not dead.
7. `gated-learning`. Where does the penalty press? Start: the rebuilt example and the strip. Moves: a lane of gates shows over the strip; the penalty lowers the gate levels and the magnitude bar and the pink arrow keep their size; an auxiliary rebuild from the gate levels shows; then one pre-activation slides across a JumpReLU threshold and the arrow is absent or whole; the window of the estimator opens and narrows. Result: detection and magnitude are two lanes.
8. `ablation`. What does removing a feature do to a score? Start: the activation `[1, 0.1]`: a blue arrow and a dot. Moves: the residual shows; a gauge with two scales reads coordinate 2 and the score; the blue arrow draws back, the residual rides with the dot, and the gauge does not move; then the residual goes and the gauge falls. Result: 10 unchanged, then 0.
9. `steering`. What else moves with an edit? Start: the dot `[0.2, 0.1]`, the edit formula, a slider. Moves: the dot rises along the column; three rulers show one by one with the shadow of the dot; three bars read them as the edit grows to 1.5; then a dashed encoder ruler reads back twice what the edit asks for. Result: the collateral change is the overlap times the edit.
10. `clamp-and-gradient`. Does a clamp hold after re-encoding, and does a gradient see the feature? Start: the dot `[1, 0.5]` and the column `[0, 1]`. Moves: the lines of equal encoder output show; the dot rises by one, crosses the line of 3 and stops on the line of 4; then at `[1, 0.1]` the latent wiggles two times: with a live residual the green part turns and the dot stands still, with a held residual the dot moves and the score with it. Result: 4, not 3; slope 0, slope 3.
11. `coverage`. What does an exact rebuild leave open? Start: the dot `[1, 1]` as a general arrow and a specific part. Moves: one diagonal arrow takes the place of both; the shadow of the dot on the detector of the general feature is at zero; the ruler of losses keeps the damage and slides the baseline from 6 to 10; then the first example comes back, the first feature leaves, and one shadow moves while a control stays. Result: 90% and 95% for one damage.
12. `hook-and-circuit`. Where does a dictionary attach, and what does a circuit claim? Start: one model of three layers: a stream, with an attention branch and an MLP branch on each layer. Moves: the hook moves between three sites, each with its cloud of values; three contributions stack on a ruler, the first one leaves and comes back, the control leaves; the features of a transcoder write to later MLP outputs; attention freezes, error nodes show, and one edge follows the stream past a stopped MLP output. Result: 1.16, then 0.08.
13. `training-evidence`. What did the lab run show? Start: the plane with the 24 known directions as shadows, and the lab as rows of cells. Moves: each sample lights 2 to 4 known directions, joins their arrows on the plane, and lights about 19 of 64 latents; the error bar falls from 1.426 to 0.128 while the alignment mark stays; a learned arrow turns to the opposite of a known one and its absolute cosine is 1; the ruler of losses gets its numbers and its baseline goes to the clean loss. Result: a better rebuild, and the same alignment.
14. `feature-audit`. When may a label stay? Start: the first example with a label on its blue direction, and a table of checks. Moves: each check lights when the voice names it; the other factor varies alone and the reading of the label moves; then the last test of the residual runs with `[2, 0.04]`. Result: still 2 with the residual kept, and 0 without it.

## Choices that a reviewer must know

- `objective`, `shrinkage` and `gated-learning` use the first activation, not the one-dimensional toy of `model.mjs` (`candidateLoss`, `sparseLoss`, `denseLoss`), so that the example stays. The voice says no number in these scenes. The costs come from `fixtures.mjs` with the averages that the voice states: squared error divided by D = 2, and L1 divided by M = 5. The sparse candidate of `objective` is the code without its second entry. Its error is the whole second arrow, and the voice calls it "a small error".
- `shrinkage` holds the first coefficient and puts the penalty on the second one, whose target is 1, as in `validation.mjs`.
- `ablation`, `steering`, `coverage`, `selection` use the fixtures of the lesson. `ablationState`, `steeringState` and `topKSelectionState` of `construction.mjs` take the times of the old film, so the scenes use them only in assertions.
- `coverage` shows the losses of `training-evidence` (2, 2.4, 6, 10) before the voice says them there. The old film used 2, 2.2 and a baseline from 20 to 2.4.
- Four pictures are illustrations with a fixed seed, and no result of the article: the distance ratios and the fan of `packing-bound`, the clouds of `hook-and-circuit`, and the samples of `training-evidence`. The gate levels of `gated-learning` and the two bars of `feature-audit` (a trained and a randomized model) have no scale and no number.
- In `dictionary`, tied weights make the bars read 2.3 and 2.2. The voice does not say these numbers.
- In `packing-bound`, `dictionary`, `selection` and `training-evidence`, the tick numbers of the plane leave while a mark passes over them, and come back.

## What is not checked

- No speech and no render: the times are estimated at 0.4 seconds a word. A cue with `{ after: true }` or with a typed offset can sit differently on measured speech.
- No person has watched the film in motion. The moves were read as stills inside a few of them.
- The coverage gate of the course and the script reviews did not run. No sentence of the narration changed.
