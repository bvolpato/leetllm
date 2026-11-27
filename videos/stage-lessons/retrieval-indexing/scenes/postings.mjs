// Scene 2: Terms point to documents (Inverted index & posting list structure)
import {
  COSMOS,
  POSTINGS,
  SOUP_POSITIONS,
  TOKENS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function postings(s, c) {
  const showDocs = s.value(0);
  const showRecipeCounts = s.value(0);
  const showIds = s.value(0);
  const showDedupMenu = s.value(0);
  const showPositions = s.value(0);

  const bgAura = aura(0, 10, 660, '#12325a26', '#251a4c14');
  const title = heroTitle(['Terms Point', 'to Documents'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'INVERTED INDEX · ANALYZER -> POSTING LISTS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sd = showDocs.value;
    const sr = showRecipeCounts.value;
    const si = showIds.value;
    const sm = showDedupMenu.value;
    const sp = showPositions.value;

    const docRows = [
      {
        id: 'd1',
        tag: 'recipe',
        terms: `make(1), soup(1) · ${TOKENS.d1.length} terms`,
        col: COSMOS.emerald,
      },
      { id: 'd2', tag: 'paraphrase', terms: `cook, beans, soft · 0 query hits`, col: COSMOS.rose },
      {
        id: 'd3',
        tag: 'garden sign',
        terms: `change, color, sign · 0 query hits`,
        col: COSMOS.muted,
      },
      {
        id: 'd4',
        tag: 'lunch menu',
        terms: `soup(2), tomato · ${TOKENS.d4.length} terms`,
        col: COSMOS.amber,
      },
    ];

    const nodes = [
      txt('ANALYZED CORPUS (4 DOCS)', -855, -210, 26, COSMOS.muted, 'mono', 'left'),
      txt('INVERTED POSTING LISTS', 110, -210, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    docRows.forEach((row, i) => {
      const y = -125 + i * 114;
      const hi = (i === 0 && sr > 0.4) || (i === 3 && sm > 0.4);
      const col = hi ? row.col : sd > 0.3 ? row.col : COSMOS.muted;
      nodes.push(
        glassCell(-465, y, 760, 88, col, {
          fill: hi ? '#13263d' : '#101629',
          glow: hi ? 9 : 3,
          opacity: Math.max(0.75, sd),
        }),
        txt(`${row.id} (${row.tag})`, -820, y - 16, 26, col, 'mono', 'left'),
        txt(row.terms, -820, y + 18, 26, COSMOS.ink, 'sans', 'left'),
      );
    });

    // Right side: Inverted index term -> ordered doc IDs
    const opR = Math.max(0.74, si);
    // Term "make" -> [d1]
    nodes.push(
      glassCell(195, -90, 175, 86, si > 0.4 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10223b',
        glow: si > 0.4 ? 8 : 2,
        opacity: opR,
      }),
      txt('"make"', 195, -88, 30, COSMOS.cyan, 'mono').opacity(opR),
      glowingArc([288, -90], [398, -90], -22, { color: COSMOS.cyan, width: 3.6, opacity: opR }),
      glassCell(510, -90, 210, 86, COSMOS.emerald, { fill: '#0e2824', glow: 7, opacity: opR }),
      txt(`[ ${POSTINGS.make.join(', ')} ]`, 510, -88, 32, COSMOS.emerald, 'mono').opacity(opR),

      // Term "soup" -> [d1, d4]
      glassCell(195, 58, 175, 86, si > 0.4 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231e10',
        glow: si > 0.4 ? 8 : 2,
        opacity: opR,
      }),
      txt('"soup"', 195, 60, 30, COSMOS.gold, 'mono').opacity(opR),
      glowingArc([288, 58], [398, 58], 22, { color: COSMOS.gold, width: 3.6, opacity: opR }),
      glassCell(570, 58, 330, 86, COSMOS.gold, { fill: '#1e1c11', glow: 7, opacity: opR }),
      txt(`[ ${POSTINGS.soup.join(', ')} ]`, 570, 60, 32, COSMOS.gold, 'mono').opacity(opR),

      // Metadata payload box (d4 appears once, stores tf=2 and positions [1, 5])
      glassCell(
        465,
        224,
        780,
        138,
        sp > 0.4 ? COSMOS.cyan : sm > 0.4 ? COSMOS.amber : COSMOS.muted,
        {
          fill: sp > 0.4 ? '#0f233c' : '#12182b',
          glow: sp > 0.4 ? 9 : 3,
          opacity: Math.max(0.76, sm),
        },
      ),
      txt('POSTING PAYLOAD FOR d4 IN "soup"', 465, 184, 26, COSMOS.amber, 'mono'),
      txt(
        sp > 0.4
          ? `docId: d4  |  tf: 2  |  pos: [${SOUP_POSITIONS.join(', ')}]`
          : sm > 0.4
            ? 'd4 appears ONCE in posting list (tf=2)'
            : 'Ordered doc IDs + optional tf & pos',
        465,
        242,
        26,
        sp > 0.4 ? COSMOS.cyan : COSMOS.ink,
        'mono',
      ),
    );

    nodes.push(
      glowDot(-840, 355, { radius: 6, color: si > 0.4 ? COSMOS.rose : COSMOS.cyan }),
      txt(
        sp > 0.4
          ? 'Term -> documents direction defines an inverted index; d2 is absent from both lists'
          : 'Analyzer: lowercase, strip stopwords, keep alphabetic runs',
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

  c.on('postings-documents', () => s.play(showDocs.to(1, { duration: 0.45 })));
  c.on('postings-recipe-counts', () => s.play(showRecipeCounts.to(1, { duration: 0.45 })));
  c.on('postings-ids', () => s.play(showIds.to(1, { duration: 0.5 })));
  c.on('postings-beat-3-focus-1', () => s.play(showDedupMenu.to(1, { duration: 0.45 })));
  c.on('postings-position-metadata', () =>
    s.play(
      showPositions.to(1, { duration: remainDuration(c, 'postings-position-metadata', 0.45) }),
    ),
  );
}
