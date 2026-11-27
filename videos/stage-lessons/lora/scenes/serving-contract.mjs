// Scene 32: One shared base can serve different corrections: 50 merged (700 GB) vs 1 shared + 50 adapters (20.4 GB, 34.3x) -> Punica SGMV + S-LoRA unified paging.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  SERVING_FOOTPRINT,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function servingContract(s, c) {
  const showDisk = s.value(1);
  const show50 = s.value(0);
  const show700 = s.value(0);
  const show204 = s.value(0);
  const showRatio = s.value(0);
  const showEngine = s.value(0);
  const showSgmv = s.value(0);
  const showPool = s.value(0);

  const bgAura = aura(0, 10, 620, '#60a5fa1e', '#ffd16618');
  const title = heroTitle(['One Shared Base,', 'Many Adapters'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'MULTI-TENANT SERVING · PUNICA & S-LORA',
  });

  // Part 1: 50 merged checkpoints (700 GB) vs 1 shared base + 50 adapters (20.4 GB)
  const partDisk = guardedDynamic(showDisk, (a) => {
    const s700 = show700.value;
    const s204 = show204.value;
    const sRat = showRatio.value;

    const nodes = [
      txt(
        'CHECKPOINT STORAGE ON DISK (DECIMAL GB)',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),

      // Left: 50 complete 14 GB models
      txt('50 MERGED 14 GB CHECKPOINTS', -450, -205, 28, COSMOS.blue, 'mono').opacity(a),
      txt(
        s700 > 0.3 ? `${SERVING_FOOTPRINT.mergedTotalGB} GB` : '50 × 14 GB = ?',
        -450,
        215,
        44,
        COSMOS.blue,
        'mono',
      )
        .glow(s700 > 0.3 ? 8 : 0, COSMOS.blue)
        .opacity(a),

      // Right: 1 shared 14 GB base + 50 tiny 128 MB adapters
      txt('1 SHARED BASE + 50 ADAPTERS (128 MB)', 440, -205, 28, COSMOS.gold, 'mono').opacity(a),
      glassCell(440, -125, 680, 74, COSMOS.blue, { fill: '#152b54', glow: 8, opacity: a }),
      txt('One 14 GB frozen base', 440, -125, 28, COSMOS.blue, 'mono').opacity(a),
      txt(
        s204 > 0.3 ? `14 + 6.4 = ${SERVING_FOOTPRINT.sharedTotalGB} GB` : '14 + 50 × 0.128 GB = ?',
        440,
        215,
        42,
        COSMOS.emerald,
        'mono',
      )
        .glow(s204 > 0.3 ? 8 : 0, COSMOS.emerald)
        .opacity(a),
    ];

    // 50 blue merged squares (10x5) on left + 50 tiny gold adapter chips (10x5) on right
    for (let i = 0; i < 50; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      nodes.push(
        rect(54, 48, { fill: '#1e3c78', stroke: COSMOS.blue, width: 1.5, radius: 5 })
          .at(-765 + col * 69, -130 + row * 64)
          .opacity(Math.max(0.55, show50.value) * a),
        rect(44, 24, { fill: '#3b2e10', stroke: COSMOS.gold, width: 1.4, radius: 4 })
          .at(125 + col * 69, -45 + row * 40)
          .opacity(Math.max(0.55, show50.value) * a),
      );
    }

    nodes.push(
      glassCell(0, 355, 1660, 122, sRat > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#10182d',
        glow: sRat > 0.3 ? 10 : 3,
        opacity: a,
      }),
      txt(
        sRat > 0.3
          ? `700 / 20.4 ≈ ${SERVING_FOOTPRINT.ratio.toFixed(1)}× disk space saved · merge only your top hot adapter`
          : 'Count disk, host RAM, device weights, KV cache, and runtime buffers separately',
        0,
        355,
        28,
        sRat > 0.3 ? COSMOS.emerald : COSMOS.ink,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: Punica SGMV batched heterogeneous serving + S-LoRA unified page pool
  const partEngine = guardedDynamic(showEngine, (a) => {
    const sg = showSgmv.value;
    const pl = showPool.value;

    const reqs = [
      { id: 'Req 0', x: '[2, 1]', adapter: 'Adapter 1', col: COSMOS.gold },
      { id: 'Req 1', x: '[1, 2]', adapter: 'Adapter 2', col: COSMOS.emerald },
      { id: 'Req 2', x: '[3, 1]', adapter: 'Adapter 1', col: COSMOS.gold },
      { id: 'Req 3', x: '[1, 1]', adapter: 'Adapter 3', col: COSMOS.violet },
    ];

    const nodes = [
      txt(
        'PUNICA SGMV · HETEROGENEOUS REQUEST BATCH',
        855,
        -380,
        26,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),
      // Shared base GEMM slab across all 4 requests
      glassCell(-160, -20, 320, 385, COSMOS.blue, { fill: '#12244a', glow: 10, opacity: a }),
      txt('SHARED BASE', -160, -70, 28, COSMOS.blue, 'mono').opacity(a),
      txt('X · W_0ᵀ', -160, -10, 40, COSMOS.ink, 'mono').opacity(a),
      txt('1 batched GEMM', -160, 52, 26, COSMOS.muted, 'sans').opacity(a),
    ];

    reqs.forEach((req, i) => {
      const y = -155 + i * 90;
      nodes.push(
        txt(`${req.id}  x=${req.x}`, -840, y, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
        arrow([-485, y], [-340, y], { stroke: COSMOS.cyan, width: 3.5, tip: 11 }).opacity(a),
        arrow([20, y], [115, y], { stroke: req.col, width: 3.5, tip: 11 }).opacity(
          Math.max(0.3, sg) * a,
        ),
        glassCell(465, y, 660, 68, req.col, {
          fill: '#131b30',
          glow: sg > 0.3 ? 8 : 2,
          opacity: Math.max(0.3, sg) * a,
        }),
        txt(`+ sᵢ Xᵢ Aᵢᵀ Bᵢᵀ   (${req.adapter})`, 465, y, 28, req.col, 'mono').opacity(
          Math.max(0.3, sg) * a,
        ),
      );
    });

    // Bottom: S-LoRA unified paged pool (KV blocks + adapter blocks interleaved)
    nodes.push(
      glassCell(0, 315, 1680, 195, pl > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#10182d',
        glow: pl > 0.2 ? 10 : 3,
        opacity: a,
      }),
      txt(
        'S-LORA UNIFIED PAGING: COMMON ENGINE-MANAGED GPU POOL (KV + ADAPTERS)',
        -800,
        254,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    );

    for (let i = 0; i < 14; i++) {
      const isKV = i % 3 === 0;
      const col = isKV ? COSMOS.blue : COSMOS.gold;
      const px = -730 + i * 112;
      nodes.push(
        rect(94, 54, { fill: isKV ? '#162d59' : '#2f2410', stroke: col, width: 2, radius: 6 })
          .at(px, 322)
          .opacity(Math.max(0.35, pl) * a),
        txt(isKV ? 'KV' : 'A/B', px, 322, 26, col, 'mono').opacity(Math.max(0.35, pl) * a),
      );
    }

    nodes.push(
      glowDot(-795, 386, { radius: 6, color: COSMOS.emerald, opacity: a }),
      txt(
        'Serving paging is distinct from CUDA managed-memory optimizer paging',
        -765,
        386,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, partDisk, partEngine);

  c.on('serving-contract-1', () => s.play(showDisk.to(1, { duration: 0.2 })));
  c.on('serving-contract-2', () => s.play(show50.to(1, { duration: 0.45 })));
  c.on('serving-storage', () => s.play(show700.to(1, { duration: 0.4 })));
  c.on('serving-shared', () => s.play(show204.to(1, { duration: 0.4 })));
  c.on('serving-ratio', () => s.play(showRatio.to(1, { duration: 0.4 })));
  c.on('serving-contract-3', () => {
    s.play(
      par(showDisk.to(0, { duration: 0.16 }), delay(showEngine.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('serving-segments', () => s.play(showSgmv.to(1, { duration: 0.45 })));
  c.on('serving-pool', () =>
    s.play(showPool.to(1, { duration: remainDuration(c, 'serving-pool', 0.45) })),
  );
}
