# Direct one lesson film

Keep the official animated LeetLLM opening. Cut straight from the logo to a concrete domain-native action the viewer can follow. In Conformal Prediction, a train enters from the left while the forecast board asks "Would 8:42 count?", keeping both ends of the arrival window fixed so the viewer can judge the arrival directly. Let the audience see the evidence before revealing the answer.

Choose a small example that serves this lesson's audience. Domain-native objects, familiar analogies, physical models, and playful settings can all work. Connect familiar objects to the technical mechanism and keep the few values needed for a comparison in view. Avoid unrelated SRE or IAM roleplay that requires its own explanation. Adjacent films can use different examples, provided their handoffs accurately describe the change.

During automated visual review, mute the review player before opening a film or excerpt. Check speech and effects against the picture using decoded stereo samples and a timed transcription, while preserving narration, music, and effects in the export. This inspection is separate from the required complete human watch with sound in `TEACHING_STANDARD.md`.

Play the first few seconds after the logo with captions hidden and confirm that the viewer can point directly to what changed. In Learning Theory, a second duplicate training sample highlights the danger of leakage across splits before the narrator names the generalization gap. If the opening looks static across several captions, show how the data arrived, then restore captions and compare the visual reveal with the spoken word timestamp. For a close call, the [motion review command](full-directors/README.md#review-motion-in-an-edited-excerpt) tracks moving objects against stationary references.

When a number or label moves across the frame, pause partway through the transition at phone width. In Tool Protocol, when a `01:42` timestamp moves from the clock to a log card, hide the readout until the moving stamp clears it so adjacent digits never merge into `01:01:42`.

## Three ways into a lesson

**Scoring a next token.** Cut "We will evaluate a model on a held-out corpus" and any slide of metric names. Show "The cat sat ___" with the last word covered and draw the model's probability strip underneath. "The longest bar belongs to *on*, with half the probability mass. Which word actually came next?" Reveal *on* and carry its half of the bar directly into the log-loss calculation before naming cross-entropy.

**A page fault.** Cut the high-level tour of the operating system. Open with a cursor writing a single byte to a fresh, writable anonymous page. "Where does this byte go?" Follow its virtual address to an empty page-table entry and hold there. Show the kernel allocate a zeroed physical page and install the mapping, then replay the write so the byte lands while keeping the write-permission flag visible beside the mapping.

**A capacity forecast.** Replace apologetic disclaimers such as "This is an estimate and the result may differ" with a direct picture of the decision. Keep a capacity threshold at 128 and draw the forecast curve to its peak. "The point forecast reaches 122." Open the prediction band across the line. "Its upper edge reaches 132, showing the hours that risk running short."

## Carry the example through the cut

**A decoder chooses a word.** Write "The dog" followed by two empty slots, paired with clean visual geometry of competing token paths. When the decoder picks *ran*, dim the alternative branches, then split the leading path from 42% into two continuations at 21% each while *slept soundly* remains at 36%, giving the viewer a beat to spot the new winner.

**A fixed compute budget.** Open close on a weight matrix of five columns across and twenty tokens down. "At ten weights wide, how many token rows fit in the same budget?" Hold the array still, then split its upper half beside the lower half on "ten rows", carrying three highlighted entries with the moved block so the viewer tracks the exact elements into the reshaped tile.

## Make the cut

Read the article and watch the previous cut. Keep passages that teach their mechanism directly, vary spoken rhythm naturally like a great technical lecture, and explain why before introducing edge-case caveats. Time a deliberate pause after visual evidence arrives, check prediction beats with captions enabled so no subtitle spoils the answer early, and let each result land before cutting to the next shot. See the [authoring guide](AUTHORING.md#cut-from-the-brand-animation-to-the-first-teaching-picture).

Finish the central example before touring variants. Be generous with the derivation, intermediate states, and interpretation. State an assumption where the calculation needs it; remove routine qualifications that interrupt a result without helping the viewer. Questions should reveal relationships, without a target count or a forced guessing beat in every scene.

Explore Vizmatic's progressive constructions, morphs, camera moves, and geometric objects when they clarify the lesson. Make the film beautiful through composition, purposeful color, legible typography, and well-timed changes. Preserve recognizable objects through transformations and let the final construction remain visible long enough to understand. Check the same example against the current article and reader chapter before calling the revision complete.

Play each passage at 480 pixels wide with captions on and pause while an answer is open to verify that the decisive visual object is unmistakable. In Gradients, a green trace reaches five and two blue blocks reach six; label the adjustable block "Weight" right beside the geometry and hold still long enough for the viewer to see which way it shifts.

Check whether a viewer could guess an answer from layout cues alone. In the queue and stack comparison, push item A first and item B second while keeping A below B in both containers, then pause before popping so arrival order alone distinguishes FIFO from LIFO.

Let the picture carry dense arithmetic while the voice guides attention. In Linear Regression, trace a signal across the 100-token row so `118 ms` lands on the plot as the five measured points appear, then leave the sixth slot open long enough for the viewer to project the trend visually.

Hide intermediate totals and replay single-variable changes cleanly. In FlashAttention, lowering a value column from 40 to 4 shrinks that bar while its attention weight stays fixed, making the shift in the weighted average immediately visible.

Let the viewer hear a real domain event before explaining it. In Voice Agents, play a brief spoken query interrupted mid-clause by a user correction, keeping the remaining audio waveform visible in the buffer so the viewer hears why barge-in detection drops stale playback.

Read the closing line of each beat aloud, and end directly on the settled result whenever a closing clause merely repeats a boilerplate caveat. In Reward Modeling, hold an 80% screening line steady while comparing 92% on the training split against 64% on held-out answers.

Use the course typography, colors, and narrator, keeping music soft and using sound cues only to mark meaningful state transitions. Inspect the frame immediately before and after every changing calculation to verify that highlighted objects, values, and labels agree, and verify that exported static poster stills remain faithful to captions.

For a before-and-after clip, choose the same teaching event in both editions, keep question, evidence, and spoken answer together across equal 15 to 30 second excerpts, note timestamps and scene IDs, and summarize in one clear sentence what the viewer can now see or hear.
