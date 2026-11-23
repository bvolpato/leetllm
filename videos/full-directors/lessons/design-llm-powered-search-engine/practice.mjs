import {
  C,
  calendar,
  calendarNote,
  cue,
  footer,
  frame,
  line,
  mono,
  paper,
  para,
  quoteLines,
  rect,
  serif,
  tag,
  text,
} from './studio.mjs';
import {
  distinctTop,
  exception,
  fridayCut,
  metrics,
  policy,
  publish,
  quote,
  revised,
  traceAnswer,
  updated,
  windowFor,
} from './evidence.mjs';

export function evaluation(g, c) {
  const b = c.beat.beatIndex,
    both = cue(c, 1, 'Replace the irrelevant hit', 0);
  const hits = [policy.key, policy.key, both ? exception.key : 'FAQ'];
  const gold = [policy.key, exception.key],
    ranked = distinctTop(hits, 2),
    result = metrics(hits, gold, 2);
  const traced = cue(c, 1, 'Now inspect', 0),
    locate = cue(c, 2, 'Repair packing', 0);
  frame(
    g,
    'Held-out search',
    traced ? 'Which stage needs repair?' : 'Did search find both required passages?',
  );
  if (!traced) {
    paper(g, 45, 127, 865, 306);
    mono(g, 'LABELED REQUIREMENTS', 67, 161);
    tag(g, policy.key, 354, 158, C.blue, C.ice);
    tag(g, exception.key, 488, 158);
    line(g, 67, 182, 883, 182);
    mono(g, 'RAW HITS    ' + hits.join('   →   '), 67, 210, 16);
    mono(g, 'DISTINCT RANK', 67, 248);
    mono(g, 'GAIN AT THIS RANK', 548, 248);
    ranked.forEach((id, i) => {
      const y = 280 + i * 40,
        hit = gold.includes(id);
      mono(g, i + 1, 70, y, 18);
      serif(g, id, 134, y, 25, hit ? C.green : C.dim);
      text(
        g,
        hit ? (i === 0 ? '1 / log₂(2) = 1' : '1 / log₂(3) ≈ 0.631') : '0  ·  outside the gold set',
        548,
        y,
        19,
      );
    });
    line(g, 67, 335, 883, 335);
    serif(g, 'Recall   ' + result.recall.toFixed(2), 68, 389, 31);
    serif(g, 'nDCG   ' + result.ndcg.toFixed(4), 547, 389, 31);
    footer(g, 'Ideal top two   /   both relevant   /   discounted gain 1 + 1/log₂(3)');
    return;
  }
  const writing = cue(c, 2, 'If both passages arrived', 0),
    access = cue(c, 2, 'A private citation', 0);
  const example = traceAnswer(access ? 'access' : writing ? 'writing' : 'packing');
  const phases = ['Retrieved', 'Packed', 'Draft under review'];
  phases.forEach((s, i) => {
    const x = 50 + i * 300;
    mono(g, s.toUpperCase(), x, 161, 15);
    paper(g, x, 186, 260, 157);
    if (i === 2) {
      para(g, example.draft, x + 16, 232, 230, 22, 28, access || writing ? C.orange : C.ink);
      mono(
        g,
        access
          ? 'Target   ' + example.cited[0]
          : writing
            ? 'Approval omitted'
            : 'General rule only',
        x + 16,
        315,
        14,
        C.dim,
      );
    } else {
      const ids = i === 0 ? example.retrieved : example.packed;
      tag(g, ids[0], x + 17, 230, C.blue, C.ice);
      if (ids.length === 2) tag(g, ids[1], x + 17, 284);
      else {
        line(g, x + 17, 282, x + 231, 282, C.rule);
        mono(g, 'Exception absent', x + 17, 310, 13, C.dim);
      }
    }
    if (i !== 2) {
      text(g, '→', x + 270, 278, 24, C.dim);
    }
  });
  if (locate) {
    const x = writing ? 650 : 350;
    rect(g, x, 349, 260, 9, C.orange, 2);
    serif(g, example.repair, x, 404, 27, C.orange);
  }
  footer(
    g,
    access
      ? 'An unauthorized citation fails the access check even with complete retrieval.'
      : writing
        ? 'Both sources reached the writer. The draft lost the approval condition.'
        : 'Retrieval still scores 1.00 on both measures. Trace what actually reached the writer.',
  );
}

