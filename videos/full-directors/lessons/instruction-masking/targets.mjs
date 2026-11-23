import assert from 'node:assert/strict';
import {
  TOKENS as words,
  TOKEN_IDS as ids,
  ASSISTANT_TARGETS as reply,
  CHECKPOINT as cp,
} from '../../../films/instruction-masking/fixtures.mjs';
import { lossTerms } from '../../../films/instruction-masking/arithmetic.mjs';
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
  dataRow,
  fmtLabel,
  activeColor,
} from './studio.mjs';
const targetLabels = (mode) =>
  ids.map((v, i) =>
    (mode === 'all' ? i > 0 : mode === 'assistant' ? reply[i] : false) ? v : -100,
  );
function shift(g, k) {
  const b = k.beat.beatIndex;
  top(g, k, 'LOSS ALIGNMENT  /  ONE CAUSAL SHIFT', 'Which logit predicts the highlighted token?');
  let pred = 5;
  if (b === 2) {
    pred = 6 + Number(cue(k, 2, 'is predicts happy') > 0) + Number(cue(k, 2, 'happy predicts') > 0);
  }
  const solved = cue(k, 1, 'Position five', 0);
  const t = tape(g, words.slice(0, 10), 251, {
    x: 60,
    w: 1080,
    ids: ids.slice(0, 10),
    fill: (i) => (i === pred + 1 ? C.sea : C.white),
  });
  if (solved)
    bracket(g, t.x, t.x + t.step * (pred + 1), 224, 'Input available to this prediction', C.dim);
  if (solved) {
    arrow(g, t.at(pred), 378, t.at(pred + 1), 457, C.teal, 4);
    txt(g, 'logit ' + pred, t.at(pred) - 10, 381, 20, C.ink, 'right', 'Mono');
    txt(g, 'target ID ' + ids[pred + 1], t.at(pred + 1), 489, 20, C.teal, 'center', 'Mono');
  } else txt(g, '?   →   She', 610, 446, 42, C.ink, 'center', 'Serif');
  note(
    g,
    b === 3
      ? 'Model shifts internally: aligned labels. Raw cross-entropy: pair once.'
      : solved
        ? '“' + words[pred] + '” predicts “' + words[pred + 1] + '” at position ' + (pred + 1) + '.'
        : 'The observed word is at 6. Which position predicted it?',
    568,
  );
}
function dogRow(g, labels, y = 240) {
  const r = tape(g, words, y, { ids, fill: (i) => (reply[i] ? C.sea : C.white) });
  micro(g, 'LABEL AT TOKEN POSITION', 56, y + 153);
  labels.forEach((v, i) =>
    txt(g, fmtLabel(v), r.at(i), y + 196, 19, activeColor(v), 'center', 'Mono', 500, r.step - 4),
  );
  return r;
}
const secondShe = words.lastIndexOf('She');
const secondReplyPositions = [secondShe - 2, secondShe - 1, secondShe];

