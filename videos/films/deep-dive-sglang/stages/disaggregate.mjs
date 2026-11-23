import { cueComplete } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawDisaggregate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('disaggregate', state),
    currentBeat = modelState.b;
  {
    const payloadReady = currentBeat > 0 || cueComplete(state.cues, 'disaggregate-beat-1-focus-2'),
      bandwidthReady =
        currentBeat > 1 ||
        (currentBeat === 1 && cueComplete(state.cues, 'disaggregate-beat-2-focus-1'));
    api.focus.reveal('disaggregate-beat-1-focus-2', () =>
      api.focus.target('disaggregate-payload', () =>
        equation(
          ctx,
          api,
          String.raw`2\times32\times8\times128\times4096\times2=${payloadReady ? modelState.payload : '?'}\ \mathrm{bytes}`,
          960,
          285,
          38,
        ),
      ),
    );
    api.focus.reveal('disaggregate-beat-1-focus-2', () =>
      api.focus.target('disaggregate-bandwidth', () =>
        text(
          ctx,
          api,
          bandwidthReady
            ? `512 MiB ÷ 25 GB/s = ${modelState.transferMs.toFixed(2)} ms minimum transfer`
            : 'Payload ÷ supplied bandwidth: transfer bound pending',
          960,
          375,
          31,
          themeColors.blue,
          'center',
        ),
      ),
    );
    teaching.timeline({
      x: 150,
      y: 445,
      width: 1600,
      height: 260,
      domain: [0, modelState.end],
      time: modelState.time,
      lanes: [
        {
          id: 'prefill',
          label: 'Prefill worker',
          focusTarget: 'disaggregate-prefill-worker',
        },
        {
          id: 'link',
          label: 'KV transfer',
          focusTarget: 'disaggregate-transfer',
        },
      ],
      intervals: [
        {
          id: 'prefill',
          focusTarget: 'disaggregate-prefill-worker',
          lane: 'prefill',
          start: 0,
          end: 20,
          color: themeColors.blue,
        },
        {
          id: 'transfer',
          focusTarget: 'disaggregate-transfer',
          lane: 'link',
          start: 20,
          end: modelState.end,
          color: themeColors.pink,
        },
      ],
      ticks: [0, 20, modelState.end],
      formatTime: (v) => v.toFixed(1),
      labelWidth: 300,
      fontSize: 27,
      color: themeColors.muted,
      trackColor: themeColors.panel,
    });
    api.rect(ctx, 150, 730, 1600, 18, themeColors.panel, themeColors.muted, 3);
    api.rect(
      ctx,
      150,
      730,
      Math.max(0.01, (1600 * modelState.transferred) / modelState.payload),
      18,
      themeColors.cyan,
      themeColors.cyan,
      3,
    );
    api.focus.target('disaggregate-byte-count', () =>
      text(
        ctx,
        api,
        `R42 · received ${(modelState.transferred / 2 ** 20).toFixed(1)} / 512 MiB`,
        960,
        790,
        32,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('disaggregate-prefill-state', () =>
      card(
        ctx,
        api,
        'Prefill\n' + (modelState.prefillComplete ? 'complete' : 'computing'),
        140,
        855,
        380,
        modelState.prefillComplete ? themeColors.green : themeColors.blue,
        110,
      ),
    );
    api.focus.target('disaggregate-reservation', () =>
      card(
        ctx,
        api,
        'Destination reserved\n' + (modelState.reserved ? '512 MiB' : 'pending'),
        570,
        855,
        380,
        modelState.reserved ? themeColors.cyan : themeColors.muted,
        110,
      ),
    );
    api.focus.target('disaggregate-ready-state', () =>
      card(
        ctx,
        api,
        'KV transfer\n' + (modelState.ready ? 'ready' : 'not ready'),
        1000,
        855,
        380,
        modelState.ready ? themeColors.green : themeColors.pink,
        110,
      ),
    );
    api.focus.target('disaggregate-decode-gate', () =>
      card(
        ctx,
        api,
        'Decode R42\n' + (modelState.decodeActive ? 'ACTIVE · gate open' : 'waiting · gate closed'),
        1430,
        855,
        380,
        modelState.decodeActive ? themeColors.green : themeColors.muted,
        110,
      ),
    );
  }
}
export default {
  id: 'disaggregate',
  draw: drawDisaggregate,
  cues: [
    'disaggregate-beat-1-focus-1',
    'disaggregate-beat-1-focus-2',
    'disaggregate-create-kv',
    'disaggregate-beat-2-focus-1',
    'disaggregate-beat-2-focus-2',
    'disaggregate-beat-3-focus-1',
    'disaggregate-open-decode-gate',
  ],
};
