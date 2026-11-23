import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { evaluateMotionFrames } from '../lib/motion-audit.mjs';
import * as model from '../animations/recommendation.mjs';
registerLessonFonts();
const ids = [
  'tower-query-components',
  'tower-guide-components',
  'tower-runbook-components',
  'tower-blog-components',
  'tower-projection',
];
const cuesFor = (amounts) =>
  Object.fromEntries(
    ids.map((id, i) => {
      const progress = amounts[i] ?? 0;
      return [
        id,
        {
          phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
          progress,
          active: false,
          strength: 0,
          targets: ['two-tower-retrieval-construction'],
        },
      ];
    }),
  );
function paint(amounts) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id: 'two-tower-retrieval', title: 'Compare vectors to retrieve a shortlist' },
    { beat: 1, beatP: 0.99, opacity: 1, cues: cuesFor(amounts) },
    model.draw,
  );
  const rgba = ctx.getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    data[j++] = rgba[i];
    data[j++] = rgba[i + 1];
    data[j++] = rgba[i + 2];
  }
  return { audit, frame: { width: 1920, height: 1080, data } };
}
test('spoken supplied coordinates construct persistent item vectors inside the declared teaching region', () => {
  const stages = [
    [0.3, 0, 0, 0, 0],
    [1, 1, 0.2, 0, 0],
    [1, 1, 1, 1, 0.6],
  ].map(paint);
  const motion = evaluateMotionFrames(
    stages.map((s) => s.frame),
    { region: [250, 350, 700, 465], minimumChangedFraction: 0.002 },
  );
  assert(motion.passed, JSON.stringify(motion.pairs));
  assert(!stages[0].audit.labels.some((l) => l.text.startsWith('item v =')));
  assert.equal(stages[1].audit.labels.filter((l) => l.text.startsWith('item v =')).length, 1);
  assert.equal(stages[2].audit.labels.filter((l) => l.text.startsWith('item v =')).length, 3);
  for (const s of stages)
    assert.deepEqual([...(s.audit.issues ?? []), ...layoutIssues(s.audit)], []);
});
test('component construction follows the supplied coordinates and completes scores only at the result anchor', () => {
  for (let k = 0; k <= 20; k++) {
    const q = k / 20,
      m = model.twoTowerConstructionFor(1, 0.99, cuesFor([1, q, 0, 0, q]));
    assert.deepEqual(
      m.items.map((item) => item.id),
      ['api-guide', 'retry-runbook', 'blog-post'],
    );
    assert.deepEqual(m.items[0].point, [0.9 * Math.min(1, 2 * q), 0.1 * Math.max(0, 2 * q - 1)]);
    assert(m.items.every((item) => item.resultKnown === (q === 1)));
  }
  const before = paint([1, 1, 1, 1, 0.999]),
    after = paint([1, 1, 1, 1, 1]);
  for (const text of ['0.9', '0.8', '0.2']) {
    assert(!before.audit.labels.some((l) => l.x > 1700 && l.text === text));
    assert(after.audit.labels.some((l) => l.x > 1700 && l.text === text));
  }
});
