// Pure-cinema risk constellation (100 luminous probability-mass orbs) and
// glowing return ruler shared by `uncertain-transition` and `reward-design`.
import { circle, line } from 'vizmatic/stage';
import { COSMOS, ROLE, evidenceValue, glowDot, glowingTrail, returns, txt } from './parts.mjs';

export function sign(value) {
  return value < 0 ? `-${Math.abs(value)}` : `+${value}`;
}

export function modelMix(percent) {
  const replyShare = (100 - percent) / 100;
  const leaveShare = percent / 100;
  return `${Number(replyShare.toFixed(4))} × ${returns.evidence} + ${Number(leaveShare.toFixed(4))} × (-54)`;
}

/**
 * Draw the 10x10 luminous probability-mass constellation (100 glowing orbs = 1% each).
 * Supports fractional break-even percentage (e.g. 4.42%) and an optional gold halo on a cell.
 */
export function drawRiskConstellation(
  percent,
  { cx = -465, cy = 40, spacing = 54, orbRadius = 15, highlightIndex = -1, alpha = 1 } = {},
) {
  const nodes = [];
  const startX = cx - 4.5 * spacing;
  const startY = cy - 4.5 * spacing;

  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10);
    const col = i % 10;
    const x = startX + col * spacing;
    const y = startY + r * spacing;
    const leaveFrac = Math.max(0, Math.min(1, percent - i));

    if (leaveFrac >= 0.99) {
      nodes.push(
        glowDot(x, y, {
          radius: orbRadius,
          color: ROLE.approve,
          glow: 9,
          opacity: 0.92 * alpha,
        }),
      );
    } else if (leaveFrac <= 0.01) {
      nodes.push(
        glowDot(x, y, {
          radius: orbRadius,
          color: ROLE.evidence,
          glow: 7,
          opacity: 0.85 * alpha,
        }),
      );
    } else {
      // Partial orb at exact break-even 4.42%
      nodes.push(
        glowDot(x, y, {
          radius: orbRadius,
          color: ROLE.evidence,
          glow: 7,
          opacity: 0.72 * alpha,
        }),
        glowDot(x, y, {
          radius: Math.max(5, orbRadius * Math.sqrt(leaveFrac)),
          color: ROLE.gold,
          glow: 12,
          opacity: alpha,
        }),
      );
    }

    if (i === highlightIndex) {
      nodes.push(
        circle(orbRadius + 8, {
          fill: null,
          stroke: ROLE.gold,
          width: 3.4,
        })
          .at(x, y)
          .glow(10, ROLE.gold)
          .opacity(alpha),
      );
    }
  }

  const fmtPct = (v) => `${Number(v.toFixed(2))}%`;
  nodes.push(
    txt(
      `${fmtPct(100 - percent)} verified reply`,
      cx - 140,
      startY + 9 * spacing + 64,
      28,
      ROLE.evidence,
      'mono',
      'center',
    ).opacity(alpha),
    txt(
      `${fmtPct(percent)} leave`,
      cx + 175,
      startY + 9 * spacing + 64,
      28,
      ROLE.approve,
      'mono',
      'center',
    ).opacity(alpha),
  );

  return nodes;
}

/**
 * Draw the glowing horizontal Expected Return Ruler with Review 54 benchmark beam,
 * optional ghost tick, and live Ask photon marker (strictly hidden when showMarker is false).
 */
export function drawReturnRuler(
  percent,
  {
    x0 = 40,
    x1 = 830,
    y = 145,
    min = 27,
    max = 63,
    ticks = [30, 40, 50, 60],
    showReview = true,
    showMarker = false,
    showRegions = false,
    prevValue = null,
    prevLabel = '',
    alpha = 1,
  } = {},
) {
  const xOf = (val) => x0 + ((x1 - x0) * (val - min)) / (max - min);
  const nodes = [];

  // Base glowing rail
  nodes.push(line([x0, y], [x1, y], { stroke: '#3a4a70', width: 4.5 }).opacity(alpha));

  // Optional decision-region highlight beams on the ruler
  const revX = xOf(returns.review);
  if (showRegions) {
    nodes.push(
      glowingTrail(
        [
          [x0, y],
          [revX, y],
        ],
        { color: ROLE.review, width: 6, glow: 8, opacity: 0.72 * alpha, core: false },
      ),
      glowingTrail(
        [
          [revX, y],
          [x1, y],
        ],
        { color: ROLE.evidence, width: 6, glow: 8, opacity: 0.72 * alpha, core: false },
      ),
    );
  }

  // Axis ticks (skip plain dim tick label on 54 when Review 54 benchmark beam occupies that x!)
  for (const t of ticks) {
    const tx = xOf(t);
    nodes.push(
      line([tx, y], [tx, y + 14], { stroke: COSMOS.muted, width: 2.5 }).opacity(0.8 * alpha),
    );
    if (!(showReview && t === returns.review)) {
      nodes.push(
        txt(String(t), tx, y + 44, 26, COSMOS.muted, 'mono', 'center').opacity(0.85 * alpha),
      );
    }
  }

  // Review 54 vertical benchmark beam (strictly below the rail so Ask labels above never cross it!)
  if (showReview) {
    nodes.push(
      line([revX, y - 14], [revX, y + 64], {
        stroke: ROLE.review,
        width: 3.8,
        dash: [9, 6],
      })
        .glow(8, ROLE.review)
        .opacity(alpha),
      txt(`Review ${returns.review}`, revX, y + 98, 30, ROLE.review, 'mono', 'center')
        .glow(5, ROLE.review)
        .opacity(alpha),
    );
  }

  // Optional faint ghost marker from previous abandonment rate (e.g. 4% -> 54.48)
  if (prevValue !== null) {
    const px = xOf(prevValue);
    nodes.push(
      line([px, y - 22], [px, y + 12], { stroke: COSMOS.dim, width: 3.2 }).opacity(alpha),
      txt(prevLabel, px, y - 148, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );
  }

  // Live Ask photon marker & readout
  if (showMarker) {
    const val = evidenceValue(percent / 100);
    const ax = xOf(Math.max(min, Math.min(max, val)));
    const isTie = Math.abs(val - returns.review) < 0.08;
    const mColor = isTie ? ROLE.gold : ROLE.evidence;
    nodes.push(
      line([ax, y - 50], [ax, y], { stroke: mColor, width: 3.2 }).opacity(0.85 * alpha),
      glowDot(ax, y, { radius: 13, color: mColor, glow: 14, opacity: alpha }),
      txt(
        `Ask ${Number(val.toFixed(2))}`,
        Math.max(x0 + 100, Math.min(x1 - 100, ax)),
        y - 84,
        34,
        mColor,
        'mono',
        'center',
      )
        .glow(7, mColor)
        .opacity(alpha),
    );
  }

  return nodes;
}
