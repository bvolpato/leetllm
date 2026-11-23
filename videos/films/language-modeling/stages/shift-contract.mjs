import { languageStep } from '../construction.mjs';
import {
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  drawExtendedTokenRow,
} from '../defaults.mjs';
export function drawShiftContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('shift-contract', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('shift-contract-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Which word does the start token predict?'
        : 'Same vocabulary ID · different occurrences',
    );
    const labels =
      currentBeat === 0
        ? ['bos', 'function', 'returns', 'value', 'end']
        : ['bos', 'function', 'returns', 'end', 'pad'];
    drawExtendedTokenRow(ctx, api, labels, 210, 355, 270, 25, themeColors.blue);
    if (currentBeat === 0) {
      const wrong = S(0, 4) > 0 && !E(0, 5),
        targets = wrong
          ? ['returns', 'value', 'end', '?']
          : ['function', 'returns', 'value', 'end'];
      drawExtendedText(
        ctx,
        api,
        wrong ? 'Shift twice     start → returns' : 'Shift once     start → function',
        960,
        605,
        31,
        wrong ? themeColors.pink : themeColors.cyan,
        'center',
      );
      drawExtendedTokenRow(
        ctx,
        api,
        targets,
        210,
        730,
        270,
        25,
        wrong ? themeColors.pink : themeColors.green,
      );
      targets.forEach((_, i) => {
        api.arrow(
          ctx,
          345 + i * 295,
          450,
          345 + i * 295,
          545,
          wrong ? themeColors.pink : themeColors.green,
          4,
        );
        api.arrow(
          ctx,
          345 + i * 295,
          640,
          345 + i * 295,
          710,
          wrong ? themeColors.pink : themeColors.green,
          4,
        );
      });
      if (E(0, 3))
        drawExtendedText(
          ctx,
          api,
          wrong
            ? 'Labels supplied to the loss     already shifted'
            : 'Labels supplied to the loss     original input IDs',
          960,
          920,
          31,
          themeColors.yellow,
          'center',
        );
    } else {
      const repaired = E(1, 3),
        masked = S(1, 1) > 0;
      const ids = [0, 1, 2, 4, 4],
        targets = ids.map((v, i) =>
          masked && (repaired ? i === 4 : v === 4) ? 'ignore' : String(v),
        );
      drawExtendedTokenRow(ctx, api, ids.map(String), 210, 470, 270, 25, themeColors.muted);
      drawExtendedTokenRow(
        ctx,
        api,
        targets,
        210,
        730,
        270,
        25,
        repaired ? themeColors.green : themeColors.pink,
      );
      drawExtendedText(ctx, api, 'genuine end', 1230, 640, 26, themeColors.green, 'center');
      drawExtendedText(ctx, api, 'padding', 1530, 640, 26, themeColors.yellow, 'center');
      if (repaired) {
        api.arrow(ctx, 1230, 555, 1230, 585, themeColors.green, 5);
        api.arrow(ctx, 1230, 665, 1230, 710, themeColors.green, 5);
      }
      drawExtendedText(
        ctx,
        api,
        repaired
          ? 'Position mask keeps the genuine end label'
          : 'An ID comparison masks both end-valued positions',
        960,
        930,
        31,
        repaired ? themeColors.green : themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 1)
      drawExtendedFoot(
        ctx,
        api,
        'The attention mask selects visible inputs. The loss mask selects targets to score.',
      );
  });
}
export default {
  id: 'shift-contract',
  draw: drawShiftContract,
  cues: [
    'shift-contract-b1',
    'shift-contract-voice-1',
    'shift-contract-step-0-1',
    'shift-contract-step-0-2',
    'shift-contract-step-0-3',
    'shift-contract-step-0-4',
    'shift-contract-step-0-5',
    'shift-contract-b2',
    'shift-contract-voice-2',
    'shift-contract-step-1-1',
    'shift-contract-step-1-2',
    'shift-contract-step-1-3',
    'shift-contract-step-1-4',
    'shift-contract-step-1-5',
  ],
};
