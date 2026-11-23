import { cases } from '../fixtures.mjs';
import { confusion } from '../arithmetic.mjs';
import { sampleModel, visionFrame } from '../model.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawOutcomes(ctx, scene, state, api) {
  const modelState = visionFrame('outcomes', state);
  let wrapped = api;
  if (!modelState.after('original-half-metrics', 1))
    wrapped = {
      ...api,
      math: (...args) =>
        api.text(
          ctx,
          'Precision and recall: awaiting calculation',
          args[2],
          args[3],
          30,
          api.C.muted,
          'center',
        ),
    };
  const originalState = {
    ...state,
    visionScene: 'outcomes',
  };
  const { C: themeColors, teaching: teaching } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    const shown = cases.slice(0, originalModelState.n),
      a = confusion(shown);
    const left = wrapped.focus.target('view-one', () =>
      originalCard(ctx, wrapped, 'R-404 a', 150, 285, 230, themeColors.cyan, 80),
    );
    const right = wrapped.focus.target('view-two', () =>
      originalCard(ctx, wrapped, 'R-404 b', 490, 285, 230, themeColors.cyan, 80),
    );
    const first = wrapped.focus.target('physical-case', () =>
      originalCard(
        ctx,
        wrapped,
        'R-404 · one physical case',
        260,
        420,
        460,
        originalModelState.n ? themeColors.green : themeColors.muted,
        80,
      ),
    );
    for (const source of [left, right])
      teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: first,
          opacity: 1,
        },
        progress: Math.min(1, originalModelState.q * 4),
        color: themeColors.cyan,
        particle: {
          radius: 6,
          fill: themeColors.cyan,
        },
        gap: 14,
      });
    cases
      .slice(1)
      .forEach((row, i) =>
        wrapped.focus.target('later-cases', () =>
          originalCard(
            ctx,
            wrapped,
            row.id + (i + 1 < originalModelState.n ? ' · outcome joined' : ' · awaiting label'),
            260,
            535 + i * 110,
            460,
            i + 1 < originalModelState.n ? themeColors.green : themeColors.muted,
            80,
          ),
        ),
      );
    const ids = (priority, damaged) =>
      shown
        .filter((row) => row.score >= 0.7 === priority && Boolean(row.gold) === damaged)
        .map((row) => row.id)
        .join(' ');
    wrapped.focus.target('case-confusion', () =>
      teaching.grid({
        cellFocusTarget: (row) => (row === 2 ? 'normal-review-outcomes' : 'priority-outcomes'),
        x: 880,
        y: 400,
        width: 860,
        height: 370,
        rows: 3,
        columns: 3,
        labels: [
          ['Case decisions', 'Damaged', 'Clear'],
          ['Priority', `${a.TP}\n${ids(true, true) || '—'}`, `${a.FP}\n${ids(true, false) || '—'}`],
          ['Normal', `${a.FN}\n${ids(false, true) || '—'}`, `${a.TN}\n${ids(false, false) || '—'}`],
        ],
        fontSize: 30,
        padding: 14,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      }),
    );
    wrapped.focus.target('usable-count', () =>
      originalText(
        ctx,
        wrapped,
        'Mature usable cases: ' + originalModelState.n + ' / 4',
        960,
        320,
        34,
        themeColors.ink,
        'center',
      ),
    );
    if (originalModelState.n === 4)
      wrapped.focus.target('precision-recall', () =>
        wrapped.math(
          ctx,
          String.raw`\mathrm{precision}=\frac1{1+1}\quad\quad\mathrm{recall}=\frac1{1+1}`,
          960,
          900,
          42,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'outcomes',
  draw: drawOutcomes,
  cues: [
    'outcomes-b1-1',
    'outcomes-b1-2',
    'outcomes-b1-3',
    'dv-original-case-table',
    'outcomes-b2-1',
    'outcomes-b2-2',
    'dv-original-half-metrics',
  ],
};
