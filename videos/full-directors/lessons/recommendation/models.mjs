import {
  itemVectors,
  queryVector,
  TOWER_OBSERVED,
} from '../../../films/recommendation/fixtures.mjs';
import {
  dot,
  crossVectorState,
  crossMatrixState,
  rankNetStep,
  metricSwapState,
  lambdaPairLedger,
  listDistributionStep,
} from '../../../films/recommendation/arithmetic.mjs';
import { judgedListState, preferredPairs } from '../../../films/recommendation/model.mjs';
import {
  C,
  B,
  cue,
  base,
  heading,
  text,
  formula,
  rect,
  line,
  circle,
  arrow,
  book,
  spine,
  glyph,
  ids,
  doc,
  name,
  hue,
  frac,
} from './art.mjs';

const [guide, run, sdk, blog, log] = ids;
const pages = [guide, run, sdk, blog, log];
const vector = (a) => '[' + a.map((v) => Number(v.toFixed(4))).join(', ') + ']';
const bright = ['#72d7b0', '#e8bd60', '#d39acb'];
export function vectors(c, k) {
  base(c, true);
  heading(c, 'Search along the query direction', 'Two towers   /   dot-product retrieval', true);
  const x = 148,
    y = 874,
    w = 660,
    h = 549;
  for (let i = 0; i <= 5; i++) {
    line(
      c,
      [
        [x, y - (i * h) / 5],
        [x + w, y - (i * h) / 5],
      ],
      '#375253',
      2,
    );
    line(
      c,
      [
        [x + (i * w) / 5, y - h],
        [x + (i * w) / 5, y],
      ],
      '#375253',
      2,
    );
  }
  arrow(c, x, y, x + w + 64, y, C.muted);
  arrow(c, x, y, x, y - h - 48, C.muted);
  text(c, '1', x + w, y + 50, 30, C.muted, 'mono');
  text(c, '1', x - 48, y - h + 16, 30, C.muted, 'mono');
  text(c, 'Query [1, 0]', x + 350, y + 97, 36, C.gold, 'mono');
  text(c, '0', x - 39, y + 40, 30, C.muted, 'mono');
  const phase = cue(k, 2, 'Three item vectors'),
    projection = cue(k, 2, 'Their dot products', 0.6);
  // Start the numeric caption when the narrator gives the first score.
  cue(k, 2, '0.9, 0.8, and 0.2');
  const scoresKnown = B(k) > 2 || (B(k) === 2 && k.elapsed >= k.speechDuration);
  if (phase && !scoresKnown)
    text(c, 'Which page scores highest?', 1040, 272, 48, C.pale, 'serif');
  arrow(c, x, y, x + w, y, C.gold);
  itemVectors.forEach((d, i) => {
    const yy = 355 + i * 163,
      xx = x + d.vector[0] * w,
      Y = y - d.vector[1] * h;
    text(c, d.id, 1040, yy, 39, bright[i], 'serif');
    if (phase) {
      arrow(c, x, y, xx, Y, bright[i]);
      circle(c, xx, Y, 10, bright[i]);
      if (projection) {
        c.save();
        c.setLineDash([8, 9]);
        line(
          c,
          [
            [xx, Y],
            [xx, Y + (y - Y) * projection],
          ],
          bright[i],
          3,
        );
        c.restore();
      }
      formula(
        c,
        vector(d.vector) + (scoresKnown ? '   →   ' + frac(dot(queryVector, d.vector), 1) : ''),
        1042,
        yy + 66,
        760,
        41,
        C.pale,
      );
    } else {
      text(c, 'Item encoder', 1042, yy + 66, 34, C.muted);
    }
  });
}
export function catalog(c, k) {
  base(c, true);
  heading(
    c,
    'One query searches a frozen index',
    'Exact nearest neighbors   /   article fixture',
    true,
  );
  if (B(k) === 1 && cue(k, 1, 'Normalize both')) {
    const start = [221, 793],
      q = [1, 0],
      vectors = [
        [1, 1],
        [2, 2],
      ],
      scale = 167;
    arrow(c, ...start, start[0] + q[0] * scale, start[1] - q[1] * scale, C.gold);
    vectors
      .slice()
      .reverse()
      .forEach((v, i) => {
        const xx = start[0] + v[0] * scale,
          yy = start[1] - v[1] * scale;
        arrow(c, ...start, xx, yy, bright[i]);
        text(c, vector(v), xx + 29, yy + 10, 34, bright[i], 'mono');
      });
    text(c, 'Query [1, 0]', 221, 873, 35, C.gold, 'mono');
    text(c, 'Same angle, different lengths', 894, 366, 52, C.pale, 'serif', 'left', 913);
    vectors.forEach((v, i) => {
      const cosine = dot(q, v) / Math.hypot(...q) / Math.hypot(...v);
      formula(
        c,
        vector(v) + '    dot ' + dot(q, v) + '    cos ' + frac(cosine),
        890,
        512 + i * 138,
        914,
        38,
        C.pale,
      );
    });
    text(
      c,
      'Normalize both towers for cosine retrieval.',
      894,
      851,
      36,
      C.muted,
      'sans',
      'left',
      916,
    );
    return;
  }
  const t = TOWER_OBSERVED,
    selected = new Set(t.selected.map((d) => d.id)),
    show = cue(k, 2, 'Keep the top five');
  const x = 110,
    y = 339;
  for (let i = 0; i < t.catalogCount; i++) {
    const active = show && selected.has(i);
    rect(
      c,
      x + (i % 40) * 18,
      y + Math.floor(i / 40) * 18,
      active ? 15 : 11,
      active ? 15 : 11,
      active ? C.gold : '#638d86',
    );
  }
  text(c, '1,000 items × 16 coordinates', 108, 861, 37, C.muted, 'mono', 'left', 810);
  if (B(k) === 1) {
    text(c, 'Index build', 972, 353, 53, C.pale, 'serif');
    ['Item encoder', 'Embedding snapshot', 'Normalization', 'Index revision'].forEach((v, i) =>
      text(c, v, 992, 458 + i * 97, 37, C.muted),
    );
  } else {
    text(c, 'Exact top five by dot product', 980, 309, 42, C.pale, 'serif');
    if (show)
      t.selected.forEach((d, i) => {
        const yy = 365 + i * 86;
        rect(c, 983, yy, Math.round(d.score * 21), 47, '#316e64');
        text(c, '#' + d.id, 1000, yy + 37, 31, C.pale, 'mono');
        text(c, frac(dot(t.query, d.embedding), 4), 1650, yy + 37, 34, C.gold, 'mono', 'right');
      });
    if (B(k) === 2 && !cue(k, 2, 'Only these five')) return;
    text(
      c,
      B(k) === 3
        ? 'Check index recall, freshness and latency.'
        : B(k) === 4
          ? 'A sampled alternative can be a known positive.'
          : 'Five candidates go to the cross layer',
      981,
      874,
      33,
      C.muted,
      'sans',
      'left',
      824,
    );
  }
}
const v1 = crossVectorState(),
  v2 = crossMatrixState();
