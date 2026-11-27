// Scene 08: Which words meet in bank three? 3D 32-bank ring: stride 32 conflict -> stride 33 pad -> XOR [1,0,3,2].
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  bankAddress,
  buildBankRing3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function banks(s, c) {
  const spreadVal = s.value(0); // 0=stride32 conflict, 1=stride33 spread
  const phase = s.value(0);
  const showBanks = s.value(1);
  const showConflict = s.value(0);
  const padStep = s.value(0); // 1=padding, 2=L1->word36/bank4, 3=all 32 distinct
  const showXor = s.value(0);
  const xorCursor = s.value(0); // 1, 2, 3, 4 for physical cols 1, 0, 3, 2

  const bgAura = aura(390, 10, 520, '#ff6b8b20', '#6ee7b71a');
  const { view: bank3d } = buildBankRing3d(spreadVal, phase, { x: 405, y: 10, unit: 106 });

  const title = heroTitle(['Which Words Meet', 'in Bank Three?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'SHARED MEMORY · 32 BANKS',
  });

  const bankView = guardedDynamic(showBanks, (a) => {
    const cf = showConflict.value;
    const ps = padStep.value;
    const stride = ps >= 0.5 ? 33 : 32;
    const sampleLanes = [0, 1, 2, 3];

    const nodes = [
      txt('3D 32-BANK SHARED MEMORY RING', 405, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        ps >= 2.5
          ? 'Stride 33: 32 distinct banks (1 service group)'
          : ps >= 0.5
            ? 'Stride 33: +1 word/row shifts lane banks'
            : cf > 0.5
              ? 'Stride 32: all 32 lanes stack in Bank 3!'
              : 'Broadcast: identical word 3 served once',
        405,
        420,
        26,
        ps >= 2.5 ? ROLE.good : ps >= 0.5 ? COSMOS.gold : cf > 0.5 ? ROLE.bad : COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    nodes.push(
      txt(
        ps >= 0.5 ? 'PADDED ROW STRIDE = 33' : cf > 0.5 ? 'COLUMN STRIDE = 32' : 'WORD 3 BROADCAST',
        -855,
        -195,
        28,
        ps >= 0.5 ? ROLE.good : cf > 0.5 ? ROLE.bad : ROLE.c,
        'mono',
        'left',
      ).opacity(a),
      txt('LANE', -800, -125, 26, COSMOS.muted, 'mono').opacity(a),
      txt('WORD', -600, -125, 26, COSMOS.muted, 'mono').opacity(a),
      txt('BANK (word % 32)', -335, -125, 26, COSMOS.muted, 'mono').opacity(a),
    );

    sampleLanes.forEach((lane, i) => {
      const y = -56 + i * 74;
      const addr = cf > 0.5 ? bankAddress(lane, 3, stride) : { word: 3, bank: 3 };
      const highlightL1 = ps >= 1.5 && ps < 2.5 && lane === 1;
      const pendingPad = ps >= 0.5 && ps < 2.5 && lane > 0 && !(lane === 1 && ps >= 1.5);
      const rowCol =
        ps >= 2.5
          ? ROLE.good
          : highlightL1
            ? COSMOS.gold
            : pendingPad
              ? COSMOS.muted
              : ps >= 0.5
                ? ROLE.good
                : cf > 0.5
                  ? ROLE.bad
                  : ROLE.c;
      nodes.push(
        txt(`L${lane}`, -800, y, 30, rowCol, 'mono').opacity(a),
        txt(
          pendingPad ? '?' : String(addr.word),
          -600,
          y,
          32,
          pendingPad ? COSMOS.muted : COSMOS.ink,
          'mono',
        ).opacity(a),
        glassCell(-335, y, 210, 56, rowCol, {
          fill:
            ps >= 2.5
              ? '#0e2824'
              : pendingPad
                ? '#111829'
                : highlightL1
                  ? '#292110'
                  : cf > 0.5 && ps < 0.5
                    ? '#2b101b'
                    : '#102235',
          glow: highlightL1 || ps >= 2.5 ? 9 : 4,
          opacity: a,
        }),
        txt(pendingPad ? 'Bank ?' : `Bank ${addr.bank}`, -335, y, 28, rowCol, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        ps >= 2.5
          ? '32 → 1 service group · costs +1 float/row padding'
          : ps >= 0.5
            ? 'Stride 33 shifts each row by +1 word'
            : cf > 0.5
              ? '3, 35, 67 … mod 32 = 3 → 32-way conflict'
              : 'Same address across warp = free broadcast',
        -855,
        365,
        28,
        ps >= 2.5 ? ROLE.good : ps >= 0.5 ? COSMOS.gold : cf > 0.5 ? ROLE.bad : COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 3: XOR swizzle view (row 1: physical = logical ^ 1 -> order [1, 0, 3, 2])
  const xorView = guardedDynamic(showXor, (a) => {
    const cur = Math.round(xorCursor.value);
    const visitOrder = [1, 0, 3, 2]; // logical cols 0,1,2,3 live at physical 1,0,3,2
    const xs = [-420, -140, 140, 420];
    const nodes = [
      txt('ZERO-PADDING XOR SWIZZLE · ROW 1 (phys = col ⊕ 1)', 0, -210, 30, COSMOS.violet, 'mono')
        .glow(6, COSMOS.violet)
        .opacity(a),
      txt('LOGICAL ORDER', -730, -90, 26, ROLE.a, 'mono').opacity(a),
      txt('PHYSICAL SLOT', -730, 130, 26, COSMOS.gold, 'mono').opacity(a),
    ];

    for (let col = 0; col < 4; col++) {
      const lx = xs[col];
      const phys = col ^ 1;
      const visited = cur >= col + 1;
      const isNow = cur === col + 1;
      // Top row: logical elements L0..L3
      nodes.push(
        glassCell(lx, -90, 200, 94, isNow ? COSMOS.gold : visited ? ROLE.good : ROLE.a, {
          fill: isNow ? '#292212' : '#101d38',
          glow: isNow ? 11 : 4,
          opacity: a,
        }),
        txt(`logical ${col}`, lx, -90, 30, isNow ? COSMOS.gold : COSMOS.ink, 'mono').opacity(a),
      );
      // Bottom row: physical columns P0..P3 holding swapped logical element (phys ^ 1)
      const storedLogical = col ^ 1;
      const physVisited = cur > 0 && visitOrder.slice(0, cur).includes(col);
      const physNow = cur > 0 && visitOrder[cur - 1] === col;
      nodes.push(
        glassCell(
          lx,
          130,
          200,
          94,
          physNow ? COSMOS.gold : physVisited ? ROLE.good : COSMOS.violet,
          {
            fill: physNow ? '#2a2211' : '#1c1433',
            glow: physNow ? 12 : 4,
            opacity: a,
          },
        ),
        txt(`phys ${col}`, lx, 108, 26, COSMOS.muted, 'mono').opacity(a),
        txt(
          `holds L${storedLogical}`,
          lx,
          150,
          30,
          physNow ? COSMOS.gold : COSMOS.ink,
          'mono',
        ).opacity(a),
        // Crossing swap arc
        glowingArc([lx, -40], [xs[phys], 80], 0, {
          color: isNow ? COSMOS.gold : COSMOS.violet,
          width: isNow ? 4.2 : 2.6,
          opacity: (isNow ? 0.95 : 0.55) * a,
        }),
      );
    }

    const trailStr =
      cur > 0
        ? `Visit order: ${visitOrder.slice(0, cur).join(' → ')}`
        : 'Neighbors (0↔1) and (2↔3) swap';
    nodes.push(
      txt(trailStr, 0, 278, 36, COSMOS.gold, 'mono').glow(7, COSMOS.gold).opacity(a),
      txt(
        'Writer and vectorized reader must share the exact XOR mapping',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, bank3d, title, bankView, xorView);
  runPhase(s, c, phase, 14);
  const xorStart = c.cue('xor-layout').start;
  orbitScene(
    s,
    c,
    bank3d,
    { theta: -0.1, phi: 0.92 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - xorStart + 0.4) },
  );

  c.on('bank-requests', () =>
    s.play(showConflict.to(1, { duration: remainDuration(c, 'bank-requests', 0.45) })),
  );
  c.on('padding-repair', () =>
    s.play(padStep.to(1, { duration: remainDuration(c, 'padding-repair', 0.4) })),
  );
  c.after('padded-lane', () =>
    s.play(padStep.to(2, { duration: remainDuration(c, 'padded-lane', 0.4) })),
  );
  c.after('padded-map', () => {
    s.play(padStep.to(3, { duration: remainDuration(c, 'padded-map', 0.45) }));
    s.play(spreadVal.to(1, { duration: remainDuration(c, 'padded-map', 0.65) }));
  });
  c.on('xor-layout', () => {
    s.play(par(showBanks.to(0, { duration: 0.2 }), delay(showXor.to(1, { duration: 0.25 }), 0.22)));
  });
  c.hide('xor-layout', [bank3d], { fade: 0.2 });
  c.on('read-first', () => s.play(xorCursor.to(1, { duration: 0.25 })));
  c.on('read-second', () => s.play(xorCursor.to(2, { duration: 0.25 })));
  c.on('read-third', () => s.play(xorCursor.to(3, { duration: 0.25 })));
  c.on('read-fourth', () => s.play(xorCursor.to(4, { duration: 0.25 })));
}
