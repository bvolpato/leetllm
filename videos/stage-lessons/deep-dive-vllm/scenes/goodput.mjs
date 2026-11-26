// Scene 20: Count successful completions that meet the latency promise (Candidate A: 1000/600/550 -> 5.50/s vs inflated 9.17/s; Candidate B: 800/780/752 -> 7.52/s vs 7.71/s over 100 s).
import {
  COSMOS,
  GOODPUT_ROWS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function goodput(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = beat-1-focus-1 / offered-receipts (offered visible)
  // 1 = successful-receipts (successful + failed/unfinished visible)
  // 2 = compliant-receipts (within both limits visible)
  // 3 = beat-2-focus-1 / divide-window (goodput = passed / 100 s -> A=5.50/s, B=7.52/s)
  // 4 = compare-candidates (highlight B wins despite fewer offers!)
  // 5 = beat-3-focus-1 (completion-only inflated estimate -> A=9.17/s WRONG!)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71a', '#60a5fa18');
  const title = heroTitle(['Count Completions That', 'Meet the Latency Promise'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'GOODPUT RECEIPTS · 100-SECOND WINDOW · CANDIDATE A VS B',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    GOODPUT_ROWS.forEach((row, idx) => {
      const cx = idx === 0 ? -440 : 440;
      const leftX = cx - 375;
      const col = idx === 0 ? ROLE.r0 : ROLE.good;
      const winHi = idx === 1 && st >= 4;

      nodes.push(
        glassCell(cx, 35, 810, 560, winHi ? ROLE.good : col, {
          fill: winHi ? '#0c2420' : '#0f1829',
          glow: winHi ? 12 : 6,
        }),
        txt(`CANDIDATE ${row.id}  (100 s WINDOW)`, leftX, -206, 28, col, 'mono', 'left'),
      );

      // Progressive bars (max width 740 scaled by 1000)
      const barW = (val) => Math.max(40, (val / 1000) * 740);

      // 1. Offered
      const wOff = barW(row.offered);
      nodes.push(
        txt(`Offered: ${row.offered}`, leftX, -152, 26, ROLE.r0, 'mono', 'left'),
        glassCell(leftX + wOff * 0.5, -110, wOff, 32, ROLE.r0, {
          fill: '#1a3866',
          glow: 4,
          radius: 6,
        }),
      );

      // 2. Successful
      if (st >= 1) {
        const wComp = barW(row.complete);
        nodes.push(
          txt(
            `Completed: ${row.complete}   (Failed/unfinished: ${row.unfinishedOrFailed})`,
            leftX,
            -58,
            26,
            ROLE.good,
            'mono',
            'left',
          ),
          glassCell(leftX + wComp * 0.5, -16, wComp, 32, ROLE.good, {
            fill: '#144d3e',
            glow: 5,
            radius: 6,
          }),
        );
      }

      // 3. Passed both SLOs
      if (st >= 2) {
        const wPass = barW(row.passed);
        nodes.push(
          txt(
            `Passed SLOs: ${row.passed}   (Late: ${row.outsideLimits})`,
            leftX,
            36,
            26,
            ROLE.kv,
            'mono',
            'left',
          ),
          glassCell(leftX + wPass * 0.5, 78, wPass, 32, ROLE.kv, {
            fill: '#164c58',
            glow: 6,
            radius: 6,
          }),
        );
      }

      // 4. True Goodput formula
      if (st >= 3) {
        nodes.push(
          glowTex(
            String.raw`\frac{${row.passed}}{100\ \text{s}} = ${row.goodput.toFixed(2)}\ \text{req/s}`,
            {
              x: cx,
              y: 162,
              size: 36,
              color: idx === 1 ? ROLE.good : COSMOS.gold,
              glow: 6,
            },
          ),
        );
      }

      // 5. Flawed completion-only formula
      if (st >= 5) {
        nodes.push(
          txt(
            `Flawed completion-only: (${row.passed}/${row.complete}) x ${row.offered / 100}/s = ${row.wrong.toFixed(2)}/s`,
            cx,
            258,
            26,
            ROLE.bad,
            'mono',
          ),
        );
      }
    });

    const caption =
      st >= 5
        ? 'Completion-only denominator drops failed requests & falsely inflates A to 9.17 req/s!'
        : st >= 4
          ? 'Candidate B delivers 7.52 useful req/s vs A’s 5.50 req/s despite fewer offers'
          : st >= 3
            ? 'Goodput = completions meeting BOTH TTFT & ITL limits divided by full 100 s window'
            : 'Keep offered requests, successful completions & SLO-compliant completions visible';

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 342, { radius: 6, color: st >= 5 ? ROLE.bad : ROLE.good }),
      txt(caption, 0, 392, 26, st >= 5 ? ROLE.bad : ROLE.good, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['goodput-beat-1-focus-1', 0],
    ['goodput-offered-receipts', 0],
    ['goodput-successful-receipts', 1],
    ['goodput-compliant-receipts', 2],
    ['goodput-beat-2-focus-1', 3],
    ['goodput-divide-window', 3, true],
    ['goodput-compare-candidates', 4],
    ['goodput-beat-3-focus-1', 5, true],
  ]);
}
