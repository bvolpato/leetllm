import { rows, omitted, score, decisions, quoted, bool, owners } from './examples.mjs';
const middle = rows[1];
const flags = decisions(rows);
const cx = [195, 480, 765];

export function opening(s) {
  const { c, b, cue, txt, label, line, rect, slip, footer, ctx } = s;
  const drop = cue(1, 'Slide request'),
    back = cue(1, 'Put the request back', 0.65);
  if (back === 1) {
    s.paper(90, 140, 780, 236);
    line(280, 161, 280, 368, c.line, 1, true);
    label('REQUEST', 116, 204);
    txt(middle.id, 116, 265, 66, { face: 'serif' });
    label('expected', 314, 188);
    txt(quoted(middle.expected), 314, 225, 32);
    label('saved prediction', 314, 281);
    txt(cue(1, 'The prediction is escalated') > 0 ? quoted(middle.prediction) : '…', 314, 324, 32);
    footer('What Boolean will the comparison return?');
    return;
  }
  const displaced = drop * (1 - back);
  rows.forEach((r, i) => {
    const x = cx[i] - 107;
    if (i === 1) {
      rect(x, 176, 214, 170, c.bg);
      if (displaced === 1) label('102  ·  absent', cx[i], 258, { align: 'center' });
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 176, 220, 176);
      ctx.clip();
      slip(r, x, 176 - 180 * displaced, 214, 170);
      ctx.restore();
    } else slip(r, x, 176, 214, 170);
  });
  label('Expected and saved labels', 87, 146);
  const matched = cue(0, 'Two answers matched') > 0;
  const today = cue(0, 'Today the same scorer') > 0;
  const current = score(displaced === 1 ? omitted : rows);
  label(b === 0 ? 'Yesterday’s file' : 'Open file', 335, 366, { align: 'center' });
  txt(matched ? current.ratio : '?', 335, 404, 48, { align: 'center', face: 'serif' });
  if (today) {
    label('Today’s report', 625, 366, { align: 'center' });
    txt('100%', 625, 404, 48, { align: 'center', face: 'serif' });
  }
  if (displaced === 1) footer('The file now holds requests 101 and 103.');
  else footer(today ? 'Which requests did today’s scorer read?' : 'Which request has a different prediction?');
}

export function strings(s) {
  const { b, c, cue, txt, label, line, wire, chip, paper, footer } = s;
  const decoded = cue(0, 'decodes it into a Python dictionary');
  label('eval/access_requests.jsonl   ·   line 2', 50, 126);
  paper(48, 148, 864, 83);
  txt('{"prompt":' + quoted(middle.prompt) + ',', 73, 183, 21, { width: 815 });
  txt(
    ' "expected":' + quoted(middle.expected) + ', "prediction":' + quoted(middle.prediction) + '}',
    73,
    213,
    21,
    { width: 815 },
  );
  if (decoded > 0) {
    label('row["prediction"]', 65, 258);
    txt(quoted(middle.prediction), 65, 299, 25);
    label('row["expected"]', 65, 357);
    txt(quoted(middle.expected), 65, 394, 25);
    line(360, 246, 360, 426);
    const trim = cue(1, 'Strip removes'),
      lower = cue(1, 'Lower then');
    const value =
      lower === 1
        ? middle.prediction.trim().toLowerCase()
        : trim === 1
          ? middle.prediction.trim()
          : middle.prediction;
    wire(301, 300, 395, 300, c.accent);
    const operation = lower === 1 ? '.strip().lower()' : trim === 1 ? '.strip()' : 'local name';
    label(operation, 410, 258);
    chip(quoted(value), 410, 279, 293, c.ink, c.wash);
    txt(quoted(middle.expected), 424, 394, 24);
    if (b === 2) {
      cue(2, 'The comparison returns False');
      const result = cue(2, 'That value adds');
      label('==', 745, 271);
      chip(result > 0 ? bool(flags[1]) : '?', 742, 294, 142, result > 0 ? c.red : c.ink);
    }
  }
  footer(
    b === 0
      ? 'json.loads(line)  →  row'
      : b === 1
        ? 'The dictionary keeps its original string.'
        : 'is_correct = prediction == expected',
  );
}

