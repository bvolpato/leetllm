import { cueClock } from '../cue-clock.mjs';

export function drawReleaseBoundary(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueClock(scene, state);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat === 0) {
    text('Same request   /   same model', 155, 295, 37, C.muted);
    focus.target('calendar-record', () => {
      const swapped = p('calendar-swap') === 1;
      text('Release calendar', 155, 432, 51);
      api.line(ctx, 155, 485, 1730, 485, C.blue, 4);
      text(swapped ? 'Tomorrow’s snapshot' : 'Today’s snapshot', 155, 582, 42, C.blue);
      text('Release window opens at', 155, 746, 64);
      const clock =
        p('calendar-one') > 0
          ? '13:00'
          : swapped || p('calendar-nine') === 0
            ? '– – : – –'
            : '09:00';
      text(clock, 1180, 759, 100, C.yellow);
    });
    text('Illustrative retrieved entry', 155, 925, 32, C.muted);
  } else if (state.beat === 1) {
    focus.target('manifest-record', () => {
      text('Release manifest', 155, 340, 52, C.blue);
      text('Prompt  ·  base  ·  adapter  ·  image', 155, 450, 39);
      if (p('pin-retrieval') > 0) text('Calendar snapshot + search index', 155, 545, 39);
      if (p('pin-feature') > 0) text('Feature definition + transform', 155, 640, 39);
      if (p('pin-policy') > 0) text('Tools  ·  guardrails  ·  generation settings', 155, 735, 39);
    });
    focus.target('request-record', () => {
      text('One request trace', 1100, 340, 52, C.green);
      text('Resolved release ID', 1100, 450, 39);
      if (p('trace-values') > 0) {
        text('Region + request time', 1100, 545, 39);
        text('Feature values + timestamps', 1100, 640, 39);
        text('Retrieved evidence', 1100, 735, 39);
      }
    });
  } else {
    focus.target('calendar-field', () => {
      text('Scheduled hour', 155, 360, 41, C.blue);
      text('13:00', 155, 530, 108);
      text('Exact field check', 155, 645, 40, C.blue);
    });
    focus.target('calendar-rubric', () => {
      text('Two acceptable answers', 840, 360, 41, C.green);
      text('“The window opens at one.”', 840, 508, 48);
      text('“You can start at 13:00.”', 840, 613, 48);
      if (p('rubric') > 0)
        text('Reviewed rubric   /   grounding and usefulness', 840, 745, 32, C.green);
    });
    text('Pin the evaluation set and judge to the release.', 960, 951, 37, C.muted, 'center');
  }
}
export default {
  id: 'release-boundary',
  draw: drawReleaseBoundary,
  cues: [
    'calendar-request',
    'calendar-nine',
    'calendar-swap',
    'calendar-one',
    'pin-retrieval',
    'pin-feature',
    'trace-values',
    'pin-policy',
    'parser-field',
    'rubric',
  ],
};
