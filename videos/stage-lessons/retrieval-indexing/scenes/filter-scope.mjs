// Scene 22: Which pages survive the version filter? (Post-filter starve vs pre-filter vs overfetch)
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

export default function filterScope(s, c) {
  const phase = s.value(0);
  const showShortlist = s.value(0);
  const showPreFilter = s.value(0);
  const showOverfetch = s.value(0);
  const showFour = s.value(0);
  const showAuth = s.value(0);
  const showUniverse = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1a5216');
  const title = heroTitle(['Which Pages Survive', 'the Version Filter?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'FILTERED RETRIEVAL · POST-FILTER STARVATION vs PRE-FILTER & PERMISSIONS',
  });

  const scored = [
    { rank: 1, ver: 'v1', score: '0.99', ok: false },
    { rank: 2, ver: 'v1', score: '0.98', ok: false },
    { rank: 3, ver: 'v2', score: '0.97', ok: true },
    { rank: 4, ver: 'v2', score: '0.96', ok: true },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showShortlist.value;
    const sp = showPreFilter.value;
    const so = showOverfetch.value;
    const s4 = showFour.value;
    const sa = showAuth.value;
    const su = showUniverse.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: 4 ranked pages (top 2 are v1, ranks 3-4 are v2)
      txt('RANKED CANDIDATES (NEED 2 x VERSION 2)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    scored.forEach((row, i) => {
      const y = -118 + i * 110;
      const col = row.ok ? COSMOS.emerald : COSMOS.rose;
      nodes.push(
        glassCell(-465, y, 760, 86, col, {
          fill: row.ok ? '#0e2624' : '#28111a',
          glow: (sp > 0.3 && row.ok) || (ss > 0.3 && !row.ok) ? 8 * pulse : 3,
        }),
        txt(`#${row.rank}  score ${row.score}`, -815, y + 2, 28, COSMOS.ink, 'mono', 'left'),
        txt(
          row.ok ? 'VERSION 2  (ELIGIBLE)' : 'VERSION 1  (FILTERED OUT)',
          -110,
          y + 2,
          26,
          col,
          'mono',
          'right',
        ),
      );
    });

    // Right: Post-filter vs Pre-filter vs Overfetch & Matched-universe benchmark
    nodes.push(
      txt('FILTER STRATEGY COMPARISON', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -110, 750, 114, ss > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt('POST-FILTER TOP-2 -> 0 PAGES!', 150, -134, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        'Top-2 are both v1 -> filter empties shortlist',
        150,
        -90,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(495, 28, 750, 118, sp > 0.3 || s4 > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sp > 0.3 ? '#0e2824' : '#12182b',
        glow: sp > 0.3 ? 9 * pulse : 2,
      }),
      txt('PRE-FILTER OR OVERFETCH DEPTH 4', 150, 2, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        so > 0.3 && s4 < 0.5
          ? 'Read 3 rows -> 1 v2 page  |  Read 4 -> 2 v2 pages'
          : 'Filter eligible v2 first -> 0.97 & 0.96 fill slots',
        150,
        48,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(495, 184, 750, 148, su > 0.3 || sa > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: su > 0.3 ? 8 * pulse : 2,
      }),
      txt('PERMISSIONS & MATCHED UNIVERSE', 150, 146, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '· Enforce access control before releasing text',
        150,
        188,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),
      txt('· Compare ANN vs Exact on the SAME v2 subset', 150, 224, 26, COSMOS.ink, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Define recall policy when fewer than K eligible items exist before averaging across queries',
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
  runPhase(s, c, phase, 14);

  c.on('filter-shortlist', () => s.play(showShortlist.to(1, { duration: 0.45 })));
  c.on('filter-first', () => s.play(showPreFilter.to(1, { duration: 0.45 })));
  c.on('filter-overfetch', () => s.play(showOverfetch.to(1, { duration: 0.45 })));
  c.on('filter-four', () => s.play(showFour.to(1, { duration: 0.45 })));
  c.on('filter-authority', () => s.play(showAuth.to(1, { duration: 0.45 })));
  c.on('matched-universe', () => s.play(showUniverse.to(0.6, { duration: 0.4 })));
  c.on('few-eligible', () =>
    s.play(showUniverse.to(1, { duration: remainDuration(c, 'few-eligible', 0.45) })),
  );
}
