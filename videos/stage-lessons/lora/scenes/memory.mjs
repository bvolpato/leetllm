// Scene 21: What has to fit on the GPU?: 32 GB VRAM stack (29 GB -> 34 GB OOM -> halve adapter prediction -> 33.5 GB still OOM -> 4-bit QLoRA).
import {
  COSMOS,
  MEM_HALF,
  MEM_LONG,
  MEM_SHORT,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function memory(s, c) {
  const showWeights = s.value(0);
  const showStack = s.value(0);
  const showShortTotal = s.value(0);
  const length2048 = s.value(0);
  const growAct = s.value(0);
  const showLongTotal = s.value(0);
  const askHalf = s.value(0);
  const revealHalf = s.value(0); // strictly withheld until after memory-half!
  const showQuant = s.value(0);

  const bgAura = aura(150, 0, 620, '#60a5fa20', '#ff6b8b1a');
  const title = heroTitle(['What Has to Fit', 'on the GPU?'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: '32 GB VRAM BUDGET · ACTIVATION SPIKE',
  });

  const barBaseY = 275;
  const pxPerGB = 12.6; // 34 GB = 428 px, 32 GB limit = 403 px
  const limitY = barBaseY - 32 * pxPerGB;

  const drawStackBar = (cx, inv, opts) => {
    const { showRest = 1, quantizeBase = 0, label, totalText, totalCol, highlight = false } = opts;
    const nodes = [];
    const barW = 240;
    let curY = barBaseY;
    const colorMap = {
      blue: COSMOS.blue,
      muted: '#697899',
      cyan: COSMOS.cyan,
      yellow: COSMOS.gold,
    };

    inv.parts.forEach((part, idx) => {
      const gb = idx === 0 && quantizeBase > 0.3 ? 4 : part.gb;
      const frac = idx === 0 ? 1 : showRest;
      const h = gb * pxPerGB * frac;
      if (h > 2) {
        const col = colorMap[part.color];
        nodes.push(
          rect(barW, h, {
            fill: col,
            stroke: '#070910',
            width: 2,
            radius: 4,
          })
            .at(cx, curY - h * 0.5)
            .glow(highlight && idx === 2 ? 10 : 5, col)
            .opacity(0.92),
        );
        if (h >= 34) {
          nodes.push(txt(`${gb} GB`, cx, curY - h * 0.5, 26, '#070910', 'mono'));
        }
        curY -= h;
      }
    });

    nodes.push(
      txt(label, cx, barBaseY + 42, 26, COSMOS.ink, 'mono'),
      txt(totalText, cx, barBaseY + 86, 28, totalCol, 'mono').glow(7, totalCol),
    );
    return nodes;
  };

  const live = guardedDynamic(1, () => {
    const sw = Math.max(0.35, showWeights.value);
    const ss = showStack.value;
    const sst = showShortTotal.value > 0.4;
    const l2k = length2048.value > 0.4;
    const ga = growAct.value;
    const slt = showLongTotal.value > 0.4;
    const ah = askHalf.value > 0.4;
    const rh = revealHalf.value > 0.5;
    const sq = showQuant.value > 0.4;

    const nodes = [
      // 32 GB GPU VRAM ceiling line spanning all bars
      line([-220, limitY], [840, limitY], { stroke: COSMOS.rose, width: 3.5, dash: [12, 8] }).glow(
        9,
        COSMOS.rose,
      ),
      txt('32 GB GPU LIMIT', 840, limitY - 62, 26, COSMOS.rose, 'mono', 'right').glow(
        6,
        COSMOS.rose,
      ),

      // Legend on left column
      glassCell(-555, -75, 580, 340, COSMOS.blue, { fill: '#10182d', glow: 6, opacity: sw }),
      txt('LIVE ALLOCATIONS', -815, -206, 26, COSMOS.muted, 'mono', 'left'),
      rect(26, 26, { fill: COSMOS.blue, radius: 4 }).at(-800, -142),
      txt(
        sq ? '4-bit QLoRA weights' : 'Frozen weights (16 GB)',
        -765,
        -142,
        28,
        COSMOS.blue,
        'sans',
        'left',
      ),
      rect(26, 26, { fill: '#697899', radius: 4 }).at(-800, -76),
      txt('Runtime buffers (4 GB)', -765, -76, 28, COSMOS.muted, 'sans', 'left'),
      rect(26, 26, { fill: COSMOS.cyan, radius: 4 }).at(-800, -10),
      txt(
        l2k ? 'Activations (8 -> 13 GB)' : 'Saved activations (8 GB)',
        -765,
        -10,
        28,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      rect(26, 26, { fill: COSMOS.gold, radius: 4 }).at(-800, 56),
      txt(
        ah ? 'Adapter state (1 -> 0.5 GB)' : 'Adapter state (1 GB)',
        -765,
        56,
        28,
        COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    // Bar 1: 1024 tokens (29 GB)
    nodes.push(
      ...drawStackBar(-50, MEM_SHORT, {
        showRest: Math.max(0.15, ss),
        label: '1024 tokens',
        totalText: sst ? `${MEM_SHORT.total} GB (fits)` : '16 + ...',
        totalCol: sst ? COSMOS.emerald : COSMOS.blue,
      }),
    );

    // Bar 2: 2048 tokens (34 GB OOM)
    if (l2k || ga > 0.05) {
      const interpAct = 8 + 5 * Math.max(0.2, ga);
      const bar2Inv = {
        ...MEM_LONG,
        parts: MEM_LONG.parts.map((pt, i) =>
          i === 2 ? { ...pt, gb: Number(interpAct.toFixed(1)) } : pt,
        ),
      };
      nodes.push(
        ...drawStackBar(295, bar2Inv, {
          showRest: 1,
          highlight: true,
          label: '2048 tokens',
          totalText: slt ? `${MEM_LONG.total} GB (+2 OOM)` : 'growing...',
          totalCol: slt ? COSMOS.rose : COSMOS.cyan,
        }),
      );
    }

    // Bar 3: Strictly withhold 33.5 GB bar height during prediction pause (ah && !rh)!
    if (ah && !rh && !sq) {
      const mysteryH = 32 * pxPerGB;
      nodes.push(
        rect(240, mysteryH, {
          fill: '#14192b',
          stroke: COSMOS.gold,
          width: 2.8,
          dash: [10, 8],
          radius: 8,
        })
          .at(640, barBaseY - mysteryH * 0.5)
          .glow(8, COSMOS.gold),
        txt('?', 640, barBaseY - mysteryH * 0.5, 86, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
        txt('Half adapter', 640, barBaseY + 42, 26, COSMOS.ink, 'mono'),
        txt('Fits 32 GB?', 640, barBaseY + 86, 28, COSMOS.gold, 'mono').glow(7, COSMOS.gold),
      );
    } else if (rh || sq) {
      nodes.push(
        ...drawStackBar(640, MEM_HALF, {
          showRest: 1,
          quantizeBase: sq ? 1 : 0,
          label: sq ? '4-bit base (QLoRA)' : 'Half adapter',
          totalText: sq ? 'shrinks blue base' : `${MEM_HALF.total} GB (+1.5 OOM)`,
          totalCol: sq ? COSMOS.emerald : COSMOS.rose,
        }),
      );
    }

    // Left bottom diagnostic verdict (strictly withholds 33.5 GB during prediction!)
    const verdictCol = sq ? COSMOS.emerald : rh ? COSMOS.rose : ah ? COSMOS.gold : COSMOS.cyan;
    const verdictHead = sq
      ? 'TARGET THE FROZEN WEIGHTS'
      : rh
        ? 'HALVING RANK STILL EXCEEDS 32 GB'
        : ah
          ? 'PREDICTION: HALF ADAPTER (0.5 GB)'
          : 'FREEZING BASE DROPS BASE ADAM STATE';
    const verdictLine = sq
      ? 'QLoRA packs weights in 4-bit NF4'
      : rh
        ? '33.5 GB -> checkpointing or smaller batch'
        : ah
          ? 'Will 16 + 4 + 13 + 0.5 fit under 32 GB?'
          : 'Activations still grow with token length';

    nodes.push(
      glassCell(-555, 252, 580, 178, verdictCol, { fill: '#12182b', glow: 9 }),
      txt(verdictHead, -815, 212, 26, verdictCol, 'mono', 'left'),
      txt(verdictLine, -815, 276, 26, COSMOS.ink, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('memory-weights', () => s.play(showWeights.to(1, { duration: 0.4 })));
  c.on('memory-stack', () => s.play(showStack.to(1, { duration: 0.55 })));
  c.on('memory-short', () => s.play(showShortTotal.to(1, { duration: 0.35 })));
  c.on('memory-length', () => s.play(length2048.to(1, { duration: 0.4 })));
  c.on('memory-grow', () => s.play(growAct.to(1, { duration: 0.65 })));
  c.on('memory-long', () => s.play(showLongTotal.to(1, { duration: 0.35 })));
  c.on('memory-question', () => s.play(askHalf.to(1, { duration: 0.45 })));
  c.after('memory-half', () => s.play(revealHalf.to(1, { duration: 0.35 })));
  c.on('memory-quantized', () =>
    s.play(showQuant.to(1, { duration: remainDuration(c, 'memory-quantized', 0.5) })),
  );
}
