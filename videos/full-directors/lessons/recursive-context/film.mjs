import assert from 'node:assert/strict';
import {
  pages,
  registry,
  routes,
  freshRoutes,
  restoreSource,
  restoreSummary,
} from '../../../films/recursive-context/fixtures.mjs';
import {
  boundedSlice,
  visitedFacts,
  retainedFacts,
  complete,
  budgetTrace,
  adjudicate,
  chooseRoute,
} from '../../../films/recursive-context/model.mjs';
import { callPlan, previewForHistory } from '../../../films/recursive-context/arithmetic.mjs';
import { compareRun, legacyRuns } from '../../../films/recursive-context/manual.mjs';
import { checkWindowStudy, windowStudy } from './window-study.mjs';
import {
  C,
  rect,
  poly,
  line,
  circle,
  type,
  mono,
  title,
  footer,
  base,
  sheet,
  book,
  passage,
  band,
  thread,
  finger,
  ribbon,
  dayCard,
  table,
} from './artwork.mjs';

const titleText = 'Recursive Language Models: External Sources, Bounded Work and Verified Evidence';
const expiry = pages[5],
  condition = pages[4],
  slice = boundedSlice(5);
const rootOutput = retainedFacts(),
  plan = callPlan(pages.length);
const dateOf = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
const roundSteps = (amount, steps) => Math.min(steps, Math.floor(amount * steps + 1e-8));
const span = (c, b, phrase, seconds = 0) =>
  c.beat.beatIndex < b ? 0 : c.beat.beatIndex > b ? 1 : c.reveal(phrase, seconds);
