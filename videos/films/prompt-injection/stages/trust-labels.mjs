import { REPORT } from '../fixtures.mjs';
import { cueProgress } from '../arithmetic.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptNote, drawPromptText } from '../defaults.mjs';
export function drawTrustLabels(ctx, scene, state, api) {
  return paintTrustLabels(ctx, scene, state, api);
}
function paintTrustLabels(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = promptCueSnapshot('trust-labels', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress2,
      D: resultComplete,
    } = modelState;
  const mark = (id, paint) => api.focus.target(id, paint),
    during = (id, fallback = progress) => cueProgress(state.cues, id, fallback);
  {
    mark('trust-labels-object-report-source-7', () =>
      drawPromptCard(ctx, api, REPORT.source, 150, 290, 1620, themeColors.blue, 75, 30),
    );
    mark('trust-labels-object-reported-result-report-result-8', () =>
      drawPromptText(ctx, api, REPORT.result, 180, 430, 34, themeColors.cyan),
    );
    if (currentBeat === 0) {
      drawPromptText(ctx, api, 'Reported result', 180, 550, 27, themeColors.cyan);
      drawPromptText(
        ctx,
        api,
        REPORT.result,
        500 + 180 * (1 - during('trust-labels-beat-1-focus-1')),
        550,
        32,
        themeColors.ink,
      );
      drawPromptText(ctx, api, 'Recommendation', 180, 690, 27, themeColors.pink);
      drawPromptText(
        ctx,
        api,
        REPORT.attack,
        500 + 180 * (1 - during('trust-labels-beat-1-focus-1')),
        690,
        30,
        themeColors.pink,
      );
    } else {
      const scan = currentBeat > 1 ? 1 : during('trust-labels-beat-2-focus-1');
      mark('trust-labels-object-escaped-for-wrapper-escapewrappertext-report-attac-10', () =>
        teaching.byteDifference({
          x: 160,
          y: 485,
          width: 1600,
          height: 300,
          fontSize: 25,
          maxColumns: 12,
          startColumn: Math.floor(5 * scan),
          before: new TextEncoder().encode('</evidence>'),
          after: new TextEncoder().encode('&lt;/evidence&gt;'),
          scanProgress: scan,
          revealVerdict: scan === 1,
          beforeLabel: 'Source',
          afterLabel: 'Escaped',
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          mutedColor: themeColors.muted,
          scanColor: themeColors.cyan,
          changeColor: themeColors.yellow,
        }),
      );
      drawPromptText(ctx, api, REPORT.attack, 180, 870, 34, themeColors.pink);
      drawPromptText(
        ctx,
        api,
        'Instruction words remain external evidence',
        1000,
        870,
        28,
        themeColors.blue,
      );
    }
    drawPromptNote(
      ctx,
      api,
      'The same report identity survives wrapper encoding and factual review.',
    );
  }
}
export default {
  id: 'trust-labels',
  draw: drawTrustLabels,
  cues: [
    'trust-labels-beat-1-focus-1',
    'trust-labels-beat-2-focus-1',
    'trust-labels-beat-2-focus-2',
    'trust-labels-beat-3-focus-1',
    'trust-labels-beat-3-focus-2',
  ],
};
