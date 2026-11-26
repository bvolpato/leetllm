// Scene 13: Where do the two score traces meet? Split block traces lifted by +7 + 512^2 -> 512^2 + 1 recursion boundary.
import {
  ARTICLE_INPUT,
  COSMOS,
  RECURSION_262144,
  RECURSION_262145,
  aura,
  boundaries,
  buildScoreTraceNodes,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  number,
  remainDuration,
  runPhase,
  swapViews,
  traceBeaconNodes,
  tracePolylineNodes,
  txt,
} from '../parts.mjs';

const LEFT_SCORES = boundaries(ARTICLE_INPUT.slice(0, 4)); // [0, 3, 2, 6, 7]
const RIGHT_SCORES = boundaries(ARTICLE_INPUT.slice(4)); // [0, 5, -4, -2, 4]
const OFFSET = LEFT_SCORES.at(-1); // 7

export default function blockOffsets(s, c) {
  const phase = s.value(0);
  const showTraces = s.value(1);
  const leftSteps = s.value(0);
  const rightSteps = s.value(0);
  const showGap = s.value(0);
  const liftFrac = s.value(0);
  const showBefore12 = s.value(0);
  const showAfter3 = s.value(0);
  const showOffsetsReady = s.value(0);

  const showHierarchy = s.value(0);
  const showBoundaryResult = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa20', '#5ce1e618');

  // Beat 0-1: Split 8-play score trace + vertical lift by +7
  const tracesView = guardedDynamic(showTraces, (a) => {
    const ls = leftSteps.value;
    const rs = rightSteps.value;
    const gap = showGap.value;
    const lift = liftFrac.value;
    const b12 = showBefore12.value;
    const a3 = showAfter3.value;
    const rdy = showOffsetsReady.value;

    const { nodes, bx, sy } = buildScoreTraceNodes({
      row: ARTICLE_INPUT,
      scores: LEFT_SCORES,
      x0: -680,
      stepX: 178,
      zeroY: 215,
      pxPerPoint: 22,
      chipY: -175,
      ticks: [-4, 0, 4, 8, 12],
      markedPlays: [5],
      split: true,
      alpha: a,
    });

    const out = [
      heroTitle(['Block Offsets:', 'Joining Two Traces'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.gold,
        eyebrow: 'MULTI-BLOCK SCAN · EXCLUSIVE BLOCK TOTALS',
      }).opacity(a),
      ...nodes,
      ...tracePolylineNodes(LEFT_SCORES, bx, sy, {
        start: 0,
        steps: ls * 4,
        color: COSMOS.blue,
        alpha: a,
      }),
    ];

    // Dim ghost of unshifted Block B trace once lift starts
    if (rs > 0.02 && lift > 0.02) {
      out.push(
        ...tracePolylineNodes(RIGHT_SCORES, bx, sy, {
          start: 4,
          steps: 4,
          offset: 0,
          color: COSMOS.dim,
          dots: false,
          width: 3.2,
          glow: 0,
          core: false,
          alpha: 0.55 * a,
        }),
      );
    }

    // Active Block B trace lifting by lift * 7
    if (rs > 0.02) {
      out.push(
        ...tracePolylineNodes(RIGHT_SCORES, bx, sy, {
          start: 4,
          steps: rs * 4,
          offset: lift * OFFSET,
          color: COSMOS.cyan,
          alpha: a,
        }),
      );
    }

    // Left end beacon (7)
    if (ls > 0.95) {
      out.push(
        ...traceBeaconNodes(bx, sy, 4, OFFSET, String(OFFSET), COSMOS.blue, {
          dx: -42,
          dy: -48,
          alpha: a,
        }),
      );
    }

    // Before lift: show Block B local 0 and local 5 + golden vertical gap line
    if (rs > 0.95 && lift < 0.05) {
      out.push(
        ...traceBeaconNodes(bx, sy, 4, 0, '0', COSMOS.cyan, { dx: 40, dy: 42, alpha: a }),
        ...traceBeaconNodes(bx, sy, 5, RIGHT_SCORES[1], String(RIGHT_SCORES[1]), COSMOS.cyan, {
          dx: 38,
          dy: -22,
          alpha: a,
        }),
      );
      if (gap > 0.05) {
        out.push(
          line([bx(4), sy(OFFSET) + 18], [bx(4), sy(0) - 18], {
            stroke: COSMOS.gold,
            width: 4.5,
          })
            .glow(10, COSMOS.gold)
            .opacity(gap * a),
          txt('gap = ?', bx(4) - 96, sy(2), 28, COSMOS.gold, 'mono').opacity(gap * a),
        );
      }
    }

    // Revealed shifted beacons (12 and 3)
    if (b12 > 0.02) {
      out.push(
        ...traceBeaconNodes(
          bx,
          sy,
          5,
          RIGHT_SCORES[1] + OFFSET,
          String(RIGHT_SCORES[1] + OFFSET),
          COSMOS.gold,
          { below: false, alpha: b12 * a },
        ),
      );
    }
    if (a3 > 0.02) {
      out.push(
        ...traceBeaconNodes(
          bx,
          sy,
          6,
          RIGHT_SCORES[2] + OFFSET,
          String(RIGHT_SCORES[2] + OFFSET),
          COSMOS.emerald,
          { dx: 38, dy: 24, alpha: a3 * a },
        ),
      );
    }

    const msgCol = rdy > 0.5 ? COSMOS.emerald : b12 > 0.5 ? COSMOS.gold : COSMOS.cyan;
    const msg =
      rdy > 0.5
        ? 'Exclusive scan of block totals [7, 4] → offsets [0, +7]   ·   Block B → [7, 12, 3, 5]'
        : a3 > 0.5
          ? 'Before −9: 5 + 7 = 12   ·   After −9: −4 + 7 = 3'
          : b12 > 0.5
            ? 'Lift whole right trace by +7  →  local 5 becomes 12'
            : lift > 0.05
              ? 'Lifting Block B starting score by +7...'
              : gap > 0.5
                ? 'Block A ends at 7, Block B starts at 0  ·  What shift joins the two traces?'
                : 'Each block computes its own local scan starting from 0';

    out.push(
      glassCell(0, 392, 1560, 82, msgCol, { fill: '#101829', glow: 8, opacity: a }),
      txt(msg, 0, 392, 28, msgCol, 'sans').opacity(a),
    );

    return group(...out);
  });

  // Beat 2: Recursive tile-hierarchy boundary (512^2 vs 512^2 + 1)
  const hierarchyView = guardedDynamic(showHierarchy, (a) => {
    const p = phase.value;
    const res = showBoundaryResult.value;
    const u = (p * 0.85) % 1;
    const cols = ['INPUTS', 'BLOCK TOTALS', 'LEVEL 2', 'ROOT'];
    const xs = [-615, -205, 205, 615];

    const nodes = [
      heroTitle(['Recursive Scan', 'Tile Boundary'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.gold,
        eyebrow: 'TILE WIDTH = 512  ·  512² = 262,144 vs 262,145',
      }).opacity(a),

      ...cols.map((lbl, i) => txt(lbl, xs[i], -185, 26, COSMOS.muted, 'mono').opacity(a)),
    ];

    const drawRow = (counts, y, rowCol, withholdTail) => {
      counts.forEach((cnt, j) => {
        const cx = xs[j];
        const hidden = withholdTail && j >= 2 && res < 0.5;
        nodes.push(
          glassCell(cx, y, 276, 102, hidden ? COSMOS.dim : rowCol, {
            fill: hidden ? '#101423' : '#101d35',
            glow: hidden ? 0 : 9,
            opacity: a,
          }),
          txt(
            hidden ? '?' : cnt.toLocaleString('en-US'),
            cx,
            y,
            40,
            hidden ? COSMOS.gold : rowCol,
            'mono',
          ).opacity(a),
        );
        if (j > 0) {
          const x1 = xs[j - 1] + 148;
          const x2 = cx - 148;
          nodes.push(
            glowingArc([x1, y], [x2, y], 0, {
              color: rowCol,
              width: 3.6,
              opacity: a,
              core: false,
            }),
            glowDot(x1 + u * (x2 - x1), y, { radius: 6, color: rowCol, opacity: a }),
          );
        }
      });
    };

    drawRow(RECURSION_262144, -65, COSMOS.cyan, false);
    drawRow(RECURSION_262145, 135, COSMOS.gold, true);

    nodes.push(
      txt('Fits in 1 tile', 615, -65, 28, COSMOS.cyan, 'mono').opacity(a),
      glassCell(0, 355, 1540, 86, COSMOS.gold, { fill: '#181611', glow: 9, opacity: a }),
      txt(
        res > 0.5
          ? 'Adding 1 input (262,145) produces 513 totals → needs 2 tiles + 1 extra recursion level'
          : 'Add 1 extra input above 512² = 262,144 → 513 block totals',
        0,
        355,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, tracesView, hierarchyView);
  runPhase(s, c, phase, 14);

  c.on('offset-left', () => s.play(leftSteps.to(1, { duration: 0.7 })));
  c.on('offset-right', () => s.play(rightSteps.to(1, { duration: 0.7 })));
  c.on('offset-gap', () => s.play(showGap.to(1, { duration: 0.35 })));
  c.on('offset-shift', () => s.play(liftFrac.to(1, { duration: 0.75 })));
  c.after('offset-result', () => s.play(showBefore12.to(1, { duration: 0.35 })));
  c.after('offset-after', () => s.play(showAfter3.to(1, { duration: 0.35 })));
  c.on('offset-ready', () => s.play(showOffsetsReady.to(1, { duration: 0.35 })));

  c.on('offset-extra', () => swapViews(s, showTraces, showHierarchy, 0.16, 0.22));
  c.after('offset-boundary', () =>
    s.play(showBoundaryResult.to(1, { duration: remainDuration(c, 'offset-boundary', 0.45) })),
  );
}
