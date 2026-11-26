// Scene 08 (math-frontier): "An answer parser and a dataset version change the experiment"
// GSM8K/MATH parser contrast -> HLE & FrontierMath v2 version timeline -> ARC-AGI-2 symbolic neon grid.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowArrow,
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

export default function math(s, c) {
  const phase = s.value(0);
  const stripDelim = s.value(0);
  const focusProof = s.value(0);
  const phase1 = s.value(0);
  const focusHle = s.value(0);
  const showV2 = s.value(0);
  const phase2 = s.value(0);
  const extendArc = s.value(0);

  const bgAura = aura(160, 20, 620, '#142c4c36', '#2e1e4820');
  const title = heroTitle(['A Parser and a Dataset Version', 'Are Part of the Experiment'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.accent,
    eyebrow: 'MATH & FRONTIER · GSM8K, MATH, HLE, ARC-AGI-2',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const p1 = phase1.value;
    const p2 = phase2.value;

    const act0Op = fadeOut(p1) * fadeOut(p2);
    const act1Op = fadeIn(p1) * fadeOut(p2);
    const act2Op = fadeIn(p2);
    const nodes = [];

    // ACT 0: GSM8K (~8.5k) & MATH (12,500) parser vs derivation contracts
    if (act0Op > 0.02) {
      const delim = stripDelim.value;
      const prf = focusProof.value;
      nodes.push(
        txt('GSM8K ~ 8,500 GRADE-SCHOOL PROBLEMS', -430, -210, 26, ROLE.A, 'mono').opacity(act0Op),
        txt('MATH = 12,500 COMPETITION PROBLEMS', 370, -210, 26, ROLE.B, 'mono').opacity(act0Op),
        lumBar(-430, -20, 640, 220, {
          color: ROLE.A,
          fillOpacity: 0.16,
          strokeWidth: 2.4,
          glow: 8,
          radius: 12,
          opacity: act0Op,
        }),
        txt('MODEL OUTPUT', -430, -96, 26, COSMOS.muted, 'mono').opacity(act0Op),
        txt('2 + 3 = 5', -430, -32, 46, COSMOS.ink, 'mono').opacity(act0Op),
        txt(delim > 0.5 ? '5' : '#### 5', -430, 34, 48, delim > 0.5 ? ROLE.focus : ROLE.A, 'mono')
          .glow(8, delim > 0.5 ? ROLE.focus : ROLE.A)
          .opacity(act0Op),
        glowArrow([-95, -75], [85, -95], delim > 0.5 ? ROLE.fail : ROLE.pass, {
          width: 3.2,
          tip: 11,
          opacity: act0Op,
        }),
        glowArrow([-95, 35], [85, 55], ROLE.pass, { width: 3.2, tip: 11, opacity: act0Op }),
        lumBar(370, -95, 540, 96, {
          color: delim > 0.5 ? ROLE.fail : ROLE.A,
          fillOpacity: 0.18,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
          opacity: act0Op,
        }),
        txt(
          'Delimiter parser (####)',
          370,
          -114,
          28,
          delim > 0.5 ? ROLE.fail : ROLE.A,
          'mono',
        ).opacity(act0Op),
        txt(
          delim > 0.5 ? 'NO MATCH -> FAIL' : 'EXTRACTED 5 -> PASS',
          370,
          -72,
          26,
          delim > 0.5 ? ROLE.fail : ROLE.pass,
          'mono',
        ).opacity(act0Op),
        lumBar(370, 55, 540, 96, {
          color: ROLE.B,
          fillOpacity: 0.18,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
          opacity: act0Op,
        }),
        txt('Final-number parser', 370, 36, 28, ROLE.B, 'mono').opacity(act0Op),
        txt('EXTRACTED 5 -> PASS', 370, 78, 26, ROLE.pass, 'mono').opacity(act0Op),
        txt(
          'Extracted final-answer match != valid derivation · record parser and tool access',
          0,
          270,
          32,
          prf > 0.3 ? ROLE.focus : COSMOS.muted,
          'sans',
        )
          .glow(prf > 0.3 ? 8 : 0, ROLE.focus)
          .opacity(act0Op),
      );
    }

    // ACT 1: HLE & FrontierMath v2 exact release timeline
    if (act1Op > 0.02) {
      const hleY = -95;
      const xs = [-540, 0, 540];
      const releases = [
        ['HLE ORIGINAL', 'April 2025 · 2,500 public', 'plus private holdout'],
        ['HLE ROLLING', 'October 2025', 'updated evaluation stream'],
        ['HLE DIAMOND', 'September 2026', 'curated verified subset'],
      ];
      nodes.push(
        txt("HUMANITY'S LAST EXAM RELEASE TIMELINE", 0, -225, 28, ROLE.A, 'mono').opacity(act1Op),
        glowingTrail(
          [
            [-640, hleY],
            [640, hleY],
          ],
          { color: ROLE.A, width: 3.2, glow: 8, opacity: act1Op * 0.8, core: false },
        ),
      );
      releases.forEach(([name, dateStr, sub], i) => {
        const hi = i === 0 && focusHle.value > 0.3;
        nodes.push(
          glowDot(xs[i], hleY, {
            radius: hi ? 12 : 9,
            color: hi ? ROLE.focus : ROLE.A,
            glow: hi ? 14 * pulse : 9,
            opacity: act1Op,
          }),
          txt(name, xs[i], hleY - 52, 28, hi ? ROLE.focus : ROLE.A, 'mono').opacity(act1Op),
          txt(dateStr, xs[i], hleY + 48, 26, COSMOS.ink, 'sans').opacity(act1Op),
          txt(sub, xs[i], hleY + 88, 26, COSMOS.muted, 'sans').opacity(act1Op),
        );
      });

      const v2Op = showV2.value;
      nodes.push(
        lumBar(0, 215, 1440, 146, {
          color: v2Op > 0.3 ? ROLE.accent : COSMOS.rule,
          fillOpacity: 0.16,
          strokeWidth: v2Op > 0.3 ? 3.0 : 2.0,
          glow: v2Op > 0.3 ? 12 * pulse : 4,
          radius: 12,
          opacity: act1Op,
        }),
        txt('FRONTIERMATH TIERS 1 TO 4', 0, 178, 28, ROLE.accent, 'mono').opacity(act1Op),
        txt(
          v2Op > 0.3
            ? 'June 12, 2026 v2 release repaired errors in 42% of problems'
            : 'Advanced undergraduate through research-level math tiers',
          0,
          224,
          34,
          v2Op > 0.3 ? ROLE.focus : COSMOS.ink,
          'sans',
        )
          .glow(v2Op > 0.3 ? 7 : 0, ROLE.focus)
          .opacity(act1Op),
        txt(
          'Compare both models on the exact same version (v1 and v2 are not comparable)',
          0,
          335,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(act1Op),
      );
    }

    // ACT 2: ARC-AGI-2 symbolic 3x3 colored grid rule + split exposure tiers
    if (act2Op > 0.02) {
      const ext = extendArc.value;
      const gCenters = [-510, 0, 510];
      const labels3 = ['INPUT GRID', 'INFERRED RULE', 'OUTPUT GRID'];
      const cellS = 78;
      const step = 88;

      labels3.forEach((lbl, gIdx) => {
        const cx = gCenters[gIdx];
        nodes.push(
          txt(lbl, cx, -195, 28, gIdx === 1 ? ROLE.focus : ROLE.A, 'mono').opacity(act2Op),
        );
        if (gIdx === 1) {
          nodes.push(
            glowArrow([-245, -10], [245, -10], ROLE.focus, {
              width: 3.6,
              tip: 13,
              opacity: act2Op,
            }),
            txt('Extend blue square right', cx, -62, 30, ROLE.focus, 'sans').opacity(act2Op),
            txt('until it reaches the edge', cx, 42, 28, COSMOS.muted, 'sans').opacity(act2Op),
          );
          return;
        }
        for (let r = 0; r < 3; r++) {
          for (let col = 0; col < 3; col++) {
            const x = cx + (col - 1) * step;
            const y = -10 + (r - 1) * step;
            const isSeed = r === 1 && col === 0;
            const isExtended = gIdx === 2 && r === 1 && col > 0;
            const lit = isSeed || (isExtended && ext > (col === 1 ? 0.2 : 0.55));
            const cellCol = lit ? ROLE.A : COSMOS.rule;
            nodes.push(
              lumBar(x, y, cellS, cellS, {
                color: cellCol,
                fillOpacity: lit ? 0.62 : 0.14,
                strokeWidth: lit ? 2.8 : 1.8,
                glow: lit ? 11 * pulse : 2,
                radius: 8,
                opacity: act2Op,
              }),
            );
          }
        }
      });

      if (ext > 0.5) {
        nodes.push(
          glowRing(510 + step, -10, 52 + 3 * pulse, ROLE.focus, {
            width: 2.6,
            glow: 9,
            opacity: act2Op * (ext - 0.5) * 1.6,
          }),
        );
      }

      nodes.push(
        txt(
          'ARC-AGI-2 splits carry different exposure histories:  PUBLIC   ·   SEMI-PRIVATE   ·   PRIVATE',
          0,
          290,
          30,
          ROLE.accent,
          'mono',
        )
          .glow(6, ROLE.accent)
          .opacity(act2Op),
        txt(
          'Always record the exact split alongside every frontier score',
          0,
          345,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(act2Op),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'math-frontier-phase-0', stripDelim, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-math-frontier-parser', stripDelim, 1, { duration: 0.5 });
  tweenCue(s, c, 'ba-math-frontier-proof', focusProof, 1, { duration: 0.4 });
  tweenCue(s, c, 'math-frontier-phase-1', phase1, 1, { duration: 0.55 });
  tweenCue(s, c, 'ba-math-frontier-hle', focusHle, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-math-frontier-versions', showV2, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'math-frontier-phase-2', phase2, 1, { duration: 0.55 });
  tweenCue(s, c, 'ba-math-frontier-arc', extendArc, 1, { duration: 0.85, after: true });
}
