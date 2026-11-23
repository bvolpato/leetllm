# Plan: inference-data-plane as a narrated film

Status: see the last section. The recipe is `../REBUILD.md`.

## The central example

Request R4219. Prefill makes its prompt KV state: 48 blocks, in 6 segments of 8 blocks, for model M17 rev 5, layout TP2, dtype bf16, blocks paged-v2. The state moves from a prefill worker to a decode worker that has 64 slots. The decode worker reserves 48 slots first, the blocks arrive one segment at a time, the state is committed, and only then the first token comes out.

The example is one board (`handoff()` in `parts.mjs`). It has one place and one size in every scene that shows it:

- At the left, the pool of the prefill worker: 8 columns by 6 rows. One row is one segment.
- At the right, the pool of the decode worker: 8 columns by 8 rows, 64 slots.
- Between them, the link. A block that moves is the same block: it leaves its cell, crosses the link and lands in its slot.
- Under the board, a foot band for what one scene adds: a clock, a strip of steps, a stream of tokens.

Four scenes do not show the board, because they measure the state and do not move it: `kv-state` and `real-payload` (the payload as a slab of tensors, then as blocks, then as bars), `route-compatible` (one source pool and three candidate pools, made of the same cells) and `critical-path` (spans on a clock). The cells, the blocks and the colors are the same there.

## The job of each color

| Color | Job |
|---|---|
| `blue` | The KV state of R4219: a block of its bytes, wherever it is. Also the work that makes it or moves it (prefill, transfer). |
| `green` | Valid for decode: a committed block, a field that matches, an output token. |
| `cyan` | The control plane: a reservation and its lease, the owner, a receipt. A reserved slot is a cyan outline with no fill. |
| `pink` | The other party: request R4220, rank 1 beside rank 0, a queue, traffic of other requests. |
| `yellow` | What the voice points at now, and the one result that matters. |
| `red` | A failure: a mismatch, a timeout, a wrong sum, a late writer, a duplicate. |
| `dim`, `grid` | Quiet text, a free slot, a part that is done. |

## What `parts.mjs` holds

- `COLOR`: the jobs above.
- `FIXTURE`: the names and the counts of the example, from `films/inference-data-plane/fixtures.mjs` and `construction.mjs`.
- `BOARD` and `FOOT`: the two bands of a scene that shows the board.
- `pool(count, options)`: the geometry of a grid of cells with its panel, for a worker of any size.
- `block(...)` and `slot(...)`: the one drawing of a block and of a slot with no bytes.
- `handoff(s, from)`: the board. Its values are `made` (blocks that prefill has made), `reserved` (slots reserved), `sent` (blocks that left, as a number from 0 to 48), `valid` (0 to 1: committed), `gone` (0 to 1: released) and `kept` (0 to 1: the copy that the prefill worker keeps). `from` also takes the order of the segments, a slot for each block, and blocks that a scene draws itself. A scene moves a value and the board follows.
- `cellRow(count, read, options)`: a row of cells that a count fills, for the prompt, the output tokens and the notices.
- `slab(s, region, from)` and `factorRow(factors, options)`: the payload as two tensors, K and V, with one side for each factor of the size formula, and the formula as a row of numbers. `kv-state` and `real-payload` share them.
- `spans(region, rows, options)`: bars on one axis that follow values. `real-payload` and `critical-path` share it.

## The scenes

