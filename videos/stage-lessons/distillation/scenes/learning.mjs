// Scene 05: Move logits, then normalize again (Gradient descent on logits & cat prediction)
import {
  COSMOS,
  TEACHER_PROBS,
  TRACE_40,
  WORDS,
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
  remainAfterDuration,
  remainDuration,
  runPhase,
  stableSoftmax,
  txt,
} from '../parts.mjs';

export default function learning(s, c) {
  const phase = s.value(0);
  const sGrad = s.value(0);
  const stepVal = s.value(0); // 0 -> 12 on learning-b2-1, then 12 -> 13 AFTER distill-cat-lower!
  const sAsk = s.value(0);
  const sPos = s.value(0);
  const sLower = s.value(0);

  const bgAura = aura(320, 40, 580, '#13355c26', '#2e1d5214');
  const title = heroTitle(['Move Logits, Then', 'Normalize Again'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'LOGIT GRADIENT DESCENT · SOFTMAX COUPLING',
  });

  const eqGrad = glowTex('\\frac{\\partial L}{\\partial z_i} = p_i - q_i', {
    x: 460,
    y: -365,
    size: 40,
    color: COSMOS.gold,
    glow: 7,
  });

  const plotX0 = 155;
  const plotX1 = 815;
  const plotYBot = 178;
  const plotYTop = -126;
  const maxLoss = Math.max(0.7, TRACE_40[0].loss * 1.05);
  const mapX = (st) => plotX0 + (st / 16) * (plotX1 - plotX0);
  const mapY = (loss) => plotYBot - (loss / maxLoss) * (plotYBot - plotYTop);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const stFloat = Math.max(0, Math.min(13, stepVal.value));
    const idx0 = Math.floor(stFloat);
    const idx1 = Math.min(13, idx0 + 1);
    const frac = stFloat - idx0;
    const logits = TRACE_40[idx0].logits.map((v, i) => v + (TRACE_40[idx1].logits[i] - v) * frac);
    const probs = stableSoftmax(logits);
    const loss = TRACE_40[idx0].loss + (TRACE_40[idx1].loss - TRACE_40[idx0].loss) * frac;

    const ask = sAsk.value;
    const pos = sPos.value;
    const low = sLower.value;
    const base12 = TRACE_40[12];
    const next13 = TRACE_40[13];
    const catGrad = base12.probs[2] - TEACHER_PROBS[2];

    const baseY = 178;
    const maxH = 260;

    const nodes = [
      // Left: Paired Teacher vs Student bars
      txt('TEACHER q', -645, -158, 28, COSMOS.blue, 'mono'),
      txt(`STUDENT p (step ${Math.round(stFloat)})`, -195, -158, 28, COSMOS.cyan, 'mono'),
      line([-840, baseY], [-450, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      line([-390, baseY], [0, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    WORDS.forEach((word, i) => {
      const tx = -790 + i * 96;
      const sx = -340 + i * 96;
      const th = Math.max(12, TEACHER_PROBS[i] * maxH);
      const sh = Math.max(12, probs[i] * maxH);
      const isCat = i === 2 && ask > 0.3;

      nodes.push(
        rect(60, th, {
          fill: isCat ? '#3b2e0e' : '#17386b',
          stroke: isCat ? COSMOS.gold : COSMOS.blue,
          width: 2.4,
          radius: 6,
        })
          .at(tx, baseY - th * 0.5)
          .glow(isCat ? 8 * pulse : 3, isCat ? COSMOS.gold : COSMOS.blue),
        txt(TEACHER_PROBS[i].toFixed(2), tx, baseY - th - 22, 26, COSMOS.blue, 'mono'),
        txt(word, tx, baseY + 34, 26, isCat ? COSMOS.gold : COSMOS.muted, 'mono'),

        rect(60, sh, {
          fill: isCat ? '#3b2e0e' : '#0e3c50',
          stroke: isCat ? COSMOS.gold : COSMOS.cyan,
          width: 2.4,
          radius: 6,
        })
          .at(sx, baseY - sh * 0.5)
          .glow(isCat ? 8 * pulse : 3, isCat ? COSMOS.gold : COSMOS.cyan),
        txt(
          probs[i].toFixed(2),
          sx,
          baseY - sh - 22,
          26,
          isCat ? COSMOS.gold : COSMOS.cyan,
          'mono',
        ),
        txt(word, sx, baseY + 34, 26, isCat ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    });

    // Right: KL descent trajectory
    nodes.push(
      txt('FORWARD KL DESCENT', plotX0, plotYTop - 44, 26, COSMOS.gold, 'mono', 'left'),
      line([plotX0, plotYBot], [plotX1 + 18, plotYBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([plotX0, plotYBot], [plotX0, plotYTop - 16], { stroke: COSMOS.rule, width: 2.2 }),
      txt('step 0', plotX0, plotYBot + 34, 26, COSMOS.muted, 'mono', 'left'),
      txt('step 13', mapX(13), plotYBot + 34, 26, COSMOS.muted, 'mono'),
    );

    // Ghost full reference curve up to step 13
    const refPts = TRACE_40.slice(0, 14).map((row) => [mapX(row.step), mapY(row.loss)]);
    nodes.push(
      glowingTrail(refPts, { color: COSMOS.dim, width: 2.2, opacity: 0.35, glow: 0, core: false }),
    );

    const activePts = TRACE_40.slice(0, idx0 + 1).map((row) => [mapX(row.step), mapY(row.loss)]);
    if (frac > 0.02) activePts.push([mapX(stFloat), mapY(loss)]);
    if (activePts.length >= 2) {
      nodes.push(glowingTrail(activePts, { color: COSMOS.gold, width: 4.2, glow: 9 }));
    }
    nodes.push(
      glowDot(mapX(stFloat), mapY(loss), { radius: 8, color: COSMOS.gold }),
      txt(`KL = ${loss.toFixed(3)}`, plotX1, plotYTop - 44, 28, COSMOS.gold, 'mono', 'right'),
    );

    // Bottom status / prediction panel (strictly withheld until distill-cat-positive / distill-cat-lower!)
    let bannerText = 'z_i <- z_i - eta * (p_i - q_i)   (update logits, then re-normalize)';
    let bannerCol = COSMOS.cyan;
    if (ask > 0.3 && pos < 0.5) {
      bannerText = `Cat logit at step 12: ${base12.logits[2].toFixed(3)}  ->  should descent raise or lower it?`;
      bannerCol = COSMOS.gold;
    } else if (pos >= 0.5 && low < 0.5) {
      bannerText = `Cat p > q  ->  gradient = +${catGrad.toFixed(3)} (positive)`;
      bannerCol = COSMOS.amber;
    } else if (low >= 0.5) {
      bannerText = `Descent lowers cat logit: ${base12.logits[2].toFixed(3)} -> ${next13.logits[2].toFixed(3)}`;
      bannerCol = COSMOS.emerald;
    } else if (sGrad.value > 0.3 && stFloat < 0.5) {
      bannerText = 'Negative gradient raises logit (bird/dog) · Positive lowers logit (cat/tree)';
      bannerCol = COSMOS.cyan;
    }

    nodes.push(
      glassCell(0, 326, 1620, 88, bannerCol, {
        fill: '#101b30',
        dash: ask > 0.3 && pos < 0.5 ? [8, 6] : undefined,
        glow: 7 * pulse,
      }),
      txt(bannerText, 0, 328, 28, bannerCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqGrad, live);
  runPhase(s, c, phase, 14);

  c.on('learning-b1-1', () => s.play(sGrad.to(1, { duration: 0.45 })));
  c.on('learning-b2-1', () =>
    s.play(stepVal.to(12, { duration: remainDuration(c, 'learning-b2-1', 2.4) })),
  );
  c.on('learning-b3-1', () => s.play(sAsk.to(1, { duration: 0.4 })));
  c.after('distill-cat-positive', () =>
    s.play(sPos.to(1, { duration: remainAfterDuration(c, 'distill-cat-positive', 0.4) })),
  );
  c.after('distill-cat-lower', () => {
    const dur = remainAfterDuration(c, 'distill-cat-lower', 0.8);
    s.play(sLower.to(1, { duration: 0.35 }));
    s.play(stepVal.to(13, { duration: dur }));
  });
}
