// Scene 02: Checking all 32 bits
// Poison output with 0xFF (NaN), replay skipped store -> 1 mismatch, repair -> 0 mismatches,
// then compare 32-bit sign bits of +0.0 vs -0.0.
import {
  COSMOS,
  ROLE,
  TRANSPOSE_4,
  ZERO_U32,
  aura,
  copyPass,
  delay,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function bitContract(s, c) {
  const phase = s.value(0);
  const showCopy = s.value(1);
  const showZeros = s.value(0);

  const poisoned = s.value(0);
  const repeatProg = s.value(0);
  const poisonVerdict = s.value(0);
  const showIndices = s.value(0);
  const repairedReset = s.value(0);
  const repairedProg = s.value(0);
  const repairVerdict = s.value(0);
  const zeroBits = s.value(0);

  const bgAura = aura(0, 0, 640, '#ff6b8b1a', '#5ce1e618');
  const title = heroTitle(['Checking All', '32 Bits'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.output,
    eyebrow: 'POISONED BUFFER · BITWISE EQUALITY',
  });

  const copyView = guardedDynamic(showCopy, (a) => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);
    const isRepair = repairedReset.value > 0.5;
    const isPoison = poisoned.value > 0.5;
    const pv = poisonVerdict.value;
    const idxShow = showIndices.value > 0.5;
    const rv = repairVerdict.value;

    const stores = isRepair
      ? Math.min(16, Math.floor(repairedProg.value * 16.99))
      : isPoison
        ? Math.min(15, Math.floor(repeatProg.value * 15.99))
        : 15;
    const snap = copyPass(
      isPoison ? 'poison' : 'previous',
      isRepair ? 'repaired' : 'skipped',
      stores,
    );

    const nodes = [
      txt(
        isRepair
          ? 'REPAIRED LAUNCH · FRESH 0xFF POISON'
          : 'SKIPPED STORE · FRESH 0xFF POISON CHECK',
        190,
        -355,
        26,
        isRepair ? ROLE.good : ROLE.bad,
        'mono',
      ).opacity(a),
    ];

    // Left 4x4 Input A
    const cellW = 128;
    const cellH = 92;
    const ax0 = -760;
    const ay0 = -165;
    nodes.push(txt('INPUT A (4 × 4)', ax0 + cellW * 1.5, -242, 28, ROLE.input, 'mono').opacity(a));

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const entry = TRANSPOSE_4[r * 4 + col];
        const cx = ax0 + col * (cellW + 8);
        const cy = ay0 + r * (cellH + 8);
        const isSix = entry.value === 6;
        nodes.push(
          glassCell(cx, cy, cellW, cellH, isSix ? ROLE.gold : ROLE.input, {
            fill: isSix ? '#2c2210' : '#0f1c34',
            glow: isSix ? 10 * pulse : 3,
            opacity: a,
          }),
          txt(String(entry.value), cx, cy, 36, isSix ? ROLE.gold : COSMOS.ink, 'mono').opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        idxShow ? 'word = 1 × 4 + 2 = 6' : 'A[1, 2] = 6',
        ax0 + cellW * 1.5,
        215,
        30,
        ROLE.gold,
        'mono',
      ).opacity(a),
    );

    // Right 4x4 Output B
    const bx0 = 185;
    const by0 = -165;
    nodes.push(
      txt('OUTPUT B (4 × 4)', bx0 + cellW * 1.5, -242, 28, ROLE.output, 'mono').opacity(a),
    );

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const idx = r * 4 + col;
        const cx = bx0 + col * (cellW + 8);
        const cy = by0 + r * (cellH + 8);
        const isTarget = r === 2 && col === 1;
        const fresh = snap.written.has(idx);
        const val = snap.values[idx];
        const isNaNCell = val === 'NaN';
        const border = isTarget
          ? fresh
            ? ROLE.good
            : isNaNCell
              ? ROLE.bad
              : ROLE.gold
          : fresh
            ? ROLE.output
            : isNaNCell
              ? ROLE.bad
              : COSMOS.rule;
        const fill =
          isTarget && fresh ? '#0e2d26' : isNaNCell ? '#2e101c' : fresh ? '#0f2d3d' : '#141928';
        nodes.push(
          glassCell(cx, cy, cellW, cellH, border, {
            fill,
            glow: isTarget ? 10 * pulse : fresh ? 4 : 0,
            opacity: a,
          }),
          txt(
            val,
            cx,
            cy,
            isNaNCell ? 30 : 36,
            isTarget && fresh ? ROLE.good : isNaNCell ? ROLE.bad : COSMOS.ink,
            'mono',
          ).opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        idxShow ? 'word = 2 × 4 + 1 = 9' : 'B[2, 1]',
        bx0 + cellW * 1.5,
        215,
        30,
        ROLE.gold,
        'mono',
      ).opacity(a),
    );

    // Bottom readout with strict prediction withholding
    let statusLine = 'What will the checker find at B[2, 1]?';
    let statusColor = ROLE.gold;
    if (isRepair) {
      if (rv > 0.02) {
        statusLine = `${snap.mismatches} bit mismatches · all 16 output words match`;
        statusColor = ROLE.good;
      } else {
        statusLine = `Repaired pass: ${stores} / 16 words written from fresh poison`;
        statusColor = ROLE.output;
      }
    } else if (pv > 0.02) {
      statusLine = `Expected 0x40c00000 · Found 0xffffffff · ${snap.mismatches} mismatch`;
      statusColor = ROLE.bad;
    }

    nodes.push(txt(statusLine, 0, 360, 32, statusColor, 'mono').glow(6, statusColor).opacity(a));
    return group(...nodes);
  });

  // Beat 3: Signed zeros (+0.0 vs -0.0) 32-bit sign-bit comparison
  const zeroView = guardedDynamic(showZeros, (a) => {
    const p = phase.value;
    const diff = zeroBits.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('WHY BITWISE EQUALITY BEATS ABSOLUTE ERROR', 0, -210, 30, ROLE.output, 'mono').opacity(a),
    ];

    const rows = [
      { label: 'Expected +0.0', hex: '0x00000000', word: ZERO_U32[0], col: ROLE.input, y: -90 },
      { label: 'Returned -0.0', hex: '0x80000000', word: ZERO_U32[1], col: ROLE.output, y: 70 },
    ];

    rows.forEach((row) => {
      const bin = row.word.toString(2).padStart(32, '0');
      nodes.push(
        txt(row.label, -855, row.y - 16, 30, row.col, 'mono', 'left').opacity(a),
        txt(row.hex, -855, row.y + 24, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );
      // Render 4 grouped 8-bit nibbles as crisp wide cells so every bit is >= 26px and zero overlap
      for (let g = 0; g < 4; g++) {
        const chunk = bin.slice(g * 8, g * 8 + 8);
        const gx = -330 + g * 320;
        const isSignGroup = g === 0;
        const highlight = isSignGroup && diff > 0.05;
        nodes.push(
          glassCell(gx, row.y, 286, 86, highlight ? ROLE.bad : row.col, {
            fill: highlight ? '#331120' : '#0f1b33',
            glow: highlight ? 11 * pulse : 4,
            opacity: a,
          }),
          txt(
            chunk,
            gx,
            row.y,
            34,
            highlight ? ROLE.gold : isSignGroup ? COSMOS.ink : COSMOS.muted,
            'mono',
          ).opacity(a),
        );
      }
    });

    nodes.push(
      txt(
        'SIGN BIT (bit 31)',
        -330,
        -160,
        26,
        diff > 0.05 ? ROLE.bad : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        diff > 0.05
          ? 'Sign bit flipped (0 → 1) · bitwise check REJECTS copy'
          : '|+0.0 - (-0.0)| = 0 · absolute error is zero',
        0,
        245,
        34,
        diff > 0.05 ? ROLE.bad : ROLE.gold,
        'mono',
      )
        .glow(7, diff > 0.05 ? ROLE.bad : ROLE.gold)
        .opacity(a),
      txt(
        'Lab inputs: distinct integers 0 .. N² - 1 · exact in float32 up to N = 4096 (max 16,777,215)',
        0,
        355,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    const u = (p * 0.45) % 1;
    nodes.push(glowDot(-460 + u * 1240, 165, { radius: 6, color: ROLE.output, opacity: 0.7 * a }));

    return group(...nodes);
  });

  s.add(bgAura, title, copyView, zeroView);
  runPhase(s, c, phase, 16);

  c.on('fresh-poison', () =>
    s.play(poisoned.to(1, { duration: remainDuration(c, 'fresh-poison', 0.4) })),
  );
  c.on('repeat-stores', () =>
    s.play(repeatProg.to(1, { duration: remainDuration(c, 'repeat-stores', 1.2) })),
  );
  c.after('poison-verdict', () =>
    s.play(poisonVerdict.to(1, { duration: remainAfterDuration(c, 'poison-verdict', 0.45) })),
  );
  c.on('copy-index', () =>
    s.play(showIndices.to(1, { duration: remainDuration(c, 'copy-index', 0.4) })),
  );
  c.on('repair-reset', () =>
    s.play(repairedReset.to(1, { duration: remainDuration(c, 'repair-reset', 0.35) })),
  );
  c.on('repaired-stores', () =>
    s.play(repairedProg.to(1, { duration: remainDuration(c, 'repaired-stores', 1.25) })),
  );
  c.after('repair-verdict', () =>
    s.play(repairVerdict.to(1, { duration: remainAfterDuration(c, 'repair-verdict', 0.45) })),
  );
  c.onBeat(3, () =>
    s.play(
      par(showCopy.to(0, { duration: 0.18 }), delay(showZeros.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.after('zero-bits', () =>
    s.play(zeroBits.to(1, { duration: remainAfterDuration(c, 'zero-bits', 0.45) })),
  );
}
