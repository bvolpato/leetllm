// Scene 15: Who owns the last four offsets? 10 slots, 3 blocks of 4 (12 candidate indices), strict prediction hold before 8 & 9!
import {
  COSMOS,
  ROLE,
  aura,
  coverage,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ownership(s, c) {
  const phase = s.value(0);
  const showThread = s.value(0);
  const revNine = s.value(0);
  const showProg = s.value(0);
  const revTail = s.value(0);
  const traceStores = s.value(0);
  const showMask = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1e', '#6ee7b718');
  const title = heroTitle(['Who Owns the Last', 'Four Offsets?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.triton,
    eyebrow: 'CUDA THREAD INDEX vs TRITON BLOCK MASK',
  });

  const blocks = coverage(10, 4).flat(); // 12 items: 0..9 valid, 10..11 masked

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = showThread.value;
    const r9 = revNine.value;
    const sp = showProg.value;
    const rt = revTail.value;
    const ts = traceStores.value;
    const sm = showMask.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('12 CANDIDATE INDICES (3 BLOCKS × 4)  →  10 OUTPUT SLOTS', 0, -215, 28, ROLE.ir, 'mono'),
    ];

    // 3 block frames (0..3, 4..7, 8..11)
    const blkLabels = ['Block / Prog 0', 'Block / Prog 1', 'Block / Prog 2 (tail)'];
    for (let b = 0; b < 3; b++) {
      const cx = -530 + b * 530;
      const isTail = b === 2;
      nodes.push(
        txt(blkLabels[b], cx, -155, 26, isTail ? COSMOS.gold : COSMOS.muted, 'mono'),
        rect(496, 128, {
          fill: null,
          stroke: isTail && sp > 0.5 ? COSMOS.gold : COSMOS.rule,
          width: isTail && sp > 0.5 ? 3.2 : 1.8,
          radius: 12,
          dash: isTail ? [10, 6] : undefined,
        })
          .at(cx, -52)
          .glow(isTail && sp > 0.5 ? 8 : 0, COSMOS.gold),
      );
    }

    // 12 candidate lanes + 10 physical output slots beneath
    blocks.forEach((item, idx) => {
      const b = Math.floor(idx / 4);
      const lane = idx % 4;
      const cx = -716 + b * 530 + lane * 124;
      const isNine = idx === 9;
      const isTailBlock = b === 2;
      const tailKnown = rt > 0.5;
      const stroke =
        isNine && r9 > 0.5
          ? ROLE.cubin
          : isTailBlock && tailKnown
            ? item.valid
              ? ROLE.cubin
              : ROLE.fail
            : isTailBlock && sp > 0.5
              ? COSMOS.gold
              : ROLE.host;

      nodes.push(
        glassCell(cx, -52, 108, 92, stroke, {
          fill: isTailBlock && tailKnown && !item.valid ? '#2b101b' : '#0f1e36',
          glow: (isNine && st > 0.5) || (isTailBlock && tailKnown) ? 9 * pulse : 3,
        }),
        txt(String(idx), cx, -66, 32, stroke, 'mono'),
        txt(
          isTailBlock && tailKnown ? (item.valid ? 'KEEP' : 'MASK') : `t${lane}`,
          cx,
          -26,
          26,
          isTailBlock && tailKnown ? (item.valid ? ROLE.cubin : ROLE.fail) : COSMOS.muted,
          'mono',
        ),
      );

      // Output memory slots 0..9 below
      if (idx < 10) {
        const hit = ts > 0.5 && isTailBlock;
        nodes.push(
          glassCell(cx, 138, 108, 86, hit ? ROLE.cubin : ROLE.ir, {
            fill: hit ? '#0d2b24' : '#0c182a',
            glow: hit ? 10 : 3,
          }),
          txt(`out[${idx}]`, cx, 138, 26, hit ? ROLE.cubin : COSMOS.muted, 'mono'),
        );
      } else {
        nodes.push(
          glassCell(cx, 138, 108, 86, COSMOS.dim, {
            fill: '#0a0d16',
            dash: [6, 6],
            glow: 0,
            opacity: 0.45,
          }),
          txt('none', cx, 138, 26, COSMOS.dim, 'mono').opacity(0.6),
        );
      }
    });

    // Bottom status (strictly withhold 8 & 9 until valid-tail cue!)
    const msg =
      sm > 0.5
        ? 'CUDA: per-thread if (i < 10)  |  Triton: vector mask across [8, 9, 10, 11]'
        : rt > 0.5
          ? 'Valid tail offsets: 8 and 9 → 10 and 11 have no slots underneath'
          : sp > 0.5
            ? 'Predict: which offsets in Program 2 may load & store?'
            : 'Each block covers 4 offsets across 10 outputs';
    nodes.push(
      txt(msg, 0, 325, 28, rt > 0.5 ? ROLE.cubin : COSMOS.gold, 'mono').glow(
        5,
        rt > 0.5 ? ROLE.cubin : COSMOS.gold,
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 245, { radius: 6, color: rt > 0.5 ? ROLE.cubin : ROLE.triton }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('thread-index', () =>
    s.play(showThread.to(1, { duration: remainDuration(c, 'thread-index', 0.4) })),
  );
  c.after('index-nine', () =>
    s.play(revNine.to(1, { duration: remainDuration(c, 'index-nine', 0.4) })),
  );
  c.on('program-span', () =>
    s.play(showProg.to(1, { duration: remainDuration(c, 'program-span', 0.45) })),
  );
  c.after('valid-tail', () =>
    s.play(revTail.to(1, { duration: remainDuration(c, 'valid-tail', 0.45) })),
  );
  c.on('trace-stores', () =>
    s.play(traceStores.to(1, { duration: remainDuration(c, 'trace-stores', 0.45) })),
  );
  c.on('blocked-mask', () =>
    s.play(showMask.to(1, { duration: remainDuration(c, 'blocked-mask', 0.45) })),
  );
}
