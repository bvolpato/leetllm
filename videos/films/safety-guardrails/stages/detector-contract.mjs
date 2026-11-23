import { guardCue, guardDone, validateDetectorResult } from '../model.mjs';
import {
  drawGuardMechanismCell,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintDetectorContract(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  const values = [
      ['0.91', 0.91],
      ['True', true],
      ['missing', undefined],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['1.2', 1.2],
    ],
    typed = cueProgress('detector-contract-type', 0),
    domain = cueProgress('detector-contract-domain', 0);
  drawGuardMechanismText(
    ctx,
    api,
    themeColors,
    'Required result: recognized label + validated score',
    960,
    295,
    34,
    themeColors.cyan,
    'center',
  );
  values.forEach(([name, value], i) => {
    const x = 160 + i * 270;
    drawGuardMechanismCell(ctx, api, themeColors, name, x, 365, 240, 85, themeColors.blue);
    const numeric = typeof value === 'number';
    withGuardMechanismFocus(ctx, api, 'detector-type', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'numeric, not Boolean',
        x + 120,
        510,
        24,
        themeColors.muted,
        'center',
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        typed === 1 ? (numeric ? 'YES' : 'REJECT') : '?',
        x + 120,
        565,
        30,
        typed === 1 ? (numeric ? themeColors.green : themeColors.pink) : themeColors.muted,
        'center',
      );
    });
    withGuardMechanismFocus(ctx, api, 'detector-domain', () => {
      drawGuardMechanismLine(ctx, api, themeColors, x + 120, 610, x + 120, 665, themeColors.muted);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'finite · [0, 1]',
        x + 120,
        705,
        26,
        themeColors.muted,
        'center',
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        domain === 1
          ? validateDetectorResult({
              label: 'safe',
              score: value,
            })
            ? 'VALID'
            : 'REJECT'
          : '?',
        x + 120,
        762,
        31,
        domain === 1 ? (i === 0 ? themeColors.green : themeColors.pink) : themeColors.muted,
        'center',
      );
    });
  });
  drawGuardMechanismLabel(
    ctx,
    api,
    themeColors,
    'detector-outcome',
    currentBeat === 1 && cueDone('detector-contract-hold', 1)
      ? 'Invalid required result → request HELD'
      : 'Required result must be valid before risk comparison',
    960,
    860,
    34,
    currentBeat === 1 ? themeColors.pink : themeColors.yellow,
    'center',
  );
  drawGuardMechanismLabel(
    ctx,
    api,
    themeColors,
    'detector-authority',
    currentBeat === 1
      ? 'Identity: session   ·   Tool access: policy   ·   Claim support: source passage'
      : 'label ∈ {safe, injection} is checked separately',
    960,
    925,
    29,
    themeColors.muted,
    'center',
  );
}
export function drawDetectorContract(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintDetectorContract(
    ctx,
    scene,
    state,
    api,
    themeColors,
    currentBeat,
    cueProgress,
    cueDone,
  );
}
export default {
  id: 'detector-contract',
  draw: drawDetectorContract,
  cues: [
    'detector-contract-type',
    'detector-contract-domain',
    'detector-contract-hold',
    'detector-contract-scope',
  ],
};
