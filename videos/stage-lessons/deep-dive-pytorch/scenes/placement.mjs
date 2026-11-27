// Scene 13: Where does each sum belong? Partial [1,2]+[10,20] -> sum [11,22] (strict hold!) -> All-Reduce (Replicate) vs Reduce-Scatter (Shard).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function placement(s, c) {
  const showCols = s.value(0);
  const revSum = s.value(0);
  const rev11 = s.value(0);
  const rev22 = s.value(0);
  const mode = s.value(0); // 0=partial, 1=all-reduce replicate, 2=reduce-scatter shard

  const bgAura = aura(0, 20, 640, '#ffd1661c', '#5ce1e618');
  const title = heroTitle(['Where Does Each', 'Sum Belong?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.trans,
    eyebrow: 'DTENSOR PLACEMENT · PARTIAL -> REPLICATE / SHARD',
  });

  const live = guardedDynamic(1, () => {
    const sc = showCols.value;
    const rs = revSum.value;
    const r11 = rev11.value;
    const r22 = rev22.value;
    const m = Math.round(mode.value);

    const nodes = [
      // Left: Sum-Partial inputs
      txt('SUM-PARTIAL INPUTS', -560, -225, 28, ROLE.trans, 'mono'),
      txt('col 0', -650, -172, 26, COSMOS.muted, 'mono'),
      txt('col 1', -470, -172, 26, COSMOS.muted, 'mono'),

      txt('Rank 0', -810, -96, 26, ROLE.orig, 'mono'),
      glassCell(-650, -96, 150, 92, ROLE.orig, { fill: '#0f1d36', glow: 6 }),
      txt('1', -650, -96, 40, COSMOS.ink, 'mono'),
      glassCell(-470, -96, 150, 92, sc > 0.5 ? ROLE.trans : ROLE.orig, {
        fill: '#0f1d36',
        glow: sc > 0.5 ? 9 : 4,
      }),
      txt('2', -470, -96, 40, COSMOS.ink, 'mono'),

      txt('Rank 1', -810, 32, 26, ROLE.copy, 'mono'),
      glassCell(-650, 32, 150, 92, ROLE.copy, { fill: '#0e222e', glow: 6 }),
      txt('10', -650, 32, 40, COSMOS.ink, 'mono'),
      glassCell(-470, 32, 150, 92, sc > 0.5 ? ROLE.trans : ROLE.copy, {
        fill: '#0e222e',
        glow: sc > 0.5 ? 9 : 4,
      }),
      txt('20', -470, 32, 40, COSMOS.ink, 'mono'),

      // Center: Reduced Logical Vector (strictly withheld before revSum!)
      txt('LOGICAL VECTOR', -60, -225, 28, COSMOS.gold, 'mono'),
      glassCell(-150, -32, 154, 118, rs > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: rs > 0.5 ? '#261e0e' : '#0a0f1c',
        glow: r11 > 0.5 ? 12 : rs > 0.5 ? 8 : 2,
      }),
      txt(rs > 0.5 ? '11' : '?', -150, -32, 44, rs > 0.5 ? COSMOS.gold : COSMOS.dim, 'mono'),
      glassCell(30, -32, 154, 118, rs > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: rs > 0.5 ? '#261e0e' : '#0a0f1c',
        glow: r22 > 0.5 ? 12 : rs > 0.5 ? 8 : 2,
      }),
      txt(rs > 0.5 ? '22' : '?', 30, -32, 44, rs > 0.5 ? COSMOS.gold : COSMOS.dim, 'mono'),

      line([-375, -32], [-242, -32], { stroke: COSMOS.gold, width: 3.0 }),
      line([122, -32], [250, -32], { stroke: m >= 1 ? ROLE.good : COSMOS.dim, width: 3.0 }),

      // Right: Destination Placement (All-Reduce -> Replicate OR Reduce-Scatter -> Shard)
      txt(
        m === 2
          ? 'REDUCE-SCATTER -> Shard(0)'
          : m === 1
            ? 'ALL-REDUCE -> Replicate()'
            : 'DESTINATION PLACEMENT',
        560,
        -225,
        28,
        m === 2 ? ROLE.copy : m === 1 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
    ];

    if (m === 1) {
      nodes.push(
        glassCell(560, -96, 460, 92, ROLE.good, { fill: '#0d2924', glow: 10 }),
        txt('Rank 0:  [ 11,  22 ]', 560, -96, 32, ROLE.good, 'mono'),
        glassCell(560, 32, 460, 92, ROLE.good, { fill: '#0d2924', glow: 10 }),
        txt('Rank 1:  [ 11,  22 ]', 560, 32, 32, ROLE.good, 'mono'),
      );
    } else if (m === 2) {
      nodes.push(
        glassCell(560, -96, 510, 92, ROLE.copy, { fill: '#0d222e', glow: 10 }),
        txt('Rank 0: [11] (slice 0)', 560, -96, 30, ROLE.copy, 'mono'),
        glassCell(560, 32, 510, 92, ROLE.copy, { fill: '#0d222e', glow: 10 }),
        txt('Rank 1: [22] (slice 1)', 560, 32, 30, ROLE.copy, 'mono'),
      );
    } else {
      nodes.push(
        glassCell(560, -96, 460, 92, COSMOS.dim, { fill: '#0a0f1c', glow: 0 }),
        txt('Rank 0: awaiting collective', 560, -96, 26, COSMOS.dim, 'mono'),
        glassCell(560, 32, 460, 92, COSMOS.dim, { fill: '#0a0f1c', glow: 0 }),
        txt('Rank 1: awaiting collective', 560, 32, 26, COSMOS.dim, 'mono'),
      );
    }

    nodes.push(
      txt(
        m === 2
          ? 'Same logical vector [11, 22] · next operator dictates Replicate vs Shard placement'
          : m === 1
            ? 'Every rank in the process group must enter the same collective in the same order'
            : rs > 0.5
              ? 'Column sums give [11, 22]'
              : 'Predict: what complete 2-element vector do [1, 2] and [10, 20] represent?',
        0,
        305,
        28,
        rs < 0.5 ? COSMOS.gold : ROLE.good,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('partial-columns', () =>
    s.play(showCols.to(1, { duration: remainDuration(c, 'partial-columns', 0.35) })),
  );
  c.after('sum-columns', () =>
    s.play(revSum.to(1, { duration: remainDuration(c, 'sum-columns', 0.4) })),
  );
  c.on('first-sum', () => s.play(rev11.to(1, { duration: 0.3 })));
  c.on('second-sum', () => s.play(rev22.to(1, { duration: 0.3 })));
  c.after('replicate-cells', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'replicate-cells', 0.45) })),
  );
  c.after('scatter-cells', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'scatter-cells', 0.45) })),
  );
}
