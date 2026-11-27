// Scene 14: normalization-transfer: "Which input belongs at the head?"
// Finale diagnostic workbench closing the loop from Scene 1: tests a GPT-2-style port with two
// residual vectors [2,4,6,8] and [7,9,11,13] against pinned checkpoint logit (-1.342). Strictly
// withholds "Final LayerNorm" until AFTER fit-final-norm, centers and scales both rows onto the
// exact reference, contrasts with RMSNorm on try-rms, and restores LayerNorm on restore-head.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
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
  ln,
  lumBar,
  mean,
  normalizationTransfer,
  playCue,
  rms,
  variance,
} from '../parts.mjs';

export default function normalizationTransferScene(s, c) {
  const data = normalizationTransfer(5); // input=[2,4,6,8], shifted=[7,9,11,13]
  const refLogit = data.ln[0]; // -1.342
  const lnScale = Math.sqrt(variance(data.input) + epsilon); // 2.236

  const title = heroTitle(['Which input belongs', 'at the head?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.norm,
  });

  // Reactive state values
  const row2Vis = s.value(0); // 0 -> 1 reveals offset row [7, 9, 11, 13] on transfer-offset
  const modeCode = s.value(0); // 0 = raw wire, 1 = Final LayerNorm, 2 = Final RMSNorm
  const centerT = s.value(0); // 0 -> 1 subtracts row means -> both f1 land on -3
  const divideT = s.value(0); // 0 -> 1 divides by sqrt(5+eps) -> both f1 land on -1.342
  const connectT = s.value(0); // 0 -> 1 routes matched logit to Port column AFTER head-compare
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const r2 = row2Vis.value;
    const mc = modeCode.value;
    const ct = centerT.value;
    const dt = divideT.value;
    const conn = connectT.value;

    const mode = mc > 1.5 ? 'rms' : mc > 0.5 ? 'ln' : 'raw';
    const opName =
      mode === 'raw' ? 'Direct wire' : mode === 'ln' ? 'Final LayerNorm' : 'Final RMSNorm';
    const opCol = mode === 'raw' ? ROLE.stream : mode === 'ln' ? ROLE.norm : ROLE.rms;

    // Top-right rule metadata
    nodes.push(
      txt(
        'Probe head: logit = feature 1   ·   γ = 1, β = 0, ε = 10⁻⁵',
        845,
        -395,
        26,
        COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
    );

    // Column headers
    nodes.push(
      txt('Final residual', -625, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(opName, -25, -245, 32, opCol, 'mono', 'center').glow(6, opCol).opacity(alpha),
      txt('Port logit', 455, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Checkpoint', 725, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    const rows = [
      { label: 'Original', vec: data.input, y: -95, vis: 1 },
      { label: 'Offset +5', vec: data.shifted, y: 155, vis: r2 },
    ];

    rows.forEach((row, idx) => {
      if (row.vis < 0.04) return;
      const a = row.vis * alpha;
      const y = row.y;

      // Left: 4-feature vector cells (f1 highlighted gold)
      nodes.push(txt(row.label, -830, y - 62, 26, COSMOS.muted, 'mono', 'left').opacity(a));
      row.vec.forEach((v, j) => {
        const cx = -775 + j * 98;
        const isF1 = j === 0;
        nodes.push(
          lumBar(cx, y, 84, 68, {
            color: isF1 ? ROLE.gold : ROLE.write,
            fillOpacity: isF1 ? 0.34 : 0.14,
            strokeWidth: isF1 ? 2.8 : 1.8,
            glow: isF1 ? 10 : 4,
            opacity: a,
          }),
          txt(String(v), cx, y, 32, isF1 ? ROLE.gold : COSMOS.ink, 'mono', 'center').opacity(a),
        );
      });

      // Arrows into and out of operation bridge
      nodes.push(
        arrow([-410, y], [-305, y], { stroke: '#5d73ab', width: 3, tip: 11 }).opacity(a),
        arrow([255, y], [340, y], { stroke: opCol, width: 3.4, tip: 12 }).opacity(a),
      );

      // Center bridge operation + live f1 number line
      const rowMean = mean(row.vec);
      const rmsScale = Math.sqrt(mean(row.vec.map((v) => v * v)) + epsilon);
      let expr = 'pass feature 1 directly';
      let curMark = row.vec[0];
      if (mode === 'ln') {
        if (dt > 0.2) {
          expr = `(${row.vec[0]} - ${fmtTrim(rowMean, 0)}) / ${fmt(lnScale, 3)}`;
        } else {
          expr = `${row.vec[0]} - ${fmtTrim(rowMean, 0)} = -3`;
        }
        curMark = (row.vec[0] - ct * rowMean) / (1 + dt * (lnScale - 1));
      } else if (mode === 'rms') {
        expr = `${row.vec[0]} / ${fmt(rmsScale, 3)}`;
        curMark = rms(row.vec)[0];
      }

      nodes.push(
        lumBar(-25, y - 14, 520, 68, {
          color: opCol,
          fillOpacity: mode === 'raw' ? 0.14 : 0.24,
          strokeWidth: 2.5,
          glow: 9,
          opacity: a,
        }),
        txt(expr, -25, y - 14, 30, COSMOS.ink, 'mono', 'center').opacity(a),
      );

      // Shared f1 mini-axis beneath bridge showing both golden marks converging onto -1.342
      const axL = -265;
      const axR = 215;
      const axY = y + 58;
      const toAx = (v) => axL + ((v + 4) / 14) * (axR - axL);
      const zeroX = toAx(0);
      nodes.push(
        line([axL, axY], [axR, axY], { stroke: '#4a5f91', width: 2 }).opacity(a),
        line([zeroX, axY - 8], [zeroX, axY + 8], { stroke: '#7a92ca', width: 2 }).opacity(a),
        txt('0', zeroX, axY + 28, 26, COSMOS.dim, 'mono', 'center').opacity(a),
        glowDot(toAx(curMark), axY, { radius: 9, color: ROLE.gold, glow: 14, opacity: a }),
      );

      // Right: Port logit vs Checkpoint reference (-1.342)
      const portScore =
        mode === 'raw' ? row.vec[0] : mode === 'rms' ? rms(row.vec)[0] : ln(row.vec)[0];
      const showPort = mode !== 'ln' || conn > 0.3;
      const matched = mode === 'ln' && conn > 0.3;
      const scoreCol = matched ? ROLE.norm : mode === 'rms' ? ROLE.alert : ROLE.stream;

      nodes.push(
        lumBar(455, y, 188, 76, {
          color: scoreCol,
          fillOpacity: matched ? 0.36 : 0.18,
          strokeWidth: matched ? 3 : 2.2,
          glow: matched ? 13 : 6,
          opacity: a,
        }),
        txt(
          showPort ? fmt(portScore, 3) : '?',
          455,
          y,
          36,
          showPort ? COSMOS.ink : ROLE.gold,
          'mono',
          'center',
        ).opacity(a),
        txt(fmt(refLogit, 3), 725, y, 36, COSMOS.ink, 'mono', 'center').opacity(a),
      );
    });

    // Bottom prompt / verdict / next-lesson coda
    let footer = 'Which operation belongs between the last addition and this head?';
    let footerCol = ROLE.gold;
    if (mode === 'rms') {
      footer = 'RMSNorm keeps both logits positive (+0.365, +0.683)  ·  still mismatched!';
      footerCol = ROLE.rms;
    } else if (mode === 'ln' && conn > 0.3) {
      footer = 'Final LayerNorm restored: both logits match (-1.342)  ·  Next: sparse autoencoders';
      footerCol = ROLE.norm;
    } else if (mode === 'ln') {
      footer = 'Centering and scaling align both gold marks on the checkpoint scale';
      footerCol = ROLE.write;
    }

    nodes.push(
      txt(footer, 0, 385, 30, footerCol, 'sans', 'center')
        .glow(footerCol === ROLE.gold || footerCol === ROLE.norm ? 7 : 0, footerCol)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.norm, ROLE.gold), title, mainLayer);

  // Beat 0: Add +5 offset row (answer strictly withheld!)
  playCue(s, c, 'transfer-offset', (d) => s.play(row2Vis.to(1, { duration: d })), { dur: 0.7 });

  // Beat 1: Strictly AFTER fit-final-norm, mount Final LayerNorm, then center -> divide -> match
  playCue(s, c, 'fit-final-norm', (d) => s.play(modeCode.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'head-center', (d) => s.play(centerT.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'head-divide', (d) => s.play(divideT.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'head-compare', (d) => s.play(connectT.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 2: Contrast with RMSNorm on try-rms, then restore Final LayerNorm on restore-head
  playCue(s, c, 'try-rms', (d) => s.play(modeCode.to(2, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'restore-head', (d) => s.play(modeCode.to(1, { duration: d })), { dur: 0.5 });
}
