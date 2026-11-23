import {
  rows,
  corrected,
  omitted,
  score,
  closeRuns,
  fileB,
  countTestBaseline,
  countTestFileB,
  lineCases,
  parse,
  linePattern,
  practice,
  repaired,
  practiceLoad,
  decisions,
  bool,
  quoted,
  testReport,
} from './examples.mjs';
import { noteY } from './drawing.mjs';

export function floor(s) {
  const { c, b, cue, txt, label, line, disk, footer } = s;
  if (b < 3) {
    const countsVisible = [cue(1, 'B has', 0), cue(1, 'Each tick', 0)];
    const placed = [cue(2, 'Place A', 0), cue(2, 'Now mark B', 0)];
    const judged = [placed[1], cue(2, 'The report rounded', 0)];
    const productA = cue(2, 'just below eighteen thousand', 0);
    const base = 236,
      step = 100,
      yLine = 365;
    closeRuns.forEach((r, i) => {
      const x = 65 + i * 456;
      label(i ? 'Run B   ·   9,000 requests' : 'Run A   ·   9,000 requests', x, 132);
      txt(r.display, x, 196, 61, { face: 'serif' });
      if (countsVisible[i] > 0) txt(r.matches + ' / ' + r.total, x, 250, 26);
      if (placed[i]) {
        const relation = r.earned === r.required ? ' = ' : r.pass ? ' > ' : ' < ';
        txt('3 × ' + r.matches + (judged[i] ? relation : '   ?   ') + '2 × ' + r.total, x, 282, 20);
        if (judged[i])
          txt(r.earned + relation + r.required, x, 310, 22, { color: r.pass ? c.accent : c.red });
        else if (i === 0 && productA) txt(r.earned, x, 310, 22);
      }
    });
    label('Matches', 55, yLine);
    line(base - 42, yLine, base + 5 * step + 42, yLine);
    for (let i = 0; i <= 5; i++) {
      const x = base + i * step;
      line(x, yLine - 7, x, yLine + 7);
      txt(5997 + i, x, yLine + 34, 18, { align: 'center', color: c.dim });
    }
    const threshold = base + 3 * step;
    if (judged[1]) {
      line(threshold, yLine - 37, threshold, yLine + 12, c.gold, 3);
      label('2/3 floor', threshold + 18, yLine - 32, { color: c.gold });
    }
    closeRuns.forEach((r, i) => {
      if (!placed[i]) return;
      const x = base + (r.matches - 5997) * step;
      disk(x, yLine, 7, judged[i] ? (r.pass ? c.accent : c.red) : c.ink);
      label(i ? 'B' : 'A', x - 16, yLine - 26);
    });
    footer(
      b === 0
        ? 'Both reports round to 0.667. What evidence would let you apply the 2/3 floor?'
        : judged[1]
          ? 'One more match puts B exactly on the floor.'
          : 'Floor: 2/3. Which run has 3 × matches ≥ 2 × total?',
    );
  } else if (b === 3) {
    label('Positive b and positive total', 55, 147);
    txt('matches / total  ≥  a / b', 55, 213, 39);
    const multiply = cue(3, 'Multiply both sides');
    if (multiply > 0) {
      line(76, 269, 851, 269);
      txt('× (b × total)', 74, 307, 24, { color: c.gold });
    }
    if (s.clock.elapsed >= s.clock.speechDuration)
      txt('b × matches  ≥  a × total', 55, 388, 39, { color: c.accent });
    if (cue(3, 'Compare b times matches', 0))
      footer('Multiplying by positive factors preserves the direction of the inequality.');
  } else {
    label('Gate inputs', 54, 147);
    s.chip('matches = 0', 55, 192, 366);
    s.chip('total = 0', 505, 192, 366);
    txt('3 × 0', 122, 307, 42);
    txt('≥', 447, 307, 42);
    txt('2 × 0', 626, 307, 42);
    const rejected = b === 5 && s.clock.elapsed >= s.clock.speechDuration;
    if (rejected) txt('ValueError: examples must not be empty', 56, 393, 27, { color: c.red });
    footer(
      rejected
        ? 'The score function rejects an empty batch before division.'
        : 'Valid counts require 0 ≤ matches ≤ total and total > 0.',
    );
  }
}

