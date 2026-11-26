// Scene 12: Where does the fraction go? Fixed 1024 FP16 vs FP32 ruler (strict prediction hold) + dual-reference cancellation!
import { delay, par } from 'vizmatic/stage';
import {
  CANCEL_ORIG,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function precisionContract(s, c) {
  const phase = s.value(0);
  const showRuler = s.value(1);
  // rulerState: 0=start(1024), 1=exact+0.25 (hold!), 2=round-above, 3=exact-0.375, 4=round-below
  const rulerState = s.value(0);

  const showCancel = s.value(0);
  const candZero = s.value(0);
  const revRef1 = s.value(0);
  const revRef2 = s.value(0);
  const revErr = s.value(0);

  const bgAura = aura(0, 0, 640, '#ffd1661c', '#ff6b8b18');
  const title = heroTitle(['Where Does the', 'Fraction Go?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FP16 vs FP32 · TWO-REFERENCE TESTING',
  });

  // Map value in [1023.0, 1025.0] -> x in [-720, 720]
  const mapX = (val) => (val - 1024.0) * 680;

  const rulerView = guardedDynamic(showRuler, (a) => {
    const st = Math.round(rulerState.value);
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        'FP16 GRID AROUND 1024 (spacing 0.5 below · 1.0 above)',
        0,
        -195,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      line([-760, 0], [760, 0], { stroke: COSMOS.muted, width: 3.5 }).opacity(a),
    ];

    // Representable FP16 ticks: 1023.0, 1023.5, 1024.0, 1025.0
    const fp16Ticks = [1023.0, 1023.5, 1024.0, 1025.0];
    for (const v of fp16Ticks) {
      const tx = mapX(v);
      nodes.push(
        line([tx, -34], [tx, 34], { stroke: COSMOS.ink, width: 3.2 }).opacity(a),
        txt(v.toFixed(1), tx, 72, 28, COSMOS.ink, 'mono').opacity(a),
      );
    }

    // Exact target yellow tick (+0.25 or -0.375)
    if (st === 1 || st === 2) {
      const tx = mapX(1024.25);
      nodes.push(
        line([tx, -60], [tx, 60], { stroke: COSMOS.gold, width: 4.0 })
          .glow(9, COSMOS.gold)
          .opacity(a),
        txt('exact 1024.25', tx, -96, 28, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
      );
    } else if (st === 3 || st === 4) {
      const tx = mapX(1023.625);
      nodes.push(
        line([tx, -60], [tx, 60], { stroke: COSMOS.gold, width: 4.0 })
          .glow(9, COSMOS.gold)
          .opacity(a),
        txt('exact 1023.625', tx, -96, 28, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
      );
    }

    // FP32 and FP16 stored markers (strictly stay at 1024 during st===1 prediction hold!)
    const fp32Val = st === 2 ? 1024.25 : st === 4 ? 1023.625 : 1024.0;
    const fp16Val = st === 4 ? 1023.5 : 1024.0;
    const x32 = mapX(fp32Val);
    const x16 = mapX(fp16Val);

    nodes.push(
      glowDot(x32, -18, { radius: 13, color: ROLE.good, glow: 12 * pulse, opacity: a }),
      txt(
        st === 1 || st === 3 ? 'FP32: ?' : `FP32: ${fp32Val}`,
        x32,
        -152,
        28,
        ROLE.good,
        'mono',
      ).opacity(a),
      glowDot(x16, 18, { radius: 13, color: ROLE.bad, glow: 12 * pulse, opacity: a }),
      txt(
        st === 1 || st === 3 ? 'FP16: ?' : `FP16: ${fp16Val}`,
        x16,
        142,
        28,
        ROLE.bad,
        'mono',
      ).opacity(a),
    );

    const statusLine =
      st === 0
        ? 'Both accumulators start at 1024.0'
        : st === 1
          ? 'Add +0.25 to both: which stored value will move?'
          : st === 2
            ? 'FP32 reaches 1024.25 · FP16 stays stuck at 1024 (gap = 1.0)'
            : st === 3
              ? 'Reset to 1024 and subtract 3/8 (0.375)...'
              : 'Below 1024 gap is 0.5 → FP16 snaps to 1023.5';
    nodes.push(txt(statusLine, 0, 325, 32, st === 1 ? COSMOS.gold : COSMOS.ink, 'sans').opacity(a));

    return group(...nodes);
  });

  // View 2: Input quantization cancellation + dual reference comparison
  const cancelView = guardedDynamic(showCancel, (a) => {
    const cz = candZero.value;
    const r1 = revRef1.value;
    const r2 = revRef2.value;
    const re = revErr.value;

    const nodes = [
      txt(
        'INPUT CANCELLATION: A = [1.0001, 1.0] · B = [1.0, -1.0]',
        0,
        -210,
        30,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Top branch: Original FP32 inputs -> Ref 2
      glassCell(-500, -65, 420, 108, ROLE.a, { fill: '#10203a', glow: 8, opacity: a }),
      txt('ORIGINAL FP32 INPUTS', -500, -92, 26, ROLE.a, 'mono').opacity(a),
      txt('[1.0001, 1.0] · [1, -1]', -500, -45, 30, COSMOS.ink, 'mono').opacity(a),

      // Bottom branch: Cast to FP16 -> [1.0, 1.0] -> Ref 1
      glassCell(-500, 130, 420, 108, ROLE.warn, { fill: '#2a1d10', glow: 8, opacity: a }),
      txt('CAST TO FP16 FIRST', -500, 103, 26, ROLE.warn, 'mono').opacity(a),
      txt('[1.0, 1.0] · [1, -1]', -500, 150, 30, COSMOS.gold, 'mono').opacity(a),

      glowingArc([-285, -65], [140, -65], -22, { color: ROLE.a, width: 3.2, opacity: 0.85 * a }),
      glowingArc([-285, 130], [140, 130], 22, { color: ROLE.warn, width: 3.2, opacity: 0.85 * a }),
    ];

    if (cz > 0.02) {
      nodes.push(
        txt('KERNEL CANDIDATE OUTPUT: 0.0', 0, 265, 32, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(cz * a),
      );
    }

    // Ref 1 (rounded inputs) - revealed on rounded-zero
    nodes.push(
      glassCell(440, 130, 520, 108, r1 > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2624',
        glow: r1 > 0.5 ? 9 : 0,
        opacity: a,
      }),
      txt('REF 1 · ROUNDED INPUTS (FP64)', 440, 103, 26, ROLE.good, 'mono').opacity(a),
      txt(
        r1 > 0.5 ? '0.00000000  (exact match)' : 'pending...',
        440,
        150,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    );

    // Ref 2 (original inputs) - revealed on dual-reference
    nodes.push(
      glassCell(440, -65, 520, 108, r2 > 0.5 ? ROLE.bad : COSMOS.dim, {
        fill: '#2b121e',
        glow: r2 > 0.5 ? 9 : 0,
        opacity: a,
      }),
      txt('REF 2 · ORIGINAL INPUTS (FP64)', 440, -92, 26, ROLE.bad, 'mono').opacity(a),
      txt(
        r2 > 0.5 ? `${CANCEL_ORIG.toFixed(8)}  (~1e-4)` : 'pending...',
        440,
        -45,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    );

    if (re > 0.02) {
      nodes.push(
        txt(
          '100% relative error near zero → use BOTH absolute & relative tolerances',
          0,
          388,
          30,
          ROLE.bad,
          'mono',
        )
          .glow(6, ROLE.bad)
          .opacity(re * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, rulerView, cancelView);
  runPhase(s, c, phase, 14);

  c.on('exact-above', () =>
    s.play(rulerState.to(1, { duration: remainDuration(c, 'exact-above', 0.35) })),
  );
  c.on('round-above', () =>
    s.play(rulerState.to(2, { duration: remainDuration(c, 'round-above', 0.45) })),
  );
  c.on('exact-below', () =>
    s.play(rulerState.to(3, { duration: remainDuration(c, 'exact-below', 0.35) })),
  );
  c.on('round-below', () =>
    s.play(rulerState.to(4, { duration: remainDuration(c, 'round-below', 0.45) })),
  );
  c.on('input-quantize', () => {
    s.play(
      par(showRuler.to(0, { duration: 0.2 }), delay(showCancel.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('candidate-zero', () =>
    s.play(candZero.to(1, { duration: remainDuration(c, 'candidate-zero', 0.4) })),
  );
  c.after('rounded-zero', () =>
    s.play(revRef1.to(1, { duration: remainDuration(c, 'rounded-zero', 0.4) })),
  );
  c.after('dual-reference', () =>
    s.play(revRef2.to(1, { duration: remainDuration(c, 'dual-reference', 0.4) })),
  );
  c.after('precision-error-result', () =>
    s.play(revErr.to(1, { duration: remainDuration(c, 'precision-error-result', 0.4) })),
  );
}
