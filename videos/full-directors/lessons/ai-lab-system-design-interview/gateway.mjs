import {
  C,
  fmt,
  box,
  line,
  dot,
  tx,
  label,
  serif,
  opacity,
  grid,
  frame,
  foot,
  chip,
  cue,
  arrow,
  paper,
  scope,
  mark,
} from './instrument.mjs';
import {
  queue, arrival, balance, ledger, memoryBudget, trafficBudget,
  stageStatus, expertScores, selectedExpert, expertDevices,
} from './examples.mjs';

export function opening(g, k) {
  const measure = cue(k, 1, 'Each unit'),
    wait = cue(k, 2, 'Four hundred milliseconds'),
    verdict = cue(k, 2, 'Return five oh three');
  const result = arrival(5),
    msPerUnit = arrival(1).wait,
    x = (t) => 90 + t * 1.81;
  frame(g, k, 'Admission · R-105', 'Where could this request start?', true);
  scope(g, 40, 131, 880, 249);
  label(g, 'ONE WORKER     /     REMAINING PROMPT WORK', 61, 163, '#b5d0cd');
  chip(g, '✓  Caller has quota', 743, 142, C.mint, C.screen);
  for (let i = 0; i < result.units; i++) {
    const left = x(i * msPerUnit),
      right = x((i + 1) * msPerUnit),
      color = i === 0 ? C.gold : C.mint;
    box(g, left + 2, 223, right - left - 4, 67, i === 0 ? '#685b39' : '#315c51', null, 2);
    line(g, left + 2, 289, left + 2, 224, color, 2.5);
    line(g, left + 2, 224, right - 4, 224, color, 2.5);
    line(g, right - 4, 224, right - 4, 289, color, 2.5);
    tx(g, i === 0 ? 'A' : 'B', (left + right) / 2, 259, 23, color, 'Mono', 600, 'center');
    opacity(g, measure, () =>
      tx(g, '10k', (left + right) / 2, 280, 13, C.white, 'Mono', 400, 'center'),
    );
  }
  const limit = x(queue.budgetMs);
  line(g, limit, 197, limit, 321, C.peach, 2.5, true);
  tx(g, '250 ms limit', limit, 190, 18, C.peach, 'Sans', 600, 'center');
  line(g, x(0), 301, x(440), 301, '#96b4b0', 1);
  for (let t = 0; t <= 400; t += 80) {
    line(g, x(t), 301, x(t), 309, C.white);
    tx(g, t + '', x(t), 330, 15, C.white, 'Mono', 400, 'center');
  }
  tx(g, 'ms after arrival', 90, 354, 14, '#aad1c3', 'Mono');
  opacity(g, wait, () => {
    dot(g, x(result.wait), 300, 5, C.gold);
    tx(g, 'Earliest start', x(result.wait), 354, 16, C.gold, 'Sans', 600, 'center');
  });
  foot(
    g,
    verdict
      ? 'R-105   /   ADMISSION RECEIPT'
      : measure
        ? 'SERVICE ASSUMPTION   /   125,000 TOKENS PER SECOND'
        : 'R-105   /   BEFORE ENQUEUE',
    verdict
      ? result.status +
          '   Shared overload    ·    ' +
          result.wait +
          ' ms wait > ' +
          queue.budgetMs +
          ' ms'
      : measure
        ? '10,000 tokens per unit   ÷   125,000 tokens/s   =   80 ms'
        : '“Summarize my notes.”',
    C.teal,
    true,
  );
}

