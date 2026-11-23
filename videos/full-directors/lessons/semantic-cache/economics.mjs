import { C } from './art.mjs';
import {
  tenReads,
  servingWindow,
  large,
  small,
  reports,
  variants,
  reportDecision,
  wilsonLower,
  freshOnly,
  allMisses,
  exampleLatency,
} from './cases.mjs';

function timeBars(f, hits, { showBaseline, releaseProgress, tailRank }) {
  const pending = releaseProgress !== null && releaseProgress < 1;
  const rows = tenReads(hits, pending),
    origin = 301,
    length = 920;
  const widthFor = (ms) => (ms / allMisses.p95) * length;
  const { lookupMs, generationMs } = exampleLatency;
  for (const i of [0, 250, 500, 750, 1000]) {
    const x = origin + widthFor(i);
    f.line(x, 279, x, 908, C.grid, 2, [5, 10]);
    const baseline = showBaseline && i === freshOnly.p95;
    const label = baseline ? 'Fresh only · ' + i.toLocaleString('en-US') : String(i);
    f.middle(label, x, 260, 26, baseline ? C.rust : C.muted);
  }
  f.tag('ms', showBaseline ? 1350 : 1275, 259);
  rows.forEach(({ id, ms }, i) => {
    const y = 315 + i * 61;
    const changing = id === 6 && releaseProgress !== null;
    const lookup = widthFor(lookupMs);
    const generation = widthFor(ms === null ? generationMs * releaseProgress : ms - lookupMs);
    const end = origin + lookup + generation;
    f.mono('R' + id, 111, y + 15, 34, C.ink);
    f.rect(origin, y - 13, lookup, 27, C.green);
    if (generation > 0) f.rect(origin + lookup, y - 13, generation, 27, C.navy);
    if (changing) f.line(origin, y + 20, end, y + 20, C.gold, 4);
    if (i + 1 === tailRank) f.line(origin, y + 20, end, y + 20, C.blue, 4);
    if (ms !== null)
      f.mono(ms, end + 16, y + 12, 27, ms === lookupMs ? C.green : C.navy);
    else if (releaseProgress === 0)
      f.mono('?', end + 16, y + 12, 34, C.gold);
  });
}
function fact(f, label, v, x, y, sz = 54, col = C.navy) {
  f.tag(label, x, y);
  f.mono(v, x, y + 68, sz, col, 478);
}
export function windowTen(f, practice = false) {
  const { b, cue, on, through, after, base, title, tag, text, mono, rect } = f;
  base('Serving forecast · ten eligible exact misses');
  const changed = practice && on(0, 'change only the active release');
  const progress = changed
    ? through(2, 'a second of generation', 'one thousand twenty milliseconds')
    : 0;
  const initialHits = 6;
  const hits = practice
    ? initialHits - Number(progress === 1)
    : Math.floor(cue(0, 'Now allow six approved hits', 2.6) * 6 + 1e-8);
  const window = servingWindow(10, hits, exampleLatency);
  const showTail = practice && after(3, 'ninety-fifth percentile holds there');
  title(
    practice ? 'Change one reader. Reprice the same ten.' : 'Lookup time follows every request',
  );
  timeBars(f, hits, {
    showBaseline: !practice,
    releaseProgress: changed ? progress : null,
    tailRank: showTail ? window.rank : null,
  });
  const x = 1410;
  rect(x, 210, 22, 22, C.green);
  tag('Lookup', x + 32, 231, C.green);
  rect(x + 156, 210, 22, 22, C.navy);
  tag('Generation', x + 188, 231, C.navy);
  if (changed) {
    tag('Request 6', x, 309);
    const mismatch = on(0, 'Its stored answer is still R seven');
    mono(mismatch ? 'Active R8 / Stored R7' : 'Active R8', x, 357, 33, C.rust);
    mono(exampleLatency.lookupMs + ' ms lookup', x, 407, 36, C.green);
    if (after(2, 'a second of generation'))
      mono(
        '+ ' + exampleLatency.generationMs.toLocaleString('en-US') + ' ms generation',
        x,
        458,
        33,
      );
    else if (progress === 0)
      text('Total duration?', x, 484, 42, C.ink, { face: 'Serif' });
    if (after(2, 'Five requests now generate'))
      fact(f, 'Generation calls', window.generations, x, 535, 56);
    if (after(2, 'five hundred twenty')) {
      fact(f, 'Mean', window.mean + ' ms', x, 672);
      const priorMean = servingWindow(window.n, initialHits, exampleLatency).mean;
      mono('+ ' + (window.mean - priorMean) + ' ms', x + 239, 740, 34, C.muted);
    }
    if (showTail)
      fact(f, 'p95 · rank ' + window.rank, window.p95.toLocaleString('en-US') + ' ms', x, 809, 52);
  } else {
    fact(f, 'Safe hits', hits + ' / 10', x, 314);
    fact(f, 'Generation calls', window.generations, x, 458, 61);
    if (practice || on(0, 'Start with ten misses'))
      fact(f, 'Mean', window.mean + ' ms', x, 611);
    if (!practice && on(0, 'Start with ten misses'))
      fact(f, 'Nearest-rank p95', window.p95 + ' ms', x, 769, 52);
  }
  if (!practice && b === 1 && on(1, 'That is the nearest-rank')) {
    const ms = (v) => v.toLocaleString('en-US') + ' ms';
    text('p95 with 0 or 6 hits   ' + ms(window.p95), 110, 968, 41, C.navy);
    if (on(1, 'To find the tail'))
      text(
        'Fresh only   ' + ms(freshOnly.p95) + '     Gap   +' + ms(window.p95 - freshOnly.p95),
        948, 968, 41, C.rust,
      );
  }
  if (practice && after(4, 'all ten generations')) {
    text('Shadow runs all ' + window.shadowGenerations + ' generations.', 116, 967, 38, C.muted);
  } else if ((!practice && b === 2) || (practice && after(3, 'just under two cents'))) {
    mono(
      '10 × $0.00008  +  ' + window.generations + ' × $0.004  =  $' + window.cost.toFixed(4),
      110,
      966,
      38,
    );
    text('Forecast saving  $' + window.saving.toFixed(4), 1220, 967, 38, C.green);
  }
}
export function budget(f) {
  const { b, on, done, base, title, tag, text, mono, rect, line, mark } = f;
  base('Synthetic prices · eligible exact misses');
  if (b === 6) {
    title('Price the work the service actually avoids');
    f.paper(130, 290, 1640, 586);
    const items = [
      ['Avoided generation', 'Input, prefix discount and actual output length', C.green],
      ['Subtract lookup', 'Every eligible exact miss, including safe hits', C.navy],
      ['Subtract service costs', 'Serving, writes, storage and review', C.rust],
    ];
    items.forEach(([name, detail, color], i) => {
      let y = 410 + i * 150;
      tag(name, 176, y, color);
      text(detail, 666, y, 44, C.ink, { max: 1040 });
      line(176, y + 45, 1710, y + 45);
    });
    return;
  }
  if (b >= 4) {
    title('Do thirty safe hits pay for two thousand lookups?');
    tag('Avoided generation', 135, 334);
    mono('30 × $0.003', 135, 448, 66);
    text('= $0.09', 135, 551, 73, C.navy, { face: 'Serif' });
    tag('Lookup charges', 1015, 334);
    mono('2,000 × $0.00006', 1015, 448, 60);
    text('= $0.12', 1015, 551, 73, C.gold, { face: 'Serif' });
    line(135, 640, 1755, 640);
    if (on(5, 'At these prices')) {
      mono('Net saving   −$' + Math.abs(small.saving).toFixed(2), 135, 769, 66, C.rust);
      text('Break-even at 40 safe hits out of 2,000.', 135, 888, 48);
    } else text('30 / 2,000   =   1.5% safe hits', 135, 794, 52, C.ink, { face: 'Serif' });
    return;
  }
  title(
    b === 3
      ? 'What does shadow mode actually spend?'
      : 'Subtract every lookup from the avoided calls',
  );
  const w = large,
    avoided = w.hits * 0.004,
    lookup = 0.00008 * w.n;
  const vals =
    b === 3
      ? [
          ['Fresh generations', 40, C.navy],
          ['Shadow lookup', lookup, C.gold],
        ]
      : [
          ['Generation avoided', avoided, C.navy],
          ['All lookups', lookup, C.gold],
        ];
  vals.forEach(([label, price, color], i) => {
    if (b === 0 && i === 1) return;
    const y = 366 + i * 170;
    tag(label, 120, y);
    rect(120, y + 39, (price / 40) * 1060, 51, color, 3);
    mono('$' + price.toFixed(3), 1235, y + 86, 59, color);
  });
  if (b === 0) text('5,714 saved calls × $0.004 per generation', 120, 745, 47);
  if (b === 1 && done(1))
    mono(
      'Forecast saving   $' + w.saving.toFixed(3) + '  ≈  $' + w.saving.toFixed(2),
      119,
      800,
      55,
      C.green,
    );
  if (b === 2) {
    mono('$0.00008 / $0.004 = ' + w.breakEven * 100 + '%', 120, 790, 62);
    text('One saved generation pays for 50 lookups.', 120, 897, 42);
  }
  if (b === 3) mono('Actual shadow bill   $' + w.shadowCost.toFixed(2), 120, 792, 59, C.navy);
}
export function latency(f) {
  const { b, on, base, title, tag, text, mono, line, rect, dot } = f,
    w = large;
  base('Sorted latency · 10,000 simulated requests');
  title('Where does rank 9,500 land?');
  const x = 135,
    y = 532,
    width = 1630,
    edge = x + (width * w.hits) / w.n,
    rank = x + (width * (w.rank - 1)) / (w.n - 1);
  rect(x, y, edge - x, 94, C.green);
  rect(edge, y, x + width - edge, 94, C.navy);
  text('5,714 hits  ·  20 ms', x + 25, y + 62, 46, C.white);
  text('4,286 misses  ·  1,020 ms', edge + 24, y + 62, 43, C.white);
  mono('1', x, y + 149, 28);
  f.middle('5,714 | 5,715', edge, y + 149, 30, C.muted);
  mono('10,000', 1622, y + 149, 28);
  if (b > 0 && on(1, 'Rank nine thousand five hundred')) {
    line(rank, 382, rank, 527, C.gold, 4);
    f.poly(
      [
        [rank - 13, 511],
        [rank + 13, 511],
        [rank, 533],
      ],
      C.gold,
    );
    text('Round up   0.95 × 10,000  =  ' + w.rank.toLocaleString('en-US'), 806, 349, 46, C.ink);
  }
  if (b > 0 || f.done(0))
    mono('Mean   (5,714 × 20 + 4,286 × 1,020) / 10,000 = ' + w.mean + ' ms', 132, 827, 40);
  if (on(1, 'Count ranks starting at one'))
    text(
      'p95 with reuse    ' + w.p95.toLocaleString('en-US') + ' ms      /      fresh only    ' +
        freshOnly.p95.toLocaleString('en-US') + ' ms',
      135, 932, 45, C.navy,
    );
}

