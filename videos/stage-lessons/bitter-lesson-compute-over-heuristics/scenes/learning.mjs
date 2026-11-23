import { place, row, column, barChart, assertEqual } from 'vizmatic/stage';
import { heading, note, label, chip, tint } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';
import {
  learningStates,
  scoreWords,
} from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import {
  baselineCases,
  trainingCases,
} from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';

export default function learning(s, c) {
  const base = learningStates(0);
  const corrected = learningStates(2);
  const [sourceBand, inputBand, chartBand, outcomeBand] = BODY.rows([1.2, 1.3, 2.7, 0.8], 'wide');
  const source = (words) =>
    place(
      column(
        [note('Labeled training data', { size: 33 }), label(words, { color: 'green', size: 43 })],
        { gap: 'tight' },
      ),
      sourceBand,
    );
  const trainingRow = (entry) => source(entry.text + '  →  ' + entry.label);
  const qualitySource = trainingRow(trainingCases[2]);
  const latencySource = trainingRow(trainingCases[1]);
  const originalSet = source('Six reviewed reports');
  const correction = trainingRow(base.correction);
  const tieEvidence = source('timeout  →  latency     ·     password  →  access');
  const report = (words, name = 'Incoming report') => {
    const chips = words.split(' ').map((word) => chip(word, { size: 41, color: 'cyan' }));
    const strip = place(
      column([note(name, { size: 33 }), row(chips, { gap: 'normal' })], { gap: 'tight' }),
      inputBand,
    );
    return { strip, chips, words };
  };
  const quality = report('unsupported citation answer');
  const original = report(baselineCases[1].text, 'I-17');
  const unknown = report(base.correction.text);
  const fresh = report('pages arrive slowly', 'Fresh report');
  const tie = report('timeout password');
  const queues = ['latency', 'quality', 'access'];
  const [axis, plot] = chartBand.columns([1, 4], 'wide');
  const title = place(
    column([note('Word-count', { size: 37 }), note('score', { size: 37 })], { gap: 'tight' }),
    axis,
  );
  const config = {
    width: plot.width - 100,
    height: plot.height - 125,
    max: 4,
    showValues: true,
    labelSize: 40,
    format: (n) => n.toFixed(0),
  };
  const values = (counts) => queues.map((q) => counts[q]);
  const bars = (scores) =>
    barChart(
      queues.map((q, i) => ({ label: q, value: scores[i], color: 'blue' })),
      config,
    );
  const frame = place(bars([4, 4, 4]), plot);
  const chart = bars([0, 0, 0]).at(frame.get('x'), frame.get('y'));
  const update = (scores) => chart.update(values(scores), { duration: 0.4 });
  const blank = { latency: 0, quality: 0, access: 0 };
  const decision = (text, color) => place(label(text, { size: 44, color }), outcomeBand);
  const route = (test, counts) => {
    const value = scoreWords(test.words, counts).route;
    return decision(value.replace('_', ' '), value === 'manual_review' ? 'yellow' : 'green');
  };
  const qualityWins = route(quality, base.counts);
  const originalWins = route(original, base.counts);
  const review = route(unknown, base.counts);
  const correctedWins = route(unknown, corrected.counts);
  const freshRoute = route(fresh, corrected.counts);
  const tiedRoute = route(tie, corrected.counts);
  const predict = decision('Where should this report go?', 'yellow');
  assertEqual(values(base.before.scores), [0, 0, 0], 'unseen report before review');
  assertEqual(values(base.after.scores), [4, 0, 0], 'same report after review');
  assertEqual(
    values(scoreWords(fresh.words, corrected.counts).scores),
    [1, 0, 0],
    'one word transfers',
  );
  assertEqual(values(scoreWords(tie.words, corrected.counts).scores), [1, 0, 1], 'positive tie');

  s.add(heading(c.title), qualitySource, title, chart);
  c.show('quality-input', quality.strip);
  ['word-unsupported', 'word-citation', 'word-answer'].forEach((cue, i) => {
    const prefix = quality.words
      .split(' ')
      .slice(0, i + 1)
      .join(' ');
    c.on(cue, () =>
      s.play(tint(quality.chips[i], 'green'), update(scoreWords(prefix, base.counts).scores)),
    );
  });
  c.show('quality-route', qualityWins, { after: true });
  c.swap('opening-report', [qualitySource, quality.strip], [latencySource, original.strip]);
  c.hide('opening-report', qualityWins);
  c.on('opening-report', () => s.play(update(blank)));
  c.on('token-match', () =>
    s.play(
      tint(original.chips[0], 'green'),
      update(scoreWords(original.words, base.counts).scores),
    ),
  );
  c.show('opening-route', originalWins, { after: true });
  c.swap('unseen-report', [latencySource, original.strip], [originalSet, unknown.strip]);
  c.hide('unseen-report', originalWins);
  c.on('unseen-report', () => s.play(update(base.before.scores)));
  c.show('no-evidence', review, { after: true });
  c.swap('reviewed-label', originalSet, correction);
  c.hide('reviewed-label', review);
  c.after('recount', () =>
    s.play(...unknown.chips.map((word) => tint(word, 'green')), update(base.after.scores)),
  );
  c.show('corrected-route', correctedWins, { after: true });
  c.swap('fresh-example', unknown.strip, fresh.strip);
  c.hide('fresh-example', correctedWins);
  c.on('fresh-example', () => s.play(update(blank)));
  c.show('predict-transfer', predict);
  c.after('one-match', () =>
    s.play(tint(fresh.chips[2], 'green'), update(scoreWords(fresh.words, corrected.counts).scores)),
  );
  c.swap('fresh-route', predict, freshRoute, { after: true });
  c.swap('conflict', [fresh.strip, correction], [tie.strip, tieEvidence]);
  c.hide('conflict', freshRoute);
  c.on('conflict', () => s.play(update(blank)));
  c.after('equal-evidence', () =>
    s.play(
      ...tie.chips.map((word) => tint(word, 'green')),
      update(scoreWords(tie.words, corrected.counts).scores),
    ),
  );
  c.show('tie-decision', tiedRoute, { after: true });
}
