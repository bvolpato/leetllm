import { cueAmount, cueDone } from '../defaults.mjs';
import { nextAction } from '../model.mjs';

export function drawReactLoop(ctx, scene, state, api) {
  const { C } = api;
  api.text(ctx, 'Same request', 150, 305, 31, C.muted);
  api.text(ctx, 'Returned observation', 745, 305, 31, C.muted);
  api.text(ctx, 'Next lookup', 1335, 305, 31, C.muted);
  const draws = [
    {
      key: 'open-run',
      y: 445,
      status: 'open',
      label: 'Open 13:00 to 18:00',
      read: true,
      progress: cueAmount(state, 'loop-route'),
    },
    {
      key: 'closed-run',
      y: 715,
      status: 'closed',
      label: 'Closed all day',
      read: cueDone(state, 'loop-closed'),
      progress: cueAmount(state, 'loop-alternative'),
    },
  ];
  for (const [i, run] of draws.entries()) {
    if (i && !cueAmount(state, 'loop-other')) continue;
    api.focus.target(run.key, () => {
      const { y } = run;
      const color = i ? C.pink : C.cyan;
      api.text(ctx, 'History hours', 150, y, 44, C.ink);
      api.text(ctx, 'today', 150, y + 58, 30, C.muted);
      api.arrow(ctx, 487, y - 14, 678, y - 14, C.muted, 4);
      api.text(
        ctx,
        run.read ? run.label : 'Awaiting reply',
        745,
        y,
        39,
        run.read ? color : C.muted,
      );
      if (run.progress > 0) {
        api.line(ctx, 1160, y - 14, 1160 + 135 * run.progress, y - 14, color, 7);
        if (run.progress === 1) {
          const action = nextAction([{ kind: 'hours', status: run.status }]);
          api.text(
            ctx,
            action === 'find-alternative' ? 'Another venue' : 'Journey to History',
            1335,
            y,
            40,
            C.ink,
          );
        }
      }
    });
  }
  api.focus.target('next-choice', () => {
    if (cueAmount(state, 'loop-question') > 0 && !cueDone(state, 'loop-alternative'))
      api.text(
        ctx,
        'Spend the next lookup on a train to History?',
        960,
        933,
        41,
        C.yellow,
        'center',
      );
    if (cueAmount(state, 'loop-main') > 0)
      api.text(ctx, 'Our visit continues with the open museum.', 960, 933, 37, C.cyan, 'center');
  });
}
export default {
  id: 'react-loop',
  draw: drawReactLoop,
  cues: [
    'loop-open',
    'loop-route',
    'loop-other',
    'loop-closed',
    'loop-question',
    'loop-alternative',
    'loop-main',
  ],
};
