import { matchedPairs } from '../fixtures.mjs';
import { auditBoard, isAuto, wordings, wordingColor, wordingLabel } from '../audit-board.mjs';

function definition(b, state) {
  const { C, text, rect, focus, started } = b;
  const question = started('empty-selected')
    ? 'empty'
    : state.beat === 1
      ? 'precision'
      : started('odds')
        ? 'odds'
        : started('opportunity')
          ? 'opportunity'
          : 'selection';
  const questions = {
    selection: 'Selection parity   /   Who gets service out of everyone?',
    opportunity: 'Equal opportunity   /   Who gets service among ready claims?',
    odds: 'Equalized odds   /   Compare the ready and unclear rows separately.',
    precision: 'Predictive parity   /   Who was ready among those served?',
    empty: 'If everyone goes to review, how many selected claims remain?',
  };
  focus('metrics', () => {
    text(questions[question], 110, 288, 41);
    wordings.forEach((key, j) => {
      const y = 448 + j * 238,
        color = wordingColor(C, key);
      text(wordingLabel(key), 112, y + 38, 34, color);
      const selected = (row) => isAuto(row[key]);
      const all = matchedPairs;
      const included =
        question === 'empty'
          ? []
          : all.filter((row) =>
              question === 'precision'
                ? selected(row)
                : question === 'opportunity'
                  ? row.ready
                  : true,
            );
      all.forEach((row, i) => {
        const x = 453 + i * 110 + (row.ready ? 0 : 38);
        const inside = included.includes(row);
        const positive = question === 'precision' ? row.ready : selected(row);
        const tone = inside ? color : '#5b606b';
        rect(x, y - 18, 89, 83, inside && positive ? color : C.panel, tone);
        text(row.id, x + 44, y + 38, 36, inside && positive ? C.bg : tone, 'center');
      });
      const fraction = (cases) => cases.filter(selected).length + ' / ' + cases.length;
      const value =
        question === 'empty'
          ? '0 selected   ·   precision undefined'
          : question === 'odds'
            ? 'Ready  ' +
              fraction(all.filter((r) => r.ready)) +
              '     Unclear  ' +
              fraction(all.filter((r) => !r.ready))
            : question === 'precision'
              ? included.filter((r) => r.ready).length +
                ' / ' +
                included.length +
                ' selected were ready'
              : fraction(included) + ' received automatic service';
      text(value, 453, y + 128, 36, color);
    });
    text(
      question === 'precision'
        ? 'Filled tickets = ready among the selected cases'
        : question === 'empty'
          ? 'A rate needs cases in its denominator.'
          : 'Filled tickets = automatic service',
      960,
      989,
      34,
      C.muted,
      'center',
    );
  });
}

function populations(b, state) {
  const { C, text, rect, focus, progress, started } = b;
  const fpr = started('remove-false') ? 0 : 0.2;
  focus('populations', () => {
    text(
      'Serve 80% of ready claims     ·     Serve ' + Math.round(100 * fpr) + '% of unclear claims',
      960,
      254,
      40,
      C.yellow,
      'center',
    );
    [50, 20].forEach((ready, j) => {
      const left = 200 + j * 880,
        y = 411,
        tp = ready * 0.8,
        fp = (100 - ready) * fpr;
      const active = j === 0 || state.beat >= 3;
      const reveal = j === 0 ? progress('admit-a') : progress('admit-b');
      text(
        'Group ' + (j ? 'B' : 'A') + '   ·   ' + (active ? ready + ' of 100 ready' : '100 claims'),
        left,
        343,
        37,
      );
      for (let i = 0; i < 100; i++) {
        const isReady = i < ready,
          selected = isReady ? i < tp : i - ready < fp;
        const color = !active ? C.muted : isReady ? C.blue : C.pink;
        const show = i < Math.round(reveal * 100) && selected;
        rect(
          left + (i % 10) * 55,
          y + Math.floor(i / 10) * 36,
          44,
          24,
          show ? color : C.panel,
          color,
          3,
        );
      }
      if (active && reveal >= 1) {
        text(tp + ' ready + ' + fp + ' unclear selected', left, 855, 35);
        text(
          tp + ' / ' + (tp + fp) + '  =  ' + ((100 * tp) / (tp + fp)).toFixed(0) + '% precision',
          left,
          922,
          42,
          C.green,
        );
      }
    });
    text(
      'Blue = ready     ·     Pink = unclear     ·     Filled = selected',
      960,
      1011,
      32,
      C.muted,
      'center',
    );
  });
}

