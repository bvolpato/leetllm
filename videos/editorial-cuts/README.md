# Build a revised passage

Each lesson directory contains a Vizmatic film in `cut.ts` and a `cut.json` file. Set `sourceSha256` to the SHA-256 digest of the reviewed MP4. Specify the first frame to replace with `start` and the first frame to keep with `end`, both in seconds from the start of the full movie. The builder rounds both times to the nearest frame. Give the Vizmatic film that duration and match the original picture dimensions.

```json
{
  "sourceSha256": "<SHA-256 digest of the reviewed MP4>",
  "start": 75,
  "end": 95
}
```

For several passages, keep the digest and replace the two time fields with a `passages` array. Each entry has `start`, `end`, and `file`, the name of its film source. List passages in playback order.

Install the locked dependencies in `videos` with `npm ci`. Install FFmpeg and uv. Run the builder from the repository root. Keep the original MP4 in its own directory. Place its matching VTT or SRT file alongside it with the same basename.

```sh
uv run videos/editorial-cuts/build.py videos/editorial-cuts/LESSON ORIGINAL.mp4 OUTPUT_DIR
```

The build writes the complete movie and a comparison reel for each passage. Each reel plays the original excerpt and the revised excerpt with sound. Enable the subtitle track to see the edition labels and English captions. The complete movie keeps the original audio, subtitles, and chapters. The builder copies complete groups of pictures outside each cut and encodes the partial groups that meet its boundaries.

To build several lessons on one machine, supply one command per line to `xargs -P 2 -I CMD sh -c CMD`. Each cut uses one Vizmatic render worker.

## Find the matching movie

The course playback manifest lists an immutable movie URL and caption URL for each published edition. For example, download the published A/B Testing input from the repository root.

```sh
lesson_id=ab-testing
manifest=web/src/generated/lesson-videos.json
mkdir -p /tmp/leetllm-inputs
jq -er --arg id "$lesson_id" '.videos[] | select(.lessonId == $id) | .url' "$manifest" |
  xargs curl -fL -o "/tmp/leetllm-inputs/$lesson_id.mp4"
jq -er --arg id "$lesson_id" '.videos[] | select(.lessonId == $id) | .captions' "$manifest" |
  xargs curl -fL -o "/tmp/leetllm-inputs/$lesson_id.vtt"
uv run videos/editorial-cuts/build.py "videos/editorial-cuts/$lesson_id" "/tmp/leetllm-inputs/$lesson_id.mp4" "/tmp/leetllm-output/$lesson_id"
```

## November 10 editorial batch

The [batch manifest](batch-2026-11-10.json) records a decision for each lesson. Use the entry for the lesson ID. All source paths start at the root of the course checkout. The [earlier review](../reviews/editorial-2026-11-10.json) identifies the edition each editor watched.

| Action | Inputs for the batch |
| --- | --- |
| `build-edited-source` | Use the listed film module and narration. For a module under `videos/stage-lessons/`, use the [stage renderer](../stage-lessons/README.md) with `--stage --lesson ID`. For a module under `videos/films/`, use the [course renderer](../README.md) with `--lesson ID`. |
| `apply-recipe-to-pinned-input` | Supply the listed movie and captions to the selected-edition command below. It checks both hashes and applies the passage to the original picture. |
| `keep-selected-edition` | Supply the listed movie and captions to the same command. It checks both hashes and keeps the reviewed picture. |

When an entry includes `narrationDraft`, the script is for a future picture edit. Use the narration or captions specified by the batch action.

A `url` identifies a published file. An `archivePath` identifies a reviewed file relative to the editorial media archive. Supply that archive separately and use the digest to locate the same bytes if its folder layout differs. The batch requires archived masters for 72 retained films. Ten of those films also need their archived captions. Check archive availability before scheduling the batch.

### Deliver the selected picture with the course narrator

Run this command from the repository root with the files identified by the lesson's batch entry. It writes `master.mp4`, `master.vtt`, and a narration receipt in `OUTPUT`.

```sh
uv run videos/tools/selected-edition.py LESSON_ID MOVIE.mp4 SUBTITLES.vtt OUTPUT
```

If you have the source movie's generation receipt, pass `--source-receipt PATH`. The command reuses the original recording when the receipt binds the exact input movie hash to the configured provider, voice and rate. For an unverified recording, it uses the shared [course narration profile](../narration.json) and speech cache. It preserves the original opening chime and replaces lesson speech on the selected picture. Adjacent subtitle fragments can share one spoken sentence. The captions follow the measured word timings when the new voice needs more room within that sentence.

## Deliver an editor's cut

