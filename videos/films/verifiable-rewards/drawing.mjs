import { openingFields } from './capacity.mjs';

export function spokenProgress(api, state) {
  return (id, beat, start = 0.15, end = 0.7) => {
    const fallback =
      state.beat === beat ? api.phase(state.beatP, start, end) : Number(state.beat > beat);
    return api.focus.progress(id, fallback);
  };
}

export function signed(value, digits = 2) {
  return (value < 0 ? '−' : value > 0 ? '+' : '') + Math.abs(value).toFixed(digits);
}

export function drawSubmissions(
  ctx,
  api,
  { y, showRows, showSecond, scan = 0, readFirst = 0, leading = 'Submission' },
) {
  const { C } = api;
  const firstX = 595,
    nextX = 1035;
  for (let i = 0; i < 2; i++) {
    const row = y + i * 145;
    api.focus.target('submissions', () => {
      api.text(ctx, leading + (i ? ' B' : ' A'), 170, row, 38, C.ink);
      api.line(ctx, 170, row + 55, 1300, row + 55, C.muted, 1);
      if (showRows) {
        api.focus.target('first-boxes', () =>
          api.text(ctx, openingFields[i][0], firstX, row, 42, C.blue, 'center', 'mono'),
        );
        if (i && showSecond) {
          api.focus.target('second-box', () => {
            api.text(ctx, 'then', 808, row, 29, C.muted, 'center');
            api.text(ctx, openingFields[i][1], nextX, row, 42, C.blue, 'center', 'mono');
          });
        }
      }
    });
    api.focus.target('read-heads', () => {
      if (showRows && readFirst > 0) {
        const x = 390 + (firstX - 390) * readFirst + (i ? (nextX - firstX) * scan : 0);
        api.line(ctx, x - 70, row + 21, x + 70, row + 21, C.yellow, 5);
      }
    });
  }
}
