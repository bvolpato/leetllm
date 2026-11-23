import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  fittedEtaFixture,
  decisions,
} from '../animations/capstone-delivery-eta-prediction.mjs';
const lesson = await readLesson(
  new URL('../lessons/capstone-delivery-eta-prediction.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
const cases = [
  [
    'conformal-calibration',
    1,
    'conformal-five-rank',
    (a) => a.labels.some((l) => l.text.includes('0.9\\rceil=5')),
  ],
  [
    'conformal-calibration',
    1,
    'conformal-infinite',
    (a) => a.labels.some((l) => l.text === 'rank5 absent → radius∞'),
  ],
  [
    'conformal-calibration',
    1,
    'conformal-nine',
    (a) => a.labels.some((l) => l.text === 'rank9 exists → radius9h'),
  ],
  ['cost-threshold', 0, 'expected-cost', (a) => a.labels.some((l) => l.text === '6.4')],
  [
    'cost-threshold',
    0,
    'silent-expected-cost',
    (a) => a.labels.some((l) => l.text === '12' && l.x > 650),
  ],
  [
    'cost-threshold',
    0,
    'expected-cost-choice',
    (a) => a.labels.some((l) => l.text === '6.4 <12 → warn has lower expected penalty'),
  ],
  [
    'cost-threshold',
    1,
    'standard-threshold-result',
    (a) => a.labels.some((l) => l.text === 'standard: 8/68 ≈0.117647'),
  ],
  [
    'cost-threshold',
    1,
    'expedited-threshold-result',
    (a) => a.labels.some((l) => l.text === 'expedited: 8/158 ≈0.050633'),
  ],
  ...fittedEtaFixture().contributions.map((v, i) => [
    'fitted-predictions',
    0,
    [
      'fitted-contribution-scan',
      'fitted-contribution-backlog',
      'fitted-contribution-tier',
      'fitted-contribution-elapsed',
      'fitted-contribution-promise',
    ][i],
    (a) => a.labels.some((l) => l.text === v.toFixed(3) && l.x > 1600),
  ]),
  [
    'fitted-predictions',
    0,
    'fitted-logit',
    (a) => a.labels.some((l) => l.text.startsWith('intercept−0.832 → logit')),
  ],
  [
    'fitted-predictions',
    0,
    'fitted-probability',
    (a) => a.labels.some((l) => l.text.startsWith('sigmoid ')),
  ],
  [
    'fitted-predictions',
    0,
    'fitted-action',
    (a) => a.labels.some((l) => l.text.includes('SILENT')),
  ],
  ['fitted-predictions', 1, 'fitted-arrival', (a) => a.labels.some((l) => l.text === '8.371h')],
  [
    'fitted-predictions',
    1,
    'missed-expedited',
    (a) => a.labels.some((l) => l.text === 'S-133 missed expedited warning:150'),
  ],
  [
    'fitted-predictions',
    1,
    'final-cost-sum',
    (a) => a.labels.some((l) => l.text === 'S-126 false warning:8 → final total158'),
  ],
  [
    'fitted-predictions',
    2,
    'age-rule-baseline',
    (a) => a.labels.some((l) => l.text === '1410' && l.x < 450),
  ],
  [
    'fitted-predictions',
    2,
    'silent-rule-baseline',
    (a) => a.labels.some((l) => l.text === '1410' && l.x > 450),
  ],
  ['fitted-predictions', 2, 'always-warn-baseline', (a) => a.labels.some((l) => l.text === '88')],
  [
    'fitted-predictions',
    2,
    'fitted-slice-results',
    (a) =>
      a.labels.some((l) => l.text === 'missed expedited1/7' || l.text === 'missed standard0/6'),
  ],
  [
    'fitted-predictions',
    3,
    'eta-error-comparison',
    (a) => a.labels.some((l) => l.text === '4.203' || l.text === '2.479'),
  ],
  [
    'fitted-predictions',
    3,
    'failed-cost-gate',
    (a) => a.labels.some((l) => l.text === 'HOLD: warning cost gate failed'),
  ],
  ['synthesis', 1, 'fresh-scan-answer', (a) => a.labels.some((l) => l.text.includes('1.5 h old'))],
  ['synthesis', 2, 'fresh-median', (a) => a.labels.some((l) => l.text.includes('duration   11 h'))],
  [
    'synthesis',
    2,
    'fresh-arrival-answer',
    (a) => a.labels.some((l) => l.text.endsWith('=  20:00')),
  ],
  [
    'synthesis',
    3,
    'fresh-warn-answer',
    (a) => a.labels.some((l) => l.text === 'Propose a warning'),
    ['fresh-policy-switch'],
  ],
];
function paint(id, beat, result, progress, pending = []) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          {
            ...c,
            phase: i <= beat ? 'after' : 'before',
            progress: i <= beat ? 1 : 0,
            strength: 0,
            active: false,
          },
        ]),
      ),
    );
  if (id === 'conformal-calibration' && result !== 'conformal-nine')
    for (const id of ['conformal-nine', 'conformal-nine-inputs', 'conformal-nine-rank'])
      cues[id] = { phase: 'before', progress: 0, strength: 0, active: false };
  for (const id of pending)
    cues[id] = { ...cues[id], phase: 'before', progress: 0, strength: 0, active: false };
  if (result)
    cues[result] = {
      phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
      progress,
      strength: 0,
      active: false,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 35, duration: 100, opacity: 1, beat, beatP: 0.75, cueTiming: 'explicit-test-cues', cues },
    draw,
  );
}
for (const [id, beat, cue, has, pending] of cases)
  test(`${id}: ${cue} waits for its complete result clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(has(paint(id, beat, cue, p, pending)), false, `${cue} at ${p}`);
    assert.equal(
      has(paint(id, beat, cue, 1, pending)),
      true,
      'completed result is actually painted',
    );
  });
test('unrevealed expected and baseline costs say pending rather than presenting a numeric zero', () => {
  const cost = paint('cost-threshold', 0, 'expected-cost', 0);
  assert(!cost.labels.some((l) => l.text === '0' && l.x > 300 && l.y < 800));
  const baseline = paint('fitted-predictions', 2, 'always-warn-baseline', 0);
  assert(!baseline.labels.some((l) => l.text === '0' && l.x > 900 && l.y < 850));
  assert(baseline.labels.some((l) => l.text === 'pending' && l.x > 900));
});
test('every warning and penalty uses the exact threshold visibly displayed at each sweep position', () => {
  const phases = ['sweep-first', 'sweep-standard', 'sweep-finish'];
  const visited = new Set();
  for (const [i, phase] of phases.entries()) {
    for (let step = 0; step <= 40; step++) {
      const a = paint('selection', 0, phase, step / 40, phases.slice(i + 1));
      const percent = Number(
        a.labels.find((l) => l.text.startsWith('Warn at ')).text.match(/(\d+)%/)[1],
      );
      visited.add(percent);
      const threshold = percent / 100,
        expected = decisions(threshold),
        actions = a.labels
          .filter((l) => l.text === 'WARN' || l.text === 'TRACK')
          .sort((a, b) => a.y - b.y),
        penalties = a.labels.filter((l) => l.text.startsWith('Penalty ')).sort((a, b) => a.y - b.y);
      assert.deepEqual(
        actions.map((l) => l.text),
        expected.map((r) => (r.warn ? 'WARN' : 'TRACK')),
        `displayed threshold ${threshold} during ${phase}`,
      );
      assert.deepEqual(
        penalties.map((l) => Number(l.text.slice(8))),
        expected.map((r) => r.penalty),
      );
      assert(
        a.labels.some(
          (l) => l.text === 'Total penalty: ' + expected.reduce((s, r) => s + r.penalty, 0),
        ),
      );
    }
  }
  assert.deepEqual(
    [...visited],
    Array.from({ length: 41 }, (_, i) => 40 + i),
  );
});