const freshLines = [
  'Service-account SDK migrations may start within 45 days',
  'after the notice only with security approval',
  'recorded before Friday.',
];
export function practice(g, c) {
  const b = c.beat.beatIndex;
  frame(
    g,
    'Policy update',
    b < 2 ? 'Which pack can the search engine publish?' : 'Does this approval cover day 40?',
  );
  if (b < 2) {
    const showReason = cue(c, 1, 'Withhold both', 0),
      expand = cue(c, 1, 'Extend B through', 0.8);
    const recheck = cue(c, 1, 'The publisher can now release', 0);
    const end = Math.round(fridayCut + (revised.text.length - fridayCut) * expand);
    const access = updated(exception, 2),
      oldOK = publish([quote(policy), quote(exception)], access, revised);
    const currentOK = publish([quote(policy), quote(revised, end)], access, revised);
    paper(g, 46, 122, 865, 163);
    mono(g, 'CURRENT REGISTRY    /    ' + policy.key + '   +   ' + revised.key, 66, 150, 14);
    quoteLines(g, revised, 187, freshLines, end, { x: 66, size: 22, leading: 29 });
    const choices = [
      ['Pack A', exception.key, exception.text.length, oldOK],
      ['Pack B', revised.key, end, currentOK],
    ];
    choices.forEach(([name, id, length, ok], i) => {
      const x = 48 + i * 443;
      rect(g, x, 309, 422, 123, C.page, 4);
      mono(g, name.toUpperCase() + '    /    ' + policy.key + ' complete', x + 15, 335);
      serif(g, id + '    [0, ' + length + ')', x + 15, 374, 25);
      if (showReason)
        tag(
          g,
          i === 0
            ? 'Older revision'
            : recheck && ok
              ? 'Checked pair released'
              : ok
                ? 'Awaiting current access check'
                : 'Cutoff missing',
          x + 15,
          411,
          ok ? (recheck ? C.green : C.dim) : C.orange,
          ok ? (recheck ? C.mint : C.ice) : C.blush,
        );
    });
    footer(
      g,
      recheck
        ? 'Publish the ordinary rule and the new exception, including its cutoff.'
        : 'Compare each revision and the words selected in pack B.',
    );
    return;
  }
  const fri = cue(c, 3, 'Friday misses the cutoff', 0),
    thu = cue(c, 3, 'back to Thursday morning', 0),
    thursdayVerdict = cue(c, 3, 'Now day forty fits', 0);
  const day = thu ? 'Thursday' : 'Friday',
    result = windowFor(revised, day, 40);
  paper(g, 43, 121, 367, 319);
  rect(g, 43, 121, 367, 47, C.pine, 3);
  text(g, 'Days after the deprecation notice', 60, 151, 19, C.white, 'Sans', 600);
  const showVerdict = fri && (!thu || thursdayVerdict);
  calendar(g, 65, 186, 60, 40, showVerdict ? result.limit : 30, Boolean(fri));
  tag(g, 'Approval   /   ' + day + ' morning', 64, 406, C.dim, C.ice);
  paper(g, 433, 121, 479, 319);
  mono(g, policy.key + '   /   Ordinary rule', 452, 152);
  serif(g, 'Start within 30 days.', 452, 190, 26);
  line(g, 452, 214, 887, 214);
  mono(g, revised.key + '   /   Current exception', 452, 245);
  quoteLines(
    g,
    revised,
    277,
    [
      'Service-account SDK migrations may start',
      'within 45 days after the notice only with',
      'security approval recorded before Friday.',
    ],
    revised.text.length,
    { x: 452, size: 20, leading: 27 },
  );
  if (showVerdict)
    serif(
      g,
      result.fits ? 'Day 40 fits.' : 'Day 40 is too late.',
      452,
      408,
      29,
      result.fits ? C.green : C.orange,
    );
  calendarNote(
    g,
    !showVerdict
      ? 'Does the date on the approval record meet the cutoff in the guide?'
      : thursdayVerdict
        ? 'Thursday precedes Friday. The 45-day exception covers the proposed start.'
        : 'Friday morning misses “before Friday.” The ordinary 30-day limit applies.',
  );
}
