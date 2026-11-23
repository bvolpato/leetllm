import {
  MESSAGES,
  UPDATED_MESSAGES,
  QUERY,
  FRESH_QUERY,
  PERMITTED_NOTE_IDS,
  NEXT_CALLER_IDS,
} from '../../../films/ai-data-structures/fixtures.mjs';
import {
  terms,
  buildIndex,
  scoreRows,
  indexedScores,
  rank,
  search,
  ownershipSnapshot,
  eligibleTopK,
  permittedFreshRanking,
} from '../../../films/ai-data-structures/arithmetic.mjs';
import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  C,
  beat,
  cue,
  ease,
  mix,
  label,
  text,
  line,
  rect,
  dot,
  plate,
  slots,
  token,
  note,
  receipt,
  strip,
  foot,
  arrow,
  idText,
} from './archive.mjs';

const original = buildIndex(),
  updated = buildIndex(UPDATED_MESSAGES);
const ids = (rows) => rows.map((r) => r.id);
function lock(g, x, y, open) {
  const col = open ? C.mint : C.coral;
  g.strokeStyle = col;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(x + (open ? 8 : 0), y - 4, 9, Math.PI, Math.PI * 2);
  g.stroke();
  line(g, x + (open ? 17 : 9), y - 4, x + (open ? 17 : 9), y + 4, col, 4);
  if (!open) line(g, x - 9, y - 4, x - 9, y + 4, col, 4);
  rect(g, x - 14, y + 2, 29, 22, col, 4);
  dot(g, x, y + 12, 3, C.deep);
}
export function ownership(g, c) {
  const n = beat(c),
    changed = cue(c, 2, 'remove its first item'),
    copy = cue(c, 2, 'Replay that mutation'),
    pruned = cue(c, 2, 'request-owned copy');
  const snap = ownershipSnapshot(copy ? 'copy' : 'alias', copy ? pruned > 0.65 : changed > 0.6);
  label(g, 'Cache key', 66, 157);
  token(g, 64, 178, 'v7  /  charged twice  /  k=2  /  all notes', 1030, 58);
  label(g, 'Cache', 80, 319);
  label(g, 'Caller', 80, 463);
  const stored = !!cue(c, 1, 'Store that result');
  line(g, 188, 311, 461, 311, C.gold, 4);
  if (!copy) {
    line(g, 188, 455, 362, 455, C.rail, 4);
    line(g, 362, 455, 362, 311, C.rail, 4);
  } else arrow(g, 188, 455, 462, 455, C.mint, 4);
  if (stored)
    slots(
      g,
      486,
      282,
      [...snap.stored.map((i) => 'M' + i), ...Array(2 - snap.stored.length).fill(null)],
      { w: 129, h: 65, color: C.gold },
    );
  if (copy)
    slots(
      g,
      486,
      423,
      [...snap.request.map((i) => 'M' + i), ...Array(2 - snap.request.length).fill(null)],
      { w: 129, h: 65, color: C.mint },
    );
  label(g, copy ? 'Stored tuple' : 'Stored list', 791, 318);
  if (beat(c) === 2) label(g, copy ? 'Caller-owned list' : 'Same list object', 791, 462);
  foot(
    g,
    n === 1
      ? 'Matching keys can reuse a ranked result.'
      : copy
        ? 'Removing from the copy leaves the cached pair intact.'
        : 'Both references reach one mutable list. Removing an ID changes the next hit.',
  );
}
export function eligibility(g, c) {
  const state = eligibleTopK(),
    post = cue(c, 1, 'then remove'),
    early = cue(c, 2, 'Filter by permission'),
    ranked = cue(c, 2, 'Now M3');
  const pool = state.ranked;
  label(g, 'Scored notes · caller may read M2 and M3', 62, 157);
  pool.forEach((r, i) => {
    const x = 76 + i * 355;
    lock(g, x + 12, 207, PERMITTED_NOTE_IDS.includes(r.id));
    token(g, x + 47, 185, 'M' + r.id + ' · ' + r.score + ' pt', 234, 54);
  });
  line(g, 58, 265, 1132, 265, C.rail);
  const late = post
    ? ids(state.selectedThenFiltered)
    : cue(c, 1, 'Take the two global winners')
      ? ids(pool.slice(0, 2))
      : [];
  receipt(g, 73, 320, 437, 'Limit first, then check access', late);
  arrow(g, 534, 406, 624, 406, early ? C.mint : C.rail);
  receipt(
    g,
    651,
    320,
    460,
    'Check access, then limit',
    ranked ? ids(state.filteredThenSelected) : [],
  );
  foot(
    g,
    early
      ? 'Filtering the whole pool leaves both eligible notes available for selection.'
      : 'Once the pair is cut to two, a later filter cannot reach the next eligible candidate.',
  );
}
export function changedTerms() {
  const oldWords = terms(MESSAGES[2].text),
    newWords = terms(UPDATED_MESSAGES[2].text);
  return {
    drop: oldWords.filter((w) => !newWords.includes(w)),
    add: newWords.filter((w) => !oldWords.includes(w)),
  };
}
export function publish(g, c) {
  const n = beat(c);
  if (n === 1) {
    const { drop, add } = changedTerms(),
      remove = cue(c, 1, 'Remove its ID'),
      insert = cue(c, 1, 'Add it to');
    note(g, UPDATED_MESSAGES[2], 61, 140, 1080, { active: true, highlight: true, words: ['sign'] });
    label(g, 'Posting set loses M2', 63, 264);
    label(g, 'Posting set gains M2', 629, 264);
    for (const [i, w] of drop.entries())
      strip(g, 59, 281 + 89 * i, w, [...((remove ? updated : original).get(w) ?? [])], { w: 517 });
    for (const [i, w] of add.entries())
      strip(g, 623, 281 + 89 * i, w, [...((insert ? updated : original).get(w) ?? [])], { w: 517 });
    foot(g, 'M2 keeps its stable ID. Update every posting whose membership changed.');
  } else {
    const on = cue(c, 2, 'index and version together'),
      miss = cue(c, 2, 'lookup misses'),
      fill = cue(c, 3, 'store their IDs');
    label(g, 'Published snapshot', 64, 169);
    plate(g, 61, 193, 1083, 133);
    ['Notes', 'Index', 'Version'].forEach((s, i) => {
      const x = 89 + 346 * i;
      label(g, s, x, 235);
      text(g, 'v' + (on ? 8 : 7), x, 292, 35, C.gold, 'Mono');
    });
    receipt(g, 80, 352, 439, 'Saved under v7', search());
    receipt(
      g,
      642,
      352,
      459,
      fill ? 'Saved under v8' : miss ? 'v8 lookup · miss' : 'Version 8 lookup',
      fill ? search(UPDATED_MESSAGES) : [],
    );
    foot(g, 'Every reader uses the notes and index published with its version.');
  }
}
export function lruTrace(requests, capacity) {
  const order = new Map(),
    trace = [];
  for (const word of requests) {
    order.delete(word);
    order.set(word, true);
    if (order.size > capacity) order.delete(order.keys().next().value);
    trace.push([...order.keys()]);
  }
  return trace;
}
const recency = lruTrace(['charged', 'twice', 'charged', 'sign'], 2);
const billingKey = {
  version: 8,
  query: QUERY,
  limit: 2,
  scope: MESSAGES.map((row) => row.id),
};

