import { drawWindow } from '../../../director-cuts/lessons/structured-generation/window.mjs';
import {
  ink,
  white,
  fog,
  gold,
  mint,
  rose,
  teal,
  rust,
  pale,
  rule,
  board,
  inset,
} from './press.mjs';
import * as ex from './examples.mjs';

export function replies(g) {
  const { at, text, line, ribbon } = g;
  const stopped = at(2, 'Python stops'),
    scan = at(2, 'follow the cursor', 2.25);
  const log = at(3, 'Open the runner log', 0.7),
    review = at(3, 'Send B to review');
  ex.OPENING_REPLIES.forEach((s, i) => {
    const y = 115 + i * 91,
      first = 122,
      cell = 16.4;
    ribbon(44, y, 870, 74);
    text(i ? 'B' : 'A', 80, y + 36, 21, teal);
    for (const [j, ch] of [...s].entries())
      text(ch, first + j * cell, y + 36, 26, ink, 'Mono', cell + 1);
    const cursor = i ? Math.floor(scan * (s.length - 1)) : 0;
    const x = first + cursor * cell;
    line(x, y + 55, x + cell, y + 55, i ? teal : stopped ? rust : teal, 4);
    text(
      i ? (scan === 1 ? 'Parsed' : '') : stopped ? 'Stopped at S' : '',
      885,
      y + 36,
      21,
      i ? teal : rust,
      'Sans',
      195,
      'right',
    );
  });
  if (log > 0) {
    line(44, 314, 914, 314, rule, 5);
    g.c.save();
    g.c.beginPath();
    g.c.rect(44, 315, 870, 96);
    g.c.clip();
    g.c.translate(0, -91 * (1 - log));
    g.slip(44, 315, 870, 91, 'RUNNER LOG  /  RUN-842', [ex.RUN_LOG]);
    g.c.restore();
  } else {
    line(44, 332, 914, 332, rule);
    text('Runner log', 46, 367, 24, fog);
    text('Closed', 910, 367, 21, fog, 'Mono', 280, 'right');
  }
  g.note(
    review
      ? 'Send B to review. Its status disagrees with the runner.'
      : log
        ? 'Compare the parsed claim with the observed run.'
        : scan === 1
          ? 'B says “passed”. Would you publish it?'
          : '',
    review ? rose : gold,
  );
}

export function interfaces(g) {
  const { beat, at } = g,
    clean = at(1, 'Remove the preamble');
  if (beat < 3) {
    const raw =
      beat === 1 ? (clean ? '' : 'Sure! ') + JSON.stringify(ex.baseRecord) : '{"foo":"bar"}';
    g.feed(120, 'REPLY BYTES', raw);
    g.text('Python JSON parser', 56, 254, 24, fog);
    let parserLabel = 'Reads an object';
    let parserColor = mint;
    if (raw.startsWith('Sure')) {
      parserLabel = 'Stops at S';
      parserColor = rose;
    } else if (beat === 2 && !at(2, 'Python reads it')) {
      parserLabel = 'Will it parse?';
      parserColor = gold;
    }
    g.text(parserLabel, 58, 305, 33, parserColor, 'Serif', 410);
    g.line(478, 235, 478, 373, rule);
    g.text('Required keys', 512, 254, 24, fog);
    const found = beat === 1 ? clean : at(2, 'Both keys are missing');
    g.text(
      found ? (beat === 1 ? 'run_id  +  status' : 'Both missing') : 'run_id  ?    status  ?',
      512,
      305,
      27,
      found && beat === 2 ? rose : white,
      'Mono',
      391,
    );
    g.note(
      beat === 1
        ? 'A prompt can still produce a greeting.'
        : at(2, 'A supported strict schema')
          ? 'Compile the required keys and types into the generation constraint.'
          : '',
    );
  } else {
    g.slip(45, 137, 413, 189, 'DASHBOARD RECORD', ['run_id  RUN-842', 'status  failed']);
    g.slip(503, 137, 413, 189, 'PROPOSED LOOKUP', [ex.toolName, 'run_id  RUN-842'], pale);
    g.note(
      at(3, 'If the caller can read')
        ? 'An authorized host can return the snapshot to the model.'
        : 'Which consumer needs the result?',
    );
  }
}

