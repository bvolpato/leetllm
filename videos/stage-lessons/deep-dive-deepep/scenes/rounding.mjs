// Scene 09: Where is the subtotal stored?
// Prediction scene: keep BF16 snap (256), 0 result, and FP32 1 result concealed until c.after(...) cues!
import {
  COSMOS,
  ROUND_BF16_MID,
  ROUND_RAW,
  ROUND_SINGLE,
  ROUND_STAGED,
  ROLE,
  aura,
  buildFp8ScaleWireRig3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rounding(s, c) {
  const phase = s.value(0);
  const scaleVal = s.value(0.2);
  const cursorVal = s.value(0);
  const addProg = s.value(0); // 256 -> 257
  const showBits = s.value(0); // de-round-question
  const snapBack = s.value(0); // STRICT: c.after('dep-result-round-cast')
  const showZero = s.value(0); // STRICT: c.after('dep-result-round-zero')
  const showOne = s.value(0); // STRICT: c.after('dep-result-round-one')

  const bgAura = aura(470, 12, 500, '#ff6b8b20', '#60a5fa1c');
  const { view: rig3d } = buildFp8ScaleWireRig3d(scaleVal, cursorVal, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Where Is the', 'Subtotal Stored?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.bad,
    eyebrow: 'STAGED REDUCTION · (256 + 1) - 256',
    subtitle: 'All three inputs fit in BF16, yet storage precision decides the sum',
  });

  const live = guardedDynamic(1, () => {
    const bitsOn = Math.round(showBits.value) >= 1;
    const isSnapped = Math.round(snapBack.value) >= 1;
    const isZero = Math.round(showZero.value) >= 1;
    const isOne = Math.round(showOne.value) >= 1;

    const rawMark = 256 + addProg.value * (ROUND_RAW - 256);
    const bfMark = rawMark + (ROUND_BF16_MID - ROUND_RAW) * snapBack.value;

    const rulerL = -820;
    const rulerR = -60;
    const toX = (v) => rulerL + ((v - 255) / 4) * (rulerR - rulerL);

    const nodes = [
      txt('3D PRECISION ACCUMULATION PATHS', 470, -415, 26, ROLE.bad, 'mono').glow(5, ROLE.bad),
      txt(
        isOne
          ? 'FP32 subtotal retains 257 -> final 1'
          : isZero
            ? 'BF16 tie-to-even snaps 257 -> 256 -> final 0'
            : 'Near 256, BF16 representable spacing is 2',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    // Ruler 1: BF16 Staged Subtotal
    const y1 = -52;
    nodes.push(
      glassCell(-440, y1, 820, 186, ROLE.bad, { fill: '#22101a', glow: 7 }),
      txt('STORE SUBTOTAL IN BF16', -825, y1 - 66, 26, ROLE.bad, 'mono', 'left'),
      line([rulerL, y1 - 4], [rulerR, y1 - 4], { stroke: COSMOS.dim, width: 3 }),
    );
    for (const tv of [255, 256, 258]) {
      const tx = toX(tv);
      nodes.push(
        line([tx, y1 - 18], [tx, y1 + 10], { stroke: ROLE.bad, width: 3.5 }),
        txt(String(tv), tx, y1 + 32, 26, COSMOS.ink, 'mono'),
      );
    }
    if (bitsOn) {
      nodes.push(
        txt('bit 0', toX(256), y1 + 66, 26, ROLE.token, 'mono'),
        txt('bit 1', toX(258), y1 + 66, 26, COSMOS.muted, 'mono'),
      );
    }
    nodes.push(glowDot(toX(bfMark), y1 - 4, { radius: 11, color: ROLE.bad, glow: 14 }));
    const bfRes = isZero
      ? `${ROUND_BF16_MID} - 256 = ${ROUND_STAGED}`
      : isSnapped
        ? `stored ${ROUND_BF16_MID} -> - 256 = ?`
        : bitsOn
          ? 'tie: which neighbor?'
          : `subtotal ${Math.round(rawMark)}`;
    nodes.push(txt(bfRes, -55, y1 - 66, 26, ROLE.token, 'mono', 'right'));

    // Ruler 2: FP32 Exact Subtotal
    const y2 = 166;
    nodes.push(
      glassCell(-440, y2, 820, 174, isOne ? ROLE.good : ROLE.rank0, {
        fill: isOne ? '#0d241c' : '#0e1b33',
        glow: 7,
      }),
      txt('KEEP SUBTOTAL IN FP32', -825, y2 - 60, 26, ROLE.rank0, 'mono', 'left'),
      line([rulerL, y2 - 2], [rulerR, y2 - 2], { stroke: COSMOS.dim, width: 3 }),
    );
    for (const tv of [255, 256, 257, 258, 259]) {
      const tx = toX(tv);
      nodes.push(
        line([tx, y2 - 16], [tx, y2 + 12], { stroke: ROLE.rank0, width: 3.2 }),
        txt(String(tv), tx, y2 + 34, 26, COSMOS.ink, 'mono'),
      );
    }
    nodes.push(glowDot(toX(rawMark), y2 - 2, { radius: 11, color: ROLE.nvlink, glow: 14 }));
    const fpRes = isOne ? `${ROUND_RAW} - 256 = ${ROUND_SINGLE}` : `exact ${Math.round(rawMark)}`;
    nodes.push(txt(fpRes, -55, y2 - 60, 26, isOne ? ROLE.good : ROLE.nvlink, 'mono', 'right'));

    // Bottom prediction / takeaway prompt
    const prompt = isOne
      ? 'Check where kernels store intermediate reductions before setting tolerances'
      : isZero
        ? 'BF16 snaps 257 -> 256 (even bit 0), losing the +1 completely'
        : isSnapped
          ? 'Tie-to-even snaps 257 -> 256 (bit 0); subtract 256 next'
          : bitsOn
            ? 'Predict: at a tie, last retained bit must be 0. Which neighbor?'
            : 'Start at 256 on both rulers and add +1';
    nodes.push(
      txt(prompt, -860, 326, 27, bitsOn && !isSnapped ? ROLE.token : COSMOS.ink, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-round-add', () => {
    const dur = remainDuration(c, 'de-round-add', 0.65);
    s.play(addProg.to(1, { duration: dur }));
    s.play(cursorVal.to(0.5, { duration: dur }));
  });
  c.on('de-round-question', () =>
    s.play(showBits.to(1, { duration: remainDuration(c, 'de-round-question', 0.45) })),
  );
  c.after('dep-result-round-cast', () => {
    const dur = remainAfterDuration(c, 'dep-result-round-cast', 0.4);
    s.play(snapBack.to(1, { duration: dur }));
    s.play(cursorVal.to(0, { duration: dur }));
  });
  c.after('dep-result-round-zero', () =>
    s.play(showZero.to(1, { duration: remainAfterDuration(c, 'dep-result-round-zero', 0.3) })),
  );
  c.after('dep-result-round-one', () => {
    const dur = remainAfterDuration(c, 'dep-result-round-one', 0.35);
    s.play(showOne.to(1, { duration: dur }));
    s.play(scaleVal.to(1, { duration: dur }));
    s.play(cursorVal.to(1, { duration: dur }));
  });
}
