import { cueProgress } from '../arithmetic.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const exact = cueProgress(state, 1, 'exact-returns', 0, 0.2) > 0;
  const denied = cueProgress(state, 1, 'denied-stops', 0.35, 0.49) > 0;
  const live = cueProgress(state, 2, 'live-generates', 0, 0.26);
  const prefixMiss = cueProgress(state, 3, 'change-prefix', 0.1, 0.45);
  const routes = [
    {
      label: 'Exact repeats',
      n: 4,
      ready: exact,
      result: 'Return approved answer',
      calls: 0,
      color: C.blue,
    },
    {
      label: 'Access revoked',
      n: 2,
      ready: denied,
      result: 'Deny at permission check',
      calls: 0,
      color: C.pink,
    },
    {
      label: 'Live incidents',
      n: 3,
      ready: live > 0,
      result: 'Read current incident state',
      calls: Math.min(3, Math.ceil(live * 3)),
      color: C.cyan,
    },
  ];
  for (const [str, x] of [
    ['Request', 110],
    ['Instances', 505],
    ['Route', 880],
    ['Generation calls', 1510],
  ])
    txt(str, x, 261, 32, C.muted);
  api.line(ctx, 110, 289, 1810, 289, C.muted, 2);
  let calls = 0;
  focus.target('route-rows', () => {
    for (const [i, route] of routes.entries()) {
      const y = 376 + i * 111;
      txt(route.label, 110, y + 12, 38);
      for (let j = 0; j < route.n; j++) api.circle(ctx, 533 + j * 65, y, 17, route.color);
      txt(
        route.ready ? route.result : 'Awaiting decision',
        880,
        y + 11,
        33,
        route.ready ? route.color : C.muted,
      );
      txt(
        route.ready ? String(route.calls) : '?',
        1685,
        y + 17,
        50,
        route.ready ? route.color : C.muted,
        'center',
      );
      calls += route.calls;
    }
  });
  api.line(ctx, 110, 688, 1810, 688, C.panel, 3);
  focus.target('prompt-work', () => {
    if (live > 0) {
      txt('Input work on each live call', 110, 760, 31, C.muted);
      const x = 115,
        y = 811;
      for (let i = 0; i < 8; i++) {
        const recalc = i < Math.ceil(8 * prefixMiss);
        api.rect(ctx, x + i * 55, y, 47, 43, recalc ? C.yellow : C.blue, undefined, 4);
      }
      for (let i = 0; i < 3; i++) api.rect(ctx, 650 + i * 55, y, 47, 43, C.yellow, undefined, 4);
      txt(
        prefixMiss > 0 ? 'Recompute prefix' : 'Reuse prefix state',
        113,
        913,
        35,
        prefixMiss > 0 ? C.yellow : C.blue,
      );
      txt('New evidence', 648, 913, 35, C.yellow);
    } else {
      txt('Live requests', 110, 792, 32, C.muted);
      txt('Matching prompt prefix available', 110, 866, 38);
    }
  });
  focus.target('call-count', () => {
    const drawn = live === 1;
    txt(
      drawn ? calls + ' generation calls' : 'How many generation calls?',
      1805,
      831,
      43,
      drawn ? C.green : C.yellow,
      'right',
    );
    txt(
      drawn ? '0 semantic-candidate scores' : 'How many semantic scores?',
      1805,
      904,
      33,
      drawn ? C.muted : C.yellow,
      'right',
    );
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['nine-requests', 'exact-returns', 'denied-stops', 'live-generates', 'change-prefix'],
};
