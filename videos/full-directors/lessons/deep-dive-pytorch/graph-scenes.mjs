import { C, text, mono, shell, foot, line, arrow, dot, cells, box, cue } from './drawing.mjs';
import {
  attention,
  causalMask,
  keys,
  query,
  values,
  padding,
  padValues,
  padTest,
  scoreShape,
  scoreCount,
  scoreBytes,
  events,
} from './examples.mjs';

export function attend(g, c) {
  const scores = cue(c, 0, 'Divide by the square root');
  const shares = cue(c, 0, 'Softmax turns');
  const firstMix = cue(c, 1, 'Both keys have contributed', 0.45);
  const causal = cue(c, 2, 'Give this one-row query');
  const only = cue(c, 3, 'Its probability is one');
  const singleResult = cue(c, 3, 'All its weight', 0.45);
  const last = cue(c, 3, 'Now move the query');
  const both = cue(c, 4, 'Mix both value rows');
  const finalResult = cue(c, 4, 'The query and key shapes', 0.45);
  const ready = !causal || (last ? both : only);
  const position = last ? 1 : 0;
  const mask = causal ? causalMask(position) : keys.map(() => true);
  const a = attention(mask);
  const visible = !causal ? firstMix : last ? finalResult : singleResult;
  shell(
    g,
    'Scaled dot-product attention',
    'Where does the query land?',
    'Q = [' + query.join(', ') + ']     ·     head dimension = 2     ·     dropout_p = 0',
  );
  const cx = [270, 465];
  ['Key 0', 'Key 1'].forEach((name, i) => {
    text(g, name, cx[i], 168, 22, C.ink, { align: 'center', weight: 600 });
    mono(g, '[' + keys[i].join(', ') + ']', cx[i], 204, 19, C.ink, { align: 'center' });
    mono(g, '[' + values[i].join(', ') + ']', cx[i], 246, 19, C.ink, { align: 'center' });
    if (scores) mono(g, a.scores[i].toFixed(3), cx[i], 289, 20, C.blue, { align: 'center' });
    if (ready && shares) {
      const w = a.probs[i] * 140;
      box(g, cx[i] - 70, 345, 140, 13, C.sky, null, 4);
      if (w > 0) box(g, cx[i] - 70, 345, w, 13, C.teal, null, 4);
      mono(g, a.probs[i].toFixed(3), cx[i], 327, 20, C.teal, { align: 'center' });
    }
    if (causal) {
      const value = ready ? String(mask[i]) : '?';
      mono(g, value, cx[i], 398, 20, ready ? (mask[i] ? C.teal : C.red) : C.gray, {
        align: 'center',
      });
    }
  });
  [
    ['Key vector', 204],
    ['Value vector', 246],
    ['q·k / √2', 289],
    ['Softmax', 327],
  ].forEach(([s, y]) => text(g, s, 43, y, 18, C.gray));
  if (causal) text(g, 'Allowed', 43, 398, 18, C.gray);
  line(g, 559, 156, 559, 422, C.rule);
  const ox = 634,
    oy = 380,
    unit = 22;
  text(g, 'Weighted value', 745, 169, 22, C.ink, { align: 'center', weight: 600 });
  arrow(g, ox, oy, 895, oy, C.gray, 1.5);
  arrow(g, ox, oy, ox, 193, C.gray, 1.5);
  [0, 5, 10].forEach((n) => {
    line(g, ox + n * unit, oy, ox + n * unit, oy + 6, C.gray);
    mono(g, n, ox + n * unit, oy + 22, 14, C.gray, { align: 'center' });
  });
  line(g, ox - 4, oy - 5 * unit, ox + 4, oy - 5 * unit, C.gray);
  mono(g, '5', ox - 11, oy - 5 * unit, 14, C.gray, { align: 'right' });
  text(g, 'out[1]', ox - 11, 202, 14, C.gray, { align: 'right' });
  text(g, 'out[0]', 894, 424, 14, C.gray, { align: 'right' });
  if (visible) {
    const [x, y] = a.out;
    g.save();
    g.globalAlpha = visible;
    arrow(g, ox, oy, ox + x * unit, oy, C.blue, 4);
    if (y > 0) arrow(g, ox + x * unit, oy, ox + x * unit, oy - y * unit, C.red, 4);
    dot(g, ox + x * unit, oy - y * unit, 7, C.teal);
    g.restore();
  }
  const statement = visible
    ? 'Output   [' + a.out.map((n) => n.toFixed(2)).join(', ') + ']'
    : causal
      ? ready ? 'Combine the allowed values.' : 'Which keys can this query read? Where will the output land?'
      : 'Softmax shares determine the two output coordinates.';
  foot(
    g,
    statement,
    causal
      ? 'Causal rule   key position ≤ query position     ·     query position = ' + position
      : 'Each value contributes its attention probability times its vector.',
  );
}

