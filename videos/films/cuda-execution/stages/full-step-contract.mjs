import { clamp, directed, mix } from '../construction.mjs';
import { ticketClock } from '../fixtures.mjs';
import {
  drawAddedArrow,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';

function drawScalarReads(ctx, state, api) {
  const { C } = api;
  const { hostReturn, eventStart, eventEnd, scalarAt } = ticketClock;
  const laterCall = 32;
  const x = (ms) => 454 + ms * 29;
  const bar = (start, end, y, color) => {
    if (end > start) api.rect(ctx, x(start), y, x(end) - x(start), 27, color);
  };
  drawAddedText(ctx, api, 'Same loss kernel in both runs', 160, 275, 36, C.ink);
  drawAddedText(ctx, api, 'GPU kernel', 160, 421, 32, C.cyan);
  drawAddedText(ctx, api, 'start ' + eventStart + ' ms', x(eventStart), 375, 30, C.cyan);
  drawAddedText(ctx, api, 'finish ' + eventEnd + ' ms', x(eventEnd), 375, 30, C.cyan, 'right');
  bar(eventStart, eventEnd, 400, C.cyan);

  function drawRead(call, readEnd, y, showTotal) {
    drawAddedText(ctx, api, 'loss.item()', 160, y + 23, 32, C.yellow, 'left', true);
    drawAddedText(ctx, api, 'call ' + call + ' ms', x(call), y - 24, 29, C.yellow, 'center');
    bar(call, Math.min(readEnd, eventEnd), y, C.yellow);
    bar(eventEnd, readEnd, y, C.green);
    if (readEnd >= scalarAt) {
      drawAddedText(ctx, api, 'scalar ' + scalarAt + ' ms', x(scalarAt), y - 24, 29, C.green, 'center');
      const parts = (eventEnd - call) + ' ms waiting + ' + (scalarAt - eventEnd) + ' ms to read';
      const total = showTotal ? ' = ' + (scalarAt - call) + ' ms in the call' : '';
      drawAddedText(ctx, api, parts + total, x(hostReturn), y + 88, 32, C.ink);
    }
  }
  drawRead(hostReturn, scalarAt, 555, true);

  const otherWork = directed(state, 'full-step-wait', 1, 0.29, 0.43);
  const read = directed(state, 'full-step-remaining', 1, 0.48, 0.57);
  const total = directed(state, 'full-step-read-time', 1, 0.58, 0.65);
  if (otherWork > 0) api.focus.target('later-read', () => {
    drawAddedText(ctx, api, 'Other Python work', x(hostReturn), 735, 30, C.blue);
    bar(hostReturn, mix(hostReturn, laterCall, otherWork), 760, C.blue);
    if (otherWork === 1) drawRead(laterCall, mix(laterCall, scalarAt, read), 760, total === 1);
  });
  if (directed(state, 'full-step-stream-use', 1, 0.66, 0.77) > 0)
    api.focus.target('stream-consumer', () => {
      drawAddedNote(ctx, api, 'Python can queue a consumer on the same stream. The GPU uses the loss after the kernel finishes.');
    });
}

export function drawFullStepContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1,
    v = drawAddedP(ctx, api, 'full-step-checks');
  api.focus.target('full-step-contract-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'Four tickets through the training step',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const stages = ['shape', 'device', 'forward loss', 'backward', 'optimizer update'];
      stages.forEach((label, i) => {
        const x = 190 + i * 320;
        drawAddedText(ctx, api, label, x, 435, 29, themeColors.blue);
        if (v > (i + 1) / 7) {
          drawAddedLine(ctx, api, x, 510, x + 240, 510, themeColors.green, 10);
          drawAddedText(ctx, api, 'checked', x, 600, 28, themeColors.green);
        }
        if (i < 4) drawAddedArrow(ctx, api, x + 250, 510, x + 295, 510, themeColors.muted);
      });
      if (drawAddedP(ctx, api, 'full-step-moments') > 0) {
        drawAddedText(
          ctx,
          api,
          'Alternate Adam state · 51 FP32 parameters',
          180,
          780,
          30,
          themeColors.muted,
        );
        drawAddedText(ctx, api, 'weights 204 B + gradients 204 B', 180, 865, 32, themeColors.blue);
        if (done('full-step-moments'))
          drawAddedText(ctx, api, '+ first-update moments 408 B', 1030, 865, 32, themeColors.pink);
      }
      drawAddedNote(
        ctx,
        api,
        'The ticket classifier uses SGD. Switching to Adam introduces the two moments.',
      );
    } else if (currentBeat === 1) {
      drawScalarReads(ctx, state, api);
    } else {
      drawAddedText(
        ctx,
        api,
        'Where should the host timer start?',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const p = drawAddedP(ctx, api, 'full-step-boundary'),
        now = 45 * p,
        x = (ms) => 280 + ms * 31;
      drawAddedText(ctx, api, 'GPU queue', 160, 425, 29, themeColors.cyan);
      drawAddedText(ctx, api, 'host', 160, 650, 29, themeColors.blue);
      for (const [start, end, y, color] of [
        [0, 5, 460, themeColors.muted],
        [5, 45, 460, themeColors.cyan],
        [0, 5, 685, themeColors.muted],
        [5, 7, 685, themeColors.blue],
        [7, 45, 685, themeColors.yellow],
      ]) {
        api.rect(ctx, x(start), y, (end - start) * 31, 95, themeColors.panel, color, 2);
        const q = clamp((now - start) / (end - start));
        if (q > 0) api.rect(ctx, x(start), y, (end - start) * 31 * q, 95, color, undefined, 0);
      }
      drawAddedText(ctx, api, 'prior work', x(0), 595, 25, themeColors.muted);
      drawAddedText(ctx, api, 'target step · unchanged 40 ms', x(12), 595, 31, themeColors.cyan);
      drawAddedText(ctx, api, 'drain', x(0), 835, 27, themeColors.muted);
      drawAddedText(ctx, api, 'submit', x(5), 900, 27, themeColors.blue);
      drawAddedText(ctx, api, 'wait for completed target', x(18), 835, 31, themeColors.yellow);
      [0, 5, 7, 45].forEach((ms) =>
        drawAddedText(ctx, api, ms, x(ms), 365, 25, themeColors.muted, 'center'),
      );
      if (now >= 5) {
        drawAddedLine(ctx, api, x(5), 385, x(5), 790, themeColors.green, 3);
        drawAddedText(ctx, api, 'start', x(5), 950, 27, themeColors.green, 'center');
      }
      if (done('full-step-boundary')) {
        drawAddedLine(ctx, api, x(45), 385, x(45), 790, themeColors.green, 3);
        drawAddedText(ctx, api, 'stop', x(45), 950, 27, themeColors.green, 'center');
        drawAddedText(
          ctx,
          api,
          '40 ms completed interval',
          x(23),
          950,
          35,
          themeColors.green,
          'center',
        );
      }
      drawAddedNote(
        ctx,
        api,
        'Modeled clock in milliseconds',
      );
    }
  });
}
export default {
  id: 'full-step-contract',
  draw: drawFullStepContract,
  cues: ['full-step-checks', 'full-step-moments', 'full-step-wait', 'full-step-remaining',
    'full-step-read-time', 'full-step-stream-use', 'full-step-boundary'],
};
