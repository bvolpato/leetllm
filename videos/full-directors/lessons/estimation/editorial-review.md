# Lesson 016 editorial review

I reviewed all 13 chapters against the active narration, Canvas source, and companion article. The supplied `016-estimation.mp4` is 1,198.300 seconds long and contains 35,949 video frames at 30 fps. Its SHA-256 is `afa8b97b87e31f156fb55c37e013b230018c99c1d4d364f7b32afec4d63acdf8`, which differs from the selected-edition index. The times below refer to this supplied file. I decoded 34 stills at 480 pixels wide, including the brand animation at 2.000 seconds and the first teaching picture at 4.100 seconds.

| Chapter | Movie stills in seconds | Observation |
| --- | --- | --- |
| c01 | 17.5, 45.5 | The dot moves from 20% after five messages to 16% after 100, while the interval still crosses the same staffing line. |
| c02 | 90, 123 | A counted batch yields one point, and the 400-label cloud gathers more tightly around the fixed 16% line. |
| c03 | 161, 194 | The 20% candidate predicts 20 cases against 16 observed, and the 1.96 cutoff projects the accepted range onto the rate ruler. |
| c04 | 212, 248 | Identical 4-of-25 trays hold the dot at 16% as the interval contracts and its midpoint approaches the dot. |
| c05 | 299, 329, 373 | Wald stays at zero while the Wilson cap drops from 27.8% to 16.1%, and two of 24 simulated intervals miss the fixed line. |
| c06 | 408, 450, 481 | Routine-only sampling leaves two lanes blank, and weighting the three known contributions gives 176 of 1,000 for the whole queue. |
| c07 | 501, 510.4, 532, 538 | Two imprints preserve one source ID, but the first histogram bin appears without tracing 17/100 into it. The all-zero resamples stay at zero. |
| c08 | 620, 664 | The prior moves the peak much farther with five labels, while the separate held-out interval still spans its 20% forecast. |
| c09 | 766, 830 | The denominator changes from 80 resolved cases to all 100 selected cases, and a separate paired review counts three matches out of four. |
| c10 | 901, 940 | Whole-campaign draws have the wider spread, and swapping one campaign takes the count from 20 to 30. |
| c11 | 987, 1015 | Routine-only estimates tighten around 12%, away from the 17.6% queue target. A separate posterior locates the mean to the right of the mode. |
| c12 | 1079, 1115 | The sealed row supports 15% to 40% for the whole tray, while 9 of 45 resolved cases gives 20%. |
| c13 | 1148, 1153, 1164, 1195 | The magnifier exposes 19.91% before the staffing question. The final capacity strip shows the payoff of 2,000 places open. |

## Changes

In `audit.mjs`, c07-b02 carries the computed 17% from the resample tally into its histogram bin. At arrival, the plotted count advances from zero to one. The highlighted first entry holds until the repetitions begin, and the source tray still represents 100 original labels.

In `decisions.mjs` and `narration.json`, c13-b02 and c13-b03 hold the 16% estimate, the old interval, and the 20% limit while the viewer works out which side the new cap must land on. In c13-b04, the new whisker, connector, and 19.91% label appear after the endpoint phrase ends. The tighter magnifier makes the gap readable at phone width. The shift choice follows on the report cue, and c13-b05 adds the random selection and independent review notes. Two narration beats change and all chapter and beat IDs stay stable.

## Validation

Node syntax checks passed for both changed modules. The required full-director load and estimated timeline ran the model checks and returned 36,412 body frames across 13 chapters and 70 beats. A Canvas state trace exercised the picture callbacks across that estimated timeline. It verified the bootstrap count at arrival and after 400 deposits, the absence of answer geometry through the staffing question, the first endpoint frame, and the later staffing stamp. The generated preview subtitle starts its numerical answer at the onset of the endpoint phrase.

I inspected eight 480-pixel Canvas samples from the estimated timeline, including adjacent body frames 35,130 and 35,131 around the cap reveal. The baseline review used decoded stills and subtitle timecodes. The revised timings and captions still need verification against measured speech and the coordinator's export.
