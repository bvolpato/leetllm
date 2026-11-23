# Plan of `agent-recovery`

An agent that continues this work reads this file first. The status is in the last section.

## The central example

One operation goes down one line, and the line stays on screen:

```text
upper:  agent + operation card  --- request lane --->  controller: staged (in a transaction)
                                                       ------- commit line -------
lower:  what the agent knows    <--- reply lane -----  controller: durable (ledger row, job row)
```

- The operation is the approved rollback to `rev-17`, with the key `rb-842-1`.
- A request is a token (a pill) that travels on the request lane. A reply travels back on the reply lane, into the view of the agent.
- The controller holds two records: the ledger row `rb-842-1 -> job-1` and the job row `job-1 queued`. They wait over the commit line and go under it together.
- The first reply is lost on the wire. So the view of the agent says `timeout`, and the controller holds `job-1`.

Each scene acts on one station of this line: the admission gate before the wire, the token on the wire, the commit line, the reply, the view. A scene about time, spend or counts keeps the tokens and the colors, and draws its own measure.

## The job of each color

| Color | Job |
|---|---|
| `pink` | The operation: the key `rb-842-1` and its payload `rev-17`, on the card, on a token and in the ledger. |
| `cyan` | What the agent side sends or picks: a proposal, a transport attempt, a read, a wait that the client samples. |
| `blue` | The controller and what it owns: its panel, the commit line, a wait that the service sets. |
| `green` | What is established: an approval, an admitted proposal, a committed record, `job-1`, a verified observation. |
| `yellow` | What the voice names now, and the one result that matters. |
| `red` | A failure: a lost reply, a timeout, a denial, a conflict, a fault, a wait that passes the deadline. |
| `dim` | What is done or quiet. A dashed outline with `?` is a state that nobody observed. |

## What `parts.mjs` holds

- `OP`: the key, the job and the state from `commitScenario('after-commit')` of the model, and the payload.
- `COLOR`: the jobs above.
- `board(options)`: the line of the operation. It returns the agent box, the view, the two lanes, the controller panel with its commit line, and the places of the records. Its helpers: `absorb` (a request goes into the controller), `lose` (a reply breaks and falls off the lane), `arrive` (a reply goes into the view), `shelf`, `close` (the lanes leave a moment before the scene).
- `token(words, color)`: a pill that travels. `record(parts, width)`: a row of the controller. `travel`, `docked`, `tint`.
- `wall(s, ...)`: a gate with a door that a value opens, for the admission check.
- `breaker(s, ...)`: a switch on a lane with calls as balls, for the two breaker scenes.
- `places(s, count)`: a counter of a few places that a value fills.
- `secondsAxis(region, ...)`: a seconds axis with rows, for the two timing pictures.
- `ageLine(region, ...)`: one observation on a line of time, with the band of what is new enough.
- `cross`, `pin`: the mark of a lost message, and a numbered pin.

Three rules that the first scenes taught:

- Lay out every node before the first `s.add`, `c.show` or `c.on`. A `c.on` callback runs at once, so a `moveTo` after it becomes a move on the timeline.
- A token never fades over a lane: the lane shows through its words, and the check reports it. A token shows at once (`travel`), goes quiet by color (`tint`), and fades only inside a panel (`absorb`).
- A scale of `indicate` makes a text cross its neighbors. Use `scale: 1` for a text beside a line or another text.

## The scenes

Each line: the question, what is on screen at the start, what moves, the result.

