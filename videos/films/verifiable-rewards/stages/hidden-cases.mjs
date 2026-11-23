import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawHeading, drawLine, drawTable, drawText } from '../defaults.mjs';
export function drawHiddenCases(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue hidden-cases/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'hidden-cases', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Hold the memorized lookup fixed; change only the tested inputs');
    const lookup = new Map([['14 × 12', 168], ['8 × 12', 96]]);
    drawTable(
      ctx,
      api,
      ['Stored lookup', 'answer'],
      Array.from(lookup, ([input, answer]) => [input, String(answer)]),
      190,
      395,
      600,
      140,
    );
    const hidden = operationProgress('new', 0),
      cases =
        hidden > 0
          ? [
              [7, 9],
              [11, 13],
            ]
          : [
              [14, 12],
              [8, 12],
            ];
    cases.forEach(([a, z], i) => {
      const y = 440 + i * 220;
      const input = a + ' × ' + z;
      drawCell(ctx, api, input, 1040, y, 280, 85, themeColors.blue);
      api.arrow(ctx, 1320, y + 42, 1390, y + 42, themeColors.muted, 3);
      const exists = lookup.has(input);
      if (resultComplete(hidden > 0 ? 'fail' : 'visible', 0))
        drawCell(
          ctx,
          api,
          exists ? String(lookup.get(input)) : 'not in table',
          1410,
          y,
          300,
          85,
          exists ? themeColors.green : themeColors.pink,
          29,
        );
    });
    if (resultComplete('fail', 0))
      drawText(ctx, api, 'unchanged table: 0 / 2 hidden cases', 1050, 915, 32, themeColors.pink);
    if (currentBeat >= 1 && operationProgress('access', 1) > 0) {
      drawLine(ctx, api, 850, 370, 850, 900, themeColors.yellow, 3);
      drawText(ctx, api, 'Final held-out access is limited', 230, 850, 28, themeColors.yellow);
      drawText(ctx, api, 'Repeated queries can leak its tests', 230, 905, 28, themeColors.yellow);
    }
    drawFooter(
      ctx,
      api,
      resultComplete('versions', 2)
        ? 'Compare the 0 / 2 result across runs only with the same test set and verifier version.'
        : resultComplete('fail', 0)
          ? 'Two unseen inputs expose this shortcut. Other inputs remain untested.'
          : 'Will the same lookup work when the inputs change?',
    );
  };
  api.focus.target('hidden-cases-mechanism', paint);
}
export default {
  id: 'hidden-cases',
  draw: drawHiddenCases,
  cues: [
    'vr-hidden-cases-b0',
    'vr-visible-hidden-cases',
    'vr-new-hidden-cases',
    'vr-fail-hidden-cases',
    'vr-hidden-cases-b1',
    'vr-access-hidden-cases',
    'vr-hidden-cases-b2',
    'vr-versions-hidden-cases',
  ],
};