export function billingRun(atomic) {
  const cache = new Map();
  let notesVersion = 7,
    indexVersion = 7;
  const snapshot = (status) => ({
    status,
    notesVersion,
    indexVersion,
    saved: cache.get(billingKey) ?? [],
    index: indexVersion === 7 ? original : updated,
  });
  const states = [snapshot('No entry yet')];
  notesVersion = billingKey.version;
  if (atomic) indexVersion = notesVersion;
  states.push(snapshot('No entry yet'));
  const lookup = () => snapshot(cache.has(billingKey) ? 'Cache hit' : 'Cache miss');
  const miss = lookup();
  states.push(miss);
  const eligible = indexedScores(miss.index, billingKey.query).filter((r) =>
    billingKey.scope.includes(r.id),
  );
  cache.set(billingKey, ids(rank(eligible).slice(0, billingKey.limit)));
  states.push(snapshot('Saved under v8'));
  if (!atomic) {
    indexVersion = notesVersion;
    states.push(snapshot('Saved under v8'), lookup());
  }
  return states;
}

function freshness(g, c) {
  const n = beat(c),
    atomic = n === 5;
  const cues = atomic
    ? ['version together', 'billing request misses', 'under that same key']
    : [
        'as version eight',
        'lookup misses',
        'Store the resulting pair',
        'index catch up',
        'hits the saved pair',
      ];
  const stage = cues.filter((phrase) => cue(c, n, phrase, 0) === 1).length;
  const state = billingRun(atomic)[stage];
  label(g, 'Cache key', 62, 152);
  text(
    g,
    'v' +
      billingKey.version +
      '  /  ' +
      billingKey.query +
      '  /  k = ' +
      billingKey.limit +
      '  /  all ' +
      billingKey.scope.length +
      ' notes',
    234,
    154,
    25,
    C.gold,
    'Mono',
  );
  label(g, 'Published notes · v' + state.notesVersion, 63, 222);
  const rows = state.notesVersion === 7 ? MESSAGES : UPDATED_MESSAGES;
  note(g, rows[2], 60, 240, 691, { h: 65, active: true, words: terms(QUERY), highlight: true });
  label(g, 'Published index · v' + state.indexVersion, 62, 355);
  terms(QUERY).forEach((term, i) =>
    strip(g, 60, 374 + 86 * i, term, [...state.index.get(term)], { w: 691 }),
  );
  label(g, 'Billing cache entry', 809, 222);
  receipt(g, 804, 241, 340, state.status, state.saved);
  const notes = atomic
    ? [
        'Rewind to version seven, before the first write to this key.',
        'This publication makes the edited notes and their index visible together.',
        'On this miss, which IDs do the two v8 postings support?',
        'Both IDs came from the snapshot named in the key.',
      ]
    : [
        'Follow the original billing query through the version change.',
        'M2 has changed. The old index still lists M2 under both words.',
        'The lookup misses. The available index still contains the old postings.',
        'The entry is filed under v8 with a pair computed from v7.',
        'The index has caught up. The saved pair still includes M2.',
        'This hit returns the pair that was stored during the earlier miss.',
      ];
  foot(g, notes[stage]);
}
export function lru(g, c) {
  const n = beat(c);
  if (n <= 3) {
    const hit = cue(c, 1, 'Move that hit', 1.3),
      insert = cue(c, 2, 'put sign in the free place', 1.3);
    const [least, most] = recency[1],
      newWord = recency.at(-1).at(-1);
    const x0 = 176,
      x1 = 687,
      y = 298;
    label(g, 'Least recent', x0, 244);
    label(g, 'Most recent', x1, 244);
    line(g, 69, y + 89, 1110, y + 89, C.rail, 7);
    const arc = 72 * Math.sin(Math.PI * hit);
    token(g, mix(mix(x0, x1, hit), x0, insert), y - arc, least, 249, 69, C.gold);
    if (insert < 1)
      token(
        g,
        mix(mix(x1, x0, hit), 65, insert),
        y + arc + 126 * insert,
        most,
        249,
        69,
        insert ? C.coral : C.paper,
      );
    if (cue(c, 1, 'asks for sign')) token(g, x1, mix(457, y, insert), newWord, 249, 69, C.mint);
    if (insert === 1) {
      label(g, 'Evicted: ' + recency[2][0], 91, 489);
      label(g, 'sign → ' + idText([...updated.get('sign')]), 648, 492);
    }
    foot(
      g,
      n === 3
        ? 'OrderedDict can move a hit to the end. An ordinary dict read leaves insertion order intact.'
        : 'A read changes recency even when the result stays the same.',
    );
  } else if (n === 4 || n === 5) {
    freshness(g, c);
  } else {
    label(g, 'Two tuples hold a reference to one mutable document', 70, 175);
    token(g, 80, 225, 'Tuple A', 203, 65);
    token(g, 80, 393, 'Tuple B', 203, 65);
    line(g, 285, 257, 430, 257, C.rail, 3);
    line(g, 285, 425, 430, 425, C.rail, 3);
    line(g, 430, 257, 430, 425, C.rail, 3);
    arrow(g, 430, 341, 586, 341);
    const edited = cue(c, 6, 'change the text');
    note(g, edited ? UPDATED_MESSAGES[2] : MESSAGES[2], 606, 298, 536, {
      active: true,
      words: ['charged', 'sign'],
      highlight: true,
      h: 89,
    });
    foot(
      g,
      'A tuple fixes its sequence of references. Both references still reach the same document.',
    );
  }
}
function billingTicket(g, row, x, y, hits) {
  rect(g, x + 1, y + 4, 250, 151, C.deep, 6);
  rect(g, x, y, 250, 151, C.paper, 6);
  text(g, 'M' + row.id, x + 17, y + 52, 48, C.ink, 'Mono');
  const edited = row.text !== MESSAGES[row.id].text;
  if (edited) text(g, 'edited', x + 231, y + 44, 23, C.mid, 'Mono', 'right');
  line(g, x + 17, y + 63, x + 233, y + 63, '#adad94');

  const name = edited ? row.text : row.short;
  const lines = name.split(/ (?=charged\b|after changing plans\b)/);
  lines.forEach((title, i) => {
    g.save();
    g.translate(x + 17, y + 97 + 37 * i);
    g.font = '32px "Lesson Serif"';
    g.scale(Math.min(1, 216 / g.measureText(title).width), 1);
    let left = 0;
    for (const word of title.split(' ')) {
      const width = g.measureText(word).width;
      if (hits.includes(word)) rect(g, left - 2, -27, width + 4, 34, C.gold, 3);
      text(g, word, left, 0, 32, C.ink, 'Serif');
      left += width + g.measureText(' ').width;
    }
    g.restore();
  });
}

