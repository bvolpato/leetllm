# Rebuild a lesson as a narrated film

You rebuild the video of one lesson. The narration stays. The picture is new: one example that stays on screen while its parts move and change, so that the viewer sees the mechanism. This file, the lesson file of your lesson and its survey entry are all that you need.

The survey rated each old video from 1 to 5: slides of text (1), diagrams that stand still (2), computed pictures whose motion does not carry the idea (3), one example whose parts move (4), memorable (5). Your target is 4 or 5.

## 1. What you read first

1. This file.
2. Check for `videos/stage-lessons/<id>.lesson.yaml` first. If it exists, improve the existing stage film and follow its script. The older canvas script can have different narration. For a new rebuild, read every scene and cue in `videos/lessons/<id>.lesson.yaml` before planning the picture.
3. Your survey entry. It names the central example, the weakest scenes, and what must be on screen and what must move (`topChanges`):

```bash
python3 -c "
import json, sys
from pathlib import Path
survey = Path.home() / '.local/share/vizmatic-landing/leetllm/survey'
for batch in survey.glob('*-*.json'):
    for row in json.loads(batch.read_text()).get('lessons', []):
        if row.get('id') == sys.argv[1]: print(json.dumps(row, indent=1))" <id>
```

Useful, and not required: the old frames in `~/.local/share/vizmatic-landing/leetllm/frames/<id>/`, the model lesson in `videos/stage-lessons/softmax/`, and the guides of Vizmatic in `~/githubworkspace/vizmatic-wt-head/docs/guides/` (`narrated-films.md`, `layout.md`, `objects.md`, `animations.md`).

## 2. The folder of a lesson

```text
videos/stage-lessons/<id>/
  lesson.yaml            the narration and the cues: a copy of videos/lessons/<id>.lesson.yaml
  index.mjs              the scenes of the lesson, by scene id
  parts.mjs              what the scenes share: the example, the job of each color, a picture that two scenes show
  scenes/<scene-id>.mjs  one file for each scene
```

Create `stage-lessons/<id>/scenes`. If `stage-lessons/<id>/lesson.yaml` already exists, use it. It can contain factual corrections from script review. Otherwise copy `lessons/<id>.lesson.yaml` to `stage-lessons/<id>/lesson.yaml`. The draft script holds the narration and cues for the new film. The copy keeps the `motion_check` blocks of the old film, which no tool of the rebuild reads. Delete them: `node tools/stage-cues.mjs <id> --drop-motion-checks`.

The lesson has a model already: `videos/films/<id>/model.mjs`, and often `fixtures.mjs` and `arithmetic.mjs`. Import them as they are, such as `import { completeModel } from '../../../films/softmax/model.mjs'`. Do not copy them and do not change them. Every number on screen comes from the model. A number that the voice says and the model lacks is typed one time in the scene, with a name, and its arithmetic is asserted: `assertEqual(calls * tokens, 576, 'tokens of nine calls')`, from `vizmatic/stage`.

`index.mjs` is small. A scene that is not in it yet shows as "not rebuilt yet", so you can work scene by scene.

```js
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import squaredVsCe from './scenes/squared-vs-ce.mjs';

export default narratedLesson({ id: 'softmax', scenes: { intro, 'squared-vs-ce': squaredVsCe } });
```

The old canvas code (`videos/films/<id>/stages/`, `videos/animations/<id>.mjs`, `videos/lessons/<id>.lesson.yaml`) and its tests stay as they are. When a rebuilt lesson is accepted, the owner moves `lesson.yaml` to `stage-lessons/<id>.lesson.yaml` and adds `stage-lessons/<id>.film.mjs` with one line, `export { default } from './<id>/index.mjs';`. The renderer and the review tools then read that same script. That step is not yours.

## 3. The shape of a scene

A scene is a function `(s, c)`. `s` is the stage, and `c` is the clock of the scene. The film opens the scene, fades in what the scene adds with `s.add`, and fades out all of it at the end. So a scene has three parts: lay the picture out, add the first picture, and put each change on a cue. This is a part of `stage-lessons/softmax/scenes/squared-vs-ce.mjs`. Read the whole file before you write your first scene.