export function trace(g, k) {
  const b = k.beat.beatIndex,
    auth = cue(k, 0, 'Authentication'),
    ent = cue(k, 0, 'Authorization'),
    quota = cue(k, 0, 'Quota reservation'),
    admit = cue(k, 1, 'The scheduler declines'),
    reply = cue(k, 2, 'There was no model call');
  frame(g, k, 'Trace · R-105', 'Who made the decision?');
  const rows = [
    ['Request ID', 'Gateway', 'R-105', 1],
    ['Identity', 'Authenticator', 'Team / notes', auth],
    ['Model entitlement', 'Policy P7', 'Allowed', ent],
    ['Caller quota', 'Bucket Q7', 'Available', quota],
    ['Admission', 'Scheduler', '503 · shared overload', admit],
    ['Provider span', 'Route A', 'No call', reply],
  ];
  paper(g, 39, 123, 882, 273);
  label(g, 'BOUNDARY', 66, 161);
  label(g, 'OWNER', 405, 161);
  label(g, 'RECORDED VALUE', 630, 161);
  rows.forEach(([name, owner, value, p], i) => {
    const y = 193 + i * 36;
    line(g, 64, y + 9, 895, y + 9, C.grid);
    tx(g, name, 66, y, 18);
    opacity(g, p, () => {
      tx(g, owner, 405, y, 17, C.muted);
      tx(g, value, 630, y, 18, i === 4 ? C.rust : C.teal, 'Mono', 500);
    });
    if (!p) tx(g, '···', 630, y, 18, C.rule, 'Mono');
  });
  foot(
    g,
    b === 3
      ? 'CONTROL PLANE  →  REQUEST PATH'
      : admit
        ? 'R-105   /   ROUTE A   /   POLICY P7   /   QUOTA AVAILABLE'
        : 'ACCESS-CONTROLLED SUPPORT TRACE',
    b === 3
      ? 'P7 supplies Route A and bucket Q7 to the gateway.'
      : admit
        ? 'Admission estimated ' +
          arrival(5).wait +
          ' ms against a ' +
          queue.budgetMs +
          ' ms wait limit.'
        : 'POST /v1/responses     ·     server-generated request ID',
  );
}

export function quota(g, k) {
  const r = cue(k, 0, 'Atomically reserve') > 0,
    settled = cue(k, 1, 'Refund the unused') > 0,
    duplicate = cue(k, 2, 'Zero') > 0,
    other = cue(k, 2, 'Compare an independent stream') > 0;
  const main = balance(r, settled);
  frame(g, k, 'Token bucket', 'What gets refunded on a duplicate?');
  function account(y, id, v, status) {
    tx(g, id, 51, y, 20, C.ink, 'Mono', 600);
    tx(g, status, 900, y, 17, C.muted, 'Sans', 500, 'right');
    const w = 842,
      x = 54;
    let start = x;
    for (const [n, color] of [
      [v.available, C.teal],
      [v.used, C.blue],
      [v.pending, '#d09443'],
    ]) {
      if (n) box(g, start, y + 16, (w * n) / ledger.total, 36, color);
      start += (w * n) / ledger.total;
    }
    tx(g, fmt(v.available) + ' available', 54, y + 81, 18, C.teal, 'Sans', 600);
    tx(g, fmt(v.used) + ' used', 409, y + 81, 18, C.blue);
    tx(g, fmt(v.pending) + ' pending', 896, y + 81, 18, '#895419', 'Sans', 500, 'right');
  }
  account(
    164,
    'Stream A',
    main,
    duplicate
      ? 'Duplicate delivery · already settled'
      : settled
        ? 'Confirmed usage received'
        : r
          ? 'Reservation recorded'
          : 'Starting balance',
  );
  if (other)
    account(309, 'Stream B', balance(true, false), 'Independent replay · final usage missing');
  else {
    line(g, 54, 279, 895, 279, C.rule);
    label(g, 'COMPLETION EVENT   /   STREAM A', 54, 308);
    tx(
      g,
      settled
        ? '1,800 reserved  −  1,520 used  =  280 returned'
        : k.beat.beatIndex === 1
          ? 'Actual usage confirmed · 1,520 tokens'
          : 'Reservation = prompt + maximum permitted output',
      54,
      350,
      25,
      C.ink,
      'Serif',
    );
  }
  foot(
    g,
    'QUOTA LEDGER   /   10,000 TOKENS PER INDEPENDENT CASE',
    duplicate
      ? 'One request ID owns one settlement.'
      : 'Available + used + pending = starting balance',
  );
}

