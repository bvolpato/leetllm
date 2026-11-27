// Scene 7: Which matching page may enter the answer? (Tenant ACL filter before ranking)
import {
  COSMOS,
  accessConstruction,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function preserveTrustBoundaries(s, c) {
  const showScope = s.value(0);
  const showMatch = s.value(0);
  const showFilter = s.value(0);
  const showRank = s.value(0);
  const showRecheck = s.value(0);

  const bgAura = aura(0, 10, 700, '#102e5628', '#33142c1a');
  const title = heroTitle(['Which Matching Page', 'May Enter the Answer?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'ACCESS CONTROL · FILTER BY CALLER TENANT BEFORE RANKING',
  });

  const model = accessConstruction(1, 1);

  const live = guardedDynamic(s.value(1), () => {
    const sScope = showScope.value;
    const sMatch = showMatch.value;
    const sFilt = showFilter.value;
    const sRank = showRank.value;
    const sRech = showRecheck.value;

    const matched = sMatch > 0.35;
    const filtered = sFilt > 0.5;
    const ranked = sRank > 0.5;
    const rechecked = sRech > 0.5;

    const nodes = [
      // Request-scoped authorization banner
      glassCell(0, -192, 1710, 68, sScope > 0.3 ? COSMOS.blue : COSMOS.muted, {
        fill: '#10203a',
        glow: sScope > 0.3 ? 8 : 3,
      }),
      txt(
        'CALLER: support agent  ·  TENANT: support  ·  GRANT: support.read  ·  QUERY: "burst quota"',
        -830,
        -190,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Left table headers
      txt('DOCUMENT ID', -835, -124, 26, COSMOS.muted, 'mono', 'left'),
      txt('TENANT', -455, -124, 26, COSMOS.muted, 'mono', 'left'),
      txt('HITS', -220, -124, 26, COSMOS.muted, 'mono'),
      txt('ELIGIBILITY', -85, -124, 26, COSMOS.muted, 'mono', 'left'),
    ];

    model.rows.forEach((row, idx) => {
      const y = -56 + idx * 92;
      const isDenied = filtered && !row.eligible;
      const isPermitted = filtered && row.eligible;
      const tone = isDenied
        ? COSMOS.rose
        : isPermitted && row.score > 0
          ? COSMOS.emerald
          : matched && row.score > 0
            ? COSMOS.gold
            : COSMOS.ink;

      nodes.push(
        glassCell(
          -335,
          y,
          1040,
          74,
          isDenied ? COSMOS.rose : isPermitted && row.score > 0 ? COSMOS.emerald : COSMOS.dim,
          {
            fill: isDenied ? '#2a121c' : isPermitted && row.score > 0 ? '#0d2723' : '#10182d',
            glow: isDenied || (isPermitted && row.score > 0) ? 7 : 2,
            radius: 10,
          },
        ),
        txt(row.id, -835, y + 2, 28, tone, 'mono', 'left'),
        txt(row.tenant, -455, y + 2, 26, tone, 'mono', 'left'),
        txt(matched ? String(row.score) : '-', -220, y + 2, 30, tone, 'mono'),
        txt(
          filtered ? (row.eligible ? 'PERMITTED' : 'DENIED') : 'pending',
          -85,
          y + 2,
          26,
          filtered ? (row.eligible ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted,
          'mono',
          'left',
        ),
      );
    });

    // Glowing vertical ACL Firewall beam
    const wallX = 240;
    nodes.push(
      line([wallX, -104], [wallX, 262], {
        stroke: filtered ? COSMOS.rose : COSMOS.dim,
        width: filtered ? 6 : 3,
      }).glow(filtered ? 12 : 2, COSMOS.rose),
      txt('ACL GATE', wallX, -134, 26, filtered ? COSMOS.rose : COSMOS.muted, 'mono'),

      // Right permitted ranking vault
      glassCell(575, 76, 560, 368, ranked ? COSMOS.emerald : COSMOS.muted, {
        fill: ranked ? '#0d2624' : '#10182d',
        glow: ranked ? 9 : 3,
      }),
      txt('PERMITTED RANKED OUTPUT', 575, -62, 26, ranked ? COSMOS.emerald : COSMOS.muted, 'mono'),
    );

    if (ranked) {
      nodes.push(
        txt('#1  burst-policy', 575, 16, 34, COSMOS.emerald, 'mono'),
        txt('2 term matches · tenant: support', 575, 76, 26, COSMOS.cyan, 'sans'),
        txt('restricted-ops blocked (admin)', 575, 142, 26, COSMOS.rose, 'sans'),
      );
    } else {
      nodes.push(
        txt('Filter tenant before ranking', 575, 48, 28, COSMOS.muted, 'sans'),
        txt(
          filtered ? '1 eligible match survives' : 'Waiting for ACL check...',
          575,
          108,
          26,
          filtered ? COSMOS.emerald : COSMOS.dim,
          'mono',
        ),
      );
    }

    if (rechecked) {
      nodes.push(txt('Grant rechecked: valid', 575, 208, 26, COSMOS.emerald, 'mono'));
    }

    const bottomCol = filtered ? COSMOS.emerald : COSMOS.gold;
    const bottomMsg = filtered
      ? 'Filter caller tenant before ranking · treat history as data & recheck grants'
      : 'Both support policy and admin guide match 2 words: which may we use?';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('access-scope', () => s.play(showScope.to(1, { duration: 0.4 })));
  c.on('access-match', () => s.play(showMatch.to(1, { duration: 0.4 })));
  c.after('access-filter', () => s.play(showFilter.to(1, { duration: 0.45 })));
  c.on('access-rank', () => s.play(showRank.to(1, { duration: 0.45 })));
  c.on('access-recheck', () =>
    s.play(showRecheck.to(1, { duration: remainDuration(c, 'access-recheck', 0.45) })),
  );
}
