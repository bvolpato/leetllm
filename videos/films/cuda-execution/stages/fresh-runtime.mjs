import { executionAt, reduction } from '../arithmetic.mjs';
import { directed, mix } from '../construction.mjs';
import { drawAddedCell as cell, drawAddedText as text } from '../defaults.mjs';
import { drawExecutionTrace } from '../execution-trace.mjs';
import { freshClock, freshRuntimeValues, tokenValues } from '../fixtures.mjs';

const result = reduction(freshRuntimeValues, 8);
const x = (index) => 185 + 98 * index + (index >= 8 ? 55 : 0);

function drawInputs(ctx, state, api) {
  const append = directed(state, 'fresh-append', 0, 0.1, 0.3);
  const count = tokenValues.length + Math.floor(append * (freshRuntimeValues.length - tokenValues.length));
  freshRuntimeValues.slice(0, count).forEach((value, i) => {
    const xx = x(i);
    cell(ctx, api, value, xx, 350, 85, 74, api.C.cyan, 36);
    text(ctx, api, 'T' + i, xx + 42, 325, 25, api.C.muted, 'center', true);
  });
}

function drawReduction(ctx, state, api) {
  const { C, focus } = api;
  const load = directed(state, 'fresh-reads', 1);
  const guard = directed(state, 'fresh-guards', 1);
  const joined = directed(state, 'fresh-arrivals', 1);
  const validCount = directed(state, 'fresh-count', 2);
  const divide = directed(state, 'fresh-mean', 2);
  text(ctx, api, 'Which threads read, and what mean will they produce?', 145, 260, 46, C.ink);
  focus.target('fresh-input', () => {
    drawInputs(ctx, state, api);
    if (validCount > 0) {
      const left = x(0), right = x(result.denominator - 1) + 85;
      api.line(ctx, left, 438, left, 455, C.yellow, 3);
      api.line(ctx, left, 455, mix(left, right, validCount), 455, C.yellow, 3);
      if (validCount === 1) {
        api.line(ctx, right, 438, right, 455, C.yellow, 3);
        text(ctx, api, result.denominator + ' input positions', (left + right) / 2, 495, 29, C.yellow, 'center');
      }
    }
  });
  result.blocks.forEach((block, i) => {
    const color = i ? C.blue : C.cyan;
    const left = x(block.threads[0].index);
    focus.target('fresh-block-' + i, () => {
      text(ctx, api, 'Block ' + i + (joined === 1 ? '   /   8 at barrier' : '   /   8 threads'), left, 804, 32, color);
      block.threads.forEach(thread => {
        const xx = x(thread.index);
        const ready = thread.valid ? load === 1 : guard === 1;
        cell(ctx, api, ready ? thread.value : '·', xx, 595, 85, 74, ready && !thread.valid ? C.yellow : color, 36);
        text(ctx, api, 'i=' + thread.index, xx + 42, 710, 25, C.muted, 'center', true);
        if (thread.valid && load > 0 && load < 1)
          api.circle(ctx, xx + 42, mix(437, 581, load), 7, color);
        if (!thread.valid && guard > 0 && guard < 1)
          api.circle(ctx, xx + 42, mix(567, 581, guard), 7, C.yellow);
      });
      if (joined > 0) {
        const right = left + 7 * 98 + 85;
        api.line(ctx, left, 751, mix(left, right, joined), 751, color, 5);
      }
      if (directed(state, 'fresh-subtotal-' + i, 2) === 1)
        text(ctx, api, 'sum ' + block.subtotal, left + 750, 804, 34, color, 'right');
    });
  });
  focus.target('fresh-quotient', () => {
    const equation = divide === 1
      ? result.total + ' ÷ ' + result.denominator + ' ≈ ' + result.mean.toFixed(4)
      : state.beat === 2 && validCount === 1
        ? result.total + ' ÷ ' + result.denominator
        : 'Pooled feature   ?';
    text(ctx, api, equation, 960, 935, 55, divide === 1 ? C.green : C.ink, 'center');
  });
}

export function drawFreshRuntime(ctx, scene, state, api) {
  if (state.beat < 3) {
    drawReduction(ctx, state, api);
    return;
  }
  const submit = directed(state, 'fresh-return', 3);
  const end = directed(state, 'fresh-device-end', 4);
  const read = directed(state, 'fresh-report', 4);
  const time = freshClock.hostStart + (freshClock.hostReturn - freshClock.hostStart) * submit +
    (freshClock.eventEnd - freshClock.hostReturn) * end + (freshClock.scalarAt - freshClock.eventEnd) * read;
  const run = executionAt(time, freshClock, freshRuntimeValues);
  text(ctx, api, 'Which time goes beside this ticket?', 145, 260, 46, api.C.ink);
  drawInputs(ctx, state, api);
  drawExecutionTrace(ctx, api, freshClock, run, {
    ticks: [4, 9, 14, 19, 24], ticket: 104, decimals: 4, waiting: true,
    logLatency: directed(state, 'fresh-log', 5, 0.78, 0.92) === 1,
    showHost: directed(state, 'fresh-intervals', 5) === 1,
    showStream: directed(state, 'fresh-stream-interval', 5) === 1,
  });
}

export default {
  id: 'fresh-runtime',
  draw: drawFreshRuntime,
  cues: ['fresh-append', 'fresh-predict', 'fresh-reads', 'fresh-guards', 'fresh-arrivals', 'fresh-subtotal-0',
    'fresh-subtotal-1', 'fresh-count', 'fresh-mean', 'fresh-return', 'fresh-device-end',
    'fresh-report', 'fresh-intervals', 'fresh-stream-interval', 'fresh-log'],
};
