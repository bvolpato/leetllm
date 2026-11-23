import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawGeneratorRuntime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('generator-runtime', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-generator-runtime-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Return A and B in input order'
        : currentBeat === 1
          ? 'Nullable value still has a required key'
          : 'Shape and provenance checks precede optimization',
    );
    if (!currentBeat) {
      const returned = done('row-order'),
        arrived = done('row-arrival');
      ['A', 'B'].forEach((id, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          'input ' + id,
          150,
          370 + i * 210,
          300,
          95,
          themeColors.blue,
          36,
        );
        const x = returned ? 1250 : 740,
          y = returned ? 370 + i * 210 : arrived ? (i ? 370 : 580) : 370 + i * 210;
        drawSkyChapterBox(
          ctx,
          api,
          id + ' | IDs | mask | reward',
          x,
          y,
          520,
          110,
          i === 1 ? themeColors.cyan : themeColors.blue,
          29,
        );
        if (returned) drawSkyChapterArrow(ctx, api, 460, 417 + i * 210, 1210, 417 + i * 210);
      });
      drawSkyChapterText(
        ctx,
        api,
        returned
          ? 'Output index 0 → A; index 1 → B'
          : arrived
            ? 'B finished first; both full rows retain their identities'
            : 'Two supplied environments have different completion times',
        960,
        915,
        32,
        returned ? themeColors.green : themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      api.rect(ctx, 210, 350, 1480, 500, themeColors.panel, themeColors.blue, 3);
      drawSkyChapterText(
        ctx,
        api,
        'GeneratorOutput  /  three fields from a one-row batch',
        950,
        420,
        35,
        themeColors.blue,
        'center',
      );
      const ok = done('nullable-key');
      drawSkyChapterText(
        ctx,
        api,
        'response_ids: [[11,12,90,21,22]]',
        275,
        510,
        34,
        themeColors.blue,
      );
      drawSkyChapterText(ctx, api, 'loss_masks:   [[1,1,0,1,1]]', 275, 600, 34, themeColors.cyan);
      drawSkyChapterText(
        ctx,
        api,
        ok ? 'pixel_values: None' : 'pixel_values: <key missing>',
        275,
        690,
        34,
        ok ? themeColors.green : themeColors.pink,
      );
      drawSkyChapterText(
        ctx,
        api,
        ok
          ? 'The declared key now has a valid value'
          : 'This batch still needs the pixel_values key',
        960,
        920,
        33,
        ok ? themeColors.green : themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['field', 'A', 'B'],
          ['response positions', '5', '5'],
          ['mask positions', '5', '5'],
          ['behavior scores', '5', done('missing-behavior') ? 'MISSING' : 'pending'],
          ['new policy label', '19', '19'],
        ],
        260,
        365,
        1400,
        470,
      );
      drawSkyChapterText(
        ctx,
        api,
        done('missing-behavior')
          ? 'Record each action’s probability when it is sampled'
          : 'Compare the two output rows',
        960,
        930,
        32,
        done('missing-behavior') ? themeColors.pink : themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'generator-runtime',
  draw: drawGeneratorRuntime,
  cues: [
    'sky-generator-runtime-b0',
    'sky-row-arrival',
    'sky-row-order',
    'sky-generator-runtime-b1',
    'sky-nullable-key',
    'sky-generator-runtime-b2',
    'sky-missing-behavior',
  ],
};
