// Scene 6: Keep a small set of strong candidates (Bounded min-heap top-k trace)
import {
  COSMOS,
  TOP_K_TRACE,
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

export default function topK(s, c) {
  const stepVal = s.value(0);

  const bgAura = aura(0, 10, 660, '#12345e26', '#2a1c5416');
  const title = heroTitle(['Keep a Small Set of', 'Strong Candidates'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'BOUNDED MIN-HEAP SELECTION · k = 2 · LOWER-ID TIE RULE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const idx = Math.min(TOP_K_TRACE.length - 1, Math.max(0, Math.round(stepVal.value)));
    const cur = TOP_K_TRACE[idx];

    const nodes = [
      txt('STREAM OF SCORED DOCUMENTS', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      txt('BOUNDED MIN-HEAP (k = 2)', 195, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    // Left: All 4 incoming stream steps
    TOP_K_TRACE.forEach((row, i) => {
      const y = -115 + i * 108;
      const isNow = i === idx;
      const isPast = i < idx;
      const col = isNow
        ? COSMOS.gold
        : isPast
          ? row.action.startsWith('discard')
            ? COSMOS.rose
            : COSMOS.emerald
          : COSMOS.muted;
      nodes.push(
        glassCell(-465, y, 760, 86, col, {
          fill: isNow ? '#241e10' : '#101629',
          glow: isNow ? 9 : 3,
          opacity: isNow ? 1 : isPast ? 0.85 : 0.72,
        }),
        txt(`${row.incoming}`, -810, y + 2, 30, col, 'mono', 'left'),
        txt(`score ${row.score.toFixed(3)}`, -700, y + 2, 28, COSMOS.ink, 'mono', 'left'),
        txt(i <= idx ? row.action : 'pending', -110, y + 2, 26, col, 'mono', 'right'),
      );
    });

    // Right: Min-heap visual (Root = weakest retained at top, Stronger below)
    const rootDoc = cur.root ?? '-';
    const strongDoc =
      cur.heap.find((id) => id !== rootDoc) ?? (cur.heap.length === 1 ? '-' : cur.heap[0]);

    nodes.push(
      glassCell(515, -75, 560, 122, COSMOS.amber, {
        fill: '#261d10',
        glow: 9,
      }),
      txt('MIN-HEAP ROOT (WEAKEST KEPT)', 515, -108, 26, COSMOS.amber, 'mono'),
      txt(
        rootDoc === '-' ? 'empty' : `${rootDoc}   (eviction threshold)`,
        515,
        -52,
        32,
        COSMOS.gold,
        'mono',
      ),

      glowingArc([515, -10], [515, 76], 0, { color: COSMOS.cyan, width: 3.4 }),

      glassCell(515, 138, 560, 118, strongDoc === '-' ? COSMOS.muted : COSMOS.emerald, {
        fill: strongDoc === '-' ? '#12182b' : '#0e2824',
        glow: strongDoc === '-' ? 2 : 8,
      }),
      txt('STRONGER RETAINED SLOT', 515, 106, 26, COSMOS.emerald, 'mono'),
      txt(
        strongDoc === '-' ? 'slot open (1 of 2 filled)' : `${strongDoc}   (protected leader)`,
        515,
        160,
        30,
        strongDoc === '-' ? COSMOS.muted : COSMOS.emerald,
        'mono',
      ),

      glassCell(515, 278, 560, 82, COSMOS.cyan, { fill: '#0f2138', glow: 5 }),
      txt(`RETAINED SET:  [ ${cur.heap.join(', ')} ]`, 515, 280, 30, COSMOS.cyan, 'mono'),

      glowDot(-840, 368, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Bounded min-heap avoids full O(N log N) sort while keeping exact top-k and tie rule',
        -812,
        370,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('top-k-beat-1-focus-1', () => s.play(stepVal.to(0, { duration: 0.35 })));
  c.on('top-k-beat-2-focus-1', () => s.play(stepVal.to(1, { duration: 0.45 })));
  c.on('top-k-beat-3-focus-1', () => s.play(stepVal.to(2, { duration: 0.45 })));
  c.on('top-k-beat-4-focus-1', () =>
    s.play(stepVal.to(3, { duration: remainDuration(c, 'top-k-beat-4-focus-1', 0.45) })),
  );
}
