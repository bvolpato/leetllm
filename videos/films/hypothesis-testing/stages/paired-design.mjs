import { mix } from '../arithmetic.mjs';
import { paired } from '../fixtures.mjs';
import {
  cueProgress,
  pairedDifferenceFocusTarget,
  pairedOutcomeFocusTarget,
  resultOrOperation,
  slug,
} from '../model.mjs';
import { card, legacyText, mark } from '../defaults.mjs';

const signed = (value) => (value > 0 ? `+${value}` : String(value));

export function drawPairedDesign(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    cp = (id, beat, a, z) => cueProgress(state, id, beat, a, z),
    on = (id, beat) => resultOrOperation(state, id, beat);
  const pendingTargets = {
    intro: [1, 'intro-receipt', 'intro-lift', 'Lift pending', 960, 930, 34],
    'paired-design': [
      1,
      'pair-lift',
      'paired-observed-lift',
      'Observed lift pending',
      935,
      895,
      30,
    ],
    'forty-tasks': [1, 'forty-lift', 'forty-lift', 'Net lift pending', 960, 900, 34],
    'p-value': [0, 'tail-result', 'tail-result', 'Tail probability pending', 960, 890, 32],
    search: [0, 'search-risk', 'family-risk', 'Family error calculation pending', 960, 710, 32],
    'useful-lift': [1, 'useful-hold', 'development-receipt', 'Decision pending', 960, 945, 34],
    'pass-at-k': [1, 'subset-count', 'subset-counts', 'Subset totals pending', 960, 985, 29],
    holdout:
      currentBeat === 0
        ? [0, 'holdout-count', 'holdout-counts', 'Group counts pending', 960, 925, 34]
        : currentBeat === 1
          ? [1, 'holdout-lift', 'holdout-lift', 'Lift calculation pending', 960, 830, 34]
          : [2, 'release-receipt', 'release-receipt', 'Decision pending', 960, 1035, 30],
  };
  const pending = pendingTargets['paired-design'];
  if (pending && currentBeat === pending[0] && !on(pending[1], pending[0]))
    mark(api, pending[2], () =>
      legacyText(
        ctx,
        api,
        pending[3],
        pending[4],
        pending[5],
        pending[6],
        themeColors.muted,
        'center',
      ),
    );
  {
    if (currentBeat === 0) {
      mark(api, 'paired-task-source', () => {
        card(ctx, api, 'Preserve an explicit denial', 180, 340, 650, 130, themeColors.yellow, 35);
        legacyText(
          ctx,
          api,
          'Same prompt and hidden tests',
          505,
          530,
          31,
          themeColors.muted,
          'center',
        );
      });
      const p = cp('pair-results', 0, 0.45, 0.85);
      mark(api, 'permission-pair', () => {
        card(ctx, api, 'A: fail', mix(330, 1040, p), 625, 250, 110, themeColors.blue, 36);
        card(
          ctx,
          api,
          p === 1 ? 'B: pass' : 'B: pending',
          mix(710, 1430, p),
          625,
          300,
          110,
          themeColors.green,
          35,
        );
      });
      legacyText(
        ctx,
        api,
        'One task identity holds both outcomes',
        960,
        880,
        36,
        themeColors.cyan,
        'center',
      );
    } else {
      mark(api, 'paired-table', () => {
        legacyText(ctx, api, 'Matched task', 360, 325, 28, themeColors.muted, 'center');
        legacyText(ctx, api, 'A', 745, 325, 30, themeColors.blue, 'center');
        legacyText(ctx, api, 'B', 1025, 325, 30, themeColors.green, 'center');
        if (currentBeat < 2)
          legacyText(ctx, api, 'B − A', 1305, 325, 30, themeColors.yellow, 'center');
        paired.forEach((r, i) => {
          const y = 370 + i * 67;
          mark(api, `paired-task-${slug(r.task)}`, () =>
            card(ctx, api, r.task, 150, y, 440, 54, themeColors.muted, 27),
          );
          for (const [m, x] of [
            ['a', 625],
            ['b', 905],
          ])
            mark(api, pairedOutcomeFocusTarget(r, m), () =>
              card(
                ctx,
                api,
                r[m] ? 'pass' : 'fail',
                x,
                y,
                245,
                54,
                m === 'a' ? themeColors.blue : themeColors.green,
                27,
              ),
            );
        });
      });
      if (currentBeat >= 2)
        mark(api, 'paired-differences', () => {
          legacyText(ctx, api, 'B − A', 1305, 325, 30, themeColors.yellow, 'center');
          paired.forEach((r, i) => {
            const difference = r.b - r.a;
            const visible = difference === 0 ? cp('pair-ties', 2) === 1 : on('pair-permission', 2);
            const color = difference > 0 ? themeColors.green : themeColors.pink;
            mark(api, pairedDifferenceFocusTarget(r), () =>
              card(
                ctx,
                api,
                visible ? signed(difference) : '?',
                1195,
                370 + i * 67,
                220,
                54,
                visible && difference !== 0 ? color : themeColors.muted,
                28,
              ),
            );
          });
        });
      if (on('pair-lift', 1)) {
        const net = paired.reduce((sum, row) => sum + row.b - row.a, 0);
        mark(api, 'paired-observed-lift', () =>
          card(
            ctx,
            api,
            `Observed lift ${signed(net)}/${paired.length}`,
            610,
            845,
            650,
            85,
            themeColors.yellow,
            34,
          ),
        );
      }
    }
  }
}
export default {
  id: 'paired-design',
  draw: drawPairedDesign,
  cues: [
    'pair-prompt',
    'pair-results',
    'pair-table',
    'pair-lift',
    'pair-differences',
    'pair-ties',
    'pair-permission',
  ],
};
