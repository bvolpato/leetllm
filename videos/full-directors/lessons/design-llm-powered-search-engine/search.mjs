import {
  C,
  afterCue,
  alpha,
  calendar,
  calendarNote,
  clamp,
  cue,
  dot,
  footer,
  frame,
  lerp,
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
  alice,
  buildQuery,
  candidates,
  currentPassages,
  cut,
  eligible,
  exception,
  fusion,
  mixedQuery,
  packWords,
  policy,
  policyQuery,
  publish,
  quote,
  rankingSignals,
  registry,
  routes,
  supportExample,
  containsTerms,
  updated,
  windowFor,
  words,
} from './evidence.mjs';

export const exceptionLines = [
  'Service-account SDK migrations',
  'may start within 60 days after the notice',
  'only with security approval.',
];
export const policyLines = [
  'Parser-v2 SDK migrations must start',
  'within 30 days after the deprecation notice.',
];

export function opening(g, c) {
  const b = c.beat.beatIndex;
  const ordinary = cue(c, 0, 'The ordinary window', 0),
    partial = cue(c, 1, 'Follow the quote', 1.45);
  const finish = afterCue(c, 2, 'Only with security approval'),
    pending = afterCue(c, 2, 'Her request is pending'),
    tooLate = afterCue(c, 2, 'so day forty-five falls outside her window'),
    signed = afterCue(c, 3, 'Security signs the request'),
    extended = afterCue(c, 3, 'and the sixty-day window now covers it');
  const d = windowFor(exception, extended ? 'signed' : 'pending', 45);
  const end = finish ? exception.text.length : Math.round(lerp(0, cut, partial));
  frame(g, 'Migration planner', 'Can Alice start on day 45?');
  paper(g, 40, 120, 366, 323);
  rect(g, 40, 120, 366, 50, C.pine, 4);
  for (const x of [76, 370]) {
    rect(g, x, 112, 7, 19, '#919a88', 3);
  }
  text(g, 'Days after the deprecation notice', 60, 151, 19, C.white, 'Sans', 600);
  calendar(g, 63, 186, 60, d.day, d.limit, ordinary);
  text(
    g,
    signed
      ? 'Security approval signed'
      : pending
        ? 'Security approval pending'
        : 'Proposed start   /   day 45',
    63,
    407,
    19,
    signed ? C.green : C.dim,
    'Sans',
    600,
  );
  paper(g, 434, 120, 485, 323);
  mono(g, 'PARSER-V2 MIGRATION GUIDE', 454, 149);
  line(g, 454, 164, 899, 164);
  mono(g, 'General policy   /   ' + policy.key, 454, 188, 13, C.green);
  quoteLines(g, policy, 218, policyLines, ordinary * policy.text.length, {
    x: 454,
    size: 19,
    leading: 27,
    fill: C.mint,
  });
  line(g, 454, 267, 899, 267);
  mono(g, 'Service-account exception   /   ' + exception.key, 454, 291, 13, C.orange);
  if (b > 0) {
    quoteLines(g, exception, 322, exceptionLines, end, {
      x: 454,
      size: 20,
      leading: 28,
      visibleRows: finish ? exceptionLines.length : exceptionLines.length - 1,
    });
    if (!finish) rect(g, 454, 387, 195, 5, C.rule, 2);
    mono(g, 'Selected characters   [0, ' + end + ')', 454, 418);
  } else {
    line(g, 455, 321, 795, 321, C.rule, 1);
    line(g, 455, 347, 743, 347, C.rule, 1);
  }
  calendarNote(
    g,
    extended
      ? 'Day 45 is inside the approved 60-day window.'
      : signed
        ? 'Alice’s approval is signed. Keep day 45 circled.'
        : tooLate
          ? 'Day 45 is outside the ordinary 30-day window.'
          : finish
            ? 'Which approval record applies to Alice?'
            : partial === 1
              ? 'What is missing from the selected words?'
              : 'Proposed start   /   45 days after notice',
  );
}

