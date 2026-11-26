// Scene 7: triplet-margin - "A distance gap must meet the declared margin"
// Pure Cinema: dual glowing distance rulers with a moving margin zone paired with a live
// ReLU hinge curve max(0, d+ - d- + m) that stays flat at 0.000 then climbs the ramp to 0.300.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRuler,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function tripletMargin(s, c) {
  const margin = 0.1;
  const good = [0.2, 0.5];
  const bad = [0.5, 0.3];
  verifyApprox(Math.max(0, good[0] - good[1] + margin), 0, 1e-12, 'satisfied triplet loss');
  verifyApprox(Math.max(0, bad[0] - bad[1] + margin), 0.3, 1e-12, 'active triplet loss');

  const dPos = s.value(good[0]);
  const dNeg = s.value(good[1]);
  const hiRule = s.value(0);
  const showZero = s.value(0);
  const showActive = s.value(0);
  const hiContract = s.value(0);

  const title = heroTitle(['Triplet margin loss:', 'distance gap vs. hinge'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.focus,
  });

  const formula = glowTex('\\mathcal{L} = \\max(0,\\; d_+ - d_- + m)', {
    x: 420,
    y: -415,
    size: 38,
    color: ROLE.focus,
    glow: 7,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const dp = dPos.value;
    const dn = dNeg.value;
    const rawGap = dp - dn + margin;
    const lossVal = Math.max(0, rawGap);
    const sz = showZero.value;
    const sa = showActive.value;
    const hc = hiContract.value;
    const nodes = [];

    // Left side: Dual distance rulers (0.0 to 0.7) with glowing margin band [d+, d+ + m]
    const rulerX = -820;
    const rulerW = 820;
    const rPos = glowRuler({
      x: rulerX,
      y: -140,
      width: rulerW,
      min: 0,
      max: 0.7,
      ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      title: `POSITIVE DISTANCE  d₊ = ${dp.toFixed(2)}   (margin m = +0.10)`,
      titleColor: ROLE.positive,
      band: {
        from: dp,
        to: Math.min(0.7, dp + margin),
        color: ROLE.focus,
        label: '+0.1 margin',
        height: 28,
        fillAlpha: 0.3,
      },
      points: [{ value: dp, color: ROLE.positive, label: 'd₊', below: true, dy: 4 }],
    });
    const rNeg = glowRuler({
      x: rulerX,
      y: 165,
      width: rulerW,
      min: 0,
      max: 0.7,
      ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      title: `NEGATIVE DISTANCE  d₋ = ${dn.toFixed(2)}   (smaller = closer)`,
      titleColor: ROLE.competitor,
      points: [{ value: dn, color: ROLE.competitor, label: 'd₋', below: false, dy: -8 }],
    });
    nodes.push(rPos.node, rNeg.node);

    // Horizontal gap indicator cleanly in the open lane between rulers (y = 18, zero text crossings!)
    const edgeX = rPos.mapX(dp + margin);
    const negX = rNeg.mapX(dn);
    const violated = dp + margin > dn;
    nodes.push(
      line([edgeX, -22], [edgeX, 55], {
        stroke: violated ? ROLE.competitor : ROLE.focus,
        width: 2.6,
        dash: [7, 6],
      }).opacity(0.85),
    );
    if (Math.abs(edgeX - negX) > 12) {
      nodes.push(
        arrow([negX, 18], [edgeX, 18], {
          stroke: violated ? ROLE.competitor : ROLE.positive,
          width: 3.4,
          tip: 12,
        }).glow(7, violated ? ROLE.competitor : ROLE.positive),
      );
    }

    // Divider between rulers and hinge plot
    nodes.push(rule(85, -300, 85, 290, COSMOS.rule, 1.8).opacity(0.55));

    // Right side: Live ReLU hinge curve max(0, x) for x = d+ - d- + m in [-0.4, 0.5]
    const px0 = 185;
    const py0 = 180;
    const plotW = 630;
    const plotH = 320;
    const mapHX = (x) => px0 + ((x - -0.4) / 0.9) * plotW;
    const mapHY = (y) => py0 - (y / 0.5) * plotH;

    const zeroHX = mapHX(0);
    nodes.push(
      txt('HINGE LOSS CURVE', px0 + plotW / 2, -215, 26, COSMOS.muted, 'mono', 'center'),
      line([px0, py0], [px0 + plotW, py0], { stroke: '#4c6294', width: 2.2 }),
      line([zeroHX, py0 + 18], [zeroHX, py0 - plotH - 18], { stroke: '#4c6294', width: 2.2 }),
      txt('0', zeroHX, py0 + 40, 26, COSMOS.muted, 'mono', 'center'),
      txt('d₊ − d₋ + m', px0 + plotW - 10, py0 + 44, 26, COSMOS.muted, 'mono', 'right'),
      txt('0.5', zeroHX - 24, mapHY(0.5), 26, COSMOS.dim, 'mono', 'right'),
      // Flat zero segment [-0.4, 0] + linear active ramp [0, 0.5]
      glowingTrail(
        [
          [mapHX(-0.4), mapHY(0)],
          [mapHX(0), mapHY(0)],
        ],
        { color: ROLE.positive, width: 4.5, glow: 8 },
      ),
      glowingTrail(
        [
          [mapHX(0), mapHY(0)],
          [mapHX(0.5), mapHY(0.5)],
        ],
        { color: ROLE.competitor, width: 4.5, glow: 10 },
      ),
    );

    // Live tracer bead on the hinge curve
    const bx = mapHX(rawGap);
    const by = mapHY(lossVal);
    const bCol = lossVal > 0.001 ? ROLE.competitor : ROLE.positive;
    nodes.push(
      line([bx, py0], [bx, by], { stroke: bCol, width: 2, dash: [5, 5] }).opacity(0.7),
      glowDot(bx, by, { radius: 10, color: bCol, glow: 15 }),
      glowDot(bx, by, { radius: 4.5, color: '#ffffff', glow: 8 }),
    );

    // Bottom readout strip (withholds loss before cue!)
    const footY = 360;
    nodes.push(rule(-850, 290, 850, 290, COSMOS.rule, 1.6).opacity(0.55));
    if (sa > 0.05) {
      nodes.push(
        txt(
          `d₊ − d₋ + m = 0.5 − 0.3 + 0.1 = +0.300   ->   loss = 0.300`,
          0,
          footY - 8,
          36,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(8, ROLE.competitor)
          .opacity(sa),
        txt(
          hc > 0.3
            ? 'Satisfied triplet gives 0 grad · InfoNCE keeps every row candidate active'
            : 'Margin violated -> hinge active',
          0,
          footY + 42,
          26,
          hc > 0.3 ? ROLE.focus : COSMOS.muted,
          'sans',
          'center',
        ).opacity(sa),
      );
    } else if (sz > 0.05) {
      nodes.push(
        txt(
          `d₊ − d₋ + m = 0.2 − 0.5 + 0.1 = −0.200   ->   clipped to loss = 0.000`,
          0,
          footY + 12,
          34,
          ROLE.positive,
          'mono',
          'center',
        )
          .glow(7, ROLE.positive)
          .opacity(sz),
      );
    } else {
      nodes.push(
        txt(
          'Compare positive distance d₊ against negative distance d₋ on one declared distance scale',
          0,
          footY + 12,
          30,
          hiRule.value > 0.3 ? ROLE.focus : COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.positive), title, formula, stageLayer);

  playOn(s, c, 'cl-triplet-margin-rule', (d) => hiRule.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-triplet-margin-zero', (d) => showZero.to(1, { duration: d }), 0.45);
  playOn(
    s,
    c,
    'repair-triplet-inputs',
    (d) => [
      showZero.to(0, { duration: Math.min(0.25, d) }),
      dPos.to(bad[0], { duration: d }),
      dNeg.to(bad[1], { duration: d }),
    ],
    1.1,
  );
  playAfter(s, c, 'cl-triplet-margin-active', (d) => showActive.to(1, { duration: d }), 0.5);
  playOn(s, c, 'cl-triplet-margin-contract', (d) => hiContract.to(1, { duration: d }), 0.45);
}
