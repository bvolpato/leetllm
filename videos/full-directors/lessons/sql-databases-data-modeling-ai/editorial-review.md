# Lesson 008 picture review

The selected movie, `008-sql-databases-data-modeling-ai.mp4`, matched the edition index SHA-256 `ad8a6a91fc70ea395e7a6a98399c1acb558a693c96f018e83303e259debbc20c`. The lesson directory matched the indexed source commit `75de3f7fb3493282aa8b021a6fd655bd894b524a` before the edit. FFprobe reported 62,285 video frames at 30 fps and a container duration of 2,076.167 seconds. I inspected 46 decoded stills at 480 × 270 from every chapter, the official opening at frame 60 (2.000 s), and the final frame at 62,284 (2,076.133 s). The table gives zero-based movie frames and times rounded to milliseconds.

| Chapter | Frames (seconds) | Observation |
| --- | --- | --- |
| c01 | 120 (4.000), 165 (5.500), 493 (16.433), 1061 (35.367) | The coat stays on August 12 as the tape traces back to July 25 and compares the day-14 and day-30 endpoints. |
| c02 | 2528 (84.267) | The new connection reads the same c7a → d7 link from the persistent SQLite file. |
| c03 | 4631 (154.367) | The c7a → d7 → w01 chain gives the missing-parent rejection a visible reference. |
| c04 | 7963 (265.433) | Adding NOT NULL rejects the missing score while the positive score still passes and zero still fails. |
| c05 | 9966 (332.200) | The escaped document ID pattern occupies its own slot below the fixed LIKE statement. |
| c06 | 11592 (386.400) | The escaped pattern matches the printed code and its uppercase copy while skipping the lookalike with X. |
| c07 | 13030 (434.333) | The matching d7 key puts the return-policy title on the c7b receipt citation. |
| c08 | 13821 (460.700) | Both end fields pass IS NULL, but the future edition still fails the start test. |
| c09 | 15760 (525.333), 15819 (527.300) | The July 1 cursor meets the old open endpoint and the new filled endpoint, and d7 remains in force as the cursor advances. |
| c10 | 17107 (570.233) | The July 10 cursor crosses both the proposed interval and the July edition despite their distinct start dates. |
| c11 | 19569 (652.300) | The grant, workspace, and time checks leave c7a and c7b on the answer tickets. |
| c12 | 21279 (709.300) | The fixed staff-guide row c9a returns for bypass roles and stays out for the application role. |
| c13 | 23329 (777.633) | The draft retains one joined row with a NULL child, so COUNT(chunk.id) gives zero and COUNT(*) gives one. |
| c14 | 24392 (813.067) | Only d7 clears HAVING after WHERE removes the old edition and GROUP BY leaves counts of two and one. |
| c15 | 26057 (868.567) | Rollback puts the four grants, two chunks, and one document back on the dependency chain. |
| c16 | 28910 (963.667) | The same duplicate leaves one saved K when caught inside the block and zero when caught outside. |
| c17 | 30733 (1024.433), 31543 (1051.433) | The first reader keeps two July paragraphs through rollback and commit while the fresh reader opens three August paragraphs. |
| c18 | 33707 (1123.567), 33735 (1124.500) | The writer goes from no active row to a staged five-day rule while the other connection still reads seven days. |
| c19 | 35703 (1190.100), 36333 (1211.100), 36923 (1230.767), 37470 (1249.000) | The books display 3/4/4 and 3/3/3, but the viewer must infer which snapshot each statement used. |
| c20 | 38445 (1281.500) | The identical fingerprint reuses the retained publication while the document and chunk totals stay fixed. |
| c21 | 41372 (1379.067) | The retry with the same remote key gives the worker the service's existing job 42. |
| c22 | 43450 (1448.333) | Bob's four grants sit together in the index and only c7a and c7b pass the remaining checks. |
| c23 | 44874 (1495.800), 46587 (1552.900) | The plan retains its sort after the covering lookup, and the rollback restores the title while the email remains. |
| c24 | 48470 (1615.667), 49354 (1645.133) | The unit-circle projection gives c99 the highest cosine, but Birch's paragraph still fails the Harbor filter. |
| c25 | 51456 (1715.200), 54832 (1827.733) | The rotated query scores c7e about 0.949, and the later scan shares only c7d with the exact top two. |
| c26 | 55861 (1862.033), 59095 (1969.833) | Overwriting emb-17 makes the old score impossible to recompute from its original coordinates, and changing labels moves the separate Hit@1 report from one to zero. |
| c27 | 60172 (2005.733) | The slip cites c7c / d7-next and the ruler shows the coat four days beyond the 14-day limit. |
| c28 | 60786 (2026.200), 61416 (2047.200), 61893 (2063.100), 62219 (2073.967), 62284 (2076.133) | The deadline stays blank after the date change, then fills with ten days once Bob's grant for c80 appears. |

## Picture change

In c19-b01 through c19-b04, `reading-room.mjs` keeps the pre-commit and post-commit views of the August 12 corpus above one statement timeline. The first count stays at three. A pointer follows the detail query to the post-commit view under Read Committed and to the pre-commit view on the Repeatable Read replay. It traces both choices again for the third count. The clothing-tags slot shows where c7e enters, and the full post-commit row set and the four-row result appear after the spoken answer. The two result rows preserve each statement's source and count side by side.

`counter-model.mjs` supplies one snapshot per statement so its pointer, source label, and count come from the same row set. The model checks the row identities across the commit and both count sequences. The article's section “Atomicity doesn't choose what concurrent readers see” gives the same statement-versus-transaction distinction. The narration and beat identities are preserved.

## Validation

Both edited JavaScript modules passed `node --check`. The requested `loadFullFilm`, `estimateTakes`, and `buildTimeline` command passed all model assertions and returned 62,868 estimated body frames. The c19 checks examined frames on both sides of seven cue boundaries and verified the answer caption break using estimated word timing. I inspected nine phone-width Canvas stills with the production painter, covering the question hold, commit, arrow movement, and settled results. `git diff --check` passed.

The edited file SHA-256 hashes are `c74a19f38a29d5902c2c182e62baef55c93fddd361df11f4a8aeb0a28771eb58` for `reading-room.mjs` and `2384010932cdd19de70d8c608014c8cebca9f69455405d202483a75e078de14e` for `counter-model.mjs`. The narration SHA-256 is `d9a42a73295412036fc37477929113526ed8bdfc611f80dfa90caffa67cd0be9`.

The baseline review used sampled frames and subtitle timestamps. Continuous playback with sound and measured cue checks on an edited export remain outside this review. The coordinator owns the edited export.
