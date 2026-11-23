import {
  C,
  at,
  base,
  box,
  line,
  dot,
  txt,
  mono,
  serif,
  screw,
  form,
  shell,
  pill,
  note,
} from './bench.mjs';
import { manuals, answer } from './examples.mjs';

function probe(ctx, slide) {
  const x = -28 + 28 * slide;
  line(
    ctx,
    [
      [0, 209],
      [20 + x, 209],
      [37 + x, 198],
      [51 + x, 198],
    ],
    C.dark,
    10,
  );
  box(ctx, 45 + x, 167, 98, 64, '#526a65', 13);
  box(ctx, 54 + x, 174, 70, 50, '#778d80', 8);
  for (let i = 0; i < 4; i++)
    line(
      ctx,
      [
        [52 + x + i * 5, 177],
        [52 + x + i * 5, 219],
      ],
      C.dark,
      2,
    );
  dot(ctx, 101 + x, 198, 18, C.paper);
  mono(ctx, 'A', 101 + x, 198, 23, C.dark, 'center');
  box(ctx, 135 + x, 178, 40, 40, '#b38c5c', 5);
  for (let i = 0; i < 5; i++) box(ctx, 137 + x + i * 6, 181, 3, 34, '#e4c894', 1);
  box(ctx, 170 + x, 186, 22, 24, C.metal, 2);
}
function manualPage(ctx, x, y, id, chosen, open) {
  const r = manuals[id];
  ctx.save();
  ctx.translate(x, y + 100);
  ctx.scale(1, 0.8 + 0.2 * open);
  ctx.translate(0, -100);
  box(ctx, -4, 7, 306, 140, '#52635e', 5);
  for (let k = 3; k > 0; k--) box(ctx, k, 2 * k, 298, 138, '#e9e2cd', 2, '#c6c5b5', 0.7);
  box(ctx, 0, 4, 298, 137, '#c8c5b4', 3);
  box(ctx, 0, 1, 298, 137, C.paper, 3, C.grid);
  box(ctx, 0, 1, 9, 137, chosen ? C.green : '#a8aa9b', 2);
  for (let i = 0; i < 3; i++) {
    dot(ctx, 19, 25 + 44 * i, 3, C.grid);
  }
  mono(ctx, id, 37, 29, 19);
  txt(ctx, 'Sensor ' + r.sensor, 269, 29, 22, C.ink, { align: 'right', weight: 600 });
  line(
    ctx,
    [
      [36, 51],
      [272, 51],
    ],
    C.grid,
    1,
  );
  if (chosen) box(ctx, 32, 63, 243, 54, '#dceacf', 3);
  mono(ctx, r.code, 40, 89, 30, chosen ? C.green : C.ink);
  serif(ctx, r.meaning, 100, 89, 23);
  ctx.restore();
}
export function manual(ctx, c) {
  const i = c.beat.id,
    ground = c.beat.chapterId === 'c02';
  const after = (n) => i === n;
  const wrong = after('wrong') || (after('repair') && !at(c, 'Switch the source'));
  const corrected = after('repair') && !wrong;
  const miss = after('missing') || after('abstain');
  const code = miss ? 'E9' : 'E2';
  const selected = ground
    ? wrong
      ? 'M8'
      : corrected
        ? 'M7'
        : null
    : after('sentence') || (after('page') && at(c, 'Page M seven'))
      ? 'M7'
      : null;
  const source = answer(code, selected);
  const chosen = after('sentence') || (after('page') && at(c, 'Copy the entry'));
  const resolved = after('abstain') && at(c, 'Leave the meaning');
  base(
    ctx,
    ground ? 'Would you sign this field log?' : 'Which E2 entry belongs to this probe?',
    'OFFLINE INSPECTION',
  );
  probe(ctx, 1);
  if (after('probe') && c.elapsed < 1) dot(ctx, 142 + 42 * c.elapsed, 198, 4, C.paper);
  shell(ctx, 186, 119, 373, 313);
  box(ctx, 204, 139, 337, 254, C.screen, 8);
  mono(ctx, 'FIELD READER', 223, 159, 15, C.muted);
  txt(ctx, 'OFFLINE', 520, 159, 14, C.green, { align: 'right', weight: 700 });
  line(
    ctx,
    [
      [223, 176],
      [521, 176],
    ],
    '#96ab94',
    1,
  );
  txt(ctx, 'Probe identity', 223, 201, 17, C.muted);
  txt(ctx, 'Sensor A', 223, 242, 31, C.ink, { weight: 700 });
  txt(ctx, 'Code', 442, 201, 17, C.muted);
  mono(ctx, code, 444, 242, 38);
  line(
    ctx,
    [
      [223, 275],
      [521, 275],
    ],
    '#96ab94',
    1,
  );
  const sentence = after('sentence') && at(c, 'Sensor A reports');
  const written = sentence ? c.reveal('Sensor A reports', 1.15) : 1;
  const label = wrong
    ? 'Proposed log · M8'
    : corrected
      ? 'Revised log · M7'
      : chosen
        ? 'Source · M7'
        : resolved
          ? 'Local review'
          : 'Field log';
  txt(ctx, label, 223, 302, 17, C.muted);
  if (wrong) serif(ctx, 'The lens is covered.', 223, 348, 24);
  else if (corrected || sentence) {
    const chars = Math.round(written * 30);
    serif(ctx, 'Sensor A reports'.slice(0, chars), 223, 337, 24);
    serif(ctx, 'a low battery.'.slice(0, Math.max(0, chars - 16)), 223, 366, 24);
  } else if (chosen) serif(ctx, source.record.meaning, 223, 348, 25, C.green);
  else if (resolved) serif(ctx, 'No matching record', 223, 348, 25, C.orange);
  else
    line(
      ctx,
      [
        [224, 360],
        [443, 360],
      ],
      '#91a88d',
      1,
    );
  box(ctx, 311, 405, 112, 9, '#526c66', 4);
  const open = after('probe') ? Math.min(1, c.elapsed / 1.7) : 1;
  manualPage(ctx, 611, 116, 'M7', selected === 'M7', open);
  manualPage(ctx, 611, 273, 'M8', selected === 'M8', open);
  let summary = 'Match the equipment and code on the same page.';
  if (!ground && chosen)
    summary = sentence
      ? 'The cited explanation keeps the source beside the claim.'
      : 'Sensor A  /  E2     →     M7  /  battery low';
  if (wrong)
    summary =
      after('repair') && at(c, 'Compare the equipment')
        ? 'Quotation matches M8. The probe and M8 identify different sensors.'
        : 'A real quotation from M8. Does it apply to sensor A?';
  if (corrected) summary = 'Probe A  /  E2     =     M7  /  A  /  E2';
  if (miss)
    summary = resolved
      ? 'A / E9 has no local definition. Keep the log unfilled.'
      : 'Both pages are open. Where is A / E9?';
  if (after('sentence') && at(c, 'The target is'))
    summary = 'p95 time to first visible token < 250 ms, including retrieval and prefill';
  note(ctx, summary, resolved ? C.orange : C.ink);
}

