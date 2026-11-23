# Plan: agent-orchestration as a narrated film

The final contract pass targets script hash `39725d7d3fff645a`. Its current evidence and exact changed beats are in `script-repair.json`. The earlier review entries below describe their own candidates.

All 11 scenes use the same release board. The pilot review covers the script, the scene handovers, the rendered frames and short motion excerpts.

## The central example

Release r17 of tenant7, revision 3, a request for 25% of traffic. It is one board that stays on screen:

- **The request** (bottom left): a ticket with `release-17`, `tenant7`, `r17`, `v3`, `25%`.
- **The read phase** (top, left to right): triage, then three checks (eval, health, policy). Each check has a lane. A receipt card (`tenant7  v3  10 s`: tenant, revision, age) travels on its lane.
- **The barrier** (between the lanes and the packet): one gate and one lamp for each lane. It is the gate of time: it opens when the receipts are ready.
- **The packet** (top right): one slot for each check. The join reads the three fields of each card. A field that it read is green or red. A slot takes its card or refuses it. When all three slots took a card, the packet seals and shows the evidence digest of the model.
- **The effect path** (down the right side): the proposal token (`v3 25% #aa65`) goes to the dock of approval, gets a stamp, goes to the dock of the one writer, and the writer compares it with the live revision of the target. The gauge of the target then fills to the 25% mark.
- **The band** (bottom middle): the instrument of the scene: a clock readout, a table, the channels of the shared state, a checkpoint.

The board uses the release fixtures, schedule, writer results and digest function from `films/agent-orchestration`. The final eval comparison in `validated-join` uses the article’s second observation of one regression in the same hundred cases.

## The job of each color

| Color | Job |
|---|---|
| `cyan`, `pink`, `blue` | The three checks: eval, health, policy. A node, its lane, its card, its slot name, its bar on the clock. |
| `green` | A value that the join accepted, a sealed packet, a stamped token, the applied traffic. |
| `yellow` | What the voice points at now, and the one result of a scene. |
| `red` | A wrong value, a refused card, a write that must not happen. |
| `ink`, `dim` | The request, triage, approval, the writer. A part that waits or is done is dim. |

## What `parts.mjs` holds

- The regions of the frame: `LEFT`, `RIGHT`, `READ`, `BAND`, `TICKET`, `CORNER`.
- `board(s)`: builds the board. It returns the values (`card[i].pos`, `.shown`, `.tenant`, `.rev`, `.age`, `.read`, `.verdict`, `gate[i].open`, `.lamp`, `packet.seal`, `.rev`, `token.pos`, `.stamp`, `.refused`, `target.live`, `.traffic`, `hot.*`), the nodes, `standing` (the part that goes from scene to scene with `c.keep` and `c.take`), `leftSide` and `rightSide` (the two halves of `standing`), `moving` (cards, verdicts, seal, token: they leave with a scene), `enter(c)`, `leave(c)` and `rest()`.
- `STATE.rest` starts the v3 example. `STATE.applied` carries the v4 target at 25% traffic from the writer into the conversation example.
- `receiptCard(...)`: one card at a place, for a copy of a card (a saved card, a duplicate).
- `clock(...)`: bars on the lanes to one time scale, with one clock value and an axis. Scenes 3, 5, 10 and 11 use it.
- `channels(...)`: the two kinds of state channel (a list with an add reducer, a scalar). Scenes 4 and 5 use it.
- `TENANT`, `OTHER_TENANT`, `AGE`, `FRESH_SECONDS`, `DIGEST`: the numbers of the fixture and of the model, as the board writes them.

## The scenes

One line each: the question, what is on screen at the start, what moves, the result.

