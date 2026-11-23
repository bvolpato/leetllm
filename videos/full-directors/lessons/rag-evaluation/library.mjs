import {
  C,
  base,
  box,
  round,
  poly,
  line,
  dot,
  word,
  wrap,
  small,
  title,
  pin,
  mark,
  plate,
  leaf,
  cord,
  book,
  envelope,
  openFolio,
  score,
  cue,
  smooth,
} from './atelier.mjs';
import {
  notices,
  receiptDay,
  returnDay,
  dayNames,
  claim,
  libraryScore,
  sourceCount,
  reviewedAnswers,
  average,
} from './specimens.mjs';

function building(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  poly(
    g,
    [
      [-148, -102],
      [0, -178],
      [148, -102],
    ],
    C.teal,
  );
  poly(
    g,
    [
      [-124, -108],
      [0, -163],
      [124, -108],
    ],
    C.paper,
  );
  dot(g, 0, -131, 12, C.brass);
  box(g, -135, -102, 270, 102, '#cf8e69');
  box(g, -139, -103, 278, 12, C.cream);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 7; j++)
      line(
        g,
        -130 + 39 * j + (i % 2) * 12,
        -72 + i * 22,
        -110 + 39 * j + (i % 2) * 12,
        -72 + i * 22,
        '#b47a5e',
        2,
      );
  for (const xx of [-107, 79]) {
    round(g, xx, -74, 30, 47, 2, C.ink, C.cream);
    line(g, xx + 15, -73, xx + 15, -28, C.paper);
    line(g, xx, -51, xx + 30, -51, C.paper);
  }
  for (const xx of [-53, 41]) {
    box(g, xx, -98, 13, 94, C.paper);
    box(g, xx - 3, -97, 19, 6, C.white);
  }
  round(g, -28, -66, 56, 66, [24, 24, 0, 0], C.ink);
  line(g, 0, -65, 0, -1, C.sea);
  for (let j = 0; j < 3; j++)
    box(g, -143 - j * 5, j * 5, 286 + j * 10, 5, j % 2 ? C.edge : C.cream);
  g.restore();
}
function terminal(g, x, y, w, received) {
  const h = w * 0.57;
  round(g, x - 5, y + 6, w + 10, h + 7, 13, '#305955');
  round(g, x, y, w, h, 10, '#8fb3a3', C.ink, 4);
  round(g, x + 13, y + 13, w - 26, h - 30, 7, '#173e41');
  dot(g, x + w - 30, y + h - 9, 3, C.gold);
  const cx = x + w / 2;
  box(g, cx - 17, y + h + 10, 34, 17, C.ink);
  round(g, cx - 59, y + h + 25, 118, 7, 3, C.ink);
  if (received) envelope(g, cx - w * 0.11, y + h * 0.29, w * 0.22);
  else {
    g.strokeStyle = '#82ae9c';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx - 38, y + h * 0.53);
    g.lineTo(cx - 29, y + h * 0.39);
    g.lineTo(cx + 28, y + h * 0.39);
    g.lineTo(cx + 38, y + h * 0.53);
    g.lineTo(cx + 38, y + h * 0.61);
    g.lineTo(cx - 38, y + h * 0.61);
    g.closePath();
    g.stroke();
  }
  word(
    g,
    received ? '1 receipt' : 'Inbox empty',
    cx,
    y + h * 0.78,
    22,
    received ? C.cream : C.sea,
    'Mono',
    400,
    'center',
  );
}
function timingWords(g, x, y, lead, timing, w) {
  word(g, lead, x, y, 25, C.ink, 'Serif', 400, 'left', w);
  word(g, timing, x, y + 43, 39, C.ink, 'Serif', 600, 'left', w);
}
function notice(g, id, x, y, w, compareTiming = false) {
  const n = notices[id];
  leaf(g, x, y, w, 91);
  box(g, x, y, 47, 91, n.color);
  word(g, id, x + 23, y + 58, 32, C.cream, 'Serif', 600, 'center');
  if (compareTiming && id === 'B') {
    timingWords(g, x + 60, y + 31, 'Return-box receipts are emailed', 'the next day.', w - 69);
    return;
  }
  n.lines.forEach((v, i) =>
    word(g, v, x + 60, y + 35 + i * 31, 23, C.ink, 'Serif', 400, 'left', w - 69),
  );
}
export function sunday(g, k) {
  base(g, 'wood');
  // The brass slot occludes the book as it drops through the front panel.
  round(g, 39, 36, 514, 636, 12, '#274e4e', '#78a797', 3);
  round(g, 55, 53, 482, 601, 6, null, '#709b89');
  poly(
    g,
    [
      [73, 191],
      [298, 80],
      [517, 191],
    ],
    C.paper,
  );
  poly(
    g,
    [
      [100, 181],
      [298, 99],
      [488, 181],
    ],
    '#cda578',
  );
  word(g, 'PUBLIC LIBRARY', 296, 164, 25, C.ink, 'Serif', 600, 'center');
  box(g, 79, 194, 432, 348, '#af7255');
  for (let j = 0; j < 10; j++) {
    line(g, 79, 197 + j * 36, 511, 197 + j * 36, '#d69870', 3);
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 96 + (j % 2) * 48;
      if (x < 510) line(g, x, 197 + j * 36, x, 231 + j * 36, '#d69870', 3);
    }
  }
  const drop = smooth(cue(k, 1, 'goes in', 1.3));
  const day = cue(k, 3, 'Monday') ? receiptDay : returnDay;
  g.save();
  g.beginPath();
  g.rect(90, 190, 410, 232);
  g.clip();
  book(g, 300, 266 + drop * 264, 135, 95, -0.23 + drop * 0.17);
  g.restore();
  round(g, 136, 414, 322, 91, 9, '#d1aa66', C.ink, 4);
  round(g, 155, 422, 284, 25, 9, C.dark);
  for (const x of [147, 449]) for (const y of [427, 493]) dot(g, x, y, 3, C.brass);
  word(g, 'BOOK RETURNS', 295, 480, 24, C.ink, 'Sans', 700, 'center');
  round(g, 81, 524, 429, 103, 3, C.paper);
  word(g, dayNames[day], 296, 590, 52, C.ink, 'Serif', 400, 'center');
  leaf(g, 577, 45, 659, 628);
  small(g, 'LIBRARY ASSISTANT', 611, 88);
  const fixed = !!cue(k, 4, 'the next day');
  word(g, '“Use the box.”', 611, 145, 45, C.ink, 'Serif');
  if (cue(k, 1, 'A receipt arrives immediately')) {
    word(
      g,
      fixed ? '“A receipt arrives the next day.”' : '“A receipt arrives immediately.”',
      611,
      200,
      36,
      fixed ? C.teal : day === receiptDay ? C.rust : C.ink,
      'Serif',
      400,
      'left',
      593,
    );
  }
  terminal(g, 767, 240, 302, day === receiptDay);
  if (cue(k, 2, 'A says')) notice(g, 'A', 609, 493, 286);
  if (cue(k, 2, 'B says')) notice(g, 'B', 914, 493, 291);
  if (cue(k, 2, 'Which day'))
    word(
      g,
      day === receiptDay ? 'Sunday + one day = Monday' : 'Which day should you check?',
      904,
      637,
      32,
      C.ink,
      'Serif',
      400,
      'center',
    );
}

