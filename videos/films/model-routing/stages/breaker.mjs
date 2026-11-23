import { sampleModel } from '../construction.mjs';
import { progress } from '../timing.mjs';
import { text } from '../defaults.mjs';

export function drawBreaker(ctx, scene, state, api) {
  const { C, focus } = api;
  const model = sampleModel('breaker', state);
  const jitter = progress(state, 'retry-jitter', 2, 0.52, 0.76);
  if (jitter > 0) {
    const x = (ms) => 470 + ms * 5.8;
    text(ctx, api, 'Three waiting clients   ·   retry window 0–200 ms', 150, 300, 38, C.ink);
    [24, 92, 166].forEach((delay, i) => {
      const y = 456 + 145 * i;
      text(ctx, api, 'Client ' + (i + 1), 160, y + 10, 35, C.ink);
      api.line(ctx, x(0), y, x(200), y, C.muted, 3);
      // Each client draws once. Only its chosen position appears.
      const drawn = jitter >= (i + 1) / 3;
      focus.target('retry-calendar', () => {
        api.circle(ctx, x(drawn ? delay : 200), y, 15, drawn ? C.green : C.muted);
        text(
          ctx,
          api,
          drawn ? delay + ' ms' : 'waiting',
          x(drawn ? delay : 200),
          y + 57,
          30,
          drawn ? C.green : C.muted,
          'center',
        );
      });
    });
    text(
      ctx,
      api,
      'Time spent waiting comes off the request deadline',
      960,
      965,
      35,
      C.yellow,
      'center',
    );
    return;
  }
  const x = (t) => 255 + t * 102;
  focus.target('cooldown-interval', () => {
    text(ctx, api, 'Health of primary C', 160, 300, 44, C.ink);
    api.line(ctx, x(0), 490, x(14), 490, C.muted, 3);
    if (model.failuresSeen === 2) api.line(ctx, x(1), 490, x(11), 490, C.pink, 8);
    for (const t of [0, 1, 11]) {
      api.line(ctx, x(t), 474, x(t), 510, C.muted, 3);
      text(ctx, api, t + ' s', x(t), 557, 29, C.muted, 'center');
    }
    for (let i = 0; i < model.failuresSeen; i++) api.circle(ctx, x(i), 490, 13, C.pink);
    if (model.failuresSeen === 2)
      text(ctx, api, 'Cooldown', (x(1) + x(11)) / 2, 441, 34, C.pink, 'center');
  });
  focus.target('probe-permits', () => {
    text(ctx, api, 'C’s circuit', 160, 705, 35, C.muted);
    text(ctx, api, model.state, 550, 705, 52, model.state === 'closed' ? C.green : C.yellow);
    if (state.beat >= 1) {
      text(ctx, api, 'Single probe', 160, 822, 35, C.muted);
      text(
        ctx,
        api,
        model.state === 'closed'
          ? 'P1 succeeded'
          : model.first
            ? 'Held by P1'
            : 'Available at 11 s',
        550,
        822,
        42,
        model.first ? C.cyan : C.ink,
      );
    }
    if (model.healthRoutes) {
      model.healthRoutes.forEach(({ lane, allowed }, i) => {
        const x = 250 + i * 545;
        focus.target('health-routes', () => {
          api.circle(ctx, x, 832, 13, allowed ? C.green : C.pink);
          text(
            ctx,
            api,
            lane + (allowed ? '   Eligible' : '   Open'),
            x + 40,
            846,
            40,
            allowed ? C.green : C.pink,
          );
        });
      });
    }
    const outcome =
      state.beat === 0
        ? model.state === 'open'
          ? 'Normal arrivals skip C and try the next compatible lane'
          : 'Count timeouts for this target'
        : model.second === false
          ? 'P2 skips C and checks the next compatible lane'
          : model.first
            ? 'P2 arrives while P1 is probing. Can P2 call C?'
            : 'Cooldown ends at 11 s';
    text(ctx, api, outcome, 960, 978, 36, model.second === false ? C.cyan : C.ink, 'center');
  });
}
export default {
  id: 'breaker',
  draw: drawBreaker,
  cues: [
    'health-failures',
    'two-open',
    'probe-lease',
    'deny-second',
    'close-breaker',
    'retry-jitter',
  ],
};
