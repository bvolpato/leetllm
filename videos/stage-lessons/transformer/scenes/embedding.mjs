// Scene 2: embedding: "Give the token its content and position"
// Token ID 2 lookup -> additive position-2 vector merging coordinate-by-coordinate with
// glowing photon pulses -> residual stream split (norm branch vs waiting original highway).
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EMBED,
  INPUT,
  ROLE,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  position,
  vectorRow,
} from '../parts.mjs';

export default function embedding(s, c) {
  const title = heroTitle(['Token content', '+ position vector'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.pos,
  });

  const pos2 = position(2); // [0.1, 0, 0, 0.1]
  const eq = glowTex('x_2 = e_{\\text{the}} + p_2', {
    x: 470,
    y: -385,
    size: 42,
    color: ROLE.query,
  });

  const lookupProg = s.value(0); // 0 -> 1 reveals EMBED[2]
  const addProg = s.value(0); // 0 -> 4 animates each coordinate merging
  const splitProg = s.value(0); // 0 -> 1 splits original highway vs norm branch
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const lk = lookupProg.value;
    const ap = addProg.value;
    const sp = splitProg.value;
    const doneCoords = Math.min(4, Math.floor(ap + 1e-6));
    const nodes = [];

    // Left vocabulary ID lookup indicator
    const tableX = -715;
    nodes.push(
      lumBar(tableX, -150, 230, 120, {
        color: ROLE.query,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('the', tableX, -176, 36, ROLE.query, 'serif', 'center').opacity(alpha),
      txt('vocab ID 2', tableX, -122, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      arrow([tableX + 125, -150], [-425, -150], {
        stroke: ROLE.stream,
        width: 3.6,
        tip: 14,
      })
        .glow(7, ROLE.stream)
        .opacity((0.35 + 0.65 * lk) * alpha),
    );

    const rowCx = 135;
    const cellW = 165;
    const gap = 16;
    const colXs = [-1.5, -0.5, 0.5, 1.5].map((k) => rowCx + k * (cellW + gap));

    // Row 1: Token embedding lookup e_the
    const embVals = EMBED[2].map((v, j) => (lk > (j + 0.2) / 4 ? v : '?'));
    nodes.push(
      vectorRow({
        cx: rowCx,
        cy: -150,
        values: embVals,
        cellW,
        cellH: 76,
        gap,
        color: ROLE.stream,
        digits: 2,
        label: 'embedding',
        opacity: alpha,
      }),
    );

    // Row 2: Additive position vector p_2
    nodes.push(
      vectorRow({
        cx: rowCx,
        cy: 10,
        values: pos2,
        cellW,
        cellH: 76,
        gap,
        color: ROLE.pos,
        digits: 2,
        label: '+ position 2',
        opacity: alpha,
      }),
    );

    // Row 3: Combined input state x_2
    const activeCoord = ap > 0.02 && doneCoords < 4 ? doneCoords : -1;
    const outVals = INPUT[2].map((v, j) => (j < doneCoords ? v : '?'));
    nodes.push(
      vectorRow({
        cx: rowCx,
        cy: 175,
        values: outVals,
        cellW,
        cellH: 76,
        gap,
        color: ROLE.attn,
        digits: 2,
        label: 'input state',
        highlightIdx: activeCoord,
        opacity: alpha,
      }),
    );

    // Animated glowing addition photon descending down the active coordinate column
    if (activeCoord >= 0) {
      const frac = ap - doneCoords;
      const cx = colXs[activeCoord];
      const py = -110 + frac * 245;
      nodes.push(
        glowingTrail(
          [
            [cx, -108],
            [cx, py],
          ],
          {
            gradientColors: [ROLE.stream, ROLE.pos, ROLE.query],
            width: 4,
            glow: 10,
            opacity: alpha,
          },
        ),
        glowDot(cx, py, { radius: 9, color: ROLE.query, glow: 14, opacity: alpha }),
        txt(
          `coord ${activeCoord + 1}:  ${fmt(EMBED[2][activeCoord], 2)} + ${fmt(pos2[activeCoord], 2)} = ${fmt(INPUT[2][activeCoord], 2)}`,
          rowCx,
          292,
          32,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(alpha),
      );
    }

    // Beat 2: Residual highway split below the combined input state
    if (sp > 0.03) {
      const leftSplit = arcPts([rowCx - 120, 224], [-420, 355], 45, 24);
      const rightSplit = arcPts([rowCx + 120, 224], [520, 355], 45, 24);
      const lc = Math.max(2, Math.round(leftSplit.length * sp));
      const rc = Math.max(2, Math.round(rightSplit.length * sp));
      nodes.push(
        glowingTrail(leftSplit.slice(0, lc), {
          color: ROLE.stream,
          width: 4.5,
          glow: 10,
          opacity: alpha,
        }),
        glowingTrail(rightSplit.slice(0, rc), {
          color: ROLE.attn,
          width: 4.5,
          glow: 10,
          opacity: alpha,
        }),
      );
      if (sp > 0.55) {
        const tagOp = ((sp - 0.55) / 0.45) * alpha;
        nodes.push(
          txt('Original retained for residual add', -420, 405, 28, ROLE.stream, 'mono', 'center')
            .glow(5, ROLE.stream)
            .opacity(tagOp),
          txt('Copy enters LayerNorm', 520, 405, 28, ROLE.attn, 'mono', 'center')
            .glow(5, ROLE.attn)
            .opacity(tagOp),
        );
      }
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.pos, ROLE.attn), title, eq, mainLayer);

  playCue(s, c, 'embedding-lookup', (d) => s.play(lookupProg.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'position-add', (d) => s.play(addProg.to(4, { duration: d })), { dur: 2.2 });
  playCue(s, c, 'preserve-input', (d) => s.play(splitProg.to(1, { duration: d })), { dur: 0.85 });
}