export function batch(s) {
  const { b, c, cue, label, txt, line, rect, disk, footer } = s;
  const events = [
    cue(0, 'Append True. The second'),
    cue(0, 'Append False'),
    cue(0, 'Append True for the last'),
  ];
  label('for row in examples', 49, 132);
  rows.forEach((r, i) => {
    const x = cx[i],
      p = events[i];
    s.paper(x - 109, 150, 218, 124);
    txt('Request ' + r.id, x, 189, 23, { align: 'center', face: 'serif' });
    txt(r.expected, x, 226, 18, { align: 'center' });
    txt(r.prediction.trim().toLowerCase(), x, 252, 18, { align: 'center' });
    line(x, 277, x, 320, c.line, 1.2, true);
    if (p > 0) disk(x, 277 + 41 * p, 4, c.accent);
    rect(x - 109, 323, 218, 58, p === 1 ? c.wash : c.bg);
    txt(p === 1 ? bool(flags[i]) : ' ', x, 352, 30, {
      align: 'center',
      color: flags[i] ? c.accent : c.red,
    });
    label('[' + i + ']', x, 403, { align: 'center' });
  });
  if (b === 0) footer('results.append(exact_match(row["expected"], row["prediction"]))');
  else {
    const sum = cue(1, 'giving two matches'),
      len = cue(1, 'Len counts all three'),
      ratio = cue(1, 'Python prints');
    footer(
      [
        sum > 0 ? 'sum = ' + score(rows).matches : 'sum(results)',
        len > 0 ? 'len = ' + rows.length : 'len(results)',
        ratio > 0 ? score(rows).ratio + '  →  ' + score(rows).display : '',
      ]
        .filter(Boolean)
        .join('      ·      '),
    );
  }
}

export function values(s) {
  const { c, b, cue, txt, label, line, chip, paper, footer } = s;
  if (b < 2) {
    const samples =
      b === 0
        ? [
            ['dict', 'row["expected"]', '"blocked"'],
            ['list', 'rows[1]', 'request 102'],
            ['tuple', 'matches, total, score', '(2, 3, 2/3)'],
          ]
        : [
            ['str', '"blocked"', 'text label'],
            ['int / float', '2   /   0.666…', 'count / approximation'],
            ['bool / None', 'False   /   None', 'decision / absence'],
          ];
    samples.forEach(([type, expr, value], i) => {
      const x = 50 + i * 289;
      paper(x, 165, 270, 192);
      label(type, x + 16, 216);
      txt(expr, x + 16, 265, 22, { width: 238 });
      line(x + 15, 291, x + 254, 291);
      txt(value, x + 16, 321, 20, { width: 238 });
    });
    footer(
      b === 0
        ? 'Named fields, ordered visits, and a group of return values'
        : 'The value’s type determines which operations Python can perform.',
    );
  } else if (b === 2) {
    const sevens = [
      ['"7"', 'str'],
      ['7', 'int'],
      ['7.0', 'float'],
    ];
    sevens.forEach(([v, t], i) => {
      txt(v, cx[i], 219, 66, { face: 'serif', align: 'center' });
      label(t, cx[i], 277, { align: 'center' });
    });
    line(58, 313, 902, 313);
    const show = cue(2, 'while text seven');
    if (show > 0) {
      txt('"7" == 7    False', 74, 368, 26, { color: c.red });
      txt('7 == 7.0    True', 533, 368, 26, { color: c.accent });
    }
    footer('row["prediction"] reads a key. rows[1] reads a position.');
  } else if (b === 3) {
    const rebound = cue(3, 'Now bind that name to seven');
    label('dictionary field', 65, 176);
    label('local name', 65, 315);
    txt('row["prediction"]', 65, 219, 27);
    txt('prediction', 65, 358, 27);
    s.wire(365, 219, 541, 219);
    s.wire(365, 358, 541, 219 + 139 * rebound, c.gold);
    chip(quoted(middle.prediction), 545, 193, 308);
    if (rebound > 0) chip('7', 545, 332, 140);
    footer('Assignment binds a name to an object.');
  } else {
    const inner = b === 5;
    const ready = inner ? cue(5, 'Strip leaves') : cue(4, 'Turning a numeric');
    label(inner ? 'Saved text' : 'Saved JSON number', 70, 154);
    txt(inner ? '" BLOCK ED "' : '7', 70, 222, 48, { width: 283 });
    s.wire(377, 219, 497, 219);
    label(inner ? '.strip().lower()' : 'str(7)', 525, 154);
    txt(ready > 0 ? (inner ? '"block ed"' : '"7"') : '?', 525, 222, 48);
    line(68, 294, 895, 294);
    txt('expected = "blocked"', 72, 349, 27);
    if (ready > 0) txt(inner ? 'False' : 'False after coercion', 507, 349, 26, { color: c.red });
    footer(
      inner
        ? 'Exact spelling matters, including an internal space.'
        : 'A numeric prediction breaks the producer’s string contract.',
    );
  }
}

