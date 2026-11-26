// Scene 06: prefix: "Keep the first two coordinates"
// Matryoshka prefix slicing cinema: glowing 4D coordinate rays sliced by a gold laser line,
// collapsing Audit & Rotation onto the same 2D prefix direction [1, 0] while Lifecycle survives.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PREFIX_DOCS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  prefixResults,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function prefix(s, c) {
  const names = ['Audit', 'Rotation', 'Lifecycle'];
  const colors = [ROLE.query, ROLE.A, ROLE.B];
  const full = prefixResults(4);
  const short = prefixResults(2);

  const phase = s.value(0);
  const showFull = s.value(0);
  const cutMix = s.value(0);
  const askVis = s.value(0);
  const showTie = s.value(0);
  const showLife = s.value(0);
  const showHits = s.value(0);

  const title = heroTitle(['Keep the first', 'two coordinates'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'MATRYOSHKA PREFIX SLICING',
  });

  // Left: 3 stored 4D coordinate rows + gold laser slice beam
  const matrixLayer = dynamic(() => {
    const cut = cutMix.value;
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const cellW = 104;
    const cellH = 74;
    const gap = 16;
    const startX = -545;
    const rowYs = [-145, -15, 115];

    const nodes = [
      txt('ELIGIBLE ROWS (STORAGE ORDER)', -845, -240, 26, COSMOS.muted, 'mono', 'left'),
      txt('d₀', startX, -205, 26, COSMOS.dim, 'mono'),
      txt('d₁', startX + cellW + gap, -205, 26, COSMOS.dim, 'mono'),
      txt('d₂', startX + 2 * (cellW + gap), -205, 26, COSMOS.dim, 'mono').opacity(1 - 0.7 * cut),
      txt('d₃', startX + 3 * (cellW + gap), -205, 26, COSMOS.dim, 'mono').opacity(1 - 0.7 * cut),
    ];

    PREFIX_DOCS.forEach((vec, r) => {
      const ry = rowYs[r];
      const col = colors[r];
      nodes.push(
        txt(names[r], -845, ry, 34, col, 'serif', 'left').glow(5, col),
        txt(`#${r + 1}`, -645, ry, 26, COSMOS.dim, 'mono'),
      );
      vec.forEach((v, j) => {
        const cx = startX + j * (cellW + gap);
        const dropped = j >= 2;
        const cellAlpha = dropped ? 1 - 0.82 * cut : 1;
        nodes.push(
          lumBar(cx, ry, cellW, cellH, {
            color: v === 1 ? col : '#4b5d87',
            fillAlpha: v === 1 ? 0.26 : 0.1,
            strokeWidth: v === 1 ? 2.4 : 1.5,
            glow: v === 1 && !dropped ? 8 * pulse : 2,
            opacity: cellAlpha,
          }),
          txt(String(v), cx, ry, 36, v === 1 ? COSMOS.ink : COSMOS.muted, 'mono').opacity(
            cellAlpha,
          ),
        );
      });
    });

    // Gold laser cut line between d1 and d2
    if (cut > 0.02) {
      const cutX = startX + cellW + gap + (cellW + gap) / 2;
      nodes.push(
        line([cutX, -225], [cutX, 195], { stroke: ROLE.gold, width: 4.5, dash: [10, 7] })
          .glow(11, ROLE.gold)
          .opacity(cut),
        txt('2D PREFIX CUT', cutX, 235, 26, ROLE.gold, 'mono').glow(6, ROLE.gold).opacity(cut),
      );
    }

    // Mini 2D prefix geometry projection (bottom-left)
    const ox = -760;
    const oy = 395;
    const len = 175;
    nodes.push(
      line([ox, oy], [ox + len + 45, oy], { stroke: '#4c5f8a', width: 2.2 }),
      line([ox, oy], [ox, oy - len + 15], { stroke: '#4c5f8a', width: 2.2 }),
      txt('2D PREFIX DIRECTIONS', -445, 310, 26, COSMOS.muted, 'mono', 'left'),
      glowVector([ox, oy], [ox + len, oy], {
        color: cut > 0.5 ? ROLE.gold : ROLE.A,
        width: 5,
        tipSize: 16,
        glow: 8,
      }),
      glowVector([ox, oy], [ox, oy - len + 35], {
        color: ROLE.B,
        width: 5,
        tipSize: 16,
        glow: 8,
      }),
      txt(
        'Audit & Rotation → [1, 0]',
        -445,
        358,
        28,
        cut > 0.5 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt('Lifecycle → [0, 1]', -445, 402, 28, ROLE.B, 'mono', 'left'),
    );

    return group(...nodes);
  });

  // Right: Query evaluation flow (floating typography + status beams, zero boxy cards)
  const evalLayer = dynamic(() => {
    const fOp = showFull.value;
    const tOp = showTie.value;
    const lOp = showLife.value;
    const hOp = showHits.value;

    const nodes = [
      rule(60, -390, 60, 410, COSMOS.rule, 1.8).opacity(0.6),
      txt('QUERY', 120, -240, 26, COSMOS.muted, 'mono', 'left'),
      txt('FULL 4D', 410, -240, 26, COSMOS.muted, 'mono'),
      txt('PREFIX 2D', 710, -240, 26, ROLE.gold, 'mono'),
      txt('Ties go to the first row in storage (#1)', 120, -315, 28, COSMOS.muted, 'sans', 'left'),
      // Query 1: Rotation
      txt('Rotation', 120, -110, 34, ROLE.A, 'serif', 'left').glow(5, ROLE.A),
      txt('[1, 0, 0, 1]', 120, -60, 28, COSMOS.dim, 'mono', 'left'),
      // Query 2: Lifecycle
      txt('Lifecycle', 120, 75, 34, ROLE.B, 'serif', 'left').glow(5, ROLE.B),
      txt('[0, 1, 0, 1]', 120, 125, 28, COSMOS.dim, 'mono', 'left'),
    ];

    if (fOp > 0.02) {
      nodes.push(
        txt(names[full.winners[0]], 410, -110, 34, ROLE.A, 'mono').glow(6, ROLE.A).opacity(fOp),
        txt('cos = 1.00', 410, -60, 26, COSMOS.dim, 'mono').opacity(fOp),
        txt(names[full.winners[1]], 410, 75, 34, ROLE.B, 'mono').glow(6, ROLE.B).opacity(fOp),
        txt('cos = 1.00', 410, 125, 26, COSMOS.dim, 'mono').opacity(fOp),
      );
    }

    if (tOp > 0.02) {
      nodes.push(
        lumBar(710, -110, 210, 56, {
          color: ROLE.warn,
          fillAlpha: 0.2,
          glow: 9,
          opacity: tOp,
        }),
        txt(names[short.winners[0]], 710, -110, 34, ROLE.warn, 'mono')
          .glow(7, ROLE.warn)
          .opacity(tOp),
        txt('tie → row #1', 710, -52, 26, ROLE.warn, 'mono').opacity(tOp),
      );
    }

    if (lOp > 0.02) {
      nodes.push(
        lumBar(710, 75, 210, 56, {
          color: ROLE.B,
          fillAlpha: 0.2,
          glow: 8,
          opacity: lOp,
        }),
        txt(names[short.winners[1]], 710, 75, 34, ROLE.B, 'mono').glow(6, ROLE.B).opacity(lOp),
        txt('still exact', 710, 133, 26, ROLE.A, 'mono').opacity(lOp),
      );
    }

    if (hOp > 0.02) {
      nodes.push(
        rule(120, 220, 840, 220, COSMOS.rule, 1.6).opacity(0.7 * hOp),
        txt('TOP-1 EVIDENCE RECALL', 120, 268, 26, COSMOS.muted, 'mono', 'left').opacity(hOp),
        txt('2 / 2   →   1 / 2', 120, 332, 48, ROLE.gold, 'mono', 'left')
          .glow(9, ROLE.gold)
          .opacity(hOp),
        glowDot(132, 398, { radius: 8, color: ROLE.warn, glow: 10, opacity: hOp }),
        txt('discarded tail distinction is gone', 162, 398, 28, ROLE.warn, 'sans', 'left').opacity(
          hOp,
        ),
      );
    }

    return group(...nodes);
  });

  const askLayer = guardedDynamic(askVis, (a) =>
    group(
      txt('Rotation query [1, 0]', 120, 290, 32, ROLE.A, 'mono', 'left').opacity(a),
      txt('Which guide wins now?', 120, 350, 40, ROLE.gold, 'serif', 'left')
        .glow(8, ROLE.gold)
        .opacity(a),
    ),
  );

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.A), title, matrixLayer, evalLayer, askLayer);

  runPhase(s, c, phase, 8);

  playCue(s, c, 'full', (d) => s.play(showFull.to(1, { duration: d })), { after: true, dur: 0.55 });
  playCue(s, c, 'cut', (d) => s.play(cutMix.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'ask', (d) => s.play(askVis.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'tie', (d) => s.play(askVis.to(0, { duration: d })), { dur: 0.28 });
  playCue(s, c, 'tie', (d) => s.play(showTie.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'life', (d) => s.play(showLife.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'hits', (d) => s.play(showHits.to(1, { duration: d })), { after: true, dur: 0.5 });
}
