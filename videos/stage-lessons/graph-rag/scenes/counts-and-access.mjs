// Scene 15: Who can read the report? (Audience intersection: staff->public only, security->both; B v2 invalidates edge + child + parent reports)
import {
  COSMOS,
  aura,
  blockedDescendants,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  reportAudience,
  runPhase,
  txt,
} from '../parts.mjs';

export default function countsAndAccess(s, c) {
  const phase = s.value(0);
  const showStaff = s.value(0);
  const showPublic = s.value(0);
  const showSec = s.value(0);
  const showBoth = s.value(0);
  const showV2 = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Who Can Read', 'the Report?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'ACCESS INTERSECTION & VERSION INVALIDATION · BLOCK STALE DESCENDANTS',
  });

  const mixedAud = reportAudience([['staff', 'security'], ['security']]);
  const blocked = blockedDescendants(['B-v1'], {
    edge: ['B-v1'],
    child: ['edge'],
    parent: ['child'],
    travel: ['T-v1'],
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showStaff.value;
    const sp = showPublic.value;
    const sc = showSec.value;
    const sb = showBoth.value;
    const sv = showV2.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Audience intersection check (strict c.after withholding on staff & security admission!)
      txt(
        '1. REPORT AUDIENCE = INTERSECTION OF SOURCES',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -94, 780, 146, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: 5,
      }),
      txt('Public (A, B):   [staff, security]', -825, -130, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `Mixed (A, B, R): [${mixedAud.join(', ')}] ONLY`,
        -825,
        -84,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        'Removing R’s citation does NOT hide R’s facts!',
        -825,
        -44,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glassCell(
        -465,
        114,
        780,
        198,
        sb > 0.4 ? COSMOS.emerald : sp > 0.4 ? COSMOS.gold : COSMOS.muted,
        {
          fill: sb > 0.4 ? '#0e2824' : '#231c10',
          glow: 9 * pulse,
        },
      ),
      txt(
        sp > 0.4
          ? 'STAFF READER: send PUBLIC report ALONE!'
          : 'STAFF READER: which report enters map step?  ?',
        -825,
        56,
        26,
        sp > 0.4 ? COSMOS.gold : COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        sb > 0.4
          ? 'SECURITY READER: can open A, B, R -> ADMIT BOTH!'
          : sc > 0.3
            ? 'SECURITY READER: admit public or both?  ?'
            : 'Precompute per-tier or fallback to local',
        -825,
        112,
        26,
        sb > 0.4 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Check permissions BEFORE sending reports to LLM',
        -825,
        168,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Revision invalidation cascade (B v1 -> B v2)
      txt('2. REVISION CASCADE (B v1 -> v2)', 110, -205, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(495, -72, 750, 198, sv > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sv > 0.3 ? '#28111a' : '#12182b',
        glow: sv > 0.3 ? 10 * pulse : 2,
      }),
      txt('B REPLACED WITH V2 -> BLOCK IMMEDIATELY:', 145, -132, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        `Blocked (${blocked.length}): ${blocked.join('->')}`,
        145,
        -84,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Also invalidate any cached prompt using old B v1',
        145,
        -38,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(495, 152, 750, 164, sv > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: 4,
      }),
      txt('INDEPENDENT ARTIFACTS STAY LIVE', 145, 102, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Travel report (depends on T-v1) stays in service!',
        145,
        150,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Rebuilding reports takes time while users wait',
        145,
        192,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.rose }),
      txt(
        'Enforce source-audience intersections on reports and cascade invalidations on source edits',
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

  c.on('counts-and-access-readers', () => s.play(showStaff.to(1, { duration: 0.4 })));
  c.after('counts-and-access-public-only', () => s.play(showPublic.to(1, { duration: 0.4 })));
  c.on('counts-and-access-reader', () => s.play(showSec.to(1, { duration: 0.4 })));
  c.after('counts-and-access-security-reads', () => s.play(showBoth.to(1, { duration: 0.4 })));
  c.on('counts-and-access-corrected', () =>
    s.play(showV2.to(1, { duration: remainDuration(c, 'counts-and-access-corrected', 0.45) })),
  );
}
