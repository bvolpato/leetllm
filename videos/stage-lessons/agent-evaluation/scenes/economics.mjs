// Scene 7: economics - What did each success cost?
// Mode 0 (Beat 0): All 9 incurred run costs (`R1..R9`, including failed tall rose R5 = 4c
// and R9 = 2.5c), accumulating 20.3c / 7 successes = 2.9c per success (revealed strictly
// after `cost-quotient` via MathJax `glowTex`).
// Mode 1 (Beats 1-2): Ascending latency stair-curve of the exact same 9 run IDs against a
// 6.0s SLA deadline, revealing nearest-rank p95 = 9th = 8.0s strictly after `sample-quantile`.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ECONOMIC_RUNS,
  ECON_REPORT,
  ORDERED_DURATIONS,
  P95_RANK,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function economics(s, c) {
  const pulse = s.value(0);
  const costsOn = s.value(0);
  const failedHi = s.value(0);
  const denomOn = s.value(0);
  const cpstOn = s.value(0);

  const latencyMode = s.value(0);
  const sortedOn = s.value(0);
  const p95On = s.value(0);
  const accNote = s.value(0);

  const header = cinemaHeader('EVALUATION ECONOMICS', 'What did each', 'success cost?', {
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(100, 40, 660, '#ffd16618', '#ff6b8b14');

  const cpstEq = glowTex(String.raw`\text{CPST} = \frac{20.3\text{¢}}{7} = 2.9\text{¢}`, {
    x: 535,
    y: 220,
    size: 42,
    color: ROLE.pass,
    glow: 9,
  });

  const p95Eq = glowTex(
    String.raw`\lceil 0.95 \times 9 \rceil = 9 \;\Rightarrow\; p_{95} = 8.0\text{s}`,
    { x: 465, y: -265, size: 38, color: ROLE.focus, glow: 9 },
  );

  // Mode 0: Incurred spend bar chart for all 9 runs + live CPST accounting
  const mode0 = guardedDynamic(
    () => fadeOutHalf(latencyMode.value),
    (a) => {
      const co = costsOn.value;
      const fh = failedHi.value;
      const dn = denomOn.value;
      const cp = cpstOn.value;
      const nodes = [];

      const baseLineY = 235;
      const maxH = 320;
      const maxCost = 0.045;
      const xStart = -790;
      const gap = 104;

      // Baseline axis
      nodes.push(
        line([-840, baseLineY], [125, baseLineY], { stroke: '#334672', width: 2.5 }).opacity(a),
        txt(
          'INCURRED COST PER RUN (ALL 9 RUNS)',
          -840,
          -180,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      ECONOMIC_RUNS.forEach((run, i) => {
        const cx = xStart + i * gap;
        const h = (run.cost / maxCost) * maxH;
        const isFail = !run.pass;
        const isR5 = run.id === 'R5';
        const col = isFail ? ROLE.fail : ROLE.pass;
        const barAlpha = a * (isFail && fh > 0.3 ? 1 : 0.85);
        const bar = rect(64, h, {
          fill: col,
          stroke: isR5 && fh > 0.3 ? ROLE.focus : '#ffffff22',
          width: isR5 && fh > 0.3 ? 3 : 1,
          radius: 6,
        })
          .at(cx, baseLineY - h * 0.5)
          .opacity(barAlpha);
        if ((isFail && fh > 0.3) || (run.pass && dn > 0.3)) {
          bar.glow(isR5 && fh > 0.3 ? 13 : 8, col);
        }
        nodes.push(
          bar,
          txt(
            `${(run.cost * 100).toFixed(1)}¢`,
            cx,
            baseLineY - h - 26,
            26,
            isFail ? ROLE.fail : COSMOS.ink,
            'mono',
            'center',
          ).opacity(a),
          txt(run.id, cx, baseLineY + 36, 26, COSMOS.muted, 'mono', 'center').opacity(a),
          txt(isFail ? 'FAIL' : 'OK', cx, baseLineY + 72, 26, col, 'mono', 'center').opacity(
            a * (0.45 + 0.55 * Math.max(co, dn)),
          ),
        );
      });

      // Right side accounting summary (zero card chrome)
      nodes.push(
        line([190, -165], [190, 295], { stroke: '#29385f', width: 2 }).opacity(a),
        txt('NUMERATOR: ALL 9 CHARGES', 230, -145, 26, ROLE.focus, 'mono', 'left').opacity(a),
        txt(
          `Total spend = ${(ECON_REPORT.total * 100).toFixed(1)}¢`,
          230,
          -90,
          36,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Includes failed R5 (4.0¢) + R9 (2.5¢)',
          230,
          -36,
          26,
          fh > 0.3 ? ROLE.fail : COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt('DENOMINATOR: PASSING RUNS', 230, 32, 26, ROLE.pass, 'mono', 'left').opacity(
          a * (0.4 + 0.6 * dn),
        ),
        txt(
          dn > 0.25 ? `${ECON_REPORT.passes} successful runs` : 'Count passing runs...',
          230,
          82,
          32,
          dn > 0.25 ? ROLE.pass : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
      );

      nodes.push(
        txt(
          cp > 0.35
            ? 'CPST = 2.9¢ PER SUCCESS  (retries & long prompts push spend up)'
            : 'Keep every failed run in the numerator, divide by successful runs',
          0,
          395,
          28,
          cp > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Sorted elapsed durations + 6s SLA + nearest-rank p95
  const mode1 = guardedDynamic(
    () => fadeInHalf(latencyMode.value),
    (a) => {
      const so = sortedOn.value;
      const p95 = p95On.value;
      const an = accNote.value;
      const nodes = [];

      const x0 = -780;
      const xStep = 190;
      const baseY = 230;
      const topY = -125;
      const maxSec = 8.5;
      const yAt = (sec) => baseY - (sec / maxSec) * (baseY - topY);

      // Axes & 6s SLA dashed threshold
      const slaY = yAt(6);
      nodes.push(
        txt(
          'SORTED RUN DURATIONS (SAME 9 RUN IDs)',
          -840,
          -185,
          26,
          ROLE.read,
          'mono',
          'left',
        ).opacity(a),
        line([-840, baseY], [855, baseY], { stroke: '#334672', width: 2.5 }).opacity(a),
        line([-840, slaY], [855, slaY], { stroke: ROLE.fail, width: 2.6, dash: [10, 8] })
          .glow(7, ROLE.fail)
          .opacity(a * 0.9),
        txt('6.0s SLA DEADLINE', -830, slaY - 26, 26, ROLE.fail, 'mono', 'left').opacity(a),
      );

      // Glowing polyline curve connecting ascending durations
      const pts = ORDERED_DURATIONS.map((run, i) => [x0 + i * xStep, yAt(run.seconds)]);
      if (so > 0.05) {
        nodes.push(
          glowingTrail(pts, {
            color: ROLE.read,
            width: 3.6,
            glow: 9,
            opacity: a * so,
          }),
        );
      }

      ORDERED_DURATIONS.forEach((run, i) => {
        const [px, py] = pts[i];
        const isP95 = i === P95_RANK - 1;
        const overSla = run.seconds > 6;
        const dotCol = isP95 && p95 > 0.35 ? ROLE.focus : overSla ? ROLE.fail : ROLE.read;

        nodes.push(
          line([px, baseY], [px, py], {
            stroke: dotCol,
            width: isP95 && p95 > 0.35 ? 4 : 2.2,
          }).opacity(a * 0.55),
          glowDot(px, py, {
            radius: isP95 && p95 > 0.35 ? 11 : 7.5,
            color: dotCol,
            glow: isP95 && p95 > 0.35 ? 14 : 8,
            opacity: a,
          }),
          txt(
            `${run.seconds}s`,
            run.seconds === 5 ? px + 22 : px,
            run.seconds === 5 ? py + 16 : py - 32,
            26,
            dotCol,
            'mono',
            run.seconds === 5 ? 'left' : 'center',
          ).opacity(a),
          txt(run.id, px, baseY + 34, 26, COSMOS.ink, 'mono', 'center').opacity(a),
          txt(
            `#${i + 1}`,
            px,
            baseY + 70,
            26,
            isP95 && p95 > 0.35 ? ROLE.focus : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a),
        );
      });

      // Dynamic denominator & crash accounting note
      const bottomMsg =
        an > 0.35
          ? 'Keep crashes in spend · denominator = 7 successful runs (not 3 task names)'
          : p95 > 0.35
            ? 'RANK 9 (R9) = 8.0s  ->  EXCEEDS 6.0s DEADLINE EVEN IF COMPLETED'
            : 'Order all 9 elapsed durations to compute nearest-rank p95';
      nodes.push(
        txt(
          bottomMsg,
          0,
          395,
          28,
          an > 0.35 ? ROLE.read : p95 > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(p95 > 0.35 && an < 0.35 ? 8 : 0, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('add-costs', () => {
    s.play(costsOn.to(1, { duration: clampDur(c, c.cue('add-costs').start, 0.4) }));
  });
  c.on('failed-cost', () => {
    s.play(failedHi.to(1, { duration: clampDur(c, c.cue('failed-cost').start, 0.35) }));
  });
  c.on('successful-denominator', () => {
    s.play(denomOn.to(1, { duration: clampDur(c, c.cue('successful-denominator').start, 0.35) }));
  });
  c.show('cost-quotient', cpstEq, { after: true });
  c.after('cost-quotient', () => {
    s.play(cpstOn.to(1, { duration: clampDur(c, c.cue('cost-quotient').end, 0.3) }));
  });

  // Transition to Beat 1 latency curve, hiding Beat 0 MathJax first
  c.hide(1, cpstEq);
  c.onBeat(1, () => {
    s.play(latencyMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.65) }));
  });
  c.on('place-durations', () => {
    s.play(sortedOn.to(1, { duration: clampDur(c, c.cue('place-durations').start, 0.45) }));
  });
  c.show('sample-quantile', p95Eq, { after: true });
  c.after('sample-quantile', () => {
    s.play(p95On.to(1, { duration: clampDur(c, c.cue('sample-quantile').end, 0.3) }));
  });
  c.on('incurred-accounting', () => {
    s.play(accNote.to(1, { duration: clampDur(c, c.cue('incurred-accounting').start, 0.4) }));
  });
}