const yes = (c, b, phrase) => span(c, b, phrase) === 1;
const note = (c, s, x, y, size = 19) => type(c, s, x, y, size, C.soft);
function twoLines(text) {
  const words = text.split(' '),
    mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function opening(c, k) {
  const b = k.beat.beatIndex,
    fold = span(k, 0, 'folds over', 1.5) * (1 - span(k, 2, 'Open page six', 1.1));
  const dateRead = yes(k, 2, 'October first comes'),
    late = yes(k, 2, 'A recursive language model');
  title(c, 'Can the October job use its legacy token?');
  book(c, 51, 110, 492, 276, 'SERVICE MANUAL   /   v12', '06');
  type(c, 'Legacy-token exception', 91, 196, 27, C.ink, 'Serif');
  type(c, 'This exception expires', 91, 250, 24, C.ink, 'Serif');
  if (dateRead) type(c, expiry.value, 91, 310, 38, C.teal, 'Mono');
  else {
    // A curled lower leaf conceals the date until the engineer unfolds the passage.
    const edge = c.createLinearGradient(0, 266, 0, 308);
    edge.addColorStop(0, '#c7baa0');
    edge.addColorStop(0.25, '#fcf2dc');
    edge.addColorStop(1, '#dbd1b8');
    poly(
      c,
      [
        [64, 277],
        [520, 261],
        [534, 307],
        [65, 324],
      ],
      edge,
    );
  }
  ribbon(c, 495, 109, 55);
  if (fold > 0) {
    c.save();
    c.beginPath();
    c.rect(52, 153, 491, 230 * fold);
    c.clip();
    rect(c, 52, 153, 491, 230, '#dbd9c3');
    rect(c, 52, 153, 9, 230, '#bb7151');
    mono(c, 'MIGRATION SUMMARY', 91, 190, 14, C.faint);
    type(c, pages[0].text, 91, 246, 27, C.ink, 'Serif');
    mono(c, 'Exception expiry', 91, 310, 16, C.faint);
    line(c, 277, 310, 436, 310, C.rule, 2);
    c.restore();
    if (fold < 1) line(c, 52, 153 + 230 * fold, 543, 153 + 230 * fold, '#ae9779', 3);
  }
  if (!dateRead) finger(c, 184, 258 + fold * 59);
  const tabs = [
    ['1', 'Overview'],
    ['5', 'Condition'],
    ['6', 'Expiry'],
  ];
  tabs.forEach(([p, s], i) => {
    const yy = 145 + 54 * i;
    rect(c, 543, yy, 95, 37, i === 2 && dateRead ? C.brass : '#dbcfb1');
    type(c, p + '  ' + s, 550, yy + 24, 13, C.ink, 'Sans', 600);
  });
  dayCard(c, 690, 151, 200, '01', 'OCTOBER', late ? 'After expiry' : 'Run scheduled');
  note(c, 'Audit logging on', 709, 334, 18);
  footer(
    c,
    late
      ? 'The October run falls after the documented expiry.'
      : b === 1
        ? 'Which page would you reopen?'
        : 'The engineer needs the date.',
  );
}

function external(c, k) {
  const b = k.beat.beatIndex,
    move = span(k, 1, 'Copy its exact sentence', 1.25);
  title(c, b < 2 ? 'What crosses into the model request?' : 'Which job needs a child controller?');
  if (b === 2) {
    passage(c, 52, 103, 367, 235, expiry.id, 'Authorized slice', twoLines(expiry.text));
    const nested = yes(k, 2, 'A nested controller');
    thread(c, [421, 212], [500, 212]);
    sheet(c, 501, 114, 395, 213);
    mono(c, nested ? 'NESTED CONTROLLER' : 'PLAIN CALL', 526, 151);
    type(c, nested ? 'Follow a reference' : 'Extract the date', 526, 203, 30, C.ink, 'Serif');
    type(
      c,
      nested ? 'Inspect again with private variables.' : 'One prompt receives one reply.',
      526,
      247,
      19,
    );
    if (yes(k, 2, 'The parent receives')) band(c, 525, 273, 300, 'Return response text');
    footer(c, 'The parent supplies the mission, scope and authorized slice.');
    return;
  }
  book(c, 49, 109, 385, 254, 'READ-ONLY SNAPSHOT', 'v12');
  type(c, 'Service manual', 85, 188, 30, C.ink, 'Serif');
  const selected = yes(k, 1, 'Read page six');
  if (selected) {
    mono(c, expiry.id, 85, 232, 17, C.teal);
    type(c, 'This exception expires', 85, 277, 22, C.ink, 'Serif');
    type(c, expiry.value + '.', 85, 310, 26, C.ink, 'Mono');
  } else {
    pages.forEach((p, i) => {
      const x = 86 + (i % 4) * 75,
        y = 211 + Math.floor(i / 4) * 56;
      rect(c, x + 2, y + 3, 51, 41, '#c0b69f');
      rect(c, x, y, 51, 41, '#fcf4e0');
      mono(c, 'p' + (i + 1), x + 12, y + 27, 17, C.ink);
    });
  }
  const right = selected ? 'CHILD REQUEST' : 'ROOT REQUEST';
  sheet(c, 518, 117, 380, 235);
  mono(c, right, 541, 150);
  type(c, selected ? 'Extract the expiry' : 'Find the exception', 541, 191, 27, C.ink, 'Serif');
  if (!selected) {
    type(c, 'Manual v12   /   8 pages', 541, 237, 20);
    type(c, 'Read page text by page ID.', 541, 277, 19);
    mono(c, 'Scope    manual-v12/p1 … p8', 541, 320, 14);
  } else if (move > 0) {
    const x = 90 + move * 451,
      y = 257 - move * 35;
    sheet(c, x, y, 333, 99);
    type(c, expiry.text, x + 12, y + 35, 19, C.ink, 'Serif');
    mono(c, expiry.id, x + 12, y + 71, 16, C.teal);
  }
  footer(
    c,
    selected && move === 1
      ? slice.used + ' source characters / ' + slice.limit + ' allowed in this slice.'
      : 'The original remains available for another inspection.',
  );
}

function inspection(c, k) {
  const index =
    Number(yes(k, 0, 'authentication')) +
    Number(yes(k, 0, 'version history')) +
    Number(yes(k, 0, 'migration pages')) +
    Number(yes(k, 1, 'Page five supplies')) +
    Number(yes(k, 1, 'Page six supplies'));
  const page = pages[index],
    facts = visitedFacts(index);
  title(c, 'Which logged run falls inside the exception?');
  if (!facts.expiry) {
    passage(c, 50, 121, 415, 239, page.id, page.title, twoLines(page.text));
    sheet(c, 518, 128, 377, 219);
    mono(c, 'RETAINED EVIDENCE', 541, 159);
    type(c, 'Condition', 541, 207, 22, C.ink, 'Serif');
    type(
      c,
      facts.condition ? 'Logging required  ·  p5' : 'Awaiting passage',
      541,
      235,
      18,
      facts.condition ? C.teal : C.faint,
    );
    type(c, 'Expiry', 541, 282, 22, C.ink, 'Serif');
    type(c, 'Awaiting passage', 541, 310, 18, C.faint);
    footer(c, 'The investigator has visited ' + (index + 1) + ' of the eight pages.');
    return;
  }
  const dates = legacyRuns.jobs;
  dayCard(
    c,
    58,
    170,
    221,
    '29',
    'SEPTEMBER',
    yes(k, 2, 'The October run') ? 'Qualifies' : 'Logging on',
  );
  dayCard(
    c,
    679,
    170,
    221,
    '01',
    'OCTOBER',
    yes(k, 2, 'Both jobs') ? 'After expiry' : 'Logging on',
  );
  book(c, 317, 128, 320, 225, expiry.id, '06');
  type(c, 'Expiry', 354, 221, 28, C.ink, 'Serif');
  type(c, dateOf(facts.expiry.value), 354, 278, 43, C.teal, 'Serif');
  line(c, 280, 245, 310, 245, C.brass, 2);
  line(c, 644, 245, 678, 245, C.brass, 2);
  footer(
    c,
    !yes(k, 2, 'Both jobs')
      ? 'Page 5 requires audit logging. Both jobs have it.'
      : dates
          .map((d) => dateOf(d) + '  ·  ' + compareRun(d, expiry.value).toLowerCase())
          .join('      |      '),
  );
}

function treeState(k) {
  const leaves = roundSteps(span(k, 0, 'Read the eight pages', 4.8), pages.length);
  const merges =
    roundSteps(span(k, 1, 'Merge adjacent pairs', 2.3), 4) +
    roundSteps(span(k, 1, 'Merge those four', 1.25), 2) +
    Number(yes(k, 1, 'Every merge consumes'));
  const rootReady = merges === plan.mergeCalls,
    repair = yes(k, 3, 'attach its pointer');
  return {
    leaves,
    merges,
    rootReady,
    repair,
    fields: repair ? rootOutput.required : rootOutput.candidate,
  };
}
function tree(c, k) {
  const s = treeState(k),
    b = k.beat.beatIndex;
  title(c, 'What reaches the root after every page is read?');
  const xs = Array.from({ length: 8 }, (_, i) => 72 + i * 76);
  let prior = xs;
  for (let level = 0; level < 4; level++) {
    const ny = 366 - level * 76,
      done = level === 0 ? s.leaves : Math.max(0, s.merges - [0, 0, 4, 6][level]);
    const nodes =
      level === 0
        ? xs
        : prior.filter((_, i) => i % 2 === 0).map((x, i) => (x + prior[i * 2 + 1]) / 2);
    nodes.forEach((x, i) => {
      const live = i < done,
        col = live ? (level === 0 ? C.mint : C.brass) : '#687d7c';
      if (level > 0)
        for (const xp of prior.slice(i * 2, i * 2 + 2))
          line(c, xp, ny + 58, x, ny + 17, live ? col : '#405659', live ? 2 : 1);
      if (level === 0) {
        poly(
          c,
          [
            [x - 23, ny - 20],
            [x + 12, ny - 20],
            [x + 23, ny - 10],
            [x + 23, ny + 20],
            [x - 23, ny + 20],
          ],
          live ? C.paper : '#30474a',
          col,
        );
        if (live)
          poly(
            c,
            [
              [x + 12, ny - 20],
              [x + 12, ny - 10],
              [x + 23, ny - 10],
            ],
            C.paper2,
          );
        mono(c, 'p' + (i + 1), x, ny + 6, 16, live ? C.ink : C.soft, 'center');
      } else {
        circle(c, x, ny, 17, col);
        mono(c, level === 3 ? 'R' : 'M', x, ny + 6, 16, C.desk, 'center');
      }
    });
    prior = nodes;
  }
  if (s.leaves >= 5) {
    mono(c, 'logging', xs[4] - 8, 415, 14, C.mint, 'right');
    line(c, xs[4], 387, xs[4] - 8, 399, C.mint);
    if (s.leaves >= 6) {
      mono(c, dateOf(expiry.value), xs[5] + 18, 415, 14, C.mint);
      line(c, xs[5], 387, xs[5] + 21, 399, C.mint);
    }
  }
  sheet(c, 663, 109, 244, 276);
  mono(c, 'FINISHED TREE CALLS', 680, 139, 14);
  type(c, s.leaves + s.merges, 683, 206, 57, C.ink, 'Serif');
  type(c, 'Reads ' + s.leaves + '   +   merges ' + s.merges, 681, 237, 18);
  if (s.rootReady && b >= 2) {
    line(c, 681, 253, 888, 253, C.rule);
    mono(c, s.repair ? 'REPAIRED RECORD' : 'MERGED ANSWER', 681, 275, 13);
    type(c, 'Logging required', 681, 309, 21, C.teal, 'Serif');
    type(
      c,
      s.fields.expiry ? dateOf(s.fields.expiry) + '   ·   p6' : 'Expiry     ______',
      681,
      346,
      22,
      s.repair ? C.teal : C.red,
      'Serif',
    );
  }
  if (b === 3) {
    const t = span(k, 3, 'Follow the empty field', 1.3);
    if (t > 0) {
      c.save();
      c.globalAlpha = t;
      line(c, 681, 348, 638, 400, C.lightThread, 2);
      line(c, 638, 400, xs[5], 400, C.lightThread, 2);
      line(c, xs[5], 400, xs[5], 388, C.lightThread, 2);
      c.restore();
    }
  }
  if (b === 3 && !s.repair && yes(k, 3, 'Read the date again')) {
    const start = k.wordCue('Read the date again').start;
    const end = k.wordCue('attach its pointer').start;
    const p = Math.max(0, Math.min(1, (k.elapsed - start) / (end - start)));
    const approach = Math.max(0, (p - 0.75) / 0.25);
    const x = xs[5] + (638 - xs[5]) * Math.min(1, p / 0.75) + (681 - 638) * approach;
    const y = 400 + (348 - 400) * approach;
    rect(c, x - 67, y - 24, 135, 31, C.mint, 5);
    mono(c, dateOf(expiry.value) + ' · p6', x, y - 5, 16, C.ink, 'center');
  }
  if (s.repair) type(c, '+1 source lookup', 675, 419, 22, C.mint, 'Sans');
  else if (b === 2) type(c, 'Which page has the date?', 670, 419, 18, C.soft, 'Sans');
  else if (b < 2) footer(c, 'Every completed merge combines two earlier results.');
}

const content = expiry.value + ' [' + expiry.id + ']';
function hasCitedDate(record) {
  if (!complete(record)) return false;
  const match = /^(\d{4}-\d{2}-\d{2}) \[([^\]]+)\]$/.exec(record.content);
  if (!match) return false;
  const citedPage = pages.find((page) => page.id === match[2]);
  return citedPage?.field === 'expiry' && citedPage.value === match[1];
}
function recordState(k) {
  const b = k.beat.beatIndex,
    typed = yes(k, 2, 'The host accepts');
  const record = b === 0 ? null : { ready: typed ? true : 'false', content };
  const tested = yes(k, 2, 'Keep the content'),
    accepted = complete(record);
  return {
    record,
    tested,
    accepted,
    verified: accepted && yes(k, 2, 'Validate the type') && hasCitedDate(record),
  };
}
function completion(c, k) {
  const { record, tested, accepted, verified } = recordState(k);
  title(c, 'What tells the host to stop?');
  sheet(c, 49, 124, 539, 245);
  mono(c, record ? 'ANSWER RECORD' : 'INTERPRETER OUTPUT', 72, 158, 15);
  if (record) {
    mono(c, 'ready', 73, 213, 20);
    type(c, JSON.stringify(record.ready), 229, 213, 28, accepted ? C.teal : C.ink, 'Mono');
    line(c, 73, 237, 556, 237, C.rule);
    mono(c, 'content', 73, 277, 20);
    mono(c, record.content, 73, 316, 19, C.ink);
  } else {
    type(c, 'print(candidate)', 73, 220, 26, C.ink, 'Mono');
    type(c, content, 73, 286, 23, C.teal, 'Mono');
  }
  thread(c, [587, 248], [631, 248]);
  mono(c, 'HOST', 652, 190, 15, C.soft);
  type(
    c,
    accepted
      ? 'Candidate ready'
      : tested
        ? 'Shape rejected'
        : record
          ? 'Check the type'
          : 'Still inspecting',
    652,
    236,
    29,
    C.chalk,
    'Serif',
  );
  note(
    c,
    verified
      ? 'Date matches page 6.'
      : accepted
        ? 'Evidence check pending.'
        : record
          ? 'Boolean true required.'
          : 'Printed line retained.',
    652,
    277,
    17,
  );
  if (verified) {
    sheet(c, 626, 300, 273, 99);
    mono(c, expiry.id, 642, 327, 14, C.teal);
    type(c, expiry.text, 642, 366, 16, C.ink, 'Serif');
  }
  footer(
    c,
    verified
      ? 'Keep the typed stop reason with the evidence.'
      : 'Completion and factual support are separate checks.',
  );
}