1. **subject-intro**. How do three reads become one safe decision? Start: the whole board, at rest, and the request as one line in the band. Moves: the three cards travel at three speeds, the gates open, the cards enter their slots; a red path from a worker to the target is drawn and cut; the join reads the fields, the packet seals, the token goes through approval to the writer and the gauge fills to 25%. Last beat: three work cases stay together in the band. Independent research fans out and reunites, ETL bars grow together, and one agent extends a shared editing trace. Result: the whole route in 50 seconds, and when extra agents earn their cost.
2. **dependency-graph**. When may a node run? Start: the board at rest. Moves: a pulse runs triage, then the three checks; the cards arrive in the order policy, eval, health, each lights its lamp, and the gates open only at the third; the kind of each node arrives in its lane (code, database read, model); three rules of the validator light as the join reads each field; the token waits at approval (a pause), a retry turns inside the health node, and a rejected review sends the token back to the packet: a cycle. A strip of states in the band follows the token. Result: the read phase is a DAG, the control flow around it is a state machine.
3. **parallel-clock**. How long does the read phase wait? Start: the board, with a time axis under the lanes. Moves: three bars of 2 s, 3 s and 1 s. In serial order they stand as a staircase and the wall time reads 6 s. They slide left to one start, and the wall time falls to 3 s while the read work stays 6 s. A cursor then runs: lamps light at 1 s, 2 s and 3 s, the waiting of the two early receipts is drawn, the merge step adds 0.5 s, and the readout says 3.5 s. Last beat: four unnamed overheads push the bars and the wall time grows. Result: parallel waiting is the longest branch plus the merge.
4. **typed-receipts**. What may a worker write? Start: the board, and one receipt enlarged in the band as a row of typed fields. Moves: the identity of the request goes to the three checks and lands on each card; each card goes to its own slot; a write from the eval lane to the approval and to the traffic of the request is drawn in red and cut; a tenant of the wrong value passes its type and fails its check; a text claim in place of the result fails the digest; then the channels: a list keeps a duplicate and the order of arrival, two writes to one scalar collide, and three owned slots do neither. Result: a narrow contract for each worker.
5. **superstep-join**. What does the barrier promise? Start: the board. Moves: a superstep as three phases (plan, run, apply): the cards cross the barrier together; the channels of scene 4 again, in detail (a scalar with two updates is an error, a list keeps order and duplicates); then the health lane gets a preparation step: with three separate edges the packet fires with two cards and fires again, and with one waiting edge it fires one time; a waiting edge on a branch that does not run never opens. Last beat: a write to a nested value passes a shallow lock. Result: the barrier is about time, not about meaning.
6. **validated-join**. All three finished: may the request go on? Start: three cards at the barrier, all lamps lit. Moves: the tenant of the health card turns to tenant9; a question mark at the packet; the gates open (time is satisfied), the join reads the cards, the tenant of health goes red and its slot refuses the card, so the packet does not seal; the other reasons to refuse light up in a row; the cards sort by branch name whatever the order of arrival; a fresh health card passes; three gauges in the band show the numbers of the fixture as the voice says them (2%, 0.04%, 0.4 times, 25%), and a request of minus one slides past the lower end of the range. A new eval source then changes the proposal hash while the release and 25% request stay fixed. Result: time and meaning are two gates.
7. **checkpoint-retry**. What does a resume keep? Start: the board, and an empty checkpoint in the band. Moves: eval and policy arrive and copies of their cards drop into the checkpoint; the health read times out, and a second attempt runs alone; a run marker enters a node again and repeats the work before its pause; an identifier selects the checkpoint and a lock still holds it; after a long pause the ages on the cards count up past 60 s and go red. Last beat: a table of four failures and four recoveries, and each row lights its place on the board. Result: a resume has a meaning for each failure.
8. **single-writer**. What does an approval bind? Start: the board with a sealed packet. Moves: the token docks at approval and the stamp takes its digest; the live revision of the target turns to v4, the writer refuses the token, and the gauge does not move; the packet opens, the cards are read again at v4, a new digest, a fresh stamp, the writer applies and the gauge fills; the reply is lost, the same key `op-18` goes again, and the ledger in the band returns `change-1` with one effect; the same key with other arguments is refused. Result: one writer, one exact packet.
9. **topology-ownership**. Who holds the conversation? Start: the board (the right column stays for the whole scene). Moves: a loop and a generated lane show that a graph need not be a DAG; then the left side becomes three lanes of a conversation (user, manager, specialist) with one baton. For a tool call the baton stays in the manager lane while a question goes out and a verdict comes back. For a handoff the baton crosses, and the next user message lands on the specialist. The history that crosses is marked untrusted, the tools of the sender stay behind, and the tools of the receiver come from the policy. Last: a write tool is removed from the specialist, and its red path to the target is cut. Result: ownership is a thing that moves or stays.
10. **wire-protocols**. Can a completed vendor task authorize traffic? A model host calls the lookup API across the wire boundary. A separate message reaches the vendor investigator before its persistent task record appears. The same task ID follows the investigator from submission to its attached eval receipt. Its status reaches completed, but the receipt is 210 seconds old. The join refuses it and the writer stays at 0% live traffic.
11. **transfer**. Who repairs a mixed batch? The join rejects the v4 health receipt, the health worker refreshes it, and the join checks it again. A separate batch with duplicate health receipts is refused. The repaired v3 packet waits for review. A separate writer test replays the approved v4 operation and gets the first result back.

