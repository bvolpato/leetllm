import {
  cueComplete,
  cueProgress,
  detailNote,
  detailPanel,
  detailText,
  progressArrow,
} from '../defaults.mjs';
export function drawEngineRequests(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('engine-requests-mechanism', () => {
    if (currentBeat === 0) {
      detailPanel(
        ctx,
        api,
        'Engine choice happens before inference',
        960,
        285,
        themeColors.blue,
        1500,
      );
      if (cueProgress(ctx, api, 'engine-auto')) {
        detailPanel(ctx, api, 'Native LM15 supported?', 500, 475, themeColors.cyan, 760);
        detailPanel(
          ctx,
          api,
          'Eligible compatibility fallback: LiteLLM',
          1430,
          475,
          themeColors.yellow,
          850,
        );
        progressArrow(
          ctx,
          api,
          920,
          475,
          960,
          475,
          themeColors.yellow,
          cueProgress(ctx, api, 'engine-selection'),
        );
      }
      if (cueComplete(ctx, api, 'engine-selection'))
        detailText(
          ctx,
          api,
          'Selected backend remains bound to the call',
          960,
          680,
          34,
          themeColors.blue,
        );
      if (cueProgress(ctx, api, 'engine-failures'))
        detailText(
          ctx,
          api,
          'Authentication / timeout / provider error → error, not backend failover',
          960,
          850,
          31,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      const first = cueComplete(ctx, api, 'native-call-one');
      const second = cueComplete(ctx, api, 'native-call-two');
      const calls = Number(first) + Number(second);
      detailText(
        ctx,
        api,
        'One logical prompt · cache off · two answers requested',
        960,
        285,
        43,
        themeColors.ink,
      );
      if (cueProgress(ctx, api, 'one-prompt')) {
        [first, second].forEach((returned, i) => {
          const x = 540 + i * 840;
          const color = returned ? themeColors.cyan : themeColors.muted;
          detailText(ctx, api, 'Answer slot ' + (i + 1), x, 450, 38, color);
          detailPanel(ctx, api, returned ? 'answer ' + (i + 1) : 'waiting', x, 572, color, 650);
        });
        if (first) progressArrow(ctx, api, 917, 572, 1002, 572, themeColors.cyan);
      }
      detailText(ctx, api, 'Completed local engine calls', 620, 805, 43, themeColors.ink);
      detailText(ctx, api, String(calls), 1270, 820, 87, themeColors.cyan);
      if (cueComplete(ctx, api, 'native-n'))
        detailText(
          ctx,
          api,
          'Returned in sequence · external provider calls: 0',
          960,
          965,
          36,
          themeColors.yellow,
        );
    } else {
      if (!cueProgress(ctx, api, 'engine-provenance')) {
        detailPanel(ctx, api, 'Recorded custom-engine calls: 2', 960, 360, themeColors.blue, 1560);
        detailPanel(ctx, api, 'answer one · answer two', 960, 560, themeColors.cyan, 1250);
      }
      const fields = [
        'Seed + dependencies',
        'Effective model revision',
        'Generation settings',
        'Data + scorer versions',
        'Cache policy',
        'Repeated-trial evidence',
      ];
      fields.forEach((v, i) => {
        if (cueProgress(ctx, api, 'engine-provenance') > i / 6)
          detailPanel(
            ctx,
            api,
            v,
            500 + (i % 2) * 930,
            360 + Math.floor(i / 2) * 170,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][Math.floor(i / 2)],
            800,
          );
      });
      if (cueProgress(ctx, api, 'temp-not-proof'))
        detailText(
          ctx,
          api,
          'Temperature 0 does not freeze backend revisions or cached responses',
          960,
          865,
          31,
          themeColors.pink,
        );
      if (cueComplete(ctx, api, 'run-lineage'))
        detailText(
          ctx,
          api,
          'Serve the same effective combination that earned its evaluation',
          960,
          945,
          32,
          themeColors.green,
        );
    }
    if (currentBeat !== 1)
      detailNote(ctx, api, 'DSPy 3.4.0 · local counting engine · provider requests: 0');
  });
  return;
}
export default {
  id: 'engine-requests',
  draw: drawEngineRequests,
  cues: [
    'engine-selection',
    'engine-auto',
    'engine-failures',
    'native-n',
    'one-prompt',
    'native-call-one',
    'native-call-two',
    'run-lineage',
    'engine-provenance',
    'temp-not-proof',
  ],
};
