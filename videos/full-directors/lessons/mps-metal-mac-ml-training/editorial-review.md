# Lesson 006 picture review

The selected MP4 contains 43,023 H.264 frames at 1920 × 1080 and 30 fps. Its duration is 1,434.100 seconds. I used its chapter markers and English subtitle track to select 68 decoded stills at 480 × 270. The table lists seek times in seconds from the start of the movie. The logo, opening picture, and closing hold were sampled at 2.000, 4.030, and 1,433.900 seconds.

Baseline MP4 SHA-256 `6f64a902e295cc45ce2f0d5d4409862cbb7e9bf44c0b58c691959a9e0798ac77`. Active narration SHA-256 `f6b65f22dff663be5aed1a97b2f6f2a5e85ca75ce79afefc1d47061a2b51f59a`. The movie and active source were reviewed as separate editions.

| Chapter | Seek times (s) | Observation |
| --- | --- | --- |
| c01 | 18.900, 35.033 | The CPU mean produces a row. The red barrier appears where it meets MPS weights at the linear layer. |
| c02 | 61.033, 74.867 | The dispatch path separates Python, PyTorch's `mps` backend, MPS operations, and Metal. Both positive probes select MPS. |
| c03 | 100.433, 104.567, 136.067 | The version cards distinguish the two release examples. The probe matrix separates a wheel problem from unavailable runtime access. |
| c04 | 160.400, 165.767, 179.100 | The discrete GPU copy lands in VRAM. The Mac picture puts both device tags inside one DRAM box. |
| c05 | 193.000, 202.167, 223.167, 225.800 | Two 2 KiB allocations stay in place while assigning the return value moves the `batch` pointer from CPU to MPS. |
| c06 | 261.000, 263.967, 274.500 | The parameter's actual device guides placement for features and labels. The core-group diagram reports one PyTorch device. |
| c07 | 318.867, 322.300 | A highlighted column supplies eight terms. Dividing 1.168 by eight yields 0.146 and removes the positions axis. |
| c08 | 349.967, 355.333 | The Billing score accumulates signed products from the bias. Two zero weights leave flat steps. |
| c09 | 373.133, 386.667 | Login barely leads the probability bars. The loss uses Billing's probability because Billing is the label. |
| c10 | 411.800, 427.867 | Four rows display first-pass and rerun losses, but their arrows encode direction alone. The viewer must subtract to compare sizes. |
| c11 | 465.500, 475.333, 500.800 | The gradient appears while the weight retains its old value. The update changes it, and the run record separates execution evidence from held-out quality. |
| c12 | 512.867, 524.833 | A missing MPS kernel blocks U. The ticket follows the lower CPU path when the fallback is available. |
| c13 | 566.833, 575.267 | A common ruler places the two B endpoints at 9 and 15 ms. The six-ms gap includes the slower U and both crossings. |
| c14 | 613.067, 637.067 | The float64 pair fails during placement. The float32 path accepts the features while the labels stay `torch.long`. |
| c15 | 667.333, 701.033, 706.100 | The first midpoint maps left. The second midpoint holds between ticks before mapping right to the even significand. |
| c16 | 775.100, 804.667 | The 93% candidate lands outside the fixed band. The 95% candidate sits on its lower edge for the replay question. |
| c17 | 826.633, 839.100, 852.433 | The first-pass readout freezes at 3 ms while a full-height cursor keeps moving. The replay ends at 38 ms. |
| c18 | 880.367, 891.500 | Three warmups sit outside START. The ten-product bracket ends at the final wait before division by ten. |
| c19 | 950.300, 980.167 | The signpost lines up with kernel one. The replay puts a GPU idle gap below the host log while preserving kernel widths. |
| c20 | 1007.500, 1018.467 | Doubling matrix width grows the arithmetic eightfold. The modeled winner changes while the launch segment stays fixed. |
| c21 | 1051.700, 1056.200 | Half the ticket tiles go away. The float32 input drops from 12 to 6 MiB with positions and features unchanged. |
| c22 | 1086.767, 1105.367, 1114.333 | Releasing cache leaves 32 MiB allocated, but the projected peak reaches 56 MiB. Half the batch brings the peak to 38 MiB under the same limit. |
| c23 | 1148.800, 1199.333, 1211.867, 1233.533, 1245.300 | The working-set ratio gives 10.2 GiB. Shortening both attention axes leaves 16 pairs, and four score slots are reused while the accumulators persist. |
| c24 | 1265.100, 1273.433 | The opening classifier succeeds with matching device tags. The payoff shows three logits and the four-ticket loss change. |
| c25 | 1303.433, 1354.167, 1361.000, 1376.700, 1415.933 | Discarding the copy leaves `batch` on CPU. Later the CPU correction leaves Billing in place until re-placement lets Login win. |

In `classifier.mjs`, c10-b02 keeps the four ticket rows and their before-and-after values. On “Compare the sizes,” the weight panel gives way to four signed loss changes on one scale. The drops extend left and the increases extend right. The settled values come from the unrounded rerun and first-pass losses. The mean still lands at the end of the spoken explanation, from 1.1097 to 1.0975.

In `instruments.mjs`, c17-b01 holds the stop marker on the Python lane at 3 ms while the GPU frontier moves. In c17-b02, the same ruler shows a `synchronize()` span above the growing GPU bar. The 38 ms reading and shared stop marker arrive after the completion phrase ends. The film retains its modeled 3 ms dispatch plus 35 ms execution. The companion article uses 35 ms as the completion timestamp in its own example.

Updated `classifier.mjs` SHA-256 `e6dcb1d80555146683812feeb8d492ed2e562464d03000701cb5153eb50206a9`. Updated `instruments.mjs` SHA-256 `f1b79da1550eef78ff6d8087634fefc93c12b2f05c67a2c0fd9817bea7a1eee6`.

Node syntax checks passed for both modules. The requested full director check passed and estimated 43,852 body frames. I inspected phone-width stills at cue boundaries and during movement. An estimated-timing Canvas check verified result labels and horizontal text bounds across 648 c10-b02 frames and 1,149 c17-b01 and c17-b02 frames. The scoped diff passed `git diff --check`. I did not check continuous playback, measured word timing in a new export, or subtitle layout on the revised pictures.
