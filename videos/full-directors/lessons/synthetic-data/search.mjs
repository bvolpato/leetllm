import {
  ink,
  muted,
  paper,
  teal,
  rust,
  orange,
  ruled,
  dark,
  white,
  serif,
  mono,
  sans,
  ease,
  cue,
  rect,
  round,
  line,
  disc,
  type,
  lab,
  headline,
  backing,
  stock,
  pill,
  ruleText,
  arrow,
  ribbon,
} from './press.mjs';
import { short, full, large, seed, tasks } from './specimens.mjs';

function roller(g, x, y, w) {
  round(g, x - 27, y - 4, w + 54, 46, 22, '#132c28');
  round(g, x, y, w, 33, 14, '#657c71');
  for (let i = 0; i < 10; i++) line(g, x + 8 + i * 4, y + 4, x + 8 + i * 4, y + 29, dark, 2);
}
function printStrip(g, x, y, w, h) {
  rect(g, x + 8, y + 12, w, h, '#112f29');
  rect(g, x, y, w, h, paper);
  for (let i = 24; i < h - 8; i += 33) {
    disc(g, x + 19, y + i, 5, dark);
    disc(g, x + w - 19, y + i, 5, dark);
  }
  line(g, x + 40, y, x + 40, y + h, '#d7ccb1', 2);
  line(g, x + w - 40, y, x + w - 40, y + h, '#d7ccb1', 2);
}
export function opening(g, k) {
  const b = k.beat.beatIndex + 1;
  backing(g, dark);
  const names = short.result.items;
  const first = cue(k, 1, 'print Ada', 0.45),
    second = cue(k, 1, 'and Grace', 0.45);
  const stop = cue(k, 1, 'It stops'),
    tag = cue(k, 1, 'returned a cursor');
  const follow = ease(cue(k, 2, 'Follow that cursor', 0.95)),
    linus = cue(k, 2, 'contains Linus'),
    withheld = cue(k, 2, 'Withhold this answer');
  type(g, 'Fetch every name', 107, 135, 88, white, serif);
  const h = 282 + 70 * first + 75 * second;
  round(g, 88, 205, 854, 615, 38, '#759e8b');
  round(g, 99, 212, 831, 586, 32, '#4c7767');
  roller(g, 168, 239, 706);
  printStrip(g, 191, 254, 660, h);
  lab(g, 'GENERATED CLIENT   /   OUTPUT', 250, 325);
  line(g, 249, 353, 790, 353, ruled);
  for (const [i, q] of [first, second].entries())
    if (q)
      type(g, names[i].slice(0, Math.ceil(names[i].length * q)), 253, 456 + i * 113, 91, ink, mono);
  if (stop) lab(g, 'end of output', 256, 642);
  stock(g, 1042, 215, 758, 320, '#e7e4ca');
  lab(g, 'SEARCH SERVICE   /   FIRST PAGE', 1097, 275);
  type(g, full.trace[1].response.items.join('   ·   '), 1097, 390, 75, ink, serif);
  if (tag) {
    lab(g, 'next cursor', 1100, 487);
    ribbon(g, full.trace[1].response.nextCursor, 1350, 471);
    if (b === 1) {
      g.save();
      g.globalAlpha = 0.6 + 0.4 * Math.cos(k.seconds * 4);
      disc(g, 1612, 471, 11, orange);
      g.restore();
    }
  }
  if (cue(k, 1, 'would pass'))
    type(g, 'Any names?   ' + (names.length ? 'Yes' : 'No'), 191, 764, 41, white, serif);
  if (follow) {
    const y = 535 + follow * 58;
    line(g, 1464, 508, 1464, 508 + (y - 508) * follow, orange, 5);
    round(g, 1058, y, 725, 227 * follow, 2, '#bfd7ba');
    if (follow > 0.9) {
      lab(g, 'REQUEST   /   page-2', 1102, y + 55);
      if (linus) type(g, full.trace[2].response.items[0], 1100, y + 161, 85, ink, serif);
      if (cue(k, 2, 'empty cursor')) lab(g, 'next: null', 1460, y + 155);
    }
  }
  if (withheld) pill(g, 'WITHHOLD', 564, 720, 260, '#783d2b', white);
  if (b >= 3) {
    const proposed = b === 4 && cue(k, 4, 'another page');
    type(
      g,
      proposed
        ? 'Generate a retry followed by another page.'
        : 'Start from a human-reviewed search task.',
      120,
      945,
      52,
      white,
      serif,
    );
  }
}

