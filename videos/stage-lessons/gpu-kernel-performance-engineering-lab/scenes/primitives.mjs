// Scene 17: Let the output dependency choose the primitive
// Shared mismatch bit vector [0,1,0,1,1,0,0,1]:
// Beat 0: Reduction -> scalar total mismatch count = 4.
// Beat 1: Exclusive prefix scan -> offsets [0,0,1,1,2,3,3,3] -> compacted failing indices [1,3,4,7].
import {
  COMPACT_FULL,
  COSMOS,
  MISMATCH_BITS,
  ROLE,
  aura,
  compactProgress,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function primitives(s, c) {
  const redShow = s.value(0);
  const scanProg = s.value(0);
  const whyScan = s.value(0);

  const bgAura = aura(0, 0, 660, '#a78bfa1c', '#6ee7b716');
  const title = heroTitle(['Output Dependency', 'Chooses the Primitive'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.violet,
    eyebrow: 'TRANSPOSE · REDUCTION · EXCLUSIVE SCAN',
  });

  const live = guardedDynamic(1, () => {
    const rd = redShow.value;
    const sp = scanProg.value;
    const ws = whyScan.value;
    const visibleCount = Math.min(8, Math.floor(sp * 8.99));
    const snap = compactProgress(visibleCount);

    const nodes = [
      txt('INDEX', -740, -210, 26, COSMOS.muted, 'mono'),
      txt('MISMATCH', -740, -110, 26, ROLE.bad, 'mono'),
      txt('PREFIX OFF', -740, 42, 26, ROLE.input, 'mono'),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -515 + i * 172;
      const bit = MISMATCH_BITS[i];
      const off = snap.offsets[i];
      const lit = bit === 1;
      nodes.push(
        txt(String(i), cx, -210, 26, COSMOS.muted, 'mono'),
        glassCell(cx, -110, 140, 88, lit ? ROLE.bad : COSMOS.rule, {
          fill: lit ? '#30101e' : '#0e1628',
          glow: lit ? 8 : 0,
        }),
        txt(String(bit), cx, -110, 40, lit ? ROLE.bad : COSMOS.muted, 'mono'),

        glassCell(cx, 42, 140, 88, i < visibleCount ? ROLE.input : COSMOS.rule, {
          fill: i < visibleCount ? '#0f203d' : '#0c1220',
          glow: i < visibleCount && lit ? 7 : 0,
        }),
        txt(
          String(off),
          cx,
          42,
          38,
          i < visibleCount ? (lit ? ROLE.gold : COSMOS.ink) : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Bottom left: Reduction summary box
    nodes.push(
      glassCell(-430, 215, 740, 118, rd > 0.3 ? ROLE.gold : COSMOS.rule, {
        fill: '#241e11',
        glow: rd > 0.3 ? 9 : 2,
      }),
      txt('REDUCTION (SCALAR SUMMARY)', -430, 184, 26, ROLE.gold, 'mono'),
      txt(
        rd > 0.3 ? `Total mismatches = ${COMPACT_FULL.count}` : 'Sum mismatch bits → 1 scalar',
        -430,
        238,
        34,
        COSMOS.ink,
        'mono',
      ),
    );

    // Bottom right: Exclusive scan compaction output box
    const compactedStr = snap.indexes.length > 0 ? `[ ${snap.indexes.join(', ')} ]` : '[ ... ]';
    nodes.push(
      glassCell(430, 215, 740, 118, visibleCount > 0 ? ROLE.good : COSMOS.rule, {
        fill: '#0d2621',
        glow: visibleCount > 0 ? 9 : 2,
      }),
      txt('EXCLUSIVE SCAN → COMPACTED INDICES', 430, 184, 26, ROLE.good, 'mono'),
      txt(compactedStr, 430, 238, 34, visibleCount > 0 ? ROLE.good : COSMOS.dim, 'mono'),
    );

    // Flowing arc from offsets to compacted indices when scan runs
    if (sp > 0.05) {
      nodes.push(
        glowingArc([-40, 96], [280, 152], -30, {
          color: ROLE.good,
          width: 3.4,
          opacity: 0.85 * sp,
        }),
      );
    }

    nodes.push(
      txt(
        ws > 0.3
          ? 'A scalar count alone cannot assign each failure its unique output slot'
          : 'Transpose permutes · Reduction summarizes · Scan supplies per-item write offsets',
        0,
        355,
        28,
        ws > 0.3 ? ROLE.warn : COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('primitives-beat-1-focus-1', () =>
    s.play(redShow.to(1, { duration: remainDuration(c, 'primitives-beat-1-focus-1', 0.45) })),
  );
  c.on('primitives-beat-2-focus-1', () =>
    s.play(scanProg.to(1, { duration: remainDuration(c, 'primitives-beat-2-focus-1', 1.25) })),
  );
  c.on('primitives-beat-2-focus-2', () =>
    s.play(whyScan.to(1, { duration: remainDuration(c, 'primitives-beat-2-focus-2', 0.45) })),
  );
}
