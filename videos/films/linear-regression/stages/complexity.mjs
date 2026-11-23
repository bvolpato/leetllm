import { data } from '../fixtures.mjs';
import { bendFrame, bendInput, predict } from '../model.mjs';
import { finished } from '../construction.mjs';
import { target, text } from '../defaults.mjs';

const number = (v) => Number(v.toFixed(2)).toString().replace('-', '−');
const signed = (v) => (v > 0 ? '+' : '') + number(v);

export function drawComplexity(ctx, scene, state, api) {
  const { C } = api;
  const frame = bendFrame(state);
  const lessonBeat = state.beat ?? 0;
  const regularizing = lessonBeat === 1;
  const asking = state.cues?.['half-question']
    ? state.cues['half-question'].phase !== 'before'
    : (state.beatP ?? 0) > 0.85;
  const ridgeDone = regularizing && finished(state, 'curve-ridge', 0.5);
  const lassoDone = regularizing && finished(state, 'curve-lasso', 0.82);
  const lasso = frame.penalty === 'Lasso';
  const rulerX = (correction) => 1235 + correction * 64;
  const xs = [...data.map((row) => row.x), 6];
  const yAt = (i) => 383 + i * 80 + (i === data.length ? 36 : 0);

  text(ctx, api, 'Tokens', 205, 282, 30, C.muted, 'center');
  text(ctx, api, 'Line (ms)', 425, 282, 30, C.cyan, 'center');
  text(ctx, api, 'Bend input', 634, 282, 30, C.muted, 'center');
  text(ctx, api, 'Correction to the line (ms)', 1135, 246, 34, C.ink, 'center');
  text(ctx, api, 'Forecast (ms)', 1635, 282, 30, C.pink, 'center');

  for (const tick of [-8, -4, 0, 2]) {
    const x = rulerX(tick);
    api.line(ctx, x, 326, x, yAt(5) + 23, tick === 0 ? C.muted : '#909dad35', tick === 0 ? 3 : 1);
    text(ctx, api, signed(tick), x, 307, 28, tick === 0 ? C.cyan : C.muted, 'center');
  }
  api.line(ctx, 130, yAt(4) + 56, 1760, yAt(4) + 56, C.muted, 1);

  xs.forEach((x, i) => {
    const testRow = i === data.length;
    const y = yAt(i),
      line = predict(x),
      forecast = frame.predict(x);
    text(
      ctx,
      api,
      String(x * 100),
      205,
      y + 13,
      testRow ? 44 : 36,
      testRow ? C.ink : C.muted,
      'center',
    );
    text(ctx, api, number(line), 425, y + 13, 37, C.cyan, 'center');
    text(ctx, api, signed(bendInput(x)), 634, y + 13, 35, C.ink, 'center');
    if (!testRow) {
      const residual = data[i].y - line;
      api.circle(ctx, rulerX(residual), y, 17, C.bg, C.yellow, 4);
    }
    target(ctx, api, testRow ? 'sixth-correction' : 'curved-fit', () => {
      const end = rulerX(forecast - line);
      api.line(ctx, rulerX(0), y, end, y, C.pink, testRow ? 8 : 5);
      api.circle(ctx, end, y, testRow ? 14 : 9, C.pink);
      // Keep the result of the revised forecast covered until its measured clause ends.
      const moving = regularizing && (lasso ? !lassoDone : frame.lambda > 0 && !ridgeDone);
      const label = testRow && moving ? '220 + 7 × c' : number(forecast);
      text(ctx, api, label, 1635, y + 13, testRow ? 42 : 34, C.pink, 'center');
    });
  });
  const penalty = regularizing ? frame.penalty + '   λ = ' + number(frame.lambda) + '      ' : '';
  text(ctx, api, penalty + 'c = ' + number(frame.coefficient), 455, 934, 38, C.pink, 'center');
  text(
    ctx,
    api,
    'Training MSE  ' + number(frame.trainingMse) + ' ms²',
    1415,
    934,
    36,
    C.ink,
    'center',
  );
  if (!regularizing && asking) {
    text(
      ctx,
      api,
      'At 600 tokens, where would half the correction put the forecast?',
      960,
      1030,
      35,
      C.ink,
      'center',
    );
  } else {
    text(ctx, api, 'Bend input = (x − 3)² − 2', 445, 1024, 30, C.muted, 'center');
    api.circle(ctx, 1075, 1013, 12, C.bg, C.yellow, 3);
    text(ctx, api, 'observed minus line', 1103, 1024, 30, C.yellow);
  }
}

export default {
  id: 'complexity',
  draw: drawComplexity,
  cues: ['curve-fit', 'half-question', 'curve-ridge', 'curve-lasso'],
};