const raw = Array.from({ length: 20 }, (_, i) => 'incident log line ' + i).join('\n'),
  marker = '...[truncated]',
  preview = previewForHistory(raw, 40);
function historyRun(limit) {
  const history = [{ corpus_chars: 7000, pointer: 'corpus' }],
    events = [];
  const size = () => JSON.stringify(history).length;
  for (const [action, observation] of [
    ['peek', 'policy '.repeat(1000).slice(0, 40)],
    ['finish', 'candidate stored'],
  ]) {
    history.push({ action, observation });
    const stopped = size() > limit;
    events.push({
      action,
      used: size(),
      state: stopped ? 'history_budget' : action === 'finish' ? 'candidate stored' : 'continue',
    });
    if (stopped) break;
  }
  return events;
}
function history(c, k) {
  const b = k.beat.beatIndex,
    n = b === 0 ? 1 : 1 + roundSteps(span(k, 1, 'Twenty such previews', 2.2), 19);
  const ready = yes(k, 1, 'Append the marker');
  title(c, b >= 2 ? 'Will the whole next turn fit?' : 'How much of a return fits in history?');
  if (b === 3) {
    const smaller = yes(k, 3, 'with a smaller history allowance'),
      limit = smaller ? 80 : 500;
    const rows = historyRun(limit).slice(
      0,
      smaller || !yes(k, 3, 'the second step stores') ? 1 : 2,
    );
    mono(
      c,
      'FIXED ACTIONS    /    COMPACT JSON HISTORY    /    CHARACTER FIXTURE',
      49,
      115,
      14,
      C.soft,
    );
    table(c, {
      y: 148,
      h: 60,
      columns: [24, 187, 460, 640],
      headers: ['Action', 'History used', 'Limit', 'Host state'],
      rows: rows.map((e) => [e.action, e.used + ' chars', limit, e.state]),
      colors: rows.map((e) => [C.ink, C.ink, C.ink, e.used > limit ? C.red : C.teal]),
    });
    footer(
      c,
      smaller
        ? 'Stop after peek. The finish action never runs.'
        : 'Keep the same two actions for the smaller-budget replay.',
    );
    return;
  }
  if (b === 2) {
    book(c, 52, 124, 369, 230, 'OUTSIDE HISTORY', '');
    type(c, 'Mission + source pointers', 90, 216, 24, C.ink, 'Serif');
    mono(c, 'manual-v12/p5', 90, 264, 18, C.teal);
    mono(c, 'manual-v12/p6', 90, 293, 18, C.teal);
    sheet(c, 484, 125, 424, 230);
    mono(c, 'NEXT MODEL REQUEST', 510, 159);
    type(c, 'Instructions, code, metadata', 510, 211, 21);
    type(c, '+ serialized history', 510, 249, 23);
    type(c, '+ reserved output', 510, 287, 23);
    footer(c, 'Over the token limit? Stop partial, or compact and count again.');
    return;
  }
  sheet(c, 52, 117, 855, 254);
  mono(c, 'PREVIEW LIMIT    40 CHARACTERS', 75, 153, 15);
  for (let i = 0; i < 40; i++) {
    const isMarker = i >= preview.length - marker.length,
      x = 75 + i * 20.2;
    rect(c, x, 190, 18.5, 44, isMarker ? '#daaf86' : '#c1d6c5');
    if (ready) mono(c, preview[i].replace('\n', '↵'), x + 9, 220, 18, C.ink, 'center');
  }
  type(
    c,
    ready ? preview.length - marker.length + ' source characters' : 'Source prefix',
    76,
    270,
    20,
  );
  type(c, '14 for the marker', 603, 270, 19);
  if (ready) {
    mono(
      c,
      n + ' × ' + preview.length + ' = ' + n * preview.length + ' preview characters',
      75,
      324,
      19,
      C.teal,
    );
  } else mono(c, 'Raw observation    ' + raw.length + ' characters', 75, 324, 19, C.faint);
  if (ready) {
    mono(c, 'Preview copies', 55, 406, 15, C.soft);
    for (let i = 0; i < 20; i++) {
      const x = 218 + 34 * i;
      rect(c, x, 387, 27, 23, i < n ? C.mint : '#32494c');
      if (i < n) rect(c, x + 18, 387, 9, 23, '#daaf86');
    }
  }
  footer(
    c,
    ready
      ? n +
          (n === 1 ? ' full return would take ' : ' full returns would take ') +
          (n * raw.length).toLocaleString('en-US') +
          ' characters before wrappers.'
      : 'The full return stays available through its source pointer.',
  );
}

