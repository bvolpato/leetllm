// Scene 05: Where does the missing probability go? (Tied weight shrink + unused competitor gradient)
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TIED_DROPPED,
  TIED_FULL,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function compactDenominator(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const shrunk = s.value(0);
  const showMatrixPct = s.value(0);
  const showWholePct = s.value(0);

  const showPart2 = s.value(0);
  const showGrad = s.value(0);
  const dropRow2 = s.value(0);
  const showValIds = s.value(0);

  const bgAura = aura(320, 0, 560, '#2a226028', '#17386416');

  // Orbiting 3D tied embedding table slab (Full vs Compact)
  const slab3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit: 108,
    focus: [0, 0, 0.4],
  }).at(380, 10);
  slab3d.add(
    ...box3d(-2.2, -1.0, -0.5, 4.4, 2.0, 1.35, '#191e34', '#4e608e', 0.34),
    ...box3d(-2.2, -1.0, -0.5, 4.4 * (17485 / 50257), 2.0, 1.35, '#103846', COSMOS.cyan, 0.85),
  );

  const part1 = guardedDynamic(showPart1, (a) => {
    const sh = shrunk.value;
    const mp = showMatrixPct.value;
    const wp = showWholePct.value;
    const matPct = ((1 - TIED_FULL.compactWeights / TIED_FULL.fullWeights) * 100).toFixed(1);
    const wholePct = ((1 - TIED_FULL.compactTotal / TIED_FULL.fullTotal) * 100).toFixed(1);

    const nodes = [
      heroTitle(['Where Does the Missing', 'Probability Go?'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'TIED EMBEDDING / OUTPUT TABLE · d = 96',
      }).opacity(a),

      txt('TIED MATRIX (COUNTED ONCE)', -855, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        `Full GPT-2 (50,257 x 96):  ${TIED_FULL.fullWeights.toLocaleString('en-US')}`,
        -855,
        -102,
        32,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (sh > 0.05) {
      nodes.push(
        txt(
          `Active rows (17,485 x 96): ${TIED_FULL.compactWeights.toLocaleString('en-US')}`,
          -855,
          -34,
          34,
          COSMOS.cyan,
          'mono',
          'left',
        )
          .glow(6, COSMOS.cyan)
          .opacity(sh * a),
      );
    }

    if (mp > 0.05) {
      nodes.push(
        txt(`Matrix reduction:  -${matPct}%`, -855, 68, 46, COSMOS.gold, 'mono', 'left')
          .glow(8, COSMOS.gold)
          .opacity(mp * a),
      );
    }

    if (wp > 0.05) {
      nodes.push(
        txt(
          `Whole model: ${TIED_FULL.fullTotal.toLocaleString('en-US')} -> ${TIED_FULL.compactTotal.toLocaleString('en-US')} (-${wholePct}%)`,
          -855,
          164,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(wp * a),
        txt(
          'Attention & MLP blocks stayed the same size',
          -855,
          216,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(wp * a),
      );
    }

    nodes.push(
      txt('3D TIED TABLE VOLUME', 380, -370, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(
        'Cyan core = 17,485 active rows · Ghost = 32,772 pruned',
        380,
        395,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const gr = showGrad.value;
    const dr = dropRow2.value;
    const val = showValIds.value;

    // Interpolate probabilities smoothly when row 2 is removed
    const p0 = TIED_FULL.probabilities[0] * (1 - dr) + TIED_DROPPED.probabilities[0] * dr;
    const p1 = TIED_FULL.probabilities[1] * (1 - dr) + TIED_DROPPED.probabilities[1] * dr;
    const p2 = TIED_FULL.probabilities[2] * (1 - dr);
    const curLoss = TIED_FULL.loss * (1 - dr) + TIED_DROPPED.loss * dr;

    const barMax = 680;
    const bx = -120;
    const rows = [
      {
        label: 'row 0 (input)  [1, 0]',
        logit: 'z = 1',
        prob: p0,
        color: COSMOS.cyan,
        y: -115,
        alpha: 1,
      },
      {
        label: 'row 1 (target) [0, 1]',
        logit: 'z = 0',
        prob: p1,
        color: COSMOS.gold,
        y: 25,
        alpha: 1,
      },
      {
        label: 'row 2 (unused) [1, 1]',
        logit: 'z = 1',
        prob: p2,
        color: COSMOS.rose,
        y: 165,
        alpha: Math.max(0.14, 1 - dr * 0.86),
      },
    ];

    const nodes = [
      heroTitle(['Removing Competitors', 'Changes the Problem'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: '3-ROW TIED SOFTMAX · HIDDEN h = [1, 0]',
      }).opacity(a),
      txt('TIED WEIGHT ROWS', -855, -205, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('SOFTMAX PROBABILITY SHARE', bx, -205, 26, COSMOS.muted, 'mono', 'left').opacity(a),
    ];

    rows.forEach((r) => {
      const w = Math.max(4, r.prob * barMax);
      nodes.push(
        txt(r.label, -855, r.y - 16, 28, r.color, 'mono', 'left').opacity(r.alpha * a),
        txt(r.logit, -855, r.y + 22, 26, COSMOS.muted, 'mono', 'left').opacity(r.alpha * a),
        rect(barMax, 52, { fill: '#111626', stroke: COSMOS.rule, width: 1.5, radius: 8 })
          .at(bx + barMax * 0.5, r.y)
          .opacity(r.alpha * a),
        rect(w, 48, { fill: r.color, stroke: null, radius: 7 })
          .at(bx + w * 0.5, r.y)
          .glow(r.color === COSMOS.gold ? 8 : 5, r.color)
          .opacity(r.alpha * a),
        txt(
          `${(r.prob * 100).toFixed(1)}%`,
          bx + barMax + 26,
          r.y + 2,
          32,
          r.color,
          'mono',
          'left',
        ).opacity(r.alpha * a),
      );
    });

    if (gr > 0.05 && dr < 0.4) {
      nodes.push(
        txt(
          `Row 2 output grad = p2 * h = [${TIED_FULL.gradientUnused[0].toFixed(3)}, 0.000]`,
          -855,
          286,
          30,
          COSMOS.rose,
          'mono',
          'left',
        )
          .glow(6, COSMOS.rose)
          .opacity(gr * Math.max(0, 1 - dr * 2.5) * a),
      );
    }

    if (dr > 0.55) {
      const drAlpha = Math.min(1, (dr - 0.55) / 0.45);
      nodes.push(
        txt(
          `Target loss: ${TIED_FULL.loss.toFixed(2)} -> ${curLoss.toFixed(2)} nats (0 steps!)`,
          -855,
          318,
          34,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(7, COSMOS.emerald)
          .opacity(drAlpha * a),
      );
    }

    if (val > 0.1) {
      nodes.push(
        glowDot(40, 320, { radius: 6, color: COSMOS.gold, opacity: val * a }),
        txt(
          '335 validation-only IDs entered during preprocessing',
          74,
          304,
          26,
          COSMOS.gold,
          'sans',
          'left',
        ).opacity(val * a),
        txt(
          'Fix vocab in advance for independent evaluation',
          74,
          344,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(val * a),
      );
    }

    return group(...nodes);
  });

  const eq = glowTex('\\nabla_{w_2}\\mathcal{L} = p_2 \\, h', {
    x: 420,
    y: 280,
    size: 40,
    color: COSMOS.rose,
    glow: 7,
  });

  s.add(bgAura, slab3d, part1, part2);
  const part1End = Math.max(0.6, c.end - c.cue('compact-denominator-2').start + 0.35);
  orbitScene(s, c, slab3d, { theta: -0.2, phi: 0.92 }, { startOffset: 0.1, endMargin: part1End });

  c.on('compact-denominator-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('compact-weights', () => s.play(shrunk.to(1, { duration: 0.55 })));
  c.on('removed-matrix', () => s.play(showMatrixPct.to(1, { duration: 0.5 })));
  c.on('whole-model', () => s.play(showWholePct.to(1, { duration: 0.5 })));

  c.on('compact-denominator-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide('compact-denominator-2', [slab3d], { fade: 0.2 });

  c.on('unused-gradient', () => s.play(showGrad.to(1, { duration: 0.45 })));
  c.show('unused-gradient', eq, { fade: 0.4 });
  c.on('compact-denominator-3', () => s.play(dropRow2.to(0.25, { duration: 0.4 })));
  c.on('drop-competitor', () =>
    s.play(dropRow2.to(1, { duration: remainDuration(c, 'drop-competitor', 0.85) })),
  );
  c.hide('drop-competitor', eq, { fade: 0.2 });
  c.on('validation-support', () =>
    s.play(showValIds.to(1, { duration: remainDuration(c, 'validation-support', 0.5) })),
  );
}
