# Lesson 014 picture review

The sampled cut showed the 95% reverse conditional at 04:01.500. The embedded subtitle for the spoken answer begins at 04:11.772. In the previous source, the window opened its second side before the first had closed. The revised window keeps the 95 abusive flags fixed and changes which other counts belong in the denominator. The opening now shows the detector punching the audit card. The staffing example ends with a fixed capacity line and a separately shaded overflow.

## Baseline

Reviewed the archived `014-probability.mp4`. Its SHA-256 is `1c320287facc2b64cbd13827518c435d8fa2907d2feb3d7d875677c17df71ec9`. FFprobe reported 46,642 frames at 30 fps, 1920 × 1080, and a duration of 1554.733 seconds. All 21 teaching chapter markers match the active narration order. The movie may be from an adjacent source revision.

Reviewed 46 decoded stills at 480 × 270, including the logo at 00:03 and all chapter samples below. Times are absolute seconds from the start of the movie. The embedded subtitle track supplied timing evidence for the sampled passages. The companion article and the lesson's narration, model, and Canvas source supplied the mathematical and editorial references.

| Chapter | Seconds sampled | Observation |
| --- | --- | --- |
| c01 | 4, 13, 28, 35, 43 | The audit card starts fully punched. The 95 red flags wait alone during the prediction, then 495 blue flags dominate the finished queue. |
| c02 | 78 | One red bundle among 100 equal bundles makes the 100 of 10,000 prior count visible. |
| c03 | 134 | The label 1 is 0.99 units from the mean and dominates the weighted variance strip despite occurring only 1% of the time. |
| c04 | 176 | The two source cards keep their denominators in view while the common scale shows the 495 clean flags outweighing the 95 abusive flags. |
| c05 | 226, 241.5, 252 | The same 95 remains in the selected column and row. The reverse view already shows 95% at 241.5 seconds, before the spoken answer. |
| c06 | 287 | The joint and marginal fractions share a denominator of 10,000. The Bayes expansion preserves the same 95 of 590 on the right. |
| c07 | 320, 340 | At the 10% prior, abusive flags grow to 950 and clean flags shrink to 450 with both detector rates fixed. |
| c08 | 372 | Selecting one of five pieces per class gives 20 abusive and 1,980 clean flags, preserving the 1% mix. |
| c09 | 427, 455 | Matching serials identify the same signup. Separate conditionally independent tests show 24.75 expected clean double flags. |
| c10 | 515, 546, 579 | The empty event gives an undefined fraction. The binary64 number line and rescaled masses distinguish a positive event whose product rounded to zero. |
| c11 | 635, 655 | The fixed abuse, clean, abuse sequence peaks at a candidate rate of two thirds. Equal prior weights on 0.2 and 0.8 become 20% and 80%. |
| c12 | 705, 745 | The same ruler separates a mean score of 80% from 50% observed abuse. The later constant 1% scores tie. |
| c13 | 777, 808, 825 | One batch shows a count of 1 and an expected count of 0.1. Later pictures distinguish Poisson mass at zero from area under a continuous curve. |
| c14 | 864, 896, 901 | Shifted logits preserve the shares. The second cursor lands on None, and the following tally records one result and one None. |
| c15 | 988, 1015 | The long sequence's stored product is zero while its log probability is finite. The short sequence's three losses yield perplexity of about 4.64. |
| c16 | 1078, 1100 | The fourth bar and confident model's mean are withheld during the question. The revealed 6.908-nat bar lifts its mean to 1.734. |
| c17 | 1203 | The simulated 200-case pass rates cluster around the fixed 80% line, with a standard error of about 0.028. |
| c18 | 1238, 1266, 1280 | The independent gap interval crosses zero. The paired grid leaves three new-only wins and one old-only win in focus. The planning view shows 3,200 cases per model. |
| c19 | 1357 | The strict queue fits 179 reviews under the 200-slot line and leaves 20 abusive signups outside review. |
| c20 | 1421 | One possible match restores A081 to A095, keeps the 99 clean flags, and leaves six slots free with 194 reviews. |
| c21 | 1468, 1493, 1505, 1521, 1553 | The same 480 abusive flags appear in both queues. In the second queue, the added clean flags match the rest of the strip on both sides of the 900-slot line. |

## Picture changes

- `audit.mjs`, c01-b01 to c01-b03. The post-logo card starts with one punch and fills over 1.7 seconds, leaving five open red circles. The 95 of 100 readout, the clean count, the total, and the one-in-six answer follow their spoken clauses.
- `audit.mjs`, c05-b01 to c05-b04. The window first selects the flagged column. On reversal, it retracts the clean half and holds the shared 95 in place as it expands to include the five misses. The fraction keeps the same numerator position and reveals each denominator and percentage after its own clause.
- `decisions.mjs`, c21-b02 to c21-b06. The fixed 900-slot line connects two queue strips at the same scale. The new strip starts with the same 480 abusive and 388 clean flags. After the answer clauses, 32 of the 97 extra clean flags fill the spare space, then the remaining 65 extend beyond the line in a hatched segment. The settled picture shows 965 expected reviews.
- `press.mjs`. The lesson's painter now supports an answer reveal after the last measured word of a phrase and a caption boundary at its first word.

## Validation

Node syntax checks passed for the three changed modules. Loading the active full director and building its estimated timeline passed with 48,280 body frames, 21 chapters, and 92 beats. The Canvas checks sampled 460 beat positions and checked 15 answer cues on the frames immediately before and after each completed phrase. They also checked 516 consecutive reversal frames and all 477 frames in the staffing reveal beat for the anchored numerator, fixed abusive count, and incremental clean counts. Estimated subtitles generated successfully, with the checked answer captions anchored to their clauses. Thirteen 480 × 270 Canvas stills covered the hook, reversal, and staffing states. Text bounds stayed above the caption region in the checked scenes.

This review used sampled pictures and the baseline subtitle timing. The revised stills used estimated word timing. The coordinator will generate the next export for measured timing and playback review.
