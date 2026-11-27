// Scene 9: norm-backward: "Differentiate one token"
// 2-act swapVis luminous dataflow cascade:
//   Act 1 (Beat 0): 4 vertical feature channels flowing through gain -> center -> scale-correct -> divide.
//   Act 2 (Beat 1): Two tokens sharing affine shift & gain, summing down columns strictly AFTER
//     shared-shift-sum and shared-gain-sum cues.
import { arrow, line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  backwardTrace,
  cinemaAtmosphere,
  fmt,
  lumBar,
  mean,
  playBeat,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function normBackward(s, c) {
  const trace = backwardTrace();
  const g1 = [1, 2, 0, -1];
  const g2 = [0.5, -0.5, 1, 0];
  const db = g1.map((v, i) => v + g2[i]); // [1.5, 1.5, 1.0, -1.0]
  const dg = db.map((v, i) => v * trace.standardized[i]); // [0.671, -0.671, -1.342, -1.342]

  const title = heroTitle(['Differentiate', 'one token'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.write,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 progressive reveal stages (0..3)
  const stageLevel = s.value(0); // 0=u, 1=centered, 2=corrected, 3=dx
  // Act 2 shared accumulation reveals (strictly withheld as '?' until cues!)
  const shiftSumVis = s.value(0);
  const gainSumVis = s.value(0);

  const colXs = [-160, 115, 390, 665];

  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const lvl = stageLevel.value;

    nodes.push(
      txt(
        'Token [3, 1, -1, 5]   ·   upstream g = [1, 2, 0, -1]   ·   γ = 1',
        845,
        -395,
        28,
        COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
    );

    // Column headers
    colXs.forEach((cx, j) => {
      nodes.push(txt(`f${j + 1}`, cx, -265, 28, COSMOS.muted, 'mono', 'center').opacity(alpha));
    });

    const rows = [
      { label: '1. upstream × gain', vals: trace.u, col: ROLE.write, threshold: -0.1 },
      { label: '2. subtract mean(u)', vals: trace.centered, col: ROLE.gold, threshold: 0.45 },
      { label: '3. adjust radial term', vals: trace.corrected, col: ROLE.rms, threshold: 1.45 },
      { label: '4. divide by scale s', vals: trace.dx, col: ROLE.norm, threshold: 2.45 },
    ];

    rows.forEach((row, i) => {
      const ry = -185 + i * 150;
      const vis = Math.max(0, Math.min(1, (lvl - row.threshold) * 2.2));
      if (vis < 0.02) return;

      nodes.push(
        txt(row.label, -830, ry, 30, row.col, 'sans', 'left')
          .glow(5, row.col)
          .opacity(vis * alpha),
      );

      row.vals.forEach((v, j) => {
        const cx = colXs[j];
        if (i > 0) {
          nodes.push(
            arrow([cx, ry - 98], [cx, ry - 48], {
              stroke: row.col,
              width: 3,
              tip: 11,
            }).opacity(vis * alpha),
          );
        }
        nodes.push(
          lumBar(cx, ry, 210, 76, {
            color: row.col,
            fillOpacity: 0.24,
            strokeWidth: 2.5,
            glow: 9,
            opacity: vis * alpha,
          }),
          txt(fmt(v, 3), cx, ry, 34, COSMOS.ink, 'mono', 'center').opacity(vis * alpha),
        );
      });
    });

    // Bottom live scalar summary
    nodes.push(
      txt(
        `mean(u) = ${fmt(mean(trace.u), 3)}   ·   mean(u·x̂) = ${fmt(trace.component, 3)}   ·   s = ${fmt(trace.divisor, 3)}   ·   Σ dx = 0`,
        0,
        395,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const sShift = shiftSumVis.value;
    const sGain = gainSumVis.value;

    nodes.push(
      txt(
        'Shared affine weights sum contributions down each feature column',
        845,
        -395,
        28,
        COSMOS.muted,
        'sans',
        'right',
      ).opacity(alpha),
    );

    colXs.forEach((cx, j) => {
      nodes.push(
        txt(
          `f${j + 1}`,
          cx,
          -265,
          28,
          j === 0 ? ROLE.gold : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    const rows = [
      { label: 'Token 1 upstream g₁', vals: g1, col: ROLE.write, show: 1 },
      { label: 'Token 2 upstream g₂', vals: g2, col: ROLE.stream, show: 1 },
      { label: 'Shift grad  dβ = Σ g', vals: db, col: ROLE.gold, show: sShift },
      { label: 'Gain grad  dγ = Σ g·x̂', vals: dg, col: ROLE.norm, show: sGain },
    ];

    // Summation rule bar between inputs and gradients
    nodes.push(
      line([colXs[0] - 110, 42], [colXs[3] + 110, 42], { stroke: '#5c72a6', width: 2.6 }).opacity(
        alpha,
      ),
    );

    rows.forEach((row, i) => {
      const ry = -185 + i * 150 + (i >= 2 ? 22 : 0);
      nodes.push(
        txt(row.label, -830, ry, 30, row.col, 'sans', 'left')
          .glow(row.show > 0.5 ? 5 : 0, row.col)
          .opacity(alpha),
      );

      row.vals.forEach((v, j) => {
        const cx = colXs[j];
        const isFocusCol = j === 0 && i >= 2;
        const textVal = row.show > 0.3 ? fmt(v, 3) : '?';
        nodes.push(
          lumBar(cx, ry, 210, 74, {
            color: row.col,
            fillOpacity: isFocusCol && row.show > 0.3 ? 0.38 : 0.18,
            strokeWidth: isFocusCol && row.show > 0.3 ? 3 : 2,
            glow: isFocusCol && row.show > 0.3 ? 11 : 5,
            opacity: alpha,
          }),
          txt(textVal, cx, ry, 34, row.show > 0.3 ? COSMOS.ink : row.col, 'mono', 'center').opacity(
            alpha,
          ),
        );
      });
    });

    nodes.push(
      txt(
        'Token 2 = [4, 2, 0, 6] shares the same standardized x̂   ·   ε leaves slight scale sensitivity',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.write, ROLE.norm), title, act1Layer, act2Layer);

  // Beat 0: Reveal the 4 single-token backward steps sequentially
  playCue(s, c, 'backward-center', (d) => s.play(stageLevel.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'backward-correct', (d) => s.play(stageLevel.to(2, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'backward-divide', (d) => s.play(stageLevel.to(3, { duration: d })), { dur: 0.6 });

  // Beat 1: Sequential swapVis to 2-token shared parameter sum, revealing sums strictly AFTER cues
  playBeat(s, c, 1, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'shared-shift-sum', (d) => s.play(shiftSumVis.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'shared-gain-sum', (d) => s.play(gainSumVis.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
