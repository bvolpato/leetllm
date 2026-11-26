// Scene 8: Judge the returned evidence (Recall@2, second lane union, end-to-end trace)
import {
  COSMOS,
  LEXICAL_TOP_TWO,
  RECALL_AT_TWO,
  RELEVANT,
  SECOND_LANE_UNION,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rerankFixture,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function evaluation(s, c) {
  const phase = s.value(0);
  const showRel = s.value(0);
  const showRec = s.value(0);
  const showSecond = s.value(0);
  const showFused = s.value(0);
  const showTrace = s.value(0);

  const bgAura = aura(0, 10, 660, '#13345e26', '#2c1a4e16');
  const title = heroTitle(['Judge the', 'Returned Evidence'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'SHORTLIST EVALUATION · RECALL@2 · MULTI-LANE FUSION · TRACE',
  });

  const finalTopTwo = rerankFixture(SECOND_LANE_UNION);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sr = showRel.value;
    const sc = showRec.value;
    const s2 = showSecond.value;
    const sf = showFused.value;
    const st = showTrace.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Lexical top-2 vs judged relevant
      txt('SPARSE LANE ONLY (TOP 2)', -855, -205, 26, COSMOS.amber, 'mono', 'left'),
      glassCell(-465, -100, 770, 134, sc > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#1c1810',
        glow: sc > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        `Judged relevant:  [ ${RELEVANT.join(', ')} ]`,
        -820,
        -130,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        `Lexical top-2:    [ ${LEXICAL_TOP_TWO.join(', ')} ]`,
        -820,
        -90,
        28,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        `Recall@2 = 1 / 2 = ${(RECALL_AT_TWO * 100).toFixed(0)}%  (d4 took d2's slot)`,
        -820,
        -52,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      // Right: Second lane + reranker reaches 2/2
      txt('SPARSE + SECOND LANE -> RERANKER', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),
      glassCell(
        485,
        -100,
        760,
        134,
        sf > 0.3 ? COSMOS.emerald : s2 > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: sf > 0.3 ? '#0e2824' : '#12182b',
          glow: sf > 0.3 ? 9 * pulse : 3,
          opacity: Math.max(0.75, s2),
        },
      ),
      txt(
        `Combined pool:    [ ${SECOND_LANE_UNION.join(', ')} ]`,
        135,
        -130,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        `Reranked top-2:   [ ${finalTopTwo.join(', ')} ]`,
        135,
        -90,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        sf > 0.3
          ? 'Recall@2 = 2 / 2 = 100%  (both useful pages!)'
          : 'Add dense paraphrase lane + rerank',
        135,
        -52,
        26,
        sf > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),

      // Bottom: 5-stage diagnostic pipeline
      txt('END-TO-END FAILURE TRACE', -855, 65, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    const stages = ['Analyzer', 'Postings', 'BM25 Score', 'Top-k Cut', 'Evaluation'];
    stages.forEach((label, i) => {
      const cx = -690 + i * 345;
      const hi = st > 0.3 || (sr > 0.3 && i === 4);
      nodes.push(
        glassCell(cx, 168, 275, 102, hi ? COSMOS.cyan : COSMOS.muted, {
          fill: hi ? '#10233d' : '#12182b',
          glow: hi ? 8 * pulse : 2,
        }),
        txt(`${i + 1}. ${label}`, cx, 170, 28, hi ? COSMOS.ink : COSMOS.muted, 'mono'),
      );
      if (i < stages.length - 1) {
        nodes.push(
          glowingArc([cx + 144, 168], [cx + 200, 168], -14, {
            color: hi ? COSMOS.cyan : COSMOS.muted,
            width: 3.2,
          }),
        );
      }
    });

    nodes.push(
      glowDot(-840, 345, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Tracing every stage separates a missed term from a weak score or too-tight shortlist',
        -812,
        347,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('evaluation-relevant', () => s.play(showRel.to(1, { duration: 0.45 })));
  c.on('evaluation-recall', () => s.play(showRec.to(1, { duration: 0.45 })));
  c.on('evaluation-beat-2-focus-1', () => s.play(showSecond.to(1, { duration: 0.45 })));
  c.on('evaluation-fuse-results', () => s.play(showFused.to(1, { duration: 0.45 })));
  c.on('evaluation-beat-3-focus-1', () =>
    s.play(showTrace.to(1, { duration: remainDuration(c, 'evaluation-beat-3-focus-1', 0.45) })),
  );
}
