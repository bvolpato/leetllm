# Video teaching standard

Every lesson video follows this standard. It adds a completeness requirement to the existing rubrics without replacing them, and it covers both the stage film path and the older canvas path.

## The mandate

A lesson video must teach its topic accurately and completely. A viewer who watches only the video must understand the mechanism, follow the reasoning, work the example, and answer the mastery questions about the topic's core.

When goals conflict, apply them in this order:

1. **Accuracy.** A wrong or overclaimed statement is a defect, however smoothly it plays.
2. **Completeness.** The video teaches everything it promises.
3. **Clarity.** The viewer can follow each step at normal speed.
4. **Brevity.** Brevity is the last priority and is never a goal by itself.

There is no target length. Length follows the content. Remove a passage only if it does not help a viewer learn the topic: repeated setup, filler, a list of values that are already visible, or detail that a page teaches better. Keep every passage that teaches, even if the video gets longer.

Completeness means a viewer can reconstruct and use the mechanism. Teach the intuition, intermediate steps, and interpretation generously. Carry the central example to a clear result before branching into variants. A catalogue of related terms, caveats, and benchmark results can cover many subjects while explaining none of them well.

## What a video promises

A video promises the topic named by its title and its article. A title cannot quietly promise less than its article. An article about BPE, WordPiece, and SentencePiece needs a video that teaches all three.

If the topic does not fit in one video at a comfortable pace, split it into a named series and give each part its own promise rather than dropping the content.

## Rules

Each rule names how it is checked. **Tool** means `check-coverage.mjs` or another automated check fails the build. **Reviewer** means an independent reviewer decides. **Person** means a human must do it.

### Completeness

| Rule | Requirement | Check |
|---|---|---|
| C1 | State a one-sentence promise and a list of objectives. Each objective names something a viewer can do afterward and lists the scenes that teach it. | Tool |
| C2 | Account for the whole article. Every `##` and `###` heading and every mastery question has a row in the lesson's coverage ledger. A row is `taught`, with its scenes, or `article-only`, with an allowed reason. | Tool |
| C3 | Pass the closed-book test. A reviewer answers the mastery quiz using only the narration and must quote the line that teaches each answer. At least 80% of the questions must be taught. Knowledge the reviewer already has earns no credit. | Reviewer, recorded and checked by Tool |
| C4 | Never mark the topic's core as `article-only`. If a quiz question tests a core mechanism, the video teaches it. | Reviewer |
| C5 | Justify every cut. When a rewrite replaces a script, list each removed teaching point with its reason in the ledger. | Tool for presence, Reviewer for merit |
| C6 | Give every scene a teaching job. Each scene appears in the ledger, or it is listed as framing. The only allowed framing is an opening hook and a close. | Tool |

The allowed reasons for `article-only` are:

- `code-detail`: reading code line by line works better on a page.
- `vendor-detail`: a fact about one product or version that will change.
- `reference-table`: lookup material that nobody needs to hear.
- `beyond-promise`: an extension outside the stated promise. It must not be core.
- `prerequisite`: another lesson teaches it. Name that lesson in `lesson`.
- `exercise`: practice that the learner does on the page.

### The quiz

The mastery quiz is a measuring tool, so check it before you trust what it measures. A weak quiz gives a false score, and it can pull a script toward the wrong content. The article and the topic's core set the scope of a video; a quiz question does not.

