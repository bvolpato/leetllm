import { ranked, candidateRecall } from '../../../films/recommendation/construction.mjs';
import { rankScore, developerAggregation } from '../../../films/recommendation/arithmetic.mjs';
import { sourceSlate, judgedListState } from '../../../films/recommendation/model.mjs';
import { discountedSlot, slotFraction } from './retrieval.mjs';
import {
  C,
  B,
  cue,
  spoken,
  base,
  heading,
  text,
  formula,
  rect,
  line,
  circle,
  spine,
  pocket,
  ids,
  doc,
  name,
  hue,
  frac,
} from './art.mjs';

const [guide, run, sdk, blog, log] = ids;
const all = ranked.map((d) => d.id),
  unconstrained = all.slice(0, 3),
  original = sourceSlate().selected;
const platform = sourceSlate({ onlySource: 'platform' });
const noGuide = sourceSlate({ revoked: [guide] }).selected,
  noBlog = sourceSlate({ revoked: [blog] }).selected;
export const timingSamples = [11, 13, 12, 15, 14, 16, 13, 12, 17, 18];
export const percentile = (xs, q) => [...xs].sort((a, b) => a - b)[Math.ceil(q * xs.length) - 1];

export function selection(k) {
  const b = B(k);
  if (k.beat.chapterId === 'c23') {
    const decided = cue(k, 3, 'The blog takes');
    return {
      reserve: all,
      rows: decided ? original : b === 1 ? unconstrained : [guide, run, null],
      label: b === 1 ? 'Unconstrained proposal' : 'Source-capped proposal',
      policy: b >= 2,
      report: b > 4 || (b === 4 && k.elapsed >= k.speechDuration),
    };
  }
  if (k.beat.chapterId === 'c24') {
    const restricted = cue(k, 2, 'Now remove the community pages');
    const picked = restricted ? platform.selected : original;
    const count = restricted
      ? 2
      : b === 1
        ? 0
        : cue(k, 2, 'take the community blog')
          ? 3
          : cue(k, 2, 'Take the runbook')
            ? 2
            : 1;
    return {
      reserve: restricted ? platform.order.map((d) => d.id) : all,
      rows: [0, 1, 2].map((i) => (i < count ? picked[i] : null)),
      label: 'Source-capped proposal',
      policy: true,
      under: restricted && b >= 3,
    };
  }
  const replay = cue(k, 6, 'Restore the original'),
    revoked = replay
      ? cue(k, 6, 'revoke only the blog')
        ? blog
        : null
      : cue(k, 1, 'revoke access to the guide')
        ? guide
        : null;
  let rows = original;
  if (revoked === guide) {
    if (cue(k, 3, 'The SDK example takes')) rows = noGuide;
    else if (cue(k, 3, 'Take the runbook first')) rows = [run, null, blog];
    else rows = [null, run, blog];
  }
  if (revoked === blog) rows = cue(k, 7, 'Use the changelog') ? noBlog : [guide, run, null];
  const report =
    revoked === guide
      ? spoken(k, 4, 'System NDCG is one')
      : revoked === blog
        ? spoken(k, 7, 'point eight five six')
        : false;
  return {
    reserve: all,
    rows,
    revoked,
    label: revoked ? 'Current display check' : 'Original proposal',
    policy: true,
    report,
    ideal: revoked === guide && !replay && cue(k, 4, 'The best three'),
  };
}
export function slate(c, k) {
  base(c);
  const s = selection(k),
    cid = k.beat.chapterId;
  const title =
    cid === 'c28'
      ? 'Access changed just before display'
      : cid === 'c24'
        ? 'What if retrieval supplies only platform pages?'
        : 'Who gets the third slot?';
  heading(c, title, 'Developer portal   /   payment retry search');
  text(c, 'Reserve in score order', 102, 302, 40, C.ink, 'serif');
  text(c, 'Score', 697, 302, 32, C.quiet);
  text(c, 'Source', 856, 302, 32, C.quiet);
  s.reserve.forEach((id, i) => {
    const y = 351 + i * 99,
      revoked = id === s.revoked;
    spine(c, id, 101, y, 528, 68, '', revoked);
    formula(c, frac(rankScore(doc(id))), 673, y + 47, 156, 38);
    text(c, doc(id).source, 855, y + 44, 29, C.quiet, 'mono', 'left', 193);
    if (revoked) {
      rect(c, 110, y + 10, 508, 48, '#eee2cd');
      text(c, name(id) + '  /  revoked', 126, y + 45, 32, C.red, 'mono', 'left', 480);
    }
  });
  text(c, s.label, 1100, 302, 40, C.ink, 'serif');
  s.rows.forEach((id, i) => {
    const y = 352 + i * 137;
    text(c, String(i + 1), 1097, y + 68, 47, C.quiet, 'serif');
    if (id) spine(c, id, 1154, y, 642, 92, doc(id).source);
    else pocket(c, 1154, y, 642, 92, s.under ? 'Unfilled' : 'Open slot');
  });
  if (cid === 'c28' && B(k) === 3) {
    const trace = cue(k, 3, 'Follow the reserve down one row', 0.85);
    if (trace > 0) {
      const y = 351 + 2 * 99 + 34,
        top = 352 + 137 + 10;
      line(
        c,
        [
          [1045, y],
          [1045 + 38 * trace, y],
          [1045 + 38 * trace, y + (top - y) * trace],
          [1045 + 106 * trace, y + (top - y) * trace],
        ],
        hue(sdk),
        5,
      );
    }
  }
  if (s.policy) {
    const count = s.rows.filter((id) => id && doc(id).source === 'platform').length;
    for (let j = 0; j < 2; j++)
      circle(c, 1196 + j * 54, 802, 18, j < count ? hue(guide) : null, hue(guide));
    text(c, count + ' / 2 platform places', 1303, 814, 30, C.quiet, 'mono', 'left', 492);
  }
  if (cid === 'c23' && cue(k, 3, 'We traded a grade two') && !s.report) {
    const known = B(k) > 3 || k.elapsed >= k.speechDuration;
    [unconstrained[2], s.rows[2]].forEach((id, i) => {
      const x = i ? 1010 : 105;
      const term = discountedSlot(doc(id).relevance, 3);
      text(c, 'Slot 3 with the ' + name(id), x, 903, 38, hue(id));
      formula(c, slotFraction(term) + (known ? ' = ' + term.contribution : ''), x, 976, 804, 51);
    });
  } else if (s.report || s.ideal) {
    const r = judgedListState(s.rows, { revoked: s.revoked ? [s.revoked] : [] });
    if (cid === 'c28') {
      text(c, 'Displayed grades [' + r.grades.join(', ') + ']', 103, 857, 32, C.ink, 'mono');
      text(c, 'Eligible ideal [' + r.ideal.join(', ') + ']', 680, 857, 32, C.ink, 'mono');
      if (s.report) formula(c, 'System NDCG@3  ' + frac(r.system), 1260, 857, 528, 39, C.teal);
    } else {
      text(c, 'Displayed grades  [' + r.grades.join(', ') + ']', 103, 900, 34, C.ink, 'mono');
      text(c, 'Eligible ideal    [' + r.ideal.join(', ') + ']', 103, 963, 34, C.ink, 'mono');
      if (s.report) formula(c, 'System NDCG   ' + frac(r.system), 1100, 950, 703, 45, C.teal);
    }
  } else if (cid === 'c24' && s.under)
    text(
      c,
      'A third result needs an eligible page from another source.',
      107,
      962,
      42,
      C.ink,
      'serif',
    );
}
export function gateState(k) {
  const capped = Boolean(cue(k, 3, 'Substituting the source-constrained slate')),
    rows = capped ? original : unconstrained;
  const report = judgedListState(rows),
    p95 = percentile(timingSamples, 0.95);
  return { capped, rows, report, p95, pass: report.system >= 0.95 };
}
export function gate(c, k) {
  base(c);
  const s = gateState(k);
  heading(c, 'Does this slate clear its quality floor?', 'Offline fixture   /   one judged query');
  text(c, s.capped ? 'Source cap applied' : 'Unconstrained order', 111, 336, 38, C.quiet, 'mono');
  s.rows.forEach((id, i) => spine(c, id, 111, 379 + i * 124, 673, 91, 'g' + doc(id).relevance));
  const left = 903,
    scale = 822;
  text(c, 'System NDCG@3', left, 351, 44, C.ink, 'serif');
  rect(c, left, 414, scale, 77, '#dbd4bd');
  rect(c, left, 414, s.report.system * scale, 77, s.pass ? C.teal : C.red);
  const floor = left + 0.95 * scale;
  line(
    c,
    [
      [floor, 383],
      [floor, 516],
    ],
    C.ink,
    4,
  );
  text(c, '0.95 floor', floor, 572, 33, C.ink, 'mono', 'center');
  formula(
    c,
    frac(s.report.system) + (s.pass ? '   PASS' : '   FAIL'),
    left,
    697,
    870,
    64,
    s.pass ? C.teal : C.red,
  );
  if (B(k) >= 2) {
    const ys = 865;
    timingSamples
      .slice()
      .sort((a, b) => a - b)
      .forEach((v, i) => {
        rect(c, 114 + i * 55, ys - v * 4, 40, v * 4, i === 9 ? C.blue : '#a9bbb1');
      });
    text(
      c,
      'Sample p95  ' + s.p95 + ' ms  /  limit 20 ms',
      111,
      935,
      31,
      C.quiet,
      'mono',
      'left',
      750,
    );
  }
  text(
    c,
    s.capped
      ? 'Recheck policy and final-slate metrics.'
      : 'Recall@5 = ' + frac(candidateRecall(5)) + '     Reranker NDCG@5 = 1',
    905,
    885,
    33,
    C.quiet,
    'sans',
    'left',
    884,
  );
}
export function experiment(c, k) {
  base(c);
  const b = B(k),
    m = developerAggregation();
  heading(
    c,
    b >= 4 ? 'When can the efficacy comparison start?' : 'Two developers, ten sessions',
    'Randomized experiment   /   assignment by developer',
  );
  if (b >= 4) {
    const inputs = [
      ['Minimum duration', '14 days'],
      ['Each arm', '5,000 developers'],
    ];
    inputs.forEach(([label, value], i) => {
      const x = 115 + i * 865;
      text(c, label, x, 379, 39, C.quiet, 'mono');
      text(c, value, x, 529, 87, C.ink, 'serif', 'left', 823);
    });
    line(
      c,
      [
        [122, 610],
        [1770, 610],
      ],
      C.rule,
    );
    text(
      c,
      'One efficacy analysis after both minimums',
      118,
      746,
      54,
      C.teal,
      'serif',
      'left',
      1665,
    );
    text(
      c,
      b === 4
        ? 'Choose sample size from the effect size and power.'
        : 'Safety monitoring starts on day one.',
      119,
      890,
      38,
    );
    return;
  }
  m.rows.forEach(([resolved, count], i) => {
    const y = 355 + i * 209;
    text(c, 'Developer ' + String.fromCharCode(65 + i), 110, y + 58, 46, C.ink, 'serif');
    for (let j = 0; j < count; j++) {
      circle(c, 548 + j * 82, y + 43, 29, j < resolved ? C.teal : '#d3ccb6');
      if (j < resolved)
        line(
          c,
          [
            [534 + j * 82, y + 42],
            [546 + j * 82, y + 55],
            [565 + j * 82, y + 33],
          ],
          C.pale,
          4,
        );
    }
    formula(c, resolved + ' / ' + count, 1431, y + 64, 356, 47);
  });
  text(c, 'Each circle is one session. A check marks a resolution.', 111, 788, 34, C.quiet);
  if (cue(k, 3, 'The equal-developer mean')) {
    formula(c, 'Equal developers   ' + frac(m.mean, 3), 111, 932, 820, 42, C.teal);
    formula(c, 'Pooled sessions   ' + frac(m.pooled, 3), 1003, 932, 810, 42, C.ink);
  }
}