const budgetCues = [
  [0, 'The root reserves'],
  [0, 'Send the request'],
  [0, 'The host releases'],
  [1, 'Child A reserves'],
  [1, 'and goes out'],
  [1, 'The provider outcome'],
  [1, 'Child B also reserves'],
  [1, 'three and goes out'],
  [1, 'Reconcile that row'],
  [3, 'Only one call'],
];
function ledgerState(k) {
  return budgetTrace(budgetCues.reduce((n, [b, p]) => n + Number(yes(k, b, p)), 0));
}
function ledger(c, k) {
  const b = k.beat.beatIndex,
    s = ledgerState(k);
  title(c, 'Can another child reserve capacity?');
  const names = ['Root', 'Child A', 'Child B', ...(b >= 2 ? ['Child C'] : [])];
  const barX = 206,
    barW = 690;
  mono(c, 'Cost units charged', 51, 100, 14, C.soft);
  rect(c, barX, 82, barW, 21, '#40565a');
  let used = 0;
  for (const [i, name] of names.entries()) {
    const amount = s.entries[name]?.charged ?? 0;
    if (amount > 0) {
      rect(
        c,
        barX + (barW * used) / s.cap.cost,
        82,
        (barW * amount) / s.cap.cost - 0.8,
        21,
        [C.mint, C.brass, '#d68163'][i],
      );
      mono(c, name, barX + (barW * (used + amount / 2)) / s.cap.cost, 98, 12, C.ink, 'center');
    }
    used += amount;
  }
  const rows = names.map((name) => {
    const e = s.entries[name];
    return [
      name,
      e?.status ?? (name === 'Child C' ? 'asks for 2 / 4' : 'waiting'),
      e && e.status !== 'queued' ? e.calls : 0,
      e?.charged ?? 0,
    ];
  });
  table(c, {
    y: 123,
    h: 44,
    columns: [25, 222, 525, 700],
    headers: ['Request', 'Request state', 'Calls charged', 'Units charged'],
    rows,
    colors: rows.map((r) => [C.ink, r[1] === 'unknown' ? C.red : C.teal]),
  });
  mono(c, 'Charges include settled usage and outstanding reservations.', 52, 377, 14, C.soft);
  note(c, 'Available', 53, 411, 17);
  type(c, s.availableCalls + ' / ' + s.cap.calls + ' calls', 190, 411, 22, C.chalk, 'Mono');
  type(c, s.availableCost + ' / ' + s.cap.cost + ' units', 519, 411, 22, C.chalk, 'Mono');
  footer(
    c,
    b < 2
      ? 'The host checks and reserves from one shared balance.'
      : s.entries['Child C']
        ? 'Child C remains queued. Its charge is zero.'
        : 'C needs 2 calls and 4 cost units. Read both balances.',
  );
}

