import { C, mix } from './ink.mjs';
import {
  FOLLOW_UP,
  RECOVERY_QUERY,
  SUPPORT_PAGES,
  REQUIRED_RUNBOOKS,
  PROPOSALS,
  subject,
  pageMatches,
  proposalsThrough,
  run,
  rankDenominator,
  rankContributions,
  retrievalAfter,
  shortName,
  folio,
  comparison,
  report,
  incidentSearch,
  permittedMatches,
  trace,
  rule,
  overage,
} from './evidence.mjs';

export function reader(p, replay = false) {
  const { at, base, film, rect, mono, serif, text, line, slip, words, tag, band, beat } = p;
  const history = replay || at(2, 'Open the earlier turn');
  const subjectRun = replay || at(2, 'Take just the subject');
  const fullRun = replay && at(1, 'Search for');
  const query = fullRun ? RECOVERY_QUERY : subjectRun ? subject : FOLLOW_UP;
  const scored = replay
    ? fullRun
      ? at(2, 'The recovery guide wins')
      : true
    : subjectRun
      ? at(3, 'The recovery guide matches')
      : at(2, 'The account overview wins');
  const matches = pageMatches(query);
  base(
    'SUPPORT ARCHIVE   /   WORD MATCH',
    replay ? 'What action should the search describe?' : 'Which page matches this search?',
  );
  film(38, 120, 884, 105);
  mono('SEARCH WINDOW', 57, 151, 14, C.amber);
  serif(query, 55, 198, 36, C.white, 845);
  if (history) {
    const t = replay ? 1 : at(2, 'Open the earlier turn', 0.65);
    p.c.save();
    p.c.beginPath();
    p.c.rect(38, 242, 884 * t, 46);
    p.c.clip();
    rect(38, 242, 884 * t, 46, C.sky, 2);
    text('Earlier message     “My API key leaked.”', 54, 273, 24, C.blue);
    p.c.restore();
  } else {
    line(38, 265, 922, 265, C.edge);
    tag('Latest turn only', 387, 251, 178, C.paper, C.soft);
  }
  SUPPORT_PAGES.forEach((page, i) => {
    const x = 38 + i * 452;
    const score = matches[i].length;
    const best = scored && score === Math.max(...matches.map((a) => a.length));
    slip(x, 306, 432, 123, best ? C.white : '#f7f4e8');
    text(page.id, x + 25, 337, 24, C.ink, 'Serif');
    words(page.text, x + 25, 375, scored ? matches[i] : [], 390, 20);
    const previousQuery = fullRun ? subject : FOLLOW_UP;
    const previousScore = pageMatches(previousQuery)[i].length;
    const currentScore = scored ? score : '?';
    mono(
      subjectRun
        ? 'Previous: ' + previousScore + '    Current matches: ' + currentScore
        : scored
          ? score + ' distinct matches'
          : 'Count distinct words',
      x + 25,
      412,
      15,
      best ? C.jade : C.soft,
    );
    if (best) rect(x, 306, 6, 123, C.jade);
  });
  if (replay && at(2, 'Compare the three searches')) {
    const scores = [FOLLOW_UP, subject, RECOVERY_QUERY].map((q) => pageMatches(q)[1].length);
    band(
      'Recovery guide matches     Follow-up  ' +
        scores[0] +
        '     /     Subject  ' +
        scores[1] +
        '     /     Full rewrite  ' +
        scores[2],
    );
  } else if (replay)
    band(
      fullRun
        ? scored
          ? 'Recovery guide   ·   Same two pages and caller grant'
          : 'Count the words on each page.'
        : 'The subject identifies a page. Which recovery task belongs in the query?',
    );
  else
    band(
      beat === 1
        ? 'Use only the words in the search window.'
        : subjectRun
          ? scored
            ? '“API key” retrieves the recovery guide.'
            : 'Run the same index with the recovered subject.'
          : history
            ? 'Read the earlier message. What subject can search use?'
            : '“What”, “I”, and “do” favor the account overview.',
    );
}

