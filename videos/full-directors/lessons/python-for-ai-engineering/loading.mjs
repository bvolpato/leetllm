import {
  validLoad,
  lineCases,
  parse,
  readLines,
  fourLines,
  fiveLines,
  decodePairs,
  paired,
  unique,
  bool,
  decisions,
  audit,
  subset,
  coverage,
  probability,
  decimalInputs,
} from './examples.mjs';

export function boundary(s) {
  const { c, b, cue, txt, label, line, disk, footer } = s;
  const xs = [54, 402, 625, 835];
  ['After “prediction” and colon', 'json.loads', 'field check', 'compare'].forEach((v, i) =>
    label(v, xs[i], 137),
  );
  const outcomes = lineCases.map((raw) => parse(raw, 2));
  const decode = cue(0, 'Decoding produces a dictionary'),
    reject = cue(1, 'raise TypeError', 0.36, false);
  const invalid = cue(3, 'the line fails inside', 0.36, 'This time the line fails inside');
  const fragments = ['" ESCALATED "}', '7}', '}'];
  const active = [1, 1, 1, 2, 2][b];
  for (let i = 0; i < 3; i++) {
    if (i === 2 && b < 3) continue;
    const y = 202 + i * 87,
      res = outcomes[i];
    if (i === active) s.paint(41, y - 31, 878, 70, c.wash);
    txt(fragments[i], 54, y - 3, 24);
    const end =
      i === 0 ? 3 : i === 1 ? (reject === 1 ? 2 : decode === 1 ? 1 : 0) : invalid === 1 ? 1 : 0;
    const stopped = (i === 1 && end === 2) || (i === 2 && end === 1);
    const color = i === 0 ? c.accent : stopped ? c.red : c.gold;
    line(60, y + 24, 856, y + 24, c.line, 1, true);
    line(60, y + 24, xs[end] + 16, y + 24, color, 3);
    disk(xs[end] + 16, y + 24, 6, color);
    if (end >= 1)
      txt(res.decoded ? 'dict' : 'JSONDecodeError', xs[1], y - 3, 20, {
        color: res.decoded ? c.ink : c.red,
        width: 185,
      });
    if (end >= 2)
      txt(i === 0 ? 'str' : res.type, xs[2], y - 3, 20, { color: i === 0 ? c.ink : c.red });
    if (end === 3)
      txt(
        bool(res.row.expected.trim().toLowerCase() === res.row.prediction.trim().toLowerCase()),
        xs[3],
        y - 3,
        20,
        { color: c.ink },
      );
  }
  const f =
    b === 0
      ? 'Can a JSON number reach exact_match?'
      : b === 1
        ? 'isinstance(row["prediction"], str)'
        : b === 2
          ? outcomes[1].message
          : b === 3
            ? 'ValueError: ' + outcomes[2].message
            : 'Only the top path produces a decision for request 102.';
  footer(f, b === 2 || b === 3 ? c.red : c.accent);
}

function pairSpool(s, pairs, which, value, strict) {
  const { c, paper, label, txt, wire, rect } = s;
  label('Pairs in file order', 51, 144);
  pairs.forEach(([k, v], i) => {
    const x = 53 + i * 306;
    paper(x, 170, 285, 101, i === which ? c.wash : c.paper);
    txt('"' + k + '"', x + 15, 211, 21);
    txt(JSON.stringify(v), x + 15, 246, 22);
  });
  const x = 53 + 306 * which + 145;
  s.line(x, 277, x, 308, c.gold, 2);
  s.disk(x, 276, 4, c.gold);
  label(
    strict
      ? 'object_pairs_hook   ·   seen names'
      : 'Decoded dictionary   ·   one slot for this key',
    51,
    329,
  );
  rect(52, 351, 849, 64);
  txt(value, 74, 383, 23, { color: strict ? c.gold : c.accent, width: 803 });
}

