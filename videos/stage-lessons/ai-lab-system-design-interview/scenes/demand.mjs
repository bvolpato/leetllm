// Scene 09: demand - Turn request mix into a planning rate
// Unit-cancelling dimensional flow: 4,000 req/min * (1,200 + 450) tok/req / 60 = 110,000 tok/s
// vs 125,000 tok/s assumed fleet capacity -> 15,000 tok/s (12%) headroom.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRAFFIC_BASE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowMeter,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function demand(s, c) {
  const phase = s.value(0);
  const headOn = s.value(0);

  const header = cinemaHeader(
    'CAPACITY PLANNING RATE',
    'Turn request mix into',
    'tokens per second',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');
  const eq = glowTex(
    '\\frac{4{,}000\\,\\text{req/min} \\times (1{,}200 + 450)\\,\\text{tok/req}}{60\\,\\text{s/min}} = 110{,}000\\,\\text{tok/s}',
    { size: 32, color: ROLE.focus, glow: 8 },
  ).at(80, -145);

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const hd = headOn.value;
      const nodes = [];

      // Demand vs Assumed Fleet Capacity Meter
      const x0 = -740;
      const wBar = 1480;
      const frac = TRAFFIC_BASE.tokensPerSecond / TRAFFIC_BASE.assumedCapacity; // 110k / 125k = 0.88

      nodes.push(
        txt(
          `AGGREGATE DEMAND: ${(TRAFFIC_BASE.tokensPerSecond / 1000).toFixed(0)},000 tok/s  VS  ASSUMED CAPACITY: ${(TRAFFIC_BASE.assumedCapacity / 1000).toFixed(0)},000 tok/s`,
          0,
          -15,
          28,
          ROLE.req,
          'mono',
          'center',
        ),
        glowMeter(x0, 50, wBar, 42, frac, { fill: ROLE.req, glow: 9 }),
        txt('110,000 tok/s (88% LOAD)', -120, 122, 28, ROLE.req, 'mono', 'center'),
        txt(
          `HEADROOM: ${(TRAFFIC_BASE.headroom / 1000).toFixed(0)},000 tok/s (${Math.round(TRAFFIC_BASE.headroomFraction * 100)}%)`,
          540,
          122,
          28,
          hd > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'center',
        ).glow(hd > 0.4 ? 8 : 0, ROLE.warn),
      );

      // Component mix readout (kept visible for sensitivity recalculation!)
      nodes.push(
        txt('COMPONENT MIX', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('4,000 req/min · 1,200 in · 450 out', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        line([-840, 225], [840, 225], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          hd > 0.4
            ? 'Only 12% headroom remains. What happens if users ask for longer answers?'
            : 'Keep arrival rate, input length & output length separate for rapid recalculation',
          0,
          298,
          30,
          hd > 0.4 ? ROLE.focus : COSMOS.muted,
          'serif',
          'center',
        ).glow(hd > 0.4 ? 6 : 0, ROLE.focus),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.req,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, eq, view);
  driftValue(s, c, phase, 4.0);

  c.on('demand-beat-2-focus-1', () => {
    s.play(headOn.to(1, { duration: clampDur(c, c.cue('demand-beat-2-focus-1').start, 0.4) }));
  });
}
