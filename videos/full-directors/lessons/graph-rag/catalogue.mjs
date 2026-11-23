import assert from 'node:assert/strict';
import {
  EDGES,
  RECORDS,
  REVIEWED_SUPPORT,
  BOOK_ENTRIES,
  BOOK_TOPICS,
} from '../../../films/graph-rag/fixtures.mjs';
import {
  entails,
  topicCounts,
  blockedDescendants,
  reportAudience,
} from '../../../films/graph-rag/model.mjs';
import { jacket, mapPrint } from './plates.mjs';
import {
  C,
  txt,
  box,
  line,
  disc,
  arrow,
  paper,
  on,
  mark,
  cut,
  base,
  foot,
  slip,
  put,
  node,
} from './print.mjs';

const works = [
  { id: EDGES[0].to, type: 'Book', title: 'River Walk' },
  { id: 'place:river', type: 'Place', title: 'River Walk' },
];
const aliases = new Map([['River Walk, revised edition', 'River Walk']]);
const revised = {
  text: 'River Walk was published by Juniper Press.',
  version: 2,
  currentVersion: 2,
  allowed: true,
};
const versions = [RECORDS.publisher, revised];
function resolve(title, type) {
  const matches = works.filter(
    (w) => w.title === (aliases.get(title) ?? title) && (!type || w.type === type),
  );
  return matches.length === 1 ? matches[0] : null;
}
function lookup(workID, version, allowed = true, currentVersion = version) {
  const a = RECORDS.author,
    b = versions[version - 1];
  if (
    !allowed ||
    !a.allowed ||
    a.version !== a.currentVersion ||
    !b?.allowed ||
    b.version !== currentVersion ||
    b.version !== b.currentVersion ||
    EDGES[0].to !== workID ||
    EDGES[1].from !== workID
  )
    return null;
  return {
    author: a.text,
    book: workID,
    version,
    publisher: b.text.match(/published by (.*)\./)[1],
  };
}
const original = lookup(EDGES[0].to, 1);
const current = lookup(EDGES[0].to, 2);
const recordName = ['Lena', 'River Walk', original.publisher];
const audiences = { A: ['staff', 'security'], B: ['staff', 'security'], R: ['security'] };
const reports = [
  { title: 'Public report', sources: ['A', 'B'] },
  { title: 'Mixed report', sources: ['A', 'B', 'R'] },
];
const admitted = (report, reader) =>
  reportAudience(report.sources.map((k) => audiences[k])).includes(reader);
const dependencies = {
  edge: ['B v1'],
  child: ['edge'],
  parent: ['child'],
  context: ['parent'],
  travel: ['Trail notes'],
};
const invalid = new Set(blockedDescendants(['B v1'], dependencies));

