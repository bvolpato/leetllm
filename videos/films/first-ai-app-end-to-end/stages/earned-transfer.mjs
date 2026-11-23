import { text } from '../defaults.mjs';
import { thresholdTrials } from '../model.mjs';
import { cueProgress, transit } from '../receipt.mjs';

const trials = thresholdTrials();
const candidate = trials[0].candidate;

function compare(ctx, api, state, scene, reveal) {
  const { C } = api;
  text(ctx, api, 'Trusted age', 1120, 319, 32, C.blue);
  text(ctx, api, 'Saved outcome', 1450, 319, 32, C.cyan);
  for (const [i, trial] of trials.entries()) {
    const y = 487 + i * 222;
    api.focus.target('ages', () => {
      const progress = cueProgress(scene, state, i === 0 ? 'end-ages' : 'end-second-age');
      text(ctx, api, progress > 0 ? trial.days + ' days' : '?', 1120, y - 15, 46);
      const x = 1132 + 58 * (trial.days - 28);
      const threshold = 1248;
      api.line(ctx, 1132, y + 42, 1306, y + 42, C.muted, 3);
      api.line(ctx, threshold, y + 42, 1306, y + 42, C.green, 6);
      api.line(ctx, threshold, y + 26, threshold, y + 62, C.green, 3);
      if (progress > 0) api.circle(ctx, x, y + 42, 10, C.blue);
      text(ctx, api, '30', threshold, y + 98, 25, C.green, 'center');
    });
    api.focus.target(i === 0 ? 'younger' : 'older', () => {
      const color = trial.row.status === 'completed' ? C.green : C.pink;
      text(
        ctx,
        api,
        reveal[i] ? trial.row.status + '  ·  v' + trial.row.version : '?',
        1450,
        y - 7,
        37,
        reveal[i] ? color : C.muted,
      );
      if (reveal[i])
        text(
          ctx,
          api,
          trial.reply.body.decision ?? trial.reply.body.error_code,
          1450,
          y + 57,
          30,
          C.ink,
        );
    });
  }
  text(ctx, api, 'Stale in both runs', 1120, 850, 31, C.blue);
}

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C } = api;
  const at = (id) => cueProgress(scene, state, id);
  const delivery = state.beat >= 2;
  const drop = at('end-drop');
  const detected = at('end-detect') > 0;
  const explained = at('end-message') > 0;
  const offered = at('end-candidate') > 0;
  api.line(ctx, 1062, 249, 1062, 847, C.muted, 2);
  compare(ctx, api, state, scene, [at('end-young') > 0, at('end-thirty') > 0]);
  if (!delivery) {
    api.focus.target('candidate', () => {
      text(ctx, api, 'Same provider candidate', 136, 324, 39, C.cyan);
      api.rect(ctx, 135, 386, 740, 372, C.panel, C.cyan, 10);
      text(
        ctx,
        api,
        offered ? candidate.decision : 'Awaiting candidate',
        178,
        506,
        54,
        offered ? C.ink : C.muted,
      );
      api.line(ctx, 178, 550, 828, 550, C.muted, 2);
      text(
        ctx,
        api,
        offered ? 'Window     ' + candidate.rotation_window_days + ' days (integer)' : 'Window',
        178,
        631,
        34,
        C.ink,
      );
      text(
        ctx,
        api,
        offered ? 'Evidence    ' + JSON.stringify(candidate.source_line_ids) : 'Evidence',
        178,
        705,
        34,
        C.ink,
      );
    });
  } else {
    api.focus.target('page', () => {
      text(ctx, api, 'Luna’s page in each run', 135, 319, 39, C.blue);
      for (const i of trials.keys()) {
        const y = 487 + i * 222;
        api.rect(ctx, 136, y - 82, 598, 154, C.panel, C.blue, 10);
        text(
          ctx,
          api,
          detected ? 'Network error detected' : 'Waiting for reply',
          167,
          y - 29,
          28,
          C.muted,
        );
        const status = explained
          ? 'Request unavailable.'
          : detected
            ? 'Result     ?'
            : 'Checking policy P-7…';
        text(ctx, api, status, 167, y + 36, 39, drop >= 1 ? C.yellow : C.ink);
      }
    });
    api.focus.target('wire', () => {
      for (const y of [487, 709]) {
        if (drop < 1) {
          transit(ctx, api, { from: 1010, to: 788, stop: 917, y, progress: drop, color: C.cyan });
        } else {
          api.line(ctx, 755, y, 851, y, C.muted, 2);
          api.line(ctx, 927, y, 1032, y, C.cyan, 3);
          api.line(ctx, 876, y - 14, 903, y + 14, C.pink, 5);
          api.line(ctx, 876, y + 14, 903, y - 14, C.pink, 5);
        }
      }
    });
  }
  const prompt = [
    at('end-ask-rule') > 0 ? 'Which attempt can record eligible?' : '',
    '',
    at('end-ask-page') > 0 ? 'What outcome can either page report?' : '',
  ][state.beat];
  if (prompt)
    text(ctx, api, prompt, 960, 960, 39, state.beat % 2 === 0 ? C.yellow : C.ink, 'center');
  if (at('end-resubmit') > 0)
    api.focus.target('retry-note', () =>
      text(ctx, api, 'Submit again  →  new check', 135, 960, 39, C.blue),
    );
  if (at('end-lookup') > 0)
    api.focus.target('lookup-note', () =>
      text(ctx, api, 'Original result  →  needs authorized lookup', 955, 960, 37, C.yellow),
    );
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'end-candidate',
    'end-ages',
    'end-second-age',
    'end-ask-rule',
    'end-thirty',
    'end-young',
    'end-drop',
    'end-detect',
    'end-ask-page',
    'end-message',
    'end-rows',
    'end-resubmit',
    'end-lookup',
  ],
};