function pair(c, vals, x, y, w, shade) {
  if (!Array.isArray(vals)) {
    if (typeof vals === 'number') {
      circle(c, x + w / 2, y + 48, 62, shade);
      text(c, vals, x + w / 2, y + 67, 58, C.pale, 'mono', 'center');
    } else text(c, vals, x + w / 2, y + 70, 43, C.muted, 'mono', 'center');
    return;
  }
  vals.forEach((v, i) => {
    const ww = w / 2 - 5;
    rect(c, x + i * (ww + 10), y, ww, 96, shade);
    text(
      c,
      Number(v.toFixed(4)),
      x + i * (ww + 10) + ww / 2,
      y + 66,
      43,
      C.pale,
      'mono',
      'center',
      ww - 12,
    );
  });
}
function loom(c, labels, values, colors) {
  labels.forEach((l, i) => {
    const x = 110 + 448 * i;
    text(c, l, x, 415, 37, C.muted, 'serif', 'left', 370);
    pair(c, values[i], x, 466, 326, colors[i]);
    if (i < 3) arrow(c, x + 349, 516, x + 413, 516, C.muted);
  });
}
export function cross(c, k) {
  base(c, true);
  const matrix = k.beat.chapterId === 'c12',
    s = matrix ? v2 : v1,
    b = B(k);
  if (matrix && b >= 4) {
    heading(
      c,
      'The same item meets a different query',
      'Cache boundary   /   separate vector-layer probe',
      true,
    );
    [
      [0, 1, 1, 2],
      [1, 0, 1, 2],
    ].forEach((a, i) => {
      const x = 125 + i * 900,
        probe = crossVectorState(a, a, [0.5, 0.25, 0.5, 0.25], [0, 0, 0, 0]);
      text(c, 'Query ' + String.fromCharCode(65 + i), x, 350, 47, C.pale, 'serif');
      formula(c, vector(a.slice(0, 2)), x, 437, 360, 51, C.gold);
      text(c, 'Fixed item', x, 550, 35, C.muted);
      formula(c, vector(a.slice(2)), x, 622, 500, 47, C.pale);
      arrow(c, x + 322, 601, x + 428, 601, C.muted);
      formula(c, vector(probe.result.slice(2)), x + 454, 622, 386, 43, bright[i]);
      text(c, 'Crossed item', x + 455, 550, 35, C.muted);
    });
    formula(c, 'w = [0.5, 0.25, 0.5, 0.25]     b = 0', 125, 837, 1660, 40, C.muted);
    return;
  }
  heading(
    c,
    matrix ? 'Put the bias inside the multiplication' : 'One projection feeds both coordinates',
    matrix ? 'DCN-v2   /   identity matrix' : 'Original DCN   /   vector cross layer',
    true,
  );
  const inside = matrix ? cue(k, 2, 'The inside vector') : cue(k, 3, 'Weight one'),
    product = matrix ? cue(k, 2, 'Multiply by two') : cue(k, 3, 'Multiply the original'),
    result = matrix ? cue(k, 2, 'The result is') : cue(k, 4, 'The result is');
  loom(
    c,
    [
      'Current vector',
      matrix ? 'W × current + bias' : 'Current · weight',
      'Multiply by input',
      matrix ? 'Add current' : 'Add bias + current',
    ],
    [
      s.xl,
      inside ? (matrix ? s.inside : s.projection) : '?',
      product ? s.cross : '?',
      result ? s.result : '?',
    ],
    ['#315d68', '#856337', '#376e64', '#794b69'],
  );
  formula(c, matrix ? 'x₀ ⊙ (W xₗ + b) + xₗ' : 'x₀ (xₗᵀ w) + b + xₗ', 113, 736, 1640, 61, C.pale);
  formula(c, 'x₀ = [2, 3]      xₗ = [5, 7]      b = [0.5, 1]', 116, 843, 1682, 39, C.muted);
  text(
    c,
    matrix
      ? b === 3
        ? 'Dense matrix O(d²)     Rank-r matrix O(dr)'
        : 'W = identity'
      : b >= 5
        ? 'L layers → polynomial degree at most L + 1'
        : 'w = [1, 0]',
    117,
    934,
    35,
    C.gold,
    'mono',
  );
}
export function permutationState(proposal) {
  const valid =
    Array.isArray(proposal) &&
    proposal.length === pages.length &&
    pages.every((id) => proposal.includes(id));
  return { valid, report: valid ? judgedListState(proposal) : null };
}
export function permutation(c, k) {
  base(c);
  heading(c, 'Can this proposed order be used?', 'Language-model reranker   /   five eligible IDs');
  const invalid = cue(k, 2, 'A repeated page') && !cue(k, 2, 'Now exchange'),
    swapped = Boolean(cue(k, 2, 'Now exchange'));
  const proposed = invalid
    ? [guide, guide, sdk, blog, log]
    : swapped
      ? [run, guide, sdk, blog, log]
      : pages;
  const s = permutationState(proposed);
  pages.forEach((id, i) => {
    spine(c, id, 111, 345 + i * 97, 593, 70);
    spine(c, proposed[i], 929, 345 + i * 97, 665, 70);
  });
  text(c, 'Candidate IDs', 111, 305, 35);
  text(c, 'Proposed sequence', 931, 305, 35);
  if (invalid || swapped) {
    text(
      c,
      s.valid ? 'Each ID occurs once' : 'Repeated guide. Missing runbook.',
      112,
      931,
      46,
      s.valid ? C.teal : C.red,
      'serif',
      'left',
      843,
    );
    if (s.valid && cue(k, 2, 'NDCG at three falls'))
      formula(c, 'NDCG@3  ' + frac(s.report.system), 936, 930, 839, 51, C.red);
  } else arrow(c, 741, 558, 890, 558);
}
export function feed(c, k) {
  base(c);
  const b = B(k);
  heading(
    c,
    b === 3 ? 'Which side of the time boundary?' : 'Where could a recommendation come from?',
    'Developer feed   /   request evidence',
  );
  if (b === 3) {
    const y = 571;
    arrow(c, 128, y, 1764, y);
    line(
      c,
      [
        [1086, 293],
        [1086, 831],
      ],
      C.red,
      5,
    );
    text(c, 'Prediction time', 1085, 884, 35, C.red, 'mono', 'center');
    [
      [run, 250, 'Earlier session'],
      [guide, 657, 'Current request'],
      [sdk, 1428, 'Later click'],
    ].forEach(([id, x, s]) => {
      circle(c, x, y, 17, hue(id));
      book(c, id, x - 99, y - 219, 195, 172);
      text(c, s, x, y + 98, 32, C.quiet, 'mono', 'center');
    });
    return;
  }
  text(c, 'Content evidence', 112, 328, 48, C.ink, 'serif');
  book(c, run, 115, 385, 290, 249, { sub: 'RETRY' });
  arrow(c, 441, 511, 555, 511);
  book(c, sdk, 598, 385, 290, 249, { sub: 'RETRY' });
  text(c, 'Overlapping use', 1041, 328, 48, C.ink, 'serif');
  [guide, run, sdk].forEach((id, j) => glyph(c, id, 1280 + j * 162, 375, 74, hue(id)));
  ['Dev A', 'Dev B', 'New user'].forEach((u, i) => {
    text(c, u, 1029, 545 + i * 111, 32);
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ][i].forEach((v, j) => {
      circle(c, 1320 + j * 162, 532 + i * 111, 25, v ? C.teal : null, C.rule);
    });
  });
  text(
    c,
    b === 1 ? 'Shared topic: payment retries' : 'A new item can already have text.',
    112,
    761,
    36,
    C.teal,
  );
  text(
    c,
    b === 1
      ? 'Filled circles are recorded interactions.'
      : 'No prior interactions for the new user.',
    1032,
    888,
    32,
    C.quiet,
    'sans',
    'left',
    783,
  );
}
export function preferences(c, k) {
  base(c);
  const b = B(k);
  heading(
    c,
    b <= 2 ? 'What is the target for one page?' : 'Which judgments give a direction?',
    'Learning to rank   /   five pages',
  );
  if (b <= 2) {
    book(c, guide, 154, 345, 471, 411, { sub: 'API DOCUMENTATION' });
    formula(c, 'fit          0.98', 801, 447, 930, 51);
    formula(c, 'reliability  0.88', 801, 551, 930, 51);
    line(
      c,
      [
        [801, 603],
        [1627, 603],
      ],
      C.rule,
    );
    formula(c, 'target grade    3', 801, 718, 930, 51, C.teal);
    text(c, b === 1 ? 'One judged row' : 'Each observed click also had an exposure.', 801, 840, 37);
    return;
  }
  const shown = Boolean(cue(k, 4, 'Neither'));
  const counted = Boolean(cue(k, 4, 'Eight of the ten'));
  const pairs = preferredPairs();
  pages.forEach((id, i) => {
    const y = 409 + i * 94;
    spine(c, id, 107, y, 426, 70, 'g' + doc(id).relevance);
    pages.forEach((other, j) => {
      const x = 645 + j * 229;
      if (i === 0) text(c, name(other), x + 96, 350, 31, C.ink, 'serif', 'center', 212);
      if (j <= i) return;
      const tie = doc(id).relevance === doc(other).relevance,
        focused = b === 3 && id === run && other === sdk;
      rect(
        c,
        x,
        y,
        194,
        69,
        focused ? '#e5ba68' : !shown || tie ? '#d6cfba' : '#dae7d8',
        b >= 5 && id === guide && other === blog ? C.ink : null,
        5,
      );
      text(
        c,
        shown ? (tie ? 'tie' : 'row wins') : focused ? '2  ?  2' : '·',
        x + 97,
        y + 45,
        31,
        tie ? C.quiet : C.teal,
        'mono',
        'center',
      );
    });
  });
  text(
    c,
    counted ? pairs.length + ' strict preferences across 10 pairs' : 'Compare within this query.',
    108,
    995,
    40,
    C.ink,
    'serif',
  );
}
const features = (id) => [doc(id).queryFit, doc(id).reliability];
export const ordinary = rankNetStep(features(guide), features(blog));
export const reverse = rankNetStep(features(blog), features(guide));
export function pairState(k) {
  const reset = cue(k, 5, 'Reset both weights'),
    rev = Boolean(cue(k, 5, 'Reverse the training preference'));
  const moved = reset ? cue(k, 6, 'Take the same half-size step') : cue(k, 4, 'Both weights move');
  const s = rev ? reverse : ordinary;
  return {
    s,
    rev,
    moved,
    weights: moved ? s.next : s.weights,
    gap: moved ? s.nextGap * (rev ? -1 : 1) : 0,
  };
}
function ruler(c, x, y, w, value, domain = 0.12) {
  line(
    c,
    [
      [x, y],
      [x + w, y],
    ],
    C.muted,
    4,
  );
  for (const v of [-0.1, -0.05, 0, 0.05, 0.1]) {
    const xx = x + w * (0.5 + v / (domain * 2));
    line(
      c,
      [
        [xx, y - 14],
        [xx, y + 14],
      ],
      C.muted,
      3,
    );
    text(c, String(v), xx, y + 65, 29, C.muted, 'mono', 'center');
  }
  const px = x + w * (0.5 + value / (domain * 2));
  circle(c, px, y, 19, C.gold);
  text(c, (value > 0 ? '+' : '') + frac(value, 5), px, y - 42, 39, C.gold, 'mono', 'center');
}
export function pairUpdate(c, k) {
  base(c, true);
  heading(c, 'Which side of zero will the guide land on?', 'RankNet   /   one linear update', true);
  const { s, rev, moved, weights, gap } = pairState(k),
    b = B(k);
  const row = (id, y) => {
    glyph(c, id, 115, y - 48, 65, C.pale);
    text(c, name(id), 211, y, 42, C.pale, 'serif');
    formula(c, vector(features(id)), 580, y, 593, 43, C.muted);
  };
  row(guide, 376);
  row(blog, 480);
  text(c, 'Training preference', 1154, 320, 30, C.muted, 'mono');
  text(c, rev ? 'Blog > guide' : 'Guide > blog', 1151, 400, 57, C.pale, 'serif');
  text(c, 'Weights  ' + vector(weights), 1153, 507, 39, C.gold, 'mono', 'left', 689);
  text(c, '[query fit, reliability]', 584, 299, 29, C.muted, 'mono');
  const info =
    b === 1
      ? 'At a tie, P(win) = 0.5'
      : b === 2
        ? '−log P(win)     slope = −0.5'
        : rev && !moved
          ? 'Starting again at zero'
          : 'Feature difference  ' + vector(s.difference);
  formula(c, info, 112, 632, 861, 39, C.muted);
  if ((b === 3 && cue(k, 3, 'Multiply that difference')) || b === 4 || b >= 6)
    formula(c, 'Gradient ' + vector(s.gradient), 1010, 632, 802, 39, C.muted);
  ruler(c, 216, 817, 1480, gap);
  text(c, 'Blog leads', 151, 983, 37, '#e8aacb');
  text(c, 'Guide score minus blog score', 961, 982, 34, C.muted, 'mono', 'center');
  text(c, 'Guide leads', 1760, 983, 37, bright[0], 'sans', 'right');
}
export const swaps = [metricSwapState(), metricSwapState([0, 2, 3, 0, 2], 4, 3)];
export const weighted = rankNetStep(features(guide), features(blog), [0, 0], 0.5, swaps[0].delta);
export function lambdas(c, k) {
  base(c, true);
  const b = B(k);
  heading(
    c,
    b < 3 ? 'Two scores cross' : 'How much is the swap worth?',
    'LambdaRank   /   discounted gain',
    true,
  );
  if (b === 8) {
    const ledger = lambdaPairLedger(),
      order = [blog, run, guide, log, sdk];
    text(c, 'Sum signed pair contributions at each page', 112, 336, 44, C.muted, 'serif');
    const zero = 1080;
    line(
      c,
      [
        [zero, 375],
        [zero, 905],
      ],
      C.muted,
    );
    order.forEach((id, i) => {
      const y = 395 + i * 102,
        v = ledger.total[i],
        w = v * 1230;
      spine(c, id, 110, y, 560, 74, 'grade ' + doc(id).relevance);
      rect(c, zero + Math.min(0, w), y + 19, Math.abs(w), 40, v < 0 ? '#7edab3' : '#d7a3c6');
      formula(c, (v > 0 ? '+' : '') + frac(v, 3), 1564, y + 53, 255, 39, C.pale);
    });
    text(c, 'Negative slope raises the score under descent.', 113, 981, 37, C.muted);
    return;
  }
  if (b < 3) {
    const pass = cue(k, 1, 'Now move the guide past the blog'),
      near = cue(k, 1, 'Nudge the guide');
    const rows = pass ? [guide, blog] : [blog, guide],
      scores = { [guide]: pass ? 0.6 : near ? 0.48 : 0.2, [blog]: 0.5 };
    rows.forEach((id, i) => {
      const y = 378 + i * 154;
      spine(c, id, 116, y, 552, 94);
      rect(c, 792, y + 22, scores[id] * 1100, 52, id === guide ? bright[0] : bright[2]);
      text(c, frac(scores[id], 2), 827 + scores[id] * 1100, y + 65, 39, C.pale, 'mono');
    });
    text(c, 'Toy scores     NDCG@2  ' + frac(dcgTwo(rows)), 116, 852, 48, C.gold, 'mono');
    return;
  }
  if (b <= 4) {
    const order = [blog, run, guide, log, sdk],
      swapped = cue(k, 4, 'The first swap');
    swaps.forEach((s, j) => {
      const x = 119 + j * 910,
        items = [...order];
      if (swapped) [items[s.first], items[s.second]] = [items[s.second], items[s.first]];
      text(c, j ? 'Swap slots 4 and 5' : 'Swap slots 1 and 3', x, 305, 36, C.muted, 'serif');
      items.forEach((id, i) =>
        spine(c, id, x, 345 + i * 87, 705, 65, 'grade ' + doc(id).relevance),
      );
      const ys = [s.first, s.second].map((i) => 378 + i * 87);
      line(
        c,
        [
          [x + 724, ys[0]],
          [x + 758, ys[0]],
          [x + 758, ys[1]],
          [x + 724, ys[1]],
        ],
        C.gold,
        4,
      );
      if (swapped) formula(c, '|ΔNDCG|   ' + frac(s.delta), x, 874, 820, 48, C.gold);
    });
    return;
  }
  const moved = cue(k, 6, 'Its lead grows');
  [ordinary, weighted].forEach((s, i) => {
    const y = 371 + i * 214,
      known = i === 0 || moved;
    text(
      c,
      i ? 'Fixed swap weight ' + frac(swaps[0].delta) : 'Ordinary pair',
      115,
      y,
      44,
      C.pale,
      'serif',
    );
    const v = known ? s.nextGap : 0;
    rect(c, 116, y + 41, 1303, 59, '#315253');
    if (v) rect(c, 116, y + 41, v * 12100, 59, i ? bright[0] : bright[1]);
    formula(c, known ? frac(v, 5) : '?', 1476, y + 93, 343, 48, C.pale);
  });
  formula(
    c,
    b >= 7 ? 'λ = −σ × |ΔNDCG| / (1 + exp(σ × gap))' : 'Guide lead after one step from zero',
    116,
    930,
    1700,
    42,
    C.muted,
  );
}
function dcgTwo(rows) {
  return judgedListState(rows, { cutoff: 2 }).local;
}
const dist = listDistributionStep(),
  after = listDistributionStep(dist.target, dist.next);