function secondReplyDetail(g, k) {
  const labels = targetLabels('assistant');
  const pair = cue(k, 3, 'Trace She', 0.65);
  const trace = cue(k, 3, 'follow the input', 2);
  const answered = k.beat.beatIndex === 3 && k.elapsed >= k.wordCue('Yes').end;
  const rail = tape(g, ['Earlier tokens', ...secondReplyPositions.map((i) => words[i])], 233, {
    x: 233,
    w: 912,
    indices: false,
    fill: (i) => (i === 3 ? C.sea : C.white),
  });
  const headings = [
    `Positions 0–${secondReplyPositions[0] - 1}`,
    ...['User word', 'Assistant header', 'Reply word'].map(
      (role, i) => `${secondReplyPositions[i]} · ${role}`,
    ),
  ];
  headings.forEach((heading, i) => {
    txt(g, heading, rail.at(i), 207, 24, C.ink, 'center', 'Sans', 600, rail.step - 12);
  });
  txt(g, 'Input ID', 56, 355, 26, C.ink, 'left', 'Sans', 600);
  txt(g, 'Loss label', 56, 482, 26, C.ink, 'left', 'Sans', 600);
  txt(g, '…', rail.at(0), 355, 34, C.dim, 'center', 'Mono');
  txt(g, '…', rail.at(0), 482, 34, C.dim, 'center', 'Mono');
  secondReplyPositions.forEach((position, i) => {
    const x = rail.at(i + 1);
    const label = labels[position];
    txt(g, ids[position], x, 355, 34, C.ink, 'center', 'Mono');
    txt(g, fmtLabel(label), x, 482, 34, activeColor(label), 'center', 'Mono');
  });
  line(g, rail.at(3) - 35, 512, rail.at(3) + 35, 512, C.teal, 4);

  const logit = rail.at(2);
  const target = rail.at(3);
  if (pair) {
    rect(g, logit - 64, 392, 128, 36, C.gold);
    txt(g, 'logit ' + (secondShe - 1), logit, 410, 22, C.ink, 'center', 'Mono');
    const arrowStart = logit + 80;
    arrow(g, arrowStart, 411, arrowStart + (target - arrowStart) * pair, 411 + 45 * pair, C.teal, 4);
  }
  if (trace) {
    const prefixEnd = logit + rail.step / 2;
    const prefixStart = logit - rail.step / 2;
    const left = prefixStart + (rail.x - prefixStart) * trace;
    bracket(
      g,
      left,
      prefixEnd,
      174,
      trace === 1 ? 'Input available to the assistant header' : 'Tracing the prefix',
      C.dim,
    );
    const why = rail.at(1);
    if (left <= why - rail.step / 2) {
      line(g, why - 29, 378, why + 29, 378, C.dim, 4);
    }
  }
  note(
    g,
    trace === 1
      ? '“Why?” stays in the prefix even with a −100 label.'
      : answered
        ? 'Yes. Follow the input available to the assistant header.'
        : 'Can the second “She” use the earlier “Why?”',
    563,
  );
}

