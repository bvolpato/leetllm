// Scene 15 (judge-controls): "Map every verdict back to answer identity"
// Dual-slot orbital judge swap revealing position bias (Concise vs Friendly) vs consistent grounded winner.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  glowingArc,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function judge(s, c) {
  const phase = s.value(0);
  const focusRubric = s.value(0);
  const showFirst = s.value(0);
  const swapProgress = s.value(0); // 0 -> 1 orbital swap!
  const showSwapped = s.value(0);
  const showUnresolved = s.value(0);
  const phaseGrounded = s.value(0);
  const showGroundedWin = s.value(0);
  const focusTruth = s.value(0);
  const cuePulse = s.value(0);

  const bgAura = aura(0, 20, 620, '#14304c36', '#331c4420');
  const title = heroTitle(['Track Candidate Identity', 'Through Every Judge Swap'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.focus,
    eyebrow: 'LLM-AS-A-JUDGE · ORDER BIAS & CALIBRATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const sw = swapProgress.value;
    const grd = phaseGrounded.value;
    const nodes = [];

    const slotAX = -410;
    const slotBX = 410;
    const slotY = -30;

    // Stationary glowing Slot A / Slot B open platforms (below card orbit so zero stroke crossings!)
    nodes.push(
      txt('SLOT A  (JUDGE TIE-BREAKER)', slotAX, -245, 28, ROLE.focus, 'mono').glow(6, ROLE.focus),
      txt('SLOT B', slotBX, -245, 28, COSMOS.muted, 'mono'),
      lumBar(slotAX, slotY + 125, 520, 6, {
        color: ROLE.focus,
        fillOpacity: 0.8,
        strokeWidth: 0,
        glow: 9,
        radius: 3,
      }),
      lumBar(slotBX, slotY + 125, 520, 6, {
        color: COSMOS.muted,
        fillOpacity: 0.55,
        strokeWidth: 0,
        glow: 4,
        radius: 3,
      }),
    );

    // Smooth curved orbital coordinates kept cleanly between y=-200 and y=+110
    const angle = sw * Math.PI;
    const rx = (slotBX - slotAX) * 0.5;
    const ry = 82;
    const c1x = -rx * Math.cos(angle);
    const c1y = slotY - ry * Math.sin(angle);
    const c2x = rx * Math.cos(angle);
    const c2y = slotY + ry * Math.sin(angle);

    // Candidate 1: Concise (always grounded with commander approval)
    const c1Win = showGroundedWin.value > 0.3 || (showFirst.value > 0.3 && sw < 0.5 && grd < 0.5);
    nodes.push(
      lumBar(c1x, c1y, 510, 140, {
        color: showGroundedWin.value > 0.3 ? ROLE.pass : c1Win ? ROLE.focus : ROLE.A,
        fillOpacity: c1Win ? 0.3 : 0.22,
        strokeWidth: c1Win ? 3.4 : 2.6,
        glow: c1Win ? 14 * pulse : 9,
        radius: 12,
      }),
      txt('CONCISE', c1x, c1y - 26, 36, ROLE.A, 'mono').glow(6, ROLE.A),
      txt('Policy fact: commander approval ✓', c1x, c1y + 24, 26, ROLE.pass, 'sans'),
    );

    // Candidate 2: Friendly (grounded in Phase 0/1 -> swaps to Unsupported in Phase 2)
    const isUnsupported = grd > 0.5;
    const c2Win = showSwapped.value > 0.3 && sw > 0.5 && !isUnsupported;
    const c2Col = isUnsupported ? ROLE.fail : ROLE.B;
    nodes.push(
      lumBar(c2x, c2y, 510, 140, {
        color: c2Win ? ROLE.focus : c2Col,
        fillOpacity: c2Win ? 0.3 : 0.22,
        strokeWidth: c2Win || isUnsupported ? 3.4 : 2.6,
        glow: c2Win || isUnsupported ? 14 * pulse : 9,
        radius: 12,
      }),
      txt(isUnsupported ? 'UNSUPPORTED' : 'FRIENDLY', c2x, c2y - 26, 36, c2Col, 'mono').glow(
        6,
        c2Col,
      ),
      txt(
        isUnsupported ? 'Wrong fact: on-call engineer ×' : 'Policy fact: commander approval ✓',
        c2x,
        c2y + 24,
        26,
        isUnsupported ? ROLE.fail : ROLE.pass,
        'sans',
      ),
    );

    // Rubric bar floating below arena
    nodes.push(
      txt(
        'CONTROLLED JUDGE:  REVIEWED LABELS  ·  EXPLICIT RUBRIC  ·  DISAGREEMENT POLICY',
        0,
        155,
        26,
        focusRubric.value > 0.3 || focusTruth.value > 0.3 ? ROLE.focus : COSMOS.muted,
        'mono',
      ).glow(focusTruth.value > 0.3 ? 6 : 0, ROLE.focus),
    );

    // Bottom verdict readout with strict non-overlapping crossfades
    const v0Op = showFirst.value * fadeOut(showSwapped.value);
    const v1Op = fadeIn(showSwapped.value) * fadeOut(showUnresolved.value);
    const v2Op = fadeIn(showUnresolved.value) * fadeOut(showGroundedWin.value);
    const v3Op = fadeIn(showGroundedWin.value);

    if (v0Op > 0.02) {
      nodes.push(
        txt('Slot A picks CONCISE', 0, 265, 38, ROLE.A, 'mono').glow(7, ROLE.A).opacity(v0Op),
      );
    }
    if (v1Op > 0.02) {
      nodes.push(
        txt('Swapped: Slot A -> FRIENDLY', 0, 265, 38, ROLE.B, 'mono')
          .glow(7, ROLE.B)
          .opacity(v1Op),
      );
    }
    if (v2Op > 0.02) {
      nodes.push(
        txt('Conflict -> UNRESOLVED', 0, 265, 40, ROLE.focus, 'mono')
          .glow(9, ROLE.focus)
          .opacity(v2Op),
      );
    }
    if (v3Op > 0.02) {
      nodes.push(
        txt(
          'Grounded CONCISE wins both orders · still calibrate against human policy truth',
          0,
          265,
          34,
          ROLE.pass,
          'sans',
        )
          .glow(8, ROLE.pass)
          .opacity(v3Op),
      );
    }

    nodes.push(
      txt(
        'Check negations, paraphrases, prompt-injection text, and fixed-fact length bias',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'judge-controls-phase-0', focusRubric, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-judge-controls-rubric', cuePulse, 1, { duration: 0.25 });
  tweenCue(s, c, 'judge-controls-phase-1', focusRubric, 0, { duration: 0.25 });
  tweenCue(s, c, 'ba-judge-controls-tie', cuePulse, 2, { duration: 0.25 });
  tweenCue(s, c, 'judge-first', showFirst, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-judge-controls-swap', swapProgress, 1, { duration: 1.4 });
  tweenCue(s, c, 'judge-swapped', showSwapped, 1, { duration: 0.4 });
  tweenCue(s, c, 'judge-unresolved', showUnresolved, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'ba-judge-controls-unresolved', cuePulse, 3, { duration: 0.25 });
  tweenCue(s, c, 'judge-controls-phase-2', phaseGrounded, 1, { duration: 0.5 });
  tweenCue(s, c, 'ba-judge-controls-grounded', showGroundedWin, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-judge-controls-truth', focusTruth, 1, { duration: 0.4 });
}