export function prefix(g) {
  const n = Math.floor(ex.VALUE_PREFIX.length * g.at(2, 'Watch the opening brace', 1.9));
  const prefix =
    ex.VALUE_PREFIX.slice(0, n) +
    'fa'.slice(0, Math.floor(2 * g.at(3, 'append the letters', 0.55)));
  g.feed(118, 'ACCEPTED BUFFER', prefix + '▏');
  ex.LANGUAGE.forEach((record, i) => {
    const y = 254 + 85 * i;
    g.text(record, 80, y, 29, white, 'Mono');
    const match = record.startsWith(prefix),
      tested = !prefix.includes('f') || g.at(3, 'Only the failed record');
    let common = 0;
    while (common < prefix.length && record[common] === prefix[common]) common++;
    g.line(81, y + 25, 81 + common * 17.4, y + 25, tested && !match ? rose : mint, 3);
    if (tested)
      g.text(
        match ? 'Still reachable' : 'Branch closed',
        876,
        y,
        25,
        match ? mint : rose,
        'Sans',
        260,
        'right',
      );
  });
  g.note(
    g.at(3, 'extend the prefix')
      ? 'A trial stays eligible while at least one complete record begins with it.'
      : '',
  );
}

export function logits(g) {
  const mask = g.at(2, 'Set the other three'),
    norm = g.at(2, 'Divide by the surviving weight');
  ['Candidate', 'Logit', 'After mask', 'Share of draw'].forEach((s, i) =>
    g.text(s, [50, 260, 420, 646][i], 128, 20, fog),
  );
  const chances = mask ? ex.maskedFirst : ex.rawFirst;
  ex.firstTokens.forEach((s, i) => {
    const y = 192 + i * 59,
      allowed = ex.legal('', s);
    g.line(44, y + 28, 917, y + 28, rule, 1);
    g.text(s, 53, y, 31, white, 'Mono');
    g.text(ex.scores[i].toFixed(2), 262, y, 25, white, 'Mono');
    g.text(
      mask ? (allowed ? ex.scores[i].toFixed(2) : '−∞') : '·',
      431,
      y,
      26,
      mask ? (allowed ? mint : rose) : fog,
      'Mono',
    );
    if (!mask || norm) {
      g.rect(646, y - 8, 157, 16, '#345058');
      g.rect(646, y - 8, 157 * chances[i], 16, mask ? mint : gold);
      g.text(
        (chances[i] * 100).toFixed(mask ? 0 : 1) + '%',
        907,
        y,
        22,
        white,
        'Mono',
        92,
        'right',
      );
    }
  });
  g.note('Empty prefix   ·   Temperature 1   ·   Four illustrative scores');
}

