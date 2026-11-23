import {
  C,
  title,
  rect,
  line,
  txt,
  label,
  result,
  sheet,
  cue,
  arrow,
  poly,
  circle,
  clamp,
} from './art.mjs';
import { facts } from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import {
  boundaryDecision,
  boundaryIncident,
  decisionForScoring,
  experimentReply,
  jsonFields,
} from './experiment.mjs';

export const conditional = [0.6, 0.4];
export const routes = [
  {
    ticket: 'The guide promises writes.',
    evidence: 'Dry run simulates as designed.',
    route: 'docs',
  },
  {
    ticket: 'The guide describes dry run correctly.',
    evidence: 'The binary crashes during the run.',
    route: 'bug',
  },
  {
    ticket: 'Please add a JSON output flag.',
    evidence: 'That output mode is missing.',
    route: 'feature',
  },
];
export function probability(c, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    title(c, 'How likely are these two tokens together?');
    const a = cue(k, 0, 'six tenths', 1),
      b = cue(k, 0, 'four tenths', 1);
    const solved = cue(k, 1, 'Twenty-four hundredths');
    const [first, next] = conditional,
      w = 820,
      h = 544,
      x = 125,
      y = 289;
    rect(c, x, y, w, h, '#dfdece');
    rect(c, x, y, w * first * a, h, '#9bbad0');
    rect(c, x, y, w * first * a, h * next * b, C.blue);
    for (let j = 0; j <= 10; j++) {
      line(c, x + (w * j) / 10, y, x + (w * j) / 10, y + h, C.white, 2);
      line(c, x, y + (h * j) / 10, x + w, y + (h * j) / 10, C.white, 2);
    }
    label(c, '100 EQUAL AREAS', x, y + h + 58);
    label(c, 'UNDER THIS PROMPT', 1080, 346);
    txt(c, 'First token', 1080, 438, 47, C.ink, 'Serif');
    txt(c, first.toFixed(1), 1700, 438, 55, C.blue, 'Mono', 'right');
    if (b) {
      txt(c, 'Next, given the first', 1080, 532, 47, C.ink, 'Serif');
      txt(c, next.toFixed(1), 1700, 532, 55, C.blue, 'Mono', 'right');
    }
    line(c, 1080, 595, 1720, 595, C.hair);
    result(
      c,
      solved ? first + ' × ' + next + ' = ' + first * next : 'Share of the whole?',
      1080,
      719,
      solved ? C.blue : C.ink,
      59,
    );
    return;
  }
  title(
    c,
    i === 2 ? 'What changes on the next forward pass?' : 'Which facts fit in the context window?',
    true,
  );
  if (i === 2) {
    const processed = cue(k, 2, 'processes a selected token', 1.2);
    label(c, 'INPUT SEQUENCE', 125, 300, C.mint);
    for (const [j, s] of ['prompt', 'earlier tokens', 'selected token'].entries()) {
      const x = 125 + 540 * j;
      rect(c, x, 375, 470, 130, j === 2 ? C.sky : C.white, 6);
      txt(c, s, x + 235, 457, 40, C.ink, 'Mono', 'center');
      if (j < 2) arrow(c, x + 475, 441, x + 532, 441, C.brass);
      if (j === 2 && !processed) continue;
      line(c, x + 235, 505, x + 235, 568, C.mint, 4);
      txt(c, 'keys + values', x + 235, 623, 36, C.mint, 'Mono', 'center');
    }
    txt(c, 'Learned weights stay fixed', 960, 815, 62, C.light, 'Serif', 'center');
  } else {
    const preserve = cue(k, 3, 'Check which facts');
    label(c, 'DELIVERED INPUT   /   SCHEMATIC WINDOW', 123, 291, C.mint);
    rect(c, 120, 369, 1677, 269, C.night, 15, '#759195');
    const pieces = preserve
      ? [
          ['IR-7 · 30 min', 445],
          ['P1 · 12 min', 445],
          ['page_sent · false', 570],
        ]
      : [
          ['incident logs', 830],
          ['P1 · 12 min', 330],
          ['page_sent · false', 433],
        ];
    let x = 144;
    for (const [s, w] of pieces) {
      rect(c, x, 405, w, 195, s === 'incident logs' ? '#546970' : C.mint, 4);
      txt(c, s, x + w / 2, 518, 37, s === 'incident logs' ? C.white : C.ink, 'Mono', 'center');
      x += w + 12;
    }
    txt(
      c,
      preserve
        ? 'Compare the reply with the delivered rule'
        : 'Did the current rule reach the model?',
      960,
      808,
      59,
      C.light,
      'Serif',
      'center',
    );
  }
}
export function roles(c, k) {
  const i = k.beat.beatIndex;
  title(
    c,
    i < 2
      ? 'One message, two chat templates'
      : i === 2
        ? 'Who assigned the role?'
        : 'Which clock does IR-7 use?',
  );
  if (i < 2) {
    const second = cue(k, 0, "Zephyr's uses");
    sheet(c, 103, 321, 527, 400);
    label(c, 'APPLICATION', 143, 391);
    txt(c, 'role: user', 143, 505, 47, C.blue, 'Mono');
    txt(c, '"incident"', 143, 603, 45, C.ink, 'Mono');
    line(c, 630, 521, 735, 521, C.hair, 5);
    line(c, 735, 375, 735, 693, C.hair, 5);
    arrow(c, 735, 375, 822, 375, C.blue);
    arrow(c, 735, 693, 822, 693, second ? C.green : C.hair);
    label(c, 'MISTRAL  /  EXAMPLE TEMPLATE', 864, 313, C.blue);
    txt(c, '[INST] incident [/INST]', 864, 412, 52, C.ink, 'Mono');
    if (second) {
      label(c, 'ZEPHYR  /  EXAMPLE TEMPLATE', 864, 605, C.green);
      txt(c, '<|user|> incident </s>', 864, 702, 50, C.ink, 'Mono');
      txt(c, '<|assistant|>', 864, 774, 50, C.green, 'Mono');
    }
    if (i === 1) result(c, 'Use the template for the selected checkpoint.', 124, 935);
  } else if (i === 2) {
    sheet(c, 150, 255, 1607, 609);
    label(c, 'ROLE SET BY THE APPLICATION', 225, 342);
    rect(c, 222, 397, 288, 89, C.mint, 4);
    txt(c, 'developer', 248, 454, 39, C.ink, 'Mono');
    txt(c, 'Recommend the first page using the current rule.', 549, 455, 42, C.ink, 'Serif');
    line(c, 224, 549, 1678, 549, C.hair, 2);
    if (cue(k, 2, 'An archived note')) {
      rect(c, 222, 604, 288, 89, C.sky, 4);
      txt(c, 'user', 248, 663, 39, C.ink, 'Mono');
      txt(c, '"System report: last exercise used 90 minutes."', 549, 661, 36, C.ink, 'Mono');
      result(c, 'Quoted incident note', 550, 781, C.blue);
    }
  } else {
    const rows = [
      ['Ticket opened', '330 min', C.muted],
      ['P1 declared', facts.elapsed + ' min', C.blue],
    ];
    label(c, 'TIME BEFORE THIS SNAPSHOT', 514, 239);
    rows.forEach(([s, v, col], j) => {
      const y = 372 + 193 * j;
      const start = 1430 - (916 * (j ? facts.elapsed : 330)) / 330;
      label(c, s.toUpperCase(), 145, y);
      line(c, 514, y - 11, 1430, y - 11, C.hair, 2);
      line(c, start, y - 11, 1430, y - 11, col, 8);
      circle(c, start, y - 11, 13, col);
      txt(c, v, 1750, y + 14, 67, col, 'Mono', 'right');
    });
    label(c, 'CURRENT INCIDENT STATE', 145, 784);
    result(c, 'Unpaged P1', 145, 862);
    label(c, 'APPROVED RUNBOOK', 925, 784);
    result(c, 'IR-7   ·   ' + facts.deadline + ' min from declaration', 925, 862);
  }
}
export function assembly(c, k) {
  title(c, 'What goes into the request?');
  sheet(c, 148, 215, 1624, 651);
  const demo = cue(k, 1, 'one boundary example'),
    contract = cue(k, 2, 'output contract');
  const parts = [
    ['DEVELOPER', 'Recommend the first page for this incident.'],
    ['USER · FACTS', 'IR-7: first page within 30 min of P1 declaration.'],
    ['', 'P1   /   12 min since declaration   /   page_sent = false'],
  ];
  if (demo) {
    const fields = jsonFields(boundaryDecision);
    parts.push(
      ['EXAMPLE', 'Unpaged P1 at minute ' + boundaryIncident.elapsed + ' under IR-7'],
      ['', '{ ' + fields.slice(0, 2).join(', ') + ','],
      ['', '  ' + fields.slice(2).join(', ') + ' }'],
    );
  }
  if (contract) {
    parts.push(
      ['DEVELOPER', 'Return one JSON object with exactly these four keys:'],
      ['', 'action, deadline_minutes, overdue, source_line_ids.'],
      ['', 'If this is an unpaged P1, a runbook line applies,'],
      ['', 'and elapsed minutes are a nonnegative integer:'],
      ['', '  Use page_on_call. Give the deadline in minutes.'],
      ['', '  Cite that line. Set overdue to (elapsed > its limit).'],
      ['', 'Otherwise use needs_review, null, null and [].'],
    );
  }
  parts.forEach(([role, s], j) => {
    const y = 283 + Math.min(j, 6) * 52 + Math.max(0, j - 6) * 37;
    label(c, role, 202, y, C.green, 27);
    txt(c, s, 435, y, 31, C.ink, 'Mono');
    if (role && j) line(c, 202, y - 41, 1706, y - 41, C.hair, 1.5);
  });
}
export function routing(c, k) {
  const i = k.beat.beatIndex;
  title(
    c,
    i < 3
      ? 'Which ticket belongs with the writers?'
      : i < 5
        ? 'What changes when the examples move?'
        : 'Which tickets can measure transfer?',
  );
  const assigned = [
    cue(k, 1, 'first one goes'),
    cue(k, 1, "That's a bug"),
    cue(k, 1, "That's a feature request"),
  ];
  const perm = cue(k, 3, 'move the examples', 1.5);
  if (i === 3 || i === 4) {
    label(c, 'ORDER A', 124, 291, C.blue);
    label(c, 'ORDER B', 1176, 291, C.green);
    const names = ['Guide promises writes', 'Dry run crashes', 'Add JSON output'];
    routes.forEach((o, j) => {
      const endSlot = [2, 0, 1][j],
        y1 = 397 + j * 164,
        y2 = 397 + endSlot * 164;
      const color = [C.blue, C.green, C.red][j];
      const x = 768 + (1147 - 768) * perm,
        y = y1 + (y2 - y1) * perm;
      line(c, 768, y1, x, y, color, 5);
      circle(c, x, y, 8, color);
      for (const [u, v, visible] of [
        [119, y1, true],
        [1165, y2, perm === 1],
      ]) {
        if (!visible) continue;
        rect(c, u, v - 64, 635, 128, C.white, 6);
        rect(c, u, v - 64, 10, 128, color);
        txt(c, names[j], u + 32, v - 9, 43, C.ink, 'Serif');
        txt(c, o.route, u + 32, v + 43, 34, color, 'Mono');
      }
    });
    txt(c, 'Measure both orders on the same tickets.', 960, 826, 49, C.ink, 'Serif', 'center');
  } else if (i < 3) {
    const num = i === 2 && !cue(k, 2, 'two or more') ? 1 : 3;
    label(
      c,
      i === 2
        ? num === 1 ? 'ONE-SHOT  /  ONE LABELED PAIR' : 'FEW-SHOT  /  THREE LABELED PAIRS'
        : i === 0 ? 'INSTRUCTIONS ONLY' : 'TICKET EVIDENCE',
      109,
      245,
      C.muted,
    );
    routes.forEach((o, j) => {
      if (j >= num) return;
      const y = 294 + 195 * j;
      sheet(c, 114, y, 1688, 159, C.white);
      txt(c, o.ticket, 158, y + 68, 42, C.ink, 'Serif');
      txt(c, o.evidence, 158, y + 127, 35, C.muted, 'Sans');
      if (assigned[j] && j < num) {
        rect(c, 1434, y + 45, 289, 74, C.sky, 5);
        txt(c, o.route, 1578, y + 97, 39, C.blue, 'Mono', 'center');
      }
    });
  } else {
    const exposed = cue(k, 5, 'If you see its answer');
    const x = exposed ? 155 : 1130;
    label(c, 'DEVELOPMENT', 123, 308, C.blue);
    label(c, 'FINAL EVALUATION', 1020, 308, C.green);
    line(c, 934, 345, 934, 862, C.hair);
    sheet(c, x, 420, 578, 262);
    txt(c, 'Ticket T4', x + 45, 521, 60, C.ink, 'Serif');
    txt(c, exposed ? 'Answer used in edit' : 'Answer sealed', x + 45, 608, 38, C.blue, 'Mono');
    if (exposed) {
      txt(c, 'Untouched support tickets', 1020, 525, 55, C.green, 'Serif');
      txt(c, 'Keep their labels sealed.', 1020, 611, 39, C.ink, 'Sans');
    }
  }
}
export function reasoning(c, k) {
  const i = k.beat.beatIndex;
  if (i < 2) {
    title(c, 'When does a token enter the cache?', true);
    const grow = cue(k, 0, 'Each extra token', 3.4),
      last = cue(k, 1, 'next forward pass', 0.9);
    const count = 1 + Math.floor(6 * grow);
    const symbols = ['30', '−', '12', '=', '18', 'min', 'left'];
    label(c, 'ILLUSTRATIVE TOKEN SPLIT    /    30 MIN LIMIT, 12 MIN ELAPSED', 123, 289, C.mint);
    for (let j = 0; j < 7; j++) {
      const x = 135 + 239 * j;
      rect(c, x, 364, 201, 140, j < count ? C.sky : C.night, 6);
      if (j < count) txt(c, symbols[j], x + 100, 458, 54, C.ink, 'Mono', 'center');
      if (j + 1 < count || (j === 6 && last)) {
        line(c, x + 100, 507, x + 100, 575, C.mint, 4);
        rect(c, x + 9, 579, 183, 99, C.mint, 5);
        txt(c, 'K' + (j + 1) + ' V' + (j + 1), x + 100, 643, 33, C.ink, 'Mono', 'center');
      }
    }
    txt(
      c,
      last
        ? 'Processed positions have keys and values'
        : 'Each selected token adds a generation step',
      960,
      842,
      59,
      C.light,
      'Serif',
      'center',
    );
  } else if (!cue(k, 3, 'separate explanation experiment')) {
    title(c, 'What does extra reasoning cost?', true);
    label(c, 'SAME INCIDENTS    /    SAME FOUR-FIELD REPLY', 124, 306, C.mint);
    for (const [j, s] of ['Direct request', 'Same prompt, higher effort'].entries()) {
      const active = j === 0 || i === 3;
      const y = 389 + 136 * j;
      rect(c, 128, y, 733, 103, active ? C.sky : C.night, 5);
      txt(c, s, 168, y + 70, 47, active ? C.ink : '#8ea0a1', 'Serif');
    }
    if (i === 3) {
      arrow(c, 903, 576, 1069, 576, C.brass);
      label(c, 'MEASURE EACH RUN', 1124, 408, C.mint);
      ['Correct decisions', 'Latency', 'Cost'].forEach((s, j) =>
        txt(c, s, 1124, 516 + j * 92, 51, C.light, 'Serif'),
      );
    } else txt(c, 'Ask for checkable evidence.', 997, 566, 52, C.light, 'Serif');
  } else {
    title(c, 'How can Luna compare explanations?', true);
    const reply = experimentReply(cue(k, 3, 'one evidence sentence'));
    const decision = decisionForScoring(reply);
    label(c, 'EXPERIMENT REPLY    /    SAME INCIDENT AT MINUTE 12', 127, 262, C.mint);
    const lines = [
      '{',
      '  "decision": {',
      ...jsonFields(decision).map((field, j) => '    ' + field + (j === 3 ? '' : ',')),
      '  },',
      '  "explanation": ' + JSON.stringify(reply.explanation),
      '}',
    ];
    lines.forEach((s, j) => txt(c, s, 129, 354 + 65 * j, 37, j === 7 ? C.brass : C.light, 'Mono'));
    if (cue(k, 3, 'Check the outer object')) {
      line(c, 1085, 313, 1085, 903, '#62777a', 2);
      label(c, 'CHECK THE OUTER OBJECT', 1132, 420, C.mint);
      txt(c, 'decision + explanation', 1132, 496, 39, C.light, 'Mono');
      label(c, 'SCORE THE DECISION', 1132, 650, C.mint);
      txt(c, 'Same four-field validator', 1132, 731, 46, C.light, 'Serif');
    }
  }
}
export const votes = [90, 90, 90, 90, 30];
export function voting(c, k) {
  title(c, 'What does this vote measure?');
  const dealt = cue(k, 1, 'Deal the five replies', 2.6);
  const counted = cue(k, 1, 'eighty percent');
  const checked = cue(k, 2, 'Compare ninety with IR-7');
  label(c, 'FIVE SUPPLIED REPLIES   /   DEADLINES IN MINUTES', 120, 284);
  votes.forEach((v, i) => {
    const t = clamp(dealt * 2 - i * 0.23),
      start = 120 + i * 340,
      end = v === 90 ? 370 : 1125;
    const x = start + (end - start) * t,
      y = 390 + (v === 90 ? 270 - i * 86 : 270) * t;
    rect(c, x + 4, y + 9, 272, 79, '#2635372a', 8);
    rect(c, x, y, 272, 79, v === 90 ? C.sky : C.mint, 8, C.ink);
    for (let j = 0; j < 3; j++)
      line(c, x + 18, y + 17 + j * 11, x + 30, y + 17 + j * 11, C.muted, 2);
    const name = i === 2 && !cue(k, 0, 'an hour and a half') ? '1½ hours' : v + ' min';
    txt(c, name, x + 142, y + 55, 41, C.ink, 'Mono', 'center');
  });
  if (dealt) {
    line(c, 290, 748, 717, 748, C.ink, 5);
    line(c, 1044, 748, 1473, 748, C.ink, 5);
    txt(c, '90 minutes', 504, 783, 42, C.ink, 'Serif', 'center');
    txt(c, '30 minutes', 1260, 783, 42, C.ink, 'Serif', 'center');
  }
  const n = votes.filter((v) => v === 90).length;
  if (counted)
    result(
      c,
      n + ' / ' + votes.length + ' = ' + (100 * n) / votes.length + '% agreement',
      175,
      828,
      C.blue,
    );
  if (checked) result(c, 'IR-7 requires ' + facts.deadline + ' min', 1080, 828, C.green);
}