export function decoder(s) {
  const { c, b, cue, txt, label, line, footer } = s;
  if (b <= 2) {
    if (b === 0) {
      const data = [
        ['{}', 'dict'],
        ['[]', 'list'],
        ['true', 'True · bool'],
        ['null', 'None'],
        ['7', 'int'],
        ['7e0', 'float'],
      ];
      data.forEach(([a, z], i) => {
        const x = 56 + (i % 3) * 293,
          y = 171 + Math.floor(i / 3) * 119;
        s.paper(x, y, 268, 93);
        txt(a, x + 14, y + 50, 24);
        txt('→ ' + z, x + 86, y + 50, 21, { width: 173 });
      });
      footer('json.loads chooses a Python value before the scorer checks its fields.');
    } else {
      label('Python 3.12 default   ·   decimal integers', 56, 144);
      txt('4,300 digits', 56, 204, 33, { face: 'serif' });
      s.wire(312, 200, 479, 200);
      txt('4,301 digits', 501, 204, 33, { face: 'serif' });
      txt('ValueError before field checks', 501, 253, 21, { color: c.red, width: 405 });
      line(57, 291, 900, 291);
      const show = cue(1, 'Now try the empty array');
      if (show > 0) {
        txt('[]', 58, 355, 48);
        s.wire(172, 350, 339, 350);
        txt('list', 361, 353, 32);
        if (b === 2) {
          s.wire(477, 350, 600, 350);
          txt('TypeError', 630, 353, 32, { color: c.red });
        }
      }
      footer(
        b === 1
          ? 'The loader adds a line number only when it catches JSONDecodeError here.'
          : 'A whole JSONL record must decode to a dictionary.',
      );
    }
  } else if (b <= 5) {
    const pairs = [
      ['prediction', 'blocked'],
      ['prediction', 'escalated'],
    ];
    const strict = b === 5,
      advance = strict ? cue(5, 'Advance one pair') : cue(3, 'Then the decoder reads');
    const which = advance === 1 ? 1 : 0;
    const result = decodePairs(pairs.slice(0, which + 1), strict);
    const v = result.duplicate
      ? 'duplicate key: ' + result.duplicate
      : strict
        ? 'seen = {"prediction"}'
        : 'row["prediction"] = ' + JSON.stringify(result.dict.prediction);
    pairSpool(s, pairs, which, v, strict);
    footer(
      b === 4
        ? 'expected = "blocked"     ·     surviving prediction = "escalated"     ·     False'
        : strict
          ? 'The strict hook can inspect both names before a dictionary exists.'
          : 'The second value replaces the first in the same slot.',
    );
  } else {
    const visibleDefault = cue(7, 'Now follow the strict hook', 0);
    const visibleStrict = [
      b > 7 || (b === 7 && s.clock.elapsed >= s.clock.speechDuration),
      b === 8 && s.clock.elapsed >= s.clock.speechDuration,
    ];
    label('Pairs before decoding   ·   prediction is "sent" in both', 49, 142);
    [paired, unique].forEach((pairs, i) => {
      const x = 51 + i * 446;
      s.paper(x, 170, 413, 222);
      label(i ? 'Edited file' : 'Saved file', x + 16, 209);
      const keys = pairs
        .filter(([k]) => k === 'expected')
        .map(([, v]) => JSON.stringify(v))
        .join(' then ');
      txt(keys, x + 16, 248, 22, { width: 382 });
      line(x + 16, 273, x + 395, 273);
      const { dict } = decodePairs(pairs),
        d = decodePairs(pairs, true);
      txt(
        'default   ' +
          (visibleDefault ? bool(dict.expected.trim().toLowerCase() === dict.prediction) : '?'),
        x + 16,
        313,
        23,
      );
      txt(
        'strict    ' + (visibleStrict[i] ? (d.duplicate ? 'reject duplicate' : 'True') : '?'),
        x + 16,
        356,
        23,
        { width: 377, color: visibleStrict[i] && d.duplicate ? c.red : c.ink },
      );
    });
    footer('The scorer copies three required strings. The extra confidence flag stays out.');
  }
}

