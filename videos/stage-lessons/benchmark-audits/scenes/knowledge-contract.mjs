// Scene 07 (knowledge-contract): "Keep the task and parser attached to the score"
// Expanding choice wheel (4 -> 10 options), dual scoring contracts, GPQA subset rings, and HELM custom scenarios.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const LETTERS10 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function knowledge(s, c) {
  const phase = s.value(0);
  const showQuarter = s.value(0);
  const expandTen = s.value(0);
  const showTenth = s.value(0);
  const showGpqa = s.value(0);
  const showHuman = s.value(0);
  const showHelm = s.value(0);

  const bgAura = aura(-320, 40, 560, '#14324c38', '#2c1e4a20');
  const title = heroTitle(['Keep the Task, Split, and', 'Parser Attached to the Score'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'KNOWLEDGE SUITES · MMLU, GPQA, HELM',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const ten = expandTen.value;
    const gpqa = showGpqa.value;
    const hum = showHuman.value;
    const helm = showHelm.value;
    const nodes = [];

    // LEFT STAGE: Expanding luminous choice constellation (4 choices -> 10 choices)
    const wheelCx = -450;
    const wheelCy = 25;
    const wheelR = 175;
    const nActive = ten > 0.5 ? 10 : 4;

    nodes.push(
      txt(
        ten > 0.5 ? 'MMLU-PRO · UP TO 10 CHOICES' : 'MMLU · 57 SUBJECTS · 4 CHOICES',
        wheelCx,
        -215,
        26,
        ten > 0.5 ? ROLE.B : ROLE.A,
        'mono',
      ),
      glowRing(wheelCx, wheelCy, wheelR, ten > 0.5 ? ROLE.B : ROLE.A, {
        width: 2.2,
        glow: 8,
        opacity: 0.45,
      }),
    );

    for (let i = 0; i < nActive; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / nActive;
      const sx = wheelCx + Math.cos(ang) * 104;
      const sy = wheelCy + Math.sin(ang) * 104;
      const cx = wheelCx + Math.cos(ang) * wheelR;
      const cy = wheelCy + Math.sin(ang) * wheelR;
      const isCorrect = i === 0;
      const col = isCorrect ? ROLE.focus : ten > 0.5 ? ROLE.B : ROLE.A;
      nodes.push(
        glowingTrail(
          [
            [sx, sy],
            [cx, cy],
          ],
          {
            color: col,
            width: isCorrect ? 3.2 : 1.8,
            glow: isCorrect ? 9 : 3,
            opacity: isCorrect ? 0.9 : 0.45,
            core: false,
          },
        ),
        glowDot(cx, cy, { radius: isCorrect ? 10 : 6.5, color: col, glow: isCorrect ? 14 : 7 }),
        txt(
          LETTERS10[i],
          wheelCx + Math.cos(ang) * (wheelR + 36),
          wheelCy + Math.sin(ang) * (wheelR + 36),
          28,
          col,
          'mono',
        ),
      );
    }

    // Center guess baseline readout (strictly non-overlapping 1/4 -> 1/10 inside open hub)
    const qOp = showQuarter.value * fadeOut(showTenth.value);
    const tOp = fadeIn(showTenth.value);
    if (qOp > 0.02) {
      nodes.push(
        txt('1/4', wheelCx, wheelCy - 16, 44, ROLE.focus, 'mono')
          .glow(9, ROLE.focus)
          .opacity(qOp),
        txt('25% guess', wheelCx, wheelCy + 34, 26, COSMOS.muted, 'mono').opacity(qOp),
      );
    }
    if (tOp > 0.02) {
      nodes.push(
        txt('1/10', wheelCx, wheelCy - 16, 44, ROLE.focus, 'mono')
          .glow(9, ROLE.focus)
          .opacity(tOp),
        txt('10% guess', wheelCx, wheelCy + 34, 26, COSMOS.muted, 'mono').opacity(tOp),
      );
    }

    // RIGHT STAGE: Scoring protocols (Phase 0) -> Concentric GPQA splits (Phase 1 & 2)
    const rCx = 365;
    const protoOp = fadeOut(gpqa);
    const gpqaOp = fadeIn(gpqa);

    if (protoOp > 0.02) {
      nodes.push(
        txt('TWO DIFFERENT SCORING CONTRACTS', rCx, -215, 26, COSMOS.muted, 'mono').opacity(
          protoOp,
        ),
        lumBar(rCx, -80, 770, 126, {
          color: ROLE.A,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          radius: 12,
          opacity: protoOp,
        }),
        txt('1. Choice-token log-probabilities', rCx, -104, 32, ROLE.A, 'sans').opacity(protoOp),
        txt('5-shot · compare logits over A, B, C, D', rCx, -54, 26, COSMOS.muted, 'mono').opacity(
          protoOp,
        ),
        lumBar(rCx, 95, 770, 126, {
          color: ROLE.B,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          radius: 12,
          opacity: protoOp,
        }),
        txt('2. Generated-letter regex parser', rCx, 71, 32, ROLE.B, 'sans').opacity(protoOp),
        txt('Free-form reply -> extract answer letter', rCx, 121, 26, COSMOS.muted, 'mono').opacity(
          protoOp,
        ),
        txt('Same percentages · different experiments', rCx, 225, 28, ROLE.focus, 'sans').opacity(
          protoOp,
        ),
      );
    }

    if (gpqaOp > 0.02) {
      const ringCy = -30;
      nodes.push(
        txt('GPQA VALIDATOR-FILTERED SUBSETS', rCx, -228, 26, ROLE.A, 'mono').opacity(gpqaOp),
        glowRing(rCx, ringCy, 152, ROLE.A, { width: 3.0, glow: 8, opacity: gpqaOp * 0.8 }),
        glowRing(rCx, ringCy, 108, ROLE.B, { width: 3.2, glow: 9, opacity: gpqaOp * 0.9 }),
        glowRing(rCx, ringCy, 62, ROLE.focus, {
          width: 3.6,
          glow: 12 * pulse,
          opacity: gpqaOp,
        }),
        txt('198', rCx, ringCy, 34, ROLE.focus, 'mono').glow(8, ROLE.focus).opacity(gpqaOp),
        txt('Extended 546  ·  Main 448  ·  Diamond 198', rCx, 172, 28, ROLE.A, 'mono').opacity(
          gpqaOp,
        ),
      );

      if (hum > 0.02) {
        nodes.push(
          txt('34% non-expert validators (Extended + web)', rCx, 240, 28, ROLE.accent, 'mono')
            .glow(6, ROLE.accent)
            .opacity(gpqaOp * hum),
        );
      }
    }

    // Bottom HELM custom scenario banner (floating text, zero box chrome)
    if (helm > 0.02) {
      nodes.push(
        txt(
          'HELM profiles accuracy, calibration, robustness, and bias -> add custom private scenarios for your policy',
          0,
          365,
          28,
          ROLE.pass,
          'sans',
        )
          .glow(6, ROLE.pass)
          .opacity(helm),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'knowledge-contract-phase-0', showQuarter, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-knowledge-contract-four', showQuarter, 0, { duration: 0.1 });
  tweenCue(s, c, 'mmlu-guess', showQuarter, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-knowledge-contract-quarter', showQuarter, 1, { duration: 0.25 });
  tweenCue(s, c, 'knowledge-contract-phase-1', expandTen, 1, { duration: 0.55 });
  tweenCue(s, c, 'ba-knowledge-contract-ten', expandTen, 1, { duration: 0.35 });
  tweenCue(s, c, 'pro-guess', showTenth, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-knowledge-contract-gpqa', showGpqa, 1, { duration: 0.55 });
  tweenCue(s, c, 'knowledge-contract-phase-2', showHuman, 0.3, { duration: 0.3 });
  tweenCue(s, c, 'ba-knowledge-contract-human', showHuman, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-knowledge-contract-custom', showHelm, 1, { duration: 0.5 });
}
