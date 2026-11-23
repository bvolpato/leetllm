# Director’s cuts

These standalone short films each follow one decision. The main course continues to serve its full-length lessons.

## Edit a lesson

Find the lesson by its course ID in [lessons](lessons/). Each `film.mjs` contains its narration, artwork, motion and worked example. The shared runner adds the animated LeetLLM opening, female narration, timed captions and a quiet soundtrack. The [editor’s guide](lesson-runtime/EDITOR.md) explains how to choose a question, direct the opening and check whether the picture answers it.

Install the [course render dependencies and pinned Vizmatic runtime](../CI_COMPATIBILITY.md). From the repository root, inspect a lesson’s opening and reveals as still images. Once the edit is ready, use the same ID to render its MP4.

```sh
node videos/director-cuts/lesson-runtime/check.mjs attention --stills ./attention-stills
node videos/director-cuts/render.mjs attention --out ./097-attention.mp4
```

## The first four cuts

These editions keep their original render commands and source directories.

| Cut               | What to watch                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `python`          | A dropped request changes the score. Put its slip back on the desk to discover which prediction improved.                            |
| `forecasting`     | Ten possible mornings compete for space in a print shop. Move one school order and watch the capacity needed to cover nine mornings. |
| `damaged-package` | Follow a carton through the inspection decision and examine the evidence for damage.                                                 |
| `geometry`        | Watch two candidates compete for the same query before and after their arrows are normalized.                                        |

```sh
node videos/director-cuts/render.mjs python --out ./003-python.mp4
node videos/director-cuts/render.mjs forecasting --out ./059-forecasting.mp4
node videos/director-cuts/render.mjs damaged-package --master "$MASTERS/089-capstone-damaged-package-vision-classifier.mp4" --out ./089-damaged-package.mp4
node videos/director-cuts/render.mjs geometry --master "$MASTERS/096-embedding-geometry.mp4" --out ./096-embedding-geometry.mp4
```

Set `MASTERS` to the directory containing your archived study exports. The last two cuts reuse picture and sound from those specific editions. [cuts.json](cuts.json) lists their filenames and SHA-256 digests. Python and Forecasting can generate the course opening themselves or reuse the opening from their listed study. The runner builds in a temporary directory alongside the destination and replaces the output after the build succeeds.

The film directories contain the editable scripts, scenes and timings. New dialogue uses the shared course narrator and measured word timings. Set `LEETLLM_SPEECH_CACHE` to reuse existing takes across builds.
