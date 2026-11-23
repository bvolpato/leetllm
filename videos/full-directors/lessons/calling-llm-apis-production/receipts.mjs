import {
  amber,
  arrow,
  blue,
  box,
  brass,
  cream,
  dim,
  disk,
  faint,
  field,
  glow,
  green,
  heading,
  ink,
  label,
  line,
  mix,
  moving,
  night,
  pale,
  paper,
  path,
  red,
  t,
  tag,
  tickAxis,
  timing,
} from './ink.mjs';
import {
  accountB,
  accountBCandidate,
  batchRows,
  bufferThrough,
  costTrace,
  decodeReads,
  deltas,
  freshBudget,
  joinedBatch,
  paidLog,
  pendingLog,
  otherTenantLog,
  rates,
  reasoning,
  receiptForB,
  routeReceipt,
  routeTests,
  stream,
  totalInput,
  usageReceipt,
  wireReads,
} from './examples.mjs';
import { ageRule } from './boundary.mjs';
import { reservePicture } from './resilience.mjs';

const chunkTimes = [3, 3.55, 4.05, 4.6];

function streamTime(g, c) {
  const { q } = timing(c);
  heading(g, 'Client arrivals   /   one text item', 'When can the user start reading?', true);
  const first = chunkTimes[0];
  const last = chunkTimes.at(-1);
  const elapsed = mix(first, last, q(1, 'arrives in several deltas', last - first));
  const n = q(1, 'three seconds', 0) ? chunkTimes.filter((time) => time <= elapsed).length : 0;
  const terminal = q(2, 'terminal event', 0.8) === 1,
    left = 80,
    right = 879,
    x = (n) => mix(left, right, n / 5);
  tickAxis(g, left, right, 265, 5, 1, pale);
  function mark(time, name, color, y, size) {
    line(g, x(time), y, x(time), 264, color, 2);
    disk(g, x(time), y, 7, color);
    t(g, name, x(time), y - 18, size, color, 'mono', 'center');
  }
  mark(0.2, 'meta', pale, 213, 19);
  chunkTimes.slice(0, n).forEach((time, i) => {
    const active = i === n - 1 && !terminal;
    mark(time, time.toFixed(2) + ' s', active ? glow : pale, i % 2 ? 175 : 222, 24);
  });
  if (terminal) mark(5, 'end', amber, 222, 19);
  const bufferLabel = terminal ? 'Completed draft' : 'Client buffer   /   provisional text';
  t(g, bufferLabel, left, 354, 19, pale, 'mono');
  if (n && !terminal) {
    const previous = bufferThrough(n - 1);
    t(g, previous, left, 411, 31, cream, 'serif');
    t(g, deltas[n - 1], left + g.measureText(previous).width, 411, 31, glow, 'serif');
  } else {
    t(g, bufferThrough(n) || 'Waiting for text…', left, 411, 31, n ? cream : pale, 'serif');
  }
  if (terminal) t(g, 'Now inspect the response and validate the object.', left, 469, 20, glow);
}
function bytes(g, c) {
  const { b, q } = timing(c);
  if (b < 2) {
    heading(g, 'SSE parser   /   UTF-8', 'Where does the network cut the word?');
    const received = q(0, 'other byte', 0.7) === 1 ? 2 : 1;
    const decoded = decodeReads(received);
    const first = Array.from(wireReads[0]),
      second = Array.from(wireReads[1]);
    const parts = [
      'data:',
      'caf',
      first.at(-1).toString(16).toUpperCase(),
      ...second.map((v) => v.toString(16).padStart(2, '0').toUpperCase()),
    ];
    const xx = [63, 225, 383, 537, 668, 790],
      ww = [145, 140, 107, 106, 102, 102];
    parts.forEach((s, i) => {
      if (i > 2 && received === 1) return;
      box(g, xx[i], 226, ww[i], 71, i === 2 || i === 3 ? '#dfbd7c' : '#cddbd2', dim);
      t(g, s, xx[i] + ww[i] / 2, 271, 27, ink, 'mono', 'center');
    });
    line(g, 510, 181, 510, 322, red, 2);
    t(g, 'read 1', 481, 180, 17, dim, 'mono', 'right');
    t(g, 'read 2', 541, 180, 17, dim, 'mono');
    label(
      g,
      b === 1 && decoded.event
        ? 'Dispatch event    /    data = ' + decoded.event
        : received === 2
          ? 'Blank line received'
          : 'Hold C3 until its continuation arrives.',
      62,
      412,
      b === 1 ? green : ink,
    );
  } else if (b === 2) {
    heading(g, 'Wire protocol   /   transport and framing', 'How is the event stream opened?');
    [
      ['Browser EventSource', 'GET · reconnect'],
      ['SDK Responses stream', 'POST · typed events'],
      ['Chat Completions', '[DONE] · inspect finish reason'],
    ].forEach(([s, v], i) => {
      const y = 201 + i * 82;
      t(g, s, 59, y, 23, ink, 'serif');
      t(g, v, 475, y, 21, blue, 'mono', 'left', 415);
      line(g, 59, y + 17, 893, y + 17, faint, 1);
    });
  } else {
    heading(g, 'Output item A   /   bounded buffer', 'Which events add text to A?');
    const events = ['metadata', 'A · text', 'tool args', 'B · text', 'terminal'];
    events.forEach((s, i) => tag(g, s, 50 + i * 176, 195, 149, 52, i === 1 ? green : dim));
    const selected = q(3, "only item A's text", 1);
    arrow(g, 298, 258, 298, 334, selected ? green : faint);
    paper(g, 219, 343, 519, 91);
    t(g, selected ? 'Item A    Account …' : 'Item A    waiting', 244, 400, 25, green, 'mono');
  }
}
function filmstrip(g, y, count, terminal, name, ask = false) {
  const x = 61,
    cell = 139,
    h = 64,
    tail = 245,
    state = stream(count, terminal);
  t(g, name, x, y - 14, 17, pale, 'mono');
  const len = cell * count + (terminal === 'end' ? tail : 0);
  if (len) {
    box(g, x, y, len, h, '#a16640');
    for (let j = 6; j < len - 4; j += 20) {
      box(g, x + j, y + 4, 8, 4, cream);
      box(g, x + j, y + h - 8, 8, 4, cream);
    }
    for (let j = 0; j < count; j++) {
      box(g, x + cell * j + 2, y + 12, cell - 4, h - 24, '#513c30');
      t(
        g,
        deltas[j].replace(/ $/, '·'),
        x + cell * (j + 0.5),
        y + 39,
        17,
        cream,
        'mono',
        'center',
        cell - 13,
      );
    }
    if (terminal === 'end') {
      box(g, x + cell * count + 2, y + 12, tail - 4, h - 24, green);
      t(g, 'response.completed', x + cell * count + tail / 2, y + 39, 18, cream, 'mono', 'center');
    }
  }
  if (terminal === 'eof') {
    path(
      g,
      Array.from({ length: 9 }, (_, i) => [x + len + (i % 2) * 6, y + i * 8]),
      amber,
      3,
    );
    t(g, 'EOF', x + len + 19, y + 39, 22, amber, 'mono');
  }
  t(
    g,
    state.text.length + ' characters   /   ' + (ask ? 'Classify the ending' : state.state),
    x,
    y + h + 30,
    19,
    terminal === 'end' ? glow : terminal === 'eof' ? amber : pale,
    'mono',
  );
}
function endings(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Normalized events   /   one text item',
    b <= 1
      ? 'What does the completion event add?'
      : b === 2
        ? 'How does this replay end?'
        : 'Which draft can go to validation?',
    true,
  );
  const counts = ['to eight', 'nineteen', 'thirty-one', 'forty-one'];
  const n = b === 0 ? counts.filter((s) => q(0, s, 0.5) === 1).length : 4;
  const success = b > 0 || q(0, 'completion event', 0.75) === 1;
  filmstrip(g, 185, n, success ? 'end' : null, 'First delivery');
  if (b >= 2) {
    const drop = q(3, 'after just two pieces', 0.65) === 1;
    const n2 =
      b === 2 ? Math.min(4, Math.floor(q(2, 'same four pieces', 2.1) * 4.99)) : drop ? 2 : 4;
    const eof = q(2, 'connection ends right there', 0.65) === 1;
    // At the question, reveal the cut edge. Save the classification for the answer beat.
    filmstrip(
      g,
      354,
      n2,
      eof ? 'eof' : null,
      drop ? 'Drop after delta 2' : 'Replay',
      b === 2 && eof,
    );
  } else if (b === 1)
    t(g, 'Schema + policy checks next. A write needs authorization.', 62, 414, 23, cream, 'serif');
  else {
    t(
      g,
      n ? '·   trailing space' : 'Metadata event   /   empty text buffer',
      61,
      345,
      19,
      pale,
      'mono',
    );
    if (n) t(g, bufferThrough(n), 61, 410, 28, cream, 'serif');
  }
}
function costs(g, c) {
  const { b, q } = timing(c),
    m = costTrace();
  heading(
    g,
    'Usage meter   /   fictional USD rates',
    b === 0
      ? 'What did this request cost?'
      : b === 1
        ? 'How does that scale over a month?'
        : 'What belongs on the attempt receipt?',
  );
  if (b === 0) {
    [
      ['Input', m.inputTokens, m.inputRate, m.inputCost],
      ['Output', m.outputTokens, m.outputRate, m.outputCost],
    ].forEach(([s, n, r, d], i) => {
      const y = 188 + i * 93;
      t(g, s, 67, y, 21, ink, 'bold');
      t(g, n + ' × $' + r + ' / 1M', 240, y, 22, ink, 'mono');
      if (q(0, i === 0 ? 'input tokens' : 'output tokens', 0.5) > 0) {
        box(g, 521, y - 20, (210 * d) / m.inputCost, 23, i === 0 ? blue : brass);
        t(g, '$' + d.toFixed(5), 755, y, 22, ink, 'mono');
      }
    });
    line(g, 67, 330, 890, 330, dim);
    if (q(0, 'Together they come', 0))
      label(g, 'Per request     $' + m.totalCost.toFixed(5), 72, 413, green);
  } else if (b === 1) {
    const daily = m.dailyCalls * m.totalCost;
    t(g, '200,000 calls per day', 69, 192, 28, ink, 'serif');
    t(g, '$' + daily.toFixed(0) + ' / day', 69, 259, 36, blue, 'bold');
    const show = q(1, 'thirty days', 1.3);
    for (let i = 0; i < 30; i++)
      box(
        g,
        486 + (i % 6) * 65,
        165 + Math.floor(i / 6) * 35,
        56,
        25,
        i < Math.round(show * 30) ? green : faint,
      );
    if (q(1, 'five thousand eight hundred eighty dollars', 1.2) === 1)
      t(
        g,
        '$' + Math.round(m.monthlyCost).toLocaleString('en-US') + ' base estimate',
        69,
        421,
        38,
        green,
        'serif',
      );
  } else {
    paper(g, 76, 148, 796, 276);
    for (const [i, [s, v]] of [
      ['Prompt version', paidLog.promptVersion],
      ['Completed usage', '250 in    80 out'],
      ['Timed-out attempt', 'Usage unknown'],
      ['Correlation', 'Scoped fingerprint'],
    ].entries()) {
      const y = 204 + i * 59;
      t(g, s, 102, y, 21, dim);
      t(g, v, 482, y, 21, i === 2 ? brass : ink, 'mono', 'left', 365);
    }
  }
}
function cache(g, c) {
  const { b, q } = timing(c),
    shift = Math.round(400 * q(4, 'came out of the ordinary group', 1.7));
  if (b === 6 && q(6, 'timed-out attempt', 0.65) === 1) {
    heading(
      g,
      'Separate attempt   /   caller timed out',
      'What can you charge without a usage record?',
    );
    paper(g, 78, 148, 798, 267);
    t(g, 'Provider usage', 104, 209, 22, dim, 'mono');
    t(g, 'Input     ?', 104, 265, 27, ink, 'mono');
    t(g, 'Output    ?', 104, 325, 27, ink, 'mono');
    line(g, 471, 190, 471, 364, faint);
    field(g, 'Estimated cost', pendingLog.estimatedCost ?? 'Unknown', 522, 227, 308, brass, 42);
    t(g, 'Reconcile with the provider.', 522, 343, 18, dim);
    return;
  }
  const r = usageReceipt(1200 + shift),
    output = r.output;
  heading(
    g,
    'Text-only receipt   /   fictional rates per million',
    b >= 4 ? 'What does a larger cache hit change?' : 'Which counts are already in the totals?',
  );
  const lx = 66,
    w = 817,
    y = 190;
  t(g, totalInput.toLocaleString('en-US') + ' input tokens', lx, 163, 25, ink, 'serif');
  const cacheCount = Math.round(r.cached * q(0, 'came from the cache', 1.25));
  const writeCount = Math.round(r.writes * q(0, 'cache writes', 0.85));
  const split = q(0, 'seven hundred ordinary', 0.85) === 1;
  const entries = [
    [
      split ? 'Ordinary' : 'Unsorted',
      totalInput - cacheCount - writeCount,
      rates.ordinary,
      split ? blue : dim,
    ],
    ['Cache read', cacheCount, rates.cached, green],
    ['Cache write', writeCount, rates.writes, brass],
  ];
  let start = 0;
  for (const [, count, , color] of entries) {
    box(g, lx + (w * start) / totalInput, y, (w * count) / totalInput, 41, color);
    start += count;
  }
  entries.forEach(([s, n, rate, color], i) => {
    const x = lx + [0, 283, 576][i];
    t(g, s, x, 261, 18, color, 'bold');
    t(g, n + (b >= 2 ? ' × $' + rate.toFixed(2) : ''), x, 291, 20, ink, 'mono');
  });
  const y2 = 312;
  line(g, lx, y2, lx + w, y2, faint, 1);
  const visible =
    b >= 1
      ? r.visible + ' visible  +  ' + reasoning + ' reasoning'
      : reasoning + ' reasoning included';
  if (q(0, 'two hundred output tokens', 0.6) > 0) {
    t(g, output + ' output', lx, y2 + 44, 24, ink, 'serif');
    t(g, visible, 268, y2 + 42, 20, dim, 'mono');
  }
  if (b >= 2) t(g, '× $6.00 once', lx + w, y2 + 42, 19, green, 'mono', 'right');
  if ((b === 3 && q(3, 'five dollars', 0.75) === 1) || b >= 4) {
    const replay = b === 4 || (b === 5 && q(5, 'five dollars', 0.65) < 1);
    const first = '$' + usageReceipt(1200).cost.toFixed(5);
    const amount =
      b >= 4
        ? 'First   ' + first + '     Replay   ' + (replay ? '?' : '$' + r.cost.toFixed(5))
        : 'Estimate   ' + first;
    t(g, amount, lx, 410, 28, green, 'bold');
  }
}
function telemetry(g, c) {
  const { b, q } = timing(c);
  heading(
    g,
    'Operational trace   /   rotation_decision@2',
    b < 2 ? 'Which result belongs to the task?' : 'What can two fingerprints tell you?',
  );
  if (b < 2) {
    t(g, 'Application request', 63, 174, 27, ink, 'serif');
    const spans = [
      ['Lookup', 0.06, 0.24, blue],
      ['Attempt A · timeout', 0.26, 0.46, brass],
      ['Attempt B · HTTP 200', 0.48, 0.72, blue],
      ['Validate', 0.75, 0.94, red],
    ];
    line(g, 65, 200, 889, 200, ink, 3);
    spans.forEach(([s, a, z, color], i) => {
      const x = 65 + 824 * a,
        end = 65 + 824 * z;
      const y = 237 + (i % 2) * 82;
      line(g, x, y, end, y, color, 9);
      t(g, s, x, y + 30, 17, color, 'bold', 'left', i === 3 ? 147 : 222);
    });
    if (b === 0)
      t(g, 'Record requested and reported model, finish reason and usage.', 65, 432, 20, dim);
    if (b === 1 && q(1, 'Failed validation', 0.65) === 1)
      t(g, 'Task outcome    validation failed', 65, 442, 29, red, 'bold');
  } else {
    const alternate = b === 3 && q(3, 'second tenant', 0.75) === 1;
    const fp = (alternate ? otherTenantLog : paidLog).questionFingerprint;
    t(g, 'Question input', 63, 175, 26, ink, 'serif');
    tag(g, 'same text', 62, 220, 196, 54, blue);
    arrow(g, 268, 247, 361, 247, dim);
    disk(g, 431, 247, 60, night);
    t(g, 'HMAC', 431, 254, 22, cream, 'mono', 'center');
    arrow(g, 506, 247, 591, 247, dim);
    paper(g, 610, 193, 278, 129);
    t(g, fp.slice(0, 16), 627, 248, 19, green, 'mono');
    t(g, fp.slice(16), 627, 279, 19, green, 'mono');
    t(
      g,
      b === 3
        ? alternate
          ? 'Same question   /   different tenant key'
          : 'Same question   /   same tenant key'
        : '32 hex digits   /   128 bits',
      62,
      368,
      24,
      ink,
      'bold',
    );
    t(
      g,
      b === 3
        ? 'Expire records under the retention policy.'
        : 'A matching fingerprint links records. Collisions remain possible.',
      62,
      413,
      19,
      dim,
    );
  }
}
function batch(g, c) {
  const { b, q } = timing(c);
  const testing = b === 3 && q(3, 'Before opening the live route', 0.6) === 1;
  if (testing)
    heading(g, 'Deployed route   /   admission tests', 'Can these requests reach a provider?');
  else
    heading(
      g,
      'Result delivery   /   identity before order',
      b === 0
        ? 'When does the caller need the answer?'
        : b === 3
          ? 'Where can a prompt share work?'
          : 'Which submitted request expired?',
    );
  if (b === 0) {
    const rows = [
      ['Immediate decision', 'Buffer one object'],
      ['Readable draft', 'Stream draft pieces'],
      ['Long-running task', 'Queue + durable status'],
    ];
    rows.forEach(([a, z], i) => {
      const y = 192 + i * 87;
      t(g, a, 57, y, 24, ink, 'serif');
      const u = q(0, ['Buffer one structured', 'Stream a long', 'For work exceeding'][i], 1.4);
      if (i === 0) {
        box(g, 368, y - 26, 87, 37, null, blue, 2);
        if (u > 0) t(g, '{…}', 410, y, 23, blue, 'mono', 'center');
      }
      if (i === 1) {
        for (let j = 0; j < Math.round(4 * u); j++) box(g, 336 + j * 30, y - 18, 23, 16, green);
      }
      if (i === 2) {
        for (let j = 0; j < 3; j++) box(g, 345 + 8 * j, y - 31 + 6 * j, 64, 34, cream, brass);
        if (u > 0) t(g, 'job', 392, y, 16, brass, 'mono', 'center');
      }
      if (u > 0) t(g, z, 494, y, 24, blue, 'bold');
    });
  } else if (b <= 2) {
    const ids = ['A', 'B', 'C'],
      ys = [211, 298, 385];
    t(g, 'Submitted', 70, 159, 19, dim, 'mono');
    t(g, 'Returned by custom_id', 586, 159, 19, dim, 'mono');
    const u = q(1, 'Follow the custom IDs', 1.5);
    for (const [i, id] of ids.entries()) {
      tag(g, id, 71, ys[i] - 24, 109, 48, blue);
      const j = batchRows.findIndex((row) => row.id === id),
        color = joinedBatch.get(id) === 'expired' ? red : green;
      const pts = [
        [180, ys[i]],
        [278, ys[i]],
        [504, ys[j]],
        [585, ys[j]],
      ];
      if (u > 0) {
        path(g, pts, color, 2);
        moving(g, pts, u, color, '', 6);
      }
    }
    batchRows.forEach(({ id, value }, j) =>
      t(g, id + '   ' + value, 595, ys[j] + 6, 23, value === 'expired' ? red : green, 'mono'),
    );
    t(
      g,
      b === 1
        ? 'Read the output file and the error file.'
        : 'Supported batch example   /   24 h window   /   50% discount',
      72,
      462,
      19,
      dim,
      'mono',
      'left',
      830,
    );
  } else if (testing) {
    const cues = ['signed-out caller', 'wrong tenant', 'caller over quota'];
    routeTests.forEach((caller, i) => {
      const { stop } = routeReceipt(caller, true);
      const y = 195 + i * 84;
      tag(g, caller.caller, 65, y - 21, 204, 43, blue);
      line(g, 277, y, 865, y, faint, 2);
      const x = 437 + i * 135;
      if (q(3, cues[i], 0.65) > 0) {
        line(g, x, y - 18, x, y + 18, red, 5);
        disk(g, x - 11, y, 6, red);
        t(g, stop, x, y - 29, 17, red, 'mono', 'center');
      }
    });
    t(g, 'Exercise slow connections, cancellation and concurrent calls.', 67, 447, 21, ink);
  } else {
    for (let i = 0; i < 2; i++) {
      const y = 196 + i * 99;
      t(g, i === 0 ? 'A' : 'B', 68, y + 33, 23, ink, 'bold');
      box(g, 121, y, 494, 54, green);
      t(g, 'Shared policy prefix', 144, y + 35, 21, cream, 'mono');
      box(g, 615, y, 232, 54, i === 0 ? blue : brass);
      t(g, 'Account ' + (i === 0 ? 'A' : 'B'), 642, y + 35, 21, cream, 'mono');
    }
    label(g, 'Check the usage record for a cache hit.', 70, 433);
  }
}
function jobLookup(g, c) {
  const { b, q } = timing(c),
    write = q(6, 'Follow the write', 1.3),
    lost = q(6, 'confirmation disappears', 1.15);
  const read = q(7, 'Look up the original action key', 1.5);
  const back = 0.68 * q(7, 'Follow the reply back', 1.15) + 0.32 * q(7, 'job forty-two', 0.8);
  const known = back === 1;
  const receipt = receiptForB(known ? 2 : write > 0 ? 1 : 0);
  heading(
    g,
    'Job service   /   authorized rotation   /   R-B',
    known ? 'The caller can report the job' : 'What can the caller report?',
    true,
  );
  const X = 125,
    Y = 210,
    R = 833;
  t(g, 'Caller', X, 160, 24, cream, 'serif', 'center');
  t(g, 'Job service', R, 160, 24, cream, 'serif', 'center');
  for (const x of [X, R]) {
    line(g, x, 177, x, 405, '#67888b', 1);
    disk(g, x, Y, 6, pale);
  }
  if (write > 0) {
    arrow(g, X, Y, mix(X, R, write), Y, glow, 3);
    t(g, 'CREATE   /   R-B', 480, Y - 13, 18, glow, 'mono', 'center');
    if (write < 1)
      moving(
        g,
        [
          [X, Y],
          [R, Y],
        ],
        write,
        green,
        '',
        9,
      );
  }
  if (lost > 0) {
    const stop = 510;
    line(g, R, 257, mix(R, stop, lost), 257, amber, 3);
    if (lost === 1) {
      t(g, '×', stop - 4, 265, 30, amber, 'bold', 'center');
      t(g, 'confirmation lost', stop - 24, 264, 17, amber, 'mono', 'right');
    }
  }
  if (read > 0) {
    arrow(g, X, 322, mix(X, R, read), 322, pale, 2);
    t(g, 'STATUS   /   R-B', 477, 309, 18, pale, 'mono', 'center');
  }
  if (back > 0) {
    const px = mix(R, X, back);
    arrow(g, R, 377, px, 377, glow, 3);
    box(g, px - 20, 364, 40, 26, cream, green, 1.5);
    path(
      g,
      [
        [px - 19, 365],
        [px, 379],
        [px + 19, 365],
      ],
      green,
      1.7,
    );
    if (known) t(g, 'Status reply', 477, 368, 18, glow, 'mono', 'center');
  }
  t(g, 'Writes  ' + receipt.writes, 60, 466, 23, cream, 'mono');
  t(g, b === 7 && read === 1 ? 'Status reads  1' : 'Status reads  0', 318, 466, 21, pale, 'mono');
  if (known) {
    box(g, 651, 421, 253, 64, glow);
    for (const x of [651, 904]) disk(g, x, 453, 8, night);
    t(g, receipt.jobId, 778, 464, 31, night, 'bold', 'center');
  } else t(g, 'Job number unknown', 896, 466, 22, amber, 'mono', 'right');
}
function finalCase(g, c) {
  const { b, q } = timing(c);
  if (b >= 6) {
    jobLookup(g, c);
    return;
  }
  if (b < 2) {
    heading(g, 'Account B   /   fresh fixture', 'Can B use this eligibility result?');
    const shown = q(0, 'Thirty days', 0.6) === 1;
    tag(g, 'eligible', 62, 152, 163, 49, blue);
    t(
      g,
      'Candidate minimum   ' + (shown ? accountBCandidate.minimum_key_age_days + ' days' : '?'),
      251,
      184,
      22,
      ink,
      'mono',
    );
    ageRule(g, accountB.ageDays, accountB.thresholdDays, true, { x: 103, y: 276, w: 731, max: 40 });
    if (b === 1 && q(1, 'Reject the candidate', 0.6) === 1)
      label(g, 'Validation failed   /   P-7 says 21 days. The reply says 30.', 62, 449, red);
  } else {
    heading(
      g,
      'Account B   /   independent safe read',
      b < 4 ? 'Can you fit one more attempt?' : 'Where does the reservation end?',
    );
    if (b <= 3) {
      const r = freshBudget;
      t(g, 'Task budget', 62, 197, 23, dim, 'mono');
      t(g, '10 s − 6 s spent = 4 s left', 62, 251, 36, ink, 'serif');
      field(g, 'Retry-After', r.floor + ' s', 62, 333, 210, brass);
      field(g, 'Jitter draw', '¼ of 2 s', 276, 333, 207, brass);
      if (b === 3) {
        field(g, 'Call', r.call + ' s', 536, 333, 142, blue);
        field(g, 'Validation', r.check + ' s', 711, 333, 174, green);
      }
    } else {
      reservePicture(
        g,
        freshBudget,
        [1, q(4, 'half a second', 0.75), q(4, 'Place the call', 0.9), q(4, 'add validation', 0.75)],
        q(4, 'Stop before dispatch', 0.6) === 1,
        { left: 78, scale: 157 },
      );
      if (b === 5) t(g, 'Additional calls   0', 78, 484, 19, red, 'mono');
    }
  }
}
export const receiptScenes = [
  streamTime,
  bytes,
  endings,
  costs,
  cache,
  telemetry,
  batch,
  finalCase,
];
