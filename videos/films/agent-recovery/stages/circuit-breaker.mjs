import { breakerDisplay } from '../construction.mjs';
import { breakerRace } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawCircuitBreaker(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 8) =>
    api.teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      width: 3,
      progress,
      gap: 28,
      margin: 4,
      particle: {
        radius,
        fill: color,
      },
    });
  {
    const labels = ['Closed · requests pass', 'Open · reject calls', 'Half-open · one probe'];
    const xs = [170, 750, 1330];
    const colors = [themeColors.green, themeColors.pink, themeColors.yellow];
    const states = labels.map((label, i) =>
      api.focus.target('circuit-breaker-readout', () =>
        card(ctx, api, label, xs[i], 330, 420, colors[i], 118, 30),
      ),
    );
    route(states[0], states[1], themeColors.pink, beat === 0 ? q : 1);
    route(
      states[1],
      states[2],
      themeColors.yellow,
      beat === 1 ? api.focus.progress('half-open-probe', q) : beat === 2 ? 1 : 0,
    );
    const race = breakerRace();
    const current = breakerDisplay(beat, q, state.cues);
    if (beat === 1 && current.accepted) {
      api.path(
        ctx,
        [
          {
            x: 1540,
            y: 468,
          },
          {
            x: 1540,
            y: 485,
          },
          {
            x: 380,
            y: 485,
          },
        ],
        {
          color: themeColors.green,
          width: 3,
        },
      );
      api.arrow(ctx, 380, 485, 380, 460, themeColors.green, 3);
    }
    api.focus.target('breaker-generation', () =>
      text(
        ctx,
        api,
        `State: ${current.state.toUpperCase()} · generation ${current.generation}`,
        190,
        535,
        31,
        current.state === 'open' ? themeColors.pink : themeColors.green,
      ),
    );
    if (beat === 2) {
      const old = api.focus.target('circuit-breaker-old', () =>
        card(
          ctx,
          api,
          `Older call · gen ${race.olderGeneration}\nsuccess`,
          180,
          620,
          430,
          themeColors.blue,
          145,
          30,
        ),
      );
      const caller = api.focus.target('circuit-breaker-caller', () =>
        card(ctx, api, 'Result returned\nto its caller', 700, 620, 430, themeColors.blue, 145, 30),
      );
      const newer = api.focus.target('circuit-breaker-newer', () =>
        card(ctx, api, 'Newer failure · gen 4', 900, 785, 350, themeColors.pink, 112, 28),
      );
      const current = api.focus.target('circuit-breaker-current', () =>
        card(ctx, api, 'Breaker stays open', 1330, 785, 430, themeColors.pink, 112, 28),
      );
      route(old, caller, themeColors.blue, q);
      route(newer, current, themeColors.pink, q);
    } else {
      const label =
        beat === 0
          ? `Qualifying failures: ${current.failures} / 2`
          : current.accepted
            ? 'probe-2 · healthy receipt accepted · slot released'
            : current.occupied
              ? 'probe-2 · generation 2 · slot occupied'
              : 'Cooldown elapsed · one probe slot available';
      api.focus.target('breaker-probe-slot', () =>
        card(
          ctx,
          api,
          label,
          410,
          650,
          1100,
          beat === 0 ? themeColors.pink : current.accepted ? themeColors.green : themeColors.yellow,
          105,
          30,
        ),
      );
      api.focus.target('circuit-breaker-readout-4', () =>
        text(
          ctx,
          api,
          beat === 0
            ? 'Open after the second qualifying failure'
            : 'Success closes · failure or cancellation reopens and releases the slot',
          960,
          825,
          29,
          themeColors.ink,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'circuit-breaker',
  draw: drawCircuitBreaker,
  cues: [
    'closed-calls',
    'failure-threshold',
    'open-breaker',
    'half-open-probe',
    'healthy-probe',
    'older-success',
    'caller-result',
    'newer-generation',
  ],
};
