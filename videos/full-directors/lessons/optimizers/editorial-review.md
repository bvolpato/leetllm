# Lesson 013 editorial review

Reviewed the selected `013-optimizers.mp4` against the active narration, Canvas source, and companion article. The movie SHA-256 is `eb12c56d06843e1104729e1b148bbf4d38be63a07f54fe0f6634afa3f21b6ff9`. FFprobe reported 59,981 video frames at 30 fps and a duration of 1,999.367 seconds. The 44 decoded stills cover the logo, the first teaching frame at 4 seconds, the main demonstrations in all 23 chapters, and the final video frame at 1,999.333 seconds. The embedded subtitles guided sample selection.

| Chapter | Movie samples in seconds | Observation |
| --- | --- | --- |
| c01 | 4, 13.5, 15, 21 | Both carriages start at 1 on matching scales. The blue carriage crosses zero while the green carriage barely leaves its starting ring. |
| c02 | 50, 94 | The second steep-coordinate step reverses when its slope changes from 100 to −80. The shallow coordinate keeps moving toward zero. |
| c03 | 132, 150 | The same zero line makes shrinking crossings at rate 0.018 and growing crossings at rate 0.021 directly comparable. |
| c04 | 189 | The fifth-step collar sits left of zero even though the freshly computed descent points right. |
| c05 | 255, 302 | The signed buffer stays positive after −80. The library buffer at input four is ten times larger and uses one tenth of the rate for the same move. |
| c06 | 339, 358 | The first RMSProp rulers withhold the subtraction, then align at 0.03162 even though the gradients are 100 and 1. |
| c07 | 462 | After three zero-rate Adam updates, the raw buffers fill while the corrected estimates stay at 100 and 10,000 and the weight holds. |
| c08 | 498 | Both fresh Adam carriages land near 0.92 because each corrected numerator has its own divisor. |
| c09 | 535, 592, 673 | The −80 input drops the signed memory to 1 while raising the square memory to 16.39. Later rulers expose unequal step sizes and the effect of cold-start correction. |
| c10 | 752 | Both rails add −80, but the upper display reaches −71 while the lower retained amount is still open for prediction. |
| c11 | 819 | Forty-update traces and endpoint readings show that the three recipes leave different shallow errors. |
| c12 | 837, 888 | Update one advances the moments at zero rate. The last-five comparison shows less late travel under cosine decay and higher final loss in this valley. |
| c13 | 947, 963 | Moving the divider from half to one third restores equal item widths and changes the accumulated gradient. |
| c14 | 1043, 1074 | The 300-by-400 outlier shrinks along the same direction to 3 by 4. The raw and clipped inputs leave very different Adam moments despite nearly equal first steps. |
| c15 | 1144 | The ring at 1 gives the reference for computing the separate shrink of 0.008 after the data endpoint appears at 0.92. |
| c16 | 1243 | Cold AdamW moves the zero-gradient tensor's weight to 9.99 and leaves the parameter with `grad=None` at 10. |
| c17 | 1350 | The two AMP attempts keep the schedule column open while showing that the Adam counter advances only on the completed attempt. |
| c18 | 1424 | The full restore retraces the original through count six. The weights-only branch ends lower with count three. |
| c19 | 1499 | Four device cards each show a 7 GB shard of each moment array for 14 GB per device. |
| c20 | 1574, 1619 | The final error bars expose SGD's remaining shallow error. In the next construction, the square buffer falls while the AMSGrad maximum stays at 8. |
| c21 | 1660, 1670, 1697 | The higher peak leads on training loss at update 12. The separate held-out comparison favors SGD despite its higher training loss. |
| c22 | 1809 | All three rails move right from −0.5. Only the plain-descent carriage crosses zero. |
| c23 | 1854, 1942, 1955, 1971, 1986, 1999.333 | The two gradients reach the same stop. The baseline shows the common saved weight as text without showing it develop from the shared input. |

In `practice.mjs`, c23-b09 now moves both gradients to the same −3 stop and joins their paths into one AdamW step. A separate weight ruler keeps the starting value at 2 in view and reveals the model's 2.048 endpoint after the spoken result. In c23-b10 and c23-b11, the pre-clipping marks at −4 and −10/3 stay visible beside that endpoint. The replay highlights those marks as the narration returns to the evidence that distinguishes the two reductions. The arithmetic follows the five-item fixture and the article's accumulation, clipping, and decoupled decay rules.

Node syntax and `git diff --check` passed. The active film loaded and its model checks passed. The estimated timeline contains 63,354 body frames. Silent Canvas validation sampled the start, middle, and end of all 121 beats and inspected 11 extra states at 480 pixels wide. The focused checks verified the saved-value and logging reveals, subtitle cue breaks, and text clearance above the caption area. Timing checks used estimated word events. The review sampled the delivered movie and did not include continuous playback with sound or a new encode.
