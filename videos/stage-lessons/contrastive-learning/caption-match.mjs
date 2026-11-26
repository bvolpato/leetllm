// Pure Cinema query-to-caption constellation matching engine (zero prose cards).
import { group } from 'vizmatic/stage';
import { COSMOS, ROLE, glowArc, glowDot, glowRing, lumBar, txt } from './parts.mjs';

export const QUERY = 'A dog is running';
export const CAPTIONS = Object.freeze(['A puppy runs', 'A dog sleeps', 'The sky is blue']);

/**
 * Floating luminous query orb on the left connected by glowing Bezier arcs
 * to three floating caption lanes with softmax share bars on the right.
 */
export function cinemaCaptionMatch({
  queryX = -560,
  queryY = 10,
  laneX = 110,
  laneYs = [-190, 10, 210],
  shares = null,
  colors = [ROLE.positive, ROLE.competitor, ROLE.unrelated],
  activeLinks = [],
  ruleTitle = '',
  ruleSub = '',
  opacity = 1,
} = {}) {
  const nodes = [];

  // Query focal orb + floating label
  nodes.push(
    glowRing(queryX, queryY, 44, ROLE.anchor, { width: 3.5, glow: 12, fillAlpha: 0.16, opacity }),
    glowDot(queryX, queryY, { radius: 9, color: '#ffffff', glow: 12, opacity }),
    txt('SEARCH QUERY', queryX, queryY - 96, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
    txt(`"${QUERY}"`, queryX, queryY + 86, 36, ROLE.anchor, 'serif', 'center')
      .glow(6, ROLE.anchor)
      .opacity(opacity),
  );

  if (ruleTitle) {
    nodes.push(
      txt(ruleTitle, queryX, queryY + 165, 34, ROLE.focus, 'sans', 'center')
        .glow(5, ROLE.focus)
        .opacity(opacity),
    );
    if (ruleSub) {
      nodes.push(
        txt(ruleSub, queryX, queryY + 210, 26, COSMOS.muted, 'sans', 'center').opacity(opacity),
      );
    }
  }

  // Three floating caption lanes on right + proportional share gauges
  for (let i = 0; i < CAPTIONS.length; i++) {
    const cy = laneYs[i];
    const col = colors[i];
    const isLinked = activeLinks.some((l) => l.index === i);
    nodes.push(
      glowRing(laneX, cy, isLinked ? 20 : 14, col, {
        width: isLinked ? 3.5 : 2.2,
        glow: isLinked ? 11 : 6,
        fillAlpha: isLinked ? 0.28 : 0.14,
        opacity,
      }),
      txt(CAPTIONS[i], laneX + 38, cy - 12, 34, isLinked ? COSMOS.ink : col, 'sans', 'left')
        .glow(isLinked ? 5 : 0, col)
        .opacity(opacity),
    );

    if (shares) {
      const pct = shares[i];
      const barW = Math.max(8, pct * 340);
      nodes.push(
        lumBar(laneX + 38 + barW / 2, cy + 32, barW, 18, {
          color: col,
          fillAlpha: 0.45,
          strokeWidth: 1.8,
          glow: 7,
          radius: 5,
          opacity,
        }),
        txt(`${(pct * 100).toFixed(1)}%`, laneX + 398, cy + 30, 28, col, 'mono', 'left').opacity(
          opacity,
        ),
      );
    }
  }

  // Glowing Bezier match arcs from query orb to active caption orbs
  for (const link of activeLinks) {
    const cy = laneYs[link.index];
    const col = link.color ?? ROLE.positive;
    const lift = link.index === 0 ? -70 : link.index === 2 ? 70 : -15;
    nodes.push(
      glowArc([queryX + 48, queryY], [laneX - 24, cy], lift, {
        color: col,
        width: 4.8,
        glow: 11,
        opacity: (link.opacity ?? 1) * opacity,
      }),
    );
  }

  return group(...nodes);
}
