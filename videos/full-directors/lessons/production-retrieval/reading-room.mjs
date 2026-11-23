import {
  C,
  box,
  line,
  circle,
  txt,
  para,
  small,
  title,
  paper,
  key,
  browser,
  tab,
  cursor,
  thread,
  seal,
  source,
  mix,
  ease,
  cues,
  row,
} from './art.mjs';
import {
  rules,
  sessionOnly,
  run,
  budget,
  keyChars,
  sessionChars,
  appendixChars,
  verdict,
  canRelease,
  noted,
  unknownSourceLabels,
} from './evidence.mjs';

export function expansion(c, k) {
  const { beat, at } = cues(k);
  title(c, beat === 4 ? 'Count the entire prompt' : 'Follow the child to its page');
  if (beat === 4) {
    tokenRoll(c, at(4, 'Our toy tokenizer'), at(4, 'The rest of the window'));
    return;
  }
  const checked = at(2, 'Then check the parent'),
    copy = at(3, 'Copy the checked section'),
    second = at(3, 'distinct session section');
  const children = ['Key rule · hit 1', 'Key rule · hit 2', 'Session · hit 3'];
  const count = second ? 3 : beat >= 2 ? 2 : 1;
  children.slice(0, count).forEach((s, i) => {
    const y = 183 + i * 100;
    paper(c, 53, y, 291, 66);
    txt(c, s, 72, y + 43, 23, C.ink, 'Serif');
    thread(c, 343, y + 31, i < 2 ? 486 : 486, i < 2 ? 235 : 486, i === 2 ? C.sky : C.gold);
  });
  source(c, 490, 121, 649, 306, 'key', copy ? 'E1' : '', {
    size: 23,
    meta: checked
      ? 'eu-access-v2   ·   2026-04-01   ·   EU   ·   support:eu'
      : 'eu-access-v2   ·   bundle A',
  });
  if (beat === 1 && at(1, 'the child already contains'))
    small(c, 'Both clauses occur in this child.', 64, 360, C.mint);
  if (second) {
    paper(c, 490, 454, 650, 78);
    browser(c, 531, 493, 0.8);
    txt(c, 'Idle timeout', 564, 502, 25);
    tab(c, rules[1].sourceId, 1060, 497, C.blue);
  }
  if (copy && at(3, 'same copy')) small(c, '2 key hits   /   1 checked copy', 503, 584, C.mint);
}
function tokenRoll(c, showParts, showWindow) {
  paper(c, 67, 112, 1064, 477);
  small(c, 'LUNA’S QUESTION', 100, 156, C.teal);
  const question = budget.parts.find((part) => part.label === 'Question');
  para(c, question.text, 100, 202, 994, 29);
  if (!showParts) return;
  small(c, 'FORMATTED INPUT    /    1 TOY TOKEN PER BYTE', 100, 296);
  const colors = ['#a4c3ac', '#e2b773', '#c5a9b6', '#528e89', '#6692aa'];
  let x = 98;
  budget.parts.forEach((part, i) => {
    const w = (part.tokens / budget.total) * 1000;
    box(c, x, 318, w, 61, colors[i]);
    txt(c, part.tokens, x + w / 2, 357, 22, C.deep, 'Mono', 600, 'center');
    x += w;
  });
  let lx = 101;
  budget.parts.forEach((part, i) => {
    box(c, lx, 404, 15, 15, colors[i]);
    txt(c, part.label, lx + 23, 420, 19);
    lx += [204, 166, 154, 208, 0][i];
  });
  if (!showWindow) return;
  const committed = budget.total + budget.reservedOutput;
  const capacity = budget.limit + budget.reservedOutput;
  const totalLabel = `${budget.total} input  +  ${budget.reservedOutput} reserved for output  =  ${committed} tokens`;
  const freeLabel = `${capacity.toLocaleString('en-US')}-token window    ·    ${capacity - committed} tokens free`;
  txt(c, totalLabel, 99, 508, 31, C.ink, 'Serif');
  txt(c, freeLabel, 99, 556, 23, C.teal);
}
export function packing(c, k) {
  const { beat, at } = cues(k);
  if (beat === 1) {
    title(c, 'A window around a matching sentence');
    const x = (i) => 69 + i * 57,
      y = 303;
    for (let i = 0; i < 19; i++) {
      const inWin = i >= 8 && i <= 14;
      box(
        c,
        x(i),
        y,
        50,
        62,
        i === 1 ? '#edcab4' : i === 11 ? C.gold : inWin ? '#add3bf' : '#74888b',
        2,
      );
      txt(c, i + 1, x(i) + 25, y + 39, 19, C.ink, 'Mono', 600, 'center');
    }
    small(c, 'Definition', x(1) - 32, 265, C.cream);
    small(c, 'Match', x(11), 265, C.gold);
    if (at(1, 'three neighbors')) {
      line(c, x(8), 394, x(14) + 50, 394, C.mint, 5);
      txt(c, '3 before   +   match   +   3 after', x(8), 447, 24, C.mint);
    }
    return;
  }
  if (beat === 4) {
    title(c, 'From characters to model tokens');
    tokenRoll(c, true, true);
    return;
  }
  if (beat === 5) {
    title(c, 'Where does the rule land?');
    for (let j = 0; j < 2; j++) {
      const y = 210 + j * 160;
      small(c, ['PACKING A', 'PACKING B'][j], 63, y - 21, C.sky);
      for (let i = 0; i < 9; i++) {
        const chosen = i === (j ? 4 : 0);
        box(c, 65 + i * 117, y, 109, 69, chosen ? C.gold : '#4d6970', 4);
        if (chosen) txt(c, 'E1', 119 + i * 117, y + 45, 28, C.ink, 'Mono', 600, 'center');
      }
    }
    small(
      c,
      'Same rule, different position. Compare answers on held-out questions.',
      63,
      552,
      C.cream,
      19,
    );
    return;
  }
  title(c, 'A tray for 400 characters');
  const first = at(2, 'key section uses'),
    appendix = at(2, 'Try the longer'),
    skip = at(3, 'Skip the whole appendix'),
    second = at(3, 'smaller session section fits');
  const used = (first ? keyChars : 0) + (second ? sessionChars : 0),
    scale = 2.04,
    left = 74,
    y = 327;
  box(c, left - 5, y - 5, 400 * scale + 10, 94, '#a8b8b2', 4);
  box(c, left, y, 400 * scale, 84, C.deep);
  if (first) {
    box(c, left, y, keyChars * scale, 84, '#c8dcc2');
    txt(c, 'E1  /  key   ' + keyChars, left + 20, y + 52, 28);
  }
  if (second) {
    box(c, left + keyChars * scale, y, sessionChars * scale, 84, '#b3d0d8');
    txt(c, 'E2  /  session   ' + sessionChars, left + keyChars * scale + 15, y + 52, 24);
  }
  if (appendix && !skip) {
    paper(c, left + keyChars * scale, 185, appendixChars * scale, 72, '#efd2ad');
    txt(
      c,
      'Appendix + label + separator    ' + appendixChars,
      left + keyChars * scale + 19,
      232,
      24,
    );
    line(c, left + keyChars * scale, 263, left + keyChars * scale, y - 8, C.gold, 2);
  }
  if (skip) small(c, 'Appendix set aside whole', left, 246, C.sky, 18);
  txt(c, used + ' used', left, 498, 34, C.cream, 'Serif');
  txt(c, 400 - used + ' free', left + 750, 498, 34, C.mint, 'Serif');
  if (at(3, 'Another hit on the same'))
    small(c, 'Second key hit → already packed as E1', left, 575, C.gold, 20);
}
export function plane(
  c,
  {
    days,
    hours,
    hasRule = true,
    result = '',
    label = 'E1',
    tag = 'Current EU policy',
    signalChange,
    explainSignalLimit = false,
  },
) {
  const x = (d) => 120 + (d - 9) * 77,
    y = (h) => 480 - (h - 45) * 59;
  const signalLimit = 48;
  small(c, 'Risk signal age (hours)', 67, 130, C.sky);
  if (hasRule) {
    box(c, x(9), y(signalLimit), x(14) - x(9), y(45) - y(signalLimit), '#2d675f');
  }
  for (let d = 9; d <= 17; d++) {
    line(c, x(d), y(50), x(d), y(45), '#5b7777', 1);
    txt(c, d, x(d), 514, 18, C.cream, 'Mono', 500, 'center');
  }
  for (let h = 45; h <= 50; h++) {
    line(c, x(9), y(h), x(17), y(h), '#5b7777', 1);
    txt(c, h, 100, y(h) + 6, 18, C.cream, 'Mono', 500, 'right');
  }
  if (hasRule) {
    line(c, x(9), y(signalLimit), x(14), y(signalLimit), C.mint, 3);
    line(c, x(14), y(signalLimit), x(14), y(45), C.mint, 3);
  }
  const signalY = signalChange ? mix(y(signalChange.from), y(hours), signalChange.progress) : y(hours);
  if (signalChange) {
    const startY = y(signalChange.from);
    line(c, x(days), startY, x(days), signalY, C.gold, 3);
    circle(c, x(days), startY, 9, C.gold);
    circle(c, x(days), startY, 6, C.night);
  }
  circle(c, x(days), signalY, 13, C.deep);
  circle(c, x(days), signalY, 9, C.gold);
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  if (!signalChange || signalChange.progress === 1)
    txt(
      c,
      fmt(days) + ' d, ' + fmt(hours) + ' h',
      x(days),
      signalY - 22,
      22,
      C.gold,
      'Mono',
      600,
      'center',
    );
  txt(c, 'Days since key went stale', 271, 557, 21, C.sky);
  source(c, 792, 131, 364, 354, hasRule ? 'key' : 'session', label, { size: 20 });
  if (result) seal(c, result.toUpperCase(), 799, 543, result === 'eligible' ? C.mint : C.gold);
  if (explainSignalLimit) {
    small(c, 'Limit: ' + signalLimit + ' h', x(14) + 18, y(signalLimit) - 10, C.mint, 20);
    txt(c, hours + ' h > ' + signalLimit + ' h', 980, 543, 23, C.gold, 'Mono', 600);
  }
  if (tag) small(c, tag, 799, 605, C.sky, 15);
}
export function decision(c, k) {
  const { beat, at } = cues(k);
  title(c, 'Test Luna’s two clocks');
  const corner = ease(at(2, 'Move the key', 0.8)),
    past = ease(at(3, 'Move to day fifteen', 0.8));
  const days = Math.round(mix(mix(10, 14, corner), 15, past));
  const hasRule = !at(4, 'only the session page');
  const reveal =
    beat === 1
      ? at(1, 'so the answer is eligible')
      : beat === 2
        ? false
        : beat === 3
          ? past === 0 || at(3, 'now ineligible')
          : beat === 4
            ? false
            : at(5, 'Abstain');
  plane(c, {
    days,
    hours: 48,
    hasRule,
    result: reveal ? verdict(days, 48, hasRule ? rules : sessionOnly) : '',
    tag: hasRule
      ? 'Both edges are inclusive'
      : beat === 5
        ? 'This page supplies no key boundary'
        : 'EU Session Policy · idle timeout',
  });
}
export function citation(c, k) {
  const { beat, at } = cues(k);
  title(c, 'Open the label on the reply');
  const seven = at(2, 'E seven'),
    two = at(2, 'Try E two'),
    label = two ? 'E2' : 'E7';
  paper(c, 62, 149, 465, 367, C.white);
  small(c, seven ? 'DRAFT BUFFER' : 'PROMPT INSTRUCTIONS', 91, 193, C.teal);
  if (seven) {
    para(c, 'A key can rotate after 30 days.', 91, 264, 396, 35);
    tab(c, label, 91, 377, C.blue);
  } else
    para(
      c,
      'Write at most two sentences. Cite each source used. Abstain when the sources do not settle the question.',
      92,
      249,
      391,
      26,
    );
  if (seven && !two && at(2, 'no entry'))
    seal(
      c,
      unknownSourceLabels(
        '[E7]',
        rules.map((e) => e.sourceId),
      ).length
        ? 'UNKNOWN LABEL'
        : 'RESOLVED',
      89,
      466,
      C.red,
    );
  if (beat === 3 && at(3, 'Hold the key claim')) seal(c, 'HOLD KEY CLAIM', 89, 464, C.red);
  if (!two) {
    paper(c, 621, 151, 503, 280);
    small(c, 'PROMPT SOURCE MAP', 652, 201);
    row(c, 650, 279, 439, 'E1', 'EU key rotation');
    row(c, 650, 356, 439, 'E2', 'EU idle timeout');
  } else {
    source(c, 614, 142, 523, 375, 'session', 'E2');
    line(c, 141, 367, 511, 367, C.blue, 2);
    thread(c, 511, 367, 614, 272, C.gold);
  }
}
export function recorded(c, k) {
  const { beat, at } = cues(k);
  title(c, 'The recorded reply');
  let day = 10,
    only = false,
    quote = '',
    answer = '';
  if (beat <= 3) {
    if (at(2, 'fifteen days')) day = 15;
    if (day === 10 && at(1, 'model says yes')) quote = '“Yes, it may rotate automatically [E1].”';
    if (day === 15 && at(2, 'It says')) quote = '“stale for less than 14 days”';
    if (day === 15 && at(2, 'It goes on')) quote += ' … “The sources do not settle the question”';
    if (
      (day === 10 && at(1, 'checked answer is eligible')) ||
      (day === 15 && at(3, 'checked answer is ineligible'))
    )
      answer = verdict(day, 48);
  } else {
    only = !!at(4, 'only the session page');
    if (at(5, 'recorded reply compares'))
      quote = '“less than the 30-day expiration for idle browser sessions [E1].”';
    if (at(5, 'It then allows')) quote += ' “Therefore, it may rotate automatically.”';
    if (at(5, 'checked answer abstains')) answer = verdict(day, 48, sessionOnly);
  }
  if (beat >= 6) {
    titleStrip(c, 'Rule checker');
    paper(c, 74, 180, 1053, 366);
    const vals = [
      ['10 days', '48 hours', verdict(10, 48)],
      ['missing', '48 hours', verdict(null, 48)],
      ['true', '48 hours', verdict(true, 48)],
      ['−1 day', '48 hours', verdict(-1, 48)],
    ];
    vals.forEach(([d, h, v], i) => {
      const y = 244 + 82 * i;
      txt(c, d, 112, y, 26);
      txt(c, h, 440, y, 26);
      txt(c, v, 849, y, 25, C.teal, 'Mono');
    });
    return;
  }
  source(c, 63, 134, 470, 364, only ? 'session' : 'key', 'E1', { size: 21 });
  small(c, only ? 'One passage in this prompt' : 'E2 also holds the session rule', 68, 543, C.sky);
  paper(c, 594, 137, 547, 398, C.white);
  small(c, 'QWEN3-1.7B   /   RECORDED EXCERPT', 623, 182);
  txt(c, day + '-day key   ·   48-hour signal', 623, 235, 27, C.teal);
  if (quote) para(c, quote, 623, 300, 484, 26);
  if (
    quote &&
    (beat === 3 || beat === 5) &&
    at(beat, beat === 3 ? 'zero unknown labels' : 'Again the label exists')
  )
    small(c, 'Unknown labels   [ ]', 626, 502, C.dim);
  if (answer)
    seal(c, 'CHECKED   ' + answer.toUpperCase(), 600, 599, answer === 'eligible' ? C.mint : C.gold);
}
function titleStrip(c, s) {
  box(c, 0, 0, 1200, 109, C.night);
  title(c, s);
}
export function margin(c, k) {
  const { at } = cues(k);
  title(c, 'A note in the policy margin');
  source(c, 65, 129, 587, 392, 'key', 'E1', {
    size: 23,
    meta: 'Parent eu-access-v2    /    support:eu',
  });
  const note = at(2, 'adds a note', 0.65);
  if (note > 0) {
    c.save();
    c.translate(mix(356, 310, ease(note)), 398);
    c.rotate(-0.035);
    paper(c, 0, 0, 311, 78, '#ffe5a4');
    txt(c, 'Please open a review ticket.', 17, 44, 22, C.ink, 'Serif');
    c.restore();
  }
  small(c, 'APPLICATION GRANTS', 736, 183, C.sky);
  line(c, 737, 208, 1108, 208, C.sky);
  txt(c, 'Read policy pages', 736, 271, 30, C.mint);
  txt(c, 'Ticket tool', 737, 354, 26, C.cream);
  tab(c, 'none', 1007, 351, C.red);
  if (at(3, 'With this addition'))
    seal(c, 'RULE CHECK   ' + verdict(10, 48, noted).toUpperCase(), 735, 478, C.gold);
}
export function revoke(c, k) {
  const { beat, at } = cues(k);
  title(c, 'Which sources did this draft use?');
  const revoked = at(1, 'loses permission for the session'),
    discard = at(3, 'Discard the draft'),
    rebuild = at(3, 'Rebuild with'),
    all = at(3, 'revoke the whole');
  const currentInputs = rebuild ? rules.slice(0, 1) : rules;
  const denied = all ? ['eu-access', 'eu-session'] : revoked ? ['eu-session'] : [];
  const release = canRelease(currentInputs, denied);
  ['Key rule', 'Idle sessions'].forEach((s, i) => {
    const y = 173 + i * 176,
      off = all || (i === 1 && revoked);
    paper(c, 59, y, 404, 112);
    (i ? browser : key)(c, 104, y + 42, 0.88);
    txt(c, s, 146, y + 49, 27, C.ink, 'Serif');
    small(c, off ? 'Grant revoked' : 'Luna may read', 148, y + 88, off ? C.red : C.teal);
    if (!all && (!discard || (rebuild && i === 0)))
      thread(c, 461, y + 51, 679, 289 + (i ? 42 : 0), off ? C.coral : C.gold);
  });
  if (!discard || (rebuild && release)) {
    paper(c, 679, 184, 453, 273);
    small(c, rebuild ? 'REBUILT FROM KEY RULE' : 'BUFFERED DRAFT', 708, 228);
    if (!rebuild || at(3, 'supports a fresh yes'))
      txt(c, 'Eligible. [E1]', 708, 333, 43, C.ink, 'Serif');
    small(
      c,
      currentInputs.length + ' model input' + (currentInputs.length === 1 ? '' : 's'),
      707,
      406,
    );
  } else {
    txt(
      c,
      all ? (at(3, 'so abstain') ? 'Abstain' : 'No permitted input') : 'Draft discarded',
      696,
      319,
      39,
      C.gold,
      'Serif',
    );
  }
  if (beat === 4 || beat === 5) {
    small(
      c,
      beat === 4
        ? 'Cache hits use the same dependency check.'
        : 'Release boundary   /   recheck or cancel if the lease expires.',
      65,
      590,
      C.sky,
      18,
    );
  }
}
export function cache(c, k) {
  const { beat, at } = cues(k);
  if (beat === 3) {
    title(c, 'Keep the audit copy under separate access');
    paper(c, 74, 153, 483, 356);
    small(c, 'RESTRICTED TRACE', 103, 201);
    para(
      c,
      'Request ID, permitted IDs, versions, source map, decisions and timings.',
      102,
      271,
      424,
      29,
    );
    box(c, 639, 158, 493, 345, '#46636a', 13);
    box(c, 653, 170, 465, 320, C.deep, 8);
    circle(c, 710, 291, 32, '#73908f');
    line(c, 697, 291, 722, 291, C.deep, 4);
    txt(c, 'Audit store', 783, 263, 36, C.cream, 'Serif');
    para(
      c,
      'Exact inputs and outputs, with separate access and retention.',
      782,
      321,
      305,
      23,
      C.sky,
      'Sans',
    );
    return;
  }
  title(c, 'Can this request use the cached reply?');
  const different = at(2, 'Change the request to fifteen'),
    judged = at(2, 'Compute a fresh denial');
  for (const [i, side] of ['Cached answer', 'Incoming request'].entries()) {
    const x = 70 + i * 558;
    paper(c, x, 135, 500, 401, i ? '#e2e9d6' : C.paper);
    txt(c, side, x + 26, 188, 35, C.ink, 'Serif');
    row(c, x + 25, 245, 446, 'Principal / scope', 'Luna · EU');
    row(c, x + 25, 295, 446, 'Bundle / ACL', 'A · grant 12');
    row(c, x + 25, 345, 446, 'Prompt / model', 'p1 · m1');
    row(
      c,
      x + 25,
      395,
      446,
      'Key / signal',
      (different && i ? 15 : 10) + ' d / 48 h',
      different && i ? C.red : C.teal,
    );
    if (!i || judged)
      seal(
        c,
        verdict(different && i ? 15 : 10, 48).toUpperCase(),
        x + 25,
        480,
        different && i ? C.red : C.teal,
      );
  }
  txt(c, 'EU rotation rule    ·    Key age ≤ 14 days    ·    Signal age ≤ 48 hours', 73, 578, 25, C.cream);
  small(c, 'Intent: automatic rotation     ·     Effective date: 27 May 2026', 73, 625, C.sky);
}