function rowBox(s, r, x, y, w, id) {
  s.rect(x, y, w, 76);
  s.label('dict ' + id + '   ·   prediction', x + 13, y + 18);
  s.txt(quoted(r.prediction), x + 13, y + 49, 21, { width: w - 23 });
}
export function copies(s) {
  const { b, c, cue, txt, label, rect, wire, chip, footer } = s;
  const mode = ['alias', 'alias', 'list', 'rows'][b];
  const edited =
    [
      cue(0, 'Now set the trial prediction'),
      1,
      cue(2, 'Run the same mutation'),
      cue(3, 'Now mutate the copied row'),
    ][b] === 1;
  const m = owners(mode, edited, false),
    ys = [207, 344];
  label('Names', 54, 137);
  label('List objects', 335, 137);
  label('Row dictionaries', 650, 137);
  const listY = m.sameList ? 274 : ys[0],
    rowY = m.sameRow ? 274 : ys[0];
  wire(240, ys[0], 332, listY, c.accent);
  wire(240, ys[1], 332, m.sameList ? listY : ys[1], c.gold);
  wire(512, listY, 642, rowY, c.accent);
  if (!m.sameList) wire(512, ys[1], 642, m.sameRow ? rowY : ys[1], c.gold);
  chip('baseline', 52, ys[0] - 24, 188);
  chip('trial', 52, ys[1] - 24, 188);
  function slot(y, id) {
    rect(336, y - 29, 172, 58, c.wash);
    txt(id + '   [0]', 351, y, 23);
  }
  slot(listY, 'L1');
  if (!m.sameList) slot(ys[1], 'L2');
  rowBox(s, m.baseline[0], 646, rowY - 38, 260, 'R1');
  if (!m.sameRow) rowBox(s, m.trial[0], 646, ys[1] - 38, 260, 'R2');
  footer(
    mode === 'alias'
      ? 'trial = baseline'
      : mode === 'list'
        ? 'trial = baseline.copy()'
        : 'trial = [row.copy() for row in baseline]',
  );
}

export function nested(s) {
  const { b, c, cue, txt, label, line, wire, rect, footer } = s;
  const copy = b >= 2;
  const append = copy
    ? cue(2, 'Append review through trial') === 1
    : cue(1, 'Now append the tag review') === 1;
  const m = owners(
    copy ? 'tags' : 'rows',
    b === 1 && cue(1, 'First set the trial prediction') === 1,
    append,
  );
  const positions = [175, 314],
    tagY = m.sameTags ? [290, 290] : [213, 352];
  label('Independent row dictionaries', 54, 125);
  label('List objects', 637, 125);
  [m.baseline[0], m.trial[0]].forEach((r, i) => {
    const y = positions[i];
    rect(55, y - 22, 350, 105);
    label(i ? 'trial[0]   ·   R2' : 'baseline[0]   ·   R1', 69, y);
    txt('prediction: ' + quoted(r.prediction), 69, y + 31, 19, { width: 318 });
    txt('tags', 69, y + 59, 19);
    wire(398, y + 58, 627, tagY[i], i ? c.gold : c.accent);
  });
  function tagBox(y, r, id) {
    rect(630, y - 39, 267, 78, c.wash);
    label('list   ' + id, 645, y - 17);
    txt(JSON.stringify(r.tags), 645, y + 15, 26);
  }
  tagBox(tagY[0], m.baseline[0], 'T1');
  if (!m.sameTags) tagBox(tagY[1], m.trial[0], 'T2');
  footer(
    b === 3
      ? 'Collect decisions or filtered rows in a new list.'
      : copy
        ? 'trial[0]["tags"] = baseline[0]["tags"].copy()'
        : 'Follow the tags field to the list that append changes.',
  );
}

export function calls(s) {
  const { b, c, cue, txt, label, line, wire, paper, footer } = s;
  const args = [
    ['blocked', 'escalated'],
    ['approved', ' APPROVED '],
    ['approved', 7],
  ][b];
  const result =
    b === 2 ? 'AttributeError' : bool(args[0].trim().toLowerCase() === args[1].trim().toLowerCase());
  const done =
    b === 0
      ? s.clock.elapsed >= s.clock.speechDuration
      : b === 1
        ? cue(1, 'The string and Boolean hints') > 0
        : cue(2, 'A hint helps') > 0;
  label('Caller arguments', 52, 142);
  args.forEach((v, i) => {
    s.chip(quoted(v), 54, 181 + i * 82, 229);
    wire(286, 205 + i * 82, 360, 205 + i * 82);
  });
  paper(364, 137, 533, 215);
  label('exact_match(expected: str, prediction: str) → bool', 386, 179, { width: 490 });
  txt('expected   = ' + quoted(args[0]), 389, 221, 21);
  txt('prediction = ' + quoted(args[1]), 389, 279, 21);
  line(389, 309, 869, 309);
  const evaluated =
    b === 0
      ? cue(0, 'The indented body normalizes both')
      : b === 1
        ? cue(1, 'The function returns True')
        : 0;
  const expr =
    b === 2
      ? 'prediction.strip()'
      : evaluated === 1
        ? 'return ' +
          quoted(args[1].trim().toLowerCase()) +
          ' == ' +
          quoted(args[0].trim().toLowerCase())
        : 'prediction.strip().lower()';
  txt(expr, 389, 332, 18, { width: 480 });
  if (done)
    txt(result, 626, 402, 35, {
      align: 'center',
      color: b === 2 || result === 'False' ? c.red : c.accent,
    });
  footer(
    b === 2 ? 'Method lookup on an int stops this call.' : 'The return value travels back to the loop.',
  );
}
