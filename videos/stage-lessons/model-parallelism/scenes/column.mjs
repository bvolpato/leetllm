// Scene 05: Column shards produce complete output slices. Replicated x=[1,2] -> GPU0 W[:,0:2]->[1,4], GPU1 W[:,2:4]->[6,5] -> local ReLU.
import {
  COSMOS,
  ROLE,
  SHARDS,
  W,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function column(s, c) {
  const pSplit = s.value(0);
  const pSlices = s.value(0);
  const pHalf0 = s.value(0);
  const pConcat = s.value(0);
  const pAct = s.value(0);
  const pDist = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e61c');
  const title = heroTitle(['Column Shards Produce', 'Complete Output Slices'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gpu1,
    eyebrow: 'MEGATRON COLUMN-PARALLEL · ZERO SYNC BEFORE ACTIVATION',
  });

  const live = guardedDynamic(1, () => {
    const sp = pSplit.value > 0.3;
    const sl = pSlices.value > 0.5;
    const h0 = pHalf0.value > 0.5;
    const cc = pConcat.value;
    const ac = pAct.value > 0.5;
    const ds = pDist.value > 0.5;

    const nodes = [
      // Replicated input x
      glassCell(0, -218, 560, 72, COSMOS.gold, { fill: '#1e1a0e', glow: 8 }),
      txt('Replicated input   x = [1, 2]', 0, -218, 30, COSMOS.gold, 'mono'),
      glowingArc([-140, -180], [-430, -152], -8, { color: ROLE.gpu0, width: 3.2 }),
      glowingArc([140, -180], [430, -152], -8, { color: ROLE.gpu1, width: 3.2 }),
    ];

    const shardsMeta = [
      {
        rank: 0,
        cx: -430,
        col: ROLE.gpu0,
        cols: 'cols 1-2',
        mat: W.map((r) => r.slice(0, 2)),
        out: SHARDS.left,
      },
      {
        rank: 1,
        cx: 430,
        col: ROLE.gpu1,
        cols: 'cols 3-4',
        mat: W.map((r) => r.slice(2)),
        out: SHARDS.right,
      },
    ];

    shardsMeta.forEach((m) => {
      const hi = (m.rank === 0 && h0 && !ac) || ds;
      nodes.push(
        txt(`GPU ${m.rank}  ·  ${m.cols}`, m.cx, -120, 28, m.col, 'mono'),
        glassCell(m.cx, 12, 340, 200, hi ? COSMOS.gold : m.col, {
          fill: m.rank === 0 ? '#10213d' : '#0e2b38',
          glow: sp ? 9 : 5,
        }),
      );
      m.mat.forEach((row, r) => {
        row.forEach((val, j) => {
          const rx = m.cx - 64 + j * 128;
          const ry = -32 + r * 88;
          nodes.push(
            rect(98, 70, { fill: '#0b1426', stroke: m.col, width: 2.0, radius: 8 }).at(rx, ry),
            txt(String(val), rx, ry, 34, COSMOS.ink, 'mono'),
          );
        });
      });

      if (sl) {
        const outText = ac
          ? `ReLU([${m.out.join(', ')}]) = [${m.out.join(', ')}]`
          : `Y${m.rank} = [${m.out.join(', ')}]`;
        nodes.push(
          glassCell(m.cx, 185, 450, 78, ac ? ROLE.good : m.col, {
            fill: ac ? '#0d2924' : '#0e1d36',
            glow: 9,
          }),
          txt(outText, m.cx, 185, 30, ac ? ROLE.good : m.col, 'mono'),
        );
      }
    });

    // Bottom readout: concatenation vs distributed local activation
    if (ac) {
      nodes.push(
        glassCell(0, 325, 1180, 86, ROLE.good, { fill: '#0d2624', glow: 9 }),
        txt(
          ds
            ? 'Slices stay distributed · zero all-gather before next row-parallel layer'
            : 'Elementwise activation runs locally on each complete output slice',
          0,
          325,
          28,
          ROLE.good,
          'sans',
        ),
      );
    } else if (cc > 0.05) {
      const joined = [...SHARDS.left, ...SHARDS.right];
      const count = Math.min(4, Math.ceil(cc * 4));
      nodes.push(
        glassCell(0, 325, 920, 86, COSMOS.gold, { fill: '#1e1a0e', glow: 9 }),
        txt('Concatenated [Y0 | Y1] =', -200, 325, 32, COSMOS.gold, 'mono'),
      );
      joined.forEach((v, idx) => {
        const vx = 85 + idx * 82;
        if (idx < count) {
          nodes.push(
            rect(64, 56, {
              fill: '#10243a',
              stroke: idx < 2 ? ROLE.gpu0 : ROLE.gpu1,
              width: 2.2,
              radius: 8,
            }).at(vx, 325),
            txt(String(v), vx, 325, 32, idx < 2 ? ROLE.gpu0 : ROLE.gpu1, 'mono'),
          );
        }
      });
    } else {
      nodes.push(
        txt(
          'Every input coordinate already participated in each local output slice',
          0,
          325,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push();
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('column-split', () =>
    s.play(pSplit.to(1, { duration: remainDuration(c, 'column-split', 0.45) })),
  );
  c.on('complete-slices', () =>
    s.play(pSlices.to(1, { duration: remainDuration(c, 'complete-slices', 0.5) })),
  );
  c.on('local-halves', () =>
    s.play(pHalf0.to(1, { duration: remainDuration(c, 'local-halves', 0.4) })),
  );
  c.on('concatenate-slices', () =>
    s.play(pConcat.to(1, { duration: remainDuration(c, 'concatenate-slices', 0.9) })),
  );
  c.on('local-activation', () =>
    s.play(pAct.to(1, { duration: remainDuration(c, 'local-activation', 0.45) })),
  );
  c.on('distributed-slices', () =>
    s.play(pDist.to(1, { duration: remainDuration(c, 'distributed-slices', 0.4) })),
  );
}
