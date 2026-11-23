import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as accelerator from '../animations/accelerator-architecture-field-guide.mjs';
import * as stateSpace from '../animations/state-space-models.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (id, phase = 'after') => ({
  id,
  phase,
  progress: phase === 'before' ? 0 : 1,
  reveal: phase === 'before' ? 0 : 1,
  active: false,
  strength: 0,
  targets: [],
});
const paint = (module, id, beat, beatP, cues) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: '' },
    {
      t: 9,
      duration: 60,
      opacity: 1,
      beat,
      beatP,
      ...(cues ? { cues, cueTiming: 'provider-words' } : {}),
    },
    module.draw,
  );

test('each completed serialized reduction belongs to an actual layer and feeds both route totals', () => {
  const seen = new Set();
  for (let frame = 0; frame <= 1000; frame++) {
    const s = accelerator.sampleModel('topology', { beat: 0, beatP: frame / 1000 });
    seen.add(s.reductions);
    assert.equal(s.layers * s.reductionsPerLayer, 160);
    assert.equal(s.completedLayers * 2 + s.layerTicks.filter(Boolean).length, s.reductions);
    assert.equal(s.layerTicks[1] && !s.layerTicks[0], false);
    assert.deepEqual(
      s.ms,
      [5, 20].map((us) => (s.reductions * us) / 1000),
    );
  }
  assert(seen.has(1) && seen.has(2) && seen.has(159) && seen.has(160));
  const final = accelerator.sampleModel('topology', { beat: 1, beatP: 0.1 });
  assert.deepEqual(final.ms, [0.8, 3.2]);
  const frame = paint(accelerator, 'topology', 1, 0.1);
  assert(frame.labels.some((label) => label.text === '80 layers × 2 reductions / layer = 160'));
  assert(frame.labels.some((label) => label.text === '160 / 160 reductions'));
  assert(
    frame.targets.some(
      (target) => target.id === 'topology-layer-ticks' && target.markCounts.shapes === 2,
    ),
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('selective carry and write compare model-derived x1 and x4 coefficients at the same time', () => {
  const cues = Object.fromEntries(
    ['selective-carry', 'selective-write'].map((id) => [id, cue(id)]),
  );
  cues['selective-readout'] = cue('selective-readout', 'before');
  const frame = paint(stateSpace, 'selection', 1, 0.3, cues);
  for (const x of [1, 4]) {
    const delta = Math.log1p(Math.exp(-1 + 0.3 * x));
    assert(
      frame.labels.some(
        (label) =>
          label.text === `Δ ${delta.toFixed(3)} · retention ${Math.exp(-delta).toFixed(3)}`,
      ),
    );
    assert(
      frame.labels.some((label) => label.text === `write ${(delta * 0.1 * x * x).toFixed(3)}`),
    );
  }
  assert(frame.labels.some((label) => label.text === 'current activation x = 4'));
  assert(frame.targets.some((target) => target.id === 'selection-retention-comparison'));
  assert(frame.targets.some((target) => target.id === 'selection-write-comparison'));
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('the coefficient comparison clears before explaining the input-dependent readout', () => {
  const cues = Object.fromEntries(
    ['selective-carry', 'selective-write', 'selective-readout', 'ssm-selective-state'].map((id) => [
      id,
      cue(id),
    ]),
  );
  cues['ssm-selective-readout'] = cue('ssm-selective-readout', 'before');
  const pending = paint(stateSpace, 'selection', 1, 0.64, cues);
  assert(pending.labels.some((label) => label.text === 'Readout waiting'));
  assert(!pending.labels.some((label) => label.text.startsWith('C × new = ')));
  assert.deepEqual([...pending.issues, ...layoutIssues(pending)], []);
  cues['ssm-selective-readout'] = cue('ssm-selective-readout');
  const frame = paint(stateSpace, 'selection', 1, 0.64, cues);
  assert(!frame.labels.some((label) => label.text === 'reference activation x = 1'));
  assert(!frame.labels.some((label) => label.text === 'current activation x = 4'));
  assert(frame.labels.some((label) => label.text.startsWith('C × new = ')));
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  const next = paint(stateSpace, 'selection', 2, 0.1, cues);
  assert(next.labels.some((label) => label.text === 'sum pending'));
  assert(next.labels.some((label) => label.text === 'Readout waiting'));
  assert(!next.labels.some((label) => label.text.startsWith('C × new = ')));
});
