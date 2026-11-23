import { tokenTimes, comparisonTokenTimes } from '../fixtures.mjs';
import { fixedPlayback } from '../model.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

const firstRun = fixedPlayback(tokenTimes);
const secondRun = fixedPlayback(comparisonTokenTimes);
const fourth = 3;
const due = firstRun.deadlines[fourth];
const x = (ms) => 390 + (ms - 220) * 3.22;

export function drawPlaybackDeadlines(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const beatP = state.beatP ?? 0;
  const motion = (id, index, start, end) =>
    cueProgress(
      state.cues,
      id,
      beat === index ? api.phase(beatP, start, end) : Number(beat > index),
    );
  const complete = (id, index, end) =>
    state.cues?.[id]
      ? state.cues[id].phase === 'after'
      : beat > index || (beat === index && beatP > end);
  const makeTicks = motion('reader-cadence', 0, 0.18, 0.73);
  const firstPass = motion('reader-to-four', 1, 0.02, 0.6);
  const finish = motion('reader-finish', 3, 0.01, 0.23);
  const reset = motion('reader-reset', 4, 0.47, 0.78);
  const now = Math.round(
    220 + (due - 220) * firstPass + (firstRun.deadlines.at(-1) - due) * finish,
  );
  const segment = (a, b, y, label, color, above = false) => {
    api.line(ctx, x(a), y, x(b), y, color, 4);
    for (const time of [a, b]) api.line(ctx, x(time), y - 10, x(time), y + 10, color, 3);
    if (label) text(ctx, api, label, (x(a) + x(b)) / 2, y + (above ? -19 : 42), 29, color);
  };

  focus.target('reader-grid', () => {
    text(ctx, api, 'Reader', 120, 294, 40, C.yellow, 'left');
    text(ctx, api, 'due after send (ms)', 120, 336, 25, C.muted, 'left');
    api.line(ctx, x(220), 300, x(638), 300, C.muted, 2);
    firstRun.deadlines.forEach((deadline, i) => {
      if (i > 0 && makeTicks < i / 4) return;
      const xx = x(deadline);
      text(ctx, api, 'T' + (i + 1), xx, 258, 31, C.yellow);
      api.line(ctx, xx, 279, xx, 321, C.yellow, 5);
      text(ctx, api, String(deadline), xx, 359, 32, C.yellow);
      for (const y of [515, 730]) api.line(ctx, xx, y - 19, xx, y + 19, C.yellow, 3);
    });
  });
  for (const [index, run] of [firstRun, secondRun].entries()) {
    const y = index === 0 ? 515 : 730;
    const color = index === 0 ? C.cyan : C.pink;
    focus.target(index === 0 ? 'reader-run-a' : 'reader-run-b', () => {
      text(ctx, api, index === 0 ? 'Run A' : 'Run B', 120, y + 12, 41, color, 'left');
      api.line(ctx, x(220), y, x(638), y, C.muted, 2);
      if (beat > 0) {
        api.line(ctx, x(220), y, x(now), y, color, 3);
        api.line(ctx, x(now), y - 10, x(now), y + 10, C.ink, 5);
      }
      run.arrivals.forEach((arrival, i) => {
        if (arrival > now) return;
        const xx = x(arrival);
        text(ctx, api, 'T' + (i + 1), xx, y - 31, 29, color);
        api.circle(ctx, xx, y, 11, color);
        text(ctx, api, String(arrival), xx, y + 54, 32, C.ink);
      });
    });
  }
  if (beat >= 2) {
    const gap = tokenTimes[3] - tokenTimes[2];
    const markGap = motion('reader-gap', 2, 0.12, 0.45);
    if (markGap > 0) {
      segment(
        tokenTimes[2],
        tokenTimes[2] + markGap * gap,
        430,
        complete('reader-gap', 2, 0.45) ? gap + ' ms gap' : '',
        C.cyan,
        true,
      );
    }
    if (complete('reader-slack', 2, 0.72)) {
      segment(tokenTimes[3], due, 598, due - tokenTimes[3] + ' ms early', C.cyan);
    }
  }
  if (now > due) {
    segment(
      due,
      Math.min(now, comparisonTokenTimes[fourth]),
      813,
      complete('reader-late', 3, 0.6) ? secondRun.late[fourth] + ' ms late' : '',
      C.red,
    );
  }
  if (reset > 0) {
    const lateArrival = secondRun.arrivals[fourth];
    const period = secondRun.deadlines[1] - secondRun.deadlines[0];
    const next = lateArrival + period;
    focus.target('reader-policy', () => {
      text(ctx, api, 'Etalon after the stall', 120, 956, 34, C.yellow, 'left');
      text(
        ctx,
        api,
        'Next deadline = late arrival + one reading interval',
        120,
        1015,
        29,
        C.ink,
        'left',
      );
      api.line(ctx, x(lateArrival), 954, x(lateArrival + period * reset), 954, C.yellow, 5);
      api.circle(ctx, x(lateArrival), 954, 9, C.pink);
      text(ctx, api, String(lateArrival), x(lateArrival), 1014, 29, C.pink);
      if (complete('reader-reset', 4, 0.78)) {
        api.line(ctx, x(next), 935, x(next), 973, C.yellow, 4);
        text(ctx, api, 'T5', x(next), 916, 28, C.yellow);
        text(ctx, api, String(next), x(next), 1014, 29, C.yellow);
      }
    });
  } else {
    text(ctx, api, 'Client arrivals in milliseconds since send', 120, 956, 29, C.muted, 'left');
  }
  if (beat === 1 || beat === 2) {
    text(ctx, api, 'Playback clock  ' + now + ' ms', 1795, 956, 38, C.ink, 'right');
  } else if (reset === 0 && complete('reader-mean', 3, 0.94)) {
    text(ctx, api, 'Run B mean gap  ' + secondRun.meanTpot + ' ms', 1795, 956, 35, C.pink, 'right');
  }
}

export default {
  id: 'playback-deadlines',
  draw: drawPlaybackDeadlines,
  cues: [
    'reader-cadence',
    'reader-to-four',
    'reader-gap',
    'reader-slack',
    'reader-finish',
    'reader-late',
    'reader-mean',
    'reader-fixed',
    'reader-reset',
  ],
};
