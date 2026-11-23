# Full-length directed lessons

Each lesson has its own `lessons/<id>/film.mjs` and `narration.json`. The film module supplies the title, the teaching picture and the example checks. The narration file lists teaching chapters in playback order. Each chapter has an `id`, a `title`, a `sourceChapters` array of original curriculum chapter IDs, and a nonempty `beats` array. Each beat has a unique `id`, spoken text in `say` and a nonnegative `hold` in seconds. The MP4 has a four-second opening followed by one chapter for each authored teaching unit.

## Find the source for a selected film

The [selected edition index](./selected-editions.json) lists all 199 films by their number in the local collection. Each entry gives the lesson ID, the Git commit used for that edition and the SHA-256 of its finished MP4. To read a film's narration, use its `sourceCommit` and `id` as shown here for film #019. The same directory contains the code that draws the lesson.

```sh
git show 21065aedf097c5186b601f5655116d76b3992f19:videos/full-directors/lessons/neural-networks/narration.json
```

Films #118 (Distillation) and #131 (Human Approval) also have a correction to the encoded audio. If you have the original MP4 identified by `audioCorrection.originalSha256`, run the following command with a new output path. It checks the original and corrected movie hashes.

```sh
node videos/full-directors/apply-audio-correction.mjs original.mp4 corrected.mp4
```

## Inspect the pictures

Install the pinned video dependencies as described in [CI compatibility](../CI_COMPATIBILITY.md). From the repository root, run the check with an absolute JPEG path in your review directory.

```sh
node videos/full-directors/check.mjs <id> --sheet /absolute/review/sheet.jpg
node videos/full-directors/check.mjs <id> --chapter <chapter-id> --stills /absolute/review/details
```

The first command paints early, changing and settled states from every chapter. Each page holds up to four chapter rows. Read the first page at the requested path and subsequent pages at `sheet.p02.jpg`, `sheet.p03.jpg` and so on. The chapter command accepts an authored chapter ID or a one-based chapter number. It writes full-resolution JPEGs from every beat of that chapter. Both commands use the production painter at 1920 × 1080. The default silent preview estimates speech at 2.5 words per second. Add `--measured` and set `LEETLLM_SPEECH_CACHE` to inspect the checked word events of existing course recordings.

The CLI prints one JSON object. With `--sheet`, it also writes the same object to `sheet.json`. Its `pages` array lists the absolute JPEG paths. Its `chapters` array follows narration order. Each row contains `id`, `title`, `chapterIndex`, `sourceChapters` and `samples`. Each sample has a `phase` (before, after or settled), `beatId`, zero-based `beatIndex`, zero-based `bodyFrame`, movie time in `seconds`, JPEG `path`, and a `rect` containing image coordinates `x`, `y`, `width` and `height`. Times include the four-second opening. Inspect the actual picture to judge readability and instructional value.

### Review motion in an edited excerpt

Before recording your editor choice, play the matched movies from the opener review handoff. The optional `review-motion.mjs` command checks an object you choose in either movie. Use `media.before.movie.path` or `media.after.movie.path` from the ready record as the clip, and its `window[0]` as `--clip-start`. For a complete movie, the default clip start is frame zero.

Use FFmpeg and a local Vizmatic build that exports `measureRegionChange`. The course's pinned package predates that export. To use a separate build, set `VIZMATIC_BUILD` to a checkout containing [Vizmatic PR 149](https://github.com/bvolpato/vizmatic/pull/149), such as commit `5e4a4f0d3a94d42d6a3f69eb41ff1230e8aa0fa3`. Run `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm build` there. The option below reads the public export from that build. If the installed package already exports it, omit `--vizmatic-build`.

These examples use the #046 opening excerpt. The train enters from the left while the forecast board holds the prediction question.

```sh
node videos/full-directors/review-motion.mjs "$CLIP" --clip-start 120 --frames 120:240 --region 0,169,480,37 --expect move --vizmatic-build "$VIZMATIC_BUILD"
node videos/full-directors/review-motion.mjs "$CLIP" --clip-start 120 --frames 120:240 --region 218,26,228,84 --expect hold --vizmatic-build "$VIZMATIC_BUILD"
```

The command compares each decoded picture to the first frame of the requested interval. Frame numbers are absolute film frames, and the end is exclusive. Give the rectangle as `x,y,width,height` in the 480 × 270 review picture. Choose an area clear of embedded captions and unrelated motion. The decoder selects only the video stream. Review the English sidecar separately to check a spoken cue.

