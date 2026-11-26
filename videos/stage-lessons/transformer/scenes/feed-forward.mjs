// Scene 7: feed-forward: "Expand, reshape, and return to four coordinates"
// View 1 (Beats 0-1): 4-dim normalized row fans out to 6 signed preactivation bars ->
//         withholds survival before ffn-relu -> ReLU flattens negative bars to 0.
// View 2 (Beat 2): Return projection builds 4-dim update F -> translates onto Y to reach block output Z.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  INPUT,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowRing,
  glowVector,
  lerpRow,
  lumBar,
  playCue,
  slice14,
  swapVis,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

export default function feedForward(s, c) {
  const title = heroTitle(['Feed-forward:', 'expand, bend, return'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.amber,
  });

  const eq = glowTex('\\operatorname{ReLU}(z) = \\max(0, z)', {
    x: 470,
    y: -385,
    size: 40,
    color: ROLE.valid,
  });

  const vExpand = s.value(1);
  const vReturn = s.value(0);

  const expandProg = s.value(0); // 0 -> 6 bars appear
  const reluProg = s.value(0); // 0 -> 1 clips negatives to 0 (ONLY on ffn-relu!)
  const projProg = s.value(0); // 0 -> 4 return coordinates revealed
  const addProg = s.value(0); // 0 -> 1 translates F onto Y -> Z

  // VIEW 1: 4 -> 6 expansion and ReLU bar collapse
  const expandLayer = guardedDynamic(vExpand, (alpha) => {
    const ep = expandProg.value;
    const rp = reluProg.value;
    const vals = lerpRow(MODEL.pre[2], MODEL.H[2], rp);
    const barLabels = ['n1', 'n2', 'n3', 'n4', 'n1-n2', 'n3-n4'];
    const nodes = [];

    nodes.push(
      txt('Expand 4 -> 6 hidden features', 40, -290, 28, ROLE.attn, 'mono', 'center').opacity(
        alpha,
      ),
      vectorRow({
        cx: 40,
        cy: -215,
        values: MODEL.ffnInput[2],
        cellW: 160,
        cellH: 72,
        gap: 16,
        color: ROLE.query,
        digits: 3,
        label: 'norm(Y)',
        opacity: alpha,
      }),
    );

    const zeroY = 155;
    const barScale = 95;
    const barXs = [-625, -375, -125, 125, 375, 625];

    nodes.push(
      line([-760, zeroY], [760, zeroY], { stroke: '#556894', width: 2.4 }).opacity(alpha),
      txt('0', -790, zeroY, 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
    );

    vals.forEach((v, i) => {
      const bx = barXs[i];
      const shown = ep > i * 0.85;
      const isNeg = MODEL.pre[2][i] < 0;
      const col = isNeg ? (rp > 0.85 ? COSMOS.dim : ROLE.mask) : ROLE.valid;
      const barOp = (shown ? 1 : 0.2) * alpha;

      // Glowing fan conduit from top vector cleanly stopping well above labels
      const srcX = 40 + ((i % 4) - 1.5) * 176;
      nodes.push(
        glowingTrail(
          [
            [srcX, -172],
            [bx, -112],
          ],
          { color: ROLE.attn, width: 2, glow: 4, core: false, opacity: 0.28 * barOp },
        ),
        txt(barLabels[i], bx, -72, 26, COSMOS.muted, 'mono', 'center').opacity(barOp),
      );

      if (shown) {
        const h = Math.abs(v) * barScale;
        if (h > 3) {
          const cy = v >= 0 ? zeroY - h / 2 : zeroY + h / 2;
          nodes.push(
            lumBar(bx, cy, 78, h, {
              color: col,
              fillOpacity: isNeg ? 0.36 : 0.44,
              strokeWidth: 2.5,
              glow: isNeg && rp > 0.85 ? 0 : 9,
              radius: 6,
              opacity: alpha,
            }),
          );
        }
        nodes.push(txt(fmt(v, 3), bx, 332, 28, col, 'mono', 'center').opacity(alpha));
      } else {
        nodes.push(txt('?', bx, 332, 28, COSMOS.dim, 'mono', 'center').opacity(alpha));
      }
    });

    const footer =
      rp > 0.85
        ? 'Negative values clipped to 0.000  ·  positive features survive'
        : ep > 5
          ? 'Which hidden features survive ReLU?'
          : 'First 4 copy inputs  ·  last 2 compute coordinate differences';
    nodes.push(
      txt(footer, 0, 408, 30, rp > 0.85 ? ROLE.valid : ROLE.query, 'serif', 'center')
        .glow(6, rp > 0.85 ? ROLE.valid : ROLE.query)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Return projection 6 -> 4 and second residual add Y + F = Z
  const plane2 = vectorPlane({
    originX: -540,
    originY: 660,
    scaleX: 520,
    scaleY: 520,
    xMin: -0.2,
    xMax: 0.5,
    yMin: 0.75,
    yMax: 1.45,
    xTicks: [-0.2, 0, 0.2, 0.4],
    yTicks: [0.8, 1.0, 1.2, 1.4],
    tickDigits: 1,
    xLabel: 'c1',
    yLabel: 'c4',
  });

  const returnLayer = guardedDynamic(vReturn, (alpha) => {
    const pp = projProg.value;
    const ap = addProg.value;
    const count = Math.min(4, Math.floor(pp + 1e-6));
    const curZ = lerpRow(MODEL.Y[2], MODEL.Z[2], ap);

    const xPt = plane2.toScreen(...slice14(INPUT[2]));
    const yPt = plane2.toScreen(...slice14(MODEL.Y[2]));
    const curPt = plane2.toScreen(...slice14(curZ));

    const nodes = [
      plane2.node.opacity(alpha),
      glowVector(xPt, yPt, { color: ROLE.stream, width: 3.5, glow: 6, opacity: 0.65 * alpha }),
      glowRing(xPt[0], xPt[1], 9, ROLE.stream, { width: 2.5, glow: 6, opacity: alpha }),
      txt('X', xPt[0], xPt[1] - 30, 26, ROLE.stream, 'mono', 'center').opacity(alpha),
      glowRing(yPt[0], yPt[1], 10, ROLE.attn, { width: 3, glow: 8, opacity: alpha }),
      txt('Y', yPt[0] - 28, yPt[1] - 28, 26, ROLE.attn, 'mono', 'right').opacity(alpha),
    ];

    if (ap > 0.02) {
      nodes.push(
        glowVector(yPt, curPt, { color: ROLE.valid, width: 5.5, glow: 12, opacity: alpha }),
      );
      if (ap > 0.85) {
        nodes.push(
          glowRing(curPt[0], curPt[1], 14, ROLE.valid, { width: 3.5, glow: 14, opacity: alpha }),
          txt('Z', curPt[0] + 28, curPt[1] - 12, 32, ROLE.valid, 'mono', 'left')
            .glow(8, ROLE.valid)
            .opacity(alpha),
        );
      }
    }

    const activeJ = Math.min(3, Math.max(0, count - 1));
    const extra = MODEL.H[2][4 + (activeJ % 2)];
    nodes.push(
      txt(
        `f${activeJ + 1} = 0.2(${fmt(MODEL.H[2][activeJ], 3)}) + 0.05(${fmt(extra, 3)})`,
        430,
        -220,
        28,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      txt('projected 4-coord update F', 430, -145, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      vectorRow({
        cx: 430,
        cy: -65,
        values: MODEL.F[2].map((v, j) => (j < count ? v : '?')),
        cellW: 150,
        cellH: 74,
        gap: 14,
        color: ROLE.attn,
        digits: 3,
        opacity: alpha,
      }),
      txt(
        ap > 0.9 ? 'block output Z = Y + F (complete)' : 'second residual add Y + F',
        430,
        95,
        30,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(ap > 0.9 ? 7 : 0, ROLE.valid)
        .opacity(alpha),
      vectorRow({
        cx: 430,
        cy: 195,
        values: curZ,
        cellW: 150,
        cellH: 76,
        gap: 14,
        color: ROLE.valid,
        digits: 3,
        opacity: alpha,
      }),
      txt(
        'Coord 1 stays fixed while coord 4 rises',
        430,
        320,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.amber, ROLE.valid), title, eq, expandLayer, returnLayer);

  playCue(s, c, 'ffn-expand', (d) => s.play(expandProg.to(6, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'ffn-relu', (d) => s.play(reluProg.to(1, { duration: d })), { dur: 1.0 });

  playCue(s, c, 'ffn-project', (d) => s.play(swapVis(vExpand, vReturn, Math.min(0.55, d * 0.45))), {
    dur: 0.6,
  });
  playCue(s, c, 'ffn-project', (d) => s.play(projProg.to(4, { duration: d })), {
    dur: 1.1,
    offset: 0.55,
  });
  playCue(s, c, 'ffn-add', (d) => s.play(addProg.to(1, { duration: d })), { dur: 1.1 });
}