```js
import { barChart, beside, fade, fitted, grid, indicate, place, tex } from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORDS, WORD_COLOR } from '../parts.mjs';

export default function squaredVsCe(s, c) {
  const p = completeModel().certain; // 1. The numbers come from the model of the lesson.

  // 2. Cut the area into regions. No x and no y.
  const [picture, foot] = area.rows([7, 1], 'normal');
  const [left, right] = picture.columns([2, 5], 'loose');

  // 3. Make each node with no place. The layout measures it and places it.
  const bars = WORDS.map((word, i) => ({ label: word, value: p[i], color: WORD_COLOR[i] }));
  const chart = place(fitted(left.inset('normal'), (width) => barChart(bars, { width, max: 1, labelSize: 40, showValues: false })), left);
  const values = p.map((value, i) => beside(mono(value.toFixed(4), { color: WORD_COLOR[i] }), chart, 'under', 'tight', chart.bar(i)));
  const ce = { name: label('cross-entropy', { color: 'yellow' }), slope: tex('-\\tfrac{1}{p_{t}}', { color: 'yellow' }), factor: tex('\\times\\; p_{t}\\,(1 - p_{t})'), result: namedBox((p[1] - 1).toFixed(4), { width: 230, height: 96, color: 'yellow', font: 'mono' }) };
  const heads = ['loss', 'slope', 'softmax factor', 'target logit gradient'].map((words) => note(words));
  place(grid([...heads, ce.name, ce.slope, ce.factor, ce.result], { columns: 4, gap: ['normal', 'loose'] }), right, 'left');

  // 4. The first picture: the example that stays. It is on screen in the first half second.
  s.add(heading(c.title), chart, heads);

  // 5. Each change is on a cue id of lesson.yaml.
  c.show('squared-vs-ce-0', ce.name); // fades in as the voice starts the phrase
  c.show('brier-favorite', values[0], { after: true }); // a result: it waits for the end of its clause
  c.show('squared-vs-ce-1', ce.slope);
  const cancelled = [...ce.slope.part('p_{t}'), ...ce.factor.part('p_{t}').slice(0, 2)];
  c.on('brier-cancel', () => s.play(...cancelled.map((glyph) => fade(glyph, 0.25)), { duration: 0.8 })); // a motion of the scene's own
  c.show('brier-ce-result', ce.result, { after: true });
  c.on('brier-remain', () => s.play(indicate(ce.factor, { color: 'yellow' })));
}
```

The order of the lines of a scene matters in four ways:

- **Lay out every node before the first cue call.** A callback of `c.on`, `c.after`, `c.onBeat` and `s.at` runs at once, with the clock at its time. A `place` or a `moveTo` after it is a change on the timeline, and the node then flies in from the middle of the stage. This is true for a node that arrives late too.
- **Place a thing at its last place, lay out what is around it, then place it at its start.** A label beside a point lands on the token that rests there later. `beside(label, token, 'under')` measures the token where it is now.
- **The draw order is the order of the calls, not of the cues.** A panel that a later line brings paints over a text that an earlier line brought. Give a plate `.zIndex(-1)`, or bring it in an earlier line.
- **The first picture holds the whole skeleton, dim.** `s.add` gets the frame of each table and chart, the lanes, and the boxes that are still empty, in `dim`. The cues light them and fill them. A scene that opens with a title and one line gets `course.space_empty`.

## 4. Cues: how a change follows the voice

A cue is an id that `lesson.yaml` declares under a beat, with the phrase that the voice says. For `show`, `hide`, `swap` and `swapAll`, the index of a beat is a cue too: `c.show(1, nodes)` is the start of beat 1. The other calls take a cue id only.

