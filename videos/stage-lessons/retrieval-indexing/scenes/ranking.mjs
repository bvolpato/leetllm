// Scene 5: Ranking exposes the vocabulary mismatch
import {
  COSMOS,
  RANKING,
  RELEVANT,
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

export default function ranking(s, c) {
  const showBars = s.value(0);
  const showZero = s.value(0);
  const showQ1 = s.value(0);
  const showQ2 = s.value(0);
  const showOptions = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2f1a4e16');
  const title = heroTitle(['Ranking Exposes the', 'Vocabulary Mismatch'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'BM25 RANKING · MECHANICS vs REPRESENTATION',
  });

  const meta = {
    d1: 'Soup recipe (useful)',
    d4: 'Lunch menu (not recipe)',
    d2: 'Cook beans paraphrase (useful!)',
    d3: 'Garden sign (unrelated)',
  };

  const live = guardedDynamic(s.value(1), () => {
    const sb = showBars.value;
    const sz = showZero.value;
    const s1 = showQ1.value;
    const s2 = showQ2.value;
    const so = showOptions.value;

    const nodes = [
      txt('BM25 RANKED SCORES (ALL 4 DOCS)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      txt('TWO SEPARATE QUESTIONS', 120, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    RANKING.forEach((row, i) => {
      const y = -115 + i * 112;
      const isRel = RELEVANT.includes(row.docId);
      const isMissed = row.docId === 'd2';
      const col = isMissed
        ? COSMOS.rose
        : isRel
          ? COSMOS.emerald
          : row.score > 0
            ? COSMOS.amber
            : COSMOS.muted;
      nodes.push(
        txt(`#${i + 1} ${row.docId}`, -855, y - 16, 28, col, 'mono', 'left'),
        txt(meta[row.docId], -725, y - 16, 26, COSMOS.ink, 'sans', 'left'),
        meterBar(-855, y + 26, 720, 32, (row.score / 1.8) * Math.max(0.25, sb), col, {
          glow: isMissed && sz > 0.3 ? 10 : 6,
        }),
        txt(row.score.toFixed(3), -110, y + 28, 28, col, 'mono', 'left'),
      );
    });

    // Right side: Two separate questions + candidate path options
    nodes.push(
      glassCell(495, -95, 750, 142, s1 > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: s1 > 0.3 ? '#0f233c' : '#12182b',
        glow: s1 > 0.3 ? 8 : 2,
      }),
      txt('1. INDEX EFFICIENCY', 150, -138, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Did traversal find exact matches fast?', 150, -96, 26, COSMOS.ink, 'sans', 'left'),
      txt('YES -> posting lists worked as built', 150, -60, 26, COSMOS.emerald, 'sans', 'left'),

      glassCell(495, 65, 750, 142, s2 > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: s2 > 0.3 ? '#29111b' : '#12182b',
        glow: s2 > 0.3 ? 9 : 2,
      }),
      txt('2. REPRESENTATION COVERAGE', 150, 22, 26, COSMOS.rose, 'mono', 'left'),
      txt('Did terms connect question to needed page?', 150, 64, 26, COSMOS.ink, 'sans', 'left'),
      txt('NO -> d2 paraphrase scored 0.000', 150, 100, 26, COSMOS.rose, 'sans', 'left'),

      glassCell(495, 225, 750, 142, so > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: so > 0.3 ? '#211c11' : '#12182b',
        glow: so > 0.3 ? 8 : 2,
      }),
      txt('BRIDGING THE GAP', 150, 182, 26, COSMOS.gold, 'mono', 'left'),
      txt('Synonyms / expansion OR dense lane', 150, 224, 26, COSMOS.ink, 'sans', 'left'),
      txt('Compare judged recall & cost fairly', 150, 260, 26, COSMOS.muted, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Exact posting traversal can still deliver an incomplete candidate set',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('ranking-beat-1-focus-1', () => s.play(showBars.to(1, { duration: 0.5 })));
  c.on('ranking-beat-1-focus-2', () => s.play(showZero.to(1, { duration: 0.45 })));
  c.on('ranking-beat-2-focus-1', () => s.play(showQ1.to(1, { duration: 0.45 })));
  c.on('ranking-beat-2-focus-2', () => s.play(showQ2.to(1, { duration: 0.45 })));
  c.on('ranking-beat-3-focus-1', () =>
    s.play(showOptions.to(1, { duration: remainDuration(c, 'ranking-beat-3-focus-1', 0.45) })),
  );
}
