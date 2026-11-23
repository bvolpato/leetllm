import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { parse } from 'yaml';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { C, drawFrame } from '../lib/scene.mjs';
import { draw as drawReward } from '../animations/reward-modeling.mjs';
import {
  draw as drawTokenization,
  validateModel as validateTokenizationModel,
  remapExample,
  unigramRemovalEvidence,
} from '../animations/tokenization.mjs';
import { draw as drawGradients } from '../animations/gradients-backprop.mjs';
import { draw as drawExperiment } from '../animations/ab-testing.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

const fps = 30;

test('tokenization visual examples keep their corpus-derived merges and viable Unigram paths', () => {
  assert.equal(validateTokenizationModel(), true);
});

test('incident labels stay readable while entering their assigned experiment groups', () => {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080),
    positions = [];
  for (let i = 0; i <= 120; i++) {
    const beatP = 0.18 + i * 0.0025;
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'intro', title: 'Assign eligible incidents' },
      { t: 25, duration: 49, beat: 1, beatP, opacity: 1 },
      drawExperiment,
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], [], `entry progress ${beatP}`);
    positions.push(frame.labels.find((label) => label.text === 'inc-17').x);
  }
  assert.ok(positions.at(-1) - positions[0] > 800);
});

async function fixture(lesson, id, draw) {
  const markup = parse(
    await readFile(new URL(`../lessons/${lesson}.lesson.yaml`, import.meta.url), 'utf8'),
  );
  const scene = markup.scenes.find((item) => item.id === id);
  const timeline = makeSceneTimeline(
    scene,
    scene.beats.map(() => 4),
    fps,
  );
  const render = (frame) => {
    const canvas = createCanvas(960, 540);
    const state = frameState(timeline, frame / fps, 0, 1);
    const audit = drawFrame(canvas.getContext('2d'), markup, scene, state, draw);
    return { canvas, state, ...audit };
  };
  const boundary = (beat) => {
    let frame = Math.ceil(timeline.beats[beat].start * fps);
    while (frameState(timeline, frame / fps, 0, 1).beat < beat) frame++;
    const before = render(frame - 1),
      after = render(frame);
    assert.equal(before.state.beat, beat - 1);
    assert.equal(after.state.beat, beat);
    return [before, after];
  };
  const during = (beat, progress) => {
    const timing = timeline.beats[beat];
    return render(Math.round((timing.start + (timing.until - timing.start) * progress) * fps));
  };
  return { boundary, during };
}

function circles(frame, diameter) {
  return frame.shapes
    .filter(
      (shape) =>
        shape.kind === 'circle' && shape.fillAlpha > 0 && Math.abs(shape.width - diameter) < 0.01,
    )
    .map((shape) => ({ x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }));
}

function stableMarkers(before, after, diameter, count) {
  const a = circles(before, diameter),
    b = circles(after, diameter);
  assert.equal(a.length, count);
  assert.equal(b.length, count);
  for (const [index, point] of a.entries()) {
    assert.ok(
      Math.hypot(point.x - b[index].x, point.y - b[index].y) < 1,
      `marker ${index} jumped at the beat boundary`,
    );
  }
}

test('the weight update is complete when its result is interpreted', async () => {
  const { boundary, during } = await fixture('gradients-backprop', 'update-step', drawGradients);
  const complete = during(2, 0.98);
  for (const frame of boundary(2)) stableMarkers(complete, frame, 26, 2);
});

test('learning-rate comparisons retain completed outcomes while the exact minimum is introduced', async () => {
  const { boundary, during } = await fixture(
    'gradients-backprop',
    'step-size-limits',
    drawGradients,
  );
  stableMarkers(...boundary(1), 14, 2);
  const complete = during(1, 0.4);
  for (const frame of [...boundary(2), during(2, 0.98)]) stableMarkers(complete, frame, 14, 3);
});

test('reward scores retain their offset across beats and recenter before scaling', async () => {
  const { boundary } = await fixture('reward-modeling', 'offset-and-scale', drawReward);
  const offset = boundary(1);
  stableMarkers(...offset, 42, 2);
  for (const frame of offset) {
    assert.ok(frame.labels.some((label) => label.text === '11.8 chosen'));
    assert.ok(frame.labels.some((label) => label.text === '10.7 rejected'));
    assert.ok(frame.labels.some((label) => label.text === 'margin 1.10'));
  }
  const scaling = boundary(2);
  stableMarkers(...scaling, 42, 2);
  for (const frame of scaling) {
    assert.ok(frame.labels.some((label) => label.text === '1.8 chosen'));
    assert.ok(frame.labels.some((label) => label.text === '0.7 rejected'));
    assert.ok(frame.labels.some((label) => label.text === 'margin 1.10'));
  }
});

