// Scene 04: One input multiplies several output columns. x = [1, 2] * W (2x4) -> y = [1, 4, 6, 5].
import {
  COSMOS,
  ROLE,
  SHARDS,
  W,
  X,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function linear(s, c) {
  const phase = s.value(0);
  const colIdx = s.value(0);
  const showOut = s.value(0);
  const showRef = s.value(0);
  const showColSplit = s.value(0);
  const showRowSplit = s.value(0);

  const bgAura = aura(0, 10, 600, '#60a5fa1c', '#5ce1e616');
  const title = heroTitle(['One Input Multiplies', 'Several Output Columns'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gpu0,
    eyebrow: 'DENSE LINEAR REFERENCE · ROW-VECTOR CONVENTION',
  });

  const live = guardedDynamic(1, () => {
    const col = Math.min(3, Math.floor(colIdx.value + 0.001));
    const so = showOut.value > 0.5;
    const sr = showRef.value > 0.5;
    const cs = showColSplit.value > 0.5;
    const rs = showRowSplit.value > 0.5;

    const nodes = [
      // Input x = [1, 2]
      txt('INPUT ROW x', -635, -185, 28, ROLE.gpu0, 'mono'),
    ];
    X[0].forEach((val, j) => {
      const cx = -700 + j * 130;
      const hi = rs;
      nodes.push(
        glassCell(cx, -85, 114, 106, hi ? COSMOS.gold : ROLE.gpu0, {
          fill: hi ? '#29210e' : '#102240',
          glow: hi ? 10 : 7,
        }),
        txt(String(val), cx, -85, 44, hi ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    });

    // Multiply sign
    nodes.push(txt('×', -410, -85, 48, COSMOS.muted, 'mono'));

    // Weight matrix W (2 x 4)
    nodes.push(txt('WEIGHT MATRIX W (2 × 4)', -55, -185, 28, ROLE.gpu1, 'mono'));
    const wx0 = -250;
    W.forEach((row, r) => {
      row.forEach((val, j) => {
        const cx = wx0 + j * 130;
        const cy = -85 + r * 118;
        const activeCol = !cs && !rs && j === col;
        const stroke = activeCol
          ? COSMOS.gold
          : cs
            ? j < 2
              ? ROLE.gpu0
              : ROLE.gpu1
            : rs
              ? r === 0
                ? ROLE.gpu0
                : ROLE.gpu1
              : ROLE.gpu1;
        nodes.push(
          rect(114, 102, {
            fill: activeCol ? '#2b220f' : '#0f1c33',
            stroke,
            width: activeCol ? 3.2 : 2.2,
            radius: 10,
          })
            .at(cx, cy)
            .glow(activeCol ? 10 : 5, stroke),
          txt(String(val), cx, cy, 42, activeCol ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      });
    });

    // Active dot-product readout
    const dotStr = `1 × ${W[0][col]}  +  2 × ${W[1][col]}  =  ${SHARDS.y[col]}`;
    nodes.push(
      glassCell(555, -26, 460, 128, COSMOS.gold, { fill: '#1e190e', glow: 9 }),
      txt(`COLUMN ${col + 1} DOT PRODUCT`, 555, -60, 26, COSMOS.muted, 'mono'),
      txt(dotStr, 555, 2, 34, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
    );

    // Output row xW
    nodes.push(txt('OUTPUT VECTOR xW', -55, 165, 28, sr ? ROLE.good : COSMOS.gold, 'mono'));
    SHARDS.y.forEach((val, j) => {
      const cx = wx0 + j * 130;
      const revealed = sr || (so && j <= col);
      const colStyle = sr ? ROLE.good : j === col ? COSMOS.gold : ROLE.gpu1;
      nodes.push(
        glassCell(cx, 250, 114, 96, revealed ? colStyle : COSMOS.dim, {
          fill: revealed ? '#122638' : '#0c1220',
          glow: revealed ? 8 : 2,
        }),
        txt(revealed ? String(val) : '·', cx, 250, 42, revealed ? colStyle : COSMOS.dim, 'mono'),
      );
    });

    const foot = rs
      ? 'Row split: each rank computes input-coordinate contributions that must sum'
      : cs
        ? 'Column split: different output columns run independently from full x'
        : sr
          ? 'Exact reference xW = [1, 4, 6, 5] every sharded layout must match'
          : 'Multiply each input coordinate by its matching column weight, then sum';

    nodes.push(
      txt(foot, 0, 365, 28, cs || rs ? COSMOS.gold : COSMOS.ink, 'sans'),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 420, { radius: 6, color: ROLE.gpu1 }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('linear-input', () =>
    s.play(showOut.to(0.4, { duration: remainDuration(c, 'linear-input', 0.35) })),
  );
  c.on('output-coordinates', () =>
    s.play(showOut.to(1, { duration: remainDuration(c, 'output-coordinates', 0.4) })),
  );
  c.on('column-products', () =>
    s.play(colIdx.to(1, { duration: remainDuration(c, 'column-products', 0.45) })),
  );
  c.on('repeat-columns', () =>
    s.play(colIdx.to(3, { duration: remainDuration(c, 'repeat-columns', 1.2) })),
  );
  c.on('reference-output', () =>
    s.play(showRef.to(1, { duration: remainDuration(c, 'reference-output', 0.4) })),
  );
  c.on('output-slices', () =>
    s.play(showColSplit.to(1, { duration: remainDuration(c, 'output-slices', 0.45) })),
  );
  c.on('input-contributions', () =>
    s.play(showRowSplit.to(1, { duration: remainDuration(c, 'input-contributions', 0.45) })),
  );
}
