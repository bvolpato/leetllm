// Scene 10: Why did the reported mean fall?: Prompt-loss dilution (2.000 -> 0.596) + 800/830 scale bar.
import {
  ANSWER_LOSSES,
  ANSWER_MEAN,
  COMBINED_PROMPT_MEAN,
  COMBINED_PROMPT_SUM,
  COSMOS,
  PROMPT_LOSSES,
  SCALE_PROMPT_SHARE,
  SCALE_PROMPT_TOKENS,
  SCALE_REPLY_TOKENS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function promptMetric(s, c) {
  const phase = s.value(0);
  const showAnsMean = s.value(0);
  const addPrompt = s.value(0);
  const showScale = s.value(0);

  const bgAura = aura(120, 40, 620, '#6ee7b71a', '#60a5fa18');
  const title = heroTitle(['Why Did the', 'Mean Loss Fall?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.amber,
    eyebrow: 'PROMPT LOSS DILUTION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const am = showAnsMean.value;
    const ap = addPrompt.value;
    const sc = showScale.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const addedCount = Math.round(ap * PROMPT_LOSSES.length);
    const activeVals = [...PROMPT_LOSSES.slice(0, addedCount), ...ANSWER_LOSSES];
    const activeSum = activeVals.reduce((a, b) => a + b, 0);
    const activeMean = activeSum / activeVals.length;

    const baseY = 175;
    const scaleH = 165;
    const allVals = [...PROMPT_LOSSES, ...ANSWER_LOSSES];
    const barX = (i) => -690 + i * 230;

    const nodes = [
      txt('SUPPLIED PER-TOKEN LOSSES (NATS)', -820, -238, 26, COSMOS.muted, 'mono', 'left'),
      line([-825, baseY], [825, baseY], { stroke: '#33446b', width: 2.5 }),
    ];

    allVals.forEach((v, i) => {
      const x = barX(i);
      const isAns = i >= 5;
      const isActivePrompt = !isAns && i < addedCount;
      const col = isAns ? COSMOS.emerald : isActivePrompt ? COSMOS.blue : COSMOS.dim;
      const h = Math.max(12, v * scaleH);

      nodes.push(
        rect(144, h, {
          fill: isAns ? '#0e3633' : isActivePrompt ? '#13274a' : '#121625',
          stroke: col,
          width: isAns || isActivePrompt ? 2.6 : 1.5,
          radius: 7,
        })
          .at(x, baseY - h * 0.5)
          .glow(isAns ? 9 * pulse : isActivePrompt ? 7 : 0, col)
          .opacity(isAns || isActivePrompt ? 0.95 : 0.45),
        txt(
          v.toFixed(2),
          x,
          isAns ? baseY - 38 : baseY - h - 28,
          28,
          isAns ? COSMOS.ink : col,
          'mono',
        ),
        txt(isAns ? 'answer' : 'prompt', x, baseY + 34, 26, col, 'mono'),
      );
    });

    // Fixed Answer Mean line (2.000) across the two answer bars
    if (am > 0.05) {
      const yAns = baseY - ANSWER_MEAN * scaleH;
      nodes.push(
        line([barX(5) - 92, yAns], [barX(6) + 92, yAns], {
          stroke: COSMOS.emerald,
          width: 3.5,
          dash: [9, 5],
        })
          .glow(8, COSMOS.emerald)
          .opacity(am),
        txt(`Answer mean = ${ANSWER_MEAN.toFixed(3)}`, barX(5.5), -232, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(am),
      );
    }

    // Dynamic Combined Mean beam plunging from 2.000 down to 0.596!
    if (addedCount > 0) {
      const yComb = baseY - activeMean * scaleH;
      nodes.push(
        line([-810, yComb], [810, yComb], { stroke: COSMOS.amber, width: 4 }).glow(
          10,
          COSMOS.amber,
        ),
        glowDot(-810, yComb, { radius: 7, color: COSMOS.amber }),
        glowDot(810, yComb, { radius: 7, color: COSMOS.amber }),
        txt(
          `Combined mean: ${activeSum.toFixed(2)} / ${activeVals.length} = ${activeMean.toFixed(3)}`,
          -250,
          yComb - 38,
          30,
          COSMOS.amber,
          'mono',
        ).glow(6, COSMOS.amber),
      );
    }

    // Bottom readout or 800-prompt vs 30-reply scale bar
    if (sc > 0.05) {
      const barW = 1480;
      const promptW = barW * SCALE_PROMPT_SHARE;
      const replyW = barW - promptW;
      const sx0 = -740;
      const sy = 318;
      nodes.push(
        txt(
          `AT REAL SCALE: ${SCALE_PROMPT_TOKENS} PROMPT TOKENS + ${SCALE_REPLY_TOKENS} REPLY TOKENS`,
          0,
          262,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(sc),
        rect(promptW, 56, { fill: '#152c52', stroke: COSMOS.blue, width: 2.2, radius: 6 })
          .at(sx0 + promptW * 0.5, sy)
          .glow(7, COSMOS.blue)
          .opacity(sc),
        rect(replyW, 56, { fill: '#103b36', stroke: COSMOS.emerald, width: 2.4, radius: 6 })
          .at(sx0 + promptW + replyW * 0.5, sy)
          .glow(9, COSMOS.emerald)
          .opacity(sc),
        txt(
          `Prompt share: ${Math.round(SCALE_PROMPT_SHARE * 100)}% of unweighted loss terms`,
          sx0 + promptW * 0.5,
          sy,
          28,
          COSMOS.ink,
          'mono',
        ).opacity(sc),
        txt(
          'Always report response-only loss separately and compare held-out behavior',
          0,
          404,
          28,
          COSMOS.emerald,
          'sans',
        ).opacity(sc),
      );
    } else {
      const msgCol = addedCount >= 5 ? COSMOS.amber : COSMOS.emerald;
      const msg =
        addedCount >= 5
          ? `Mean plunged ${ANSWER_MEAN.toFixed(2)} → ${COMBINED_PROMPT_MEAN.toFixed(3)} (${COMBINED_PROMPT_SUM.toFixed(2)} / 7), yet NEITHER answer bar moved!`
          : `Answer-only losses: (2.2 + 1.8) / 2 = ${ANSWER_MEAN.toFixed(3)}`;
      nodes.push(
        glassCell(0, 338, 1660, 102, msgCol, { fill: '#101829', glow: 8 }),
        txt(msg, 0, 338, 28, msgCol, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('prompt-metric-b1', () => s.play(showAnsMean.to(1, { duration: 0.45 })));
  c.on('prompt-combined', () => s.play(addPrompt.to(1, { duration: 1.0 })));
  c.on('prompt-metric-b2', () =>
    s.play(showScale.to(1, { duration: remainDuration(c, 'prompt-metric-b2', 0.65) })),
  );
}
