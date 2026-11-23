import { dashboardCue, dashboardRows } from '../arithmetic.mjs';
import { dashboardBox, dashboardText as text, dashboardLine as line } from '../defaults.mjs';

export function drawRows(ctx, scene, state, api) {
  const { C } = api;
  const row = dashboardRows().at(-1);
  const open = state.beat > 0 ? 1 : dashboardCue(state, 'open-record', state.beatP);
  api.focus.target('record', () => {
    dashboardBox(ctx, api, 115, 224, 1690, 706, C.muted);
    text(ctx, api, row.id, 175, 320, 46, C.ink, 'left', 'mono');
    text(ctx, api, row.run, 1730, 320, 34, C.blue, 'right', 'mono');
    line(ctx, api, 175, 367, 1740, 367, C.muted, 2);
    text(ctx, api, 'Request', 175, 443, 29, C.muted);
    text(ctx, api, row.question, 440, 443, 36, C.ink);
    api.components.fade(open, () => {
      text(ctx, api, 'Expected', 175, 555, 29, C.muted);
      text(ctx, api, row.expectedAnswer, 440, 555, 38, C.ink);
      text(ctx, api, 'abstain   /   no citations', 440, 610, 30, C.cyan);
      text(ctx, api, 'Returned', 175, 712, 29, C.muted);
      text(ctx, api, row.answer, 440, 712, 38, C.ink);
      text(ctx, api, row.status + '   /   ' + row.citations[0], 440, 768, 30, C.pink);
    });
    if (state.beat > 0) {
      text(
        ctx,
        api,
        row.dataset + '    /    ' + row.corpus + '    /    ' + row.grader,
        175,
        875,
        26,
        C.muted,
        'left',
        'mono',
      );
    }
  });
}
export default { id: 'rows', draw: drawRows, cues: ['open-record'] };
