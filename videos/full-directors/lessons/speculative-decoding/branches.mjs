import {
  decomposition,
  isolationFixture,
  samplerBoundary,
  visibility,
} from '../../../films/speculative-decoding/arithmetic.mjs';
import { C, arrow, bracket, cue, fmt, line, note, page, pct, rect, slug, text } from './press.mjs';

export const parents = [null, null, 0, 1];
export const query = 2;
export const mask = visibility(parents, query);
export const positions = parents.map((_, i) => 9 + visibility(parents, i).reduce((a, b) => a + b, 0));
const labels = ['sang', 'flew', 'softly', 'away'];
const coords = [
  [780, 364],
  [780, 656],
  [1390, 364],
  [1390, 656],
];
export function tree(g, c) {
  if (c.beat.beatIndex === 3) {
    page(g, 'VERIFICATION CONTRACTS  /  two different runs', 'What did each test cover?');
    const rows = [
      {
        name: 'Token-wise',
        items: ['A', 'B', 'C'],
        cues: ['A passes', 'B fails', 'B fails'],
        results: ['Pass', 'Reject', 'Unreached'],
        kept: 'A',
        end: 'keeps A',
      },
      {
        name: 'Whole prefixes',
        items: ['A', 'A B', 'A B C'],
        cues: ['A fails its prefix test', 'A B passes', 'A B C fails'],
        results: ['Fail', 'Pass', 'Fail'],
        kept: 'A B',
        end: 'can keep A B',
      },
    ];
    rows.forEach((r, j) => {
      if (j && !cue(c, 3, 'In a separate block')) return;
      const y = 363 + 237 * j;
      text(g, r.name, 112, y + 68, 43, C.ink, 'Serif');
      r.items.forEach((v, i) => {
        const x = 536 + i * 298;
        slug(g, x, y, 227, 85, C.white);
        text(g, v, x + 112, y + 59, 46, C.ink, 'Mono', 'center');
        if (cue(c, 3, r.cues[i]))
          text(
            g,
            r.results[i],
            x + 112,
            y + 151,
            35,
            r.results[i] === 'Pass' ? C.keep : r.results[i] === 'Unreached' ? C.quiet : C.red,
            'Sans',
            'center',
          );
      });
      if (cue(c, 3, r.end)) text(g, 'Keep ' + r.kept, 1492, y + 62, 47, C.keep);
    });
    note(g, 'Use the correction distribution that belongs to the test.');
    return;
  }
  const visible = cue(c, 1, 'Trace the branch');
  const depth = cue(c, 1, 'Both roots use position ten');
  if (c.beat.beatIndex === 2) {
    page(g, 'BRANCH ISOLATION  /  attention at softly', 'Does changing flew move this result?');
    const change = cue(c, 2, 'to ten thousand'),
      off = change ? 10000 : 100;
    const test = isolationFixture(off),
      base = isolationFixture(100);
    text(g, 'Value on flew', 115, 351, 44, C.draft);
    text(g, off.toLocaleString('en-US'), 115, 452, 76, C.draft, 'Mono');
    const x = 755,
      w = 980,
      y = 444;
    text(g, 'Attention output  •  log scale', x, 347, 39, C.quiet);
    for (const [j, key] of ['tree', 'flat'].entries()) {
      const yy = y + j * 203,
        pos = x + (w * Math.log10(test[key].result)) / 4;
      line(g, x, yy + 42, x + w, yy + 42, C.rule, 3);
      for (let i = 0; i <= 4; i++) {
        const tx = x + (i * w) / 4;
        line(g, tx, yy + 34, tx, yy + 50, C.rule);
        text(g, [1, 10, 100, '1k', '10k'][i], tx, yy + 91, 29, C.quiet, 'Mono', 'center');
      }
      text(g, j ? 'Flat causal mask' : 'Tree mask', 114, yy + 112, 48, j ? C.red : C.keep, 'Serif');
      if (change)
        line(
          g,
          x + (w * Math.log10(base[key].result)) / 4,
          yy + 42,
          pos,
          yy + 42,
          j ? C.red : C.keep,
          9,
        );
      rect(g, pos - 6, yy + 22, 12, 41, j ? C.red : C.keep);
      text(g, fmt(test[key].result, 3), pos, yy + 8, 37, j ? C.red : C.keep, 'Mono', 'center');
    }
    note(g, 'The tree row has zero attention weight on the other branch.');
    return;
  }
  page(g, 'CANDIDATE TREE  /  cached through position 9', 'Which candidate keys may softly read?');
  const root = [287, 510];
  const node = (i) => {
    const [x, y] = coords[i];
    const included = visible && mask[i];
    slug(g, x - 145, y - 49, 290, 100, included ? C.green : C.white, included ? '#7ba294' : C.rule);
    text(g, i + '   ' + labels[i], x, y + 22, 48, included ? C.keep : C.ink, 'Serif', 'center');
    if (depth) text(g, 'position ' + positions[i], x, y + 107, 32, C.quiet, 'Mono', 'center');
  };
  parents.forEach((p, i) => {
    const [x, y] = coords[i],
      [px, py] = p === null ? root : coords[p];
    line(g, px + 135, py, x - 142, y, visible && mask[i] ? C.keep : C.rule, visible && mask[i] ? 8 : 3);
  });
  text(g, 'Prefix', root[0], root[1] + 14, 73, C.ink, 'Serif', 'center');
  coords.forEach((_, i) => node(i));
  note(
    g,
    visible
      ? 'Softly can read the prefix and candidate keys    [ ' + mask.join('   ') + ' ]'
      : 'Candidate columns are ordered 0, 1, 2, 3. There is no pending input.',
  );
}
export const lookup = {
  p: [0.2, 0.3, 0.5],
  q: [0, 0, 1],
  index: 2,
  words: ['waits', 'stops', 'arrives'],
  uniform: 0.7,
};
const lookupLaw = decomposition(lookup.p, lookup.q);
function lookupStrip(g, law, words, y, label) {
  const x = 405,
    w = 1285;
  text(g, label, 113, y + 62, 42, C.quiet);
  let at = x;
  law.forEach((v, i) => {
    if (!v) return;
    rect(g, at, y, w * v, 96, [C.green, C.violet, C.gold][i], C.white);
    text(g, words[i] + '   ' + pct(v), at + (w * v) / 2, y + 61, 38, C.ink, 'Sans', 'center');
    at += w * v;
  });
}
export function proposers(g, c) {
  const b = c.beat.beatIndex;
  if (b < 2) {
    const copy = cue(c, 0, 'Lookup copies');
    const reject = cue(c, 1, 'Reject arrives');
    page(g, 'PROMPT LOOKUP  /  deterministic proposal', 'Can a copied word reach the reader?');
    text(g, 'The train arrives at noon.', 116, 366, 65, C.ink, 'Serif');
    text(g, 'The train', 1050, 366, 65, C.ink, 'Serif');
    if (copy && !reject) text(g, 'arrives at', 1343, 366, 65, C.pencil, 'Serif');
    bracket(g, 117, 364, 397, 'match', C.draft);
    bracket(g, 1049, 1297, 397, 'suffix', C.draft);
    lookupStrip(g, lookup.p, lookup.words, 482, 'Target');
    const replaced = cue(c, 1, 'Remove that word');
    if (replaced) lookupStrip(g, lookupLaw.residual, lookup.words, 619, 'Correction');
    const alpha = lookupLaw.acceptance[lookup.index];
    text(g, 'q(arrives) = 1.00', 112, 797, 43, C.draft);
    if (cue(c, 0, 'point seven')) text(g, 'u = ' + fmt(lookup.uniform), 717, 797, 43, C.draft);
    if (reject) text(g, 'Reject    α = ' + fmt(alpha), 1192, 797, 43, C.red);
    const [a, d] = lookupLaw.residual;
    note(
      g,
      replaced
        ? 'On rejection     waits ' + pct(a) + '       stops ' + pct(d) + '       arrives 0%'
        : reject
          ? 'The copied span drops at the first rejected proposal.'
          : 'Which words can receive the correction if arrives fails?',
    );
  } else if (b === 2) {
    page(g, 'MEDUSA  /  backbone and sampler', 'Whose distribution is preserved?');
    const second = cue(c, 2, 'Medusa two'),
      verdict = cue(c, 2, 'A frozen baseline'),
      other = cue(c, 2, 'A changed backbone');
    for (const [i, enabled] of [true, second].entries()) {
      if (!enabled) continue;
      const x = i ? 1100 : 247,
        contract = samplerBoundary(Boolean(i), !i);
      text(g, 'Medusa ' + (i ? '2' : '1'), x, 336, 53, C.ink, 'Serif');
      slug(g, x, 395, 425, 103, i ? C.violet : C.green);
      text(
        g,
        contract.target + (i ? '   joint training' : '   frozen'),
        x + 212,
        461,
        44,
        C.ink,
        'Sans',
        'center',
      );
      if ((verdict && !i) || (other && i)) {
        text(g, i ? 'Typical acceptance' : 'Exact correction', x, 622, 44);
        text(
          g,
          contract.baselineLawEstablished ? 'Baseline law preserved' : 'Baseline law unestablished',
          x,
          728,
          43,
          i ? C.red : C.keep,
        );
      }
    }
    note(g, 'Separate the choice of target weights from the acceptance rule.');
  } else {
    const version = cue(c, 3, 'EAGLE three') ? 3 : cue(c, 3, 'EAGLE two') ? 2 : 1;
    const other = cue(c, 3, 'Native multi-token heads');
    page(
      g,
      other ? 'PROPOSER DESIGNS  /  target verification' : 'EAGLE  /  target-conditioned proposals',
      other ? 'Where do the guesses come from?' : 'What does the drafter predict?',
    );
    const xs = [134, 739, 1348];
    const terms =
      version === 3
        ? ['Early + mid + late', 'Token predictor', 'draft tokens']
        : ['Target features', 'Feature predictor', 'target head'];
    if (other) {
      text(g, 'Multi-token heads', 207, 418, 52, C.draft, 'Serif');
      text(g, 'Parallel draft', 207, 670, 52, C.draft, 'Serif');
      arrow(g, 660, 415, 1075, 520, C.draft);
      arrow(g, 660, 643, 1075, 520, C.draft);
      text(g, 'Several positions', 1130, 537, 65, C.ink, 'Serif');
    } else {
      terms.forEach((v, i) => {
        text(g, v, xs[i], 506, 48, i === 2 ? C.keep : C.ink, 'Serif');
        if (i < 2) arrow(g, xs[i] + g.measureText(v).width + 26, 487, xs[i + 1] - 42, 487, C.draft);
      });
      text(
        g,
        version === 1
          ? 'Original EAGLE'
          : version === 2
            ? 'EAGLE-2  •  expand high-confidence branches'
            : 'EAGLE-3  •  train to predict tokens directly',
        135,
        699,
        49,
        C.draft,
      );
    }
    note(
      g,
      other
        ? 'Budget the extra weights, features, state and verification work.'
        : version === 3
          ? 'Target-layer features condition token prediction.'
          : 'The target head converts predicted features to draft token probabilities.',
    );
  }
}
