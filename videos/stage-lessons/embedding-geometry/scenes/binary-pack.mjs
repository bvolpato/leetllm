// Scene 16: binary-pack: "Pack signs into a byte"
// Glowing 4D coordinate strips thresholded into sign bits, flying into LSB-ordered 8-bit hardware
// registers (0x05 vs 0x0D), computing bitwise XOR (bit 3 = 1 -> Hamming 1), and marking zero padding.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowingBezier,
  heroTitle,
  lumBar,
  playCue,
  rule,
  runPhase,
  signCode,
  txt,
} from '../parts.mjs';

export default function binaryPack(s, c) {
  const vectors = [
    [0.3, -0.1, 0.8, -0.4],
    [0.5, -0.2, 0.7, 0.1],
  ];
  const codes = vectors.map(signCode); // [0x05, 0x0D]
  const xorVal = codes[0] ^ codes[1]; // 0x08 (bit 3)

  const phase = s.value(0);
  const showSigns = s.value(0);
  const packProg = s.value(0); // 0..1 flying bits into byte registers
  const showPacked = s.value(0);
  const showXor = s.value(0);
  const showCount = s.value(0);
  const showPad = s.value(0);

  const title = heroTitle(['Pack signs', 'into a byte'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.code,
    eyebrow: 'BINARY QUANTIZATION · BIT PACKING',
  });

  const stageLayer = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sOp = showSigns.value;
    const pk = packProg.value;
    const pkDone = showPacked.value;
    const xOp = showXor.value;
    const cntOp = showCount.value;
    const padOp = showPad.value;

    const nodes = [];

    // Top row: A and B 4D float vectors side-by-side
    const groupX = [-445, 425];
    const ids = ['A', 'B'];
    const cols = [ROLE.A, ROLE.B];
    const cellW = 132;
    const gap = 14;

    vectors.forEach((vec, r) => {
      const gx = groupX[r];
      const col = cols[r];
      const baseX = gx - 1.5 * (cellW + gap);
      nodes.push(txt(`Vector ${ids[r]}`, baseX - 66, -278, 30, col, 'serif', 'left').glow(5, col));
      vec.forEach((v, j) => {
        const cx = baseX + j * (cellW + gap);
        const pos = v > 0;
        const diff = j === 3;
        nodes.push(
          txt(`d${j}`, cx, -242, 26, COSMOS.dim, 'mono'),
          lumBar(cx, -182, cellW, 64, {
            color: diff ? ROLE.gold : col,
            fillAlpha: pos ? 0.24 : 0.1,
            strokeWidth: diff ? 2.6 : 1.8,
            glow: diff ? 8 : 4,
          }),
          txt(v > 0 ? `+${v}` : String(v), cx, -182, 30, pos ? COSMOS.ink : COSMOS.muted, 'mono'),
        );
        // Sign bit badges directly below floats
        if (sOp > 0.02 && pk < 0.1) {
          nodes.push(
            lumBar(cx, -104, 72, 46, {
              color: pos ? col : '#4b5e87',
              fillAlpha: pos ? 0.3 : 0.12,
              strokeWidth: 2,
              glow: pos ? 7 : 2,
              opacity: sOp * (1 - pk * 10),
            }),
            txt(pos ? '1' : '0', cx, -104, 30, pos ? col : COSMOS.muted, 'mono').opacity(
              sOp * (1 - pk * 10),
            ),
          );
        }
      });
    });

    // Lower section: 8-bit hardware byte registers (bit 7 .. bit 0)
    const bitStartX = -465;
    const bitW = 112;
    const bitGap = 14;
    const bitX = (jFromMsb) => bitStartX + jFromMsb * (bitW + bitGap);
    const regYs = [38, 146, 254];
    const regNames = ['A byte', 'B byte', 'XOR'];
    const regCols = [ROLE.A, ROLE.B, ROLE.gold];

    nodes.push(rule(-855, -42, 855, -42, COSMOS.rule, 1.8).opacity(0.6));
    for (let j = 0; j < 8; j++) {
      const bitIdx = 7 - j;
      const isPad = bitIdx >= 4;
      nodes.push(
        txt(`b${bitIdx}`, bitX(j), 326, 26, isPad && padOp > 0.4 ? ROLE.warn : COSMOS.dim, 'mono'),
      );
    }

    // Pad label cleanly above the rule
    if (padOp > 0.02) {
      nodes.push(
        txt('zero-padded high bits (b7..b4)', (bitX(0) + bitX(3)) / 2, -74, 26, ROLE.warn, 'mono')
          .glow(6, ROLE.warn)
          .opacity(padOp),
      );
    }

    // Draw A byte, B byte, and XOR registers
    [codes[0], codes[1], xorVal].forEach((val, r) => {
      const ry = regYs[r];
      const isXor = r === 2;
      const filled = isXor ? xOp > 0.5 : pkDone > 0.5;
      nodes.push(
        txt(regNames[r], -665, ry, 32, regCols[r], 'mono', 'right').glow(isXor ? 6 : 0, regCols[r]),
      );

      for (let j = 0; j < 8; j++) {
        const bitIdx = 7 - j;
        const bitVal = (val >> bitIdx) & 1;
        const isPad = bitIdx >= 4;
        const isHit = isXor && bitVal === 1;
        const cellCol = isHit
          ? ROLE.gold
          : isPad && padOp > 0.4 && !isXor
            ? ROLE.warn
            : filled && bitVal === 1
              ? regCols[r]
              : '#364972';

        nodes.push(
          lumBar(bitX(j), ry, bitW, 74, {
            color: cellCol,
            fillAlpha: isHit ? 0.36 : filled && bitVal === 1 ? 0.24 : 0.1,
            strokeWidth: isHit ? 3.4 : 2,
            glow: isHit ? 12 * pulse : filled && bitVal === 1 ? 7 : 2,
          }),
        );
        if (filled) {
          nodes.push(
            txt(
              String(bitVal),
              bitX(j),
              ry,
              36,
              isHit ? ROLE.gold : bitVal === 1 ? COSMOS.ink : COSMOS.dim,
              'mono',
            ).glow(isHit ? 8 : 0, ROLE.gold),
          );
        }
      }

      // Hex readouts on right of A & B registers
      if (!isXor && pkDone > 0.02) {
        const hexStr = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        nodes.push(
          txt(hexStr, bitX(7) + 92, ry, 36, regCols[r], 'mono', 'left')
            .glow(6, regCols[r])
            .opacity(pkDone),
        );
      }
    });

    // Animated flying bit photons during `pack` (starts after sign badges fade at pk=0.12)
    if (pk > 0.12 && pkDone < 0.5) {
      vectors.forEach((vec, r) => {
        const baseX = groupX[r] - 1.5 * (cellW + gap);
        vec.forEach((v, dim) => {
          const sx = baseX + dim * (cellW + gap);
          const sy = -70;
          const ex = bitX(7 - dim); // dim 0 -> bit 0 (rightmost!)
          const ey = regYs[r];
          const t = Math.max(0, Math.min(1, (pk - 0.12) * 1.4 - dim * 0.12));
          const cx = sx + (ex - sx) * t;
          const cy = sy + (ey - sy) * t;
          nodes.push(
            glowingBezier([sx, sy], [ex, ey], -35, {
              color: cols[r],
              width: 2.2,
              glow: 5,
              opacity: 0.35 * (1 - pkDone),
            }),
            glowDot(cx, cy, { radius: 10, color: cols[r], glow: 13 }),
          );
        });
      });
    }

    // Bottom footer: Hex summary -> Hamming distance popcount = 1
    if (cntOp > 0.02) {
      nodes.push(
        txt(
          'Hamming distance = popcount(0x08) = 1   (bit 3 differs)',
          0,
          405,
          38,
          ROLE.gold,
          'mono',
        )
          .glow(9, ROLE.gold)
          .opacity(cntOp),
      );
    } else if (pkDone > 0.02) {
      nodes.push(
        txt(
          'A = 0x05   ·   B = 0x0D   ·   dim 0 sits in LSB (bit 0)',
          0,
          405,
          34,
          ROLE.code,
          'mono',
        ).opacity(pkDone),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.gold), title, stageLayer);

  runPhase(s, c, phase, 8);

  playCue(s, c, 'signs', (d) => s.play(showSigns.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'pack', (d) => s.play(packProg.to(1, { duration: d })), { dur: 1.5 });
  playCue(s, c, 'packed', (d) => s.play(showPacked.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'xor', (d) => s.play(showXor.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'count', (d) => s.play(showCount.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'padding', (d) => s.play(showPad.to(1, { duration: d })), { dur: 0.65 });
}