export function promotion(f) {
  const { b, on, base, title, tag, text, mono, line, mark } = f,
    bigger = b >= 5;
  base('Held-out promotion gate · public-policy scope');
  title(
    bigger ? 'Change one field in the passing report' : 'Which report earns a rollout decision?',
  );
  if (!bigger) {
    const headers = [
      'Reviewed & acceptable',
      '95% lower bound',
      b < 3 ? 'Completed at' : 'Age at 10,000 s',
      'Saving / day',
      'p95 latency',
    ];
    const x = [790, 1140, 1490];
    headers.forEach((v, i) => {
      const y = 377 + i * 85;
      text(v, 117, y, 38);
      line(115, y + 25, 1785, y + 25, C.grid, 2);
    });
    reports.forEach((r, i) => {
      tag('Report ' + ['A', 'B', 'C'][i], x[i], 286);
      const vals = [
        r.reviewed + ' / ' + r.reviewed,
        (100 * wilsonLower(r.acceptable, r.reviewed)).toFixed(2) + '%',
        (b < 3 ? r.created : 10000 - r.created).toLocaleString('en-US') + ' s',
        '$' + r.saving,
        r.p95.toLocaleString('en-US') + ' ms',
      ];
      vals.forEach((v, j) => mono(v, x[i], 377 + j * 85, 35));
      if (b === 4 && on(4, 'Its five hundred successes')) {
        const pass = reportDecision(r).decision.startsWith('promote');
        mark(x[i] - 13, 847, pass, pass ? 'Qualifies' : 'Hold', 287);
      }
    });
    text(
      'Lower bound ≥ 99%     ·     Age 0–3,600 s     ·     Saving ≥ $5/day     ·     p95 0–1,050 ms',
      118,
      963,
      38,
    );
  } else {
    const labels = ['Complete', 'Fewer acceptable', 'Negative saving', 'Old scope'];
    tag('Variant', 113, 305);
    tag('Accepted / reviewed', 614, 305);
    tag('Saving / day', 1120, 305);
    tag('Decision', 1510, 305);
    variants.forEach((r, i) => {
      if (i && b === 5 && !on(5, 'Change the acceptable count')) return;
      let y = 409 + i * 130;
      text(labels[i], 115, y, 43);
      mono(r.acceptable + ' / ' + r.reviewed, 620, y, 37);
      mono((r.saving < 0 ? '−$' : '$') + Math.abs(r.saving).toFixed(3), 1120, y, 38);
      const pass = reportDecision(r).decision.startsWith('promote');
      if (!i || b === 6) mark(1505, y - 2, pass, pass ? 'Qualifies' : 'Hold', 275);
      line(115, y + 49, 1780, y + 49);
    });
    text('A qualifying report supports a rollout decision for this route.', 115, 956, 41);
  }
}
