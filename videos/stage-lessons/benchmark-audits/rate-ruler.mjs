// Pure-cinema Wilson confidence-interval rate ruler on a glowing 0%..100% scale.
import { COSMOS, glowDot, glowingTrail, lumBar, rule, txt } from './parts.mjs';

/**
 * Render a pure-cinema Wilson confidence-interval ruler centered at `(left..right, cy)`.
 * Every text node respects >= 26 px readability and zero slide-box chrome.
 */
export function drawRateRuler({
  left,
  right,
  cy,
  interval,
  observed,
  floor = 0.95,
  showObserved = 1,
  showInterval = 1,
  showFloor = 1,
  showLower = 1,
  label = '',
  opacity = 1,
  pulse = 1,
}) {
  const atX = (rate) => left + Math.max(0, Math.min(1, rate)) * (right - left);
  const nodes = [
    // Subtle full-span 0..100% track rail
    rule(left, cy, right, cy, COSMOS.rule, 3.0).opacity(opacity * 0.85),
    rule(left, cy - 8, left, cy + 8, COSMOS.muted, 2.2).opacity(opacity * 0.7),
    rule(right, cy - 8, right, cy + 8, COSMOS.muted, 2.2).opacity(opacity * 0.7),
  ];

  if (label) {
    nodes.push(txt(label, left - 26, cy, 32, COSMOS.ink, 'mono', 'right').opacity(opacity));
  }

  // Required release floor laser line
  if (showFloor > 0.02) {
    const fx = atX(floor);
    nodes.push(
      glowingTrail(
        [
          [fx, cy - 42],
          [fx, cy + 42],
        ],
        {
          color: COSMOS.gold,
          width: 3.4,
          glow: 9,
          opacity: opacity * showFloor,
          core: false,
        },
      ),
    );
  }

  // Luminous Wilson whisker band + end caps
  if (showInterval > 0.02) {
    const lx = atX(interval.low);
    const hx = atX(interval.high);
    const clears = interval.low >= floor;
    const bandColor = clears ? COSMOS.emerald : COSMOS.cyan;
    const bandW = Math.max(6, hx - lx);
    nodes.push(
      lumBar((lx + hx) * 0.5, cy, bandW, 18, {
        color: bandColor,
        fillOpacity: 0.48,
        strokeWidth: 2.2,
        glow: 10,
        radius: 6,
        opacity: opacity * showInterval,
      }),
      rule(lx, cy - 18, lx, cy + 18, bandColor, 3.5).opacity(opacity * showInterval),
      rule(hx, cy - 18, hx, cy + 18, bandColor, 3.5).opacity(opacity * showInterval),
    );
    if (showLower > 0.02) {
      nodes.push(
        glowDot(lx, cy, {
          radius: 9 + 1.5 * pulse,
          color: clears ? COSMOS.emerald : COSMOS.rose,
          glow: 14,
          opacity: opacity * showInterval * showLower,
        }),
      );
    }
  }

  // Observed pass rate photon dot
  if (showObserved > 0.02) {
    const ox = atX(observed);
    nodes.push(
      glowDot(ox, cy - 16, {
        radius: 8,
        color: COSMOS.blue,
        glow: 11,
        opacity: opacity * showObserved,
      }),
    );
  }

  return { nodes, atX };
}
