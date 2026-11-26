// Scene 10: What earns credit at the comma? (Softmax probability strip, cross-entropy & logit step)
import {
  COSMOS,
  LOSS_BEFORE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lossStep,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function loss(s, c) {
  const phase = s.value(0);
  const showExp = s.value(0);
  const showShare = s.value(0);
  const showPenalty = s.value(0);
  const stepProg = s.value(0);

  const bgAura = aura(0, 0, 640, '#222b6626', '#3d1f5414');
  const title = heroTitle(['What Earns Credit', 'at the Comma?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SOFTMAX & CROSS-ENTROPY · LIVE LOGIT GRADIENT STEP',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ex = showExp.value;
    const sh = showShare.value;
    const pen = showPenalty.value;
    const st = stepProg.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const cur = lossStep(st);
    const colors = [COSMOS.cyan, COSMOS.gold, COSMOS.violet, COSMOS.blue];
    const colW = 360;
    const gap = 36;
    const x0 = -594;
    const cardY = -125;

    const nodes = [
      txt('FOUR SCORES -> EXPONENTIAL WEIGHTS', -855, cardY - 96, 26, COSMOS.muted, 'mono', 'left'),
    ];

    cur.outputPieces.forEach((piece, i) => {
      const cx = x0 + i * (colW + gap);
      const isTarget = i === cur.targetIndex;
      const col = colors[i];
      const grad = LOSS_BEFORE.probabilities[i] - (isTarget ? 1 : 0);
      nodes.push(
        glassCell(cx, cardY, colW, 130, col, {
          fill: isTarget ? '#251e0e' : '#0f1b32',
          glow: isTarget ? 9 * pulse : 4,
        }),
        txt(`${piece}   z = ${cur.logits[i].toFixed(2)}`, cx, cardY - 30, 32, col, 'mono'),
      );
      if (ex > 0.05) {
        nodes.push(
          txt(`e^z = ${cur.weights[i].toFixed(2)}`, cx, cardY + 24, 28, COSMOS.ink, 'mono').opacity(
            ex,
          ),
        );
      }
      if (st > 0.05) {
        nodes.push(
          txt(
            `grad = ${grad >= 0 ? '+' : ''}${grad.toFixed(2)}`,
            cx,
            cardY + 96,
            26,
            isTarget ? COSMOS.emerald : COSMOS.rose,
            'mono',
          ).opacity(st),
        );
      }
    });

    // Conserved glowing probability strip (sum = 100%)
    const stripW = 1548;
    const stripH = 82;
    const sx0 = -774;
    const sy = 112;

    const stripOp = Math.max(0.35, ex);
    nodes.push(
      txt(
        ex > 0.1
          ? `CONSERVED PROBABILITY STRIP  (Z = ${cur.sum.toFixed(2)})`
          : 'PROBABILITY STRIP (NORMALIZE e^z BY SUM Z)',
        sx0,
        sy - 72,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(stripOp),
      rect(stripW, stripH, { fill: '#111626', stroke: COSMOS.rule, width: 2, radius: 10 })
        .at(0, sy)
        .opacity(stripOp),
    );
    if (ex > 0.05) {
      let cursor = sx0;
      cur.probabilities.forEach((prob, i) => {
        const w = Math.max(8, prob * stripW);
        const col = colors[i];
        const isTarget = i === cur.targetIndex;
        nodes.push(
          rect(w - 4, stripH - 4, { fill: col, stroke: COSMOS.bg, width: 2, radius: 8 })
            .at(cursor + w * 0.5, sy)
            .glow(isTarget ? 10 * pulse : 4, col)
            .opacity((sh > 0.3 || !isTarget ? 0.92 : 0.45) * ex),
        );
        if (w > 220) {
          const label =
            isTarget && sh < 0.4 ? '↵  ?' : `${cur.outputPieces[i]} ${(prob * 100).toFixed(1)}%`;
          nodes.push(txt(label, cursor + w * 0.5, sy + 2, 28, COSMOS.bg, 'mono').opacity(ex));
        }
        cursor += w;
      });
    }

    // Bottom metrics: target share & cross-entropy loss (withhold values until cues, keep clean placeholders so lower frame is balanced)
    const shOp = Math.max(0.42, sh);
    const penOp = Math.max(0.42, pen);
    nodes.push(
      txt('TARGET SHARE  p(↵)', -774, 245, 26, COSMOS.muted, 'mono', 'left').opacity(shOp),
      txt(
        sh > 0.5 ? `${(cur.probabilities[1] * 100).toFixed(1)}%` : '? %',
        -774,
        318,
        64,
        COSMOS.gold,
        'mono',
        'left',
      )
        .glow(sh > 0.5 ? 9 : 3, COSMOS.gold)
        .opacity(shOp),
      txt('CROSS-ENTROPY PENALTY  -ln p(↵)', -220, 245, 26, COSMOS.muted, 'mono', 'left').opacity(
        penOp,
      ),
      txt(
        pen > 0.5 ? `${cur.loss.toFixed(3)} nats` : '? nats',
        -220,
        318,
        64,
        st > 0.5 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      )
        .glow(pen > 0.5 ? 9 : 3, st > 0.5 ? COSMOS.emerald : COSMOS.rose)
        .opacity(penOp),
    );

    if (st > 0.1) {
      nodes.push(
        txt(
          'z_new = z - 0.5 * (p - y)  ->  gold share widens, penalty falls',
          -774,
          395,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        ).opacity(st),
      );
    }

    return group(...nodes);
  });

  const eqLoss = glowTex('\\mathcal{L} = -\\ln p(\\hookleftarrow)', {
    x: 540,
    y: 300,
    size: 46,
    color: COSMOS.gold,
    glow: 7,
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('exp-sum', () => s.play(showExp.to(1, { duration: 0.55 })));
  c.after('target-share', () =>
    s.play(showShare.to(1, { duration: remainDuration(c, 'target-share', 0.45) })),
  );
  c.after('score-target', () => {
    const dur = remainDuration(c, 'score-target', 0.45);
    s.play(showPenalty.to(1, { duration: dur }));
  });
  c.show('score-target', eqLoss, { after: true, fade: 0.4 });
  c.on('step-logits', () =>
    s.play(stepProg.to(1, { duration: remainDuration(c, 'step-logits', 1.1) })),
  );
}
