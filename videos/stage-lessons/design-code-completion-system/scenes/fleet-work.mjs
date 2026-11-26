import { group, line, rect } from 'vizmatic/stage';
import {
  COHORT_EQ,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildFleetWork(s, c) {
  s.add(aura(-460, -40, 560, ROLE.gpu, COSMOS.bg));
  s.add(aura(460, 120, 540, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'FLEET SIZING FUNNEL',
      'Subtract pre-admission drops',
      'before counting uncached prefill',
      {
        x: -860,
        y: -445,
        accent: ROLE.gpu,
        size: 46,
      },
    ),
  );

  const rawT = s.value(0);
  const admitT = s.value(0);
  const prefT = s.value(0);
  const gpuT = s.value(0);

  c.on('cc-raw2000', () =>
    s.play(rawT.to(1, { duration: clampDur(c, c.cue('cc-raw2000').start, 0.5) })),
  );
  c.on('cc-admit800', () =>
    s.play(admitT.to(1, { duration: clampDur(c, c.cue('cc-admit800').start, 0.55) })),
  );
  c.on('cc-prefill1024k', () =>
    s.play(prefT.to(1, { duration: clampDur(c, c.cue('cc-prefill1024k').start, 0.55) })),
  );
  c.on('cc-gpu52', () =>
    s.play(gpuT.to(1, { duration: clampDur(c, c.cue('cc-gpu52').start, 0.55) })),
  );

  // Waterfall rows
  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const r = rawT.value;
        const a = admitT.value;
        const pf = prefT.value;
        const g = gpuT.value;
        const nodes = [];

        const xBar = -310;
        const barW = 780;

        // Row 1: Raw rate
        const y1 = -190;
        nodes.push(txt('5,000 EDITORS x 0.4 req/s', -850, y1, 26, ROLE.ed, 'mono', 'left'));
        nodes.push(glowMeter(xBar, y1, barW, 40, Math.max(0.18, r), { fill: ROLE.ed, glow: 8 }));
        nodes.push(
          txt(r > 0.5 ? '2,000 req/s RAW' : 'RAW ARRIVAL', 500, y1, 28, ROLE.ed, 'mono', 'left'),
        );

        // Row 2: Pre-admission cancellation (-60%) -> 800 admitted
        const y2 = -70;
        nodes.push(txt('MINUS 60% PRE-ADMISSION', -850, y2, 26, ROLE.ok, 'mono', 'left'));
        nodes.push(
          glowMeter(xBar, y2, barW, 48, 0.4 * Math.max(0.2, a), { fill: ROLE.ok, glow: 8 }),
        );
        if (a > 0.4) {
          // Ghost cancelled segment
          nodes.push(
            rect(barW * 0.58, 44, { fill: ROLE.fail, stroke: ROLE.fail, width: 1.5, radius: 5 })
              .at(xBar + barW * 0.41 + barW * 0.29, y2)
              .opacity(0.2 * a),
          );
          nodes.push(
            txt('-1,200 CANCELLED', xBar + barW * 0.7, y2, 26, ROLE.fail, 'mono', 'center').opacity(
              a,
            ),
          );
        }
        nodes.push(
          txt(
            a > 0.5 ? '800 req/s ADMITTED' : 'ADMITTED RATE',
            500,
            y2,
            28,
            ROLE.ok,
            'mono',
            'left',
          ),
        );

        // Row 3: Cache work fraction 0.5 * 0.25 + 0.5 = 0.625
        const y3 = 52;
        nodes.push(txt('50% HIT (-75%) + 50% MISS', -850, y3, 26, ROLE.focus, 'mono', 'left'));
        nodes.push(
          glowMeter(xBar, y3, barW, 40, 0.625 * Math.max(0.2, pf), {
            fill: ROLE.focus,
            glow: 9,
          }),
        );
        nodes.push(
          txt(
            pf > 0.5 ? '0.625 WORK FRAC' : 'CACHE FACTOR',
            500,
            y3,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
        );

        // Formula & GPU readouts
        nodes.push(line([-860, 146], [840, 146], { stroke: '#233152', width: 2 }));

        nodes.push(
          txt(
            '800 req/s  x  2,048 tok  x  0.625  =  1,024,000 prefill tok/s',
            0,
            212,
            30,
            pf > 0.5 ? COSMOS.ink : COSMOS.muted,
            'mono',
            'center',
          ).opacity(0.35 + 0.65 * pf),
        );

        nodes.push(
          metricReadout(
            'PREFILL LOAD',
            pf > 0.5 ? `${(COHORT_EQ.total / 1000).toLocaleString()}k tok/s` : '---',
            -560,
            345,
            { color: ROLE.focus, size: 44 },
          ),
        );
        nodes.push(
          metricReadout('ASSUMED RATE', '20,000 tok/GPU-s', -40, 345, {
            color: ROLE.gpu,
            size: 40,
          }),
        );
        nodes.push(
          metricReadout(
            'PREFILL GPUs',
            g > 0.5 ? `${COHORT_EQ.gpus} GPUs (ceil 51.2)` : '---',
            540,
            345,
            { color: g > 0.5 ? ROLE.ok : COSMOS.muted, size: 42 },
          ),
        );

        if (g > 0.5) {
          nodes.push(
            txt(
              'PLUS DECODE + LATE CANCELLATIONS + KV MEMORY + SPIKE HEADROOM',
              0,
              462,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(g),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
