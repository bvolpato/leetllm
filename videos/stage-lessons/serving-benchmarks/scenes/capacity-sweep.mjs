// Scene 17: capacity-sweep - Which offered rate would you keep?
// Full-bleed luminous 5-point Operating Frontier across [0.5, 1.0, 1.5, 2.0, 2.5] RPS with
// 95% SLO gold laser threshold, strict prediction withholding until AFTER sweep-choice,
// failing 2.0 RPS neighbor callout, and (1.5, 2.0) refinement bracket.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  glowDot,
  glowingTrail,
  guardedDynamic,
  rates,
  servingGate,
  spanBracket,
  txt,
} from '../parts.mjs';

export default function capacitySweep(s, c) {
  const evidence = s.value(0.2); // sweeps 0.2 -> 1.0 revealing all 5 columns
  const neighborHi = s.value(0); // highlights failing 2.0 RPS column
  const revealChoice = s.value(0); // strictly AFTER sweep-choice!
  const showBracket = s.value(0); // sweep-refine

  const best = servingGate(rates); // 1.5 RPS

  const header = cinemaHeader('CAPACITY LOAD SWEEP', 'Which offered rate', 'would you keep?', {
    x: -860,
    y: -450,
    accent: ROLE.qualified,
    size: 46,
  });

  const stageAura = aura(150, 0, 680, '#6ee7b71a', '#ffd16618');

  const sweepView = guardedDynamic(
    () => 1,
    () => {
      const ev = evidence.value;
      const nb = neighborHi.value;
      const sel = revealChoice.value;
      const br = showBracket.value;

      const xFirst = -410;
      const xStep = 290;
      const xOf = (rps) => xFirst + ((rps - 0.5) / 0.5) * xStep;

      const yZero = 84;
      const yFull = -182;
      const yOf = (frac) => yZero + frac * (yFull - yZero);
      const yFloor = yOf(0.95);

      const nodes = [
        // Axis labels left side
        txt('ATTAINMENT', -860, yFull + 18, 26, COSMOS.ink, 'mono', 'left'),
        txt('95% SLO', -545, yFloor, 26, ROLE.slo, 'mono', 'right').glow(5, ROLE.slo),
        txt('50%', -545, yOf(0.5), 26, COSMOS.muted, 'mono', 'right'),
        txt('0%', -545, yZero, 26, COSMOS.muted, 'mono', 'right'),

        // Horizontal reference lines
        line([-520, yZero], [830, yZero], { stroke: '#2c3d62', width: 2.2 }),
        dashedRule(-520, yOf(0.5), 830, yOf(0.5), '#253352', 0.6, 1.8),
        glowingTrail(
          [
            [-520, yFloor],
            [830, yFloor],
          ],
          { color: ROLE.slo, width: 3.4, glow: 8 },
        ),

        // Lower telemetry row labels (cleanly below header!)
        txt('OFFERED RPS', -860, -242, 26, COSMOS.muted, 'mono', 'left'),
        txt('QUAL / 200', -860, 152, 26, COSMOS.muted, 'mono', 'left'),
        txt('MAX LAG <=20', -860, 218, 26, COSMOS.muted, 'mono', 'left'),
        txt('BACKLOG', -860, 284, 26, COSMOS.muted, 'mono', 'left'),
      ];

      // Build glowing frontier curve connecting revealed points
      const curvePts = [];
      rates.forEach((row, i) => {
        const xx = xOf(row.rps);
        nodes.push(txt(row.rps.toFixed(1), xx, -242, 34, COSMOS.ink, 'mono'));

        if (ev * 5 < i + 0.35) return;
        const yy = yOf(row.attainment);
        curvePts.push([xx, yy]);

        const isBest = row.rps === best.rps;
        const isNeighbor = row.rps === 2.0;

        let col = ROLE.open;
        if (sel > 0.2 && isBest) col = ROLE.qualified;
        else if (nb > 0.2 && isNeighbor) col = ROLE.fail;

        // Vertical glowing stem from 0% up to attainment dot
        nodes.push(
          glowingTrail(
            [
              [xx, yZero],
              [xx, yy],
            ],
            {
              color: col,
              width: sel > 0.2 && isBest ? 6.5 : 3.6,
              glow: sel > 0.2 && isBest ? 12 : 5,
            },
          ),
          glowDot(xx, yy, {
            radius: sel > 0.2 && isBest ? 13 : 10,
            color: col,
            glow: sel > 0.2 && isBest ? 14 : 9,
          }),
          txt(`${Math.round(row.attainment * 200)}`, xx, 152, 30, col, 'mono'),
          txt(`${row.maxLag} ms`, xx, 218, 28, COSMOS.ink, 'mono'),
          txt(
            row.backlog,
            xx,
            284,
            28,
            nb > 0.2 && row.backlog === 'growing' ? ROLE.fail : COSMOS.ink,
            'mono',
          ),
        );
      });

      if (curvePts.length >= 2) {
        nodes.push(
          glowingTrail(curvePts, { color: ROLE.open, width: 4.0, glow: 8, opacity: 0.88 }),
        );
      }

      // Bottom band: prediction prompt -> winner reveal -> refinement bracket
      if (br > 0.1) {
        nodes.push(
          ...spanBracket(xOf(1.5), xOf(2.0), 356, 'Refinement window (1.5 .. 2.0)', ROLE.focus, {
            labelSize: 26,
            opacity: br,
          }),
          txt('HIGHEST PASSING: 1.5 RPS', -860, 378, 32, ROLE.qualified, 'mono', 'left')
            .glow(7, ROLE.qualified)
            .opacity(br),
        );
      } else if (sel > 0.1) {
        nodes.push(
          txt(
            'HIGHEST PASSING TESTED RATE: 1.5 RPS  (190/200, 11 ms lag, flat queue)',
            0,
            386,
            30,
            ROLE.qualified,
            'mono',
          )
            .glow(8, ROLE.qualified)
            .opacity(sel),
        );
      } else if (nb > 0.1) {
        nodes.push(
          txt('2.0 RPS FAILS: 160 / 200 (80%) & GROWING BACKLOG', 0, 386, 30, ROLE.fail, 'mono')
            .glow(7, ROLE.fail)
            .opacity(nb),
        );
      } else {
        nodes.push(
          txt(
            'PREDICT: Which highest tested rate clears >= 95%, lag <= 20 ms, and flat backlog?',
            0,
            386,
            28,
            ROLE.focus,
            'mono',
          ).glow(7, ROLE.focus),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, sweepView);

  c.on('sweep-evidence', () => {
    const t = c.cue('sweep-evidence').start;
    s.play(evidence.to(1, { duration: clampDur(c, t, 1.4) }));
  });
  c.on('sweep-neighbor', () => {
    const t = c.cue('sweep-neighbor').start;
    s.play(neighborHi.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('sweep-choice', () => {
    const t = c.cue('sweep-choice').end;
    s.play(revealChoice.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('sweep-refine', () => {
    const t = c.cue('sweep-refine').start;
    s.play(showBracket.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
