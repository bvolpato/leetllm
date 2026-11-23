import {
  C,
  box,
  cap,
  txt,
  mono,
  line,
  headline,
  strip,
  cue,
  badge,
  pane,
  mid,
  bar,
  ease,
  num,
} from './drawing.mjs';
import {
  route,
  prefix,
  middle,
  suffix,
  body,
  prompt,
  splice,
  units,
  lasts,
  partsInOrder,
  budget,
  offer,
  slice,
  symbolFiles,
  shared,
  union,
  sourceA,
  sourceB,
  mask,
  signature,
  inlineClasses,
  permittedUse,
} from './model.mjs';

function inlineBudgets(g, c) {
  const bodyVisible = cue(c, 3, 'After the function signature');
  const bodyExample = cue(c, 3, 'This candidate computes');
  const singleCap = cue(c, 3, 'whichever comes first');
  const singleTarget = cue(c, 3, 'Measure from the edit');
  const bodyCap = cue(c, 3, 'with a five-hundred-millisecond');
  const bodyTarget = cue(c, 3, 'Measure that class separately');
  headline(
    g,
    c,
    'PERMITTED REMOTE INFILL   /   scope.py',
    false,
    'How much code should the editor request?',
  );
  const showBudget = (spec, x, targetReady) => {
    txt(g, 'Output cap', x, 682, 32, C.muted);
    mono(g, spec.cap + ' tokens', x, 744, 45);
    if (targetReady) {
      txt(g, 'Edit-to-paint p95 target', x + 327, 682, 32, C.muted);
      mono(g, spec.p95 + ' ms', x + 327, 744, 45, C.blue);
    }
  };
  pane(g, 94, 264, 849, 536, 'SINGLE-LINE EXPRESSION');
  mono(g, 'is_allowed = ▏', 134, 451, 43, C.blue);
  cap(g, 'EXAMPLE INSERTION', 134, 521);
  mono(g, inlineClasses.expression.lines[0], 134, 584, 43, C.green);
  if (singleCap) showBudget(inlineClasses.expression, 134, singleTarget);
  if (bodyVisible) {
    pane(g, 977, 264, 849, 536, 'MULTILINE BODY');
    mono(g, signature, 1015, 429, 40);
    mono(g, '▏', 1015, 482, 37, C.blue);
    if (bodyExample) {
      cap(g, 'EXAMPLE INSERTION', 1015, 525);
      inlineClasses.body.lines.forEach((s, i) => mono(g, s, 1015, 577 + i * 50, 33, C.green, 775));
    }
    if (bodyCap) showBudget(inlineClasses.body, 1015, bodyTarget);
  }
  strip(
    g,
    bodyTarget
      ? 'Measure a separate edit-to-paint distribution for each class.'
      : bodyVisible
        ? 'After the signature, the missing span is a function body.'
        : 'The client permits remote infill here. The missing span ends on this line.',
  );
}