export function variants(p) {
  const { at, base, mono, slip, serif, text, rect, tag, band, line } = p;
  const cues = [
    'Take the burst',
    'Skip the duplicate',
    'Admit the queue',
    'and the capacity',
    'The traffic proposal',
  ];
  const count = cues.filter((s) => at(2, s)).length;
  const admitted = proposalsThrough(count);
  base('QUERY EXPANSION   /   THREE EXTRA SEARCHES', 'Which wordings earn a search?');
  slip(38, 121, 884, 65);
  mono('ORIGINAL • RETAINED', 61, 145);
  serif(run.queries[0], 320, 165, 31);
  mono('PROPOSALS', 39, 223);
  mono('SEARCH SLOTS', 548, 223);
  PROPOSALS.forEach((s, i) => {
    const y = 238 + i * 37;
    const active = i < count;
    if (active) rect(38, y - 2, 470, 33, i === 1 || i === 4 ? C.shade : C.mint, 2);
    text(s.trim(), 51, y + 21, 20);
    if (active)
      mono(
        i === 1 ? 'duplicate' : i === 4 ? 'cap reached' : 'admit',
        500,
        y + 21,
        13,
        i === 1 || i === 4 ? C.rust : C.jade,
        95,
        'right',
      );
  });
  for (let i = 0; i < 3; i++) {
    const y = 236 + i * 59;
    rect(546, y, 375, 48, admitted[i] ? C.dark : C.shade, 3);
    mono(i + 1, 560, y + 31, 18, admitted[i] ? C.amber : C.soft);
    text(admitted[i] ?? 'Open', 596, y + 31, 20, admitted[i] ? C.white : C.soft);
  }
  line(523, 222, 523, 421, C.edge);
  band(
    admitted.length + ' of 3 extra slots used   ·   Search within the caller’s authorized pages.',
  );
}

export function ranks(p) {
  const { after, base, mono, text, rect, serif, line, band } = p;
  const first = after(2, 'one over sixty-one');
  const second = after(3, 'another one over sixty-two', 0.7, 'The queue guide collects');
  const winner = after(3, 'That puts the queue guide first', 0, 'That puts the queue guide first');
  const complete = second === 1 && winner === 1;
  const columnX = (j) => 291 + j * 133;
  const barX = 645;
  const scoreScale = 7200;
  const leader = run.fused[0];
  const secondColumn = run.rankings.findIndex((r) => r[1] === leader.id);
  const firstTerm = '1/' + rankDenominator(1);
  const secondTerm = '1/' + rankDenominator(2);
  base('RANK FUSION   /   SAME THREE SEARCHES', 'How does a second place change the score?');
  mono('Page', 40, 149);
  ['Burst quota', 'Queue overload', 'Capacity + backpressure'].forEach((s, j) =>
    mono(s, columnX(j), 149, 14, C.soft, 127, 'center'),
  );
  mono(complete ? 'Fused score (rounded)' : 'First-place subtotal', barX, 149);
  Object.keys(shortName).forEach((id, i) => {
    const y = 169 + i * 82;
    const rowColor = i % 2 ? C.white : '#e4e6da';
    const firstScore = rankContributions(id, 1).reduce((a, b) => a + b, 0);
    const leads = complete && id === leader.id;
    const score = leads ? leader.score : firstScore;
    const firstWidth = firstScore * scoreScale;
    const scoreWidth = score * scoreScale;
    rect(38, y, 884, 73, rowColor, 3);
    serif(shortName[id], 54, y + 34, 27);
    mono('FOLIO ' + folio[id], 55, y + 57, 15, C.soft);
    run.rankings.forEach((r, j) => {
      const rank = r.indexOf(id) + 1;
      const x = columnX(j);
      const counted = (rank === 1 && first) || (rank === 2 && second);
      if (counted) rect(x - 17, y + 6, 34, 30, rank === 2 ? C.amber : C.mint, 4);
      text(rank || '·', x, y + 31, 25, rank ? C.ink : C.soft, 'Mono', 50, 'center');
      if (counted && (rank === 1 || complete)) {
        mono('1/' + rankDenominator(rank), x, y + 60, 19, rank === 2 ? C.rust : C.jade, 90, 'center');
      }
    });
    if (!first) {
      mono('?', barX, y + 39, 23);
      return;
    }
    mono(score.toFixed(5), barX, y + 30, 22, leads ? C.jade : C.ink);
    line(barX, y + 67, 900, y + 67, C.edge, 2);
    rect(barX, y + 63, firstWidth, 8, C.jade, 2);
    if (leads) {
      rect(barX + firstWidth, y + 63, scoreWidth - firstWidth, 8, C.amber, 2);
      mono('#1', 900, y + 30, 22, C.jade, 60, 'right');
    }
    if (id === leader.id && second && !complete) {
      const destination = barX + (firstWidth + leader.score * scoreScale) / 2;
      const x = mix(columnX(secondColumn), destination, second);
      rect(x - 34, y + 37, 68, 25, C.amber, 4);
      mono('+' + secondTerm, x, y + 56, 19, C.rust, 64, 'center');
    }
  });
  band(
    complete
      ? shortName[leader.id] + '    ' + firstTerm + ' + ' + secondTerm + '  ≈  ' + leader.score.toFixed(5)
      : second
        ? 'Add the second-place contribution to the same page’s score.'
        : first
          ? 'Each first place earns ' + firstTerm + '. Which page also has a second place?'
          : 'One-based ranks   ·   A dot means the page was absent.',
  );
}