const pocketLeft = (i) => 53 + i * 403;
const noticeTop = (i) => 238 + i * 79;

function afterPhrase(k, beat, phrase) {
  return !!cue(k, beat, phrase) && (k.beat.beatIndex + 1 > beat || k.elapsed >= k.wordCue(phrase).end);
}

function receiptReplay(g, k, delivery) {
  const trace = cue(k, 1, 'Follow B across the row', 1.25);
  const selectionLocated = afterPhrase(k, 2, 'Between search and the prompt');
  const answerLocated = afterPhrase(k, 4, 'At the answer');
  const [collectionX, searchX, promptX] = [0, 1, 2].map((i) => pocketLeft(i) + 186);
  const noticeBottom = noticeTop(1) + 64;
  const trackY = 446;
  const delivered = delivery === 1;
  const routeColor = notices.B.color;

  if (trace) {
    const trackEnd = delivery
      ? searchX + (promptX - searchX) * smooth(delivery)
      : collectionX + (searchX - collectionX) * smooth(trace);
    line(g, collectionX, noticeBottom, collectionX, trackY, routeColor, 4);
    if (selectionLocated && !delivered) {
      g.setLineDash([8, 8]);
      line(g, searchX, trackY, promptX, trackY, C.slate, 3);
      g.setLineDash([]);
    }
    line(g, collectionX, trackY, trackEnd, trackY, routeColor, 5);
    if (trace === 1) line(g, searchX, noticeBottom, searchX, trackY, routeColor, 4);
    if (delivered) line(g, promptX, noticeBottom, promptX, trackY, routeColor, 4);

    if (selectionLocated && !delivery)
      mark(g, (searchX + promptX) / 2, trackY, false, 15);
    if (answerLocated) {
      line(g, promptX, trackY, promptX, 529, routeColor, 4);
      poly(g, [[promptX - 9, 527], [promptX + 9, 527], [promptX, 539]], routeColor);
    }
    round(g, trackEnd - 20, trackY - 18, 40, 36, 5, routeColor, C.cream, 2);
    word(g, 'B', trackEnd, trackY + 8, 25, C.cream, 'Serif', 600, 'center');
  }

  leaf(g, 55, 539, 1170, 114);
  small(g, 'ASSISTANT', 80, 575);
  word(g, '“I can’t tell from these instructions.”', 80, 622, 34, C.ink, 'Serif');
  const diagnosis = delivery
    ? answerLocated
      ? 'Replay generation'
      : cue(k, 3, 'Where would you look first now')
        ? 'Where would you look?'
        : 'Same reply'
    : selectionLocated
      ? 'Inspect selection'
      : 'Where did B go?';
  plate(g, diagnosis, 809, 578, 366, delivered ? C.navy : C.teal);
}

