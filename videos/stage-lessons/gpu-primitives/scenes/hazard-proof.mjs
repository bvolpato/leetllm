// Scene 19: Checking a GPU scan. Shared-memory hazards (RAW/WAR/WAW), Compute Sanitizer tools, missing +7 offset check.
import {
  ARTICLE_INPUT,
  COSMOS,
  aura,
  exclusive,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

const BLOCK_B_LOCAL = exclusive(ARTICLE_INPUT.slice(4)); // [0, 5, -4, -2]
const BLOCK_B_EXPECTED = exclusive(ARTICLE_INPUT).slice(4); // [7, 12, 3, 5]

export default function hazardProof(s, c) {
  const showHazards = s.value(1);
  const highlightWaw = s.value(0);
  const highlightSafe = s.value(0);

  const showTools = s.value(0);

  const showEvidence = s.value(0);
  const applyOffset = s.value(0);
  const showCpuNote = s.value(0);

  const bgAura = aura(0, 15, 620, '#ff6b8b1e', '#5ce1e61a');

  // Beat 0: Shared slot s hazard matrix (RAW, WAR, WAW vs safe Read+Read)
  const hazardsView = guardedDynamic(showHazards, (a) => {
    const waw = highlightWaw.value;
    const saf = highlightSafe.value;

    const rows = [
      {
        left: 'Producer write',
        right: 'Consumer read',
        tag: 'RAW HAZARD',
        col: COSMOS.rose,
        y: -155,
        safe: false,
      },
      {
        left: 'Consumer read',
        right: 'Next write',
        tag: 'WAR HAZARD',
        col: COSMOS.gold,
        y: -25,
        safe: false,
      },
      {
        left: 'Writer A',
        right: 'Writer B',
        tag: 'WAW HAZARD',
        col: COSMOS.rose,
        y: 105,
        safe: false,
      },
      {
        left: 'Reader A',
        right: 'Reader B',
        tag: 'SAFE (2 READS)',
        col: COSMOS.emerald,
        y: 235,
        safe: true,
      },
    ];

    const nodes = [
      heroTitle(['Shared-Memory', 'Ordering Hazards'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.rose,
        eyebrow: 'TWO THREADS · ONE SHARED SLOT s',
      }).opacity(a),
    ];

    rows.forEach((row, i) => {
      const emph = (i === 2 && waw > 0.5) || (i === 3 && saf > 0.5);
      const col = row.col;
      nodes.push(
        glassCell(-550, row.y, 350, 78, col, { fill: '#10182b', glow: emph ? 11 : 5, opacity: a }),
        txt(row.left, -550, row.y, 28, col, 'mono').opacity(a),

        glassCell(-70, row.y, 130, 78, COSMOS.cyan, { fill: '#0e2034', glow: 6, opacity: a }),
        txt('s', -70, row.y, 36, COSMOS.cyan, 'mono').opacity(a),

        glassCell(350, row.y, 350, 78, col, { fill: '#10182b', glow: emph ? 11 : 5, opacity: a }),
        txt(row.right, 350, row.y, 28, col, 'mono').opacity(a),

        glowingArc([-360, row.y], [-145, row.y], 0, {
          color: col,
          width: 3.4,
          opacity: a,
          core: false,
        }),
        glowingArc([5, row.y], [160, row.y], 0, {
          color: col,
          width: 3.4,
          opacity: a,
          core: false,
        }),

        txt(row.tag, 705, row.y, 27, col, 'mono')
          .glow(emph ? 7 : 0, col)
          .opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 385, 1520, 78, saf > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#101829',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Two unordered reads coexist · cross-warp writes require a block-wide handoff (__syncthreads)',
        0,
        385,
        28,
        saf > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 1: Compute Sanitizer diagnostic trio
  const toolsView = guardedDynamic(showTools, (a) => {
    const tools = [
      {
        name: 'memcheck',
        scope: 'Out-of-bounds read/write or misaligned address',
        col: COSMOS.blue,
        y: -135,
      },
      {
        name: 'racecheck',
        scope: 'Conflicting unordered accesses to shared memory',
        col: COSMOS.gold,
        y: 35,
      },
      {
        name: 'synccheck',
        scope: 'Divergent threads skipping a block barrier',
        col: COSMOS.rose,
        y: 205,
      },
    ];

    const nodes = [
      heroTitle(['Compute Sanitizer', 'Diagnostic Trio'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'FAIL FAST WITH NON-ZERO EXIT CODES',
      }).opacity(a),
    ];

    tools.forEach((tool, i) => {
      nodes.push(
        glassCell(-510, tool.y, 410, 108, tool.col, { fill: '#101b33', glow: 9, opacity: a }),
        txt(tool.name, -510, tool.y, 38, tool.col, 'mono').glow(6, tool.col).opacity(a),

        glowingArc([-290, tool.y], [-95, tool.y], 0, {
          color: tool.col,
          width: 4,
          opacity: a,
          core: false,
        }),

        glassCell(360, tool.y, 880, 108, COSMOS.cyan, { fill: '#0e1d30', glow: 6, opacity: a }),
        txt(tool.scope, 360, tool.y, 30, COSMOS.ink, 'sans').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 380, 1520, 80, COSMOS.emerald, { fill: '#0c2422', glow: 8, opacity: a }),
      txt(
        'Save exact source & odd input shapes (e.g. 4,099) so sanitizer findings stay traceable',
        0,
        380,
        28,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Missing Block B +7 offset vs CPU model barrier assumption
  const evidenceView = guardedDynamic(showEvidence, (a) => {
    const off = applyOffset.value;
    const cpu = showCpuNote.value;
    const xs = [-435, -145, 145, 435];

    const nodes = [
      heroTitle(['Numerical Check vs', 'Synchronization Check'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.gold,
        eyebrow: 'BLOCK B STARTS AT 0 INSTEAD OF 7',
      }).opacity(a),

      txt('LOCAL BLOCK B', -845, -125, 26, COSMOS.rose, 'mono', 'left').opacity(a),
      txt('SERIAL REFERENCE', -845, 135, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
    ];

    BLOCK_B_LOCAL.forEach((v, i) => {
      const cx = xs[i];
      nodes.push(
        glassCell(cx, -125, 210, 96, COSMOS.rose, { fill: '#26111c', glow: 8, opacity: a }),
        txt(number(v), cx, -125, 44, COSMOS.rose, 'mono').opacity(a),

        glassCell(cx, 135, 210, 96, off > 0.5 ? COSMOS.emerald : COSMOS.dim, {
          fill: off > 0.5 ? '#0d2624' : '#0f1422',
          glow: off > 0.5 ? 10 : 0,
          opacity: a,
        }),
        txt(
          off > 0.5 ? number(BLOCK_B_EXPECTED[i]) : '?',
          cx,
          135,
          44,
          off > 0.5 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).opacity(a),
      );
      if (off > 0.04) {
        nodes.push(
          glowingArc([cx, -68], [cx, 78], 0, {
            color: COSMOS.gold,
            width: 4,
            opacity: off * a,
            core: false,
          }),
          txt('+7', cx + 44, 5, 28, COSMOS.gold, 'mono').opacity(off * a),
        );
      }
    });

    nodes.push(
      glassCell(0, 355, 1560, 102, cpu > 0.5 ? COSMOS.cyan : COSMOS.gold, {
        fill: '#101829',
        glow: 9,
        opacity: a,
      }),
      txt(
        cpu > 0.5
          ? 'CPU model checks math & bounds (assumes complete barriers) · GPU needs racecheck & synccheck'
          : 'Clean memory checks miss a forgotten +7 offset · missing barriers can pass lucky GPU runs',
        0,
        355,
        27,
        cpu > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, hazardsView, toolsView, evidenceView);

  c.on('hazard-writes', () => s.play(highlightWaw.to(1, { duration: 0.4 })));
  c.on('hazard-proof-step-1', () => s.play(highlightSafe.to(1, { duration: 0.4 })));

  c.on('hazard-proof-step-2', () => swapViews(s, showHazards, showTools, 0.16, 0.22));

  c.on('hazard-proof-step-3', () => swapViews(s, showTools, showEvidence, 0.16, 0.22));
  c.on('hazard-offset', () => s.play(applyOffset.to(1, { duration: 0.5 })));
  c.on('hazard-cpu', () =>
    s.play(showCpuNote.to(1, { duration: remainDuration(c, 'hazard-cpu', 0.45) })),
  );
}
