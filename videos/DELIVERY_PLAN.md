# Plan to bring every lesson video to the standard

This plan takes the remaining 196 lesson videos to the [teaching standard](TEACHING_STANDARD.md). The attention, tokenization, and KV cache lessons are the worked examples. They showed which steps find real problems and what each step costs.

## November 6 published-video review

The [new review](reviews/quality-review-2026-11-06.json) covers all 199 published
movies and 1,794 authored scenes. Reviewers read every delivered narration and
inspected encoded narrative checkpoints in every scene, with enlarged opening,
mechanism, and payoff frames. The record binds the actual published movie bytes,
inspected images, narration, timeline, and review-time sources. The three
handcrafted references also have a [detailed analysis](reviews/handcrafted-reference-2026-11-06.json).

These are provisional editorial assignments, not publication decisions:

| Track | Lessons | Next work |
|---|---:|---|
| Correct | 80 | Preserve the worked model; fix individual findings and improve targeted scenes. |
| Extend | 66 | Add missing core teaching while retaining useful constructions. |
| Film | 42 | Rebuild the identified scenes so objects and motion explain the mechanism. |
| Split | 8 | Plan companion coverage for a topic broader than its current film. |

The references account for the other three movies. Thirty-seven lessons have
high-priority findings. This review does not complete quiz certification,
coverage ledgers, an independent primary-source fact check, continuous playback
with sound, or the human-watch gate. Those checks can change a track assignment.

