import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { evaluateMotionFrames, MOTION_SAMPLE_PROGRESS } from '../lib/motion-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw as learningDraw, fixedSampleCollection } from '../animations/learning-theory.mjs';
import { draw as rerankingDraw } from '../animations/reranking.mjs';
import { draw as decisionDraw } from '../animations/decision-models-jev-kev.mjs';
import { draw as orchestrationDraw } from '../animations/agent-orchestration.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

registerLessonFonts();
async function fixture(name, measuredScene) {
  const data = JSON.parse(
    fs.readFileSync(new URL('./fixtures/measured-narration/' + name + '.json', import.meta.url)),
  );
  const lesson = await readRepositoryLesson('videos/lessons/' + data.lesson + '.lesson.yaml');
  const index = lesson.scenes.findIndex((s) => s.id === data.scene),
    scene = lesson.scenes[index];
  const sounds = measuredScene?.sounds ?? data.sounds;
  const timing = measuredScene ?? makeSceneTimeline(scene, sounds.map((s) => s.duration), data.fps);
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { lesson, index, scene, timing };
}
function render(f, seconds, draw) {
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    f.lesson,
    f.scene,
    frameState(f.timing, seconds, f.index, f.lesson.scenes.length),
    draw,
  );
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
  return { canvas, audit };
}
function rgb(canvas) {
  const rgba = canvas.getContext('2d').getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    data[j++] = rgba[i];
    data[j++] = rgba[i + 1];
    data[j++] = rgba[i + 2];
  }
  return { width: 1920, height: 1080, data };
}
test('fixed-predictor collection preserves forty bounded loss identities and visibly constructs the sample', async () => {
  assert.deepEqual(fixedSampleCollection(0), { count: 0, losses: [], errors: 0, complete: false });
  const complete = fixedSampleCollection(1);
  assert.equal(complete.count, 40);
  assert.equal(complete.errors, 4);
  assert(complete.complete);
  for (let n = 0; n <= 40; n++) {
    const sample = fixedSampleCollection(n / 40);
    assert.deepEqual(sample.losses, complete.losses.slice(0, n));
    assert(sample.losses.every((loss) => loss === 0 || loss === 1));
  }
  const f = await fixture('learning-one-predictor-provider'),
    beat = f.timing.beats[0];
  const frames = MOTION_SAMPLE_PROGRESS.map((p) => {
    const { canvas, audit } = render(f, beat.start + p * (beat.until - beat.start), learningDraw);
    assert(
      !audit.labels.some((l) => l.text.includes('0.215')),
      'the completed confidence-radius formula waits for its construction',
    );
    return rgb(canvas);
  });
  assert(
    evaluateMotionFrames(frames, f.scene.beats[0].motion_check).passed,
    'the same authored motion region must contain the actual sample collection',
  );
});
test('stable descending placement keeps each moving passage clear of settled passage labels', async () => {
  const f = await fixture('reranking-phrase-provider'),
    cue = f.timing.visualCues.find((c) => c.id === 'sort-fixture');
  const times = [
    32.16666666666667,
    ...Array.from({ length: Math.ceil((cue.end - cue.start) * 30) + 1 }, (_, i) =>
      Math.min(cue.end, cue.start + i / 30),
    ),
  ];
  for (const seconds of times) render(f, seconds, rerankingDraw);
  const { audit } = render(f, cue.end + 0.04, rerankingDraw);
  for (const name of ['governing rule', 'audit export', 'password reset', 'troubleshooting'])
    assert(audit.labels.some((l) => l.text === name));
});
test('a fresh concentration result and route wait for the complete measured result clause', async () => {
  const measured = await loadMeasuredTimeline('decision-models-jev-kev');
  const release = measured.scenes.find((scene) => scene.id === 'release');
  const f = await fixture('decision-release-provider', release);
  const cue = f.timing.visualCues.find((c) => c.id === 'fresh-four-choice-score');
  for (const seconds of [
    cue.start - 1 / 30,
    cue.start + 1 / 30,
    (cue.start + cue.end) / 2,
    cue.end - 1 / 30,
  ]) {
    const { audit } = render(f, seconds, decisionDraw);
    assert(
      !audit.labels.some((l) => l.text.includes('Route RUN-843') || l.text.includes('0.60<0.65')),
      'the final computed score and its consequence must remain concealed during the spoken clause',
    );
  }
  const { audit } = render(f, cue.end + 1 / 30, decisionDraw);
  assert(audit.labels.some((l) => l.text.includes('0.60<0.65')));
  assert(audit.labels.some((l) => l.text === 'Route RUN-843 to human review'));
});
test('orchestration results wait for completed clauses and duplicate input precedes its verdict', async () => {
  const lesson = await readRepositoryLesson('videos/lessons/agent-orchestration.lesson.yaml');
  const measured = await loadMeasuredTimeline('agent-orchestration');
  const checks = {
    'parallel-clock': [['parallel-total', 'Parallel: 3 + 0.5 = 3.5 seconds']],
    'validated-join': [
      ['join-eval-rate', '2/100 =2% ≤3%'],
      ['join-health-rate', '4/10,000 =0.04%'],
      ['join-burn-rate', 'burn 0.04/0.1 =0.4×'],
    ],
    transfer: [
      ['fresh-revision-rejection', 'REJECT mixed revisions'],
      ['fresh-duplicate-rejection', 'REJECT duplicate branch'],
    ],
  };
  for (const [id, rules] of Object.entries(checks)) {
    const index = lesson.scenes.findIndex((s) => s.id === id),
      scene = lesson.scenes[index];
    const timing = measured.scenes.find((s) => s.id === id);
    timing.visualCues = resolveSceneCues(scene, timing, timing.sounds);
    const f = { lesson, index, scene, timing };
    for (const [cueID, answer] of rules) {
      const cue = timing.visualCues.find((c) => c.id === cueID);
      for (const seconds of [cue.start + 1 / 30, (cue.start + cue.end) / 2, cue.end - 1 / 30]) {
        const { audit } = render(f, seconds, orchestrationDraw);
        assert(
          !audit.labels.some((l) => l.text.includes(answer)),
          `${cueID}: final result must stay concealed until completion`,
        );
      }
      assert(
        render(f, cue.end + 1 / 30, orchestrationDraw).audit.labels.some((l) =>
          l.text.includes(answer),
        ),
        `${cueID}: completed result must be visible`,
      );
    }
    if (id === 'transfer') {
      const input = timing.visualCues.find((c) => c.id === 'fresh-duplicate-input');
      const { audit } = render(f, input.end + 1 / 30, orchestrationDraw);
      assert(audit.labels.some((l) => l.text.includes('Health · r17/v3 · duplicate identity')));
      assert(!audit.labels.some((l) => l.text.includes('REJECT duplicate branch')));
      assert(!audit.labels.some((l) => l.text.includes('REJECT mixed revisions')));
    }
  }
});
test('RL renders partial backups truthfully and holds completed ratios and fresh decisions', async () => {
  const { draw } = await import('../animations/reinforcement-learning.mjs');
  for (const [name, seconds] of [
    ['rl-bellman-provider', 232.833333333 - 207.233333333],
    ['rl-value-provider', 310.1 - 283.1],
  ]) {
    const f = await fixture(name),
      labels = render(f, seconds, draw).audit.labels.map((v) => v.text);
    assert(labels.includes('Partial evidence backup'));
    assert(
      !labels.includes('Q(new, evidence)'),
      'an interpolated contribution is not an unqualified exact action backup',
    );
  }
  const rules = {
    'rl-ope-provider': [
      ['ope-first-ratio', '×1.6'],
      ['ope-second-ratio', '×1.2'],
      ['ope-product', 'W =1.92'],
    ],
    'rl-reward-provider': [
      ['reward-fresh-return', 'p =0.10 → evidence47.7 < review54'],
      ['reward-fresh-rejection', 'REJECTED: evidence absent'],
      ['reward-fresh-execution', 'Executed action → human review'],
    ],
  };
  for (const [name, checks] of Object.entries(rules)) {
    const f = await fixture(name);
    for (const [id, answer] of checks) {
      const cue = f.timing.visualCues.find((v) => v.id === id);
      for (const time of [cue.start + 1 / 30, (cue.start + cue.end) / 2, cue.end - 1 / 30])
        assert(
          !render(f, time, draw).audit.labels.some((v) => v.text.includes(answer)),
          `${id}: hold the final answer through the complete spoken clause`,
        );
      assert(render(f, cue.end + 1 / 30, draw).audit.labels.some((v) => v.text.includes(answer)));
    }
    if (name === 'rl-reward-provider') {
      const cue = f.timing.visualCues.find((v) => v.id === 'reward-fresh-proposal');
      const labels = render(f, cue.start + 1 / 30, draw).audit.labels.map((v) => v.text);
      assert(labels.includes('proposal in flight toward trusted gate'));
      assert(!labels.includes('proposal reached trusted gate'));
    }
  }
});
