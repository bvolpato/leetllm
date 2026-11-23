import { C, box, cap, txt, mono, line, headline, strip, cue, badge, bar, mid } from './drawing.mjs';
import { ledger, suggested, assess, inlineClasses } from './model.mjs';

export function outcomes(g, c) {
  const accept = cue(c, 0, 'It becomes solid code');
  const undo = cue(c, 0, 'undo that one insertion');
  const b = cue(c, 1, 'and keeps them'),
    cc = cue(c, 1, 'C inserts forty-two');
  const trim = cue(c, 1, 'loses seven original characters'),
    d = cue(c, 1, 'D appears');
  const dismissed = cue(c, 1, 'Count each shown suggestion');
  const rates = cue(c, 2, 'A replacement character');
  const phase = d ? 6 : trim ? 5 : cc ? 4 : b ? 3 : undo ? 2 : accept ? 1 : 0;
  const state = ledger(phase);
  headline(g, c, 'EDIT HISTORY   /   four observed suggestions');
  if (!b) {
    box(g, 100, 271, 1720, 303, C.sheet, 18);
    cap(g, 'scope.py    /    suggestion A', 140, 340);
    const label = 'is_allowed = ',
      x = 140,
      size = 53;
    mono(g, label, x, 462, size);
    g.font = '400 ' + size + 'px "Lesson Mono"';
    const anchor = x + g.measureText(label).width;
    const shown = phase === 0 ? suggested[0] : state.text[0];
    mono(g, shown, anchor, 462, size, phase === 0 ? '#817b8e' : C.green);
    box(g, anchor + (phase === 1 ? g.measureText(shown).width : 0) - 2, 410, 5, 64, C.blue);
    badge(
      g,
      phase === 0 ? 'Ghost' : phase === 1 ? 'Inserted' : 'Undo',
      1393,
      294,
      367,
      undo ? C.blush : C.sky,
      undo ? C.red : C.blue,
    );
    cap(g, 'ACCEPTED IDS', 138, 654);
    mono(g, state.ids + ' / ' + state.den, 138, 747, 72);
    cap(g, 'INSERTED CHARACTERS', 652, 654);
    mono(g, state.insertedTotal, 652, 747, 72);
    cap(g, 'ORIGINALS STILL PRESENT', 1220, 654);
    mono(g, state.kept, 1220, 747, 72, undo ? C.red : C.green);
    strip(
      g,
      undo
        ? 'Undo removed the closing parenthesis along with the other 17 characters. A still counts once.'
        : accept
          ? 'Tab committed the complete expression. All eighteen originals are present.'
          : 'The dim expression is a proposal. It has contributed zero characters.',
    );
    return;
  }
  const x = 650,
    scale = 18.4;
  cap(g, 'SHOWN ID', 117, 314);
  cap(g, 'ORIGINAL CHARACTERS', x, 314);
  cap(g, 'INSERTED', 1517, 314);
  cap(g, 'KEPT', 1733, 314);
  for (let i = 0; i < 4; i++) {
    const yy = 360 + 106 * i;
    if (!state.shown[i]) continue;
    const label = [
      'A   undone',
      'B   kept',
      trim ? 'C   edited' : 'C   inserted',
      dismissed ? 'D   dismissed' : 'D   offered',
    ][i];
    txt(g, label, 120, yy + 47, 42);
    const ins = state.inserted[i],
      keep = state.retained[i];
    if (ins) {
      bar(g, x, yy + 3, ins * scale, 51, C.blush);
      bar(g, x, yy + 3, keep * scale, 51, C.green);
      if (ins > keep) {
        g.save();
        g.beginPath();
        g.rect(x + keep * scale, yy + 3, (ins - keep) * scale, 51);
        g.clip();
        for (let k = keep * scale - 50; k < ins * scale; k += 17)
          line(g, x + k, yy + 56, x + k + 54, yy + 1, '#c3837a', 3);
        g.restore();
      }
    } else line(g, x, yy + 26, x + 22, yy + 26, C.rule, 4);
    mono(g, ins, 1540, yy + 45, 41);
    mono(g, keep, 1742, yy + 45, 41, C.green);
  }
  if (!rates)
    txt(g, 'Each row follows one shown ID through its observation window.', 120, 801, 38, C.muted);
  strip(
    g,
    rates
      ? state.ids +
          ' / ' +
          state.den +
          ' shown IDs accepted          ' +
          state.kept +
          ' / ' +
          state.insertedTotal +
          ' inserted characters retained'
      : 'Green characters survived. Hatched characters were inserted and later removed.',
  );
}