Keep the strong existing work. Transformer, Linear Algebra, Clustering/PCA,
Quantization, RoPE, and several systems case studies already use persistent
computed examples and consequential counterexamples. Reuse the
[reference-derived art direction](TEACHING_STANDARD.md#art-direction-make-the-mechanism-memorable)
to improve the specific weak scenes rather than imposing one visual template.

The first source changes apply that direction to recommendation filtering and
the state-space inclusive prefix scan. Eight other lessons have source repairs
for displayed arithmetic, reduction ownership, cue alignment, or the closed-loop
arrival mechanism. All ten changed scenes have bounded encoded previews using
the existing measured narration. The
[pilot evidence](reviews/quality-pilots-2026-11-06.json) distinguishes source
previews and scene clips from complete exported lessons. Narration is preserved.
No published movie is replaced by these drafts.

Prioritize the recorded accuracy findings, then the missing core mechanisms in
high-priority lessons such as Learning Theory, Trees, Validation, Hybrid Search,
the Support Bot, and the ETA and classifier capstones. Finish each lesson's
quiz/script gates before extending its film. Complete the export and review
gates before publishing a replacement.

## Where we start

These are historical planning figures from the October review, using
`videos/lessons`, `videos/reviews/curation.json`, and the sampled reviews below.
The curation catalog is dated October 28. Its decisions are bound to particular
movies: 31 of its 199 movie hashes differ from the November 6 published manifest.
Keep these estimates separate from a fresh review of the delivered collection.

| Measure | Remaining 196 lessons |
|---|---|
| Published video | 22.2 hours, median 6.7 minutes |
| Median script | 941 words |
| Median article (reference edition) | 5,436 words, 11 `##` sections |
| Mastery questions | 1,906 |
| October curation decision | 23 POST, 173 QUARANTINE |
| Median curation score | About 85 of 100 |

**The sampled quizzes gave answers away.** An independent reviewer rated 186 questions from 20 sampled lessons and found no wrong answer key in that sample. The reviewer would keep 5% as written, fix 87%, and replace 8%. The main problem is that a test-wise reader can find the answer without knowing the topic. A script that looks only at option wording gets 39.9% right across all 1,936 questions, against 25% for chance. The learner passes at 75%.

**The scripts vary widely.** In the same 20 lessons, the narration teaches 66% of the current quiz. Only 7 lessons reach 80%, and the range is 0% to 100%. This measure is narration only, and it uses the quizzes that need repair, so treat it as a first estimate.

**A review found real errors in the three worked examples.** Independent fact checks found 4 blockers and 20 important findings in the new scripts, a second pass found 2 more important findings, and the quiz review found errors in the articles. Every number was right. The errors were overclaims, a broken example, and claims true for only one system. The automated checks could not have found them.

**A shorter script is not a better script.** The first rewrites of the three worked examples taught 10 of 30 quiz questions. The scripts they replaced taught 28 of 30. Those older scripts had also scored 91 to 92. The new visuals and voice were better, and the teaching was worse.

**Film review finds what tools cannot.** Each worked example took three or more independent review rounds. The first rounds scored about 71 to 76 on both rubrics, with 15 to 25 blockers each. Automated checks passed all of those films. The blockers were pictures that disagreed with the voice, numbers drawn before they were spoken, and titles that were false on screen. Reviewers also missed false titles for several rounds, so the standard now has rule A8 and a listing method for it.

## Principles

- Repair the measure first. Fix a lesson's quiz before you score its script.
- Audit before rebuilding. Some scripts are already strong and need only corrections.
- Keep what works. A complete script with weak visuals keeps its teaching points.
- Rebuild visuals only where motion teaches something. A film for its own sake is a cost and not a benefit.
- Publish in batches, and replace a published video only with a video that passes every gate.

## Phases

### Phase 0: Set the standard and prove it on three lessons

Land the standard, the coverage tool, the quiz audit, and the three rebuilt lessons. A person watches all three and decides whether the standard produces the videos we want. **Exit:** the three lessons pass gates 0 to 5, and any change to the standard is made.

### Phase 1: Repair every quiz

Review and repair the 1,906 questions, section by section, using rules Q1 to Q7. A second reviewer verifies each section. This phase needs no video work, and the site improves as soon as it deploys. Expect article corrections, because the reviews find them. Concept atlas hashes need rebinding with each batch.

**Exit:** every quiz has a recorded review, no question has an open finding, and the mechanical guess rate from `scripts/audit-quiz-cues.py` falls from 39.9% to about 30% or less.

### Phase 2: Audit every script

For each lesson, write the coverage ledger, run the closed-book test against the repaired quiz, and fact-check the script. Assign each lesson to a track:

| Track | When it applies | Work |
|---|---|---|
| A. Correct | The script teaches the topic and the visuals work. | Fix the findings and render again. |
| B. Extend | The script has gaps and the visuals can carry the additions. | Add the missing teaching, and extend the canvas lesson. |
| C. Film | The script has gaps or weak visuals, and motion would teach the mechanism. | Write a stage film, like the worked examples. |
| D. Split | The topic does not fit one video at a comfortable pace. | Plan a named series, then apply A, B, or C to each part. |

Writing a film is not the default. It suits mechanisms, geometry, and calculation. Tools, procedures, and interview preparation may be better served by track A or B.

**Exit:** all 196 lessons have a ledger, a closed-book result, a fact check, and a track. This phase replaces the estimates below with real counts.

### Phase 3: Pilot the hard cases

Take 10 lessons through every gate, chosen to be hard for this approach: Docker, Git, an evaluation lesson, RAG, an agent lesson, an interview lesson, a capstone, plus three from tracks A and B. A person watches all 10. **Exit:** the pilot sets the real cost per track, and the standard and tools are updated from what it finds.

### Phase 4: Deliver in batches

Work in the roadmap's section order, in batches of about 15 lessons. Start with the sections where motion teaches most and where the script audit found the largest gaps. A proposed order is fundamentals, training, retrieval, system design, agents, LLMOps, foundations, preparation, capstones, then interviewing. Traffic data should change this order if we have it.

Each batch does this:

1. Confirm that the quiz and script gates still hold, because articles can change.
2. Write scripts and films, each lesson in its own stream of work, with shared kit changes reviewed once.
3. Run independent review on every scene.
4. Render and run every production check, including AVFoundation on a Mac.
5. Have a person watch, as agreed in the decisions below.
6. Publish the batch to R2 and update the manifest. The publisher requires the complete collection, so lessons not in the batch keep their published movies.
7. Deploy the site.

### Phase 5: Close out

Check the lessons as one course: prerequisites taught where later lessons assume them, one running vocabulary, and consistent notation. Retire the canvas sources that films replaced, then remove tools that only they used.

## What it costs

These are estimates from this work, for planning only. The pilot replaces them.

| Step | Measured on the worked examples | Across 196 lessons |
|---|---|---|
| Quiz review with rewrites | About 93,000 tokens per lesson | About 18 million tokens |
| Second quiz check and closed-book test | About 50,000 tokens per lesson | About 10 million tokens |
| Fact check | About 200,000 tokens and 15 minutes per lesson | About 40 million tokens and 49 hours, less when run in parallel |
| Script rewrite | Not representative, because of the shared context in this session | Set by the pilot |
| Film writing | Set by the worked examples | Only for track C |
| Independent film review | About 500,000 tokens per round, for three or more rounds on a new film | Only for track C. Set by the pilot |
| Render at 1080p60 | 2 to 6.5 times the video's length, depending on machine load. A review finding that changes the film needs a new render. | At 15 minutes per video: 100 to 320 hours on one machine |
| Person watching | The video's length | At 15 minutes per video: about 49 hours |

Two things need a plan before Phase 4. Rendering needs more than one machine or a lower frame rate for track A and B lessons. Watching needs an agreement, because it is the largest cost that no tool can reduce.

## Risks

| Risk | Control |
|---|---|
| Parallel writers produce lessons that all look alike. | Track assignment, and the curation rubric's visual review. |
| Agents write confident errors. | An independent fact check, tied to the script hash, for every lesson. |
| Reviews drift from the videos they describe. | Hash bindings on scripts, movies, and sources. |
| A rewrite loses teaching. | The ledger lists each removed point, and the closed-book test catches the rest. |
| The published collection breaks mid-way. | A published video changes only after it passes all gates. |
| The article changes after review. | The ledger tool fails on changed headings, and the atlas fails on changed sources. |
| The third-party voice service changes. | Keep the speech cache for a batch, and render a batch together. |

## Decisions needed

1. **Long lessons.** The three worked examples run about 21 to 24 minutes. Should a long lesson stay one video with chapters, or become a named series? One video needs no site change. A series needs the manifest and player to support several videos per article.
2. **Who watches.** Gate 5 requires a person. Does a person watch every video, about 49 hours, or the pilot plus a sample of each batch, with independent reviewers for the rest?
3. **Whether every lesson needs a film.** This plan says no, and it lets the audit assign tracks.
4. **Publishing.** Should the repaired quizzes go live before the videos? They can, and they help learners right away.
5. **Captions.** Captions are paragraphs of up to 320 characters. This was a deliberate choice, and a reviewer cost it one production point, because common practice is two short lines. Should captions stay as paragraphs, or become short cues?