export function weights(g) {
  const { at, after } = g;
  const removed = at(2, 'Cross out');
  const resize = after(3, 'Three out of five, or sixty percent', 0.75);
  const passedSpoken = after(3, 'Passed gets the remaining forty percent');
  const settled = resize === 1;
  const shifted = settled && at(3, 'subtract the largest finite logit');
  const choices = ex.valueChoices;
  const colors = [gold, mint, fog];
  const total = choices.reduce((sum, { weight }) => sum + weight, 0);
  const surviving = choices.reduce((sum, { weight, eligible }) => sum + (eligible ? weight : 0), 0);
  const shares = ex.branch();
  const percent = (i) => Math.round(100 * shares[i]) + '%';
  g.text('Prefix   ' + ex.VALUE_PREFIX, 56, 123, 23, fog, 'Mono');
  g.text('Temperature 1', 900, 123, 21, fog, 'Sans', 240, 'right');
  g.text('Logit', 271, 154, 18, fog);
  g.text(shifted ? 'Shifted weight' : 'Weight units', 412, 154, 18, fog);

  function tile(x, y, width, height, color, crossed) {
    g.rect(x, y, width, height, crossed ? '#465458' : color);
    if (crossed) g.line(x + 3, y + height - 3, x + width - 3, y + 3, rose, 2.5);
  }

  choices.forEach(({ token, weight, eligible }, i) => {
    const y = 186 + i * 49;
    const dead = removed && !eligible;
    const fraction = weight + '/' + ex.maxLegalWeight;
    const isMax = weight === ex.maxLegalWeight;
    const shiftedLogit = isMax ? '0' : 'ln(' + fraction + ')';
    const logit = dead ? '−∞' : shifted ? shiftedLogit : 'ln ' + weight;
    g.text(token, 56, y, 29, white, 'Mono');
    g.text(logit, 271, y, 22, fog, 'Mono');
    if (shifted) {
      g.rect(412, y - 16, 36 * ex.shiftedWeights[i], 32, colors[i]);
      g.text(dead ? '0' : isMax ? '1' : fraction, 463, y, 23, white, 'Mono');
    } else {
      for (let k = 0; k < weight; k++) tile(412 + 43 * k, y - 16, 36, 32, colors[i], dead);
    }
    if (settled && dead) g.text(percent(i), 900, y, 25, rose, 'Mono', 96, 'right');
  });

  if (at(1, 'ten units in all')) {
    const x = 56, y = 352, width = 844, height = 61;
    const before = width / total, afterMask = width / surviving;
    const unit = before + (afterMask - before) * resize;
    const label = settled
      ? 'Share of the next draw'
      : resize > 0
        ? 'Rescale the surviving units'
        : removed
          ? surviving + ' of ' + total + ' weight units survive'
          : total + ' weight units before masking';
    g.text(label, x, 324, 22, fog);
    if (settled)
      g.text(total + ' → ' + surviving + ' weight units', 900, 324, 22, fog, 'Sans', 250, 'right');
    g.rect(x, y, width, height, '#355259');
    let slot = 0;
    choices.forEach(({ token, weight, eligible }, i) => {
      if (resize > 0 && !eligible) return;
      const left = x + slot * unit;
      const span = weight * unit;
      if (settled) {
        g.rect(left, y, span, height, colors[i]);
        for (let k = 1; k < weight; k++)
          g.line(left + k * unit, y + height - 11, left + k * unit, y + height, ink, 2);
        const share = token === 'fa'
          ? '  ' + weight + '/' + surviving + ' = ' + percent(i)
          : passedSpoken
            ? '  ' + percent(i)
            : '';
        g.text(token + share, left + span / 2, y + 27, 27, ink, 'Mono', span - 16, 'center');
      } else {
        for (let k = 0; k < weight; k++)
          tile(left + k * unit + 2, y + 2, unit - 4, height - 4, colors[i], removed && !eligible);
      }
      slot += weight;
    });
  }
  if (shifted) {
    const max = ex.maxLegalWeight;
    g.note('Subtract ln ' + max + '.   P(fa) = 1 / (' + surviving + '/' + max + ') = ' + percent(1) + '.');
  }
}

export function branch(g) {
  const p = g.at(2, 'double the weight', 0.8),
    weight = 3 + 3 * p,
    values = ex.branch(weight);
  const x = 56,
    w = 844,
    split = x + w * values[0],
    fmt = (n) => Number(n.toFixed(2)).toString();
  g.text('Accepted prefix   ' + ex.VALUE_PREFIX, 56, 142, 25, fog, 'Mono');
  g.rect(x, 205, w * values[0], 92, gold);
  g.rect(split, 205, w * values[1], 92, mint);
  g.text(Math.round(values[0] * 100) + '%', x + 18, 254, 33, ink, 'Mono');
  g.text(Math.round(values[1] * 100) + '%', split + 18, 254, 33, ink, 'Mono');
  g.text('passed  × 2', x, 333, 27, gold, 'Mono');
  g.text('fa  × ' + fmt(weight), 900, 333, 27, mint, 'Mono', 315, 'right');
  g.note(
    g.at(3, 'runner reported a failure')
      ? 'Runner log  /  RUN-842 failed. Check the sampled value against this run.'
      : 'Share of the next draw at temperature 1',
  );
}