test('the probability marker follows the displayed score gap through the equal-score demonstration', async () => {
  const { boundary, during } = await fixture(
    'reward-modeling',
    'margin-to-probability',
    drawReward,
  );
  for (const beat of [1, 2]) stableMarkers(...boundary(beat), 34, 1);
  for (const beat of [0, 1, 2])
    for (const progress of [0.02, 0.4, 0.5, 0.6, 0.98]) {
      const frame = during(beat, progress);
      const scores = frame.labels
        .filter((label) => /^\+\d+\.\d{2}$/.test(label.text))
        .map((label) => Number(label.text));
      assert.equal(scores.length, 2);
      const margin = scores[0] - scores[1],
        probability = 1 / (1 + Math.exp(-margin));
      const markers = circles(frame, 34);
      assert.equal(markers.length, 1);
      assert.ok(Math.abs(markers[0].x - (1060 + ((margin + 3) / 6) * 650)) < 1);
      assert.ok(Math.abs(markers[0].y - (730 - probability * 400)) < 1);
      const percent = frame.labels.find((label) => /^\d+%$/.test(label.text) && label.y < 300);
      assert.ok(percent);
      assert.ok(Math.abs(Number.parseInt(percent.text, 10) - probability * 100) <= 1);
      if (beat === 2 && progress === 0.5) {
        assert.equal(scores[0], scores[1]);
        assert.equal(percent.text, '50%');
      }
    }
});

test('the complete request earns its eight-position overflow from a two-position message', async () => {
  const markup = parse(
    await readFile(new URL('../lessons/tokenization.lesson.yaml', import.meta.url), 'utf8'),
  );
  const scene = markup.scenes.find((item) => item.id === 'checkpoint-bundle');
  const render = (beatP, cueProgress) => {
    const canvas = createCanvas(1920, 1080);
    const state = {
      beat: 1,
      beatP,
      t: 1,
      duration: 20,
      opacity: 1,
      cues: {
        'request-template': {
          progress: cueProgress,
          phase: cueProgress === 0 ? 'before' : cueProgress === 1 ? 'after' : 'during',
        },
      },
    };
    const frame = drawFrame(canvas.getContext('2d'), markup, scene, state, drawTokenization);
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
    return { ...frame, canvas };
  };
  const before = render(0.98, 0),
    partial = render(0.5, 0.5),
    held = render(0.02, 1);
  const slots = (frame) =>
    frame.shapes.filter(
      (shape) => shape.kind === 'rect' && shape.width === 120 && shape.height === 85,
    );
  assert.equal(slots(before).length, 2);
  assert.ok(!before.labels.some((label) => label.text.includes('overflows')));
  const painted = slots(partial).filter((shape) => shape.fill !== C.panel);
  assert.ok(painted.length > 2 && painted.length < 8);
  const complete = slots(held);
  assert.equal(complete.length, 8);
  assert.equal(complete.filter((shape) => shape.x < 1455).length, 7);
  assert.equal(complete.filter((shape) => shape.x > 1455).length, 1);
  assert.ok(held.labels.some((label) => label.text === '8 illustrative positions'));
  for (const position of complete) {
    const pixel = held.canvas
      .getContext('2d')
      .getImageData(position.x + 8, position.y + 8, 1, 1).data;
    assert.ok(
      pixel[0] + pixel[1] + pixel[2] > 150,
      'a counted token position must be visibly painted',
    );
  }
});

test('a consistent ID permutation moves both painted row tables and preserves piece-associated values', async () => {
  const { during } = await fixture('tokenization', 'embedding-contract', drawTokenization);
  const before = during(2, 0.02),
    moving = during(2, 0.44),
    held = during(2, 0.98);
  const rows = (frame, name) => frame.labels.filter((label) => label.text.startsWith(name + ' ['));
  for (const frame of [before, moving, held])
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  assert.equal(rows(before, 'cat').length, 2);
  assert.equal(rows(held, 'slept').length, 2);
  for (let i = 0; i < 2; i++) {
    assert.ok(rows(before, 'cat')[i].y < rows(before, 'slept')[i].y);
    assert.ok(rows(held, 'cat')[i].y > rows(held, 'slept')[i].y);
    assert.ok(Math.abs(rows(moving, 'cat')[i].x - rows(before, 'cat')[i].x) > 80);
    assert.ok(Math.abs(rows(held, 'cat')[i].x - rows(before, 'cat')[i].x) < 1);
  }
  assert.deepEqual(remapExample(0).lookup, { cat: [0, 1], slept: [1, 0] });
  assert.deepEqual(remapExample(1).lookup, { cat: [1, 0], slept: [0, 1] });
  assert.deepEqual(remapExample(1).logits, { cat: 0.8, slept: 0.2 });
  assert.equal(unigramRemovalEvidence('ous').lossIncrease, 0);
  assert.ok(
    Math.abs(unigramRemovalEvidence('▁house').lossIncrease - Math.log(0.31509 / 0.01509)) < 1e-12,
  );
});

