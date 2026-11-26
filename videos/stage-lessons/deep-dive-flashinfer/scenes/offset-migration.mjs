// Scene 16: Where does output row three begin? cuDNN v0.7.1 element vs token offsets (Q=18432 vs O=12288, row 4.5 overwrite!).
import {
  ALLOC_Q_HEADS,
  COSMOS,
  OFFSET_O,
  OFFSET_O_DIM,
  OFFSET_O_STRIDE,
  OFFSET_Q,
  OFFSET_Q_DIM,
  OFFSET_Q_STRIDE,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function offsetMigration(s, c) {
  const phase = s.value(0);
  const showQOff = s.value(0);
  const askOOff = s.value(0);
  const revOOff = s.value(0); // strictly withheld until fi-offset-migration-ooffset!
  const copyBug = s.value(0); // lands at 18432 = 4.5 output rows (middle of R2 row 4)!
  const fixedElem = s.value(0);
  const tokenMode = s.value(0);

  const bgAura = aura(0, 20, 660, '#fb923c1a', '#ff6b8b1a');

  const title = heroTitle(['Where Does Output', 'Row Three Begin?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'v0.7.1 CUDNN OFFSETS · ELEMENTS VS TOKENS',
    subtitle: `32 Q heads · Q width = ${OFFSET_Q_DIM} (${OFFSET_Q_STRIDE}/row) · O width = ${OFFSET_O_DIM} (${OFFSET_O_STRIDE}/row)`,
  });

  // Shared element scale: 0 .. 32,768 elements mapped to x in [-760, 760]
  const mapElemX = (el) => -760 + (el / 32768) * 1520;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sq = showQOff.value;
    const ask = askOOff.value;
    const ro = revOOff.value;
    const bug = copyBug.value;
    const fix = fixedElem.value;
    const tok = tokenMode.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        tok > 0.5
          ? 'TOKEN MODE: batch_offsets_units = "tokens" -> [0, 3, 4, 8]'
          : 'ELEMENT MODE (DEFAULT): shared element coordinate ruler (0 .. 32,768)',
        0,
        -168,
        28,
        tok > 0.5 ? ROLE.good : COSMOS.cyan,
        'mono',
      ),
    ];

    // Q buffer strip (y = -58): 5 rows fit across 0..30720 (each row = 6144 elements)
    const qY = -58;
    nodes.push(txt('Q BUFFER (6,144 elem/row)', -760, qY - 68, 26, ROLE.r0, 'mono', 'left'));
    for (let r = 0; r < 5; r++) {
      const x0 = mapElemX(r * OFFSET_Q_STRIDE);
      const x1 = mapElemX((r + 1) * OFFSET_Q_STRIDE);
      const ownerCol = r < 3 ? ROLE.r0 : r === 3 ? ROLE.r1 : ROLE.r2;
      nodes.push(
        rect(x1 - x0 - 6, 72, {
          fill: r < 3 ? '#10213d' : r === 3 ? '#24143f' : '#0f2b3a',
          stroke: ownerCol,
          width: 2.2,
          radius: 8,
        }).at((x0 + x1) * 0.5, qY),
        txt(`q${r}`, (x0 + x1) * 0.5, qY, 26, ownerCol, 'mono'),
      );
    }

    // Q row-3 marker at 18,432 (split above/below box so it never crosses text)
    const q3X = mapElemX(OFFSET_Q[1]);
    if (sq > 0.05) {
      nodes.push(
        line([q3X, qY - 56], [q3X, qY - 38], { stroke: COSMOS.gold, width: 4.0 })
          .glow(8, COSMOS.gold)
          .opacity(sq),
        line([q3X, qY + 38], [q3X, qY + 56], { stroke: COSMOS.gold, width: 4.0 })
          .glow(8, COSMOS.gold)
          .opacity(sq),
        txt(
          tok > 0.5 ? 'R1 = token 3' : `R1 Q offset = ${OFFSET_Q[1].toLocaleString()}`,
          q3X,
          qY + 84,
          26,
          COSMOS.gold,
          'mono',
        ).opacity(sq),
      );
    }

    // O buffer strip (y = 152): 8 rows fit across 0..32768 (each row = 4096 elements)
    const oY = 152;
    nodes.push(txt('O BUFFER (4,096 elem/row)', -760, oY - 68, 26, ROLE.r2, 'mono', 'left'));
    for (let r = 0; r < 8; r++) {
      const x0 = mapElemX(r * OFFSET_O_STRIDE);
      const x1 = mapElemX((r + 1) * OFFSET_O_STRIDE);
      const ownerCol = r < 3 ? ROLE.r0 : r === 3 ? ROLE.r1 : ROLE.r2;
      const isCorruptRow4 = bug > 0.5 && fix < 0.5 && r === 4;
      nodes.push(
        rect(x1 - x0 - 6, 72, {
          fill: isCorruptRow4 ? '#381020' : r < 3 ? '#10213d' : r === 3 ? '#24143f' : '#0f2b3a',
          stroke: isCorruptRow4 ? ROLE.bad : ownerCol,
          width: isCorruptRow4 ? 3.2 : 2.2,
          radius: 8,
        })
          .at((x0 + x1) * 0.5, oY)
          .glow(isCorruptRow4 ? 10 * pulse : 0, ROLE.bad),
        txt(`o${r}`, (x0 + x1) * 0.5, oY, 26, isCorruptRow4 ? ROLE.bad : ownerCol, 'mono'),
      );
    }

    // O pointer: vernier ticks above/below O strip so line never crosses "o4" text!
    if (ro > 0.05) {
      const bugActive = bug * (1 - fix);
      const activeOffset = OFFSET_O[1] * (1 - bugActive) + OFFSET_Q[1] * bugActive;
      const oPtrX = mapElemX(activeOffset);
      const ptrCol = bugActive > 0.5 ? ROLE.bad : ROLE.good;
      const ptrLabel =
        tok > 0.5
          ? 'R1 O = token 3 (matches Q)'
          : bugActive > 0.5
            ? 'COPIED 18,432 -> row 4.5 (INSIDE R2!)'
            : `R1 O offset = ${OFFSET_O[1].toLocaleString()}`;
      nodes.push(
        line([oPtrX, oY - 58], [oPtrX, oY - 38], { stroke: ptrCol, width: 4.5 })
          .glow(10, ptrCol)
          .opacity(ro),
        line([oPtrX, oY + 38], [oPtrX, oY + 58], { stroke: ptrCol, width: 4.5 })
          .glow(10, ptrCol)
          .opacity(ro),
        txt(ptrLabel, oPtrX, oY + 86, 26, ptrCol, 'mono')
          .glow(5, ptrCol)
          .opacity(ro),
      );
    }

    // Bottom readout box (withholds 12,288 during prediction!)
    let bCol = COSMOS.cyan;
    let bLine1 = `Q stride = ${ALLOC_Q_HEADS} × ${OFFSET_Q_DIM} = ${OFFSET_Q_STRIDE} · 3 rows = ${OFFSET_Q[1].toLocaleString()}`;
    let bLine2 = 'Check each tensor stride separately in element mode';

    if (ask > 0.5 && ro < 0.5) {
      bCol = COSMOS.gold;
      bLine1 = 'Predict: where does token row 3 begin in O?';
      bLine2 = `O has ${ALLOC_Q_HEADS} heads × ${OFFSET_O_DIM} dims per row (smaller than Q!)`;
    } else if (ro > 0.5 && bug < 0.5) {
      bCol = ROLE.good;
      bLine1 = `3 × (${ALLOC_Q_HEADS} × ${OFFSET_O_DIM}) = ${OFFSET_O[1].toLocaleString()} elements`;
      bLine2 = 'O row 3 begins at 12,288, not 18,432';
    } else if (bug > 0.5 && fix < 0.5) {
      bCol = ROLE.bad;
      bLine1 = 'SILENT CORRUPTION: 18,432 / 4,096 = 4.5 -> overwrites R2 row 4!';
      bLine2 = 'Offset stays inside the buffer, so no out-of-bounds crash fires';
    } else if (fix > 0.5 && tok < 0.5) {
      bCol = ROLE.good;
      bLine1 = 'RESTORED: multiply by each tensor own stride (Q: 6,144 · O: 4,096)';
      bLine2 = 'O pointer returns cleanly to start of R1 row 3 (12,288)';
    } else if (tok > 0.5) {
      bCol = ROLE.good;
      bLine1 = 'TOKEN MODE: pass [0, 3, 4, 8] to both Q and O; operator handles strides';
      bLine2 = 'Always check returned LSE base separately before merging workers';
    }

    nodes.push(
      glassCell(0, 345, 1640, 118, bCol, { fill: '#0e172a', glow: 9 }),
      txt(bLine1, 0, 320, 28, bCol, 'mono').glow(5, bCol),
      txt(bLine2, 0, 370, 26, COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fi-offset-migration-qoffset', () =>
    s.play(showQOff.to(1, { duration: remainDuration(c, 'fi-offset-migration-qoffset', 0.4) })),
  );
  c.on('offset-question', () =>
    s.play(askOOff.to(1, { duration: remainDuration(c, 'offset-question', 0.4) })),
  );
  c.after('fi-offset-migration-ooffset', () =>
    s.play(revOOff.to(1, { duration: remainAfter(c, 'fi-offset-migration-ooffset', 0.4) })),
  );
  c.after('offset-copy', () =>
    s.play(copyBug.to(1, { duration: remainAfter(c, 'offset-copy', 0.45) })),
  );
  c.on('offset-fix', () =>
    s.play(fixedElem.to(1, { duration: remainDuration(c, 'offset-fix', 0.45) })),
  );
  c.on('offset-tokens', () =>
    s.play(tokenMode.to(1, { duration: remainDuration(c, 'offset-tokens', 0.45) })),
  );
}