export function distribution(c, k) {
  base(c, true);
  heading(c, 'Two pages share a fixed total', 'List distribution   /   guide and blog', true);
  const b = B(k),
    changed = cue(k, 4, 'The scores become'),
    example = b >= 3;
  const predicted = changed ? after.predicted : dist.predicted;
  const ribbons = (y, label, masses) => {
    text(c, label, 111, y - 39, 38, C.muted, 'serif');
    const x = 116,
      w = 1612,
      split = w * masses[0];
    rect(c, x, y, split, 97, '#28695e');
    rect(c, x + split, y, w - split, 97, '#754667');
    text(c, 'Guide  ' + frac(masses[0], 2), x + 30, y + 64, 42, C.pale, 'mono');
    text(c, 'Blog  ' + frac(masses[1], 2), x + split + 26, y + 64, 42, C.pale, 'mono');
  };
  if (example) {
    ribbons(355, 'Target shares', dist.target);
    ribbons(583, 'Predicted shares', predicted);
  } else {
    book(c, guide, 115, 331, 363, 332);
    book(c, blog, 542, 331, 363, 332);
    text(c, 'Normalize over this pair', 1033, 430, 46, C.pale, 'serif', 'left', 770);
    formula(c, 'pᵢ = exp(sᵢ) / Σ exp(sⱼ)', 1034, 540, 779, 40, C.muted);
  }
  const eq =
    b <= 2
      ? b === 1
        ? 'Same candidate IDs in both distributions'
        : 'Cross-entropy = −Σ targetᵢ × log(predictedᵢ)'
      : b === 3
        ? 'Scores [0, 0]     Loss = ln 2'
        : changed
          ? 'Scores ' + vector(dist.next) + '     Gradient at origin ' + vector(dist.gradient)
          : 'Gradient = predicted − target';
  formula(c, eq, 112, 876, 1680, 39, C.gold);
}