export function indexView(g, c) {
  const b = c.beat.beatIndex;
  if (b === 0) {
    frame(g, 'Trusted index', 'What makes a passage identifiable?');
    paper(g, 67, 126, 825, 306);
    rect(g, 67, 126, 15, 306, C.pine, 3);
    mono(g, 'PUBLISHED SOURCE    /    ' + policy.key, 105, 166, 15);
    serif(g, 'Parser-v2 migration guide', 105, 216, 36);
    para(g, policy.text, 105, 261, 710, 24, 30);
    const tagged = cue(c, 0, 'Give each passage', 0.65);
    alpha(g, tagged, () => {
      line(g, 105, 325, 847, 325);
      mono(g, 'NORMALIZED CHARACTERS    [0, ' + policy.text.length + ')', 105, 354);
      mono(g, 'SHA-256   ' + policy.digest.slice(0, 12) + '…', 105, 382);
      tag(g, 'Workspace A  /  engineering', 559, 375);
    });
    footer(g, 'Keep source offsets tied to the version of text that defines them.');
    return;
  }
  const sliced = cue(c, 1, 'Put the cutoff', 0),
    screened = cue(c, 2, 'Neither hit survives', 0);
  const first = cue(c, 3, 'Filter the population first', 0),
    advanced = cue(c, 4, 'registry advances', 0);
  frame(
    g,
    'Trusted index',
    b === 4
      ? 'What if the registry advances before the index?'
      : 'Who gets the two places in the result?',
  );
  const refill = b === 3
    ? cue(c, 3, 'The current policy and exception take the same two slots', 1.5)
    : null;
  drawSlots(g, sliced, screened, first, advanced, false, refill);
}

function drawSlots(g, sliced, screened, first, advanced, rewind = false, refill = null) {
  const access = advanced ? updated(policy, 3) : registry;
  const candidatesInOrder = first ? currentPassages(access) : candidates;
  const chosen = candidatesInOrder.slice(0, 2).filter((d) => !screened || eligible(d, access));
  mono(g, 'TRUSTED CANDIDATE ORDER', 49, 141);
  tag(g, 'Alice  /  workspace ' + alice.workspace + '  /  ' + alice.group, 514, 142);
  candidates.forEach((d, i) => {
    const y = 167 + 57 * i,
      allowed = eligible(d, access);
    const filtered = first && !allowed;
    rect(g, 49, y, 385, 46, filtered ? '#deded3' : C.page, 3);
    rect(g, 49, y, 7, 46, !screened ? C.dim : allowed ? C.green : C.orange);
    mono(g, i + 1, 65, y + 29);
    text(g, d.key, 99, y + 30, 22, filtered ? C.dim : C.ink, 'Serif');
    mono(
      g,
      allowed ? 'current · A' : d.workspace === 'B' ? 'workspace B' : 'obsolete · A',
      419,
      y + 28,
      13,
      !screened ? C.dim : allowed ? C.green : C.orange,
      'right',
    );
    if (filtered) line(g, 91, y + 22, 229, y + 22, C.dim, 1.5);
  });
  text(g, first ? 'Filter, then take two' : 'Take two, then filter', 511, 202, 24, C.ink, 'Serif');
  for (let i = 0; i < 2; i++) {
    const progress = refill === null ? 1 : clamp((refill - i * 0.22) / 0.78);
    const eligibleHit = sliced ? chosen[i] : null;
    const d = progress === 1 ? eligibleHit : null;
    const y = 228 + 78 * i;
    if (first && eligibleHit && refill !== null && progress > 0) {
      const sourceY = 190 + 57 * candidates.indexOf(eligibleHit);
      const targetY = y + 32;
      line(g, 434, sourceY, 462, sourceY, C.green, 2);
      line(g, 462, sourceY, 488, targetY, C.green, 2);
      line(g, 488, targetY, 511, targetY, C.green, 2);
      if (progress > 0 && progress < 1) {
        const packetX = lerp(434, 511, progress);
        const turn = clamp((packetX - 462) / (488 - 462));
        dot(g, packetX, lerp(sourceY, targetY, turn), 5, C.green);
      }
    }
    rect(g, 511, y, 379, 65, d ? C.pine : '#d9dfd4', 6);
    mono(g, '0' + (i + 1), 526, y + 38, 15, d ? C.mint : C.dim);
    serif(g, d ? d.key : 'Empty', 572, y + 40, 26, d ? C.white : C.dim);
  }
  const status = rewind
    ? 'Back at the earlier snapshot, policy@2 and exception@1 are both current.'
    : advanced
      ? 'In this scenario the registry requires policy@3. Only the exception survives.'
      : first
        ? 'Two current, authorized sources reach the reader.'
        : screened
          ? '0 usable passages. The cutoff already discarded the other two.'
          : sliced
            ? 'Two occupied slots. How many will pass the check?'
            : 'Inspect the order before applying the cutoff.';
  if (refill === null) footer(g, status);
  else {
    const explanation = refill === 1
      ? status
      : first
        ? 'Only eligible hits can compete for the two slots.'
        : 'Same ranking, same two slots. Move the eligibility check.';
    text(g, explanation, 49, 429, 20, C.ink, 'Sans', 500);
  }
}

