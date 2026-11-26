// Scene 11: Which examples reach the training shard? (6 rows C1..C6 gliding through 5 luminous admission gates)
import {
  ADMISSION_RECEIPTS,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function evaluate(s, c) {
  const phase = s.value(0);
  const gateProg = s.value(0); // 0..5 across Seed, Overlap, Client, Diversity, Judge
  const sQueueAsk = s.value(0);
  const sUnstable = s.value(0);
  const sAccept = s.value(0);
  const sShard = s.value(0);

  const bgAura = aura(0, 20, 700, '#123e5c2a', '#2b1b4a16');

  const title = heroTitle(['Which Examples Reach', 'the Training Shard?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'FIVE-GATE ADMISSION SIEVE · SHORT-CIRCUIT TRACE',
  });

  const gateLabels = ['Queue', '1 Seed', '2 Overlap', '3 Client', '4 Diversity', '5 Judge'];
  const gateXs = [-720, -432, -144, 144, 432, 720];
  const failReasons = ['No seed', 'Leak', '>100', 'Copy', 'Flip'];
  const shortTasks = {
    C1: 'retry',
    C2: 'cursor',
    C3: 'reader',
    C4: '10k req',
    C5: 'all pages',
    C6: 'resume',
  };

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const gp = gateProg.value;
    const qa = sQueueAsk.value;
    const unst = sUnstable.value > 0.5;
    const acc = sAccept.value > 0.5;
    const shd = sShard.value > 0.5;

    const nodes = [
      // Header labels + clean top gate pips (no full-height vertical strokes crossing moving capsules)
      ...gateLabels.map((lbl, i) => txt(lbl, gateXs[i], -204, 26, COSMOS.muted, 'mono')),
      ...gateXs.slice(1).map((gx, idx) =>
        line([gx - 144, -182], [gx - 144, -168], {
          stroke: gp >= idx + 0.8 ? COSMOS.cyan : COSMOS.rule,
          width: 3.4,
        }),
      ),
    ];

    let remaining = 0;

    ADMISSION_RECEIPTS.forEach((row, i) => {
      const y = -132 + i * 82;
      // Passed gates: C1=5, C2=4, C3=3, C4=2, C5=1, C6=0
      const maxPos = row.passedGates + 1; // index 1..5 where it stops or enters
      const pos = Math.min(gp, maxPos);
      const lo = Math.min(5, Math.floor(pos));
      const hi = Math.min(5, lo + 1);
      const frac = pos - lo;
      const cx = gateXs[lo] + (gateXs[hi] - gateXs[lo]) * frac;

      const stoppedAtEarly = row.passedGates < 4 && gp >= row.passedGates + 0.85;
      const stoppedAtJudge = row.passedGates === 4 && unst;
      const failed = stoppedAtEarly || stoppedAtJudge;
      const admitted = row.passedGates === 5 && acc;
      if (!failed) remaining += 1;

      const col = failed ? COSMOS.rose : admitted ? COSMOS.emerald : COSMOS.cyan;
      const tag = failed
        ? `${row.id} · ${failReasons[row.passedGates]}`
        : admitted
          ? `${row.id} · SHARD`
          : `${row.id} · ${shortTasks[row.id] ?? row.task}`;

      if (cx > gateXs[0] + 150) {
        nodes.push(
          line([gateXs[0], y], [cx - 142, y], {
            stroke: failed ? COSMOS.rose : admitted ? COSMOS.emerald : COSMOS.cyan,
            width: 2.6,
          }).opacity(0.55),
        );
      }

      nodes.push(
        glassCell(cx, y, 266, 62, col, {
          fill: failed ? '#281119' : admitted ? '#0e2824' : '#0f1e35',
          glow: admitted ? 10 * pulse : failed ? 4 : 6,
        }),
        txt(tag, cx, y + 2, 26, col, 'mono'),
      );
    });

    // Bottom tally bar (strictly withholds C1/C2 winner until Beat 2 cues)
    let tally = `${remaining} of 6 candidates remain`;
    let tallyCol = COSMOS.cyan;
    if (qa > 0.3 && gp < 4.3) {
      tally = `${remaining} of 6 remain   ·   PREDICT: Which two rows still need a judge?`;
      tallyCol = COSMOS.gold;
    } else if (unst && !acc) {
      tally = 'C2 winner flipped across orders (withhold)   ·   checking C1...';
      tallyCol = COSMOS.amber;
    } else if (acc) {
      tally = '1 / 6 ADMITTED -> C1 (retry) enters proposed shard';
      tallyCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 368, 1680, 90, tallyCol, { fill: '#10182b', glow: shd ? 11 * pulse : 7 }),
      glowDot(-800, 368, { radius: 7, color: tallyCol }),
      txt(tally, -765, 370, 28, tallyCol, 'mono', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('check-seed', () => s.play(gateProg.to(1, { duration: 0.7 })));
  c.on('check-index', () => s.play(gateProg.to(2, { duration: 0.7 })));
  c.on('check-client', () => s.play(gateProg.to(3, { duration: 0.7 })));
  c.on('check-novelty', () => s.play(gateProg.to(4, { duration: 0.7 })));
  c.on('judge-queue', () => s.play(sQueueAsk.to(1, { duration: 0.4 })));
  c.on('compare-orders', () => s.play(gateProg.to(5, { duration: 0.85 })));
  c.after('unstable-winner', () => s.play(sUnstable.to(1, { duration: 0.35 })));
  c.after('accept-retry', () => s.play(sAccept.to(1, { duration: 0.35 })));
  c.after('enter-shard', () =>
    s.play(sShard.to(1, { duration: remainDuration(c, 'enter-shard', 0.4) })),
  );
}
