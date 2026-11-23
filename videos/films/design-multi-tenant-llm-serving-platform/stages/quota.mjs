import { sampleModel } from '../observations.mjs';
import { drawTenantCard, drawTenantText } from '../defaults.mjs';
export function drawQuota(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('quota', state),
    currentBeat = modelState.step;
  {
    drawTenantText(
      ctx,
      api,
      modelState.transition
        ? 'Settlement construction · committed ledger pending'
        : 'Fixed-period allowance: 1,000 units',
      150,
      285,
      36,
    );
    const allocation = api.focus.target(
      'quota-id-held-label-held-reservation-value-s-held-color-c-yellow-id-settle',
      () =>
        teaching.allocation({
          x: 350,
          y: 390,
          width: 1220,
          height: 440,
          capacity: 1000,
          freeFocusTarget: 'quota-free',
          parts: [
            {
              id: 'held',
              label: 'Held reservation',
              value: modelState.held,
              color: themeColors.yellow,
              focusTarget: 'quota-held',
            },
            {
              id: 'settled',
              label: 'Settled usage',
              value: modelState.settled,
              color: themeColors.blue,
              focusTarget: 'quota-settled',
            },
          ],
          fontSize: 42,
          color: themeColors.ink,
          trackColor: themeColors.panel,
          unit: 'units',
        }),
    );
    drawTenantText(
      ctx,
      api,
      'Available ' +
        allocation.remaining +
        ' + held ' +
        modelState.held +
        ' + settled ' +
        modelState.settled +
        ' = 1,000',
      960,
      900,
      35,
      themeColors.green,
      'center',
    );
    api.focus.target('quota-completion-receipt', () =>
      drawTenantCard(
        ctx,
        api,
        modelState.step === 0
          ? 'A-1 · reserve input 300 + output ceiling 400'
          : `A-1 · usage 300 + 120 · delivery ${modelState.duplicate ? 2 : 1} · ${modelState.duplicate ? 'DUPLICATE · no charge' : modelState.transition ? 'CONSTRUCTION · target 420' : modelState.settled ? 'SETTLED' : 'await trusted completion'}`,
        280,
        320,
        1360,
        modelState.duplicate || modelState.transition
          ? themeColors.yellow
          : modelState.settled
            ? themeColors.green
            : themeColors.cyan,
        60,
        24,
      ),
    );
    const quotaCaption = modelState.duplicate
      ? `Duplicate completion ${modelState.completionId}: no ledger change`
      : modelState.transition
        ? 'Settlement transition · target actual usage 300 + 120'
        : modelState.settled
          ? `Completion ${modelState.completionId} settled · unused 280 released`
          : 'Reserve 300 input + 400 max output · supplied actual usage 300 + 120';
  }
}
export default {
  id: 'quota',
  draw: drawQuota,
  cues: [
    'quota-reserve-before-dispatch',
    'quota-conserve-allowance',
    'quota-into-held',
    'quota-trusted-completion',
    'quota-replay-unchanged',
  ],
};