## Hand-over between scenes

A scene takes `board.standing` from the scene before it (`b.enter(c)`) and keeps it for the next one (`b.leave(c)`). The last half second settles the standing board into the next scene’s initial state. The live readout shows the applied traffic, and the tick on its gauge marks the requested amount. Cards, verdicts, the seal and the token are not kept: they fade with their scene, and the next scene sets them at its start. The first scene adds the board (`b.enter(c, true)`), and the last scene does not call `leave`.

`topology-ownership` hides `board.leftSide` for its lanes and shows it again after its last phrase, so the hand-over to `wire-protocols` includes the applied v4 target. The protocol scene labels its new v3 run before it resets the target.

## Rebuilt so far

All 11 scenes, in the order of `lesson.yaml`: subject-intro, dependency-graph, parallel-clock, typed-receipts, superstep-join, validated-join, checkpoint-retry, single-writer, topology-ownership, wire-protocols, transfer.

What differs from the lines above:

- dependency-graph: a table in the band ("triage after request", "merge after eval, health, policy") builds with the run. The corner over triage gets the word DAG.
- In parallel-clock, each early branch accumulates waiting time while health runs. The wall-time bar includes the half-second merge. Its result stays hidden until the voice says "three and a half seconds".
- superstep-join, beat 2: the clock is in seconds, from `waitingJoinTrace` of the model (eval 2, prep 1, health to 4, policy 1). The band counts the runs of the merge as dots: one for a waiting edge, two for three edges.
- topology-ownership: four lanes (user, Vega, health specialist, release specialist) and one more for a coordinator.
- In wire-protocols the protocol table gives way to the vendor’s task record. The policy lane carries a direct message.
- transfer: the band of beat 1 is two lists (each branch, the effect), and the band of beat 2 is three rows (arrow, receipt, resume).

## Timing and script coverage

Recorded review is blocked. The available `build/landing-standard/previews/agent-orchestration/timeline.json` does not match the current reviewed narration. Both tools stop at `superstep-join, beat 1: the recording does not match the current narration.` The reviewed script also changes single-writer and transfer. Preserve that narration and supply a matching audio-renderer timeline before measured review. No speech was generated in this repair. Run `nice -n 15 node tools/stage-check.mjs agent-orchestration --timeline ../build/landing-standard/previews/agent-orchestration/timeline.json` from `videos/` to repeat the whole-lesson check.

The previous measured-review completion claim is withdrawn. The current estimated checks and still inspection are recorded below.

The rebuilt script has 251 visual cues across the original 40 beats. It preserves the narration, scene order and holds. The added cues anchor the refreshed source count, the new packet digest, the vendor’s task progress and the final replay result to the spoken clauses.

## Independent review repairs

- Finding 1 remains blocked by the missing matching recorded timeline. The completion claim above is corrected.
- Finding 2: place both validation checks on the yellow handoff route. Replay the transfer, hold its baton at argument validation, and release it only after the boundary check.
- Finding 3: replace the production instruction list with bound-versus-current policy markers, a moving expiry clock, and a writer gate. Keep the fixture ledger separate from these production requirements.
- Wire protocols: keep the completed task with its attached artifact during refusal, and bounce the stale receipt out of its packet slot.

## Second-writer verification, 2026-11-09