1. `subject-intro`. Where is the operation when the reply is lost? Start: the whole line, with an empty controller. Moves: the approved token goes to the controller, the job row goes under the commit line, the reply breaks and falls off the wire. Result: the view says `timeout` and the controller holds `job-1`. Then four pins mark the four questions of the lesson on the line.
2. `action-boundary`. Who lets a proposal out? Start: the model, a wall with one door, the list of what is allowed, the controller. Moves: the status read goes through the door. The rollback stops, and its approval place stays empty. A proposal with a bad schema bounces, is repaired one time and passes. The denied rollback bounces again. Result: a repair can pass, and a denial ends the path.
3. `operation-identity`. What names the action? Start: the line. Moves: the key and the payload go on the card. Attempt 1 commits the two records and loses its reply. Attempt 2 has a new trace and the same key, lands on the row that exists and brings back `job-1`. The same key with `rev-18` bounces as a conflict. A new key makes `job-2`. Result: three identities, each at its thing.
4. `commit-boundary`. What does the fault point leave? Start: the line with an empty controller. Moves: the two records wait over the commit line in one transaction. Fault before the line: both go away. Run again: both cross the line together, and the reply is lost. Then the same key finds the row, and a status read finds `queued`. Result: 0 records or 2 records. Completion stays unobserved.
5. `retry-clock`. When may the next try go? Start: a seconds axis with the deadline and three windows of 1, 2 and 4 s. Moves: a wait is sampled in each window, and other clients spread in the windows. The Retry-After floor pushes each wait to the right, live, until the third one ends after the deadline. Result: the third try does not go.
6. `progress-budget`. Did the call bring evidence? Start: a row of 8 places for the calls, the evidence, a no-progress counter of 2 places. Moves: each call fills one place. `page-4` again fills the counter, and `page-5` empties it. Result: 5 calls left in each case. Then the line comes back with three faults at three stations, each with its route.
7. `circuit-breaker`. When does a call not go at all? Start: caller, switch, controller, with calls that pass. Moves: two failures fill a counter and the switch opens, so the next calls turn back. A cooldown ring runs, and one probe goes through and closes the switch. Then an old success with the stamp `gen 3` comes back to a switch at `gen 4`. Result: the caller gets the result, and the state stays.
8. `resume-with-evidence`. What may the report say? Start: the line, with a checkpoint on the agent side and question marks in the controller. Moves: the key goes to the ledger and brings back `job-1`. A status read brings back `queued`. Result: the report says `job-1 was queued when checked`, with its time. Then five pins light, one for each thing that recovery keeps apart.
9. `replay-contract`. How far does the replay promise go? Start: the line with the two records. Moves: two workers send one second key, a lock lets one in, and both get `job-2`. A stored `500` comes back on a replay. A retention bar runs out, the row leaves, and the same key makes a new request. A read of a replica that lags brings `not found` while the row is in the primary. A token with `rev-18` stops at a gate. Result: a contract has a scope and a lifetime.
10. `workflow-world`. What does a checkpoint bring back? Start: the line, with the three local steps under the agent. Moves: the effect lands at the controller, a crash stops the steps before the receipt, and the light of the steps goes back to the checkpoint. The two records do not move. Then a step with a record is answered from history, and the step with no record sends again and lands on the row that exists. Result: local state rewinds, and remote state does not.
11. `spend-budget`. What do retries and turns cost? Three pictures. 3 balls become 9 and then 64. Four prompt bars grow by 50 tokens a turn, and their copies fill the bar of the run to 700. A request of 120 plus 80 is longer than the 150 that are left. Result: a bound multiplies, a total adds up, and a reservation is refused.
12. `breaker-contract`. What counts, and for whom? Start: three tenant lanes, each with its switch, to one controller. Moves: a schema error turns back before the switch and counts nothing. Two quota failures open the switch of one tenant, and the other two lanes keep passing. Then a cancelled probe frees its place and opens the switch again, an error that is not about health leaves it half-open, and an old result changes nothing. Result: the record of the controller is still there.
13. `fallback-evidence`. What survives a switch of provider? Start: two providers, the agent, the tool lane and the controller with `job-1`. Moves: the switch arm goes to the backup. Under the route, one band changes: what the backup must pass, then an observation of 40 minutes on a line of time with a tiny band of what is new enough, then a handoff card that fills field by field. Result: the operation is still unresolved, and the card says so.
14. `compensation`. What does an undo act on? Start: three nodes with pods, and the planned steps of the flow. Moves: the node is cordoned, its pods move to the other nodes, the image fails, and the uncordon changes the border only. The pods stay. The record of steps fills as the steps happen, and one compensation times out. Result: a compensation is a new action on the state of now.
15. `recovery-transfer`. Can the viewer decide? Four pictures. A wait of 1.2 s and a jitter of 0.3 s join and pass the 1.4 s that are left: stop. An observation of 40 minutes is far from a window of 1 minute: unavailable. 100 runs take four colors, and two brackets give 60% and 90%. Then the line comes back, and each fault of the test list lights its station.

## Status

- All 15 scenes are in `index.mjs`. `node tools/stage-check.mjs agent-recovery` has no error and no warning on estimated timing.
- No sentence of the narration changed. `lesson.yaml` has about 150 new cue declarations, each with `targets: [picture]`.
- Weakest scenes: `fallback-evidence` (its first band is a list of chips), the last part of `spend-budget` (four rules as lines of text), and the last picture of `recovery-transfer` (notes on the line, with no motion).
- Not done: the hand-over of the line between scenes with `c.keep` and `c.take` (each scene fades the line in again), and a check on measured speech.
