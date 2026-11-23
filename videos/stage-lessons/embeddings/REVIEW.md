# Embeddings review

All 23 scenes are rebuilt and registered in index.mjs. The rating is 4 of 5 by REBUILD.md. The recurring bank example distinguishes a stored row from occurrence states. Separate narrated fixtures retain their names and coordinates in the same visual frame.

## Validation

The final command was `nice -n 15 node tools/stage-check.mjs embeddings`. It compiled 23 of 23 scenes with 1595 seconds of estimated timing. It found no narration change, error, warning, small text, or empty-space finding. The film checks covered 171 rest moments and 47,850 motion frames. The final log is /tmp/leetllm-rebuild/embeddings/check-integrated-final.txt.

The source was formatted twice. The second pass changed no file. Contact sheets located weak pictures. Full-size 1920-by-1080 source stills adjudicated beat endings and result holds. Transition samples covered sliding character spans, shared translation, document rotation, and query repair. The review repaired early numerical reveals, stale ranking verdicts, low count labels, and lines crossing recurrent-state notes.

The current stills are under /tmp/leetllm-rebuild/embeddings/stills/. The whole-lesson contact sheet is /tmp/leetllm-rebuild/embeddings/lesson-sheet.png. Scratch storage is 166 MiB, below the 300 MiB working limit.

## Component requests

These requests are report-only. No shared file was changed.

- An equal-scale vector plane with adaptive range, weighted tip-to-tail legs, and labels attached to their vectors. The local drawing is in parts.mjs.
- A sliding token or character span that stays behind opaque chips and follows measured chip bounds. Local drawings are in scenes/predictive-window.mjs and scenes/subword-components.mjs.

## Recipe and tool limits

A scene cannot be checked before registration through the documented workflow. A temporary local draft selector allowed checks before acceptance. The final index contains only static imports and the accepted scenes.

The empty-space gate can accept an uninformative grid as content. Full-size review was necessary to strengthen the initial subword and recurrent-state pictures.

The documented stage tools do not expose the storage-budget option required by the repository storage guide. Output remained within a measured local 300 MiB cap.

The sandbox rejected the requested priority adjustment with `nice: setpriority: Operation not permitted`. Every shell command still used the required nice wrapper and ran sequentially.

## Recorded edition

The stage film uses the published performance of “Words as Points and Context as Motion.” The published MP4 has SHA-256 `8b2848faea14c893319df20084615f30ad47b8d81abfb497735a30f56c03c1b5`. The published captions matched the original 69 beats in order. The recording edits use word times from acoustic forced alignment of the original audio to those captions. The adapter checks the recording hash and the text of each beat before it extracts audio.

The revised script drops three claims. A factorization limits the rank of the score matrix to the embedding width. Masked pooling excludes padding from the numerator and counts only valid positions in the denominator. Translating all vectors together preserves their differences and can change their cosines. The lesson makes no assumption about what this does to a downstream task.

Two independent reviewers checked the nine earlier factual findings and the ten mastery questions. The corrected script hash is `38f30134e1265b63`. A separate viewer watched the opening passage with captions. The viewer followed the two arrows but found that both labels still described their starting row after they separated. The labels now show the computed occurrence coordinates. The finance sentence includes the clue “to deposit money.” On a second reading, the viewer identified both computed endpoints and asked which coordinate belonged to each axis. The opening now pairs an upward arrow with river and a rightward arrow with finance.

From the repository root, set `EMBEDDINGS_BASELINE_MP4` to the matching published recording. Select a fresh output directory for `FILM_OUTPUT`.

```sh
node videos/render.mjs --stage --lesson embeddings --output "$FILM_OUTPUT" \
  --provider retained-recording --tts-script videos/stage-lessons/embeddings/reuse-audio.py \
  --quality standard --fps 30 --width 1920 --workers 2 --threads 4 --no-manifest
node videos/stage-lessons/embeddings/captions.mjs \
  "$FILM_OUTPUT/embeddings/timeline.json" "$FILM_OUTPUT/embeddings/embeddings"
```

The second command creates brief captions. Each visual cue starts a new caption at the corresponding spoken word. Its text and timing match the recording supplied to the renderer.


## Batch rendering status

The editor stopped the full encode when production switched to source review. The accepted film remains available for playback. Four chapters finished before the stop. The retained opening comparison predates the final axis-label change. The final opening, full movie, chapter transitions, and matching captions still need a batch render and playback review.

All 69 extracted beats decoded successfully. The measured recording spans 26 minutes and 15.83 seconds with the intro and scene holds. The cue-aligned caption source produced 511 captions whose combined text exactly matched the revised narration.
