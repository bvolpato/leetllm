// Scene 02: What occupies one training step? 16 B/param AdamW -> 1,120 GB -> 70 GB/GPU (10 GB headroom) + FP32 master update ruler.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LEDGER_70_16,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function realLedger(s, c) {
  const phase = s.value(0);
  const showLedger = s.value(1);
  const step = s.value(0); // 1=grad, 2=master, 3=moments, 4=sum 1120, 5=70 GB/card
  const showRuler = s.value(0);
  const rulerStep = s.value(0); // 1=tiny 1e-8 -> 1, 2=1e-4 -> FP32 moves, FP16/BF16 snaps back

  const bgAura = aura(0, 20, 640, '#ffd1661c', '#5ce1e618');
  const title = heroTitle(['What Occupies One', 'Training Step?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.opt,
    eyebrow: '16 BYTES / PARAM ADAMW · 70B MODEL',
  });

  const ledgerView = guardedDynamic(showLedger, (a) => {
    const st = step.value;
    const p = phase.value;

    const pieces = [
      { label: 'BF16 weight', b: 2, gb: 140, col: ROLE.weights, on: true },
      { label: 'BF16 grad', b: 2, gb: 140, col: ROLE.grads, on: st >= 0.5 },
      { label: 'FP32 master', b: 4, gb: 280, col: ROLE.opt, on: st >= 1.5 },
      { label: 'FP32 m + v', b: 8, gb: 560, col: ROLE.warn, on: st >= 2.5 },
    ];

    const nodes = [
      txt(
        'PER-PARAMETER MIXED-PRECISION ADAMW INVENTORY (16 B)',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    let curX = -760;
    const pxPerByte = 95;
    pieces.forEach((pc) => {
      const w = pc.b * pxPerByte - 12;
      const cx = curX + w * 0.5;
      curX += pc.b * pxPerByte;
      nodes.push(
        glassCell(cx, -98, w, 122, pc.on ? pc.col : COSMOS.dim, {
          fill: pc.on ? '#141f35' : '#0b101d',
          glow: pc.on ? 8 : 0,
          opacity: a,
        }),
        txt(pc.label, cx, -126, 26, pc.on ? pc.col : COSMOS.dim, 'mono').opacity(a),
        txt(
          st >= 3.5 ? `${pc.gb} GB` : `${pc.b} B`,
          cx,
          -72,
          32,
          pc.on ? COSMOS.ink : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    if (st >= 3.5) {
      nodes.push(
        glassCell(-420, 118, 680, 152, ROLE.opt, { fill: '#221c10', glow: 9, opacity: a }),
        txt('70B TOTAL MODEL STATE', -420, 76, 26, COSMOS.muted, 'mono').opacity(a),
        txt('1,120 GB  (75% is FP32 optimizer)', -420, 134, 32, COSMOS.gold, 'mono').opacity(a),
      );
    }

    if (st >= 4.5) {
      nodes.push(
        glassCell(410, 118, 720, 152, ROLE.good, { fill: '#0d2624', glow: 10, opacity: a }),
        txt('EVENLY SHARDED ACROSS 16 GPUS', 410, 76, 26, ROLE.good, 'mono').opacity(a),
        txt(
          `${LEDGER_70_16.total} GB / card (10 GB headroom)`,
          410,
          134,
          28,
          COSMOS.ink,
          'mono',
        ).opacity(a),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 274, { radius: 6, color: COSMOS.gold, opacity: a }),
      txt(
        st >= 4.5
          ? 'Measure through the 1st optimizer update (Adam allocates m & v then)'
          : '2 B weights + 2 B grads + 4 B master + 8 B moments = 16 B / param',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  const rulerView = guardedDynamic(showRuler, (a) => {
    const rs = Math.round(rulerStep.value);
    const nodes = [
      txt('WHY PAY FOR A 4-BYTE FP32 MASTER WEIGHT?', 0, -242, 28, ROLE.opt, 'mono').opacity(a),
      line([-700, 0], [700, 0], { stroke: COSMOS.muted, width: 3.5 }).opacity(a),
      line([480, -36], [480, 36], { stroke: COSMOS.ink, width: 3.5 }).opacity(a),
      txt('1.0', 480, 76, 30, COSMOS.ink, 'mono').opacity(a),

      // Case 1: 1 - 1e-8
      glassCell(-420, -148, 660, 108, rs === 1 ? ROLE.warn : COSMOS.dim, {
        fill: '#241a10',
        glow: rs === 1 ? 9 : 2,
        opacity: a,
      }),
      txt('STEP A: 1.0 - 1e-8', -420, -174, 26, ROLE.warn, 'mono').opacity(a),
      txt('Even FP32 rounds back to 1.0', -420, -126, 28, COSMOS.ink, 'mono').opacity(a),

      // Case 2: 1 - 1e-4
      glassCell(360, -148, 700, 108, rs >= 2 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2824',
        glow: rs >= 2 ? 11 : 2,
        opacity: a,
      }),
      txt('STEP B: 1.0 - 1e-4', 360, -174, 26, ROLE.good, 'mono').opacity(a),
      txt(
        rs >= 2 ? 'FP32 moves left · FP16/BF16 snap to 1.0!' : 'waiting...',
        360,
        -126,
        28,
        rs >= 2 ? ROLE.good : COSMOS.dim,
        'mono',
      ).opacity(a),
    ];

    // Stored markers on the ruler
    const xFp32 = rs >= 2 ? -180 : 480;
    nodes.push(
      glowDot(xFp32, -16, { radius: 13, color: ROLE.good, opacity: a }),
      txt(rs >= 2 ? 'FP32: 0.9999' : 'FP32: 1.0', xFp32, -62, 26, ROLE.good, 'mono').opacity(a),
      glowDot(480, 16, { radius: 13, color: ROLE.bad, opacity: a }),
      txt('BF16/FP16: 1.0', 480, 134, 26, ROLE.bad, 'mono').opacity(a),
      txt(
        'Master FP32 weight carries small updates across steps even when compute copy reads 1.0',
        0,
        285,
        28,
        ROLE.good,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, ledgerView, rulerView);
  runPhase(s, c, phase, 14);

  c.on('add-gradient', () =>
    s.play(step.to(1, { duration: remainDuration(c, 'add-gradient', 0.4) })),
  );
  c.on('add-master', () => s.play(step.to(2, { duration: remainDuration(c, 'add-master', 0.4) })));
  c.on('add-moments', () =>
    s.play(step.to(3, { duration: remainDuration(c, 'add-moments', 0.4) })),
  );
  c.on('sum-inventory', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'sum-inventory', 0.45) })),
  );
  c.on('state-share', () =>
    s.play(step.to(5, { duration: remainDuration(c, 'state-share', 0.45) })),
  );
  c.after('tiny-store', () => {
    s.play(
      par(
        showLedger.to(0, { duration: 0.2 }),
        delay(showRuler.to(1, { duration: 0.25 }), 0.22),
        rulerStep.to(1, { duration: 0.35 }),
      ),
    );
  });
  c.after('larger-store', () =>
    s.play(rulerStep.to(2, { duration: remainDuration(c, 'larger-store', 0.45) })),
  );
}
