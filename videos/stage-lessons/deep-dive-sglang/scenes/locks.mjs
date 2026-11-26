// Scene 11: Shared paths remain protected until their last live user leaves (3D Radix tree + ref-count locks on KV 12..15).
import {
  COSMOS,
  ROLE,
  aura,
  buildRadixTree3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function locks(s, c) {
  const phase = s.value(0);
  // step: 0=both R0 & R1 hold locks, 1=R0 releases (R1 still holds -> protected),
  // 2=premature free would corrupt R1, 3=R1 releases -> eligible for eviction, 4=cache manager keep or reclaim
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#ffd1661c', '#5ce1e618');
  const { view: tree3d } = buildRadixTree3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Shared Prefixes Stay', 'Locked Until Last User'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'REFERENCE COUNTING · RADIX LOCK LIFETIME',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const hasR0 = st < 1;
    const hasR1 = st < 3;
    const evictable = !hasR0 && !hasR1;
    const ownerLabel =
      hasR0 && hasR1
        ? 'R0, R1 (refcount = 2)'
        : hasR1
          ? 'R1 (refcount = 1)'
          : 'none (refcount = 0)';

    const nodes = [
      txt('3D RADIX PREFIX LOCKS', 475, -390, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt(
        evictable ? 'Refcount 0: LRU eligible' : 'Active lock protects KV 12..15',
        475,
        405,
        26,
        evictable ? ROLE.decode : COSMOS.gold,
        'mono',
      ),
    ];

    // Live owners summary
    nodes.push(
      glassCell(-420, -190, 860, 84, evictable ? ROLE.decode : COSMOS.gold, {
        fill: evictable ? '#0d2922' : '#201c10',
        glow: 9,
      }),
      txt(
        `LIVE OWNERS:  ${ownerLabel}`,
        -420,
        -190,
        28,
        evictable ? ROLE.decode : COSMOS.gold,
        'mono',
      ),
    );

    // Owner cards R0 and R1
    nodes.push(
      glassCell(-640, -58, 410, 112, hasR0 ? COSMOS.gold : COSMOS.dim, {
        fill: hasR0 ? '#221c10' : '#0b101d',
        glow: hasR0 ? 9 : 2,
      }),
      txt('Request R0', -640, -84, 28, hasR0 ? COSMOS.gold : COSMOS.dim, 'mono'),
      txt(hasR0 ? 'LOCK HELD' : 'released', -640, -34, 26, hasR0 ? COSMOS.ink : COSMOS.dim, 'mono'),

      glassCell(-200, -58, 410, 112, hasR1 ? COSMOS.gold : COSMOS.dim, {
        fill: hasR1 ? '#221c10' : '#0b101d',
        glow: hasR1 ? 9 : 2,
      }),
      txt('Request R1', -200, -84, 28, hasR1 ? COSMOS.gold : COSMOS.dim, 'mono'),
      txt(hasR1 ? 'LOCK HELD' : 'released', -200, -34, 26, hasR1 ? COSMOS.ink : COSMOS.dim, 'mono'),
    );

    // Shared physical KV locations [12, 13, 14, 15]
    [12, 13, 14, 15].forEach((loc, i) => {
      const cx = -735 + i * 210;
      nodes.push(
        glassCell(cx, 82, 190, 86, evictable ? ROLE.decode : ROLE.radix, {
          fill: evictable ? '#0d2820' : '#0e2336',
          glow: 8,
        }),
        txt(`KV ${loc}`, cx, 82, 30, COSMOS.ink, 'mono'),
      );
    });

    // Eviction state banner
    nodes.push(
      glassCell(-420, 215, 860, 94, evictable ? ROLE.decode : ROLE.prefill, {
        fill: evictable ? '#0d2922' : '#101f3a',
        glow: 9,
      }),
      txt(
        evictable
          ? 'ELIGIBLE FOR EVICTION (may keep warm or reclaim)'
          : 'SHARED PATH PROTECTED (eviction blocked)',
        -420,
        215,
        26,
        evictable ? ROLE.decode : ROLE.prefill,
        'mono',
      ),
    );

    const caption =
      st >= 3
        ? 'Refcount 0: path is evictable (keep warm or reclaim).'
        : st >= 2
          ? 'Freeing on R0 completion alone would overwrite live KV that R1 still needs.'
          : st === 1
            ? 'R0 released its lock; R1 still holds KV 12..15 so eviction stays blocked.'
            : 'Both requests share KV 12..15 while generating independent suffixes.';

    nodes.push(txt(caption, -855, 355, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['locks-beat-1-focus-1', 0],
    ['locks-release-r0', 1, true],
    ['locks-beat-2-focus-1', 1],
    ['locks-beat-2-focus-2', 2],
    ['locks-release-r1', 3, true],
    ['locks-beat-3-focus-1', 4],
  ]);
}
