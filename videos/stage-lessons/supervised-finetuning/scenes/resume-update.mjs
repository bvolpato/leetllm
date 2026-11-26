// Scene 17: Which direction after a restart?: Dual AdamW rulers (0.873 vs 1.000) with prediction withholding + SGD.
import {
  COSMOS,
  RESUME_FRESH,
  RESUME_RESTORED,
  SGD_RESET_V,
  SGD_RESET_W,
  SGD_SAVED_V,
  SGD_SAVED_W,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const R_X0 = -240;
const R_X1 = 780;
const mapW = (w) => R_X0 + ((w - 0.84) / (1.04 - 0.84)) * (R_X1 - R_X0);

export default function resumeUpdate(s, c) {
  const phase = s.value(0);
  const showGrad = s.value(0);
  const focusRestored = s.value(0);
  const revealRestored = s.value(0);
  const revealFresh = s.value(0);
  const sgdView = s.value(0);

  const bgAura = aura(100, 30, 620, '#5ce1e61e', '#ff6b8b14');
  const title = heroTitle(['Which Direction', 'After a Restart?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'OPTIMIZER MOMENTUM · RESUME SEMANTICS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sg = showGrad.value;
    const fr = focusRestored.value;
    const rr = revealRestored.value;
    const rf = revealFresh.value;
    const sgd = sgdView.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (sgd < 0.5) {
      // Beats 0 & 1: Scalar AdamW resume vs fresh optimizer on identical precision rulers
      const a = 1 - sgd * 2;
      nodes.push(
        txt(
          'SAVED WEIGHT w = 0.900  ·  NEXT GRADIENT g = −1.0  ·  LR = 0.1  ·  DECAY = 0',
          0,
          -235,
          27,
          sg > 0.3 ? COSMOS.gold : COSMOS.cyan,
          'mono',
        ).opacity(a),
      );

      const branches = [
        {
          label: 'RESTORED MOMENTS',
          state: 'm = 0.200 · v = 0.004 · step 1',
          y: -70,
          col: COSMOS.cyan,
          data: RESUME_RESTORED,
          rev: rr,
          active: fr > 0.3,
        },
        {
          label: 'FRESH OPTIMIZER',
          state: 'm = 0 · v = 0 · step 0',
          y: 165,
          col: COSMOS.rose,
          data: RESUME_FRESH,
          rev: rf,
          active: rf > 0.3,
        },
      ];

      branches.forEach((b) => {
        const startX = mapW(b.data.saved);
        const endX = mapW(b.data.weight);
        const curX = startX + (endX - startX) * b.rev;

        nodes.push(
          glassCell(-580, b.y, 520, 124, b.active ? b.col : '#33446b', {
            fill: '#10182b',
            glow: b.active ? 9 * pulse : 3,
            opacity: a,
          }),
          txt(b.label, -580, b.y - 24, 28, b.col, 'mono').opacity(a),
          txt(b.state, -580, b.y + 26, 26, COSMOS.muted, 'mono').opacity(a),

          // Precision ruler
          line([R_X0, b.y], [R_X1, b.y], { stroke: '#445785', width: 3.5 }).opacity(a),
          ...[0.85, 0.9, 0.95, 1.0].map((t) =>
            group(
              line([mapW(t), b.y - 14], [mapW(t), b.y + 14], {
                stroke: COSMOS.dim,
                width: 2,
              }).opacity(a),
              txt(t.toFixed(2), mapW(t), b.y + 44, 26, COSMOS.muted, 'mono').opacity(a),
            ),
          ),
          // Anchor dot at saved w = 0.900
          glowDot(startX, b.y, { radius: 9, color: COSMOS.ink, opacity: a }),
        );

        // Strict prediction withholding: only show direction arrow + target value after reveal cues!
        if (b.rev > 0.05) {
          nodes.push(
            arrow([startX, b.y], [curX, b.y], { stroke: b.col, width: 6, tip: 15 })
              .glow(11 * pulse, b.col)
              .opacity(b.rev * a),
            glowDot(curX, b.y, { radius: 9, color: b.col, opacity: b.rev * a }),
            txt(b.data.weight.toFixed(6), endX, b.y - 54, 34, b.col, 'mono')
              .glow(7, b.col)
              .opacity(b.rev * a),
          );
        } else {
          nodes.push(
            txt('?', startX, b.y - 52, 38, COSMOS.gold, 'mono')
              .glow(7, COSMOS.gold)
              .opacity(Math.max(0.35, sg) * a),
          );
        }
      });

      const footCol = rf > 0.5 ? COSMOS.rose : rr > 0.5 ? COSMOS.cyan : COSMOS.gold;
      const footMsg =
        rf > 0.5
          ? 'OPPOSITE DIRECTIONS! Restored steps DOWN to 0.873 · Fresh steps UP to 1.000'
          : rr > 0.5
            ? 'Restored positive moment history outweighs g = −1 → weight moves DOWN to 0.873'
            : 'Same saved weight (0.900), same next gradient (−1): will both move the same way?';
      nodes.push(
        glassCell(0, 368, 1660, 96, footCol, { fill: '#101829', glow: 8, opacity: a }),
        txt(footMsg, 0, 368, 28, footCol, 'mono').opacity(a),
      );
    } else {
      // Beat 2: Momentum SGD parallel calculation (saved v=2 -> 0.52 vs reset v=0 -> 0.70)
      const a = Math.min(1, (sgd - 0.5) * 2);
      nodes.push(
        txt(
          'MOMENTUM SGD · w = 0.8 · g = 1.0 · β = 0.9 · LR = 0.1',
          0,
          -210,
          30,
          COSMOS.cyan,
          'mono',
        ).opacity(a),
      );
      const rows = [
        {
          name: 'SAVED VELOCITY (v₀ = 2.0)',
          velEq: `v₁ = 0.9 × 2 + 1 = ${SGD_SAVED_V.toFixed(1)}`,
          wEq: `w₁ = 0.8 − 0.1 × ${SGD_SAVED_V.toFixed(1)} = ${SGD_SAVED_W.toFixed(2)}`,
          col: COSMOS.emerald,
          y: -45,
        },
        {
          name: 'RESET VELOCITY (v₀ = 0.0)',
          velEq: `v₁ = 0.9 × 0 + 1 = ${SGD_RESET_V.toFixed(1)}`,
          wEq: `w₁ = 0.8 − 0.1 × ${SGD_RESET_V.toFixed(1)} = ${SGD_RESET_W.toFixed(2)}`,
          col: COSMOS.rose,
          y: 165,
        },
      ];
      rows.forEach((r) => {
        nodes.push(
          glassCell(0, r.y, 1620, 134, r.col, { fill: '#10182b', glow: 9, opacity: a }),
          txt(r.name, -760, r.y, 28, r.col, 'mono', 'left').opacity(a),
          txt(r.velEq, -50, r.y, 32, COSMOS.cyan, 'mono').opacity(a),
          txt(r.wEq, 760, r.y, 34, r.col, 'mono', 'right').glow(6, r.col).opacity(a),
        );
      });
      nodes.push(
        txt(
          'Same weight, same gradient: dropping optimizer velocity changes the very next step',
          0,
          365,
          29,
          COSMOS.gold,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('resume-update-b1', () => s.play(showGrad.to(1, { duration: 0.45 })));
  c.on('resume-update-b2', () => s.play(focusRestored.to(1, { duration: 0.4 })));
  c.after('resume-branch-results', () => s.play(revealRestored.to(1, { duration: 0.65 })));
  c.after('resume-reset', () => s.play(revealFresh.to(1, { duration: 0.65 })));
  c.on('resume-update-b3', () =>
    s.play(sgdView.to(1, { duration: remainDuration(c, 'resume-update-b3', 0.45) })),
  );
}