export function routing(g, c) {
  const b = c.beat.beatIndex,
    mixed = b > 0,
    solved = cue(c, 2, 'Keep both', 0);
  if (!cue(c, 0, 'Is build', 0)) {
    frame(g, 'Trusted index', 'Rewind to the registry before the update');
    drawSlots(g, true, true, true, false, true);
    return;
  }
  const docs = cue(c, 0, 'For a migration policy', 0);
  const query = mixed ? mixedQuery : docs ? policyQuery : buildQuery,
    plan = routes(query);
  const show = !mixed || solved;
  frame(g, 'Source selection', 'Where does this question go?', true);
  mono(g, 'AUTHENTICATED REQUEST    /    WORKSPACE A', 46, 143, 14, C.mint);
  paper(g, 45, 163, 862, 72);
  serif(g, query, 66, 208, 30);
  const branches = [
    {
      label: 'Live build service',
      value: 'build-1042  ·  running',
      active: plan.live,
      sub: 'Source time   10:04:08',
    },
    {
      label: 'Published policy index',
      value: currentPassages()
        .map((d) => d.key)
        .join('  +  '),
      active: plan.documents,
      sub: 'Require current revision',
    },
  ];
  branches.forEach((r, i) => {
    const x = 55 + i * 456,
      on = show && r.active,
      color = on ? C.honey : C.grid;
    line(g, 476, 235, 476, 251, color, 2);
    line(g, 476, 251, x + 196, 251, color, 2);
    line(g, x + 196, 251, x + 196, 284, color, 2);
    dot(g, x + 196, 284, 5, color);
    rect(g, x, 293, 391, 125, on ? '#34554e' : '#233f3c', 6);
    text(g, r.label, x + 20, 325, 21, C.white, 'Sans', 600);
    if (on) {
      serif(g, r.value, x + 20, 368, 25, C.honey);
      mono(g, r.sub, x + 20, 398, 14, C.mint);
    } else {
      mono(g, mixed && !solved ? 'Route undecided' : 'Idle', x + 20, 379, 15, '#adbbb0');
    }
  });
  footer(
    g,
    mixed && !solved
      ? 'The request asks about live state and a policy. Which route can be dropped?'
      : mixed
        ? 'Join the live observation and the current policy under the same reader scope.'
        : plan.live
          ? 'Build status needs a fresh reading from the service.'
          : 'Search the current published documents for a policy.',
    true,
  );
}