export function lineage(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  headline(g, 'Where did this search task come from?');
  stock(g, 116, 230, 800, 624);
  lab(g, 'REVIEWED SEED', 165, 296);
  type(g, seed.id, 157, 483, 165, teal, serif);
  ruleText(g, seed.source, 165, 587, 690);
  ruleText(g, 'Family   /   ' + seed.family, 165, 683, 690);
  type(g, 'Retry, then fetch the next page', 166, 789, 42, ink, serif);
  if (b < 4) {
    lab(g, 'CLIENT CONTRACT', 1034, 294);
    if (cue(k, 1, 'Follow each returned cursor'))
      ruleText(g, 'Follow next until it is empty.', 1034, 442, 734);
    if (cue(k, 2, 'hundred names'))
      ruleText(g, 'Page size ≤ ' + seed.contract.pageLimit, 1034, 568, 734);
    if (cue(k, 2, 'two retries'))
      ruleText(g, 'Retries per cursor ≤ ' + seed.contract.retryLimit, 1034, 694, 734);
    if (b === 3) type(g, 'Review before generating copies.', 1034, 837, 44, rust, serif);
  } else {
    lab(g, 'FAMILY SPLIT', 1034, 294);
    type(g, 'Training', 1034, 390, 67, teal, serif);
    for (let i = 0; i < 3; i++) {
      const x = 1040 + i * 235;
      stock(g, x, 448, 211, 146);
      type(g, 'S12', x + 24, 513, 40, teal, mono);
      type(g, ['seed', 'retry', 'cursor'][i], x + 24, 558, 30, ink, sans);
    }
    line(g, 1010, 649, 1790, 649, ink, 4);
    type(g, 'Held out', 1034, 733, 61, rust, serif);
    type(g, 'Independent seed families', 1034, 807, 42, ink, sans);
  }
}
export function coverage(g, k) {
  backing(g);
  headline(g, 'Which behavior did the batch add?');
  const count =
    Number(cue(k, 1, 'empty-cursor termination')) +
    Number(cue(k, 1, 'bounded retries')) +
    Number(cue(k, 1, 'oversized page')) +
    Number(cue(k, 2, 'A new sentence')) +
    Number(cue(k, 3, 'one more paraphrase'));
  const current = tasks.slice(0, count),
    families = new Set(current.map((r) => r.family));
  const titles = ['End of pages', 'Rate limit', 'Page cap'],
    actions = ['Stop on null', 'Retry this cursor', 'Reject oversize'];
  titles.forEach((title, i) => {
    const x = 111 + i * 591;
    round(g, x, 248, 526, 536, 17, '#d8d7ba');
    rect(g, x + 16, 268, 494, 69, dark);
    type(g, title, x + 40, 319, 40, white, serif);
    const group = current.filter((r) => r.family === i);
    group.forEach((row, j) => {
      stock(g, x + 28, 380 + j * 106, 470, 101, paper);
      lab(g, row.id, x + 51, 443 + j * 106, teal);
      type(g, row.task, x + 141, 444 + j * 106, 34, ink, sans, 'left', 344);
    });
    if (group.length && cue(k, 1, 'expected behavior'))
      type(g, actions[i], x + 22, 853, 41, teal, serif);
  });
  type(g, count + (count === 1 ? ' task row' : ' task rows'), 116, 960, 51, ink, mono);
  if (k.beat.beatIndex !== 2 || cue(k, 3, 'Still three'))
    type(
      g,
      families.size + (families.size === 1 ? ' behavior' : ' behaviors'),
      1292,
      960,
      51,
      teal,
      mono,
    );
}
export function growth(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    headline(g, 'Inside a Self-Instruct prompt');
    const hasN = cue(k, 1, 'six human-written');
    stock(g, 111, 238, 1100, 612);
    lab(g, 'DEMONSTRATIONS FROM THE TASK POOL', 158, 306);
    for (let i = 0; i < 8; i++) {
      const x = 164 + (i % 4) * 243,
        y = 386 + Math.floor(i / 4) * 188;
      round(g, x, y, 219, 145, 10, hasN ? (i < 6 ? teal : '#76563d') : '#d9d6c0');
      type(
        g,
        hasN ? (i < 6 ? 'Human' : 'Model') : String(i + 1),
        x + 110,
        y + 93,
        43,
        hasN ? white : ink,
        serif,
        'center',
      );
    }
    lab(g, 'HUMAN SEEDS', 1301, 311);
    type(g, '175', 1292, 463, 137, teal, serif);
    if (cue(k, 1, 'filtered instructions')) {
      arrow(g, 1374, 505, 1374, 590);
      type(g, '52,445', 1290, 731, 106, ink, serif);
      lab(g, 'FILTERED INSTRUCTIONS', 1297, 798);
    }
    return;
  }
  if (b <= 3) {
    headline(g, 'Start with the label');
    const labels = cue(k, 2, 'generate the class labels'),
      inputs = cue(k, 2, 'ask for an input');
    for (const [i, title] of ['Rate limited', 'Successful page'].entries()) {
      const x = 121 + i * 860;
      stock(g, x, 294, 806, 486);
      lab(g, 'CLASSIFICATION INSTANCE', x + 46, 362);
      if (labels) type(g, title, x + 44, 496, 70, i ? teal : rust, serif);
      if (inputs) {
        arrow(g, x + 52, 545, x + 52, 614);
        type(
          g,
          i ? 'HTTP 200   ·   next = page-2' : 'HTTP 429   ·   retry same cursor',
          x + 45,
          708,
          42,
          ink,
          mono,
          'left',
          715,
        );
      }
    }
    type(g, 'For other tasks, generate the input first.', 132, 918, 43, muted, serif);
  } else {
    headline(g, 'Does the instruction enter the pool?');
    lab(g, 'HISTORICAL WORDING FILTER', 120, 304);
    type(g, 'Highest ROUGE-L against existing instructions', 118, 405, 59, ink, serif);
    line(g, 180, 631, 1690, 631, ruled, 13);
    const pivot = 180 + 0.7 * 1510;
    line(g, 180, 631, pivot, 631, teal, 13);
    line(g, pivot, 560, pivot, 690, ink, 6);
    type(g, '0', 180, 734, 41, ink, mono, 'center');
    type(g, '0.70', pivot, 748, 58, rust, mono, 'center');
    type(g, '1', 1690, 734, 41, ink, mono, 'center');
    type(g, 'Eligible below 0.70', 190, 535, 49, teal, serif);
    type(g, 'Screen out', 1433, 535, 48, rust, serif);
    type(g, 'Instance checks still apply.', 122, 907, 48, muted, serif);
  }
}
export function evolution(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    headline(g, 'What new work does the rewrite require?');
    const kinds = [
      ['Limit the retries', 'add constraints'],
      ['Explain the stop', 'deepen the question'],
      ['Name the cursor', 'make it concrete'],
      ['Justify the delay', 'add reasoning'],
      ['Mix two failures', 'complicate the input'],
    ];
    for (let i = 0; i < 5; i++) {
      const x = 111 + i * 340,
        y = 370 + (4 - i) * 48;
      stock(g, x, y, 325, 201, i % 2 ? '#e1dfc5' : paper);
      lab(g, String(i + 1).padStart(2, '0'), x + 23, y + 53, teal);
      type(g, kinds[i][0], x + 20, y + 118, 38, ink, serif, 'left', 284);
      type(g, kinds[i][1], x + 20, y + 166, 29, muted, sans, 'left', 284);
    }
    if (cue(k, 1, 'In-breadth evolution'))
      type(g, 'A different task expands breadth.', 114, 907, 52, teal, serif);
  } else if (b < 4) {
    headline(g, 'Retry without losing your place');
    stock(g, 125, 279, 1639, 539);
    lab(g, 'ADDED REQUIREMENT   /   SEARCH CLIENT', 173, 357);
    type(g, 'GET page-2', 170, 502, 64, teal, mono);
    arrow(g, 615, 482, 766, 482);
    pill(g, '429', 808, 452, 160, '#78452e');
    arrow(g, 997, 482, 1120, 482);
    if (cue(k, 2, 'preserve the returned cursor')) type(g, 'GET page-2', 1162, 502, 64, teal, mono);
    line(g, 173, 582, 1702, 582);
    type(g, 'Deterministic clock', 172, 663, 48, ink, serif);
    type(g, 'Bounded retry schedule', 922, 663, 48, ink, serif);
    if (b === 3)
      type(g, 'Article fixture   /   three authored rewrites', 176, 755, 34, muted, mono);
  } else {
    headline(g, 'Read the refusal in context');
    stock(g, 125, 257, 1560, 545);
    lab(g, 'GENERATED RESPONSE', 184, 330);
    type(g, '“Sorry, I can log the request ID.”', 182, 471, 84, ink, serif, 'left', 1430);
    line(g, 185, 501, 407, 501, rust, 7);
    type(g, 'Phrase filter', 184, 610, 46, rust, serif);
    if (cue(k, 4, 'correct safety refusal')) {
      arrow(g, 524, 598, 706, 598);
      type(g, 'Policy requires keeping email private.', 748, 616, 53, teal, serif);
      type(g, 'Keep the policy-compliant response.', 182, 738, 49, teal, sans);
    }
  }
}
function requestTrack(g, run, count, pending = false) {
  const y0 = 310;
  ['Request', 'Cursor sent', 'Limit', 'Reply', 'Names collected'].forEach((s, i) =>
    lab(g, s, [120, 392, 752, 1001, 1247][i], 245),
  );
  if (count === 0) {
    stock(g, 98, y0, 1717, 146);
    type(g, 'Ready to send the first request', 135, y0 + 93, 54, muted, serif);
  }
  let names = [];
  for (let i = 0; i < count; i++) {
    const event = run.trace[i],
      y = y0 + i * 169;
    const inFlight = pending && i === count - 1;
    if (!inFlight) names = names.concat(event.response.items);
    stock(g, 98, y, 1717, 146);
    type(g, String(i + 1).padStart(2, '0'), 134, y + 92, 68, muted, serif);
    type(g, event.request.cursor ?? 'start', 392, y + 88, 47, teal, mono);
    type(g, event.request.limit, 752, y + 88, 45, ink, mono);
    type(
      g,
      inFlight ? '…' : event.response.status,
      1001,
      y + 88,
      46,
      event.response.status === 200 ? teal : rust,
      mono,
    );
    type(
      g,
      names.join(', ') || (inFlight ? '…' : '0 names'),
      1247,
      y + 88,
      45,
      ink,
      serif,
      'left',
      490,
    );
    if (!inFlight && event.response.status === 200)
      type(g, 'next: ' + (event.response.nextCursor ?? 'null'), 1002, y + 125, 26, muted, mono);
  }
}
export function execute(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  const oversized = cue(k, 4, 'other proposal');
  headline(g, oversized ? 'Fresh run  /  oversized client' : 'Trace the retry client');
  if (oversized) {
    const sent = cue(k, 4, 'ten thousand'),
      returned = cue(k, 4, 'service rejects');
    requestTrack(g, large, Number(sent), !returned);
    if (returned) type(g, 'Page limit: 100', 139, 596, 67, rust, serif);
    if (b === 5)
      type(g, 'Isolated test   /   add timeouts and malformed replies', 140, 815, 45, muted, sans);
  } else {
    const one = cue(k, 1, 'first request'),
      two = cue(k, 2, 'same page again'),
      three = cue(k, 3, 'sends page two');
    const count = one + two + three;
    requestTrack(
      g,
      full,
      count,
      count === 1
        ? !cue(k, 1, 'four twenty-nine')
        : count === 2
          ? !cue(k, 2, 'Ada and Grace')
          : !cue(k, 3, 'Linus comes back'),
    );
    type(g, '≤ 100 names per request     ·     ≤ 2 retries per cursor', 125, 947, 40, muted, mono);
  }
}
export function verifier(g, k) {
  backing(g);
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    headline(g, 'What did the check establish?');
    const entries = [
      ['Schema', 'Does the response have the required fields?'],
      ['Static', 'What does the program contain?'],
      ['Runtime', 'What did this client do on this fixture?'],
      ['Symbolic', 'Does the property hold in the formal model?'],
    ];
    entries.forEach(([a, t], i) => {
      const y = 340 + i * 145;
      line(g, 124, y - 74, 1750, y - 74);
      type(g, a, 123, y, 62, teal, serif);
      type(g, t, 600, y, 48, ink, sans);
    });
  } else if (b === 2) {
    headline(g, 'Two contracts, two kinds of evidence');
    stock(g, 106, 258, 785, 553);
    lab(g, 'ARTICLE   /   EXACT CONFIGURATION', 150, 331);
    ['page_size     100', 'retry_limit     3', 'cursor       true'].forEach((t, i) =>
      type(g, t, 157, 463 + i * 91, 52, ink, mono),
    );
    stock(g, 979, 258, 820, 553, '#cddfca');
    lab(g, 'CLIENT FIXTURE   /   TWO RETRIES ALLOWED', 1019, 331);
    ['start    →   429', 'start    →   page-2', 'page-2   →   Linus'].forEach((t, i) =>
      type(g, t, 1027, 463 + i * 91, 51, teal, mono),
    );
  } else if (b === 3) {
    headline(g, 'Who set the passing limit?');
    type(g, 'Requested page size', 122, 294, 51, muted, serif);
    type(g, large.requests[0].limit.toLocaleString('en-US'), 117, 466, 147, ink, serif);
    const weak = cue(k, 3, 'to ten thousand');
    for (const [i, label] of ['Generator’s test', 'Trusted service contract'].entries()) {
      const x = 125 + i * 847,
        lim = i === 0 && weak ? 10000 : 100;
      stock(g, x, 540, 796, 303);
      lab(g, label, x + 36, 607);
      type(g, '10,000 ≤ ' + lim.toLocaleString('en-US'), x + 35, 704, 57, ink, mono);
      type(g, 10000 <= lim ? 'Pass' : 'Fail', x + 36, 790, 55, 10000 <= lim ? teal : rust, serif);
    }
  } else {
    const llama = b === 4;
    headline(
      g,
      llama
        ? 'Execution feedback in Llama 3'
        : b === 5
          ? 'What went into Phi-1?'
          : 'What does the benchmark establish?',
    );
    if (llama) {
      type(g, '~1 million', 112, 409, 147, teal, serif);
      lab(g, 'CODING DIALOGUES', 124, 478);
      for (let i = 0; i < 10; i++)
        round(g, 128 + i * 158, 592, 137, 94, 8, i < 2 ? orange : '#c3cdbb');
      type(g, 'About 20% initially failed and were corrected.', 127, 800, 61, ink, serif);
    } else if (b === 5) {
      [
        ['Filtered code and language', '~6B'],
        ['Synthetic textbooks', '<1B'],
        ['Exercises', '~180M'],
      ].forEach(([label, count], i) => {
        const x = 115 + i * 586;
        lab(g, 'TOKEN INVENTORY', x, 336);
        type(g, count, x, 513, 114, teal, serif);
        type(g, label, x, 607, 46, ink, sans, 'left', 540);
      });
      type(g, '1.3B parameters     ·     HumanEval pass@1  50.6%', 118, 847, 49, muted, mono);
    } else {
      type(g, '50.6%', 121, 509, 181, teal, serif);
      lab(g, 'PHI-1   /   HUMANEVAL PASS@1', 132, 587);
      type(g, 'Which ingredient caused the gain?', 760, 471, 65, ink, serif, 'left', 1030);
      type(g, 'Requires a controlled comparison.', 765, 565, 50, muted, sans);
      if (cue(k, 6, 'Orca'))
        ruleText(
          g,
          'Orca measured task outcomes after learning from explanation traces.',
          133,
          849,
          1638,
        );
    }
  }
}