export function coverage(p) {
  const { after, base, mono, rect, serif, line, band, film } = p;
  const fused = after(3, 'The fused list now contains both required pages', 0, 'The fused list');
  const burst = after(2, 'The burst policy comes back');
  const showHit = after(2, 'Any hit at three now scores one');
  const showRecall = after(
    3,
    'Recall at three goes from one half to two out of two',
    0,
    'Recall at three',
  );
  const queueOpen = after(3, 'Open the queue guide');
  const bounce = after(
    3,
    'rejects the next arrival when the queue fills',
    1.25,
    'This service rejects',
  );
  const { ids, coverage } = retrievalAfter(fused ? 4 : burst ? 2 : 1);
  function sourceTag(id, x, y, width) {
    const queue = id === 'queue-guide';
    const required = REQUIRED_RUNBOOKS.includes(id);
    const background = queue ? C.sky : required ? C.mint : C.shade;
    const color = queue ? C.blue : required ? C.jade : C.soft;
    rect(x, y, width, 30, background, 3);
    mono(folio[id] + '   ' + shortName[id], x + 10, y + 22, 18, color, width - 20);
  }

  base('RUNBOOK   /   REQUIRED EVIDENCE', 'Can we answer both parts of the launch question?');
  REQUIRED_RUNBOOKS.forEach((id, i) => {
    const x = 39 + i * 450,
      found = ids.includes(id);
    film(x, 127, 431, 234);
    rect(x + 11, 152, 409, 184, found ? C.white : '#e0e0d4');
    mono(i ? 'WHEN THE QUEUE FILLS' : 'BURST ALLOWANCE', x + 27, 182, 15, C.soft);
    line(x + 27, 194, x + 395, 194, C.edge);
    if (!found) {
      mono('NEEDS ' + shortName[id].toUpperCase(), x + 27, 228, 16, C.soft);
      serif('Awaiting source', x + 26, 275, 33, C.soft);
      return;
    }
    sourceTag(id, x + 25, 206, 220);
    const finding = i
      ? bounce > 0.5
        ? 'Reject new arrivals'
        : queueOpen
          ? 'Queue at capacity'
          : 'Queue guide found'
      : '8 extra requests';
    serif(finding, x + 25, 275, 33);
    if (i) {
      if (!queueOpen) return;
      rect(x + 28, 294, 145, 27, C.blue, 3);
      for (let j = 0; j < 4; j++) rect(x + 32 + j * 35, 298, 28, 19, C.sky, 2);
      line(x + 180, 291, x + 180, 324, bounce > 0.5 ? C.rust : C.soft, 4);
      const requestX = x + 185 + 72 * Math.abs(1 - 2 * bounce);
      rect(requestX, 297, 27, 21, bounce > 0.5 ? C.rust : C.blue, 2);
      if (bounce > 0.5) p.arrow(x + 188, 324, x + 251, 324, C.rust);
    } else {
      for (let j = 0; j < 8; j++) rect(x + 27 + j * 39, 295, 29, 23, C.rust, 3);
    }
  });
  mono('TOP 3', 38, 399, 16, C.soft);
  if (!ids.length) serif('No matches for “peak demand handling”', 120, 400, 24, C.soft);
  ids.forEach((id, i) => sourceTag(id, 120 + i * 242, 378, 220));
  band(
    'Any hit @ 3     ' +
      (burst && !showHit ? '…' : coverage.hit) +
      '                Required-page recall @ 3     ' +
      (fused && !showRecall ? '…' : coverage.found.length) +
      ' / ' + REQUIRED_RUNBOOKS.length,
  );
}

