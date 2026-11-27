// Scene 16 (paired-prompts): "Subtract two outcomes before averaging away shared difficulty"
// Shared prompt difficulty cancels out -> Var(T - C) = Var(T) + Var(C) - 2*Cov = 9 + 4 - 6 = 7 (vs 13) -> 2,000-answer budget SE 0.085 -> 0.027 (89.5% variance drop)!
import { line } from 'vizmatic/stage';
import {
  AB_VISUAL_FIXTURES,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  pairedContrastVariance,
  tweenCue,
  txt,
} from '../parts.mjs';

const P = AB_VISUAL_FIXTURES.paired;
const TOY_PAIRED = pairedContrastVariance(9, 4, 3); // 7

export default function pairedPrompts(s, c) {
  const showCancel = s.value(0);
  const showVar = s.value(0);
  const showInd = s.value(0);
  const showPaired = s.value(0);
  const showGain = s.value(0);
  const showInter = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#133a3d20');
  const title = heroTitle(['Paired Prompt Evaluation:', 'Cancel Shared Difficulty'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: GOOD_COLOR,
    eyebrow: 'WITHIN-PROMPT COVARIANCE REDUCTION',
  });

  const eqVar = glowTex(
    `\\operatorname{Var}(T - C) = \\operatorname{Var}(T) + \\operatorname{Var}(C) - 2\\operatorname{Cov}(T,C) = 9 + 4 - 2(3) = ${TOY_PAIRED}`,
    { x: 0, y: 270, size: 30, color: WARN_COLOR, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    // Left: 12 paired prompt scores linked by vertical delta segments
    const plot = makePlot(-820, -230, 860, 405, { x: [0.5, 12.5], y: [1.5, 8.0] });
    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        '12 SHARED PROMPTS: CONTROL vs TREATMENT SCORES',
        -820,
        -265,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
    ];

    P.sampleRows.forEach((r, idx) => {
      const k = idx + 1;
      const pC = plot.pt([k, r.control]);
      const pT = plot.pt([k, r.treatment]);
      nodes.push(
        line(pC, pT, { stroke: GOOD_COLOR, width: 3.2 }).opacity(0.45 + 0.55 * showCancel.value),
        glowDot(pC[0], pC[1], { radius: 6.5, color: CTRL_COLOR, glow: 8 }),
        glowDot(pT[0], pT[1], { radius: 6.5, color: TRT_COLOR, glow: 8 }),
      );
    });

    // Right: Independent SE (0.085) vs Paired SE (0.027) -> 89.5% variance drop!
    const rx = 115;
    const indW = 540;
    const pairW = (P.pairedSe / P.independentSe) * indW;

    nodes.push(
      txt('SAME BUDGET: 2,000 ANSWERS', rx, -230, 26, WARN_COLOR, 'mono', 'left'),

      txt(
        `Separate prompts:  lift +${P.independentLift.toFixed(3)},  SE = ${P.independentSe.toFixed(3)}`,
        rx,
        -155,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showInd.value),
      lumBar(rx + indW / 2, -100, indW, 42, {
        color: CTRL_COLOR,
        fillOpacity: 0.65,
        glow: 7,
        opacity: 0.45 + 0.55 * showInd.value,
      }),

      txt(
        `1,000 paired prompts:  lift +${P.pairedLift.toFixed(3)},  SE = ${P.pairedSe.toFixed(3)}`,
        rx,
        -10,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.4 + 0.6 * showPaired.value),
      lumBar(rx + pairW / 2, 45, pairW, 42, {
        color: GOOD_COLOR,
        fillOpacity: 0.78,
        glow: 9,
        opacity: 0.4 + 0.6 * showPaired.value,
      }),

      txt(
        `VARIANCE REDUCTION:  −${(P.varianceReduction * 100).toFixed(1)}%`,
        rx,
        135,
        34,
        GOOD_COLOR,
        'mono',
        'left',
      )
        .glow(8, GOOD_COLOR)
        .opacity(0.35 + 0.65 * showGain.value),
    );

    if (showInter.value > 0.02) {
      nodes.push(
        txt(
          'Blind A/B order, hide arm IDs, calibrate ties & check sources (showing both answers changes exposure)',
          -855,
          365,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showInter.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'cancel', showCancel, 1, { duration: 0.45 });
  c.show('variance', eqVar);
  tweenCue(s, c, 'variance', showVar, 1, { duration: 0.45 });
  tweenCue(s, c, 'independent', showInd, 1, { duration: 0.45 });
  tweenCue(s, c, 'paired-se', showPaired, 1, { duration: 0.5 });
  tweenCue(s, c, 'variance-gain', showGain, 0.85, { duration: 0.45 });
  tweenCue(s, c, 'scope', showGain, 1, { duration: 0.35 });
  tweenCue(s, c, 'interleaving', showInter, 0.6, { duration: 0.35 });
  tweenCue(s, c, 'answers', showInter, 0.85, { duration: 0.35 });
  tweenCue(s, c, 'exposure', showInter, 1, { duration: 0.35 });
}
