import { spoken } from '../cue.mjs';
import { budgetAccountingState, budgetAllocationState } from '../model.mjs';
import { retainedAllocation, retainedCard, retainedEquation, retainedText } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const accounting = budgetAccountingState(currentBeat, progress);
    if (scene.beats) {
      const cues = ['budget-forward', 'budget-input', 'budget-weight'];
      accounting.parts.forEach((part, i) => {
        part.amount = spoken(scene, state, cues[i]).progress;
      });
      accounting.completed = accounting.parts.filter((part) => part.amount === 1).length;
      accounting.allocationView = currentBeat === 2;
      accounting.showTraining = spoken(scene, state, 'budget-total').phase === 'after';
    }
    if (accounting.allocationView) {
      const n = scene.beats
        ? 10 + 10 * api.ease(spoken(scene, state, 'budget-resize').progress)
        : budgetAllocationState(state).n;
      const current = { n, d: 100 / n, budget: 100 };
      retainedText(
        ctx,
        api,
        'Normalized compute · fixed product',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      retainedAllocation(ctx, api, current.n, current.d, 400, 400, 24);
      api.focus.target('allocation-n', () =>
        retainedCard(ctx, api, `N = ${current.n.toFixed(1)}`, 1170, 405, 390, themeColors.blue),
      );
      api.focus.target('allocation-d', () =>
        retainedCard(ctx, api, `D = ${current.d.toFixed(1)}`, 1170, 530, 390, themeColors.cyan),
      );
      retainedEquation(
        ctx,
        api,
        `ND=${current.budget.toFixed(0)}`,
        1365,
        740,
        54,
        themeColors.yellow,
        'center',
      );
      return;
    }
    accounting.parts.forEach((part, i) => {
      const color = [themeColors.blue, themeColors.pink, themeColors.cyan][i],
        y = 320 + i * 130;
      api.focus.target('matmul-terms', () =>
        retainedText(
          ctx,
          api,
          part.label,
          230,
          y + 40,
          32,
          part.amount > 0 ? color : themeColors.muted,
        ),
      );
      api.rect(ctx, 650, y, 700, 64, themeColors.panel, themeColors.muted, 1);
      if (part.amount > 0)
        api.focus.target('matmul-terms', () => api.rect(ctx, 650, y, 700 * part.amount, 64, color));
      if (part.amount === 1) retainedEquation(ctx, api, '2N', 1450, y + 45, 40, color);
    });
    if (accounting.completed === 3)
      retainedEquation(
        ctx,
        api,
        String.raw`2N+2N+2N=6N\quad\text{per token}`,
        960,
        755,
        43,
        themeColors.ink,
        'center',
      );
    else
      retainedText(
        ctx,
        api,
        `${accounting.completed} / 3 matrix multiplications counted`,
        960,
        760,
        31,
        themeColors.yellow,
        'center',
      );
    if (accounting.showTraining)
      api.focus.target('training-cost', () =>
        retainedEquation(
          ctx,
          api,
          currentBeat === 2
            ? String.raw`C_{\mathrm{train}}/6\approx ND`
            : String.raw`C_{\mathrm{train}}\approx(2N+2N+2N)D=6ND`,
          960,
          850,
          46,
          themeColors.yellow,
          'center',
        ),
      );
    else
      api.focus.target('training-cost', () =>
        retainedText(
          ctx,
          api,
          'The same weight count contributes to each matrix multiplication',
          960,
          850,
          29,
          themeColors.muted,
          'center',
        ),
      );
  }
}

// The same constrained allocation under different evidence,inventory and deployment contracts.
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-forward',
    'budget-input',
    'budget-weight',
    'budget-total',
    'budget-grid',
    'budget-resize',
  ],
};