export function endpoints(p) {
  const { at, base, mono, text, rect, serif, line, band, beat, arrow, film, tag } = p;
  if (beat <= 3) {
    const launched = at(2, 'All six can start together');
    const dispatch = at(2, 'All six can start together', 0.8);
    const progress = at(2, 'Watch for a source', 1.35);
    const endpoints = ['sync', 'batch'];
    base(
      launched ? 'ENDPOINT COMPARISON   /   INDEPENDENT LOOKUPS' : 'ENDPOINT COMPARISON   /   PROPOSED QUERIES',
      launched ? 'What comes back for each query?' : 'Which lookups can start now?',
    );
    mono('Fact', 40, 149);
    endpoints.forEach((endpoint, i) => mono(endpoint.toUpperCase(), 275 + i * 340, 149, 18, C.blue));
    comparison.forEach(([name, ...values], r) => {
      const y = 168 + r * 89;
      serif(name, 40, y + 43, 28);
      values.forEach((value, j) => {
        const x = 256 + j * 340,
          seen = Boolean(value && progress >= (r * 2 + j + 1) / 7);
        rect(x, y, 326, 74, seen ? C.white : C.shade, 3);
        if (!launched) {
          text(endpoints[j] + ' endpoint ' + name.toLowerCase(), x + 14, y + 45, 23);
          return;
        }
        const id = (j ? 'B' : 'S') + (r + 1);
        const empty = beat === 3 && !value;
        mono(
          seen ? 'SOURCE ' + id : empty ? 'EMPTY RETURN' : 'SEARCHING',
          x + 14,
          y + 23,
          14,
          seen ? C.jade : C.soft,
        );
        text(
          seen ? value : empty ? 'No source found' : 'In flight',
          x + 14,
          y + 56,
          23,
        );
        if (!seen && !empty) {
          line(x + 190, y + 46, x + 298, y + 46, C.edge, 3);
          p.circle(mix(x + 190, x + 298, dispatch), y + 46, 5, C.blue);
        }
      });
    });
    band(
      beat === 3
        ? 'Leave batch retries open. The sync rule applies to sync.'
        : launched
          ? 'Each query names its endpoint and fact. All six start together.'
          : 'Does any query need a result from another lookup?',
    );
    return;
  }
  const read = at(4, 'It names the batch endpoint');
  const sent = at(4, 'Now send the batch retry search');
  const state = incidentSearch(read, sent, at(5, 'Source B three'));
  base('NEW INCIDENT   /   UPDATED RUNBOOK', 'Which retry policy belongs to this incident?');
  film(38, 132, 402, 201);
  mono('ERROR REPORT   /   ' + report.id, 58, 172, 16, C.amber);
  text('Most errors', 58, 221, 23, C.light);
  serif(state.endpoint ?? 'Reading report…', 57, 281, 38, state.endpoint ? C.white : C.mint, 366);
  arrow(449, 238, 498, 238, state.endpoint ? C.jade : C.edge);
  film(511, 132, 411, 201);
  mono('RETRY SEARCH', 532, 172, 16, C.amber);
  if (state.endpoint) {
    tag(state.endpoint, 531, 202, 89, C.mint, C.jade);
    text('retry policy', 631, 225, 26, C.white);
  } else text('[endpoint ?]  retry policy', 532, 225, 26, C.white, 'Sans', 365);
  tag(
    state.sent ? 'Dispatched' : 'Waiting',
    533,
    264,
    145,
    state.sent ? C.mint : C.amber,
    state.sent ? C.jade : C.rust,
  );
  if (state.result) {
    tag('SOURCE ' + state.result.id, 39, 371, 123);
    serif(state.result.instruction, 186, 398, 32);
  }
  band(
    state.result
      ? 'E1 identifies the endpoint. B3 supplies that endpoint’s rule.'
      : state.sent
        ? 'Waiting for the policy source.'
        : state.endpoint
          ? 'E1 names the endpoint for the retry search.'
          : 'Which endpoint belongs in the retry query?',
  );
}

