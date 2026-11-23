import { categoricalFixture, softmax } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { drawBars, drawChapterCard, drawChapterText, drawFooter, drawTable } from '../defaults.mjs';
export function drawGenerationChoice(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('generation-choice-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Generation reads the final position of the recent local-ID context',
        960,
        285,
        34,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 12; i++)
        drawChapterCard(
          ctx,
          api,
          i === 11 ? 'last' : '…',
          170 + i * 132,
          405,
          115,
          i === 11 ? themeColors.yellow : themeColors.blue,
          85,
          31,
        );
      drawChapterText(
        ctx,
        api,
        'Context: at most 48 IDs',
        960,
        590,
        35,
        themeColors.blue,
        'center',
      );
      const retained = cueProgress('retain-eight', 0) > 0;
      drawTable(
        ctx,
        api,
        [
          ['Ranked indices', 'Retained set', 'Score operation'],
          [
            '1 … V',
            retained ? 'exactly 8 indices' : 'select top indices',
            cueProgress('sampling-temperature', 0) > 0 ? 'z / 0.9' : 'retain logits',
          ],
        ],
        170,
        685,
        1580,
        180,
        31,
      );
      drawChapterText(
        ctx,
        api,
        'Positive temperature preserves rank · explicit argmax at temperature 0',
        960,
        945,
        29,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1 || currentBeat === 2) {
      const s = categoricalFixture(),
        scale = cueProgress('retained-scale', 1),
        choice = E('categorical-choice', 2);
      drawChapterText(
        ctx,
        api,
        'Separate supplied logits [2, 1, 0, −1] · retain top 2',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Local ID', 'Original z', 'Scaled z'],
          ['0', '2', (2 + 2 * scale).toFixed(2)],
          ['1', '1', (1 + scale).toFixed(2)],
        ],
        180,
        350,
        740,
        260,
        30,
      );
      const ps = softmax([2 + 2 * scale, 1 + scale]);
      drawBars(ctx, api, ps, ['local 0', 'local 1'], 1050, 360, 650, 270, choice ? 1 : -1);
      drawChapterText(
        ctx,
        api,
        'Removed tail IDs 2 and 3 · probabilities renormalize',
        960,
        710,
        30,
        themeColors.muted,
        'center',
      );
      api.rect(ctx, 260, 800, 1400 * ps[0], 65, themeColors.blue, undefined, 0);
      api.rect(ctx, 260 + 1400 * ps[0], 800, 1400 * ps[1], 65, themeColors.yellow, undefined, 0);
      drawChapterText(ctx, api, 'local 0', 260 + 700 * ps[0], 844, 32, themeColors.bg, 'center');
      drawChapterText(
        ctx,
        api,
        'local 1',
        260 + 1400 * ps[0] + 700 * ps[1],
        844,
        32,
        themeColors.bg,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'CDF first boundary ' + ps[0].toFixed(4),
        960,
        925,
        30,
        themeColors.cyan,
        'center',
      );
      if (cueProgress('draw-location', 1) > 0) {
        const mark = 260 + 1400 * s.uniform;
        api.arrow(ctx, mark, 740, mark, 792, themeColors.green, 6);
        drawChapterText(
          ctx,
          api,
          choice
            ? 'u = ' + s.uniform + ' → local ID ' + s.localId
            : 'u = ' + s.uniform + '   ·   Which local ID?',
          960,
          985,
          33,
          themeColors.green,
          'center',
        );
      }
    } else {
      const selected = cueProgress('reverse-map-choice', 3) > 0;
      drawChapterText(
        ctx,
        api,
        'Retain the local token until the next model lookup',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      const a = drawChapterCard(ctx, api, 'local ID 1', 170, 440, 410, themeColors.yellow, 120, 37),
        o = drawChapterCard(
          ctx,
          api,
          selected ? 'GPT-2 ID 461' : 'saved inverse map',
          760,
          440,
          410,
          themeColors.blue,
          120,
          36,
        ),
        z = drawChapterCard(
          ctx,
          api,
          selected ? 'ak' : 'byte decode',
          1350,
          440,
          410,
          themeColors.cyan,
          120,
          39,
        );
      api.connect(ctx, a, o, {
        color: themeColors.yellow,
        gap: 20,
      });
      api.connect(ctx, o, z, {
        color: themeColors.cyan,
        gap: 20,
      });
      drawChapterCard(
        ctx,
        api,
        'Model input appends 1 · decoding reverses the complete saved sequence',
        240,
        690,
        1440,
        themeColors.green,
        100,
        31,
      );
      if (cueProgress('unsupported-prompt', 3) > 0)
        drawChapterCard(
          ctx,
          api,
          'Prompt ID outside saved support → reject before lookup',
          240,
          845,
          1440,
          themeColors.pink,
          90,
          30,
        );
    }
    if (currentBeat !== 1 && currentBeat !== 2)
      drawFooter(
        ctx,
        api,
        'Sampling generator seed 17 is separate from training and validation generator states',
      );
  });
}
export default {
  id: 'generation-choice',
  draw: drawGenerationChoice,
  cues: [
    'generation-choice-1',
    'retain-eight',
    'sampling-temperature',
    'generation-choice-2',
    'retained-scale',
    'draw-location',
    'categorical-choice',
    'generation-choice-3',
    'reverse-map-choice',
    'unsupported-prompt',
  ],
};
