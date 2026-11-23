import * as M from './model.mjs';
import {
  P,
  traceColors,
  mark,
  fill,
  box,
  line,
  mono,
  label,
  serif,
  opacity,
  corner,
  page,
  footer,
  caption,
  cue,
  resolved,
  viewport,
  plot,
  arrow,
  ruler,
} from './art.mjs';
const fmt = M.format,
  fixed = (n) => n.toFixed(3),
  vec = (v) => '[' + v.map((x) => Number(x.toFixed(3))).join(', ') + ']';
export function attention(c, k) {
  const b = k.beat.beatIndex;
  if (b === 6) {
    page(
      c,
      'Which layers does the connector join?',
      'Multi-block interface   /   example insertion depths',
    );
    const tapped = cue(k, 6, 'Follow two taps', 1.1),
      insert = cue(k, 6, 'Now follow', 1.1);
    const xs = [180, 1240],
      ww = 430,
      ys = [352, 477, 602, 727];
    for (let j = 0; j < 2; j++) {
      mono(c, j ? 'LANGUAGE DECODER' : 'VISION ENCODER', xs[j], 280);
      ys.forEach((y, i) => {
        box(c, xs[j], y, ww, 72, P.panel);
        label(c, 'Block ' + (i + 1), xs[j] + ww / 2, y + 36, 34, P.light, { align: 'center' });
        if (i < 3) arrow(c, xs[j] + ww / 2, y + 77, xs[j] + ww / 2, y + 119, P.muted, 3);
      });
    }
    box(c, 770, 505, 290, 136, P.teal);
    label(c, 'K, V bridge', 915, 573, 37, P.light, { align: 'center' });
    opacity(c, tapped, () => {
      for (const idx of [1, 3]) arrow(c, 618, ys[idx] + 36, 765, idx === 1 ? 543 : 609);
    });
    opacity(c, insert, () => {
      for (const idx of [2, 3]) arrow(c, 1066, idx === 2 ? 543 : 609, 1230, ys[idx] + 36);
    });
    footer(
      c,
      'Encoder taps select feature levels. Decoder insertions select where the model reads them.',
      'This example sends the output of vision blocks 2 and 4 to decoder blocks 3 and 4.',
    );
    return;
  }
  if (b === 5) {
    const gain = Math.round(0.35 * cue(k, 5, 'Raise the gate', 1.8) * 1000) / 1000,
      fused = M.fuse(gain);
    page(
      c,
      'How much of the visual read reaches the text state?',
      'Separate residual   /   learned scalar gate',
    );
    mono(c, 'BASE TEXT', 120, 328);
    mono(c, 'VISUAL READ', 559, 328);
    mono(c, 'GATE', 1010, 328);
    mono(c, 'FUSED TEXT', 1390, 328);
    for (let i = 0; i < 3; i++) {
      const y = 447 + i * 126;
      mono(c, M.query[i].toFixed(3), 120, y, 44, P.ink);
      mono(c, '+', 424, y, 42, P.muted);
      mono(c, M.read[i].toFixed(3), 562, y, 44, P.teal);
      mono(c, '×', 848, y, 42, P.muted);
      mono(c, Math.tanh(gain).toFixed(3), 1008, y, 44, P.ink);
      mono(c, '=', 1250, y, 42, P.muted);
      mono(c, fused[i].toFixed(3), 1390, y, 44, P.ink);
      fill(c, 1391, y + 39, M.query[i] * 424, 13, '#44667d');
      fill(c, 1391 + M.query[i] * 424, y + 39, (fused[i] - M.query[i]) * 424, 13, P.teal);
    }
    footer(
      c,
      'Gate strength = tanh(' + gain.toFixed(3) + '). The base and visual read stay fixed.',
      'Each green bar extension is the visual contribution added to that coordinate. Figures are rounded.',
    );
    return;
  }
  if (b >= 3) {
    const insert = resolved(k, 3, 'Now try inserting');
    const visualValue = resolved(k, 3, 'zero value');
    const bothScores = resolved(k, 3, 'Both scores are zero');
    const split = cue(k, 4, 'Each position gets half the weight', 0.9);
    const readPhrase = 'The shared read is one';
    const done = resolved(k, 4, readPhrase) && k.elapsed >= k.wordCue(readPhrase).end;
    page(c, 'Where does the zero enter?', 'Attention   /   two different operations');
    mono(c, 'SEPARATE VISUAL RESIDUAL', 115, 314);
    box(c, 110, 372, 803, 453, P.panel);
    label(c, 'Base text state', 154, 435, 36, P.dim);
    mono(c, vec(M.query), 154, 503, 44, P.light);
    if (resolved(k, 3, 'A zero gate')) label(c, '+  tanh(0) × visual read', 154, 584, 44, P.green);
    if (resolved(k, 3, 'The base stays put')) mono(c, '= ' + vec(M.gated), 154, 668, 44, P.light);

    mono(c, 'WEIGHT INSIDE ONE SOFTMAX', 1010, 314);
    box(c, 1000, 372, 805, 453, P.panel);
    const colors = [P.sky, P.gold];
    for (let i = 0; i < (insert ? 2 : 1); i++) {
      const y = 420 + i * 51;
      label(c, i ? 'Visual key' : 'Text key', 1040, y, 38, colors[i]);
      if (i === 0 || bothScores) mono(c, 'score ' + M.jointScores[i], 1265, y, 36, P.dim);
      if (i === 0 || visualValue) mono(c, 'value ' + M.jointValues[i], 1510, y, 36, P.light);
    }
    const barX = 1040;
    const barWidth = 725;
    const barHeight = 48;
    const barEnd = barX + barWidth;
    const percent = (weight) => Math.round(100 * weight) + '%';
    label(c, 'Text key alone', barX, 539, 36, P.light);
    mono(c, 'Read = ' + M.textOnlyRead, barEnd, 539, 36, P.light, 'right');
    fill(c, barX, 566, barWidth, barHeight, colors[0]);
    mono(c, percent(M.textOnlyWeight), barX + barWidth / 2, 590, 40, P.ink, 'center');

    if (insert) {
      const y = 685;
      label(c, 'With the visual key', barX, 657, 36, P.light);
      mono(c, done ? 'Read = ' + M.joint : 'Read = ?', barEnd, 657, 36, P.light, 'right');
      box(c, barX, y, barWidth, barHeight, P.panel2, P.grid, 0);
      if (split > 0) {
        const visualWidth = barWidth * (M.jointWeights[1] / M.textOnlyWeight) * split;
        const textWidth = barWidth - visualWidth;
        fill(c, barX, y, textWidth, barHeight, colors[0]);
        fill(c, barX + textWidth, y, visualWidth, barHeight, colors[1]);
        if (split === 1) {
          const centers = [barX + textWidth / 2, barEnd - visualWidth / 2];
          M.jointWeights.forEach((weight, i) =>
            mono(c, percent(weight), centers[i], y + barHeight / 2, 40, P.ink, 'center'),
          );
        }
      } else mono(c, '?', barX + barWidth / 2, y + barHeight / 2, 32, P.dim, 'center');
      if (done) {
        const terms = M.jointWeights.map((weight, i) => `${weight} × ${M.jointValues[i]}`);
        mono(c, `${terms.join(' + ')} = ${M.joint}`, barX, 777, 43, P.light);
      }
    }
    footer(
      c,
      done
        ? 'The visual key takes weight. Its value contributes zero.'
        : insert
          ? 'Does the shared read stay at ' + M.textOnlyRead + '?'
          : 'Compare a separate residual with a read inside the softmax.',
      done
        ? 'Masking the extra position would leave the text value with all of the weight.'
        : bothScores
          ? 'Both keys have the same score. Their values stay fixed.'
          : '',
      { ruleY: 843, mainY: 872, subY: 913 },
    );
    return;
  }
  const shares = b > 0,
    done = resolved(k, 2, 'The middle slot'),
    summed = resolved(k, 2, 'point three two two');
  if (resolved(k, 2, 'Read down the second value column')) {
    const second = resolved(k, 2, 'point two seven one'),
      third = resolved(k, 2, 'The third value column'),
      complete = resolved(k, 2, 'point four zero seven'),
      active = third ? 2 : 1;
    const xs = [855, 1200, 1545];
    page(c, 'How do the same weights read each coordinate?', 'Cross-attention   /   visual values');
    mono(c, 'ONE ROW PER VISUAL SLOT', 114, 276, 28, P.teal);
    box(c, 86, 332, 1748, 436, P.panel);
    box(c, xs[active] - 144, 346, 288, 405, '#294f53');
    for (const [title, x] of [
      ['Slot', 137],
      ['Softmax weight', 370],
    ])
      label(c, title, x, 395, 32, P.dim);
    xs.forEach((x, j) => mono(c, 'Value ' + (j + 1), x, 395, 31, P.light, 'center'));
    M.vals.forEach((values, i) => {
      const y = 492 + i * 98;
      line(c, 119, y - 47, 1797, y - 47, P.grid, 1.3);
      mark(c, i, 151, y, 10);
      mono(c, i + 1, 186, y, 34, P.light);
      mono(c, fixed(M.weights[i]), 370, y, 37, traceColors[i]);
      values.forEach((v, j) => mono(c, v.toFixed(1), xs[j], y, 39, P.light, 'center'));
    });
    label(c, 'Weighted sum', 137, 821, 39, P.ink);
    xs.forEach((x, j) =>
      mono(
        c,
        j === 0 || (j === 1 && second) || complete ? fixed(M.read[j]) : '?',
        x,
        821,
        43,
        P.teal,
        'center',
      ),
    );
    footer(
      c,
      complete
        ? 'Visual read ≈ ' + vec(M.read)
        : 'Column ' +
            (active + 1) +
            ' ≈ ' +
            M.vals.map((v, i) => fixed(M.weights[i]) + ' × ' + v[active].toFixed(1)).join('  +  '),
      'Each row is one slot’s value vector. The totals use the unrounded softmax weights.',
    );
    return;
  }
  page(
    c,
    b === 0
      ? 'How does a text query score three visual keys?'
      : 'Which slot contributes most to the first coordinate?',
    'Cross-attention   /   three invented visual slots',
  );
  mono(c, 'TEXT QUERY   ' + vec(M.query), 110, 276, 30, P.teal);
  box(c, 86, 344, 1748, 432, P.panel);
  const xs = shares ? [135, 375, 735, 1130, 1505] : [135, 370, 900, 1405];
  (shares
    ? ['Slot', 'Scaled score', 'Softmax weight', 'First value', 'Contribution']
    : ['Slot', 'Visual key', 'Dot product', 'Scaled score¹']
  ).forEach((s, i) => label(c, s, xs[i], 400, 30, P.dim));
  for (let i = 0; i < 3; i++) {
    const y = 493 + i * 100;
    line(c, 119, y - 49, 1797, y - 49, P.grid, 1.3);
    mark(c, i, 151, y, 10);
    mono(c, i + 1, 186, y, 34, P.light);
    if (shares) {
      [fixed(M.scores[i]), fixed(M.weights[i]), M.vals[i][0].toFixed(1)].forEach((v, j) =>
        mono(c, v, xs[j + 1], y, 36, P.light),
      );
      if (done) {
        mono(c, fixed(M.parts[i]), xs[4], y, 34, traceColors[i]);
      } else mono(c, '?', xs[4], y, 32, P.dim);
    } else {
      mono(c, vec(M.keys[i]), xs[1], y, 32, P.light);
      if (resolved(k, 0, 'add, and divide')) mono(c, M.dots[i].toFixed(3), xs[2], y, 34, P.light);
      if (resolved(k, 0, 'Watch the first row'))
        mono(c, fixed(M.scores[i]), xs[3], y, 34, traceColors[i]);
    }
  }
  if (done) {
    let x = 120;
    const scale = 2750;
    opacity(c, cue(k, 2, 'Place the three contributions', 1.15), () => {
      for (let i = 0; i < 3; i++) {
        const w = M.parts[i] * scale;
        fill(c, x, 811, w, 44, traceColors[i]);
        line(c, x, 811, x, 855, P.panel, 2);
        x += w;
      }
    });
    if (summed) mono(c, '≈ ' + fixed(M.read[0]), 1090, 835, 36, P.ink);
  }
  if (b === 0)
    footer(
      c,
      '¹ Scaled score = dot product ÷ √3. Three coordinates set the key width.',
      'For slot 1:  0.2 × 0.2  +  0.1 × 0.05  +  0.7 × 0.75  =  0.570',
    );
  else if (done)
    footer(
      c,
      'Slot 2 supplies the largest first-coordinate contribution.',
      'Each colored segment represents its slot’s weight times its first value.',
    );
  else
    footer(
      c,
      'For each slot, multiply its softmax weight by its own value.',
      'Softmax exponentiates the scores and divides each exponential by their common sum.',
    );
}
export function region(c, k) {
  const b = k.beat.beatIndex,
    locate = b > 0,
    named = resolved(k, 0, 'Checkout');
  const arrived = resolved(k, 2, 'two corners'),
    cite = resolved(k, 4, 'Cite the plot');
  page(
    c,
    cite
      ? 'Which regions support the latency claim?'
      : b >= 3
        ? 'Does this region support a latency claim?'
        : locate
          ? 'Where is the paging badge?'
          : 'Which service slowed after three?',
    'Dashboard export   /   ' +
      (arrived ? 'region output' : locate ? 'operator request' : 'service reading'),
  );
  viewport(c, 84, 287, 1.16, () => {
    plot(c, {
      answer: (!locate && named) || cite,
      readout: !locate || cite,
      region: arrived && !cite,
    });
    if (cite) corner(c, 394, 95, 566, 298, P.gold, 17, 4);
  });
  mono(
    c,
    b >= 3
      ? 'CITED EVIDENCE'
      : locate && !arrived
        ? 'OPERATOR REQUEST'
        : !locate && !named
          ? 'SERVICE READING'
          : 'RETURNED ANSWER',
    1305,
    335,
    25,
    P.teal,
  );
  if (arrived || !locate)
    serif(
      c,
      cite
        ? 'Plot + legend'
        : locate
          ? 'Source region'
          : named
            ? M.names[M.riseIndex]
            : 'Which service?',
      1305,
      416,
      55,
    );
  if (cite) {
    mono(c, 'TRACE AND AXIS', 1305, 528, 25, P.muted);
    label(c, '5.2 → 9.0 ms', 1305, 581, 43);
    mono(c, 'GREEN DIAMOND', 1305, 683, 25, P.muted);
    label(c, M.names[M.riseIndex], 1305, 736, 43);
  } else if (arrived) {
    const [x, y, X, Y] = M.boxCorners(M.badge);
    mono(c, 'TOP LEFT', 1305, 528, 25, P.muted);
    mono(c, '(' + x + ', ' + y + ')', 1305, 581, 41, P.ink);
    mono(c, 'BOTTOM RIGHT', 1305, 683, 25, P.muted);
    mono(c, '(' + X + ', ' + Y + ')', 1305, 736, 41, P.ink);
  } else if (locate) {
    serif(c, 'What should the', 1305, 443, 55);
    serif(c, 'model return?', 1305, 513, 55);
  } else label(c, 'Green diamond in legend', 1305, 548, 34, P.muted);
  if (b === 0)
    footer(c, 'Read the axis, trace and legend to answer a question about a named service.');
  else if (!arrived)
    footer(
      c,
      'Point to PAGING on the same screenshot.',
      'What could the interface use to highlight it?',
    );
  else if (b === 2)
    footer(
      c,
      'Coordinates refer to this 1,000 × 480 source image.',
      'Map crop coordinates back to the original before returning the region.',
    );
  else if (b === 3)
    footer(c, 'Proposed claim: “Latency rose.” Does the highlighted evidence support it?');
  else
    footer(
      c,
      cite
        ? 'The plot supports the rise. The green legend entry identifies Checkout.'
        : 'The badge supports a paging-status claim.',
      'Evidence can describe a control. Only policy and the authenticated caller can authorize its use.',
    );
}
function intervals(
  c,
  record,
  {
    x = 392,
    y = 445,
    w = 1335,
    min = 60,
    max = 300,
    ticks = [60, 120, 180, 240, 300],
    showOrder = false,
  } = {},
) {
  const at = (n) => x + ((n - min) * w) / (max - min);
  ruler(c, x, y + 254, w, max - min, []);
  for (const n of ticks) {
    line(c, at(n), y - 42, at(n), y + 254, P.rule, 1.5, [4, 8]);
    mono(c, n, at(n), y + 297, 25, P.muted, 'center');
  }
  const ranges = [record.deploy, record.rise];
  for (let i = 0; i < 2; i++) {
    const [lo, hi] = ranges[i],
      yy = y + 112 * i;
    label(c, i ? 'Chart rise' : 'Deploy', x - 34, yy, 35, P.ink, { align: 'right' });
    line(c, at(lo), yy, at(hi), yy, i ? P.teal : '#546c8c', 18);
    for (const n of [lo, hi]) {
      mark(c, 2, at(n), yy, 12, i ? P.teal : '#546c8c');
      mono(c, n, at(n), yy - 38, 29, P.ink, 'center');
    }
  }
  const overlap =
    Math.min(record.deploy[1], record.rise[1]) - Math.max(record.deploy[0], record.rise[0]);
  if (showOrder) {
    const d = record.deploy[1],
      r = record.rise[0];
    if (overlap === 0) {
      line(c, at(r), y + 10, at(r), y + 51, P.red, 4, [5, 4]);
      line(c, at(r), y + 94, at(r), y + 103, P.red, 4);
    } else if (overlap < 0) {
      line(c, at(d), y + 51, at(r), y + 51, P.teal, 3);
      mark(c, 2, at(d), y + 51, 4, P.teal);
      mark(c, 2, at(r), y + 51, 4, P.teal);
    } else
      fill(
        c,
        at(Math.max(record.deploy[0], record.rise[0])),
        y + 42,
        (overlap * w) / (max - min),
        20,
        '#dabe8c',
      );
  }
}
export function chronology(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    page(c, 'What can a ready transcript support?', 'Case recovery   /   image unavailable');
    for (let i = 0; i < 2; i++) {
      const y = 360 + i * 193;
      label(c, i ? 'Bridge transcript' : 'Dashboard image', 130, y, 44);
      box(c, 685, y - 50, 345, 99, i ? P.teal : '#854f42');
      mono(c, i ? 'READY' : 'FAILED', 857, y, 34, P.light, 'center');
      arrow(c, 1060, y, 1190, y);
      label(c, i ? 'Keep its word spans' : 'Retry this artifact', 1240, y, 41);
      line(c, 130, y + 89, 1790, y + 89, P.rule, 2);
    }
    footer(
      c,
      'Policy may permit a labeled partial answer about the recorded words.',
      'The missing image keeps the chart claim on hold.',
    );
    return;
  }
  const narrow = b === 2 && resolved(k, 2, 'one hundred seventy through one hundred ninety'),
    data = narrow ? M.tight : M.wide;
  const verdict = b === 1 || (narrow && resolved(k, 2, 'We can report'));
  page(c, 'Did latency rise after the deploy?', 'Incident clock   /   inclusive UTC event bounds');
  mono(c, 'SECONDS AFTER 14:00 UTC   ·   MATCHED EVENT IDENTITIES', 110, 293, 27, P.teal);
  intervals(c, data, { showOrder: verdict });
  const order = M.order(data);
  footer(
    c,
    verdict
      ? order === 'after'
        ? 'The latest deploy precedes the earliest rise.'
        : 'The two intervals overlap. Either event could come first.'
      : 'Compare the latest possible deploy with the earliest possible rise.',
    b === 1
      ? 'The utterance at 14:22 dates the words about a rollback. It supplies no tighter bound here.'
      : 'A supported sequence of events still needs separate evidence for a causal claim.',
  );
}
export function evaluation(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const swapPhrase = 'trade only the names beside the blue square and the green diamond';
    const { start, end } = b === 0 ? k.wordCue(swapPhrase) : { start: 0, end: 0 };
    const swap = cue(k, 0, swapPhrase, end - start);
    const answer = b === 1 && k.elapsed + 1e-9 >= k.wordCue('Search. The').end;
    const highlight = cue(k, 1, 'The diamonds still rise', 2.2);
    page(
      c,
      'Would the same reader name the right service twice?',
      'Evidence evaluation   /   controlled legend change',
    );
    const scale = 0.84;
    const xs = [84, 1000];
    for (let i = 0; i < 2; i++) {
      mono(c, 'EXPORT ' + (i ? 'B' : 'A'), xs[i], 302);
      viewport(c, xs[i], 345, scale, () =>
        plot(c, {
          legendSwap: i ? swap : 0,
          answer: !i || answer,
          highlight,
          readout: true,
          showBadge: true,
        }),
      );
    }
    label(c, 'Cited service: ' + M.names[M.riseIndex], 92, 800, 39);
    label(
      c,
      answer ? 'Cited service: ' + M.swapped[M.riseIndex] : 'Cited service: ?',
      1000,
      800,
      39,
      answer ? P.teal : P.ink,
    );
    if (answer)
      label(c, 'Same diamonds: ' + M.readings[0].toFixed(1) + ' → ' + M.readings[1].toFixed(1) + ' ms', 960, 850, 29, P.teal, { align: 'center' });
    else
      label(c, 'Same points, same question, same budget', 960, 850, 29, P.muted, { align: 'center' });
  } else {
    const rerun = resolved(k, 3, 'On the complete rerun'),
      known = rerun ? b >= 4 : b === 3;
    const run = rerun ? M.runB : M.runA;
    page(c, 'Can this run clear the numerical gate?', 'Release evaluation   /   frozen cases');
    const cols = [126, 736, 1050, 1440];
    ['Required metric', 'Minimum', rerun ? 'Rerun' : 'Initial run', 'Metric gate'].forEach((v, i) =>
      mono(c, v.toUpperCase(), cols[i], 334, 26, P.teal),
    );
    M.requirements.forEach(([name, min], i) => {
      const y = 445 + i * 130;
      line(c, 110, y - 49, 1810, y - 49, P.rule, 2);
      label(c, name, cols[0], y, 42);
      mono(c, min.toFixed(2), cols[1], y, 38, P.ink);
      mono(c, Number.isNaN(run[i]) ? 'NaN' : run[i].toFixed(2), cols[2], y, 38, P.ink);
      const pass = M.passes(run[i], min);
      label(
        c,
        known ? (pass ? 'Pass' : 'Block') : '?',
        cols[3],
        y,
        38,
        known ? (pass ? P.teal : P.red) : P.muted,
      );
    });
    footer(
      c,
      known
        ? rerun
          ? 'Hold the rollout. Label exact match falls below 0.90.'
          : 'Hold the rollout. Region IoU has no finite measurement.'
        : 'Every required score must be finite, in [0, 1], and at least its threshold.',
      known && rerun
        ? 'Once the scores pass, check faithfulness, latency, memory and cost per grounded answer.'
        : 'Which required measurement, if any, blocks this run?',
    );
  }
}
const practiceFooter = { ruleY: 798, mainY: 832, subY: 878 };

