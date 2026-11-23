import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintStreamingContract(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
) {
  if (currentBeat === 0) {
    const release = cueProgress('streaming-contract-buffer', 0),
      leak = cueProgress('streaming-contract-leak', 0);
    withGuardMechanismFocus(ctx, api, 'stream-release', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Generated stream · private buffer',
        170,
        300,
        33,
        themeColors.blue,
      );
      for (let i = 0; i < 12; i++)
        api.rect(
          ctx,
          175 + i * 128,
          370,
          98,
          72,
          i < Math.floor(release * 12) ? themeColors.blue : themeColors.panel,
          themeColors.blue,
          2,
          2,
        );
      drawGuardMechanismLine(ctx, api, themeColors, 170, 560, 1760, 560, themeColors.yellow, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Required whole-response review',
        170,
        535,
        30,
        themeColors.yellow,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        release === 1 ? 'User first visible token after review' : 'User display: empty',
        960,
        660,
        38,
        release === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
    });
    withGuardMechanismFocus(ctx, api, 'stream-leak', () => {
      if (leak > 0) {
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Already displayed: [secret chunk]',
          170,
          805,
          33,
          themeColors.pink,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'later block cannot recall it',
          1120,
          805,
          31,
          themeColors.pink,
        );
      }
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Generated first-token time and user-visible first-token time use different clocks',
    );
  } else {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'stream-config',
      'Inspected NeMo configuration',
      [
        'output streaming: disabled by default',
        'if enabled: stream_first defaults true',
        'output may precede guard decision',
      ],
      155,
      300,
      1610,
      300,
      themeColors.yellow,
      34,
    );
    withGuardMechanismFocus(ctx, api, 'stream-hold', () => {
      const q = cueProgress('streaming-contract-test', 1);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'Configure + test whole-output hold mode' : 'Required hold mode must be explicit',
        185,
        725,
        36,
        themeColors.green,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Inspected OpenAI integrated scores arrive after full output',
        185,
        845,
        31,
        themeColors.cyan,
      );
    });
  }
}
export function drawStreamingContract(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintStreamingContract(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
}
export default {
  id: 'streaming-contract',
  draw: drawStreamingContract,
  cues: [
    'streaming-contract-buffer',
    'streaming-contract-leak',
    'streaming-contract-config',
    'streaming-contract-test',
  ],
};
