// Scene 19: What needs to fit on one device?: 5 GPU memory towers + ZeRO-1/2/3 sharding + eval bridge.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function smallestRuntime(s, c) {
  const phase = s.value(0);
  const showTrainMem = s.value(0);
  const zero1 = s.value(0);
  const zero2 = s.value(0);
  const zero3 = s.value(0);
  const evalBridge = s.value(0);

  const bgAura = aura(0, 30, 620, '#60a5fa1e', '#5ce1e616');
  const title = heroTitle(['Single GPU First,', 'Then ZeRO / FSDP'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'TRAINING MEMORY & SHARDING',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const tm = showTrainMem.value;
    const z1 = zero1.value;
    const z2 = zero2.value;
    const z3 = zero3.value;
    const eb = evalBridge.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [];

    if (eb < 0.5) {
      const a = 1 - eb * 2;
      const baseY = 195;
      const maxH = 340;
      const cats = [
        { name: 'Weights', sub: 'ZeRO-3 / FSDP', shard: z3, persistent: true, col: COSMOS.blue },
        { name: 'Gradients', sub: 'ZeRO-2', shard: z2, persistent: true, col: COSMOS.violet },
        { name: 'Optimizer', sub: 'ZeRO-1', shard: z1, persistent: true, col: COSMOS.gold },
        { name: 'Activations', sub: 'Checkpoint!', shard: 0, persistent: false, col: COSMOS.cyan },
        {
          name: 'Temp Buffers',
          sub: 'Transient',
          shard: 0,
          persistent: false,
          col: COSMOS.emerald,
        },
      ];

      const stageBadge =
        z3 > 0.5
          ? 'ZERO STAGE 3 / FSDP · WEIGHTS SHARDED'
          : z2 > 0.5
            ? 'ZERO STAGE 2 · GRADS + OPT SHARDED'
            : z1 > 0.5
              ? 'ZERO STAGE 1 · OPTIMIZER SHARDED'
              : 'FIVE TRAINING MEMORY CATEGORIES (PER-DEVICE SHARE)';

      nodes.push(
        txt(stageBadge, 0, -235, 26, z1 > 0.5 ? COSMOS.gold : COSMOS.cyan, 'mono').opacity(a),
        line([-820, baseY], [820, baseY], { stroke: '#3a4b73', width: 2.8 }).opacity(a),
      );

      cats.forEach((cat, i) => {
        const cx = -640 + i * 320;
        const present = i === 0 ? 1 : Math.max(0.12, tm);
        const h = maxH * (1 - 0.75 * cat.shard) * present;
        const sharded = cat.shard > 0.4;

        // Ghost outline showing original unsharded height when sharded
        if (sharded) {
          nodes.push(
            rect(230, maxH, {
              fill: '#101628',
              stroke: cat.col,
              width: 1.8,
              dash: [8, 6],
              radius: 10,
            })
              .at(cx, baseY - maxH * 0.5)
              .opacity(0.32 * a),
          );
        }

        nodes.push(
          rect(230, Math.max(18, h), {
            fill: cat.persistent ? '#121f3a' : '#0f2836',
            stroke: cat.col,
            width: 2.8,
            radius: 10,
          })
            .at(cx, baseY - Math.max(18, h) * 0.5)
            .glow(sharded ? 10 * pulse : 6, cat.col)
            .opacity(present * a),
          txt(
            sharded ? '1/4 GPU' : i === 3 ? 'Context²' : 'Full',
            cx,
            baseY - Math.max(18, h) - 28,
            26,
            cat.col,
            'mono',
          ).opacity(present * a),
          txt(cat.name, cx, baseY + 38, 28, COSMOS.ink, 'mono').opacity(a),
          txt(cat.sub, cx, baseY + 76, 26, sharded ? COSMOS.gold : COSMOS.muted, 'mono').opacity(a),
        );
      });

      const footMsg =
        z1 > 0.5
          ? 'Sharding shrinks persistent state · Long contexts still need activation checkpointing'
          : 'Pilot on 1 device first to validate data path & restore drill before scaling out';
      nodes.push(
        glassCell(0, 372, 1660, 92, COSMOS.cyan, { fill: '#101829', glow: 8, opacity: a }),
        txt(footMsg, 0, 372, 27, COSMOS.cyan, 'mono').opacity(a),
      );
    } else {
      // Beat 2: Trainer Evaluation (reference tokens) vs Serving Evaluation (free generation)
      const a = Math.min(1, (eb - 0.5) * 2);
      const cols = [
        {
          title: 'TRAINER EVAL LOOP',
          top: 'Request + Approved Prefix',
          bot: 'Scores Reference Tokens',
          col: COSMOS.blue,
          x: -440,
        },
        {
          title: 'SERVING POLICY EVAL',
          top: 'Request Alone (No Hints)',
          bot: 'Grade Generated Reply',
          col: COSMOS.emerald,
          x: 440,
        },
      ];
      cols.forEach((col) => {
        nodes.push(
          txt(col.title, col.x, -195, 34, col.col, 'mono').glow(6, col.col).opacity(a),
          glassCell(col.x, -65, 680, 114, col.col, { fill: '#101a30', glow: 8, opacity: a }),
          txt(col.top, col.x, -65, 32, COSMOS.ink, 'sans').opacity(a),
          arrow([col.x, 4], [col.x, 108], { stroke: col.col, width: 5, tip: 14 })
            .glow(8, col.col)
            .opacity(a),
          glassCell(col.x, 180, 680, 114, col.col, {
            fill: col.col === COSMOS.emerald ? '#0c2624' : '#101a30',
            glow: 10 * pulse,
            opacity: a,
          }),
          txt(col.bot, col.x, 180, 32, col.col, 'mono').opacity(a),
        );
      });
      nodes.push(
        txt(
          'To know whether the exported assistant follows policy, let it answer freely',
          0,
          365,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('smallest-runtime-b1', () => s.play(showTrainMem.to(1, { duration: 0.65 })));
  c.on('smallest-runtime-b2', () => s.play(zero1.to(1, { duration: 0.55 })));
  c.on('zero-two', () => s.play(zero2.to(1, { duration: 0.55 })));
  c.on('zero-three', () => s.play(zero3.to(1, { duration: 0.55 })));
  c.on('smallest-runtime-b3', () =>
    s.play(evalBridge.to(1, { duration: remainDuration(c, 'smallest-runtime-b3', 0.5) })),
  );
}