const runTree = { branch: 3, depth: 3, perController: 5 };
function allowance({ branch, depth, perController }) {
  const layers = Array.from({ length: depth + 1 }, (_, i) => branch ** i),
    leaves = layers.at(-1);
  const internal = layers.slice(0, -1).reduce((a, b) => a + b, 0);
  return { layers, leaves, internal, requests: internal * perController + leaves };
}
function waves(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    title(c, 'How many waves for eleven independent calls?');
    const count = 11,
      slots = 3,
      waves = Math.ceil(count / slots);
    const placed = roundSteps(span(k, 2, 'Fill a wave', 3.2), count);
    mono(c, '3 SLOTS    /    EQUAL DURATION    /    NO RETRIES', 51, 114, 15, C.soft);
    for (let i = 0; i < slots; i++) {
      mono(c, 'Slot ' + (i + 1), 55, 190 + i * 63, 18, C.soft);
      for (let j = 0; j < waves; j++) {
        const ix = j * slots + i,
          x = 197 + j * 174,
          y = 158 + i * 63;
        rect(c, x, y, 151, 44, '#32494c');
        if (ix < placed) {
          sheet(c, x, y, 151, 44);
          mono(c, 'Call ' + (ix + 1), x + 15, y + 28, 18, C.ink);
        }
      }
    }
    for (let i = 0; i < Math.ceil(placed / slots); i++)
      mono(c, 'Wave ' + (i + 1), 207 + i * 174, 375, 16, C.soft);
    footer(
      c,
      placed === count
        ? '11 requests   /   ' + waves + ' parallel waves   /   11 serial waves'
        : 'Each slip represents one prompt and one completion.',
    );
    return;
  }
  const s = allowance(runTree),
    known = yes(k, 1, 'Multiply thirteen');
  title(c, 'Does forty runs mean forty requests?');
  const positions = [1, 3, 9, 27].map((n) =>
    Array.from({ length: n }, (_, i) => 82 + ((i + 0.5) * 506) / n),
  );
  positions.forEach((row, level) =>
    row.forEach((x, i) => {
      const y = 134 + level * 67;
      if (level)
        line(
          c,
          positions[level - 1][Math.floor(i / runTree.branch)],
          y - 58,
          x,
          y - 7,
          C.soft,
          1.3,
        );
      circle(c, x, y, level === 3 ? 6 : 10, level === 3 ? C.brass : C.mint);
    }),
  );
  sheet(c, 630, 118, 277, 252);
  mono(c, 'REQUEST ALLOWANCE', 653, 151);
  type(c, s.internal + ' controllers', 653, 202, 23);
  mono(c, '× 5 requests each', 653, 231, 16, C.teal);
  type(c, s.leaves + ' plain leaves', 653, 282, 23);
  mono(c, '× 1 request each', 653, 310, 16, C.teal);
  if (known) type(c, '= ' + s.requests, 653, 351, 27, C.ink, 'Mono');
  footer(
    c,
    known
      ? '92 requests before retries. Each run can consume several turns.'
      : 'Each controller may start three children over its entire run.',
  );
}

function boundary(c, k) {
  if (k.beat.beatIndex === 2) {
    const { before, writable, after } = permissionFixture();
    const read = yes(k, 2, 'Now ask'),
      denied = yes(k, 2, 'Read it again'),
      reread = yes(k, 2, 'The network repair');
    title(c, 'Can the guest alter the source it just read?');
    book(c, 52, 123, 398, 231, expiry.id, '06');
    type(c, 'Read-only snapshot', 89, 213, 29, C.ink, 'Serif');
    if (read) type(c, dateOf(before) + ', 2026', 89, 277, 34, C.teal, 'Serif');
    mono(c, 'DOCUMENT PERMISSION CHECK', 499, 152, 15, C.soft);
    const rows = [
      ['Read page six', read ? dateOf(before) : '…'],
      ['Replace date', denied ? (writable ? 'Written' : 'Denied') : '…'],
      ['Read it again', reread ? dateOf(after) : '…'],
    ];
    rows.forEach(([op, result], i) => {
      const y = 207 + i * 58;
      note(c, op, 499, y, 18);
      type(c, result, 759, y, 21, C.chalk, 'Mono');
      line(c, 499, y + 14, 899, y + 14, '#405659');
    });
    footer(c, 'Network repair verification remains pending.');
    return;
  }
  const tried = span(k, 1, 'Suppose it reaches', 0.8) === 1,
    decision = yes(k, 1, 'Pause this workload');
  title(c, 'Did the executor enforce the declaration?');
  book(c, 51, 122, 394, 243, 'DECLARED POLICY', '');
  type(c, 'Guest workspace', 87, 208, 27, C.ink, 'Serif');
  ['Temporary files only', 'No guest secrets', 'Network denied'].forEach((s, i) =>
    type(c, s, 87, 250 + i * 32, 20),
  );
  mono(c, 'OBSERVED CONNECTIVITY', 503, 152, 15, C.soft);
  const x = 564,
    Y = 245;
  circle(c, x, Y, 40, '#304c50');
  circle(c, 838, Y, 40, '#304c50');
  mono(c, 'guest', x, Y + 6, 16, C.chalk, 'center');
  mono(c, 'test', 838, Y + 6, 16, C.chalk, 'center');
  const progress = span(k, 1, 'Suppose it reaches', 0.8);
  if (progress) line(c, x + 40, Y, x + 40 + 194 * progress, Y, C.lightThread, 3);
  type(
    c,
    tried ? 'Endpoint reached' : 'Awaiting probe',
    691,
    326,
    25,
    C.chalk,
    'Serif',
    400,
    'center',
  );
  const recheck = yes(k, 1, 'A second probe');
  if (recheck) mono(c, 'Repair verification pending', 691, 367, 15, C.brass, 'center');
  footer(
    c,
    decision
      ? 'Pause admission. Repair and verify the executor boundary.'
      : 'The host owns the policy and the deadline.',
  );
}

function permissionFixture() {
  const snapshot = Object.freeze({ ...expiry });
  const before = snapshot.value;
  const writable = Reflect.set(snapshot, 'value', '2026-10-15');
  return { before, writable, after: snapshot.value };
}