| Call | What it does |
|---|---|
| `c.show(cue, items)` | Fades items in. It starts 0.1 s before the phrase and takes 0.3 s. An item is a node, a block of the layout, an animation such as `draw(arrow)` or `chart.enter()`, or a list. Options: `{ lead: 0.4 }` starts 0.4 s before the phrase, `{ lead: -0.6 }` starts 0.6 s after its start, `{ fade: 0.6 }` is a longer fade, and `{ stagger: true }` brings a list one item after another. |
| `c.show(cue, items, { after: true })` | The same, when the voice has said the whole phrase. Use it for every result: a number that the voice computes, a verdict, the answer of a prediction. |
| `c.hide(cue, items)`, `c.swap(cue, out, in)` | Fades items out. Swap: the old items leave, and the new ones arrive 0.2 s later at their place. |
| `c.swapAll(cue, into, { keep: [title, board] })` | Changes the whole picture, for a long scene with two or three pictures: all that the lines above it put on the screen leaves, `keep` stays, and `into` arrives. With no `into`, the picture only leaves. |
| `c.on(cue, () => s.play(...))`, `c.after(cue, ...)` | Runs a play of the scene's own at the start, or at the end, of the phrase: a move, a morph, a value that changes. `c.on(cue, build, 0.8)` runs 0.8 s later. `c.onBeat(1, build, offset)` is the same for the start of beat 1. |
| `c.cue(cue)` | `{ start, end }` of the phrase in film seconds, for a play that lasts as long as the phrase. |
| `s.at(time, build)` | Runs `build` at a time of the film, such as `s.at(c.cue('raise').end + 0.5, () => s.play(...))` or `s.at(c.beats[1].start, ...)`. |
| `c.clear([nodes], lead, duration)` | Fades nodes out before the scene ends: `lead` seconds before its end, in `duration` seconds. The shell clears every node with 0.24 and 0.26. `c.clear([lanes], 0.46, 0.2)` takes the lines away first. |
| `c.title`, `c.beats`, `c.start`, `c.end` | The title of the scene, and its times. |
| `c.keep(nodes)`, `c.take(nodes)` | Hands a picture to the next scene with no fade. See section 8. |

- **Every declared cue must drive something.** The compile stops and lists the cues that no scene uses. It stops too when a cue id is not declared, and when a play ends after its scene.
- **Add a cue for each change that has none.** Old lessons often declare one cue for a whole sentence. Declare a cue in `lesson.yaml` for the exact words at which the picture changes. A cue needs `id` (unique in its scene), `phrase` (the words, one time in the beat) and `targets` (one slug, such as `- picture`). You may also move or remove a cue. This does not change the script. A scene often needs 10 to 30 cues in place of 2 to 9. Write them as a list with one line `beat|id|phrase` for each cue, and set them with `node tools/stage-cues.mjs <id> --scene <scene> --set cues.txt`. Without `--set`, the tool prints the beats and the cues of the scene in that form. It keeps the sentences and the holds.
- **A motion shows the mechanism.** Hold the state in values, and let the picture follow them: `const z = s.value(1)`, a `dynamic(() => ...)` node that draws from `z.value`, and `c.on('raise', () => s.play(z.to(2, { duration: 1.2 })))`. The bars, the shares and the readouts then change together, and every frame between is true. `chart.update(values)`, `to(node, (n) => ...)`, `morph(a, b)` and `morphMatching(eqA, eqB)` are the other moves.
- **A node shows one time.** A node of `s.add` cannot be in `c.show`. To bring a node back, hide it first. An `indicate` of a node at the moment of its `{ after: true }` show stops with "shows already": give that `c.on` an offset of 0.4.
- **A result on the last words of a scene has little time.** After them come the hold of the last beat and 0.3 s. A node fits when that hold is 0.45 s or more. An animation of one second, such as `draw(arrow)` or `chart.enter()`, does not, and the build stops with "run past its narration". Give it a `duration` that fits, or declare a cue on earlier words.
- **A `duration` on `s.play` stretches every animation in the call.** Give animations of different lengths their own durations, and leave it off `s.play`.

## 5. Colors and text

One color has one job in a lesson. Write the jobs in `parts.mjs`, and keep them from the first scene to the last. The names are the names of the cue colors in the lesson file.

| Name | Use |
|---|---|
| `ink`, `dim` | Text, and quiet text: a header of a table, a note, a part that is done. |
| `cyan`, `blue`, `green`, `pink` | The things of the example: one color for each thing, the same in every scene. |
| `yellow` | What the voice points at now, and the one result that matters. |
| `red` | A failure, a wrong value, a danger. Nothing else. |
| `surface`, `grid`, `faint` | A plate behind marks, a quiet line, an axis. |

