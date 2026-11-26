// Scene 12: Following a travel report back to its sources (DRIFT global->local follow-up, B correction blocks old report, lost-in-the-middle test)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function driftFollowups(s, c) {
  const phase = s.value(0);
  const showDrift = s.value(0);
  const showLocal = s.value(0);
  const showStale = s.value(0);
  const showMid = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Following a Travel Report', 'Back to Its Sources'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'DRIFT SEARCH · GLOBAL REPORT -> LOCAL FOLLOW-UPS · POSITION SENSITIVITY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sd = showDrift.value;
    const sl = showLocal.value;
    const st = showStale.value;
    const sm = showMid.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: DRIFT pipeline (Travel report -> Follow-up -> Local A & B -> B corrected!)
      txt(
        '1. DRIFT: COMMUNITY REPORT -> LOCAL BRANCHES',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -94, 780, 146, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sd > 0.3 ? 8 : 2,
      }),
      txt('Travel report names "River Walk"', -825, -132, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Follow-up Q: "Who published River Walk?"', -825, -86, 26, COSMOS.gold, 'sans', 'left'),
      txt(
        'DRIFT merges local branch answers into global reply',
        -825,
        -46,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(
        -465,
        114,
        780,
        198,
        st > 0.3 ? COSMOS.rose : sl > 0.3 ? COSMOS.emerald : COSMOS.muted,
        {
          fill: st > 0.3 ? '#26111a' : '#0e2624',
          glow: sl > 0.3 ? 9 * pulse : 2,
        },
      ),
      txt(
        st > 0.3
          ? 'RECORD B CORRECTED -> BLOCK OLD B & REPORTS!'
          : 'LOCAL SEARCH: A (book) + B (Willow Press)',
        -825,
        54,
        26,
        st > 0.3 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        st > 0.3
          ? 'Invalidate every report that cited old B v1'
          : 'Local follow-ups verify exact entities & sources',
        -825,
        102,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Fetch current version before naming publisher again',
        -825,
        148,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      // Right: Long-context prompt position test ("lost in the middle") + Breadth vs Latency
      txt('2. LONG PROMPT POSITION TEST VS GRAPHRAG', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -94, 750, 146, sm > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt(
        'Prompt 1: [ Card A ] [ ...long context... ]',
        145,
        -130,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Prompt 2: [ ... ] [ Card A ] [ ... ] (MIDDLE)',
        145,
        -84,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Models can miss evidence buried in the middle!',
        145,
        -44,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(495, 114, 750, 198, sm > 0.6 ? COSMOS.violet : COSMOS.muted, {
        fill: '#181430',
        glow: sm > 0.6 ? 8 * pulse : 2,
      }),
      txt('EVALUATE ON YOUR OWN QUESTIONS:', 145, 54, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        '· Original GraphRAG: judges favored breadth/variety',
        145,
        100,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Check whether BOTH positions cite Lena sentence',
        145,
        144,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        '· Compare supported details, LLM calls & latency',
        145,
        186,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'DRIFT combines global reports with local follow-ups; always block stale reports when sources update',
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
  runPhase(s, c, phase, 14);

  c.on('drift-followups-b1', () => s.play(showDrift.to(0.5, { duration: 0.35 })));
  c.on('drift-followups-question', () => s.play(showDrift.to(1, { duration: 0.35 })));
  c.on('drift-followups-followup-source', () => s.play(showLocal.to(0.5, { duration: 0.35 })));
  c.on('drift-followups-answer', () => s.play(showLocal.to(1, { duration: 0.35 })));
  c.on('drift-followups-followup-stale', () => s.play(showStale.to(1, { duration: 0.4 })));
  c.on('drift-followups-b3', () => s.play(showMid.to(0.35, { duration: 0.3 })));
  c.on('drift-followups-middle', () => s.play(showMid.to(0.65, { duration: 0.3 })));
  c.on('drift-followups-study', () =>
    s.play(showMid.to(1, { duration: remainDuration(c, 'drift-followups-study', 0.45) })),
  );
}
