// Scene 21: Routing loss and compression loss can coexist (IVF-PQ & HNSW-PQ composition)
import {
  COSMOS,
  PQ_ORIG,
  PQ_RECON,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function indexComposition(s, c) {
  const showComp = s.value(0);
  const showExh = s.value(0);
  const showLife = s.value(0);
  const showMig = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Routing Loss and', 'Compression Loss Coexist'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'COMPOSITE INDEXES · IVF-PQ & HNSW-PQ · TWO DISTINCT ERROR SOURCES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sc = showComp.value;
    const se = showExh.value;
    const sl = showLife.value;
    const sm = showMig.value;

    const nodes = [
      // Top row: Stage 1 Routing + Stage 2 Compression -> Composite Index
      glassCell(-575, -108, 560, 152, sc > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sc > 0.3 ? 8 : 3,
      }),
      txt('1. WHERE TO LOOK (ROUTING)', -825, -150, 26, COSMOS.cyan, 'mono', 'left'),
      txt('IVF -> picks Voronoi lists (nprobe)', -825, -104, 26, COSMOS.ink, 'sans', 'left'),
      txt('HNSW -> follows graph links (ef)', -825, -66, 26, COSMOS.muted, 'sans', 'left'),

      glowingArc([-285, -108], [-150, -108], -18, { color: COSMOS.gold, width: 3.6 }),

      glassCell(140, -108, 560, 152, se > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: se > 0.3 ? 9 : 3,
      }),
      txt('2. HOW TO SCORE (COMPRESSION)', -110, -150, 26, COSMOS.amber, 'mono', 'left'),
      txt('PQ replaces exact floats with codes', -110, -104, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        `dim 0: ${PQ_ORIG[0]} -> stored as ${PQ_RECON[0].toFixed(1)}!`,
        -110,
        -66,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      glowingArc([430, -108], [520, -108], -18, { color: COSMOS.emerald, width: 3.6 }),

      glassCell(700, -108, 340, 152, COSMOS.gold, { fill: '#1e1b10', glow: 6 }),
      txt('COMPOSITE', 700, -142, 26, COSMOS.gold, 'mono'),
      txt('IVF-PQ', 700, -100, 30, COSMOS.ink, 'mono'),
      txt('HNSW-PQ', 700, -62, 30, COSMOS.ink, 'mono'),

      // Bottom left: Exhaustive scan of PQ codes still has quantization error
      glassCell(-455, 142, 790, 210, se > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: se > 0.3 ? '#28111a' : '#12182b',
        glow: se > 0.3 ? 9 : 2,
      }),
      txt('EVEN OPENING EVERY LIST LEAVES CODE ERROR', -825, 76, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        '· Setting nprobe = nlist removes routing loss only',
        -825,
        124,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Distances still use quantized codebook values',
        -825,
        166,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Optional rerank with retained FP32 originals fixes it',
        -825,
        208,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      // Bottom right: Lifecycle, freshness, and encoder migration
      glassCell(445, 142, 850, 210, sm > 0.3 || sl > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sm > 0.3 ? '#0e2824' : '#11182c',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt('OPERATIONAL LIFECYCLE & MIGRATION', 50, 76, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        '· Centroids, codebooks & links cost build RAM + time',
        50,
        124,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Measure update freshness when documents change',
        50,
        166,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Encoder / norm / metric change -> verify or rebuild!',
        50,
        208,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Benchmark recall, tail latency, RAM, and update freshness together on serving hardware',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('routing-compression', () => s.play(showComp.to(1, { duration: 0.45 })));
  c.on('exhaustive-codes', () => s.play(showExh.to(1, { duration: 0.45 })));
  c.on('index-lifecycle', () => s.play(showLife.to(1, { duration: 0.45 })));
  c.on('index-migration', () =>
    s.play(showMig.to(1, { duration: remainDuration(c, 'index-migration', 0.45) })),
  );
}
