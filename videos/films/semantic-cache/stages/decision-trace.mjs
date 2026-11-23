import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsTable,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintDecisionTrace(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  if (currentBeat === 1) {
    const disabled = op >= 0.35;
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Disable the answer-cache route while preserving the authorized fresh release',
      245,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Authorized request req-a6',
      170,
      350,
      560,
      themeColors.cyan,
      110,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Stored answer cache\nrecord retained',
      1050,
      350,
      700,
      disabled ? themeColors.muted : themeColors.blue,
      130,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Fresh policy release R7\ncurrent independent evidence',
      1050,
      700,
      700,
      themeColors.green,
      140,
      31,
    );
    if (disabled) {
      drawSemanticConstructionsArrow(ctx, api, themeColors, 755, 445, 980, 770, themeColors.green);
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'cache route: disabled',
        470,
        660,
        32,
        themeColors.yellow,
        'center',
      );
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'decision: fresh path',
        470,
        800,
        32,
        themeColors.green,
        'center',
      );
    } else {
      drawSemanticConstructionsArrow(ctx, api, themeColors, 755, 405, 1010, 405, themeColors.blue);
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'cache route: enabled',
        470,
        660,
        32,
        themeColors.blue,
        'center',
      );
    }
    drawSemanticConstructionsFoot(
      ctx,
      api,
      themeColors,
      'Protected IDs replace raw prompts. Review retries, bypasses, tails and generations actually avoided.',
    );
  } else {
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Protected request identifiers · record what was actually observed',
      245,
    );
    const nulls = done(0, 'sc-trace-null'),
      rows = [
        ['Field', 'Eligible semantic hit', 'Live prelookup bypass'],
        ['request ID', 'req-a6', 'req-b2'],
        ['release / corpus', 'R7 / C7', 'R7 / C7'],
        ['tenant / access', 'docs-public / policy', 'docs-public / policy'],
        ['encoder / cutoff', 'E1 / .995', 'E1 / .995'],
        ['decision', 'semantic hit', 'live bypass'],
        ['score / approval', '.9992 / eval-v4', nulls ? 'null / null' : 'not observed'],
      ];
    drawSemanticConstructionsTable(ctx, api, themeColors, rows, 140, 300, 1640, 91);
    drawSemanticConstructionsFoot(
      ctx,
      api,
      themeColors,
      'A live read leaves the cache route before the index scores a candidate.',
    );
  }
}
export function drawDecisionTrace(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintDecisionTrace);
}
export default {
  id: 'decision-trace',
  draw: drawDecisionTrace,
  cues: ['sc-decision-trace-b0', 'sc-trace-null', 'sc-decision-trace-b1'],
};