export function returnQuery(g, c) {
  // The named IDs fall inside these three recorded caption cues.
  const chargedM0 = c.reveal('Charged gives', 0.512) === 1;
  const chargedM3 = c.reveal('Charged gives', 1.375) === 1;
  const twiceM0 = c.reveal('Twice gives', 0.575) === 1;
  const sendElapsed = 2.15 * c.reveal('Send M0 first', 2.15);
  const reply = search(UPDATED_MESSAGES);
  text(g, 'Version 8 · all four notes', 55, 149, 29, C.pale, 'Serif');
  text(g, terms(QUERY).join('  +  '), 1145, 149, 30, C.cream, 'Mono', 'right');

  plate(g, 54, 367, 1092, 250, true);
  text(g, 'Reply', 600, 493, 36, C.ink, 'Serif', 'center');
  const slotX = [215, 755];
  slotX.forEach((x, i) => {
    rect(g, x, 390, 250, 151, '#dbd1b7', 6, '#97977e');
    text(g, '0' + (i + 1), x + 125, 587, 36, C.ink, 'Mono', 'center');
  });

  UPDATED_MESSAGES.forEach((row, i) => {
    const x = 55 + 280 * i;
    const hits = [];
    if (updated.get('charged').has(row.id) && (row.id === 0 ? chargedM0 : chargedM3))
      hits.push('charged');
    if (updated.get('twice').has(row.id) && twiceM0) hits.push('twice');
    const slot = reply.indexOf(row.id);
    const start = [0.2, 1.325][slot];
    if (slot < 0 || sendElapsed <= start) {
      billingTicket(g, row, x, 174, hits);
      return;
    }
    // Move down before moving sideways so the ticket clears its neighbor.
    const flight = (sendElapsed - start) / 0.8;
    rect(g, x, 174, 250, 151, C.deep, 6, C.mid);
    billingTicket(
      g, row,
      mix(x, slotX[slot], ease((flight - 0.55) / 0.45)),
      mix(174, 390, ease(flight)), hits,
    );
  });
}
const firstCallerRanking = permittedFreshRanking();
export const nextCallerRanking = firstCallerRanking.all.filter(({ id }) =>
  NEXT_CALLER_IDS.includes(id),
);

