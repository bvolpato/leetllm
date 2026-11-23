import {
  C,
  rect,
  round,
  line,
  dot,
  ring,
  poly,
  txt,
  head,
  ground,
  tag,
  bar,
  box,
  cue,
  pct,
} from './art.mjs';
import {
  fitted,
  deliveredHours,
  names,
  frozen,
  clock,
  atDoor,
  slices,
  testCosts,
  scores,
  labels,
  mean,
  trace,
  versioned,
  propose,
} from './evidence.mjs';

export function testPredictions(g, k) {
  const i = k.beat.beatIndex;
  ground(g, true);
  if (i < 2) {
    head(g, 'S-133   /   FROZEN CLASSIFIER', 'How do five features change the risk?', true);
    const x0 = 526,
      base = 162;
    line(g, x0, 128, x0, 363, '#92a7a3', 1);
    const phrases = [
      'scan age',
      'backlog reading',
      'service tier',
      'elapsed transit',
      'left to the promise',
    ];
    fitted.contributions.forEach((v, j) => {
      const y = base + j * 47,
        col = v < 0 ? C.coral : C.mint;
      txt(g, names[j], 65, y + 5, 21, C.light);
      if (cue(k, 0, phrases[j])) {
        bar(g, x0, y, v * 278, col, 16);
        txt(
          g,
          (v > 0 ? '+' : '') + v.toFixed(3),
          x0 + v * 278 + (v > 0 ? 10 : -10),
          y + 6,
          17,
          col,
          v > 0 ? 'left' : 'right',
          'Mono',
        );
      }
    });
    txt(g, 'Intercept ' + fitted.intercept.toFixed(3), 65, 411, 20, C.light, 'left', 'Mono');
    if (cue(k, 1, 'log odds come'))
      txt(g, 'Log odds ' + fitted.logit.toFixed(3), 360, 411, 20, C.amber, 'left', 'Mono');
    if (cue(k, 1, 'twenty-five percent'))
      txt(
        g,
        'Risk ' + (100 * fitted.probability).toFixed(1) + '%  /  Cutoff ' + pct(frozen),
        66,
        470,
        26,
        C.mint,
      );
    if (cue(k, 1, 'tracking stays silent')) tag(g, 'Normal tracking', 635, 440, C.ink, C.mint);
  } else if (i === 2 || (i === 3 && !cue(k, 3, 'silent expedited shipment'))) {
    head(g, 'S-133   /   MAY 14, NOON UTC', 'Three times for the same parcel', true);
    const rows = [
      ['Arrival estimate', fitted.eta, C.mint, cue(k, 2, 'eight twenty-two')],
      ['Original promise', fitted.input[4], C.amber, true],
      ['Delivered', deliveredHours, C.coral, cue(k, 2, 'eleven thirty-one')],
    ];
    const x = (h) => 278 + h * 44;
    rows.forEach(([name, h, c, show], j) => {
      const y = 195 + 80 * j;
      txt(g, name, 48, y + 8, 22, C.cream);
      line(g, x(0), y, x(12), y, '#516864', 1.5);
      if (show) {
        bar(g, x(0), y, x(h) - x(0), c, 6);
        dot(g, x(h), y, 7, c);
        txt(g, clock(12 + h), 895, y + 8, 22, c, 'right', 'Mono');
      }
    });
    if (rows[2][3])
      txt(
        g,
        atDoor(deliveredHours, fitted.input[4]) + ' min after the promise',
        50,
        436,
        28,
        C.coral,
      );
    if (i === 3)
      txt(g, (deliveredHours - fitted.eta).toFixed(2) + ' h ETA error', 580, 436, 26, C.mint);
  } else if (i === 3 || i === 4 || i === 5 || i === 6 || i >= 9) {
    const counter = cue(k, 9, 'twenty units'),
      price = counter ? 20 : 8,
      cost = testCosts(price);
    head(
      g,
      'FROZEN TEST   /   24 SYNTHETIC ORDERS',
      counter ? 'Change the price, keep the actions' : 'Who paid for each decision?',
      true,
    );
    txt(g, 'False warning   ' + price + ' units', 49, 148, 19, C.amber);
    const haveFalse = cue(k, 3, 'false warning on shipment'),
      knownFit = counter ? cue(k, 10, 'a hundred seventy') : cue(k, 3, 'a hundred fifty-eight');
    const knowAll = counter
      ? i === 10 && cue(k, 10, 'two hundred twenty')
      : cue(k, 5, 'eighty-eight');
    line(g, 479, 165, 479, 404, '#718780');
    txt(g, 'Fitted policy', 48, 201, 29, C.mint, 'left', 'Serif');
    txt(g, 'Warn everyone', 515, 201, 29, C.mint, 'left', 'Serif');
    txt(g, 'S-133   missed expedited', 49, 248, 19, C.light);
    txt(g, '150', 442, 248, 21, C.coral, 'right', 'Mono');
    if (haveFalse) {
      txt(g, 'S-126   false warning', 49, 292, 19, C.light);
      txt(g, price, 442, 292, 21, C.coral, 'right', 'Mono');
    }
    if (cue(k, 3, 'Eleven orders')) {
      for (let j = 0; j < 11; j++) {
        const x = 523 + (j % 6) * 35,
          y = 241 + Math.floor(j / 6) * 30;
        rect(g, x, y, 21, 12, C.coral);
        rect(g, x + 9, y, 4, 5, C.cream);
      }
      txt(g, '11 on time × ' + price, 515, 328, 20, C.light);
    }
    if (knownFit) txt(g, cost.fitted + ' units', 49, 390, 38, C.cream, 'left', 'Serif');
    if (knowAll) txt(g, cost.all + ' units', 515, 390, 38, C.cream, 'left', 'Serif');
    if (i === 5 && cue(k, 5, 'age rule costs'))
      txt(
        g,
        'Age rule   1,410     /     Always silent   ' + cost.silent.toLocaleString('en-US'),
        49,
        463,
        21,
        C.light,
      );
    if (i === 6)
      txt(
        g,
        slices.map((s) => s.tier + ' misses  ' + s.missed + ' / ' + s.late).join('       '),
        49,
        463,
        22,
        C.light,
      );
    if (i === 10)
      txt(g, 'Counterfactual prices   ·   Original release decision: hold', 49, 464, 23, C.amber);
  } else {
    head(g, 'SAME 24 TEST ORDERS', 'Two measures of performance', true);
    txt(g, 'Arrival error   /   mean absolute error', 48, 176, 26, C.mint, 'left', 'Serif');
    for (const [j, name, val] of [
      [0, 'Tier median', 4.203],
      [1, 'Fitted ETA', 2.479],
    ]) {
      const y = 225 + j * 58;
      txt(g, name, 48, y + 8, 20, C.light);
      bar(g, 241, y, val * 114, C.mint, 15);
      txt(g, val + ' h', 260 + val * 114, y + 8, 22, C.cream, 'left', 'Mono');
    }
    line(g, 48, 344, 913, 344, '#718780');
    txt(g, 'Warning cost  ·  Fitted 158  /  Warn all 88', 49, 391, 24, C.coral);
    if (cue(k, 7, 'Hold this release')) tag(g, 'Hold release', 49, 427, C.ink, C.amber);
    if (i === 8) txt(g, 'New policy → fresh evaluation cohort', 269, 455, 22, C.light);
  }
}