export function ranks(g, c) {
  const unique = cue(c, 1, 'Remove the duplicate', 0),
    tied = cue(c, 2, 'Their scores tie', 0);
  const extra = cue(c, 3, 'This branch returns', 0),
    b = c.beat.beatIndex;
  const { lexical, dense, cosine } = rankingSignals();
  const raw = [lexical[0], ...lexical],
    lists = [lexical, dense, ...(extra ? [dense] : [])];
  const rows = fusion(lists);
  frame(g, 'Rank fusion', 'How much does each rank contribute?');
  const lanes = [
    { label: 'Lexical', list: b === 1 && !unique ? raw : lexical },
    { label: 'Vector', list: dense },
    ...(extra ? [{ label: 'Rewrite', list: dense }] : []),
  ];
  mono(g, 'RANKED HITS   /   INSIDE WORKSPACE A', 48, 139, 14);
  lanes.forEach(({ label, list }, i) => {
    const y = 157 + 53 * i;
    serif(g, label, 49, y + 27, 22);
    list.forEach((key, j) => {
      const x = 177 + j * 220;
      rect(g, x, y, 202, 37, key === policy.key ? C.ice : C.mint, 3);
      mono(g, j + 1, x + 12, y + 24, 14, C.dim);
      text(g, key, x + 41, y + 26, 20, C.ink, 'Serif');
    });
  });
  if (b === 0) {
    line(g, 48, 287, 904, 287);
    mono(g, 'LEXICAL MATCH', 48, 323, 14);
    serif(g, 'parser-v2', 48, 371, 36, C.blue);
    mono(g, 'Exact term in ' + policy.key, 49, 410, 14);
    const vectors = cue(c, 0, 'The two supplied passage vectors', 0.65);
    alpha(g, vectors, () => {
      const x = 415,
        y = 435,
        scale = 111;
      line(g, x, y, x + 133, y);
      line(g, x, y, x, y - 132);
      for (const [vx, vy, col] of [
        [1, 0.5, C.blue],
        [0.5, 1, C.green],
        [1, 1, C.orange],
      ]) {
        line(g, x, y, x + vx * scale, y - vy * scale, col, 2.5);
        dot(g, x + vx * scale, y - vy * scale, 4, col);
      }
      mono(g, 'SUPPLIED VECTORS', 578, 318);
      mono(g, 'Query (1, 1)', 578, 344, 15, C.orange);
      mono(g, 'Policy (1, ½)     Exception (½, 1)', 578, 373, 14);
      serif(g, 'Both cosines = ' + cosine.toFixed(3), 578, 411, 23);
    });
    footer(
      g,
      vectors === 1
        ? 'A tie in cosine is resolved by document identity.'
        : 'Lexical search scores the terms in the permitted passages.',
    );
    return;
  }
  const showTerms = unique;
  if (showTerms) {
    line(g, 48, 322, 909, 322);
    rows.forEach((r, i) => {
      const x = 48 + i * 444;
      mono(g, r.key, x, 350, 15);
      const terms = r.ranks.map((k) => '1/' + (60 + k)).join(' + ');
      serif(g, terms, x, 389, 25);
      if (tied) {
        text(g, '= ' + r.score.toFixed(5), x, 422, 25, C.green, 'Sans', 600);
        let cursor = x;
        r.ranks.forEach((rank, j) => {
          const w = 6500 / (60 + rank);
          rect(g, cursor, 434, w - 1, 10, [C.blue, C.green, C.orange][j], 1);
          cursor += w;
        });
      }
    });
  }
  footer(
    g,
    extra
      ? 'Each returned source earns its rank contribution. The rewrite stays out of the pack.'
      : tied
        ? 'Equal sums. Identity order puts the exception first.'
        : unique
          ? 'Each distinct identity contributes 1 / (60 + rank) once per branch.'
          : 'The same policy appears twice in one lexical list.',
  );
}

