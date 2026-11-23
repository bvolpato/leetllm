import { clickExamples } from '../../../films/recommendation/fixtures.mjs';
import {
  correctedRate,
  examinationState,
  eventIntegrity,
} from '../../../films/recommendation/arithmetic.mjs';
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
  arrow,
  pocket,
  spine,
  book,
  ids,
  hue,
  frac,
  dots,
} from './art.mjs';

const [guide, run, sdk, blog, log, privatePage] = ids;
export function clickState(k) {
  return clickExamples.map((row, i) => ({
    ...row,
    hasClicks: Boolean(cue(k, 1, i ? 'Twenty second-slot' : 'Forty top-slot')),
    hasP: Boolean(cue(k, 2, i ? 'In slot two' : 'Assume everyone')),
    hasEstimate: spoken(k, i ? 3 : 2, 'point four'),
    estimate: correctedRate(row),
  }));
}
export function clickTrace(c, k) {
  base(c);
  heading(
    c,
    'Trace each click to its displayed slot',
    'Browser impressions   /   payment retry search',
  );
  const rows = clickState(k);
  text(c, 'Browser', 113, 323, 38, C.ink, 'serif');
  text(c, 'One dot per impression', 698, 323, 35, C.ink, 'serif');
  text(c, 'Position model', 1380, 323, 35, C.ink, 'serif');
  rows.forEach((r, i) => {
    const id = [guide, run][i],
      y = 380 + 246 * i;
    text(c, 'Slot ' + r.position, 111, y, 32, C.quiet, 'mono');
    spine(c, id, 107, y + 28, 502, 79);
    line(
      c,
      [
        [615, y + 66],
        [656, y + 66],
        [656, y + 28],
        [694, y + 28],
      ],
      hue(id),
      4,
    );
    const track = cue(k, 1, i ? 'Twenty second-slot' : 'Forty top-slot', 0.85);
    if (track > 0 && track < 1) {
      const travel = track * 2;
      const tx = travel < 1 ? 694 - travel * 38 : 656 - (travel - 1) * 40;
      const ty = y + (travel < 1 ? 28 + 38 * travel : 66);
      circle(c, tx, ty, 11, hue(id));
    }
    dots(c, 714, y + 22, r.impressions, 20, 26, (j) =>
      r.hasClicks && j < r.clicks ? hue(id) : '#c8c6b5',
    );
    text(
      c,
      r.hasClicks ? r.clicks + ' clicks / ' + r.impressions + ' impressions' : '100 impressions',
      705,
      y + 183,
      30,
      C.quiet,
      'mono',
    );
    if (r.hasP) {
      text(c, 'p(exam) = ' + frac(r.propensity, 1), 1375, y + 36, 32, C.quiet, 'mono');
      if (r.hasEstimate) {
        formula(
          c,
          frac(r.clicks / r.impressions, 2) + ' / ' + frac(r.propensity, 1),
          1374,
          y + 97,
          428,
          44,
        );
        formula(c, '= ' + frac(r.estimate, 2), 1374, y + 165, 428, 50, C.teal);
      }
    }
  });
  if (B(k) === 1 && cue(k, 1, 'The second slot is only half'))
    text(
      c,
      'Slot 2 gets half the examination opportunity. Which rate is higher after correction?',
      110,
      856,
      42,
      C.ink,
      'serif',
      'left',
      1727,
    );
}
export function anchorState(k) {
  const low = Boolean(cue(k, 3, 'If the first slot'));
  return clickExamples.map((r, i) =>
    examinationState({ ...r, probability: r.propensity * (low ? 0.8 : 1) }),
  );
}
export function anchors(c, k) {
  base(c, true);
  const b = B(k);
  heading(
    c,
    b < 4 ? 'Keep the ratio. Change the anchor.' : 'What does clipping cost?',
    'Examination × relevance   /   position model',
    true,
  );
  if (b < 4) {
    ['Raw CTR', 'Absolute p(exam)', 'Estimated relevance'].forEach((s, i) =>
      text(c, s, 387 + i * 501, 357, 35, C.muted, 'serif'),
    );
    anchorState(k).forEach((r, i) => {
      const y = 480 + i * 201;
      text(c, 'Slot ' + (i + 1), 111, y + 26, 37, C.pale, 'mono');
      [r.raw, r.probability, r.corrected].forEach((v, j) => {
        const x = 390 + j * 502;
        rect(c, x, y, 354, 32, '#344e50');
        rect(c, x, y, 354 * v, 32, [C.gold, '#9eb4df', '#77cfab'][j]);
        text(c, frac(v, 2), x, y + 104, 50, C.pale, 'mono');
      });
    });
    text(c, 'Slot 2 examination / slot 1 examination = 0.5', 112, 958, 39, C.muted, 'mono');
    return;
  }
  const showCap = cue(k, 4, 'Cap that weight at ten'),
    cap = showCap ? 10 : Infinity;
  const r = examinationState({ probability: 0.02, cap, relevance: 0.5 });
  text(c, 'Rare examination', 110, 349, 42, C.pale, 'serif');
  dots(c, 126, 418, 100, 20, 33, (i) => (i < 2 ? C.gold : '#426563'));
  text(c, 'p(exam) = 0.02    p(relevant) = 0.50', 111, 643, 37, C.muted, 'mono');
  text(c, showCap ? 'Capped weight' : 'Inverse weight', 1013, 351, 42, C.pale, 'serif');
  formula(c, String(r.weight), 1009, 545, 630, 148, C.gold);
  if (b === 5) {
    formula(c, 'Uncapped   50 × 0.02 × 0.5 = 0.50', 112, 801, 1720, 42, C.muted);
    formula(c, 'Capped     10 × 0.02 × 0.5 = ' + frac(r.expected, 2), 112, 903, 1720, 45, C.pale);
  } else text(c, 'Expected contribution per impression?', 110, 883, 48, C.pale, 'serif');
}
export function support(c, k) {
  base(c);
  const b = B(k);
  heading(
    c,
    'Which actions have exposure evidence?',
    'Logging-policy support   /   permitted exploration',
  );
  const swap = cue(k, 2, 'randomized exploration');
  const order = swap ? [blog, guide] : [guide, blog];
  order.forEach((id, i) => {
    const x = 112 + 533 * i;
    text(c, 'Displayed slot ' + (i + 1), x, 350, 31, C.quiet, 'mono');
    book(c, id, x, 392, 393, 327);
  });
  text(c, 'Outside the shortlist', 1228, 350, 31, C.quiet, 'mono');
  book(c, sdk, 1230, 392, 392, 327, { muted: true });
  text(c, '0 impressions', 1233, 809, 40, C.red, 'mono');
  text(
    c,
    swap
      ? 'Only permitted pages may swap.'
      : 'Selection probability belongs to the logging policy.',
    111,
    815,
    36,
    C.ink,
    'sans',
    'left',
    1043,
  );
  if (b === 2)
    text(c, 'Check presentation and trust effects against task resolution.', 111, 959, 35, C.quiet);
}
export const impressions = [guide, run, sdk].map((document, i) => ({
  request: 'R1',
  document,
  position: i + 1,
}));
export const events = [
  { id: 'E1', request: 'R1', document: guide, type: 'click' },
  { id: 'E2', request: 'R1', document: guide, type: 'resolved' },
];
export function eventState(k) {
  const orphan = cue(k, 3, 'one outcome for a page') && !cue(k, 3, 'Remove that orphan');
  const duplicate = cue(k, 3, 'Now log the same click') && B(k) === 3;
  const outcomes = orphan
    ? [...events, { id: 'E3', request: 'R1', document: blog, type: 'click' }]
    : duplicate
      ? [...events, events[0]]
      : events;
  return { outcomes, integrity: eventIntegrity(impressions, outcomes) };
}
export function logJoin(c, k) {
  base(c);
  heading(c, 'Join on request and document', 'Trace R1   /   browser and outcome log');
  const b = B(k),
    seen = cue(k, 1, 'record its position'),
    s = eventState(k);
  text(c, seen ? 'Displayed impressions' : 'Server proposal', 113, 321, 40, C.ink, 'serif');
  text(c, 'Later outcomes', 1111, 321, 40, C.ink, 'serif');
  impressions.forEach((r, i) =>
    spine(c, r.document, 109, 373 + i * 139, 618, 82, (seen ? 'R1   #' : 'slot ') + r.position),
  );
  if (cue(k, 1, 'Later, a click'))
    s.outcomes.forEach((r, i) => {
      const y = 390 + i * 129,
        match = impressions.find((imp) => imp.document === r.document && imp.request === r.request);
      if (seen && match)
        line(
          c,
          [
            [736, 414 + (match.position - 1) * 139],
            [805 + i * 48, 414 + (match.position - 1) * 139],
            [921 + i * 48, y + 24],
            [1085, y + 24],
          ],
          i === 2 ? C.red : C.teal,
          4,
        );
      circle(c, 1104, y + 24, 10, match ? C.teal : C.red);
      formula(c, r.id + '  ' + r.type + '  ' + r.request, 1130, y + 33, 656, 35);
      text(c, r.document, 1130, y + 79, 31, match ? C.quiet : C.red, 'mono');
    });
  if (b >= 2) {
    text(
      c,
      s.integrity.join ? 'All outcomes join' : 'Unmatched outcome',
      108,
      900,
      44,
      s.integrity.join ? C.teal : C.red,
      'serif',
    );
    text(
      c,
      s.integrity.unique ? 'Event IDs unique' : 'Duplicate event ID',
      1064,
      900,
      44,
      s.integrity.unique ? C.teal : C.red,
      'serif',
    );
  }
  if (b === 4)
    text(c, 'Keep unclicked impressions. Check timestamps and event types.', 108, 996, 31, C.quiet);
}
export function attribution(c, k) {
  base(c);
  heading(c, 'Did the developer see the guide?', 'Trace R1   /   from proposal to resolution');
  const displayed = cue(k, 2, 'A browser impression'),
    resolved = cue(k, 2, 'A later resolution');
  const stations = [
    ['Server proposal', 'guide  ·  proposed #1', true],
    ['Browser display', 'guide  ·  displayed #1', displayed],
    ['Outcome', 'guide  ·  resolved', resolved],
  ];
  stations.forEach(([title, desc, known], i) => {
    const x = 110 + i * 596;
    text(c, i === 1 && !displayed ? 'Exposure evidence' : title, x, 369, 42, C.ink, 'serif');
    if (known) {
      if (i < 2) book(c, guide, x + 40, 424, 299, 245);
      else {
        circle(c, x + 176, 536, 104, '#d7e6d8');
        line(
          c,
          [
            [x + 119, 537],
            [x + 158, 574],
            [x + 236, 485],
          ],
          C.teal,
          15,
        );
      }
      text(c, 'R1', x, 737, 37, C.teal, 'mono');
      text(c, desc, x, 797, 32, C.ink, 'mono', 'left', 503);
    } else {
      pocket(c, x + 5, 424, 385, 245, 'No observation yet');
    }
    if (i < 2) arrow(c, x + 412, 546, x + 535, 546);
  });
  if (B(k) === 3)
    text(
      c,
      'A joined resolution records sequence. Random assignment tests impact.',
      109,
      957,
      39,
      C.ink,
      'serif',
      'left',
      1710,
    );
}
