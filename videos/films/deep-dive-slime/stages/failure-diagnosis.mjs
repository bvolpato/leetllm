import { tokens } from '../fixtures.mjs';
import { sampleSlimeChapter, slimeSentenceProgress } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawFailureDiagnosis(ctx, scene, state, api) {
  return api.focus.target('sl-failure-diagnosis-mechanism', () =>
    paintFailureDiagnosis(ctx, scene, state, api),
  );
}
function paintFailureDiagnosis(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('failure-diagnosis', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  const teaching = (beat, sentence) =>
    slimeSentenceProgress('failure-diagnosis', state, beat, sentence);
  {
    drawSlimeTitle(ctx, api, 'Trace the uncertain boundary instead of guessing one cause');
    if (currentBeat === 0) {
      drawSlimeText(ctx, api, 'response ID', 150, 440, 29, themeColors.cyan);
      drawSlimeText(ctx, api, 'target mask', 150, 600, 29, themeColors.cyan);
      const bad = [1, 1, 1, 0, 1, 1],
        fixed = [1, 1, 0, 0, 1, 1],
        checked = teaching(0, 0) >= 1;
      tokens.forEach((v, i) => {
        const x = 430 + i * 225;
        drawSlimeTile(
          ctx,
          api,
          v,
          x,
          385,
          200,
          i === 2 ? themeColors.pink : themeColors.blue,
          80,
          34,
        );
        drawSlimeTile(
          ctx,
          api,
          (checked ? fixed : bad)[i],
          x,
          545,
          200,
          i === 2 ? (checked ? themeColors.cyan : themeColors.pink) : themeColors.blue,
          80,
          34,
        );
        if (i === 2)
          drawSlimeText(ctx, api, 'observation', x + 100, 710, 27, themeColors.pink, 'center');
      });
      drawSlimeTile(ctx, api, 'expected policy 12', 260, 785, 570, themeColors.yellow, 80, 31);
      drawSlimeTile(
        ctx,
        api,
        teaching(0, 1) >= 1 ? 'observed policy 11 · mismatch' : 'observed version · check receipt',
        1090,
        785,
        590,
        teaching(0, 1) >= 1 ? themeColors.pink : themeColors.muted,
        80,
        30,
      );
      drawSlimeRule(
        ctx,
        api,
        'Repair mask attribution; separately inspect the policy transition',
        950,
        themeColors.cyan,
        31,
      );
    } else if (currentBeat === 1) {
      drawSlimeText(
        ctx,
        api,
        'completed groups waiting for the trainer',
        150,
        365,
        30,
        themeColors.cyan,
      );
      ['G1', 'G2', 'G3', 'G4', 'G5'].forEach((v, i) => {
        drawSlimeTile(ctx, api, v, 180 + i * 330, 425, 270, themeColors.blue, 85, 33);
        drawSlimeText(
          ctx,
          api,
          'age ' + (42 + i * 8) + ' s',
          315 + i * 330,
          560,
          29,
          themeColors.yellow,
          'center',
        );
      });
      const shipped = teaching(1, 1) >= 1;
      drawSlimeTile(
        ctx,
        api,
        'source host · weight export 12',
        160,
        670,
        700,
        themeColors.green,
        95,
        31,
      );
      drawSlimeTile(
        ctx,
        api,
        shipped ? 'destination host · still unprepared' : 'destination host · inspect preparation',
        1080,
        670,
        700,
        shipped ? themeColors.pink : themeColors.yellow,
        95,
        30,
      );
      drawSlimeWire(ctx, api, 860, 717, 1080, 717, teaching(1, 1), themeColors.yellow);
      drawSlimeRule(
        ctx,
        api,
        'Check the drain rate to explain the ages. Check each host to verify the export.',
        925,
        themeColors.cyan,
        29,
      );
    } else {
      const p = teaching(2, 0);
      drawSlimeText(ctx, api, 'configured initial wait', 180, 395, 30, themeColors.yellow);
      api.rect(ctx, 180, 455, 1510, 95, themeColors.panel, themeColors.muted, 2);
      if (p > 0) api.rect(ctx, 184, 459, Math.max(1, 1502 * p), 87, themeColors.blue);
      drawSlimeText(
        ctx,
        api,
        p >= 1 ? 'cold kernel compilation completed' : 'cold kernel compilation in progress',
        960,
        615,
        34,
        themeColors.blue,
        'center',
      );
      drawSlimeTile(ctx, api, 'HTTP health · responsive', 180, 730, 650, themeColors.green, 90, 31);
      drawSlimeTile(
        ctx,
        api,
        'mask / version / host gates still separate',
        1010,
        730,
        750,
        themeColors.yellow,
        90,
        29,
      );
      drawSlimeRule(
        ctx,
        api,
        'Retain the initial-wait, retry and drop settings with the receipt',
        940,
        themeColors.cyan,
        31,
      );
    }
    drawSlimeNote(
      ctx,
      api,
      'Illustrative diagnostic states narrow a boundary; symptoms do not establish a unique cause',
    );
    return;
  }
}
export default {
  id: 'failure-diagnosis',
  draw: drawFailureDiagnosis,
  cues: [
    'sl-failure-diagnosis-b0-operation',
    'sl-failure-diagnosis-b0-s0',
    'sl-failure-diagnosis-b0-s1',
    'sl-failure-diagnosis-b0-s2',
    'sl-failure-diagnosis-b1-operation',
    'sl-failure-diagnosis-b1-s0',
    'sl-failure-diagnosis-b1-s1',
    'sl-failure-diagnosis-b1-s2',
    'sl-failure-diagnosis-b2-operation',
    'sl-failure-diagnosis-b2-s0',
    'sl-failure-diagnosis-b2-s1',
    'sl-failure-diagnosis-b2-s2',
  ],
};