const echoIds = [expiry.id, expiry.id, expiry.id];
function lineageState(k) {
  const n =
    Number(yes(k, 0, 'One reader returns')) + roundSteps(span(k, 0, 'Two more readers', 1.2), 2);
  const ids = echoIds.slice(0, n);
  if (yes(k, 2, 'A reader finds')) ids.push('export-note/p2');
  if (yes(k, 3, 'Now open')) ids.splice(3, 1, 'bulletin-v13/p2');
  return { ...adjudicate(ids), reportIds: ids };
}
function lineage(c, k) {
  const b = k.beat.beatIndex,
    s = lineageState(k),
    showLinks = yes(k, 1, 'Trace the lines'),
    second = s.reportIds[3],
    final = yes(k, 4, 'Keep both passages');
  title(
    c,
    !showLinks
      ? 'How many sources stand behind the three readers?'
      : 'Can we certify the September date?',
  );
  if (!showLinks) {
    book(c, 504, 112, 393, 240, 'CLAIM TO CHECK', '');
    type(c, 'Legacy-token exception', 540, 209, 27, C.ink, 'Serif');
    type(c, dateOf(expiry.value) + ', 2026', 540, 275, 35, C.teal, 'Serif');
    if (!s.reportIds.length) mono(c, 'Awaiting the readers’ citations', 55, 257, 17, C.soft);
  }
  for (let i = 0; i < 3; i++) {
    const x = 53 + i * 153;
    if (i < s.reportIds.length) {
      sheet(c, x, 104, 137, 75);
      mono(c, 'READER ' + (i + 1), x + 11, 126, 13);
      type(c, dateOf(registry[s.reportIds[i]].expiry), x + 11, 154, 22, C.ink, 'Serif');
      mono(c, 'v12 / p6', x + 11, 174, 12, C.teal);
      if (showLinks) thread(c, [x + 70, 183], [258, 253], C.brass);
    }
  }
  if (s.reportIds.length > 0) {
    if (!showLinks) {
      type(c, 'Follow each page pointer.', 57, 300, 28, C.chalk, 'Serif');
    } else {
      passage(c, 54, 258, 401, 144, expiry.id, 'Legacy-token exception', [
        dateOf(expiry.value) + '   /   2026',
      ]);
    }
  }
  if (second) {
    const r = registry[second],
      same = r.scope === registry[expiry.id].scope;
    sheet(c, 554, 104, 337, 75);
    mono(c, 'READER 4', 568, 128, 13);
    type(c, dateOf(r.expiry) + '   ·   ' + second, 568, 161, 17);
    thread(c, [715, 183], [715, 253], same ? C.brass : C.soft);
    passage(
      c,
      511,
      258,
      381,
      144,
      second,
      same ? 'Legacy-token exception' : 'Billing-export exception',
      [dateOf(r.expiry) + '   /   2026'],
    );
  }
  const read = s.reportIds.length;
  footer(
    c,
    final
      ? '2 applicable passages  ·  ' + s.verdict.toUpperCase() + '  ·  governing date unresolved'
      : !showLinks
        ? read + ' matching ' + (read === 1 ? 'report' : 'reports') + '  ·  inspect the pointers'
        : b === 3
          ? 'Same scope. Different dates. Which passage takes precedence?'
          : read +
            ' reports   /   ' +
            s.ids.length +
            ' distinct applicable source' +
            (s.ids.length === 1 ? '' : 's'),
  );
}

const pairCount = (n) => (n * (n - 1)) / 2;
const studies = [
  {
    task: 'OOLONG-Pairs',
    model: 'GPT-5',
    metric: 'F1',
    labels: ['Depth 1', 'Depth 3'],
    scores: [58, 76],
  },
  {
    task: 'CodeQA',
    model: 'Qwen3-Coder',
    metric: 'Accuracy',
    labels: ['REPL only', 'Depth 1'],
    scores: [66, 56],
  },
];
function scaling(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    title(c, 'Does another level improve the score?');
    const show = Number(yes(k, 2, 'On CodeQA')) + 1;
    studies.slice(0, show).forEach((s, i) => {
      const x = 50 + i * 445;
      sheet(c, x, 125, 405, 244);
      mono(c, s.model + '  /  ' + s.metric, x + 19, 157, 14);
      type(c, s.task, x + 19, 201, 26, C.ink, 'Serif');
      s.scores.forEach((v, j) => {
        const yy = 249 + j * 59;
        type(c, s.labels[j], x + 18, yy + 8, 17);
        rect(c, x + 124, yy - 7, 2.0 * v, 17, j ? C.teal : '#bd9970');
        mono(c, v, x + 131 + v * 2, yy + 8, 17, C.ink);
      });
    });
    footer(c, 'Paper v3  ·  May 2026  ·  scores on a 0–100 scale within each task');
    return;
  }
  if (b === 3) {
    title(c, 'What did the smaller controller learn from?');
    const kept = yes(k, 3, 'Selected root turns');
    sheet(c, 49, 117, 856, 242);
    mono(c, 'RLM-QWEN3-8B    /    TRAINING DATA', 75, 153);
    const steps = [
      [75, 'Candidate runs', '2,250'],
      [356, 'Filtered trajectories', kept ? '1,072' : '…'],
      [645, 'Training examples', kept ? 'Root turns' : '…'],
    ];
    steps.forEach(([x, label, value], i) => {
      type(c, label, x, 211, 19);
      type(c, value, x, 284, 37, C.teal, 'Serif');
      if (i < 2) line(c, x + 201, 248, x + 244, 248, C.rule, 2);
    });
    footer(
      c,
      yes(k, 3, 'For scale')
        ? '28.3% relative median gain across four tasks.'
        : 'Remove zero-score and single-turn trajectories before selecting turns.',
    );
    return;
  }
  const n = yes(k, 0, 'Double the record count') ? 8 : 4;
  const known = b === 1 && yes(k, 1, 'Each of eight'),
    unit = 32,
    left = 78,
    top = 125;
  title(c, 'How many distinct pairs must the audit examine?');
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = left + j * unit,
        y = top + i * unit;
      rect(c, x, y, unit - 2, unit - 2, i < j ? C.brass : i === j ? '#44595a' : '#2b4448');
      if (i === j) line(c, x + 6, y + 21, x + 22, y + 6, C.soft);
    }
  sheet(c, 421, 138, 465, 204);
  mono(c, 'ALL UNORDERED PAIRS', 446, 171, 15);
  type(c, n + ' records × ' + (n - 1) + ' partners', 446, 228, 29, C.ink, 'Serif');
  type(c, 'Divide by 2', 446, 267, 22);
  if (n === 4 || known) mono(c, '= ' + pairCount(n) + ' distinct pairs', 446, 310, 23, C.teal);
  footer(
    c,
    yes(k, 1, 'A single fact')
      ? '10,000 records   /   ' +
          pairCount(10000).toLocaleString('en-US') +
          ' pairs before pruning.'
      : 'Leave out self-pairs. Each highlighted cell represents one unordered pair.',
  );
}

