import {
  P,
  colors,
  cue,
  mix,
  text,
  box,
  line,
  dot,
  heading,
  reading,
  columnHead,
  ledger,
  strip,
  tag,
  num,
  pct,
  terminal,
} from './press.mjs';
import {
  BASE,
  WORDS,
  keep,
  ranked,
  tests,
  sum,
  fresh,
  freshNames,
  dogPaths,
  stopReasons,
  limits,
  bufferState,
  temper,
  replayScores,
} from './model.mjs';
import { composingCase } from './search.mjs';
import { nucleusCut } from './sampling.mjs';

function stream(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(
      c,
      'What closed the stream?',
      'Token IDs belong to the checkpoint and its chat template.',
    );
    const n =
      1 +
      Number(!!cue(k, 0, 'another marker')) +
      Number(!!cue(k, 0, 'maximum output budget')) +
      Number(!!cue(k, 0, 'client cancellation')) +
      Number(!!cue(k, 0, 'error'));
    ledger(c, ['Observed event', 'Recorded stop reason'], stopReasons.slice(0, n), {
      x: [96, 797],
      y: 340,
      dy: 90,
      sizes: [47, 43],
    });
    return;
  }
  const first = cue(k, 1, 'first token piece', 0.95),
    second = cue(k, 1, 'next piece is opera', 1.1),
    matched = cue(k, 2, 'At the P'),
    omit = cue(k, 3, 'returns an empty string'),
    include = cue(k, 3, 'include-stop policy');
  const state = bufferState(second === 1);
  heading(
    c,
    'Read across the token seam',
    'Configured literal stop string   “' + limits.target + '”',
  );
  terminal(c, 90, 257, 1420, 334, 'STREAM BUFFER');
  const x = 415,
    dx = 114,
    top = 392,
    y = 484;
  if (first > 0) {
    const xx = x + mix(-232, 0, first);
    box(c, xx, top - 28, 2 * dx, 124, '#314e5a');
    text(c, 'token 1', xx, top - 36, 23, P.mint, 'Mono');
    [...limits.pieces[0]].forEach((ch, i) =>
      text(c, ch, xx + dx * (i + 0.5), y, 94, P.white, 'Mono', 'center'),
    );
  }
  if (second > 0) {
    const xx = x + dx * 2 + mix(280, 0, second);
    c.save();
    c.beginPath();
    c.rect(95, 325, 1410, 223);
    c.clip();
    box(c, xx, top - 28, dx * 5, 124, '#46534a');
    text(c, 'token 2', xx + 10, top - 36, 23, P.mint, 'Mono');
    [...limits.pieces[1]].forEach((ch, i) =>
      text(
        c,
        ch,
        xx + dx * (i + 0.5),
        y,
        94,
        matched && i >= 2 ? P.amber : P.white,
        'Mono',
        'center',
      ),
    );
    c.restore();
  }
  if (matched && state.match) {
    const end = x + state.match.length * dx;
    line(c, x, 512, end, 512, P.mint, 7);
    line(c, end + 8, 512, x + state.buffer.length * dx, 512, P.amber, 4);
    text(c, 'matched stop string', x, 564, 28, P.mint);
    text(c, 'overhang: ' + state.remainder, end + 12, 564, 28, P.amber);
  } else if (first === 1) {
    line(c, x + 2 * dx, top - 27, x + 2 * dx, top + 99, P.amber, second === 1 ? 3 : 5);
  }
  columnHead(
    c,
    include
      ? 'Client output   /   include matched stop'
      : omit
        ? 'Client output   /   omit stop and overhang'
        : 'Client output   /   withheld during the match',
    94,
    681,
  );
  const received = include ? state.match : '';
  text(c, received, 97, 798, 76, P.ink, 'Mono');
  const cursor = 98 + received.length * 46;
  box(c, cursor, 730, 5, 73, P.red);
  if (omit && !include) text(c, 'empty string', 144, 786, 37, P.dim, 'Serif');
}
function replay(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'Replay the greedy choice', 'Same seed   /   no categorical draw');
  const changed = cue(k, 0, 'second execution'),
    solved = cue(k, 1, 'B wins');
  const cases = replayScores;
  const xs = [96, 572, 913, 1235];
  ledger(
    c,
    ['Run', 'Score A', 'Score B', 'Returned ID'],
    cases
      .slice(0, changed ? 2 : 1)
      .map((r, i) => [
        String(i + 1),
        r[0].toFixed(4),
        r[1].toFixed(4),
        i && !solved ? '?' : String.fromCharCode(65 + ranked(r)[0]),
      ]),
    { x: xs, y: 342, dy: 124 },
  );
  if (b >= 1) {
    reading(c, 'What has to match?', 96, 655, 45);
    text(c, 'Returned text     /     token IDs     /     tensor bits', 97, 716, 35, P.dim, 'Mono');
  }
  if (b === 2)
    tag(
      c,
      'Record hardware, runtime version and scheduling conditions before comparing traces.',
      96,
      805,
    );
}
function hosted(c, k) {
  const b = k.beat.beatIndex;
  if (b === 1) {
    heading(
      c,
      'Read the versioned contract',
      'Documentation snapshot recorded in the article   /   November 2026',
    );
    const rows = [
      ['Claude API 2026-10-21', 'temperature, top-p, top-k', 'reject'],
      ['GPT-6 with reasoning', 'temperature, top-p', 'omit from request'],
      ['Gemini 3.6 Flash', 'temperature, top-p, top-k', 'ignored'],
    ];
    const n =
      Number(!!cue(k, 1, 'cited Claude')) +
      Number(!!cue(k, 1, 'cited GPT')) +
      Number(!!cue(k, 1, 'cited Gemini'));
    ledger(c, ['Model or API', 'Submitted fields', 'Contract'], rows.slice(0, n), {
      x: [95, 685, 1220],
      y: 356,
      dy: 135,
      sizes: [44, 31, 33],
    });
  } else if (b === 0) {
    heading(
      c,
      'Did the effective policy change?',
      'Two hypothetical requests to the same service   /   requested T = 0.4 and 1.2',
    );
    const rows = [
      ['Applied', 'T = 0.4', 'T = 1.2'],
      ['Rejected', 'request error', 'request error'],
      ['Ignored', 'provider default', 'provider default'],
    ];
    const n =
      Number(!!cue(k, 0, 'An applied field')) +
      Number(!!cue(k, 0, 'A rejected field')) +
      Number(!!cue(k, 0, 'An ignored field'));
    text(c, 'Requested', 95, 308, 37, P.ink, 'Serif');
    text(c, 'T = 0.4', 630, 308, 44, P.red, 'Mono');
    text(c, 'T = 1.2', 1100, 308, 44, P.blue, 'Mono');
    ledger(c, ['Field handling', 'Effective A', 'Effective B'], rows.slice(0, n), {
      x: [95, 630, 1100],
      y: 465,
      dy: 108,
    });
  } else {
    heading(
      c,
      'Choose a supported experiment',
      'Same test prompts   /   record the effective request',
    );
    ledger(
      c,
      ['Control', 'What changes', 'What to inspect'],
      [
        ['Effort', 'reasoning budget', 'cost and task score'],
        ['Schema', 'eligible shape', 'validate fields'],
        ['Prompt and evidence', 'input context', 'grounding and variation'],
      ],
      { x: [95, 604, 1080], y: 355, dy: 125, sizes: [40, 35, 32] },
    );
  }
}
function evaluation(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(
      c,
      'Check a draft against its source',
      b === 0 ? 'Illustrative deployment record' : 'One control varies across the trial.',
    );
    terminal(c, 93, 290, 650, 310, 'ROLLOUT RECORD');
    text(c, 'phase = paused', 129, 483, 48, P.amber, 'Mono', 'left', 585);
    text(c, 'Compare each completed draft', 820, 369, 49, P.ink, 'Serif', 'left', 685);
    text(c, 'to the recorded phase.', 820, 433, 49, P.ink, 'Serif');
    if (b === 1)
      tag(c, 'Fix revision, prompts, evidence, output budget, stop rule and scorer.', 96, 750);
    return;
  }
  heading(
    c,
    'How often does a draft get it right?',
    'Four drafts per held-out prompt   /   green check = matches the record',
  );
  const multi = cue(k, 4, 'Add prompts'),
    counted = cue(k, 5, 'Three of twelve'),
    atLeast = cue(k, 5, 'Two of three'),
    seen = cue(k, 2, 'first and third'),
    n = multi ? 3 : 1;
  for (let j = 0; j < 4; j++) columnHead(c, 'Draft ' + (j + 1), 395 + 212 * j, 279);
  const shown = tests.slice(0, n),
    oneCount = cue(k, 3, 'Two correct drafts');
  shown.forEach((row, i) => {
    const y = 367 + i * 117;
    reading(c, 'Prompt ' + String.fromCharCode(65 + i), 95, y + 10, 44);
    row.forEach((v, j) => {
      const x = 438 + j * 212;
      dot(c, x, y, 37, !seen ? P.ghost : v ? P.teal : '#d4ccba');
      text(
        c,
        !seen ? '?' : v ? '✓' : '×',
        x,
        y + 14,
        40,
        seen && v ? P.white : P.dim,
        'Sans',
        'center',
      );
    });
    if (atLeast || (!multi && oneCount && cue(k, 3, 'any draft worked')))
      text(
        c,
        row.some(Boolean) ? '≥ 1 correct' : '0 correct',
        1250,
        y + 11,
        31,
        row.some(Boolean) ? P.teal : P.dim,
      );
  });
  const total = sum(shown.flat()),
    hit = shown.filter((row) => row.some(Boolean)).length;
  if ((!multi && oneCount) || counted)
    text(
      c,
      'Correct drafts   ' +
        total +
        ' / ' +
        shown.flat().length +
        '   =   ' +
        pct(total / shown.flat().length),
      97,
      738,
      38,
      P.ink,
      'Mono',
    );
  if (atLeast)
    text(c, 'Prompts with a correct draft   ' + hit + ' / ' + n, 97, 812, 38, P.teal, 'Mono');
}
function transfer(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const moved = cue(k, 1, 'Move the split', 1.6),
      paths = dogPaths(1, mix(0.9, 0.5, moved));
    composingCase(c, paths, {
      width: 2,
      picked: b >= 1 && !!cue(k, 1, 'tie rule picks home'),
      compare: true,
      mode: 'Replay   /   change only the second word after slept',
      hint: b === 0 ? 'What if the two endings after slept split evenly?' : '',
    });
    return;
  }
  const threshold = mix(0.7, 0.9, cue(k, 3, 'move just the target', 1.1));
  heading(
    c,
    'Move the target on the same words',
    'All five original probabilities remain in place.',
  );
  nucleusCut(c, BASE, WORDS, {
    threshold,
    answer: !!cue(k, 4, 'Barked takes'),
    norm: !!cue(k, 4, 'divide their weights'),
    y: 329,
  });
}

