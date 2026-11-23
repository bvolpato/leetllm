import { clamp, phase } from '../arithmetic.mjs';
import { cueProgress } from '../receipt.mjs';
import { repeatedRequestFixture } from '../model.mjs';
import { extensionText, focusTarget, traceStack } from '../defaults.mjs';
export function drawFailureContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const { C: themeColors } = api;
  focusTarget(ctx, api, 'failure-contract-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
          ['adapter raises TimeoutError', 'provider_timeout'],
          ['returned candidate fails checker', 'invalid_decision'],
          ['adapter raises ValueError', 'provider_error'],
        ],
        n = Math.min(2, Math.floor(phase(progress, 0.08, 0.85) * 3));
      rows.forEach(([cause, code], i) => {
        const shown =
          cueProgress(
            scene,
            state,
            [
              'firstapp-result-timeout-code',
              'firstapp-result-invalid-code',
              'firstapp-result-adapter-code',
            ][i],
          ) > 0;
        let y = 370 + i * 220,
          color = shown ? (i === n ? themeColors.pink : themeColors.ink) : themeColors.muted;
        extensionText(ctx, api, cause, 240, y + 50, 32, color);
        api.arrow(ctx, 970, y + 35, 1120, y + 35, shown ? color : themeColors.muted, 4);
        extensionText(
          ctx,
          api,
          shown ? code : 'classification pending',
          1210,
          y + 50,
          31,
          shown ? color : themeColors.yellow,
        );
      });
      extensionText(
        ctx,
        api,
        cueProgress(scene, state, 'firstapp-result-adapter-code') > 0
          ? 'All three: recorded failed attempt · HTTP 200 when commit succeeds'
          : 'Classify adapter execution and candidate validation separately',
        960,
        1030,
        30,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      extensionText(
        ctx,
        api,
        'Private report / raw upstream exception',
        960,
        330,
        38,
        themeColors.pink,
        'center',
      );
      api.line(ctx, 960, 380, 960, 490, themeColors.pink, 4);
      api.line(ctx, 700, 495, 1220, 495, themeColors.pink, 8);
      extensionText(
        ctx,
        api,
        'Raw text stops at the application boundary',
        960,
        565,
        33,
        themeColors.pink,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Returned: app-owned error enum',
        960,
        715,
        35,
        themeColors.green,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Stored: versions · trusted facts · keyed HMAC',
        960,
        820,
        32,
        themeColors.blue,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Facts and fingerprints still need protected storage',
        960,
        975,
        31,
        themeColors.muted,
        'center',
      );
    } else if (cueProgress(scene, state, 'failure-contract-b3') === 0) {
      extensionText(ctx, api, 'Test provider', 300, 380, 40, themeColors.blue);
      extensionText(ctx, api, 'raise TimeoutError', 300, 482, 44);
      extensionText(ctx, api, 'Real transport', 300, 705, 40, themeColors.blue);
      api.line(ctx, 300, 797, 1510, 797, themeColors.muted, 4);
      api.line(ctx, 1510, 757, 1510, 838, themeColors.yellow, 5);
      extensionText(ctx, api, 'Deadline', 1510, 904, 34, themeColors.yellow, 'center');
      extensionText(
        ctx,
        api,
        'How long can the network call wait?',
        840,
        742,
        33,
        themeColors.ink,
        'center',
      );
    } else {
      const repeat = repeatedRequestFixture(),
        shown = cueProgress(scene, state, 'firstapp-result-repeat-attempts') > 0;
      extensionText(
        ctx,
        api,
        'Same validated request · submit twice',
        960,
        310,
        39,
        themeColors.cyan,
        'center',
      );
      traceStack(ctx, api, 160, 440, 'completed', 2, themeColors.green, repeat.ids[0]);
      traceStack(
        ctx,
        api,
        1100,
        440,
        shown ? 'completed' : 'new attempt pending',
        shown ? 2 : '—',
        shown ? themeColors.green : themeColors.muted,
        shown ? repeat.ids[1] : 'New trace pending',
      );
      extensionText(
        ctx,
        api,
        'Fingerprint   ' + repeat.rows[0].report_fingerprint.slice(0, 8) + '…',
        470,
        810,
        31,
        themeColors.blue,
        'center',
      );
      extensionText(
        ctx,
        api,
        shown
          ? 'Fingerprint   ' + repeat.rows[1].report_fingerprint.slice(0, 8) + '…'
          : 'Fingerprint pending',
        1410,
        810,
        31,
        shown ? themeColors.blue : themeColors.muted,
        'center',
      );
      extensionText(
        ctx,
        api,
        shown ? '2 traces   ·   2 provider calls' : 'Same report submitted a second time',
        960,
        940,
        40,
        themeColors.yellow,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Matching fingerprints identify repeated input.',
        960,
        1020,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'failure-contract',
  draw: drawFailureContract,
  cues: [
    'failure-contract-b1',
    'firstapp-result-timeout-code',
    'firstapp-result-invalid-code',
    'firstapp-result-adapter-code',
    'failure-contract-b2',
    'failure-contract-b3',
    'firstapp-result-repeat-attempts',
  ],
};
