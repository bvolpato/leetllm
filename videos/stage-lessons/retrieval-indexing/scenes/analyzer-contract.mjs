// Scene 9: Change the question and retain exact term identity (API key corpus & identifier collision)
import {
  COSMOS,
  CREDENTIAL_ROWS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function analyzerContract(s, c) {
  const showRecords = s.value(0);
  const showRel = s.value(0);
  const showTerms = s.value(0);
  const showPostings = s.value(0);
  const showCollision = s.value(0);
  const showRepair = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a5014');
  const title = heroTitle(['Analyzer Contract &', 'Exact Term Identity'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'QUERY: "HOW DO I ROTATE AN API KEY?" · TOKENIZATION vs KEYWORD FIELD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sr = showRecords.value;
    const sRel = showRel.value;
    const st = showTerms.value;
    const sp = showPostings.value;
    const sc = showCollision.value;
    const sRep = showRepair.value;

    const nodes = [
      txt('4-PASSAGE API KEY CORPUS', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      txt('ANALYZER OUTPUT & IDENTIFIER TRAP', 120, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    CREDENTIAL_ROWS.forEach((row, i) => {
      const y = -120 + i * 112;
      const col =
        sRel > 0.3 && row.relevant ? COSMOS.emerald : sr > 0.3 ? COSMOS.cyan : COSMOS.muted;
      nodes.push(
        glassCell(-445, y, 810, 88, col, {
          fill: sRel > 0.3 && row.relevant ? '#0e2824' : '#101629',
          glow: sRel > 0.3 && row.relevant ? 8 : 3,
        }),
        txt(row.id, -820, y - 16, 26, col, 'mono', 'left'),
        txt(
          row.relevant ? 'RELEVANT' : 'NOT RELEVANT',
          -740,
          y - 16,
          26,
          row.relevant ? COSMOS.emerald : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(row.text.replace(/→/g, '->'), -820, y + 18, 26, COSMOS.ink, 'sans', 'left'),
      );
    });

    // Right side: Query tokenization + posting hits + identifier collision repair
    nodes.push(
      glassCell(
        495,
        -108,
        750,
        142,
        sp > 0.3 ? COSMOS.cyan : st > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: '#10203a',
          glow: st > 0.3 ? 8 : 3,
        },
      ),
      txt('QUERY -> [ rotate, api, key ]', 150, -148, 26, COSMOS.cyan, 'mono', 'left'),
      txt('rotate -> [] (0 exact hits!)', 150, -108, 26, COSMOS.rose, 'mono', 'left'),
      txt('api, key -> [ d1, d4 ]   (d2 missed)', 150, -70, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(495, 58, 750, 134, sc > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sc > 0.3 ? '#291019' : '#12182b',
        glow: sc > 0.3 ? 9 : 2,
      }),
      txt('IDENTIFIER COLLISION (LETTERS-ONLY)', 150, 24, 26, COSMOS.rose, 'mono', 'left'),
      txt('AUTH_401 -> "auth"  |  AUTH_403 -> "auth"', 150, 68, 26, COSMOS.ink, 'mono', 'left'),
      txt('rotate_api_key -> [rotate, api, key]', 150, 104, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(495, 224, 750, 124, sRep > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sRep > 0.3 ? '#0e2824' : '#12182b',
        glow: sRep > 0.3 ? 9 : 2,
      }),
      txt('DUAL-FIELD REPAIR', 150, 192, 26, COSMOS.emerald, 'mono', 'left'),
      txt('· keyword field: exact code AUTH_401', 150, 232, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· analyzed field: prose search (same rules!)',
        150,
        266,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Query and document analysis must match; changing tokenization requires rebuilding the index',
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

  c.on('credential-records', () => s.play(showRecords.to(1, { duration: 0.45 })));
  c.on('credential-relevance', () => s.play(showRel.to(1, { duration: 0.45 })));
  c.on('analyzer-terms', () => s.play(showTerms.to(1, { duration: 0.45 })));
  c.on('analyzer-postings', () => s.play(showPostings.to(1, { duration: 0.45 })));
  c.on('identifier-collision', () => s.play(showCollision.to(1, { duration: 0.45 })));
  c.on('keyword-repair', () =>
    s.play(showRepair.to(1, { duration: remainDuration(c, 'keyword-repair', 0.45) })),
  );
}
