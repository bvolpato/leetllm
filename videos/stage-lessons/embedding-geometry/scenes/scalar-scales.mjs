// Scene 10: scalar-scales: "What does one code step buy?"
// Dual glowing 127-step calibration rulers showing why unscaled code counts flip A and B,
// and visibly restoring physical units (10/127 vs 1/127) to recover A = 8.031 vs B = 1.000.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  dotProd,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  scalarEncode,
  swapVis,
  txt,
} from '../parts.mjs';

export default function scalarScales(s, c) {
  const q = [1, 1];
  const bounds = [10, 1];
  const originals = [
    [8, 0],
    [0, 1],
  ];
  const scales = bounds.map((b) => b / 127);
  const codes = originals.map((r) => r.map((v, j) => scalarEncode(v, bounds[j])));
  const raw = codes.map((r) => dotProd(q, r)); // [102, 127]
  const fixed = codes.map((r) =>
    dotProd(
      q,
      r.map((n, j) => n * scales[j]),
    ),
  ); // [8.031, 1.000]

  const showCodes = s.value(0);
  const vWrong = s.value(0);
  const vAsk = s.value(0);
  const vRestored = s.value(0);

  const title = heroTitle(['What does one', 'code step buy?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.A,
    eyebrow: 'PER-DIMENSION SCALES',
  });

  // Top premise + dual 127-step rulers
  const rulerLayer = dynamic(() => {
    const cOp = showCodes.value;
    const rL = -360;
    const rR = 760;
    const pos = (codeVal) => rL + (codeVal / 127) * (rR - rL);
    const ys = [-165, 10];
    const ids = ['A', 'B'];
    const cols = [ROLE.A, ROLE.B];

    const nodes = [
      txt(
        'q = [1, 1]     ·     A = [8, 0]     ·     B = [0, 1]',
        855,
        -395,
        30,
        ROLE.query,
        'mono',
        'right',
      ),
    ];

    ys.forEach((ry, i) => {
      nodes.push(
        txt(`Coordinate ${i + 1}`, -845, ry - 18, 34, cols[i], 'serif', 'left').glow(5, cols[i]),
        txt(`step = ${bounds[i]} / 127`, -845, ry + 24, 28, COSMOS.muted, 'mono', 'left'),
        line([rL, ry], [rR, ry], { stroke: '#4c608e', width: 4.5 }),
        ...[0, 32, 64, 96, 127].map((tick) =>
          line([pos(tick), ry - 12], [pos(tick), ry + 12], { stroke: '#5d73a3', width: 2.5 }),
        ),
        txt('0', rL, ry + 42, 26, COSMOS.dim, 'mono'),
        txt(String(bounds[i]), rR, ry + 42, 28, cols[i], 'mono'),
      );

      if (cOp > 0.02) {
        const codeVal = codes[i][i];
        const px = pos(codeVal);
        nodes.push(
          lumBar((rL + px) / 2, ry, Math.max(10, px - rL), 14, {
            color: cols[i],
            fillAlpha: 0.42,
            strokeWidth: 2,
            glow: 8,
            opacity: cOp,
          }),
          glowDot(px, ry, { radius: 10, color: cols[i], glow: 13, opacity: cOp }),
          txt(`${ids[i]}  code ${codeVal}`, i === 1 ? px - 95 : px, ry - 42, 32, cols[i], 'mono')
            .glow(6, cols[i])
            .opacity(cOp),
        );
      }
    });

    nodes.push(rule(-850, 108, 850, 108, COSMOS.rule, 1.8).opacity(0.6));
    return group(...nodes);
  });

  // Lower comparison View 1: Unscaled code-only counts (B wrongly wins 127 > 102)
  const wrongLayer = guardedDynamic(vWrong, (a) => {
    const barL = -520;
    const wA = (raw[0] / 127) * 560;
    const wB = (raw[1] / 127) * 560;
    return group(
      txt('UNSCALED CODE COUNTS (WRONG UNITS)', -845, 165, 26, ROLE.warn, 'mono', 'left').opacity(
        a,
      ),
      txt('A', -845, 235, 34, ROLE.A, 'mono', 'left').opacity(a),
      lumBar(barL + wA / 2, 235, wA, 38, { color: ROLE.A, fillAlpha: 0.3, glow: 6, opacity: a }),
      txt(`${raw[0]} counts`, barL + wA + 26, 235, 32, ROLE.A, 'mono', 'left').opacity(a),
      txt('B', -845, 305, 34, ROLE.B, 'mono', 'left').opacity(a),
      lumBar(barL + wB / 2, 305, wB, 38, { color: ROLE.B, fillAlpha: 0.4, glow: 9, opacity: a }),
      txt(`${raw[1]} counts  (wins on counts!)`, barL + wB + 26, 305, 32, ROLE.warn, 'mono', 'left')
        .glow(6, ROLE.warn)
        .opacity(a),
    );
  });

  // Withheld prediction prompt
  const askLayer = guardedDynamic(vAsk, (a) =>
    txt(
      'Which row has the larger dot product once you restore the units?',
      0,
      412,
      36,
      ROLE.gold,
      'serif',
    )
      .glow(8, ROLE.gold)
      .opacity(a),
  );

  // Lower comparison View 2: Restored units (A = 8.031 vs B = 1.000)
  const restoredLayer = guardedDynamic(vRestored, (a) => {
    const barL = -520;
    const wA = (fixed[0] / 8.5) * 760;
    const wB = (fixed[1] / 8.5) * 760;
    return group(
      txt('RESTORED UNITS  (CODE × SCALE)', -845, 165, 26, ROLE.A, 'mono', 'left').opacity(a),
      txt('A', -845, 235, 34, ROLE.A, 'mono', 'left').opacity(a),
      lumBar(barL + wA / 2, 235, wA, 40, { color: ROLE.A, fillAlpha: 0.42, glow: 10, opacity: a }),
      txt(
        `102 × 10/127 ≈ ${fixed[0].toFixed(3)}   (A wins!)`,
        barL + wA + 24,
        235,
        32,
        ROLE.A,
        'mono',
        'left',
      )
        .glow(7, ROLE.A)
        .opacity(a),
      txt('B', -845, 305, 34, ROLE.B, 'mono', 'left').opacity(a),
      lumBar(barL + wB / 2, 305, wB, 40, { color: ROLE.B, fillAlpha: 0.34, glow: 7, opacity: a }),
      txt(
        `127 × 1/127 = ${fixed[1].toFixed(3)}`,
        barL + wB + 24,
        305,
        32,
        ROLE.B,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Full precision: A = 8, B = 1   ·   recheck reconstructed lengths for cosine',
        0,
        412,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
  });

  s.add(cinemaAtmosphere(ROLE.A, ROLE.B), title, rulerLayer, wrongLayer, askLayer, restoredLayer);

  playCue(s, c, 'codes', (d) => s.play(showCodes.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'wrong', (d) => s.play(vWrong.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'ask', (d) => s.play(vAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'restore',
    (d) => s.play(vAsk.to(0, { duration: Math.min(0.25, d) }), swapVis(vWrong, vRestored, d)),
    { after: true, dur: 0.6 },
  );
}
