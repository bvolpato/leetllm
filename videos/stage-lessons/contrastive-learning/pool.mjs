// Pure Cinema denominator-pool visual engine for InfoNCE comparisons (zero prose cards).
// One horizontal unit ALWAYS equals one unit of centered exponential mass exp((s - s_max) / tau).
import { dot, group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, glowDot, hexAlpha, lumBar, rule, txt } from './parts.mjs';

/**
 * Render the glowing candidate cosine + mass header row and equal-scale denominator tracks.
 * Returns reusable coordinate helpers and pure-cinema render functions for dynamic or static layers.
 */
export function poolGeometry({
  query,
  names,
  colors,
  scores,
  all,
  tau,
  topY = -305,
  track1Y = 20,
  track2Y = 185,
  footY = 365,
} = {}) {
  const trackLeft = -830;
  const trackWidth = 1040;
  const unit = trackWidth / 2.15;
  const readoutX = 310;
  const colXs = [-560, 0, 560];

  function headerBar(opacity = 1) {
    return group(
      txt(query, -850, topY - 12, 34, ROLE.anchor, 'sans', 'left')
        .glow(5, ROLE.anchor)
        .opacity(opacity),
      txt(`τ = ${tau.toFixed(2)}`, 850, topY - 12, 34, ROLE.focus, 'mono', 'right')
        .glow(5, ROLE.focus)
        .opacity(opacity),
      rule(-850, topY + 24, 850, topY + 24, COSMOS.rule, 1.8).opacity(0.65 * opacity),
    );
  }

  function candidateRow({ showMass = true, opacity = 1, highlightIdx = -1 } = {}) {
    const nodes = [];
    for (let i = 0; i < names.length; i++) {
      const cx = colXs[i];
      const col = colors[i];
      const hi = highlightIdx === i;
      nodes.push(
        glowDot(cx - 195, topY + 72, {
          radius: hi ? 9 : 7,
          color: col,
          glow: hi ? 14 : 9,
          opacity,
        }),
        txt(names[i], cx - 172, topY + 72, 32, col, 'sans', 'left')
          .glow(hi ? 6 : 0, col)
          .opacity(opacity),
        txt(
          `cos ${scores[i].toFixed(3)}`,
          cx - 172,
          topY + 116,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(opacity),
      );
      if (showMass) {
        nodes.push(
          txt(
            `mass ${all.masses[i].toFixed(4)}`,
            cx + 15,
            topY + 116,
            28,
            col,
            'mono',
            'left',
          ).opacity(opacity),
        );
      }
    }
    return group(...nodes);
  }

  /**
   * Render one equal-scale denominator strip at `y`.
   * `weights` can be animated floats [w0, w1, w2] so removing a candidate smoothly shrinks & slides!
   */
  function stripView({
    y,
    caption,
    row,
    masses = row.masses,
    showSegments = true,
    showResult = true,
    resultMode = 'share',
    opacity = 1,
    captionColor = COSMOS.ink,
  }) {
    const nodes = [];
    // Caption cleanly above bar track
    nodes.push(txt(caption, trackLeft, y - 58, 30, captionColor, 'sans', 'left').opacity(opacity));

    // Equal-scale unit axis rail + 0, 1, 2 ticks
    const railY = y + 36;
    nodes.push(
      line([trackLeft, railY], [trackLeft + trackWidth, railY], {
        stroke: '#4d6394',
        width: 2.2,
      }).opacity(opacity),
    );
    for (const tick of [0, 1, 2]) {
      const tx = trackLeft + tick * unit;
      nodes.push(
        line([tx, railY - 8], [tx, railY + 9], { stroke: '#7289be', width: 2.2 }).opacity(opacity),
        txt(String(tick), tx, railY + 30, 26, COSMOS.dim, 'mono', 'center').opacity(opacity),
      );
    }

    if (showSegments) {
      let cursor = trackLeft;
      for (let i = 0; i < masses.length; i++) {
        const m = masses[i];
        if (m <= 0.0005) continue;
        const w = Math.max(5, m * unit);
        const cx = cursor + w * 0.5;
        nodes.push(
          lumBar(cx, y, w - 3, 46, {
            color: colors[i],
            fillAlpha: 0.44,
            strokeWidth: 2.4,
            glow: 9,
            radius: 6,
            opacity,
          }),
        );
        if (w >= 95) {
          nodes.push(txt(m.toFixed(2), cx, y, 26, COSMOS.ink, 'mono', 'center').opacity(opacity));
        }
        cursor += w;
      }
      // Subtle total-mass vertical marker
      nodes.push(dot(4.5, COSMOS.gold).at(cursor, railY).glow(8, COSMOS.gold).opacity(opacity));
    }

    if (showResult) {
      const frac = `${Number(row.masses[0].toFixed(4))} / ${row.sum.toFixed(4)}`;
      const sharePct = `${(row.probs[0] * 100).toFixed(1)}%`;
      nodes.push(
        txt(frac, readoutX, y - 16, 30, COSMOS.muted, 'mono', 'left').opacity(opacity),
        txt(
          resultMode === 'loss'
            ? `share ${sharePct}   L = ${row.loss.toFixed(3)}`
            : `target share ${sharePct}`,
          readoutX,
          y + 26,
          32,
          colors[0],
          'mono',
          'left',
        )
          .glow(6, colors[0])
          .opacity(opacity),
      );
    }

    return group(...nodes);
  }

  function footerLine(textVal, color = COSMOS.ink, size = 34, font = 'sans', opacity = 1) {
    return txt(textVal, 0, footY, size, color, font, 'center')
      .glow(
        color === COSMOS.gold || color === ROLE.positive || color === ROLE.competitor ? 5 : 0,
        color,
      )
      .opacity(opacity);
  }

  return {
    trackLeft,
    trackWidth,
    unit,
    readoutX,
    track1Y,
    track2Y,
    footY,
    headerBar,
    candidateRow,
    stripView,
    footerLine,
  };
}

export { hexAlpha };
