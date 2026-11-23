import { semanticSampleStats } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

function drawRecoveryTimes(ctx, state, api) {
  const { C, left, text, footer } = incidentSheet(ctx, api);
  const group = phraseProgress(state, api, 'time-group', 2, 0, 0.38);
  const entropy = phraseProgress(state, api, 'meaning-entropy-b2', 2, 0.38, 0.76);
  const cue = (id, from, to) => phraseProgress(state, api, id, 3, from, to);
  const separate = cue('spelling-groups', 0, 0.085);
  const merge = cue('merge-pairs', 0.6, 0.69);
  const spread = separate * (1 - merge);
  const spellings = ['14:30 UTC', '2:30 PM UTC'];
  const answers = [spellings[0], spellings[1], spellings[0], spellings[1]];
  const byMeaning = semanticSampleStats(answers.map(() => spellings[0]));
  const bySpelling = semanticSampleStats(answers);
  const asPairs = spread === 1;
  const useSpelling = separate > 0 && merge === 0;
  const possibleRun = phraseProgress(state, api, 'meaning-entropy-b3', 4, 0.79, 0.99);

  text('Sampled answer', left, 300, 43, C.ink, 'left', 'serif');
  text(
    useSpelling ? 'Grouped by spelling' : 'Grouped by meaning',
    950,
    300,
    43,
    C.ink,
    'left',
    'serif',
  );
  if (group === 1) text('Share of samples', 1475, 300, 32, C.muted);
  api.line(ctx, left, 333, 1785, 333, C.muted, 2);

  const pairRows = [435, 655];
  const singleRow = 545;
  if (group === 1 && (spread === 0 || asPairs)) {
    const labels = asPairs ? spellings : [spellings[0]];
    const stats = asPairs ? bySpelling : byMeaning;
    labels.forEach((label, i) => {
      const y = asPairs ? pairRows[i] : singleRow;
      text(label, 950, y, 43);
      text(
        stats.counts[i] + '/' + answers.length + ' = ' + stats.masses[i].toFixed(2),
        1475,
        y,
        36,
        C.blue,
      );
    });
  }
  answers.forEach((answer, i) => {
    const row = 418 + i * 94;
    const pair = spellings.indexOf(answer);
    const rank = answers.slice(0, i).filter((value) => value === answer).length;
    const groupX = api.lerp(980 + i * 83, 980 + rank * 83, spread);
    const groupY = api.lerp(singleRow, pairRows[pair], spread) + 62;
    text(String(i + 1), left, row, 30, C.muted);
    text(answer, left + 65, row, 40);
    const x = api.lerp(615, groupX, group);
    const y = api.lerp(row - 13, groupY, group);
    api.circle(ctx, x, y, 24, C.panel, group === 0 ? C.muted : C.blue, 3);
    text(String(i + 1), x, y + 11, 29, C.ink, 'center');
  });
  if (asPairs) {
    const forward = cue('forward-time', 0.3, 0.51);
    const reverse = cue('reverse-time', 0.51, 0.6);
    if (forward > 0) api.arrow(ctx, 1145, 451, 1145, api.lerp(451, 608, forward), C.cyan, 7);
    if (reverse > 0) api.arrow(ctx, 1190, 608, 1190, api.lerp(608, 451, reverse), C.cyan, 7);
  }
  if (possibleRun > 0) {
    api.line(ctx, left, 755, 660, 755, C.muted, 2);
    text('5', left, 819, 30, C.muted);
    text('One more run?', left + 65, 819, 36, C.muted);
    api.circle(ctx, 615, 806, 24, C.panel, C.muted, 2);
    text('?', 615, 817, 29, C.muted, 'center');
  }
  if (group < 1) footer('How many different times did these four answers give?');
  else if (asPairs) footer('Two spellings of the same recovery time.');
  else if (spread > 0)
    footer(merge > 0 ? 'Group answers that imply each other.' : 'Sort the four votes by spelling.');
  else if (entropy < 1) footer('All four answers give the same time.');
  else footer('Observed meaning entropy:  −1 × ln(1) = ' + byMeaning.entropy + ' nats', C.green);
}

export function drawMeaningEntropy(ctx, scene, state, api) {
  if (state.beat >= 1) return drawRecoveryTimes(ctx, state, api);
  const { C, left, text, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const labels = ['investigating', 'investigating', 'mitigated', 'resolved'];
  const meanings = [...new Set(labels)];
  const stats = semanticSampleStats(labels);
  const group = cue('meaning-entropy-b1', 0);
  const mass = cue('meaning-masses', 0) === 1;
  const terms = cue('meaning-terms', 0) === 1;
  const entropy = cue('meaning-sum', 0) === 1;
  const disagrees = cue('meaning-disagreement-result', 0) === 1;
  text('Sampled answer', left, 300, 43, C.ink, 'left', 'serif');
  text('Meaning', 950, 300, 43, C.ink, 'left', 'serif');
  text('Empirical mass', 1475, 300, 32, C.muted);
  api.line(ctx, left, 333, 1785, 333, C.muted, 2);

  const colors = [C.blue, C.cyan, C.yellow];
  meanings.forEach((label, i) => {
    const y = 422 + i * 179;
    text(label, 950, y, 43);
    if (mass) text(stats.counts[i] + '/4 = ' + stats.masses[i].toFixed(2), 1475, y, 36, C.blue);
    if (terms) {
      const p = stats.masses[i];
      text(
        '−' + p + ' ln(' + p + ') ≈ ' + (-p * Math.log(p)).toFixed(3),
        1160,
        y + 69,
        31,
        C.muted,
      );
    }
  });
  labels.forEach((form, i) => {
    const initialY = 420 + i * 116;
    const groupIndex = meanings.indexOf(labels[i]);
    const rank = labels.slice(0, i).filter((l) => l === labels[i]).length;
    const toX = 980 + rank * 83,
      toY = 482 + groupIndex * 179;
    text(form, left + 65, initialY, 40);
    text(String(i + 1), left, initialY, 30, C.muted);
    const x = api.lerp(615, toX, group);
    const y = api.lerp(initialY - 13, toY, group);
    api.circle(ctx, x, y, 24, C.panel, group === 0 ? C.muted : colors[groupIndex], 3);
    text(String(i + 1), x, y + 11, 29, C.ink, 'center');
  });
  if (entropy)
    footer(
      'Observed meaning entropy: ' +
        stats.entropy.toFixed(3) +
        ' nats' +
        (disagrees ? '       Disagreement: 1 − 2/4 = ' + stats.disagreement.toFixed(2) : ''),
      C.green,
    );
  else footer('Put answers with the same meaning in the same group.');
}

export default {
  id: 'meaning-entropy',
  draw: drawMeaningEntropy,
  cues: [
    'meaning-entropy-b1',
    'meaning-masses',
    'meaning-terms',
    'meaning-sum',
    'meaning-disagreement-result',
    'time-group',
    'meaning-entropy-b2',
    'spelling-groups',
    'forward-time',
    'reverse-time',
    'merge-pairs',
    'meaning-entropy-b3',
  ],
};
