# Edit a directed lesson

Watch the current lesson with captions. Find a moment where the viewer has to remember something the picture could show. Record its timestamp and what is visible. Keep one shot, example, or line that already teaches well.

Choose a question the viewer can answer by pointing at the picture. After the LeetLLM chime, show the event that raises it. Bring a small example into view, change one thing, and let the audience see the consequence before the narrator explains it. Keep labels with their objects. Leave the result on screen long enough to read it. Give each lesson its own setting when that helps explain its subject.

## Examples from the first four films

- In Forecasting, ten stacks stand for ten possible mornings at a print shop. A fixed rail makes the capacity decision visible. At 39 jobs, one sheet protrudes. Raising the rail to 40 brings the ninth morning under it.
- In Python, two receipts both say 100%. Open each receipt to reveal which requests it counted. Viewers can locate the missing request and distinguish an omitted case from a repaired prediction.
- In Embedding Geometry, two guide arrows share one query ruler. After the arrows reach unit length, rotate the ruler while both arrows stay still. The projected marks pass each other.
- In Damaged Package, keep the same dark parcel photograph on screen while its brightness changes. The routing decision flips while the printed label is still hard to read.

Use the course article to check the facts and the original footage to choose what to keep. Let the scene demonstrate one mechanism thoroughly. If another question deserves its own demonstration, give it room in the longer lesson or a separate film.

## Hand off the edit

Put the editable lesson in `videos/director-cuts/lessons/<lesson-id>/film.mjs`. Test the calculation in `check()`. Open stills from the first event, the prediction and the result at a small playback size. Check whether a first-time viewer can identify the object that moved and explain what changed. Record the original timestamp and one sentence describing what the viewer can now see.

Run the picture check from the repository root. It uses estimated word timing and can export stills for inspection.

```sh
node videos/director-cuts/lesson-runtime/check.mjs <lesson-id> --stills /tmp/lesson-stills
```

The production runner measures the spoken takes and uses those timings to reveal the picture and captions. The batch producer schedules MP4s after the course-wide editorial pass finishes.
