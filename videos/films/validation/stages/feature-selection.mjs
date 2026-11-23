import { SELECTOR } from '../fixtures.mjs';
import { fitSelector, selectorState } from '../model.mjs';
import { phraseProgress } from '../defaults.mjs';

function encodingExample(ctx, api, state) {
  const { C } = api;
  const crossFit = phraseProgress(state, api, 'cover-a-fold', 6, 0.48, 0.57) > 0;
  const revealed = phraseProgress(state, api, 'encoded-mean', 7, 0, 0.05) === 1;
  const categories = ['A', 'B', 'C', 'D'];
  const labels = SELECTOR.y.slice(0, 4);
  const otherFold = [1, 3];
  const average = otherFold.reduce((sum, i) => sum + labels[i], 0) / otherFold.length;

  api.text(ctx, 'Encode training row A', 145, 262, 41, C.ink);
  api.text(ctx, 'Each category occurs once', 145, 324, 31, C.muted);
  api.text(ctx, 'Category', 242, 428, 31, C.muted, 'center');
  api.text(ctx, 'Target', 507, 428, 31, C.muted, 'center');
  api.text(ctx, 'Inner fold', 753, 428, 31, C.muted, 'center');
  api.focus.target('encoding-rows', () => {
    for (const [i, category] of categories.entries()) {
      const y = 525 + i * 99;
      const inOtherFold = otherFold.includes(i);
      const contributes = crossFit ? inOtherFold : i === 0;
      const target = crossFit && !inOtherFold ? 'covered' : labels[i];
      api.rect(ctx, 145, y - 53, 710, 73, C.panel, contributes ? C.yellow : C.muted, 8);
      [category, target, inOtherFold ? '2' : '1'].forEach((v, j) =>
        api.text(ctx, v, [242, 507, 753][j], y, 37, contributes ? C.yellow : C.muted, 'center'),
      );
    }
  });
  api.text(ctx, crossFit ? 'Encode from fold 2' : 'Look up A in its own row', 1010, 430, 44, C.ink);
  api.text(
    ctx,
    crossFit ? 'No row for A in fold 2' : 'A occurs once, with target 1.',
    1010,
    533,
    36,
    C.muted,
  );
  api.text(ctx, crossFit ? 'Fallback mean' : 'Category mean', 1010, 660, 32, C.blue);
  const sum = otherFold.map((i) => labels[i]).join(' + ');
  const value = crossFit
    ? '(' + sum + ') / ' + otherFold.length + ' = ' + (revealed ? average : '?')
    : '1 / 1 = ' + labels[0];
  api.focus.target('encoded-input', () => api.text(ctx, value, 1010, 755, 66, C.yellow));
  let note = 'A’s own outcome has become its input.';
  if (crossFit)
    note = revealed ? 'Training input for A  =  ' + average : 'What value goes into A’s input?';
  if (phraseProgress(state, api, 'held-out-mapping', 7, 0.85, 0.95) > 0)
    note = 'Held-out requests use the mapping fitted on training.';
  api.focus.target('mapping-note', () => api.text(ctx, note, 960, 981, 37, C.ink, 'center'));
}