Use `--submissions` to encode one editor's completed cut. An editor submission includes every reachable source file under both of the film's Stage and Canvas directories. A Stage film that imports a Canvas scene binds that scene's bytes as well. Each entry in the live ledger's `lessons` array supplies the lesson `id`, the actual `editorThread`, its production `sourceFingerprint`, and the SHA-256 map of its film-owned `files`. The renderer uses the course narrator, checks the complete production inputs and runs its normal picture, audio, caption and playback checks.

```sh
uv run videos/tools/rewrite-cohort.py freeze --lesson "$ID" --submissions "$SUBMISSIONS" --stage-root "$STAGE" --canvas-root "$CANVAS" --freeze "$FREEZE"
uv run videos/tools/rewrite-cohort.py render --lesson "$ID" --submissions "$SUBMISSIONS" --stage-root "$STAGE" --canvas-root "$CANVAS" --freeze "$FREEZE" --flat "$FLAT"
```

When shared production dependencies have changed since the cut was submitted, the ledger supplies the original receipt in `submissionFile` and its SHA-256 digest in `submissionSha256`. The tool binds the editor identity, original production fingerprint, film files, and narration to that receipt. It freezes the current production fingerprint separately and checks it again at render time.

To reproduce the original runtime for a cut submitted before editor mode was available, add `--submitted-root "$ORIGINAL"` to both commands. This checkout must reproduce the original editor fingerprint. The tool verifies that the production checkout differs only in the delivery renderer and that it uses the renderer from the current tool checkout. The freeze records both fingerprints. To compile a Stage cut on estimated timing, run `node videos/render.mjs --stage --lesson "$ID" --editor-submission --validate`.

## Deliver one reviewed film

Each approved film can enter the flat review folder as soon as its editor and independent reviewer finish. Set `REVIEWS` to the live review ledger, `STAGE` and `CANVAS` to the reviewed runtime worktrees, and `FLAT` to the review folder. Choose a separate `FREEZE` file for each edition. For example, use these commands to publish Estimation at `016-estimation.mp4`.

```sh
uv run videos/tools/rewrite-cohort.py freeze --lesson estimation --stage-root "$STAGE" --canvas-root "$CANVAS" --reviews "$REVIEWS" --freeze "$FREEZE"
uv run videos/tools/rewrite-cohort.py render --lesson estimation --stage-root "$STAGE" --canvas-root "$CANVAS" --reviews "$REVIEWS" --freeze "$FREEZE" --flat "$FLAT"
```

The renderer checks the selected review again before publishing. A retry reuses the verified captioned master. When a reviewer approves a revision, use its new freeze with the same flat folder. The renderer atomically replaces its own prior edition and preserves the previous master in the sibling work directory. Each film keeps its course number regardless of when it finishes.

## Build the course rewrite after editorial review

The [rewrite roster](rewrite-cohort.json) lists the 199 films in viewing order and selects the Stage or Canvas edition for each. Each route uses its editable picture and spoken script. A review records the SHA-256 digests of the film files, the editor thread, and a separate reviewer thread. The older batch and its published MP4s remain available for comparison.

Use two worktrees of the reviewed course revision. Install the [Stage runtime](../stage-lessons/README.md#build-a-directory-project) in one and the locked Canvas dependencies in the other. Set `STAGE` and `CANVAS` to those worktrees. The following check resolves the actual picture, soundtrack configuration, source article, and import dependencies for every film. It does not produce media.

```sh
uv run videos/tools/rewrite-cohort.py check --stage-root "$STAGE" --canvas-root "$CANVAS"
```

After all films pass independent editorial review, set `REVIEWS` to the review ledger. Its `lessons` array contains one entry per film with `id`, `editorThread`, `reviewerThread`, `sourceFingerprint`, and `files`. The fingerprint binds the production source and installed Vizmatic runtime that the editor validated. The file map binds repository-relative paths to their SHA-256 digests. Set `FREEZE` to a new JSON file, then record the reviewed inputs and installed runtime fingerprints.

```sh
uv run videos/tools/rewrite-cohort.py freeze --stage-root "$STAGE" --canvas-root "$CANVAS" --reviews "$REVIEWS" --freeze "$FREEZE"
```

To start rendering that edition, set `FLAT` to a new destination on the same filesystem as its parent. The command checks the complete freeze, builds up to four 1920 × 1080 films at 30 fps, and publishes each verified MP4 in course order. Each review copy includes the original chapters, the course narrator, and selectable English captions. The packaging check compares the encoded picture and sound before and after adding the caption track. Rerun the command with the same arguments to resume. Logs, captions, verification receipts, and reusable speech live in a sibling directory. Use a new freeze and output directory for a later revision.

```sh
uv run videos/tools/rewrite-cohort.py render --stage-root "$STAGE" --canvas-root "$CANVAS" --reviews "$REVIEWS" --freeze "$FREEZE" --flat "$FLAT"
```