const gates = { recall: 0.9, cost: 0.3, latency: 12 };
function routeState(k) {
  const b = k.beat.beatIndex,
    rows = b >= 2 ? freshRoutes : routes;
  const price = yes(k, 3, 'Which route can still run') ? 0.2 : gates.cost;
  const limits = { ...gates, cost: price },
    result = chooseRoute(rows, limits);
  const known =
    (b === 1 && yes(k, 1, 'Direct misses')) ||
    (b === 3 && price === gates.cost && yes(k, 3, 'Keep the results')) ||
    (b === 4 && yes(k, 4, 'Even the cheapest'));
  return { rows, limits, result, known };
}
function routing(c, k) {
  const { rows, limits, result, known } = routeState(k);
  title(c, 'Which route clears every gate at the lowest cost?');
  mono(c, 'ILLUSTRATIVE RESULTS    /    SAME HELD-OUT QUESTIONS', 49, 103, 15, C.soft);
  const columns = [
    {
      x: 223,
      key: 'recall',
      max: 1,
      label: 'Recall',
      condition: '≥ ' + Math.round(limits.recall * 100) + '%',
      format: (v) => Math.round(v * 100) + '%',
    },
    {
      x: 455,
      key: 'cost',
      max: 0.6,
      label: 'p95 cost',
      condition: '≤ ' + Math.round(limits.cost * 100) + '¢',
      format: (v) => Math.round(v * 100) + '¢',
    },
    {
      x: 687,
      key: 'latency',
      max: 25,
      label: 'p95 time',
      condition: '≤ ' + limits.latency + ' s',
      format: (v) => v.toFixed(1) + ' s',
    },
  ];
  sheet(c, 49, 122, 862, 243);
  mono(c, 'Route', 67, 154, 16);
  rows.forEach((row, i) => type(c, row.id, 69, 217 + i * 57, 22, C.ink, 'Serif'));
  columns.forEach((col, j) => {
    const width = 188,
      gateX = col.x + (width * limits[col.key]) / col.max;
    type(c, col.label + ' ' + col.condition, col.x, 155, 18, C.ink, 'Sans', 600);
    line(c, gateX, 169, gateX, 347, '#846d4a', 1.7, [3, 3]);
    rows.forEach((row, i) => {
      const y = 222 + i * 57,
        v = row[col.key],
        x = col.x + (width * v) / col.max;
      line(c, col.x, y, col.x + width, y, C.rule, 1.5);
      circle(c, x, y, 5, known ? (result.checked[i].passes[j] ? C.teal : C.red) : C.ink);
      mono(
        c,
        col.format(v),
        Math.max(col.x + 18, Math.min(col.x + width - 15, x)),
        y - 11,
        15,
        C.ink,
        'center',
      );
    });
  });
  if (known)
    band(
      c,
      62,
      380,
      495,
      result.choice === 'HOLD'
        ? 'Hold deployment. No route meets every gate.'
        : 'Lowest-cost eligible route   /   ' + result.choice,
      result.choice === 'HOLD' ? C.red : C.teal,
    );
  footer(
    c,
    known && result.choice === 'HOLD'
      ? 'All three costs exceed the revised ceiling.'
      : known
        ? 'Use lower latency to break a cost tie.'
        : 'Each dashed line marks a binding limit.',
  );
}

const restoreJobs = ['2026-11-12', '2026-11-16'];
function restoreState(k) {
  const b = k.beat.beatIndex;
  const fixed = yes(k, 1, 'Both fields now match'),
    removed = yes(k, 2, 'exact recall drops'),
    extra = yes(k, 2, 'leaves that score unchanged');
  const candidate = { ...(fixed ? restoreSource : restoreSummary) };
  if (removed) delete candidate.condition;
  if (extra) candidate.dailyLimit = '1 restore';
  const matches = Object.entries(restoreSource).filter(
    ([key, val]) => candidate[key] === val,
  ).length;
  return {
    candidate,
    matches,
    scoreKnown: b > 0 && yes(k, 1, 'The summary would refuse'),
    fixed,
    removed,
    extra,
    jobs: restoreJobs.slice(0, yes(k, 1, 'add another') ? 2 : 1),
    verdictKnown: yes(k, 2, 'The sixteenth falls'),
  };
}
function practice(c, k) {
  const s = restoreState(k),
    b = k.beat.beatIndex;
  title(c, 'Which November restore does the source cover?');
  book(c, 49, 105, 425, 201, 'RESTORE MANUAL', 'p2');
  type(c, 'Backup restore exception', 84, 186, 24, C.ink, 'Serif');
  type(c, restoreSource.condition + ' required.', 84, 226, 19);
  type(c, 'Expires ' + dateOf(restoreSource.expiry) + ', 2026.', 84, 264, 24, C.teal, 'Serif');
  sheet(c, 515, 110, 389, 194);
  mono(c, 'WORKING SUMMARY', 537, 140);
  type(c, s.candidate.condition ?? 'Condition missing', 537, 187, 22, C.ink, 'Serif');
  type(c, 'Expires ' + dateOf(s.candidate.expiry), 537, 223, 23, s.fixed ? C.teal : C.ink, 'Serif');
  if (s.extra) mono(c, '1 restore per day?   Unsupported', 537, 254, 15, C.red);
  if (s.scoreKnown) mono(c, s.matches + ' / 2 required fields match', 537, 285, 16, C.teal);
  s.jobs.forEach((job, i) => {
    const x = 52 + i * 436;
    rect(c, x, 338, 410, 66, '#314b4e');
    type(c, dateOf(job), x + 12, 381, 31, C.chalk, 'Serif');
    const rel = compareRun(job, restoreSource.expiry);
    const show = i === 0 ? s.fixed : s.verdictKnown;
    const summaryBlocks =
      !s.fixed && s.scoreKnown && compareRun(job, s.candidate.expiry) === 'After expiry';
    const label = show
      ? rel === 'Before expiry'
        ? 'Covered by p2'
        : 'After expiry'
      : summaryBlocks
        ? 'Summary refuses'
        : 'Logging on';
    type(
      c,
      label,
      x + 165,
      379,
      20,
      show
        ? rel === 'Before expiry'
          ? C.mint
          : C.lightThread
        : summaryBlocks
          ? C.lightThread
          : C.chalk,
    );
  });
  footer(
    c,
    s.extra
      ? 'Required-fact recall ignores extra claims. Check their support separately.'
      : b === 0
        ? 'Compare both required fields before clearing the restore.'
        : 'Use the cited passage to decide each run.',
  );
}

