import assert from 'node:assert/strict';
import { DOCS, GAP_IDS, RELEVANT } from '../../../films/retrieval-indexing/fixtures.mjs';
import {
  POSTINGS,
  QUERY_INTERSECTION,
  SOUP_POSITIONS,
  TOKENS,
  TERMS,
} from '../../../films/retrieval-indexing/analysis.mjs';
import { bm25, idf, RANKING, AVERAGE_LENGTH } from '../../../films/retrieval-indexing/scoring.mjs';
import {
  TOP_K_TRACE,
  LEXICAL_TOP_TWO,
  SECOND_LANE_UNION,
  rerankFixture,
} from '../../../films/retrieval-indexing/selection.mjs';
import { GAP_VALUES, decodeGapValues } from '../../../films/retrieval-indexing/storage.mjs';
import { leafPage, typeset } from './leaves.mjs';
import { neat, lerp } from './studio.mjs';

const names = { d1: 'Recipe', d2: 'Beans', d3: 'Garden sign', d4: 'Lunch menu' };
const union = [...new Set(TERMS.flatMap((t) => POSTINGS[t]))];
const matchCount = (id, word) => TOKENS[id].filter((t) => t === word).length;
function leaf(p, id, x, y, s) {
  p.rect(x + 8, y + 12, 823 * s, 722 * s, '#c7bba0');
  leafPage(p.ctx, id, x, y, s);
}
function opening(p) {
  const { ctx, c, at } = p;
  p.rect(0, 0, 1920, 1080, '#c8a475');
  for (let i = 0; i < 7; i++) p.line(0, i * 165 + 93, 1920, i * 165 + 81, '#b9976a', 2);
  p.rect(1230, 0, 520, 1080, '#f2dcb9');
  for (let i = 0; i < 10; i++) p.rect(1230 + 52 * i, 0, 21, 1080, '#bd735c55');
  for (let i = 0; i < 20; i++) p.rect(1230, 54 * i, 520, 21, '#bd735c55');
  const side = at(1, 'Put the recipe', 0.65),
    open = at(3, 'Open page two', 0.6);
  const x = lerp(520, 108, side);
  leaf(p, 'd4', x, 168, 0.98);
  if (side > 0) {
    ctx.save();
    ctx.globalAlpha = side;
    leaf(p, 'd1', lerp(1100, 996, side), 168, 0.98);
    ctx.restore();
  }
  if (at(2, 'The menu wins')) {
    if (!open) p.text('2 × soup', x + 393, 947, 56, c.ink, 'Serif', 'center');
    p.text('1 × soup', 1394, 947, 56, c.ink, 'Serif', 'center');
    p.line(x + 51, 329, x + 211, 329, c.accent, 5);
    p.line(x + 248, 699, x + 358, 699, c.accent, 5);
    p.line(1047, 329, 1207, 329, c.accent, 5);
  }
  if (open > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(108, 168, 820, 720 * open);
    ctx.clip();
    leaf(p, 'd2', 108, 168, 0.98);
    ctx.restore();
    if (open === 1)
      p.text(
        at(4, 'Neither word') ? '0 query words' : 'make   ·   soup   ?',
        505,
        953,
        50,
        c.ink,
        'Serif',
        'center',
      );
  }
}
function postings(p, query = false) {
  const { at, c } = p;
  p.title(query ? 'Look up the query terms' : 'From a word to its pages', 'MAKE SOUP');
  const ids = Object.keys(DOCS),
    x = 115,
    y = 328;
  p.text('Page', x, y, 33, c.soft);
  p.text('make', 562, y, 35, c.blue, 'Mono', 'center');
  p.text('soup', 794, y, 35, c.blue, 'Mono', 'center');
  ids.forEach((id, i) => {
    const yy = y + 89 + i * 112;
    p.line(x, yy + 27, 931, yy + 27);
    p.text(id + '   ' + names[id], x, yy, 43, c.ink, 'Serif');
    TERMS.forEach((term, j) => {
      const count = matchCount(id, term);
      p.mono(count || '·', 562 + j * 232, yy, 46, count ? c.ink : c.soft, 'center');
    });
  });
  const make = query ? at(1, 'Start with make') : at(2, 'Look up make');
  const soup = query ? at(2, 'An OR query') : at(2, 'Look up soup');
  p.text('Posting lists', 1040, 331, 49, c.ink, 'Serif');
  [
    [make, 'make'],
    [soup, 'soup'],
  ].forEach(([show, term], i) => {
    const y = 407 + i * 130;
    p.mono(term, 1040, y + 47, 40, c.blue);
    p.arrow(1180, y + 29, 1287, y + 29, c.soft, 3);
    if (show) POSTINGS[term].forEach((id, j) => p.tag(id, 1335 + j * 166, y));
  });
  if (query && at(2, 'It reaches')) {
    const and = at(2, 'Only d1 survives');
    const result = and ? QUERY_INTERSECTION : union;
    p.line(1040, 691, 1795, 691);
    p.mono(and ? 'AND' : 'OR', 1040, 766, 48, c.accent);
    result.forEach((id, i) => p.tag(id, 1328 + 166 * i, 716));
  }
  if (!query && at(3, 'Counts and token positions'))
    p.mono('d4    f = 2    positions ' + SOUP_POSITIONS.join(', '), 1010, 791, 30, c.accent);
  if (query && at(3, 'sum of their lengths'))
    p.text('1 + 2 = 3 posting entries', 1040, 835, 39, c.ink, 'Serif');
}
const corpusSize = Object.keys(DOCS).length;
const recipe = bm25('d1');
const k1 = 1.2, b = 0.75;
const lengthFactor = 1 - b + b * recipe.length / AVERAGE_LENGTH;
const soupCount = recipe.counts.soup;
const tfNumerator = soupCount * (k1 + 1);
const tfDenominator = soupCount + k1 * lengthFactor;
const tfWeight = tfNumerator / tfDenominator;
function score(p) {
  const { at, c } = p;
  const df = POSTINGS.soup.length;
  p.title('How much does one match weigh?', 'RECIPE   /   BM25');
  leaf(p, 'd1', 95, 267, 0.8);
  p.text('Document frequency', 833, 293, 36, c.soft);
  TERMS.forEach((t, i) => {
    const x = 833 + i * 485;
    p.mono(t, x, 364, 51, c.ink);
    Object.keys(DOCS).forEach((id, j) =>
      p.circle(x + 18 + 56 * j, 410, 18, TOKENS[id].includes(t) ? c.green : c.rule),
    );
    p.mono('df = ' + POSTINGS[t].length + ' of ' + corpusSize, x, 482, 36);
  });
  if (at(2, 'inverse document frequency'))
    p.mono('IDF = ln(1 + (N − df + 0.5)/(df + 0.5))', 828, 563, 38, c.blue);
  if (at(2, 'Two pages lack soup')) {
    const substitution = 'ln(1 + (' + corpusSize + ' − ' + df + ' + 0.5)/(' + df + ' + 0.5))';
    p.mono('soup   ' + substitution, 828, 630, 37, c.blue);
  }
  if (at(2, 'Now look at the recipe'))
    p.mono('= ln(2) ≈ ' + idf('soup').toFixed(3), 988, 693, 39, c.blue);
  if (at(3, 'For one mention')) {
    p.mono('L = 1 − ' + b + ' + ' + b + ' × ' + recipe.length + '/' + AVERAGE_LENGTH
      + ' = ' + lengthFactor, 105, 911, 32, c.soft);
    p.mono('f = ' + soupCount + '    k₁ = ' + k1, 105, 968, 34, c.soft);
  }
  if (at(3, 'Multiply that weight')) {
    p.line(828, 734, 1800, 734);
    p.mono('TF = ' + soupCount + ' × ' + (k1 + 1) + ' / (' + soupCount + ' + ' + k1 + ' × '
      + lengthFactor + ') = ' + tfWeight.toFixed(2), 828, 798, 38);
  }
  if (at(3, 'Make occurs'))
    p.mono('soup   ln(2) × ' + tfWeight.toFixed(2) + ' ≈ ' + recipe.contributions.soup.toFixed(3), 828, 878, 42, c.green);
  if (at(3, 'Both words occur'))
    p.mono('make   ln(10/3) × ' + tfWeight.toFixed(2) + ' ≈ ' + recipe.contributions.make.toFixed(3), 828, 957, 42, c.green);
}
function ranking(p) {
  const { c, at } = p;
  p.title('A useful page with a score of zero', 'MAKE SOUP   /   WORD SEARCH');
  RANKING.forEach(({ docId, score }, i) => {
    const y = 302 + i * 147;
    p.mono(docId, 100, y + 43, 40, c.soft);
    p.text(names[docId], 200, y + 42, 44, c.ink, 'Serif');
    p.rect(510, y + 8, score * 241, 38, docId === 'd1' ? c.green : c.gold);
    p.mono(score.toFixed(3), 1082, y + 42, 38, c.ink, 'right');
  });
  leaf(p, 'd2', 1210, 248, 0.69);
  if (at(2, 'no analyzed words')) p.mono('make  ×     soup  ×', 1215, 785, 37, c.accent);
  if (at(3, 'query expansion')) p.text('beans  →  d1, d2', 1215, 833, 38, c.green);
}
function heap(p) {
  const { at, c, beat } = p,
    i = beat - 1,
    arrival = TOP_K_TRACE[i];
  const accept = at(
    beat,
    ['fills one slot', 'Put d2 at the root', 'tie rule keeps', 'it replaces'][i],
  );
  const state = accept ? arrival : TOP_K_TRACE[i - 1];
  p.title('Two places in the heap', 'TOP K   /   HIGHER SCORE WINS');
  p.text('Incoming', 120, 334, 36, c.soft);
  if (arrival.incoming === 'd3') {
    p.strip(120, 380, 558, 490);
    p.text('Garden sign', 161, 511, 62, c.ink, 'Serif');
    p.text('Change the color of', 160, 620, 38);
    p.text('a garden sign in settings.', 160, 679, 38);
  } else leaf(p, arrival.incoming, 120, 380, 0.68);
  p.mono(arrival.incoming + '   ' + arrival.score.toFixed(3), 124, 950, 47, c.accent);
  p.arrow(752, 594, 919, 594, c.rule);
  const root = state?.root,
    child = state?.heap.find((id) => id !== root);
  p.line(1367, 497, 1367, 747, c.rule, 5);
  [
    [root, 'Root · weakest', 339],
    [child, 'Child', 673],
  ].forEach(([id, name, y]) => {
    p.strip(1003, y, 732, 164);
    p.text(name, 1045, y + 60, 33, c.soft);
    p.mono(
      id ? id + '    ' + bm25(id).score.toFixed(3) : 'empty',
      1045,
      y + 124,
      48,
      id ? c.ink : c.soft,
    );
  });
  if (accept && i === 2) p.text('Tie at zero · d2 has the lower ID', 997, 929, 38, c.accent);
  if (accept && i === 3) p.text('d4 takes the root from d2', 997, 929, 38, c.green);
}
function storage(p) {
  const { at, c } = p;
  const gaps = at(2, 'The gaps are'),
    decoded = at(2, 'Add them back', 0.85);
  p.title('Store the jumps between page numbers', 'ORDERED POSTINGS');
  const start = 151,
    end = 1750,
    xx = (v) => start + ((end - start) * v) / 25;
  p.line(start, 548, end, 548, c.ink, 8);
  for (let i = 0; i <= 25; i++) {
    p.line(xx(i), 537, xx(i), i % 5 ? 572 : 589, c.soft, 3);
    if (i % 5 === 0) p.mono(i, xx(i), 640, 32, c.soft, 'center');
  }
  GAP_IDS.forEach((id, i) => {
    let x = xx(id);
    p.circle(x, 548, 18, c.green);
    p.mono('ID ' + id, x, 458, 47, c.ink, 'center');
    if (gaps) {
      const last = xx(GAP_IDS[i - 1] || 0);
      p.arrow(last, 708, x - 3, 708, c.accent, 4);
      p.mono('+' + GAP_VALUES[i], (x + last) / 2, 797, 50, c.accent, 'center');
    }
  });
  if (decoded) {
    const k = Math.min(3, Math.ceil(3 * decoded));
    p.mono(
      GAP_VALUES.slice(0, k).join(' + ') + ' = ' + decodeGapValues(GAP_VALUES)[k - 1],
      155,
      933,
      52,
    );
  }
  if (at(3, 'New or changed'))
    p.text('Updated pages → analyze → merge into a searchable segment', 698, 929, 34, c.green);
}
function evidence(p) {
  const { at, c } = p,
    more = at(2, 'candidate set grows'),
    done = at(2, 'reranker picks');
  const ids = done ? rerankFixture(SECOND_LANE_UNION) : more ? SECOND_LANE_UNION : LEXICAL_TOP_TWO;
  p.title(
    more && !done ? 'Three candidates for two places' : 'Read what reached the cook',
    'JUDGED USEFUL   /   d1 AND d2',
  );
  ids.forEach((id, i) => {
    const s = ids.length === 3 ? 0.625 : 0.68;
    const x = ids.length === 3 ? 93 + 585 * i : 207 + 837 * i;
    leaf(p, id, x, 295, s);
    p.text(
      id + '   ' + (RELEVANT.includes(id) ? 'Cooking step' : 'Menu only'),
      x,
      295 + 722 * s + 42,
      42,
      RELEVANT.includes(id) ? c.green : c.accent,
      'Serif',
    );
  });
  if (done || (!more && at(1, 'recall at two')))
    p.mono(
      'Recall@2   ' + ids.filter((id) => RELEVANT.includes(id)).length + ' / 2',
      1436,
      145,
      38,
      c.accent,
    );
}
export const kitchenScenes = [
  opening,
  (p) => postings(p, false),
  (p) => postings(p, true),
  score,
  ranking,
  heap,
  storage,
  evidence,
];
export function checkKitchen() {
  for (const [page, lines] of Object.entries(typeset))
    assert.equal(lines.join(' '), DOCS['d' + page]);
  assert.deepEqual(TERMS, ['make', 'soup']);
  assert.equal(matchCount('d1', 'soup'), 1);
  assert.equal(matchCount('d4', 'soup'), 2);
  assert.deepEqual(union, ['d1', 'd4']);
  assert.deepEqual(QUERY_INTERSECTION, ['d1']);
  assert.equal(AVERAGE_LENGTH, 8.25);
  assert.deepEqual([corpusSize, POSTINGS.soup.length, soupCount], [4, 2, 1]);
  assert.equal(idf('soup'), Math.log(2));
  assert.equal(idf('make'), Math.log(1 + 3.5 / 1.5));
  assert.equal(lengthFactor, 1.25);
  assert.equal(tfWeight.toFixed(2), '0.88');
  for (const term of TERMS) {
    assert.equal(recipe.counts[term], soupCount);
    assert.equal((idf(term) * tfWeight).toFixed(3), recipe.contributions[term].toFixed(3));
  }
  assert.deepEqual(
    RANKING.map((r) => neat(r.score)),
    ['1.669', '0.899', '0', '0'],
  );
  assert.deepEqual(
    TOP_K_TRACE.map((s) => s.root),
    ['d1', 'd2', 'd2', 'd4'],
  );
  assert.deepEqual(decodeGapValues(GAP_VALUES), GAP_IDS);
  assert.deepEqual(rerankFixture(SECOND_LANE_UNION), RELEVANT);
}
