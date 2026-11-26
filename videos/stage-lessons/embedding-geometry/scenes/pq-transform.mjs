// Scene 15: pq-transform: "Preserve the scoring objective across transformations"
// Orthonormal OPQ rotation cinema + quantized norm drift + IVF coarse-centroid residual anchor.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  QUERY,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  norm,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pqTransform(s, c) {
  const doc = GUIDES[1].vector; // [4, 2]
  const recon = doc.map((v) => Math.round(v / 1.5) * 1.5); // [4.5, 1.5]
  const centroid = [3, 1];
  const residual = [doc[0] - centroid[0], doc[1] - centroid[1]]; // [1, 1]

  const phase = s.value(0);
  const reconMix = s.value(0);
  const normLit = s.value(0);
  const theta = s.value(0);
  const quantLit = s.value(0);
  const anchorMode = s.value(0); // 0=rotation/norm, 1=IVF anchor
  const anchorPos = s.value(0); // 0=wrong origin [0,0], 1=centroid [3,1]
  const showFormula = s.value(0);

  const origin = [-780, 295];
  const scale = 152;
  const rot = (v) => {
    const c0 = Math.cos(theta.value);
    const s0 = Math.sin(theta.value);
    return [v[0] * c0 - v[1] * s0, v[0] * s0 + v[1] * c0];
  };
  const p = (v) => [origin[0] + v[0] * scale, origin[1] - v[1] * scale];

  const title = heroTitle(['Preserve the objective', 'across transformations'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.violet,
    eyebrow: 'NORM TABLES · OPQ ROTATION · IVF RESIDUAL',
  });

  const cosFormula = glowTex(
    '\\cos(\\mathbf{q},\\hat{\\mathbf{d}}) = \\frac{\\mathbf{q}\\cdot\\hat{\\mathbf{d}}}{\\|\\mathbf{q}\\|\\,\\|\\hat{\\mathbf{d}}\\|}',
    {
      x: 505,
      y: -345,
      size: 38,
      color: ROLE.code,
      glow: 7,
    },
  );

  const planeLayer = dynamic(() => {
    const pp = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(pp * 3.0);
    const rm = reconMix.value;
    const am = anchorMode.value;
    const ap = anchorPos.value;

    const curRecon = doc.map((v, i) => v + rm * (recon[i] - v));
    const qRot = rot(QUERY);
    const aRot = rot(GUIDES[0].vector);
    const bRot = rot(doc);
    const rRot = rot(curRecon);

    const nodes = [];

    // Subtle glowing axes (dimmed during residual anchor phase)
    const axOp = Math.max(0.22, 1 - 0.72 * am);
    for (let k = 1; k <= 5; k++) {
      nodes.push(
        line(p([k, 0]), p([k, 3.6]), { stroke: '#223154', width: 1.4 }).opacity(0.6 * axOp),
      );
    }
    for (let k = 1; k <= 3; k++) {
      nodes.push(
        line(p([0, k]), p([5.2, k]), { stroke: '#223154', width: 1.4 }).opacity(0.6 * axOp),
      );
    }
    nodes.push(
      line(origin, p([5.4, 0]), { stroke: '#556c9e', width: 2.5 }).opacity(axOp),
      line(origin, p([0, 3.7]), { stroke: '#556c9e', width: 2.5 }).opacity(axOp),
      glowDot(origin[0], origin[1], { radius: 6, color: COSMOS.ink, glow: 7 }),
    );

    // Query + A + B rotating under orthonormal OPQ transform
    nodes.push(
      glowVector(origin, p(qRot), { color: ROLE.query, width: 5.5, tipSize: 18 }),
      txt('q', p(qRot)[0] + 6, origin[1] + 46, 30, ROLE.query, 'mono'),
      glowVector(origin, p(aRot), { color: ROLE.A, width: 5, tipSize: 16 }),
      txt('A', p(aRot)[0] + 32, p(aRot)[1] + 8, 30, ROLE.A, 'mono', 'left'),
      glowVector(origin, p(bRot), { color: ROLE.B, width: 5.8, tipSize: 18 }),
      txt('B', p(bRot)[0] + 24, p(bRot)[1] - 32, 32, ROLE.B, 'mono', 'left').glow(5, ROLE.B),
    );

    // Reconstructed vector + norm ticks (visible before residual anchor)
    if (am < 0.5) {
      const op = 1 - am * 2;
      nodes.push(
        glowVector(origin, p(rRot), {
          color: ROLE.code,
          width: 4.2,
          tipSize: 15,
          glow: 9 * pulse,
          opacity: op,
        }),
      );
      [bRot, rRot].forEach((v, i) => {
        const pt = p(v);
        const m = Math.hypot(v[0], v[1]) || 1;
        const tick = 16;
        nodes.push(
          line(
            [pt[0] - (v[1] / m) * tick, pt[1] - (v[0] / m) * tick],
            [pt[0] + (v[1] / m) * tick, pt[1] + (v[0] / m) * tick],
            { stroke: i ? ROLE.code : ROLE.B, width: 4.5 },
          ).opacity(op),
        );
      });
    }

    // IVF Coarse Centroid + Residual vector sliding from wrong origin -> centroid tip
    if (am > 0.02) {
      const cRot = rot(centroid);
      const cPt = p(cRot);
      const fromVec = centroid.map((v) => v * ap);
      const toVec = fromVec.map((v, i) => v + residual[i]);
      const resCol = ap > 0.85 ? ROLE.gold : ROLE.danger;
      nodes.push(
        glowVector(origin, cPt, { color: ROLE.code, width: 5.5, tipSize: 18, opacity: am }),
        txt('coarse centroid', cPt[0] + 28, cPt[1] + 54, 28, ROLE.code, 'mono', 'left').opacity(am),
        glowVector(p(rot(fromVec)), p(rot(toVec)), {
          color: resCol,
          width: 6.5,
          tipSize: 20,
          glow: 11 * pulse,
          opacity: am,
        }),
        txt(
          ap > 0.85 ? 'residual: anchored at centroid' : 'residual: wrong origin [0, 0]!',
          -740,
          -245,
          30,
          resCol,
          'mono',
          'left',
        )
          .glow(6, resCol)
          .opacity(am),
      );
    }

    // Right column: Norm telemetry + 3 clean floating transform contract rows
    const rx = 185;
    nodes.push(
      rule(135, -390, 135, 395, COSMOS.rule, 1.8).opacity(0.6),
      txt(`original B:  ‖d‖ = ${norm(doc).toFixed(3)}`, rx, -225, 32, ROLE.B, 'mono', 'left'),
      txt(
        `reconstructed:  ‖d̂‖ = ${norm(curRecon).toFixed(3)}`,
        rx,
        -172,
        32,
        normLit.value > 0.4 ? ROLE.gold : ROLE.code,
        'mono',
        'left',
      ).glow(normLit.value > 0.4 ? 8 : 0, ROLE.gold),
      rule(rx, -120, 845, -120, COSMOS.rule, 1.5).opacity(0.6),
    );

    const items = [
      {
        title: '1. OPQ rotation (orthonormal)',
        status: 'preserves exact dot & L2',
        col: theta.value > 0.02 ? ROLE.A : COSMOS.muted,
        y: -55,
      },
      {
        title: '2. Subspace codebooks',
        status: 'introduces approximation',
        col: quantLit.value > 0.4 ? ROLE.warn : COSMOS.muted,
        y: 65,
      },
      {
        title: '3. IVF residual code',
        status:
          am < 0.2
            ? 'pending coarse anchor'
            : ap > 0.85
              ? 'centroid + residual (exact origin)'
              : 'wrong origin without anchor!',
        col: am < 0.2 ? COSMOS.dim : ap > 0.85 ? ROLE.gold : ROLE.danger,
        y: 185,
      },
    ];
    items.forEach((it) => {
      nodes.push(
        txt(it.title, rx, it.y, 30, COSMOS.ink, 'serif', 'left'),
        txt(it.status, rx + 24, it.y + 44, 28, it.col, 'mono', 'left').glow(
          it.col === ROLE.gold || it.col === ROLE.danger ? 6 : 0,
          it.col,
        ),
      );
    });

    if (showFormula.value > 0.02) {
      nodes.push(
        lumBar(515, 345, 660, 64, {
          color: ROLE.gold,
          fillAlpha: 0.16,
          strokeWidth: 2.4,
          glow: 9,
          opacity: showFormula.value,
        }),
        txt('document = centroid + residual', 515, 345, 34, ROLE.gold, 'mono')
          .glow(7, ROLE.gold)
          .opacity(showFormula.value),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.code), title, cosFormula, planeLayer);

  runPhase(s, c, phase, 8);

  playCue(s, c, 'lengths', (d) => s.play(reconMix.to(1, { duration: d })), { dur: 1.8 });
  playCue(s, c, 'norm', (d) => s.play(normLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'rotate', (d) => s.play(theta.to(Math.PI / 12, { duration: d })), { dur: 2.4 });
  playCue(s, c, 'quantize', (d) => s.play(quantLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'anchor', (d) => s.play(anchorMode.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'restore', (d) => s.play(anchorPos.to(1, { duration: d })), { dur: 1.8 });
  playCue(s, c, 'restore', (d) => s.play(showFormula.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