export function fit(ctx, c) {
  const i = c.beat.id;
  if (i === 'stream' || i === 'pack') return bus(ctx, c);
  return kv(ctx, c);
}
import { articleBus, stream, cacheMiB, cache } from './examples.mjs';
function bus(ctx, c) {
  const pack = c.beat.id === 'pack';
  const first = pack && at(c, 'sixty-eight point four');
  const second = pack && at(c, 'thirty-four point two');
  const phrases = ['They need sixty-eight point four gigabytes', 'Eighteen reads need thirty-four point two'];
  const reads = phrases.map((phrase) => {
    if (!pack) return 1;
    const { start, end } = c.wordCue(phrase);
    const progress = c.reveal(phrase, end - start, { captionStart: false });
    return 1 + Math.floor((articleBus.rate - 1) * progress);
  });
  base(ctx, 'Can eighteen weight reads fit in one second?', 'BANDWIDTH WORKSHEET');
  txt(
    ctx,
    'One read per step   ·   3.8 billion active weights   ·   18 steps per second',
    46,
    119,
    21,
  );
  const start = 192,
    w = 655,
    max = 72;
  const pos = (v) => start + (w * v) / max;
  txt(ctx, 'One second of bus traffic', start, 176, 18, C.muted);
  line(
    ctx,
    [
      [pos(articleBus.gbps), 195],
      [pos(articleBus.gbps), 389],
    ],
    C.orange,
    2.5,
  );
  mono(ctx, '50 GB', pos(50), 170, 21, C.orange, 'center');
  [8, 4].forEach((bits, j) => {
    if (j && (!pack || !at(c, 'A read now'))) return;
    const v = stream(bits),
      y = 232 + 105 * j;
    mono(ctx, bits + ' bit', 42, y + 16, 23);
    const shown = j ? second : first;
    const count = reads[j];
    for (let k = 0; k < count; k++) {
      const left = pos(k * v.size);
      const right = pos((k + 1) * v.size) - 1;
      box(ctx, left, y, right - left, 35, j ? C.green : C.plum, 2);
      const overflow = Math.max(left, pos(articleBus.gbps));
      if (right > overflow) box(ctx, overflow, y, right - overflow, 35, C.orange, 2);
    }
    if (shown && count === articleBus.rate)
      txt(
        ctx,
        v.traffic.toFixed(1) + ' GB  ·  ' + v.ceiling.toFixed(1) + ' steps/s at most',
        start,
        y + 59,
        20,
        j ? C.green : C.plum,
      );
    else txt(
      ctx,
      count > 1 ? count + ' of ' + articleBus.rate + ' reads' : v.size.toFixed(1) + ' GB per read',
      start,
      y + 59,
      20,
    );
  });
  serif(
    ctx,
    second && reads[1] === articleBus.rate
      ? 'Only the four-bit reads fit the assumed bus budget.'
      : 'Bytes per read = active weight count × bits per weight ÷ 8',
    480,
    426,
    22,
    C.ink,
    'center',
  );
}
function kv(ctx, c) {
  const first = c.beat.id === 'half' && at(c, 'twenty-four mebibytes');
  const second = c.beat.id === 'half' && at(c, 'need six');
  base(ctx, 'What does grouping the heads save?', 'KEY AND VALUE CACHE');
  txt(
    ctx,
    'One sequence  ·  ' +
      cache.layers +
      ' layers  ·  ' +
      cache.positions +
      ' positions  ·  width ' +
      cache.width +
      '  ·  2 bytes per value',
    44,
    120,
    20,
  );
  [cache.queryHeads, 2].forEach((heads, j) => {
    const x = 65 + 465 * j,
      y = 221;
    txt(ctx, heads + ' KV heads', x, y - 42, 24, C.ink, { weight: 600 });
    const perHead = cache.queryHeads / heads;
    const headX = (h) => x + (h * perHead + (perHead - 1) / 2) * 42;
    for (let k = 0; k < cache.queryHeads; k++) {
      const qx = x + k * 42;
      dot(ctx, qx + 14, y, 6, C.plum);
      const dst = headX(Math.floor(k / perHead)) + 14;
      line(
        ctx,
        [
          [qx + 14, y + 7],
          [dst, y + 48],
        ],
        '#8b9291',
        1.7,
      );
    }
    for (let k = 0; k < heads; k++) {
      const hx = headX(k);
      box(ctx, hx, y + 50, 29, 30, C.green, 4);
      box(ctx, hx, y + 82, 29, 30, C.plum, 4);
      mono(ctx, 'K', hx + 14, y + 65, 15, C.white, 'center');
      mono(ctx, 'V', hx + 14, y + 97, 15, C.white, 'center');
    }
    if (j === 0 ? first : second) serif(ctx, cacheMiB(heads) + ' MiB', x, y + 151, 29, C.green);
  });
  note(
    ctx,
    second
      ? 'Four queries share each K/V pair. This design stores a quarter of the payload.'
      : 'Bytes = 2 (K and V) × layers × KV heads × width × positions × bytes per value',
  );
}