| # | Scene | The question | On screen at the start | What moves | The result |
|---|---|---|---|---|---|
| 1 | `subject-intro` | Why must state move at all? | The board, empty, and the prompt of R4219 | Prefill reads the prompt and the 48 blocks fill. Slots are reserved, the blocks cross the link by segment, they turn green, and the first token lights | The answer starts only when the last block is valid at the other worker |
| 2 | `collective-contracts` | What combines inside a group, and what moves between groups? | The board with a control lane | Control verbs change the board, then the data moves. Then two ranks: cells 1, 2 and 10, 20 fly to the outputs and add. Rank 1 swaps its layers and the sums go wrong, then right again. A strip of four boundaries moves while the output cells stay hollow until the GPU is done | 11 and 22 on both ranks; 21 and 12 after the swap; four separate boundaries |
| 3 | `kv-state` | How many bytes are in the state? | The slab: K and V sheets of the toy | Each factor lights its side and the running product grows. The token side stretches and the bytes follow | 32,768 bytes, 32 KiB |
| 4 | `real-payload` | How large is it for a real prompt, and what does that cost? | The same slab, with the toy numbers | The sides grow to the production shape. The slab splits into two rank shards, then becomes 512 blocks, plus 8 reserved, plus 1. Bars of the transfer race on a clock for one path, two links and a shared bottleneck. Reservations slide into an 8 GiB pool until one waits | 320 KiB per token, 2.5 GiB, 2,600 MiB, 107.4 ms and 53.7 ms, three fit and 392 MiB stay |
| 5 | `route-compatible` | Which worker can take the state? | The source pool with its 48 blocks, and pools A, B and C with their free slots | The fields of the receipt fly to each worker and match or fail. B goes dim. 36 blocks light in C. Then 48 blocks fly to A and 12 to C against one clock | C wins at 2.8 against 4.2, because less state moves |
| 6 | `trusted-manifest` | Is this the transfer that was authorized? | The board, full at the source, and a manifest beside a reservation | Rows of the manifest match the reservation one by one. Block 31 flies from address 904 to address 118 and keeps its number. Payload and descriptors take two channels. Two writes overlap and corrupt cells | Meaning matches, addresses differ; bytes are not authority |
| 7 | `reserve-and-transfer` | What happens before a block moves? | The board, full at the source, the decode pool free | 48 slots turn cyan. The 24 blocks of R4220 try the 16 free slots and go back to wait. The blocks of R4219 cross, then share the link with other traffic and slow down | 48 reserved, 16 free, R4220 waits; bytes there, not ready yet |
| 8 | `lifecycle-events` | Which event says the request is ready? | The board, and three lanes with seven events | One clock runs. Each event changes the board: reserved, moving, arrived, valid, token, delivered | Arrived is not ready, and generated is not delivered |
| 9 | `uncertain-transfer` | The transfer timed out. What now? | The board with 48 reserved slots and a lease clock | Four segments land, the lease runs out and the commit bounces. Four checks run and one fails. Generation 5 reserves separate slots while a late writer still writes an old cell. The writer stops and the old slots release | 32 of 48, no commit; old slots stay charged until the writer is quiet |
| 10 | `retry-boundaries` | Where can a retry start? | The board, committed, and the token stream to the client | An acknowledgement is lost on the way and the owner asks again. Tokens reach the client; a restart at token one doubles them, a restart at the cursor continues. The source copy drains its own lease. 720 cells of event orders turn green beside four that the model cannot prove | Before visible output: ask the owner. After: continue at the cursor or stop |
| 11 | `critical-path` | What does the user wait for? | Five spans of R4219 on one clock | Prefill and setup overlap. A 25 ms queue grows and pushes transfer and first token, and no span changes its length. Then the spans take the second schedule: 445.4, 375.4 with overlap, 400.4 with a queue | First token at 400, then 425; the union stays 375.4 |
| 12 | `transfer` | Can this receipt commit? | The board, as in scene 1 | The whole run plays one time. Five contracts light at their places. A trace stops at the first bad step. Then a new receipt: six notices, segment 2 two times, segment 5 never. The lease runs out with a writer active | No commit with five unique segments; no reuse until the writer is quiet |

## Status

All 12 scenes are rebuilt and are in `index.mjs`. `node tools/stage-check.mjs inference-data-plane` compiles 12 of 12 scenes and reports no error, no warning and no change of a sentence. No movie was rendered and no speech was made: the timing is the estimate of 0.4 seconds a word.

What differs from the plan above:

- `collective-contracts`: each rank holds its two numbers one over the other, and the outputs are a row. The numbers fly in turns, the farthest place first, so that no number passes over one that has landed.
- `kv-state` and `real-payload`: the sides of the slab have marks and no text. The numbers are in the row of factors under the slab, and a side and its column are yellow at the same time.
- `route-compatible`: a block goes along the row of its cell, along one trunk, and along the row of its slot, so that no block crosses worker B.
- `uncertain-transfer`: the second beat states the rule of release as a strip, and the last beat plays it on the board. The old reservation releases there one time.
- `critical-path`: the length of each span is a column beside its name. It does not move, so the line of the first token never crosses a number.
- `transfer`: the segment that is missing in the last beat leaves last in the first run, so one board serves both.

What to know before a change:

- `lesson.yaml` has new cue declarations for every scene, and no sentence and no hold changed. `/tmp/leetllm-rebuild/inference-data-plane/cues.py` with the files `cues-NN.json` wrote them. That folder is scratch: the cues are in `lesson.yaml` now.
- A part of a `chipRow` cannot arrive alone: `c.show` of one chip brings the whole row. A scene that brings chips one by one makes each chip with `chip()`.
- A `steps` strip that a `go()` brings shows at the start of that play. To bring a strip with `c.show` or `c.swap`, give it `current` at the start and call `go()` only for the next steps.
- Numbers that are not in the model files are constants at the top of their scene, with a comment and a check against the model where one exists: the inputs 1, 2, 10, 20 of the collectives, block 31 with addresses 904 and 118, the schedule 310, 240, 28 and 25 of `critical-path`, and the 8 cases and 720 orders of `retry-boundaries`.
- Not done: no picture is handed from one scene to the next with `c.keep` and `c.take`. Scenes 6 to 10 and 12 all start with the board at one place, so its panels and names fade out and in between them.
