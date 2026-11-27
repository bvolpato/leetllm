// Scene 19: Conserve token slots while moving whole records: Best-fit decreasing packing (47% -> 93.3%) + awkward [6,6,6] 60% counterexample.
import { delay, par } from 'vizmatic/stage';
import {
  AWKWARD_BINS,
  COSMOS,
  PACKED_BINS,
  PACKING_LENGTHS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function packingWork(s, c) {
  const showPart1 = s.value(1);
  const lengthsLit = s.value(0);
  const separateOn = s.value(0);
  const placedCount = s.value(0); // 0..6 records dealt into best-fit bins
  const utilOn = s.value(0);

  const showPart2 = s.value(0);
  const awkwardOn = s.value(0);
  const metaOn = s.value(0);

  const recColors = [
    COSMOS.blue,
    COSMOS.cyan,
    COSMOS.violet,
    COSMOS.gold,
    COSMOS.emerald,
    COSMOS.amber,
  ];
  const bgAura = aura(0, 0, 640, '#16284f2a', '#6ee7b714');

  // Part 1: 6 source records on left -> dealt one by one into 3 capacity-10 bins on right
  const part1Live = guardedDynamic(showPart1, (a) => {
    const ll = lengthsLit.value;
    const sep = separateOn.value;
    const placed = Math.round(placedCount.value);
    const ut = utilOn.value;

    const nodes = [
      heroTitle(['Best-Fit Decreasing', 'Sequence Packing'], {
        x: -855,
        y: -435,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.emerald,
        eyebrow: 'CAPACITY-10 BLOCKS · 28 REAL TOKENS',
      }).opacity(a),

      txt('6 UNPACKED BLOCKS (60 SLOTS)', -480, -245, 26, COSMOS.blue, 'mono').opacity(a),
      txt('BEST-FIT BLOCKS (30 SLOTS)', 415, -245, 26, COSMOS.emerald, 'mono').opacity(a),
    ];

    // Left: 6 source rows
    const leftOrigin = -740;
    const leftStep = 56;
    PACKING_LENGTHS.forEach((len, i) => {
      const y = -165 + i * 82;
      const moved = i < placed;
      const col = recColors[i];

      nodes.push(
        txt(
          `R${i + 1}(${len})`,
          leftOrigin - 24,
          y + 2,
          26,
          moved ? COSMOS.dim : col,
          'mono',
          'right',
        ).opacity(a),
      );
      // 10-slot track
      for (let k = 0; k < 10; k++) {
        nodes.push(
          rect(leftStep - 8, 52, {
            fill: '#0e1424',
            stroke: '#25314d',
            width: 1.4,
            radius: 5,
          })
            .at(leftOrigin + k * leftStep + leftStep * 0.5, y)
            .opacity(a),
        );
      }
      // Solid bar for this record
      const barW = len * leftStep - 8;
      nodes.push(
        rect(barW, 52, {
          fill: moved ? '#111728' : col,
          stroke: moved ? '#334163' : col,
          width: 2,
          radius: 6,
          dash: moved ? [6, 5] : undefined,
        })
          .at(leftOrigin + barW * 0.5 + 4, y)
          .glow(moved ? 0 : 6 * Math.max(0.4, ll), col)
          .opacity((moved ? 0.45 : 0.92) * a),
      );
    });

    // Right: 3 capacity-10 packed blocks
    const rightOrigin = 70;
    const rightStep = 74;
    PACKED_BINS.forEach((bin, row) => {
      const y = -110 + row * 172;
      nodes.push(
        txt(`B${row + 1}`, rightOrigin - 22, y + 2, 28, COSMOS.muted, 'mono', 'right').opacity(a),
      );
      for (let k = 0; k < 10; k++) {
        nodes.push(
          rect(rightStep - 8, 86, {
            fill: '#0e1426',
            stroke: '#2b395c',
            width: 1.6,
            radius: 6,
          })
            .at(rightOrigin + k * rightStep + rightStep * 0.5, y)
            .opacity(a),
        );
      }

      let used = 0;
      for (const item of bin) {
        if (item.id < placed) {
          const w = item.n * rightStep - 8;
          const cx = rightOrigin + used * rightStep + w * 0.5 + 4;
          const col = recColors[item.id];
          nodes.push(
            rect(w, 84, { fill: col, stroke: '#ffffff33', width: 1.6, radius: 7 })
              .at(cx, y)
              .glow(8, col)
              .opacity(0.94 * a),
            txt(`R${item.id + 1} (${item.n})`, cx, y + 2, 28, COSMOS.bg, 'mono').opacity(a),
          );
        }
        used += item.n;
      }
    });

    // Bottom readout
    const msg =
      ut > 0.5
        ? 'Packed: 28 / 30 slots = 93.3% full (vs 28 / 60 = 46.7% unpacked)'
        : sep > 0.5
          ? 'Unpacked: 28 real tokens across 60 allocated slots (46.7%)'
          : 'Sort lengths descending [7, 6, 5, 5, 3, 2] -> place in tightest fit';
    nodes.push(
      txt(msg, 0, 395, 34, ut > 0.5 ? COSMOS.emerald : COSMOS.gold, 'mono')
        .glow(6, ut > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: Counterexample [6, 6, 6] in capacity-10 bins -> 18/30 = 60%
  const part2Live = guardedDynamic(showPart2, (a) => {
    const aw = awkwardOn.value;
    const mt = metaOn.value;
    const originX = -710;
    const step = 122;

    const nodes = [
      txt(
        'UNFAVORABLE LENGTH DISTRIBUTION · NO SPLITTING',
        -855,
        -425,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ).opacity(a),
      txt('Three Length-6 Records', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    AWKWARD_BINS.forEach((_, i) => {
      const y = -145 + i * 145;
      const col = recColors[i];
      for (let k = 6; k < 10; k++) {
        nodes.push(
          rect(step - 10, 92, {
            fill: '#0e1526',
            stroke: '#2c3a5e',
            width: 1.6,
            radius: 7,
          })
            .at(originX + k * step + step * 0.5, y)
            .opacity(a),
        );
      }
      const fillW = 6 * step - 10;
      nodes.push(
        rect(fillW, 90, { fill: col, stroke: '#ffffff33', width: 1.8, radius: 7 })
          .at(originX + fillW * 0.5 + 5, y)
          .glow(8, col)
          .opacity(0.94 * a),
        txt(
          `Record ${i + 1} · 6 tokens`,
          originX + fillW * 0.5 + 5,
          y + 2,
          32,
          COSMOS.bg,
          'mono',
        ).opacity(a),
        txt('4 empty', originX + 10 * step + 28, y + 2, 28, COSMOS.rose, 'mono', 'left').opacity(a),
      );
    });

    if (aw > 0.02) {
      nodes.push(
        txt(
          '18 / 30 slots full = 60.0% utilization (4 empty slots cannot fit 6)',
          0,
          295,
          36,
          COSMOS.gold,
          'mono',
        )
          .glow(8, COSMOS.gold)
          .opacity(aw * a),
      );
    }
    if (mt > 0.02) {
      nodes.push(
        txt(
          'Carry token IDs + source offsets · now 2 docs share a block: should they read each other?',
          0,
          395,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(mt * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live);

  c.on('pt-packing-work-lengths', () =>
    s.play(lengthsLit.to(1, { duration: remainDuration(c, 'pt-packing-work-lengths', 0.5) })),
  );
  c.on('pt-packing-work-separate', () =>
    s.play(separateOn.to(1, { duration: remainDuration(c, 'pt-packing-work-separate', 0.5) })),
  );
  c.on('pt-packing-work-seven', () =>
    s.play(placedCount.to(1, { duration: remainDuration(c, 'pt-packing-work-seven', 0.5) })),
  );
  c.on('pt-packing-work-six', () =>
    s.play(placedCount.to(2, { duration: remainDuration(c, 'pt-packing-work-six', 0.5) })),
  );
  c.on('pt-packing-work-fives', () =>
    s.play(placedCount.to(4, { duration: remainDuration(c, 'pt-packing-work-fives', 0.8) })),
  );
  c.on('pt-packing-work-three', () =>
    s.play(placedCount.to(5, { duration: remainDuration(c, 'pt-packing-work-three', 0.5) })),
  );
  c.on('pt-packing-work-two', () =>
    s.play(placedCount.to(6, { duration: remainDuration(c, 'pt-packing-work-two', 0.5) })),
  );
  c.after('pt-packing-work-utilization', () =>
    s.play(utilOn.to(1, { duration: remainAfterDuration(c, 'pt-packing-work-utilization', 0.45) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.after('pt-packing-work-awkward', () =>
    s.play(awkwardOn.to(1, { duration: remainAfterDuration(c, 'pt-packing-work-awkward', 0.45) })),
  );
  c.on('pt-packing-work-metadata', () =>
    s.play(metaOn.to(1, { duration: remainDuration(c, 'pt-packing-work-metadata', 0.6) })),
  );
}
