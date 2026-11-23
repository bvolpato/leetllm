import { CASES } from '../fixtures.mjs';
import { readReport } from '../model.mjs';
import { caseNames, cueClock } from '../report-picture.mjs';

export function drawLineage(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const copy = at('file-by-id');
  const damaged = at('duplicate-bytes') === 1 && at('restore-bytes') < 1;
  const { run: record, report, verification } = readReport(damaged);
  const checked = damaged ? at('check-copy') === 1 : at('check-original') === 1;
  const x = (slot) => 125 + 430 * slot;
  const slotOf = (row) => CASES.findIndex((c) => c.caseId === row.caseId);

  api.focus.target('receipt', () => {
    api.text(ctx, 'Run 3   /   saved report', 125, 244, 34, C.cyan);
    api.text(
      ctx,
      'Logged matches   ' + record.metrics.exact + ' / ' + record.metrics.count,
      125,
      319,
      47,
      C.ink,
    );
    api.text(ctx, 'Report SHA-256 prefix', 1090, 245, 29, C.muted);
    api.text(
      ctx,
      record.artifacts.report.digest.slice(0, 16),
      1090,
      317,
      42,
      C.ink,
      'left',
      'mono',
    );
  });
  api.line(ctx, 120, 363, 1790, 363, C.muted, 2);
  api.focus.target('slots', () => {
    CASES.forEach((row, i) => {
      api.text(ctx, caseNames[i], x(i), 453, 35, C.ink);
      api.text(ctx, row.caseId, x(i), 506, 34, C.cyan, 'left', 'mono');
      api.line(ctx, x(i), 534, x(i) + 360, 534, C.cyan, 2);
    });
  });
  api.focus.target('saved-rows', () => {
    const seen = new Map();
    report.forEach((row, i) => {
      const slot = slotOf(row);
      const occurrence = seen.get(slot) ?? 0;
      seen.set(slot, occurrence + 1);
      // An extra copy travels through the empty lane below the other three rows.
      const travel = occurrence ? copy : 1;
      const col = occurrence ? i + (slot - i) * Math.max(0, (travel - 0.32) / 0.68) : slot;
      const y = 565 + (occurrence ? 125 * Math.min(1, travel / 0.32) : 0);
      const left = x(col);
      api.rect(ctx, left, y, 360, 100, C.panel, C.muted, 9);
      api.text(ctx, row.caseId, left + 18, y + 43, 32, C.ink, 'left', 'mono');
      api.text(ctx, row.predicted, left + 18, y + 82, 28, C.muted);
    });
  });
  api.focus.target('readback', () => {
    const prompt = damaged
      ? checked
        ? 'Two incident rows. No result for the missing approval.'
        : 'Which case has no saved result?'
      : 'One saved result per frozen case';
    api.text(ctx, prompt, 125, 874, 37, damaged && !checked ? C.yellow : C.ink);
    api.text(ctx, 'verifyRun(record).valid', 125, 969, 37, C.muted, 'left', 'mono');
    api.text(
      ctx,
      checked ? String(verification.valid) : '?',
      785,
      969,
      47,
      checked ? (verification.valid ? C.green : C.pink) : C.yellow,
    );
    if (damaged && checked)
      api.text(ctx, 'Missing row   ' + CASES[3].caseId, 1125, 969, 37, C.pink, 'left', 'mono');
  });
}
export default {
  id: 'lineage',
  draw: drawLineage,
  cues: [
    'open-report',
    'check-original',
    'duplicate-bytes',
    'file-by-id',
    'ask-missing',
    'check-copy',
    'restore-bytes',
  ],
};
