import kitchen from '../../../director-cuts/lessons/hybrid-search/film.mjs';
import { books, query, result, transfer, votes } from './evidence.mjs';
import {
  box,
  cue,
  done,
  ease,
  field,
  fileIcon,
  grid,
  head,
  ink,
  key,
  label,
  line,
  mix,
  muted,
  orange,
  pale,
  plate,
  policy,
  ranks,
  rect,
  serif,
  teal,
  text,
} from './art.mjs';

export function cookbook(c, t) {
  const b = t.beat.beatIndex;
  if (b < kitchen.beats.length) {
    c.save();
    c.scale(1 / 1.6, 1 / 1.6);
    kitchen.draw(c, { ...t, index: b });
    c.restore();
    return;
  }
  field(c);
  head(c, 'Context budget', 'What bought the instruction?');
  const ordered = result(books, 60);
  const keep = ordered.slice(0, 2);
  label(c, 'FIXED FUSED ORDER', 66, 209);
  label(c, 'TWO PASSAGES ON THE DOOR', 655, 209);
  ordered.forEach((row, i) => {
    const y = 245 + i * 92;
    label(c, i + 1, 67, y + 28, 22);
    serif(c, row.id, 117, y + 28, 34);
    label(c, row.score.toFixed(5), 405, y + 28, 22);
  });
  keep.forEach((row, i) => {
    const y = 245 + i * 108;
    box(c, 655, y, 485, 86, 3, i ? '#e1e5db' : pale, grid, 1);
    label(c, row.id, 673, y + 25, 16, i ? teal : orange);
    text(c, i ? 'Refrigerate the dough overnight.' : 'Mix flour and water.', 673, y + 58, 28, ink, {
      family: 'Serif',
    });
  });
  label(c, 'Required source in context   1 / 1', 66, 568, 23, teal);
}
export const checkKitchen = () => kitchen.check();

export function finalState(t) {
  const depth = done(t, 2, 'Each third place') ? 3 : 2;
  const travel = depth === 3 ? ease(cue(t, 2, 'Both votes go', 1.1)) : 0;
  const resolved = done(t, 2, 'A bigger fused pool');
  return {
    depth,
    travel,
    resolved,
    order: result(transfer, 10, depth),
    parts: votes(transfer, 10, 'Key', depth),
  };
}
export function practice(c, t) {
  const b = t.beat.beatIndex;
  field(c);
  if (b < 3) {
    const { depth, travel, resolved, order, parts } = finalState(t);
    label(c, 'LUNA’S SEARCH    /    FIVE PERMITTED PASSAGES', 61, 52, 16, teal);
    serif(c, 'stale key rotation', 59, 113, 51);
    label(c, 'Fusion constant 10', 857, 106, 18, muted);
    const x = 61,
      y = 209,
      col = 266,
      row = 100;
    ranks(c, transfer, { x, y, col, row, depth, k: 10, showVotes: false });
    for (const [i, lane] of transfer.entries()) {
      for (const [j, id] of lane.entries()) {
        const cy = y + j * row + (row - 10) / 2;
        if (j < depth && !(j === 2 && travel > 0))
          label(c, '1/' + (10 + j + 1), x + (i + 1) * col - 30, cy, 20, i ? orange : teal, 'right');
      }
    }
    const cut = y + depth * row - 5;
    line(
      c,
      [
        [x - 4, cut],
        [x + col * 2 - 13, cut],
      ],
      orange,
      3,
    );
    label(c, 'Return depth ' + depth + ' in each lane', x, 522, 21, orange);
    // Each rank share travels into its own socket on a single passage tag.
    const sx = 703,
      sy = 210,
      sw = 425,
      sh = 164;
    box(c, sx, sy, sw, sh, 14, '#e5e2cc', '#718779', 2);
    box(c, sx + 10, sy + 11, sw - 20, sh - 22, 10, null, '#a0ad99', 1);
    label(c, 'ANSWER CONTEXT   /   1 SLOT', sx, sy - 35, 19, muted);
    if (resolved) {
      box(c, sx + 20, sy + 23, sw - 40, sh - 45, 8, pale, teal, 2);
      fileIcon(c, order[0].id, sx + 59, sy + 73, 0.95, teal);
      serif(c, order[0].id + ' rule', sx + 107, sy + 74, 37);
      label(c, '1/13 + 1/13 ≈ ' + order[0].score.toFixed(5), sx + 39, sy + 112, 20, teal);
    } else {
      label(c, '?', sx + sw / 2, sy + 69, 43, muted, 'center');
      if (travel > 0) {
        box(c, sx, 418, sw, 104, 5, pale, teal, 1.5);
        label(c, 'Key   /   contributions to one ID', sx + 19, 443, 17, teal);
        parts.forEach((v, i) => {
          const p = travel,
            tx = mix(x + i * col + col - 87, sx + 60 + i * 181, p),
            ty = mix(y + 2 * row + 45, 487, p) + 32 * Math.sin(p * Math.PI);
          box(c, tx - 12, ty - 23, 108, 45, 5, i ? '#f2d5bb' : '#c9e4d0', i ? orange : teal, 2);
          label(c, '1/' + Math.round(1 / v), tx + 42, ty, 24, i ? orange : teal, 'center');
        });
      }
    }
    if (depth === 2) label(c, 'Reference rank 3 is visible below the cut.', x, 546, 20, muted);
    if (depth === 3) {
      const winnerSpoken = done(t, 2, 'Key wins');
      const combinedAt = t.wordCue('Both votes go to the same passage ID').end;
      const competitorAt = t.wordCue('The best single vote is one eleventh').end;
      if (!resolved && travel === 1 && t.elapsed >= combinedAt) {
        const total = parts[0] + parts[1];
        label(c, 'Key total    2/13 ≈ ' + total.toFixed(5), sx, 396, 19, teal);
      }
      if (winnerSpoken || t.elapsed >= competitorAt) {
        const competitor = order.find(row => row.id !== 'Key');
        label(c, 'Best singleton    1/11 ≈ ' + competitor.score.toFixed(5), sx, 542, 19, muted);
      }
    }
    return;
  }
  label(c, 'LUNA’S ORIGINAL SEARCH   /   THREE ELIGIBLE PASSAGES', 61, 51, 16, teal);
  serif(c, query, 59, 110, 44);
  const reveal = done(t, 4, 'Luna can automate'),
    highlighted = done(t, 4, 'The session rule');
  label(c, 'Word search   [ ]', 63, 183, 20, teal);
  label(c, 'Vector search   Key, Session', 430, 183, 20, orange);
  label(c, 'Shortlist   2', 971, 183, 20, ink);
  policy(c, 60, 232, 570, 316, { small: true, focus: highlighted });
  plate(c, 661, 232, 483, 316);
  rect(c, 661, 232, 17, 316, '#728782');
  label(c, 'EU SUPPORT   /   CURRENT RULE', 706, 267, 14, muted);
  line(
    c,
    [
      [706, 292],
      [1112, 292],
    ],
    grid,
  );
  serif(c, 'Session rule', 705, 347, 36);
  text(c, 'Idle browser sessions expire', 705, 420, 25);
  text(c, 'after 30 days of inactivity.', 705, 460, 25);
  if (reveal) {
    line(
      c,
      [
        [61, 561],
        [629, 561],
      ],
      teal,
      5,
    );
    label(c, 'Selected for automated rotation', 61, 599, 21, teal);
  } else label(c, 'Which passage gives both conditions for automated rotation?', 61, 596, 23, ink);
}
