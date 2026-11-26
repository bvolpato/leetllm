// Scene 20: Read one byte in two encodings: OCP (bias 7) vs FNUZ (bias 8) on 0x38, then explicit transcode to 0x40.
import {
  COSMOS,
  afterDuration,
  aura,
  bitStrip8,
  decode8,
  encode8,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  hexByte,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function contract(s, c) {
  const phase = s.value(0);
  const hlExp = s.value(0);
  const revealFnuz = s.value(0);
  const recodeFnuz = s.value(0);
  const verifyTwo = s.value(0);

  const bgAura = aura(120, 20, 620, '#5ce1e620', '#fb923c1a');
  const title = heroTitle(['One Byte,', 'Two Encodings'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.amber,
    eyebrow: 'OCP E4M3 (BIAS 7) VS FNUZ E4M3 (BIAS 8)',
  });

  const ocpCode = 0x38;
  const ocpVal = decode8(ocpCode, 'ocp'); // 1
  const fnuzOldVal = decode8(ocpCode, 'fnuz'); // 0.5
  const fnuzNewCode = encode8(ocpVal, 'fnuz').code; // 0x40
  const fnuzNewVal = decode8(fnuzNewCode, 'fnuz'); // 1

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const hl = hlExp.value;
    const rev = revealFnuz.value;
    const rec = recodeFnuz.value;
    const ver = verifyTwo.value;
    const isRecoded = rec > 0.5;
    const fnuzCode = isRecoded ? fnuzNewCode : ocpCode;

    // Top lane: OCP E4M3 (bias 7)
    const y1 = -125;
    const nodes = [
      txt(
        `OCP E4M3 READER · BIAS = 7 · BYTE ${hexByte(ocpCode)}`,
        -855,
        y1 - 88,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      bitStrip8(ocpCode, -530, y1, {
        cellW: 58,
        cellH: 56,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: hl > 0.3 ? [1, 2, 3, 4] : [],
      }),
      glowingArc([-250, y1], [-55, y1], -22, { color: COSMOS.cyan, width: 3.2 }),
      txt('exp = 7', -152, y1 - 38, 26, COSMOS.gold, 'mono'),
      glassCell(145, y1, 380, 114, COSMOS.cyan, { fill: '#0e1d2e', glow: 8 }),
      txt('DECODED VALUE', 145, y1 - 30, 26, COSMOS.muted, 'mono'),
      txt(`2^(7 - 7) = ${ocpVal}`, 145, y1 + 20, 34, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
      glowingArc([338, y1], [488, y1], -22, { color: COSMOS.cyan, width: 3.2 }),
      txt('× 2', 413, y1 - 38, 28, COSMOS.ink, 'mono'),
      glassCell(675, y1, 350, 114, COSMOS.emerald, { fill: '#0d2224', glow: 8 }),
      txt('MULTIPLIER OUT', 675, y1 - 30, 26, COSMOS.muted, 'mono'),
      txt(`${ocpVal * 2}`, 675, y1 + 20, 44, COSMOS.emerald, 'mono').glow(7, COSMOS.emerald),
    ];

    // Bottom lane: FNUZ E4M3 (bias 8) -- STRICT PREDICTION WITHHOLDING until revealFnuz!
    const y2 = 165;
    const fnuzCol =
      ver > 0.5 ? COSMOS.emerald : isRecoded ? COSMOS.gold : rev > 0.5 ? COSMOS.rose : COSMOS.gold;
    nodes.push(
      txt(
        isRecoded
          ? `FNUZ E4M3 RECODED · BIAS = 8 · BYTE ${hexByte(fnuzCode)} (EXP = 8)`
          : `FNUZ E4M3 READER · BIAS = 8 · SAME BYTE ${hexByte(fnuzCode)}`,
        -855,
        y2 - 88,
        26,
        isRecoded ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),
      bitStrip8(fnuzCode, -530, y2, {
        cellW: 58,
        cellH: 56,
        gap: 6,
        mode: 'e4m3',
        highlightIndices: hl > 0.3 || isRecoded ? [1, 2, 3, 4] : [],
      }),
      glowingArc([-250, y2], [-55, y2], 22, { color: fnuzCol, width: 3.2 }),
      txt(isRecoded ? 'exp = 8' : 'exp = 7', -152, y2 + 40, 26, COSMOS.gold, 'mono'),
      glassCell(145, y2, 380, 114, fnuzCol, { fill: '#1a1524', glow: 8 }),
      txt('DECODED VALUE', 145, y2 - 30, 26, COSMOS.muted, 'mono'),
      txt(
        ver > 0.5
          ? `2^(8 - 8) = ${fnuzNewVal}`
          : isRecoded
            ? '2^(8 - 8) = 1'
            : rev > 0.5
              ? `2^(7 - 8) = ${fnuzOldVal}`
              : '2^(7 - 8) = ?',
        145,
        y2 + 20,
        34,
        fnuzCol,
        'mono',
      ).glow(6, fnuzCol),
      glowingArc([338, y2], [488, y2], 22, { color: fnuzCol, width: 3.2 }),
      txt('× 2', 413, y2 + 40, 28, COSMOS.ink, 'mono'),
      glassCell(675, y2, 350, 114, fnuzCol, { fill: '#1c1422', glow: 9 }),
      txt('MULTIPLIER OUT', 675, y2 - 30, 26, COSMOS.muted, 'mono'),
      txt(
        ver > 0.5 ? `${fnuzNewVal * 2}` : isRecoded ? '...' : rev > 0.5 ? `${fnuzOldVal * 2}` : '?',
        675,
        y2 + 20,
        44,
        fnuzCol,
        'mono',
      ).glow(8, fnuzCol),
    );

    // Traveling pulse photon along the open corridor between top OCP and bottom FNUZ rails
    const u = (p * 0.45) % 1;
    nodes.push(glowDot(-250 + u * 740, 22, { radius: 6, color: fnuzCol }));

    // Bottom status bar
    nodes.push(
      glassCell(0, 382, 1560, 108, ver > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#101829',
        glow: 7,
      }),
      txt(
        ver > 0.5
          ? 'Transcoding 0x38 → 0x40 preserves value 1.0 and restores exact product 2 on FNUZ'
          : rev > 0.5
            ? 'Same bits 0x38 silently halved the product from 2 to 1 under bias 8!'
            : 'Same bits 0x38 sent to OCP (bias 7) and FNUZ (bias 8): what does FNUZ return?',
        0,
        382,
        28,
        ver > 0.5 ? COSMOS.emerald : rev > 0.5 ? COSMOS.rose : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('contract-field', () =>
    s.play(hlExp.to(1, { duration: remainDuration(c, 'contract-field', 0.45) })),
  );
  c.after('contract-read', () =>
    s.play(revealFnuz.to(1, { duration: afterDuration(c, 'contract-read', 0.45) })),
  );
  c.on('contract-recode', () =>
    s.play(recodeFnuz.to(1, { duration: remainDuration(c, 'contract-recode', 0.5) })),
  );
  c.after('contract-verify', () =>
    s.play(verifyTwo.to(1, { duration: afterDuration(c, 'contract-verify', 0.45) })),
  );
}
