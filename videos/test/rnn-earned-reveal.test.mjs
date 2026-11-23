import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/rnn-memory.mjs';
registerLessonFonts();
const ids = [
  'fresh-first-result',
  'fresh-second-result',
  'fresh-pad-result',
  'rnn-transfer-result',
  'fresh-detach-consequence',
  'fresh-skip-preservation',
];
function paint(after) {
  const cues = Object.fromEntries(
    ids.map((id) => [
      id,
      {
        phase: after.includes(id) ? 'after' : 'before',
        progress: after.includes(id) ? 1 : 0,
        active: false,
        strength: 0,
      },
    ]),
  );
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'earned-transfer', title: 'Choose the valid ending of a new incident' },
    { beat: 1, beatP: 0.99, opacity: 1, cues },
    draw,
  );
}
const footer = (a) => a.labels.find((l) => l.y > 980 && l.y < 1020)?.text;
test('the new incident footer reveals each boundary answer only after its complete corresponding clause', () => {
  const neutral = paint([]);
  assert.equal(footer(neutral), 'Complete the real-state and filler-state trace before answering.');
  const ending = paint(['rnn-transfer-result']);
  assert.equal(footer(ending), 'Read the last real state; inspect the filler update separately.');
  const detach = paint(['rnn-transfer-result', 'fresh-detach-consequence']);
  assert.equal(footer(detach), 'Detaching changes the graph; the filler value remains unchanged.');
  const preserved = paint([
    'rnn-transfer-result',
    'fresh-detach-consequence',
    'fresh-skip-preservation',
  ]);
  assert.equal(footer(preserved), 'Skip or mask padding, or pack length 2, to preserve h₂.');
  for (const a of [neutral, ending, detach, preserved])
    assert.deepEqual([...(a.issues ?? []), ...layoutIssues(a)], []);
});
test('the footer repair preserves every computed state while staging the secondary detach annotation', () => {
  const states = [
      'fresh-first-result',
      'fresh-second-result',
      'fresh-pad-result',
      'rnn-transfer-result',
    ],
    before = paint(states),
    after = paint([...states, 'fresh-detach-consequence', 'fresh-skip-preservation']);
  const numeric = (a) =>
    a.labels
      .filter((l) => /^h[123] = /.test(l.text))
      .map((l) => ({ text: l.text, x: l.x, y: l.y }));
  assert.deepEqual(numeric(before), numeric(after));
  assert.equal(numeric(before).length, 3);
  assert(before.labels.some((l) => l.text === 'filler state after the real ending'));
  assert(!before.labels.some((l) => l.text === 'detach keeps this wrong value'));
  assert(after.labels.some((l) => l.text === 'detach keeps this wrong value'));
});
