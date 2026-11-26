// Scene 06 (rag-metrics): "Measure what arrived and what was said"
// Three distinct RAG denominators (Ranked Precision, Reference Recall, Claim Faithfulness) + Relevancy cosines.
import { delay, par, to } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rankedPrecision,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const AP = rankedPrecision([1, 0, 1]); // 5/6 = 0.8333...

export default function ragMetrics(s, c) {
  const phase = s.value(0);
  const showP1 = s.value(0);
  const showP3 = s.value(0);
  const showAP = s.value(0);
  const focusFacts = s.value(0);
  const showRecall = s.value(0);
  const showClaims = s.value(0);
  const showFaith = s.value(0);
  const showRel = s.value(0);
  const cuePulse = s.value(0);

  const bgAura = aura(240, 20, 620, '#133a4436', '#281f4d1e');
  const title = heroTitle(['Keep the Denominators', 'Separate Across RAG Metrics'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.focus,
    eyebrow: 'RAG METRICS · PRECISION, RECALL, FAITHFULNESS',
  });

  const apTex = glowTex('AP = \\frac{1/1 + 2/3}{2} = \\frac{5}{6} \\approx 0.833', {
    x: 425,
    y: -150,
    size: 38,
    color: ROLE.focus,
  }).opacity(0);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const nodes = [];

    // ROW 1: Ranked Context Precision (flags: 1, 0, 1)
    const r1Y = -150;
    nodes.push(
      txt('1. RANKED PRECISION', -855, r1Y - 30, 26, ROLE.A, 'mono', 'left'),
      txt('Rewards relevant chunks early', -855, r1Y + 12, 26, COSMOS.muted, 'sans', 'left'),
    );
    const flags = [1, 0, 1];
    flags.forEach((flag, i) => {
      const cx = -320 + i * 165;
      const col = flag ? ROLE.pass : ROLE.fail;
      const hi = (i === 0 && showP1.value > 0.3) || (i === 2 && showP3.value > 0.3);
      nodes.push(
        txt(`rank ${i + 1}`, cx, r1Y - 56, 26, COSMOS.muted, 'mono'),
        lumBar(cx, r1Y, 120, 68, {
          color: col,
          fillOpacity: 0.24,
          strokeWidth: hi ? 3.2 : 2.2,
          glow: hi ? 12 * pulse : 6,
          radius: 10,
        }),
        txt(String(flag), cx, r1Y, 36, col, 'mono'),
      );
    });

    // Progressive P@1 -> P@3 readout (strictly non-overlapping with apTex which appears on showAP)
    const p1Op = showP1.value * fadeOut(showP3.value) * fadeOut(showAP.value);
    const p3Op = fadeIn(showP3.value) * fadeOut(showAP.value);
    if (p1Op > 0.02) {
      nodes.push(
        txt('P@1 = 1/1 = 1.00', 425, r1Y, 36, ROLE.focus, 'mono').glow(8, ROLE.focus).opacity(p1Op),
      );
    }
    if (p3Op > 0.02) {
      nodes.push(
        txt('P@1 = 1/1     P@3 = 2/3', 425, r1Y, 36, ROLE.focus, 'mono')
          .glow(8, ROLE.focus)
          .opacity(p3Op),
      );
    }

    // ROW 2: Reference Context Recall (2 of 3 required facts covered)
    const r2Y = 25;
    const reqFacts = [
      ['approval', true],
      ['rollback', true],
      ['revocation', false],
    ];
    nodes.push(
      rule(-855, r1Y + 86, 855, r1Y + 86, COSMOS.rule, 1.8),
      txt('2. CONTEXT RECALL', -855, r2Y - 26, 26, ROLE.A, 'mono', 'left'),
      txt('Covered / required facts', -855, r2Y + 16, 26, COSMOS.muted, 'sans', 'left'),
    );
    const factXs = [-350, -95, 160];
    reqFacts.forEach(([word, present], i) => {
      const cx = factXs[i];
      const col = present ? ROLE.A : ROLE.fail;
      nodes.push(
        lumBar(cx, r2Y, 226, 68, {
          color: col,
          fillOpacity: present ? 0.2 : 0.16,
          strokeWidth: !present && showRecall.value > 0.3 ? 3.2 : 2.2,
          glow: !present && showRecall.value > 0.3 ? 12 * pulse : 5,
          radius: 10,
          dash: present ? undefined : [8, 6],
        }),
        txt(`${word} ${present ? '✓' : '×'}`, cx, r2Y, 26, col, 'mono'),
      );
    });
    if (showRecall.value > 0.02) {
      nodes.push(
        txt('Recall = 2 / 3 = 0.667', 575, r2Y, 34, ROLE.focus, 'mono')
          .glow(8, ROLE.focus)
          .opacity(showRecall.value),
      );
    }

    // ROW 3: Claim Faithfulness (2 supported / 2 emitted = 1.0 despite missing revocation!)
    const r3Y = 195;
    nodes.push(
      rule(-855, r2Y + 86, 855, r2Y + 86, COSMOS.rule, 1.8),
      txt('3. FAITHFULNESS', -855, r3Y - 26, 26, ROLE.B, 'mono', 'left'),
      txt('Supported / stated claims', -855, r3Y + 16, 26, COSMOS.muted, 'sans', 'left'),
    );
    if (showClaims.value > 0.02) {
      ['approval', 'rollback'].forEach((word, i) => {
        const cx = factXs[i];
        nodes.push(
          lumBar(cx, r3Y, 226, 68, {
            color: ROLE.pass,
            fillOpacity: 0.24,
            strokeWidth: 2.4,
            glow: 8,
            radius: 10,
            opacity: showClaims.value,
          }),
          txt(`${word} ✓`, cx, r3Y, 26, ROLE.pass, 'mono').opacity(showClaims.value),
        );
      });
      // Explicit gap indicator showing omitted third fact
      nodes.push(
        txt('omitted', factXs[2], r3Y, 26, ROLE.fail, 'mono').opacity(showClaims.value * 0.9),
      );
    } else {
      nodes.push(txt('Awaiting emitted answer claims...', -180, r3Y, 26, COSMOS.dim, 'mono'));
    }

    if (showFaith.value > 0.02) {
      nodes.push(
        txt('Faithful = 2 / 2 = 1.00', 575, r3Y, 34, ROLE.pass, 'mono')
          .glow(10 * pulse, ROLE.pass)
          .opacity(showFaith.value),
      );
    }

    // Bottom zone: Completeness warning vs Response Relevancy cosine similarity
    const warnOp = showFaith.value * fadeOut(showRel.value);
    const relOp = fadeIn(showRel.value);
    if (warnOp > 0.02) {
      nodes.push(
        txt(
          'Faithful = 1.00, yet still incomplete (Recall = 2/3)',
          0,
          355,
          30,
          ROLE.accent,
          'sans',
        ).opacity(warnOp),
      );
    }
    if (relOp > 0.02) {
      nodes.push(
        txt(
          'Response Relevancy: generate questions from answer -> average cosine similarity to original query',
          0,
          330,
          28,
          ROLE.A,
          'sans',
        )
          .glow(6, ROLE.A)
          .opacity(relOp),
        txt(
          'On-topic text can still drop who approves -> calibrate against independent reviewer labels',
          0,
          380,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(relOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live, apTex);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'rag-metrics-phase-0', showP1, 0, { duration: 0.1 });
  tweenCue(s, c, 'precision-first', showP1, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'ba-rag-metrics-rank1', cuePulse, 1, { duration: 0.25 });
  tweenCue(s, c, 'precision-third', showP3, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'ba-rag-metrics-rank3', cuePulse, 2, { duration: 0.25 });
  c.after('precision-average', () => {
    s.play(
      par(
        showAP.to(1, { duration: 0.35 }),
        delay(
          to(apTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.22,
        ),
      ),
    );
  });
  tweenCue(s, c, 'ba-rag-metrics-average', cuePulse, 3, { duration: 0.25 });
  tweenCue(s, c, 'rag-metrics-phase-1', focusFacts, 1, { duration: 0.4 });
  tweenCue(s, c, 'context-recall', showRecall, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-rag-metrics-recall', cuePulse, 4, { duration: 0.25 });
  tweenCue(s, c, 'two-claims', showClaims, 1, { duration: 0.45 });
  tweenCue(s, c, 'faithfulness-one', showFaith, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ba-rag-metrics-faithful', cuePulse, 5, { duration: 0.25 });
  tweenCue(s, c, 'rag-metrics-phase-2', showRel, 1, { duration: 0.5 });
  tweenCue(s, c, 'ba-rag-metrics-relevance', cuePulse, 6, { duration: 0.25 });
}
