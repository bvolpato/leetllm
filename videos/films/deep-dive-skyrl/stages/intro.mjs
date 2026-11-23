import { labels, mask, rewards, tokens } from '../fixtures.mjs';
import { phraseEnded } from '../construction.mjs';
import { drawCustomers, drawQuery } from '../sql-repair.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const repaired = end('intro-repair', 1, 0.2);
  const verified = end('intro-beat-2-focus-1', 1, 0.6);
  const scored = end('intro-return', 1, 0.78);
  const showMask = end('intro-apply-mask', 3, 0.45);
  const closeUp = !end('intro-db-error', 0, 0.5);
  const arrival = Math.min(1, (state.t ?? 2) / 1.65);
  const remaining = (1 - arrival) ** 2;

  if (!closeUp) api.focus.target('intro-schema', () => drawCustomers(ctx, api));
  api.focus.target('intro-sql', () => {
    if (closeUp) {
      api.text(
        ctx,
        'SELECT name FROM customers WHERE active = 1',
        125,
        298,
        47,
        C.ink,
        'left',
        'mono',
      );
      api.text(ctx, 'AND unresolved_count > 3;', 125, 428, 84, C.yellow, 'left', 'mono');
    } else {
      drawQuery(ctx, api, repaired ? 'open_incidents' : 'unresolved_count');
    }
  });
  api.focus.target('intro-environment', () => {
    if (repaired) {
      api.components.card({
        x: 1015,
        y: 577,
        width: 780,
        height: 76,
        label: verified ? 'Database: verified result' : 'Checking returned rows',
        fontSize: 34,
        font: 'mono',
        fill: C.panel,
        stroke: verified ? C.green : C.muted,
        textColor: C.ink,
        padding: 8,
      });
    }
    if (verified) api.text(ctx, 'Returned {Ada}  =  expected {Ada}', 1020, 712, 31, C.green);
    if (end('intro-attempt', 0, 0.65)) {
      const total = rewards.slice(0, scored ? 5 : 2).reduce((sum, r) => sum + r, 0);
      api.text(ctx, `Trajectory reward: ${total.toFixed(1)}`, 130, 712, 34, C.ink);
    }
  });

  api.focus.target('intro-response', () => {
    api.text(ctx, 'Response IDs', 125, 757, 32, C.ink);
    tokens.slice(0, repaired ? 5 : 3).forEach((id, i) => {
      const observation = !mask[i];
      const color = observation ? C.yellow : C.blue;
      const flight = observation ? remaining : 0;
      const x = 125 + i * 338 + 72 * flight;
      const y = 790 - 300 * flight;
      const width = 306 + 288 * flight;
      const height = 90 + 60 * flight;
      const drawToken = () => {
        api.components.card({
          x,
          y,
          width,
          height,
          label: observation && !repaired ? 'no such column' : labels[i] + '   ' + id,
          fontSize: 35 + 31 * flight,
          font: 'mono',
          fill: observation ? C.yellow : C.panel,
          stroke: color,
          textColor: observation ? C.bg : color,
          padding: 8,
        });
        const role = observation ? 'database' : 'policy';
        const caption = showMask
          ? role + '  ·  mask ' + mask[i]
          : observation && !repaired
            ? 'database  ·  ID ' + id
            : role;
        api.text(ctx, caption, x + width / 2, y + height + 61, 33, color, 'center');
      };
      if (observation) api.focus.target('intro-observation', drawToken);
      else drawToken();
    });
  });
  if (showMask)
    api.text(
      ctx,
      'Trainer input    5 response IDs    /    4 action positions    /    stop',
      960,
      1028,
      32,
      C.ink,
      'center',
    );
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-attempt',
    'intro-db-error',
    'intro-find-column',
    'intro-repair',
    'intro-beat-2-focus-1',
    'intro-return',
    'intro-apply-mask',
  ],
};
