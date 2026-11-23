import { sentenceWords, sequence0, sequence1 } from '../fixtures.mjs';
import { complete, event } from '../construction.mjs';
import { headFrame } from '../model.mjs';
import { numberGrid, target, text, wordTable } from '../defaults.mjs';

const numberedInput = [sequence0, sequence1];
const zeroInput = numberedInput.map((rows) => rows.map((row) => row.map(() => 0)));

function choices(ctx, api, frame, showPairs, showMeaning) {
  const { C } = api;
  text(
    ctx,
    api,
    'Both outputs  ·  (batch, head, word, feature) = (2, 2, 3, 2)',
    960,
    285,
    34,
    C.ink,
    'center',
  );
  text(
    ctx,
    api,
    'B sentences     T words     H heads     d = D // H features per head',
    960,
    347,
    29,
    C.muted,
    'center',
  );
  for (const [i, pair] of [frame.correctPair, frame.directPair].entries()) {
    const x = 500 + i * 920;
    const color = showMeaning ? (i === 0 ? C.green : C.pink) : C.blue;
    text(
      ctx,
      api,
      i === 0 ? 'x.reshape(B, T, H, d)' : 'x.reshape(B, H, T, d)',
      x,
      417,
      37,
      C.ink,
      'center',
    );
    if (i === 0) text(ctx, api, '.transpose(0, 2, 1, 3)', x, 483, 35, C.ink, 'center');
    text(ctx, api, 'head 0  ·  migrate', x, 617, 32, C.muted, 'center');
    numberGrid(
      ctx,
      api,
      [showPairs ? pair : ['?', '?']],
      x - 190,
      662,
      380,
      110,
      color,
      'candidate-' + i,
      { fontSize: 46 },
    );
    if (showMeaning)
      text(
        ctx,
        api,
        i === 0 ? 'migrate  ·  features 0 and 1' : 'These values belong to Birds',
        x,
        855,
        32,
        color,
        'center',
      );
  }
}

function replay(ctx, state, api, frame) {
  const { C } = api;
  const direct = event(state, 1, 'walk-direct-pairs');
  const rewind = event(state, 1, 'rewind-heads') > 0;
  const split = frame.split;
  const move = event(state, 1, 'move-head-axis');
  if (rewind && move > 0) {
    // Hold the first head in place so the rows stay easy to follow as the second head moves.
    target(ctx, api, 'head-layout', () => {
      text(ctx, api, 'Sentence 0', 565, 280, 33, C.ink, 'center');
      sentenceWords[0].forEach((word, row) =>
        text(ctx, api, word, 280, 405 + (row + 0.5) * 110 + 10, 27, C.ink, 'right'),
      );
      for (const [h, rows] of frame.correct[0].entries()) {
        const x = 305 + h * api.lerp(260, 990, move);
        const w = 260;
        text(ctx, api, 'head ' + h, x + w / 2, 365, 30, C.blue, 'center');
        numberGrid(ctx, api, rows, x, 405, w, 330, C.blue, 'moving-pairs-' + h, {
          fontSize: 38,
          highlights: [0, 1].map((column) => ({ row: 1, column, fill: C.panel, stroke: C.yellow })),
        });
      }
      if (complete(move)) {
        sentenceWords[0].forEach((word, row) =>
          text(ctx, api, word, 1270, 405 + (row + 0.5) * 110 + 10, 28, C.ink, 'right'),
        );
        text(ctx, api, '(B, T, H, d)   →   (B, H, T, d)', 960, 885, 40, C.ink, 'center');
      }
    });
    return;
  }
  const output = frame.direct[0];
  const position = rewind ? 0 : direct * 2;
  const placed = Math.floor(position);
  const t = Math.min(placed, 1);
  const pair = output[0][t];
  const active = position > 0 && position < 2;
  const selected = position > 0 ? pair : [];
  target(ctx, api, 'head-split', () =>
    wordTable(ctx, api, 0, sequence0, {
      pairs: selected.length
        ? [{ row: 0, first: sequence0[0].indexOf(pair[0]), color: C.yellow }]
        : [],
      split,
    }),
  );
  target(ctx, api, 'head-layout', () => {
    text(
      ctx,
      api,
      rewind ? 'Split each word, then move the head axis' : 'Read the next pair in flat order',
      1330,
      272,
      32,
      C.ink,
      'center',
    );
    for (let head = 0; head < 2; head++) {
      const x = 1115 + head * 346;
      text(ctx, api, 'head ' + head, x + 128, 365, 30, C.blue, 'center');
      const rows = output[head].map((values, row) =>
        values.map((v) => (head * 3 + row < placed ? v : '')),
      );
      numberGrid(ctx, api, rows, x, 405, 256, 330, C.blue, 'head-output-' + head, {
        fontSize: 36,
        highlights:
          head === 0 && selected.length
            ? [0, 1].map((column) => ({ row: t, column, stroke: C.yellow, fill: C.panel }))
            : [],
      });
    }
    sentenceWords[0].forEach((word, r) =>
      text(ctx, api, word, 1094, 405 + (r + 0.5) * 110 + 10, 28, C.ink, 'right'),
    );
    if (active) {
      // A copy of the active pair travels in the clear lane below the two views.
      const phase = position - placed;
      const inputHead = (sequence0.flat().indexOf(pair[0]) % 4) / 2;
      const x = api.lerp(305 + inputHead * 260, 1115, phase);
      numberGrid(ctx, api, [pair], x, 802, 254, 74, C.yellow, 'pair-in-flight', { fontSize: 31 });
    }
    if (!rewind && complete(direct)) {
      text(
        ctx,
        api,
        'Source word: Birds     ·     Destination word: migrate',
        960,
        894,
        34,
        C.yellow,
        'center',
      );
    } else if (rewind && complete(split)) {
      text(ctx, api, '(B, T, H, d) = (2, 3, 2, 2)', 960, 885, 40, C.ink, 'center');
    }
  });
}