export function testing(s) {
  const { c, b, cue, txt, label, line, rect, footer } = s;
  const vals = [7, true, null, [], {}],
    reports = testReport(vals);
  if (b === 0 || b === 4) {
    label('Parametrized prediction inputs', 53, 139);
    const restored = cue(4, 'Put the check back', 0);
    const removed = cue(4, 'Now remove just the string type check', 0) && !restored;
    const changedException = cue(4, 'Those five rejection tests fail', 0);
    const settled = s.clock.elapsed >= s.clock.speechDuration;
    const showType = removed ? changedException : !restored || settled;
    vals.forEach((v, i) => {
      const x = 50 + i * 176;
      s.paper(x, 177, 159, 150);
      const display = ['7', 'True', 'None', '[]', '{}'][i];
      txt(display, x + 79, 236, 33, { align: 'center' });
      if (showType)
        txt(removed ? 'AttributeError' : reports[i].type, x + 79, 288, 18, {
          align: 'center',
          color: removed ? c.red : c.accent,
          width: 143,
        });
    });
    if (b === 4 && restored && !settled)
      txt('Previous run: 5 failed   ·   5 passed', 52, 389, 30, { color: c.dim });
    if (settled) txt(b === 0 ? '10 collected' : '10 passed', 52, 389, 33, { color: c.accent });
    footer(
      removed
        ? changedException
          ? 'Without the type check, .strip() lookup raises the wrong exception.'
          : 'Try the five inputs with the type check removed.'
        : restored && !settled
          ? 'Run the same cases with the type check restored.'
          : 'Five calls use the same string contract with different invalid values.',
    );
  } else if (b === 1) {
    label('tmp_path / "bad.jsonl"', 52, 142);
    s.paper(51, 168, 855, 194);
    txt('01', 68, 224, 21, { color: c.dim });
    txt('(blank)', 126, 224, 23);
    txt('02', 68, 302, 21, { color: c.dim });
    txt('{"prompt":"Q","expected":"approved"}', 126, 302, 27, { width: 754 });
    footer('The temporary file has its own physical line numbers.');
  } else if (b < 4) {
    label('raw_line contains a numeric prediction', 53, 125);
    txt('with pytest.raises(TypeError, match=r"' + linePattern.source + '"):', 53, 166, 24, {
      width: 855,
    });
    txt('    parse_example(raw_line, line_number=n)', 53, 205, 24, { width: 855 });
    line(53, 238, 907, 238);
    const numbers = [20, 2];
    const judged = cue(3, 'Both calls raised', 0);
    numbers.forEach((n, i) => {
      const y = 285 + i * 88,
        r = parse(lineCases[1], n);
      const msg = r.message.slice(0, r.message.indexOf(':') + 1);
      txt('n = ' + n, 53, y, 21);
      label(r.type, 177, y);
      txt(msg, 270, y, 32, { color: c.ink });
      if (judged) {
        s.wire(492, y, 577, y);
        txt(linePattern.test(r.message) ? 'pattern matches' : 'pattern misses', 603, y, 24, {
          color: linePattern.test(r.message) ? c.accent : c.red,
        });
      }
    });
    footer(
      b === 2
        ? 'The class and the message pattern must both match.'
        : judged
          ? 'The colon after 2 rules out 20.'
          : 'Compare the character after 2 in each message.',
    );
  } else {
    label('Request IDs in local_rows', 53, 147);
    label('Request IDs on disk', 511, 147);
    s.paper(50, 172, 390, 177);
    s.paper(507, 172, 395, 177);
    rows.forEach(({ id }, i) => {
      const x = 565 + i * 125;
      txt(id, 123 + i * 125, 248, 28, { align: 'center' });
      if (omitted.some((r) => r.id === id)) txt(id, x, 248, 28, { align: 'center' });
      else line(x - 29, 259, x + 29, 259, c.red, 3, true);
    });
    txt('score_examples(local_rows)', 70, 312, 17, { width: 346 });
    txt('eval/access_requests.jsonl', 525, 312, 17, { width: 352 });
    footer('What would you change in the test to catch the missing request?');
  }
}