function timeAfterResult(c, phrase) {
  c.reveal(phrase, 0, { captionStart: phrase });
  return (firstFrameAt(c.elapsed) - firstFrameAt(c.wordCue(phrase).end)) / fps;
}

function callerBRanking(g, c) {
  const n = beat(c);
  const sendTime = n === 6 ? timeAfterResult(c, 'Send M1, then M2') : Infinity;
  const thirdTime = n === 6 ? timeAfterResult(c, 'M3 slips to third') : Infinity;
  const rankX = 820;
  const waitingX = 1028;
  const rankY = [314, 379, 491];
  const cardWidth = 105;
  const cardHeight = 46;

  const showRanks = n === 5 || sendTime >= 0;
  const park = ease(sendTime / 0.30);
  const lower = ease((sendTime - 0.20) / 0.42);
  const enter = ease((sendTime - 0.33) / 0.45);
  const outside = thirdTime >= 0 ? ease(thirdTime / 0.65) : 0;

  let heading = 'Compare readable notes';
  if (n === 5) heading = 'Reply for caller B';
  else if (showRanks) heading = enter === 1 ? 'Caller B ranking' : 'Reorder for caller B';
  label(g, heading, 774, 274);
  if (showRanks) {
    const positions = n > 5 && thirdTime >= 0 ? rankY : rankY.slice(0, 2);
    positions.forEach((y, i) => {
      text(g, i + 1, 793, y + 31, 23, C.pale, 'Mono', 'center');
      rect(g, rankX, y, cardWidth, cardHeight, C.deep, 5, C.rail);
    });
  }
  if (n === 5) return false;

  if (showRanks) {
    line(g, 774, 456, 973, 456, C.rail);
    label(g, 'Reply cutoff', 972, 446, 'right');
  } else {
    label(g, 'Saved order', rankX, 302);
    label(g, 'Newly readable', waitingX + cardWidth / 2, 302, 'center');
  }

  // Move the old second card aside before the old first card moves down.
  const settled = outside === 1;
  const [incoming, second, third] = nextCallerRanking;
  const card = (row, x, y, fill) => token(g, x, y, 'M' + row.id, cardWidth, cardHeight, fill);

  card(incoming, mix(waitingX, rankX, enter), rankY[0], enter === 1 ? C.mint : C.paper);
  card(second, rankX, mix(rankY[0], rankY[1], lower), lower === 1 ? C.mint : C.paper);
  card(
    third,
    mix(mix(rankX, waitingX, park), rankX, ease((outside - 0.68) / 0.32)),
    mix(rankY[1], rankY[2], outside),
    C.paper,
  );
  if (enter === 1 && outside === 0)
    label(g, 'Still readable', waitingX + cardWidth / 2, 370, 'center');
  if (settled) label(g, 'Outside reply', 949, 521);
  return settled;
}