const mem = memoryBudget();
function memoryBar(g, x, y, value, tone) {
  box(g, x, y, 477, 24, C.grid);
  box(g, x, y, (477 * value) / 20, 24, tone);
  tx(g, value.toFixed(1) + ' GB', x + 483, y + 20, 18, tone, 'Mono', 600);
}
export function memory(g, k) {
  const b = k.beat.beatIndex,
    grouped = cue(k, 3, 'The cache falls') > 0;
  frame(
    g,
    k,
    'Replica · BF16',
    b === 4
      ? 'How much cache do these histories use?'
      : b === 1
        ? 'How many bytes follow one token?'
        : 'Which memory follows the requests?',
  );
  if (b === 4) {
    const histories = [512, 1536],
      total = histories.reduce((a, b) => a + b, 0);
    const bytes = total * mem.perTokenGqa,
      gib = bytes / 2 ** 30;
    label(g, 'FULL HISTORIES   /   SAME CHECKPOINT', 58, 158);
    for (const [i, n] of histories.entries()) {
      const y = 194 + i * 75;
      tx(g, 'Request ' + (i + 1), 59, y + 21, 18);
      box(g, 189, y, n / 3.4, 30, i ? C.teal : C.blue);
      tx(g, fmt(n) + ' tokens', 203 + n / 3.4, y + 22, 19, C.ink, 'Mono', 500);
    }
    const sum = cue(k, 4, 'Together they retain');
    opacity(g, sum, () =>
      tx(
        g,
        fmt(total) + ' retained positions  ×  ' + fmt(mem.perTokenGqa) + ' bytes',
        59,
        371,
        24,
        C.ink,
        'Mono',
        500,
      ),
    );
    const result = cue(k, 4, 'a quarter of a gibibyte');
    foot(
      g,
      'INDEPENDENT FULL HISTORIES   /   8 KV HEADS   /   BF16',
      result
        ? fmt(bytes) + ' bytes   ÷   2³⁰   =   ' + gib + ' GiB'
        : 'How much cache do the two histories use?',
    );
    return;
  }
  if (b === 1) {
    const gx = 57,
      gy = 161;
    for (let l = 0; l < mem.layers; l++) {
      for (let h = 0; h < mem.groupedHeads; h++) {
        const x = gx + h * 41,
          y = gy + l * 6.6;
        box(g, x, y, 15, 4.3, C.teal);
        box(g, x + 16, y, 15, 4.3, C.blue);
      }
    }
    label(g, '8 KV HEADS  ×  32 LAYERS', 57, 395);
    serif(g, 'One head in one layer', 455, 189, 30);
    mark(g, 462, 234, 'Key · 128 values', C.teal);
    mark(g, 462, 272, 'Value · 128 values', C.blue);
    tx(g, 'Each value uses 2 bytes.', 455, 319, 21);
    const result = cue(k, 1, 'one token costs');
    opacity(g, result, () =>
      tx(g, fmt(mem.perTokenGqa) + ' bytes / token', 455, 372, 26, C.teal, 'Mono', 600),
    );
    foot(
      g,
      'INDEPENDENT, FULL ATTENTION HISTORIES',
      'Total KV bytes = bytes per token × sum of retained lengths',
    );
    return;
  }
  // The die remains in place when the comparison changes checkpoint.
  box(g, 79, 178, 162, 160, '#bac6ac', C.teal, 9);
  for (let i = 0; i < 16; i++) {
    box(g, 68, 184 + i * 9, 11, 4, C.teal);
    box(g, 241, 184 + i * 9, 11, 4, C.teal);
    box(g, 89 + i * 9, 168, 4, 11, C.teal);
    box(g, 89 + i * 9, 338, 4, 11, C.teal);
  }
  box(g, 98, 199, 125, 114, C.dark, null, 4);
  grid(g, 105, 207, 110, 98, 10, '#3d5851');
  tx(g, '8B', 160, 271, 42, C.white, 'Mono', 600, 'center');
  label(g, '2 B / PARAMETER', 84, 384);
  label(g, 'LOADED WEIGHTS   ·   ONE REPLICA', 310, 177);
  memoryBar(g, 310, 195, mem.weightsGb, C.blue);
  if (b >= 2) {
    const n = grouped ? mem.groupedHeads : mem.heads;
    label(g, 'KV CACHE   ·   ' + n + ' STORED HEADS', 310, 276);
    memoryBar(g, 310, 291, grouped ? mem.gqaGb : mem.mhaGb, C.teal);
    tx(g, '16 requests  ×  2,048 retained tokens', 310, 356, 20);
    if (grouped)
      tx(g, '32-head reference  ·  ' + mem.mhaGb.toFixed(1) + ' GB', 310, 389, 16, C.muted);
  } else tx(g, 'Shared across concurrent requests', 310, 302, 23, C.muted);
  foot(
    g,
    'PAYLOAD ESTIMATE   /   DECIMAL GB',
    b >= 2
      ? 'Full independent histories · equal weight payload · workspace extra'
      : '8 billion parameters  ×  2 bytes  =  16 billion bytes',
  );
}