function finish(c, k) {
  const b = k.beat.beatIndex;
  const cut = cue(k, 1, 'Paused gets'),
    two = cue(k, 1, 'exactly two'),
    relative = cue(k, 2, 'Min-p'),
    cold = cue(k, 3, 'halve the temperature', 1.6),
    restore = cue(k, 4, 'Restore temperature one', 0.7),
    mask = cue(k, 4, 'format forbids ready'),
    legalNorm = cue(k, 4, 'Divide each legal share'),
    legalAnswer = cue(k, 5, 'Checking takes'),
    record = cue(k, 5, 'read the rollout log'),
    report = cue(k, 6, 'Paused');
  const T = mix(mix(1, 0.5, cold), 1, restore);
  const tempRow = temper(fresh.row, T);
  const row = mask
    ? legalNorm
      ? fresh.masked
      : [0, ...fresh.row.slice(1)]
    : b >= 3
      ? tempRow
      : two && !relative
        ? fresh.k.values
        : fresh.row;
  const chosen = mask
    ? legalAnswer
      ? fresh.maskedP.ids
      : null
    : b >= 3
      ? null
      : relative
        ? fresh.min.ids
        : two
          ? fresh.k.ids
          : cut
            ? fresh.p.ids
            : null;
  const label = mask
    ? legalNorm
      ? 'Legal shares normalized   /   top-p = 0.80'
      : 'Original mass after masking ready'
    : b >= 3
      ? 'All five eligible   /   T = ' + T.toFixed(2)
      : relative
        ? 'Min-p   /   ρ = 0.20   /   floor = ' + num(fresh.floor)
        : two
          ? 'Exact k = 2   /   normalized over 74%'
          : 'Original shares   /   top-p = 0.80';
  heading(c, report ? 'The canary status is paused.' : 'The canary status is …', label);
  const barX = 360,
    width = 700;
  freshNames.forEach((name, i) => {
    const y = 281 + i * 95,
      live = !chosen || chosen.includes(i),
      color = live ? colors[i] : P.ghost;
    text(c, name, 96, y + 40, 42, mask && i === 0 ? P.dim : P.ink, 'Serif');
    box(c, barX, y + 6, width * row[i], 37, color);
    text(
      c,
      mask && i === 0 ? 'masked' : pct(row[i], 2),
      barX + width * row[i] + 18,
      y + 36,
      29,
      P.ink,
      'Mono',
    );
  });
  const x = 994;
  if (mask) {
    if (legalNorm) {
      text(c, 'waiting + paused', x, 314, 37, P.ink, 'Serif');
      text(c, pct(row[1] + row[2], 2) + ' < 80%', x, 384, 44, P.ink, 'Mono');
      if (legalAnswer)
        text(c, 'with checking: ' + pct(sum(row.slice(1, 4)), 2), x, 460, 34, P.teal, 'Mono');
    }
    if (record) {
      terminal(c, x, 525, 518, 174, 'ROLLOUT LOG   /   10:42');
      text(c, 'phase = paused', x + 28, 659, 41, P.amber, 'Mono', 'left', 452);
    }
  } else if (b < 3) {
    reading(
      c,
      relative ? 'Compare with the floor' : two ? 'Two surviving IDs' : 'Read the cumulative mass',
      x,
      314,
      38,
      P.ink,
      520,
    );
    if (!relative && !two) {
      text(c, 'ready + waiting   ' + pct(fresh.row[0] + fresh.row[1]), x, 393, 29, P.dim, 'Mono');
      if (cut) text(c, 'with paused      ' + pct(fresh.p.mass), x, 463, 29, P.teal, 'Mono');
    } else if (relative) text(c, 'paused ≥ floor > checking', x, 397, 34, P.teal, 'Serif');
  }
  if (b >= 6) tag(c, 'Use the rollout record to report the state.', 94, 813);
}
export const deliveryPainters = {
  c28: stream,
  c29: replay,
  c30: hosted,
  c31: evaluation,
  c32: transfer,
  c33: finish,
};
