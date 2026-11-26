// Shared parent-ordered frontier merge renderer for `claim-failure` and `fresh-worker-plan`.
// Pure dark-cinema primitives (cinematic-kit only, zero em dashes, text >= 26px).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bufferedFrontier,
  glowArrow,
  glowDot,
  glowPill,
  hexAlpha,
  traceFrontier,
  txt,
} from './parts.mjs';

export { bufferedFrontier, traceFrontier };

/**
 * Draw the two-parent frontier admission canvas:
 * Left: Parent order (1, 2) with active cursor indicator.
 * Center: Each parent's raw callback links (showing claimed / skipped / raw states).
 * Right: Next FIFO queue slots (0 = front, 1, 2) strictly populated only when revealed!
 */
export function drawFrontierMerge({
  parents,
  alpha = 1,
  showRow0 = false,
  showRow1 = false,
  row0States = ['raw', 'raw'], // 'raw' | 'claimed' | 'skip'
  row1States = ['raw', 'raw'],
  queueSlots = [null, null, null], // [{ path, color } | null]
  cursorParent = -1, // -1 hidden, 0 = parent 1, 1 = parent 2
  highlightSlot = -1,
  modeLabel = '',
}) {
  const nodes = [];
  const pCols = [ROLE.workerA, ROLE.workerB];
  const rowYs = [-145, 75];

  // Column headers (floating uppercase mono, zero box chrome)
  nodes.push(
    txt('PARENT ORDER', -730, -278, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    txt('CALLBACK LINKS', -220, -278, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    txt('NEXT QUEUE (FIFO)', 520, -278, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
  );

  if (modeLabel) {
    nodes.push(txt(modeLabel, 0, -342, 26, ROLE.workerB, 'mono', 'center').opacity(alpha));
  }

  // Parent rows and link pills
  const rowVisible = [showRow0, showRow1];
  const rowStates = [row0States, row1States];

  parents.forEach((p, idx) => {
    const ry = rowYs[idx];
    const col = pCols[idx];
    const isActiveParent = cursorParent === idx;

    // Cursor dot beside active parent
    if (isActiveParent) {
      nodes.push(glowDot(-852, ry, { radius: 11, color: ROLE.focus, glow: 14, opacity: alpha }));
    }

    // Parent badge
    nodes.push(
      glowPill(`${idx + 1}.  ${p.path}`, -715, ry, col, {
        size: 27,
        fixedW: 225,
        alpha,
        glow: isActiveParent ? 12 : 5,
      }),
      glowArrow(-595, ry, -495, ry, hexAlpha(col, 0.7 * alpha), { width: 3, alpha, glow: 4 }),
    );

    // Two link slots per parent
    const linkYs = [ry - 42, ry + 42];
    p.links.forEach((raw, j) => {
      const ly = linkYs[j];
      const st = rowStates[idx][j];
      if (!rowVisible[idx]) {
        nodes.push(
          txt('waiting...', -220, ly, 26, COSMOS.dim, 'mono', 'center').opacity(0.6 * alpha),
        );
      } else if (st === 'skip') {
        nodes.push(
          glowPill(`skip  ${raw}`, -220, ly, COSMOS.dim, {
            size: 26,
            fixedW: 480,
            alpha: 0.72 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),
        );
      } else if (st === 'claimed') {
        nodes.push(
          glowPill(`${raw}  [claimed]`, -220, ly, ROLE.ok, {
            size: 26,
            fixedW: 480,
            alpha,
            glow: 9,
          }),
        );
      } else {
        nodes.push(
          glowPill(raw, -220, ly, col, {
            size: 27,
            fixedW: 480,
            alpha,
            glow: 6,
          }),
        );
      }
    });
  });

  // Subtle vertical handoff separator
  nodes.push(
    line([110, -240], [110, 210], { stroke: '#2c3a5e', width: 2.2, dash: [8, 8] }).opacity(
      0.7 * alpha,
    ),
    glowArrow(135, -35, 250, -35, ROLE.focus, { width: 3.5, alpha: 0.75 * alpha }),
  );

  // Right column: 3 FIFO queue slots
  const qYs = [-155, -25, 105];
  const slotTags = ['FRONT', 'SLOT 2', 'SLOT 3'];
  qYs.forEach((qy, i) => {
    const item = queueSlots[i];
    const isHi = highlightSlot === i;
    nodes.push(
      txt(slotTags[i], 305, qy, 26, i === 0 ? ROLE.focus : COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );
    if (item) {
      nodes.push(
        glowPill(item.path, 575, qy, isHi ? ROLE.focus : item.color, {
          size: 29,
          fixedW: 360,
          alpha,
          glow: isHi ? 14 : 8,
        }),
      );
    } else {
      nodes.push(
        glowPill('?', 575, qy, COSMOS.dim, {
          size: 28,
          fixedW: 360,
          alpha: 0.55 * alpha,
          glow: 0,
          textColor: COSMOS.muted,
        }),
      );
    }
  });

  return nodes;
}
