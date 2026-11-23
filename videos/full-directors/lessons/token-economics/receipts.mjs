import {
  C,
  bno,
  box,
  clip,
  cue,
  dot,
  footer,
  group,
  head,
  label,
  line,
  nfmt,
  paper,
  rule,
  scaleBar,
  seal,
  segments,
  slipRow,
  type,
  usd,
} from './press.mjs';
import { F, contextTierPrice, overnight, policy, receipt, terraWorksheet } from './ledger.mjs';

function shutter(c, x, y, w, p) {
  if (p >= 1) return;
  group(c, () => {
    c.beginPath();
    c.rect(x, y, w, 64);
    c.clip();
    const pos = x - w * p;
    box(c, pos, y, w, 64, '#48564d', '#2d3936', 3, 4);
    for (let xx = pos + 12; xx < pos + w; xx += 16)
      line(c, xx, y + 5, xx - 11, y + 59, '#778275', 2);
    box(c, pos + w - 22, y + 8, 10, 48, '#c4b693', null, 0, 4);
  });
}
export function overnightBills(c, k) {
  const revealAmount = (phrase) =>
    bno(k) === 2 ? k.reveal(phrase, 0.5, { captionStart: false }) : Number(bno(k) > 2);
  const inputReveal = revealAmount('four dollars fifty');
  const outputReveal = revealAmount('a dollar twenty');
  const totalReveal = revealAmount('five dollars seventy');
  const aligned = cue(k, 1, "alongside last night's", 0.8);
  for (const [i, warm] of [true, false].entries()) {
    const x = i ? 1000 : 150,
      y = i ? 165 + 58 * (1 - aligned) : 165,
      w = 770,
      r = overnight(warm);
    paper(c, x, y, w, 680, i ? '#f3e6c9' : C.paper, true);
    clip(c, x + w / 2, y);
    label(c, 'POLICYOPS   /   EVALUATION', x + 52, y + 63);
    type(c, warm ? 'Last night' : 'Tonight', x + 48, y + 148, 80, C.ink, 'serif');
    type(c, nfmt(r.count) + ' checks', x + 52, y + 221, 37);
    type(
      c,
      warm ? 'Saved instructions reused' : 'Saved instructions expired',
      x + 52,
      y + 279,
      34,
      warm ? C.teal : C.red,
    );
    rule(c, x + 52, y + 325, w - 104);
    slipRow(
      c,
      x + 52,
      y + 390,
      w - 104,
      'Process prompts',
      warm || inputReveal ? usd(r.input, 2) : '',
    );
    slipRow(
      c,
      x + 52,
      y + 494,
      w - 104,
      'Write answers',
      warm || outputReveal ? usd(r.output, 2) : '',
      C.blue,
    );
    type(c, 'TOTAL', x + 52, y + 600, 34, C.soft, 'mono');
    type(
      c,
      warm || totalReveal ? usd(r.total, 2) : '',
      x + w - 52,
      y + 600,
      59,
      C.ink,
      'mono',
      'right',
    );
    if (!warm) {
      shutter(c, x + w - 305, y + 358, 253, inputReveal);
      shutter(c, x + w - 305, y + 462, 253, outputReveal);
      shutter(c, x + w - 305, y + 568, 253, totalReveal);
    }
  }
  if (bno(k) === 1 && cue(k, 1, 'Which charge changes'))
    footer(c, 'Same prompts. Same billed output count. Which line changes?');
  if (totalReveal === 1) {
    const warm = overnight(true);
    const cold = overnight(false);
    footer(c, '+' + usd(cold.input - warm.input, 2) + ' in prompt processing across ' + nfmt(cold.count) + ' checks');
  }
}
export function anatomy(c, k) {
  const fields = cue(k, 1, 'provider returns usage counts', 0.5);
  paper(c, 115, 133, 1010, 725, C.paper, true);
  clip(c, 619, 133);
  label(c, 'USAGE RECEIPT', 175, 208);
  type(c, F.USAGE_RECEIPT.request, 171, 292, 65, C.ink, 'serif');
  const r = policy(false);
  group(c, () => {
    c.globalAlpha = fields;
    r.rows
      .filter((_, i) => i !== 2)
      .forEach((v, i) =>
        slipRow(
          c,
          180,
          405 + 113 * i,
          850,
          v.name,
          nfmt(v.count) + ' tokens',
          i === 2 ? C.blue : C.teal,
        ),
      );
  });
  if (bno(k) >= 2) type(c, 'Reasoning detail belongs inside output.', 181, 798, 34, C.soft);
  paper(c, 1190, 260, 620, 501, '#d7e2d6');
  label(c, 'RATE CARD', 1247, 325);
  type(c, 'GPT-5.4', 1244, 406, 75, C.ink, 'serif');
  type(c, 'Standard   /   USD', 1248, 488, 40);
  if (bno(k) >= 3) {
    rule(c, 1248, 540, 502);
    label(c, 'Request origin   ' + F.USAGE_RECEIPT.region, 181, 729);
    type(c, 'Pricing scope   Global', 1247, 608, 32, C.ink, 'mono');
    type(c, F.USAGE_RECEIPT.priceEffectiveDate, 1247, 686, 32, C.ink, 'mono');
    seal(c, 'ACCEPTED', 888, 208, C.teal, 237);
  }
}
export function oneCall(c, k) {
  head(c, 'GPT-5.4 STANDARD   /   GLOBAL   /   21 SEP 2026', 'One policy answer');
  const r = policy(false),
    shown = cue(k, 3, 'Look at the two charges');
  [r.rows[0], r.rows[3]].forEach((v, i) => {
    const y = 320 + i * 230,
      ink = i ? C.blue : C.teal;
    paper(c, 108, y, 1700, 188, i ? '#dce6e6' : C.paper);
    type(c, v.name, 155, y + 62, 52, ink, 'serif');
    type(
      c,
      nfmt(v.count) + ' × ' + usd(v.rate * 1e6, 2) + ' / million',
      155,
      y + 137,
      39,
      C.ink,
      'mono',
    );
    if (shown) {
      scaleBar(c, 1020, y + 51, 530, 46, v.cost, 4500, ink);
      type(c, usd(v.cost, 5), 1728, y + 133, 43, ink, 'mono', 'right');
    }
  });
  if (shown) footer(c, 'Generation charge   ' + usd(r.total, 5));
  else if (bno(k) >= 2) footer(c, 'Which part costs more?');
}
export function prefix(c, k) {
  head(c, 'POLICY ANSWER   /   ORDER 42', 'Two prices inside one prompt');
  const warm = policy(true),
    cold = policy(false),
    read = cue(k, 1, 'reports a read', 0.45),
    subtract = cue(k, 2, 'Subtract the read tokens'),
    showRemainder = cue(k, 2, 'The five hundred twenty'),
    showPrices = cue(k, 2, 'Price the prefix');
  const [ordinary, prefixRead] = warm.rows;
  paper(c, 114, 275, 1692, 540);
  type(c, 'Rendered input', 171, 344, 48, C.ink, 'serif');
  const start = 170,
    width = 1570,
    div = (width * prefixRead.count) / warm.input;
  segments(c, start, 409, width, 103, [
    [prefixRead.count, read ? C.gold : '#b7cbbf'],
    [ordinary.count, '#a7cac1'],
  ]);
  type(c, 'Policy instructions   ·   ' + nfmt(prefixRead.count), start + 32, 459, 42);
  const order = showRemainder ? 'Order 42   ·   ' + nfmt(ordinary.count) : 'Order 42';
  type(c, order, start + div + 22, 459, 40);
  if (showPrices) {
    type(
      c,
      '$0.25 / million    ' + usd(warm.rows[1].cost, 5),
      start + 24,
      583,
      39,
      C.amber,
      'mono',
    );
    type(
      c,
      '$2.50 / M    ' + usd(warm.rows[0].cost, 5),
      start + div + 12,
      583,
      33,
      C.teal,
      'mono',
      'left',
      width - div - 20,
    );
  } else {
    const total = nfmt(warm.input);
    const remainder = showRemainder ? nfmt(ordinary.count) : '?';
    const working = subtract
      ? `${total} total − ${nfmt(prefixRead.count)} read = ${remainder} ordinary`
      : `${total} input tokens in all`;
    type(c, working, start + 24, 583, 48, C.ink, 'mono');
  }
  if (bno(k) >= 3) {
    rule(c, start, 647, width);
    type(c, '180 output tokens on either receipt', start, 715, 40, C.blue);
    type(c, usd(warm.rows[3].cost, 5), 1734, 715, 44, C.blue, 'mono', 'right');
    footer(c, 'Cold   ' + usd(cold.total, 5) + '       With the read   ' + usd(warm.total, 5));
  }
}
function envelope(c, x, y, w, h, fill) {
  box(c, x, y, w, h, fill, C.soft, 3);
  line(c, x, y, x + w / 2, y + h * 0.61, C.soft, 3);
  line(c, x + w, y, x + w / 2, y + h * 0.61, C.soft, 3);
  line(c, x, y + h, x + w * 0.32, y + h * 0.44, C.soft, 2);
  line(c, x + w, y + h, x + w * 0.68, y + h * 0.44, C.soft, 2);
}
export function reuse(c, k) {
  head(c, 'CUSTOMER MAIL', 'Two questions reach support');
  paper(c, 120, 280, 695, 535, C.paper);
  label(c, 'APPROVED REGIONAL POLICY', 166, 343);
  type(c, 'Standard return window', 165, 414, 49, C.ink, 'serif', 'left', 610);
  rule(c, 166, 461, 600);
  type(c, '“Returns within 30 days.”', 166, 527, 43);
  const copy = cue(k, 1, 'Copy the approved text', 0.7);
  if (copy) {
    envelope(c, 175, 685, 580, 146, '#ccbaa1');
    paper(c, 195, 687 - 81 * copy, 540, 96, '#fbf7e9');
    type(c, '“Returns within 30 days.”', 215, 735 - 81 * copy, 34);
    label(c, '0 generated tokens', 200, 877, C.mint);
  }
  if (bno(k) >= 2) {
    const generated = cue(k, 4, 'The answer comes');
    paper(c, 906, 280, 898, 535, '#e1e9da');
    label(c, generated ? 'GENERATED ORDER ANSWER' : 'INCOMING ORDER QUESTION', 960, 343);
    type(c, 'Does order 77 qualify?', 960, 415, 51, C.ink, 'serif');
    for (const [i, order] of [42, 77].entries()) {
      const y = 493 + i * 102;
      box(c, 961, y, 470, 76, C.gold);
      box(c, 1438, y, 300, 76, i ? '#b0cfd9' : '#d1d1c2');
      type(c, 'Policy v3  ·  1,280', 980, y + 39, 35);
      type(c, 'Order ' + order, 1460, y + 39, 37);
    }
    type(
      c,
      generated
        ? 'New answer for order 77'
        : bno(k) >= 3
          ? 'Which work remains?'
          : 'Same prefix, new details',
      960,
      746,
      39,
      generated ? C.blue : C.ink,
    );
    if (bno(k) >= 3) label(c, '1,280 read   +   520 ordinary', 958, 855, C.white);
    if (generated) label(c, '180 generated tokens', 958, 916, C.sky);
  }
}
export function physics(c, k) {
  const b = bno(k);
  if (b <= 2) {
    head(c, 'INFERENCE   /   ONE LAYER', 'Which positions can run together?');
    type(c, 'Known input', 112, 352, 47, C.white, 'serif');
    const words = ['Can', 'I', 'return', 'it', '?'];
    words.forEach((word, i) => {
      const x = 112 + i * 184;
      box(c, x, 414, 166, 99, '#c0dac8', null, 0, 8);
      type(c, word, x + 83, 465, 41, C.ink, 'mono', 'center');
      line(c, x + 83, 521, x + 83, 585, C.mint, 4);
    });
    box(c, 112, 586, 902, 78, C.teal);
    type(c, 'One parallel prefill', 563, 625, 43, C.white, 'sans', 'center');
    type(c, 'Generated in sequence', 1100, 350, 45, C.white, 'serif');
    const grow = cue(k, 1, 'each new token', 1.4);
    ['Yes', ',', 'if', '…'].forEach((v, i) => {
      if (grow >= i / 3 && grow > 0) {
        const x = 1100 + i * 172;
        box(c, x, 490 + i * 35, 143, 89, C.sky, null, 0, 6);
        type(c, v, x + 72, 535 + i * 35, 39, C.ink, 'mono', 'center');
      }
    });
    if (b === 2)
      footer(c, 'Large prefill often uses compute. Small-batch decode often waits for memory.');
  } else if (b < 5) {
    head(c, 'POLICYOPS   /   ACCOUNTING BOUNDARY', 'Follow the work onto the bill');
    paper(c, 116, 310, 805, 490);
    label(c, 'MODEL GENERATION', 176, 378);
    ['Ordinary input', 'Reported reads and writes', 'Billed output'].forEach((s, i) => {
      type(c, s, 177, 485 + 95 * i, 45, C.ink, 'serif');
      rule(c, 177, 525 + i * 95, 672);
    });
    if (b === 4) {
      paper(c, 994, 310, 806, 490, '#d6e2d8');
      label(c, 'OTHER SERVICE COSTS', 1053, 378);
      ['Lookup and embeddings', 'Tools and storage', 'Serving'].forEach((s, i) => {
        type(c, s, 1054, 485 + 95 * i, 45, C.ink, 'serif');
        rule(c, 1054, 525 + i * 95, 680);
      });
    } else footer(c, 'Measure the hardware to find the bottleneck.');
  } else {
    head(c, 'REQUEST JOURNAL', 'Follow one attempt past its timeout');
    const timeout = cue(k, 5, 'the timer expires'),
      arrived = cue(k, 5, 'Match the ID');
    paper(c, 135, 332, 1645, 395);
    label(c, 'ATTEMPT A1   /   POLICY ANSWER', 198, 411);
    type(
      c,
      arrived ? 'Provider usage matched' : timeout ? 'Local timer expired' : 'Request dispatched',
      193,
      526,
      76,
      C.ink,
      'serif',
    );
    type(
      c,
      arrived
        ? '1,800 ordinary input   +   180 output'
        : timeout
          ? 'Usage pending from provider'
          : 'Waiting for usage',
      198,
      643,
      40,
      arrived ? C.teal : C.soft,
    );
    if (arrived) seal(c, usd(policy(false).total, 5), 1495, 507, C.teal, 330);
  }
}
export function normalize(c, k) {
  const b = bno(k),
    r = terraWorksheet;
  const [ordinary, reads, writes] = r.rows.map((row) => nfmt(row.count));
  head(
    c,
    b >= 5
      ? 'USAGE ADAPTER   /   FIELD COMPARISON'
      : 'GPT-5.6 TERRA   /   GLOBAL STANDARD   /   30-MINUTE WRITE',
    b >= 5 ? 'Read the provider’s field definitions' : 'Partition the input once',
  );
  paper(c, 110, 276, 1696, 562);
  label(
    c,
    b >= 5
      ? 'ANTHROPIC FIELD CONVENTION   /   ILLUSTRATIVE COUNTS'
      : 'INCLUSIVE TOTAL   /   ' + nfmt(r.input) + ' INPUT TOKENS',
    173,
    344,
  );
  const colors = [C.mint, C.gold, C.sky, C.coral],
    cx = b >= 5 ? [173, 590, 1140] : [173, 492, 811, 1460];
  const drawSplit = b >= 2 || cue(k, 1, 'Subtract both');
  if (drawSplit) {
    segments(
      c,
      175,
      404,
      1215,
      94,
      r.rows.slice(0, 3).map((v, i) => [v.count, colors[i]]),
    );
    let left = 175;
    for (const row of r.rows.slice(0, 3)) {
      const w = (1215 * row.count) / r.input;
      type(c, nfmt(row.count), left + w / 2, 452, 36, C.ink, 'mono', 'center');
      left += w;
    }
    if (b >= 2 && b <= 4) {
      box(c, 1440, 404, 300, 94, '#edd3c4');
      type(c, 'Output only', 1590, 452, 35, C.ink, 'sans', 'center');
    }
  } else {
    box(c, 175, 404, 1215, 94, '#c2cfbf');
    type(c, nfmt(r.input) + ' input positions', 782, 452, 44, C.ink, 'sans', 'center');
  }
  if (drawSplit) {
    r.rows.forEach((v, i) => {
      if (i === 3 && (b === 1 || b >= 5)) return;
      if (b >= 5) {
        const fields = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];
        type(c, fields[i], cx[i], 554, 30, C.ink, 'mono');
      } else type(c, v.name, cx[i], 554, 35, C.ink, 'bold');
      type(c, nfmt(v.count) + (i === 3 ? ' out' : ''), cx[i], 610, 44, C.ink, 'mono');
      if (b === 2 || b === 4) {
        type(c, '× $' + v.rate.toFixed(2) + ' / M', cx[i], 664, 29, C.soft, 'mono');
        type(c, usd(v.cost), cx[i], 714, 34, C.ink, 'mono');
      }
    });
    if (b === 1)
      label(
        c,
        `${nfmt(r.input)} − ${reads} reads − ${writes} writes = ${ordinary} ordinary`,
        173,
        754,
      );
    if ((b === 2 && cue(k, 2, 'Any reasoning detail')) || b === 4)
      type(c, 'Charge at the worksheet rates    ' + usd(r.total), 173, 788, 39, C.teal, 'serif');
    if (b >= 5)
      type(
        c,
        `${ordinary} ordinary + ${reads} reads + ${writes} writes = ${nfmt(r.input)} total input`,
        173,
        749,
        38,
        C.ink,
        'mono',
        'left',
        1540,
      );
  }
  if (b === 3) {
    label(c, 'reads + writes ≤ total input     reasoning ≤ output', 173, 710);
    type(c, 'count = true', 173, 778, 36, C.red, 'mono');
    seal(c, 'REJECT', 770, 771, C.red, 192);
  }
  if (b === 4) footer(c, 'Sum unrounded charges. Reconcile rounding on the invoice.');
  if (b === 6)
    footer(
      c,
      'Match model, tier, billing scope, currency and effective date. Resolve missing rates.',
    );
}
export function reasoning(c, k) {
  const incomplete = cue(k, 3, 'It spends its entire allowance');
  const r = receipt(incomplete ? 1800 : 0, 0, 0, incomplete ? 1024 : 1186, F.standard, 1024);
  head(
    c,
    'OUTPUT METER   /   ' + (incomplete ? 'INCOMPLETE REQUEST' : 'PROVIDER EXAMPLE'),
    incomplete ? 'The cap can run out before a reply appears' : 'Look inside billed output',
  );
  paper(c, 115, 297, 1690, 503);
  label(c, 'BILLED OUTPUT', 174, 370);
  type(c, nfmt(r.output) + ' tokens', 170, 470, 82, C.ink, 'serif');
  segments(c, 176, 558, 1560, 91, [
    [1024, C.gold],
    [r.output - 1024, C.sky],
  ]);
  type(c, '1,024 reasoning', 180, 708, 41, C.amber);
  type(
    c,
    incomplete ? 'No visible answer' : '162 other · may include formatting',
    1735,
    708,
    38,
    incomplete ? C.red : C.blue,
    'sans',
    'right',
  );
  if (incomplete)
    footer(
      c,
      'Input ' +
        usd(r.rows[0].cost, 5) +
        '   +   output ' +
        usd(r.rows[3].cost, 5) +
        '   =   ' +
        usd(r.total, 5),
    );
  else if (bno(k) >= 2)
    footer(
      c,
      'Output is billed once     ' + nfmt(r.output) + ' × $15 / million = ' + usd(r.total, 5),
    );
}
export function tierState(k) {
  const next = cue(k, 3, 'The entire prompt'),
    larger = cue(k, 4, 'The long row still applies');
  const input = larger ? 300000 : next ? 272001 : 272000,
    output = larger ? 1000 : 0;
  const result = larger
    ? cue(k, 4, 'Check the provider')
    : next
      ? cue(k, 3, 'Compare it')
      : cue(k, 2, 'One more token');
  const title = larger ? 'Price a full call on the long row' : 'One more token on the counter';
  return { input, output, title, ...contextTierPrice(input, output), result };
}
export function tier(c, k) {
  const s = tierState(k);
  head(c, 'RATE SELECTOR   /   GPT-5.4   /   GLOBAL STANDARD   /   21 SEP 2026', s.title);
  box(c, 108, 273, 1702, 559, '#475451', '#0e2425', 7, 32);
  for (const x of [150, 1766])
    for (const y of [314, 792]) {
      dot(c, x, y, 10, '#adb09e');
      line(c, x - 5, y + 2, x + 5, y - 2, '#45524a', 2);
    }
  const x = 188;
  label(c, 'TOTAL INPUT', x, 350, C.white);
  const digits = String(s.input).split('');
  digits.forEach((d, i) => {
    const u = x + i * 91;
    box(c, u, 400, 84, 119, '#172b2c', '#879185', 3, 8);
    type(c, d, u + 42, 459, 77, C.white, 'mono', 'center');
    line(c, u + 1, 464, u + 83, 464, '#20343366', 2);
  });
  if (bno(k) === 2 || (bno(k) === 3 && !s.long)) {
    const p = cue(k, 3, 'Add one token', 0.48);
    box(c, 758 - p * 35, 413 + 30 * p, 87, 82, C.gold, null, 0, 8);
    type(c, '+1', 802 - p * 35, 455 + 30 * p, 39, C.ink, 'mono', 'center');
  }
  label(c, 'Output   ' + nfmt(s.output), x, 585, C.white);
  paper(c, 897, 328, 816, 292);
  label(c, '$/M TOKENS', 929, 376);
  ['Ordinary', 'Read', 'Output'].forEach((v, i) =>
    type(c, v, 1251 + i * 154, 377, 25, C.soft, 'sans', 'center'),
  );
  [false, true].forEach((long, i) => {
    const y = 424 + i * 87,
      active = s.long === long;
    if (active) box(c, 912, y - 9, 785, 71, long ? C.gold : C.mint);
    type(c, long ? '> 272,000' : '≤ 272,000', 932, y + 27, 33, C.ink, 'mono');
    const r = contextTierPrice(long ? 272001 : 272000);
    [r.inputRate, r.readRate, r.outputRate].forEach((v, j) =>
      type(c, '$' + v.toFixed(2), 1250 + j * 154, y + 27, 33, C.ink, 'mono', 'center'),
    );
  });
  const length = (1480 * s.input) / 300000;
  box(c, 188, 688, 1480, 68, '#253e3a');
  box(c, 188, 688, length, 68, s.long ? C.gold : C.mint);
  type(
    c,
    nfmt(s.input) + ' ordinary × $' + s.inputRate.toFixed(2) + ' / million',
    208,
    723,
    36,
    C.ink,
    'mono',
    'left',
    length - 38,
  );
  if (s.result)
    footer(
      c,
      (s.output
        ? 'With ' + nfmt(s.output) + ' output at $' + s.outputRate.toFixed(2) + ' / million    '
        : 'Full input charge    ') + usd(s.cost * 1e6, 6),
    );
  if (s.input === 272001 && s.result)
    type(
      c,
      'Previously    ' + usd(contextTierPrice(272000).cost * 1e6, 2),
      1785,
      904,
      40,
      C.dim,
      'serif',
      'right',
    );
}