const reportColumns = [281, 455, 629];
const reportScoreX = 802;

function receipt(s, name, y, list, { open, showMiddle, showCounts, compareTotal = false }) {
  const { c, txt, label, line, paper, rect } = s;
  const result = score(list);
  const flags = decisions(list);
  paper(53, y, 850, 102);
  label(name, 72, y + 57);
  rows.forEach((row, i) => {
    const x = reportColumns[i];
    const middle = i === 1;
    const progress = middle ? Number(showMiddle) : open;
    const left = x - 73;
    const top = y + 32;
    if (progress < 1) {
      rect(left, top, 146, 51);
      const coverWidth = Math.round(146 * (1 - progress));
      if (coverWidth > 0) s.paint(left, top, coverWidth, 51, c.wash);
      return;
    }
    const index = list.findIndex((r) => r.id === row.id);
    const value = list[index];
    const tint = !value ? c.bg : !middle ? c.paper : flags[index] ? c.wash : c.rose;
    rect(left, top, 146, 51, tint);
    txt(value ? value.prediction.trim().toLowerCase() : 'row absent', x, y + 58, 20, {
      align: 'center',
      color: value ? c.ink : c.dim,
      width: 132,
    });
  });
  line(718, y + 27, 718, y + 92, c.line, 1, true);
  const percent = (100 * result.matches) / result.total;
  const reading = Number.isInteger(percent) ? percent + '%' : '≈' + percent.toFixed(1) + '%';
  txt(reading, reportScoreX, y + 47, 33, {
    face: 'serif',
    align: 'center',
  });
  if (showCounts) {
    txt(result.matches, reportScoreX - 23, y + 79, 23, { align: 'right' });
    txt('/', reportScoreX, y + 79, 23, { align: 'center', color: c.dim });
    txt(result.total, reportScoreX + 23, y + 79, 23, { color: compareTotal ? c.gold : c.ink });
  }
}

