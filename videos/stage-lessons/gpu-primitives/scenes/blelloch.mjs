// Scene 11: Blelloch Up-Sweep / Down-Sweep glowing arc cascade + live 4-slot shared-memory state.
import {
  ARTICLE_INPUT,
  BLELLOCH,
  COSMOS,
  aura,
  evalArc2d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const LEAVES = ARTICLE_INPUT.slice(0, 4); // [3, -1, 4, 1]
const PAIR_SUMS = [BLELLOCH.states[1].values[1], BLELLOCH.states[1].values[3]]; // [2, 5]
const PREFIXES = BLELLOCH.states.at(-1).values; // [0, 3, 2, 6]
const INCLUSIVE_4 = LEAVES.map((v, i) => PREFIXES[i] + v); // [3, 2, 6, 7]

export default function blelloch(s, c) {
  const phase = s.value(0);
  const upPairs = s.value(0);
  const upRoot = s.value(0);
  const saveTotal = s.value(0);
  const zeroRoot = s.value(0);
  const downHalves = s.value(0);
  const downLeaves = s.value(0);
  const highlightStorage = s.value(0);
  const showInclusive = s.value(0);

  const bgAura = aura(0, -10, 620, '#60a5fa20', '#6ee7b71a');
  const title = heroTitle(['Blelloch Scan:', 'Up-Sweep & Down-Sweep'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'WORK-EFFICIENT · 2N − 2 ADDITIONS',
  });

  const xs = [[0], [-340, 340], [-510, -170, 170, 510]];
  const ys = [-210, -35, 140];

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const up1 = upPairs.value > 0.5;
    const up2 = upRoot.value > 0.5;
    const sv = saveTotal.value > 0.5;
    const zr = zeroRoot.value > 0.5;
    const dn1 = downHalves.value > 0.5;
    const dn2 = downLeaves.value > 0.5;
    const stg = highlightStorage.value > 0.5;
    const inc = showInclusive.value > 0.5;
    const u = (p * 0.85) % 1;

    const stageIdx = [up1, up2, zr, dn1, dn2].filter(Boolean).length;
    const slotVals = BLELLOCH.states[stageIdx].values;

    const nodes = [
      // Phase badge on top right
      txt(
        zr ? 'DOWN-SWEEP · STARTING SCORES' : 'UP-SWEEP · SUBTREE SUMS',
        855,
        -395,
        26,
        zr ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'right',
      ).glow(5, zr ? COSMOS.emerald : COSMOS.cyan),
    ];

    // Glowing tree edges (directed upward during up-sweep, downward during down-sweep)
    for (let lvl = 1; lvl <= 2; lvl++) {
      xs[lvl].forEach((cx, i) => {
        const px = xs[lvl - 1][Math.floor(i / 2)];
        const activeDown = lvl === 1 ? dn1 : dn2;
        const activeUp = lvl === 1 ? up2 : up1;
        const col = activeDown
          ? COSMOS.emerald
          : zr
            ? COSMOS.gold
            : activeUp
              ? COSMOS.cyan
              : COSMOS.rule;
        const pTop = [px, ys[lvl - 1] + 42];
        const pBot = [cx, ys[lvl] - 42];
        const from = zr ? pTop : pBot;
        const to = zr ? pBot : pTop;
        nodes.push(
          glowingArc(from, to, 0, {
            color: col,
            width: activeDown || activeUp ? 4.0 : 2.2,
            opacity: activeDown || activeUp ? 0.92 : 0.45,
            core: false,
          }),
        );
        if ((zr && !dn2 && lvl === (dn1 ? 2 : 1)) || (!zr && activeUp)) {
          const [dx, dy] = evalArc2d(from, to, 0, (u + i * 0.17) % 1);
          nodes.push(glowDot(dx, dy, { radius: 6, color: col }));
        }
      });
    }

    // Tree nodes (strictly withhold down-sweep answers until sweep-halves / sweep-leaves!)
    const rows = [
      [zr ? 0 : up2 ? BLELLOCH.total : '·'],
      dn1 ? [0, PAIR_SUMS[0]] : up1 ? PAIR_SUMS : ['·', '·'],
      dn2 ? PREFIXES : LEAVES,
    ];
    rows.forEach((vals, lvl) => {
      const isPrefixRow = [zr, dn1, dn2][lvl];
      vals.forEach((v, i) => {
        const cx = xs[lvl][i];
        const cy = ys[lvl];
        const isAskRight = zr && !dn1 && lvl === 1 && i === 1;
        const col = isAskRight ? COSMOS.gold : isPrefixRow ? COSMOS.emerald : COSMOS.blue;
        const label = isAskRight ? `${PAIR_SUMS[1]} → ?` : number(v);
        nodes.push(
          glassCell(cx, cy, 166, 76, col, {
            fill: isPrefixRow ? '#0d2624' : isAskRight ? '#261e10' : '#101d38',
            glow: isPrefixRow || isAskRight ? 10 : 5,
          }),
          txt(label, cx, cy, isAskRight ? 30 : 38, col, 'mono').glow(isPrefixRow ? 6 : 0, col),
        );
      });
    });

    // Saved Block Total vault on upper right
    if (sv) {
      nodes.push(
        glassCell(605, -210, 370, 96, COSMOS.gold, { fill: '#241c10', glow: 11 }),
        txt('SAVED BLOCK TOTAL', 605, -236, 26, COSMOS.muted, 'mono'),
        txt(String(BLELLOCH.total), 605, -186, 42, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
      );
    }

    // In-place 4 shared-memory slots strip
    nodes.push(
      txt('SHARED SLOTS', -845, 290, 26, stg ? COSMOS.gold : COSMOS.muted, 'mono', 'left'),
    );
    slotVals.forEach((v, i) => {
      const sx = -450 + i * 300;
      const col = dn2 ? COSMOS.emerald : stg ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        glassCell(sx, 290, 224, 78, col, {
          fill: dn2 ? '#0d2624' : '#0f1c30',
          glow: stg || dn2 ? 9 : 4,
        }),
        txt(`s[${i}] = ${number(v)}`, sx, 290, 30, col, 'mono'),
      );
    });

    // Bottom teaching banner
    const msgCol = inc ? COSMOS.cyan : dn2 ? COSMOS.emerald : zr ? COSMOS.gold : COSMOS.cyan;
    const msg = inc
      ? `Exclusive + play → inclusive [${INCLUSIVE_4.join(', ')}]  ·  block barrier between phases`
      : dn2
        ? 'Leaves [0, 3, 2, 6]: last play starts at 2 + 4 = 6'
        : dn1
          ? 'Right pair starts at parent 0 + old left sum 2 = 2'
          : zr
            ? 'Root set to 0  ·  What starting score should the right pair get?'
            : 'Up-sweep saves pair sums [2, 5] and root total 7';

    nodes.push(
      glassCell(0, 405, 1560, 78, msgCol, { fill: '#101829', glow: 8 }),
      txt(msg, 0, 405, 28, msgCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('sweep-pairs', () => s.play(upPairs.to(1, { duration: 0.45 })));
  c.on('sweep-sum', () => s.play(upRoot.to(1, { duration: 0.45 })));
  c.on('sweep-save', () => s.play(saveTotal.to(1, { duration: 0.4 })));
  c.on('sweep-zero', () => s.play(zeroRoot.to(1, { duration: 0.4 })));
  c.after('sweep-halves', () => s.play(downHalves.to(1, { duration: 0.45 })));
  c.after('sweep-leaves', () => s.play(downLeaves.to(1, { duration: 0.45 })));
  c.on('sweep-storage', () => s.play(highlightStorage.to(1, { duration: 0.4 })));
  c.on('sweep-inclusive', () =>
    s.play(showInclusive.to(1, { duration: remainDuration(c, 'sweep-inclusive', 0.45) })),
  );
}