export function shop(g) {
  const { at, beat, c } = g,
    short = at(3, 'Try the shorter piece'),
    sample = at(3, 'append all five characters together');
  const token = short ? ex.shopToken : ex.shopToken + '!';
  const count = short
    ? Math.floor(5 * at(3, 'It ends at the brace', 0.7))
    : Math.floor(3 * at(2, 'The letters finish', 0.65)) +
      at(2, 'The quote ends') +
      at(2, 'The brace ends') +
      at(3, 'The exclamation mark');
  const trace = ex.compareToken(token, count);
  g.ribbon(44, 123, 351, 235);
  inset(c, 65, 135, 0.386, () => drawWindow(c, 1));
  g.text('Aster Flowers', 68, 342, 20, teal, 'Serif', 292);
  g.text('Directory values   open / closed', 425, 144, 22, fog);
  if (beat >= 2) {
    g.text('Candidate token', 425, 193, 20, fog);
    const x = 427,
      y = 221,
      cell = 44;
    g.rect(x, y, token.length * cell, 64, '#414ea3');
    [...token].forEach((ch, i) => {
      if (i < count && !ex.compareToken(token, i + 1).viable)
        g.rect(x + i * cell, y, cell, 64, rose);
      g.text(
        ch,
        x + (i + 0.5) * cell,
        y + 32,
        41,
        i < count ? (!ex.compareToken(token, i + 1).viable ? ink : gold) : white,
        'Mono',
        cell,
        'center',
      );
    });
    g.line(x, y + 68, x + count * cell, y + 68, trace.viable ? mint : rose, 3);
    if (!short && at(3, 'Cross out'))
      g.line(x - 4, y + 64, x + token.length * cell + 4, y + 1, rose, 5);
    g.text(
      sample
        ? 'Sampled'
        : !trace.viable
          ? 'Whole token rejected'
          : trace.complete
            ? short
              ? 'Eligible'
              : 'Brace reached'
            : 'Trial copy',
      426,
      327,
      27,
      trace.viable ? mint : rose,
    );
  }
  g.feed(
    379,
    sample ? 'COMMITTED REPLY' : 'ACCEPTED PREFIX',
    sample ? ex.shopRecords[1] : ex.shopPrefix + '▏',
  );
}

export function budgetEnd(g) {
  const { at } = g;
  const budget = at(3, 'one more draw') ? 4 : 3;
  const count = at(1, 'First it picks') + at(1, 'Next it picks') + at(1, 'On the third draw') + at(3, 'decoder picks the end token');
  const sampled = ex.rankedSteps(budget).slice(0, count);
  const buffer = sampled.filter(token => token !== ex.EOS).join('');
  const statuses = ex.LANGUAGE.map(record => JSON.parse(record).status);
  g.text('CI status grammar     ' + statuses.join('  |  '), 46, 128, 25, white);
  g.text('Return the buffer only on sampling ' + ex.EOS, 46, 165, 23, fog);
  g.text('Draws used   ' + sampled.length + ' / ' + budget, 914, 128, 24, gold, 'Mono', 290, 'right');
  for (let i = 0; i < budget; i++) {
    const token = sampled[i], x = 46 + i * 218;
    g.text('Draw ' + (i + 1), x, 217, 19, fog);
    g.rect(x, 238, 201, 55, token ? (token === ex.EOS ? gold : mint) : rule);
    if (token) g.text(token, x + 101, 266, 23, ink, 'Mono', 190, 'center');
    else g.rect(x + 2, 240, 197, 51, board);
  }
  g.feed(325, 'BUFFER', buffer + '▏');
  g.note(
    sampled.includes(ex.EOS)
      ? 'End token sampled. Return ' + ex.decode(sampled)
      : budget === 4
        ? 'Three tokens sampled. One draw remains for EOS.'
        : at(2, 'raises a budget error')
          ? 'Budget exhausted before the end token. Keep the error.'
          : count === 3 ? 'Will the decoder return this record?' : '',
    sampled.includes(ex.EOS) ? mint : gold,
  );
}

