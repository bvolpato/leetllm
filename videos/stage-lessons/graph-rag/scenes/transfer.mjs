// Scene 16: Back at the library desk (Earned transfer: v2 Juniper Press vs stale report + dedup book counts 4 -> 5 + 3D constellation)
import {
  COSMOS,
  TOPIC_4,
  TOPIC_5,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeKnowledgeConstellation3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const showV2 = s.value(0);
  const showEntries = s.value(0);
  const showCount4 = s.value(0);
  const showFifth = s.value(0);
  const showTie = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Back at the', 'Library Desk'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EARNED TRANSFER · FRESH V2 SOURCE VS STALE REPORT · DEDUP ID COUNTS',
  });

  const graph3d = makeKnowledgeConstellation3D(555, -20, phase, 'transfer');

  const live = guardedDynamic(s.value(1), () => {
    const v2 = showV2.value;
    const se = showEntries.value;
    const c4 = showCount4.value;
    const f5 = showFifth.value;
    const ti = showTie.value;

    const nodes = [
      // Task 1: Fresh v2 source vs stale Willow Press report (strict c.after withholding!)
      glassCell(-405, -142, 920, 146, v2 > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: v2 > 0.4 ? '#0e2824' : '#181e34',
        glow: v2 > 0.4 ? 9 : 3,
      }),
      txt(
        '1. FRESH SOURCE (B v2) VS STALE REPORT (WILLOW)',
        -835,
        -182,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'A -> current B v2 | Old report still rebuilding',
        -835,
        -138,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        v2 > 0.4
          ? 'CITE A + B v2 -> Juniper Press! (Keep old report out)'
          : 'Which source can you cite right now?  ?',
        -835,
        -96,
        26,
        v2 > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      // Task 2: Deduplicated book counts (5 entries = 4 unique books: B3 repeated!)
      glassCell(
        -405,
        28,
        920,
        146,
        c4 > 0.4 ? COSMOS.emerald : se > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: c4 > 0.4 ? '#0e2824' : '#101d35',
          glow: se > 0.3 ? 8 : 2,
        },
      ),
      txt(
        '2. COUNT BY UNIQUE ID: B1(G) B2(G) B3(T) B3(T) B4(C)',
        -835,
        -12,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        c4 > 0.4
          ? `DEDUP B3 -> ${TOPIC_4.books} books: Garden=${TOPIC_4.counts[0]}, Travel=${TOPIC_4.counts[1]}, Cook=${TOPIC_4.counts[2]}`
          : '5 entries (B3 repeated twice): which topic leads? ?',
        -835,
        34,
        26,
        c4 > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Impact score on a report cannot count unique books',
        -835,
        76,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Task 3: New book B5 (Travel) arrives -> Gardening & Travel tie 2/5!
      glassCell(
        -405,
        206,
        920,
        146,
        ti > 0.4 ? COSMOS.emerald : f5 > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: ti > 0.4 ? '#0e2824' : '#231c10',
          glow: f5 > 0.3 ? 10 : 2,
        },
      ),
      txt('3. NEW BOOK ARRIVES: B5 (Travel, NEW ID!)', -835, 166, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        ti > 0.4
          ? `TIE (${TOPIC_5.books} books): Garden=${TOPIC_5.counts[0]} & Travel=${TOPIC_5.counts[1]} (Cook=${TOPIC_5.counts[2]})`
          : 'With new ID B5 added, which topic leads now?  ?',
        -835,
        214,
        26,
        ti > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'New unique ID changes count; repeated mention does not',
        -835,
        254,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right 3D caption
      txt('3D VERIFIED EVIDENCE GRAPH', 555, -252, 26, COSMOS.emerald, 'mono'),
      txt('Current IDs beat stale summaries', 555, 258, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Ground answers in current authorized sources, block stale reports, and count unique IDs directly',
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

  s.add(bgAura, title, graph3d.view, live);
  runPhase(s, c, phase, 14);
  graph3d.orbit(s, c);

  c.on('transfer-choose', () => s.play(showV2.to(0.15, { duration: 0.3 })));
  c.on('transfer-follow', () => s.play(showV2.to(0.35, { duration: 0.3 })));
  c.after('transfer-lookup-result', () => s.play(showV2.to(1, { duration: 0.4 })));
  c.on('transfer-entries', () => s.play(showEntries.to(1, { duration: 0.4 })));
  c.on('transfer-same-book', () => s.play(showCount4.to(0.25, { duration: 0.3 })));
  c.on('transfer-count-two', () => s.play(showCount4.to(0.35, { duration: 0.3 })));
  c.after('transfer-count-result', () => s.play(showCount4.to(1, { duration: 0.4 })));
  c.on('transfer-fifth-book', () => s.play(showFifth.to(1, { duration: 0.4 })));
  c.after('transfer-tie', () =>
    s.play(showTie.to(1, { duration: remainDuration(c, 'transfer-tie', 0.45) })),
  );
}