export function perfect(s) {
  const { b, c, cue, txt, label, line, footer } = s;
  if (b === 0) {
    label('Original fixture   ·   expected label above saved prediction', 52, 144);
    rows.forEach((r, i) => s.slip(r, 68 + i * 291, 175, 241, 166));
    const r = score(rows);
    const counted = cue(0, 'Our floor compares', 0);
    const judged = cue(0, 'Suppose a report', 0);
    if (counted) {
      const reading = judged ? r.ratio + '    ·    ' + r.earned + ' ≥ ' + r.required : r.ratio;
      txt(reading, 480, 392, 39, { align: 'center', face: 'serif' });
    }
    footer('What evidence would establish a corrected prediction?');
  } else if (b === 4) {
    const loaded = cue(4, 'Load that path') > 0;
    const scored = cue(4, 'Score the returned rows', 0);
    const compared = cue(4, 'Compare those counts', 0);
    const failed = cue(4, 'B supplied two matches', 0);
    label('Count test', 54, 138);
    label('path_b   ·   file from run B', 660, 138);
    s.rect(52, 161, 567, 259, c.paper);
    s.paper(651, 161, 253, 143);
    fileB.forEach((row, i) => txt(row.prompt, 665, 211 + i * 54, 18, { width: 222 }));
    const assertion =
      'assert (matches, total) == (' +
      countTestBaseline.matches +
      ', ' +
      countTestBaseline.total +
      ')';
    if (!loaded) {
      txt('matches, total, _ = score_examples(local_rows)', 65, 231, 21, { width: 540 });
      txt(assertion, 65, 311, 21);
    } else {
      txt('loaded_rows = load_examples(path_b)', 65, 210, 22, { width: 540 });
      s.wire(620, 210, 642, 210);
      if (scored)
        txt('matches, total, _ = score_examples(loaded_rows)', 65, 267, 21, { width: 540 });
      if (compared) txt(assertion, 65, 325, 22, { width: 540 });
      if (failed) {
        line(65, 355, 606, 355);
        txt('AssertionError', 65, 388, 24, { color: c.red });
      }
    }
    if (compared) {
      label('Observed (matches, total)', 655, 346);
      txt('(' + countTestFileB.matches + ', ' + countTestFileB.total + ')', 655, 392, 35, {
        color: c.accent,
      });
    }
    footer(
      failed
        ? 'The baseline expected ' +
            countTestBaseline.total +
            ' rows. File B supplied ' +
            countTestFileB.total +
            '.'
        : 'Which data reaches score_examples in this test?',
    );
  } else {
    const open = cue(3, 'Open both strips', 0.65);
    const compareBaseline = b === 5;
    const compareTotal = cue(5, 'while the total fell', 0) > 0;
    function after(phrase) {
      if (b !== 3) return b > 3;
      const { start, end } = s.clock.wordCue(phrase);
      return s.clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    }
    if (open === 1) {
      label('Request ID', 72, 139);
      rows.forEach(({ id }, i) =>
        txt(id, reportColumns[i], 139, 23, {
          align: 'center',
          color: i === 1 ? c.gold : c.dim,
        }),
      );
      label('Score', reportScoreX, 139, { align: 'center' });
      line(reportColumns[1], 263, reportColumns[1], 278, c.gold, 2);
    }
    receipt(s, compareBaseline ? 'BASELINE' : 'RUN A', 159, compareBaseline ? rows : corrected, {
      open,
      showMiddle: after('In run A the middle column holds blocked'),
      showCounts: after('All three requests match'),
      compareTotal,
    });
    receipt(s, 'RUN B', 280, omitted, {
      open,
      showMiddle: after('In run B the slot for one hundred two is empty'),
      showCounts: after('Two out of two'),
      compareTotal,
    });
    const showDiff = cue(5, 'Open the input diff') > 0;
    if (showDiff) {
      line(reportColumns[1], 383, reportColumns[1], 398, c.gold, 2);
      s.paint(52, 399, 850, 36, c.rose);
      txt('−  {"prompt":"Access request 102 status?", "expected":"blocked", …}', 65, 418, 19, {
        width: 825,
        color: c.red,
      });
    }
    footer(
      open < 1
        ? 'Both reports say 100%. Which file contains the corrected answer?'
        : showDiff
          ? 'git diff -- eval/access_requests.jsonl'
          : compareBaseline
            ? 'Run B has the same number of matches and fewer requests.'
            : 'Compare the middle column, then count the requests in each run.',
    );
  }
}

