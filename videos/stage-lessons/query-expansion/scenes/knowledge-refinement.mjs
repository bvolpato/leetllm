// Scene 14: Which lines belong in the answer context? (Decompose-then-recompose knowledge refinement)
import {
  COSMOS,
  REFINEMENT_STRIPS,
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

export default function knowledgeRefinement(s, c) {
  const splitProg = s.value(0);
  const keepProg = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#1e2c4c18');
  const title = heroTitle(['Which Lines Belong in', 'the Answer Context?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'KNOWLEDGE REFINEMENT · DECOMPOSE, FILTER NOISE, PRESERVE IDS',
  });

  const keptList = REFINEMENT_STRIPS.filter((st) => st.keep);

  const live = guardedDynamic(s.value(1), () => {
    const sp = splitProg.value;
    const kp = keepProg.value;
    const isSplit = sp > 0.4;
    const isFiltered = kp > 0.5;

    const nodes = [
      txt(
        isFiltered
          ? 'RECOMPOSED CONTEXT (SOURCE IDS & ORDER PRESERVED)'
          : 'SOURCE E1: LAUNCH QUOTA & RETRY PAGE',
        -855,
        -214,
        26,
        isFiltered ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('SIGNAL COMPRESSION', 355, -214, 26, COSMOS.gold, 'mono', 'left'),
    ];

    const slideProg = Math.max(0, Math.min(1, (kp - 0.35) / 0.65));
    REFINEMENT_STRIPS.forEach((strip, idx) => {
      if (!strip.keep && kp >= 0.25) return;
      const keptIdx = keptList.indexOf(strip);
      const baseY = -126 + idx * (96 + 24 * sp);
      const targetY = strip.keep ? -102 + keptIdx * 138 : baseY;
      const y = baseY + (targetY - baseY) * slideProg;
      const alpha = strip.keep ? 1 : Math.max(0, 1 - kp / 0.25);
      const border = isFiltered ? COSMOS.emerald : isSplit ? COSMOS.cyan : COSMOS.dim;

      nodes.push(
        glassCell(-295, y, 1120, 88, border, {
          fill: isFiltered && strip.keep ? '#0d2723' : '#10182d',
          glow: isFiltered && strip.keep ? 9 : 2,
          opacity: alpha,
          radius: 10,
        }),
        txt(
          isSplit ? strip.id : 'E1',
          -832,
          y + 2,
          28,
          strip.keep ? COSMOS.emerald : COSMOS.cyan,
          'mono',
          'left',
        ).opacity(alpha),
        txt(strip.text, -715, y + 2, 28, COSMOS.ink, 'sans', 'left').opacity(alpha),
        txt(
          isFiltered && strip.keep ? 'KEEP' : isSplit ? 'strip' : 'block',
          235,
          y + 2,
          26,
          isFiltered && strip.keep ? COSMOS.emerald : COSMOS.muted,
          'mono',
          'right',
        ).opacity(alpha),
      );
    });

    // Right side: Refinement telemetry panel
    nodes.push(
      glassCell(595, -52, 510, 212, isFiltered ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#101a30',
        glow: isFiltered ? 8 : 3,
      }),
      txt('CONTEXT NOISE CUT', 368, -118, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        isFiltered ? '2 / 4 strips kept' : '4 / 4 strips raw',
        368,
        -66,
        34,
        isFiltered ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),
      meterBar(
        368,
        -12,
        454,
        24,
        isFiltered ? 0.5 : 1.0,
        isFiltered ? COSMOS.emerald : COSMOS.blue,
      ),
      txt(
        isFiltered ? 'Menu & storage note removed' : 'Contains navigation & boilerplate',
        368,
        30,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(595, 192, 510, 200, COSMOS.cyan, { fill: '#10182d', glow: 4 }),
      txt('SOURCE PROVENANCE', 368, 130, 26, COSMOS.cyan, 'mono', 'left'),
      txt('E1.1 -> approval rule', 368, 180, 27, COSMOS.emerald, 'mono', 'left'),
      txt('E1.3 -> backoff instruction', 368, 224, 27, COSMOS.emerald, 'mono', 'left'),
      txt('Original IDs stay verifiable', 368, 268, 26, COSMOS.muted, 'sans', 'left'),

      glowDot(-840, 368, { radius: 6, color: isFiltered ? COSMOS.emerald : COSMOS.cyan }),
      txt(
        isFiltered
          ? 'E1.1 and E1.3 close the gap in original order with full source provenance'
          : 'Split passages into small source-labeled strips; keep short pages intact',
        -812,
        370,
        28,
        isFiltered ? COSMOS.emerald : COSMOS.cyan,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('refinement-split', () => s.play(splitProg.to(1, { duration: 0.65 })));
  c.on('refinement-keep', () =>
    s.play(keepProg.to(1, { duration: remainDuration(c, 'refinement-keep', 0.75) })),
  );
}
