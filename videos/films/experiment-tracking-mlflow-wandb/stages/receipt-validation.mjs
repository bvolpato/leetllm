import { sha } from '../arithmetic.mjs';
import { runs, verifyRun } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawReceiptValidation(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const record = structuredClone(runs[2]);
  const corruptCount = at('boolean-count') === 1 && at('restore-count') < 1;
  const corruptManifest = at('string-flag') === 1;
  if (corruptCount) record.metrics.count = true;
  if (corruptManifest) {
    const file = record.artifacts.manifest;
    file.bytes = JSON.stringify({ ...JSON.parse(file.bytes), simulation: 'true' });
    file.digest = sha(file.bytes);
  }
  const sim = JSON.parse(record.artifacts.manifest.bytes).simulation;
  api.focus.target('fields', () => {
    api.text(ctx, 'Run 3   /   local verification', 125, 282, 38, C.cyan);
    api.text(ctx, 'Field', 125, 415, 33, C.muted);
    api.text(ctx, 'Required type', 786, 415, 33, C.muted);
    api.text(ctx, 'Saved value', 1400, 415, 33, C.muted);
    const entries = [
      ['Case count', 'Finite number', JSON.stringify(record.metrics.count)],
      ['Simulation flag', 'Boolean', JSON.stringify(sim)],
    ];
    entries.forEach(([field, type, value], i) => {
      const y = 538 + i * 140;
      api.text(ctx, field, 125, y, 44, C.ink);
      api.text(ctx, type, 786, y, 40, C.ink);
      api.text(ctx, value, 1400, y, 44, C.cyan, 'left', 'mono');
    });
  });
  api.focus.target('type-check', () => {
    const result = verifyRun(record);
    api.line(ctx, 125, 780, 1760, 780, C.muted, 2);
    api.text(ctx, 'verifyRun(record).valid', 125, 897, 40, C.muted, 'left', 'mono');
    api.text(
      ctx,
      String(result.valid),
      920,
      897,
      48,
      result.valid ? C.green : C.pink,
      'left',
      'mono',
    );
  });
}
export default {
  id: 'receipt-validation',
  draw: drawReceiptValidation,
  cues: ['check-types', 'boolean-count', 'restore-count', 'string-flag', 'scope-check'],
};