function mask(g, k) {
  const b = k.beat.beatIndex;
  top(g, k, 'TARGET SELECTION  /  MULTI-TURN', 'Which tokens are inputs? Which are targets?');
  const compareCopies = cue(k, 3, 'Look at the word is', 0);
  if ((b === 2 || b === 3) && !compareCopies) {
    secondReplyDetail(g, k);
    return;
  }

  const questionWords = cue(k, 1, 'skip the words in the questions');
  const headers = cue(k, 1, 'Skip the role headers');
  const replaceLabels = b > 1 || (b === 1 && k.elapsed >= k.wordCue('Minus one hundred').end);
  const keepReplies = cue(k, 1, 'Keep the words in both replies');
  const counted = b > 1 || (b === 1 && k.elapsed >= k.wordCue('eight altogether').end);
  const labels = replaceLabels ? targetLabels('assistant') : ids;
  const rail = tape(g, words, 233, { ids });
  micro(g, 'LOSS LABEL AT TOKEN POSITION', 56, 388);
  const sharedId = ids[words.indexOf('is')];
  labels.forEach((label, i) => {
    const isHeader = words[i] === '<U>' || words[i] === '<A>';
    const mark = reply[i] ? keepReplies : isHeader ? headers : questionWords;
    const x = rail.at(i);
    if (mark) {
      g.save();
      g.globalAlpha = mark;
      rect(g, x - rail.step / 2 + 2, 412, rail.step - 4, 44, reply[i] ? C.sea : C.rose);
      g.restore();
    }
    txt(g, fmtLabel(label), x, 434, 22, label === -100 ? C.dim : C.ink, 'center', 'Mono');
    if (compareCopies && ids[i] === sharedId) {
      line(g, x - 15, 310, x + 15, 310, C.ink, 3);
      line(g, x - 15, 467, x + 15, 467, reply[i] ? C.teal : C.red, 4);
    }
  });
  if (compareCopies) {
    note(g, `Same input ID, ${sharedId}. Compare its label in the question and the replies.`, 563);
  } else if (counted) {
    const count = labels.filter((label) => label !== -100).length;
    note(g, `${count} scored targets · ${ids.length} input positions`, 563);
  } else {
    note(g, replaceLabels ? 'Only the loss labels changed.' : 'Start with a copy of each input ID.', 563);
  }
}
function objective(g, k) {
  const b = k.beat.beatIndex;
  const empty = cue(k, 3, 'ignores every target') > 0;
  const mode = empty ? 'none' : b >= 1 ? 'all' : 'assistant';
  const labels = targetLabels(mode);
  const count = labels.filter((v) => v !== -100).length;
  top(g, k, 'LOSS REDUCTION', 'Which terms enter the mean?');
  const rail = tape(g, words, 227, { fill: (i) => (labels[i] === -100 ? C.fade : C.sea) });
  labels.forEach((v, i) => {
    if (v !== -100) line(g, rail.at(i), 344, rail.at(i), 374, C.teal, 4);
  });
  const name =
    mode === 'none' ? 'Empty mask' : mode === 'all' ? 'Full transcript' : 'Assistant-only';
  micro(g, name.toUpperCase(), 60, 414);
  if (count) {
    txt(g, 'Sum of selected −ln p(observed token)', 62, 476, 35, C.ink, 'left', 'Serif');
    line(g, 61, 508, 734, 508, C.ink, 3);
    txt(g, count + ' scored targets', 393, 553, 34, C.teal, 'center', 'Serif');
    txt(g, '17 inputs', 1127, 484, 31, C.dim, 'right');
  } else {
    txt(g, '0 selected terms  /  0 targets', 60, 488, 40, C.red, 'left', 'Mono');
    note(g, 'Reject the empty mean before the update.', 565, C.red);
  }
}
function compiled(g, k) {
  const b = k.beat.beatIndex;
  if (b < 4) {
    const first = cp.prefixIds.length,
      labs = [-100, ...cp.answerIds],
      show = b > 0;
    top(
      g,
      k,
      `CHECKPOINT LABELS  /  ${first + cp.answerIds.length} POSITIONS`,
      'Which logit predicts each reply token?',
    );
    const r = tape(g, [cp.prefixPieces.at(-1), ...cp.answerPieces], 253, {
      x: 215,
      w: 930,
      start: first - 1,
      ids: [cp.prefixIds.at(-1), ...cp.answerIds],
      fill: (i) => (i && show ? C.sea : C.white),
    });
    if (show) bracket(g, r.x + r.step, r.end, 226, 'Annotated assistant branch, including EOS');
    if (b >= 2) {
      micro(g, 'UNSHIFTED LABELS', 56, 451);
      labs.forEach((v, i) =>
        txt(g, fmtLabel(v), r.at(i), 451, 23, activeColor(v), 'center', 'Mono'),
      );
    }
    if (b === 3) {
      const final = cue(k, 3, 'period at fifty-one') > 0;
      const j = final ? 8 : 0;
      rect(g, r.at(j) - 39, 380, 78, 30, C.gold);
      txt(g, 'logit ' + (43 + j), r.at(j), 395, 17, C.ink, 'center', 'Mono');
      arrow(g, r.at(j) + 15, 414, r.at(j + 1) - 5, 434, C.teal);
      line(g, r.at(j + 1) - 31, 475, r.at(j + 1) + 31, 475, C.teal, 3);
      note(
        g,
        final
          ? '51 predicts EOS at 52. The final logit has no next target.'
          : 'The bracket at 43 predicts Open at 44.',
        585,
      );
    } else
      note(
        g,
        b === 2
          ? 'Nine target labels. Which earlier logit predicts the first one?'
          : 'The generation annotation preserves the serialized input IDs.',
        568,
      );
  } else {
    top(g, k, `TOY CONVERSATION  /  ${ids.length} POSITIONS`, 'Which replies receive loss?');
    const completionOnly = cue(k, 4, 'put the history in the prompt', 0);
    const labels = replyLabels(completionOnly);
    const r = dogRow(g, labels);
    if (completionOnly) {
      bracket(g, r.x, r.x + 13 * r.step, 210, 'Prompt and earlier reply');
      bracket(g, r.x + 13 * r.step, r.end, 210, 'Completion');
      note(g, 'The earlier reply remains readable while only the final answer earns loss.', 552);
    } else {
      bracket(g, r.x + 6 * r.step, r.x + 10 * r.step, 210, 'First reply');
      bracket(g, r.x + 13 * r.step, r.end, 210, 'Second reply');
      note(g, 'Both replies contribute their words and endings.', 552);
    }
  }
}
function replyLabels(completionOnly) {
  return ids.map((id, i) => (reply[i] && (!completionOnly || i >= 13) ? id : -100));
}
const loss = lossTerms();
const tokens = ['<U>', 'question', '<A>', 'Open', 'ticket', 'end'];
const selectedTargets = [3, 4, 5];
function scoredPairs(offset) {
  return selectedTargets.map((target) => ({ logit: target - offset, target }));
}

