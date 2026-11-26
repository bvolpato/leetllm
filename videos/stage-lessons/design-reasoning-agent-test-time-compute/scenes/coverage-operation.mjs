import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  coverage,
  glowMeter,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildCoverageOperation(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.warn, COSMOS.bg));

  s.add(
    cinemaHeader(
      'COVERAGE VS CORRECTNESS',
      'Five independent attempts',
      'and the numerical floor',
      {
        x: -860,
        y: -445,
        accent: ROLE.agent,
        size: 46,
      },
    ),
  );

  const mulOn = s.value(0);
  const resOn = s.value(0);
  const trapOn = s.value(0);

  c.on('ra-coverage-operation-0-1', () =>
    s.play(mulOn.to(1, { duration: clampDur(c, c.cue('ra-coverage-operation-0-1').start, 0.55) })),
  );
  c.on('ra-coverage-operation-0-2', () =>
    s.play(resOn.to(1, { duration: clampDur(c, c.cue('ra-coverage-operation-0-2').start, 0.5) })),
  );
  c.on('ra-coverage-operation-1-2', () =>
    s.play(trapOn.to(1, { duration: clampDur(c, c.cue('ra-coverage-operation-1-2').start, 0.55) })),
  );

  const cov5 = coverage(0.3, 5); // 0.83193
  const miss5 = 0.7 ** 5; // 0.16807

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const m = mulOn.value;
        const r = resOn.value;
        const tr = trapOn.value;
        const nodes = [];

        // Top: 5 attempt boxes (0.7 miss each)
        const yRow = -170;
        nodes.push(
          txt(
            'p = 0.30 SUCCESS  ->  (1 - p) = 0.70 MISS PER ATTEMPT',
            -840,
            yRow - 62,
            26,
            ROLE.agent,
            'mono',
            'left',
          ),
        );
        for (let i = 0; i < 5; i++) {
          const x = -680 + i * 235;
          const al = i === 0 ? 1 : 0.35 + 0.65 * m;
          nodes.push(
            rect(195, 58, { fill: '#0b1224', stroke: ROLE.fail, width: 2.5, radius: 8 })
              .at(x, yRow)
              .opacity(al),
            txt(`TRY ${i + 1}: 0.7`, x, yRow, 26, ROLE.fail, 'mono', 'center').opacity(al),
          );
          if (i < 4) {
            nodes.push(txt('x', x + 118, yRow, 28, COSMOS.muted, 'mono', 'center').opacity(al));
          }
        }
        nodes.push(
          txt(`= ${miss5.toFixed(4)} ALL MISS`, 590, yRow, 28, ROLE.fail, 'mono', 'center').opacity(
            0.35 + 0.65 * m,
          ),
        );

        // Middle: Coverage complement meter
        const yBar = -20;
        nodes.push(
          txt('COMPLEMENT: 1 - (0.7)^5 = COVERAGE', -840, yBar - 52, 26, ROLE.ok, 'mono', 'left'),
          glowMeter(-840, yBar, 1180, 48, cov5 * Math.max(0.25, r), {
            fill: ROLE.ok,
            glow: 9,
          }),
          txt(
            r > 0.5 ? `${(cov5 * 100).toFixed(1)}% CONTAINS A GOOD PLAN` : 'COVERAGE...',
            375,
            yBar,
            28,
            ROLE.ok,
            'mono',
            'left',
          ),
          txt(
            'COVERAGE != RETURNED CORRECTNESS  (SELECTOR STILL MUST PICK IT; CORRELATED ERRORS BREAK INDEPENDENCE)',
            0,
            yBar + 68,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom: Numerical precision trap for tiny p = 1e-20, n = 100
        nodes.push(line([-860, 128], [840, 128], { stroke: '#233152', width: 2 }));
        const tAlpha = 0.28 + 0.72 * tr;
        nodes.push(
          txt(
            'NUMERICAL STABILITY AT p = 1e-20, n = 100',
            -840,
            190,
            26,
            ROLE.warn,
            'mono',
            'left',
          ).opacity(tAlpha),
          metricReadout('NAIVE: 1 - (1 - p)^n', 'ROUNDS TO 0', -450, 316, {
            color: ROLE.fail,
            size: 40,
            sub: '1 - 1e-20 rounds to 1.0 in float64',
          }).opacity(tAlpha),
          metricReadout('STABLE: -expm1(n * log1p(-p))', '~1.0e-18', 410, 316, {
            color: ROLE.ok,
            size: 40,
            sub: 'accurate, still vanishingly small',
          }).opacity(tAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