The [quiz authoring rules](../CONTENT_GUIDELINES.md#mastery-check) still apply. These rules add a review of every question.

| Rule | Requirement | Check |
|---|---|---|
| Q1 | The keyed answer is true. Every other option is definitely wrong under a charitable reading. Compute every calculation. | Reviewer |
| Q2 | The question tests something a learner needs from this topic, and it will still matter in a year. A fact about one product version usually fails this rule. | Reviewer |
| Q3 | The question needs reasoning: a decision, calculation, diagnosis, or transfer to a new case. Do not reuse the article's own example numbers. | Reviewer |
| Q4 | The wording does not give the answer away. The correct option is not the only hedged one, the wrong options do not hold all the absolutes, and the stem does not state the rule and the violating value. Options that combine two independent choices, or bare numbers with a real error behind each one, avoid most of these cues. | Reviewer, and `scripts/audit-quiz-cues.py` for the mechanical rate |
| Q5 | The question stands alone, in plain English, with one best answer. An explanation describes options by content and never by position, because options are shuffled. | Reviewer |
| Q6 | Each wrong option is a realistic mistake. The explanation says why the tempting wrong answer fails. | Reviewer |
| Q7 | The quiz as a whole covers the article's important outcomes and does not test one idea repeatedly. | Reviewer |

### Accuracy

| Rule | Requirement | Check |
|---|---|---|
| A1 | Compute displayed numbers. A film calculates its numbers and checks them with `assert`, so the screen cannot disagree with the math. | Reviewer |
| A2 | Keep the voice and the screen in agreement. They use the same values, the same order, and the same rounding. | Reviewer |
| A3 | State the claim at the scope the lesson has taught. Keep assumptions beside the computation they affect. Fix an overclaim directly rather than appending routine qualifications to every result. | Reviewer |
| A4 | State meaningful simplifications cleanly without boilerplate apologies. Mention an omitted effect when dropping it would change the conclusion, and never stamp inline fictional-data disclaimers (`"synthetic fixture"`, `"FIXTURE ONLY"`, `"Treat these numbers as an illustrative walkthrough"`) on screen or in narration. | Reviewer |
| A5 | Make claims traceable. A non-obvious claim traces to a section of the article or a cited source. A fact that dates, such as a version, default, or price, carries its date or stays in the article. | Reviewer |
| A6 | Agree with the current article and reader chapter about the mechanism, example values, symbols, and prerequisites. After a rewrite, reconcile selected narration and drawings explicitly; source hashing alone does not update an old explanation. | Reviewer |
| A7 | Get an independent fact check. Someone who did not write the script checks every claim. The result is recorded against the script's hash, so any later change to the narration requires a new check. | Reviewer, recorded and checked by Tool |
| A8 | Keep every title true for as long as it is visible. Each heading, panel title, and label must agree with what is on screen under it and with the voice's wording, from the moment it appears until it leaves. A title that was true when it arrived can become false when the picture moves on. | Reviewer, using the method below |

Check A8 by listing, not by sampling. Reviewers who sampled frames missed false titles for three rounds on two films, including "Now full, and out of budget" above a bar under the budget line. List every text block in the film source with the times it is visible, then read each one against the screen and against the narration. A qualifier that the voice says and the screen drops counts as a finding.

### Teaching

| Rule | Requirement | Check |
|---|---|---|
| T1 | Teach from first principles. Define each term before using it, and name any prerequisite that the video assumes. | Reviewer |
| T2 | Explain why, then how, then the limits. Show the problem that creates the need, then the core mechanism cleanly, and only afterward examine edge cases, numerical corners, or failure conditions. Never open with gotcha-first caveats before teaching the mechanism. | Reviewer |
| T3 | Move from a worked example to the general rule. Keep the running example coherent. Domain-native examples, familiar analogies, playful worlds, and physical models are welcome when they make the mechanism easier to follow; avoid elaborate unrelated organizational roleplay. | Reviewer |
| T4 | Connect the small example to realistic scale where size changes the behavior or cost. Explain the relevant change without adding a production checklist to every topic. | Reviewer |
| T5 | Teach the mistakes. Cover the failures and misconceptions that the article and its quiz test. | Reviewer |
| T6 | Invite focused thinking when prior material equips the viewer to work out an illuminating outcome. Give useful feedback and leave time to think, without mechanical prediction prompts or a quota on questions. | Reviewer |
| T7 | End with what the viewer can now do and where the next lesson goes. | Reviewer |
| T8 | Check transfer as well as recall. A reviewer reconstructs the main example and explains a small changed case using only what the film teaches. Identify missing reasoning even when the coverage ledger and quiz score pass. | Reviewer |

### Script

Follow [Narration that leaves room to think](../CONTENT_GUIDELINES.md#narration-that-leaves-room-to-think), [State the idea directly](../CONTENT_GUIDELINES.md#state-the-idea-directly), and the [book voice](../docs/book-voice.md).

| Rule | Requirement | Check |
|---|---|---|
| S1 | Sound like a patient, authoritative teacher (O'Reilly, Karpathy, or 3Blue1Brown caliber). Use varied, natural spoken sentences with zero bureaucratic/SOC2 dialect (`fixture`, `contract`, `boundary`, `admit`, `receipt`, `provenance`, `authority`, `establish`, `supplied`, `bounded`, `fail-closed`, `governed`, `needn't`) outside literal exceptions, zero em dashes, and zero choppy staccato fragments. | Reviewer |
| S2 | Speak numbers for a teaching reason. Say the values a calculation needs, then interpret the result. Leave long decimals and repeated values on screen. | Reviewer |
| S3 | Do not trade accuracy for a good line. A memorable sentence must also be true. | Reviewer |

### Pictures and production

The [visual teaching rubric](visual-teaching-rubric.json), the [publication curation rubric](curation-rubric.json), [ILLUSTRATION_GUIDELINES.md](../ILLUSTRATION_GUIDELINES.md), and [Stage lessons](stage-lessons/README.md) set the visual rules. Motion must explain a change, visuals must encode meaning spatially or quantitatively rather than showing prose slides or HTML tables, and on-screen prose stays minimal.

| Rule | Requirement | Check |
|---|---|---|
| P1 | Keep one set of H.264 decoder settings in a joined video, at level 4.2 or below at 1080p60. | Tool |
| P2 | On a Mac, decode the delivered file with AVFoundation. FFmpeg tolerates problems that stop QuickTime. | Person or Reviewer |
| P3 | Pass the film check, the frame audits, and a full decode, with captions and chapters from the measured speech. | Tool |
| P4 | Bind every review to the exact movie and source hashes, as the existing rubrics require. | Tool |
| P5 | Keep text off other text and off the edges of shapes while anything moves, for any length of time. Text may meet another block or a shape only if it replaces it, becomes it, or is hidden by an opaque tile. A box may re-cut text that it holds. One whole picture fading into another counts as replacing it only while one side is under 25% opacity, so old content must drop below that line before new content reaches it. Fading text under 25% opacity does not count, but full-opacity text under a faint shape does. Only a fully opaque tile hides text. A chart's labels may sit on that chart's own grid. Run `audit-stage-collisions.mjs` and judge each line. | Tool and Reviewer |

### Art direction: make the mechanism memorable

Aim for the clarity and sense of discovery that make a 3Blue1Brown explanation worth watching twice. Give each lesson one visual thesis: a picture or evolving model that helps the viewer reconstruct why the result happens. Choose its objects, composition, color roles, and motion for the topic being taught.

Use the latest compatible Vizmatic capabilities deliberately. Progressive drawing, equation morphs, transformations between representations, and camera moves can reveal a relationship that a static diagram leaves abstract. A familiar visual analogy can remain on screen while its objects acquire technical meaning. Choose 3D when depth helps the explanation. Test a new tool capability in a concrete scene before propagating it across films.

The revised Attention, KV Cache, and Tokenization films are worked examples:

| Reference | What the picture teaches | Apply the lesson elsewhere |
|---|---|---|
| [Attention](stage-lessons/attention.film.mjs), `score`, `softmax`, and `mix` | The same token identities become query/key geometry, a conserved share bar, and scaled value arrows that add to an output. The equation describes a construction the viewer has already followed. | Carry one computed example across representations. Make each new symbol point to an object or operation the viewer recognizes. |
| [KV Cache](stage-lessons/kv-cache.film.mjs), shared-prefix append and copy-on-write | An incorrect append changes one request's shared blocks; the repair preserves both requests' futures on those same blocks. | Run the failure visibly, then repair the same state. Keep ownership, addresses, units, and object identities stable. |
| [Tokenization](stage-lessons/tokenization.film.mjs), greedy WordPiece and Unigram paths | Adding a plausible vocabulary item can break a greedy encoding; changing one path probability can change the winning segmentation. | Change one input, invite a focused prediction where earned, hold an inspectable intermediate state, and let the visible consequence resolve the question. |

Before coding a scene, write its visual question, starting state, operation, visible consequence, and payoff. Name the objects that persist into the next scene. Plan the spoken cue that directs attention to each important change. Read these decisions against the complete narration and the article's core.

Build the picture progressively. Keep known information quiet while the active quantity changes. Calculate displayed operands, intermediate values, geometry, and results from a consistent model, including during transitions. Check the rounded numbers the viewer actually sees. Leave time to inspect the result before the next transformation. Compose for normal playback: show the active operands beside their result, keep labels readable, and introduce dense arithmetic one contribution at a time.

Let a reveal change visibility while the mathematical labels remain true. For example, reveal actual exponentials after subtracting the maximum. Scaling completed exponential values by animation progress produces a different number; it needs an explicit intermediate-state label. A displayed normalizer must match the stated inputs, and a sum of unrounded values must say so when the visible terms are rounded. Update the active operands and derived statistics when the narration performs a repair or a search backup. A footer describing the new answer does not repair an unchanged main picture.

Write titles and captions for the learner. Describe a complete answer, a token, a request, or a parameter by its role in the explanation. Keep authoring terms such as an "owned candidate" out of the rendered picture when they only refer to the animation implementation. Explain memory sharing or resource ownership explicitly when that is the subject being taught.

Keep prediction inputs visible and withhold the answer until its spoken reveal. This includes result labels, totals, plotted result points, completed geometry, and outcome colors. Give the input change and the answer separate measured voice cues. Inspect a frame immediately before each reveal as well as after it.

Review prediction scenes with the delivered subtitles enabled. Find the first caption that gives the answer, including a number or decision requested only on screen. Compare its start in each exported subtitle track with the measured start of the spoken answer. If a caption gives the answer early, add a caption break at the first word of the answer and check the exported tracks again.

Reveal a computed answer after its complete measured result clause. A cue that starts when the voice begins saying a number must keep that number concealed until the clause ends. A setup phrase such as "reserve all input as fresh" cannot anchor the completed reserve amounts. Give those amounts their own result clause. Check the adjacent encoded frames around the clause's end, including the first frame after rounding to the film's frame clock.

A counterfactual that changes one input preserves every other stated input. This includes confirmation, temperature, masks, revision, identity, and retained results. Derive the picture and verdict from the same explicit state. Introduce a separate replay or rewind before changing another input; keep its starting conditions visible so the viewer can explain the different outcome.

Label a desired target, an intermediate construction, and a settled result according to the state currently on screen. When an example changes, show its new premises with the calculation they govern. Give each narrated mechanism an evolving construction: a chapter that moves from vocabulary alignment to checkpoint selection and layer splicing needs visible selection and splice states as well as the original vocabulary picture.

Earn a memorable reveal through insight: a changed variable explains a changed outcome, a counterexample exposes a limit, or a new input tests the mechanism. Choose 3D when depth makes a relationship easier to understand; use camera movement to reveal scale or ownership. Give color and emphasis stable semantic roles. A tool or interview lesson can earn the same clarity through a concrete worked trace and a consequential decision. End by resolving or testing the running example with a visible result.

Review every scene against the exact delivered movie and narration. Record which encoded states were inspected, enlarge dense or ambiguous moments, and keep sampled scene review separate from continuous playback with sound. An older review applies only to its bound export. Ensure that any exported still poster or fallback frame matches its caption cleanly. The reference films remain subject to the same accuracy, production, and human-watch gates as every other lesson.

Check containment and connector layout at every frame of moving constructions. A frame audit must explicitly include these checks, such as `layoutIssues()`; collecting paint issues alone does not cover them. Inspect a moving panel as it passes other objects. A redundant transfer particle can cross its border between otherwise clean sampled frames. Let the moving object carry the explanation and keep any direction marker outside its panel.

### Improve the tools while making the films

Develop Vizmatic when a missing capability prevents a better explanation. Start with the scene's teaching problem, inspect the existing components, and build a reusable primitive when it improves the construction. Give it a concrete lesson that will use it. A new API earns its place through the resulting film.

Separate the computed state from its presentation. A partial vector sum, a sampled category, or a replayed token must retain its identity and agree with every label at arbitrary times, including when frames render out of order. Keep inputs, intermediate states, and the final answer distinct. A result's reveal follows its measured narration cue independently of an input animation.

Pass reusable drawing through the host's checked painter so geometry, labels, focus targets, and containment remain inspectable. Test meaningful behavior: signed and zero contributions, interval endpoints, duplicate identities, illegal histories, unavailable routes, and numerical overflow where relevant. Then inspect the component in the actual lesson at native resolution and during motion. Passing a component test never guarantees visual quality.

Keep a running render on its frozen Vizmatic revision. Integrate and validate a tool change before shipping films that use it, record the new runtime identity, and rerender any film whose computation or appearance changes. Retain the latest usable export and its review until its replacement is accepted.

Keep current review evidence bound to its exact source and export. Follow the [latest-only storage protocol](../docs/render-storage.md): preserve the latest usable film and active inputs while a replacement is being reviewed, then retire superseded attempts after preserving unique source. Never overwrite the review of one export with the findings for another.

Spend the effort required to make the explanation excellent. Token use, scene count, a short script, or a fast first export are not quality objectives. Iterate on composition, meaningful motion, camera direction, pacing, and sound. Explain substantial decisions and remaining weaknesses clearly while the work proceeds.

## Gates

A lesson passes these gates in order. Do not start film work on a script that has not passed gate 1, because a script change after that point repeats the film work.

| Gate | What must be true |
|---|---|
| 0. Quiz | An independent reviewer has checked every question against rules Q1 to Q7, and the fixes are in the article. The mechanical guess rate is near chance. |
| 1. Script | The ledger passes the tool. The closed-book test reaches 80%. The fact check has no open findings. |
| 2. Film | The film compiles against the script, passes the film check, and has no empty-space, blank-gap, or layout findings. Each line of the collision scan has a decision. |
| 3. Review | An independent reviewer views every scene and scores the lesson. It needs 90 on the [quality rubric](quality-rubric.json) and a POST recommendation on the [curation rubric](curation-rubric.json), with no blockers. |
| 4. Delivery | The render passes every production check, including P1 and P2. |
| 5. Watch | A person watches the video at full speed with sound, and records the decision. Tools and agent reviewers cannot satisfy this gate. |

Only a lesson that passes all gates can replace a published video.

## What the checks prove

The tool proves that a decision exists for every heading and question, that the named scenes exist, and that recorded reviews match the current script. It does not prove that a decision is right.

The closed-book test measures narration. A question that the video teaches only on screen can fail it, and a reviewer can note that. It is a strong signal rather than a measure of what a person learns.

Automated checks find layout and encoding defects. They do not find a wrong explanation, a boring scene, or a missing idea. Gates 3 and 5 exist for those.

## The coverage ledger

Run `node videos/check-coverage.mjs --lesson ID --mode canvas` to check a Canvas film against `videos/coverage/<id>.yaml`. Use `--mode stage` for a Stage film. A directory Stage project can provide its own `coverage.yaml`. Use the same mode with `--hash ID` to print the script hash for that edition. When you omit the mode, the command checks the Stage edition if one exists.

```yaml
version: 1
lesson: attention
promise: Explain how scaled dot-product attention lets each token blend information from others, and work it by hand.
framing: [hook, close]
objectives:
  - id: route-then-mix
    can: Say which vectors choose the sources and which vector carries the content.
    scenes: [vectors, mix]
sections:
  - heading: Three views of one token
    status: taught
    scenes: [vectors]
  - heading: Common shape mistakes
    status: article-only
    reason: code-detail
    note: The film teaches the axis rule, and the page lists each shape error.
quiz:
  - n: 1
    status: taught
    scenes: [vectors, mix]
removed:
  - point: The convex hull remark about the output position.
    reason: The next layers move the output anyway, and no objective needs it.
reviews:
  closed_book: { taught: 9, partial: 1, absent: 0, script: <hash> }
  fact_check: { open_findings: 0, script: <hash> }
```
