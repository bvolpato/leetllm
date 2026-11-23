import { text } from '../defaults.mjs';
import { request } from '../fixtures.mjs';
import { createApp } from '../model.mjs';
import { cueProgress, page, savedRow, transit } from '../receipt.mjs';

const app = createApp();
const original = app.store.get(app.check(request).body.trace_id);
const body = { account_id: 'acct_10236', credential_report: 'Please consider an exception.' };
const current = app.store.get(app.check(body).body.trace_id);

export function drawBrowserAuthority(ctx, scene, state, api) {
  const { C } = api;
  const first = state.beat === 0,
    dropped = state.beat === 2;
  const damaged = state.beat === 3;
  const received =
    !dropped &&
    !damaged &&
    cueProgress(scene, state, first ? 'browser-authority-b1' : 'browser-authority-b2') > 0;
  const detected =
    (dropped && cueProgress(scene, state, 'browser-authority-b3') > 0) ||
    (damaged && cueProgress(scene, state, 'authority-unusable') > 0);
  const record = first ? original : current;
  api.focus.target('browser-authority-mechanism', () => {
    page(ctx, api, {
      status: received
        ? first
          ? 'Eligible under P-7.'
          : 'Not eligible under P-7.'
        : detected
          ? 'Request unavailable.'
          : 'Checking policy P-7…',
      detail: received
        ? 'No rotation job was created.'
        : detected
          ? 'Retrying starts a new request.'
          : '',
      submitted: !received && !detected,
      receipt: received,
      trace: record.id,
      account: record.account_id,
      report: first ? request.credential_report : body.credential_report,
      color: received ? C.green : C.yellow,
    });
    if (damaged) {
      text(ctx, api, 'Response body', 1190, 348, 38, C.cyan);
      api.rect(ctx, 1186, 398, 574, 310, C.panel, C.cyan, 7);
      text(ctx, api, 'HTTP 200', 1220, 476, 38, C.ink);
      text(ctx, api, 'status       failed', 1220, 569, 34);
      text(ctx, api, 'decision    eligible', 1220, 649, 34, C.yellow);
      api.arrow(ctx, 1150, 555, 824, 555, C.cyan, 4);
    } else if (state.beat === 1 && cueProgress(scene, state, 'authority-accept') === 0) {
      text(ctx, api, 'Trusted account record', 1190, 348, 38, C.blue);
      api.rect(ctx, 1186, 398, 574, 310, C.panel, C.blue, 7);
      text(ctx, api, record.account_id, 1220, 476, 38);
      text(ctx, api, record.facts.credential_age_days + ' days old', 1220, 568, 42);
      text(ctx, api, 'Stale flag    No', 1220, 651, 37, C.blue);
    } else {
      savedRow(ctx, api, record);
    }
    if (dropped) {
      const p = cueProgress(scene, state, 'authority-drop');
      if (p < 1)
        transit(ctx, api, { from: 1135, to: 844, stop: 1008, y: 555, progress: p, color: C.cyan });
      else {
        api.line(ctx, 821, 555, 924, 555, C.muted, 2);
        api.line(ctx, 1030, 555, 1158, 555, C.cyan, 3);
        api.line(ctx, 959, 538, 990, 572, C.pink, 6);
        api.line(ctx, 959, 572, 990, 538, C.pink, 6);
      }
    } else if (received) api.arrow(ctx, 1150, 555, 824, 555, C.cyan, 4);
    const footer = damaged
      ? 'A recorded failure requires a null decision.'
      : first
        ? 'Checked fields   →   app label   →   textContent'
        : dropped
          ? 'The server row is outside the browser’s view.'
          : 'Trusted facts    45 days old    ·    stale = false';
    text(ctx, api, footer, 960, 938, 38, C.ink, 'center');
  });
}
export default {
  id: 'browser-authority',
  draw: drawBrowserAuthority,
  cues: [
    'browser-authority-b1',
    'authority-accept',
    'browser-authority-b2',
    'authority-drop',
    'browser-authority-b3',
    'authority-unusable',
  ],
};
