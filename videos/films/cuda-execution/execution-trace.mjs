import { drawAddedText as text } from './defaults.mjs';

export function drawExecutionLanes(ctx, api, clock, run, { ticks, waiting, showStream, showHost }) {
  const { C, focus } = api;
  const x = (time) => 380 + ((time - ticks[0]) / (ticks.at(-1) - ticks[0])) * 1310;
  const durationBar = (from, to, y, color) => {
    if (to > from) api.rect(ctx, x(from), y - 12, x(to) - x(from), 24, color);
  };
  const lane = (label, y, color) => {
    text(ctx, api, label, 145, y + 10, 34, color);
    api.line(ctx, x(ticks[0]), y, x(ticks.at(-1)), y, C.muted, 2);
  };

  focus.target('execution-clock', () => {
    for (const tick of ticks) {
      api.line(ctx, x(tick), 509, x(tick), 525, C.muted, 2);
      text(ctx, api, tick, x(tick), 490, 28, C.muted, 'center', true);
    }
    text(ctx, api, 'Time (ms)', 145, 490, 30, C.muted);
  });
  focus.target('host-receipt', () => {
    lane('Python', 585, C.blue);
    text(ctx, api, 'start ' + clock.hostStart, x(clock.hostStart) - 15, 550, 27, C.blue, 'right');
    durationBar(clock.hostStart, clock.hostStart + run.submitted, 585, C.blue);
    if (run.returned) {
      api.line(ctx, x(clock.hostReturn), 555, x(clock.hostReturn), 609, C.blue, 4);
      text(ctx, api, 'return ' + clock.hostReturn, x(clock.hostReturn), 651, 28, C.blue, 'center');
    }
    if (waiting) durationBar(clock.hostReturn, Math.min(run.time, clock.scalarAt), 585, C.yellow);
    if (run.reported) {
      api.circle(ctx, x(clock.scalarAt), 585, 8, C.ink);
      text(ctx, api, 'scalar ' + clock.scalarAt, x(clock.scalarAt), 651, 28, C.yellow, 'center');
    }
    if (showHost && run.hostInterval !== null)
      text(ctx, api, clock.scalarAt + ' − ' + clock.hostStart + ' = ' + run.hostInterval + ' ms',
        (x(clock.hostStart) + x(clock.scalarAt)) / 2, 551, 36, C.yellow, 'center');
  });
  focus.target('event-receipt', () => {
    lane('GPU stream', 718, C.cyan);
    durationBar(clock.eventStart, clock.eventStart + run.deviceElapsed, 718, C.cyan);
    if (run.time >= clock.eventStart) {
      api.circle(ctx, x(clock.eventStart), 718, 8, C.ink);
      text(ctx, api, 'start ' + clock.eventStart, x(clock.eventStart), 784, 29, C.cyan, 'center');
    }
    if (run.deviceComplete) {
      api.circle(ctx, x(clock.eventEnd), 718, 8, C.ink);
      text(ctx, api, 'end ' + clock.eventEnd, x(clock.eventEnd), 784, 29, C.cyan, 'center');
    }
    if (showStream && run.eventInterval !== null)
      text(ctx, api, clock.eventEnd + ' − ' + clock.eventStart + ' = ' + run.eventInterval + ' ms',
        (x(clock.eventStart) + x(clock.eventEnd)) / 2, 681, 36, C.cyan, 'center');
  });
  // Keep the cursor clear of the labels below each lane.
  api.line(ctx, x(run.time), 528, x(run.time), 551, C.yellow, 4);
  api.line(ctx, x(run.time), 669, x(run.time), 746, C.yellow, 3);
}

export function drawExecutionTrace(ctx, api, clock, run, options) {
  const { ticket, logLatency, decimals } = options;
  const { C, focus } = api;
  drawExecutionLanes(ctx, api, clock, run, options);
  focus.target('ticket-log', () => {
    api.line(ctx, 150, 832, 1760, 832, C.muted, 2);
    text(ctx, api, 'Caller log', 180, 894, 32, C.muted);
    text(ctx, api, 'Ticket ' + ticket, 180, 962, 45, C.ink);
    focus.target('host-scalar', () => {
      text(ctx, api, 'Python number', 685, 894, 32, C.muted);
      const value = !run.reported ? '?' : decimals === undefined ? String(run.scalar) : run.scalar.toFixed(decimals);
      text(ctx, api, value, 685, 962, 50, run.reported ? C.cyan : C.ink, 'left', true);
    });
    text(ctx, api, 'Time to scalar', 1255, 894, 32, C.muted);
    text(ctx, api, logLatency ? run.hostInterval + ' ms' : '?', 1255, 962,
      50, logLatency ? C.green : C.ink, 'left', true);
  });
}
