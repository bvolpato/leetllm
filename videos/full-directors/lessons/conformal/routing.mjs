import {
  C,
  head,
  plate,
  rect,
  text,
  line,
  dash,
  dot,
  ring,
  diamond,
  pct,
  fmt,
} from './drawing.mjs';
import { router, routed, tickets } from './model.mjs';

function ledger(c, r, { showCounts = true, corrected = false, verdict = false, y = 368 } = {}) {
  const x = 50;
  const mistakes = showCounts ? r.wrong : '?';
  const fields = [
    ['Wrong / arrivals', r.wrong + ' / ' + router.length],
    ['Wrong / sent', r.sent.length ? r.wrong + ' / ' + r.sent.length : 'undefined'],
  ];
  if (corrected)
    fields.push([
      'Corrected criterion',
      '(' + mistakes + ' + 1) / 10' + (verdict ? ' = ' + pct(r.corrected) : ''),
    ]);
  fields.forEach(([label, value], i) => {
    text(c, label, x + i * 290, y, 17, C.dim);
    text(
      c,
      showCounts || i === 2 ? value : '?',
      x + i * 290,
      y + 30,
      i === 2 ? 22 : 28,
      i === 2 ? C.gold : C.text,
      'left',
      'Mono',
    );
  });
}
function gate(c, r) {
  const xx = (n) => 90 + n * 780;
  const threshold = xx(r.lambda);
  text(c, 'withheld', 47, 191, 16, C.dim);
  text(c, 'sent if score > λ', 911, 191, 16, C.teal, 'right', 'Mono');
  line(c, xx(0), 275, xx(1), 275, C.edge, 3);
  rect(c, threshold, 270, xx(1) - threshold, 10, '#315b55');
  dash(c, threshold, 207, threshold, 328, C.gold, 2);
  text(c, 'λ ' + fmt(r.lambda), threshold, 165, 17, C.gold, 'center', 'Mono');
  for (const item of router) {
    const x = xx(item.score),
      sent = item.score > r.lambda,
      y = sent ? 239 : 310;
    line(c, x, y, x, 273, C.edge, 1);
    dot(c, x, y, 15, item.wrong ? C.red : C.teal);
    text(c, item.wrong ? '×' : '✓', x, y, 15, C.ink, 'center', 'Sans', 700);
    text(c, fmt(item.score), x, 347, 14, C.dim, 'center', 'Mono');
  }
}
function losses(c, t, lambda) {
  const wrong = router.filter((r) => r.wrong),
    xx = (v) => 240 + v * 615;
  head(c, 'CONFORMAL RISK CONTROL  /  BINARY LOSS', 'A wrong answer costs one while it goes out');
  wrong.forEach((r, i) => {
    const y = 207 + i * 84;
    text(c, r.id + '   s = ' + r.score, 49, y, 17, C.text, 'left', 'Mono');
    line(c, xx(0), y - 18, xx(r.score), y - 18, C.red, 4);
    ring(c, xx(r.score), y - 18, 5, C.red);
    line(c, xx(r.score), y + 17, xx(1), y + 17, C.teal, 3);
    dot(c, xx(r.score), y + 17, 5, C.teal);
    const val = Number(r.score > lambda);
    diamond(c, xx(lambda), val ? y - 18 : y + 17, 8, C.gold);
    text(c, val, 908, y, 20, C.gold, 'right', 'Mono');
  });
  dash(c, xx(lambda), 156, xx(lambda), 418, C.gold, 1);
  text(c, 'λ = ' + fmt(lambda), xx(lambda), 441, 17, C.gold, 'center', 'Mono');
}
export function risk(c, t) {
  if (t.b <= 2) {
    const lambda =
      t.b === 1
        ? 0.1
        : t.on(2, 'When it withholds a wrong')
          ? 0.6
          : t.on(2, 'When it withholds a correct')
            ? 0.2
            : 0.1;
    const r = routed(lambda);
    head(
      c,
      'ANSWER ROUTER  /  WRONG ANSWERS MARKED ×',
      'A sent mistake has two possible denominators',
    );
    gate(c, r);
    ledger(c, r);
    return;
  }
  if (t.b === 3) {
    const lambda = t.on(3, 'At the score itself')
      ? 0.9
      : t.on(3, 'Raise the threshold')
        ? 0.6
        : 0.1;
    losses(c, t, lambda);
    return;
  }
  if (t.b === 6) {
    head(
      c,
      'EXPECTED LOSS  /  CALIBRATION AND NEXT REQUEST',
      'Among sent answers the denominator shrinks',
    );
    const a = routed(0.6);
    for (const [i, r] of [routed(0.5), a, routed(0.8)].entries()) {
      const x = 62 + i * 305;
      text(c, 'λ = ' + r.lambda, x, 187, 21, C.gold, 'left', 'Mono');
      const y = 253;
      r.sent.forEach((row, j) => {
        dot(c, x + j * 40 + 13, y, 13, row.wrong ? C.red : C.teal);
        text(c, row.wrong ? '×' : '✓', x + j * 40 + 13, y, 14, C.ink, 'center');
      });
      text(c, r.wrong + ' / ' + r.sent.length + ' sent', x, 320, 21, C.text, 'left', 'Mono');
    }
    text(
      c,
      'Label sent answers from the fixed generator and verifier.',
      60,
      422,
      23,
      C.teal,
      'left',
      'Serif',
    );
    return;
  }
  head(c, 'CONFORMAL RISK CONTROL', 'Choose the least conservative passing threshold');
  text(c, 'Exchangeable loss curves', 52, 164, 20, C.dim);
  text(
    c,
    '0 ≤ loss ≤ 1    ·    nonincreasing    ·    right-continuous',
    53,
    209,
    19,
    C.teal,
    'left',
    'Mono',
  );
  plate(c, 48, 252, 858, 125);
  text(c, 'sum of calibration losses + 1', 292, 284, 22, C.text, 'center', 'Mono');
  line(c, 80, 311, 506, 311, C.gold, 2);
  text(c, 'n + 1', 290, 341, 22, C.text, 'center', 'Mono');
  text(c, '≤  target', 671, 314, 30, C.gold, 'center', 'Serif');
  if (t.b === 5)
    text(
      c,
      'Fallback  ·  withhold every answer  →  joint loss 0',
      49,
      415,
      21,
      C.teal,
      'left',
      'Mono',
    );
}
export function threshold(c, t) {
  const lambda =
    t.b < 3
      ? 0.1
      : t.b === 3
        ? t.on(3, 'Count the mistakes above')
          ? 0.6
          : 0.1
        : t.b === 5 && t.on(5, 'At threshold one')
          ? 1
          : 0.6;
  const r = routed(lambda),
    passed =
      lambda === 0.1 ? t.on(3, 'Keep raising') : lambda === 0.6 ? t.on(4, 'Now read') : false;
  head(
    c,
    'CALIBRATION  /  JOINT RISK TARGET 25%',
    lambda === 1 ? 'The fallback sends no answers' : 'Raise the gate until the correction passes',
  );
  gate(c, r);
  const ledgerY = 368;
  ledger(c, r, {
    corrected: t.b >= 2,
    verdict: passed,
    showCounts: lambda !== 0.6 || t.on(4, 'One mistake plus one'),
    y: ledgerY,
  });
  if (passed)
    text(c, r.pass ? 'passes' : 'fails', 902, ledgerY, 20, r.pass ? C.teal : C.red, 'right', 'Serif');
  if (lambda === 1) text(c, 'Empty sent denominator', 902, 134, 18, C.dim, 'right', 'Serif');
}
export function selected(c, t) {
  head(c, 'HELP REQUESTS  /  TRUE LABEL IS TECHNICAL', 'Follow only the answers the policy sends');
  const active = t.b >= 2,
    sending = tickets.filter((r) => r.set.length === 1),
    wrong = sending.filter((r) => !r.set.includes(r.truth)).length;
  const x = 51,
    y = 141;
  for (let i = 0; i < tickets.length; i++) {
    const row = tickets[i],
      xx = x + (i % 10) * 43,
      yy = y + Math.floor(i / 10) * 27,
      one = row.set.length === 1;
    const faded = active && !one;
    rect(c, xx, yy, 39, 25, one && active ? C.gold : faded ? '#304848' : '#dce3ce', 4);
    dot(c, xx + (one ? 19 : 12), yy + 12, 5, faded ? '#60797b' : '#527ca0');
    if (!one) diamond(c, xx + 27, yy + 12, 6, faded ? '#608175' : '#459075');
  }
  dot(c, 60, 119, 6, C.blue);
  text(c, 'Billing', 77, 119, 16, C.dim);
  diamond(c, 221, 119, 7, C.teal);
  text(c, 'Technical', 237, 119, 16, C.dim);
  text(c, 'Sets covering truth', 532, 169, 20, C.dim);
  text(
    c,
    t.on(1, 'end') || t.b > 1
      ? tickets.filter((r) => r.set.includes(r.truth)).length + ' / ' + tickets.length
      : '?',
    532,
    219,
    35,
    C.teal,
    'left',
    'Mono',
  );
  if (active) {
    text(c, 'Wrong / arrivals', 532, 296, 17, C.dim);
    text(c, 'Wrong / sent', 532, 357, 17, C.dim);
    text(
      c,
      t.on(3, "That's ten percent") ? wrong + ' / 100   =   10%' : '?',
      532,
      333,
      23,
      C.gold,
      'left',
      'Mono',
    );
    text(
      c,
      t.on(3, 'The population coverage') ? wrong + ' / ' + sending.length + '   =   100%' : '?',
      532,
      392,
      23,
      C.red,
      'left',
      'Mono',
    );
  }
  if (t.b === 4) text(c, 'Check permissions before acting.', 532, 260, 18, C.dim);
}
