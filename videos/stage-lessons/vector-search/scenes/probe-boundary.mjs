// Scene 7: Opening a posting list (Strict prediction withholding on slot 2: A, ? -> A, C -> open right -> A, B)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  postingList,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function probeBoundary(s, c) {
  const showLeft = s.value(0);
  const showFirst = s.value(0);
  const showSlot2 = s.value(0);
  const showRight = s.value(0);
  const showSwap = s.value(0);
  const showWork = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Opening a', 'Posting List'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'NPROBE BUDGET · LEFT LIST MISSES B · OPENING RIGHT RESTORES B',
  });

  const leftRows = postingList(0);
  const rightRows = postingList(1);

  const live = guardedDynamic(s.value(1), () => {
    const sl = showLeft.value;
    const sf = showFirst.value;
    const s2 = showSlot2.value;
    const sr = showRight.value;
    const sw = showSwap.value;
    const wk = showWork.value;

    const slot1 = sf > 0.3 ? 'A (0.08)' : '?';
    const slot2 = sw > 0.4 ? 'B (0.09)' : s2 > 0.4 ? 'C (1.25)' : '?';

    const nodes = [
      // Left: Posting list drawers (Left open first; Right closed until open-right!)
      txt(
        'POSTING LIST SCANS (EXACT COORDS INSIDE LISTS)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-455, -92, 810, 146, sl > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sl > 0.3 ? 8 : 2,
      }),
      txt('LEFT LIST (OPEN)', -825, -132, 26, COSMOS.cyan, 'mono', 'left'),
      ...leftRows.flatMap((row, i) => [
        txt(
          `${row.id}: ${sl > 0.3 ? row.d2.toFixed(2) : '...'}`,
          -825 + i * 255,
          -72,
          28,
          row.id === 'A' ? COSMOS.emerald : COSMOS.ink,
          'mono',
          'left',
        ),
      ]),

      glassCell(-455, 92, 810, 146, sr > 0.3 ? COSMOS.emerald : COSMOS.rose, {
        fill: sr > 0.3 ? '#0e2824' : '#26111a',
        glow: sr > 0.3 ? 9 : 2,
      }),
      txt(
        sr > 0.3 ? 'RIGHT LIST (NOW OPEN -> nprobe = 2)' : 'RIGHT LIST (CLOSED -> NO SCORES!)',
        -825,
        52,
        26,
        sr > 0.3 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      ...rightRows.flatMap((row, i) => [
        txt(
          `${row.id}: ${sr > 0.3 ? row.d2.toFixed(2) : 'unscored'}`,
          -825 + i * 255,
          112,
          28,
          sr > 0.3 && row.id === 'B' ? COSMOS.emerald : COSMOS.muted,
          'mono',
          'left',
        ),
      ]),

      // Right: Top-2 Result Slots (STRICT prediction withholding before show-left-pair & replace-c!)
      txt('TOP-2 RESULT SLOTS', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(
        495,
        -92,
        750,
        146,
        sw > 0.4 ? COSMOS.emerald : s2 > 0.4 ? COSMOS.amber : COSMOS.gold,
        {
          fill: sw > 0.4 ? '#0e2824' : '#181e34',
          glow: 9,
        },
      ),
      txt(`#1  ${slot1}`, 150, -124, 34, COSMOS.emerald, 'mono', 'left'),
      txt(
        `#2  ${slot2}`,
        150,
        -64,
        34,
        sw > 0.4 ? COSMOS.emerald : s2 > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, 114, 750, 198, wk > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: wk > 0.3 ? 8 : 2,
      }),
      txt('WORK LEDGER (NPROBE = OPENED LISTS)', 145, 56, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Coarse centroids scored:  2  (both runs)', 145, 102, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        sr > 0.3
          ? 'Passage vectors scored:  3 -> 6 (nprobe 1->2)'
          : 'Passage vectors scored:  3 (rerank misses B)',
        145,
        146,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Skewed list sizes mean 1 probe != constant work',
        145,
        186,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sw > 0.4 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        'Reranking a closed set cannot recover a neighbor sitting behind an unopened Voronoi boundary',
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

  c.on('probe-left', () => s.play(showLeft.to(1, { duration: 0.4 })));
  c.on('first-slot', () => s.play(showFirst.to(1, { duration: 0.35 })));
  c.after('show-left-pair', () => s.play(showSlot2.to(1, { duration: 0.4 })));
  c.on('inspect-miss', () => s.play(showSlot2.to(1, { duration: 0.3 })));
  c.on('open-right', () => s.play(showRight.to(1, { duration: 0.4 })));
  c.after('replace-c', () => s.play(showSwap.to(1, { duration: 0.4 })));
  c.on('count-work', () =>
    s.play(showWork.to(1, { duration: remainDuration(c, 'count-work', 0.45) })),
  );
}
