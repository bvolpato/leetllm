// The three requests were made to the committed answer() in
// web/src/content/projects/deep-dive-mlflow/assets/mlflow_local_lab.py.
// These are the run and trace IDs, inputs and outputs read back from local MLflow.
const commit = '86c3c9024bd30e8cf584892965e25ddc82b91f98';
const lookupKey = 'What is the return window?';
const records = [
  {
    name: 'Run A', run: 'aaeed0e21c964df0b62c0d0b11fe7816',
    trace: 'tr-7646ca207d1d4385fe304debfb34e1ae',
    question: 'What is the return window?', variant: 'valid',
    retrieved: ['DOC-12'], prediction: { text: '30 days', citations: ['DOC-12'] },
  },
  {
    name: 'Run B', run: '7298d79bd56945118bbcfa8b58ff8957',
    trace: 'tr-ce3669803f4f7d176f9699a2591d4c62',
    question: 'What is the return window', variant: 'valid',
    retrieved: [], prediction: { text: '30 days', citations: [] },
  },
  {
    name: 'Replay of B', run: 'c5571b3f34a14895bf19dff9c5b98982',
    trace: 'tr-bc25a9af15a813e9347aeb2f3ddd9678',
    question: 'What is the return window?', variant: 'valid',
    retrieved: ['DOC-12'], prediction: { text: '30 days', citations: ['DOC-12'] },
  },
];

const beats = [
  {
    id: 'replies',
    say: 'You want to check the return policy. Both replies say thirty days. The first one gives you a document to open. Where did the other citation go?',
    hold: 1.45,
  },
  {
    id: 'open-traces',
    say: 'Look at the commit. These two runs used the same code. In MLflow, each run here links to a trace that recorded one request. Open the retrieval step in both traces.',
    hold: 0.8,
  },
  {
    id: 'returned-documents',
    say: 'The search on the left returned document twelve. On the right it returned an empty list. This little test assistant always writes thirty days. It copies whatever documents the search found into its citations.',
    hold: 0.75,
  },
  {
    id: 'compare-questions',
    say: 'Look at the question each search actually received. Read the two strings right up to the last character.',
    hold: 1.55,
  },
  {
    id: 'exact-lookup',
    say: 'See the question mark on the left? Here’s the lookup in the code both runs used. It compares the whole string, punctuation included.',
    hold: 1.25,
  },
  {
    id: 'replay-input',
    say: 'Keep the failed run in view. Start a fresh run with its question and put the question mark back. What will the search return?',
    hold: 1.8,
  },
  {
    id: 'replay-output',
    say: 'Look under the two questions. Document twelve is back. Both replies still say thirty days. This time the search found an exact match, so the new reply has a policy you can open.',
    hold: 2.4,
  },
];

