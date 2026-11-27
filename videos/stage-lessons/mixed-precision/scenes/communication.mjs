// Scene 11: Adding gradients across workers (3 cinematic acts).
// Act 1 (Beat 0): Separate compute (BF16), local grad buffer (FP32), and cross-worker reduction dtype (?).
// Act 2 (Beat 1): Fixed-order sum [256, +1, -256] in BF16 (rounds 257->256 -> 0) vs FP32 (keeps 257 -> 1).
// Act 3 (Beat 2): 100M gradient payload (400 MB FP32 vs 200 MB BF16) + two-worker glowing tensor exchange.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  REDUCE_FIX,
  aura,
  fade,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function communication(s, c) {
  // Act 1
  const showAct1 = s.value(1);
  const sepProgress = s.value(0);

  // Act 2
  const showAct2 = s.value(0);
  const redStart = s.value(0);
  const redRound = s.value(0);
  const redBfFinal = s.value(0);
  const redFpFinal = s.value(0);

  // Act 3
  const showAct3 = s.value(0);
  const bytesGrow = s.value(0);
  const swapT = s.value(0);

  const bgAura = aura(0, 0, 680, '#60a5fa1e', '#a78bfa16');

  const title1 = heroTitle(['Reduction Precision', 'Across Workers'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.cyan,
    eyebrow: 'DISTRIBUTED COMMUNICATION DTYPE',
  });
  const title2 = heroTitle(['256 + 1 - 256', 'in BF16 vs FP32'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.rose,
    eyebrow: 'FIXED-ORDER ALL-REDUCE ACCUMULATION',
  }).opacity(0);
  const title3 = heroTitle(['100M Gradients', 'on the Wire'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.emerald,
    eyebrow: 'FP32 400 MB VS BF16 200 MB',
  }).opacity(0);

  // Act 1: Three independent precision roles
  const act1Live = guardedDynamic(showAct1, (a) => {
    const sp = sepProgress.value;

    const lanes = [
      { label: 'Matrix Multiply Operands', dtype: 'BF16 (16-bit)', y: -155, col: COSMOS.blue },
      { label: 'Local Parameter .grad Buffer', dtype: 'FP32 (32-bit)', y: 45, col: COSMOS.emerald },
      { label: 'Cross-Worker Running Sum', dtype: 'Which precision?', y: 245, col: COSMOS.rose },
    ];
    const nodes = [];
    lanes.forEach((ln, idx) => {
      const lit = Math.max(0, Math.min(1, sp * 3 - idx));
      nodes.push(
        txt(ln.label, -790, ln.y, 34, COSMOS.ink, 'sans', 'left').opacity(a),
        glowingTrail(
          [
            [-110, ln.y],
            [230, ln.y],
          ],
          { color: ln.col, width: 4.5, glow: 9, opacity: (0.35 + 0.65 * lit) * a },
        ),
        glowDot(265, ln.y, { radius: 16, color: ln.col, glow: 14, opacity: a }),
        txt(ln.dtype, 325, ln.y, 36, ln.col, 'mono', 'left').glow(6, ln.col).opacity(a),
      );
    });
    nodes.push(
      txt(
        'Check both the collective reduction dtype and the tree addition order',
        0,
        420,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Act 2: [256, +1, -256] associative cancellation in BF16 vs FP32
  const act2Live = guardedDynamic(showAct2, (a) => {
    const rs = redStart.value;
    const rr = redRound.value;
    const bf = redBfFinal.value;
    const fp = redFpFinal.value;

    const cols = [-360, 110, 580];
    const inputs = REDUCE_FIX.values; // [256, 1, -256]
    const yIn = -215;
    const yBf = -10;
    const yFp = 205;

    const nodes = [txt('WORKER INPUTS', -810, yIn, 26, COSMOS.muted, 'mono', 'left').opacity(a)];
    inputs.forEach((v, idx) => {
      nodes.push(
        glowDot(cols[idx], yIn, { radius: 18, color: COSMOS.gold, glow: 12, opacity: a }),
        txt(v > 0 ? `+${v}` : String(v), cols[idx], yIn - 52, 34, COSMOS.gold, 'mono').opacity(a),
      );
    });

    const tracks = [
      {
        name: 'BF16 SUM',
        y: yBf,
        col: COSMOS.rose,
        vals: [
          rs > 0.3 ? String(REDUCE_FIX.bf16[0]) : '?',
          rr > 0.5 ? `${REDUCE_FIX.bf16[1]}  (257→even)` : '?',
          bf > 0.5 ? `${REDUCE_FIX.bf16[2]}  (lost!)` : '?',
        ],
        steps: [rs, rr, bf],
      },
      {
        name: 'FP32 SUM',
        y: yFp,
        col: COSMOS.cyan,
        vals: [
          rs > 0.3 ? String(REDUCE_FIX.fp32[0]) : '?',
          rr > 0.5 ? String(REDUCE_FIX.fp32[1]) : '?',
          fp > 0.5 ? `${REDUCE_FIX.fp32[2]}  (exact!)` : '?',
        ],
        steps: [rs, rr, fp],
      },
    ];

    for (const tr of tracks) {
      nodes.push(txt(tr.name, -810, tr.y, 34, tr.col, 'mono', 'left').glow(6, tr.col).opacity(a));
      for (let i = 0; i < 3; i++) {
        if (i > 0) {
          nodes.push(
            glowingTrail(
              [
                [cols[i - 1] + 55, tr.y],
                [cols[i] - 55, tr.y],
              ],
              { color: tr.steps[i] > 0.2 ? tr.col : COSMOS.dim, width: 4, glow: 8, opacity: a },
            ),
          );
        }
        const active = tr.steps[i] > 0.3;
        nodes.push(
          glowDot(cols[i], tr.y, {
            radius: 16,
            color: active ? tr.col : COSMOS.dim,
            glow: active ? 14 : 4,
            opacity: a,
          }),
          txt(tr.vals[i], cols[i], tr.y + 56, 30, active ? tr.col : COSMOS.dim, 'mono')
            .glow(active ? 6 : 0, tr.col)
            .opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        rr > 0.5
          ? 'In BF16, 257 is halfway between 256 and 258; nearest-even rounds back to 256'
          : 'Same inputs added left-to-right across workers',
        0,
        420,
        28,
        rr > 0.5 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Act 3: 100M gradient payload + two-worker BF16 tensor swap
  const act3Live = guardedDynamic(showAct3, (a) => {
    const bg = bytesGrow.value;
    const sw = swapT.value;

    const barX = -420;
    const fp32W = 920; // 400 MB
    const bf16W = 460; // 200 MB

    const nodes = [
      // Payload bars
      txt('FP32  (4 B/val)', -810, -185, 32, COSMOS.cyan, 'mono', 'left').opacity(a),
      rect(Math.max(12, fp32W * bg), 52, {
        fill: COSMOS.cyan,
        stroke: '#ffffff',
        width: 1.4,
        radius: 7,
      })
        .at(barX + Math.max(12, fp32W * bg) * 0.5, -185)
        .glow(8, COSMOS.cyan)
        .opacity(0.88 * a),
      txt(
        `${Math.round(400 * bg)} MB`,
        barX + fp32W + 36,
        -185,
        34,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),

      txt('BF16  (2 B/val)', -810, -75, 32, COSMOS.emerald, 'mono', 'left').opacity(a),
      rect(Math.max(12, bf16W * bg), 52, {
        fill: COSMOS.emerald,
        stroke: '#ffffff',
        width: 1.4,
        radius: 7,
      })
        .at(barX + Math.max(12, bf16W * bg) * 0.5, -75)
        .glow(8, COSMOS.emerald)
        .opacity(0.88 * a),
      txt(
        `${Math.round(200 * bg)} MB`,
        barX + bf16W + 36,
        -75,
        34,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),

      line([-820, 22], [820, 22], { stroke: '#26304a', width: 2 }).opacity(a),
    ];

    // Two-worker bidirectional exchange arcs
    const yW = 215;
    nodes.push(
      txt('TWO-WORKER BF16 ALL-REDUCE', 0, 78, 28, COSMOS.ink, 'mono').opacity(a),
      glowDot(-620, yW, { radius: 34, color: COSMOS.blue, glow: 16, opacity: a }),
      txt('Worker A', -620, yW + 76, 32, COSMOS.blue, 'mono').opacity(a),

      glowDot(620, yW, { radius: 34, color: COSMOS.cyan, glow: 16, opacity: a }),
      txt('Worker B', 620, yW + 76, 32, COSMOS.cyan, 'mono').opacity(a),

      glowingArc([-560, yW - 18], [560, yW - 18], -75, {
        color: COSMOS.blue,
        width: 4.5,
        glow: 9,
        opacity: (0.35 + 0.65 * sw) * a,
      }),
      glowingArc([560, yW + 18], [-560, yW + 18], 75, {
        color: COSMOS.cyan,
        width: 4.5,
        glow: 9,
        opacity: (0.35 + 0.65 * sw) * a,
      }),
      txt('200 MB →', 0, yW - 92, 28, COSMOS.blue, 'mono').opacity(a),
      txt('← 200 MB', 0, yW + 96, 28, COSMOS.cyan, 'mono').opacity(a),
    );

    if (sw > 0.02 && sw < 0.99) {
      const pA = -560 + 1120 * sw;
      const pB = 560 - 1120 * sw;
      nodes.push(
        glowDot(pA, yW - 18 - Math.sin(sw * Math.PI) * 38, {
          radius: 11,
          color: COSMOS.gold,
          glow: 14,
          opacity: a,
        }),
        glowDot(pB, yW + 18 + Math.sin(sw * Math.PI) * 38, {
          radius: 11,
          color: COSMOS.gold,
          glow: 14,
          opacity: a,
        }),
      );
    }

    nodes.push(
      txt(
        sw > 0.9
          ? 'Measure both wire transfer time and what reduction rounding did to the sum'
          : 'Half the wire payload per link when exchanging 16-bit gradients',
        0,
        420,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title1, title2, title3, act1Live, act2Live, act3Live);

  // Act 1
  c.on('communication-b1', () => s.play(sepProgress.to(1, { duration: 1.2 })));

  // Act 2
  c.on('communication-b2', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        fade(title1, 0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title2, 1, { duration: 0.25 }), 0.22),
        delay(redStart.to(1, { duration: 0.35 }), 0.3),
      ),
    );
  });
  c.after('reduction-bf16-round', () =>
    s.play(
      redRound.to(1, { duration: remainDuration(c, 'reduction-bf16-round', 0.4, 0.35, true) }),
    ),
  );
  c.after('reduction-bf16-final', () =>
    s.play(
      redBfFinal.to(1, { duration: remainDuration(c, 'reduction-bf16-final', 0.4, 0.35, true) }),
    ),
  );
  c.after('reduction-fp32-final', () =>
    s.play(
      redFpFinal.to(1, { duration: remainDuration(c, 'reduction-fp32-final', 0.4, 0.35, true) }),
    ),
  );

  // Act 3
  c.on('communication-b3', () => {
    s.play(
      par(
        showAct2.to(0, { duration: 0.2 }),
        fade(title2, 0, { duration: 0.2 }),
        delay(showAct3.to(1, { duration: 0.25 }), 0.22),
        delay(fade(title3, 1, { duration: 0.25 }), 0.22),
      ),
    );
  });
  c.on('payload-bytes', () => s.play(bytesGrow.to(1, { duration: 0.9 })));
  c.on('exchange-tensors', () =>
    s.play(swapT.to(1, { duration: remainDuration(c, 'exchange-tensors', 1.4) })),
  );
}