Text is 26 px or more in the 1080p frame. Take every text from `stage-lessons/kit-narrated.mjs`: `display` (71 px), `heading` (58), `label` (40), `mono` (40, for numbers and code), `para` and `namedBox` (36), `chip` (31), `note` (29). For `tex`, `text` and the `labelSize` of a chart, give a size of 34 or more. Few words on screen: a name, a number, a unit. The voice says the sentence.

The kit has two more helpers. `chip(words, { dash: true })` and `namedBox(name, { dash: true })` draw a dashed border, for a thing that is absent or planned. `tint(node, color)` gives a chip or a named box another color and keeps its fill, as in `s.play(tint(box, 'red'))`. `recolor` of such a box paints its fill too, and the words are lost.

## 6. The objects to reach for

Run `node node_modules/vizmatic/dist/cli.js objects` for the whole catalog with one example each. Import from `vizmatic/stage`.

| The picture | Objects |
|---|---|
| A distribution, shares, a ranking | `barChart` (`chart.update(values)`, `chart.bar(i)`), `dotChart`, `donut`, `unitChart` |
| A function, a loss curve, a boundary | `axes` with `.plot(f)`, `.dotAt`, `.world(x, y)`, `tangentLine`, `areaUnder`, `lineChart`, `scatter`, `numberLine` |
| A number that changes | `s.value(n)`, `decimal(() => v.value)`, `dynamic(() => nodes)`, `counter` with `countUp` |
| An equation and its terms | `tex`, `eq.part('p_{t}')`, `morphMatching`, `braceLabel`, `matrix` |
| Tokens, a sequence, a tensor | `tokens`, `arrayCells`, `chipRow`, `heatmap`, `attentionMatrix`, `stateGrid` |
| A model and its layers | `neuralNet`, `graph`, `tree`, `namedBox` with `connector` |
| A pipeline, the stages of a process | `steps` with `strip.go(i)`, `namedBox` with `connector`, `zone`, `pictogram`, `card` |
| Who does what, and when | `lanes`, `eventLog`, `boundary`, `dateLine` |
| Memory, a cache, a queue | `stateGrid`, `ringBuffer`, `bitField`, `arrayCells` |
| Code and its output | `codeBlock` with `block.find()`, `morphCode`, `terminal` |
| Where to look | `indicate`, `spotlight`, `circumscribe`, `pulse`, `callout` |

## 7. Layout: no x and no y

- Cut `area` into regions: `area.rows([1, 4])`, `region.columns(3)`, `region.inset('normal')`.
- Group nodes with `row`, `column` and `grid`. Put a group in a region with `place(group, region, 'top left')`, or next to a thing with `beside(item, thing, 'under', 'tight')`. A gap is `tight`, `normal`, `wide` or `loose`.
- Give an object the width of a region with `fitted(region, (width) => barChart(data, { width }))`.
- Make a line or an arrow after the nodes that it joins have their places: `arrow(boxOf(a).point('right'), boxOf(b).point('left'))`.
- When an item does not fit, the build stops and says by how much and what works. Follow the message.
- A size that has no name, such as the width of a box, is a number. Type it one time. A place is never a number.
- Draw no line across a text. To cancel a term, make it dim.
- A label at a point of a drawing of your own: compute the point from a region or a box (`region.point('top right')`, `boxOf(part).point('bottom')`, a share of `region.width`) and call `label.moveTo(point)`. Such a point is a measure, not a typed place. A text that follows a value has no measure: lay out a hidden text with its widest value, and draw the live text at that box.
- `indicate(node)` swells its node. Beside a line, a border or another text, give it `{ scale: 1 }`, or the motion scan reports the swell.
- A token that rests on a line arrives with `appear`, and goes quiet by color (`recolor`, `tint`), not by a fade: a plate that is half transparent over a line gives `film.text_crossed`. Take the line away before the end of the scene with `c.clear`.
- A text that must cross a line travels as a dot: hide the text, send a `dot` along the way, and show the text again at its target.

## 8. Art direction in ten lines

