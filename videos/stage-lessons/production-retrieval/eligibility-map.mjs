// Pure-cinema magnified two-clock eligibility plot (staleDays vs signalHours)
// with glowing inclusive cyan limits (d <= 14, h <= 48), translucent emerald feasible quadrant,
// and live animated gold request beacon. Pure dark-cinema renderer.
import { line, polygon } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RULE,
  glowDot,
  glowRing,
  glowingTrail,
  hexAlpha,
  markDecoration,
  rule,
  txt,
} from './parts.mjs';

/**
 * Draw a pure-cinema magnified two-clock eligibility region directly inside a dynamic layer.
 * `x0, y0` = top-left of plot area, `w, h` = plot dimensions.
 * `staleDays`, `signalHours` = live coordinates of Luna's request photon.
 */
export function renderEligibilityMap({
  x0 = -805,
  y0 = -215,
  w = 790,
  h = 490,
  staleDays = RULE.requestDays,
  signalHours = RULE.requestHours,
  showPoint = 1,
  showDayLimit = 1,
  showHourLimit = 1,
  showRegion = 1,
  pulse = 1,
  opacity = 1,
} = {}) {
  const xMin = 9;
  const xMax = 17;
  const yMin = 45;
  const yMax = 51;

  const px = (d) => x0 + ((d - xMin) / (xMax - xMin)) * w;
  const py = (hr) => y0 + h - ((hr - yMin) / (yMax - yMin)) * h;

  const nodes = [];

  // Subtle glowing coordinate grid (marked decoration so ambient lines never crowd labels)
  for (let d = xMin; d <= xMax; d++) {
    const gx = px(d);
    nodes.push(
      markDecoration(
        line([gx, y0], [gx, y0 + h], {
          stroke: d === RULE.days ? hexAlpha(ROLE.policy, 0.35) : '#1e2b48',
          width: d === RULE.days ? 2 : 1.3,
        }).opacity(opacity),
      ),
    );
    if (d % 2 === 1 || d === RULE.days || d === 10) {
      nodes.push(
        txt(
          String(d),
          gx,
          y0 + h + 32,
          26,
          d === RULE.days ? ROLE.policy : COSMOS.muted,
          'mono',
          'center',
        ).opacity(opacity),
      );
    }
  }
  for (let hr = yMin; hr <= yMax; hr++) {
    const gy = py(hr);
    nodes.push(
      markDecoration(
        line([x0, gy], [x0 + w, gy], {
          stroke: hr === RULE.hours ? hexAlpha(ROLE.policy, 0.35) : '#1e2b48',
          width: hr === RULE.hours ? 2 : 1.3,
        }).opacity(opacity),
      ),
    );
    nodes.push(
      txt(
        String(hr),
        x0 - 24,
        gy,
        26,
        hr === RULE.hours ? ROLE.policy : COSMOS.muted,
        'mono',
        'right',
      ).opacity(opacity),
    );
  }

  // Main axes
  nodes.push(
    rule(x0, y0 + h, x0 + w, y0 + h, COSMOS.muted, 2.5).opacity(opacity * 0.9),
    rule(x0, y0, x0, y0 + h, COSMOS.muted, 2.5).opacity(opacity * 0.9),
    txt('Risk signal age (hours)', x0, y0 - 38, 28, COSMOS.ink, 'sans', 'left').opacity(opacity),
    txt(
      'Stale key age (days)',
      x0 + w * 0.5,
      y0 + h + 78,
      28,
      COSMOS.ink,
      'sans',
      'center',
    ).opacity(opacity),
  );

  const corner = [px(RULE.days), py(RULE.hours)];
  const lowerEdge = [px(RULE.days), py(yMin)];
  const leftEdge = [px(xMin), py(RULE.hours)];
  const originPt = [px(xMin), py(yMin)];

  // Translucent emerald/cyan feasible quadrant
  if (showRegion > 0.02) {
    nodes.push(
      polygon([originPt, lowerEdge, corner, leftEdge], {
        fill: hexAlpha(ROLE.admitted, 0.16 * showRegion * opacity),
        stroke: null,
      }),
      txt('ELIGIBLE ZONE', originPt[0] + 24, originPt[1] - 32, 28, ROLE.admitted, 'mono', 'left')
        .glow(6, ROLE.admitted)
        .opacity(showRegion * opacity * 0.88),
    );
  }

  // Right vertical day limit (d <= 14)
  if (showDayLimit > 0.02) {
    nodes.push(
      glowingTrail([lowerEdge, corner], {
        color: ROLE.policy,
        width: 5.0,
        glow: 10,
        opacity: showDayLimit * opacity,
        core: true,
      }),
      txt('14d max', corner[0], y0 - 38, 26, ROLE.policy, 'mono', 'center').opacity(
        showDayLimit * opacity,
      ),
    );
  }

  // Top horizontal signal limit (h <= 48)
  if (showHourLimit > 0.02) {
    nodes.push(
      glowingTrail([leftEdge, corner], {
        color: ROLE.policy,
        width: 5.0,
        glow: 10,
        opacity: showHourLimit * opacity,
        core: true,
      }),
      txt('48h max', x0 + w - 8, corner[1] - 28, 26, ROLE.policy, 'mono', 'right').opacity(
        showHourLimit * opacity,
      ),
    );
  }

  // Inclusive corner gem (14, 48)
  if (showDayLimit > 0.02 && showHourLimit > 0.02) {
    const cornerAlpha = Math.min(showDayLimit, showHourLimit) * opacity;
    nodes.push(
      glowDot(corner[0], corner[1], {
        radius: 7,
        color: ROLE.policy,
        glow: 11,
        opacity: cornerAlpha,
      }),
    );
  }

  // Live request photon (coordinate gridlines already mark exact integer readings)
  if (showPoint > 0.02) {
    const mx = px(staleDays);
    const my = py(signalHours);
    const isInside = staleDays <= RULE.days + 1e-6 && signalHours <= RULE.hours + 1e-6;
    const dotColor = showRegion > 0.2 ? (isInside ? ROLE.focus : ROLE.danger) : ROLE.focus;
    nodes.push(
      glowRing(mx, my, 24, dotColor, {
        width: 3.2,
        glow: 10 * pulse,
        fillAlpha: 0.12,
        opacity: showPoint * opacity,
      }),
      glowDot(mx, my, {
        radius: 10,
        color: dotColor,
        glow: 14 * pulse,
        opacity: showPoint * opacity,
      }),
    );
  }

  return { nodes, px, py, corner };
}
