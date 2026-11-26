// Scene 16: siglip-pairs: 2x2 pairwise sigmoid logistic loss matrix, /B vs /B^2 normalization & distributed sync.
import {
  COSMOS,
  ROLE,
  SIGLIP,
  aura,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function siglipPairs(s, c) {
  const showValues = s.value(0);
  const showSync = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#26184422');
  const title = heroTitle(['SigLIP Pairwise Loss:', 'Independent Terms, Shared Objective'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.bridge,
  });

  const eq = glowTex(
    String.raw`\mathcal{L}_{\text{SigLIP}} = \frac{1}{B}\sum_{i,j}\log\bigl(1 + e^{-y_{ij} z_{ij}}\bigr)`,
    { x: 310, y: -395, size: 34, color: ROLE.patch, glow: 7 },
  );

  // Exact 2x2 fixture cells from SIGLIP (visionSiglip())
  const cells = [
    { r: 0, col: 0, label: '+1', z: '+2.0', loss: SIGLIP.losses[0][0] },
    { r: 0, col: 1, label: '-1', z: '-1.0', loss: SIGLIP.losses[0][1] },
    { r: 1, col: 0, label: '-1', z: '-0.4', loss: SIGLIP.losses[1][0] },
    { r: 1, col: 1, label: '+1', z: '+1.7', loss: SIGLIP.losses[1][1] },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const val = showValues.value;
    const sync = showSync.value;

    const gx0 = -640;
    const gy0 = -75;
    const cellW = 290;
    const cellH = 145;

    const nodes = [
      txt(
        '2 x 2 BINARY PAIR MATRIX (NO ROW/COL SOFTMAX)',
        gx0 - 140,
        -210,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Caption 0', gx0, -165, 26, ROLE.pos, 'mono', 'center').opacity(alpha),
      txt('Caption 1', gx0 + cellW, -165, 26, ROLE.pos, 'mono', 'center').opacity(alpha),
      txt('Img 0', gx0 - 185, gy0, 26, ROLE.patch, 'mono', 'center').opacity(alpha),
      txt('Img 1', gx0 - 185, gy0 + cellH, 26, ROLE.patch, 'mono', 'center').opacity(alpha),
    ];

    cells.forEach((cell) => {
      const cx = gx0 + cell.col * cellW;
      const cy = gy0 + cell.r * cellH;
      const isPos = cell.label === '+1';
      const stroke = isPos ? ROLE.ok : ROLE.warn;
      const fill = isPos ? '#0f2d24' : '#2b1522';
      nodes.push(
        rect(cellW - 18, cellH - 18, { fill, stroke, width: 2.8, radius: 12 })
          .at(cx, cy)
          .opacity(alpha),
        txt(`y=${cell.label}  z=${cell.z}`, cx, cy - 26, 26, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
        txt(
          val > 0.25 ? `loss = ${cell.loss.toFixed(3)}` : 'logistic(y, z)',
          cx,
          cy + 22,
          28,
          isPos ? ROLE.ok : ROLE.warn,
          'mono',
          'center',
        ).opacity(alpha * (0.45 + 0.55 * val)),
      );
    });

    // Right normalization comparison + distributed sync note
    const rx = 50;
    const mean4 = SIGLIP.objective * 0.5;
    nodes.push(
      txt('NORMALIZATION MATTERS', rx, -165, 26, ROLE.pos, 'mono', 'left').opacity(alpha),
      txt(
        `Sum of 4 pairs / B (B=2):  ${SIGLIP.objective.toFixed(2)}`,
        rx,
        -90,
        32,
        ROLE.ok,
        'mono',
        'left',
      )
        .glow(val > 0.3 ? 10 : 0, ROLE.ok)
        .opacity(alpha * (0.38 + 0.62 * val)),
      txt(
        `Mean over 4 pairs (/ 4):   ${mean4.toFixed(2)}  (halves grads!)`,
        rx,
        -20,
        28,
        ROLE.warn,
        'mono',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * val)),

      txt('DISTRIBUTED TRAINING', rx, 85, 26, ROLE.bridge, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * sync),
      ),
      txt('Chunked loss avoids global softmax,', rx, 145, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha * (0.35 + 0.65 * sync),
      ),
      txt('but still exchanges remote negatives', rx, 185, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha * (0.35 + 0.65 * sync),
      ),
      txt(
        'and synchronizes gradients across workers.',
        rx,
        225,
        28,
        ROLE.bridge,
        'sans',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * sync)),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'siglip-pairs-beat-0', (d) => s.play(showValues.to(0.2, { duration: d })));
  playCue(s, c, 'siglip-pairs-beat-1', (d) => s.play(showValues.to(1, { duration: d })));
  playCue(s, c, 'siglip-pairs-beat-2', (d) => s.play(showSync.to(1, { duration: d })));
}
