// Scene 8: rms: "What changes when centering is removed?"
// 2-act swapVis scene:
//   Act 1 (Beats 0-2): Feature 3 (-1) under LayerNorm (-1.342) vs RMSNorm (-0.333) before and
//     after adding +5 to all 4 features. Strictly withholds crossing until AFTER rms-crossing!
//   Act 2 (Beat 3): Amdahl's-law 100 ms step zoom (98 ms other + 2 ms norm -> 1 ms on faster-norm).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  epsilon,
  fmt,
  fmtTrim,
  glowRing,
  ln,
  lumBar,
  mean,
  playBeat,
  playCue,
  rms,
  swapVis,
  variance,
  x,
} from '../parts.mjs';

export default function rmsScene(s, c) {
  const shiftedX = x.map((v) => v + 5); // [8, 6, 4, 10]
  const lnOld = ln(x)[2]; // -1.342
  const lnNew = ln(shiftedX)[2]; // -1.342
  const rmsOld = rms(x)[2]; // -0.333
  const rmsNew = rms(shiftedX)[2]; // +0.544
  const lnScale = Math.sqrt(variance(x) + epsilon); // 2.236
  const rmsScaleOld = Math.sqrt(mean(x.map((v) => v * v)) + epsilon); // 3.000
  const rmsScaleNew = Math.sqrt(mean(shiftedX.map((v) => v * v)) + epsilon); // 7.348

  const title = heroTitle(['What changes when', 'centering is removed?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.rms,
  });

  // View guards for Act 1 vs Act 2
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 values
  const rmsRuleVis = s.value(0);
  const offsetAmt = s.value(0); // 0 -> 5 on rms-offset
  const showQuestion = s.value(0);
  const rmsCrossT = s.value(0); // 0 -> 1 strictly AFTER rms-crossing!
  const lnHoldT = s.value(0); // 0 -> 1 strictly AFTER ln-centering!

  // Act 2 values
  const normMs = s.value(2.0); // 2.0 -> 1.0 on faster-norm

  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const off = offsetAmt.value;
    const rc = rmsCrossT.value;
    const lh = lnHoldT.value;
    const vals = x.map((v) => v + off);

    // Upper-right: 4 live feature pills [3, 1, -1, 5] -> [8, 6, 4, 10]
    nodes.push(
      txt('Token features (f₃ highlighted)', -55, -395, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );
    vals.forEach((v, i) => {
      const px = 25 + i * 162;
      const isF3 = i === 2;
      nodes.push(
        lumBar(px, -315, 134, 78, {
          color: isF3 ? ROLE.gold : ROLE.write,
          fillOpacity: isF3 ? 0.36 : 0.14,
          strokeWidth: isF3 ? 3 : 2,
          glow: isF3 ? 11 : 4,
          opacity: alpha,
        }),
        txt(fmtTrim(v, 1), px, -315, 38, isF3 ? ROLE.gold : COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
      );
    });

    nodes.push(
      txt(`Mean = ${fmtTrim(mean(vals), 1)}`, 685, -315, 32, COSMOS.ink, 'mono', 'left').opacity(
        alpha,
      ),
    );
    if (off > 0.1) {
      nodes.push(
        txt(`Offset +${fmtTrim(off, 1)}`, 685, -372, 28, ROLE.amber, 'mono', 'left')
          .glow(6, ROLE.amber)
          .opacity(Math.min(1, off / 0.5) * alpha),
      );
    }

    // Center: Two parallel glowing horizontal axes sharing a tall vertical 0 meridian
    const axisLeft = -165;
    const axisRight = 640;
    const toX = (val) => axisLeft + ((val + 1.8) / 2.8) * (axisRight - axisLeft);
    const zeroX = toX(0);
    const yLN = -45;
    const yRMS = 155;

    nodes.push(
      glowingTrail(
        [
          [zeroX, -155],
          [zeroX, 235],
        ],
        { color: ROLE.gold, width: 3.4, glow: 10, core: false, opacity: 0.85 * alpha },
      ),
      txt('0', zeroX, -182, 30, ROLE.gold, 'mono', 'center').glow(6, ROLE.gold).opacity(alpha),
      txt('Feature 3 output  (γ = 1, β = 0)', -835, -178, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );

    // Track 1: LayerNorm (stays pinned at -1.342)
    const lnX = toX(lnOld + lh * (lnNew - lnOld));
    const lnExpr =
      lh > 0.3
        ? `(${fmtTrim(shiftedX[2], 0)} - ${fmtTrim(mean(shiftedX), 0)}) / ${fmt(lnScale, 3)}`
        : `(-1 - 2) / ${fmt(lnScale, 3)}`;
    nodes.push(
      txt('LayerNorm', -835, yLN - 22, 42, ROLE.norm, 'sans', 'left')
        .glow(6, ROLE.norm)
        .opacity(alpha),
      txt(lnExpr, -835, yLN + 32, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      line([axisLeft, yLN], [axisRight, yLN], { stroke: '#2c3d66', width: 2.6 }).opacity(alpha),
      glowRing(toX(lnOld), yLN, 18, ROLE.norm, {
        width: 2.6,
        glow: 8,
        fillOpacity: 0.14,
        opacity: alpha,
      }),
      glowDot(lnX, yLN, { radius: 11, color: ROLE.norm, glow: 14, opacity: alpha }),
      txt(fmt(lnOld, 3), 835, yLN, 36, ROLE.norm, 'mono', 'right')
        .glow(6, ROLE.norm)
        .opacity(alpha),
    );

    // Track 2: RMSNorm (starts at -0.333, crosses zero to +0.544 strictly AFTER rms-crossing!)
    const rmsCur = rmsOld + rc * (rmsNew - rmsOld);
    const rmsX = toX(rmsCur);
    const rmsFlipped = rc > 0.2;
    const rmsExpr = rmsFlipped
      ? `${fmtTrim(shiftedX[2], 0)} / ${fmt(rmsScaleNew, 3)}`
      : `-1 / ${fmt(rmsScaleOld, 3)}`;
    const rmsShown = rmsFlipped ? rmsNew : rmsOld;
    const rmsLabel = `${rmsShown > 0 ? '+' : ''}${fmt(rmsShown, 3)}`;
    nodes.push(
      txt('RMSNorm', -835, yRMS - 22, 42, ROLE.rms, 'sans', 'left')
        .glow(6, ROLE.rms)
        .opacity(alpha),
      txt(rmsExpr, -835, yRMS + 32, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      line([axisLeft, yRMS], [axisRight, yRMS], { stroke: '#2c3d66', width: 2.6 }).opacity(alpha),
    );
    if (rc > 0.02) {
      nodes.push(
        glowRing(toX(rmsOld), yRMS, 14, ROLE.rms, {
          width: 2.2,
          glow: 5,
          fillOpacity: 0.1,
          opacity: 0.65 * alpha,
        }),
        glowingTrail(
          [
            [toX(rmsOld), yRMS],
            [rmsX, yRMS],
          ],
          { color: ROLE.rms, width: 4.5, glow: 12, opacity: alpha },
        ),
      );
    }
    nodes.push(
      glowDot(rmsX, yRMS, { radius: 11, color: ROLE.rms, glow: 15, opacity: alpha }),
      txt(rmsLabel, 835, yRMS, 36, ROLE.rms, 'mono', 'right').glow(6, ROLE.rms).opacity(alpha),
    );

    // Bottom prompt / reveal (strictly mutually exclusive!)
    if (lh > 0.3) {
      nodes.push(
        txt(
          `4 - 7 = -3  (same centered value!)   ·   RMSNorm crossed 0 to +${fmt(rmsNew, 3)}`,
          0,
          375,
          32,
          ROLE.norm,
          'mono',
          'center',
        )
          .glow(7, ROLE.norm)
          .opacity(lh * alpha),
      );
    } else if (rc > 0.3) {
      nodes.push(
        txt(
          `RMSNorm crosses zero: positive input 4 divided by positive scale ${fmt(rmsScaleNew, 3)}`,
          0,
          375,
          32,
          ROLE.rms,
          'sans',
          'center',
        )
          .glow(7, ROLE.rms)
          .opacity(rc * alpha),
      );
    } else if (showQuestion.value > 0.1) {
      nodes.push(
        txt('Which output will cross zero?', 0, 375, 40, ROLE.gold, 'serif', 'center')
          .glow(9, ROLE.gold)
          .opacity(showQuestion.value * alpha),
      );
    }

    void rmsRuleVis.value;
    return nodes;
  });

  // MathJax RMS divisor equation shown during beat 0, hidden cleanly before question prompt
  const rmsEq = glowTex(
    's_{\\text{RMS}} = \\sqrt{\\frac{9 + 1 + 1 + 25}{4} + \\epsilon} \\approx 3.000',
    {
      x: 0,
      y: 355,
      size: 40,
      color: ROLE.rms,
    },
  );

  // ACT 2: Amdahl's-law 100 ms training step zoom (96 ms .. 100 ms)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const fast = normMs.value; // 2.0 -> 1.0

    const leftX = -510;
    const msScale = 310; // 4 ms (96..100) = 1240 px (-510 .. +730)
    const toX = (ms) => leftX + (ms - 96) * msScale;
    const x98 = toX(98);

    nodes.push(
      txt(
        'Last 4 milliseconds of a 100 ms training step',
        0,
        -225,
        36,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );

    const rows = [
      { label: 'Baseline', dur: 2.0, y: -75, col: ROLE.write, total: '100 ms' },
      {
        label: '2× faster norm',
        dur: fast,
        y: 125,
        col: ROLE.norm,
        total: `${fmt(98 + fast, 1)} ms`,
      },
    ];

    rows.forEach((row) => {
      const otherW = x98 - leftX;
      const normW = row.dur * msScale;
      nodes.push(
        txt(row.label, -830, row.y, 34, row.col, 'sans', 'left').opacity(alpha),
        lumBar(leftX + otherW / 2, row.y, otherW - 4, 72, {
          color: ROLE.stream,
          fillOpacity: 0.34,
          strokeWidth: 2.5,
          glow: 8,
          opacity: alpha,
        }),
        txt(
          'Other work (98 ms)',
          leftX + otherW / 2,
          row.y,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(x98 + normW / 2, row.y, normW - 4, 72, {
          color: row.col,
          fillOpacity: 0.48,
          strokeWidth: 2.8,
          glow: 11,
          opacity: alpha,
        }),
        txt(
          `Norm ${fmt(row.dur, 1)} ms`,
          x98 + normW / 2,
          row.y - 62,
          28,
          row.col,
          'mono',
          'center',
        )
          .glow(5, row.col)
          .opacity(alpha),
        txt(row.total, x98 + normW + 26, row.y, 32, row.col, 'mono', 'left').opacity(alpha),
      );
    });

    // Bottom ms ruler
    const rulerY = 265;
    nodes.push(
      line([leftX, rulerY], [toX(100), rulerY], { stroke: '#4c6091', width: 2.4 }).opacity(alpha),
    );
    [96, 97, 98, 99, 100].forEach((ms) => {
      const tx = toX(ms);
      nodes.push(
        line([tx, rulerY - 8], [tx, rulerY + 8], { stroke: '#6c82b8', width: 2 }).opacity(alpha),
        txt(`${ms} ms`, tx, rulerY + 38, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Halving a 2% kernel trims 1% end-to-end  ·  benchmark full step & fused kernels',
        0,
        390,
        28,
        ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.rms, ROLE.norm), title, act1Layer, act2Layer);

  // Beat 0: Show RMS divisor equation
  c.show('rms-rms-divisor-rule-b1-1', rmsEq);
  playCue(s, c, 'rms-rms-divisor-rule-b1-1', (d) => s.play(rmsRuleVis.to(1, { duration: d })), {
    dur: 0.45,
  });

  // Beat 1: Hide equation, add +5 offset, ask prediction question (withhold dot movement!)
  c.hide('rms-offset', rmsEq);
  playCue(
    s,
    c,
    'rms-offset',
    (d) => s.play(offsetAmt.to(5, { duration: d }), showQuestion.to(1, { duration: d })),
    { dur: 0.8 },
  );

  // Beat 2: Strictly AFTER rms-crossing, move RMSNorm across zero; AFTER ln-centering, confirm LN stays
  playCue(s, c, 'rms-crossing', (d) => s.play(rmsCrossT.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'ln-centering', (d) => s.play(lnHoldT.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  // Beat 3: Clean sequential swapVis to Amdahl's-law step timeline, then halve norm time on faster-norm
  playBeat(s, c, 3, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'faster-norm', (d) => s.play(normMs.to(1.0, { duration: d })), { dur: 0.85 });
}
