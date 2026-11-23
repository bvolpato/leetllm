# Lesson 007 picture review

The closing example now shows why two readable cached notes can be the wrong pair for another caller. The version, query, scores, tie rule, and result limit stay fixed. Only M1's access changes.

## Delivered cut

I decoded 55 stills at 480 pixels wide from the selected movie, from 00:02.000 through 23:38.000. The samples include the official intro, the first teaching frame at 00:04.000, the main demonstration in each of the 27 teaching chapters, and the closing handoff. FFprobe reported 42,585 frames at 30 fps, a 23:39.500 duration, and 28 chapter markers including the intro. I checked subtitle excerpts to locate spoken events. This was a sampled review of the delivered revision.

Movie `007-ai-data-structures.mp4`, SHA-256 `b16fedeaab39f0d591702d39acf4422e4b499e1864fea051da88cfb61a55a462`.

## Chapter observations

| Chapter | Selected-cut samples (seconds) | Observation |
| --- | --- | --- |
| c01 | 4, 18, 22 | The second $12 charge gives the question a concrete cause. The four note cards remain neutral while the reply waits for M0 and M2. |
| c02 | 47, 62 | M2's reference copies into the larger array and then shifts toward slot 3 while the plan-change note stays fixed. |
| c03 | 83, 115 | The arrow from slot 3 ends at a separate note. The key comparison shows why a list of IDs is rejected and a tuple of integers works. |
| c04 | 155, 185, 207 | Separate marks show nine copies and seven new stores. The drain then uses shrinking rows to connect 21 shifts to the 50,000-job case. |
| c05 | 230 | M1 earns zero in the same scan that opens all four notes. Its read still counts. |
| c06 | 276 | The posting strips share the same ID positions. M3 adds a mark under charged, while twice keeps M0 and M2. |
| c07 | 309, 319, 330, 331, 332, 338, 350 | The shared bucket returns the IDs for the exact word twice. The numeric-key overwrite leaves out M3 during the prediction hold. |
| c08 | 380 | The second occurrence advances the frequency dial to 2 while M0 still occupies one posting position. |
| c09 | 413 | Five posting visits leave M0 and M2 at two points and M3 at one. M1 has no score counter. |
| c10 | 448, 465 | The prediction holds M0 beside the full heap. After M3 leaves, M2 returns to the root as the weaker of the tied winners. |
| c11 | 510, 554 | The left child 5 breaks search-tree order under root 1. A separate repair follows only two of the heap's edges. |
| c12 | 666 | Adding document 3 changes the posting sets and creates a two-point tie that resolves to [2, 3]. |
| c13 | 687 | Five lit posting positions map to three score counters. Repeated IDs add points to existing counters. |
| c14 | 735 | Both containers claim M0. The fixed position marks show that the deque's head moves and the list's surviving references slide. |
| c15 | 765, 769.5, 780, 789 | The ring's physical slots hold M5 and M4 in that order while the head makes the logical order M4 then M5. The synchronized queue gives M3 to worker B and Empty to A. |
| c16 | 831, 863 | The full deque drops M0. The full work queue retains M0 and M2, and M3 remains with the producer as workers claim the accepted jobs. |
| c17 | 882 | The Billing subtree reaches M0, M2, and M3. M1 remains attached to Access. |
| c18 | 923 | The edge back to M0 lights up while the waiting queue stays empty and the discovered set keeps all three visited IDs. |
| c19 | 958, 981 | The adjacency lists count four inspected links, and the matrix allocates sixteen cells. The later picture shows the BST's right turn and the trie's five character steps. |
| c20 | 1016 | Three end markers distinguish charge, charged, and charges. Only charged has a corpus posting. |
| c21 | 1050, 1056, 1082 | Six checks expose intermediate guarantees. The replay writes under M2's original ID and leaves one vector row. |
| c22 | 1112 | Two paths distinguish the cached tuple from the caller's edited list. The stored tuple keeps both IDs. |
| c23 | 1140 | The side-by-side receipts show that checking access after the limit leaves one empty slot, and checking it first recovers M3. |
| c24 | 1183 | The published notes and index share v8. The v7 pair stays M0/M2 and the v8 pair becomes M0/M3. |
| c25 | 1218, 1252, 1276 | The LRU replay evicts twice after a charged hit. A separate replay keeps the v8 key fixed while matching the index version changes the cached pair. |
| c26 | 1318 | M0 and M3 move from the edited corpus into the two reply slots. M2's edited note stays in view. |
| c27 | 1347, 1378, 1400, 1412.5, 1418 | The original cut holds caller A's saved M2/M3 pair and shows caller B's M1/M2 result. Only the footer accounts for M3's third place. |

## Picture changes

In `c27-b02` and `c27-b03`, the global pair, its empty filtered result, and caller A's two readable results follow the ends of their spoken clauses. In `c27-b05`, M1's lock opens after the access clause and caller B's reply stays empty through the prediction. In `c27-b06`, caller A's saved pair stays above the new comparison. M3 moves aside, M2 moves down, and M1 takes first place after the send clause. M3 then moves to third below the reply cutoff after its own clause. The settled ranking holds through `c27-b07`.

`dispatch.mjs` draws the comparison and anchors the affected captions to the start of the spoken clauses. Motion starts at or after each clause's end on the frame clock. `film.mjs` asserts that the complete eligible order for caller B is M1, M2, M3, each with one point. The narration and beat IDs are unchanged.

## Checks

Both changed modules passed Node syntax checks. The active director passed its model checks and built an estimated 43,903-frame timeline. I painted 465 estimated frames across all 93 beats, checked 22 stills at 480 pixels wide, and checked all 600 estimated frames of `c27-b06` for card intersection, frame bounds, and result order. Seven estimated subtitle starts matched the start of their spoken clauses. `git diff --check` passed.

The new picture and captions were checked with estimated word timings. Encoded playback, measured speech alignment, and continuous playback with sound remain unverified.
