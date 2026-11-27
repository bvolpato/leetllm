// Scene 01: Three scores, two slots: 3D SRAM tile cage + 2-slot reuse + 3x3 -> 6x6 causal growth.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  PROMPT_3,
  PROMPT_6,
  SCORES,
  TILE_A,
  aura,
  buildAttentionTerrain3d,
  dot,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const tileCursor = s.value(0);
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const savedPair = s.value(0);
  const reusedSlot = s.value(0);
  const rowDone = s.value(0);

  const showGrid = s.value(0);
  const gridHighlight = s.value(0); // 1=test row, 2=fix row, 3=6 pairs
  const gridExtended = s.value(0);
  const show36 = s.value(0);
  const show4Copies = s.value(0);
  const show21 = s.value(0);

  const { view: terrain3d } = buildAttentionTerrain3d(tileCursor, {
    x: 350,
    y: 0,
    half: 2.75,
    grid: 4,
  });
  const bgAura = aura(350, 0, 520, '#4c2f8a2a', '#2180c214');

  const title1 = heroTitle(['Three Scores,', 'Two Slots'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.gold,
    eyebrow: 'FLASHATTENTION · ON-CHIP SRAM',
    subtitle: 'Query "test" fits two scores on chip at a time',
  });

  // Part 1: 2-slot SRAM scratch + waiting key + persistent row summary
  const part1Live = guardedDynamic(showPart1, (a) => {
    const sv = savedPair.value;
    const ru = reusedSlot.value;
    const rd = rowDone.value;

    const nodes = [
      txt('ON-CHIP SRAM SCRATCH (2 SLOTS)', -855, -138, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      // Slot 0
      glassCell(-715, -34, 260, 122, ru > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#131b30',
        glow: 8,
        opacity: a,
      }),
      txt('SLOT 0', -715, -68, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        ru > 0.5 ? 'test · s = 3' : 'fix · s = 1',
        -715,
        -16,
        32,
        ru > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).opacity(a),
      // Slot 1
      glassCell(-420, -34, 260, 122, ru > 0.5 ? COSMOS.dim : COSMOS.cyan, {
        fill: '#11182b',
        glow: ru > 0.5 ? 0 : 8,
        opacity: a,
      }),
      txt('SLOT 1', -420, -68, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        ru > 0.5 ? 'free slot' : 'this · s = 2',
        -420,
        -16,
        32,
        ru > 0.5 ? COSMOS.dim : COSMOS.cyan,
        'mono',
      ).opacity(a),
      // Waiting key "test"
      glassCell(-715, 148, 260, 108, ru > 0.5 ? COSMOS.emerald : COSMOS.rose, {
        fill: '#171122',
        dash: ru > 0.5 ? undefined : [8, 6],
        glow: 6,
        opacity: a,
      }),
      txt(
        ru > 0.5 ? 'SCORED IN SLOT 0' : 'WAITING KEY',
        -715,
        118,
        26,
        ru > 0.5 ? COSMOS.emerald : COSMOS.rose,
        'mono',
      ).opacity(a),
      txt('test · s = 3', -715, 166, 30, ru > 0.5 ? COSMOS.emerald : COSMOS.ink, 'mono').opacity(a),
      // Live orbiting status caption under 3D terrain
      txt('3D Q·Kᵀ SCORE SURFACE', 350, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        'Glowing gold cage = active on-chip SRAM tile',
        350,
        434,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    if (sv > 0.02) {
      // Row summary box widened so "3 keys → 1 output" has generous margin
      nodes.push(
        glassCell(-405, 148, 320, 108, COSMOS.emerald, {
          fill: '#0d2224',
          glow: 9,
          opacity: sv * a,
        }),
        txt('ROW SUMMARY', -405, 118, 26, COSMOS.emerald, 'mono').opacity(sv * a),
        txt(
          rd > 0.5 ? '3 keys → 1 out' : `m=${TILE_A.m} · ℓ=${TILE_A.l.toFixed(2)}`,
          -405,
          166,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(sv * a),
        glowingArc([-585, 28], [-480, 92], 22, {
          color: COSMOS.emerald,
          width: 3.4,
          opacity: 0.9 * sv * a,
        }),
      );
    }

    if (ru > 0.02) {
      const fx = -715;
      const fy = 92 - ru * 64;
      nodes.push(glowDot(fx, fy, { radius: 7, color: COSMOS.gold, opacity: ru * a }));
    }

    if (rd > 0.02) {
      nodes.push(
        txt(
          `fix (${SCORES[0]}) + this (${SCORES[1]}) + test (${SCORES[2]}) → 1 exact blend`,
          -855,
          312,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(rd * a),
      );
    }

    return group(...nodes);
  });

  // Part 2: Full causal score grid (3x3 -> 6x6 quadratic explosion)
  const part2Live = guardedDynamic(showGrid, (a) => {
    const ext = gridExtended.value;
    const hl = gridHighlight.value;
    const rev36 = show36.value;
    const rev4 = show4Copies.value;
    const rev21 = show21.value;
    const is6 = ext > 0.5;
    const n = is6 ? 6 : 3;
    const words = is6 ? PROMPT_6 : PROMPT_3;
    const cell = is6 ? 94 : 168;
    const gap = is6 ? 10 : 14;
    const gridW = n * cell + (n - 1) * gap;
    const gx0 = 260 - gridW * 0.5;
    const gy0 = 20 - gridW * 0.5;

    const nodes = [
      txt('QUADRATIC SCORE ARRAY', -855, -395, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      txt(
        is6 ? '6 × 6 Prompt' : '3 × 3 Prompt',
        -855,
        -315,
        64,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
      txt(
        is6
          ? rev4 > 0.5
            ? 'Double length → 4× slots'
            : 'Extended to 6 tokens'
          : 'Causal lower triangle',
        -855,
        -240,
        34,
        is6 ? COSMOS.rose : COSMOS.cyan,
        'serif',
        'left',
      )
        .glow(6, is6 ? COSMOS.rose : COSMOS.cyan)
        .opacity(a),
    ];

    // Axis labels
    for (let i = 0; i < n; i++) {
      const cx = gx0 + i * (cell + gap) + cell * 0.5;
      const cy = gy0 + i * (cell + gap) + cell * 0.5;
      nodes.push(
        txt(words[i], cx, gy0 - 38, is6 ? 26 : 30, COSMOS.cyan, 'mono').opacity(a),
        txt(words[i], gx0 - 52, cy, is6 ? 26 : 30, COSMOS.gold, 'mono', 'right').opacity(a),
      );
    }

    // Matrix cells
    for (let r = 0; r < n; r++) {
      for (let col = 0; col < n; col++) {
        const cx = gx0 + col * (cell + gap) + cell * 0.5;
        const cy = gy0 + r * (cell + gap) + cell * 0.5;
        const allowed = col <= r;
        const inTestRow = !is6 && hl >= 1 && hl < 2 && r === 2;
        const inFixRow = !is6 && hl >= 2 && hl < 3 && r === 0 && col === 0;
        const active = inTestRow || inFixRow;
        const fill = !allowed ? '#101423' : active ? '#2b2412' : is6 ? '#112538' : '#11233a';
        const stroke = !allowed ? '#27314f' : active ? COSMOS.gold : COSMOS.cyan;
        nodes.push(
          rect(cell, cell, { fill, stroke, width: active ? 3.2 : 1.8, radius: 8 })
            .at(cx, cy)
            .opacity((allowed ? 0.94 : 0.45) * a),
        );
        if (allowed) {
          nodes.push(
            dot(is6 ? 5 : 8, active ? COSMOS.gold : COSMOS.cyan)
              .at(cx, cy)
              .glow(8, active ? COSMOS.gold : COSMOS.cyan)
              .opacity(a),
          );
        }
      }
    }

    // Quadrant divider when showing 4 copies of the 3x3 square
    if (is6 && rev4 > 0.02) {
      const midX = gx0 + 3 * (cell + gap) - gap * 0.5;
      const midY = gy0 + 3 * (cell + gap) - gap * 0.5;
      nodes.push(
        rect(gridW + 16, gridW + 16, { fill: null, stroke: COSMOS.gold, width: 3.2, radius: 12 })
          .at(gx0 + gridW * 0.5, gy0 + gridW * 0.5)
          .glow(8, COSMOS.gold)
          .opacity(rev4 * a),
        rect(4, gridW + 14, { fill: COSMOS.gold, stroke: null })
          .at(midX, gy0 + gridW * 0.5)
          .glow(6, COSMOS.gold)
          .opacity(rev4 * a),
        rect(gridW + 14, 4, { fill: COSMOS.gold, stroke: null })
          .at(gx0 + gridW * 0.5, midY)
          .glow(6, COSMOS.gold)
          .opacity(rev4 * a),
      );
    }

    // Left metrics (withhold 36 and 21 until reveal cues!)
    const totalLabel = !is6 ? '9 slots' : rev36 > 0.5 ? '36 slots' : '? slots';
    const pairsLabel = !is6
      ? hl >= 3
        ? '6 allowed pairs'
        : 'causal pairs'
      : rev21 > 0.5
        ? '21 allowed pairs'
        : 'predict total';
    nodes.push(
      txt('ALLOCATED SCORE SLOTS', -855, -70, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(totalLabel, -855, 6, 72, is6 && rev36 > 0.5 ? COSMOS.rose : COSMOS.gold, 'mono', 'left')
        .glow(8, is6 && rev36 > 0.5 ? COSMOS.rose : COSMOS.gold)
        .opacity(a),
      txt('CONTRIBUTING PAIRS', -855, 132, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(pairsLabel, -855, 202, 42, COSMOS.cyan, 'mono', 'left').glow(6, COSMOS.cyan).opacity(a),
    );
    if (is6 && rev4 > 0.5) {
      nodes.push(
        txt(
          '4× the 3×3 square · still 1 output per row',
          -855,
          315,
          28,
          COSMOS.gold,
          'sans',
          'left',
        ).opacity(rev4 * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, terrain3d, title1, part1Live, part2Live);
  const part1Dur = Math.max(2.0, c.cue('read-test').start - c.start - 0.5);
  orbitScene(
    s,
    c,
    terrain3d,
    { theta: -0.22, phi: 0.9 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - c.cue('read-test').start + 0.4) },
  );
  c.at(0.1, () => s.play(tileCursor.to(5.9, { duration: part1Dur })));

  c.on('full-slots', () => s.play(phase.to(3.0, { duration: 0.5 })));
  c.on('waiting', () => s.play(tileCursor.to(1.2, { duration: 0.4 })));
  c.on('save-pair', () => s.play(savedPair.to(1, { duration: 0.5 })));
  c.on('reuse-slot', () => s.play(reusedSlot.to(1, { duration: 0.55 })));
  c.on('complete-row', () => s.play(rowDone.to(1, { duration: 0.5 })));

  c.on('read-test', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showGrid.to(1, { duration: 0.25 }), 0.22),
        gridHighlight.to(1, { duration: 0.3 }),
      ),
    );
  });
  c.hide('read-test', [terrain3d, title1], { fade: 0.2 });

  c.on('read-fix', () => s.play(gridHighlight.to(2, { duration: 0.35 })));
  c.on('allowed-pairs', () => s.play(gridHighlight.to(3, { duration: 0.35 })));
  c.on('extend-prompt', () => s.play(gridExtended.to(1, { duration: 0.55 })));
  c.after('square-result', () =>
    s.play(show36.to(1, { duration: remainDuration(c, 'square-result', 0.45) })),
  );
  c.on('four-copies', () =>
    s.play(show4Copies.to(1, { duration: remainDuration(c, 'four-copies', 0.45) })),
  );
  c.after('larger-triangle', () =>
    s.play(show21.to(1, { duration: remainDuration(c, 'larger-triangle', 0.45) })),
  );
}