export function replay(g, k) {
  const i = k.beat.beatIndex;
  ground(g);
  if (i === 0) {
    head(g, 'S-133   /   FROZEN CLASSIFIER', 'Read the five inputs in saved order');
    const cols = [51, 310, 435, 573, 713, 909];
    ['Feature', 'Input', 'Mean', 'Scale', 'Weight', 'Effect'].forEach((v, j) =>
      txt(g, v, cols[j], 155, 16, C.muted, j === 5 ? 'right' : 'left', 'Mono'),
    );
    names.forEach((name, j) => {
      const y = 194 + j * 43;
      line(g, 47, y + 10, 912, y + 10, C.line);
      const v = [
        name,
        fitted.input[j].toFixed(3),
        fitted.mean[j].toFixed(3),
        fitted.scale[j].toFixed(3),
        fitted.weights[j].toFixed(3),
        fitted.contributions[j].toFixed(3),
      ];
      v.forEach((s, n) =>
        txt(
          g,
          s,
          cols[n],
          y,
          n ? 18 : 20,
          n === 5 ? C.teal : C.ink,
          n === 5 ? 'right' : 'left',
          n ? 'Mono' : 'Sans',
        ),
      );
    });
    txt(g, 'Effect = ((input − mean) / scale) × weight', 49, 435, 22, C.teal);
    txt(g, 'Add effects to intercept, then apply sigmoid.', 49, 480, 20, C.muted);
  } else if (i === 1) {
    head(g, 'S-133   /   FROZEN ARRIVAL MODEL', 'Predict remaining hours from the raw inputs');
    txt(g, 'Feature', 51, 155, 16, C.muted, 'left', 'Mono');
    txt(g, 'Input', 310, 155, 16, C.muted, 'left', 'Mono');
    names.forEach((name, j) => {
      const y = 194 + j * 43;
      line(g, 47, y + 10, 399, y + 10, C.line);
      txt(g, name, 51, y, 20, C.ink);
      txt(g, fitted.input[j].toFixed(3), 310, y, 18, C.ink, 'left', 'Mono');
    });
    txt(g, 'Least squares', 467, 201, 28, C.teal, 'left', 'Serif');
    txt(g, 'Multiply each input by its arrival weight.', 467, 249, 20);
    txt(g, 'Add the five terms and the arrival intercept.', 467, 283, 20);
    txt(g, fitted.eta.toFixed(3) + ' h remaining', 467, 358, 34, C.teal, 'left', 'Serif');
    txt(g, 'Scored at noon   ·   Arrival estimate ' + clock(12 + fitted.eta), 49, 465, 23, C.muted);
  } else if (i < 4) {
    head(g, 'ARTIFACT REPLAY', 'What can a reload verify?');
    const checks = [
      ['Schema and order', 'Five named inputs in the saved order'],
      ['Numbers and shapes', 'Five finite entries in each vector'],
      ['Scales and cutoff', 'Scales > 0   ·   0 ≤ threshold ≤ 1'],
      ['Test rows', 'Reloaded values match both estimators'],
    ];
    checks.forEach(([name, e], j) => {
      const y = 170 + j * 63;
      txt(g, name, 50, y, 22, C.blue);
      txt(g, e, 349, y, 22, C.ink);
      line(g, 49, y + 17, 910, y + 17, C.line);
    });
    if (i === 3) {
      tag(g, 'Pin the bytes', 49, 424);
      txt(g, 'Verify the supplier  ·  Keep run files and dependency lock', 256, 451, 20, C.muted);
    }
  } else if (i < 6) {
    head(g, 'SERVICE BOUNDARY   /   O-205', 'Can this value be a probability?');
    const supplied = cue(k, 4, 'one point four'),
      value = supplied ? 1.4 : NaN;
    const x = (v) => 129 + v * 443;
    line(g, x(0), 264, x(1.5), 264, C.line, 3);
    bar(g, x(0), 264, x(1) - x(0), C.teal, 11);
    txt(g, '0', x(0), 314, 24, C.teal, 'center', 'Mono');
    txt(g, '1', x(1), 314, 24, C.teal, 'center', 'Mono');
    if (supplied) {
      dot(g, x(value), 264, 10, C.rust);
      txt(g, String(value), x(value), 231, 31, C.rust, 'center', 'Mono');
    } else txt(g, 'Supplied risk: NaN', 49, 194, 25, C.rust, 'left', 'Mono');
    if (i === 5) {
      const d = propose(4, 2, value, 0.4);
      tag(g, d.action, 50, 378, C.cream, C.rust);
      txt(g, d.reason, 269, 405, 23, C.rust, 'left', 'Mono');
      txt(
        g,
        '1.4 remains a number in the trace. An unavailable number becomes null.',
        50,
        467,
        20,
        C.muted,
      );
    } else
      txt(g, 'Check identity, UTC snapshot, tier and ages before routing.', 49, 427, 21, C.muted);
  } else {
    const removed = cue(k, 6, 'Remove just'),
      t = trace(!removed),
      result = versioned(t);
    head(g, 'O-201   /   NOON   /   SUPPLIED RISK 0.62', 'Inspect the saved response');
    Object.keys(trace(true)).forEach((key, j) => {
      const y = 166 + j * 49;
      txt(g, key, 47, y, 19, C.muted, 'left', 'Mono');
      txt(g, t[key] ?? 'Field missing', 472, y, 20, t[key] ? C.blue : C.rust, 'left', 'Mono');
      line(g, 47, y + 13, 913, y + 13, C.line);
    });
    if (i === 7 || (!removed && cue(k, 6, 'version check passes')))
      tag(
        g,
        'versioned_trace   ' + (result ? 'PASS' : 'FAIL'),
        47,
        422,
        C.cream,
        result ? C.teal : C.rust,
      );
    if (i === 6 && removed)
      txt(g, 'Can you replay the warning policy?', 48, 450, 29, C.ink, 'left', 'Serif');
  }
}

