import { sentence, tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawCapabilityReceipt(ctx, scene, state, api) {
  return paintCapabilityReceipt(ctx, scene, state, api);
}
function paintCapabilityReceipt(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('capability-receipt', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'capability-receipt', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-capability-receipt-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Where to look before starting a run',
      960,
      280,
      36,
      themeColors.yellow,
      'center',
    );
    const rows = [
      ['SDK / Cookbook pins', 'Local source identity', 'Remote worker revision: unknown'],
      ['Service capability response', 'Operation + model + account', 'Fresh response required'],
      ['Actual local CPU checks', 'Serialization and chunking', 'Hosted execution: unperformed'],
    ];
    rows.forEach(([name, a, z], i) => {
      drawExtendedText(
        ctx,
        api,
        name,
        170,
        390 + i * 135,
        29,
        i === 1 ? themeColors.cyan : themeColors.blue,
      );
      drawExtendedCard(
        ctx,
        api,
        a,
        640,
        335 + i * 135,
        530,
        110,
        i === 1 ? themeColors.cyan : themeColors.blue,
      );
      drawExtendedCard(ctx, api, z, 1240, 335 + i * 135, 500, 110, themeColors.muted, 26);
    });
    if (currentBeat === 1) {
      drawExtendedText(
        ctx,
        api,
        'Requested training run',
        960,
        795,
        30,
        themeColors.yellow,
        'center',
      );
      [
        'Training: listed',
        resultComplete(1, 1) ? 'Chosen loss: unavailable' : 'Chosen loss: ?',
        resultComplete(1, 2) ? 'Required loss → HOLD' : 'Loss contract: compare',
      ].forEach((v, i) =>
        drawExtendedCard(
          ctx,
          api,
          v,
          170 + i * 545,
          840,
          500,
          105,
          i === 0
            ? themeColors.green
            : i === 1 && resultComplete(1, 1)
              ? themeColors.pink
              : resultComplete(1, 2)
                ? themeColors.pink
                : themeColors.muted,
          27,
        ),
      );
    }
    drawExtendedNote(
      ctx,
      api,
      'Use the training ID listed for your account and the loss supported by that model.',
    );
  });
}
export default {
  id: 'capability-receipt',
  draw: drawCapabilityReceipt,
  cues: [
    'tk-capability-receipt-0-0',
    'tk-capability-receipt-0-1',
    'tk-capability-receipt-0-2',
    'tk-capability-receipt-1-0',
    'tk-capability-receipt-1-1',
    'tk-capability-receipt-1-2',
    'tk-capability-receipt-1-3',
  ],
};
