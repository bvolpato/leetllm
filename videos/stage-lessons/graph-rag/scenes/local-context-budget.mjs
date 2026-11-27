// Scene 10: Pack a local answer into ninety tokens (Greedy 90-tok packer: 30+55=85 rejects 80 -> raise report to 0.99 -> 80 leaves 10)
import {
  COSMOS,
  PACK_BASE,
  PACK_REPORT_TOP,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function localContextBudget(s, c) {
  const showPack1 = s.value(0);
  const showReject1 = s.value(0);
  const showRescore = s.value(0);
  const showPack2 = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Pack a Local Answer', 'into Ninety Tokens'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'LOCAL CONTEXT BUDGET · GREEDY WHOLE-ITEM PACKING · SCORE ORDER MATTERS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p1 = showPack1.value;
    const r1 = showReject1.value;
    const rs = showRescore.value;
    const p2 = showPack2.value;

    const nodes = [
      // Left: Pass 1 (Relation 0.98/30t + Policy 0.91/55t = 85/90t -> 5 left, Report 80t rejected!)
      txt(
        'PASS 1: REPORT SCORE = 0.62 (BUDGET = 90 TOK)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -72, 780, 196, r1 > 0.4 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#10203a',
        glow: p1 > 0.3 ? 8 : 3,
      }),
      txt(
        '1. Dependency edge (0.98) -> 30 tok  [PACKED]',
        -825,
        -134,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '2. Policy note     (0.91) -> 55 tok  [PACKED]',
        -825,
        -90,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(-825, -48, 690, 22, PACK_BASE.used / 90, COSMOS.emerald),
      txt(
        r1 > 0.4
          ? `Used ${PACK_BASE.used}/90 (${PACK_BASE.remaining} left) -> 80-tok report REJECTED`
          : `Used ${PACK_BASE.used}/90 (${PACK_BASE.remaining} left): will 80-tok report fit? ?`,
        -825,
        -6,
        26,
        r1 > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-465, 162, 780, 168, COSMOS.cyan, { fill: '#10182d', glow: 2 }),
      txt('LOCAL SEARCH & HYBRID BRIDGING', -825, 108, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '· Start from semantically matched entity descriptions',
        -825,
        152,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Deduplicate repeated book chunks; count real tokens',
        -825,
        194,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Pass 2 (Raise ONLY report score to 0.99 -> report takes 80/90 -> leaves 10 -> BOTH others dropped!)
      txt(
        'PASS 2: RAISE REPORT SCORE TO 0.99 (SAME 90 TOK)',
        110,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(
        495,
        -72,
        750,
        196,
        p2 > 0.4 ? COSMOS.amber : rs > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: p2 > 0.4 ? '#231c10' : '#181e34',
          glow: rs > 0.3 ? 9 : 2,
        },
      ),
      txt('1. Cache report (0.99) -> 80 tok', 145, -134, 26, COSMOS.gold, 'mono', 'left'),
      txt('2. Edge (30t) & Policy (55t) still wait', 145, -90, 26, COSMOS.ink, 'mono', 'left'),
      meterBar(145, -48, 660, 22, p2 > 0.4 ? PACK_REPORT_TOP.used / 90 : 0.08, COSMOS.amber),
      txt(
        p2 > 0.4
          ? `ONLY report (${PACK_REPORT_TOP.used}/90, ${PACK_REPORT_TOP.remaining} left -> drops both)`
          : 'Which items will the packer take now? ?',
        145,
        -6,
        26,
        p2 > 0.4 ? COSMOS.amber : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, 162, 750, 168, COSMOS.emerald, { fill: '#0e2624', glow: 2 }),
      txt('PRODUCTION PROMPT ACCOUNTING', 145, 108, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        '· Greedy whole-item order changes visible evidence',
        145,
        152,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Reserve room for prompt, question & answer tokens',
        145,
        194,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Changing a single rank score flips which whole sources survive inside a fixed token budget',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('local-context-budget-local', () => s.play(showPack1.to(0.25, { duration: 0.3 })));
  c.on('local-context-budget-place-edge', () => s.play(showPack1.to(0.55, { duration: 0.3 })));
  c.on('local-context-budget-pack-first', () => s.play(showPack1.to(0.8, { duration: 0.3 })));
  c.on('local-context-budget-pack-total', () => s.play(showPack1.to(1, { duration: 0.3 })));
  c.after('local-context-budget-pack-reject', () => s.play(showReject1.to(1, { duration: 0.4 })));
  c.on('local-context-budget-new-score', () => s.play(showRescore.to(1, { duration: 0.4 })));
  c.after('local-context-budget-place-report', () => s.play(showPack2.to(0.7, { duration: 0.35 })));
  c.on('local-context-budget-report-budget', () => s.play(showPack2.to(1, { duration: 0.35 })));
  c.on('local-context-budget-bridge', () =>
    s.play(showPack2.to(1, { duration: remainDuration(c, 'local-context-budget-bridge', 0.3) })),
  );
}