export function packing(g, c) {
  const b = c.beat.beatIndex;
  frame(
    g,
    'Passage budget',
    b === 4 ? 'Can shared words establish support?' : 'What fits with the condition attached?',
  );
  if (b === 4) {
    const neg = cue(c, 4, 'Insert the word not', 0);
    const reword = cue(c, 4, 'Now read the paraphrase', 0);
    const source = reword
      ? supportExample.paraphrase
      : neg
        ? supportExample.source
        : supportExample.claim;
    paper(g, 54, 128, 850, 293);
    mono(g, 'CLAIM', 81, 169);
    serif(g, supportExample.claim, 81, 217, 32);
    line(g, 81, 238, 873, 238);
    mono(g, 'SOURCE', 81, 277);
    serif(g, source, 81, 322, 32, reword ? C.green : neg ? C.orange : C.ink);
    if (neg) {
      tag(g, 'Word containment   ' + containsTerms(supportExample.claim, source), 81, 381);
      tag(
        g,
        reword ? 'Meaning   preserved' : 'Meaning   reversed',
        370,
        381,
        reword ? C.green : C.orange,
        reword ? C.mint : C.blush,
      );
    }
    footer(g, 'Compare the meaning of a paraphrase with its original source.');
    return;
  }
  const expanded = cue(c, 1, 'Open nine more spaces', 0);
  const shrink = cue(c, 2, 'stops the exception', 0.9),
    restored = cue(c, 3, 'Extend the span', 0.9);
  const budget = expanded ? 27 : 18,
    pack = packWords(budget);
  const end = Math.round(
    exception.text.length -
      (exception.text.length - cut) * shrink +
      (exception.text.length - cut) * restored,
  );
  const evidence = pack.selected.map((q) => (q.key === exception.key ? quote(exception, end) : q));
  const used = evidence.reduce((n, q) => n + words(q.text).length, 0);
  const canRelease = publish(evidence);
  paper(g, 44, 127, 873, 239);
  mono(g, '01  /  ' + exception.key + '    [0, ' + end + ')', 63, 156, 13, C.green);
  quoteLines(
    g,
    exception,
    189,
    [
      'Service-account SDK migrations may start within 60 days after the notice',
      'only with security approval.',
    ],
    end,
    { x: 63, size: 21, leading: 28 },
  );
  line(g, 62, 238, 899, 238);
  const hasPolicy = pack.selected.some((q) => q.key === policy.key);
  mono(
    g,
    (hasPolicy ? '02  /  ' : 'Waiting   /   ') + policy.key + '    [0, ' + policy.text.length + ')',
    63,
    268,
  );
  para(g, policy.text, 63, 309, 815, 21, 26, hasPolicy ? C.ink : C.dim);
  const wordWidth = 29;
  for (let i = 0; i < 27; i++) {
    const x = 59 + wordWidth * i,
      valid = i < budget;
    const color = !valid
      ? '#d9d9ce'
      : i < words(evidence[0].text).length
        ? C.honey
        : i < used
          ? C.mint
          : C.page;
    rect(g, x, 390, wordWidth - 3, 22, color, 2, valid ? C.rule : null);
  }
  const fence = 59 + wordWidth * budget - 1;
  line(g, fence, 383, fence, 424, C.orange, 3);
  mono(g, used + ' of ' + budget + ' words used', 61, 442);
  mono(
    g,
    b === 0
      ? 'Policy needs 12 words'
      : b === 2
        ? 'Review the selection'
        : canRelease
          ? 'Both full spans'
          : 'Pack incomplete',
    903,
    442,
    14,
    b === 0 || b === 2 ? C.dim : canRelease ? C.green : C.orange,
    'right',
  );
  footer(
    g,
    !expanded
      ? '15 words fit. Can a 12-word policy use the 3 spaces left?'
      : b === 2
        ? 'The source hash still matches. Does the selected span preserve the rule?'
        : canRelease
          ? 'The policy and the whole exception travel with their original spans.'
          : 'A shorter selection can lose a condition even when the source resolves.',
  );
}