function pockets(g, k, transfer) {
  base(g, 'wood');
  const throughSearch = !transfer && !!cue(k, 2, 'Bring B through search');
  const delivery = transfer ? cue(k, 3, 'Keep B in the prompt', 1.25) : 0;
  const fixed = transfer ? delivery === 1 : !!cue(k, 2, 'into the prompt');
  const first = transfer ? ['A', 'B'] : ['A', 'B', 'C'];
  const candidates = transfer ? first : throughSearch ? first : ['A', 'C'];
  const selected = fixed ? first : transfer ? ['A'] : ['A', 'C'];
  const heading = transfer ? 'When will my receipt arrive?' : 'Which notices reached the model?';
  title(g, 'LIBRARY  /  SEARCH REPLAY', heading, 64, 76, true);
  const stacks = [first, candidates, selected];
  for (let i = 0; i < 3; i++) {
    const x = pocketLeft(i);
    const ids = stacks[i];
    round(g, x + 4, 178, 373, 323, 8, '#224647');
    round(g, x, 171, 373, 325, 8, '#d4bd91', C.ink, 3);
    word(
      g,
      ['Permitted collection', 'Search returned', 'In the prompt'][i],
      x + 20,
      213,
      27,
      C.ink,
      'Serif',
    );
    first.forEach((id, j) => {
      const y = noticeTop(j);
      g.setLineDash([6, 6]);
      round(g, x + 16, y, 340, 64, 3, null, '#a18e6a', 2);
      g.setLineDash([]);
      if (ids.includes(id)) {
        round(g, x + 16, y, 340, 64, 3, C.cream);
        box(g, x + 16, y, 58, 64, notices[id].color);
        word(g, id, x + 45, y + 43, 34, C.cream, 'Serif', 600, 'center');
        if (transfer && id === 'B') {
          word(g, notices.B.name, x + 89, y + 27, 24, C.ink, 'Serif');
          word(g, notices.B.lines[1], x + 89, y + 52, 23, C.ink, 'Serif');
        } else word(g, notices[id].name, x + 89, y + 40, 26, C.ink, 'Serif');
      } else word(g, 'Empty', x + 37, y + 40, 21, '#706854', 'Mono');
    });
    if (!transfer && i > 0 && cue(k, 2, 'one half')) {
      const v = sourceCount(ids, ['A', 'B']);
      word(g, 'Recall   ' + v.hits + ' / ' + v.needed, x + 12, 549, 29, C.cream, 'Sans', 600);
      if (i === 2 && cue(k, 3, 'two of the three'))
        word(g, 'Precision   ' + v.hits + ' / ' + v.selected, x + 12, 590, 29, C.gold, 'Sans', 600);
    }
  }
  if (transfer) {
    receiptReplay(g, k, delivery);
  } else {
    word(
      g,
      cue(k, 4, 'private notice')
        ? 'Check access and revision before scoring usefulness.'
        : 'Required for this question: A and B',
      62,
      658,
      26,
      C.cream,
      'Sans',
    );
  }
}
export function evidence(g, k) {
  pockets(g, k, false);
}
export function transfer(g, k) {
  pockets(g, k, true);
}

