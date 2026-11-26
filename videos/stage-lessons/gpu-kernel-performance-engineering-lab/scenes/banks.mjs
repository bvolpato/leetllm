// Scene 11: Shared-memory bank conflicts (stride 32 vs stride 33)
// Orbiting 3D 32-bank ring: 32-way rose spire at Bank 0 -> insert +1 spare word (stride 33) ->
// strict prediction hold before revealing Bank 1 (word 33) -> 32 uniform emerald banks (+128 B/block).
import {
  BANK_32,
  BANK_33,
  COSMOS,
  EDGE_33_PAIRS,
  ROLE,
  aura,
  buildBankRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function banks(s, c) {
  const phase = s.value(0);
  const modeVal = s.value(0); // 0 = stride 32 conflict, 1 = stride 33 uniform
  const firstThree = s.value(0);
  const otherLanes = s.value(0);
  const oldCollision = s.value(0);
  const newStride = s.value(0);
  const newWord = s.value(0);
  const paddedWalk = s.value(0);
  const paddedResult = s.value(0);

  const bgAura = aura(425, 15, 560, '#ff6b8b20', '#6ee7b71a');
  const { view: bank3d } = buildBankRing3d(modeVal, phase, { x: 430, y: 15, unit: 102 });

  const title = heroTitle(['Shared Memory', '32-Way Bank Conflict'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: ROLE.warn,
    eyebrow: '32 BANKS · 32×32 → 32×33 PADDING',
  });

  const sampleLanes = [0, 1, 2];
  const valForLane = (lane) => EDGE_33_PAIRS[lane].producer.value; // 32, 65, 98

  const live = guardedDynamic(1, () => {
    const f3 = firstThree.value;
    const ol = otherLanes.value;
    const oc = oldCollision.value;
    const ns = newStride.value;
    const nw = newWord.value;
    const pw = paddedWalk.value;
    const pr = paddedResult.value;

    const padded = ns > 0.5;
    const stride = padded ? 33 : 32;
    const revealNewBank = nw > 0.05;

    const nodes = [
      txt('3D 32-BANK SHARED MEMORY RING', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        pw > 0.5
          ? 'Stride 33: 32 distinct banks (1 word/bank)'
          : revealNewBank
            ? 'Lane 1 (word 33) -> Bank 1 (+1 bank/row)'
            : padded
              ? 'Stride 33 (+1 pad word/row) · where does Lane 1 land?'
              : oc > 0.3
                ? 'Stride 32: all 32 lanes pile onto Bank 0!'
                : 'Column 0 read across 32 warp lanes',
        430,
        420,
        26,
        pw > 0.5 || revealNewBank
          ? ROLE.good
          : padded
            ? ROLE.gold
            : oc > 0.3
              ? ROLE.bad
              : COSMOS.muted,
        'mono',
      ),

      // Left table header
      txt(
        padded ? 'PADDED STRIDE = 33 WORDS / ROW' : 'UNPADDED STRIDE = 32 WORDS / ROW',
        -855,
        -205,
        28,
        padded ? ROLE.gold : ROLE.bad,
        'mono',
        'left',
      ),
      txt('LANE', -800, -135, 26, COSMOS.muted, 'mono'),
      txt('VAL', -665, -135, 26, COSMOS.muted, 'mono'),
      txt('WORD', -495, -135, 26, COSMOS.muted, 'mono'),
      txt('BANK (word % 32)', -245, -135, 26, COSMOS.muted, 'mono'),
    ];

    sampleLanes.forEach((lane, i) => {
      const y = -62 + i * 82;
      const word = lane * stride;
      const bank = word % 32;
      const isLane1 = lane === 1;
      const conceal = padded && !revealNewBank && lane > 0;
      const rowCol =
        pw > 0.5
          ? ROLE.good
          : conceal
            ? ROLE.gold
            : isLane1
              ? ROLE.gold
              : padded
                ? ROLE.good
                : oc > 0.3 || f3 > 0.3
                  ? ROLE.bad
                  : ROLE.output;

      nodes.push(
        txt(`L${lane}`, -800, y, 30, rowCol, 'mono'),
        txt(String(valForLane(lane)), -665, y, 30, isLane1 ? ROLE.gold : COSMOS.ink, 'mono'),
        txt(conceal ? '?' : String(word), -495, y, 32, conceal ? ROLE.gold : COSMOS.ink, 'mono'),
        glassCell(-245, y, 220, 58, rowCol, {
          fill: pw > 0.5 ? '#0e2824' : conceal ? '#2b2210' : padded ? '#0e2824' : '#2b101d',
          glow: isLane1 || pw > 0.5 ? 9 : 3,
        }),
        txt(conceal ? 'Bank ?' : `Bank ${bank}`, -245, y, 28, rowCol, 'mono'),
      );
    });

    // Prediction / outcome readout at bottom-left
    let statusLine = 'Follow lanes 0, 1, 2 across shared column 0';
    let statusCol = COSMOS.muted;
    if (pr > 0.3) {
      statusLine = `4,224 B vs 4,096 B (+${BANK_33.sharedBytes - BANK_32.sharedBytes} B/block) · same global output`;
      statusCol = ROLE.good;
    } else if (pw > 0.3) {
      statusLine = 'All 32 lanes hit 32 distinct banks (conflict-free)';
      statusCol = ROLE.good;
    } else if (revealNewBank) {
      statusLine = 'Lane 1 (value 65) moves to word 33 → Bank 1!';
      statusCol = ROLE.good;
    } else if (padded) {
      statusLine = 'Lane 1 holds 65 · which bank gets it at stride 33?';
      statusCol = ROLE.gold;
    } else if (oc > 0.3) {
      statusLine = `32 / 32 lanes collide in Bank 0 (${BANK_32.conflict}-way conflict)`;
      statusCol = ROLE.bad;
    } else if (ol > 0.3) {
      statusLine = 'Counting all 32 lanes in the same warp...';
      statusCol = ROLE.warn;
    }

    nodes.push(
      txt(statusLine, -855, 255, 28, statusCol, 'mono', 'left').glow(6, statusCol),
      txt(
        pr > 0.3
          ? 'Does +128 B/block buy real wall-clock speed? Ask the timer.'
          : revealNewBank
            ? 'Each spare float shifts the next row by +1 bank'
            : '1 spare float per row changes the column stride to 33',
        -855,
        340,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, bank3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, bank3d, { theta: -0.14, phi: 0.92 });

  c.on('first-three', () =>
    s.play(firstThree.to(1, { duration: remainDuration(c, 'first-three', 0.45) })),
  );
  c.on('other-lanes', () =>
    s.play(otherLanes.to(1, { duration: remainDuration(c, 'other-lanes', 0.45) })),
  );
  c.on('old-collision', () =>
    s.play(oldCollision.to(1, { duration: remainDuration(c, 'old-collision', 0.45) })),
  );
  c.on('new-stride', () =>
    s.play(newStride.to(1, { duration: remainDuration(c, 'new-stride', 0.45) })),
  );
  c.after('new-word', () =>
    s.play(newWord.to(1, { duration: remainAfterDuration(c, 'new-word', 0.45) })),
  );
  c.on('padded-walk', () => {
    s.play(paddedWalk.to(1, { duration: remainDuration(c, 'padded-walk', 0.7) }));
    s.play(modeVal.to(1, { duration: remainDuration(c, 'padded-walk', 0.85) }));
  });
  c.on('padded-result', () =>
    s.play(paddedResult.to(1, { duration: remainDuration(c, 'padded-result', 0.45) })),
  );
}
