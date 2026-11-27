// Scene 02 (contract): "Keep the comparison contract visible"
// Dual glowing evaluation rails (System A vs System B) showing controlled model swap vs whole-system change.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const STATIONS = ['QUESTIONS', 'EVIDENCE', 'MODEL', 'BUDGET', 'SCORER'];

export default function contract(s, c) {
  const phase = s.value(0);
  const focusA = s.value(0);
  const focusB = s.value(0);
  const expandPassages = s.value(0);
  const showConsequence = s.value(0);
  const showPublicUnits = s.value(0);

  const bgAura = aura(120, 40, 620, '#142a4836', '#2e1d4a1e');
  const title = heroTitle(['Freeze the Comparison', 'Contract Before Swapping'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'HARNESS CONTROL · MODEL VS SYSTEM',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const exp = expandPassages.value;
    const cons = showConsequence.value;
    const pub = showPublicUnits.value;
    const nodes = [];

    const xs = [-525, -230, 65, 360, 655];
    const rowAY = -135;
    const rowBY = 95;

    // Station headers across top of the rails
    STATIONS.forEach((name, i) => {
      const isEv = i === 1 && exp > 0.3;
      nodes.push(
        txt(name, xs[i], -238, 26, isEv ? ROLE.accent : COSMOS.muted, 'mono').glow(
          isEv ? 6 : 0,
          ROLE.accent,
        ),
      );
    });

    const drawRail = (labelName, cy, color, values, rowGlow, isB) => {
      nodes.push(txt(labelName, -855, cy, 30, color, 'sans', 'left').glow(6 + 4 * rowGlow, color));
      for (let i = 0; i < xs.length - 1; i++) {
        nodes.push(
          glowArrow([xs[i] + 124, cy], [xs[i + 1] - 124, cy], color, {
            width: 2.8,
            tip: 10,
            opacity: 0.7,
          }),
        );
      }

      values.forEach((val, i) => {
        const isModel = i === 2;
        const isChanged = isB && i === 1 && exp > 0.35;
        const boxCol = isChanged ? ROLE.accent : isModel ? color : COSMOS.muted;
        nodes.push(
          lumBar(xs[i], cy, 232, 86, {
            color: boxCol,
            fillOpacity: isChanged ? 0.34 : isModel ? 0.28 : 0.14,
            strokeWidth: isChanged ? 3.2 : isModel ? 2.8 : 2.0,
            glow: isChanged ? 12 * pulse : isModel ? 9 : 4,
            radius: 10,
          }),
          txt(val, xs[i], cy, 26, isChanged ? ROLE.focus : COSMOS.ink, 'mono'),
        );
      });
    };

    drawRail(
      'System A',
      rowAY,
      ROLE.A,
      ['matched', '3 passages', 'Model A', 'matched', 'matched'],
      focusA.value,
      false,
    );

    // Non-overlapping label transition for System B's evidence slot (3 -> 5 passages)
    const evLabel = exp > 0.5 ? '5 passages' : '3 passages';
    drawRail(
      'System B',
      rowBY,
      ROLE.B,
      ['matched', evLabel, 'Model B', 'matched', 'matched'],
      focusB.value,
      true,
    );

    // Extra 2 passages flying into System B's Evidence station as exp rises from 0 -> 1
    if (exp > 0.02 && exp < 0.98) {
      const p1x = xs[1] - 130 * (1 - exp);
      const p1y = rowBY - 110 * (1 - exp);
      const p2x = xs[1] + 130 * (1 - exp);
      const p2y = rowBY - 110 * (1 - exp);
      const orbOp = Math.sin(exp * Math.PI);
      nodes.push(
        glowDot(p1x, p1y, { radius: 9, color: ROLE.accent, glow: 14, opacity: orbOp }),
        glowDot(p2x, p2y, { radius: 9, color: ROLE.accent, glow: 14, opacity: orbOp }),
      );
    }

    // Bottom readout zone with clean non-overlapping crossfades
    const baseOp = fadeOut(cons) * fadeOut(pub);
    const consOp = fadeIn(cons) * fadeOut(pub);
    const pubOp = fadeIn(pub);

    if (baseOp > 0.02) {
      nodes.push(
        txt(
          'Same questions, evidence, budget, and scorer  (only chat template adapts)',
          0,
          310,
          32,
          COSMOS.muted,
          'sans',
        ).opacity(baseOp),
      );
    }

    if (consOp > 0.02) {
      nodes.push(
        txt(
          'Model + retrieval changed: now comparing two complete systems',
          0,
          295,
          36,
          ROLE.focus,
          'sans',
        )
          .glow(8, ROLE.focus)
          .opacity(consOp),
        txt(
          'Report both changes so retrieval gains are not credited to weights alone',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(consOp),
      );
    }

    if (pubOp > 0.02) {
      const units = [
        ['MCQ KNOWLEDGE', 'choice accuracy', ROLE.A, -540],
        ['CODE BENCHMARKS', 'passing tests', ROLE.pass, 0],
        ['HUMAN PREFERENCE', 'pairwise votes', ROLE.exposed, 540],
      ];
      units.forEach(([head, sub, col, ux]) => {
        nodes.push(
          lumBar(ux, 315, 450, 118, {
            color: col,
            fillOpacity: 0.16,
            strokeWidth: 2.2,
            glow: 7,
            radius: 10,
            opacity: pubOp,
          }),
          txt(head, ux, 290, 26, col, 'mono').opacity(pubOp),
          txt(sub, ux, 336, 28, COSMOS.ink, 'sans').opacity(pubOp),
        );
      });
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'contract-beat-1-focus-1', focusA, 1, { duration: 0.45 });
  tweenCue(s, c, 'contract-beat-2-focus-1', focusB, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-contract-passages', expandPassages, 1, { duration: 0.85 });
  tweenCue(s, c, 'ba-contract-consequence', showConsequence, 1, { duration: 0.5, after: true });
  tweenCue(s, c, 'contract-beat-3-focus-1', showPublicUnits, 1, { duration: 0.55 });
}
