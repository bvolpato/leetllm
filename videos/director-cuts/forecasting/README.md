# Forecasting at the print shop

A print shop needs capacity for nine out of ten equally likely mornings. Each sheet on the workbench represents one job. Nine possible mornings bring ten jobs, and one brings a hundred. The lowest rail that covers nine mornings sits at ten jobs. When a school order raises one stack to forty jobs, the ninth stack sets a new cutoff of forty. The queues are illustrative.

The editable numbers and narration are in `lesson.json`. The picture follows measured spoken words in `art.mjs`. The film uses the course narrator, the Forecasting score, and two Vizmatic latch sounds where the rail settles.

Run `node build.mjs` with these paths in the environment.

| Variable           | Input or output                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `COURSE_VIDEOS`    | The LeetLLM `videos` directory with its locked dependencies installed.                                                             |
| `DIRECTOR_MODULES` | A directory containing `node_modules` for the pinned Vizmatic review runtime. It defaults to `COURSE_VIDEOS`.                      |
| `DIRECTOR_MASTER`  | An MP4 with the official four-second LeetLLM opening and chime. The first 120 frames and four seconds of audio supply the opening. |
| `DIRECTOR_OUTPUT`  | Absolute path for the finished MP4.                                                                                                |
| `DIRECTOR_WORK`    | An isolated directory for measured takes and intermediate files. It defaults to `build` beside the source.                         |
| `DIRECTOR_SERIF`   | Optional path to a serif typeface. The review cut used Baskerville.                                                                |

The build uses the Node, uv, FFmpeg and Kokoro setup from the course. It checks the nine-job and thirty-nine-job boundaries against the fixture, decodes the complete movie, and checks its frame count, audio duration and caption stream before replacing the output.

The longer Forecasting lesson retains the pinball-loss derivation, forecasting methods and alert evaluation. This film follows one capacity decision.