export function cursor(s) {
  const { c, b, cue, txt, label, paper, footer } = s;
  if (b >= 6) {
    const closed = cue(6, 'after the file closes') > 0;
    const count = Math.floor(
      validLoad.returned.length * cue(6, 'appends every accepted dictionary', 1.6),
    );
    label(closed ? 'Valid JSONL file   ·   closed' : 'Valid JSONL file   ·   reading', 53, 133);
    label('Request IDs from the prompt text', 906, 133, { align: 'right' });
    validLoad.returned.forEach((row, i) => {
      const x = 52 + i * 289;
      const id = row.prompt.match(/\d+/)[0];
      txt('line ' + (i + 1) + '   ·   ' + id, x + 5, 167, 22);
      if (i >= count) return;
      s.line(x + 124, 185, x + 124, 214, c.accent, 2);
      s.disk(x + 124, 214, 3.5, c.accent);
      paper(x, 220, 275, 207);
      label('rows[' + i + ']   ·   dict', x + 12, 257, { color: c.accent });
      label('prompt', x + 12, 289);
      txt(row.prompt, x + 12, 313, 18, { width: 253 });
      label('expected', x + 12, 350);
      label('prediction', x + 138, 350);
      txt(JSON.stringify(row.expected), x + 12, 382, 18, { width: 118 });
      txt(JSON.stringify(row.prediction), x + 138, 382, 18, { width: 126 });
    });
    footer(
      b === 7
        ? 'Running counts use less memory. A later invalid line still needs a policy.'
        : closed
          ? 'The returned list keeps all three dictionaries in memory.'
          : 'Append each parsed dictionary in file order.',
    );
    return;
  }
  const inserted = b >= 2 && cue(2, 'Now insert an empty array') > 0;
  const lines = inserted ? fiveLines : fourLines;
  const load = readLines(lines);
  const found = cue(4, 'The object check raises TypeError') > 0;
  const described = cue(4, 'The loader accepted just one row') > 0;
  const reached =
    b < 2
      ? cue(0, 'The next object') > 0
        ? 4
        : cue(0, 'accepts a request') > 0
          ? 2
          : 1
      : b === 2 && !inserted
        ? 4
        : b < 4
          ? 0
          : load.error.line;
  label('File on disk   ·   physical lines', 53, 135);
  paper(51, 153, 475, 273);
  lines.forEach((raw, i) => {
    const y = 203 + i * 42;
    if (i + 1 === reached) s.paint(61, y - 16, 452, 32, c.wash);
    txt(String(i + 1).padStart(2, '0'), 68, y, 20, { color: c.dim });
    const row = raw && JSON.parse(raw);
    const v = !raw
      ? '(blank)'
      : Array.isArray(row)
        ? '[]'
        : row.prompt.replace('Access request ', '').replace(' status?', '') +
          ('prediction' in row ? '   valid fields' : '   missing prediction');
    txt(v, 128, y, 21, { width: 378 });
  });
  label('Loader', 569, 141);
  if (b === 2 && !inserted) {
    txt('end of file', 569, 217, 30);
    txt('second loop: 0 lines', 569, 283, 20);
  } else if (b === 3 || b === 2) {
    txt('fresh handle', 569, 216, 30);
    txt('first failure?', 569, 282, 25, { color: c.gold });
  } else if (b < 2) {
    txt(reached >= 2 ? 'accepted ID: 101' : 'no accepted IDs', 569, 219, 24, { color: c.accent });
    if (b === 1) {
      txt(load.error.type, 569, 290, 31, { color: c.red });
      txt(load.error.message, 569, 353, 19, { color: c.red, width: 342 });
    }
  } else {
    txt(described ? load.error.type : found ? 'object check' : '[]  →  list', 569, 212, 35, {
      color: described ? c.red : c.ink,
    });
    txt('physical line ' + load.error.line, 569, 266, 23);
    if (described) {
      txt('accepted ID: 101', 569, 323, 22);
      txt(b === 5 ? 'file closed · no return' : 'line 5 unread', 569, 380, 20, {
        width: 337,
        color: c.dim,
      });
    }
  }
  footer(
    b === 5
      ? 'stdout remains empty. Main received no list to score.'
      : 'for line_number, line in enumerate(handle, start=1):',
  );
}

