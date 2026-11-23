# Plan of the rebuilt lesson `sandbox-execution`

Status: see the last section. An agent that continues this work reads this file first, then `parts.mjs`.

## The central example

One run of one generated parser. A coding agent writes `parse.py`. It reads `report.xml`, a JUnit report with four test cases (X1 to X4). Attempt 1 asks for a `status` attribute and stops with `KeyError: 'status'`. The repair reads the direct child elements, keeps X1 (failure) and X3 (error), and drops X2 (duplicate) and X4 (skipped). The run happens in `worker-A`, generation 7, a cell with a wall. A supervisor owns the cell, and a validator outside the cell holds the expected rows. Of five candidates C0 to C4, two pass, and pass-at-2 is 7 of 10.

Every number and every row comes from `videos/films/sandbox-execution/` (`model.mjs`, `fixtures.mjs`, `arithmetic.mjs`, `construction.mjs`).

The picture that stays: **the cell**. A pink wall with the name of the worker, the candidate inside it, the host under it and around it. A scene sends something at the wall (a call, a probe, bytes of evidence, a cleanup request), and the picture shows where it stops.

## The job of each color

| Color | Job |
|---|---|
| `pink` | The candidate: generated code, its worker, its wall. Not trusted. |
| `cyan` | The supervisor and the host: the kernel, a control, a limit, a policy. Trusted. |
| `blue` | The report and the evidence: XML, a traceback, an output row, bytes that travel. |
| `green` | The validator, and a check that holds: pass, allowed, verified. |
| `yellow` | What the voice names now, and the one result of a scene. |
| `red` | A failure, a denial, a trap, a danger. Nothing else. |
| `dim` | A part that is done, a header, a thing that is absent. |

## What `parts.mjs` holds

- `COLOR`: the jobs above, by name. `WORKER` and `NEXT_WORKER`: the names of generation 7 and generation 8.
- `CASES`, `FRESH_CASES`: the test cases of the two reports, from the model.
- `wall(region, title, options)`: the wall of a cell, with its name on the border. Every cell of the lesson is this wall. It holds nothing, so each part inside shows by itself.
- `reportPanel(xml, cases)`: a report as its real XML, with the glyphs of each identity, of each child element and of the namespace, and a scan bar. Scenes `evidence-loop` and `earned-parser-case` show it.
- `gauge(s, region, options)`: a track that fills to a limit from a value of the scene. Scenes `feedback-contract`, `controls-by-failure`, `actual-wasm-host`, `wasm-failure-matrix`.
- `slotLane(track, options)`: slot A as a lane of time with generation 7 and generation 8. Scenes `teardown-lifecycle` and `earned-parser-case`.
- `tintChip(chip, color)`: a new color for the border and the label of a chip. `recolor(chip)` paints the fill too.

A call, a probe or a packet that travels is a `dot` with `moveTo`, in the scene that sends it.

## The scenes

One line each: the question, what is on screen at the start, what moves, the result.

