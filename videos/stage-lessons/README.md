# Stage lessons

A stage lesson is one continuous `vizmatic/stage` film that follows measured narration.
It replaces the canvas pair `lessons/<id>.lesson.yaml` and `animations/<id>.mjs`. It has
real morphing, equation morphs, 3D, and bloom. Objects can carry from one scene to the next.

Each lesson has two files in this folder:

- `<id>.lesson.yaml`: the narration. It uses the same format as `lessons/`.
- `<id>.film.mjs`: the film. It exports `stageLesson(options, build)` as its default.

`attention`, `tokenization`, and `kv-cache` are the worked examples.

Use their [visual teaching principles](../TEACHING_STANDARD.md#art-direction-make-the-mechanism-memorable)
when planning a new film. Their computed examples, persistent object identities,
and prediction/payoff sequences show how motion can carry the reasoning.

## Rebuilt lessons

A rebuilt lesson is a narrated film of Vizmatic in a folder of its own, `stage-lessons/<id>/`. [REBUILD.md](REBUILD.md) is its recipe: the folder, the shape of a scene, the two commands and the quality steps. `lib/narrated-lesson.mjs` is the adapter from a lesson file to `narrated()`, and `kit-narrated.mjs` is the kit. `softmax` is the model lesson. The three films above use the older clock that the rest of this file describes, and they stay as they are.

### Build a directory project

The renderer reads `<id>/lesson.yaml` and imports `<id>/index.mjs`. The source manifest tracks the imported scene files. If `<id>/coverage.yaml` exists, the coverage check uses that ledger. Otherwise it uses `videos/coverage/<id>.yaml`.

Narrated directory projects need a later public Vizmatic commit than the npm 0.8.1 package. For those projects, use a separate, clean course worktree. Run the following commands from its root. Choose an empty directory outside the course checkout for `VIZMATIC_BUILD`. Other course worktrees can continue to use the normal `npm ci` installation.

```bash
VIZMATIC_BUILD="$PWD/../vizmatic-native-fb81b07"
gh repo clone bvolpato/vizmatic "$VIZMATIC_BUILD"
git -C "$VIZMATIC_BUILD" checkout --detach fb81b07dc08f8b7e8dee1937ce41a7e6e10d39d2
(cd "$VIZMATIC_BUILD" && pnpm install --frozen-lockfile)
(cd videos && npm ci)
mv videos/node_modules/vizmatic videos/node_modules/.vizmatic-registry
ln -s "$VIZMATIC_BUILD" videos/node_modules/vizmatic
```

Set `ID` to a project name and `OUT` to its absolute scratch directory. Check the teaching ledger and compile the picture before recording speech.

```bash
node videos/check-coverage.mjs --lesson "$ID"
node videos/render.mjs --stage --lesson "$ID" --validate
```

Write each beat's spoken text in `say`. The renderer uses the [course narrator](../narration.json) for both Canvas and Stage lessons. Select a different provider or adapter only for a historical audio audit with `--audio-only`. Full films and previews require the course narrator and adapter. To check the timing before rendering the picture, run the audio phase. Set `LEETLLM_SPEECH_CACHE` to a shared directory to reuse measured takes across builds.

```bash
node videos/render.mjs --stage --lesson "$ID" --output "$OUT" --audio-only
```

Use a scene ID and a time inside that scene to cut a narrated excerpt. The command reports the corresponding timestamp in the finished movie. Set `CLIP` to the desired MP4 path. Watch the excerpt with captions and sound before rendering the master.

```bash
node videos/tools/stage-excerpt.mjs "$ID" "$OUT/previews/$ID/timeline.json" "$SCENE" "$OFFSET" 20 "$CLIP"
node videos/render.mjs --stage --lesson "$ID" --output "$OUT" --width 1920 --fps 30 --quality high --workers 2 --threads 2
```

## How a film follows the voice

`build(s, n)` receives the stage `s` and the narration clock `n`.

```js
export default stageLesson({ look: 'midnight', bloom: 0.12 }, (s, n) => {
  const hook = n.scene('hook');
  sceneHeading(s, hook, n.title('hook'));
  const answer = tex('128\\ \\text{KiB}', { size: 120 });
  hook.on('per-token', () => s.play(write(answer), { duration: 1 }));
  s.at(hook.end - 0.5, () => s.play(fadeOut(answer), { duration: 0.45 }));
});
```

| Call | What it does |
|---|---|
| `scene.on(cueId, fn, offset)` | Runs `fn` when the voice says the cue's phrase. |
| `scene.after(cueId, fn, offset)` | Runs `fn` when the voice finishes the phrase. |
| `scene.onBeat(i, fn, offset)` | Runs `fn` when beat `i` starts. |
| `scene.at(seconds, fn)` | Runs `fn` at a time measured from the scene start. |
| `scene.span(cueId)` | Returns how long the phrase takes to say. |
| `scene.start`, `scene.end` | Give the scene's times on the film clock. |

Compiling fails in two cases: the film runs past the narration, or a declared cue drives
nothing. So the script and the film cannot drift apart without an error.

## Commands

Run these from the repository root.

```bash
# Compile and check every film on estimated timing. This needs no speech. CI runs it.
node videos/render.mjs --stage --validate

# Make real speech, then check the film on measured timing.
node videos/render.mjs --stage --lesson ID --preview --fps 30 --output /tmp/stage

# Sample the film with bloom into a grid. This uses the preview's timeline.json.
node videos/stage-review.mjs --lesson ID --input /tmp/stage/previews/ID \
  --output /tmp/review --per-scene 3 --columns 3 --tile 640

# Look closely at some moments.
node videos/stage-review.mjs --lesson ID --input /tmp/stage/previews/ID \
  --output /tmp/review --times 12,48.5 --columns 2 --tile 960 --name close.png

# Render the delivery: MP4, captions, chapters, frame review, and receipts.
node videos/render.mjs --stage --lesson ID --fps 60 --quality high --workers 6 --output /tmp/stage

# Add the encoded frame review, then package.
node videos/inspect.mjs --input /tmp/stage --lesson ID
uv run videos/package.py --input /tmp/stage --lessons ID
```

Speech synthesis uses `tts.py`, which needs network access and no credentials.

## Migrate a lesson

Follow the gates in the [video teaching standard](../TEACHING_STANDARD.md). Do not start the film until the script passes gate 1, because a script change after that point repeats the film work.

1. Review the article's mastery quiz against rules Q1 to Q7, and fix it. Have a second reviewer verify the fixes.
2. Copy `lessons/<id>.lesson.yaml` to this folder. Keep `id` and `source`, and start from the old script's teaching. Rewrite it in the voice of `docs/book-voice.md`. Keep every fact that teaches, and take new ones only from the article or its cited sources. Record anything you remove.
3. Write `videos/coverage/<id>.yaml`, and run `node videos/check-coverage.mjs --lesson ID`.
4. Have independent reviewers run the closed-book test and the fact check, then record both against the script hash.
5. Plan one picture per scene before you write code. Ask what the viewer sees change when the voice makes its point. If the answer is "a new box appears", find a better picture.
6. Compute numbers in the film and check them with `assert`, so that the screen cannot disagree with the math. The `trainMerges` function in `tokenization.film.mjs` is the model.
7. Add a `visual_cues` entry for each moment that must land on a spoken word. Cue edits do not change the script hash, but any change to `say` does, and it requires new reviews.
8. Write the film. Use `stage-lessons/kit.mjs` for headings, chips, and grids.
9. Run `--validate`, then `--preview`, then `audit-stage-space.mjs`, `audit-stage-blank.mjs`, and `audit-stage-collisions.mjs`. Read the grid from `stage-review.mjs` scene by scene, with one frame every 10 seconds.
10. Render the delivery. Extract frames from the MP4 around each morph, and read them. On a Mac, decode the file with AVFoundation, because FFmpeg tolerates problems that stop QuickTime.
11. When packaging builds from a stage lesson, delete `lessons/<id>.lesson.yaml`, `animations/<id>.mjs`, and the tests that import that animation. `package.py` takes the stage lesson when both exist. Other tools read only `lessons/`, so check `catalog.mjs` callers before you delete the first legacy lesson.

## Cue rules

- A `phrase` must match exactly once in its beat. Matching uses lexical tokens, so
  punctuation and case do not matter. If a word repeats, use a longer phrase.
- Allowed `color` values are `cyan`, `blue`, `yellow`, `pink`, `green`, `red`, or a hex value.
- `targets` must be a nonempty list of unique slugs.
- A cue's `id` must be unique in its scene. Every cue must drive something in the film.

## Fill the frame

Viewers watch these on laptops and phones, so scale for the smaller screen.

- Text is at least 26 pixels in a 1080p frame. This includes axis numbers and captions. Most
  running text should be 44 pixels or larger, and a number that carries the point can be 200
  pixels or larger.
- Keep the picture large and central from the start of a scene. If it grows, pull the camera
  back as it grows. See `measure()` in `kv-cache.film.mjs`.
- Attach a label to the thing it names. For 3D, use `stack.stagePoint()` inside `dynamic`.
- Use `clearAxisNumbers(plane)` from `kit.mjs` when axis numbers are larger than the default.
- On a filled shape, draw text in `bg`. A number under a filled shape is hidden from the viewer
  but not from `checkFilm`, so fade it out while the shape covers it.

This command lists each span of two seconds or more where one empty rectangle covers more than
40% of the frame. Run it after `--preview`, and fix what it finds.

```bash
node videos/audit-stage-space.mjs --lesson ID --input /tmp/stage/previews/ID
```

The review grid from `stage-review.mjs` can show moire on the 3D block's cell lines, because it
draws each tile at low resolution. Check the block in a frame from the MP4.

## Keep the screen full

`inspect.mjs` fails a lesson if the content area stays almost empty outside the first half
second and the last half second of a scene. The content area is everything below the heading.
So start each scene's first picture in its first 0.5 seconds, even if the first cue comes
later. Let old objects fade while the new ones arrive, not before. A viewer who hears the
voice over an empty screen stops watching, so this rule is about teaching and not only about
the check.

A film check looks only at moments of rest, so it misses a short gap between two pictures. Run
this after `--preview`. It finds the same gaps that `inspect.mjs` fails in the encoded movie, in
seconds and without a render.

```bash
node videos/audit-stage-blank.mjs --lesson ID --input /tmp/stage/previews/ID
```

It also misses text that lands on other text or crosses a shape in motion. Run the collision scan
after `--preview`, and judge each line. It also lists text that an arrow or a wire crosses. Text may meet another block or a shape only if it replaces
it, becomes it, or is hidden by an opaque tile. Run the blank audit again after a fix, because a shorter fade can open a gap.

```bash
node videos/audit-stage-collisions.mjs --lesson ID --input /tmp/stage/previews/ID
```

## Mistakes to avoid

- Do not pass `{ duration }` to a fade inside `s.play(..., { duration })` and expect it to hold. The play
  stretches every animation to its own length, so the old text stays under the new text. Use a `brief()`
  helper, as `tokenization.film.mjs` does.
- **Late objects paint on top.** A morph target mounts when the morph starts, so it covers
  older objects. Give anything that must stay readable a higher `.zIndex()`.
- **A fade does not remove a value.** Bars drawn by `dynamic` stay in the check and can show
  behind later objects. Return early when their visibility value is near zero.
- **Keep one thing per place.** Do not fade new text in over old text. Let the old text
  finish first, or put the new text where the old text was.
- **Bend signs depend on direction.** A right-to-left `arrow` arches up with a positive
  `bend`, and a left-to-right `arrow` arches up with a negative `bend`.
- **Check the settled picture.** `checkFilm` samples each beat's end and the moment before
  each next cue. A long animation that runs through the next cue can raise a false error.
  Shorten the animation, or leave more time between the cues.
- **Mesh surfaces need `animate: true`.** A `parametricSurface` caches its shape unless you
  set it. See `box()` in `kv-cache.film.mjs` for a 3D block that grows with a value.

## What packaging checks

`package.py` accepts stage deliveries. It recomputes the source fingerprint from
`stageSourceFiles(id)` in `lib/stage-lesson.mjs`. It reads `film-check.json` in place of the
aggregate occlusion audit. The painter audits (`audit-occlusion`, `audit-labels`,
`audit-reveals`, `audit-text-ink`, and `audit-motion`) read canvas labels, so they do not
apply to a stage film.
