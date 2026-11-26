// Scene 03 (gold-contract): "Validate the questions before grading the answers"
// Luminous policy-to-answer-key ledger catching duplicate IDs and unsupported gold requirements before grading.
import {
  COSMOS,
  POLICY,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowArrow,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function gold(s, c) {
  const phase = s.value(0);
  const focusP1 = s.value(0);
  const focusIds = s.value(0);
  const showDup = s.value(0);
  const focusGold = s.value(0);
  const corruptP2 = s.value(0);
  const repairP2 = s.value(0);

  const bgAura = aura(240, 20, 620, '#133a4434', '#3822141e');
  const title = heroTitle(['Validate the Answer Key', 'Before Grading Any Model'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.pass,
    eyebrow: 'PREFLIGHT AUDIT · GOLD CONTRACT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const dup = showDup.value;
    const bad = corruptP2.value;
    const rep = repairP2.value;
    const nodes = [];

    const colId = -755;
    const colQ = -455;
    const colSrc = 55;
    const colGold = 570;
    const headY = -230;
    const rowYs = [-120, 25, 170];

    nodes.push(
      txt('CASE ID', colId, headY, 26, COSMOS.muted, 'mono'),
      txt('TRIGGER SCENARIO', colQ, headY, 26, COSMOS.muted, 'mono'),
      txt('POLICY SOURCE CLAUSE', colSrc, headY, 26, ROLE.A, 'mono'),
      txt('REQUIRED GOLD FACT', colGold, headY, 26, ROLE.focus, 'mono'),
      rule(-855, headY + 28, 855, headY + 28, COSMOS.rule, 2),
    );

    POLICY.forEach((item, i) => {
      const cy = rowYs[i];
      const idHi = (i === 0 && focusP1.value > 0.3) || focusIds.value > 0.3;
      const isP2Bad = i === 1 && bad > 0.5 && rep < 0.5;
      const isP2Fixed = i === 1 && rep >= 0.5;

      const idCol = i === 0 && dup > 0.3 ? ROLE.fail : idHi ? ROLE.focus : ROLE.A;
      nodes.push(
        lumBar(colId, cy, 128, 72, {
          color: idCol,
          fillOpacity: 0.24,
          strokeWidth: idHi ? 3.0 : 2.2,
          glow: idHi ? 11 : 6,
          radius: 10,
        }),
        txt(item.id, colId, cy, 32, COSMOS.ink, 'mono'),
        txt(item.question, colQ, cy, 30, COSMOS.muted, 'sans'),
        lumBar(colSrc, cy, 410, 74, {
          color: ROLE.A,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: i === 0 && focusP1.value > 0.3 ? 11 : 5,
          radius: 10,
        }),
        txt(item.fact, colSrc, cy, 30, ROLE.A, 'sans'),
        glowArrow(
          [colSrc + 216, cy],
          [colGold - 224, cy],
          isP2Bad ? ROLE.fail : isP2Fixed ? ROLE.pass : COSMOS.muted,
          {
            width: 3.0,
            tip: 11,
          },
        ),
      );

      const goldCol = isP2Bad
        ? ROLE.fail
        : isP2Fixed
          ? ROLE.pass
          : focusGold.value > 0.3
            ? ROLE.focus
            : COSMOS.ink;
      const goldText = isP2Bad ? 'keep deploying' : item.fact;
      nodes.push(
        lumBar(colGold, cy, 420, 74, {
          color: isP2Bad ? ROLE.fail : isP2Fixed ? ROLE.pass : ROLE.focus,
          fillOpacity: isP2Bad ? 0.26 : isP2Fixed ? 0.26 : 0.14,
          strokeWidth: isP2Bad || isP2Fixed ? 3.2 : 2.2,
          glow: isP2Bad || isP2Fixed ? 12 * pulse : 5,
          radius: 10,
        }),
        txt(goldText, colGold, cy, 30, goldCol, 'sans'),
      );

      if (isP2Bad) {
        nodes.push(
          txt('CONFLICTS WITH SOURCE', colGold, cy + 58, 26, ROLE.fail, 'mono').glow(6, ROLE.fail),
        );
      } else if (isP2Fixed) {
        nodes.push(
          txt('VERIFIED AGAINST SOURCE', colGold, cy + 58, 26, ROLE.pass, 'mono').glow(
            6,
            ROLE.pass,
          ),
        );
      }
    });

    // Bottom status area: duplicate ID collision vs source verification vs repair summary
    const dupOp = fadeIn(dup) * fadeOut(bad);
    const badOp = fadeIn(bad) * fadeOut(rep);
    const repOp = fadeIn(rep);
    const idleOp = fadeOut(dup) * fadeOut(bad) * fadeOut(rep);

    if (idleOp > 0.02) {
      nodes.push(
        txt(
          'Pair every question with its governing policy, required facts, and forbidden claims',
          0,
          345,
          30,
          COSMOS.muted,
          'sans',
        ).opacity(idleOp),
      );
    }
    if (dupOp > 0.02) {
      nodes.push(
        lumBar(-610, 340, 180, 66, {
          color: ROLE.fail,
          fillOpacity: 0.32,
          strokeWidth: 3.0,
          glow: 11 * pulse,
          radius: 10,
          opacity: dupOp,
        }),
        txt('DUP: P1', -610, 340, 28, ROLE.fail, 'mono').opacity(dupOp),
        glowRing(colId, rowYs[0], 56 + 4 * pulse, ROLE.fail, {
          width: 3.0,
          glow: 10,
          opacity: dupOp,
        }),
        txt(
          'Duplicate case ID rejected: scores could attach to the wrong question',
          95,
          340,
          30,
          ROLE.fail,
          'sans',
        ).opacity(dupOp),
      );
    }
    if (badOp > 0.02) {
      nodes.push(
        txt(
          'Unsupported gold row penalizes a model that actually follows policy P2',
          0,
          345,
          32,
          ROLE.fail,
          'sans',
        )
          .glow(6, ROLE.fail)
          .opacity(badOp),
      );
    }
    if (repOp > 0.02) {
      nodes.push(
        txt(
          'Repair the answer key first · include critical cases and evidence-absent refusals',
          0,
          345,
          32,
          ROLE.pass,
          'sans',
        )
          .glow(6, ROLE.pass)
          .opacity(repOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'gold-contract-phase-0', focusP1, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-gold-contract-approval', focusP1, 1, { duration: 0.35 });
  tweenCue(s, c, 'gold-contract-phase-1', focusIds, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-gold-contract-unique', showDup, 1, { duration: 0.45 });
  c.on('ba-gold-contract-gold', () => {
    s.play(showDup.to(0, { duration: 0.35 }));
    s.play(focusGold.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'gold-contract-phase-2', focusP1, 0, { duration: 0.3 });
  tweenCue(s, c, 'ba-gold-contract-unsupported', corruptP2, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-gold-contract-repair', repairP2, 1, { duration: 0.45, after: true });
}