export function lanes(g, c) {
  if (c.beat.beatIndex === 3) return inlineBudgets(g, c);
  const lex = cue(c, 0, 'prefix index can finish'),
    dot = cue(c, 0, 'After graph dot');
  const method = cue(c, 1, 'language server lists'),
    assign = cue(c, 2, 'empty assignment');
  const gen = cue(c, 2, 'bounded model request'),
    denied = cue(c, 2, 'If upload is denied');
  headline(g, c, 'EDITOR SERVICES   /   scope.py');
  pane(g, 94, 264, 950, 515, 'SOURCE AT THE CARET');
  pane(
    g,
    1091,
    264,
    735,
    515,
    assign ? 'EXPRESSION CANDIDATE' : dot ? 'RECEIVER TYPE' : 'IDENTIFIERS IN THIS BUFFER',
  );
  const x = 147;
  const fallback = !assign && cue(c, 1, 'If type information is missing');
  const dedent = !assign && cue(c, 1, 'Try a dedented line');
  if (dedent) {
    mono(g, 'def graph_factory():', x, 445, 45);
    mono(g, '    return PolicyGraph()', x, 525, 45);
    mono(g, 'graph.', x, 665, 45, C.blue);
    box(g, x + 162, 620, 4, 58, C.blue);
    box(g, 1101, 287, 714, 55, C.sheet);
    cap(g, 'ENCLOSING SCOPE', 1127, 319);
    txt(g, 'Preceding header', 1140, 450, 34, C.muted);
    mono(g, 'graph_factory', 1140, 511, 46);
    txt(g, 'Scope at the caret', 1140, 612, 34, C.muted);
    mono(g, 'module', 1140, 676, 49, C.green);
    strip(g, 'The dedent ends the function. A backward text scan crosses that boundary.');
    return;
  }
  mono(g, 'from policy import PolicyGraph', x, 445, 41);
  mono(g, signature, x, 518, 41);
  const code = assign
    ? '    is_allowed = '
    : dot
      ? '    is_allowed = graph.'
      : lex
        ? '    graph: PolicyGraph'
        : '    graph: Polic';
  mono(g, code, x, 605, 42, C.blue);
  g.font = '400 42px "Lesson Mono"';
  const width = g.measureText(code).width;
  box(g, x + width, 563, 4, 54, C.blue);
  if (assign || dot) mono(g, '    return is_allowed', x, 682, 41, C.muted);
  if (assign) {
    mono(g, 'is_allowed = ▏', 1140, 448, 45);
    if (gen)
      badge(
        g,
        denied ? route('=', false, false) : route('=', false, true),
        1140,
        507,
        550,
        denied ? C.blush : C.mint,
        denied ? C.red : C.green,
      );
    txt(
      g,
      denied ? 'Upload denied by policy' : 'Return type and surrounding code',
      1140,
      680,
      36,
      C.muted,
    );
  } else if (dot) {
    mono(g, fallback ? 'graph  →  unknown' : 'graph  →  PolicyGraph', 1140, 444, 43);
    if (method) {
      badge(g, fallback ? 'TYPE INDEX UNAVAILABLE' : route('.', true, false), 1140, 514, 550);
      mono(
        g,
        fallback ? 'Try the local name index' : 'allows(request)',
        1140,
        687,
        43,
        C.green,
        630,
      );
    }
  } else {
    mono(g, 'PolicyGraph', 1140, 458, 51, C.blue);
    line(g, 1140, 480, 1140 + 5 * 31, 480, C.orange, 6);
    if (lex) txt(g, 'Prefix match in the import', 1140, 618, 43, C.green);
  }
  strip(
    g,
    assign
      ? denied
        ? 'The client keeps this buffer on the device.'
        : 'Which expression produces the value that the return uses?'
      : dot
        ? fallback
          ? 'Check local names or a permitted remote candidate.'
          : method
            ? 'The type index supplies a valid member without a network round trip.'
            : 'The dot asks for members of this receiver.'
        : 'The import already contains the rest of the name.',
  );
}
function wire(g, x1, y1, x2, y2, t, color) {
  if (t <= 0) return;
  const mx = (x1 + x2) / 2;
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x1, y1);
  g.bezierCurveTo(mx, y1, mx, y2, x2, y2);
  g.stroke();
  const u = ease(t),
    v = 1 - u,
    x = v * v * v * x1 + 3 * v * v * u * mx + 3 * v * u * u * mx + u * u * u * x2;
  const y = (v * v * v + 3 * v * v * u) * y1 + (3 * v * u * u + u * u * u) * y2;
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, 8, 0, Math.PI * 2);
  g.fill();
}
export function infill(g, c) {
  const a = cue(c, 1, 'Copy the prefix', 0.95),
    b = cue(c, 1, 'Copy the suffix', 0.95),
    m = cue(c, 1, 'middle marker');
  const generated = cue(c, 2, 'called with request'),
    insert = cue(c, 3, 'The original newline');
  headline(g, c, 'PERMITTED SINGLE-LINE INFILL   /   scope.py');
  pane(g, 94, 274, 847, 516, 'SOURCE   /   FUNCTION BODY');
  pane(g, 1003, 274, 823, 516, 'DECODER SEQUENCE   /   PSM');
  const x = 126,
    y = 461,
    sz = 32;
  const src = (insert ? splice(body, prefix.length, middle) : body).split('\n');
  g.font = '400 ' + sz + 'px "Lesson Mono"';
  const cw = g.measureText('M').width,
    hole = x + prefix.length * cw;
  mono(g, src[0].slice(0, prefix.length), x, y, sz, C.blue);
  if (insert) {
    mono(g, src[0].slice(prefix.length), hole, y, sz, C.green);
  } else box(g, hole - 2, y - 34, 5, 46, C.orange);
  mono(g, src[1], x, 569, sz, C.green);
  if (a) {
    line(g, x, y + 15, hole, y + 15, C.blue, 5);
    if (!generated) wire(g, hole, y + 15, 1032, 443, a, C.blue);
  }
  if (b) {
    line(g, x, 582, x + src[1].length * cw, 582, C.green, 5);
    if (!generated) wire(g, x + src[1].length * cw, 582, 1032, 558, b, C.green);
  }
  if (a) {
    badge(g, prompt[0], 1036, 400, 112);
    mono(g, prompt[1], 1164, 446, 35, C.blue);
  }
  if (b) {
    badge(g, prompt[2], 1036, 515, 112, C.mint, C.green);
    mono(g, JSON.stringify(prompt[3]).slice(1, -1), 1164, 561, 35, C.green);
  }
  if (m) {
    badge(g, prompt[4], 1036, 643, 112, C.gold, C.ink);
  }
  if (generated) {
    cap(g, 'GENERATED', 1164, 634, C.green);
    mono(g, middle, 1164, 687, 37, C.green);
  }
  const travel = cue(c, 3, 'Insert the middle', 0.85);
  if (travel > 0) {
    const route = [
      [1164, 710],
      [908, 710],
      [908, 502],
      [hole, 502],
      [hole, 480],
    ];
    let remaining = 0;
    const lengths = route.slice(1).map(([x, y], i) => Math.hypot(x - route[i][0], y - route[i][1]));
    remaining = lengths.reduce((acc, v) => acc + v, 0) * ease(travel);
    for (const [i, len] of lengths.entries()) {
      const [x, y] = route[i],
        [xx, yy] = route[i + 1],
        t = Math.min(1, remaining / len);
      line(g, x, y, x + (xx - x) * t, y + (yy - y) * t, C.orange, 4);
      remaining -= len;
      if (remaining <= 0) break;
    }
  }
  if (insert) line(g, hole, y + 16, hole + middle.length * cw, y + 16, C.green, 6);
  if (!insert) txt(g, 'Insertion point', hole, 404, 27, C.muted);
  txt(
    g,
    insert ? 'Return statement preserved' : 'Suffix starts at the newline',
    147,
    697,
    34,
    C.muted,
  );
  strip(
    g,
    insert
      ? 'One generated expression fills one range. The suffix stays in the file.'
      : generated
        ? 'Which text should the editor insert?'
        : m
          ? 'The decoder can read both source spans before it predicts the middle.'
          : 'The text below the caret constrains the missing expression.',
  );
}
export function position(g, c) {
  const after = cue(c, 1, 'Keep the b'),
    calc = cue(c, 1, 'same boundary'),
    wrong = cue(c, 1, 'Copying three');
  headline(g, c, 'POSITION CONVERSION   /   a single line');
  const xs = [528, 818, 1250, 1540],
    cs = ['a', '😀', 'b'];
  for (let i = 0; i < 3; i++) {
    box(g, xs[i], 285, xs[i + 1] - xs[i] - 6, 105, i === 1 ? C.gold : C.sheet, 12);
    if (i === 1) {
      const cx = (xs[i + 1] + xs[i]) / 2,
        cy = 336;
      g.beginPath();
      g.arc(cx, cy, 40, 0, Math.PI * 2);
      g.fillStyle = '#e8a536';
      g.fill();
      for (const dx of [-13, 13]) {
        g.beginPath();
        g.arc(cx + dx, cy - 9, 5, 0, Math.PI * 2);
        g.fillStyle = C.ink;
        g.fill();
      }
      g.beginPath();
      g.arc(cx, cy + 2, 20, 0, Math.PI);
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.stroke();
    } else mid(g, cs[i], (xs[i + 1] + xs[i]) / 2, 364, 72, C.ink);
  }
  cap(g, 'BUFFER', 140, 350);
  line(g, xs[2] - 3, 272, xs[2] - 3, 740, C.orange, 6);
  const rows = [
    ['Python code points', [1, 1, 1]],
    ['UTF-16 units', [1, 2, 1]],
    ['UTF-8 bytes', [1, 4, 1]],
  ];
  rows.forEach(([name, counts], j) => {
    if (j !== 1 && !after) return;
    const y = 442 + j * 105;
    txt(g, name, 140, y + 50, 39);
    counts.forEach((count, i) => {
      const w = (xs[i + 1] - xs[i] - 6) / count;
      for (let k = 0; k < count; k++)
        box(g, xs[i] + k * w, y, w - 3, 68, i === 2 ? C.mint : i === 1 ? C.gold : C.sky, 4);
    });
    if (calc || j === 1) mono(g, units[j], 1592, y + 51, 54, C.blue);
  });
  strip(
    g,
    wrong
      ? 'Python [3:] → empty        •        Python [2:] → ' + lasts
      : after
        ? 'The suffix is b. Count the units to the left of the same boundary.'
        : 'The editor reports offset 3. Where should Python start its slice?',
  );
}
export function allocation(g, c) {
  const reserve = cue(c, 1, 'thousand for the suffix'),
    fill = cue(c, 1, 'for permitted definitions'),
    candidate = cue(c, 1, 'Another permitted snippet');
  const admit = cue(c, 2, 'The input is full');
  const quantities = [
    ...partsInOrder.map((v, i) => ((i < 2 ? reserve : fill) ? v.value : 0)),
    admit ? slice : 0,
  ];
  const labels = ['Framing', 'Suffix', 'Prefix', 'Definitions', 'Snippet'];
  const colors = ['#837798', C.green, C.blue, '#579ba0', C.orange];
  const x = 132,
    w = 1656,
    y = 495;
  headline(g, c, 'CONTEXT ENGINE   /   input tokens');
  if (c.beat.beatIndex === 0) {
    const ranked = cue(c, 0, 'one half');
    cap(g, 'CANDIDATES AFTER ACCESS AND UPLOAD CHECKS', x, 320);
    symbolFiles.forEach((f, i) => {
      const yy = 368 + i * 114;
      mono(g, f.name, x, yy + 47, 41);
      f.symbols.forEach((name, j) =>
        badge(
          g,
          name,
          567 + j * 373,
          yy,
          342,
          shared.includes(name) ? C.mint : C.sky,
          shared.includes(name) ? C.green : C.blue,
        ),
      );
    });
    box(g, x, 652, 780, 82, C.blush, 12);
    txt(g, 'private.py    ·    excluded before ranking', x + 23, 704, 36, C.red);
    if (ranked)
      mono(g, shared.length + ' shared / ' + union.size + ' distinct = 0.5', 980, 707, 40, C.green);
    strip(g, 'Shared symbol names can rank a permitted definition. Permission comes first.');
    return;
  }
  cap(g, 'SOURCE FILES', x, 326);
  badge(g, 'scope.py', x, 356, 260, C.mint, C.green);
  badge(g, 'scope_rules.py', x + 278, 356, 335, C.mint, C.green);
  badge(g, 'private.py   ·   excluded', 1136, 356, 650, C.blush, C.red);
  box(g, x, y, w, 99, '#ddd9ce', 9);
  let used = 0;
  quantities.forEach((v, i) => {
    bar(g, x + (used * w) / budget, y, (v * w) / budget, 99, colors[i]);
    used += v;
  });
  mono(g, num(used) + ' / ' + num(budget), x, 665, 48);
  if (candidate) txt(g, 'Offered snippet   ' + num(offer), x + 1050, 660, 39, C.muted);
  labels.forEach((l, i) => {
    const xx = x + i * 331;
    box(g, xx, 721, 16, 30, colors[i]);
    txt(g, l + '   ' + num(quantities[i]), xx + 29, 747, 31);
  });
  strip(
    g,
    admit
      ? 'The snippet fills the remaining ' +
          num(slice) +
          ' tokens. The 1,000-token suffix stays intact.'
      : candidate
        ? 'Which part of the 900-token snippet fits?'
        : reserve
          ? 'Preserve framing and suffix inside the prompt cap.'
          : 'Permission determines which files can enter the ranking.',
  );
}
export function upload(g, c) {
  const collide = cue(c, 1, 'another buffer'),
    sent = cue(c, 0, 'Mask the token'),
    reject = cue(c, 2, 'A collision');
  const source = collide ? sourceB : sourceA,
    payload = mask(source);
  const firstCopy = cue(c, 2, 'Return to the first masked copy');
  headline(
    g,
    c,
    'UPLOAD POLICY   /   local redaction fixture',
    false,
    firstCopy ? 'What may the service do with this prompt?' : c.beat.chapterTitle,
  );
  if (firstCopy) {
    const collection = cue(c, 2, 'By default it also');
    const training = cue(c, 2, 'That permission covers');
    pane(g, 94, 276, 845, 511, 'FIRST BUFFER   /   PERMITTED INFERENCE');
    mono(g, permittedUse.inference, 132, 481, 41, C.green);
    badge(g, 'Masked prompt received', 132, 645, 653, C.mint, C.green);
    pane(g, 1013, 276, 813, 511, 'ENTERPRISE DATA POLICY');
    if (collection) {
      txt(g, 'Raw prompt collection', 1052, 477, 38);
      badge(g, permittedUse.retainRawPrompt ? 'On' : 'Off', 1577, 428, 198);
    }
    if (training) {
      txt(g, 'Training export', 1052, 626, 38);
      badge(g, permittedUse.exportForTraining ? 'On' : 'Off', 1577, 577, 198);
    }
    strip(
      g,
      training
        ? 'Permission covers this inference request. Training export is disabled by default.'
        : 'Apply retention limits to the operational records the gateway keeps.',
    );
    return;
  }
  pane(g, 94, 276, 845, 511, 'LAPTOP   /   ORIGINAL BUFFER');
  pane(g, 1013, 276, 813, 511, collide ? 'NEW UPLOAD ATTEMPT' : 'GATEWAY   /   PROMPT COPY');
  source
    .split('\n')
    .forEach((row, i) => mono(g, row, 131, 462 + i * 86, 41, i ? C.red : C.ink, 770));
  line(g, 975, 278, 975, 782, C.red, 5);
  if (!collide && sent) {
    mono(g, payload, 1052, 462, 40, C.green, 733);
    badge(g, 'Token mapping stays here', 131, 649, 600, C.sky, C.blue);
    badge(g, 'Masked copy received', 1052, 649, 630, C.mint, C.green);
  } else {
    mid(g, collide && !reject ? 'Awaiting local check' : 'No payload', 1419, 510, 52, C.muted);
    if (collide) txt(g, 'Previous copy    ' + mask(sourceA), 1054, 699, 32, C.muted, { max: 724 });
    if (collide)
      badge(
        g,
        reject ? 'Collision   ·   upload blocked' : 'Existing reserved prefix',
        130,
        649,
        644,
        reject ? C.blush : C.gold,
        reject ? C.red : C.ink,
      );
  }
  strip(
    g,
    collide
      ? reject
        ? 'No bytes from this attempt cross the boundary. Review the original locally.'
        : 'The second source already contains a placeholder. What can leave?'
      : sent
        ? 'The server receives the placeholder. Its local mapping stays on the laptop.'
        : 'The scanner examines a permitted buffer before transmission.',
  );
}