export function pad(g, c) {
  const wrong = cue(c, 1, 'A true boolean entry');
  const invert = cue(c, 1, 'Invert the flags');
  const correct = cue(c, 2, 'A module in evaluation');
  const tiled = cue(c, 3, 'Take one sequence');
  const s = padTest(!!invert),
    xs = [376, 591, 806];
  if (tiled) {
    const { batch, heads, positions, bytesPerScore } = scoreShape;
    const counted = cue(c, 3, 'At two bytes per score');
    const sized = cue(c, 3, 'A tiled attention kernel');
    shell(
      g,
      'Attention memory',
      'What does tiling save?',
      'Batch = ' + batch + '     ·     heads = ' + heads + '     ·     ' + positions + ' query positions × ' + positions + ' key positions per head',
    );
    const sx = 65,
      sy = 185,
      cell = 24;
    const p = cue(c, 3, 'a tiled attention kernel', 2.4);
    const block = Math.min(3, Math.floor(p * 4));
    for (let r = 0; r < 8; r++)
      for (let j = 0; j < 8; j++) {
        const active = sized && Math.floor(r / 4) * 2 + Math.floor(j / 4) === block;
        box(g, sx + j * cell, sy + r * cell, cell - 2, cell - 2, active ? C.teal : C.sky);
      }
    text(g, 'One head, drawn in blocks', 54, 405, 18, C.gray);
    text(g, 'One dense score buffer', 340, 184, 24, C.ink, { weight: 600 });
    mono(g, batch + ' × ' + heads + ' × ' + positions + '²' +
      (counted ? ' = ' + scoreCount.toLocaleString('en-US') + ' scores' : ' scores'), 340, 238, 22, C.blue);
    if (counted) {
      mono(g, scoreCount.toLocaleString('en-US') + ' × ' + bytesPerScore + ' bytes per score', 340, 286, 22);
      if (sized) {
        mono(g, '= ' + scoreBytes.toLocaleString('en-US') + ' bytes = ' + scoreBytes / 2 ** 20 + ' MiB', 340, 335, 25, C.teal, { weight: 600 });
        line(g, 340, 368, 905, 368);
        text(g, 'Each tile updates the running softmax and weighted value.', 340, 403, 19, C.teal, { width: 572 });
      }
    }
    foot(
      g,
      sized ? 'Tiles still evaluate the dense query-key products.' : 'Count one score for every query-key pair in each head.',
      sized ? 'The tiled kernel can avoid writing the full score buffer. Check the selected backend in a profiler.'
        : 'The buffer size depends on both the number of scores and the bytes per score.',
    );
    return;
  }
  shell(
    g,
    'Attention mask semantics',
    'Which values get a vote?',
    'Equal scores     ·     1 query × 3 keys     ·     dropout_p = 0',
  );
  text(g, 'Value', 48, 191, 19, C.gray);
  text(g, 'Old padding flag', 48, 252, 19, C.gray);
  text(g, 'Passed to SDPA', 48, 325, 19, C.gray);
  xs.forEach((x, i) => {
    text(g, i === 2 ? 'PAD' : 'Token ' + i, x, 164, 15, i === 2 ? C.red : C.teal, {
      align: 'center',
      weight: 700,
    });
    mono(g, padValues[i], x, 192, 29, C.ink, { align: 'center', weight: 700 });
    mono(g, String(padding[i]), x, 252, 21, C.gray, { align: 'center' });
    box(g, x - 68, 302, 136, 46, s.allow[i] ? C.pale : C.paper, s.allow[i] ? C.teal : C.rule, 6);
    mono(g, String(s.allow[i]), x, 325, 21, s.allow[i] ? C.teal : C.gray, { align: 'center' });
    if (((!invert && wrong) || correct) && s.allow[i]) arrow(g, x, 355, x, 395, C.teal, 3);
  });
  line(g, 41, 277, 920, 277, C.rule);
  const show = invert ? correct : wrong;
  if (show)
    text(
      g,
      invert ? '(4 + 8) / 2 = ' + s.out : '1 × ' + s.out + ' = ' + s.out,
      490,
      416,
      28,
      invert ? C.teal : C.red,
      { align: 'center', weight: 600 },
    );
  foot(
    g,
    invert
      ? 'SDPA allow mask = inverse of the padding mask'
      : 'Directly passing the old padding flags',
    'A padding flag marks a key to exclude. An SDPA boolean mask marks a key to include.',
  );
}

