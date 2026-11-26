// Scene 1: order-collision - "An average cannot recover the order it discarded"
// Pure Cinema: two luminous token tracks smoothly arc-swapping "compiler" and "linker",
// collapsing onto one glowing static-mean vector, then splitting apart via contextual attention arcs.
import { arrow, circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowArc,
  glowDot,
  glowRing,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function orderCollision(s, c) {
  const words = ['compiler', 'calls', 'linker'];
  const vecs = [
    [0.9, 0.1, 0.0],
    [0.8, 0.2, 0.1],
    [0.7, 0.1, 0.2],
  ];
  const mean = vecs[0].map((_, j) => vecs.reduce((acc, v) => acc + v[j], 0) / 3);
  verifyApprox(mean[0], 0.8, 1e-12, 'order-collision mean x');
  verifyApprox(mean[1], 0.4 / 3, 1e-12, 'order-collision mean y');

  const swapT = s.value(0);
  const showMean = s.value(0);
  const ctxBlend = s.value(0);
  const diagGlow = s.value(0);

  const title = heroTitle(['Who calls whom?', 'static mean vs. context'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.anchor,
  });

  const colXs = [-590, -240, 110];
  const rowAY = -155;
  const rowBY = 85;

  const sceneLayer = guardedDynamic(s.value(1), () => {
    const t = swapT.value;
    const sm = showMean.value;
    const ctx = ctxBlend.value;
    const dg = diagGlow.value;
    const nodes = [];

    // Row A: compiler -> calls -> linker (fixed)
    nodes.push(txt('Row A', -855, rowAY, 26, ROLE.anchor, 'mono', 'left'));
    for (let j = 0; j < 3; j++) {
      const cx = colXs[j];
      nodes.push(
        lumBar(cx, rowAY, 224, 68, {
          color: ROLE.anchor,
          fillAlpha: 0.22,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
        }),
        txt(words[j], cx, rowAY, 32, COSMOS.ink, 'sans', 'center'),
      );
      if (ctx < 0.5) {
        const op = 1 - ctx * 2;
        nodes.push(
          txt(
            `[${vecs[j].map((v) => v.toFixed(1)).join(', ')}]`,
            cx,
            rowAY + 64,
            28,
            ROLE.anchor,
            'mono',
            'center',
          ).opacity(op),
        );
      } else {
        const op = (ctx - 0.5) * 2;
        const roleTag =
          j === 0 ? 'h(compiler, caller)' : j === 1 ? 'h(calls)' : 'h(linker, callee)';
        nodes.push(
          txt(roleTag, cx, rowAY + 64, 26, ROLE.anchor, 'mono', 'center')
            .glow(dg > 0.3 ? 6 : 0, ROLE.anchor)
            .opacity(op),
        );
      }
    }

    // Contextual attention arcs on Row A when ctx > 0.3
    if (ctx > 0.3) {
      const aOp = (ctx - 0.3) / 0.7;
      nodes.push(
        glowArc([colXs[0], rowAY - 40], [colXs[1], rowAY - 40], -42, {
          color: ROLE.anchor,
          width: 2.6,
          glow: 6,
          opacity: 0.85 * aOp,
        }),
        glowArc([colXs[1], rowAY - 40], [colXs[2], rowAY - 40], -42, {
          color: ROLE.anchor,
          width: 2.6,
          glow: 6,
          opacity: 0.85 * aOp,
        }),
      );
    }

    // Row B: smoothly arc-swaps token 0 ("compiler") and token 2 ("linker") along non-overlapping arcs
    nodes.push(txt('Row B', -855, rowBY, 26, ROLE.competitor, 'mono', 'left'));
    for (let j = 0; j < 3; j++) {
      let cx = colXs[j];
      let cy = rowBY;
      if (j === 0) {
        cx = colXs[0] + (colXs[2] - colXs[0]) * t;
        cy = rowBY - 68 * Math.sin(Math.PI * t);
      } else if (j === 2) {
        cx = colXs[2] + (colXs[0] - colXs[2]) * t;
        cy = rowBY + 68 * Math.sin(Math.PI * t);
      }
      nodes.push(
        lumBar(cx, cy, 224, 68, {
          color: ROLE.competitor,
          fillAlpha: 0.22,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
        }),
        txt(words[j], cx, cy, 32, COSMOS.ink, 'sans', 'center'),
      );

      // Hide static coordinates strictly during mid-swap so no moving box crosses text
      const staticVis = Math.max(0, 1 - Math.sin(Math.PI * t) * 4);
      if (ctx < 0.5 && staticVis > 0.05) {
        const op = staticVis * (1 - ctx * 2);
        const targetCol = j === 0 && t > 0.5 ? colXs[2] : j === 2 && t > 0.5 ? colXs[0] : colXs[j];
        nodes.push(
          txt(
            `[${vecs[j].map((v) => v.toFixed(1)).join(', ')}]`,
            targetCol,
            rowBY + 64,
            28,
            ROLE.competitor,
            'mono',
            'center',
          ).opacity(op),
        );
      } else if (ctx >= 0.5) {
        const op = (ctx - 0.5) * 2;
        const posX = j === 0 ? colXs[2] : j === 2 ? colXs[0] : colXs[1];
        const roleTag =
          j === 0 ? 'h(compiler, callee)' : j === 1 ? 'h(calls)' : 'h(linker, caller)';
        nodes.push(
          txt(roleTag, posX, rowBY + 64, 26, ROLE.competitor, 'mono', 'center')
            .glow(dg > 0.3 ? 6 : 0, ROLE.competitor)
            .opacity(op),
        );
      }
    }

    if (ctx > 0.3) {
      const aOp = (ctx - 0.3) / 0.7;
      nodes.push(
        glowArc([colXs[0], rowBY - 40], [colXs[1], rowBY - 40], -42, {
          color: ROLE.competitor,
          width: 2.6,
          glow: 6,
          opacity: 0.85 * aOp,
        }),
        glowArc([colXs[1], rowBY - 40], [colXs[2], rowBY - 40], -42, {
          color: ROLE.competitor,
          width: 2.6,
          glow: 6,
          opacity: 0.85 * aOp,
        }),
      );
    }

    // Right-hand embedding space geometry: static collision point -> contextual split!
    const plotCx = 585;
    const plotCy = -15;
    const plotR = 210;
    nodes.push(
      rule(315, -310, 315, 290, COSMOS.rule, 1.8).opacity(0.55),
      circle(plotR, { fill: '#0e162b66', stroke: '#3c5180', width: 2.4 }).at(plotCx, plotCy),
      line([plotCx - plotR - 18, plotCy], [plotCx + plotR + 18, plotCy], {
        stroke: '#2c3d64',
        width: 1.5,
      }),
      line([plotCx, plotCy - plotR - 18], [plotCx, plotCy + plotR + 18], {
        stroke: '#2c3d64',
        width: 1.5,
      }),
      txt('SENTENCE SPACE', plotCx, plotCy - plotR - 46, 26, COSMOS.muted, 'mono', 'center'),
    );

    const splitAng = ctx * 0.48;
    const baseAng = 0.28;
    const angA = baseAng + splitAng;
    const angB = baseAng - splitAng;
    const vecLen = plotR * 0.84;
    const tipA = [plotCx + vecLen * Math.cos(angA), plotCy - vecLen * Math.sin(angA)];
    const tipB = [plotCx + vecLen * Math.cos(angB), plotCy - vecLen * Math.sin(angB)];

    if (sm > 0.05 || ctx > 0.05) {
      const vis = Math.max(sm, ctx);
      if (ctx < 0.25) {
        nodes.push(
          glowVector([plotCx, plotCy], tipA, {
            color: ROLE.focus,
            width: 5.5,
            glow: 12,
            opacity: vis,
          }),
          glowRing(tipA[0], tipA[1], 24, ROLE.focus, { width: 2.8, glow: 10, opacity: vis }),
          txt(
            'A = B  (collision)',
            plotCx,
            plotCy + plotR + 46,
            28,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(vis),
        );
      } else {
        nodes.push(
          glowVector([plotCx, plotCy], tipA, {
            color: ROLE.anchor,
            width: 5,
            glow: 10,
            opacity: vis,
          }),
          glowVector([plotCx, plotCy], tipB, {
            color: ROLE.competitor,
            width: 5,
            glow: 10,
            opacity: vis,
          }),
          txt(
            'mean(A)  ≠  mean(B)',
            plotCx,
            plotCy + plotR + 46,
            28,
            ROLE.positive,
            'mono',
            'center',
          ).opacity(ctx),
        );
      }
    } else {
      nodes.push(
        glowDot(plotCx, plotCy, { radius: 7, color: COSMOS.muted, glow: 6 }),
        txt(
          'awaiting pooled vectors',
          plotCx,
          plotCy + plotR + 46,
          26,
          COSMOS.dim,
          'mono',
          'center',
        ),
      );
    }

    // Bottom readout strip
    const footY = 345;
    nodes.push(rule(-850, 275, 850, 275, COSMOS.rule, 1.6).opacity(0.55));
    if (ctx < 0.5 && sm > 0.05) {
      const op = sm * (1 - ctx * 2);
      nodes.push(
        txt(
          'Σ = [2.4, 0.4, 0.3]   ÷ 3   =   [0.800, 0.133, 0.100]',
          -250,
          footY - 12,
          34,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(op),
        txt(
          'Identical static mean for both directions',
          -250,
          footY + 40,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(op),
      );
    } else if (ctx >= 0.5) {
      const op = (ctx - 0.5) * 2;
      nodes.push(
        txt(
          'Contextual encoder reads the full sentence before pooling',
          0,
          footY - 10,
          34,
          ROLE.positive,
          'sans',
          'center',
        )
          .glow(dg > 0.3 ? 7 : 3, ROLE.positive)
          .opacity(op),
        txt(
          'Role-dependent token states separate caller from callee',
          0,
          footY + 42,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(op),
      );
    } else {
      nodes.push(
        txt(
          'Addition is commutative: v(compiler) + v(calls) + v(linker)',
          -250,
          footY + 12,
          30,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, sceneLayer);

  playOn(s, c, 'cl-order-collision-tokens', (d) => swapT.to(1, { duration: d }), 1.25);
  playAfter(s, c, 'cl-order-collision-mean', (d) => showMean.to(1, { duration: d }), 0.55);
  playOn(s, c, 'cl-order-collision-context', (d) => ctxBlend.to(1, { duration: d }), 1.0);
  playOn(s, c, 'cl-order-collision-diagnose', (d) => diagGlow.to(1, { duration: d }), 0.55);
}