export function stack(g, fresh = false) {
  const { at, beat } = g,
    depth = fresh ? 4 : 3;
  if (!fresh && beat === 1 && !at(1, 'Now put a child')) {
    g.feed(134, 'FLAT LIST', '[{}, {}, {}, …]');
    g.arrow(120, 299, 419, 299);
    g.arrow(700, 299, 840, 299);
    g.text('read {}', 58, 273, 23, fog);
    g.text('comma', 473, 298, 32, gold, 'Mono');
    g.line(743, 310, 743, 368, gold);
    g.line(743, 368, 188, 368, gold);
    g.arrow(188, 368, 188, 315, gold);
    g.note('Each comma returns to the same state.');
    return;
  }
  const a = '}'.repeat(depth),
    bad = '}'.repeat(depth - 1) + (fresh ? '!' : ']');
  const b = fresh ? at(2, 'For B') : at(4, 'Start B');
  const hasTrial = fresh ? at(2, 'Try A') : at(3, 'Follow A');
  const token = b ? bad : a;
  const goodP = fresh
    ? at(2, 'Four closing braces', 1.3)
    : at(3, 'through three closing braces', 1.15);
  const pops = fresh ? at(2, 'Three braces pop', 1.2) : at(4, 'Two braces fit', 0.9);
  const fail = fresh ? at(2, 'exclamation mark has no transition') : at(4, 'square bracket fails');
  const count = b ? Math.floor((depth - 1) * pops) + fail : Math.floor(depth * goodP);
  const state = ex.trialAt(depth, token, count);
  const away = b ? (fresh ? at(2, 'Pull B away', 0.9) : at(4, 'Rejecting B', 0.9)) : 0;
  g.text('Accepted prefix   ' + state.prefix, 46, 123, 21, fog, 'Mono');
  function pile(x, frames, color) {
    frames.forEach((frame, i) => {
      const y = 356 - i * 40;
      g.rect(x + 3, y + 4, 216, 35, '#0f252e');
      g.rect(x, y, 216, 35, color);
      g.text('open @ ' + frame.offset + '   }', x + 13, y + 18, 21, ink, 'Mono', 192);
    });
  }
  g.text('Accepted stack', 48, 178, 24, white);
  pile(50, state.original.frames, white);
  if (fresh && at(2, 'the end token is blocked') && !state.original.complete)
    g.text('EOS blocked · ' + state.original.frames.length + ' open', 50, 415, 23, rose, 'Sans', 281);
  if (hasTrial && away < 1) {
    g.c.save();
    g.c.translate(away * 68, 0);
    g.c.globalAlpha = 1 - away;
    g.text('Trial ' + (b ? 'B' : 'A'), 364, 174, 23, white);
    for (const [i, ch] of [...token].entries()) {
      const failed = i === count - 1 && !state.legal;
      const x = 478 + i * 34;
      g.rect(x, 155, 32, 39, failed ? rose : i < count ? mint : white);
      g.text(ch, x + 16, 175, 26, ink, 'Mono', 30, 'center');
    }
    pile(366, state.trial.frames, pale);
    g.line(365, 395, 585, 395, rule, 2);
    const progress = fresh && !state.legal
      ? (count - 1) + ' / ' + token.length + ' fit trial'
      : count + ' / ' + token.length + ' read';
    g.text(progress, 624, 259, 24, fog, 'Mono', 246);
    g.text(
      !state.legal
        ? 'No transition'
        : state.complete
          ? 'Root closed'
          : state.trial.frames.length + ' open',
      624,
      307,
      27,
      !state.legal ? rose : mint,
      'Sans',
      258,
    );
    if (!state.legal) g.text('1 open on trial copy', 624, 349, 21, rose, 'Sans', 251);
    if (fresh && !b && state.complete && at(2, 'can choose its end token next'))
      g.text('EOS allowed if A is sampled', 624, 354, 23, mint, 'Sans', 274);
    g.c.restore();
  } else {
    g.text(
      hasTrial ? 'Trial removed' : 'Candidate A    ' + a,
      366,
      241,
      29,
      hasTrial ? rose : gold,
      'Mono',
      510,
    );
    if (!hasTrial) g.text('Candidate B    ' + bad, 366, 302, 29, gold, 'Mono', 510);
  }
  if (!fresh) {
    let result = away === 1 ? 'Accepted stack still has ' + depth + ' frames. EOS blocked.' : '';
    if (hasTrial && !b && state.complete)
      result = 'A is eligible. Sampling A would permit EOS on the next step.';
    if (b && !state.legal && away < 1)
      result = 'Reject the entire token. Its trial changes belong to B.';
    g.note(result);
    return;
  }
  if (beat === 2 && b && !state.legal && away < 1)
    g.text('Reject B as a whole token', 363, 418, 24, rose);
  if (beat !== 3) return;
  if (!at(3, 'only available tokens')) {
    g.text('Incomplete · budget exhausted', 363, 423, 24, rose);
    return;
  }
  const changed = at(3, 'Replace the square bracket');
  g.rect(345, 177, 578, 243, board);
  g.text('Available vocabulary', 365, 205, 23, fog);
  const tokens = changed ? ex.lowTokens : ex.deadTokens;
  tokens.forEach((token, i) => {
    const trial = ex.trialAt(depth, token, token.length),
      y = 277 + 70 * i;
    g.text(token, 369, y, 33, white, 'Mono');
    const score = trial.legal && at(3, 'score of minus one thousand');
    g.text(score ? 'Eligible · score −1000' : trial.legal ? 'Eligible' : 'No transition',
      523, y, 22, trial.legal ? mint : rose);
    if (trial.legal && at(3, 'gets the whole draw'))
      g.text(100 * ex.lowWeights[0] + '% of the draw', 746, y, 24, mint, 'Sans', 166);
  });
  if (!changed && at(3, 'Report the dead end'))
    g.text('No legal token · dead-end error', 363, 423, 24, rose);
}