The three revised scenes are topology-ownership, single-writer and wire-protocols. The tenant7 release r17 example, its 25% request, the branch colors, narration and holds stay unchanged. The approval table also has more room between its request label and value.

Each revised scene passed its scene check without a finding. The final whole-lesson check compiled all 11 scenes on estimated timing, with 263 rest moments and 27,079 motion frames. It reported zero errors, zero warnings and zero scenes not rebuilt. The estimated duration is 902.6 seconds.

The still tool produced 510 source stills at 1920 pixels wide, including before-cue samples. All 40 beat-end stills were read in lesson order at full size. All 11 contact sheets were surveyed. Before-result frames were read for the revised scenes. Six transition samples were read for each of transfer-boundary, recheck-expiry and completed-not-proof. The handoff baton waits before validation, the expiry clock advances while the effect gate waits, and the stale receipt bounces back while its completed task and attached artifact remain visible. The film rates 4 of 5: the example moves to teach its mechanism.

Both whole-lesson tools were also attempted with the available recorded timeline. Both stop at the narration mismatch in superstep-join beat 1. The cache keys computed by the audio renderer recipe have neither MP3s nor word-boundary files for the six changed beats: superstep-join beat 1, single-writer beats 0 through 3, and transfer beat 3. Finding 1 remains open. A matching recording and timeline are required before measured review. No word timings were invented or relabeled.

No movie, speech or sound playback was produced or reviewed. The commands ran one at a time through nice, which reported “setpriority: Operation not permitted.” No shared files were changed.

## Final implementation contract pass

The final candidate retains all 11 scenes and 40 beats, with the incoming holds and scene order. It has 258 visual cues. The factual source is `wt-orchestration-order` script hash `7dfcce6154210fd4`. Its four single-writer corrections, transfer assumptions and reset/resume teaching remain. The reducer-order wording is now integrated. The visual writer’s handoff validation route, policy and expiry animation, approval spacing, fixture ledger and task-artifact rejection remain intact.

The narration and pictures distinguish article workers from supplied film receipts, scoped source records from the film’s branch-value registry, the digest-only film packet from the article’s referenced evidence, assumed v4 inputs from a source fetch, and in-memory replay from production durability. The optional review loop is separate from the article’s cancellation route. The unequal-depth example is labeled as a merge recorder. Checkpoint recovery is an integration sketch that requires a checkpointer and a supplied host clock.

Run `node stage-lessons/agent-orchestration/verify-contract.mjs --langgraph` from `videos/` to reproduce the implementation checks. The probe executes the unchanged film model, article receipt functions and replay-safe writer, pinned LangGraph 1.2.12 examples, and a temporary SQLite capstone exercise. It verifies that the capstone checks expiry before duplicate detection, while the two in-memory replay examples have different lookup ordering. It performs no external effect.

The final whole-lesson check passed on estimated timing: 271 rest moments and 30,632 motion frames, with zero errors or warnings. Its estimated duration is 1,021.1 seconds. All 40 beat-end stills were inspected at full size, along with the listed cue samples and six samples inside each of the handoff, expiry and stale-receipt moves. The stills are under `build/agent-orchestration-contract-pass/stills`. The exact paths, commands, storage reservations and source hashes are recorded in `script-repair.json`.

The available recorded timeline fails at `dependency-graph, beat 2: the recording does not match the current narration.` No speech, measured word timings, full movie, publication or commit was produced. The candidate is ready for fresh quiz and fact review at `39725d7d3fff645a`. Audio and measured cue synchronization remain unverified.

## Previous independent-review repair

The central example remains tenant7, release r17, revision 3, and 25% traffic. This pass changes three scenes and preserves every corrected spoken beat, hold, scene title and scene order. Direct verification confirms script hash `39725d7d3fff645a`.

