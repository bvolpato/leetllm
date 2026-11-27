// Scene 9: What's on the rest of the shelf? (Global map-reduce over community reports vs top-2 narrow vector hits)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function communityOverview(s, c) {
  const showHits = s.value(0);
  const showReports = s.value(0);
  const showBatches = s.value(0);
  const showPartials = s.value(0);
  const showReduce = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(["What's on the Rest", 'of the Shelf?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'GLOBAL MAP-REDUCE · PRECOMPUTED COMMUNITY REPORTS COVER FULL CORPUS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sh = showHits.value;
    const sr = showReports.value;
    const sb = showBatches.value;
    const sp = showPartials.value;
    const sd = showReduce.value;

    const nodes = [
      // Left: 4-book shelf vs Top-2 search tunnel vision
      txt('1. TOP-2 VECTOR HITS VS WHOLE SHELF', -855, -205, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(-465, -94, 780, 146, sh > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: sh > 0.3 ? 8 : 2,
      }),
      txt(
        'Top-2 hits: Compost + Balcony Herbs (both Gardening)',
        -825,
        -132,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),
      txt('Shelf: B1(Gard) B2(Gard) B3(Trav) B4(Cook)', -825, -86, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        sr > 0.4
          ? 'MISSED SUBJECTS: Travel & Cooking!'
          : 'Which subjects did top-2 hits leave out?  ?',
        -825,
        -44,
        26,
        sr > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-465, 114, 780, 198, sr > 0.4 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sr > 0.4 ? 8 : 2,
      }),
      txt('2. PRECOMPUTED COMMUNITY REPORTS (3 GROUPS)', -825, 52, 26, COSMOS.cyan, 'mono', 'left'),
      txt('· Report 1: Gardening (B1, B2)', -825, 98, 26, COSMOS.emerald, 'mono', 'left'),
      txt('· Report 2: Travel (B3)', -825, 140, 26, COSMOS.cyan, 'mono', 'left'),
      txt('· Report 3: Cooking (B4)', -825, 182, 26, COSMOS.gold, 'mono', 'left'),

      // Right: Map batches -> Partial answers -> Reduced global overview
      txt('3. GLOBAL MAP-REDUCE PIPELINE', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(495, -94, 750, 146, sb > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: sb > 0.3 ? 8 : 2,
      }),
      txt(
        'MAP BATCH 1: [ Gardening + Travel ] -> Partial 1',
        145,
        -124,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'MAP BATCH 2: [ Cooking ]            -> Partial 2',
        145,
        -72,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(
        495,
        114,
        750,
        198,
        sd > 0.3 ? COSMOS.emerald : sp > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: sd > 0.3 ? '#0e2824' : '#181e34',
          glow: sd > 0.3 ? 10 : 3,
        },
      ),
      txt('REDUCE: COMBINE PARTIAL ANSWERS', 145, 52, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Covers ALL 3: Gardening + Travel + Cooking!',
        145,
        100,
        28,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      txt('Follow report citations back to source books', 145, 146, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Need exact book counts? Count underlying IDs!',
        145,
        188,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Map-reduce over community reports answers corpus-wide overview questions top-k search misses',
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

  c.on('community-overview-hits', () => s.play(showHits.to(1, { duration: 0.4 })));
  c.after('community-overview-reports', () => s.play(showReports.to(1, { duration: 0.4 })));
  c.on('community-overview-batches', () => s.play(showBatches.to(1, { duration: 0.4 })));
  c.on('community-overview-partials', () => s.play(showPartials.to(1, { duration: 0.4 })));
  c.on('community-overview-reduce', () =>
    s.play(showReduce.to(1, { duration: remainDuration(c, 'community-overview-reduce', 0.45) })),
  );
}
