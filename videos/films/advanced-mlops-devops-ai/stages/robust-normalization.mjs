import { pythonReleaseDigest } from '../arithmetic.mjs';
import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseEquation,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawRobustNormalization(ctx, scene, state, api) {
  if (paintRobustNormalization(ctx, scene, state, api)) return;
}
function paintRobustNormalization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) =>
      releaseSentenceProgress(state, 'robust-normalization', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('robust-normalization-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(ctx, api, 'Actual three-vector fixture · finite, nonzero L2 inputs');
    if (currentBeat === 0) {
      const configs = [
        {
          chunker: 'sentence@3',
          embedding: 'embed@2',
          normalize: 'l2',
        },
        {
          chunker: 'sentence@3',
          embedding: 'embed@2',
          normalize: 'none',
        },
      ];
      configs.forEach((v, i) => {
        drawReleaseBox(
          ctx,
          api,
          i ? 'online: none' : 'offline: L2',
          210 + i * 900,
          350,
          600,
          100,
          i ? themeColors.pink : themeColors.green,
        );
        drawReleaseText(
          ctx,
          api,
          pythonReleaseDigest(v).digest.slice(0, 8),
          510 + i * 900,
          520,
          35,
          i ? themeColors.pink : themeColors.green,
          'center',
        );
      });
      if (resultComplete(0, 1))
        drawReleaseText(
          ctx,
          api,
          'Equal config would still leave code, data and values unproven',
          960,
          650,
          33,
          themeColors.yellow,
          'center',
        );
      const vectors = [
        [3, 4],
        [2, 0],
        [-4, 3],
      ];
      vectors.forEach((v, i) => {
        if (cueProgress(0, 2) > i / 3) {
          drawReleaseBox(
            ctx,
            api,
            '[' + v.join(', ') + ']',
            230 + i * 560,
            790,
            450,
            100,
            themeColors.blue,
          );
        }
      });
    } else if (currentBeat === 1) {
      const steps = [
        {
          name: 'raw v',
          v: [3, 4],
        },
        {
          name: 'divide by max |v| = 4',
          v: [0.75, 1],
        },
        {
          name: 'divide by scaled norm = 1.25',
          v: [0.6, 0.8],
        },
      ];
      steps.forEach((step, i) => {
        const x = 160 + i * 590;
        if (i === 0 || cueProgress(1, i === 1 ? 0 : 1) > 0) {
          drawReleaseText(
            ctx,
            api,
            step.name,
            x + 260,
            350,
            28,
            i === 2 ? themeColors.green : themeColors.blue,
            'center',
          );
          drawReleaseBox(
            ctx,
            api,
            '[' + step.v.map((v) => String(v)).join(', ') + ']',
            x,
            480,
            520,
            140,
            i === 2 ? themeColors.green : themeColors.blue,
            40,
          );
          if (i > 0) drawReleaseArrow(ctx, api, x - 55, 550, x - 15, 550, themeColors.cyan);
        }
      });
      if (resultComplete(1, 2))
        drawReleaseEquation(
          ctx,
          api,
          String.raw`\widehat v=[0.6,0.8],\quad\|\widehat v\|_2=1`,
          960,
          795,
          42,
          themeColors.green,
        );
      if (resultComplete(1, 3)) {
        drawReleaseText(
          ctx,
          api,
          'Same scaling procedure: 10³⁰⁸ and 10⁻³⁰⁰',
          960,
          945,
          33,
          themeColors.yellow,
          'center',
        );
      }
    } else {
      const invalid = ['empty', 'Boolean', 'huge integer', 'NaN / ∞', 'zero L2'];
      invalid.forEach((v, i) => {
        if (cueProgress(2, 0) > i / 5)
          drawReleaseBox(ctx, api, v, 150 + i * 340, 380, 290, 100, themeColors.pink, 27);
      });
      if (cueProgress(2, 1) > 0) {
        const rowsData = [
          ['[3,4]', '[.6,.8]', '[3,4]'],
          ['[2,0]', '[1,0]', '[2,0]'],
          ['[-4,3]', '[-.8,.6]', '[-4,3]'],
        ];
        rowsData.forEach((r, i) => {
          drawReleaseText(ctx, api, r[0], 370, 620 + i * 90, 30, themeColors.blue, 'center');
          drawReleaseText(ctx, api, r[1], 960, 620 + i * 90, 30, themeColors.green, 'center');
          drawReleaseText(ctx, api, r[2], 1530, 620 + i * 90, 30, themeColors.pink, 'center');
        });
        drawReleaseText(
          ctx,
          api,
          'shared input                 offline L2                     online none',
          960,
          535,
          27,
          themeColors.muted,
          'center',
        );
      }
      drawReleaseFooter(
        ctx,
        api,
        'Computed coordinates · relative tolerance 10⁻⁹ · absolute tolerance 10⁻¹²',
      );
    }
  }
}
export default {
  id: 'robust-normalization',
  draw: drawRobustNormalization,
  cues: [
    'robust-normalization-b1',
    'robust-normalization-s0-0',
    'robust-normalization-s0-1',
    'robust-normalization-s0-2',
    'robust-normalization-b2',
    'robust-normalization-s1-0',
    'robust-normalization-s1-1',
    'robust-normalization-s1-2',
    'robust-normalization-s1-3',
    'robust-normalization-b3',
    'robust-normalization-s2-0',
    'robust-normalization-s2-1',
    'robust-normalization-s2-2',
    'robust-normalization-s2-3',
  ],
};
