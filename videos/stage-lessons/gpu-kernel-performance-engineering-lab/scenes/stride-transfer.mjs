// Scene 12: Where does lane sixteen land?
// General bank formula + stride 34 transfer test: first 16 lanes hit even banks 0,2..30 ->
// strict prediction hold on Lane 16 (word 544) -> reveal Bank 0 (544 = 17*32) -> 2-way conflict (gcd(34,32)=2).
import {
  BANK_34,
  COSMOS,
  ROLE,
  aura,
  buildBankRing3d,
  columnRequests,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function strideTransfer(s, c) {
  const phase = s.value(0);
  const modeVal = s.value(1); // starts at 1 (stride 33 uniform) -> transitions to 2 (stride 34 even-only 2-way)
  const stride34 = s.value(0);
  const evenProg = s.value(0);
  const wrapBack = s.value(0);
  const secondHalf = s.value(0);
  const twoWords = s.value(0);

  const bgAura = aura(425, 15, 560, '#fb923c20', '#5ce1e618');
  const { view: bank3d } = buildBankRing3d(modeVal, phase, { x: 430, y: 15, unit: 102 });

  const title = heroTitle(['Where Does Lane', 'Sixteen Land?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.warn,
    eyebrow: 'STRIDE 34 · gcd(stride, 32) RULE',
  });

  const formula = glowTex(
    String.raw`\text{bank} = (\text{lane} \cdot \text{stride} + c) \bmod 32`,
    {
      x: -480,
      y: -210,
      size: 32,
      color: ROLE.gold,
      glow: 5,
    },
  );

  const live = guardedDynamic(1, () => {
    const s34 = stride34.value > 0.5;
    const ep = evenProg.value;
    const wb = wrapBack.value > 0.05;
    const sh = secondHalf.value;
    const tw = twoWords.value;

    const lanesCounted = s34
      ? Math.min(16, Math.floor(ep * 16.99)) + (wb ? 1 : 0) + Math.min(15, Math.floor(sh * 15.99))
      : 32;
    const reqs = columnRequests(s34 ? 34 : 33, lanesCounted);

    const nodes = [
      txt('3D 32-BANK RING · STRIDE TRANSFER', 430, -405, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        tw > 0.3
          ? `16 even banks × 2 words · gcd(34, 32) = ${BANK_34.conflict}`
          : s34
            ? `${lanesCounted} / 32 lanes placed at stride 34`
            : 'Stride 33 baseline: gcd(33, 32) = 1 (all 32 banks)',
        430,
        420,
        26,
        tw > 0.3 ? ROLE.warn : s34 ? ROLE.gold : ROLE.good,
        'mono',
      ),
    ];

    const rows = s34
      ? [
          { lane: 0, word: 0, bank: 0, conceal: false },
          { lane: 1, word: 34, bank: 2, conceal: false },
          { lane: 16, word: 544, bank: 0, conceal: !wb },
        ]
      : [
          { lane: 0, word: 0, bank: 0, conceal: false },
          { lane: 1, word: 33, bank: 1, conceal: false },
          { lane: 2, word: 66, bank: 2, conceal: false },
        ];

    nodes.push(
      txt('LANE', -800, -130, 26, COSMOS.muted, 'mono'),
      txt('WORD (c = 0)', -555, -130, 26, COSMOS.muted, 'mono'),
      txt('BANK', -255, -130, 26, COSMOS.muted, 'mono'),
    );

    rows.forEach((row, idx) => {
      const y = -56 + idx * 82;
      const isL16 = s34 && row.lane === 16;
      const col = row.conceal ? ROLE.gold : isL16 ? ROLE.bad : s34 ? ROLE.warn : ROLE.good;
      nodes.push(
        txt(`L${row.lane}`, -800, y, 30, col, 'mono'),
        txt(String(row.word), -555, y, 32, isL16 ? ROLE.gold : COSMOS.ink, 'mono'),
        glassCell(-255, y, 220, 58, col, {
          fill: row.conceal ? '#2a2210' : isL16 ? '#30101e' : '#0f1e30',
          glow: isL16 ? 10 : 4,
        }),
        txt(row.conceal ? 'Bank ?' : `Bank ${row.bank}`, -255, y, 28, col, 'mono'),
      );
    });

    // Prediction / outcome lines
    let detail = 'Stride 33: each bank serves 1 distinct word (4,224 B)';
    let detailCol = ROLE.good;
    if (tw > 0.3) {
      detail = `16 banks × 2 words · gcd(34, 32) = 2 · ${BANK_34.sharedBytes} B (+128 B wasted)`;
      detailCol = ROLE.bad;
    } else if (wb) {
      detail = `544 = 17 × 32 → Bank 0! Collides with Lane 0 (count ${reqs[0]})`;
      detailCol = ROLE.bad;
    } else if (s34) {
      detail = 'Lanes 0..15 step by +2 banks · which bank gets word 544?';
      detailCol = ROLE.gold;
    }

    nodes.push(
      txt(detail, -855, 255, 27, detailCol, 'mono', 'left').glow(6, detailCol),
      txt(
        tw > 0.3
          ? 'Multiplicity = gcd(stride, 32): 1 for 33, 2 for 34, 32 for 32'
          : 'Column 0: each next lane advances by stride words',
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

  s.add(bgAura, bank3d, title, formula, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, bank3d, { theta: -0.14, phi: 0.92 });

  c.on('stride-34', () =>
    s.play(stride34.to(1, { duration: remainDuration(c, 'stride-34', 0.45) })),
  );
  c.on('even-banks', () =>
    s.play(evenProg.to(1, { duration: remainDuration(c, 'even-banks', 0.85) })),
  );
  c.after('wrap-back', () => {
    s.play(wrapBack.to(1, { duration: remainAfterDuration(c, 'wrap-back', 0.45) }));
    s.play(modeVal.to(2, { duration: remainAfterDuration(c, 'wrap-back', 0.75) }));
  });
  c.on('second-half', () =>
    s.play(secondHalf.to(1, { duration: remainDuration(c, 'second-half', 0.75) })),
  );
  c.on('two-words', () =>
    s.play(twoWords.to(1, { duration: remainDuration(c, 'two-words', 0.45) })),
  );
}