function probe(ctx, api, state) {
  const { C } = api;
  const zeroed = complete(event(state, 5, 'try-zero-input'));
  const restored = complete(event(state, 6, 'restore-word-features'));
  const input = zeroed && !restored ? zeroInput : numberedInput;
  const frame = headFrame(state, input);
  const selected = complete(event(state, 4, 'select-probe-pair'));
  const read = complete(event(state, 4, 'read-second-probe'));
  const trace = complete(event(state, 4, 'trace-foreign-probe'));
  const check = event(state, 4, 'write-owner-check');
  const verdict = restored
    ? complete(event(state, 6, 'recheck-numbered-pairs'))
    : zeroed
      ? complete(event(state, 6, 'zero-test-result'))
      : complete(check);
  const expected = input[1][0].slice(2);
  const pairs = [];
  if (selected) pairs.push({ row: 0, first: 2, color: C.yellow });
  if (trace) pairs.push({ row: 1, first: 2, color: C.pink });
  target(ctx, api, 'probe-input', () => {
    wordTable(ctx, api, 1, input[1], { pairs });
    if (selected)
      api.text(ctx, 'expected = x[1, 0, 2:]', 565, 802, 31, C.yellow, 'center', 'mono');
  });
  target(ctx, api, 'probe-output', () => {
    text(ctx, api, 'head 1  ·  Children', 1390, 316, 39, C.ink, 'center');
    for (const [i, values] of [frame.correct[1][1][0], frame.direct[1][1][0]].entries()) {
      const y = 420 + i * 180;
      text(
        ctx,
        api,
        i === 0 ? 'Split, then transpose' : 'Direct reshape',
        1390,
        y,
        29,
        C.muted,
        'center',
      );
      const matches = values.every((v, j) => v === expected[j]);
      const color = verdict ? (matches ? C.green : C.pink) : C.blue;
      numberGrid(
        ctx,
        api,
        [read ? values : ['?', '?']],
        1220,
        y + 25,
        340,
        90,
        color,
        'second-probe-' + i,
        { fontSize: 39 },
      );
      if (verdict) text(ctx, api, matches ? 'True' : 'False', 1590, y + 84, 31, color);
    }
    if (read)
      api.text(ctx, 'actual = heads[1, 1, 0]', 1390, 802, 31, C.ink, 'center', 'mono');
  });
  target(ctx, api, 'probe-assertion', () => {
    if (check > 0)
      api.text(
        ctx,
        'np.array_equal(actual, expected)',
        960,
        900,
        39,
        C.ink,
        'center',
        'mono',
      );
    else if (!selected)
      text(ctx, api, 'Which two numbers should this test require?', 960, 900, 40, C.ink, 'center');
  });
}

export function drawHeads(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat >= 3) return probe(ctx, api, state);
  const frame = headFrame(state);
  if (beat === 1) return replay(ctx, state, api, frame);
  target(ctx, api, 'head-choice', () => {
    const read = beat === 2 && complete(frame.reveal);
    const judged = read && frame.choiceShown;
    choices(ctx, api, frame, read, judged);
    const source = sequence0[1];
    text(
      ctx,
      api,
      judged
        ? 'The correct shape and the correct owner'
        : 'migrate in the input     [ ' + source.join('   ') + ' ]',
      960,
      963,
      32,
      judged ? api.C.green : api.C.ink,
      'center',
    );
  });
}

export default {
  id: 'heads',
  draw: drawHeads,
  cues: [
    'choose-head-construction',
    'walk-direct-pairs',
    'rewind-heads',
    'expose-feature-pairs',
    'move-head-axis',
    'reveal-head-mismatch',
    'resolve-head-construction',
    'choose-second-probe',
    'select-probe-pair',
    'read-second-probe',
    'trace-foreign-probe',
    'write-owner-check',
    'try-zero-input',
    'zero-test-result',
    'restore-word-features',
    'recheck-numbered-pairs',
  ],
};