export function practice(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const direct = M.freshDirect,
      small = M.freshSmall,
      done = resolved(k, 1, 'two thousand one hundred eighty-four'),
      directDone = resolved(k, 1, 'six thousand one hundred fifty-two');
    page(c, 'Which bridge admits this new incident?', 'Independent practice   /   four views');
    for (let i = 0; i < 4; i++) {
      const x = 105 + i * 205;
      box(c, x, 344, 171, 171, P.panel, null, 4);
      for (let j = 0; j < 32; j++) {
        line(c, x + (j * 171) / 32, 344, x + (j * 171) / 32, 515, P.grid, 1);
        line(c, x, 344 + (j * 171) / 32, x + 171, 344 + (j * 171) / 32, P.grid, 1);
      }
      mono(c, 'View ' + (i + 1), x + 85, 563, 26, P.muted, 'center');
    }
    caption(c, 'Decoded view', '448 px square / 14 px patches', 982, 309);
    caption(c, 'Fixed request', '1,800 text + 256 reply', 982, 479);
    caption(c, 'Context window', '4,096 positions', 982, 649);
    mono(c, 'DIRECT', 110, 671);
    mono(c, directDone ? fmt(direct.total) + ' total' : '1 state per patch', 329, 671, 32, P.ink);
    mono(c, 'REDUCED', 110, 767);
    mono(c, done ? fmt(small.total) + ' total' : '32 states per view', 329, 767, 32, P.ink);
    footer(
      c,
      done
        ? 'Choose the reduced route. ' + fmt(small.total) + ' positions fit.'
        : 'Which request fits when you include the text and the reply?',
      'Each view has its own patch grid and its own query bank.',
      practiceFooter,
    );
    return;
  }
  const named = resolved(k, 2, 'It identifies API'),
    timed = resolved(k, 2, 'On the same clock');
  const corrected = resolved(k, 3, 'one second earlier'),
    report = resolved(k, 4, 'The bounds touch');
  const record = corrected ? M.freshB : M.freshA;
  page(
    c,
    named ? 'Did API latency rise after this deploy?' : 'Which metric rose in this incident?',
    'Independent practice   /   verified source and clock',
  );
  const x = 94,
    y = 305,
    w = 549,
    h = 392;
  box(c, x, y, w, h, P.panel);
  mono(c, 'INCIDENT C28', x + 30, y + 42, 24, P.dim);
  const v = [3, 3.1, 3.0, 5.5, 6.4, 6.8];
  line(c, x + 40, y + 228, x + 510, y + 228, P.grid, 2);
  for (let i = 0; i < v.length; i++) {
    const xx = x + 42 + i * 90,
      yy = y + 260 - v[i] * 24;
    if (i) line(c, xx - 90, y + 260 - v[i - 1] * 24, xx, yy, P.green, 4);
    mark(c, 1, xx, yy, 6, P.green);
  }
  fill(c, x + 1, y + 284, w - 2, 104, P.panel2);
  mark(c, 1, x + 45, y + 337, 10);
  label(c, named ? 'API p95 latency' : 'Service name missing', x + 80, y + 337, 36, P.light);
  mono(c, 'REDUCED REQUEST   ' + fmt(M.freshSmall.total) + ' POSITIONS', 95, 764, 24, P.teal);
  if (timed) {
    mono(c, 'INCLUSIVE SECONDS ON ONE UTC CLOCK', 797, 293, 26, P.teal);
    intervals(c, record, {
      x: 887,
      y: 437,
      w: 852,
      min: 195,
      max: 255,
      ticks: [200, 210, 220, 230, 240, 250],
      showOrder: (!corrected && b === 3) || report,
    });
  } else if (!named) {
    mono(c, 'SOURCE REGION REQUIRED', 825, 417);
    serif(c, 'Which metric rose?', 825, 505, 59);
    label(c, 'Retrieve the original legend.', 825, 614, 36, P.muted);
  } else {
    mono(c, 'VERIFIED LEGEND', 825, 417);
    serif(c, 'API p95 latency', 825, 505, 59);
  }
  let answer = 'Recover the series name before identifying the metric.';
  if (named) answer = 'The original legend identifies the rising series as API p95 latency.';
  if (timed) answer = 'Compare the two closest inclusive endpoints.';
  if (b === 3 && !corrected) answer = 'The API latency rise followed the deploy.';
  if (corrected) answer = 'Only the earliest possible rise moved. Is strict order still supported?';
  if (report)
    answer =
      M.order(record) === 'unresolved'
        ? 'Report the API latency rise. Its order relative to the deploy is unresolved.'
        : 'The API latency rise followed the deploy.';
  footer(
    c,
    answer,
    report
      ? 'At second 220 the two intervals share an endpoint. The cited metric and request still hold.'
      : 'The clock bounds describe possible event times. The plot shows the observed trace.',
    practiceFooter,
  );
}