export function finalCase(g, c) {
  const n = beat(c);
  const second = n >= 5;
  const expandedScope = n > 5 || (n === 5 && timeAfterResult(c, 'This caller can also read M1') >= 0);
  const allowed = expandedScope ? NEXT_CALLER_IDS : PERMITTED_NOTE_IDS;
  const scores = scoreRows(UPDATED_MESSAGES, FRESH_QUERY);
  const incorrect = n === 2 && timeAfterResult(c, 'Take the first two IDs in the tie') >= 0;
  const filtered = n === 2 && timeAfterResult(c, 'Both slots are empty') >= 0;
  const accessFirst = n >= 3 || cue(c, 2, 'Check access while all four are within reach', 0);
  const saved = n >= 5 || cue(c, 4, 'Save that pair under this permission scope', 0);
  label(g, 'v8 · sign + charged · two places', 1140, 66, 'right');
  UPDATED_MESSAGES.forEach((r, i) => {
    const y = 166 + i * 96;
    note(g, r, 52, y, 545, {
      highlight: n >= 2,
      words: terms(FRESH_QUERY),
      active: allowed.includes(r.id),
      h: 76,
    });
    lock(g, 634, y + 29, allowed.includes(r.id));
    if (n >= 2) text(g, '+' + scores[i].score, 672, y + 49, 24, C.gold, 'Mono');
  });
  if (saved) {
    plate(g, 765, 165, 374, 83);
    label(g, 'Saved for caller A', 782, 193);
    slots(g, 781, 204, firstCallerRanking.early.map(({ id }) => 'M' + id), {
      w: 105,
      h: 35,
      color: C.paper,
    });
  } else {
    let reply = [];
    if (n === 2 && incorrect)
      reply = filtered ? ids(firstCallerRanking.late) : ids(firstCallerRanking.all.slice(0, 2));
    if (n === 4) reply = ids(firstCallerRanking.early);
    else if (n === 3) {
      const firstSlot = timeAfterResult(c, 'M2 goes in the first slot') >= 0;
      const secondSlot = timeAfterResult(c, 'M3 goes in the second') >= 0;
      reply = ids(firstCallerRanking.early).slice(0, Number(firstSlot) + Number(secondSlot));
    }
    receipt(g, 765, 165, 374, n === 2 && !accessFirst ? 'Limit before access' : 'Reply for caller A', reply);
  }
  if (!second) text(g, 'Lower ID wins a tie.', 771, 432, 25, C.pale, 'Serif');
  const ranked = second && callerBRanking(g, c);
  foot(
    g,
    second
      ? ranked
        ? 'M1 enters the ranking. M3 is still readable and now ranks third.'
        : n === 6
          ? 'Compare all three readable notes. A lower ID wins a score tie.'
          : expandedScope
            ? 'Caller B gains access to M1. Can the saved pair be reused?'
            : 'Caller B searches the same notes for the same words.'
      : n === 1
          ? 'Which two permitted notes belong in this reply?'
          : saved
            ? 'Keep the permission scope with the saved pair.'
            : n === 4
              ? 'Reply for caller A: M2, then M3.'
              : accessFirst
                ? 'Check access across all four notes before choosing two.'
                : filtered
                  ? 'The global pair cannot be sent to this caller.'
                  : 'Try limiting the global ranking before checking the locks.',
    145,
    157,
  );
}
export { recency };
