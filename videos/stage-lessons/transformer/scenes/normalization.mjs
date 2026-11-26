// Scene 3: normalization: "Center and rescale one row"
// Four glowing coordinate orbs glide along fixed [-2, 2] numeric rails:
// first marking mean (0.575), then centering to mean 0, then dividing by sqrt(var + eps)
// while the unchanged original vector glows calmly on the residual rail below.
import { line } from 'vizmatic/stage';
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
  INPUT,
  ROLE,
  cinemaAtmosphere,
  fmt,
  lerpRow,
  normStats,
  playCue,
  vectorRow,
} from '../parts.mjs';

export default function normalization(s, c) {
  const stats = normStats(INPUT[2]);

  const title = heroTitle(['LayerNorm:', 'center and rescale'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  const eq = glowTex('\\hat{x}_i = \\frac{x_i - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}', {
    x: 470,
    y: -380,
    size: 40,
    color: ROLE.attn,
  });

  const showMean = s.value(0);
  const centerProg = s.value(0);
  const showScale = s.value(0);
  const rescaleProg = s.value(0);
  const branchGlow = s.value(0.25);
  const stageVis = s.value(1);

  const railLeft = -620;
  const railRight = 620;
  const mapX = (v) => railLeft + ((v + 2) / 4) * (railRight - railLeft);
  const railYs = [-215, -130, -45, 40];

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const sm = showMean.value;
    const cp = centerProg.value;
    const ss = showScale.value;
    const rp = rescaleProg.value;
    const bg = branchGlow.value;
    const pts = lerpRow(lerpRow(INPUT[2], stats.centered, cp), stats.normalized, rp);
    const nodes = [];

    // Zero meridian spanning the 4 rails
    const zeroX = mapX(0);
    nodes.push(
      line([zeroX, railYs[0] - 32], [zeroX, railYs[3] + 32], {
        stroke: '#556894',
        width: 2.2,
        dash: [6, 6],
      }).opacity(0.8 * alpha),
    );

    // Moving mean marker (glides from mu -> 0 as centering happens)
    if (sm > 0.05) {
      const curMean = stats.mean * (1 - cp);
      const mx = mapX(curMean);
      nodes.push(
        glowingTrail(
          [
            [mx, railYs[0] - 34],
            [mx, railYs[3] + 34],
          ],
          { color: ROLE.query, width: 3.2, glow: 8, opacity: sm * alpha },
        ),
        txt(
          cp > 0.8 ? 'mean = 0.000' : `mean = ${fmt(curMean, 3)}`,
          mx,
          railYs[0] - 64,
          28,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(sm * alpha),
      );
    }

    // 4 fixed-scale numeric rails and gliding orbs
    pts.forEach((v, i) => {
      const y = railYs[i];
      const ox = mapX(v);
      const startX = mapX(INPUT[2][i]);
      const col = rp > 0.3 ? ROLE.attn : cp > 0.2 ? ROLE.query : ROLE.stream;
      nodes.push(
        line([railLeft, y], [railRight, y], { stroke: '#2c3b63', width: 2 }).opacity(alpha),
        // Faint trail showing displacement from original position
        glowingTrail(
          [
            [startX, y],
            [ox, y],
          ],
          { color: col, width: 3.5, glow: 6, core: false, opacity: 0.45 * alpha },
        ),
        glowDot(ox, y, { radius: 12, color: col, glow: 14, opacity: alpha }),
        txt(`x${i + 1}`, railLeft - 46, y, 28, COSMOS.muted, 'mono', 'right').opacity(alpha),
        txt(fmt(v, 3), railRight + 46, y, 28, col, 'mono', 'left').opacity(alpha),
      );
    });

    // Fixed numeric axis ticks underneath rail 4
    [-2, -1, 0, 1, 2].forEach((tick) => {
      const tx = mapX(tick);
      nodes.push(
        line([tx, railYs[3] + 24], [tx, railYs[3] + 38], { stroke: '#5c70a0', width: 2 }).opacity(
          alpha,
        ),
        txt(String(tick), tx, railYs[3] + 68, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    // Live statistics line
    const statStr = `mean ${sm > 0.4 ? fmt(stats.mean, 3) : '?'}   ·   std ${ss > 0.4 ? fmt(stats.scale, 3) : '?'}   ·   eps = 1e-5`;
    nodes.push(
      txt(statStr, 0, 178, 30, ss > 0.4 ? ROLE.attn : ROLE.query, 'mono', 'center')
        .glow(6, ss > 0.4 ? ROLE.attn : ROLE.query)
        .opacity(alpha),
    );

    // Unchanged original row waiting on its own residual highway below
    nodes.push(
      vectorRow({
        cx: 95,
        cy: 315,
        values: INPUT[2],
        cellW: 160,
        cellH: 72,
        gap: 16,
        color: ROLE.stream,
        digits: 2,
        label: 'original stays',
        opacity: (0.45 + 0.55 * bg) * alpha,
      }),
      txt(
        'Normalized across features of this one token  ·  residual copy stays intact',
        0,
        408,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity((0.5 + 0.5 * bg) * alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.stream), title, eq, mainLayer);

  playCue(s, c, 'norm-mean', (d) => s.play(showMean.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'center-row', (d) => s.play(centerProg.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'norm-statistic', (d) => s.play(showScale.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'rescale-row', (d) => s.play(rescaleProg.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'norm-branch', (d) => s.play(branchGlow.to(1, { duration: d })), { dur: 0.7 });
}
