// Scene 13: Seven keys, three block sizes: 5x7 CPU verification matrix across Bc=3, Bc=1, Bc=20.
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function cpuCorrectness(s, c) {
  const blockMode = s.value(0); // 0=base, 1=Bc=3 (3,3,1), 2=Bc=1, 3=Bc=20
  const showBackwardNote = s.value(0);

  const bgAura = aura(180, 30, 560, '#5ce1e620', '#6ee7b716');
  const title = heroTitle(['Seven Keys,', 'Three Block Sizes'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'FP64 CPU VERIFICATION · EXACT PARITY',
  });

  // 5 queries (abs pos 2..6, first row deliberately empty) x 7 keys (pos 0..6)
  const qPositions = [2, 3, 4, 5, 6];
  const cell = 90;
  const gap = 10;
  const gx0 = -70;
  const gy0 = -245;

  const live = guardedDynamic(1, () => {
    const bm = Math.round(blockMode.value);
    const bwd = showBackwardNote.value;

    const nodes = [
      txt('GLOBAL KEY POSITIONS (0 .. 6)', gx0 + 345, gy0 - 82, 26, COSMOS.cyan, 'mono'),
      // Left fixture specs
      glassCell(-575, -135, 550, 170, COSMOS.cyan, { fill: '#0e182b', glow: 7 }),
      txt('5 QUERIES (abs pos 2..6) × 7 KEYS', -575, -182, 26, COSMOS.gold, 'mono'),
      txt('Row 0 deliberately all-masked', -575, -132, 26, COSMOS.rose, 'sans'),
      txt('d_qk = 4   ·   d_v = 3   (unequal)', -575, -84, 26, COSMOS.cyan, 'mono'),
    ];

    for (let k = 0; k < 7; k++) {
      nodes.push(
        txt(`k${k}`, gx0 + k * (cell + gap) + cell * 0.5, gy0 - 34, 26, COSMOS.cyan, 'mono'),
      );
    }

    for (let r = 0; r < 5; r++) {
      const cy = gy0 + r * (cell + gap) + cell * 0.5;
      nodes.push(
        txt(
          `q${qPositions[r]}`,
          gx0 - 44,
          cy,
          26,
          r === 0 ? COSMOS.rose : COSMOS.gold,
          'mono',
          'right',
        ),
      );
      for (let k = 0; k < 7; k++) {
        const cx = gx0 + k * (cell + gap) + cell * 0.5;
        const allowed = r > 0 && k <= qPositions[r];
        const fill = r === 0 ? '#24111d' : allowed ? '#10283a' : '#101424';
        const stroke = r === 0 ? COSMOS.rose : allowed ? COSMOS.cyan : '#273252';
        nodes.push(
          rect(cell, cell, { fill, stroke, width: 1.8, radius: 8 })
            .at(cx, cy)
            .opacity(allowed || r === 0 ? 0.92 : 0.45),
        );
      }
    }

    // Animated block-partitioning overlay
    const groups =
      bm === 1
        ? [
            [0, 3, COSMOS.gold],
            [3, 3, COSMOS.cyan],
            [6, 1, COSMOS.emerald],
          ]
        : bm === 2
          ? Array.from({ length: 7 }, (_, i) => [i, 1, i % 2 === 0 ? COSMOS.gold : COSMOS.cyan])
          : bm === 3
            ? [[0, 7, COSMOS.emerald]]
            : [];

    const totalH = 5 * cell + 4 * gap + 18;
    groups.forEach(([start, len, col]) => {
      const bx0 = gx0 + start * (cell + gap) - 6;
      const bw = len * cell + (len - 1) * gap + 12;
      nodes.push(
        rect(bw, totalH, { fill: null, stroke: col, width: 3.2, radius: 10 })
          .at(bx0 + bw * 0.5, gy0 + (5 * cell + 4 * gap) * 0.5)
          .glow(8, col)
          .opacity(0.92),
      );
    });

    // Block size badges on lower-left
    const badges = [
      { label: 'Bc = 3  →  tiles [3, 3, 1]', active: bm === 1, col: COSMOS.gold, y: 18 },
      { label: 'Bc = 1  →  every key solo', active: bm === 2, col: COSMOS.cyan, y: 92 },
      { label: 'Bc = 20 →  single full block', active: bm === 3, col: COSMOS.emerald, y: 166 },
    ];
    for (const b of badges) {
      nodes.push(
        glassCell(-575, b.y, 550, 58, b.active ? b.col : '#2a3759', {
          fill: b.active ? '#162038' : '#0e1424',
          glow: b.active ? 8 : 0,
        }),
        txt(b.label, -575, b.y, 26, b.active ? b.col : COSMOS.muted, 'mono'),
      );
    }

    nodes.push(
      txt(
        bm >= 1 ? 'Matches SDPA on O, dQ, dK, dV (FP64)' : 'Remainder tiles + empty row + offset',
        -575,
        262,
        26,
        bm >= 1 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
    );

    if (bwd > 0.02) {
      nodes.push(
        glassCell(285, 345, 920, 108, COSMOS.violet, { fill: '#171330', glow: 9, opacity: bwd }),
        txt(
          'Autograd keeps ops · FlashAttention rebuilds P from S + LSE',
          285,
          345,
          26,
          COSMOS.violet,
          'sans',
        ).opacity(bwd),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('cpu-correctness-beat-1', () => s.play(blockMode.to(0.1, { duration: 0.3 })));
  c.on('cpu-correctness-beat-2', () => s.play(blockMode.to(1, { duration: 0.4 })));
  c.on('one-key-blocks', () => s.play(blockMode.to(2, { duration: 0.4 })));
  c.on('one-wide-block', () => s.play(blockMode.to(3, { duration: 0.4 })));
  c.on('cpu-correctness-beat-3', () =>
    s.play(showBackwardNote.to(1, { duration: remainDuration(c, 'cpu-correctness-beat-3', 0.45) })),
  );
}