1. Choose one example for the lesson, the one of the survey entry. It is on screen in the first seconds of every scene that uses it.
2. Build the example one time in `parts.mjs`, as a function that returns its nodes. Every scene calls it, so the example has one place, one size and one set of colors.
3. An object keeps its identity. The bar of a word in scene 2 is the bar of that word in scene 9. Between two scenes that show it, hand it over with `c.keep(nodes)` and `c.take(nodes)`. Write the state of the example at the end of each scene in one table (`STATE` in `softmax/parts.mjs`): a scene builds the example in the end state of the scene before it, and ends in its own.
4. Each scene acts on the example: it changes one input, and the picture shows the consequence. Write down what moves before you write code. If the answer is "a box appears", find a better picture.
5. Ask for a prediction, and pay it off. Keep the inputs on screen, hold the answer back with `{ after: true }`, and show it where the viewer looks.
6. Motion shows the mechanism: a bar grows, a share divides again, a term goes dim, a point slides on a curve. A fade is not a mechanism.
7. Show a wrong step as a picture, then repair the same picture.
8. Keep what is done quiet (`dim`), and give `yellow` to the thing that the voice names now.
9. Fill the frame. The example is large, and no half of the frame stays empty. The first picture of a scene holds its whole skeleton (section 3).
10. A back half with many short facts still needs one picture: a table whose rows light up, a grid whose cells change. It is not a new card for each fact.

## 9. Commands

For recorded timing, add `--timeline /path/to/timeline.json` to either tool. Use the timeline from the audio renderer for the same narration. The tools resolve current cues against the recorded words, so you can adjust a reveal without generating speech again.

Run these commands from `videos/`, one at a time, under `nice`. The check and still tools do not synthesize speech. Stills go under `/tmp/leetllm-rebuild/<id>/` by default. The cue editor writes to the lesson script when you pass `--set` or `--drop-motion-checks`.

```bash
nice -n 15 node tools/stage-check.mjs <id>                    # compile, the two gates, the film check at rest and in motion
nice -n 15 node tools/stage-check.mjs <id> --scene mass,loss  # some scenes only: use this while you work
nice -n 15 node tools/stage-stills.mjs <id> --scene mass      # stills at the end of each beat and at each cue. --before: also before each cue
nice -n 15 node tools/stage-stills.mjs <id> --scene mass --cue mass-raise --frames 8     # frames inside one move. Or --at 3.5,4.25, in seconds of the scene
nice -n 15 node tools/stage-stills.mjs <id> --scene mass --sheet                         # one contact sheet of the scene: to find where to look, not to judge
nice -n 15 node tools/stage-cues.mjs <id> --scene mass [--set cues.txt]                  # print the cues of a scene as a list, or set them from a list
npx prettier --write "stage-lessons/<id>/**/*.mjs"            # the format of the course, for your folder only. Run it two times: the second run can still change a file
```

The stills are in `/tmp/leetllm-rebuild/<id>/stills/<NN>-<scene>/`. A file name starts with the seconds from the start of the scene. `index.txt` there lists each beat and each cue with its times. A run replaces the folder of each scene that it builds. The frames of `--cue` and `--at` are in a folder of their own inside it (`move-<cue>`, `at`), and a sheet is in `/tmp/leetllm-rebuild/<id>/sheets/`. The still at the end of a beat is 0.12 s before the next beat, so the first change of the next beat is not in it. `npm run stage:check -- <id>` and `npm run stage:stills -- <id>` are the same tools.

## 10. Quality steps

1. Plan first. For each scene write one line: the question, what is on screen at the start, what moves, the result. Check that the example stays.
2. Write a scene, then run the check for that scene until it has no finding.
3. Read stills by this rule, which one agent can follow in its context. First, the end of each beat at full size, one at a time (`*-beat-N-end.png`). Second, the moment before each result (`--before`, the `before-<cue>` file of each cue with `{ after: true }`): the answer is not there yet. Third, frames inside the three largest moves of the lesson (`--cue`). Do not read every cue still. Look for: text on text, text near a border, a label that is not at its thing, an empty half, content in one corner, a number that the voice does not say, a number that differs from the voice.
4. A contact sheet (`--sheet`) only shows where to look: a beat with no change, an empty frame, a scene that differs from the others. Never judge a layout on a sheet. A tile is a quarter of the frame, and it hides text on text. A move that crosses a text, or that jumps, is a defect: read it in the frames of `--cue`.
5. Run the check for the whole lesson. Fix each finding. Leave a finding only when the picture is right and you can say why, and then list it in your report. An error (`film.off_canvas`, `film.text_overlap`, `film.text_crossed`) stops a render. The rest are warnings (`film.text_crowded`, `film.text_edge`, `film.text_brief`, `film.blank`, `course.text_small`, `course.space_empty`).
6. Read the stills of the whole lesson in order, as a viewer. Does the example stay? Does each scene change it? Rate the lesson from 1 to 5 by the scale at the top of this file.