export function monitor(g, k) {
  const i = k.beat.beatIndex,
    joined = ['late the second', 'time the third', 'late the fourth', 'time two of'].filter((p) =>
      cue(k, 2, p),
    ).length;
  const ready = joined === labels.length,
    meanKnown = cue(k, 2, 'thirty percent');
  ground(g);
  head(g, 'FOUR PREDICTIONS   /   ONE RISK BUCKET', 'When do the outcomes arrive?');
  txt(g, 'Scored', 45, 211, 20, C.muted);
  txt(g, 'Outcome', 45, 340, 20, C.muted);
  scores.forEach((p, j) => {
    const x = 204 + j * 186;
    box(g, x - 27, 174, 57, String(j + 1));
    txt(g, pct(p), x + 8, 261, 24, C.blue, 'center', 'Mono');
    line(g, x + 8, 273, x + 8, 305, C.line, 2);
    dot(g, x + 8, 309, 4, C.muted);
    const value = j < joined ? labels[j] : null;
    txt(
      g,
      value === null ? 'Pending' : value ? 'Late' : 'On time',
      x + 8,
      345,
      23,
      value === null ? C.muted : value ? C.rust : C.teal,
      'center',
      'Serif',
    );
  });
  line(g, 45, 376, 913, 376, C.line);
  if (!ready) {
    txt(g, i === 0 ? 'Available at scoring' : 'Matched labels', 47, 416, 18, C.teal);
    txt(
      g,
      i === 0
        ? 'Ages · nulls · latency · serving version · fallbacks'
        : joined + ' of 4   ·   Observed late fraction pending',
      47,
      459,
      25,
      C.ink,
    );
    if (meanKnown) txt(g, 'Mean risk ' + pct(mean(scores)), 715, 458, 22, C.blue);
  } else {
    txt(g, 'Mean prediction', 47, 421, 18, C.muted);
    txt(g, pct(mean(scores)), 47, 466, 34, C.blue, 'left', 'Serif');
    txt(g, 'Observed late', 315, 421, 18, C.muted);
    txt(g, '2 / 4  =  ' + pct(mean(labels)), 315, 466, 34, C.rust, 'left', 'Serif');
    const x = 722,
      y = 475,
      side = 89;
    line(g, x, y, x + side, y, C.muted);
    line(g, x, y, x, y - side, C.muted);
    line(g, x, y, x + side, y - side, C.line, 1.5);
    if (cue(k, 2, 'Plot that pair'))
      dot(g, x + mean(scores) * side, y - mean(labels) * side, 6, C.rust);
    txt(g, 'n = 4', 846, 447, 18, C.muted, 'center', 'Mono');
    txt(g, 'Predicted', x + 42, 499, 14, C.muted, 'center');
    txt(g, 'Observed', x - 7, y - side - 8, 14, C.muted, 'center');
  }
}