export function guards(g, c) {
  const region = cue(c, 3, 'A guard failure');
  if (region) {
    const lower = cue(c, 3, 'Inductor lowers');
    const compare = cue(c, 4, 'The counting backend');
    shell(
      g,
      'Compilation',
      compare ? 'What did the graph count measure?' : 'Where did capture stop?',
      compare
        ? 'Two captured variants for this reference cache'
        : 'A graph break divides a single execution around unsupported Python.',
    );
    if (compare) {
      text(g, 'Counting backend', 51, 184, 22, C.teal, { weight: 700 });
      const labels = ['capture A', 'reuse A', 'capture B', 'reuse A'];
      labels.forEach((label, i) => {
        const x = 54 + i * 224;
        box(g, x, 215, 188, 53, C.pale, C.teal, 4);
        text(g, label, x + 94, 241, 20, C.teal, { align: 'center' });
        if (i < 3) arrow(g, x + 193, 241, x + 218, 241, C.gray);
      });
      text(
        g,
        'Captured graphs execute eagerly. This trace contains no kernel timings.',
        52,
        305,
        21,
        C.ink,
      );
      if (cue(c, 4, 'Match the compiled backward')) {
        line(g, 50, 338, 907, 338, C.rule);
        text(g, 'Example precision boundary', 52, 365, 18, C.gray);
        text(g, 'Forward in autocast', 52, 406, 21, C.blue);
        arrow(g, 291, 406, 384, 406, C.gray);
        text(g, 'Backward outside autocast', 411, 406, 21, C.blue);
      }
      foot(
        g,
        'Time startup and warm execution separately.',
        'Match the backward autocast assumption to the actual context. Compare eager and compiled losses and gradients.',
      );
      return;
    }
    const blocks = [
      [57, 225, 231, 'Captured region 1', C.pale, C.teal],
      [343, 225, 265, 'Python outside graph', C.peach, C.red],
      [661, 225, 240, 'Captured region 2', C.pale, C.teal],
    ];
    blocks.forEach(([x, y, w, s, f, t]) => {
      box(g, x, y, w, 70, f, t, 5);
      text(g, s, x + w / 2, y + 35, 21, t, { align: 'center', width: w - 16 });
    });
    arrow(g, 294, 260, 337, 260, C.gray);
    arrow(g, 613, 260, 657, 260, C.gray);
    text(g, 'One execution', 57, 186, 19, C.gray);
    if (lower)
      text(
        g,
        'Dynamo capture   →   AOTAutograd staging   →   Inductor lowering',
        480,
        368,
        22,
        C.blue,
        { align: 'center', width: 860 },
      );
    foot(
      g,
      'A guard miss concerns reuse across calls.',
      'A graph break concerns what happens inside one call.',
    );
    return;
  }
  const gotA = cue(c, 1, 'Its output');
  const next = cue(c, 1, 'Repeat the key');
  const hit = cue(c, 1, 'Which field');
  const scale = cue(c, 2, 'Scale changes');
  const gotB = cue(c, 2, 'Its output is twelve');
  const back = cue(c, 2, 'and A works again');
  const returnHit = cue(c, 2, 'A change in stride');
  const index = back ? 3 : scale ? 2 : next ? 1 : 0,
    e = events[index];
  const shown = [gotA, hit, gotB, returnHit];
  const entries = events.slice(0, index + 1).filter((_, i) => shown[i]);
  shell(
    g,
    'Guarded execution',
    'Can this call reuse a graph?',
    'Reference function   f(x, scale) = x² × scale     ·     fixed shape (2,)',
  );
  text(g, 'Call ' + (index + 1), 49, 173, 21, C.gray, { weight: 700 });
  mono(g, 'x = [' + e.x.join(', ') + ']', 49, 215, 24, C.ink);
  text(g, 'Guard fields', 49, 268, 18, C.gray);
  const fields = [
    ['dtype', e.dtype],
    ['stride', e.stride],
    ['scale', e.scale],
  ];
  fields.forEach(([label, v], i) => {
    const x = 47 + i * 121;
    box(g, x, 297, 115, 74, i === 2 && scale && !back ? C.peach : C.white, C.rule, 4);
    text(g, label, x + 57, 317, 16, C.gray, { align: 'center' });
    mono(g, v, x + 57, 347, 18, C.ink, { align: 'center', weight: 600 });
  });
  line(g, 435, 156, 435, 427, C.rule);
  text(g, 'Specializations in cache', 477, 174, 21, C.ink, { weight: 600 });
  const variants = entries.at(-1)?.variants ?? [];
  if (!variants.length) text(g, 'Empty', 485, 238, 25, C.gray, { font: 'Serif' });
  variants.forEach((k, i) => {
    const active = shown[index] && e.graph === String.fromCharCode(65 + i);
    box(g, 479, 211 + i * 69, 408, 54, active ? C.pale : C.white, active ? C.teal : C.rule, 4);
    mono(g, String.fromCharCode(65 + i), 509, 238 + i * 69, 24, C.teal, { align: 'center' });
    mono(g, k.split('/').join('   |   '), 551, 238 + i * 69, 19);
  });
  if (shown[index]) {
    text(g, (e.hit ? 'Reuse ' : 'Capture ') + e.graph, 50, 414, 22, C.teal, { weight: 700 });
    const outReady =
      index === 0
        ? cue(c, 1, 'the same as eager')
        : index === 2
          ? cue(c, 2, 'Both elements used')
          : true;
    if (outReady) mono(g, 'Output   [' + e.out.join(', ') + ']', 482, 397, 22, C.blue);
  }
  foot(
    g,
    'Cache entries   ' + variants.length,
    entries.length
      ? 'Calls so far     ' +
          entries
            .map((ev) => (ev.hit ? 'reuse ' + ev.graph : 'capture ' + ev.graph))
            .join('     →     ')
      : 'Compare dtype, stride and Python scale. This declared key excludes tensor values.',
  );
}
