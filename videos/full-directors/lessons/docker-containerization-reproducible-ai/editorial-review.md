# Lesson 002 picture review

I sampled the selected cut `002-docker-containerization-reproducible-ai.mp4` with SHA-256 `9e57f85404da98f4cac379261c839387e962d5b54a3c0debcc253766c0940ce4`. FFprobe reported 48,778 frames at 30 fps, 1920 × 1080, a duration of 1625.933 seconds, and the official opening plus 23 teaching chapter markers. I used the embedded English subtitle timings to locate speech and inspected 56 decoded 480 × 270 stills. The logo sample is at 2.0 seconds. The table lists the remaining seek times in seconds. I also reviewed every beat of the active narration, the picture source, and the companion article. The selected movie uses the film’s access-request example. The article’s parallel example uses different filenames and demonstrates the same mount and fallback behavior.

| Chapter | Seek times (s) | Observation |
|---|---|---|
| c01 | 4.0, 12.5, 44.0 | The command stops at `python` in the fresh clone. The run from the packaged image reads all three rows. |
| c02 | 64.0, 94.0 | The client reaches an Engine inside the Desktop VM, and the kernel is drawn inside that VM. |
| c03 | 123.0, 149.0 | `.dockerignore` blocks `.env`, `.venv/`, and the weights. The footer traces the virtual environment copy back to the builder stage. |
| c04 | 176.0, 203.0 | `/opt/venv` crosses between stages at the same height, then the runtime adds the scorer and `USER appuser`. |
| c05 | 226.8, 231.9, 234.0, 259.1 | The fresh stage receives only `/opt/venv`. `FROM builder` also brings the helper and `ENV`, and the later import succeeds once `libpq` is present. |
| c06 | 319.0, 334.0 | The explicit arm64 target sends both builders to B and leaves the amd64 member A untested. |
| c07 | 422.5, 428.0 | Wheel B keeps version 1.0 but its SHA-256 prefix differs from the approved wheel, so the fresh download fails. |
| c08 | 472.0, 493.0 | A scorer edit misses only the application copy. A requirements edit also misses the install step. |
| c09 | 528.0 | Packaged Python writes to stdout and uses the Engine host or VM kernel. |
| c10 | 620.0, 633.0 | UID 10001 cannot traverse the root-owned `0700` directory. Changing the directory owner lets the same process reach the `0644` file. |
| c11 | 694.5, 697.0 | Request 102 remains in the denominator. The two matches give `6 ≥ 6` at the exact threshold. |
| c12 | 724.0, 732.3, 737.0, 759.0, 767.0 | The mount covers the baked rows and the retry uncovers them, but the old fallback ends at a small `assets/ absent` label without a directory in the source diagram. |
| c13 | 782.4, 812.0 | The first `--mount` fails at the Engine. `-v` leaves an empty host directory, so the later `--mount` starts Python. |
| c14 | 842.0, 866.0 | C2 reopens C1’s saved volume entry, and a later bind can mount a valid directory with the wrong data. |
| c15 | 907.0, 923.0 | The parse-only state leaves build and execution inactive. The run with `--build` exercises the mounted file. |
| c16 | 973.0, 980.0, 985.0 | The pip configuration disappears when the install finishes, while the installed package remains visible. |
| c17 | 1025.5 | The merged directory loses `debug.txt`, while the earlier image layer still shows the harmless placeholder. |
| c18 | 1107.0 | The Ubuntu probe can list the GPU while the CPU scorer image lacks `torch`. |
| c19 | 1165.0 | When the container probe fails after the host passes, the application probe stays waiting. |
| c20 | 1241.0, 1257.0, 1260.0 | Changing only host row 102 raises the mounted report from 2/3 to 3/3. It passes the threshold and differs from the reference. |
| c21 | 1372.5, 1374.0, 1392.0, 1409.0, 1442.0 | The shared tag moves to B before lookup. On replay the private file still gives both runs A, and the later buffer retains the bytes that were scored. |
| c22 | 1504.0, 1529.0 | The original print reaches stdout only for the baked report. The fresh-clone output gives both reports with their read paths. |
| c23 | 1552.0, 1584.0, 1600.0, 1624.8 | The host repair leaves the last run at 4/7 until a retry restores 5/7 and matches the reference. |

## Picture change

In `runtime.mjs`, c12-b01 through c12-b04 keep `/app/eval` fixed. The gold host strip covers the same baked rows that the retry uncovers. In c12-b03, the failed primary lookup stays visible while the fallback traces to its own `/app/assets` destination, stops at the absent directory, and supplies the error path. In c12-b04, the unchanged primary lookup reaches the original rows and the fallback stays idle. The recovered score comes from the existing fixture model.

In `film.mjs`, the chapter can use a phrase’s word end for the picture reveal and its word start for the caption break. The missing-file labels, named error, exit status, and recovered score wait for their spoken clauses. Narration text, holds, and chapter and beat IDs are unchanged.

## Validation

Both edited JavaScript modules passed `node --check`. The requested full-director validation built a 50,181-frame estimated body timeline with 23 chapters and 100 beats. The painter ran at the start, midpoint, and end of all 100 beats. Eight phone-width stills covered the prediction, the strip in motion, the two lookup paths, and the retry. Canvas text assertions on the frames adjacent to each result cue verified both missing-file labels, the error path, exit 1, and 0.667 (2/3). The estimated English SRT put “Two of three again” at its spoken start. `git diff --check` passed. Temporary stills were removed.

The baseline review used sampled decoded frames and subtitle timing. The edited review used estimated speech timing and uncaptioned Canvas stills. Continuous playback, measured cues, caption placement in an encoded revision, and a new MP4 remain unverified.
