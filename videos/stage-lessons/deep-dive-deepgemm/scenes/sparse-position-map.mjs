// Scene 17: Resolve compressed columns through their sparse blocks.
// Block list [3, 7], width 4, start 0: col 5 -> block idx 1 (block ID 7), offset 1 -> 7*4 + 1 = token 29.
import {
  COSMOS,
  ROLE,
  SPARSE_POS,
  aura,
  buildIndexerTower3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function sparsePositionMap(s, c) {
  const phase = s.value(0);
  const maskVal = s.value(0.2);
  const step = s.value(0); // 1=width formula, 2=prefix rule, 3=blocks [3,7], 4=col 5 -> blk 1 off 1, 5=7*4+1=29, 6=Oct 8/16

  const bgAura = aura(445, 20, 520, '#6ee7b720', '#5ce1e61c');
  const { view: idx3d } = buildIndexerTower3d(maskVal, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Resolve Sparse', 'Block Positions'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'SPARSE INDEXER · BLOCK TABLE MAP',
    subtitle: 'Translate compressed column -> block ID -> cache token',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D SPARSE BLOCK TRANSLATION', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Sparse width = max_sparse_blocks × sparse_block_kv', 455, 435, 26, COSMOS.muted, 'mono'),
    ];

    // Sparse block list [3, 7], width = 4 (columns 0..3 -> block 3; columns 4..7 -> block 7)
    nodes.push(
      txt(
        'BLOCK LIST = [3, 7]   ·   WIDTH = 4 TOKENS / BLOCK',
        -860,
        -170,
        26,
        ROLE.a,
        'mono',
        'left',
      ),
      glassCell(-665, -86, 385, 108, st >= 2.6 ? ROLE.a : COSMOS.dim, {
        fill: '#101d38',
        glow: st >= 2.6 ? 6 : 0,
      }),
      txt('List[0] -> Block ID 3', -665, -112, 26, ROLE.a, 'mono'),
      txt('cols 0..3 -> tok 12..15', -665, -66, 26, COSMOS.muted, 'mono'),

      glassCell(-245, -86, 405, 108, st >= 3.6 ? ROLE.gold : st >= 2.6 ? ROLE.c : COSMOS.dim, {
        fill: st >= 3.6 ? '#241e10' : '#0e2030',
        glow: st >= 3.6 ? 10 : 5,
      }),
      txt('List[1] -> Block ID 7', -245, -112, 26, st >= 3.6 ? ROLE.gold : ROLE.c, 'mono'),
      txt('cols 4..7 -> tok 28..31', -245, -66, 26, COSMOS.ink, 'mono'),
    );

    // Step-by-step resolution chain for column 5
    const chain = [
      { label: 'COL 5', sub: '5 / 4 = blk 1', col: ROLE.gold, lit: st >= 3.6, x: -735 },
      {
        label: `BLOCK ${SPARSE_POS.block}`,
        sub: `offset = ${SPARSE_POS.offset}`,
        col: ROLE.scale,
        lit: st >= 3.6,
        x: -460,
      },
      {
        label: `TOKEN ${SPARSE_POS.token}`,
        sub: '7×4 + 1 = 29',
        col: ROLE.good,
        lit: st >= 4.6,
        x: -185,
      },
    ];
    chain.forEach((item, idx) => {
      nodes.push(
        glassCell(item.x, 86, 240, 110, item.lit ? item.col : COSMOS.dim, {
          fill: item.lit ? '#0f2230' : '#0d1424',
          glow: item.lit ? 9 : 0,
        }),
        txt(item.label, item.x, 62, 30, item.lit ? item.col : COSMOS.muted, 'mono'),
        txt(item.sub, item.x, 108, 26, COSMOS.ink, 'mono'),
      );
      if (idx < 2) {
        nodes.push(
          line([item.x + 122, 86], [item.x + 150, 86], {
            stroke: item.lit ? item.col : COSMOS.dim,
            width: 3,
          }),
        );
      }
    });

    // Contract rules strip
    const ruleText =
      st >= 5.6
        ? 'Oct CUDA: sparse block width 8 or 16 + range offset'
        : st >= 4.6
          ? `Resolved: col 5 -> block ${SPARSE_POS.block} -> cache token ${SPARSE_POS.token}`
          : st >= 1.6
            ? 'Valid block prefix: unique, strictly increasing, in range'
            : 'Never assume dense col-to-token identity on sparse scores';

    nodes.push(
      glassCell(-460, 250, 800, 88, st >= 4.6 ? ROLE.good : ROLE.scale, {
        fill: '#0e1d2c',
        glow: 8,
      }),
      txt(ruleText, -460, 250, 26, st >= 4.6 ? ROLE.good : ROLE.scale, 'sans'),
      txt(
        'Check GPU sparse scores against reference map including unused mask',
        -860,
        378,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, idx3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, idx3d, { theta: -0.2, phi: 0.94 });

  c.on('sp-width', () => s.play(step.to(1, { duration: remainDuration(c, 'sp-width', 0.45) })));
  c.on('sp-prefix', () => s.play(step.to(2, { duration: remainDuration(c, 'sp-prefix', 0.45) })));
  c.on('sp-list', () => s.play(step.to(3, { duration: remainDuration(c, 'sp-list', 0.45) })));
  c.on('sp-col5', () => {
    const dur = remainDuration(c, 'sp-col5', 0.45);
    s.play(step.to(4, { duration: dur }));
    s.play(maskVal.to(0.7, { duration: dur }));
  });
  c.after('sp-tok29', () => {
    const dur = remainAfterDuration(c, 'sp-tok29', 0.35);
    s.play(step.to(5, { duration: dur }));
    s.play(maskVal.to(1, { duration: dur }));
  });
  c.on('sp-cuda', () => s.play(step.to(6, { duration: remainDuration(c, 'sp-cuda', 0.45) })));
}