1. `subject-intro`. Why is a useful failure also a danger? Start: the report (four cases), attempt 1 of the parser, an empty `stderr` panel, and the host at the right (files, network, CPU), dim. Moves: the run bar goes down the code and stops red on `case.attrib["status"]`; the traceback prints; `'status'` lights in the traceback and in the code; three red arrows reach from the process to the host; then a loop arrow takes the traceback back to the code, the wall draws around the process, and the three arrows pull back to the wall. Result: two systems, the loop and the wall.
2. `evidence-loop`. What must the next patch respond to? Start: the report as a table (X1 to X4) and an empty output list. Moves: the contract lights the child tags and the identities; attempt 1 probes X1 for `status` and fails; the evidence packet fills with four fields; the repaired scan goes down the rows, each row gets its verdict, and the kept rows travel to the output in first-seen order; PASS. Back half: the same table takes six edge cases, one row each, and each verdict waits for its clause.
3. `feedback-contract`. How much of the failure may enter the loop? Start: the cell at the left, the evidence slot in the middle, the supervisor at the right, and the packet with its four fields. Moves: a one-line output grows to a megabyte and runs past the byte cap while the line count stays 1; the strip is cut to a head and a tail with the cut in view; three identical failures stop at the retry cap. Then a forged line inside the traceback is escaped and stops at the policy; the inherited secret leaves the environment; a relative path stays in the working directory and an absolute path leaves it. Then four limits close around the XML input.
4. `separated-authority`. Who may grade the run? Start: supervisor, worker cell, validator, in a row. Moves: the supervisor takes its four duties; the output rows leave the cell and meet the expected rows in the validator; the verdict binds to four identities and one changed byte breaks the digest. Wrong step: the test runner moves inside the cell, the candidate reads the read-only test and replaces the assertion in memory, and exit code 0 is a false pass. Repair: the comparison moves back outside, with the key.
5. `execution-boundaries`. Who owns the kernel in each runtime? Start: the host kernel as the floor, and four columns with the same `parse.py` on top. Moves: each column builds a different wall (a filter line, a Sentry floor, a guest kernel in a box on KVM, a memory box with named doors); then one call, `open /work/report.xml`, drops through each column and lights the layers that it crosses. Then a Docker socket opens a red way round the container wall, and a start-up strip splits into its four parts.
6. `controls-by-failure`. Which control stops which failure? Start: the cell with the process, a closed network door, an open output pipe, and four gauges at the right. Moves: the token leaves through the output pipe past the closed network door; the scratch gauge fills to its cap and returns ENOSPC while the process runs; the task gauge fills and returns EAGAIN; the CPU strip throttles half of each period while the wall clock runs to the deadline, which ends the process. Back half: the same gauges take the numbers of the recipe (50 of 100 ms shared by two threads, 64 MiB of scratch inside 512 MiB of memory), and four hardening flags light.
7. `prepared-dependencies`. How does a package get in when the candidate has no network? Start: index, builder cell, cache, worker cell, in a row. Moves: a package goes through the narrow egress door, its hash meets the lockfile, it lands in the cache, and the worker mounts the cache with its network door closed. Then seven ways out of a cell light one by one, and a request with an allowed name on the outside and another host inside passes the allowlist. Then a token leaves an offline cell through stdout and through an exported file.
8. `teardown-lifecycle`. When is a slot free? Start: slot A on a time axis with generation 7 running, and its process tree. Moves: cancel stops the top process and the children stay; the job kill empties the tree; termination and reset tick; generation 8 takes the slot; a late request for 7 bounces off 8. Back half: a child leaves the process group and survives the group kill; `cgroup.kill` empties the job; a destroy by name hits generation 8, and the same destroy with the generation does nothing.
9. `wasm-boundary`. What does a Wasm guest get? Start: the guest box with one export and its import doors, and the fuel grid of 100 cells with 32 more steps behind it. Moves: one door links and one stays absent; the fuel cells burn in order, the trap lands before step 101, and 32 steps never run; a second memory page is refused with -1. Result: the grid covers guest instructions only, and three host costs stay outside it.
10. `actual-wasm-host`. What does the real host accept and return? Start: the guest box with `run: i32 -> i32`, no doors, one memory, and three separate gauges. Moves: `True` is refused; the three limits fill their own gauges; on the ring of i32 values, 41 steps to 42, -1 steps to 0, and the largest value steps across the seam to the smallest; the result goes to the oracle outside. Then fuel set after instantiation lets the start function run free, and the same strip is repaired.
11. `wasm-failure-matrix`. What does each guest failure return? Start: a matrix with the probes as rows and the four results as columns, and one memory page. Moves: each probe lands in its column; a 4-byte window slides to the end of the page and traps when two bytes hang over; three bad modules are refused at load; a path with an allowed prefix follows a symbolic link out of its directory. Then three runs of the fuel probe stop at the same step.
12. `evaluate-two-axes`. What does pass-at-2 say, and what does it not say? Start: five candidates on the two sides of a 5 by 5 grid of pairs, and a column of containment probes at the right. Moves: two candidates turn green; the ten pairs above the diagonal light, seven green and three red; 7 of 10. The probes stay unmeasured. Back half: the formula takes the numbers; the grid opens to all 25 ordered draws, 16 green, 64 percent; then four notes on what a sample is.
13. `earned-parser-case`. Does the repair hold on a new report? Start: the table of scene 2 with the four fresh cases, an output list with a question mark, and three receipts. Moves: each row gets its verdict and one row travels to the output; the receipts fill one by one: functional pass, network denial observed, slot quarantined; then termination and reset tick, generation 8 takes the slot, and a late record still names generation 7.

## Cues

The old lesson file declares one or two cues for a sentence. Each scene here declares its own cues for the words at which the picture changes, in `lesson.yaml`. No sentence of the narration changes.

## Status

All 13 scenes are rebuilt and are in `index.mjs`. `node tools/stage-check.mjs sandbox-execution` gives no error and no warning on estimated timing, and it reports no change of a sentence.

What is not done:

- No scene hands its picture to the next one with `c.keep` and `c.take`. Each scene draws the cell again in the layout that it needs, with the same wall, the same names and the same colors. Two pairs can share one place: `wasm-boundary` and `actual-wasm-host` (the guest box), and `separated-authority` with the three walls of a later scene.
- The stills were read at full size for the end of each beat and for some moves, not for each cue. Contact sheets were read for scenes 1 to 4.
- The film was not rendered, and nobody saw it with the voice. The times are the estimate of 0.4 seconds a word.
- The back halves of `controls-by-failure`, `prepared-dependencies` and `actual-wasm-host` end on rows of chips. A next pass can turn the hardening flags and the bounds into marks on the wall of the cell.

How a scene is made here: each scene replaces the cues of its beats in `lesson.yaml` with its own (the list of each scene is in `/tmp/leetllm-rebuild/sandbox-execution/cues/` while that folder exists), builds the frame from regions of `area`, adds the first picture with `s.add`, and puts each change on a cue.

## Narrated edition

The thirteen chapters follow the parser from its first exception to the verdict on a fresh fixture. The worker and validator stay separate. The recorded voice explains the shared CPU budget. The teardown diagram shows a late cleanup request reaching its original generation.

An independent script review of `46680f95d6331279` checked the article and all ten quiz questions. Nine answers are explicit in speech. The generation guard for the remaining answer appears in the picture. The reviewer found no contradictions in the parser results, grading contract, arithmetic or runtime checks.
