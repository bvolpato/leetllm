import assert from 'node:assert/strict';
import { drawComic } from '../../../director-cuts/lessons/instruction-masking/comic.mjs';
import {
  TOKENS,
  TOKEN_IDS,
  ASSISTANT_TARGETS,
  CHECKPOINT as cp,
} from '../../../films/instruction-masking/fixtures.mjs';
import {
  C,
  rect,
  txt,
  line,
  circle,
  arrow,
  top,
  micro,
  note,
  tape,
  table,
  bracket,
  tag,
  cue,
  gauge,
} from './studio.mjs';

function opening(g, k) {
  top(g, k, 'THE CONVERSATION', 'Which “is” earns a training mark?');
  const id = cue(k, 0, 'Both have token ID'),
    reply = cue(k, 1, 'The one in the reply'),
    skip = cue(k, 1, 'minus one hundred');
  const ending = cue(k, 2, 'end-of-turn marker'),
    all = cue(k, 2, 'Count the four marks');
  g.save();
  g.translate(96, 124);
  g.scale(1.05, 1.05);
  drawComic(g, Math.min(k.seconds, 4), Math.min(1, k.seconds / 3));
  g.restore();
  for (const [side, words] of [
    ['Owner', TOKENS.slice(1, 5)],
    ['Sitter', TOKENS.slice(6, 9)],
  ]) {
    const right = side === 'Sitter',
      x = right ? 604 : 139,
      w = right ? 459 : 417;
    rect(g, x, 170, w, 126, C.white, C.ink, 2);
    micro(g, side.toUpperCase() + (right ? '  /  ASSISTANT' : '  /  USER'), x + 16, 190);
    let cursor = x + 15;
    const pieces = right && ending > 0 ? [...words, 'EOT'] : words;
    pieces.forEach((word, i) => {
      const tokenIndex = (right ? 6 : 1) + i;
      const size = word === 'EOT' ? 22 : 33;
      g.font = '500 ' + size + 'px "Lesson Serif"';
      const width = g.measureText(word).width;
      const marked = right && ASSISTANT_TARGETS[tokenIndex] && (i === 1 ? reply : all);
      if (marked) {
        rect(g, cursor - 2, 219, width + 5, 36, C.sea);
        line(g, cursor, 257, cursor + width, 257, C.teal, 3);
      }
      txt(g, word, cursor, 236, size, C.ink, 'left', 'Serif', 500);
      if (word === 'is' && id > 0)
        line(g, cursor, 258, cursor + width * id, 258, marked ? C.teal : C.dim, 3);
      cursor += width + 9;
    });
    if (id > 0)
      txt(
        g,
        '“is”  ID ' +
          TOKEN_IDS[right ? 7 : 2] +
          '   /   ' +
          (right ? (reply ? 'label 102' : 'label ?') : skip ? 'label −100' : 'label ?'),
        x + 16,
        277,
        18,
        right && reply ? C.teal : C.dim,
        'left',
        'Mono',
      );
  }
  if (all) note(g, 'Four targets in the sitter’s turn', 642, C.teal);
}
function key(g, x, y) {
  circle(g, x, y, 28, C.gold, C.ink, 3);
  circle(g, x - 5, y, 9, C.paper, C.ink, 2);
  rect(g, x + 24, y - 7, 84, 14, C.gold, C.ink, 3);
  rect(g, x + 79, y + 5, 12, 13, C.gold, C.ink, 2);
}
function policy(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'EVIDENCE  /  P-14',
    b === 1 || b === 2
      ? 'A target changes the next prediction'
      : 'What answer does the policy support?',
  );
  if (b === 1 || b === 2) {
    const step = cue(k, 2, 'A descent step'),
      logits = [Math.log(0.25) + 0.4 * 0.75 * step, Math.log(0.75) - 0.4 * 0.75 * step],
      m = logits.map(Math.exp),
      p = m[0] / (m[0] + m[1]);
    micro(g, 'TOY CHOICE  /  INDEPENDENT LOGITS', 65, 205);
    txt(g, 'Open', 65, 295, 55, C.teal, 'left', 'Serif');
    txt(g, 'other', 1130, 295, 55, C.dim, 'right', 'Serif');
    rect(g, 65, 348, 1065, 68, C.rule);
    rect(g, 65, 348, 1065 * p, 68, C.teal);
    txt(g, p.toFixed(3), 80, 383, 32, C.white, 'left', 'Mono');
    txt(g, (1 - p).toFixed(3), 1112, 383, 32, C.ink, 'right', 'Mono');
    if (b === 2) {
      txt(g, 'Target     1     0', 70, 487, 25, C.ink, 'left', 'Mono');
      txt(g, 'Initial gradient    −0.75    +0.75', 500, 487, 25, C.ink, 'left', 'Mono');
      note(g, 'One descent step with a learning rate of 0.4', 566);
    }
    return;
  }
  key(g, 104, 226);
  txt(g, 'Service key', 250, 224, 38, C.ink, 'left', 'Serif');
  txt(g, 'P-14  /  ticket required above 14 days', 70, 316, 27, C.ink);
  const age = 18;
  const at = (d) => 82 + d * 47;
  line(g, at(0), 394, at(22), 394, C.rule, 7);
  line(g, at(14), 394, at(22), 394, C.red, 7);
  for (const d of [0, 7, 14, 18, 22]) {
    line(g, at(d), 384, at(d), 408, C.ink);
    txt(g, d, at(d), 435, 21, C.dim, 'center', 'Mono');
  }
  circle(g, at(age), 394, 10, C.ink);
  txt(g, 'key age', at(age), 360, 20, C.ink, 'center');
  if (b === 0) note(g, 'Which action does the clause require?', 550);
  else {
    tag(
      g,
      b === 3 ? 'Incorrect training target' : 'Evidence-supported training target',
      70,
      500,
      322,
      C.dark,
    );
    note(
      g,
      b === 3
        ? '“No ticket required.”   This target contradicts P-14.'
        : '“Open a rotation ticket before further use.”',
      575,
      b === 3 ? C.red : C.teal,
    );
  }
}
function studies(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'TRAINING STUDIES',
    b < 2 ? 'What changed during adaptation?' : 'Retest both capabilities',
  );
  if (b === 0) {
    micro(g, 'INSTRUCTGPT', 60, 205);
    micro(g, 'FLAN', 60, 414);
    const approach = (y, labels, shown) => {
      labels.forEach((s, i) => {
        const x = 60 + i * 360;
        if (i < shown) {
          rect(g, x, y, 286, 77, i === 0 ? C.white : C.sea, C.rule);
          txt(g, s, x + 143, y + 39, 30, C.ink, 'center', 'Serif', 500, 264);
        }
        if (i + 1 < shown) arrow(g, x + 296, y + 39, x + 347, y + 39, C.teal);
      });
    };
    approach(
      238,
      ['Demonstrations', 'Reward model', 'PPO'],
      1 + Number(cue(k, 0, 'reward model') > 0) + Number(cue(k, 0, 'O used its scores') > 0),
    );
    if (cue(k, 0, 'instruction-formatted tasks'))
      approach(446, ['Instruction tasks', 'Train on examples', 'Test held-out tasks'], 3);
    return;
  }
  if (b === 1) {
    const count = Math.floor(1000 * cue(k, 1, 'Each square stands', 2));
    for (let i = 0; i < 1000; i++)
      rect(
        g,
        60 + (i % 50) * 13,
        215 + Math.floor(i / 50) * 15,
        9,
        11,
        i < count ? C.teal : C.fade,
      );
    micro(g, 'CURATED DEMONSTRATIONS', 60, 540);
    txt(g, String(count), 780, 294, 68, C.teal, 'left', 'Serif');
    txt(g, '65B LLaMA', 780, 376, 39, C.ink, 'left', 'Serif');
    txt(g, 'Supervised adaptation', 780, 432, 23);
    return;
  }
  if (b === 2) {
    table(
      g,
      ['Held-out task', 'Before', 'After adaptation'],
      [
        ['Policy', 'baseline', 'improves ↑'],
        ['Coding', 'baseline', 'declines ↓'],
      ],
      { y: 210, rowH: 90, colors: (r, c) => (c === 2 ? (r ? C.red : C.teal) : C.ink) },
    );
    note(g, 'Illustrative change with the same inputs and decoding', 548);
    return;
  }
  table(
    g,
    ['Experiment', 'Where replay enters', 'What to compare'],
    [
      ['InstructGPT', 'RL stage', 'pretraining gradients'],
      ['Your SFT run', 'demonstration mixture', 'held-out task scores'],
    ],
    { y: 220, rowH: 95, fractions: [0.23, 0.37, 0.4] },
  );
}
function merge(g, k) {
  top(g, k, 'SERIALIZATION', 'Thread four turns onto one strip');
  const turns = [
    ['User', 'How is my dog?', 0, 5],
    ['Assistant', 'She is happy.', 5, 10],
    ['User', 'Why?', 10, 12],
    ['Assistant', 'She is playing.', 12, 17],
  ];
  const flat = cue(k, 0, 'A chat template', 1.5);
  const idsVisible = cue(k, 1, 'Each position carries') > 0;
  const spokenTurns = ['user asks', 'assistant answers', 'user follows', 'assistant replies'].map(
    (p) => cue(k, 0, p),
  );
  turns.forEach(([name, s, lo, hi], i) => {
    if (i > 0 && !spokenTurns[i]) return;
    const x = 60 + i * 272;
    rect(g, x, 190, 252, 112, i % 2 ? C.sea : C.white);
    micro(g, name.toUpperCase(), x + 13, 215);
    txt(g, s, x + 13, 258, 27, C.ink, 'left', 'Serif', 500, 227);
    const dest = 55 + (1090 * (lo + hi)) / 34;
    line(g, x + 126, 302, x + 126 + (dest - x - 126) * flat, 302 + 102 * flat, C.dim, 2);
  });
  if (flat > 0) {
    tape(g, TOKENS, 420, {
      fill: (i) => (ASSISTANT_TARGETS[i] ? C.sea : C.white),
      ids: idsVisible ? TOKEN_IDS : null,
    });
    note(g, 'One stream in conversation order', 590);
  }
}
const tails = [
  ['Known reply', 'assistant', 'Open ticket', 'end'],
  ['Fresh generation', 'assistant', '', null],
  ['Assistant prefill', 'assistant', '{"rotation_window_days":', null],
];
function modes(g, k) {
  top(g, k, 'SERIALIZATION  /  THREE TAILS', 'Where will generation continue?');
  micro(g, 'SHARED PREFIX', 60, 195);
  micro(g, 'TAIL', 534, 195);
  const entered = ['Training writes', 'Fresh generation writes', 'Assistant prefill writes'].map(
    (p) => cue(k, 0, p, 0.7),
  );
  tails.forEach(([name, role, payload, end], i) => {
    const y = 225 + i * 95;
    txt(g, name, 58, y + 27, 23, C.ink, 'left', 'Sans', 600, 210);
    rect(g, 291, y, 211, 54, C.fade);
    txt(g, 'P-14  ·  age 18?', 397, y + 27, 21, C.ink, 'center', 'Mono');
    line(g, 502, y + 27, 529, y + 27);
    if (!entered[i]) return;
    rect(g, 532, y, 115, 54, C.dark);
    txt(g, role, 589, y + 27, 18, C.white, 'center', 'Mono');
    const endX = 654 + (payload ? Math.min(355, payload.length * 12 + 20) : 0);
    if (payload) txt(g, payload, 655, y + 27, 23, C.ink, 'left', 'Mono', 400, endX - 657);
    if (end) tag(g, end, endX + 10, y + 8, 68);
    else line(g, endX + 5, y + 6, endX + 5, y + 47, C.teal, 4);
  });
  const b = k.beat.beatIndex;
  if (b === 1 || b === 2) {
    tag(g, 'New message  ON', 59, 539, 215, C.dark);
    tag(g, 'Continue final  ON', 297, 539, 244, C.dark);
    arrow(g, 553, 557, 639, 557);
    txt(
      g,
      b === 2 ? 'Conflicting intents: reject' : '?',
      659,
      557,
      32,
      b === 2 ? C.red : C.ink,
      'left',
      'Serif',
    );
  } else if (b >= 3) {
    const completed = cue(k, 3, 'When it finishes') > 0;
    txt(
      g,
      completed ? '{"rotation_window_days": 14}' : '{"rotation_window_days":',
      59,
      557,
      30,
      C.teal,
      'left',
      'Mono',
    );
    txt(
      g,
      b === 4
        ? 'Check endpoint support'
        : completed
          ? 'Parse → validate → check P-14'
          : 'Continue at the open field',
      1127,
      557,
      24,
      C.dim,
      'right',
    );
  }
}
const lanes = [cp.prefixIds.concat(cp.answerIds), cp.prefixIds, cp.prefixIds.concat(cp.prefillIds)];
function checkpoint(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'PINNED TOKENIZER  /  MISTRAL-7B-INSTRUCT-v0.1',
    b < 4 ? 'Count the tokens after the shared prefix' : 'Inspect the beginning and the delimiters',
  );
  if (b < 4) {
    const show = b >= 2;
    const cells = 17,
      x = 190;
    const counts = [
      44 + 9 * Number(cue(k, 2, 'fifty-three IDs') > 0),
      44,
      44 + 8 * Number(cue(k, 2, 'fifty-two') > 0),
    ];
    lanes.forEach((ids, r) => {
      const y = 226 + r * 101;
      txt(g, ['Training', 'Fresh', 'Prefill'][r], 57, y + 18, 23, C.ink);
      ids
        .slice(0, counts[r])
        .forEach((v, i) =>
          rect(g, x + i * cells, y, cells - 2, 40, i < 44 ? C.rule : v === 2 ? C.gold : C.teal),
        );
      if (show || r === 1) txt(g, counts[r], 1125, y + 20, 28, C.ink, 'right', 'Mono');
    });
    bracket(g, x, x + 44 * cells - 2, 202, 'One instruction block and BOS');
    note(
      g,
      b >= 3
        ? 'The fresh row ends at the closing instruction delimiter.'
        : b === 2 && counts[0] === lanes[0].length
          ? counts[2] === lanes[2].length
            ? 'The gold cell is EOS. The prefill remains open.'
            : 'The gold cell closes the training answer.'
          : 'Two newline IDs separate the evidence and the user question.',
      565,
    );
  } else if (b === 4) {
    table(
      g,
      ['Path', 'First IDs'],
      [
        ['Template tokenization', cp.prefixIds.slice(0, 4).join('  ')],
        ['Render, then encode once', cp.prefixIds.slice(0, 4).join('  ')],
        ['Add special tokens again', [1, ...cp.prefixIds.slice(0, 4)].join('  ')],
      ],
      {
        y: 212,
        rowH: 79,
        fractions: [0.51, 0.49],
        colors: (r, c) => (r === 2 && c === 1 ? C.red : C.ink),
      },
    );
    note(g, 'Count the beginning token after the actual tokenization path.', 552);
  } else {
    micro(g, 'OPENING DELIMITER', 64, 208);
    tape(g, cp.prefixPieces.slice(1, 4), 248, {
      x: 60,
      w: 410,
      ids: cp.prefixIds.slice(1, 4),
      number: false,
    });
    micro(g, 'CLOSING DELIMITER', 562, 208);
    tape(g, cp.prefixPieces.slice(40), 248, {
      x: 555,
      w: 575,
      ids: cp.prefixIds.slice(40),
      number: false,
    });
    txt(g, '3 pieces', 65, 429, 42, C.ink, 'left', 'Serif');
    txt(g, '4 pieces', 560, 429, 42, C.ink, 'left', 'Serif');
    note(g, 'A dot marks a leading space in a vocabulary piece.', 561);
  }
}
export const press = [opening, policy, studies, merge, modes, checkpoint];
export function checkPress() {
  assert.equal(TOKEN_IDS[2], 102);
  assert.equal(TOKEN_IDS[7], 102);
  assert.deepEqual(ASSISTANT_TARGETS.slice(6, 10), [true, true, true, true]);
  assert.equal(ASSISTANT_TARGETS[2], false);
  assert.deepEqual(
    lanes.map((v) => v.length),
    [53, 44, 52],
  );
  assert.equal(lanes[0].at(-1), 2);
  assert.notEqual(lanes[2].at(-1), 2);
  assert.deepEqual(cp.prefixIds.slice(20, 22), [13, 13]);
  assert.deepEqual(cp.prefixIds.slice(-4), [733, 28748, 16289, 28793]);
  assert.deepEqual(
    tails.map((r) => Boolean(r[3])),
    [true, false, false],
  );
}