export function access(p) {
  const { at, base, film, rect, mono, text, serif, slip, line, band, tag } = p;
  const applied = at(3, 'Only the support policy qualifies');
  base('SUPPORT SEARCH   /   CALLER GRANTS', 'Which matching passage may reach the answer?');
  film(38, 120, 884, 75);
  mono('REQUEST GRANT', 57, 150, 14, C.amber);
  text('support  /  support.read', 251, 166, 25, C.white);
  mono('QUERY   “burst quota”', 38, 233);
  permittedMatches.forEach(({ page, hits, allowed }, i) => {
    const x = 38 + i * 451;
    slip(x, 250, 432, 169, applied && !allowed ? C.shade : C.white);
    mono('TENANT   ' + page.tenant, x + 23, 282, 15);
    serif(page.id, x + 23, 328, 31);
    text(hits + ' matching words', x + 23, 364, 20, C.soft);
    if (applied)
      tag(
        allowed ? 'Eligible for ranking' : 'Outside caller scope',
        x + 22,
        379,
        230,
        allowed ? C.mint : C.amber,
        allowed ? C.jade : C.rust,
      );
  });
  band(
    applied
      ? 'Answer context    ←    ' + permittedMatches.find((m) => m.allowed).page.id
      : 'Both pages mention “burst” and “quota”. Read the grant.',
  );
}

export function stepBack(p) {
  const { after, base, mono, text, rect, line, serif, band } = p;
  const known = after(2, 'one hundred requests per client in sixty seconds');
  const joined = after(3, 'Twenty over', 0, 'Twenty over');
  base('REQUEST TRACE   /   GOVERNING POLICY', 'Does the trace exceed the applicable limit?');
  mono(trace.id + '   ·   HTTP ' + trace.status, 40, 144);
  serif('Endpoint ' + trace.endpoint + '   /   Tier ' + trace.tier, 39, 183, 32);
  text('One client in a ' + trace.window + '-second window', 39, 216, 21, C.soft);
  const px = 40,
    py = 247,
    dy = 32;
  for (let i = 0; i < trace.requests; i++) {
    const col = Math.floor(i / 4),
      row = i % 4;
    rect(px + col * 27, py + row * dy, 20, 22, joined && i >= rule.limit ? C.rust : C.blue, 3);
  }
  if (known) {
    const cut = px + (rule.limit / 4) * 27 - 4;
    line(cut, 231, cut, 379, C.rust, 3);
    mono('P4 limit ' + rule.limit, cut - 9, 403, 16, C.rust, 180, 'right');
  }
  mono(trace.requests + ' requests', 39, 404, 18, C.blue);
  band(
    joined
      ? overage(trace, rule) + ' over the limit   ·   Confirm the cause in the R17 limiter log.'
      : known
        ? 'P4   /   E2   /   Tier 2   /   100 per client in 60 s'
        : 'Policy lookup    →    Which burst rule applies to E2 on tier 2?',
  );
}