export function trie(g) {
  const { beat, at } = g;
  if (beat === 1) {
    g.text('CI status prefix   ' + ex.FAIL_PREFIX, 45, 135, 23, fog, 'Mono');
    const chars = [...ex.SUFFIX],
      n = Math.floor(chars.length * at(1, 'Trace those bytes', 1.35));
    chars.forEach((ch, i) => {
      const x = 65 + i * 106;
      if (i) g.arrow(x - 57, 244, x - 4, 244, i < n ? mint : rule);
      g.rect(x, 217, 48, 55, i < n ? mint : white);
      g.text(ch, x + 24, 245, 31, ink, 'Mono', 46, 'center');
    });
    if (at(1, 'One token ends')) g.text('A ends here', 583, 180, 24, mint);
    if (at(1, 'one more edge')) {
      g.arrow(656, 245, 743, 291, rose);
      g.rect(751, 268, 56, 54, rose);
      g.text('!', 779, 295, 32, ink, 'Mono', 44, 'center');
      g.text('B overshoots', 719, 350, 23, rose);
    }
    g.note('One tokenizer trie path through six shared ASCII bytes.');
  } else if (beat === 2) {
    g.feed(129, 'STATE INDEX  /  TWO-RECORD LANGUAGE', ex.FAIL_PREFIX);
    g.arrow(143, 223, 197, 302);
    const lookup = at(2, 'straight to the eligible token');
    g.slip(
      203,
      239,
      677,
      153,
      lookup ? 'STATE INDEX RETURNS A' : 'COMPARE TWO VOCABULARY ENTRIES',
      [
        ex.SUFFIX + '    score 1' + (lookup ? '    A eligible' : ''),
        ex.SUFFIX + '!   score 8' + (lookup ? '    B masked' : ''),
      ],
    );
    g.note('Build and store the index once. Look up this state on later steps.');
  } else if (beat === 3) {
    g.text('Shared compiled rule', 45, 139, 22, fog);
    g.text('node = {} | {"child": node}', 47, 191, 28, white, 'Mono');
    g.slip(45, 246, 409, 135, 'REQUEST A  /  LIVE STACK', ['root', 'child'], pale);
    if (at(3, 'Start a second request'))
      g.slip(500, 246, 414, 135, 'REQUEST B  /  LIVE STACK', ['root'], white);
    g.note('A closing token may need the request’s parent context.');
  } else {
    g.text('llguidance', 49, 133, 25, fog);
    g.text('Earley parser   +   regex lexer   +   tokenizer trie', 50, 183, 28, white, 'Sans', 853);
    g.slip(48, 233, 418, 137, 'UTF-8 BYTE FRAGMENTS', ['C3     A9']);
    if (at(4, 'partial bytes')) {
      g.arrow(494, 307, 584, 307);
      g.text('é', 681, 294, 75, mint, 'Serif');
    }
    g.note('Carry the partial byte sequence until the character is complete.');
  }
}

