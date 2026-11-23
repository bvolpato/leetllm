import { waitingJoinTrace } from '../arithmetic.mjs';
import {
  cell,
  cueProgress,
  evidenceReceipt,
  line,
  rectangle,
  requestIdentity,
  text,
} from '../defaults.mjs';
export function drawSuperstepJoin(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    requestIdentity(ctx, api);
    if (currentBeat === 0) {
      const stage = Math.min(2, Math.floor(q(0) * 3));
      ['plan', 'execute', 'apply updates'].forEach((v, i) => {
        const x = 180 + i * 555;
        cell(ctx, api, v, x, 385, 450, i === stage ? themeColors.yellow : themeColors.muted);
        if (i < 2) line(ctx, api, x + 465, 435, x + 535, 435, themeColors.muted, 4);
      });
      cell(ctx, api, 'channel before step: receipts=[]', 280, 600, 1360, themeColors.blue);
      if (stage >= 1) {
        evidenceReceipt(ctx, api, 'Eval', 180, 795, 450);
        evidenceReceipt(ctx, api, 'Health', 735, 795, 450);
        evidenceReceipt(ctx, api, 'Policy', 1290, 795, 450);
      }
      text(
        ctx,
        api,
        stage < 2
          ? 'Returned updates wait for the step boundary'
          : 'next superstep sees[Eval,Health,Policy]',
        960,
        1010,
        34,
        stage < 2 ? themeColors.yellow : themeColors.green,
        'center',
      );
    } else if (currentBeat === 1) {
      const phase = cueProgress(ctx, api, 'reducer-lists', q(1, 0.5, 0.65)) > 0;
      if (!phase) {
        cell(ctx, api, 'Eval writes status=ready', 180, 405, 600, themeColors.blue);
        cell(ctx, api, 'Health writes status=ready', 1140, 405, 600, themeColors.pink);
        line(ctx, api, 800, 455, 1120, 455, themeColors.yellow, 5);
        cell(ctx, api, 'one unreduced scalar channel', 500, 620, 920, themeColors.yellow);
        if (cueProgress(ctx, api, 'scalar-update-error', q(1, 0.15, 0.3)) > 0)
          text(
            ctx,
            api,
            'invalid-concurrent-graph-update',
            960,
            890,
            45,
            themeColors.pink,
            'center',
          );
      } else {
        cell(ctx, api, 'arrival order E,H,E', 180, 400, 650, themeColors.blue);
        cell(ctx, api, 'list reducer[E,H,E]', 1090, 400, 650, themeColors.yellow);
        cell(ctx, api, 'arrival order H,E,E', 180, 650, 650, themeColors.pink);
        cell(ctx, api, 'list reducer[H,E,E]', 1090, 650, 650, themeColors.yellow);
        line(ctx, api, 850, 450, 1070, 450, themeColors.muted, 3);
        line(ctx, api, 850, 700, 1070, 700, themeColors.muted, 3);
        text(
          ctx,
          api,
          'Both retain duplicate E; concatenation preserves ordering differences',
          960,
          950,
          32,
          themeColors.pink,
          'center',
        );
      }
    } else if (currentBeat === 2) {
      const elapsed = q(2) * 4.4,
        trace = waitingJoinTrace(elapsed),
        scale = 300,
        map = (t) => 400 + t * 300;
      text(
        ctx,
        api,
        'Illustrative step clock · compare uneven-branch join contracts',
        960,
        360,
        35,
        themeColors.yellow,
        'center',
      );
      [
        ['Eval', 0, 2, themeColors.blue],
        ['Policy', 0, 1, themeColors.green],
        ['Health prep', 0, 1, themeColors.pink],
        ['Health', 1, 4, themeColors.pink],
      ].forEach(([name, a, z, col], i) => {
        const y = 445 + i * 105;
        text(ctx, api, name, 340, y + 30, 28, col, 'right');
        rectangle(ctx, api, map(a), y, (z - a) * 300, 45, themeColors.muted);
        if (elapsed > a)
          rectangle(ctx, api, map(a), y, Math.min(elapsed - a, z - a) * 300, 45, col, col);
        text(ctx, api, 'end ' + z + 's', 1780, y + 31, 26, col, 'right');
      });
      line(
        ctx,
        api,
        map(Math.min(elapsed, 4)),
        420,
        map(Math.min(elapsed, 4)),
        845,
        themeColors.yellow,
        3,
      );
      text(
        ctx,
        api,
        'three separate edges: ' +
          (trace.separateMerges.length
            ? trace.separateMerges.map((t) => 'merge@' + t + 's').join(', ')
            : 'waiting'),
        960,
        930,
        34,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        'one waiting edge[Eval,Health,Policy]: ' +
          (trace.waitingMerges.length ? 'one merge@4s' : 'wait for all selected terminals'),
        960,
        1020,
        31,
        themeColors.green,
        'center',
      );
    } else {
      const changed = q(3) > 0.5;
      text(ctx, api, 'shallow read-only proxy', 500, 390, 35, themeColors.blue, 'center');
      cell(ctx, api, 'outer mapping: cannot replace receipts', 180, 450, 640, themeColors.blue);
      cell(
        ctx,
        api,
        'nested receipts list: ' + (changed ? '[E,H,foreign]' : '[E,H]'),
        180,
        650,
        640,
        changed ? themeColors.pink : themeColors.yellow,
      );
      text(ctx, api, 'worker mutates nested list', 500, 875, 32, themeColors.pink, 'center');
      text(ctx, api, 'deep-copied fixture input', 1420, 390, 35, themeColors.green, 'center');
      cell(ctx, api, 'worker copy[E,H,foreign]', 1100, 450, 640, themeColors.yellow);
      cell(ctx, api, 'owner remains[E,H]', 1100, 650, 640, themeColors.green);
      text(
        ctx,
        api,
        'Neither construct is a hostile-code sandbox',
        960,
        1020,
        35,
        themeColors.pink,
        'center',
      );
    }
  };
  api.focus.target('superstep-join-construction', body);
}
export default {
  id: 'superstep-join',
  draw: drawSuperstepJoin,
  cues: [
    'superstep-join-construct-0',
    'superstep-join-construct-1',
    'scalar-update-error',
    'reducer-lists',
    'superstep-join-construct-2',
    'superstep-join-construct-3',
  ],
};