export function finalFile(s) {
  const { c, b, cue, label, txt, line, rect, footer } = s;
  const fixed = cue(2, 'Restore that word to the file') === 1;
  const list = fixed ? repaired : practice;
  const result = practiceLoad(list),
    flags = fixed ? decisions(result.returned) : [];
  const showFlags =
    b >= 3 ||
    (b === 2 &&
      cue(2, 'compare the labels in order', 0.36, 'Now the scorer can compare the labels') === 1);
  const countSpoken = cue(4, 'Three matches out of five') > 0,
    gateSpoken = cue(4, 'The two thirds gate fails') > 0;
  const printed = countSpoken && cue(4, 'That score goes to standard output') > 0;
  const gate = gateSpoken && (b > 4 || s.clock.elapsed >= s.clock.speechDuration);
  const marks = cue(6, 'both had usable labels') > 0;
  function calculationComplete(phrase) {
    if (b !== 4) return b > 4;
    const { start, end } = s.clock.wordCue(phrase);
    return s.clock.reveal(phrase, end - start, { captionStart: false }) === 1;
  }
  if (b === 7) {
    label('One array entry per request', 51, 147);
    repaired.forEach((r, i) => {
      const x = 57 + i * 174;
      label('request ' + r.id, x + 70, 198, { align: 'center' });
      line(x + 70, 220, x + 70, 257, c.line, 1, true);
      s.chip(
        bool(flags[i]),
        x,
        267,
        141,
        flags[i] ? c.accent : c.red,
        flags[i] ? c.wash : c.rose,
        74,
      );
      txt('[' + i + ']', x + 70, 381, 23, { align: 'center', color: c.dim });
    });
    footer('Axis 0 follows request order. Positions 1 and 4 trace to requests 502 and 505.');
    return;
  }
  label('requests.jsonl', 44, 132);
  label('line', 49, 164);
  label('ID', 87, 164);
  label('expected', 167, 164);
  label('prediction', 309, 164);
  s.paper(42, 178, 451, 250);
  txt('1  (blank)', 53, 213, 17, { color: c.dim });
  list.forEach((r, i) => {
    const y = 251 + i * 37,
      emph = (marks && !flags[i]) || (!fixed && i === 4 && b >= 1);
    if (emph) s.paint(48, y - 15, 438, 30, marks ? c.rose : c.wash);
    txt(i + 2, 55, y, 17, { color: c.dim });
    txt(r.id, 87, y, 21);
    txt(quoted(r.expected), 165, y, 18, { width: 132 });
    txt(quoted(r.prediction), 310, y, 18, { width: 171 });
  });
  const x = 535;
  if (b < 2) {
    label('load_examples(path)', x, 147);
    txt('accepted request IDs', x, 194, 19, { color: c.dim });
    const accepted =
      b === 1
        ? result.accepted.length
        : Math.floor(cue(0, 'Watch the loader take', 1.8) * result.accepted.length);
    txt(
      '[' +
        practice
          .slice(0, accepted)
          .map((r) => r.id)
          .join(', ') +
        ']',
      x,
      235,
      21,
      { width: 365 },
    );
    const error = cue(1, 'Look at those four IDs') > 0;
    if (error) {
      txt(result.error.type + ' · line ' + result.error.line, x, 289, 27, { color: c.red });
      txt('prediction must be a string', x, 324, 18, { width: 364 });
    }
    line(x, 350, 909, 350);
    label('stdout', x, 374);
    if (b === 1 && cue(1, 'Where would you look', 0)) txt('(empty)', x, 409, 20);
  } else if (b === 2 && !showFlags) {
    label('Producer log  /  505', x, 147);
    s.paper(x, 175, 368, 136);
    txt('saved prediction', x + 14, 226, 19);
    txt('"open"', x + 14, 273, 31, { color: c.accent });
    if (fixed) txt('reload all five', x, 370, 24);
  } else {
    label('score_examples   ·   in file order', x, 148);
    flags.forEach((v, i) => {
      const xx = x + i * 75;
      if (showFlags) {
        txt(list[i].id, xx, 201, 16, { color: c.dim });
        txt(bool(v), xx, 233, 19, { color: v ? c.accent : c.red });
      }
    });
    line(x, 266, 911, 266);
    label('stdout', x, 288);
    if (printed) {
      const r = score(list);
      txt('Eval rows: ' + r.total, x, 314, 17);
      txt(r.display + ' (' + r.ratio + ')', x, 344, 27);
    }
    label('stderr', x, 380);
    if (gate) {
      txt('Gate failed: score regressed below 2/3', x, 408, 17, { color: c.red, width: 377 });
      if (cue(5, 'Compare that with the first run', 0))
        label('exit 1', 899, 380, { align: 'right', color: c.red });
    }
  }
  if ((b === 4 || b === 5) && calculationComplete('triple the matches')) {
    const equation = { color: c.accent, weight: 600 };
    txt('3 × 3 = 9', 42, noteY, 21, equation);
    if (calculationComplete('double the total')) txt('2 × 5 = 10', 210, noteY, 21, equation);
    if (calculationComplete('Nine is one short of ten')) txt('<', 171, noteY, 21, equation);
    return;
  }
  const foot =
    b === 0
      ? 'What reaches standard output?'
      : b === 1
        ? cue(1, 'Where would you look', 0)
          ? 'The loader stopped before returning the accepted prefix.'
          : 'Validate prediction on physical line 6.'
        : b === 3 || (b === 2 && showFlags)
          ? 'Accuracy floor: 2/3. Predict the receipt before it prints.'
          : b === 2
            ? fixed
              ? 'Reload all five requests from the repaired file.'
              : 'Repair from the producer’s saved answer. Keep expected = "blocked".'
            : b === 6
              ? 'Inspect the mismatches at their original request IDs.'
              : 'Each valid decision has one position.';
  footer(foot);
}