function imprint(c, record, visible) {
  paper(c, 0, 0, 530, 660, '#fff1ce');
  txt(c, 'PUBLISHER RECORD', 45, 70, 30, { color: C.red, bold: true });
  txt(c, 'B / v' + record.version, 478, 70, 31, { align: 'right', color: C.red });
  line(c, 42, 95, 488, 95, '#bda88a');
  txt(c, 'River Walk', 265, 195, 72, { family: 'Serif', align: 'center', italic: true });
  txt(c, 'Published by', 265, 287, 38, { family: 'Serif', align: 'center' });
  on(c, visible, () => {
    txt(c, record.publisher, 265, 377, 62, {
      family: 'Serif',
      align: 'center',
      color: C.blue,
      w: 470,
    });
    disc(c, 265, 482, 66, C.blue);
    line(c, 265, 525, 265, 441, '#f2e3be', 6);
    for (let i = 0; i < 6; i++) {
      const y = 446 + i * 10,
        w = (i + 2) * 4;
      if (record.version === 2) {
        line(c, 265, y, 265 - w, y + 18, '#f2e3be', 4);
        line(c, 265, y, 265 + w, y + 18, '#f2e3be', 4);
      } else {
        for (const sign of [-1, 1]) {
          c.beginPath();
          c.moveTo(265, 462);
          c.quadraticCurveTo(265 + sign * w, 410 + i * 4, 265 + sign * (w + 8), 478 + i * 4);
          c.strokeStyle = '#f2e3be';
          c.lineWidth = 3;
          c.stroke();
        }
      }
    }
  });
  txt(c, record.book, 265, 614, 34, { family: 'Mono', align: 'center', color: C.dim });
}
function boundBook(c, record, turn, visible, matched) {
  box(c, -3, 2, 539, 669, C.blue);
  imprint(c, record, visible);
  const projection = Math.cos(Math.PI * turn);
  if (Math.abs(projection) > 0.001) {
    c.save();
    c.transform(projection, -0.04 * Math.sin(Math.PI * turn), 0, 1, 0, 0);
    if (projection > 0) jacket(c, matched);
    else {
      box(c, 0, 0, 530, 660, '#abc4cc', C.blue, 7);
      for (let j = 0; j < 22; j++) {
        c.beginPath();
        c.moveTo(10, j * 30 + 12);
        c.bezierCurveTo(143, j * 30 - 14, 344, j * 30 + 39, 520, j * 30 + 7);
        c.strokeStyle = '#76989e';
        c.lineWidth = 2;
        c.stroke();
      }
    }
    c.restore();
  }
  if (turn > 0) box(c, 0, 0, 5, 659, '#b1a486');
}
function author(c, x, y, w, match) {
  const h = 170;
  paper(c, x, y, w, h);
  box(c, x, y, w, 5, C.red);
  txt(c, 'A   /   Author record', x + 16, y + 33, 20, { color: C.red });
  txt(c, 'Lena wrote', x + 16, y + 77, 34, { family: 'Serif' });
  txt(c, 'River Walk.', x + 16, y + 116, 37, { family: 'Serif', italic: true });
  txt(c, original.book, x + 16, y + 153, 24, { family: 'Mono', color: C.blue });
  if (match) line(c, x + 16, y + 161, x + 16 + 145 * match, y + 161, C.red, 3);
}
function foldedMap(c, x, y, k, unfold = 1) {
  put(c, x, y, k, () => {
    for (let i = 0; i < 3; i++) {
      const squash = 0.84 + 0.16 * unfold,
        slope = 0.06 + 0.09 * (1 - unfold);
      c.save();
      c.translate(212 * i * squash, i % 2 ? 212 * slope : 0);
      c.transform(squash, i % 2 ? -slope : slope, 0, 1, 0, 0);
      c.beginPath();
      c.rect(0, 0, 212, 492);
      c.clip();
      c.translate(-212 * i, 0);
      mapPrint(c);
      box(c, 212 * i, 0, 212, 492, i % 2 ? '#253d3011' : '#ffffff09');
      c.restore();
    }
  });
}
export function opening(c, k, corrected = false) {
  const r = corrected ? current : original;
  const pick = mark(k, 2, corrected ? 'Follow A' : 'Follow the matching ID', 0.65);
  const turn = mark(k, 2, corrected ? 'Turn to the corrected imprint' : 'Turn to the imprint', 1.1);
  const visible = cut(k, 2, r.publisher);
  base(
    c,
    corrected ? 'Which publisher can the reader cite today?' : 'Who published Lena’s book?',
    corrected ? 'RIVER WALK   /   CORRECTION' : 'RIVER WALK   /   CATALOGUE',
  );
  if (!corrected) {
    on(c, 1 - turn, () =>
      foldedMap(
        c,
        789 + 110 * turn,
        227,
        0.55,
        k.beat.beatIndex ? 1 : Math.min(1, k.elapsed / 0.9),
      ),
    );
  } else {
    slip(c, 837, 218, 306, 213, 'REPORT  /  FROM B v1', ['River Walk', original.publisher], {
      color: C.red,
      fill: '#e7d8c7',
      size: 32,
    });
    box(c, 851, 368, 278, 46, C.red);
    txt(c, 'Waiting for rebuild', 990, 399, 23, { color: C.white, align: 'center' });
  }
  const x = corrected ? 419 + 90 * turn : 432 + 170 * turn;
  put(c, x, 150, 0.6, () => boundBook(c, r, turn, visible, pick));
  author(c, 42 + turn * (corrected ? 200 : 292), 245, 255, pick);
  if (pick > 0 && turn < 0.1) arrow(c, 307, 405, x - 7, 496, C.red, pick, 3);
  foot(
    c,
    visible
      ? corrected
        ? 'A v1   →   book:river   →   B v2     •     Juniper Press'
        : 'A   /   Lena wrote River Walk.       B   /   River Walk was published by Willow Press.'
      : corrected
        ? 'A v1 still names the work.   •   B v2 is current.'
        : pick
          ? 'book:river matches. Read the publisher’s imprint.'
          : 'Work ID on A     →     Which River Walk has that ID?',
  );
}
function graphLine(c, i, progress, name = EDGES[i].relation) {
  if (!progress) return;
  const xs = [203, 607, 994],
    x = xs[i],
    ex = xs[i + 1];
  txt(c, name, (x + ex) / 2, 264, 24, { align: 'center', color: C.red });
  arrow(c, x + 102, 300, ex - 109, 300, C.red, progress, 4);
}
function typedNodes(c) {
  [203, 607, 994].forEach((x, i) => {
    txt(c, ['PERSON', 'BOOK', 'PUBLISHER'][i], x, 233, 17, {
      align: 'center',
      color: C.dim,
      bold: true,
    });
    node(c, x, 300, recordName[i], { w: 210 });
  });
}
export function triples(c, k) {
  const b = k.beat.beatIndex + 1;
  base(
    c,
    b <= 3 ? 'What does each arrow say?' : 'What travels along this edge?',
    'A + B   /   RELATIONSHIPS',
  );
  if (b <= 3) {
    typedNodes(c);
    const omitted =
      b === 3 && cut(k, 3, 'omit the publisher link') && !cut(k, 3, 'Restore that link');
    const reverse =
      b === 3 && cut(k, 3, 'reverse the author link') && !cut(k, 3, 'Put the author arrow back');
    const owns = b === 3 && cut(k, 3, 'replace wrote');
    if (reverse) {
      txt(c, 'wrote?', 406, 264, 24, { align: 'center', color: C.red });
      arrow(c, 498, 300, 308, 300, C.red);
    } else graphLine(c, 0, mark(k, 1, 'Lena wrote'), owns ? 'owns?' : 'wrote');
    if (!omitted) graphLine(c, 1, mark(k, 1, 'River Walk was published'));
    on(c, mark(k, 2, 'author edge'), () =>
      slip(c, 84, 384, 440, 114, 'A   /   v1', [RECORDS.author.text]),
    );
    on(c, mark(k, 2, 'publisher edge'), () =>
      slip(c, 640, 384, 475, 114, 'B   /   v1', [RECORDS.publisher.text]),
    );
    foot(
      c,
      b === 3
        ? 'Extractor proposal above     •     Source sentences below'
        : 'Read each relationship from its tail to its arrowhead.',
    );
  } else {
    const mean = (0.4 + 0.8) / 2;
    slip(c, 58, 195, 457, 140, 'TRAVERSE   /   WROTE', [RECORDS.author.text], { size: 36 });
    txt(c, 'A   •   retrieved passage', 80, 400, 28, { color: C.blue });
    line(c, 559, 175, 559, 510, C.muted);
    txt(c, 'AGGREGATE NEIGHBOR MESSAGES', 605, 208, 18, { color: C.teal, bold: true });
    [0.4, 0.8].forEach((n, i) => {
      const y = 289 + i * 123;
      disc(c, 706, y, 43, C.blue);
      txt(c, n.toFixed(1), 706, y + 10, 29, { align: 'center', color: C.white });
      arrow(c, 751, y, 904, 349, C.teal, mark(k, 4, 'Two neighbor messages'));
    });
    disc(c, 965, 349, 55, C.mint, C.teal);
    on(c, mark(k, 4, 'That aggregate'), () =>
      txt(c, mean.toFixed(1), 965, 362, 37, { align: 'center', color: C.teal }),
    );
    foot(
      c,
      b === 5
        ? 'Standard GraphRAG indexes extracted relationships, communities and reports.'
        : 'One operation returns source text. The other computes a node update.',
    );
  }
}
export function identity(c, k) {
  const typed = cut(k, 2, 'supplies River Walk'),
    joined = cut(k, 2, 'Now join');
  const title = typed ? 'River Walk, revised edition' : 'River Walk';
  const work = resolve(title, typed ? 'Book' : undefined);
  base(c, 'Where should this link attach?', 'CATALOGUE   /   ENTITY RESOLUTION');
  slip(
    c,
    45,
    202,
    407,
    245,
    'INCOMING ENDPOINT',
    [title, typed ? 'Type   Book' : 'Type   ______'],
    { size: 33 },
  );
  if (typed) txt(c, 'Reviewed alias → River Walk', 66, 410, 25, { color: C.teal, w: 355 });
  works.forEach((w, i) => {
    const y = 173 + i * 184;
    if (i === 0) put(c, 740, y, 0.21, () => jacket(c, 0));
    else foldedMap(c, 722, y + 14, 0.2);
    txt(c, w.title, 881, y + 55, 38, { family: 'Serif' });
    txt(c, w.type + '   /   ' + w.id, 881, y + 95, 22, { color: C.blue, w: 267 });
    if (joined && work?.id === w.id)
      arrow(c, 454, 307, 711, y + 70, C.teal, mark(k, 2, 'Now join', 0.7), 5);
  });
  foot(
    c,
    joined
      ? 'One reviewed Book alias resolves to book:river. The Place keeps its own ID.'
      : typed
        ? 'Type and reviewed edition are available for matching.'
        : cut(k, 2, 'Hold the link')
          ? 'Link held for review. Both candidates share this title.'
          : 'Two candidates share one title. The incoming type field is empty.',
  );
}
export function trace(c, k) {
  base(c, 'Which passages belong in the answer?', 'DIRECTED WALK   /   DOCUMENT RECEIPTS');
  typedNodes(c);
  const path = [mark(k, 1, 'wrote relation', 0.8), mark(k, 1, 'published-by relation', 0.8)];
  for (let i = 0; i < 2; i++) {
    graphLine(c, i, path[i]);
    const e = EDGES[i],
      s = RECORDS[e.source];
    on(c, path[i], () =>
      slip(
        c,
        60 + i * 554,
        374,
        523,
        135,
        (i ? 'B' : 'A') +
          '   /   ' +
          (cut(k, 2, 'Both records pass') ? 'Current · permitted' : 'Source record v' + s.version),
        [s.text],
        { color: i ? C.blue : C.teal },
      ),
    );
  }
  foot(
    c,
    cut(k, 3, 'shared topic')
      ? 'Sharing a topic supplies a retrieval lead. Authorship needs a sentence about the author.'
      : cut(k, 2, 'Cite A')
        ? 'Cite A for authorship. Cite B for the imprint.'
        : 'Collect the source at each hop, then check the reader, version and claim.',
  );
}
export function claims(c, k) {
  const proposed = [EDGES[0], { ...EDGES[0], relation: 'owns' }];
  const introduced = [cut(k, 1, 'Here are two proposed links'), cut(k, 1, 'The second changes')];
  base(c, 'Which verb does record A support?', 'SOURCE A   /   CLAIM REVIEW');
  slip(c, 57, 154, 1085, 108, 'A   /   v1', [RECORDS.author.text], { size: 34 });
  proposed.forEach((e, i) => {
    if (!introduced[i]) return;
    const y = 340 + i * 119;
    const decided = cut(k, 2, i ? 'Withhold owns' : 'Keep wrote');
    txt(c, 'Lena', 93, y + 13, 35, { family: 'Serif' });
    txt(c, e.relation, 375, y - 12, 28, { align: 'center', color: C.blue });
    arrow(c, 209, y, 544, y, C.blue);
    txt(c, 'River Walk', 572, y + 13, 35, { family: 'Serif' });
    txt(c, 'A · v1', 793, y + 12, 23, { family: 'Mono' });
    if (decided) {
      const yes = entails(e);
      box(c, 921, y - 32, 195, 64, yes ? C.teal : C.red);
      txt(c, yes ? 'Keep' : 'Withhold', 1018, y + 10, 28, { align: 'center', color: C.light });
    }
  });
  if (introduced[1]) {
    foot(
      c,
      cut(k, 3, 'matching hash')
        ? 'Version identity and semantic support need separate checks on reviewed cases.'
        : 'Read the verb in each claim against the verb in A.',
    );
  }
}

