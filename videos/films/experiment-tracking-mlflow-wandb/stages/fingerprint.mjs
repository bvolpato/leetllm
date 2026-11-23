import { CASES } from '../fixtures.mjs';
import { fingerprint } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawFingerprint(ctx, scene, state, api) {
  const { C } = api;
  const at = cueClock(scene, state);
  const sorted = at('sort-inputs') === 1;
  const edited = at('edit-expectation') === 1;
  const ordered = sorted ? [...CASES].sort((a, b) => a.caseId.localeCompare(b.caseId)) : CASES;
  const rows = ordered.map((r) =>
    edited && r.id === 'known good' ? { ...r, expected: 'ABSTAIN' } : r,
  );
  api.text(ctx, 'Case ID', 130, 289, 33, C.muted);
  api.text(ctx, 'Evidence in the fixture', 650, 289, 33, C.muted);
  api.text(ctx, 'Expected route', 1380, 289, 33, C.muted);
  api.line(ctx, 130, 328, 1760, 328, C.muted, 2);
  rows.forEach((r, i) => {
    api.focus.target('suite-rows', () => {
      const y = 400 + i * 91;
      api.text(ctx, r.caseId, 130, y, 39, C.ink, 'left', 'mono');
      api.text(ctx, r.evidence, 650, y, 40, C.ink);
      api.text(ctx, r.expected, 1380, y, 41, edited && r.id === 'known good' ? C.pink : C.cyan);
    });
  });
  api.focus.target('digests', () => {
    api.line(ctx, 130, 745, 1760, 745, C.muted, 2);
    api.text(ctx, 'Frozen suite', 130, 832, 35, C.ink);
    api.text(ctx, fingerprint(CASES).slice(0, 16), 685, 832, 38, C.cyan, 'left', 'mono');
    api.text(ctx, 'Working copy', 130, 929, 35, C.ink);
    api.text(
      ctx,
      fingerprint(rows).slice(0, 16),
      685,
      929,
      38,
      edited ? C.pink : C.cyan,
      'left',
      'mono',
    );
    api.text(ctx, 'SHA-256 prefixes', 1375, 929, 29, C.muted);
  });
}
export default {
  id: 'fingerprint',
  draw: drawFingerprint,
  cues: ['freeze-suite', 'identify-rows', 'sort-inputs', 'edit-expectation', 'compare-hashes'],
};
