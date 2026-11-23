import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismRect,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintInputFixtures(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  const score = cueDone('sg-input-score', 0),
    results = [cueDone('sg-input-a', 1), cueDone('sg-input-b', 1), cueDone('sg-input-c', 1)];
  withGuardMechanismFocus(ctx, api, 'input-rows', () => {
    const rows = [
      ['A', 'payment-service unit-test command', 'safe', themeColors.blue],
      ['B', 'Deploy payment-service to prod', 'safe', themeColors.yellow],
      ['C', 'Flagged request for production keys', 'injection', themeColors.pink],
    ];
    rows.forEach(([id, text, label, color], i) => {
      const y = 330 + i * 150;
      drawGuardMechanismRect(ctx, api, themeColors, 145, y, 1190, 115, color);
      drawGuardMechanismText(ctx, api, themeColors, id, 175, y + 68, 37, color);
      drawGuardMechanismText(ctx, api, themeColors, text, 245, y + 51, 29);
      drawGuardMechanismText(ctx, api, themeColors, 'stub label: ' + label, 245, y + 91, 25, color);
    });
  });
  withGuardMechanismFocus(ctx, api, 'input-scores', () => {
    drawGuardMechanismText(ctx, api, themeColors, 'score', 1460, 302, 27, themeColors.muted);
    [0, 1, 2].forEach((i) =>
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        score ? '0.91' : '?',
        1470,
        402 + i * 150,
        43,
        themeColors.cyan,
      ),
    );
  });
  withGuardMechanismFocus(ctx, api, 'input-comparison', () => {
    if (currentBeat === 1) {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'BLOCK = (label == injection) AND (score ≥ 0.80)',
        960,
        850,
        34,
        themeColors.yellow,
        'center',
        true,
      );
      [0, 1, 2].forEach((i) => {
        if (cueProgress('input-fixtures-threshold', 1) > i / 4)
          drawGuardMechanismLine(
            ctx,
            api,
            themeColors,
            1360,
            405 + i * 150,
            1410,
            405 + i * 150,
            themeColors.yellow,
            4,
          );
      });
    } else
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'The same score can accompany different labels',
        960,
        850,
        33,
        themeColors.yellow,
        'center',
      );
  });
  withGuardMechanismFocus(ctx, api, 'input-outcomes', () =>
    results.forEach((shown, i) =>
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        shown ? (i === 2 ? 'BLOCK' : 'PASS') : '?',
        1645,
        402 + i * 150,
        32,
        shown ? (i === 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
      ),
    ),
  );
  drawGuardMechanismNote(
    ctx,
    api,
    themeColors,
    currentBeat === 1
      ? 'B still requires deployment authorization · local stubs establish control flow only'
      : 'PII stub: false · topic stub: literal “service”',
  );
}
export function drawInputFixtures(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintInputFixtures(ctx, scene, state, api, themeColors, currentBeat, cueProgress, cueDone);
}
export default {
  id: 'input-fixtures',
  draw: drawInputFixtures,
  cues: [
    'input-fixtures-rows',
    'input-fixtures-score',
    'sg-input-score',
    'input-fixtures-threshold',
    'input-fixtures-result',
    'sg-input-a',
    'sg-input-b',
    'sg-input-c',
  ],
};