export function atomic(g, k) {
  const b = k.beat.beatIndex;
  base(g, 'wood');
  title(
    g,
    'LIBRARY  /  CLAIM EXTRACTION',
    b === 0
      ? 'One reply, three checkable claims'
      : b === 1
        ? 'What did the extractor drop?'
        : 'Who reviewed these words?',
    65,
    76,
    true,
  );
  if (b === 0) {
    const ids = ['closed', 'box', 'next'];
    const split = smooth(cue(k, 1, 'Separate those three', 0.9));
    ids.forEach((id, i) => {
      const x = 100 + (1 - split) * i * 5,
        y = 183 + i * (96 + 25 * split);
      leaf(g, x, y, 1080, 96);
      word(g, claim(id).text, x + 53, y + 62, 37, C.ink, 'Serif');
      if (split === 1)
        plate(g, claim(id).source, x + 968, y + 25, 63, notices[claim(id).source].color);
    });
    return;
  }
  const dropped = cue(k, 2, 'drops immediately', 0.8);
  leaf(g, 76, 173, 1127, 145);
  small(g, b === 1 ? 'ORIGINAL WORDING' : 'REVIEWED CLAIM', 103, 211);
  word(g, b === 1 ? claim('instant').text : claim('next').text, 103, 278, 45, C.ink, 'Serif');
  if (b === 1) {
    leaf(g, 76, 376, 1127, 145);
    small(g, 'EXTRACTED WORDING', 103, 414);
    word(g, 'A receipt arrives' + (dropped === 1 ? '.' : ''), 103, 475, 43, C.ink, 'Serif');
    const tailX = 103 + g.measureText('A receipt arrives ').width;
    g.save();
    g.translate(tailX + 280 * smooth(dropped), 475 + 98 * smooth(dropped));
    g.rotate(0.07 * dropped);
    round(g, -7, -41, 264, 57, 3, dropped ? C.rose : '#fff8e2');
    word(g, 'immediately.', 0, 0, 42, C.rust, 'Serif');
    g.restore();
    if (cue(k, 2, 'B supports those words'))
      word(g, 'B establishes that a receipt arrives the next day.', 84, 654, 29, C.cream, 'Serif');
  } else {
    leaf(g, 76, 376, 1127, 145);
    small(g, 'UNREVIEWED PARAPHRASE', 103, 414);
    word(g, 'An email comes a day after the return.', 103, 475, 36, C.ink, 'Serif');
    if (cue(k, 3, 'keep it in the report')) plate(g, 'Send for review', 835, 430, 296, C.navy);
    word(g, 'Keep timing, quantities, conditions and exceptions.', 84, 643, 29, C.cream, 'Serif');
  }
}
export function support(g, k) {
  base(g);
  title(g, 'PROMPT  /  ANSWER', 'What do these passages establish?');
  const third = !!cue(k, 3, 'Delivery service is available');
  const ids = third ? ['box', 'instant', 'delivery'] : ['box', 'instant'];
  const s = libraryScore(ids);
  const graded = [
    cue(k, 1, 'establishes the full claim'),
    cue(k, 2, 'contradicted'),
    cue(k, 4, 'unestablished'),
  ];
  const compareTiming = cue(k, 1, 'Now read') && !graded[1];
  notice(g, 'A', 65, 169, 440);
  notice(g, 'B', 65, 288, 440, compareTiming);
  ids.forEach((id, i) => {
    const y = 166 + i * 126;
    leaf(g, 572, y, 637, 109);
    if (id === 'instant' && compareTiming) {
      timingWords(g, 596, y + 27, 'A receipt arrives', 'immediately.', 589);
    } else {
      word(g, claim(id).text, 596, y + 43, 30, C.ink, 'Serif');
    }
    if (graded[i])
      word(
        g,
        ['A entails the claim', 'B contradicts “immediately”', 'Neither notice settles delivery'][
          i
        ],
        597,
        y + 83,
        23,
        i === 0 ? C.teal : i === 1 ? C.rust : C.slate,
        'Sans',
        600,
      );
  });
  const gradedCount = third
    ? cue(k, 4, 'one supported claim out of three')
    : cue(k, 2, 'Here it is one half');
  if (gradedCount) {
    score(g, 69, 509, 'FAITHFULNESS', s.supported + ' / ' + s.emitted);
    word(g, 'supported claims / claims made', 70, 607, 23, C.slate, 'Sans');
  }
}
export function footnote(g, k) {
  openFolio(g);
  const beat = k.beat.beatIndex + 1;
  const trace = smooth(cue(k, 1, 'Follow the B', 0.65));
  const movePhrase = 'Move the footnote to A';
  const move = beat === 3
    ? smooth(k.reveal(movePhrase, k.wordCue(movePhrase).end - k.wordCue(movePhrase).start, {
        captionStart: movePhrase,
      }))
    : 0;
  const cited = move === 1 ? 'A' : 'B';
  const s = libraryScore(['closed'], [cited]);
  const wrongNotice = afterPhrase(k, 2, 'B cannot establish the closure') && move === 0;
  const rightNotice = afterPhrase(k, 3, 'lands on the Sunday closure notice');
  const moving = move > 0 && move < 1;
  small(g, 'ASSISTANT’S ANSWER', 91, 91);
  word(g, claim('closed').text, 89, 151, 48, C.ink, 'Serif');
  word(g, '[' + (moving ? '·' : cited) + ']', 819, 151, 48, C.rust, 'Serif', 600);
  for (const [i, id] of ['A', 'B'].entries()) {
    const x = i ? 948 : 326;
    const checked = i ? wrongNotice : rightNotice;
    if (checked)
      round(g, x - 222, 304, 444, 210, 10, i ? C.rose : C.mist, i ? C.rust : C.teal);
    small(g, 'NOTICE ' + id, x - 68, 289);
    if (i === 0) building(g, x, 435, 0.64);
    else terminal(g, x - 89, 307, 178, true);
    word(
      g,
      i ? 'Receipts are emailed' : 'The library is closed',
      x,
      471,
      31,
      C.ink,
      'Serif',
      400,
      'center',
    );
    word(g, i ? 'the next day.' : 'on Sunday.', x, 505, 31, C.ink, 'Serif', 400, 'center');
  }
  if (trace) {
    const tip = 947 + (325 - 947) * move;
    const route = Array.from({ length: 26 }, (_, i) => {
      const t = (trace * i) / 25;
      const remaining = 1 - t;
      const a = remaining ** 3;
      const b = 3 * remaining ** 2 * t;
      const c = 3 * remaining * t ** 2;
      const d = t ** 3;
      return [a * 858 + b * 855 + (c + d) * tip, a * 167 + b * 221 + c * 186 + d * 260];
    });
    const color = wrongNotice ? C.rust : rightNotice ? C.teal : C.brass;
    g.beginPath();
    g.moveTo(...route[0]);
    for (const point of route.slice(1)) g.lineTo(...point);
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.stroke();
    pin(g, ...route.at(-1));
  }

  const faithful = afterPhrase(k, 2, 'the claim is faithful');
  const attached = afterPhrase(k, 2, 'There is a citation on the page');
  const citedBefore = afterPhrase(k, 2, 'support from the cited passage') && move === 0;
  const metrics = [
    ['Faithfulness', faithful ? s.supported : null, C.teal],
    ['Citation present', attached ? s.present : null, C.teal],
    ['Cited support', citedBefore || rightNotice ? s.cited : null, rightNotice ? C.teal : C.rust],
  ];
  if (faithful)
    metrics.forEach(([label, value, color], i) => {
      const x = 86 + 378 * i;
      const fill = value === null ? C.paper : color === C.teal ? C.mist : C.rose;
      round(g, x, 535, 350, 52, 8, fill, C.edge);
      word(g, label, x + 17, 568, 23, C.ink, 'Sans', 600);
      word(g, value === null ? '—' : value + '/' + s.emitted, x + 330, 568, 29,
        value === null ? C.slate : color, 'Mono', 600, 'right');
    });
}

