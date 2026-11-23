import { metrics } from '../arithmetic.mjs';
import { tokenTimes } from '../fixtures.mjs';
import { bracket, passage, scaleTime, spoken, tokenMark } from '../trace.mjs';

const m = metrics(0, tokenTimes);
const first = tokenTimes[0];
const last = tokenTimes.at(-1);
const later = m.gaps.length;

export function drawCadence(ctx, scene, state, api) {
  const { C } = api;
  const center = (label, y, size, color = C.ink) =>
    api.text(ctx, label, 960, y, size, color, 'center');
  api.focus.target('window', () => {
    if (state.beat === 4) {
      const gaps = [10, 100];
      const rates = gaps.map((t) => 1000 / t);
      const mean = (a) => (a[0] + a[1]) / 2;
      for (let i = 0; i < 2; i++) {
        const y = 375 + i * 205;
        api.text(ctx, 'Stream ' + (i + 1), 175, y, 40, C.ink);
        bracket(ctx, api, 510, 510 + 6 * gaps[i], y - 9, C.cyan, gaps[i] + ' ms', 32);
        api.text(ctx, rates[i] + ' tokens/s', 1450, y, 44, C.cyan, 'center');
      }
      center(
        spoken(state, 4, 'average-rates', 0.65)
          ? 'Mean request rate  =  (100 + 10) / 2  =  ' + mean(rates) + ' tokens/s'
          : 'Mean request rate  =  ?',
        830,
        44,
        C.yellow,
      );
      if (spoken(state, 4, 'invert-mean', 0.94))
        center(
          'Inverse of mean gap  =  1,000 / 55  ≈  ' + (1000 / mean(gaps)).toFixed(1) + ' tokens/s',
          941,
          36,
          C.muted,
        );
      return;
    }

    const zoom = passage(state, 3, 'extend-window', 0.04, 0.33);
    const start = first * (1 - zoom);
    const x = scaleTime(start, last, 240, 1695);
    const hand = first + (last - first) * passage(state, 0, 'stop-watch', 0.42, 0.62);
    const y = 475;
    center(
      zoom === 0
        ? 'Reply A   ·   first through fourth output   ·   server time in ms'
        : zoom === 1
          ? 'Reply A   ·   arrival through fourth output   ·   server time in ms'
          : 'Extending the window to server arrival',
      270,
      33,
      C.muted,
    );
    api.line(ctx, x(start), y, x(last), y, C.muted, 3);
    tokenTimes.forEach((t, i) => tokenMark(ctx, api, x(t), y, 'T' + (i + 1), t, C.cyan));
    if (zoom === 1) {
      api.line(ctx, x(0), y - 19, x(0), y + 18, C.yellow, 5);
      api.text(ctx, 'Arrival', x(0), y - 37, 32, C.yellow, 'center');
      api.text(ctx, '0', x(0), y + 58, 30, C.ink, 'center');
    }
    if (passage(state, 0, 'clip-watch', 0.03, 0.23) > 0) {
      bracket(ctx, api, x(start), x(hand), y - 108, C.yellow, '');
    }
    if (state.beat === 0) {
      center('How many new tokens arrive between the two ends of the stopwatch?', 815, 39);
      return;
    }
    if (zoom === 0) {
      const walk = passage(state, 1, 'walk-gaps', 0.05, 0.47) * later;
      m.gaps.forEach((gap, i) => {
        const p = Math.max(0, Math.min(1, walk - i));
        if (p > 0)
          bracket(
            ctx,
            api,
            x(tokenTimes[i]),
            x(tokenTimes[i] + p * gap),
            y + 125,
            C.cyan,
            p === 1 ? gap + ' ms' : '',
          );
      });
    }
    const span = last - first;
    if (state.beat === 1) {
      const count = spoken(state, 1, 'count-later', 0.05) ? later : '?';
      center('(' + last + ' − ' + first + ') ms  /  ' + count + ' later tokens', 815, 49);
      if (spoken(state, 1, 'mean-gap', 0.88))
        center('TPOT  =  ' + m.tpot + ' ms/token', 932, 52, C.yellow);
    } else if (state.beat === 2) {
      center(later + ' later tokens  /  ' + (span / 1000).toFixed(3) + ' s', 815, 49);
      if (spoken(state, 2, 'decode-rate', 0.58))
        center('Decode rate  ≈  ' + m.decodeTps.toFixed(1) + ' tokens/s', 932, 52, C.yellow);
    } else if (zoom === 1) {
      center(tokenTimes.length + ' output tokens  /  ' + (last / 1000).toFixed(3) + ' s', 815, 49);
      if (spoken(state, 3, 'full-rate', 0.73))
        center(
          'Full-request rate  ≈  ' + m.endToEndTps.toFixed(2) + ' tokens/s',
          932,
          52,
          C.yellow,
        );
    }
  });
}

export default {
  id: 'cadence',
  draw: drawCadence,
  cues: [
    'clip-watch',
    'stop-watch',
    'count-later',
    'walk-gaps',
    'mean-gap',
    'decode-rate',
    'extend-window',
    'full-rate',
    'average-rates',
    'invert-mean',
  ],
};
