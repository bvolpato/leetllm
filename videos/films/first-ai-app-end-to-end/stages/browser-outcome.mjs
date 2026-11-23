import { cueProgress, page, savedRow, transit } from '../receipt.mjs';
import { runFixture } from '../model.mjs';
import { text } from '../defaults.mjs';
const result = runFixture();
export function drawBrowserOutcome(ctx, scene, state, api) {
  const { C } = api;
  const travel = cueProgress(scene, state, 'out-mail');
  const checked = cueProgress(scene, state, 'out-show') > 0;
  const reloaded = cueProgress(scene, state, 'out-reload') >= 0.5;
  const visible = checked && !reloaded;
  page(ctx, api, {
    status: visible ? 'Eligible under P-7.' : reloaded ? 'Ready.' : 'Checking policy P-7…',
    detail: visible ? 'No rotation job was created.' : reloaded ? 'Result' : '',
    submitted: !checked,
    receipt: visible,
    trace: result.rows[0].id,
    color: visible ? C.green : reloaded ? C.ink : C.yellow,
  });
  if (reloaded) api.line(ctx, 255, 750, 728, 750, C.muted, 2);
  savedRow(ctx, api, result.rows[0]);
  api.focus.target('wire', () => {
    transit(ctx, api, {
      from: 1135,
      to: 844,
      y: 555,
      progress: travel,
      color: C.cyan,
      showPacket: travel > 0 && travel < 1,
    });
    text(
      ctx,
      api,
      travel >= 1 ? 'Received' : 'Reply',
      990,
      480,
      30,
      travel >= 1 ? C.cyan : C.muted,
      'center',
    );
  });
  if (visible)
    text(
      ctx,
      api,
      'T-001 on the receipt matches T-001 in SQLite.',
      960,
      947,
      41,
      C.green,
      'center',
    );
  if (reloaded)
    text(ctx, api, 'The saved row survives a page reload.', 960, 947, 44, C.ink, 'center');
}
export default {
  id: 'browser-outcome',
  draw: drawBrowserOutcome,
  cues: ['out-row', 'out-mail', 'out-show', 'out-reload', 'out-saved'],
};
