// Scene 12: shift-count: "Count the labels that survive the causal shift"
// View 1 (Beats 0-1): Two padded rows ([-100, 1, 2] and [-100, -100, 3]). Glowing diagonal
//   causal-shift beams pair logits[0..1] -> labels[1..2], yielding 2 + 1 = 3 valid targets
//   vs the broken unshifted subtraction (3 - 2 = 1).
// View 2 (Beat 2): Uneven-loss batch (0.2, 0.2, 2.0) leveling to equal token mean 0.80 vs
//   biased mean-of-row-means 1.10, plus the empty-batch / NaN guard.
import { arrow } from 'vizmatic/stage';
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
  corpusLoss,
  fmt,
  lumBar,
  playCue,
  shiftedTargetCount,
  swapVis,
} from '../parts.mjs';

export default function shiftCount(s, c) {
  const rows = [
    [-100, 1, 2],
    [-100, -100, 3],
  ];
  const validTotal = shiftedTargetCount(rows); // 3
  const unevenMean = corpusLoss([
    { loss: 0.2, count: 2 },
    { loss: 2.0, count: 1 },
  ]).mean; // 0.8

  const title = heroTitle(['Count the labels that', 'survive the causal shift'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.good,
  });

  const vShift = s.value(1);
  const vWeight = s.value(0);

  // View 1 state
  const pairBeam = s.value(0); // illuminates diagonal logit -> next-label arrows
  const validVis = s.value(0); // reveals 2 + 1 = 3
  const wrongVis = s.value(0); // shows wrong 3 - 2 = 1 counter

  // View 2 state
  const levelT = s.value(0); // levels bars [0.2, 0.2, 2.0] toward mean 0.80
  const emptyVis = s.value(0); // empty batch guard

  // VIEW 1: Padded causal-shift pairing diagram
  const shiftLayer = guardedDynamic(vShift, (alpha) => {
    const nodes = [];
    const pb = pairBeam.value;
    const vv = validVis.value;
    const wv = wrongVis.value;

    const colXs = [-380, 75, 530];
    const rowYs = [-135, 130];

    nodes.push(
      txt(
        'Padded batch  ·  ignore = -100  ·  logit t predicts label t + 1',
        0,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    rows.forEach((row, r) => {
      const ry = rowYs[r];
      nodes.push(txt(`Row ${r + 1}`, -740, ry, 34, ROLE.context, 'mono', 'left').opacity(alpha));

      row.forEach((val, i) => {
        const cx = colXs[i];
        const survives = i > 0 && val !== -100;
        const col = survives ? ROLE.good : COSMOS.dim;

        nodes.push(
          txt(`label[${i}]`, cx, ry - 64, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
          lumBar(cx, ry, 230, 76, {
            color: col,
            fillOpacity: survives ? 0.34 : 0.1,
            strokeWidth: survives ? 2.8 : 1.6,
            glow: survives ? 10 : 2,
            radius: 10,
            opacity: alpha,
          }),
          txt(
            val === -100 ? 'ignore (-100)' : String(val),
            cx,
            ry,
            28,
            col,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Diagonal causal pairing arrow from logits[i-1] up to label[i]
        if (i > 0 && pb > 0.05) {
          const fromX = colXs[i - 1];
          const fromY = ry + 95;
          nodes.push(
            txt(`logits[${i - 1}]`, fromX, fromY + 34, 26, ROLE.context, 'mono', 'center').opacity(
              pb * alpha,
            ),
            arrow([fromX + 20, fromY], [cx - 32, ry + 48], {
              stroke: survives ? ROLE.good : ROLE.context,
              width: 3.4,
              tip: 13,
            })
              .glow(survives ? 8 : 4, survives ? ROLE.good : ROLE.context)
              .opacity(pb * alpha),
          );
        }
      });
    });

    // Bottom verdict (correct 2 + 1 = 3 vs wrong 3 - 2 = 1)
    if (wv > 0.25) {
      nodes.push(
        txt(
          'Wrong unshifted rule:  3 - 2 rows = 1  (throws away 2 valid targets!)',
          0,
          355,
          32,
          ROLE.warn,
          'mono',
          'center',
        )
          .glow(8, ROLE.warn)
          .opacity(wv * alpha),
      );
    } else if (vv > 0.25) {
      nodes.push(
        txt(
          `Surviving valid targets after shift:  2 + 1 = ${validTotal}`,
          0,
          355,
          36,
          ROLE.good,
          'mono',
          'center',
        )
          .glow(9, ROLE.good)
          .opacity(vv * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Pair logits[:, :-1] with labels[:, 1:] before counting valid targets.',
          0,
          355,
          30,
          ROLE.observed,
          'serif',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Uneven-loss batch weighting (token mean 0.80 vs mean of row means 1.10)
  const weightLayer = guardedDynamic(vWeight, (alpha) => {
    const nodes = [];
    const lt = levelT.value;
    const ev = emptyVis.value;

    const baseY = 170;
    const pxPerNat = 165;
    const rawVals = [0.2, 0.2, 2.0];
    const xs = [-645, -415, -185];
    const labels = ['Row 1 · t1', 'Row 1 · t2', 'Row 2 · t1'];
    const cols = [ROLE.context, ROLE.context, ROLE.warn];

    nodes.push(
      txt(
        'Uneven batch: Row 1 has 2 targets (0.2 each), Row 2 has 1 target (2.0)',
        0,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowingTrail(
        [
          [-770, baseY],
          [-55, baseY],
        ],
        { color: '#506496', width: 2.5, glow: 4, core: false, opacity: alpha },
      ),
    );

    rawVals.forEach((v, i) => {
      const curV = v + (unevenMean - v) * lt;
      const h = Math.max(18, curV * pxPerNat);
      nodes.push(
        lumBar(xs[i], baseY - h / 2, 152, h, {
          color: cols[i],
          fillOpacity: 0.44,
          strokeWidth: 2.6,
          glow: 9,
          radius: 8,
          opacity: alpha,
        }),
        txt(labels[i], xs[i], baseY + 40, 26, cols[i], 'mono', 'center').opacity(alpha),
        txt(fmt(curV, 2), xs[i], baseY + 84, 28, cols[i], 'mono', 'center').opacity(alpha),
      );
    });

    // True token mean line (0.80) vs biased mean of row means (1.10), labels cleanly on right!
    const meanY = baseY - unevenMean * pxPerNat;
    const rowMeanY = baseY - 1.1 * pxPerNat;
    nodes.push(
      glowingTrail(
        [
          [-755, meanY],
          [-55, meanY],
        ],
        { color: ROLE.good, width: 3.6, glow: 10, opacity: (0.4 + 0.6 * lt) * alpha },
      ),
      glowDot(-55, meanY, { radius: 7, color: ROLE.good, glow: 10, opacity: alpha }),
      txt(`Equal token mean = ${fmt(unevenMean, 2)}`, 15, meanY + 28, 32, ROLE.good, 'mono', 'left')
        .glow(7, ROLE.good)
        .opacity(alpha),
      glowingTrail(
        [
          [-755, rowMeanY],
          [-55, rowMeanY],
        ],
        { color: ROLE.warn, width: 2.4, glow: 5, core: false, opacity: 0.72 * alpha },
      ),
      glowDot(-55, rowMeanY, { radius: 6, color: ROLE.warn, glow: 8, opacity: alpha }),
      txt('Row-mean avg = 1.10 (biased)', 15, rowMeanY - 28, 30, ROLE.warn, 'mono', 'left').opacity(
        alpha,
      ),
    );

    nodes.push(
      txt(
        ev > 0.35
          ? '0 valid targets: skip batch contribution; reject an empty eval (avoids NaN).'
          : 'Sum losses and shifted target counts across workers before dividing.',
        0,
        355,
        30,
        ev > 0.35 ? ROLE.warn : ROLE.observed,
        'mono',
        'center',
      )
        .glow(ev > 0.35 ? 8 : 5, ev > 0.35 ? ROLE.warn : ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.good, ROLE.warn), title, shiftLayer, weightLayer);

  // Beat 0: draw diagonal causal shift pairs -> reveal 2 + 1 = 3
  playCue(s, c, 'causal-pairs', (d) => s.play(pairBeam.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'valid-count', (d) => s.play(validVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 1: reveal why unshifted 3 - 2 = 1 fails
  playCue(s, c, 'wrong-counter', (d) => s.play(wrongVis.to(1, { duration: d })), { dur: 0.6 });

  // Beat 2: swap to uneven-loss weighting & empty-batch NaN guard
  c.onBeat(2, () => s.play(swapVis(vShift, vWeight, 0.55)));
  playCue(s, c, 'row-weight', (d) => s.play(levelT.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'empty-targets', (d) => s.play(emptyVis.to(1, { duration: d })), { dur: 0.55 });
}