The JSON result gives the first frame that crosses the threshold, its changed bounds, and the peak changed pixel count. By default, at least 12 pixels must each differ by more than 12 levels in an RGBA channel. Adjust `--min-pixels` and `--tolerance` against a known still passage if needed. Use a new interval to test a deliberate hold. Exit status 0 means the chosen expectation passed, 1 means it failed, and 2 means the command could not measure the interval.

## Check an encoded opener splice

Use `review-splice.mjs` to check whether a full master and a reviewed opener share compatible H.264 group-of-pictures boundaries. The opener's first frame corresponds to `--start` in the master. At `--resume`, the plan returns to the master. The command reads the master’s frame count with FFprobe. Frame numbers start at zero.

```sh
node videos/full-directors/review-splice.mjs "$MASTER" "$OPENER" --start 120 --resume 620 --vizmatic-build "$VIZMATIC_BUILD"
```

Build Vizmatic with the public `planAvcSplice` API and pass that checkout as `--vizmatic-build`. [Vizmatic PR 150](https://github.com/bvolpato/vizmatic/pull/150). The command returns the verified picture ranges and FFmpeg concat input as JSON. The review reads the input movies and writes its result to standard output. Approved audio, English captions, chapters and final playback remain part of ordinary movie delivery.

## Audition a changed voice

To hear a beat with the course music, point `LEETLLM_SPEECH_CACHE` at the retained takes for the edited narration. Run the command inside the editorial storage reservation. Supply a new output filename.

```sh
node videos/full-directors/audition.mjs <id> --beat <beat-id> --out /absolute/review/beat.wav
```

If the proof painter already measured a retimed schedule, use its window and recorded takes directly. The command checks the lesson text, beat boundaries and audio hashes before it renders the excerpt. For a separate authored lesson directory, add `--lessons-dir <directory>`.

```sh
node videos/full-directors/audition.mjs <id> --schedule /absolute/review/paint-input.json --out /absolute/review/excerpt.wav
```

The audition streams every recorded take to preserve the lesson’s speech reference, music seed and chord timing. It renders only the selected interval and up to 12 seconds on either side for the mixer. The output contains the voice and music bed. The JSON result identifies the pinned composer and gives the exact film frames and sample count. Use the full export for final loudness, authored sound effects and delivery verification.

## Export the movie

After the editorial gate, run the renderer inside the production storage reservation. The scheduler supplies the approved source, cache and output directory.

```sh
node videos/full-directors/render.mjs <id> --out /absolute/work/movie.mp4
```

Pass `--reuse-canvas-readback` to use a compatible Vizmatic build for body frames. The painter still runs on every frame and collects the same caption cues. The JSON report gives the number of reused pixel snapshots. With a runtime that supports timestamped RGBA input, the same option sends each changed picture and refreshes the stream during long holds. The report includes the number of full pictures sent in `canvasReadback.rgbaPackets`, including the opening. After a native state query or an unsupported drawing operation, the painter reads fresh pixels on each frame. To enable byte comparison for a measured chapter, add its narration ID to the authored film’s `compareRgbaChapters` array. For those chapters, the pinned runtime skips the transfer when two consecutive readbacks match. The report counts comparison requests in `canvasReadback.comparedFrames` and records each selected chapter’s count in `canvasReadback.comparedFramesByChapter`. Other chapters keep sending fresh readbacks. A build without the Canvas readback helper uses ordinary rendering and reports `"available": false`.

For a new production director, use the Vizmatic commit and archive named in the [director runtime recipe](runtime/recipe.json). To build the archive, check out that commit in Vizmatic and run `pnpm install --frozen-lockfile`, `pnpm build` and `npm pack --ignore-scripts`. Check the archive against both digests in the recipe. Place the verified archive beside the scoped package manifest and lockfile, then run `npm ci --ignore-scripts` there. The production worker loads this build and runs the renderer with `--stage-for-production --reuse-canvas-readback`. The same archive supplies the narration tools pinned by the [course score](../soundbed.json).

The full renderer uses Wolf, the course Kokoro `af_heart` voice. Both visual reveals and English phrase captions use measured word boundaries. Intro picture frames 0 through 119 use the official course animation. Frame 120 draws the first authored beat at elapsed time zero. The quiet course soundtrack follows the measured chapter and beat starts.

Set `LEETLLM_SPEECH_CACHE` to an absolute directory to retain provider MP3s and word events across exports. Set `LEETLLM_INTRO_CACHE` to share the verified opening across jobs. Each job creates private scratch beside its destination and publishes the MP4 by rename after checking its streams and decoding it. Standard output contains the measured body and total frame counts and the embedded chapter titles and times.

The voice writer decodes up to 12 takes at once into one frame-aligned 24 kHz PCM file. The pinned course composer uses short sample windows across the entire score. The job removes its PCM and private take copies before it encodes the picture. The final mux copies the complete H.264 picture stream. Reserve space for two compressed copies of the picture during muxing. Use the measured storage ledger and the host production guard to reserve the work directory, retained recording growth and opening cache before launching jobs. The scheduler checks current free space and owns concurrency. [Storage admission](../../docs/render-storage.md#admission)

### Export a batch of reviewed lessons

From the repository root, pass the slugs you have reviewed. Use `--all` when you want the complete curriculum. The batch follows curriculum order and uses the same three-digit number for a lesson in either mode. The default is four jobs. Set `--jobs` to a number from one to four to fit your storage reservation.

```sh
node videos/full-directors/batch.mjs --out ./masters --jobs 4 tool-protocol hybrid-search
node videos/full-directors/batch.mjs --out ./masters --all
```

Each new lesson runs the silent picture check and the full renderer, including its final playback check. The batch writes the numbered MP4 after both commands succeed. A failed lesson sets a nonzero exit status and the other lessons continue.

To resume, repeat the command with the same output directory. Keep its hidden `.full-directors` directory with the movies. The batch verifies the lesson inputs, renderer and movie checksum before reporting a verified skip. It preserves other existing movies and reports them as `Existing/unverified`. To refresh one deliberately, move that movie aside and run the command with its slug.

If a version probe fails after rendering, the batch retains the checked movie and its source fingerprint in `.full-directors/pending-<slug>/`. Repeat the same command to verify and publish those bytes. Add `--verify-only` to check pending or existing movies without starting a render. If the batch detects changed inputs, it saves the differences in `refused.json`. Inspect the changes and move the pending directory aside before rendering a new export.

## Author a frame

The painter receives the shared Canvas 2D context and a clock. `clock.index` counts beats from zero across the lesson. `clock.beat` contains the authored `id`, `say` and `hold`, plus `chapterId`, `chapterTitle`, zero-based `chapterIndex`, zero-based `beatIndex` within the chapter, and `beatsInChapter`. `clock.seconds` counts seconds since the first teaching frame. `clock.elapsed` counts seconds since this beat started. `clock.speechDuration` gives the length of the recording before its hold.

A scene can use the recording itself as a picture. Define a synchronous `preparePicture(schedule)` method on the film. Each entry includes the beat, its word timings and the path to its measured audio. Compute the values the painter needs, such as waveform peaks, and return them. The painter receives those values as `clock.pictureData` on every frame. In a silent preview, entries contain estimated words and have no audio path. Supply a picture for that case as well.

Paint an opaque 1920 × 1080 picture at every call. Use `clock.progress` for progress across the beat including its hold. Use `clock.chapterProgress` for `(beatIndex + progress) / beatsInChapter`. To begin a transition at a measured phrase, use `clock.reveal('words in this beat', 0.4)`. It rises from zero to one over the specified seconds. An author can cache an expensive stationary layer inside the film module and paint it onto the context as the rest of the scene moves. Keep the word cues active on every frame that needs them.

## Run the temporary fixtures

```sh
node --test videos/full-directors/test/runtime.test.mjs videos/director-cuts/lesson-runtime/runtime.test.mjs
FULL_DIRECTOR_SMOKE=1 node --test videos/full-directors/test/movie-smoke.test.mjs
```

The first command checks chapter ordinals, irregular word timings, the final partial page, chapter JPEGs and batched PCM. The media smoke requires FFmpeg, FFprobe, uv, the installed course voice and the pinned soundtrack dependencies. It creates a short two-chapter library-hours fixture in the system temporary directory and removes the fixture and movie at exit. The decoder checks all picture frames, the opening chime, the recorded voice, the score during a hold, and timed English answer captions. To reuse the recording, point `LEETLLM_SPEECH_CACHE` at a cache containing “Sunday. The library is closed.” Both public CLIs accept `--lessons-dir <directory>` for isolated fixture modules.

## Check native playback on a Mac

After export, run the P2 playback check on the delivered MP4. Use the total `frames` value from the renderer's JSON report, including the opening. From the repository root on a Mac with the Xcode command line tools, run:

```sh
xcrun swift videos/full-directors/check-native-playback.swift "$MOVIE" --frames "$FRAMES"
```

AVFoundation decodes every picture and the full audio track without opening a player. The picture count must match the renderer. The 48 kHz stereo audio must span the same duration at 30 pictures per second, within one AAC frame (1,024 PCM frames). The command prints JSON with the file path, SHA-256, decoded counts, both reader statuses and any errors. Exit status 0 means both checks passed. Exit status 1 indicates a file or decoding failure. Exit status 2 indicates invalid arguments.
