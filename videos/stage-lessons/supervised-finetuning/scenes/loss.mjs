// Scene 07: What does this example contribute?: NLL loss columns + live -ln(p) curve + END drop prediction.
import {
  COSMOS,
  LOSS_CLIPPED,
  LOSS_FULL,
  REPLY_PROBS,
  TOKENS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  targetLoss,
  txt,
} from '../parts.mjs';

export default function loss(s, c) {
  const phase = s.value(0);
  const showLogs = s.value(0);
  const showSum = s.value(0);
  const showMean = s.value(0);
  const whatIf = s.value(0);
  const removedEnd = s.value(0);
  const showTwoMean = s.value(0);

  const bgAura = aura(-120, 40, 620, '#6ee7b71e', '#5ce1e614');
  const title = heroTitle(['Negative Log-Likelihood', '& Missing Stop Signal'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.emerald,
    eyebrow: 'PER-TOKEN CROSS-ENTROPY LOSS',
  });

  const eqNll = glowTex(String.raw`\mathcal{L} = -\frac{1}{N}\sum_{t \in \text{active}} \ln p_t`, {
    x: 470,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  // Right-side continuous -ln(p) curve coordinates
  const cx0 = 270;
  const cx1 = 830;
  const cyBot = 160;
  const cyTop = -210;
  const mapP = (p) => cx0 + ((p - 0.15) / (1.0 - 0.15)) * (cx1 - cx0);
  const mapL = (l) => cyBot - (Math.min(1.6, l) / 1.6) * (cyBot - cyTop);
  const curvePts = Array.from({ length: 42 }, (_, i) => {
    const pv = 0.22 + (i / 41) * 0.76;
    return [mapP(pv), mapL(targetLoss(pv))];
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const lg = showLogs.value;
    const sm = showSum.value;
    const mn = showMean.value;
    const wi = whatIf.value;
    const rem = removedEnd.value;
    const two = showTwoMean.value;
    const pulse = 0.75 + 0.25 * Math.sin(p * 3.6);

    const activeState = rem > 0.5 ? LOSS_CLIPPED : LOSS_FULL;
    const colXs = [-680, -350, -20];
    const baseY = 160;
    const scaleH = 440;

    const nodes = [
      // Left: 3 target loss columns
      txt('ACTIVE TARGETS & −ln(p) LOSS BARS', -840, -238, 26, COSMOS.muted, 'mono', 'left'),
      line([-840, baseY], [140, baseY], { stroke: '#33446b', width: 2.5 }),
      // Right: Continuous -ln(p) curve
      txt('−ln(p) CURVE', (cx0 + cx1) * 0.5, -242, 26, COSMOS.cyan, 'mono'),
      line([cx0, cyBot], [cx1, cyBot], { stroke: '#33446b', width: 2.2 }),
      line([cx0, cyBot], [cx0, cyTop], { stroke: '#33446b', width: 2.2 }),
      txt('p = 0.2', cx0 + 25, cyBot + 32, 26, COSMOS.dim, 'mono'),
      txt('p = 1.0', cx1 - 20, cyBot + 32, 26, COSMOS.dim, 'mono'),
      glowingTrail(curvePts, { color: COSMOS.cyan, width: 3.5, glow: 8 }),
    ];

    REPLY_PROBS.forEach((prob, i) => {
      const x = colXs[i];
      const lossVal = LOSS_FULL.losses[i];
      const isOff = rem > 0.5 && i === 2;
      const isQuestion = wi > 0.5 && rem < 0.5 && i === 2;
      const barCol = isOff ? COSMOS.dim : isQuestion ? COSMOS.amber : COSMOS.emerald;
      const barH = Math.max(8, lossVal * scaleH * lg);

      // Token header pill above bar
      nodes.push(
        glassCell(x, -165, 250, 74, isOff ? COSMOS.rose : COSMOS.blue, {
          fill: isOff ? '#1e1120' : '#101b32',
          dash: isQuestion ? [8, 5] : undefined,
          glow: isOff ? 6 : 7,
        }),
        txt(
          `${TOKENS[5 + i]}  p=${prob.toFixed(1)}`,
          x,
          -165,
          28,
          isOff ? COSMOS.rose : COSMOS.ink,
          'mono',
        ),
      );

      // Growing NLL bar (place numeric loss neatly below baseline so mean beam never crosses it)
      if (lg > 0.05) {
        nodes.push(
          rect(168, barH, {
            fill: isOff ? '#1b2030' : '#103534',
            stroke: barCol,
            width: 2.6,
            dash: isOff ? [8, 5] : undefined,
            radius: 8,
          })
            .at(x, baseY - barH * 0.5)
            .glow(isOff ? 0 : 9 * pulse, barCol)
            .opacity(isOff ? 0.52 : 0.94),
          txt(
            isOff ? '−100' : lossVal.toFixed(3),
            x,
            baseY + 38,
            30,
            isOff ? COSMOS.rose : barCol,
            'mono',
          ),
        );
      }

      // Corresponding point on -ln(p) curve
      const px = mapP(prob);
      const py = mapL(lossVal);
      nodes.push(
        glowDot(px, py, {
          radius: isOff ? 6 : 9,
          color: isOff ? COSMOS.rose : COSMOS.emerald,
          opacity: isOff ? 0.45 : 1,
        }),
        txt(
          TOKENS[5 + i],
          px + 18,
          py - 28,
          26,
          isOff ? COSMOS.rose : COSMOS.emerald,
          'mono',
          'left',
        ),
      );
    });

    // Horizontal mean beam across the 3 bars
    if (mn > 0.5 && (rem < 0.5 || two > 0.5)) {
      const meanY = baseY - activeState.mean * scaleH;
      const mCol = rem > 0.5 ? COSMOS.amber : COSMOS.gold;
      nodes.push(
        line([-835, meanY], [135, meanY], { stroke: mCol, width: 3.5, dash: [10, 6] }).glow(
          8,
          mCol,
        ),
        txt(`mean ${activeState.mean.toFixed(3)}`, 132, meanY - 26, 26, mCol, 'mono', 'right'),
      );
    }

    // Bottom readout strip (strict withholding during what-if beat 2!)
    let sumLine = 'Take −ln(p) for each active reply token';
    let meanLine = 'Less likely targets pay a larger cross-entropy penalty';
    let footCol = COSMOS.cyan;

    if (wi > 0.5 && rem < 0.5) {
      sumLine = 'WHAT IF THE COLLATOR IGNORES "END"?';
      meanLine = 'Which term leaves the sum, and what happens to the divisor?';
      footCol = COSMOS.gold;
    } else if (rem > 0.5 && two < 0.5) {
      sumLine = `END masked (−100)  ·  Sum = ${LOSS_CLIPPED.sum.toFixed(3)}  ·  Active targets = ${LOSS_CLIPPED.count}`;
      meanLine = 'Computing new mean over 2 remaining targets…';
      footCol = COSMOS.amber;
    } else if (rem > 0.5 && two > 0.5) {
      sumLine = `Sum = ${LOSS_CLIPPED.sum.toFixed(3)} ÷ ${LOSS_CLIPPED.count} active targets`;
      meanLine = `Mean rises to ${LOSS_CLIPPED.mean.toFixed(3)} nats  (easiest stop token lost!)`;
      footCol = COSMOS.rose;
    } else if (mn > 0.5) {
      sumLine = `Sum = ${LOSS_FULL.sum.toFixed(3)}  ÷  ${LOSS_FULL.count} active targets`;
      meanLine = `Mean loss = ${LOSS_FULL.mean.toFixed(3)} nats per target (equal vote)`;
      footCol = COSMOS.emerald;
    } else if (sm > 0.5) {
      sumLine = `Three losses sum to ${LOSS_FULL.sum.toFixed(3)} nats`;
      meanLine = 'Divide by 3 active targets for the example mean';
      footCol = COSMOS.gold;
    }

    nodes.push(
      glassCell(0, 325, 1660, 140, footCol, { fill: '#101829', glow: 9 }),
      txt(sumLine, 0, 294, 32, COSMOS.ink, 'mono'),
      txt(meanLine, 0, 356, 32, footCol, 'mono').glow(6, footCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqNll, live);
  runPhase(s, c, phase, 14);

  c.on('loss-terms', () => s.play(showLogs.to(1, { duration: 0.75 })));
  c.after('loss-sum', () => s.play(showSum.to(1, { duration: 0.35 })));
  c.after('loss-mean', () => s.play(showMean.to(1, { duration: 0.35 })));
  c.on('loss-what-if', () => s.play(whatIf.to(1, { duration: 0.45 })));
  c.after('loss-remove', () => s.play(removedEnd.to(1, { duration: 0.45 })));
  c.after('loss-two', () =>
    s.play(showTwoMean.to(1, { duration: remainDuration(c, 'loss-two', 0.45) })),
  );
}
