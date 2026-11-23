import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsTable,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintCacheTiers(
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
  if (currentBeat === 0) {
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Exact response hit · the complete answer is already approved',
      245,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Current permission\n+ scope + answer approval',
      160,
      350,
      740,
      themeColors.blue,
      125,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Same text + full exact key',
      1020,
      350,
      740,
      themeColors.cyan,
      125,
    );
    drawSemanticConstructionsArrow(ctx, api, themeColors, 920, 412, 995, 412);
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Complete stored answer\n30-day retention',
      480,
      650,
      960,
      themeColors.green,
      140,
      34,
    );
    if (done(0, 'sc-exact-skip'))
      drawSemanticConstructionsCenter(
        ctx,
        api,
        themeColors,
        'No embedding search · zero generation calls',
        925,
        themeColors.green,
        35,
      );
  } else if (currentBeat === 1) {
    const prompt = [
        {
          id: 'policy-0',
          token: 101,
        },
        {
          id: 'policy-1',
          token: 102,
        },
        {
          id: 'new-question',
          token: 201,
        },
      ],
      ready = done(1, 'sc-prefix-fresh'),
      output = {
        id: 'new-response',
        token: 301,
      };
    api.teaching.tokenHistory({
      prompt,
      accepted: ready ? [output] : [],
      processed: ready ? prompt : prompt.slice(0, 2),
      emitted: ready ? [output] : [],
      phase: 'resident',
      replayProgress: 0,
      x: 100,
      y: 300,
      width: 1700,
      height: 620,
      fontSize: 29,
      focusPrefix: 'cache-tier-history',
    });
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Shared prefix 101 / 102  ·  New question 201',
      245,
      themeColors.muted,
      28,
    );
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Prefix reuse keeps prior attention state; the new question still runs',
      970,
      themeColors.yellow,
      30,
    );
  } else {
    const live = done(2, 'sc-live-call'),
      deny = done(2, 'sc-denied-zero');
    drawSemanticConstructionsTable(
      ctx,
      api,
      themeColors,
      [
        ['Route', 'Response reuse', 'Generation calls'],
        ['Approved answer hit', 'complete answer', '0'],
        ['Live + compatible prefix', 'no answer reuse', live ? '1 fresh call' : 'predict'],
        ['Current permission denied', 'terminal denial', deny ? '0 · denied' : 'predict'],
      ],
      180,
      350,
      1560,
      130,
    );
    drawSemanticConstructionsFoot(
      ctx,
      api,
      themeColors,
      'Chunked prefill schedules new input in pieces alongside decoding.',
    );
  }
}
export function drawCacheTiers(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintCacheTiers);
}
export default {
  id: 'cache-tiers',
  draw: drawCacheTiers,
  cues: [
    'sc-cache-tiers-b0',
    'sc-exact-skip',
    'sc-cache-tiers-b1',
    'sc-prefix-fresh',
    'sc-cache-tiers-b2',
    'sc-live-call',
    'sc-denied-zero',
  ],
};