test('narration cue entry keeps real token actors painted before their transformation', async () => {
  const markup = parse(
    await readFile(new URL('../lessons/tokenization.lesson.yaml', import.meta.url), 'utf8'),
  );
  const cases = [
    {
      scene: 'embedding-contract',
      beat: 0,
      beatP: 0.3,
      id: 'embedding-contract-group-80',
      progress: 0.001,
      actors: ['row 421'],
    },
    {
      scene: 'granularity',
      beat: 2,
      beatP: 0.65,
      id: 'granularity-reuse',
      progress: 0.001,
      minimumLetters: 13,
    },
    {
      scene: 'bpe-merges',
      beat: 2,
      beatP: 0.65,
      id: 'bpe-record-ranks',
      progress: 0.4999,
      extra: { 'bpe-third-merge': 1 },
      minimumLetters: 12,
    },
    {
      scene: 'wordpiece-encoding',
      beat: 2,
      beatP: 0.35,
      id: 'wordpiece-alternative',
      progress: 0.001,
      actors: ['pla', '##ying'],
    },
    {
      scene: 'sentencepiece-whitespace',
      beat: 1,
      beatP: 0.3,
      id: 'sentencepiece-whitespace-beat-2-focus-2',
      progress: 0.01,
      extra: { 'sentencepiece-whitespace-beat-2-focus-1': 1 },
      actors: ['good'],
    },
  ];
  for (const example of cases) {
    const scene = markup.scenes.find((s) => s.id === example.scene);
    const declarations = scene.beats.flatMap((b) => b.visual_cues ?? []);
    const cues = Object.fromEntries(
      Object.entries({ ...example.extra, [example.id]: example.progress }).map(([id, progress]) => {
        const declaration = declarations.find((c) => c.id === id);
        return [
          id,
          {
            ...declaration,
            progress,
            phase: progress === 1 ? 'after' : 'during',
            active: progress < 1,
            strength: progress < 1 ? 1 : 0,
          },
        ];
      }),
    );
    const canvas = createCanvas(1920, 1080);
    const frame = drawFrame(
      canvas.getContext('2d'),
      markup,
      scene,
      { beat: example.beat, beatP: example.beatP, t: 1, duration: 20, opacity: 1, cues },
      drawTokenization,
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], [], example.id);
    const actors = frame.labels.filter((l) => l.alpha > 0.9);
    if (example.minimumLetters) assert.ok(actors.length >= example.minimumLetters, example.id);
    for (const word of example.actors ?? [])
      assert.ok(
        actors.some((l) => l.text === word),
        example.id + ' must visibly paint ' + word,
      );
  }
});

test('Unigram pruning retains the pieces used by subsequent encoding and sampling', async () => {
  registerLessonFonts();

  const training = await fixture('tokenization', 'unigram-training', drawTokenization);
  const lattice = await fixture('tokenization', 'unigram-encoding', drawTokenization);
  const sampling = lattice;
  const pieces = (frame) =>
    new Map(
      frame.labels
        .filter((label) => label.groups.length && /^[a-z▁]+$/.test(label.text))
        .map((label) => [label.text, label.alpha]),
    );
  const initial = pieces(training.during(0, 0.88));
  const pruned = pieces(training.during(1, 0.98));
  const used = new Set([
    ...pieces(lattice.during(0, 0.88)).keys(),
    ...pieces(sampling.during(3, 0.88)).keys(),
  ]);
  assert.ok(used.size > 0, 'the rendered paths must expose their pieces');
  for (const piece of used) {
    assert.ok(initial.get(piece) > 0.9, `${piece} must begin in the candidate vocabulary`);
    assert.ok(pruned.get(piece) > 0.9, `encoding piece ${piece} was pruned`);
  }
  const unused = [...initial.keys()].filter((piece) => !used.has(piece));
  assert.ok(
    unused.some((piece) => pruned.get(piece) < 0.3),
    'a candidate unused by the rendered paths must visibly fade during pruning',
  );
});
