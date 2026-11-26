// Scene 10: demand-sensitivity - What if each answer is twice as long?
// Animated output length doubling 450 -> 900 tokens pushes aggregate demand from 110k -> 140k tok/s
// right across the 125k tok/s capacity wall (-15k tok/s = -12% deficit!), plus benchmark checklist.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRAFFIC_BASE,
  TRAFFIC_DOUBLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function demandSensitivity(s, c) {
  const phase = s.value(0);
  const doubleOn = s.value(0); // 0 = 450 out (110k), 1 = 900 out (140k!)
  const benchOn = s.value(0);

  const header = cinemaHeader('SENSITIVITY STRESS TEST', 'What if answers are', 'twice as long?', {
    x: -860,
    y: -445,
    accent: ROLE.fail,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e618', '#f43f5e1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const db = doubleOn.value;
      const bn = benchOn.value;
      const nodes = [];

      // Shared tok/s ruler: 0 .. 160k tok/s across x = [-740 .. +740]
      const x0 = -740;
      const x1 = 740;
      const mapRate = (r) => x0 + (r / 160_000) * (x1 - x0);
      const yBar = 5;

      const outTok = Math.round(450 + db * 450); // 450 -> 900
      const curRate =
        TRAFFIC_BASE.tokensPerSecond +
        db * (TRAFFIC_DOUBLE.tokensPerSecond - TRAFFIC_BASE.tokensPerSecond); // 110k -> 140k
      const xCap = mapRate(TRAFFIC_BASE.assumedCapacity); // 125k
      const xCur = mapRate(curRate);
      const over = curRate > TRAFFIC_BASE.assumedCapacity;
      const barCol = over ? ROLE.fail : ROLE.req;

      nodes.push(
        txt(
          `4,000 req/min × (1,200 in + ${outTok} out) / 60 = ${(curRate / 1000).toFixed(0)},000 tok/s`,
          0,
          yBar - 92,
          28,
          barCol,
          'mono',
          'center',
        ),
        rect(xCur - x0, 54, { fill: barCol, stroke: '#ffffff', width: 1.5, radius: 8 })
          .at((x0 + xCur) * 0.5, yBar)
          .glow(9, barCol)
          .opacity(0.9),
        line([xCap, yBar - 64], [xCap, yBar + 64], {
          stroke: ROLE.focus,
          width: 4.5,
          dash: [10, 8],
        }).glow(10, ROLE.focus),
        txt('125k CAPACITY', xCap, yBar + 92, 26, ROLE.focus, 'mono', 'center'),
        txt(
          over ? 'SHORT BY 15,000 tok/s (-12% DEFICIT!)' : '+15,000 tok/s HEADROOM (+12%)',
          0,
          yBar + 150,
          30,
          over ? ROLE.fail : ROLE.ok,
          'mono',
          'center',
        ).glow(8, over ? ROLE.fail : ROLE.ok),
      );

      // Top-right sensitivity delta
      nodes.push(
        txt('OUTPUT DOUBLED: 450 -> 900', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          '110k -> 140k tok/s (+27% load)',
          480,
          -378,
          26,
          over ? ROLE.fail : COSMOS.ink,
          'mono',
          'center',
        ),
      );

      // Bottom benchmark evidence packet checklist
      const bAlpha = 0.4 + bn * 0.6;
      nodes.push(
        line([-840, 230], [840, 230], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'BENCHMARK PREFILL VS DECODE SEPARATELY ON REAL MIX',
          0,
          285,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(bAlpha),
        txt(
          'Pin hardware · software · model rev · precision · scheduler · warmup · answer quality',
          0,
          338,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(bAlpha),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: barCol,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('sd-demand-sensitivity-1-operation', () => {
    s.play(
      doubleOn.to(1, {
        duration: clampDur(c, c.cue('sd-demand-sensitivity-1-operation').start, 0.55),
      }),
    );
  });
  c.on('sd-demand-sensitivity-2-operation', () => {
    s.play(
      benchOn.to(1, {
        duration: clampDur(c, c.cue('sd-demand-sensitivity-2-operation').start, 0.4),
      }),
    );
  });
}
