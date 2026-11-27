// Scene 18: Mask the pairs that the objective forbids: 4x4 causal tile skipping + absolute cached decode alignment.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function causal(s, c) {
  const showFuture = s.value(0);
  const showDiag = s.value(0);
  const showPast = s.value(0);
  const showAbs = s.value(0);
  const showTail = s.value(0);

  const bgAura = aura(240, 20, 560, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Causal', 'Block Masking'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'SKIP FUTURE TILES · MASK DIAGONAL',
  });

  const cell = 136;
  const gap = 14;
  const gx0 = 20;
  const gy0 = -280;

  const live = guardedDynamic(1, () => {
    const sf = showFuture.value;
    const sd = showDiag.value;
    const sp = showPast.value;
    const sa = showAbs.value;
    const st = showTail.value;

    const nodes = [
      txt('4 × 4 ALIGNED CAUSAL TILE GRID', gx0 + 292, gy0 - 52, 26, COSMOS.cyan, 'mono'),
    ];

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const cx = gx0 + col * (cell + gap) + cell * 0.5;
        const cy = gy0 + r * (cell + gap) + cell * 0.5;
        const kind = col > r ? 'future' : col === r ? 'diag' : 'past';
        const isSweep = false;
        const fill = kind === 'future' ? '#0c0f1c' : kind === 'diag' ? '#241e12' : '#0e2438';
        const stroke =
          kind === 'future'
            ? sf > 0.5
              ? COSMOS.rose
              : '#263252'
            : kind === 'diag'
              ? COSMOS.gold
              : COSMOS.cyan;
        nodes.push(
          rect(cell, cell, {
            fill,
            stroke,
            width: isSweep ? 3.8 : 2.0,
            dash: kind === 'future' ? [8, 6] : undefined,
            radius: 10,
          })
            .at(cx, cy)
            .opacity(kind === 'future' ? 0.55 : 0.94),
        );
        const tag = kind === 'future' ? 'SKIP' : kind === 'diag' ? 'MASK' : 'FULL';
        const tagCol =
          kind === 'future'
            ? sf > 0.5
              ? COSMOS.rose
              : COSMOS.dim
            : kind === 'diag'
              ? COSMOS.gold
              : COSMOS.cyan;
        nodes.push(txt(tag, cx, cy, 26, tagCol, 'mono').opacity(kind === 'future' ? 0.72 : 1));
      }
    }

    // Left legend & absolute-position cached decode section
    const items = [
      {
        label: 'Future tiles (col > row): skip score & V',
        col: COSMOS.rose,
        vis: Math.max(0.35, sf),
        y: -150,
      },
      {
        label: 'Diagonal tiles: apply causal mask inside',
        col: COSMOS.gold,
        vis: Math.max(0.35, sd),
        y: -76,
      },
      {
        label: 'Past tiles (col < row): compute full block',
        col: COSMOS.cyan,
        vis: Math.max(0.35, sp),
        y: -2,
      },
    ];
    for (const it of items) {
      nodes.push(
        glowDot(-840, it.y, { radius: 6, color: it.col, opacity: it.vis }),
        txt(it.label, -812, it.y, 26, it.col, 'sans', 'left').opacity(it.vis),
      );
    }

    if (sa > 0.02) {
      nodes.push(
        glassCell(-465, 225, 760, 240, COSMOS.gold, { fill: '#12182b', glow: 9, opacity: sa }),
        txt(
          'UNEQUAL LENGTHS: COMPARE ABSOLUTE POSITIONS',
          -465,
          148,
          26,
          COSMOS.gold,
          'mono',
        ).opacity(sa),
        // Mini cached decode bar: 6 valid keys + 2 unused slots
        ...Array.from({ length: 8 }, (_, k) => {
          const bx = -760 + k * 84;
          const valid = k < 6;
          const bCol = valid ? COSMOS.emerald : st > 0.5 ? COSMOS.rose : COSMOS.dim;
          return group(
            rect(70, 56, { fill: valid ? '#0f2828' : '#1b111c', stroke: bCol, width: 2, radius: 6 })
              .at(bx, 224)
              .opacity(sa),
            txt(valid ? `k${k}` : 'pad', bx, 224, 26, bCol, 'mono').opacity(sa),
          );
        }),
        txt(
          st > 0.5
            ? 'Align query pos to valid history; mask padding & unused tail'
            : 'New decode query follows long cached history',
          -465,
          304,
          26,
          st > 0.5 ? COSMOS.amber : COSMOS.cyan,
          'sans',
        ).opacity(sa),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('causal-tiles', () => s.play(showPast.to(0.4, { duration: 0.3 })));
  c.on('skip-future', () => s.play(showFuture.to(1, { duration: 0.45 })));
  c.on('diagonal-mask', () => s.play(showDiag.to(1, { duration: 0.45 })));
  c.on('past-tiles', () => s.play(showPast.to(1, { duration: 0.45 })));
  c.on('absolute-positions', () => s.play(showAbs.to(0.7, { duration: 0.4 })));
  c.on('cached-history', () => s.play(showAbs.to(1, { duration: 0.4 })));
  c.on('valid-tail', () =>
    s.play(showTail.to(1, { duration: remainDuration(c, 'valid-tail', 0.45) })),
  );
}