const titles = ['Leaf Compost', 'Balcony Herbs', 'River Walk', 'Stock Pot'];
const snippets = [
  'Make compost from leaves.',
  'Grow herbs on a balcony.',
  'Walk the riverside trail.',
  'Simmer the stock slowly.',
];
const shelfRows = [...new Map(BOOK_ENTRIES.slice(0, 5))];
const subjectReports = BOOK_TOPICS.map((topic) => ({
  topic,
  ids: shelfRows.filter(([, label]) => label === topic).map(([id]) => id),
}));
const colors = [C.teal, '#426a38', C.blue, '#9c4d39'];
function smallCover(c, x, y, w, h, i) {
  if (i === 2) {
    put(c, x, y, w / 530, () => jacket(c, 0));
    return;
  }
  box(c, x + 3, y + 4, w, h, '#26334324');
  box(c, x, y, w, h, colors[i]);
  box(c, x + 4, y, 4, h, '#f5ded34d');
  const cx = x + w * 0.52,
    cy = y + h * 0.49;
  if (i === 3) {
    box(c, cx - w * 0.23, cy, w * 0.46, h * 0.2, '#eac88b');
    line(c, cx - w * 0.28, cy, cx + w * 0.28, cy, '#f0d98e', 3);
    for (let n = 0; n < 3; n++) {
      c.beginPath();
      c.moveTo(cx - w * 0.12 + n * w * 0.11, cy - 4);
      c.bezierCurveTo(
        cx - w * 0.14 + n * w * 0.11,
        cy - 13,
        cx + n * w * 0.08,
        cy - 16,
        cx - w * 0.1 + n * w * 0.1,
        cy - 23,
      );
      c.strokeStyle = '#f4d6a7';
      c.stroke();
    }
  } else {
    for (let d = 0; d < 3; d++) {
      const dx = cx + (d - 1) * w * 0.18,
        dy = cy + Math.abs(d - 1) * 5;
      line(c, cx, cy + h * 0.24, dx, dy - h * 0.1, '#e1cd83', 2);
      for (let j = 0; j < 4; j++) {
        c.save();
        c.translate(dx, dy + j * 4);
        c.rotate(j % 2 ? 0.6 : -0.6);
        c.beginPath();
        c.ellipse(0, 0, w * 0.065, h * 0.047, 0, 0, Math.PI * 2);
        c.fillStyle = j % 2 ? '#c2d9a6' : '#edce8d';
        c.fill();
        c.restore();
      }
    }
  }
  txt(c, titles[i], x + w / 2, y + h * 0.23, w * 0.16, {
    family: 'Serif',
    color: C.light,
    align: 'center',
    w: w - 12,
  });
}
export function shelf(c, k) {
  const grouped = cut(k, 2, 'build reports'),
    batch = cut(k, 3, 'Gardening and travel fit'),
    second = cut(k, 3, 'Cooking goes'),
    partial = cut(k, 3, 'Each map call'),
    combined = cut(k, 4, 'The reducer brings');
  base(c, 'Which subjects reach the reader?', 'THE COLLECTION   /   GLOBAL SEARCH');
  for (const [i, [id, topic]] of shelfRows.entries()) {
    const y = 152 + i * 97;
    smallCover(c, 65, y, 59, 74, i);
    txt(c, titles[i], 143, y + 32, 28, { family: 'Serif' });
    txt(c, id + '   ' + snippets[i], 143, y + 62, 19, { color: C.dim, w: 311 });
    if (!grouped && i < 2) {
      box(c, 478, y + 11, 166, 54, C.blue);
      txt(c, 'Hit ' + (i + 1), 561, y + 47, 26, { align: 'center', color: C.white });
    } else if (grouped) {
      const j = BOOK_TOPICS.indexOf(topic);
      arrow(c, 442, y + 29, 532, 218 + j * 127, C.teal, mark(k, 2, 'build reports', 0.7));
    }
  }
  if (grouped) {
    subjectReports.forEach(({ topic, ids }, i) => {
      const y = 177 + i * 127;
      slip(c, 547, y, 239, 94, 'REPORT   /   ' + ids.join(' + '), [topic], { size: 27 });
      if (i < 2 ? batch : second) arrow(c, 794, y + 42, 874, i < 2 ? 262 : 448, C.teal);
    });
    if (batch)
      slip(
        c,
        881,
        204,
        271,
        128,
        'MAP 1  /  TWO REPORTS',
        partial ? ['Gardening', 'Travel'] : ['Gardening + travel'],
        { size: 23 },
      );
    if (second) slip(c, 881, 391, 271, 105, 'MAP 2  /  ONE REPORT', ['Cooking'], { size: 24 });
  } else {
    slip(c, 759, 222, 385, 200, 'TOP TWO PASSAGES', ['Compost and herbs.', 'What is missing?'], {
      size: 35,
    });
  }
  foot(
    c,
    combined
      ? 'Combined answer   •   ' +
          subjectReports.map(({ topic, ids }) => topic + ' [' + ids.join(', ') + ']').join('     ')
      : grouped
        ? 'Trace each subject through its report. Which book IDs support it?'
        : 'Two relevant passages can come from a single subject.',
  );
}
export function drift(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 3) {
    const blocked = cut(k, 2, 'library corrects B');
    base(c, 'Who published the travel books?', 'DRIFT   /   FROM PRIMER TO FOLLOW-UP');
    slip(c, 50, 180, 371, 154, 'TRAVEL REPORT   /   B3', ['Travel includes', 'River Walk.']);
    arrow(c, 423, 249, 483, 249, C.red, mark(k, 1, 'follow-up question'));
    on(c, mark(k, 1, 'follow-up question'), () =>
      slip(c, 491, 180, 646, 154, 'LOCAL FOLLOW-UP', ['Who published River Walk?'], { size: 37 }),
    );
    if (cut(k, 2, 'Local search')) {
      slip(c, 91, 375, 445, 137, 'A   /   v1', [RECORDS.author.text]);
      slip(
        c,
        562,
        375,
        570,
        137,
        blocked ? 'B   /   v1   •   BLOCKED' : 'B   /   v1',
        [blocked ? 'Old publisher evidence withdrawn.' : RECORDS.publisher.text],
        { color: blocked ? C.red : C.teal },
      );
    }
    foot(
      c,
      blocked
        ? 'A still identifies the book. Fetch current B before filling the publisher field.'
        : cut(k, 2, 'combines the answers')
          ? 'Combine the thematic primer with the cited local answer.'
          : 'A report supplies the title for a new question.',
    );
  } else {
    const moved = cut(k, 4, 'move it to the middle');
    base(c, 'Does the answer still cite A?', 'CONTEXT POSITION   /   CONTROLLED REPLAY');
    const order = moved ? ['C', 'D', 'A', 'E', 'F'] : ['A', 'C', 'D', 'E', 'F'];
    order.forEach((id, i) => {
      const x = 74 + i * 216;
      paper(c, x, 227, 182, 212, id === 'A' ? C.mint : C.light);
      txt(c, id, x + 19, 277, 37, { family: 'Serif', color: id === 'A' ? C.teal : C.dim });
      if (id === 'A') {
        txt(c, 'Lena wrote', x + 16, 337, 26, { family: 'Serif' });
        txt(c, 'River Walk.', x + 16, 373, 26, { family: 'Serif', italic: true });
      } else {
        for (let l = 0; l < 4; l++)
          line(c, x + 15, 309 + 22 * l, x + 132 - l * 8, 309 + 22 * l, C.muted, 3);
      }
    });
    if (b === 4 || !cut(k, 5, 'original GraphRAG study'))
      txt(c, 'Same question and same five records', 600, 509, 30, {
        align: 'center',
        family: 'Serif',
      });
    else {
      box(c, 74, 463, 1045, 77, C.mint);
      const study =
        b === 5
          ? 'Podcast and news corpora   /   Model judges preferred breadth and variety'
          : 'Route comparison   /   Cited details     •     Model calls     •     Reader wait';
      txt(c, study, 600, 510, 27, { align: 'center', w: 1009 });
    }
    foot(
      c,
      b >= 5
        ? 'Check the cited sentence after each permutation. Compare breadth, cost and latency separately.'
        : 'Who wrote River Walk? Move only A’s position relative to the other records.',
    );
  }
}
export function access(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 3) {
    const sec = cut(k, 3, 'Switch to a security reader'),
      reader = sec ? 'security' : 'staff';
    const show = sec ? cut(k, 3, 'Yes') : cut(k, 2, 'Send the public');
    base(c, 'Which report may enter the map call?', 'ADMISSION   /   CURRENT READER');
    txt(c, reader.toUpperCase() + ' READER', 54, 212, 27, { color: C.blue, bold: true });
    for (const [i, [id, groups]] of Object.entries(audiences).entries()) {
      const y = 238 + i * 89;
      paper(c, 53, y, 446, 69);
      txt(c, id, 74, y + 45, 35, { family: 'Serif' });
      txt(c, groups.join(' + '), 132, y + 43, 25);
    }
    for (const [i, r] of reports.entries()) {
      const y = 196 + i * 179,
        ok = admitted(r, reader);
      slip(c, 569, y, 573, 142, r.title.toUpperCase(), [r.sources.join(' + ')], { size: 35 });
      if (show) {
        box(c, 877, y + 46, 237, 68, ok ? C.teal : C.red);
        txt(c, ok ? 'Admit' : 'Withhold', 995, y + 89, 29, { color: C.white, align: 'center' });
      }
    }
    foot(c, 'Report audience = readers with current access to every contributing source.');
  } else {
    const changed = cut(k, 4, 'replaces record B');
    base(c, 'Which old artifacts lose their evidence?', 'CATALOGUE   /   DEPENDENCY INVALIDATION');
    const ids = ['B v1', 'edge', 'child', 'parent', 'context'];
    const names = ['B v1', 'Publisher edge', 'Child report', 'Parent report', 'Cached context'];
    ids.forEach((id, i) => {
      const x = 47 + i * 225,
        blocked = changed && invalid.has(id);
      if (i < 4) arrow(c, x + 195, 281, x + 224, 281, C.dim);
      paper(c, x, 225, 191, 113, blocked ? C.pink : C.light);
      txt(c, names[i], x + 95, 267, 25, { align: 'center', family: 'Serif', w: 175 });
      txt(c, blocked ? 'Blocked' : 'Current', x + 95, 312, 22, {
        align: 'center',
        color: blocked ? C.red : C.teal,
      });
    });
    slip(c, 55, 393, 515, 124, 'INDEPENDENT   /   TRAIL NOTES', ['Travel report stays current.']);
    if (changed) slip(c, 606, 393, 528, 124, 'CURRENT   /   B v2', ['Corrected source available.']);
    foot(
      c,
      changed
        ? 'Withhold old descendants immediately. The report rebuild can finish later.'
        : 'Each dependent retains the version of the source it consumed.',
    );
  }
}
export function finish(c, k) {
  if (k.beat.beatIndex < 2) return opening(c, k, true);
  const newRow = cut(k, 5, 'One more travel entry'),
    counted = cut(k, 4, 'Count it once');
  const complete = newRow ? cut(k, 6, 'It was the new book') : cut(k, 4, 'A community report');
  const rows = BOOK_ENTRIES.slice(0, newRow ? 6 : 5);
  const prior = newRow && !complete;
  const countedRows = prior ? BOOK_ENTRIES.slice(0, 5) : rows;
  const tally = topicCounts(countedRows);
  base(c, 'Which topic has the most distinct books?', 'THE COLLECTION   /   REVIEWED TOPIC LABELS');
  txt(c, 'CATALOGUE ENTRIES', 56, 180, 18, { color: C.teal, bold: true });
  rows.forEach(([id, t], i) => {
    const y = 198 + 57 * i,
      repeat = i > 0 && rows[i - 1][0] === id;
    box(c, 55, y, 466, 48, repeat && counted ? '#e2dccd' : C.light);
    txt(c, id, 74, y + 34, 25, { family: 'Mono', color: C.blue });
    txt(c, t, 182, y + 34, 28, { family: 'Serif' });
    if (repeat && counted) txt(c, 'count once', 503, y + 32, 19, { align: 'right', color: C.red });
  });
  txt(c, prior ? 'PREVIOUS COUNT   /   BEFORE B5' : 'DISTINCT BOOKS', 578, 180, 18, {
    color: C.teal,
    bold: true,
  });
  BOOK_TOPICS.forEach((topic, i) => {
    const y = 223 + 109 * i;
    txt(c, topic, 583, y + 48, 31, { family: 'Serif' });
    if (complete || prior) {
      const ids = [...new Map(countedRows)].filter(([, t]) => t === topic).map(([id]) => id);
      ids.forEach((id, j) => {
        box(c, 764 + j * 91, y, 79, 72, colors[[0, 2, 3][i]]);
        box(c, 769 + j * 91, y, 4, 72, '#ffffff55');
        txt(c, id, 804 + j * 91, y + 46, 27, { align: 'center', color: C.light, family: 'Mono' });
      });
      txt(c, tally.counts[i], 1085, y + 49, 45, { family: 'Serif' });
    } else line(c, 763, y + 50, 1094, y + 50, C.muted);
  });
  foot(
    c,
    complete
      ? (newRow ? 'Gardening and travel tie' : 'Gardening leads') +
          '   •   ' +
          tally.books +
          ' distinct books on the shelf.'
      : newRow
        ? 'B5 is a new travel book. Count the shelf again.'
        : 'Each book has one reviewed topic. Which entries share an ID?',
  );
}

