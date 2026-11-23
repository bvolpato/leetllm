import { spoken } from '../construction.mjs';
import { sftBoundaryRepair } from '../model.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat >= 3) {
    api.focus.target('serving-probe', () => {
      const ticket = spoken(state, 'sample-ticket', 3, 0.64);
      const permission = spoken(state, 'sample-permission', 3, 0.78);
      const stopped = spoken(state, 'sample-stop', 3, 0.84);
      const gradedAccess = spoken(state, 'grade-access', 4, 0.14);
      const verdict = spoken(state, 'grade-reply-result', 4, 0.57);
      text(ctx, api, 'Held-out request', 165, 253, 36, C.blue);
      text(ctx, api, '“My service key is 22 days old. Can I still use it?”', 165, 359, 54, C.ink);
      api.line(ctx, 165, 416, 1755, 416, C.muted, 2);
      text(ctx, api, 'Example assistant reply', 165, 505, 36, C.blue);
      if (ticket) text(ctx, api, 'Open a rotation ticket.', 165, 618, 52, C.ink);
      if (permission)
        text(ctx, api, 'You can keep using the key.', 165, 732, 52, gradedAccess ? C.pink : C.ink);
      if (stopped) upgradeBox(ctx, api, 'END', 165, 789, 142, 73, C.blue, 35);
      if (gradedAccess) text(ctx, api, 'Only security can approve access', 1060, 732, 39, C.pink);
      if (verdict) {
        text(ctx, api, 'Required action', 1060, 618, 39, C.green);
        text(ctx, api, 'Turn ended', 1060, 844, 39, C.green);
        text(ctx, api, 'Reply fails the policy', 960, 977, 46, C.pink, 'center');
      } else if (stopped && state.beat === 3) {
        text(ctx, api, 'Would you pass this reply?', 960, 977, 46, C.ink, 'center');
      }
    });
    return;
  }
  api.focus.target('join-trace', () => {
    const repaired = spoken(state, 'repair-join', 1, 0.44);
    const row = sftBoundaryRepair(repaired);
    const slots = [
      { pos: '0–3', name: '19-day request', index: 3 },
      ...row.tokens.slice(4).map((name, i) => ({ pos: String(i + 4), name, index: i + 4 })),
    ];
    const x = (i) => 275 + i * 273;
    const join = (x(4) + x(5)) / 2;
    text(ctx, api, 'Incident A    /    19-day key', 146, 290, 37, C.blue);
    text(ctx, api, 'Incident B', x(5), 290, 34, C.blue, 'center');
    api.line(ctx, join, 304, join, 741, C.yellow, 3);
    slots.forEach(({ pos, name, index }, i) => {
      const active = row.active[index];
      text(ctx, api, pos, x(i), 370, 30, C.muted, 'center');
      upgradeBox(ctx, api, name, x(i) - 119, 395, 238, 85, C.blue, i === 0 ? 29 : 35);
      upgradeBox(
        ctx,
        api,
        active ? name : i === 0 ? '4 × −100' : '−100',
        x(i) - 119,
        637,
        238,
        81,
        active ? C.green : C.muted,
        32,
      );
      if (active) api.arrow(ctx, x(i - 1), 495, x(i), 620, C.green, 4);
    });
    text(ctx, api, 'Loss labels', 156, 774, 28, C.muted);
    text(ctx, api, 'Active targets   ' + row.count, 1740, 775, 38, C.ink, 'right');
    if (state.beat === 0) {
      text(ctx, api, 'Which two labels would you change?', 960, 920, 51, C.ink, 'center');
    } else if (state.beat === 1) {
      text(
        ctx,
        api,
        repaired ? 'ticket  →  END' : 'END  →  USER',
        960,
        912,
        53,
        repaired ? C.green : C.ink,
        'center',
      );
    } else {
      const bad = sftBoundaryRepair(false);
      const showMean = spoken(state, 'repair-mean', 2, 0.83);
      [bad, row].forEach((version, i) => {
        const selected = version.probabilities.map((p) => p.toFixed(2)).join(' × ');
        const col = i ? C.green : C.muted;
        const center = 515 + 890 * i;
        text(ctx, api, i ? 'After  ·  END' : 'Before  ·  USER', center, 859, 34, col, 'center');
        text(
          ctx,
          api,
          '−ln(' +
            selected +
            ') / ' +
            version.count +
            (showMean ? ' ≈ ' + version.mean.toFixed(3) : ''),
          center,
          943,
          35,
          col,
          'center',
        );
      });
    }
  });
}

export default {
  id: 'fresh-boundary-repair',
  draw: draw,
  cues: [
    'inspect-join',
    'repair-join',
    'compare-terms',
    'repair-mean',
    'held-out-probe',
    'sample-ticket',
    'sample-permission',
    'sample-stop',
    'grade-access',
    'grade-reply-result',
  ],
};
