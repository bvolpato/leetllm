import { PI_SOURCE } from '../fixtures.mjs';
import { typedEvidenceDecision } from '../model.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawTypedEvidence(ctx, scene, state, api) {
  const { C } = api;
  const began = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const progress = (id) => cueProgress(state.cues, id, 0);
  const unresolved = began('evidence-gap');
  const showDecision = after('evidence-open');
  const clean = began('evidence-clean');
  const extra = !clean && began('evidence-extra');
  const record = { candidate: PI_SOURCE.candidate, suite: PI_SOURCE.suite, gate: PI_SOURCE.gate };
  if (extra) Object.assign(record, { tool: 'promote_model', approved: true });
  const result = typedEvidenceDecision(record);
  const allowed = clean && result.accepted && !unresolved;
  const stopped = extra && !result.accepted && after('evidence-stop');
  const x = allowed
    ? 132 + 1000 * progress('evidence-through')
    : extra
      ? 132 + 302 * progress('evidence-stop')
      : 132;
  const text = (s, xx, yy, size, color = C.ink) => drawPromptText(ctx, api, s, xx, yy, size, color);

  text('Reader output', 130, 290, 34, C.blue);
  text('Host check', 814, 290, 34, C.cyan);
  text('Checked evidence', 1240, 290, 34, C.cyan);
  api.focus.target('evidence-boundary', () => {
    api.line(ctx, 974, 340, 974, 393, C.cyan, 7);
    api.line(ctx, 974, 644, 974, 816, C.cyan, 7);
  });
  api.focus.target('evidence-sheet', () => {
    // Compare an entire record. An extra key rejects the whole sheet.
    const rows = unresolved
      ? [
          ['candidate', 'C17'],
          ['suite', 'R42'],
          ['gate', 'Unknown'],
        ]
      : Object.entries(record);
    api.rect(ctx, x, 407, 536, rows.length * 66 + 24, C.panel, stopped ? C.pink : C.blue, 7);
    rows.forEach(([key, value], i) => {
      const color = i >= 3 ? C.yellow : C.ink;
      text(key, x + 25, 463 + i * 66, 29, C.muted);
      text(String(value), x + 226, 463 + i * 66, 36, color);
    });
  });
  api.focus.target('evidence-source', () => {
    if (allowed && after('evidence-stamp')) {
      api.line(ctx, 1134, 663, 1668, 663, C.blue, 4);
      text('Host source   /   ' + result.record.source_id, 1134, 718, 29, C.blue);
    } else if (clean && !unresolved) {
      text('Expected source values', 1150, 760, 27, C.muted);
      text('C17   /   R42   /   passed', 1150, 811, 34);
    } else {
      text(unresolved ? 'Source has no gate result' : 'Expected keys', 1165, 463, 30, C.muted);
      if (!unresolved || showDecision)
        text(unresolved ? 'Eligibility unresolved' : 'candidate   suite   gate', 1165, 530, 34);
    }
  });
  api.focus.target('evidence-outcome', () => {
    api.line(ctx, 126, 866, 1792, 866, C.muted, 2);
    let label = 'Release writes   0';
    if (stopped) label = 'Record rejected   ·   No fields crossed';
    if (allowed && after('evidence-through')) label = 'Record accepted   ·   Release writes   0';
    if (unresolved) label = showDecision
      ? 'Return the supported facts. Leave the release decision open.'
      : 'What can the host report?';
    text(label, 132, 956, 38, stopped ? C.pink : C.ink);
  });
}
export default {
  id: 'typed-evidence',
  draw: drawTypedEvidence,
  cues: [
    'evidence-keys',
    'evidence-extra',
    'evidence-stop',
    'evidence-clean',
    'evidence-through',
    'evidence-stamp',
    'evidence-gap',
    'evidence-open',
  ],
};