export function placement(g, k) {
  if (cue(k, 1, 'Expert parallelism', 0)) {
    const route = cue(k, 1, 'Send the token', 1.6);
    frame(g, k, 'Replica placement', 'Which expert receives token T0?', true);
    scope(g, 44, 140, 872, 245);
    const left = [92, 616];
    const top = i => 247 + (i % 2) * 63;
    const dest = left[expertDevices[selectedExpert] === 'A' ? 0 : 1];
    const destY = top(selectedExpert) + 20;
    label(g, 'GPU / A', left[0], 178, C.mint);
    label(g, 'GPU / B', left[1], 178, C.mint);
    tx(g, 'Router · top 1', left[0], 219, 23, C.white);
    label(g, 'EXPERT   /   ROUTING SCORE', left[1], 216, C.mint);
    expertScores.forEach((score, i) => {
      const x = left[expertDevices[i] === 'A' ? 0 : 1], y = top(i);
      const chosen = route > 0 && i === selectedExpert;
      box(g, x, y, 229, 40, chosen ? '#554b30' : '#25474b', chosen ? C.gold : '#54777b', 4);
      tx(g, 'Expert ' + i, x + 61, y + 27, 18, C.white);
      tx(g, score.toFixed(2), x + 216, y + 27, 18, chosen ? C.gold : C.mint, 'Mono', 500, 'right');
    });
    const from = 300, to = dest + 28;
    if (route > 0) {
      line(g, from, 212, dest - 24, destY, C.gold, 2);
      arrow(g, dest - 24, destY, dest, C.gold);
    }
    const x = from + (to - from) * route;
    const y = 212 + (destY - 212) * Math.min(1, (x - from) / (dest - 24 - from));
    box(g, x - 23, y - 15, 46, 30, C.gold, null, 5);
    tx(g, 'T0', x, y + 6, 17, C.dark, 'Mono', 600, 'center');
    foot(g, 'EXPERT PARALLELISM   /   ONE ROUTED TOKEN',
      route === 1 ? 'T0 reaches expert ' + selectedExpert + ' on GPU ' + expertDevices[selectedExpert] + '.'
        : route ? 'T0 crosses the link to the selected expert.' : 'Read the four scores. Where will T0 go?',
      C.teal, true);
    return;
  }
  if (cue(k, 1, 'Pipeline parallelism', 0)) {
    const transfer = cue(k, 1, 'Send the activation across', 1.3);
    const status = stageStatus(transfer);
    frame(g, k, 'Replica placement', 'Which stage can run this microbatch?', true);
    scope(g, 44, 140, 872, 245);
    for (const [i, x] of [92, 616].entries()) {
      label(g, 'GPU / ' + 'AB'[i] + '     STAGE ' + (i + 1), x, 183, C.mint);
      const active = status[i] === 'Computing';
      for (let j = 0; j < 2; j++) {
        const layerX = x + j * 111;
        box(g, layerX, 213, 100, 78, active ? '#385e51' : '#28464b', active ? C.mint : '#608185', 4);
        tx(g, 'Layer ' + (2 * i + j + 1), layerX + 50, 260, 20, C.white, 'Sans', 500, 'center');
      }
      dot(g, x + 7, 336, 5, active ? C.mint : C.gold);
      tx(g, status[i], x + 23, 343, 19, active ? C.mint : C.gold);
    }
    arrow(g, 304, 279, 615, C.mint);
    tx(g, 'Activation', 461, 220, 19, C.white, 'Sans', 500, 'center');
    if (transfer > 0) {
      const x = 304 + 335 * transfer;
      box(g, x - 20, 265, 40, 28, C.gold, null, 4);
      tx(g, 'h₂', x, 286, 20, C.dark, 'Sans', 600, 'center');
    }
    foot(g, 'PIPELINE PARALLELISM   /   ONE MICROBATCH',
      transfer === 1 ? 'B runs layers 3 and 4. A has no next microbatch.'
        : transfer ? 'Layer 2 sends its output to layer 3.' : 'B waits for the output of layer 2.',
      C.teal, true);
    return;
  }
  const cross = cue(k, 1, 'A slow network crossing') > 0;
  frame(g, k, 'Replica placement', 'Where do the partial results meet?', true);
  scope(g, 44, 140, 872, 245);
  for (const [x, id, lo, hi] of [
    [107, 'GPU / A', 0, 4],
    [610, 'GPU / B', 4, 8],
  ]) {
    label(g, id, x, 186, C.mint);
    for (let i = 0; i < 8; i++) {
      box(
        g,
        x + (i % 4) * 54,
        206 + Math.floor(i / 4) * 56,
        45,
        44,
        i >= lo && i < hi ? C.mint : '#2f5257',
        null,
        3,
      );
    }
    tx(g, 'Layer shard ' + id.at(-1), x, 352, 18, C.white);
  }
  line(g, 329, 246, 581, 246, cross ? C.peach : C.mint, 3);
  line(g, 329, 263, 581, 263, cross ? C.peach : C.mint, 3);
  tx(
    g,
    cross ? 'Network crossing' : 'Combine partials',
    458,
    222,
    18,
    cross ? C.peach : C.mint,
    'Sans',
    600,
    'center',
  );
  const f = (k.elapsed % 2.5) / 2.5;
  dot(g, 329 + 252 * f, 246, 6, C.gold);
  dot(g, 581 - 252 * f, 263, 6, C.gold);
  foot(
    g,
    'TENSOR PARALLELISM   /   ONE LAYER',
    cross
      ? 'Measure the exchange on each decode step.'
      : 'Two devices store different parts of one layer.',
    C.teal,
    true,
  );
}

