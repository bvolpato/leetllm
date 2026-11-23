import { drawFooter, drawPill, drawText } from '../defaults.mjs';
export function drawParityContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-parity-contract-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    cueVisible = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('parity-contract-mechanism', () => {
    if (currentBeat === 0) {
      drawText(
        ctx,
        api,
        'Equal-looking values can violate the field contract',
        960,
        300,
        35,
        themeColors.yellow,
      );
      drawPill(ctx, api, 'integer 0', 500, 455, 620, themeColors.blue);
      drawPill(ctx, api, 'Boolean false', 1420, 455, 670, themeColors.cyan);
      if (resultComplete('bool'))
        drawText(
          ctx,
          api,
          'Python equality: true · typed schema: FAIL',
          960,
          650,
          39,
          themeColors.pink,
        );
      if (cueVisible('missing')) {
        drawPill(ctx, api, 'field absent', 500, 835, 620, themeColors.muted);
        drawPill(ctx, api, 'field present: null', 1420, 835, 670, themeColors.pink);
      }
      drawFooter(
        ctx,
        api,
        'The article’s small mismatches helper is not a complete type/tolerance validator',
      );
    } else if (currentBeat === 1) {
      drawText(ctx, api, 'Allowed absolute difference   0.001', 960, 300, 36, themeColors.yellow);
      drawPill(ctx, api, 'replay 0.2500', 470, 475, 680, themeColors.blue);
      drawPill(ctx, api, 'serving 0.2504', 1430, 475, 710, themeColors.cyan);
      if (resultComplete('absolute')) {
        drawText(ctx, api, '|0.2500 − 0.2504| = 0.0004 ≤ 0.001', 960, 695, 43, themeColors.green);
        drawText(
          ctx,
          api,
          'finite numeric type and units still required',
          960,
          850,
          33,
          themeColors.yellow,
        );
      }
      drawFooter(
        ctx,
        api,
        'Absolute tolerance does not permit wrong IDs, units, cutoffs or missing fields',
      );
    } else {
      drawText(
        ctx,
        api,
        'Actual local parity worksheet · five named cases',
        960,
        290,
        35,
        themeColors.yellow,
      );
      [
        'same-time correction',
        'equal-key quarantine',
        '16:00 age',
        'wrong-key swap',
        'stale cached age',
      ].forEach((v, i) => {
        const y = 405 + i * 110;
        drawPill(ctx, api, v, 600, y, 860, themeColors.blue, 70, 29);
        if (i < 3 ? resultComplete('three') : resultComplete('five'))
          drawPill(
            ctx,
            api,
            i < 3 ? 'AGREE' : 'FAIL',
            1470,
            y,
            440,
            i < 3 ? themeColors.green : themeColors.pink,
            70,
            29,
          );
      });
      drawFooter(
        ctx,
        api,
        'Three agreements plus two negative controls · no complete-future guarantee',
      );
    }
  });
}
export default {
  id: 'parity-contract',
  draw: drawParityContract,
  cues: [
    'sf-parity-contract-identity',
    'sf-parity-contract-missing',
    'sf-parity-contract-bool',
    'sf-parity-contract-scope',
    'sf-parity-contract-absolute',
    'sf-parity-contract-exact',
    'sf-parity-contract-three',
    'sf-parity-contract-five',
    'sf-parity-contract-controls',
  ],
};