export function checkCatalogue() {
  assert.deepEqual(subjectReports, [
    { topic: 'Gardening', ids: ['B1', 'B2'] },
    { topic: 'Travel', ids: ['B3'] },
    { topic: 'Cooking', ids: ['B4'] },
  ]);
  assert.equal(resolve('River Walk'), null);
  assert.equal(resolve('River Walk, revised edition', 'Book').id, EDGES[0].to);
  assert.equal(lookup(original.book, 1, true, 2), null);
  assert.equal(lookup(works[1].id, 1), null);
  assert.equal(lookup(original.book, 2, false), null);
  assert.equal(original.publisher, 'Willow Press');
  assert.equal(current.publisher, 'Juniper Press');
  assert.equal(original.book, current.book);
  assert.equal(current.version, 2);
  assert.equal(REVIEWED_SUPPORT[0].text, RECORDS.author.text);
  assert(entails(EDGES[0]));
  assert(!entails({ ...EDGES[0], relation: 'owns' }));
  assert.deepEqual(
    reports.map((r) => admitted(r, 'staff')),
    [true, false],
  );
  assert(reports.every((r) => admitted(r, 'security')));
  assert.deepEqual([...invalid], ['B v1', 'edge', 'child', 'parent', 'context']);
  assert(!invalid.has('travel'));
  assert.deepEqual(topicCounts(BOOK_ENTRIES.slice(0, 5)), { books: 4, counts: [2, 1, 1] });
  assert.deepEqual(topicCounts(BOOK_ENTRIES), { books: 5, counts: [2, 2, 1] });
}