function means(b) {
  const { C, text, line, dot, focus, started, after, progress } = b;
  const scoreSets = [
      [0.4, 0.8],
      [0.5, 0.7],
    ],
    cutoff = 0.75;
  const x = (s) => 420 + (s - 0.3) * 2070;
  focus('means', () => {
    text('Scores of ready claims', 115, 278, 43);
    const cut = started('score-cut');
    const reveal = after('score-result');
    if (cut) {
      line(x(cutoff), 382, x(cutoff), 382 + 387 * progress('score-cut'), C.yellow, 4);
      text('Cutoff 0.75', x(cutoff), 349, 33, C.yellow, 'center');
    }
    scoreSets.forEach((scores, j) => {
      const y = 480 + 225 * j,
        color = j ? C.pink : C.blue;
      text('Group ' + (j ? 'B' : 'A'), 128, y + 14, 38, color);
      line(x(0.3), y, x(0.83), y, C.muted);
      for (const score of scores) {
        dot(x(score), y, reveal && isAuto(score, cutoff) ? 20 : 12, color);
        text(score.toFixed(1), x(score), y - 31, 37, color, 'center');
      }
      const mean = (scores[0] + scores[1]) / 2;
      if (started('score-means')) {
        line(x(mean), y - 16, x(mean), y + 16, C.ink, 4);
        text('mean ' + mean.toFixed(1), x(mean), y + 73, 36, C.ink, 'center');
      }
      if (reveal)
        text(
          scores.filter((s) => isAuto(s, cutoff)).length + ' / 2 served',
          1780,
          y + 14,
          34,
          color,
          'right',
        );
    });
    text(
      reveal
        ? 'Equal average scores can send different numbers of ready claims to service.'
        : cut
          ? 'Which scores earn automatic service?'
          : 'Find the midpoint of each pair.',
      960,
      975,
      35,
      C.muted,
      'center',
    );
  });
}

function theorem(b) {
  const { C, text, line, rect, focus, started, after } = b;
  focus('conditions', () => {
    if (started('paired-base-rates')) {
      text('Back to the matched requests', 112, 280, 48);
      wordings.forEach((key, j) => {
        const y = 425 + j * 205,
          color = wordingColor(C, key);
        text(wordingLabel(key), 112, y + 47, 40, color);
        matchedPairs.forEach((row, i) => {
          const left = 486 + i * 94;
          rect(left, y, 76, 69, row.ready ? color : C.panel, color);
          text(row.id, left + 38, y + 46, 29, row.ready ? C.bg : color, 'center');
        });
        const ready = matchedPairs.filter((row) => row.ready).length;
        text(ready + ' of ' + matchedPairs.length + ' ready', 1480, y + 47, 39, color);
      });
      text(
        'Each claim keeps its readiness label when the wording changes.',
        960,
        930,
        40,
        C.ink,
        'center',
      );
      return;
    }
    text('What the score theorem requires', 112, 280, 49);
    text('Among ready claims', 112, 418, 41);
    text('Equal mean score across groups', 782, 418, 44, C.blue);
    line(112, 461, 1786, 461, C.muted, 2);
    if (started('class-means')) {
      text('Among unclear claims', 112, 555, 41);
      text('Equal mean score across groups', 782, 555, 44, C.blue);
    }
    if (started('calibration')) {
      line(112, 602, 1786, 602, C.muted, 2);
      text('Within each group', 112, 700, 41);
      text('Scores calibrated to readiness', 782, 700, 44, C.yellow);
    }
    if (after('theorem-result'))
      text('Equal readiness shares or perfect prediction', 960, 925, 51, C.ink, 'center');
  });
}

export function drawMetricTradeoffs(ctx, scene, state, api) {
  const b = auditBoard(ctx, scene, state, api);
  if (state.beat < 2) definition(b, state);
  else if (state.beat < 5) populations(b, state);
  else if (state.beat < 7) means(b);
  else theorem(b);
}
export default { id: 'metric-tradeoffs', draw: drawMetricTradeoffs };
