import { directed } from '../construction.mjs';
import { drawExecutionLanes } from '../execution-trace.mjs';
import { ticketClock, tokenValues } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { drawAddedText as text, drawOriginalTokenRow } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const run = sampleModel('intro', state);
  const reading = directed(state, 'read-call', 1, 0.32, 0.49) > 0;
  focus.target('gpu-input', () => {
    text(ctx, api, 'x on the GPU   ·   one feature per token', 180, 246, 38, C.cyan);
    drawOriginalTokenRow(ctx, api, tokenValues, 340, { height: 82 });
  });
  drawExecutionLanes(ctx, api, ticketClock, run, {
    ticks: [0, 10, 20, 30, 40, 50], waiting: reading,
  });
  api.line(ctx, 150, 832, 1760, 832, C.muted, 2);
  focus.target('mean-call', () => {
    text(ctx, api, 'pooled = x.mean()', 180, 910, 44, C.blue, 'left', true);
    if (run.returned) text(ctx, api, 'CUDA tensor', 180, 982, 45, C.ink);
  });
  focus.target('print-value', () => {
    text(ctx, api, 'Python number', 1565, 894, 32, C.muted, 'center');
    if (reading) text(ctx, api, 'pooled.item()', 1050, 971, 41, C.yellow, 'left', true);
    text(ctx, api, run.reported ? run.scalar : '?', 1565, 971, 51,
      run.reported ? C.green : C.ink, 'center', true);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['start-clock', 'host-return', 'opening-prediction', 'read-call', 'stream-advances', 'number-returns'],
};