const ink = '#241d32';
const muted = '#625a6b';
const violet = '#4b3396';
const coral = '#aa3b1b';
const paleCoral = '#ffdfca';
const mono = 'Lesson Mono';
const serif = 'Lesson Serif';
const sans = 'Lesson Sans';
const laneWidth = 960;

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => clamp(v) ** 2 * (3 - 2 * clamp(v));
const mix = (a, b, p) => a + (b - a) * p;

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function line(c, x1, y1, x2, y2, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}
function type(c, value, x, y, size, family = sans, color = ink, weight = 400) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "${family}"`;
  c.fillText(value, x, y);
  return c.measureText(value).width;
}
function layer(c, opacity, paint) {
  if (opacity <= 0) return;
  c.save();
  c.globalAlpha *= clamp(opacity);
  paint();
  c.restore();
}
function crop(c, x, y, w, h) {
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
}

// The array brackets and the folded document keep their shapes as we move
// from the answer's citations to the retrieval span and back again.
function documentList(c, ids, x, baseline, scale = 1, opening = 1) {
  c.save();
  c.translate(x, baseline);
  c.scale(scale, scale);
  const length = ids.length ? 273 : mix(84, 44, opening);
  for (const [edge, inward] of [[0, 1], [length, -1]]) {
    c.beginPath();
    c.moveTo(edge + 10 * inward, -61);
    c.lineTo(edge, -61);
    c.lineTo(edge, 13);
    c.lineTo(edge + 10 * inward, 13);
    c.strokeStyle = ink;
    c.lineWidth = 4;
    c.stroke();
  }
  if (ids.length) {
    c.beginPath();
    c.moveTo(21, -61);
    c.lineTo(226, -61);
    c.lineTo(251, -36);
    c.lineTo(251, 13);
    c.lineTo(21, 13);
    c.closePath();
    c.fillStyle = violet;
    c.fill();
    c.beginPath();
    c.moveTo(226, -61);
    c.lineTo(226, -36);
    c.lineTo(251, -36);
    c.fillStyle = '#a895de';
    c.fill();
    type(c, ids[0], 47, -6, 43, mono, '#fffaff');
  }
  c.restore();
}

function frameState(clock) {
  const { index, elapsed, reveal } = clock;
  const cue = (beat, phrase, span) =>
    index < beat ? 0 : index > beat ? 1 : ease(reveal(phrase, span));
  const codeIn = cue(4, 'Here’s the lookup', 0.65);
  const readingResult = cue(6, 'Look under', 0.75);
  return {
    opening: index === 0 ? ease(elapsed / 0.8) : 1,
    commitFocus: index === 1 ? ease(elapsed / 0.32) * (1 - ease((elapsed - 4) / 0.8)) : 0,
    trace: cue(1, 'links to a trace', 0.65),
    retrieval: cue(1, 'Open the retrieval step', 1.12),
    copy: cue(2, 'It copies', 1.15),
    question: cue(3, 'Look at the question', 1.16),
    mark: cue(3, 'right up to the last character', 0.72),
    code: codeIn * (1 - readingResult),
    pan: cue(5, 'Start a fresh run', 1.3),
    key: cue(5, 'put the question mark back', 0.28),
    readingResult,
    final: cue(6, 'Both replies', 1.0),
  };
}

function heading(c, focus) {
  rect(c, 0, 0, 1920, 113, '#fffcf7');
  type(c, 'MLflow', 83, 76, 49, sans, ink, 700);
  line(c, 283, 40, 269, 80, '#aaa2a6', 2);
  type(c, 'Policy assistant', 313, 75, 42, serif);
  layer(c, focus, () => rect(c, 1356, 20, 479, 76, paleCoral));
  line(c, 1380, 60, 1415, 60, muted, 3);
  c.beginPath();
  c.arc(1398, 60, 9, 0, 2 * Math.PI);
  c.fillStyle = '#fffcf7';
  c.fill();
  c.stroke();
  type(c, 'commit ' + commit.slice(0, 8), 1432, 72, 35, mono, ink);
  line(c, 0, 113, 1920, 113, '#c6bdc1');
}

function runHeading(c, r, s, draft) {
  const x = 90;
  const nameWidth = type(c, r.name, x, 206, 52, serif);
  const id = draft ? 'new request' : r.run.slice(0, 8);
  type(c, id, x + nameWidth + 32, 203, 32, mono, muted);
  if (!draft) {
    layer(c, s.trace, () => {
      line(c, x + 4, 224, x + 4, 251, muted);
      line(c, x + 4, 251, x + 25, 251, muted);
      type(c, 'trace ' + r.trace.slice(0, 11), x + 41, 262, 31, mono, muted);
    });
  }
}

function outputs(c, r, s, second) {
  const k = s.retrieval;
  const x = 90;
  const open = second ? s.opening : 1;
  type(c, 'Reply', x, mix(359, 343, k), 37, sans, muted);
  c.save();
  crop(c, x - 6, 355, 760 * open + 6, 254);
  type(c, r.prediction.text, x - 6, mix(570, 465, k), mix(178, 123, k), serif);
  c.restore();
  type(c, 'Citations', x + 2, mix(687, 545, k), 35, sans, muted);
  layer(c, open, () =>
    documentList(c, r.prediction.citations, x + 8, mix(822, 638, k), mix(1.15, 0.92, k), open),
  );
}

function questionSpecimen(c, r, mark, typed) {
  const prefix = 'What is the return';
  const word = r.question.slice(prefix.length + 1).replace(/\?$/, '');
  type(c, 'Question', 90, 343, 36, sans, muted);
  type(c, prefix, 91, 431, 59, serif);
  c.font = `400 150px "${serif}"`;
  const wordWidth = c.measureText(word).width;
  const seat = 88 + wordWidth;
  // A shared baseline makes a missing character take up inspectable space.
  layer(c, mark, () => {
    rect(c, seat + 1, 466, 86, 156, r.question.endsWith('?') && typed > 0 ? paleCoral : '#dfd9e3');
    line(c, 90, 594, seat + 102, 594, '#b8aeb6', 1.5);
    line(c, seat, 459, seat, 633, '#a89ba1', 1.5);
    line(c, seat + 88, 459, seat + 88, 633, '#a89ba1', 1.5);
  });
  type(c, word, 88, 594, 150, serif);
  if (r.question.endsWith('?')) {
    layer(c, typed, () => type(c, '?', seat + mix(0, 8, mark), 594, 150, serif, mark ? coral : ink));
  }
}

function retrievalResult(c, r, s) {
  const left = 90;
  const y = 821;
  const f = s.final;
  const dataX = mix(left + 12, 564, f);
  const labelAlpha = 1 - clamp(2.4 * f);
  layer(c, labelAlpha, () => {
    // A bent call line marks the child operation traced inside answer().
    line(c, left + 4, y - 118, left + 4, y - 84, violet, 3);
    line(c, left + 4, y - 84, left + 36, y - 84, violet, 3);
    type(c, 'retrieve', left + 56, y - 72, 41, mono, ink);
    type(c, 'returned', left + 275, y - 72, 35, sans, muted);
  });
  layer(c, clamp(2.4 * f - 1.4), () => {
    type(c, 'Reply', left, y - 77, 35, sans, muted);
    type(c, 'Citations', dataX - 4, y - 77, 35, sans, muted);
    type(c, r.prediction.text, left - 3, y + 47, 108, serif);
  });
  documentList(c, f === 1 ? r.prediction.citations : r.retrieved, dataX, y + 34, 0.94);
}

// Trace the copy in the margin, keeping both source and destination readable.
function showCopy(c, r, s) {
  const p = s.copy;
  if (!p || s.question === 1) return;
  const bracketWidth = r.retrieved.length ? 273 : 44;
  const startX = 116 + bracketWidth * 0.94;
  const endX = 115 + bracketWidth * 0.92;
  layer(c, (1 - clamp(6 * s.question)) * 0.82, () => {
    c.save();
    c.beginPath();
    c.moveTo(startX, 833);
    c.lineTo(617, 833);
    c.quadraticCurveTo(645, 833, 645, 805);
    c.lineTo(645, 642);
    c.quadraticCurveTo(645, 614, 617, 614);
    c.lineTo(endX, 614);
    const length = 2 * 617 - startX - endX + 252;
    c.setLineDash([length * p, length + 20]);
    c.strokeStyle = violet;
    c.lineWidth = 4;
    c.stroke();
    c.restore();
    if (p > 0.97) {
      line(c, endX + 11, 605, endX, 614, violet, 4);
      line(c, endX, 614, endX + 11, 623, violet, 4);
    }
  });
}

function drawLane(c, lane, s) {
  const r = records[lane];
  const draft = lane === 2 && s.readingResult === 0;
  c.save();
  c.translate(laneWidth * (lane - s.pan), 0);
  crop(c, 0, 114, laneWidth, 966);
  const paper = c.createLinearGradient(0, 0, laneWidth, 80);
  if (lane === 1) {
    paper.addColorStop(0, '#eae5ed');
    paper.addColorStop(0.05, '#f2eef4');
    paper.addColorStop(1, '#f6f1f5');
  } else {
    paper.addColorStop(0, '#fcf9f0');
    paper.addColorStop(0.94, '#faf6ed');
    paper.addColorStop(1, '#eee8de');
  }
  rect(c, 0, 114, laneWidth, 966, paper);
  line(c, 1, 114, 1, 1080, '#bdb5bc');
  runHeading(c, r, s, draft);

  c.save();
  crop(c, 0, 290, laneWidth, mix(655, 391, s.retrieval));
  const travel = 461;
  c.translate(0, -travel * s.question);
  if (s.question < 1) outputs(c, r, s, lane === 1);
  if (s.question > 0) {
    c.translate(0, travel);
    questionSpecimen(c, r, s.mark, lane === 2 ? s.key : 1);
  }
  c.restore();

  if (s.retrieval > 0) {
    layer(c, s.retrieval, () => {
      line(c, 90, 690, 868, 690, '#c6bdc3');
      c.save();
      c.translate(0, (1 - s.retrieval) * 110);
      if (!draft) retrievalResult(c, r, s);
      c.restore();
    });
  }
  showCopy(c, r, s);
  c.restore();
}

function sourceStrip(c, amount) {
  if (amount === 0) return;
  const top = mix(1082, 694, amount);
  rect(c, 0, top, 1920, 440, '#30293d');
  type(c, 'mlflow_local_lab.py   /   retrieve', 90, top + 72, 36, mono, '#e0d9e9');
  const syntax = [
    ['return ', '#d0b8fd'], ['["DOC-12"]', '#fff7e6'], [' if ', '#d0b8fd'],
    ['question == ', '#fffaf4'], ['"' + lookupKey.slice(0, -1), '#fff7e6'],
    ['?', '#ffac82'], ['"', '#fff7e6'], [' else ', '#d0b8fd'], ['[]', '#fffaf4'],
  ];
  let x = 91;
  for (const [fragment, color] of syntax) {
    x += type(c, fragment, x, top + 164, 40, mono, color);
  }
}

function draw(c, clock) {
  const s = frameState(clock);
  rect(c, 0, 0, 1920, 1080, '#faf6ee');
  for (let i = 0; i < records.length; i++) {
    if (i - s.pan < 2 && i + 1 > s.pan) drawLane(c, i, s);
  }
  sourceStrip(c, s.code);
  heading(c, s.commitFocus);
}

function check() {
  // Replay the two traced functions for the variant all three requests used.
  for (const record of records) {
    const retrieved = record.question === lookupKey ? ['DOC-12'] : [];
    const predicted = { text: '30 days', citations: retrieved };
    if (record.variant !== 'valid' || JSON.stringify(retrieved) !== JSON.stringify(record.retrieved) ||
        JSON.stringify(predicted) !== JSON.stringify(record.prediction)) {
      throw new Error('The response disagrees with the recorded trace for ' + record.name);
    }
  }
  const [a, b, replay] = records;
  if (b.question + '?' !== a.question || a.question !== replay.question ||
      new Set(records.map(r => r.run)).size !== 3 || new Set(records.map(r => r.trace)).size !== 3) {
    throw new Error('The replay must restore one character in a separate run and trace.');
  }
}

export default { title: 'MLflow and the missing citation', beats, draw, check };