export function drawFeatureSelection(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat >= 6) return encodingExample(ctx, api, state);

  const motion = beat < 3 ? 0 : beat > 3 ? 1 : api.phase(state.beatP ?? 0, 0, 0.4);
  const yOf = (i) => 417 + 64 * i + (i >= 4 ? 44 : 0);
  const bottom = api.lerp(yOf(3) + 11, yOf(7) + 11, motion);
  const fitCount = SELECTOR.y.filter((_, i) => yOf(i) <= bottom).length;
  const model = fitSelector(fitCount);
  const comparing = beat === 5;
  const training = selectorState();
  const leaky = selectorState(true);
  const header = ['Row', 'T', 'L', 'Label'];
  const col = [206, 412, 560, 710];
  api.text(ctx, 'Candidate features', 135, 256, 37, C.ink);
  header.forEach((v, i) => api.text(ctx, v, col[i], 340, 31, C.muted, 'center'));
  for (let i = 0; i < 8; i++) {
    const y = yOf(i);
    const row = i < 4 ? 'train ' + i : 'held ' + i;
    const highlight = comparing && (i === 5 || i === 6);
    if (highlight) api.rect(ctx, 122, y - 42, 659, 56, C.panel, C.pink, 6);
    [row, SELECTOR.T[i], SELECTOR.L[i], i < fitCount ? SELECTOR.y[i] : '?'].forEach((v, j) =>
      api.text(
        ctx,
        v,
        col[j],
        y,
        j === 0 ? 29 : 36,
        i < 4 ? C.blue : j === 3 && i >= fitCount ? C.muted : C.ink,
        'center',
      ),
    );
  }
  api.line(ctx, 128, 642, 782, 642, C.muted, 2);
  if (!comparing) {
    const right = 816;
    api.line(ctx, right, yOf(0) - 35, right, bottom, C.yellow, 5);
    api.line(ctx, right - 16, yOf(0) - 35, right, yOf(0) - 35, C.yellow, 5);
    api.line(ctx, right - 16, bottom, right, bottom, C.yellow, 5);
    api.text(ctx, fitCount + ' labeled rows enter selection', 970, 256, 38, C.ink);
    ['T', 'L'].forEach((name, k) => {
      const y = 384 + k * 220;
      api.text(ctx, name, 966, y + 54, 60, C.ink);
      const [zero, one] = model.classMeans[name];
      const classCount = (label) => SELECTOR.y.slice(0, fitCount).filter((v) => v === label).length;
      const fraction = (value, label) =>
        Math.round(value * classCount(label)) + '/' + classCount(label);
      api.text(ctx, 'class 1', 1136, y, 28, C.muted, 'center');
      api.text(ctx, 'class 0', 1375, y, 28, C.muted, 'center');
      api.text(ctx, 'gap', 1635, y, 28, C.muted, 'center');
      for (const [j, value] of [
        fraction(one, 1),
        '−',
        fraction(zero, 0),
        '=',
        beat ? model.gaps[name].toFixed(2) : '?',
      ].entries()) {
        api.text(
          ctx,
          value,
          [1136, 1255, 1375, 1496, 1635][j],
          y + 75,
          49,
          j === 4 ? C.yellow : C.ink,
          'center',
        );
      }
      api.rect(ctx, 1060, y + 109, 655, 18, C.panel, C.muted, 3);
      if (beat > 0 && model.gaps[name] > 0)
        api.rect(ctx, 1060, y + 109, 655 * model.gaps[name], 18, C.blue, undefined, 3);
    });
    const choice =
      beat === 2 || beat === 4 ? 'Use feature ' + model.selected : 'Which column would you keep?';
    api.text(ctx, choice, 1380, 925, 48, C.yellow, 'center');
  } else {
    api.text(ctx, 'Both classifiers fit rows 0–3', 954, 256, 38, C.ink);
    const xs = [1005, 1262, 1500, 1743];
    ['Row', 'Using T', 'Using L', 'Audit'].forEach((v, i) => {
      const paint = () => api.text(ctx, v, xs[i], 380, 32, C.muted, 'center');
      if (i === 1 || i === 2) api.focus.target(i === 1 ? 't-predictions' : 'l-predictions', paint);
      else paint();
    });
    api.text(ctx, 'Means for 0, 1', xs[0], 440, 24, C.muted, 'center');
    [training, leaky].forEach((m, i) =>
      api.text(ctx, m.mu.join(', '), xs[i + 1], 440, 29, C.ink, 'center'),
    );
    for (let i = 0; i < 4; i++) {
      const y = 550 + i * 82;
      const truth = SELECTOR.y[i + 4];
      api.text(ctx, 'held ' + (i + 4), xs[0], y, 39, C.ink, 'center');
      api.text(ctx, truth, xs[3], y, 39, C.ink, 'center');
      [training, leaky].forEach((m, j) => {
        const id = j === 0 ? 't-predictions' : 'l-predictions';
        const shown = phraseProgress(state, api, id, 5, j ? 0.42 : 0.15, j ? 0.5 : 0.24) > 0;
        api.focus.target(id, () =>
          api.text(
            ctx,
            shown ? m.predictions[i] : '?',
            xs[j + 1],
            y,
            39,
            shown && m.predictions[i] !== truth ? C.pink : C.ink,
            'center',
          ),
        );
      });
    }
    api.line(ctx, 938, 832, 1810, 832, C.muted, 2);
    api.text(ctx, 'Correct', xs[0], 915, 30, C.muted, 'center');
    [training, leaky].forEach((m, i) => {
      const id = i === 0 ? 't-correct' : 'l-correct';
      const shown = phraseProgress(state, api, id, 5, i ? 0.5 : 0.68, i ? 0.62 : 0.74) >= 1;
      api.focus.target(id, () =>
        api.text(
          ctx,
          shown ? m.correct + ' / 4' : '? / 4',
          xs[i + 1],
          915,
          47,
          i === 0 ? C.blue : C.yellow,
          'center',
        ),
      );
    });
  }
}

export default {
  id: 'feature-selection',
  draw: drawFeatureSelection,
  cues: [
    't-predictions',
    'l-predictions',
    't-correct',
    'l-correct',
    'cover-a-fold',
    'encoded-mean',
    'held-out-mapping',
  ],
};
