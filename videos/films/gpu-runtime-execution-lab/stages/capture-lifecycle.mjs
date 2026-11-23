import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawCaptureLifecycle(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const captured = p('capture-host') >= 1;
  const recorded = p('capture-record') >= 1;
  const replays = ['capture-first', 'capture-second', 'capture-third'].filter(
    (id) => p(id) >= 1,
  ).length;
  const counter = 10 + (captured ? 2 : 0);
  const scalar = 4 + 3 * replays;

  function value(x, label, number, color) {
    txt(label, x, 350, 45, color, 'center');
    txt(number, x, 578, 175, color, 'center');
  }
  api.focus.target('capture-python', () => {
    value(525, 'Python counter', counter, C.blue);
    txt(captured ? '10 + 2 = 12' : 'counter += 2', 525, 703, 48, C.ink, 'center');
  });
  api.focus.target('capture-gpu', () => {
    value(1395, 'GPU scalar', scalar, C.cyan);
    txt(recorded ? 'Recorded GPU operation' : 'GPU operation', 1395, 670, 33, C.muted, 'center');
    api.rect(ctx, 1205, 715, 380, 87, C.panel, recorded ? C.cyan : C.muted, 9);
    txt('add 3', 1395, 774, 47, C.ink, 'center');
  });
  if (state.beat === 2) {
    api.focus.target('capture-phases', () => {
      const phases = [
        [
          p('capture-defer') > 0 ? 'May defer preparation' : 'Prepare at capture end',
          p('capture-defer') > 0 ? 'keep_graph=True' : 'keep_graph=False',
          p('capture-default'),
        ],
        ['First launch', 'May upload the graph', p('capture-upload')],
        ['Repeat launch', 'Uses prepared graph', p('capture-setup')],
      ];
      phases.forEach(([name, detail, progress], i) => {
        const x = 366 + i * 585;
        txt(name, x, 909, 38, C.ink, 'center');
        if (progress > 0)
          api.text(ctx, detail, x, 986, 32, C.cyan, 'center', i === 0 ? 'mono' : 'sans');
      });
    });
    return;
  }
  api.focus.target('capture-launches', () => {
    const label = replays ? 'Completed launches' : 'Launches';
    txt(label, 177, 957, 39, C.ink);
    for (let i = 0; i < 3; i++) {
      const x = 660 + 388 * i;
      const done = i < replays;
      api.circle(ctx, x, 943, 15, done ? C.cyan : C.muted);
      txt(
        done ? '+3   →   ' + (4 + (i + 1) * 3) : 'Launch ' + (i + 1),
        x + 38,
        956,
        38,
        done ? C.cyan : C.muted,
      );
    }
  });
}

export default {
  id: 'capture-lifecycle',
  draw: drawCaptureLifecycle,
  cues: [
    'capture-start',
    'capture-host',
    'capture-record',
    'capture-question',
    'capture-first',
    'capture-second',
    'capture-third',
    'capture-counter',
    'capture-default',
    'capture-defer',
    'capture-upload',
    'capture-setup',
  ],
};