function rack(g, x, y, version, ready, live) {
  round(g, x, y, 189, 81, 6, ready ? '#315967' : '#334650');
  for (let j = 0; j < 3; j++) {
    rect(g, x + 10, y + 11 + j * 20, 47, 13, C.ink);
    dot(g, x + 20, y + 17 + j * 20, 2.7, ready ? C.mint : '#798881');
  }
  txt(g, 'Worker ' + version, x + 69, y + 33, 21, C.cream, 'left', 'Serif');
  txt(
    g,
    live ? 'Serving' : ready ? 'Ready' : 'Unloaded',
    x + 69,
    y + 61,
    16,
    live ? C.amber : C.light,
    'left',
    'Mono',
  );
}
export function servingState(k) {
  const alias = cue(k, 0, 'changes the registry alias') ? 'v3' : 'v2';
  const ready3 = Boolean(cue(k, 1, 'Wait for readiness'));
  const routed3 = Boolean(cue(k, 1, 'Route a request')),
    back = Boolean(cue(k, 2, 'switch traffic back'));
  const live = routed3 && !back ? 'v3' : 'v2';
  const verified = back
    ? Boolean(cue(k, 2, 'Check the old fingerprint'))
    : routed3
      ? Boolean(cue(k, 1, 'verify the returned fingerprint'))
      : Boolean(cue(k, 0, 'returns version two'));
  return { alias, ready3, live, verified };
}
export function serving(g, k) {
  ground(g, true);
  const s = servingState(k),
    i = k.beat.beatIndex;
  head(g, 'SERVING LAYER   /   ROUTED PROBE', 'Follow the request to its worker', true);
  txt(g, 'Registry alias', 49, 164, 20, C.light);
  tag(g, s.alias, 230, 137, C.ink, C.amber, 20);
  const gateX = 299,
    entryY = 307,
    ys = [234, 385],
    target = s.live === 'v2' ? ys[0] : ys[1];
  round(g, 45, 278, 153, 56, 7, '#314d59');
  txt(g, 'Request', 122, 315, 24, C.cream, 'center', 'Serif');
  line(g, 199, entryY, gateX, entryY, C.mint, 4);
  ys.forEach((y, j) => {
    const v = 'v' + (j + 2),
      live = v === s.live,
      col = live ? C.mint : '#49646c';
    line(g, gateX, entryY, 421, y, col, live ? 4 : 1.5);
    line(g, 421, y, 508, y, col, live ? 4 : 1.5);
    if (live)
      poly(
        g,
        [
          [509, y],
          [498, y - 7],
          [498, y + 7],
        ],
        col,
      );
    rack(g, 514, y - 40, v, j === 0 || s.ready3, live);
  });
  dot(g, gateX, entryY, 8, C.amber);
  line(g, 704, target, 738, target, C.mint, 4);
  txt(g, 'Routed probe', 748, target - 5, 16, C.light);
  txt(
    g,
    s.verified ? s.live + ' fingerprint' : 'Awaiting probe',
    748,
    target + 24,
    s.verified ? 20 : 17,
    s.verified ? C.mint : C.amber,
  );
  if (i >= 2)
    txt(g, 'Recovery bundle   ·   Preprocessing, schema, model and policy', 48, 479, 21, C.light);
  else if (i === 1) txt(g, 'Readiness gates the traffic switch.', 48, 479, 21, C.light);
}