export function demand(g, k) {
  const normal = trafficBudget({ outputTokens: 450 });
  const longer = trafficBudget({ outputTokens: 900 });
  const b = k.beat.beatIndex;
  const complete = (beat, phrase, captionStart = phrase) => {
    if (b !== beat) return b > beat;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart }) === 1;
  };
  const ready = complete(0, 'one hundred ten thousand tokens a second', 'Together they need');
  const spare = complete(1, 'fifteen thousand tokens a second are spare');
  const predict = b === 1 && k.reveal('does the fleet still fit', 0, { captionStart: false });
  const changed = complete(2, 'nine hundred tokens', 'Double the answer length');
  const total = complete(2, 'one hundred forty thousand', 'Together they need');
  const deficit = complete(2, 'a deficit of fifteen thousand');
  const scale = b === 2 ? k.reveal('The output portion doubles', 0.9) : 0;
  const x = 65, y = 248, w = 820;
  const r = (tokens) => (w * tokens) / 150000;
  const input = (normal.requestsPerMinute * normal.inputTokens) / 60;
  const original = normal.tokensPerSecond;
  const peak = original + scale * (longer.tokensPerSecond - original);
  const lim = x + r(normal.assumedCapacity);
  const endpoint = x + r(original);
  const edge = x + r(peak);

  frame(g, k, 'Fleet sizing', 'How much of the fleet is spoken for?');
  tx(g, fmt(normal.requestsPerMinute) + ' requests / min', 65, 163, 25);
  tx(
    g,
    fmt(normal.inputTokens) + ' in  +  ' + (changed ? longer.outputTokens : normal.outputTokens) +
      ' out per request',
    590,
    163,
    18,
    C.muted,
  );
  grid(g, x, 191, w, 141, 26);
  if (cue(k, 0, 'twelve hundred input tokens')) {
    box(g, x, y, r(input), 46, C.blue);
    tx(g, 'Input  ' + fmt(input), x + 15, y + 30, 19, C.white, 'Sans', 600);
  }
  if (ready) {
    const baselineOutput = original - input;
    box(g, x + r(input), y, r(baselineOutput), 46, C.teal);
    if (scale > 0) box(g, endpoint, y, Math.min(edge, lim) - endpoint, 46, C.mint);
    if (edge > lim) box(g, lim, y, edge - lim, 46, C.rust);
    const output = longer.tokensPerSecond - input;
    tx(g, 'Output  ' + fmt(total ? output : baselineOutput), x + r(input) + 11, y + 30,
      17, C.white, 'Sans', 600);
  }
  if (scale > 0) {
    line(g, endpoint, y - 7, endpoint, y + 48, C.teal, 2, true);
    tx(g, fmt(original) + ' before', endpoint, y - 12, 14, C.teal, 'Sans', 600, 'right');
  }
  line(g, lim, 208, lim, 315, C.rust, 2, true);
  tx(g, fmt(normal.assumedCapacity) + ' capacity', lim, 203, 18, C.rust,
    'Sans', 600, 'center');
  line(g, x, 315, x + w, 315, C.muted);
  for (const n of [0, 50000, 100000, 150000])
    tx(g, fmt(n), x + r(n), 339, 15, C.muted, 'Mono', 400, 'center');

  if ((b === 1 && spare) || deficit) {
    const demandEdge = deficit ? x + r(longer.tokensPerSecond) : endpoint;
    const t = deficit ? C.rust : C.teal;
    const delta = deficit ? -longer.headroom : normal.headroom;
    line(g, demandEdge, 357, lim, 357, t, 2);
    for (const marker of [demandEdge, lim]) line(g, marker, 350, marker, 364, t, 2);
    tx(g, fmt(delta) + (deficit ? ' short' : ' spare'), (demandEdge + lim) / 2, 383,
      17, t, 'Sans', 600, 'center');
  }
  label(g, 'TOKENS / SECOND   ·   ILLUSTRATIVE CAPACITY', 65, 377);

  let summary = 'What rate does this mix require?';
  if (ready)
    summary = fmt(normal.tokensPerMinute) + ' tokens/min   →   ' + fmt(original) + ' tokens/s';
  if (spare)
    summary = fmt(normal.headroom) + ' tokens/s spare   ·   ' +
      Math.round(100 * normal.headroomFraction) + '% of assumed capacity';
  if (predict) summary = 'Would twice the output still fit?';
  if (changed) summary = 'Same arrivals and input. Only the output portion grows.';
  if (total) summary = fmt(longer.tokensPerSecond) + ' tokens/s needed';
  if (deficit) summary =
    fmt(longer.tokensPerSecond) + ' needed   ·   ' + fmt(-longer.headroom) + ' tokens/s short';
  line(g, 38, 408, 921, 408, C.rule);
  tx(g, summary, 38, 442, 24, C.ink, 'Sans', 600);
}
