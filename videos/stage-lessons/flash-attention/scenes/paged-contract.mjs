// Scene 26: Follow logical cache positions through a block table: 3D PagedAttention block pool + glowing arcs.
import {
  COSMOS,
  aura,
  bezier3d,
  box3d,
  cinematic3d,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  points3d,
  rect,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

const PAGE_MAP = [6, 1, 7, 3, 0, 5, 2, 4];

export default function pagedContract(s, c) {
  const phase = s.value(0);
  const showMap = s.value(0.5);
  const showPageRule = s.value(0);
  const showBackends = s.value(0);

  const bgAura = aura(280, 20, 560, '#5ce1e624', '#ffd16618');
  const title = heroTitle(['Paged KV Pool', '& Read Tiles'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'ALLOCATION VS ARITHMETIC CONTRACT',
  });

  // Orbiting 3D PagedAttention logical-to-physical block table
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 16.4,
    unit: 108,
    focus: [0, 0, 1.1],
  }).at(310, 35);

  view3d.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#24355a',
      width: 1.1,
      opacity: 0.48,
    }),
  );

  // 8 physical blocks in 2x4 grid at z = 0.05
  const physCenters = [];
  for (let i = 0; i < 8; i++) {
    const r = Math.floor(i / 4);
    const col = i % 4;
    const x = -3.1 + col * 1.65;
    const y = -1.4 + r * 1.75;
    const cHex = i % 2 === 0 ? COSMOS.cyan : COSMOS.violet;
    view3d.add(...box3d(x, y, 0.05, 1.25, 1.25, 0.78, cHex, cHex, 0.74));
    physCenters.push([x + 0.625, y + 0.625, 0.85]);
  }

  // 8 logical 16-token pages in upper tier at z = 2.65 + glowing 3D pointer arcs
  const arcEvaluators = [];
  for (let i = 0; i < 8; i++) {
    const x = -3.2 + i * 0.88;
    const dst = physCenters[PAGE_MAP[i]];
    const col = i % 2 === 0 ? COSMOS.gold : COSMOS.cyan;
    view3d.add(...box3d(x, -0.35, 2.6, 0.64, 0.7, 0.34, col, col, 0.86));
    const arc = bezier3d([x + 0.32, 0, 2.58], dst, 0.45, col, 2.6);
    view3d.add(arc.node);
    arcEvaluators.push(arc.evalAt);
  }

  // Streaming photon packets racing down the logical->physical page-table arcs
  const streamPhotons = points3d(
    () => {
      const t = phase.value * 0.35;
      return arcEvaluators.map((fn, i) => fn((t + i * 0.13) % 1));
    },
    {
      colorAt: (i) => (i % 2 === 0 ? COSMOS.gold : '#ffffff'),
      radius: 6.2,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );
  view3d.add(streamPhotons);

  const live = guardedDynamic(1, () => {
    const sm = showMap.value;
    const pr = showPageRule.value;
    const bk = showBackends.value;

    const nodes = [
      txt(
        '↑  8 LOGICAL 16-TOKEN PAGES (128-TOKEN READ TILE)',
        310,
        -370,
        26,
        COSMOS.gold,
        'mono',
      ).glow(5, COSMOS.gold),
      txt(
        '↓  SCATTERED PHYSICAL KV PAGES [6, 1, 7, 3, 0, 5, 2, 4]',
        310,
        412,
        26,
        COSMOS.cyan,
        'mono',
      ).glow(5, COSMOS.cyan),

      // Pure floating cinema metrics + mini 8-page read-tile strip (zero boxed prose cards)
      rule(-855, -210, -295, -210, '#2a385c', 1.8).opacity(sm),
      txt(
        '128-TOKEN READ TILE = 8 × 16 PAGES',
        -855,
        -168,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(sm),
      ...Array.from({ length: 8 }, (_, k) =>
        rect(56, 26, {
          fill: k % 2 === 0 ? COSMOS.gold : COSMOS.cyan,
          stroke: '#ffffff',
          width: 1,
          radius: 4,
        })
          .at(-827 + k * 66, -112)
          .glow(6, k % 2 === 0 ? COSMOS.gold : COSMOS.cyan)
          .opacity(0.88 * sm),
      ),
      txt(
        'Allocator picks pages · online softmax merges',
        -855,
        -52,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity(sm),
      rule(-855, 8, -295, 8, '#2a385c', 1.8).opacity(Math.max(0.35, pr)),
    ];

    if (pr > 0.02) {
      nodes.push(
        txt('PINNED FA CACHE API', -855, 58, 26, COSMOS.muted, 'mono', 'left').opacity(pr),
        txt('page_size % 256 = 0', -855, 118, 42, COSMOS.gold, 'mono', 'left')
          .glow(8, COSMOS.gold)
          .opacity(pr),
        txt('Forward pass only (inference)', -855, 174, 26, COSMOS.muted, 'sans', 'left').opacity(
          pr,
        ),
      );
    }

    if (bk > 0.02) {
      nodes.push(
        rule(-855, 224, -295, 224, '#2a385c', 1.8).opacity(bk),
        txt('OTHER BACKENDS', -855, 268, 26, COSMOS.violet, 'mono', 'left').opacity(bk),
        txt('FlashInfer · vLLM · GQA / MQA', -855, 318, 28, COSMOS.ink, 'mono', 'left').opacity(bk),
        txt(
          'Match layout, valid length & page rules',
          -855,
          366,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(bk),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  c.on('paged-contract-beat-1', () => s.play(showMap.to(1, { duration: 0.45 })));
  c.on('paged-contract-beat-2', () => s.play(showPageRule.to(0.6, { duration: 0.35 })));
  c.on('fa-page-map', () => s.play(showPageRule.to(1, { duration: 0.45 })));
  c.on('paged-contract-beat-3', () =>
    s.play(showBackends.to(1, { duration: remainDuration(c, 'paged-contract-beat-3', 0.45) })),
  );
}