- Finding 1 remains open. The existing recorded timeline stops at `dependency-graph, beat 2: the recording does not match the current narration.` Request a fresh audio-renderer timeline for hash `39725d7d3fff645a`, then repeat the full check and reveal inspection with `--timeline`. No speech or timing data was generated or relabeled.
- Finding 2 is repaired in `superstep-join`. After the selected-set probe, the picture restores all three required branches and replays the clock to the first partial merge at 2 seconds. Eval and policy reach their slots. Health stays absent, its slot turns red, and the invocation fails without another merge. The next beat starts its separate ownership example with all three receipts restored.
- Finding 3 is repaired in `typed-receipts`. Supplied tenant, release, revision and age stand beside the local registry. The eval values trace into their fixture digest. The absent tenant and revision fields appear on the registry limitation clause. The earlier failed string is cleared before this picture begins.
- Finding 4 is repaired in `checkpoint-retry`. The existing numberLine component shows receipt age moving past the labeled film limit of 60 seconds. A separate article marker at 300 seconds appears on its clause. The age readout and checkpoint copies share the board values.

Each changed scene has passed its estimated scene check without a finding. Full-size beat ends, before-result frames and transition samples have been read for these scenes. The complete lesson check and final viewer-order inspection are complete. No new component is required, and no shared file was changed. All shell commands use `nice -n 15`, although this host reports `setpriority: Operation not permitted`.

The final whole-lesson check compiled all 11 scenes on estimated timing. It inspected 277 rest moments and 30,632 motion frames and reported zero errors, zero warnings and zero scenes not rebuilt. The duration remains 1,021.1 seconds. The current script has 264 visual cues across the same 40 beats. The check log is `/tmp/leetllm-rebuild/agent-orchestration/whole-check.log`.

The final still run produced 537 full-size source stills with before-cue samples. All 40 beat ends were read at full size in lesson order, and all 11 contact sheets were surveyed. Before-result frames were read for the changed scenes. Full-size samples inside the release replay, registry digest trace and age-limit crossing showed no sampled collision or jump. Eight frames for each of those moves remain in their `move-*` folders under `/tmp/leetllm-rebuild/agent-orchestration/stills/`. The rating remains 4 of 5. The example teaches through motion, prediction and repair.

Both full-lesson tools were attempted with the existing recorded timeline. Both stop at the corrected dependency-graph narration mismatch. Finding 1 remains open pending a matching timeline for `39725d7d3fff645a`. Full-speed playback with sound was not checked. No movie, speech, shared write, commit or external action was made. No sentence was changed in this pass. The approved factual corrections in `script-repair.json` remain intact.

## Current visual follow-up

This pass preserves the corrected narration at hash `39725d7d3fff645a`. Finding 1 remains open because the available timeline fails at dependency-graph beat 2. The parent must supply a matching audio-renderer timeline before recorded cue inspection.

The transfer repair keeps the owner choices beside the refused receipt. The join gets an explicit rejection label. On the refresh phrase, the health worker lights, a message returns to that worker, and its refreshed receipt travels back to validation. The protocol revision replaces its opening table with a host calling a capability server and messaging a vendor investigator. The opening comparison retains all three work cases and animates their different dependencies.

The revised scenes are subject-intro, wire-protocols and transfer. The other eight scenes retain their existing pictures. The final whole-lesson check on estimated timing compiled all 11 scenes at 1,021.1 seconds. It inspected 277 rest moments and 30,632 motion frames, with zero errors, zero warnings and zero scenes not rebuilt. Its log is `/tmp/leetllm-rebuild/agent-orchestration/whole-check.log`. The reviewed narration, holds and 264 phrase cues are unchanged. The lesson.yaml file is byte-for-byte identical to the incoming file.

The final still run generated 537 source stills at 1920 by 1080, including before-cue frames. All 40 beat ends were read at full size in lesson order. All 11 scene sheets were surveyed, with the three revised sheets regenerated. Full-size inspection also covered eight before-reveal frames and 36 transition samples: four each for research, ETL and shared editing, and eight each for the lookup call, vendor message and health repair. No sampled collision or early result was found. The task record waits until after the vendor phrase, and the owner choices remain beside the refreshed health receipt until digest validation starts. The rating remains 4 of 5.

Both recorded-timing tools were retried with `../build/landing-standard/previews/agent-orchestration/timeline.json`. Both stop at `dependency-graph, beat 2: the recording does not match the current narration.` Finding 1 remains open. The parent must supply the audio-renderer timeline for corrected hash `39725d7d3fff645a`, then repeat the complete check and before-reveal inspection with `--timeline`. No timing was invented or copied from an obsolete recording.

