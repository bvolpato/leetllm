// Scene 2: What an exhaustive search would return (Exact L2 squared distances for all 6 passages -> A, B reference)
import {
  COSMOS,
  POINTS,
  QUERY,
  aura,
  distance,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  pointById,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function exactBaseline(s, c) {
  const phase = s.value(0);
  const showB = s.value(0);
  const showC = s.value(0);
  const showA = s.value(0);
  const showRest = s.value(0);
  const showPair = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What an Exhaustive', 'Search Would Return'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EXACT FLAT SCAN · SQUARED L2 DISTANCE REFERENCE PAIR (A, B)',
  });

  const sorted = [...POINTS]
    .map((pt) => ({ ...pt, d2: distance(pt, QUERY) }))
    .sort((a, b) => a.d2 - b.d2 || a.id.localeCompare(b.id));

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sb = showB.value;
    const sc = showC.value;
    const sa = showA.value;
    const sr = showRest.value;
    const sp = showPair.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const rows = [];
    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      const ry = -168 + i * 74;
      const isTop2 = i < 2;
      const revealed =
        (row.id === 'B' && sb > 0.3) ||
        (row.id === 'C' && sc > 0.3) ||
        (row.id === 'A' && sa > 0.3) ||
        sr > 0.3;
      const col = isTop2 && sp > 0.3 ? COSMOS.emerald : revealed ? COSMOS.cyan : COSMOS.muted;
      rows.push(
        glassCell(445, ry, 830, 58, col, {
          fill: isTop2 && sp > 0.3 ? '#0e2824' : '#10182d',
          glow: isTop2 && sp > 0.3 ? 8 * pulse : 2,
        }),
        txt(
          `#${i + 1}  ${row.id} (${row.x.toFixed(1)}, ${row.y.toFixed(1)})`,
          60,
          ry + 2,
          26,
          col,
          'mono',
          'left',
        ),
        txt(
          revealed ? `d^2 = ${row.d2.toFixed(2)}` : 'd^2 = ...',
          470,
          ry + 2,
          26,
          isTop2 && sp > 0.3 ? COSMOS.gold : COSMOS.ink,
          'mono',
          'left',
        ),
        meterBar(
          675,
          ry,
          160,
          16,
          Math.min(1, row.d2 / 25),
          isTop2 ? COSMOS.emerald : COSMOS.amber,
        ),
      );
    }

    const dA = distance(pointById('A'), QUERY);
    const dB = distance(pointById('B'), QUERY);
    const dC = distance(pointById('C'), QUERY);

    const nodes = [
      // Left: Squared distance derivation steps
      txt(
        'SQUARED EUCLIDEAN GEOMETRY FROM Q (4.8, 5.0)',
        -855,
        -210,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -108, 780, 124, sb > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sb > 0.3 ? 8 : 2,
      }),
      txt(
        `B (5.1, 5.0):  dx = 0.3, dy = 0.0 -> d^2 = ${dB.toFixed(2)}`,
        -825,
        -134,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        `C (3.7, 4.8): dx=-1.1, dy=-0.2 -> d^2=${dC.toFixed(2)}`,
        -825,
        -86,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      glassCell(-465, 42, 780, 124, sa > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sa > 0.3 ? 8 : 2,
      }),
      txt(
        `A (4.6, 5.2):  0.2^2 + 0.2^2 = ${dA.toFixed(2)} (beats B!)`,
        -825,
        16,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Square root is monotonic -> leaves ranking unchanged',
        -825,
        64,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-465, 198, 780, 134, sp > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sp > 0.3 ? 9 * pulse : 2,
      }),
      txt(
        sp > 0.3 ? 'EXACT TOP-2 REFERENCE: [ A, B ]' : 'EXACT REFERENCE PAIR: [ ?, ? ]',
        -825,
        166,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Tie-break by ID; operators still check passage usefulness',
        -825,
        214,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: Full sorted exact distance table
      txt('ALL 6 PASSAGES SORTED BY SQUARED L2', 30, -222, 26, COSMOS.gold, 'mono', 'left'),
      ...rows,

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Exact flat search scores every vector to define the ground-truth pair [A, B] for recall',
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

  c.on('measure-b', () => s.play(showB.to(1, { duration: 0.4 })));
  c.on('measure-c', () => s.play(showC.to(1, { duration: 0.4 })));
  c.on('measure-a', () => s.play(showA.to(0.5, { duration: 0.35 })));
  c.on('score-a', () => s.play(showA.to(1, { duration: 0.4 })));
  c.on('scan-rest', () => s.play(showRest.to(1, { duration: 0.4 })));
  c.on('exact-receipt', () =>
    s.play(showPair.to(1, { duration: remainDuration(c, 'exact-receipt', 0.45) })),
  );
}
