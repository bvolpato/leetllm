// Scene 15: What happens when one key's score rises?: Signed score gradients & row correction D.
import {
  BWD_RAISED,
  BWD_ROW,
  COSMOS,
  DENSE_OUTPUT,
  VALUES,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const X0 = -740;
const X1 = 740;
const RULER_Y = -120;
const mapV = (v) => X0 + ((v - 5) / (45 - 5)) * (X1 - X0);

export default function backwardAlgebra(s, c) {
  const phase = s.value(0);
  const raiseProg = s.value(0);
  const answered = s.value(0);
  const showSlopes = s.value(0);
  const showAllSlopes = s.value(0);
  const showSumZero = s.value(0);
  const showValPath = s.value(0);
  const showD = s.value(0);
  const showQk = s.value(0);

  const bgAura = aura(0, -20, 560, '#a78bfa22', '#5ce1e616');
  const title = heroTitle(['Score Gradients', '& Row Correction D'], {
    x: -855,
    y: -410,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.violet,
    eyebrow: 'BACKWARD ALGEBRA · CHAIN RULE',
  });

  const eqD = glowTex(
    String.raw`D_i = \mathbf{dO}_i \cdot \mathbf{O}_i,\qquad dS_{ij} = P_{ij}\big(dP_{ij} - D_i\big)`,
    {
      x: 0,
      y: 355,
      size: 36,
      color: COSMOS.violet,
    },
  );

  const live = guardedDynamic(1, () => {
    const rp = raiseProg.value;
    const ss = showSlopes.value;
    const sa = showAllSlopes.value;
    const sz = showSumZero.value;
    const vp = showValPath.value;
    const sd = showD.value;
    const qk = showQk.value;

    const blend = DENSE_OUTPUT + (BWD_RAISED.output - DENSE_OUTPUT) * rp;
    const bx = mapV(blend);

    const nodes = [
      line([X0, RULER_Y], [X1, RULER_Y], { stroke: '#465885', width: 2.8 }),
      txt('VALUE RULER (dO = 1, dropout = 0)', 0, RULER_Y - 110, 26, COSMOS.muted, 'mono'),
    ];

    const vColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold];
    VALUES.forEach((v, i) => {
      const vx = mapV(v);
      nodes.push(
        line([vx, RULER_Y - 18], [vx, RULER_Y + 18], { stroke: vColors[i], width: 2.6 }),
        glowDot(vx, RULER_Y, { radius: 8, color: vColors[i] }),
        txt(`v=${v}`, vx, RULER_Y + 52, 28, vColors[i], 'mono'),
      );
    });

    // Moving output marker
    nodes.push(
      glowDot(bx, RULER_Y, { radius: 11, color: COSMOS.emerald }),
      txt(`blend = ${blend.toFixed(2)}`, bx, RULER_Y - 56, 30, COSMOS.emerald, 'mono').glow(
        6,
        COSMOS.emerald,
      ),
    );

    if (ss < 0.05) {
      const ans = answered.value >= 0.5;
      nodes.push(
        glassCell(0, 95, 1180, 124, ans ? COSMOS.cyan : COSMOS.gold, {
          fill: ans ? '#0e1b2d' : '#1b1812',
          glow: 8,
        }),
        txt(
          ans
            ? 'Down! Score 2 → 3 gives v = 20 more share, pulling blend toward 20'
            : 'Raise key "this" (v = 20) score: which way does the blend move?',
          0,
          95,
          30,
          ans ? COSMOS.cyan : COSMOS.gold,
          'sans',
        ),
      );
    }

    // Signed score derivatives table (3 glowing columns)
    if (ss > 0.02) {
      const cols = [-470, 0, 470];
      const names = ['fix (v=10)', 'this (v=20)', 'test (v=40)'];
      for (let i = 0; i < 3; i++) {
        const vis = i === 1 ? ss : sa;
        if (vis < 0.02) continue;
        const slope = BWD_ROW.ds[i];
        const col = slope < 0 ? COSMOS.rose : COSMOS.emerald;
        nodes.push(
          glassCell(cols[i], 85, 410, 146, col, { fill: '#111829', glow: 8, opacity: vis }),
          txt(names[i], cols[i], 40, 26, vColors[i], 'mono').opacity(vis),
          txt(`dS = ${slope >= 0 ? '+' : ''}${slope.toFixed(2)}`, cols[i], 96, 36, col, 'mono')
            .glow(6, col)
            .opacity(vis),
          txt(
            `p·(v − o) = ${BWD_ROW.probabilities[i].toFixed(2)}·(${(VALUES[i] - DENSE_OUTPUT).toFixed(1)})`,
            cols[i],
            138,
            26,
            COSMOS.muted,
            'mono',
          ).opacity(vis),
        );
      }
    }

    if (sz > 0.02 && vp < 0.01) {
      nodes.push(
        txt(
          'Σ dS = 0 exactly (constant score shift leaves softmax unchanged)',
          0,
          224,
          28,
          COSMOS.cyan,
          'mono',
        )
          .glow(6, COSMOS.cyan)
          .opacity(sz),
      );
    }

    if (vp > 0.05) {
      const msg =
        qk > 0.5
          ? 'dV = Pᵀ dO   ·   dS = P ⊙ (dP − D)   →   dQ, dK via scaled dot products'
          : sd > 0.5
            ? 'dP = dO · Vᵀ   ·   Row correction D = dO · O = weighted mean of dP'
            : 'Value path: dV = Pᵀ dO   (each value gets its probability × dO)';
      nodes.push(
        glassCell(0, 232, 1520, 82, COSMOS.violet, { fill: '#171330', glow: 8, opacity: vp }),
        txt(msg, 0, 232, 26, COSMOS.ink, 'mono').opacity(vp),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('gradient-question', () => s.play(phase.to(2, { duration: 0.35 })));
  c.on('raise-score', () => {
    s.play(answered.to(1, { duration: 0.2 }));
    s.play(raiseProg.to(1, { duration: 0.7 }));
  });
  c.on('distance', () => s.play(raiseProg.to(0, { duration: 0.65 })));
  c.on('score-slope', () => s.play(showSlopes.to(1, { duration: 0.45 })));
  c.on('all-slopes', () => s.play(showAllSlopes.to(1, { duration: 0.45 })));
  c.on('grad-sum', () => s.play(showSumZero.to(1, { duration: 0.45 })));
  c.on('value-path', () => s.play(showValPath.to(1, { duration: 0.45 })));
  c.on('prob-path', () => s.play(showD.to(0.5, { duration: 0.35 })));
  c.on('row-correction', () => s.play(showD.to(1, { duration: 0.45 })));
  c.show('derive-score', eqD);
  c.on('qk-grad', () => s.play(showQk.to(1, { duration: remainDuration(c, 'qk-grad', 0.45) })));
}