export function failures(s) {
  const { c, b, cue, txt, label, line, footer } = s;
  if (b < 4) {
    const cases = [
      [
        ['if ready', 'SyntaxError'],
        ['path.open(…)', 'FileNotFoundError'],
      ],
      [
        ['json.loads(line)', 'JSONDecodeError'],
        ['raise … from error', 'ValueError: line 2: invalid JSON'],
      ],
      [
        ['missing prediction', 'KeyError'],
        ['prediction = 7', 'TypeError'],
        ['prediction = "   "', 'ValueError'],
        ['"escalated" == "blocked"', 'False'],
      ],
      [
        ['main(path)', 'load_examples(path)'],
        ['load_examples(path)', 'parse_example(line, 2)'],
        ['parse_example(line, 2)', 'TypeError: line 2: prediction must be a string'],
      ],
    ][b];
    label(
      b === 3
        ? 'Read the final exception, then trace the calls upward.'
        : b === 2
          ? 'What Python returns or raises'
          : 'First operation that cannot continue',
      56,
      143,
    );
    cases.forEach(([a, z], i) => {
      const y = 192 + i * (cases.length === 2 ? 113 : 65);
      txt(a, 57, y, 23, { width: 398 });
      s.wire(464, y, 535, y);
      txt(z, 551, y, 23, { width: 347, color: z === 'False' ? c.accent : c.red });
    });
    footer(
      [
        'Compilation comes before opening the input path.',
        'The outer message adds the line number. The cause preserves the decoder error.',
        'A valid mismatch adds one scored row and zero matches.',
        'Handle an exception where you can add context or recover.',
      ][b],
    );
  } else {
    const routed = Math.floor(cue(4, 'Watch these four requests', 2.8) * audit.length);
    label('Attempted requests', 55, 126);
    s.rect(53, 215, 478, 76, c.wash);
    s.rect(546, 215, 361, 76, c.rose);
    label('Accepted', 65, 232, { color: c.accent });
    label('Quarantine', 559, 232, { color: c.red });
    const positions = [127, 291, 453, 725];
    audit.forEach(({ id, prediction, result }, i) => {
      const x = positions[i];
      txt(id, x, 156, 24, { align: 'center' });
      if (i >= routed) return;
      const color = result.row ? c.accent : c.red;
      s.line(x, 175, x, 214, color, 2);
      s.disk(x, 214, 4, color);
      if (result.row) {
        txt(id + ' ' + bool(decisions([result.row])[0]), x, 265, 20, { align: 'center' });
      } else {
        txt(id + '   prediction = ' + JSON.stringify(prediction), 559, 254, 18);
        txt(result.type + ' · ' + result.message.split(': ')[1], 559, 277, 16, {
          width: 336,
          color,
        });
      }
    });
    if (b === 4) {
      if (routed === audit.length) {
        txt(audit.length + ' attempted', 54, 357, 28);
        txt(subset.total + ' accepted', 350, 357, 28);
        txt(audit.length - subset.total + ' rejected', 644, 357, 28);
      }
      footer('Save each rejected request with its original value and reason.');
      return;
    }
    const quantities = [
      {
        title: 'Accuracy',
        r: subset,
        numerator: 'matches',
        denominator: 'accepted',
        floor: '2/3',
        mark: 2 / 3,
        counted: cue(6, "That's enough for accuracy", 0),
        judged: cue(6, 'Only three of the four', 0),
      },
      {
        title: 'Coverage',
        r: coverage,
        numerator: 'accepted',
        denominator: 'attempted',
        floor: '95%',
        mark: 0.95,
        counted: cue(6, 'Seventy five percent', 0),
        percentSpoken: cue(6, 'falls short of the required', 0),
        judged: cue(6, 'Hold this release', 0),
      },
    ];
    quantities.forEach(({ title, r, numerator, denominator, floor, mark, counted, percentSpoken, judged }, i) => {
      const x = 55 + i * 447;
      label(title + '   ·   floor ' + floor, x, 325);
      txt(
        r.matches + ' ' + numerator + ' / ' + (counted ? r.total + ' ' + denominator : '____'),
        x,
        362,
        23,
      );
      const w = 391;
      s.paint(x, 392, w, 15, c.line);
      if (judged) s.paint(x, 392, (w * r.matches) / r.total, 15, r.pass ? c.accent : c.red);
      line(x + w * mark, 382, x + w * mark, 416, c.gold, 3);
      const reading = percentSpoken ? r.ratio + ' = ' + (100 * r.matches) / r.total + '%' : r.ratio;
      if (judged)
        label(reading + (r.pass ? '   ·   passes' : '   ·   falls short'), x, 430, {
          color: r.pass ? c.accent : c.red,
        });
      else if (percentSpoken) label(reading, x, 430, { color: c.ink });
    });
    const held = cue(6, 'The quarantine record', 0);
    footer(
      b === 7
        ? 'Trace the numeric prediction for request 104 back to the producer.'
        : held
          ? 'Hold the release. Coverage falls below 95%.'
          : b === 5
            ? 'Which requests belong in each denominator? Would you release this run?'
            : 'Compare each fraction with its release floor.',
    );
  }
}

