import { MESSAGES, QUERY } from '../../../films/ai-data-structures/fixtures.mjs';
import {
  buildIndex,
  scoreRows,
  search,
  heapTrace,
  doublingHistory,
  collisionWorksheet,
  toyBucket,
} from '../../../films/ai-data-structures/arithmetic.mjs';
import {
  C,
  beat,
  cue,
  afterSpeech,
  mix,
  label,
  text,
  line,
  rect,
  plate,
  slots,
  token,
  note,
  receipt,
  strip,
  foot,
  arrow,
  node,
  idText,
} from './archive.mjs';

const index = buildIndex();
const scores = scoreRows();
const words = QUERY.split(' ');
const showIds = (ids) => ids.map((i) => 'M' + i);
export const shifts = (n) => (n * (n - 1)) / 2;

export function opening(g, c) {
  const reveal = cue(c, 4, 'Keep their IDs');
  const visible = reveal > 0 ? search() : [];
  const travel = cue(c, 2, 'Here are the four', 1);
  const spread = cue(c, 2, 'four support notes', 0.65, false);
  const rate = Math.min(1, cue(c, 1, 'charged twice') * 2);
  if (travel === 1 && spread > 0) {
    g.save();
    g.globalAlpha = spread;
    label(g, 'Support notes', 55, 160);
    for (const [i, row] of MESSAGES.entries()) {
      note(g, row, 52, 179 + i * 93, 686, {
        active: visible.includes(i),
        highlight: visible.includes(i),
        words,
      });
    }
    receipt(g, 790, 365, 350, 'Send to the assistant', visible);
    g.restore();
  }
  g.save();
  g.translate(mix(311, 790, travel), mix(183, 163, travel));
  const scale = mix(1.65, 1, travel);
  g.scale(scale, scale);
  receipt(g, 0, 0, 350, 'Plan payments', rate > 0 ? ['$12.00', '$12.00'] : ['$12.00']);
  g.restore();
  if (beat(c) === 3 && cue(c, 3, 'both words')) {
    label(g, 'Query terms', 55, 555);
    text(g, 'charged  +  twice', 232, 555, 22, C.gold, 'Mono');
  }
  foot(
    g,
    visible.length ? 'Both words occur in each selected note.' : '“Why was my card charged twice?”',
  );
}
export function lists(g, c) {
  const n = beat(c),
    resize = cue(c, 2, 'Make a larger array'),
    copied = cue(c, 2, 'copy the three references', 1.15);
  const appended = cue(c, 2, 'then append'),
    shift = cue(c, 3, 'moves one slot right', 0.9);
  const added = shift === 1;
  const x = 90,
    step = 150;
  const expanded = resize > 0;
  const y = expanded ? 325 : 224;
  const cap = expanded ? 6 : 3;
  label(g, expanded ? 'Original array · capacity 3' : 'References in list order', 65, 151);
  if (expanded) {
    const oldSlots = [0, 1, 2].map((i) => (appended ? null : 'M' + i));
    slots(g, x, 168, oldSlots, { w: 122, h: 44, gap: 28, color: C.pale });
    label(g, appended ? 'Released' : 'Copy references into the larger array', 584, 198);
    label(g, 'New array · capacity 6', 624, 274);
  }
  plate(g, x - 20, y - 17, cap * step + 22, 117);
  for (let i = 0; i < cap; i++) {
    rect(g, x + i * step, y, 124, 56, C.deep, 5);
    text(g, 'slot ' + i, x + 62 + i * step, y + 85, 17, C.pale, 'Mono', 'center');
  }
  for (const id of [0, 1, 2, 3]) {
    if (id === 3 && !appended) continue;
    const transfer = Math.max(0, Math.min(1, copied * 3 - id));
    if (expanded && id < 3 && transfer === 0) continue;
    const xx = x + (id + shift) * step;
    const yy = expanded && id < 3 ? mix(168, y + 4, transfer) : y + 4;
    token(g, xx + 4, yy, 'M' + id, 116, 47, id === 2 ? C.gold : C.paper);
  }
  if (added) token(g, x + 4, y + 4, 'M4', 116, 47, C.mint);
  const ref = x + (2 + shift) * step + 62;
  const sourceY = expanded ? 430 : 330,
    destY = expanded ? 465 : 413;
  if (!expanded || copied === 1) {
    line(g, ref, sourceY, ref, destY - 20, C.gold, 3);
    line(g, ref, destY - 20, 592, destY - 20, C.gold, 3);
    arrow(g, 592, destY - 20, 592, destY);
  }
  note(g, MESSAGES[2], 261, destY + 3, 699, { active: true });
  foot(
    g,
    n === 1
      ? 'A slot is a position. M2 identifies the note.'
      : n === 2
        ? 'Copy the references before appending the new note.'
        : 'The plan-change note keeps its ID as its slot changes.',
  );
}
export function representation(g, c) {
  const n = beat(c);
  if (n === 1) {
    label(g, 'Contiguous reference slots', 76, 189);
    slots(g, 76, 220, ['M4', 'M0', 'M1', 'M2', 'M3'], {
      w: 130,
      indices: true,
      color: (v) => (v === 'M2' ? C.gold : C.paper),
    });
    const t = cue(c, 1, 'plan-change note');
    line(g, 561, 305, 561, 305 + 73 * t, C.gold, 4);
    if (t > 0.8) note(g, MESSAGES[2], 267, 390, 640, { active: true });
    foot(g, 'Known slot  →  reference  →  note. Searching by ID can visit every slot.');
  } else if (n === 2) {
    label(g, 'Packed numeric values', 76, 185);
    const nums = Array.from({ length: 5 }, (_, i) => i + 0.25);
    plate(g, 72, 214, 1035, 131, true);
    nums.forEach((v, i) => {
      rect(g, 100 + 196 * i, 243, 196, 70, i % 2 ? '#adc2b1' : '#c0d5c0');
      text(g, v.toFixed(2), 198 + 196 * i, 288, 36, C.ink, 'Mono', 'center');
    });
    if (cue(c, 2, 'adds a shape')) {
      label(g, 'Numeric tensor', 100, 412);
      text(g, 'shape (5,)     dtype float32', 100, 465, 33, C.gold, 'Mono');
    }
    foot(g, 'Each numeric cell contains its value directly.');
  } else {
    for (const [i, s] of ['[0, 2]', '(0, 2)'].entries()) {
      const y = 190 + i * 166;
      token(g, 90, y, s, 210, 76);
      arrow(g, 325, y + 38, 506, y + 38, C.rail);
      plate(g, 530, y - 6, 530, 93);
      const v = i ? cue(c, 3, 'can serve as a key') : cue(c, 3, 'Python rejects the list');
      text(
        g,
        v
          ? i
            ? 'Accepted integer tuple'
            : 'TypeError · unhashable list'
          : 'Try dictionary lookup',
        795,
        y + 49,
        29,
        v ? (i ? C.mint : C.coral) : C.pale,
        'Serif',
        'center',
      );
    }
    foot(g, 'The container and the values inside it determine whether a key is hashable.');
  }
}
export function movement(g, c) {
  const n = beat(c);
  if (n <= 3) {
    const count =
      n === 1
        ? Math.min(
            6,
            Math.ceil(3 * cue(c, 1, 'Fill the first three slots', 1.2)) +
              Math.ceil(cue(c, 1, 'fourth arrival', 0.8)) +
              Math.ceil(2 * cue(c, 1, 'next two arrivals', 0.8)),
          )
        : 6 + Number(cue(c, 2, 'seventh arrival') > 0);
    const hist = doublingHistory(count);
    label(g, 'Reference writes per append', 65, 156);
    hist.steps.forEach((step, i) => {
      const x = 90 + i * 105;
      for (let j = 0; j <= step.copy; j++)
        rect(g, x, 469 - j * 35, 80, 29, j === 0 ? C.mint : C.gold, 3);
      text(g, step.size, x + 40, 534, 21, C.pale, 'Mono', 'center');
    });
    line(g, 68, 507, 825, 507, C.rail);
    label(g, 'Arrival', 68, 558);
    rect(g, 863, 210, 24, 24, C.gold);
    text(g, hist.copied + ' copies', 898, 231, 22);
    rect(g, 863, 252, 24, 24, C.mint);
    text(g, hist.writes + ' new stores', 898, 273, 22);
    text(g, hist.total, 955, 405, 67, C.cream, 'Serif', 'center');
    label(g, 'writes so far', 954, 444, 'center');
    foot(
      g,
      n === 3
        ? 'Amortized O(1) append spreads occasional copying across the run.'
        : 'This toy array doubles its capacity when it fills.',
    );
  } else {
    const large = n === 6;
    const removals = [
      'Six references',
      'Five slide',
      'Four shift',
      'then three',
      'then two',
      'then one',
      'comes out alone',
    ].filter((phrase) => cue(c, 4, phrase, 0) === 1).length;
    const steps = Math.min(6, removals);
    label(
      g,
      large ? 'Last six removals that shift references' : 'One mark per surviving reference shifted',
      65,
      161,
    );
    for (let i = 0; i < steps; i++)
      for (let j = 0; j < 6 - i; j++) {
        const x = 81 + j * 65,
          y = 196 + i * 53;
        rect(g, x, y, 52, 36, C.gold, 3);
        arrow(g, x + 37, y + 18, x + 14, y + 18, C.ink, 2.5);
      }
    const total = shifts(7) - shifts(7 - removals);
    const concluded = afterSpeech(c, 4) > 0;
    label(
      g,
      large ? 'Full drain · 50,000 jobs' : concluded ? 'Full drain · 7 jobs' : 'Shifts so far',
      682,
      223,
    );
    if (large ? cue(c, 6, 'more than a billion') : steps < 6 || concluded) {
      text(
        g,
        large ? shifts(50000).toLocaleString('en-US') : total,
        680,
        327,
        62,
        C.gold,
        'Serif',
        'left',
        460,
      );
      label(g, 'reference shifts', 685, 367);
    } else if (!large) {
      text(g, '6 + 5 + 4 + 3 + 2 + 1', 683, 320, 27, C.gold, 'Mono');
    }
    if (n === 4) {
      label(g, 'Jobs left in the list', 685, 448);
      slots(
        g,
        685,
        468,
        Array.from({ length: 7 }, (_, i) => (i < 7 - removals ? String(i + removals + 1) : null)),
        { w: 48, h: 42, gap: 8 },
      );
    }
    if (n >= 5) text(g, 'n(n − 1) / 2', 686, 460, 34, C.pale, 'Mono');
    if (large && cue(c, 6, 'Sum the shrinking rows'))
      label(g, '49,999 shifts on the first removal', 685, 512);
    foot(g, 'Each removal from the front of a list shifts every surviving reference.');
  }
}
export function scan(g, c) {
  const reads = beat(c) === 1 ? Math.floor(4 * cue(c, 1, 'It opens every note', 2.2)) : 4;
  label(g, 'Scan in corpus order', 61, 158);
  label(g, 'Distinct matches', 839, 158);
  MESSAGES.forEach((r, i) => {
    const y = 180 + i * 93,
      open = i < reads;
    note(g, r, 61, y, 710, { active: open, highlight: open, words });
    if (open) {
      arrow(g, 791, y + 39, 832, y + 39, C.rail);
      token(g, 857, y + 11, String(scores[i].score), 83, 53, scores[i].score ? C.mint : C.coral);
    }
    if (beat(c) === 1 && i === reads - 1) rect(g, 44, y, 6, 76, C.gold, 2);
  });
  if (beat(c) === 2 && cue(c, 2, 'Repeated questions repeat')) {
    const replay = cue(c, 2, 'Repeated questions repeat', 1.8);
    const id = Math.min(3, Math.floor(4 * replay));
    rect(g, 43, 180 + id * 93, 7, 76, C.coral, 2);
    text(g, 'Read again', 978, 219 + id * 93, 20, C.coral, 'Mono');
  }
  foot(
    g,
    reads === 4
      ? 'Four notes opened. The sign-in note earned zero.'
      : 'One point for each distinct query word present.',
  );
}
export function invert(g, c) {
  const c0 = cue(c, 1, 'Charged receives'),
    t0 = cue(c, 1, 'then twice');
  const c2 = cue(c, 2, 'so add its ID'),
    c3 = cue(c, 3, 'adds its ID');
  const selected =
    beat(c) === 3 ? 3 : cue(c, 2, 'The plan-change note', 0) ? 2 : beat(c) === 2 ? 1 : 0;
  const prefix = buildIndex(MESSAGES.slice(0, c3 ? 4 : c2 ? 3 : 1));
  const visiblePostings = (word, started) => (started ? [...(prefix.get(word) ?? [])] : []);
  const red = visiblePostings(words[0], c0);
  const blue = visiblePostings(words[1], t0);
  label(g, 'Source note', 72, 171);
  note(g, MESSAGES[selected], 68, 193, 1050, { active: true, words, highlight: true });
  label(g, 'Term', 76, 329);
  label(g, 'Posting set · one position per message', 401, 329);
  strip(g, 65, 350, 'charged', red, { w: 1052, active: red.includes(selected) ? selected : -1 });
  strip(g, 65, 447, 'twice', blue, { w: 1052, active: blue.includes(selected) ? selected : -1 });
  foot(g, 'Look up a word to find the IDs of notes containing it.');
}
export function collision(g, c) {
  const n = beat(c),
    broken = n === 3 && cue(c, 3, 'Then write') > 0;
  const restoring = n === 4 && cue(c, 4, 'Restore the saved postings') > 0;
  const lost = broken || (n === 4 && !restoring);
  const file = collisionWorksheet(lost);
  const lookup = words[1];
  const candidate =
    n !== 2
      ? -1
      : cue(c, 2, 'Now compare', 0)
        ? 1
        : cue(c, 2, 'compare twice with charged', 0)
          ? 0
          : -1;
  const row = file.entries[candidate];
  const matched = row?.[0] === lookup;
  const returned = matched && cue(c, 2, 'Return the IDs', 0);
  if (n === 2) {
    label(g, 'Lookup word', 55, 220);
    token(g, 55, 248, lookup, 170, 55);
    text(g, 'bucket ' + toyBucket(lookup), 57, 353, 23, C.pale, 'Mono');
    arrow(g, 246, 277, 412, 277);
  } else {
    label(g, 'Toy hash · sum of letter codes mod 2', 55, 161);
  }
  for (const [i, word] of (n === 2 ? [] : words).entries()) {
    const y = 220 + 145 * i,
      sum = [...word].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    text(g, word, 60, y, 30, C.cream, 'Serif');
    text(g, sum + ' mod 2', 61, y + 43, 22, C.pale, 'Mono');
    if (cue(c, 1, 'Both are even')) {
      arrow(g, 275, y + 4, 405, y + 4, C.gold);
      text(g, toyBucket(word), 349, y - 11, 20, C.gold, 'Mono');
    }
  }
  plate(g, 448, 180, 684, 258);
  label(g, 'Drawer 0', 475, 222);
  if (cue(c, 1, 'Both are even')) {
    const entries =
      n === 3 || lost ? [[0, lost ? file.twice : collisionWorksheet().charged]] : file.entries;
    entries.forEach(([k, v], i) => {
      const y = 251 + i * 78;
      const active = i === candidate;
      token(g, 475, y, String(k), 169, 55, active ? (returned ? C.mint : C.gold) : C.paper);
      text(g, idText(v), 680, y + 36, 26, active && returned ? C.mint : C.cream, 'Mono');
      if (active) {
        const status = returned
          ? 'Return IDs'
          : matched && cue(c, 2, 'The strings match', 0)
            ? 'Equal'
            : !matched && cue(c, 2, 'The strings differ', 0)
              ? 'Unequal'
              : 'Compare';
        text(g, status, 1088, y + 36, 20, returned ? C.mint : C.gold, 'Mono', 'right');
      }
    });
  }
  rect(g, 448, 456, 684, 71, C.deep, 6, C.rail);
  label(g, 'Drawer 1   ·   empty', 475, 498);
  foot(
    g,
    lost
      ? 'Looking up charged by the number 0 reads the overwritten value.'
      : n === 2
        ? 'Check the original word for equality inside the shared bucket.'
        : 'Equal bucket numbers can route two unequal words to the same drawer.',
  );
}
export function membership(g, c) {
  const one = cue(c, 1, 'Mark the first occurrence'),
    two = cue(c, 2, 'goes through the existing hole');
  const strikes = [...MESSAGES[0].text.toLowerCase().matchAll(/\btwice\b/g)].slice(
    0,
    Number(one > 0.56) + Number(two > 0.56),
  );
  const ids = [...new Set(strikes.map(() => 0))];
  note(g, MESSAGES[0], 60, 153, 1080, { active: true, highlight: true, words: ['twice'] });
  const x = 65,
    y = 375,
    w = 731;
  label(g, 'Word strip · membership', x, 275);
  strip(g, x, y, 'twice', ids, { w, active: ids.length ? 0 : -1 });
  const xx = x + w * 0.43,
    travel = two > 0 ? two : one;
  const dy = 45 * Math.sin(Math.PI * travel);
  rect(g, xx - 20, 288 + dy, 40, 60, '#a69d7d', 8);
  rect(g, xx - 12, 341 + dy, 24, 17, C.paper, 4);
  plate(g, 846, 287, 279, 199);
  label(g, 'Frequency', 984, 327, 'center');
  node(g, 984, 403, String(strikes.length), { r: 54, fill: C.gold });
  foot(
    g,
    ids.length
      ? 'The hole belongs to M0. The dial counts each occurrence in the text.'
      : 'Predict what the second stroke will change.',
  );
}
export function counters(g, c) {
  const visits = postingTrace();
  const count =
    Math.floor(3 * cue(c, 1, 'visit its posting IDs', 1.5)) +
    Math.floor(2 * cue(c, 2, 'A second point lands', 1.15));
  const partial = visits.slice(0, count);
  const last = partial.at(-1);
  words.forEach((w, i) =>
    strip(g, 56, 155 + i * 88, w, [...index.get(w)], {
      w: 1090,
      active: last?.word === w ? last.id : -1,
    }),
  );
  label(g, 'Score dictionary', 60, 383);
  MESSAGES.forEach(({ id }, i) => {
    const x = 56 + 1090 * (0.43 + i * 0.147),
      s = partial.filter((v) => v.id === id).length;
    for (let point = 0; point < s; point++) rect(g, x - 19 + point * 22, 359, 16, 12, C.gold, 2);
    text(g, 'M' + id, x, 425, 20, C.pale, 'Mono', 'center');
    if (s) node(g, x, 486, String(s), { r: 39, fill: C.gold });
    else line(g, x - 25, 486, x + 25, 486, C.rail);
  });
  foot(
    g,
    count === 5
      ? 'Five posting visits reach three distinct IDs. M1 has no counter.'
      : 'Add one point to the visited ID each time a strip contributes a mark.',
  );
}
export function postingTrace() {
  return words.flatMap((word) => [...index.get(word)].map((id) => ({ word, id })));
}
export const animalDocs = ['red bird sings', 'blue whale swims', 'red fox sleeps', 'red fox runs'];
const tokenize = (s) => new Set(s.toLowerCase().trim().split(/\s+/).filter(Boolean));
export function animalSearch(docs, q, k = 2) {
  const terms = tokenize(q),
    postings = new Map();
  docs.forEach((doc, id) => {
    for (const t of tokenize(doc)) {
      if (!postings.has(t)) postings.set(t, new Set());
      postings.get(t).add(id);
    }
  });
  const scan = docs
    .map((doc, id) => [id, [...terms].filter((t) => tokenize(doc).has(t)).length])
    .filter((r) => r[1]);
  const totals = new Map();
  for (const t of terms)
    for (const id of postings.get(t) ?? []) totals.set(id, (totals.get(id) ?? 0) + 1);
  const ranked = [...totals]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, Math.max(0, k))
    .map(([id]) => id);
  return { postings, scan, ranked };
}
export function lab(g, c) {
  const n = beat(c),
    extra = cue(c, 4, 'Add red fox runs') > 0;
  const docs = animalDocs.slice(0, extra ? 4 : 3);
  const lab = animalSearch(docs, n === 3 ? 'otter' : 'red red fox');
  label(g, 'Python lab · document IDs', 60, 158);
  docs.forEach((str, i) => {
    token(g, 62, 189 + i * 82, String(i), 60, 55);
    text(g, str, 148, 224 + i * 82, 27, C.cream, 'Serif');
  });
  if (n === 3) {
    const getSize = lab.postings.size;
    const demo = new Map(lab.postings);
    if (cue(c, 3, 'with brackets') && !demo.has('otter')) demo.set('otter', new Set());
    plate(g, 531, 174, 604, 320);
    label(g, 'Unknown term: otter', 568, 222);
    text(g, 'index.get("otter", set())', 565, 288, 25, C.cream, 'Mono');
    if (cue(c, 3, 'The lookup returns that set', 0)) {
      text(g, '→ empty set', 1098, 288, 23, C.mint, 'Mono', 'right');
      label(g, getSize + ' keys after lookup', 568, 332);
    }
    if (cue(c, 3, 'with brackets')) {
      text(g, 'index["otter"]   →  empty set', 565, 396, 25, C.gold, 'Mono');
      label(g, demo.size + ' keys after defaultdict insertion', 568, 441);
    }
  } else {
    label(g, 'Word → posting IDs', 547, 160);
    wordsForLab(lab).forEach(([word, v], i) => {
      text(g, word, 550, 218 + 55 * i, 27, C.gold, 'Serif');
      text(g, '{ ' + v.join(', ') + ' }', 731, 218 + 55 * i, 26, C.cream, 'Mono');
    });
    if (n === 1) {
      text(g, 'red   red   fox', 550, 408, 33, C.pale, 'Mono');
      if (cue(c, 1, 'Red gets one vote')) text(g, '{ red, fox }', 550, 470, 34, C.mint, 'Mono');
    } else if (!extra || n === 5) {
      label(g, 'Scan · (ID, score)', 550, 364);
      text(
        g,
        lab.scan.map((r) => '(' + r.join(', ') + ')').join('  '),
        550,
        402,
        25,
        C.cream,
        'Mono',
      );
      label(g, 'Ranked IDs', 550, 461);
      if (
        n === 2 ? cue(c, 2, 'with the two-point fox first') : cue(c, 5, 'The dictionary remembers')
      )
        text(g, '[ ' + lab.ranked.join(', ') + ' ]', 550, 508, 34, C.mint, 'Mono');
    } else text(g, 'Which two IDs win?', 550, 434, 34, C.cream, 'Serif');
  }
  foot(
    g,
    n === 3
      ? 'An explicit default supplies the result without changing the index.'
      : n === 4
        ? 'Rebuild the index after adding document 3.'
        : 'The lab lowercases and splits on whitespace. A comma stays attached.',
  );
}
function wordsForLab(lab) {
  return ['red', 'fox', ...(lab.postings.has('runs') ? ['runs'] : [])].map((w) => [
    w,
    [...lab.postings.get(w)],
  ]);
}
export function ledger(g, c) {
  const n = beat(c);
  if (n < 3) {
    label(g, 'One visit per posting ID', 65, 155);
    const count =
      n === 2
        ? 5
        : Math.floor(cue(c, 1, 'Read the three IDs', 0.9) * 3) +
          Math.floor(cue(c, 1, 'Then read the two IDs', 0.75) * 2);
    const trace = postingTrace().slice(0, count),
      ids = [...new Set(trace.map((r) => r.id))];
    for (const [i, word] of words.entries())
      strip(
        g,
        58,
        184 + i * 93,
        word,
        trace.filter((r) => r.word === word).map((r) => r.id),
        { w: 655 },
      );
    label(g, 'Score counters', 790, 161);
    ids.forEach((id, i) => {
      token(g, 800, 183 + 70 * i, 'M' + id, 87, 48);
      text(g, trace.filter((r) => r.id === id).length, 930, 216 + 70 * i, 32, C.gold, 'Mono');
    });
    label(g, 'Posting visits', 68, 444);
    text(g, count, 270, 450, 43, C.gold, 'Serif');
    if (n === 2) {
      label(g, 'Winner heap · root first', 530, 454);
      slots(
        g,
        822,
        417,
        showIds(
          heapTrace()
            .at(-1)
            .after.map((r) => r.id),
        ),
        { w: 95, color: C.mint },
      );
    }
    foot(g, 'Index construction read the corpus. Query work follows the posting lists.');
  } else {
    const rows = ['once', 'charged'];
    label(g, 'One dictionary lookup per word', 61, 176);
    rows.forEach((w, i) => {
      const visible = i === 0 || cue(c, 3, 'Search for charged');
      const ids = visible ? [...index.get(w)] : [];
      strip(g, 65, 215 + i * 139, w, ids, { w: 750 });
      if (visible)
        text(
          g,
          ids.length + ' ' + (ids.length === 1 ? 'visit' : 'visits'),
          860,
          267 + i * 139,
          36,
          C.gold,
          'Serif',
        );
    });
    foot(g, 'A common term can visit nearly every document.');
  }
}