No current encoded movie or decoded-frame-audit.json bound to this corrected source was found in the preview directory or durable lesson evidence. The durable evidence contains older scene clips. Encoded playback and synchronization with sound remain unverified. No sentence, shared component, shared file or external state was changed. No component request is needed.

Generated outputs were admitted through the existing storage reservation and settlement APIs, with a 512 MiB reservation per still command. The conservative root account includes the entire repository build plus lesson scratch. The external account measures the entire durable project. A bounded output-growth watcher stops its owned child if measurement fails or the reservation is exceeded. It retries a raced ENOENT scan because the still tool replaces scene directories and renames files. One initial run stopped on that race. The successful retry and all later commands settled below their reservations. The measurement and ledger are under `/tmp/leetllm-rebuild/agent-orchestration`. All commands ran sequentially under `nice -n 15`, although this host reports `setpriority: Operation not permitted`.

## Reviewer follow-up, 2026-11-10

This pass preserves the tenant7/r17 example, all scene and cue IDs, and narration hash `39725d7d3fff645a`. The protected script review has no open factual findings. No speech, article, quiz or coverage change is planned.

1. `parallel-clock`: keep the wall bar and cursor at 3 seconds until `parallel-total` ends. Extend both from the counted merge value with the numeric reveal. The scene check reports zero findings. Full-size beat ends, the before-result still and reveal samples have been read.
2. `topology-ownership`: mark both replays before hiding the flow. Reset the concealed baton and trail, then show the same conversation lanes again. The scene check reports zero findings. Full-size beat ends and replay samples show each concealed reset and restart.
3. `checkpoint-retry`: retain both age-limit markers and the age readout for 1.2 seconds after the article marker finishes fading in. Delay the recovery table, then reset the receipts after the diagram has faded out. The final scene check reports zero findings. Full-size beat ends, before-result stills and transition samples have been read.

Inspection output is confined to `/Users/bruno.volpato/.local/share/vizmatic-landing/leetllm/production/repair-dispatch/actions/agent-orchestration-art-fix-81e862b5981904e3a3cd/stills`. Incoming source snapshots and new storage measurements are retained there. Whole-lesson verification and viewer-order inspection are complete on estimated timing. Recorded synchronization still requires a matching timeline.

The final whole-lesson check compiled all 11 scenes at an estimated 1,021.1 seconds. It checked 281 rest moments and 30,632 motion frames, with zero errors, zero warnings and zero scenes not rebuilt. Its log is `whole-check.log` in the inspection directory above. The fresh still run produced 545 stills at 1920 by 1080. All 40 beat ends were read at full size in lesson order. Before-result stills and samples within the counted merge, both conversation replays and the age-to-recovery transition were also read.

Findings 1, 2 and 3 are repaired. No requested finding or automated finding remains open. The rating is 4 of 5 by the rebuild scale: the persistent example moves to teach the mechanism. This is the repair writer's assessment, not an independent review of these edits. Three scenes changed. All 11 rebuilt scenes remain in the film.

The draft lesson YAML is byte-for-byte identical to the incoming file, with SHA-256 `839652969e005a651be416da5cf51788968e91b40c4ff171ee0f21f27f0c4f99`. Direct hashing of the draft with `scriptHash` confirms narration hash `39725d7d3fff645a`. The coverage CLI hashes the legacy script while this draft is unpromoted, so the direct draft check is recorded in `narration-verification.json`.

The recorded-timing check was retried and failed with `dependency-graph, beat 2: the recording does not match the current narration.` Its log is `recorded-check.log` in the inspection directory. A matching audio-renderer timeline remains required for measured review. No movie, encoded-frame review, continuous playback with sound, speech synthesis or independent review of the repair was performed.

No sentence, cue declaration, hold, shared component or shared report changed. No component request was added. Source snapshots, all inspection attempts, logs, measurements and reservation settlements are retained in the assigned inspection directory. Commands ran sequentially under `nice -n 15`, although the sandbox rejected the priority adjustment with `setpriority: Operation not permitted`.
