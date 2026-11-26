// Scene 04 (checker): "Would the checker accept this deadline?"
// Pure-cinema substring scanner exposing false positives ("after Friday") and false negatives ("Fri.").
import {
  COSMOS,
  ROLE,
  aura,
  checkProbe,
  fadeIn,
  fadeOut,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  probes,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const RESULTS = probes.map((_, i) => checkProbe(i));
const KEY_WORDS = ['on', 'after', 'Fri.'];

export default function checker(s, c) {
  const phase = s.value(0);
  const showCode = s.value(0);
  const probeIdx = s.value(0); // 0 -> 1 -> 2
  const showLit0 = s.value(0);
  const showRev0 = s.value(0);
  const showAsk1 = s.value(0);
  const showLit1 = s.value(0);
  const showRev1 = s.value(0);
  const showRev2 = s.value(0);
  const showAsk2 = s.value(0);
  const showLit2 = s.value(0);
  const showCompare = s.value(0);

  const bgAura = aura(-60, 40, 620, '#2a1b3d34', '#12304520');
  const title = heroTitle(['Would the Checker', 'Accept This Deadline?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.focus,
    eyebrow: 'SCORER AUDIT · FALSE POSITIVES & NEGATIVES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const idx = Math.round(probeIdx.value);
    const probe = probes[idx];
    const res = RESULTS[idx];
    const nodes = [];

    // Authoritative library rule floating on the upper-right
    nodes.push(
      txt('POLICY RULE', 320, -410, 26, ROLE.A, 'mono', 'center'),
      txt('Borrowed books are due on Friday.', 320, -358, 34, ROLE.A, 'serif', 'center').glow(
        6,
        ROLE.A,
      ),
      rule(-855, -258, 855, -258, COSMOS.rule, 2),
    );

    // Current candidate answer display (large, glowing, centered)
    nodes.push(
      txt(`CANDIDATE ANSWER ${idx + 1} OF 3`, 0, -214, 26, COSMOS.muted, 'mono'),
      lumBar(0, -136, 1340, 102, {
        color: ROLE.focus,
        fillOpacity: 0.12,
        strokeWidth: 2.2,
        glow: 7,
        radius: 12,
      }),
      txt(`"${probe.answer}"`, 0, -136, 48, COSMOS.ink, 'serif').glow(5, COSMOS.ink),
      txt(`Key token: "${KEY_WORDS[idx]}"`, 0, -58, 26, ROLE.focus, 'mono'),
    );

    // Left instrument: frozen literal substring checker
    const leftCx = -425;
    const codeOp = showCode.value;
    nodes.push(
      txt('FROZEN LITERAL CHECKER', leftCx, 12, 28, ROLE.A, 'mono'),
      lumBar(leftCx, 102, 760, 118, {
        color: ROLE.A,
        fillOpacity: 0.14 + 0.08 * codeOp,
        strokeWidth: 2.2,
        glow: 6 + 4 * codeOp,
        radius: 10,
      }),
      txt('"books" in answer.lower()', leftCx, 80, 30, COSMOS.ink, 'mono').opacity(
        0.45 + 0.55 * codeOp,
      ),
      txt('and "friday" in answer.lower()', leftCx, 124, 30, COSMOS.ink, 'mono').opacity(
        0.45 + 0.55 * codeOp,
      ),
    );

    // Right instrument: independent reviewed meaning
    const rightCx = 425;
    nodes.push(
      txt('REVIEWED DEADLINE', rightCx, 12, 28, ROLE.B, 'mono'),
      lumBar(rightCx, 102, 760, 118, {
        color: ROLE.B,
        fillOpacity: 0.12,
        strokeWidth: 2.0,
        glow: 5,
        radius: 10,
      }),
      txt('Does the answer preserve the Friday due date?', rightCx, 102, 28, COSMOS.muted, 'sans'),
    );

    // Determine gated literal & reviewed visibility for the active probe
    const litVis = idx === 0 ? showLit0.value : idx === 1 ? showLit1.value : showLit2.value;
    const revVis = idx === 0 ? showRev0.value : idx === 1 ? showRev1.value : showRev2.value;

    if (litVis > 0.02) {
      const lCol = res.literal ? ROLE.pass : ROLE.fail;
      const wordStr = res.words.map((w) => `${w.word} ${w.present ? '✓' : '×'}`).join('     ');
      nodes.push(
        txt(wordStr, leftCx, 206, 28, COSMOS.muted, 'mono').opacity(litVis),
        txt(res.literal ? 'CHECKER: PASS' : 'CHECKER: FAIL', leftCx, 270, 42, lCol, 'mono')
          .glow(10 * pulse, lCol)
          .opacity(litVis),
      );
    }

    if (revVis > 0.02) {
      const rCol = res.reviewed ? ROLE.pass : ROLE.fail;
      nodes.push(
        txt(probe.reason, rightCx, 206, 28, COSMOS.muted, 'sans').opacity(revVis),
        txt(res.reviewed ? 'REVIEWER: PASS' : 'REVIEWER: FAIL', rightCx, 270, 42, rCol, 'mono')
          .glow(10 * pulse, rCol)
          .opacity(revVis),
      );
    }

    // Highlight disagreement badges once both verdicts are revealed on probes 1 & 2
    const disagree = idx > 0 && litVis > 0.6 && revVis > 0.6;
    if (disagree) {
      const badge = idx === 1 ? 'FALSE POSITIVE' : 'FALSE NEGATIVE';
      nodes.push(txt(badge, 0, 270, 32, ROLE.fail, 'mono').glow(10 * pulse, ROLE.fail));
    }

    // Bottom prediction prompt / summary slot with zero text overlap
    const ask1Op = idx === 1 ? showAsk1.value * fadeOut(showLit1.value) : 0;
    const ask2Op = idx === 2 ? showAsk2.value * fadeOut(showLit2.value) : 0;
    const cmpOp = showCompare.value;

    if (ask1Op > 0.02) {
      nodes.push(
        txt('Will the literal checker accept this answer?', 0, 368, 38, ROLE.focus, 'serif')
          .glow(8, ROLE.focus)
          .opacity(ask1Op),
      );
    }
    if (ask2Op > 0.02) {
      nodes.push(
        txt('What will the same literal checker do?', 0, 368, 38, ROLE.focus, 'serif')
          .glow(8, ROLE.focus)
          .opacity(ask2Op),
      );
    }
    if (cmpOp > 0.02) {
      nodes.push(
        txt('Probe scorers on reviewed cases', 0, 368, 34, ROLE.accent, 'sans')
          .glow(6, ROLE.accent)
          .opacity(cmpOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'checker-test', showCode, 1, { duration: 0.45 });
  tweenCue(s, c, 'literal-first', showLit0, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'review-first', showRev0, 1, { duration: 0.45, after: true });

  c.on('later-answer', () => {
    s.play(showLit0.to(0, { duration: 0.15 }));
    s.play(showRev0.to(0, { duration: 0.15 }));
    s.play(probeIdx.to(1, { duration: 0.05 }));
  });
  tweenCue(s, c, 'later-ask', showAsk1, 1, { duration: 0.4 });
  c.after('later-literal', () => {
    s.play(showAsk1.to(0, { duration: 0.15 }));
    s.play(showLit1.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'later-meaning', showRev1, 1, { duration: 0.45, after: true });

  c.on('short-answer', () => {
    s.play(showLit1.to(0, { duration: 0.15 }));
    s.play(showRev1.to(0, { duration: 0.15 }));
    s.play(probeIdx.to(2, { duration: 0.05 }));
  });
  tweenCue(s, c, 'short-meaning', showRev2, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'short-ask', showAsk2, 1, { duration: 0.4 });
  c.after('short-literal', () => {
    s.play(showAsk2.to(0, { duration: 0.15 }));
    s.play(showLit2.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'compare-probes', showCompare, 1, { duration: 0.4 });
}