export function release(g, c) {
  const run = cue(c, 0, 'Run both cases'),
    repair = cue(c, 1, 'It checks the requested action');
  const verdict =
    c.beat.beatIndex > 1 ||
    (c.beat.beatIndex === 1 &&
      c.reveal('Returning True', 0, { captionStart: 'The write test fails' }));
  const compare = cue(c, 2, 'Replay the same two requests'),
    keep = cue(c, 2, 'Keep a known-good route'),
    targets = cue(c, 2, 'Compare quality and failures');
  const baseline = assess(false),
    candidate = assess(true),
    current = repair ? baseline : candidate;
  const result = (v) => (v ? 'ALLOW' : 'DENY');
  headline(g, c, 'BEHAVIOR CHECK   /   scope.py');
  if (compare) {
    for (const [i, entry] of [baseline, candidate].entries()) {
      const x = 100 + i * 873;
      box(g, x, 270, 838, 503, C.sheet, 14);
      cap(g, i ? 'SMALLER CANDIDATE' : 'KNOWN-GOOD ROUTE', x + 30, 333);
      mono(g, entry.expression, x + 30, 430, 49, i ? C.blue : C.green);
      entry.cases.forEach((r, j) => {
        const y = 543 + j * 101;
        txt(g, r.action, x + 30, y + 40, 43);
        mono(g, result(r.actual), x + 253, y + 40, 43, r.pass ? C.green : C.red);
        badge(
          g,
          r.pass ? 'Pass' : 'Fail',
          x + 583,
          y - 6,
          200,
          r.pass ? C.mint : C.blush,
          r.pass ? C.green : C.red,
        );
      });
    }
    strip(
      g,
      keep
        ? 'Keep this expression on the known-good route. The candidate fails the required write test.'
        : targets
          ? 'Edit-to-paint p95 targets    •    Expression  ' +
            inlineClasses.expression.p95 +
            ' ms    •    Body  ' +
            inlineClasses.body.p95 +
            ' ms'
          : 'Same inputs and expected actions. Compare the behavior of the two returned expressions.',
    );
    return;
  }
  box(g, 100, 273, 1720, 177, C.sheet, 16);
  cap(g, 'EXPRESSION UNDER TEST', 138, 334);
  mono(g, 'is_allowed = ' + current.expression, 138, 410, 54, C.blue);
  const xs = [132, 523, 997, 1460];
  ['REQUEST', 'EXPECTED', 'ACTUAL', 'TEST'].forEach((s, i) => cap(g, s, xs[i], 541));
  for (const [i, r] of current.cases.entries()) {
    const y = 578 + i * 106;
    txt(g, r.action, xs[0], y + 47, 50);
    mono(g, result(r.expected), xs[1], y + 47, 46);
    if (verdict) {
      mono(g, result(r.actual), xs[2], y + 47, 46);
      badge(
        g,
        r.pass ? 'Pass' : 'Fail',
        xs[3],
        y,
        290,
        r.pass ? C.mint : C.blush,
        r.pass ? C.green : C.red,
      );
    } else if (run) {
      mono(g, '···', xs[2], y + 47, 46, C.muted);
    }
    line(g, 130, y + 75, 1770, y + 75);
  }
  strip(
    g,
    repair
      ? 'The same two requests now agree with both expected actions.'
      : verdict
        ? 'The write must be denied. A constant True grants it.'
        : 'All four characters of True survived. Which request tests the permission boundary?',
  );
}
