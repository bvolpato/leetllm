// Scene 4: What do the repeated words buy? (Overlap 0 / 2 / 4 indexed cost vs 10-word rule impossibility)
import {
  COSMOS,
  OVERLAP_EXP,
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

export default function overlapLimit(s, c) {
  const showO0 = s.value(0);
  const showO2 = s.value(0);
  const showO4 = s.value(0);
  const showRule = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['What Do Repeated', 'Words Buy?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'OVERLAP TRADE-OFF · WIDTH = 7 · 17-WORD PAGE · 10-WORD RULE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const s0 = showO0.value;
    const s2 = showO2.value;
    const s4 = showO4.value;
    const sr = showRule.value;

    const rows = [
      {
        exp: OVERLAP_EXP[0],
        goldHits: '0 hits with 5-word gold phrase',
        col: COSMOS.rose,
        hi: s0 > 0.3,
      },
      {
        exp: OVERLAP_EXP[1],
        goldHits: '1 hit with 5-word gold phrase',
        col: COSMOS.emerald,
        hi: s2 > 0.3,
      },
      {
        exp: OVERLAP_EXP[2],
        goldHits: 'Still 1 hit (nearly 2x index size!)',
        col: COSMOS.amber,
        hi: s4 > 0.3,
      },
    ];

    const nodes = [
      txt(
        'INDEXED WORD OCCURRENCES (WIDTH = 7 ON 17 WORDS)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('GEOMETRIC CEILING', 220, -205, 26, COSMOS.rose, 'mono', 'left'),
    ];

    rows.forEach((r, i) => {
      const y = -105 + i * 134;
      nodes.push(
        glassCell(-360, y, 1010, 108, r.hi ? r.col : COSMOS.muted, {
          fill: r.hi ? '#141f38' : '#101629',
          glow: r.hi ? 9 : 3,
        }),
        txt(
          `overlap = ${r.exp.overlap} (${r.exp.chunks} chunks)`,
          -835,
          y - 22,
          26,
          r.col,
          'mono',
          'left',
        ),
        txt(r.goldHits, -350, y - 22, 26, COSMOS.ink, 'sans', 'left'),
        meterBar(-835, y + 22, 740, 24, r.exp.indexedWords / 35, r.col),
        txt(`${r.exp.indexedWords} words`, -65, y + 24, 27, r.col, 'mono', 'left'),
      );
    });

    // Right: Hard geometric ceiling (10-word rule > 7-word window!)
    nodes.push(
      glassCell(535, 30, 680, 376, sr > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sr > 0.3 ? '#29111a' : '#12182b',
        glow: sr > 0.3 ? 10 : 3,
      }),
      txt('FULL PAGING RULE = 10 WORDS', 535, -108, 27, COSMOS.gold, 'mono'),
      txt('MAX WINDOW WIDTH =  7 WORDS', 535, -56, 27, COSMOS.cyan, 'mono'),
      txt(
        `COMPLETE-RULE HITS:  ${OVERLAP_EXP[2].completeRuleChunks}  (AT EVERY OVERLAP!)`,
        535,
        16,
        26,
        COSMOS.rose,
        'mono',
      ),
      txt('More overlap NEVER fits a 10-word', 535, 92, 26, COSMOS.ink, 'sans'),
      txt('rule inside a 7-word window.', 535, 128, 26, COSMOS.ink, 'sans'),
      txt('Fix: keep section intact or expand parent', 535, 182, 26, COSMOS.emerald, 'mono'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'Overlap rescues short boundary phrases, not rules longer than the window itself',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('zero-overlap', () => s.play(showO0.to(1, { duration: 0.45 })));
  c.on('two-overlap', () => s.play(showO2.to(1, { duration: 0.45 })));
  c.on('four-overlap', () => s.play(showO4.to(1, { duration: 0.45 })));
  c.on('compare-whole-rule', () => s.play(showRule.to(0.6, { duration: 0.4 })));
  c.on('whole-rule-count', () =>
    s.play(showRule.to(1, { duration: remainDuration(c, 'whole-rule-count', 0.45) })),
  );
}
