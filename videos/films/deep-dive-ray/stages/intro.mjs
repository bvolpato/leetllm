import { bounded, rayMix } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { chapterCard, panel, text } from '../defaults.mjs';
import { parallel, serial } from '../fixtures.mjs';
import { documents, drawWordRows, motion, passed, results } from '../ledger.mjs';

function drawWordSchedule(ctx, state, api) {
  const { C } = api;
  const colors = [C.blue, C.cyan, C.yellow];
  const origin = 600,
    unit = 216;
  const laneTop = [306, 515];
  const pickup = motion(state, 'intro-worker', 0);
  const schedule = sampleModel('intro', state);
  const { time: clock, end: finish } = schedule;
  const ready = schedule.ready.length;
  const comparing = state.cues?.['intro-schedule']?.phase !== 'before' && ready === parallel.length;
  const travel = bounded((state.t ?? 0) / (state.cues?.['intro-first-finish']?.start || 2.4));
  const dispatch = 1 - (1 - travel) ** 2;

  for (const [lane, top] of laneTop.entries()) {
    text(ctx, api, 'Worker ' + (lane + 1), 128, top + 73, 53);
    api.line(ctx, origin, top + 132, origin + unit * finish, top + 132, C.muted, 3);
    for (let i = 0; i <= finish; i++) {
      const x = origin + i * unit;
      api.line(ctx, x, top + 132, x, top + 146, C.muted, 3);
    }
  }
  if (pickup === 0) text(ctx, api, 'Who takes trace?', 128, 801, 45, C.yellow);
  const drawTask = (i) => {
    const { start, end, lane } = parallel[i];
    const duration = end - start;
    const width = duration * unit - 10;
    const slot = origin + start * unit;
    const x = i === 2 ? rayMix(origin, slot, pickup * 2) : rayMix(origin - 202, slot, dispatch);
    const y = i === 2 ? rayMix(728, laneTop[lane], pickup * 2 - 1) : laneTop[lane];
    api.rect(ctx, x, y, width, 116, colors[i], undefined, 5);
    text(ctx, api, documents[i], x + 33, y + 73, 60, C.bg);
    text(ctx, api, duration + ' ticks', x + width - 32, y + 70, 33, C.bg, 'right');
    if (clock > start) {
      const filled = width * bounded((clock - start) / duration);
      api.rect(ctx, x, y + 101, filled, 15, C.ink, undefined, 0);
    }
  };
  api.focus.target('intro-cache-task', () => drawTask(0));
  api.focus.target('intro-router-task', () => drawTask(1));
  api.focus.target('intro-trace-task', () => drawTask(2));

  api.focus.target('intro-ledger-count', () => {
    text(
      ctx,
      api,
      ready + ' / ' + documents.length + ' results ready',
      1700,
      225,
      42,
      ready === documents.length ? C.green : C.ink,
      'right',
    );
  });
  if (comparing) {
    api.focus.target('intro-schedule-payoff', () => {
      const unitWidth = 106;
      for (const [events, label, end, y] of [
        [serial, 'Serial', serial.at(-1).end, 787],
        [parallel, 'Two workers', finish, 890],
      ]) {
        text(ctx, api, label + ' · ' + end + ' ticks', origin - 38, y + 30, 37, C.ink, 'right');
        events.forEach((task, i) => {
          api.rect(
            ctx,
            origin + task.start * unitWidth,
            y + task.lane * 36,
            (task.end - task.start) * unitWidth,
            30,
            colors[i],
            C.bg,
            1,
          );
        });
      }
    });
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0 && motion(state, 'intro-lab', 0) === 0) {
    if (state.t < 0.35) ctx.globalAlpha = 1;
    drawWordSchedule(ctx, state, api);
    return;
  }
  const departed = passed(state, 'intro-exit', 0);
  const inspected = passed(state, 'intro-zero', 1);
  const counted = passed(state, 'intro-record', 2);
  const travel = motion(state, 'intro-send', 2);
  api.focus.target('word-rows', () => drawWordRows(ctx, api, 145, 305, 660, true));
  api.focus.target('process-number', () => {
    panel(ctx, api, 1100, 228, 675, 512, departed && !inspected ? C.muted : C.yellow);
    text(ctx, api, departed ? 'Replacement ledger' : 'Ledger process', 1160, 309, 43);
    text(ctx, api, 'Documents counted', 1438, 420, 33, C.muted, 'center');
    const value = counted || !departed ? documents.length : inspected ? 0 : '?';
    text(
      ctx,
      api,
      String(value),
      1438,
      593,
      146,
      inspected || counted ? C.green : C.yellow,
      'center',
    );
    text(
      ctx,
      api,
      inspected ? 'self.completed = 0' : departed ? 'BatchLedger()' : 'Counter in process memory',
      1438,
      686,
      34,
      C.ink,
      'center',
    );
  });
  if (state.beat === 2) {
    api.focus.target('record-path', () => {
      api.text(ctx, 'ledger.record.remote(*refs)', 960, 823, 39, C.cyan, 'center', 'mono');
      api.arrow(ctx, 240, 960, 1720, 960, C.muted, 3);
      for (let i = 0; i < documents.length; i++) {
        const x = 190 + 235 * i + travel * 865;
        const resolved = travel >= 0.65;
        const label = resolved ? '(' + results[i].join(', ') + ')' : String.fromCharCode(65 + i);
        chapterCard(ctx, api, label, x, 857, 195, resolved ? C.green : C.cyan, 82, 35);
      }
    });
  } else {
    text(
      ctx,
      api,
      departed && !inspected
        ? 'What count will the replacement report?'
        : 'The driver still holds all three handles.',
      960,
      900,
      43,
      C.ink,
      'center',
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-schedule',
    'intro-first-finish',
    'intro-finish',
    'intro-worker',
    'intro-lab',
    'intro-words',
    'intro-exit',
    'intro-question',
    'intro-zero',
    'intro-router',
    'intro-send',
    'intro-record',
  ],
};
