import { chapterBox, footer, line, subtitle } from '../defaults.mjs';
export function drawExecutionBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-execution-boundary-b' + currentBeat),
    done = u >= 0.999;
  api.focus.target('pf-execution-boundary-mechanism', () => {
    if (currentBeat === 0) {
      subtitle(ctx, api, 'Test a review fallback against a fully known incident');
      chapterBox(
        ctx,
        api,
        'Trusted I-12 + IR-7\nrequired page recommendation',
        200,
        350,
        730,
        160,
        themeColors.green,
        30,
      );
      chapterBox(
        ctx,
        api,
        'Supplied response\nneeds_review · null · null · []',
        1050,
        350,
        670,
        160,
        themeColors.pink,
        30,
      );
      chapterBox(
        ctx,
        api,
        'Shape passes · decision conflicts with IR-7',
        440,
        750,
        1040,
        110,
        u > 0.5 ? themeColors.pink : themeColors.muted,
        35,
      );
      footer(ctx, api, 'Canary check: look for the exact test marker in the reply.');
    } else {
      const progressed = currentBeat === 2 || done;
      subtitle(ctx, api, 'A dispatcher checks the incident again before sending');
      chapterBox(
        ctx,
        api,
        'I-12 recommendation\naccepted under snapshot',
        190,
        350,
        710,
        150,
        themeColors.blue,
        29,
      );
      chapterBox(
        ctx,
        api,
        'Fresh page state\n' +
          (currentBeat === 2 || u > 0.25 ? 'another worker paged' : 'no page at snapshot'),
        1040,
        350,
        700,
        150,
        currentBeat === 2 || u > 0.25 ? themeColors.pink : themeColors.green,
        29,
      );
      line(ctx, api, 960, 330, 960, 900, themeColors.yellow, 4);
      chapterBox(
        ctx,
        api,
        progressed
          ? 'Atomic no-page claim: FAIL\nsecond page blocked'
          : 'Authorization + current policy\n+ atomic no-page claim',
        1040,
        680,
        700,
        150,
        progressed ? themeColors.pink : themeColors.cyan,
        29,
      );
      chapterBox(
        ctx,
        api,
        'Retained recommendation\nsource and incident identity',
        190,
        680,
        710,
        150,
        themeColors.blue,
        28,
      );
      footer(ctx, api, 'Only the dispatcher holds paging credentials.');
    }
  });
  return;
}
export default {
  id: 'execution-boundary',
  draw: drawExecutionBoundary,
  cues: ['pf-execution-boundary-b0', 'pf-execution-boundary-b1', 'pf-execution-boundary-b2'],
};
