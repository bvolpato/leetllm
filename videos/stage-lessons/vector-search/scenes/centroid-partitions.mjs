// Scene 6: Filing the six passages (IVF coarse centroids c0=(2,5), c1=(8,5), x=5 Voronoi wall splitting A and B)
import {
  CENTROIDS_RANKED,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  postingList,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function centroidPartitions(s, c) {
  const showCenters = s.value(0);
  const showFile = s.value(0);
  const showBorder = s.value(0);
  const showRank = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Filing the', 'Six Passages'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'IVF COARSE PARTITIONS · POSTING LISTS & THE X = 5 VORONOI WALL',
  });

  const leftList = postingList(0);
  const rightList = postingList(1);

  const live = guardedDynamic(s.value(1), () => {
    const sc = showCenters.value;
    const sf = showFile.value;
    const sb = showBorder.value;
    const sr = showRank.value;

    const mapX = (vx) => -820 + vx * 84;
    const mapY = (vy) => 225 - vy * 36;

    const nodes = [
      // Left: Voronoi plane with c0=(2,5), c1=(8,5), wall x=5 splitting A (4.6) and B (5.1)
      glassCell(-425, 22, 860, 446, sb > 0.3 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#0e182e',
        glow: 4,
      }),
      txt('VORONOI PARTITION: WALL AT x = 5.0', -825, -166, 26, COSMOS.gold, 'mono', 'left'),

      // x = 5 boundary line
      line([mapX(5), -130], [mapX(5), 185], {
        stroke: sb > 0.3 ? COSMOS.gold : COSMOS.muted,
        width: sb > 0.3 ? 4.0 : 2.2,
        dash: [10, 8],
      }).glow(sb > 0.3 ? 9 : 0, COSMOS.gold),
      txt('x = 5', mapX(5), 210, 26, COSMOS.gold, 'mono'),

      // Centroids
      glowDot(mapX(2), mapY(5), { radius: sc > 0.3 ? 13 : 10, color: COSMOS.cyan }),
      txt('c0 (2,5)', mapX(2) - 10, mapY(5) - 34, 26, COSMOS.cyan, 'mono'),
      glowDot(mapX(8), mapY(5), { radius: sc > 0.3 ? 13 : 10, color: COSMOS.rose }),
      txt('c1 (8,5)', mapX(8) + 10, mapY(5) + 46, 26, COSMOS.rose, 'mono'),

      // Passages A, B, C, D, E, F
      glowDot(mapX(4.6), mapY(5.2), { radius: 9, color: COSMOS.cyan }),
      txt('A', mapX(4.6) - 24, mapY(5.2) - 20, 26, COSMOS.cyan, 'mono'),
      glowDot(mapX(5.1), mapY(5.0), { radius: 9, color: COSMOS.rose }),
      txt('B', mapX(5.1) + 26, mapY(5.0) - 20, 26, COSMOS.rose, 'mono'),
      glowDot(mapX(3.7), mapY(4.8), { radius: 8, color: COSMOS.cyan }),
      txt('C', mapX(3.7), mapY(4.8) + 32, 26, COSMOS.cyan, 'mono'),
      glowDot(mapX(7.8), mapY(5.5), { radius: 8, color: COSMOS.rose }),
      txt('D', mapX(7.8) - 22, mapY(5.5) - 28, 26, COSMOS.rose, 'mono'),
      glowDot(mapX(1.4), mapY(2.0), { radius: 8, color: COSMOS.cyan }),
      txt('E', mapX(1.4) + 26, mapY(2.0), 26, COSMOS.cyan, 'mono'),
      glowDot(mapX(8.8), mapY(8.0), { radius: 8, color: COSMOS.rose }),
      txt('F', mapX(8.8) - 26, mapY(8.0), 26, COSMOS.rose, 'mono'),

      // Query diamond
      glowDot(mapX(4.8), mapY(5.0), { radius: 10, color: COSMOS.gold }),
      txt('Q', mapX(4.8) - 10, mapY(5.0) + 42, 26, COSMOS.gold, 'mono'),

      // Right: Posting lists + Coarse centroid ranking
      txt('POSTING LISTS & COARSE RANKING', 100, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(495, -96, 770, 140, sf > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sf > 0.3 ? 8 : 2,
      }),
      txt(
        `LEFT LIST (c0):   [ ${leftList.map((r) => r.id).join(',  ')} ]`,
        140,
        -132,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        `d^2(Q, c0) = ${CENTROIDS_RANKED[0].d2.toFixed(2)}  -> RANK #1 (OPENED FIRST)`,
        140,
        -84,
        26,
        sr > 0.3 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(495, 76, 770, 140, sf > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sf > 0.3 ? 8 : 2,
      }),
      txt(
        `RIGHT LIST (c1):  [ ${rightList.map((r) => r.id).join(',  ')} ]`,
        140,
        40,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        `d^2(Q, c1) = ${CENTROIDS_RANKED[1].d2.toFixed(2)} -> RANK #2 (CLOSED)`,
        140,
        88,
        26,
        sr > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
        'left',
      ),

      glassCell(495, 224, 770, 114, sr > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#12182d',
        glow: sr > 0.3 ? 8 : 2,
      }),
      txt('IVF Flat reads raw coords inside open lists', 140, 200, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'If embeddings drift, retrain centers & refile all vectors',
        140,
        240,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Two almost touching vectors (A at 4.6, B at 5.1) can land on opposite sides of a Voronoi wall',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('train-centers', () => s.play(showCenters.to(1, { duration: 0.4 })));
  c.on('file-passages', () => s.play(showFile.to(1, { duration: 0.4 })));
  c.on('see-border', () => s.play(showBorder.to(1, { duration: 0.4 })));
  c.on('rank-centers', () =>
    s.play(showRank.to(1, { duration: remainDuration(c, 'rank-centers', 0.45) })),
  );
}
