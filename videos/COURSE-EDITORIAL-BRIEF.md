# Edit one LeetLLM lesson film

Read the current chapter script, the drawing code, and the companion article. Inspect the existing movie at the opening, at each chapter's main demonstration, and at the close. Use the chapter markers to find those moments. Write down the one thing the viewer should be able to figure out from each demonstration. Keep the parts of the film that already do this well.

## What works in Wolf, Toto, and Sirius

- **Wolf changes the question while the evidence stays fixed.** Twenty errors answer a rate question. The same twenty errors leave a causal question open. Later, the film holds the detector and traffic volume fixed, changes incident prevalence, and shows why pages rise even as false alerts fall.
- **Toto lets the viewer inspect the evidence first.** A cursor freezes one forecast at a capacity line. Later, two panels keep the same readings and change only their pairing across time. The paths appear after the question, so the viewer can see why the chance of exceeding capacity changes.
- **Sirius carries a reference through the cut.** A single deployment timeline forks after an observed history. A cursor then exposes the daily baseline's missing lookback. A common scale shows the two errors that cancel in the geometric mean. The closing decision follows from the evidence on screen.
- **The picture carries the calculation.** Rulers, thresholds, endpoints, grids, and stable colors let viewers keep their bearings. Motion changes a value, relationship, or state. A readable hold gives the answer time to register.

## How to edit this film

1. Keep the official introduction. Cut directly to an object doing something concrete in the lesson's domain. Establish what the viewer can see before naming the abstraction.
2. Identify the specific beat where the film loses attention or where a viewer cannot follow the mechanism. Improve at least one important visual sequence for this lesson. Keep a reference fixed while one thing changes. Move the object, show the intermediate states, and settle on the result.
3. Keep the viewer's question open until the answer lands. Check the title, labels, colors, ghosted marks, captions, and end-of-beat preview for information that leaks the answer. Ask for a prediction where it helps compare outcomes. Elsewhere, show and explain.
4. Make the main object large and use color consistently for the same roles. Attach labels to their marks. Put short labels and numbers on the picture. Let the voice guide attention and explain the reasoning. Check movement and the settled picture at phone scale, including the caption region.
5. Use the current film's Vizmatic implementation. Reuse the lesson's checked layout, geometry, measurement, and cue helpers. In the existing Canvas host, use the chapter and beat clock, deterministic drawing, and phrase cues for measured reveals. When two things refer to one object, give them a common position or transform. Leave shared renderer changes to the coordinator.
6. Check the result against its implementation, article, or primary source. Compute any new displayed values from the model. Keep the units, comparison window, assumptions, and distinction between measured and illustrative values clear. Teach security mechanisms through defensive examples.
7. Preserve the lesson's complete teaching scope and course voice. Change speech when it improves a specific passage or corrects a claim. Keep unchanged speech intact so the renderer can reuse those recorded takes. If you change a cue phrase, check every use of the old phrase and update the authored cue to match. Close on an outcome, a test the viewer can repeat, or a concrete handoff.

Read [the teaching standard](TEACHING_STANDARD.md), [the existing editor guidance](EDITOR_PROMPT.md), and the sections of [the authoring guide](AUTHORING.md) that apply to the film. Review the available movie and compare the selected source when the local movie comes from another revision. Deliver changes to the current full-length source. Use the assignment's structured response as the review record, with chapter-by-chapter notes, the exact weakness you addressed, the changed files, the expected visual payoff, and the checks you actually ran. A sampled frame, a source check, and continuous playback with sound verify different things.
