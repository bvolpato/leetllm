// Scene 16 (variance-ledger): "Retained and discarded squares account for the same cloud"
// Orthogonal Pythagorean triangle on centered C + live energy ledger: 55.913 retained + 9.721 discarded = 65.633 total.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  DISCARDED_ENERGY,
  ENERGY_ROWS,
  QUERY_COLOR,
  RETAINED_ENERGY,
  TOTAL_ENERGY,
  aura,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  pca,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const ROW_C = ENERGY_ROWS[2];

export default function varianceLedger(s, c) {
  const showOrigin = s.value(0);
  const showSplit = s.value(0);
  const showOrtho = s.value(0);
  const showSum = s.value(0);
  const showTotal = s.value(0);
  const showRet = s.value(0);
  const showDisc = s.value(0);
  const showDiv = s.value(0);
  const showRecon = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['Pythagorean Variance', 'Conservation Ledger'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'ORTHOGONAL ENERGY DECOMPOSITION',
  });

  const eqPyth = glowTex('\\|x_i - \\mu\\|^2 = z_i^2 + \\|e_i\\|^2', {
    x: 445,
    y: -255,
    size: 42,
    color: QUERY_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-820, -235, 760, 440, { x: [-4.5, 4.5], y: [-2.6, 2.8] });
    const orig = plot.pt([0, 0]);
    const cPt = plot.pt(ROW_C.centered);
    const fPt = plot.pt(ROW_C.foot);

    const nodes = [
      ...plot.axesNodes(0.75),
      line(
        plot.pt([-4.2 * pca.vector[0], -4.2 * pca.vector[1]]),
        plot.pt([4.2 * pca.vector[0], 4.2 * pca.vector[1]]),
        { stroke: COSMOS.cyan, width: 3 },
      ).opacity(0.85),
      // Centered vector O -> C
      line(orig, cPt, { stroke: QUERY_COLOR, width: 3.8 }).opacity(0.45 + 0.55 * showOrigin.value),
      // Retained projection O -> Foot
      line(orig, fPt, { stroke: COSMOS.emerald, width: 4.5 }).opacity(
        0.35 + 0.65 * showSplit.value,
      ),
      // Orthogonal residual Foot -> C
      line(fPt, cPt, { stroke: DANGER_COLOR, width: 4.0, dash: [8, 5] }).opacity(
        0.35 + 0.65 * showSplit.value,
      ),
      glowDot(orig[0], orig[1], { radius: 7, color: COSMOS.muted, glow: 8 }),
      txt('μ (0,0)', orig[0] + 16, orig[1] + 32, 26, COSMOS.muted, 'mono', 'left'),
      glowDot(cPt[0], cPt[1], { radius: 9, color: QUERY_COLOR, glow: 12 }),
      txt('C (centered)', cPt[0], cPt[1] - 30, 26, QUERY_COLOR, 'mono'),
      glowDot(fPt[0], fPt[1], { radius: 7, color: COSMOS.emerald, glow: 10 }),
    ];

    if (showOrtho.value > 0.02) {
      nodes.push(
        txt(
          '90° orthogonal split',
          fPt[0] - 25,
          fPt[1] + 38,
          26,
          COSMOS.emerald,
          'mono',
          'right',
        ).opacity(showOrtho.value),
      );
    }

    // Right side: full 6-point energy ledger bars
    const rx = 65;
    const scaleW = 10.6;
    const totW = TOTAL_ENERGY * scaleW;
    const retW = RETAINED_ENERGY * scaleW;
    const discW = DISCARDED_ENERGY * scaleW;

    nodes.push(
      txt('FULL 6-POINT CENTERED ENERGY', rx, -145, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`Total:  ${TOTAL_ENERGY.toFixed(3)}`, rx, -82, 28, QUERY_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * Math.max(showSum.value, showTotal.value),
      ),
      lumBar(rx + totW / 2, -26, totW, 42, {
        color: QUERY_COLOR,
        fillOpacity: 0.45,
        glow: 8,
        opacity: 0.45 + 0.55 * showTotal.value,
      }),
      txt(
        `Retained (PC1):  ${RETAINED_ENERGY.toFixed(3)}  (85.2%)`,
        rx,
        46,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * showRet.value),
      lumBar(rx + retW / 2, 102, retW, 42, {
        color: COSMOS.emerald,
        fillOpacity: 0.78,
        glow: 9,
        opacity: 0.35 + 0.65 * showRet.value,
      }),
      txt(
        `Discarded (PC2):  ${DISCARDED_ENERGY.toFixed(3)}  (14.8%)`,
        rx,
        172,
        28,
        DANGER_COLOR,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * showDisc.value),
      lumBar(rx + retW + discW / 2, 102, discW, 42, {
        color: DANGER_COLOR,
        fillOpacity: 0.8,
        glow: 9,
        opacity: 0.35 + 0.65 * showDisc.value,
      }),
    );

    if (showDiv.value > 0.02) {
      nodes.push(
        txt(
          'Divide by (n − 1) = 5 for sample variance units',
          rx,
          248,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showDiv.value),
      );
    }

    if (showRecon.value > 0.02) {
      nodes.push(
        rule(-855, 298, 855, 298, COSMOS.rule, 2).opacity(showRecon.value),
        txt(
          'Reconstruct:  x̂ = μ + Σ z_k v_k   (full basis recovers exact vector; truncation can lose query signal)',
          -855,
          358,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(showRecon.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'origin', showOrigin, 1, { duration: 0.45 });
  tweenCue(s, c, 'split', showSplit, 1, { duration: 0.5 });
  c.show('split', eqPyth);
  tweenCue(s, c, 'orthogonal', showOrtho, 1, { duration: 0.45 });
  tweenCue(s, c, 'sum', showSum, 1, { duration: 0.45 });
  tweenCue(s, c, 'total', showTotal, 1, { duration: 0.45 });
  tweenCue(s, c, 'retained', showRet, 1, { duration: 0.45 });
  tweenCue(s, c, 'discarded', showDisc, 1, { duration: 0.45 });
  tweenCue(s, c, 'divide', showDiv, 1, { duration: 0.45 });
  tweenCue(s, c, 'reconstruct', showRecon, 1, { duration: 0.45 });
}
