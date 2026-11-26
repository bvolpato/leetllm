// Pure-cinema glowing signal-channel helper for agent <-> controller exchanges.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  actorOrb,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  glowingTrail,
  hexAlpha,
  txt,
} from './parts.mjs';

/**
 * Draws a luminous two-rail agent <-> controller optical channel.
 * Returns static rails + helper draw functions for animated packets along lanes.
 */
export function drawOpticalChannel({
  ax = -660,
  cx = 640,
  topY = -120,
  botY = 175,
  agentLabel = 'Agent',
  agentSub = 'rb-842-1',
  ctrlLabel = 'Controller',
  ctrlSub = 'SQLite + Queue',
  alpha = 1,
  agentActive = false,
  ctrlActive = false,
} = {}) {
  const nodes = [
    // Upper request guide wire
    glowArrow(ax + 115, topY, cx - 115, topY, hexAlpha(ROLE.agent, 0.45 * alpha), {
      width: 2.6,
      alpha,
      glow: 3,
    }),
    // Lower reply guide wire
    glowArrow(cx - 115, botY, ax + 115, botY, hexAlpha(ROLE.controller, 0.45 * alpha), {
      width: 2.6,
      alpha,
      glow: 3,
    }),
    // Actor orbs
    actorOrb(ax, topY, 64, ROLE.agent, agentLabel, agentSub, { alpha, active: agentActive }),
    actorOrb(cx, topY, 72, ROLE.controller, ctrlLabel, ctrlSub, { alpha, active: ctrlActive }),
  ];
  return group(...nodes);
}

/** Draws a packet photon gliding from x1 to x2 along y at fraction t (0..1). */
export function drawPacket({ x1, x2, y, t, color, label = '', lostAt = null, alpha = 1 }) {
  if (t <= 0.01) return [];
  const capT = lostAt !== null ? Math.min(t, lostAt) : Math.min(1, t);
  const px = x1 + (x2 - x1) * capT;
  const loX = Math.min(x1, x2) + 210;
  const hiX = Math.max(x1, x2) - 210;
  const pillX = Math.max(loX, Math.min(hiX, px));
  const nodes = [
    glowingTrail(
      [
        [x1, y],
        [px, y],
      ],
      { color, width: 5.5, glow: 10, opacity: alpha },
    ),
    glowDot(px, y, { radius: 11, color, glow: 14, opacity: alpha }),
  ];
  if (label) {
    nodes.push(glowPill(label, pillX, y - 58, color, { size: 26, alpha }));
  }
  if (lostAt !== null && t >= lostAt - 0.02) {
    const lx = x1 + (x2 - x1) * lostAt;
    nodes.push(glowCross(lx, y, 36, ROLE.fail, alpha));
  }
  return nodes;
}

export { COSMOS, txt };
