// Scene 05 (rag-stage): "Locate the first missing policy fact"
// 3-stage RAG evidence conduit tracing commander approval through final context, answer, and citation entailment.
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

export default function ragStage(s, c) {
  const phase = s.value(0);
  const pulsePacket = s.value(0);
  const dropCtx = s.value(0);
  const restoreCtx = s.value(0);
  const wrongAns = s.value(0);
  const showGenFail = s.value(0);
  const showCitation = s.value(0);
  const showCiteRule = s.value(0);

  const bgAura = aura(100, -10, 620, '#13384a36', '#33172c20');
  const title = heroTitle(['Locate the First Missing', 'Policy Fact in the Pipeline'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'RAG DIAGNOSIS · RETRIEVAL VS GENERATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const isDropped = dropCtx.value > 0.5 && restoreCtx.value < 0.5;
    const isWrong = wrongAns.value > 0.5;
    const cite = showCitation.value;
    const nodes = [];

    const xs = [-570, 0, 570];
    const railY = -120;

    // Stage headers
    nodes.push(
      txt('1. SOURCE POLICY P1', xs[0], railY - 94, 26, ROLE.A, 'mono'),
      txt('2. FINAL CONTEXT SENT', xs[1], railY - 94, 26, isDropped ? ROLE.fail : ROLE.A, 'mono'),
      txt('3. GENERATED ANSWER', xs[2], railY - 94, 26, isWrong ? ROLE.fail : ROLE.B, 'mono'),
    );

    // Stage 1: Source P1 (always intact)
    nodes.push(
      lumBar(xs[0], railY, 410, 92, {
        color: ROLE.A,
        fillOpacity: 0.22,
        strokeWidth: 2.6,
        glow: 9,
        radius: 12,
      }),
      txt('commander approval', xs[0], railY, 32, COSMOS.ink, 'sans'),
    );

    // Arrow 1 -> 2
    nodes.push(
      glowArrow([xs[0] + 216, railY], [xs[1] - 216, railY], isDropped ? ROLE.fail : ROLE.A, {
        width: 3.4,
        tip: 12,
      }),
    );

    // Travelling packet on Arrow 1 -> 2
    if (pulsePacket.value > 0.02 && pulsePacket.value < 0.98) {
      const px = xs[0] + 216 + pulsePacket.value * (xs[1] - xs[0] - 432);
      nodes.push(glowDot(px, railY, { radius: 8, color: ROLE.focus, glow: 14 }));
    }

    // Stage 2: Final Context (dropped during phase 0, restored in phase 1)
    nodes.push(
      lumBar(xs[1], railY, 410, 92, {
        color: isDropped ? ROLE.fail : ROLE.pass,
        fillOpacity: isDropped ? 0.14 : 0.22,
        strokeWidth: 2.8,
        glow: isDropped ? 12 * pulse : 8,
        radius: 12,
        dash: isDropped ? [10, 8] : undefined,
      }),
      txt(
        isDropped ? '[clause dropped in assembly]' : 'commander approval',
        xs[1],
        railY,
        isDropped ? 28 : 32,
        isDropped ? ROLE.fail : ROLE.pass,
        'sans',
      ),
    );

    // Arrow 2 -> 3
    nodes.push(
      glowArrow([xs[1] + 216, railY], [xs[2] - 216, railY], isWrong ? ROLE.fail : ROLE.B, {
        width: 3.4,
        tip: 12,
        opacity: isDropped ? 0.35 : 0.9,
      }),
    );

    // Stage 3: Generated Answer
    nodes.push(
      lumBar(xs[2], railY, 410, 92, {
        color: isWrong ? ROLE.fail : ROLE.B,
        fillOpacity: isWrong ? 0.26 : 0.2,
        strokeWidth: isWrong ? 3.2 : 2.4,
        glow: isWrong ? 12 * pulse : 8,
        radius: 12,
      }),
      txt(
        isWrong ? 'on-call engineer' : 'commander approval',
        xs[2],
        railY,
        32,
        isWrong ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );

    // Lower deck: Phase 0/1 inspection guide vs Phase 2 three-probe citation matrix
    const inspectOp = fadeOut(cite);
    const citeOp = fadeIn(cite);

    if (inspectOp > 0.02) {
      nodes.push(
        txt(
          'ORDER OF INSPECTION:  1. FINAL CONTEXT   ->   2. GENERATED ANSWER',
          0,
          100,
          28,
          COSMOS.muted,
          'mono',
        ).opacity(inspectOp),
      );
      const dropFailOp = dropCtx.value * fadeOut(restoreCtx.value);
      const genFailOp = showGenFail.value;
      if (dropFailOp > 0.02) {
        nodes.push(
          txt(
            'First observed failure: BAD RETRIEVAL (clause never reached the model)',
            0,
            230,
            36,
            ROLE.fail,
            'sans',
          )
            .glow(8, ROLE.fail)
            .opacity(inspectOp * dropFailOp),
        );
      }
      if (genFailOp > 0.02) {
        nodes.push(
          txt(
            'First observed failure: GENERATION / INSTRUCTION FOLLOWING',
            0,
            230,
            36,
            ROLE.focus,
            'sans',
          )
            .glow(8, ROLE.focus)
            .opacity(inspectOp * genFailOp),
        );
      }
    }

    if (citeOp > 0.02) {
      const probes3 = [
        ['Correct + right page', 'P1 · commander approval', ROLE.pass, -560],
        ['Correct + wrong page', 'P3 · commander approval', ROLE.accent, 0],
        ['Negated + right page', 'P1 · approval NOT required', ROLE.fail, 560],
      ];
      probes3.forEach(([head, claim, col, px]) => {
        nodes.push(
          lumBar(px, 140, 490, 132, {
            color: col,
            fillOpacity: 0.16,
            strokeWidth: 2.4,
            glow: 8,
            radius: 10,
            opacity: citeOp,
          }),
          txt(head, px, 112, 26, col, 'mono').opacity(citeOp),
          txt(claim, px, 162, 28, COSMOS.ink, 'sans').opacity(citeOp),
        );
      });
    }

    if (showCiteRule.value > 0.02) {
      nodes.push(
        txt(
          'Source identity != semantic entailment · preserve context, answer, and source versions',
          0,
          345,
          30,
          ROLE.focus,
          'sans',
        )
          .glow(7, ROLE.focus)
          .opacity(showCiteRule.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'rag-stage-phase-0', pulsePacket, 1, { duration: 1.1 });
  tweenCue(s, c, 'ba-rag-stage-drop', dropCtx, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'rag-stage-phase-1', pulsePacket, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-rag-stage-complete', restoreCtx, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-rag-stage-engineer', wrongAns, 1, { duration: 0.45 });
  tweenCue(s, c, 'generation-failure', showGenFail, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'rag-stage-phase-2', showCitation, 1, { duration: 0.55 });
  tweenCue(s, c, 'ba-rag-stage-citation', showCiteRule, 1, { duration: 0.5 });
}
