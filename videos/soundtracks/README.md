# Full-length lesson soundtracks

Run this command inside the course storage reservation. The renderer reads the lesson declaration beside the command, verifies the reviewed lesson and WAV, and places the cue at the end of the named beat’s measured recording. Serving Benchmarks uses its original six-tick recording while the viewer decides whether to send the next call.

```sh
npm --prefix videos run render:full -- serving-benchmarks --out /absolute/work/movie.mp4
```

Use a `.flac` output to render only the full body score with its original course voice and themed bed. A lesson without a declaration uses the standard course score. The four-second branded opening is added during movie delivery. Production can pass `--course-root` to use the speech, timeline, picture and delivery code from its frozen course snapshot.

Add a lesson declaration named `<lesson-id>.json` beside the score writer. Use the reviewed source digest and WAV digest, identify the beat by its narration ID, and set `edge` to `speech-end`. The WAV must fit inside the measured hold. The movie uses the same full-directors picture, captions and delivery pipeline as the standard export.
