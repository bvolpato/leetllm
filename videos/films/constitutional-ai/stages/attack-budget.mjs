import { budgetProbability } from '../arithmetic.mjs';
import { logicalState, voice } from '../construction.mjs';
import {
  drawAuditEquation,
  drawAuditText,
  drawBlock,
  drawFooter,
  withFocus,
} from '../defaults.mjs';
export function drawAttackBudget(ctx, scene, state, api) {
  state = logicalState('attack-budget', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat);
  {
    const independent = currentBeat === 0;
    drawAuditText(
      ctx,
      api,
      independent
        ? 'Each independent attempt reveals a failure with probability 0.10'
        : 'The same tasks fail on every attempt',
      960,
      310,
      34,
      themeColors.ink,
      'center',
    );
    withFocus(ctx, api, independent ? 'independent-budget' : 'dependent-budget', () =>
      [1, 2, 10].forEach((n, i) => {
        const value = budgetProbability(n, independent),
          y = 435 + i * 165,
          ready = independent
            ? cueProgress(['budget-one', 'budget-two', 'attack-budget-1'][i])
            : cueProgress('attack-budget-2');
        drawAuditText(
          ctx,
          api,
          n + ' attempt' + (n > 1 ? 's' : ''),
          170,
          y + 44,
          33,
          themeColors.blue,
        );
        api.line(ctx, 650, y + 74, 1750, y + 74, themeColors.muted, 2);
        if (ready) {
          drawBlock(
            ctx,
            api,
            650,
            y,
            1100 * value * ready,
            65,
            independent ? themeColors.green : themeColors.yellow,
          );
          drawAuditText(
            ctx,
            api,
            ready < 1 ? 'calculating' : (100 * value).toFixed(1) + '%',
            1670,
            y + 45,
            34,
            independent ? themeColors.green : themeColors.yellow,
            'center',
          );
        }
      }),
    );
    if (independent) drawAuditEquation(ctx, api, '1-(1-0.1)^k', 960, 960, 44, themeColors.yellow);
    else if (cueProgress('attack-budget-2'))
      drawAuditEquation(
        ctx,
        api,
        String.raw`P(\text{at least one failure})=0.10`,
        960,
        960,
        44,
        themeColors.yellow,
      );
    drawFooter(ctx, api, 'Chance of finding at least one failure on a task');
  }
}
export default {
  id: 'attack-budget',
  draw: drawAttackBudget,
  cues: ['attack-budget-1', 'budget-one', 'budget-two', 'attack-budget-2'],
};