export function cache(g) {
  const { beat, at } = g;
  if (beat === 1) {
    const changed = at(1, 'Change the first prompt token');
    g.text('Prompt tokens', 50, 127, 23, fog);
    for (const [i, name] of ['A', 'B'].entries()) {
      const y = 178 + i * 82;
      g.text(name, 54, y + 26, 27, white);
      [i && changed ? 'new system' : 'system', 'schema', 'task ' + name].forEach((s, j) => {
        const x = 121 + j * 234;
        g.rect(x, y, 216, 56, j < 2 && !changed ? pale : white);
        g.text(s, x + 108, y + 28, 24, ink, 'Mono', 192, 'center');
      });
    }
    g.note(
      changed
        ? 'Matched prompt tokens: 0. The compiled grammar still matches.'
        : 'Two matching prompt tokens can reuse their cached keys and values.',
    );
  } else if (beat === 2) {
    g.text('Forced literal  /  illustrative tokenization', 50, 138, 24, fog);
    const parts = ex.forcedKey;
    parts.forEach((s, i) => {
      const x = 65 + i * 222;
      g.rect(x, 188, 202, 61, white);
      g.text(s, x + 101, 220, 32, ink, 'Mono', 176, 'center');
    });
    if (at(2, 'append the forced text'))
      g.feed(
        292,
        beat === 3 ? 'RETOKENIZE WITH THE OLD PREFIX AT THE JOIN' : 'ONE FORCED APPEND',
        '…  ' + parts.join(''),
      );
    g.note('The model still processes the appended tokens.');
  } else {
    const joined = at(3, 'colon and the next opening brace');
    g.text('Old prefix', 48, 133, 20, fog);
    g.text('Forced continuation', 492, 133, 20, fog);
    g.feed(164, 'BEFORE JOIN', '{"outer":');
    g.rect(478, 168, 2, 72, rule);
    g.text(ex.forcedKey.join(''), 496, 217, 27, ink, 'Mono');
    const tokens = joined ? ex.joinedTokens : ['{"', 'outer', '"', ':', ...ex.forcedKey];
    let x = 52;
    for (const t of tokens) {
      const w = 43 + 17 * t.length;
      g.rect(x, 300, w, 56, t === ':{' ? gold : pale);
      g.text(t, x + w / 2, 328, 26, ink, 'Mono', w - 8, 'center');
      x += w + 7;
    }
    g.note(
      joined
        ? 'The colon and brace share one token. The concatenated text is unchanged.'
        : 'Trace the boundary between the old and forced tokens.',
    );
  }
}

export function schedule(g) {
  const { beat, at } = g,
    overlap = beat > 1,
    mask = beat === 3 ? 10 : 3;
  let t;
  if (beat === 1)
    t =
      8 * at(1, 'GPU scores take', 0.85) +
      3 * at(1, 'CPU makes', 0.65) +
      at(1, 'Sampling takes', 0.4);
  if (beat === 2)
    t =
      3 * at(2, 'both jobs starting', 0.7) +
      5 * at(2, 'scores arrive', 0.8) +
      at(2, 'Only now', 0.5);
  if (beat === 3)
    t =
      8 * at(3, 'ten-millisecond mask', 1) +
      2 * at(3, 'mask arrives at ten', 0.55) +
      at(3, 'Sampling finishes', 0.4);
  const { lanes, join, end } = ex.race(8, mask, overlap, t),
    x = 197,
    unit = 54;
  g.text(
    (overlap ? 'Concurrent start' : 'Serial start') +
      '     GPU 8 ms  /  CPU ' +
      mask +
      ' ms  /  sample 1 ms',
    47,
    126,
    21,
    fog,
    'Sans',
  );
  for (let i = 0; i <= 12; i++) {
    g.line(x + i * unit, 173, x + i * unit, 371, rule, 0.65);
    g.text(i, x + i * unit, 395, 17, fog, 'Mono', 46, 'center');
  }
  lanes.forEach((lane, i) => {
    const y = 185 + 64 * i,
      color = [gold, mint, white][i];
    g.text(['GPU scores', 'CPU mask', 'Sampler'][i], 47, y + 18, 22, color);
    g.rect(x, y + 12, 12 * unit, 10, '#355259');
    g.rect(x + lane.start * unit, y + 2, lane.done * unit, 32, color);
    if (t >= lane.start) g.dot(x + (lane.start + lane.done) * unit, y + 18, 6, color);
    else g.text('waiting', x + 8, y - 3, 16, fog);
  });
  g.text('ms', 873, 395, 17, fog);
  g.note(
    t >= end
      ? 'Token ready at ' + end + ' ms.'
      : t >= join
        ? 'Both inputs ready. Sampling can proceed.'
        : 'Clock  ' + Number(t.toFixed(1)) + ' ms   ·   Sampler waiting for both inputs.',
    t >= end ? mint : gold,
  );
}