export function confidence(s) {
  const { c, b, cue, txt, label, line, footer } = s;
  if (b < 2) {
    const vals = b === 0 ? [probability[2]] : probability.slice(0, 4);
    label('JSON source', 56, 145);
    label('Decoded value', 310, 145);
    label('Proposed confidence rule', 617, 145);
    vals.forEach((v, i) => {
      const y = 201 + i * 58;
      txt(v.raw, 56, y, 27);
      s.wire(189, y, 285, y);
      txt(v.decoded + ' · ' + v.type, 306, y, 23, { width: 282 });
      const show = b === 0 ? cue(0, 'Accepting it here') > 0 : cue(1, 'Next it checks') > 0;
      if (show) txt(v.verdict, 620, y, 25, { color: v.accepted ? c.accent : c.red });
    });
    footer(
      b === 0
        ? 'isinstance(True, int) is True. A Boolean is a different kind of input.'
        : 'Check type, then 0 ≤ value ≤ 1, then convert and check finiteness.',
    );
  } else if (b <= 4) {
    if (b === 2 || b === 3) {
      const vals = b === 2 ? [probability[3], probability[7]] : probability.slice(4, 7);
      label('File spelling', 50, 148);
      label('Python float or string', 339, 148);
      label('Validation', 665, 148);
      vals.forEach((v, i) => {
        const y = 218 + i * 81;
        txt(v.raw, 54, y, 30);
        s.wire(210, y, 321, y);
        txt(v.decoded, 346, y, 29);
        txt(v.verdict, 664, y, 25, { color: c.red });
      });
      footer(
        b === 2
          ? 'Quoted text fails the type check. 1.1 exceeds the upper bound.'
          : 'NaN and Infinity are decoder extensions. 1e400 is valid JSON.',
      );
    } else {
      txt('10**400', 54, 228, 52);
      s.wire(339, 226, 494, 226);
      txt('0 ≤ n ≤ 1 ?', 515, 226, 34);
      line(56, 298, 904, 298);
      txt('ValueError before float(n)', 58, 353, 28, { color: c.red });
      footer('Check the range while a very large Python integer is still an integer.');
    }
  } else {
    label('Two JSON decimal spellings', 55, 142);
    decimalInputs.forEach((v, i) => {
      const y = 219 + i * 105;
      txt(v, 54, y, 32, { width: 435 });
      if (cue(5, 'The final digit differs') > 0) {
        const width = s.ctx.measureText(v).width;
        line(54 + width - 16, y + 23, 54 + width, y + 23, c.gold, 3);
      }
      s.wire(507, 216 + i * 105, 645, 265);
    });
    const done = cue(5, 'Both pass the check', 0);
    txt(done ? Number(decimalInputs[1]).toFixed(1) : '?', 675, 265, 62, {
      face: 'serif',
      color: c.accent,
    });
    label('decoded float', 675, 322);
    if (b > 5 || s.clock.elapsed >= s.clock.speechDuration)
      txt('accept both', 674, 370, 23, { color: c.accent });
    footer(
      b === 6
        ? 'Preserve decimal precision at decode time when the last digit matters.'
        : 'The validator checks the float that decoding produced.',
    );
  }
}
