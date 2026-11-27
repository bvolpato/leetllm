// Scene 05: Who owns token six? 1D grid/block/thread mapping with strict prediction withholding and tail guard.
import {
  COSMOS,
  afterDuration,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  threadMap,
  txt,
} from '../parts.mjs';

export default function mapping(s, c) {
  const splitProg = s.value(0);
  const predictLit = s.value(0);
  const baseLit = s.value(0);
  const answerLit = s.value(0);
  const extendLit = s.value(0);
  const guardLit = s.value(0);

  const bgAura = aura(0, -10, 560, '#5ce1e622', '#a78bfa16');

  const title = heroTitle(['Grid, Blocks,', 'and Local Threads'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: '1D CUDA KERNEL INDEXING',
  });

  const eqGeneral = glowTex('i = \\text{block} \\times 4 + \\text{local}', {
    x: 0,
    y: 295,
    size: 50,
    color: COSMOS.cyan,
  });
  const eqBase = glowTex('i = 1 \\times 4 + \\, ? = \\, ?', {
    x: 0,
    y: 295,
    size: 52,
    color: COSMOS.gold,
  });
  const eqSolved = glowTex('i = 1 \\times 4 + 2 = 6', {
    x: 0,
    y: 295,
    size: 54,
    color: COSMOS.emerald,
  });
  const eqGuard = glowTex('0 \\le i < 10 \\quad \\text{(guard } i = 10, 11\\text{)}', {
    x: 0,
    y: 295,
    size: 48,
    color: COSMOS.rose,
  });

  const map8 = threadMap(8, 4);
  const map10 = threadMap(10, 4);

  const live = guardedDynamic(1, () => {
    const sp = splitProg.value;
    const pr = predictLit.value;
    const an = answerLit.value;
    const ex = extendLit.value;
    const gd = guardLit.value;
    const is3 = ex > 0.5;
    const blocks = is3 ? map10 : map8;
    const blockColors = [COSMOS.cyan, COSMOS.violet, COSMOS.blue];

    const nodes = [
      txt(
        is3
          ? 'EXTENDED LAUNCH: 3 BLOCKS × 4 THREADS (10 INPUTS)'
          : 'TEACHING LAUNCH: 2 BLOCKS × 4 THREADS',
        -855,
        -205,
        26,
        is3 ? COSMOS.blue : COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    blocks.forEach((blk, bIdx) => {
      const col = blockColors[bIdx];
      const cellW = is3 ? 116 : 156;
      const cellGap = is3 ? 12 : 16;
      const blockW = 4 * cellW + 3 * cellGap + 36;
      const centerX = is3 ? -590 + bIdx * 590 : -430 + bIdx * 860;
      const startX = centerX - (4 * cellW + 3 * cellGap) * 0.5 + cellW * 0.5;

      // Block enclosure fades in cleanly once cells settle
      if (sp > 0.85 || is3) {
        const boxOp = is3 ? 0.92 : ((sp - 0.85) / 0.15) * 0.92;
        nodes.push(
          glassCell(centerX, 0, blockW, 215, col, {
            fill: '#0c1324',
            glow: 7,
            opacity: boxOp,
          }),
          txt(`Block ${bIdx}`, centerX, -78, 28, col, 'mono').opacity(is3 ? 1 : (sp - 0.85) / 0.15),
        );
      }

      blk.forEach((th) => {
        const unsplitX = -735 + th.index * 210;
        const targetX = startX + th.thread * (cellW + cellGap);
        const cx = is3 ? targetX : unsplitX + (targetX - unsplitX) * sp;
        const cy = 22;
        const isTok6 = !is3 && th.index === 6;
        const highlightT6 = isTok6 && (pr > 0.5 || an > 0.5);
        const cellStroke = !th.valid
          ? gd > 0.5
            ? COSMOS.rose
            : COSMOS.dim
          : highlightT6
            ? an > 0.5
              ? COSMOS.emerald
              : COSMOS.gold
            : col;

        nodes.push(
          glassCell(cx, cy, cellW, 108, cellStroke, {
            fill: !th.valid
              ? gd > 0.5
                ? '#26111c'
                : '#101420'
              : highlightT6
                ? '#231e11'
                : '#101a2e',
            glow: highlightT6 || (!th.valid && gd > 0.5) ? 9 : 4,
            dash: !th.valid ? [8, 6] : undefined,
          }),
          txt(
            th.valid ? `T${th.index}` : `i=${th.index}`,
            cx,
            cy - 8,
            is3 ? 32 : 38,
            !th.valid
              ? gd > 0.5
                ? COSMOS.rose
                : COSMOS.dim
              : highlightT6
                ? COSMOS.gold
                : COSMOS.ink,
            'mono',
          ),
          txt(
            isTok6 && an < 0.5 ? 'local ?' : `local ${th.thread}`,
            cx,
            cy + 130,
            26,
            isTok6 && an > 0.5 ? COSMOS.emerald : COSMOS.muted,
            'mono',
          ),
        );

        if (!th.valid && gd > 0.5) {
          nodes.push(txt('guarded', cx, cy + 32, 26, COSMOS.rose, 'mono'));
        }
      });
    });

    nodes.push(
      txt(
        is3
          ? 'Tail threads 10 and 11 skip global read via if (i < 10)'
          : pr > 0.5 && an < 0.5
            ? 'Block 1 starts at 4 · Which local thread owns T6?'
            : 'Either block may execute first on any SM',
        0,
        395,
        28,
        pr > 0.5 && an < 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live, eqGeneral);

  c.on('split-blocks', () => s.play(splitProg.to(1, { duration: 0.75 })));
  c.on('predict-owner', () => s.play(predictLit.to(1, { duration: 0.35 })));
  c.on('owner-base', () => s.play(baseLit.to(1, { duration: 0.35 })));
  c.swap('owner-base', eqGeneral, eqBase, { fade: 0.2 });
  // Strict prediction withholding: reveal local 2 and 1*4+2=6 AFTER owner-answer phrase
  c.after('owner-answer', () => {
    const dur = afterDuration(c, 'owner-answer', 0.4);
    s.play(answerLit.to(1, { duration: dur }));
  });
  c.swap('owner-answer', eqBase, eqSolved, { after: true, fade: 0.2 });
  c.on('extend-launch', () => s.play(extendLit.to(1, { duration: 0.6 })));
  c.swap('extend-launch', eqSolved, eqGuard, { fade: 0.2 });
  c.on('guard-tail', () =>
    s.play(guardLit.to(1, { duration: remainDuration(c, 'guard-tail', 0.45) })),
  );
}
