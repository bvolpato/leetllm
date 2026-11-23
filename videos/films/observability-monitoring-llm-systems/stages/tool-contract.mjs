import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawToolContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'tool-contract', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Follow one tool call');
      withTarget(ctx, api, 'tool-phases', () => {
        const labels = ['select action', 'execute tool', 'observe result', 'evaluate completion'];
        labels.forEach((v, i) =>
          drawChapterCard(
            ctx,
            api,
            'Step ' + (i + 1),
            v,
            140 + i * 410,
            390,
            370,
            i === Math.min(3, Math.floor(progress(0, 1) * 4)) ? themeColors.cyan : themeColors.blue,
            140,
            26,
          ),
        );
        if (progress(0, 3) > 0)
          drawTable(
            ctx,
            api,
            ['Operation', 'Identity'],
            [
              ['execute-tool lookup', 'call7'],
              ['execute-tool lookup', 'call8'],
            ],
            140,
            660,
            [850, 770],
            115,
          );
        if (resultComplete(0, 4))
          drawChapterText(
            ctx,
            api,
            'Same tool name · different operation identities',
            140,
            970,
            32,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'Opaque operation identity survives content minimization');
      withTarget(ctx, api, 'operation-identity', () => {
        drawChapterCard(
          ctx,
          api,
          'Operation X7',
          ['lookup · result pending', 'sensitive selector hidden'],
          140,
          370,
          760,
          themeColors.blue,
          170,
        );
        drawChapterCard(
          ctx,
          api,
          'Operation X8',
          ['lookup · result pending', 'different sensitive selector hidden'],
          1000,
          370,
          760,
          themeColors.cyan,
          170,
        );
        if (progress(1, 3) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Content placeholder',
            '[redacted] = [redacted]',
            140,
            725,
            760,
            themeColors.yellow,
            145,
          );
          drawChapterCard(
            ctx,
            api,
            'Identity ledger',
            'X7 ≠ X8',
            1000,
            725,
            760,
            themeColors.green,
            145,
          );
        }
        if (resultComplete(1, 4))
          drawChapterText(
            ctx,
            api,
            'Use the approved operation ID to distinguish these calls.',
            140,
            985,
            30,
            themeColors.yellow,
          );
      });
    } else {
      drawHeading(ctx, api, 'Admission guards execute before dispatch');
      withTarget(ctx, api, 'admission-guards', () => {
        const changed = resultComplete(2, 2),
          seq = ['scan17', 'scan17', changed ? 'scan18' : 'scan17'];
        drawCells(ctx, api, seq, 140, 375, 1620, 100, [
          themeColors.blue,
          themeColors.blue,
          changed ? themeColors.cyan : themeColors.blue,
        ]);
        drawChapterCard(
          ctx,
          api,
          'Consecutive suffix',
          changed ? 'scan 18  ·  count 1' : 'scan 17  ·  count 3',
          140,
          620,
          760,
          changed ? themeColors.green : themeColors.yellow,
          145,
        );
        drawChapterCard(
          ctx,
          api,
          'Independent checks',
          progress(2, 4) > 0
            ? 'time + spending checked before effect'
            : 'repeat policy is one gate',
          1000,
          620,
          760,
          themeColors.yellow,
          145,
        );
        if (resultComplete(2, 4))
          drawChapterText(
            ctx,
            api,
            'Next poll requires time and budget.',
            140,
            960,
            31,
            themeColors.pink,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'tool-contract',
  draw: drawToolContract,
  cues: [
    'ob-tool-contract-1-1',
    'ob-tool-contract-1-2',
    'ob-tool-contract-1-3',
    'ob-tool-contract-1-4',
    'ob-tool-contract-2-1',
    'ob-tool-contract-2-2',
    'ob-tool-contract-2-3',
    'ob-tool-contract-2-4',
    'ob-tool-contract-3-1',
    'ob-tool-contract-3-2',
    'ob-tool-contract-3-3',
    'ob-tool-contract-3-4',
    'ob-tool-contract-3-5',
  ],
};
