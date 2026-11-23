import { facts } from '../fixtures.mjs';
import { triageDecision } from '../model.mjs';
import { chapterText } from '../defaults.mjs';
import { paperLine } from '../incident-picture.mjs';

export function drawGuardedRecommendation(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const showPair = beat > 0;
  paperLine(
    ctx,
    api,
    'Development case',
    'Unpaged P1 · the revised reply at minute 31 said false.',
    244,
    C.pink,
  );
  const columns = [235, 600, 995, 1420];
  ['P1 clock', 'Rule limit', 'Expected overdue', 'Next prompt'].forEach((s, i) =>
    chapterText(ctx, api, s, columns[i], 490, 32, C.muted),
  );
  [facts.deadline, facts.deadline + 1].forEach((elapsed, i) => {
    if (!showPair && i === 0) return;
    const ref = triageDecision({ ...facts, elapsed });
    const y = 602 + i * 130;
    focus.target(i === 0 ? 'exact-limit-row' : 'late-row', () => {
      chapterText(ctx, api, elapsed + ' min', columns[0], y, 44, C.ink);
      chapterText(ctx, api, ref.deadline_minutes + ' min', columns[1], y, 44, C.ink);
      chapterText(ctx, api, String(ref.overdue), columns[2], y, 44, C.green);
    });
    focus.target('unmeasured-replies', () =>
      chapterText(ctx, api, 'Untested', columns[3], y, 36, C.muted),
    );
    api.line(ctx, 210, y + 35, 1710, y + 35, C.muted, 2);
  });
  const next = [
    'What is the last minute when overdue should still be false?',
    'At the limit: false. One minute later: true.',
    'Compare on separate development cases, then test the chosen prompt on untouched incidents.',
  ];
  chapterText(ctx, api, next[beat], 960, 944, beat === 2 ? 31 : 39, C.yellow, 'center');
}
export default {
  id: 'guarded-recommendation',
  draw: drawGuardedRecommendation,
  cues: ['inspect-late-case', 'inspect-limit-case', 'measure-revision'],
};