export function omission(g, k) {
  const lone = !!cue(k, 3, 'only when the receipt arrives');
  const s = libraryScore(lone ? ['next'] : ['closed', 'box']);
  openFolio(g);
  small(g, 'REPLY', 90, 109);
  word(g, 'The assistant wrote', 91, 175, 42, C.ink, 'Serif');
  small(g, 'RETURN INSTRUCTIONS', 701, 109);
  word(g, 'The reader needs', 701, 175, 42, C.ink, 'Serif');
  const ids = ['closed', 'box', 'next'];
  ids.forEach((id, i) => {
    const y = 251 + i * 84;
    const linked = s.points.has(claim(id).point);
    dot(g, 707, y, 9, linked ? C.teal : null, linked ? C.teal : C.brass);
    word(
      g,
      ['Sunday closure', 'Where to return the book', 'When the receipt arrives'][i],
      735,
      y + 10,
      28,
      linked ? C.ink : C.rust,
      'Serif',
    );
    const idx = s.rows.findIndex((row) => row.id === id);
    if (idx < 0) return;
    const leftY = 251 + idx * 84;
    word(g, claim(id).text, 91, leftY + 10, 26, C.ink, 'Serif', 400, 'left', 460);
    cord(g, 557, leftY, 696, y, C.teal, 4);
  });
  if (cue(k, 2, 'two of three required points')) {
    score(g, 702, 510, 'COMPLETENESS', s.points.size + ' / ' + ids.length);
    if (cue(k, 2, 'Both are supported'))
      score(g, 91, 510, 'FAITHFULNESS', s.supported + ' / ' + s.emitted);
  }
}
export function aggregation(g, k) {
  base(g, 'wood');
  const group = cue(k, 2, 'Draw a boundary', 0.9),
    votes = average(reviewedAnswers);
  title(g, 'REVIEWED CLAIMS', group ? 'One vote per answer' : 'One vote per claim', 68, 80, true);
  const xs = [...Array.from({ length: 9 }, (_, i) => 106 + i * 95), 1108],
    marks = reviewedAnswers.flat();
  const visible = cue(k, 1, 'one unsupported claim')
    ? 10
    : cue(k, 1, 'nine supported claims')
      ? 9
      : 0;
  // Each token keeps the source answer printed on it throughout regrouping.
  xs.forEach((x, i) => {
    leaf(g, x - 36, 237, 73, 124);
    small(g, i < 9 ? 'A' + (i + 1) : 'B1', x - 17, 274);
    if (i < visible) mark(g, x, 322, marks[i], 20);
  });
  if (group > 0) {
    g.save();
    g.globalAlpha = group;
    round(g, 50, 185, 911, 204, 13, null, C.gold, 5);
    round(g, 1020, 185, 181, 204, 13, null, C.gold, 5);
    word(g, 'Answer A', 65, 220, 25, C.cream, 'Serif');
    word(g, 'Answer B', 1035, 220, 25, C.cream, 'Serif');
    g.restore();
  }
  if (cue(k, 1, 'nine of ten')) {
    if (group === 0) {
      word(
        g,
        votes.count + ' / ' + votes.n + '  =  ' + Math.round(votes.pooled * 100) + '%',
        640,
        508,
        70,
        C.cream,
        'Serif',
        600,
        'center',
      );
      word(g, 'supported claims / all claims', 640, 562, 28, C.gold, 'Sans', 400, 'center');
    } else {
      if (cue(k, 2, 'nine out of nine'))
        word(g, '9 / 9 = ' + votes.rates[0], 504, 444, 39, C.cream, 'Serif', 600, 'center');
      if (cue(k, 2, 'zero out of one'))
        word(g, '0 / 1 = ' + votes.rates[1], 1108, 444, 39, C.cream, 'Serif', 600, 'center');
      if (cue(k, 2, 'fifty percent')) {
        word(
          g,
          '(1 + 0) / 2  =  ' + Math.round(votes.mean * 100) + '%',
          640,
          542,
          60,
          C.gold,
          'Serif',
          600,
          'center',
        );
        word(
          g,
          'Same ten claims  ·  pooled score ' + Math.round(votes.pooled * 100) + '%',
          640,
          590,
          24,
          C.cream,
          'Sans',
          400,
          'center',
        );
      }
    }
  }
  if (cue(k, 3, 'no denominator'))
    word(
      g,
      'Empty reply: 0 / 0 is undefined. Record the abstention separately.',
      640,
      659,
      24,
      C.cream,
      'Sans',
      400,
      'center',
    );
}