const painters = {
  c01: opening,
  c02: external,
  c03: inspection,
  c04: tree,
  'c04-window': windowStudy,
  c05: completion,
  'c05-history': history,
  c06: ledger,
  'c06-work': waves,
  'c06-boundary': boundary,
  c07: lineage,
  'c08-scale': scaling,
  c08: routing,
  'c08-practice': practice,
};
function draw(c, k) {
  base(c);
  painters[k.beat.chapterId](c, k);
}

function check() {
  assert.equal(slice.used, 34);
  assert.equal(slice.text, expiry.text);
  assert.equal(slice.sourceId, expiry.id);
  assert.throws(() => boundedSlice(5, 33));
  assert.deepEqual(Object.keys(visitedFacts(3)), []);
  assert.equal(visitedFacts(4).expiry, undefined);
  assert.equal(visitedFacts(5).condition.sourceId, condition.id);
  assert.deepEqual(
    legacyRuns.jobs.map((d) => compareRun(d, expiry.value)),
    ['Before expiry', 'After expiry'],
  );
  assert.deepEqual(plan, { leafCalls: 8, mergeCalls: 7, total: 15 });
  assert.deepEqual(rootOutput.missing, ['expiry']);
  assert.equal(rootOutput.required.expiry, expiry.value);
  checkWindowStudy();
  for (const r of ['printed', { ready: 'false', content }, { ready: true, content: '  ' }, []])
    assert(!complete(r));
  assert(complete({ ready: true, content }));
  assert(hasCitedDate({ ready: true, content }));
  assert(!hasCitedDate({ ready: true, content: '2026-10-15 [' + expiry.id + ']' }));
  assert(!hasCitedDate({ ready: true, content: expiry.value + ' [' + condition.id + ']' }));
  assert.deepEqual(
    historyRun(500).map((e) => e.state),
    ['continue', 'candidate stored'],
  );
  assert.deepEqual(
    historyRun(80).map((e) => e.state),
    ['history_budget'],
  );
  assert.equal(raw.length, 409);
  assert.equal(preview.length, 40);
  assert.equal(marker.length, 14);
  assert.equal(preview.slice(0, -14), raw.slice(0, 26));
  assert.equal(preview.length * 20, 800);
  for (let n = 0; n <= 10; n++) {
    const s = budgetTrace(n);
    assert.equal(s.availableCost + s.chargedCost, 10);
    assert.equal(
      s.chargedCost,
      Object.values(s.entries).reduce((a, e) => a + e.charged, 0),
    );
    assert.equal(s.availableCalls + s.chargedCalls, 4);
  }
  assert.equal(budgetTrace(6).entries['Child A'].charged, 3);
  assert.equal(budgetTrace(6).entries['Child A'].status, 'unknown');
  assert.equal(budgetTrace(10).entries['Child C'].status, 'queued');
  assert.deepEqual([budgetTrace(10).availableCalls, budgetTrace(10).availableCost], [1, 3.5]);
  assert.deepEqual(allowance(runTree), {
    layers: [1, 3, 9, 27],
    leaves: 27,
    internal: 13,
    requests: 92,
  });
  assert.equal(Math.ceil(11 / 3), 4);
  assert.deepEqual(permissionFixture(), {
    before: expiry.value,
    writable: false,
    after: expiry.value,
  });
  assert.equal(adjudicate(echoIds).ids.length, 1);
  assert.equal(
    adjudicate([...echoIds, 'export-note/p2', 'missing']).verdict,
    'supported in fixture',
  );
  assert.equal(adjudicate(['bulletin-v13/p2']).verdict, 'contradicted');
  assert.equal(adjudicate([...echoIds, 'bulletin-v13/p2']).verdict, 'conflict');
  assert.deepEqual([4, 8, 10000].map(pairCount), [6, 28, 49995000]);
  assert.equal(chooseRoute(routes, gates).choice, 'REPL only');
  assert.equal(chooseRoute(freshRoutes, gates).choice, 'Direct');
  assert.equal(chooseRoute(freshRoutes, { ...gates, cost: 0.2 }).choice, 'HOLD');
  assert.deepEqual(
    restoreJobs.map((d) => compareRun(d, restoreSource.expiry)),
    ['Before expiry', 'After expiry'],
  );
  for (const [beatIndex, value, matches] of [
    [0, 0, 1],
    [1, 1, 2],
    [2, 1, 1],
  ]) {
    assert.equal(restoreState({ beat: { beatIndex }, reveal: () => value }).matches, matches);
  }
  const clock = (beatIndex, ...phrases) => ({
    beat: { beatIndex },
    reveal: (p) => Number(phrases.includes(p)),
  });
  const merged = treeState(clock(2));
  assert.deepEqual(
    [merged.leaves, merged.merges, merged.rootReady, merged.fields.expiry],
    [8, 7, true, undefined],
  );
  assert.equal(treeState(clock(3, 'attach its pointer')).fields.expiry, expiry.value);
  const waiting = ledgerState(clock(2));
  assert.equal(waiting.entries['Child C'], undefined);
  assert.deepEqual([waiting.availableCalls, waiting.availableCost], [1, 3.5]);
  assert.equal(ledgerState(clock(3, 'Only one call')).entries['Child C'].status, 'queued');
  assert.deepEqual(lineageState(clock(2, 'A reader finds')).ids, [expiry.id]);
  const disputed = lineageState(clock(3, 'Now open'));
  assert.deepEqual(
    [disputed.reportIds.length, disputed.ids.length, disputed.verdict],
    [4, 2, 'conflict'],
  );
  assert.deepEqual(routeState(clock(3, 'Keep the results')).rows, routeState(clock(4)).rows);
  assert.equal(routeState(clock(4, 'Even the cheapest')).result.choice, 'HOLD');
  return true;
}
export default { title: titleText, draw, check };
