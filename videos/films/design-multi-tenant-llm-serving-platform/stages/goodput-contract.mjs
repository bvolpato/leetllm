import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawGoodputContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('goodput-contract', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'goodput-contract', () => {
    drawConstructionText(
      ctx,
      api,
      'Successful completion AND first ≤ 800 ms AND every observed gap ≤ 120 ms',
      135,
      290,
      29,
      themeColors.yellow,
    );
    const columns = [190, 510, 870, 1220, 1600];
    ['Request', 'Terminal', 'First output', 'Worst gap', 'Joint gate'].forEach((v, i) =>
      drawConstructionCenter(ctx, api, v, columns[i], 365, 28, themeColors.muted),
    );
    modelState.rows.forEach((r, i) => {
      const y = 440 + i * 105;
      drawConstructionLine(ctx, api, 120, y + 48, 1800, y + 48, themeColors.muted, 1);
      drawConstructionCenter(ctx, api, r.id, columns[0], y, 31, themeColors.cyan);
      const inputsVisible = r.checked || (i < 2 ? currentBeat === 0 : currentBeat > 0);
      drawConstructionCenter(
        ctx,
        api,
        inputsVisible ? (r.complete ? 'complete' : 'failed') : '?',
        columns[1],
        y,
        29,
        themeColors.ink,
      );
      drawConstructionCenter(
        ctx,
        api,
        inputsVisible ? r.first + ' ms' : '?',
        columns[2],
        y,
        29,
        themeColors.ink,
      );
      drawConstructionCenter(
        ctx,
        api,
        inputsVisible ? r.gap + ' ms' : '?',
        columns[3],
        y,
        29,
        themeColors.ink,
      );
      drawConstructionCenter(
        ctx,
        api,
        r.checked ? (r.pass ? 'PASS' : 'FAIL') : 'pending',
        columns[4],
        y,
        30,
        r.checked ? (r.pass ? themeColors.green : themeColors.pink) : themeColors.muted,
      );
    });
    if (modelState.summaryVisible)
      drawConstructionCenter(
        ctx,
        api,
        '3 passing / 5 arrivals = 60%',
        960,
        975,
        37,
        themeColors.green,
      );
    if (currentBeat === 2)
      drawConstructionFoot(ctx, api, 'R4 counts as an arrival even though its stream failed.');
  });
}
export default {
  id: 'goodput-contract',
  draw: drawGoodputContract,
  cues: [
    'mt-goodput-contract-b0',
    'mt-goodput-contract-s0-2',
    'mt-goodput-contract-s0-3',
    'mt-goodput-contract-b1',
    'mt-goodput-contract-s1-0',
    'mt-goodput-contract-s1-1',
    'mt-goodput-contract-s1-2',
    'mt-goodput-contract-s1-3',
    'mt-goodput-contract-b2',
  ],
};