## 11. A picture that needs a component that does not exist

Draw it from primitives (`rect`, `line`, `arrow`, `text`, `dynamic`, `group`) in a file of your own folder. Then add one line to `videos/stage-lessons/COMPONENT-REQUESTS.md`, with one shell command so that two agents do not overwrite each other:

```bash
printf -- '- %s/%s: %s. Must: %s. Drawn in: %s\n' softmax mass 'a unit strip split into shares' 'follow live values, keep a label on each share' 'stage-lessons/softmax/parts.mjs' >> stage-lessons/COMPONENT-REQUESTS.md
```

Do not write a kit of helpers of your own, and do not change `kit-narrated.mjs`. The library gets the component, and your drawing is replaced then.

## 12. The narration

If the draft has a reviewed `coverage.yaml` and a `script-repair.json`, preserve the narration that passed that review. The canvas script can still contain the older wording. Use the measured timeline for the reviewed hash. If a visual review refers to an older script, verify its finding against the current recording before applying the change.

The teaching stays. You do not rewrite what a lesson says. You may add, move or remove cue declarations. You may change a sentence only where it describes the old picture ("on the left you see"), or where it cannot be shown. Then list the old sentence and the new sentence in your report. The check prints each sentence that differs from `videos/lessons/<id>.lesson.yaml`. A change of a sentence needs new script reviews, so make as few as you can.

## 13. What you do not touch

- Shared files: `videos/lib/`, `videos/tools/`, `videos/render.mjs`, `videos/package.json`, `videos/stage-lessons/kit*.mjs`, this file. If one of them is wrong, say so in your report.
- Other lessons: any folder under `videos/stage-lessons/` that is not yours, and all of `videos/lessons/`, `videos/films/`, `videos/animations/` and `videos/test/`.
- Commands that write to the whole repository: `npm ci`, `npm run format:authored`, `render.mjs --all`. No speech and no movie: no `--preview`, no render.
- Git: no commit, no push, no pull request.

## 14. Your report

Send it as your last message, under 300 words: the central example, the scenes that you rebuilt (count) and your rating from 1 to 5, the paths of six stills to read first, each finding of the check that you left and why, each sentence that you changed (old and new), each line that you added to `COMPONENT-REQUESTS.md`, and what you did not check.

## 15. What the model lesson taught

`softmax` has 21 scenes, 63 beats and 23 minutes. Its rebuild took one agent about 75 minutes and about 500,000 tokens (an estimate), with 2,300 lines in its folder. The design of the example that stays took the longest: its parts, its values, and its state at the end of each scene. Do that first, in `parts.mjs`, and the scenes are then 30 to 110 lines each.

- Build the example from values (`s.value`) and `dynamic` nodes, in places that come from regions of `area`. Give it one state object, and lay it out before you set the state: a live number keeps the left edge of its first value.
- A hand-over stops the build when the two copies differ by a pixel. A scene changes a value of the example on a cue or on `c.onBeat(0, ...)`, never while it builds.
- When two parts of the example cross, such as two words on one ruler, take their numbers off for the move (`value.set` in `c.on`, and back in `c.after`). The crossing itself stays as a judged warning.
- The check of one scene takes seconds, and the check of a whole lesson of this size takes 2 to 7 minutes: run it few times. Double each backslash of a `tex` string. `npx prettier --write` moves line breaks, so run it before you patch a file with a script.
- Vizmatic at head can change while you work. If a call that worked stops, or a film of another lesson fails, say so in your report and go on.