function wrongShift(g, offset) {
  const pairs = scoredPairs(offset);
  const rail = tape(g, tokens, 221, {
    fill: (i) => (pairs.some(({ logit }) => logit === i) ? C.gold : C.white),
  });
  micro(g, offset === 0 ? 'ZERO SHIFTS' : 'TWO SHIFTS', 56, 185);
  for (const { logit, target } of pairs) {
    txt(g, 'logit ' + logit, rail.at(logit), 369, 21, C.ink, 'center', 'Mono');
    arrow(g, rail.at(logit), 392, rail.at(target), 466, C.red, 4);
    txt(g, tokens[target], rail.at(target), 492, 30, C.red, 'center', 'Serif');
    txt(g, 'position ' + target, rail.at(target), 528, 17, C.dim, 'center', 'Mono');
  }
  micro(g, 'SCORED TARGETS', 56, 492);
  note(
    g,
    offset === 0
      ? 'Open predicts itself. Its input already contains the answer.'
      : 'The header skips over Open. Open still receives a score from the question.',
    580,
  );
}
function construction(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'LOSS ARITHMETIC  /  TOY LOGITS',
    b === 2 || b === 3
      ? 'What did it cost to predict “Open ticket”?'
      : 'Align the loss with its predictor',
  );
  if (b === 2 || b === 3) {
    const reveals = ['one half', 'one quarter', 'four fifths'].map((w) => cue(k, 2, w));
    scoredPairs(1).forEach(({ logit, target }, i) => {
      const y = 239 + i * 88;
      txt(g, tokens[logit] + ' → ' + tokens[target], 59, y, 26, C.ink, 'left', 'Serif');
      if (reveals[i]) {
        txt(g, 'p = ' + loss.probabilities[i], 356, y, 23, C.ink, 'left', 'Mono');
        g.save();
        g.globalAlpha = reveals[i];
        gauge(g, 540, y - 12, 380, loss.terms[i] / 1.5, C.teal, 24);
        g.restore();
        txt(g, loss.terms[i].toFixed(3) + ' nats', 1127, y, 23, C.ink, 'right', 'Mono');
      }
    });
    if (b === 3) {
      const summed = cue(k, 3, 'Divide by three', 0),
        mean = cue(k, 3, 'Only the scored targets', 0);
      if (summed) {
        micro(g, 'USING UNROUNDED LOSSES', 58, 506);
        note(
          g,
          'Sum ≈ ' +
            loss.sum.toFixed(3) +
            ' nats' +
            (mean
              ? '     Mean over ' + loss.count + ' targets ≈ ' + loss.mean.toFixed(3) + ' nats'
              : ''),
          548,
          C.teal,
        );
      }
    }
    return;
  }
  if (cue(k, 4, 'Skip the shift', 0)) {
    wrongShift(g, cue(k, 5, 'Shift twice', 0) ? 2 : 0);
    return;
  }
  const r = tape(g, tokens, 234, { fill: (i) => (selectedTargets.includes(i) ? C.sea : C.white) });
  const backward = b === 4;
  micro(g, backward ? 'DIRECT GRADIENT AT LOGITS' : 'UNSHIFTED LABEL AT TOKEN', 57, 394);
  tokens.forEach((t, i) => {
    const active = selectedTargets.includes(backward ? i + 1 : i);
    txt(
      g,
      backward ? (active ? 'nonzero' : '0') : active ? t : '−100',
      r.at(i),
      450,
      25,
      active ? C.teal : C.dim,
      'center',
      'Mono',
    );
  });
  if (b === 0 || b === 1)
    note(
      g,
      b === 0
        ? 'For the external loss, each predictor reads the following label.'
        : 'For an internal shift, supply labels in their original positions.',
      552,
    );
  else note(g, 'The header receives a gradient because it predicts Open.', 552);
}
const pad = {
  words: ['<A>', 'Open', 'ticket', 'EOS', 'PAD', 'PAD'],
  ids: [2, 3, 4, 5, 5, 5],
  valid: [1, 1, 1, 1, 0, 0],
  member: [0, 1, 1, 1, 0, 0],
};
function padLabels(mode) {
  return pad.ids.map((v, i) =>
    pad.valid[i] && pad.member[i] && (mode !== 'erase' || v !== 5) ? v : -100,
  );
}
function padding(g, k) {
  const b = k.beat.beatIndex;
  const erase = cue(k, 0, 'erases every five') > 0,
    solved = cue(k, 2, 'Keep the first five') > 0;
  top(g, k, 'COLLATION  /  SHARED EOS AND PAD ID', 'Which of the three fives belongs in the loss?');
  const labels = padLabels(solved ? 'span' : 'erase');
  const r = tape(g, pad.ids, 225, {
    x: 252,
    w: 885,
    h: 91,
    ids: pad.words,
    number: false,
    fill: (i) => (solved && i === 3 ? C.sea : C.white),
  });
  micro(g, 'ID / TOKEN', 58, 268);
  if (b > 0) {
    bracket(g, r.x, r.x + 4 * r.step, 195, 'Valid positions');
    dataRow(g, 'Valid', pad.valid, r, 370);
    dataRow(g, 'In reply', pad.member, r, 425);
    rect(g, r.x + r.step, 453, r.step * 3, 11, C.teal);
    line(g, r.x + 4 * r.step, 448, r.x + 4 * r.step, 472, C.teal, 3);
    micro(g, 'REPLY SPAN', 58, 458);
  }
  const show = pad.ids.map((v, i) => (i >= 3 && !erase ? '?' : fmtLabel(labels[i])));
  dataRow(g, 'Loss label', show, r, 523, { size: 27, color: (i) => activeColor(labels[i]) });
  if (erase && !solved) {
    for (const i of [3, 4, 5]) line(g, r.at(i) - 36, 549, r.at(i) + 36, 549, C.red, 3);
  }
  if (solved) line(g, r.at(3) - 31, 549, r.at(3) + 31, 549, C.teal, 5);
  note(
    g,
    solved
      ? 'Keep the valid EOS. Both pads remain ignored.'
      : b > 0
        ? 'Use the two flags to repair the erased ending.'
        : erase
          ? 'The ID-only filter erased the genuine ending.'
          : 'Compare the real ending with the two pads.',
    600,
    solved ? C.teal : C.ink,
  );
}
export function budget(g, { prompt, reserve, limit }) {
  const total = prompt + reserve,
    scale = 1050 / (limit * 1.075),
    x = 65,
    y = 326;
  micro(g, 'SERIALIZED PROMPT', x, 224);
  txt(g, String(prompt), x, 268, 48, C.ink, 'left', 'Serif');
  micro(g, 'REPLY RESERVE', 478, 224);
  txt(g, String(reserve), 478, 268, 48, C.ink, 'left', 'Serif');
  rect(g, x, y, prompt * scale, 74, C.teal);
  rect(g, x + prompt * scale, y, reserve * scale, 74, C.gold);
  line(g, x + limit * scale, y - 25, x + limit * scale, y + 104, C.red, 3);
  txt(g, 'limit ' + limit, x + limit * scale, y + 135, 23, C.red, 'center', 'Mono');
  note(
    g,
    prompt +
      ' + ' +
      reserve +
      ' = ' +
      total +
      '     /     ' +
      Math.abs(limit - total) +
      (total > limit ? ' over' : ' free'),
    552,
    total > limit ? C.red : C.teal,
  );
}
function truncation(g, k) {
  const b = k.beat.beatIndex;
  top(g, k, 'TRUNCATION', b < 3 ? 'What survives this cut?' : 'Will the prompt and reply fit?');
  if (b >= 3) {
    budget(g, { prompt: 7900, reserve: 500, limit: 8192 });
    return;
  }
  const sequence = ['P-14', 'age 18?', '<A>', 'Open', 'ticket', 'EOS'];
  const lo = b === 1 || b === 2 ? 1 : 0;
  const hi =
    b === 0
      ? cue(k, 0, 'Cutting after answer')
        ? 5
        : cue(k, 0, 'Cutting before every')
          ? 3
          : 6
      : 6;
  micro(g, 'ORIGINAL ROW', 60, 194);
  const r = tape(g, sequence, 230, { fill: (i) => (i >= lo && i < hi ? C.white : C.rose) });
  bracket(g, r.x + lo * r.step, r.x + hi * r.step, 422, 'Retained tokens');
  const targets = sequence
    .slice(lo, hi)
    .filter((v) => ['Open', 'ticket', 'EOS'].includes(v)).length;
  table(
    g,
    ['Targets', 'Ending', 'Policy evidence'],
    [[targets, hi === 6 ? 'present' : 'missing', lo ? 'missing' : 'present']],
    {
      y: 484,
      rowH: 65,
      colors: (r, c) =>
        c === 0 ? C.ink : (c === 1 && hi < 6) || (c === 2 && lo > 0) ? C.red : C.teal,
    },
  );
}
export const targets = [shift, mask, objective, compiled, construction, padding, truncation];
export function checkTargets() {
  assert.deepEqual(
    ['assistant', 'all', 'none'].map((m) => targetLabels(m).filter((v) => v !== -100).length),
    [8, 16, 0],
  );
  assert.deepEqual([words[5], words[6], words[8], words[9]], ['<A>', 'She', 'happy.', '<EOT>']);
  assert.deepEqual(secondReplyPositions.map((i) => words[i]), ['Why?', '<A>', 'She']);
  assert.deepEqual(secondReplyPositions.map((i) => ids[i]), [109, 105, 106]);
  const assistantLabels = targetLabels('assistant');
  assert.deepEqual(secondReplyPositions.map((i) => assistantLabels[i]), [-100, -100, 106]);
  assert.deepEqual(assistantLabels.filter((_, i) => words[i] === 'is'), [-100, 102, 102]);
  assert.equal(cp.prefixIds.length - 1, 43);
  assert.equal(cp.answerIds.length, 9);
  assert.deepEqual(ids.slice(6, 10), [106, 102, 107, 108]);
  assert.deepEqual(
    replyLabels(false).filter((id) => id !== -100),
    [106, 102, 107, 108, 106, 102, 110, 111],
  );
  assert.deepEqual(
    replyLabels(true).filter((id) => id !== -100),
    [106, 102, 110, 111],
  );
  assert.deepEqual([cp.answerIds[0], cp.answerIds.at(-1)], [5629, 2]);
  assert.deepEqual(
    scoredPairs(1).map(({ logit }) => logit),
    [2, 3, 4],
  );
  assert.deepEqual(
    scoredPairs(0).map(({ logit, target }) => [tokens[logit], tokens[target]]),
    [
      ['Open', 'Open'],
      ['ticket', 'ticket'],
      ['end', 'end'],
    ],
  );
  assert.deepEqual(
    scoredPairs(2).map(({ logit, target }) => [tokens[logit], tokens[target]]),
    [
      ['question', 'Open'],
      ['<A>', 'ticket'],
      ['Open', 'end'],
    ],
  );
  assert.deepEqual(padLabels('erase'), [-100, 3, 4, -100, -100, -100]);
  assert.deepEqual(padLabels('span'), [-100, 3, 4, 5, -100, -100]);
  assert.deepEqual(pad.ids.slice(3), [5, 5, 5]);
  assert.deepEqual(
    pad.valid.map((v, i) => v * pad.member[i]),
    [0, 1, 1, 1, 0, 0],
  );
  assert.equal(loss.mean.toFixed(6), '0.767528');
  assert.equal(loss.terms.indexOf(Math.max(...loss.terms)), 1);
  assert.equal(7900 + 500 - 8192, 208);
}
