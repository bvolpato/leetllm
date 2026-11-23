import { pageCount } from '../model.mjs';
import { cueProgress } from '../defaults.mjs';

const pageSize = 16;
const history = 16;
const pool = 2;
const required = pageCount(history + 1, pageSize);
const both = required * 2;

function drawPage(ctx, api, x, y, label, color, filled, reserved = 0) {
  const { C } = api;
  api.rect(ctx, x, y, 593, 153, C.panel, color, 10);
  api.text(ctx, label, x + 21, y + 55, 35, color);
  for (let pos = 0; pos < pageSize; pos++) {
    const slotColor = pos < filled + reserved ? color : C.muted;
    api.rect(ctx, x + 22 + pos * 35, y + 87, 26, 38, pos < filled ? color : C.panel, slotColor, 2);
  }
}

function drawProjection(ctx, state, api) {
  const { C } = api;
  const answer = state.beat === 1;
  const reached = (id, at) => cueProgress(state, id, at, at + 0.05) > 0;
  const next = answer || reached('growth-next', 0.53);
  const paused = answer && reached('growth-preempt', 0.26);
  const reserved = answer && reached('growth-reserve', 0.40);
  const resumed = answer && reached('growth-resume', 0.58);
  const done = answer && reached('growth-done', 0.71);

  if (!paused) {
    api.text(ctx, 'In the GPU pool', 295, 309, 42, C.ink);
    if (next) api.text(ctx, answer ? 'Extra page each reply needs' : 'Next position', 1050, 309, 42, C.ink);
    for (const [i, [name, color]] of [['Urgent', C.yellow], ['Background', C.cyan]].entries()) {
      const y = 367 + i * 215;
      drawPage(ctx, api, 295, y, name, color, history);
      if (answer) drawPage(ctx, api, 1050, y, 'Position 17', color, 0, 1);
      else if (next) {
        api.rect(ctx, 1050, y + 60, 76, 66, C.panel, color, 5);
        api.text(ctx, '+1', 1088, y + 105, 35, color, 'center');
      }
    }
    api.text(ctx, answer ? both + ' pages needed   ·   ' + pool + ' available' : pool + ' pages   ·   ' + pageSize + ' positions per page',
      960, 924, 48, answer ? C.yellow : C.ink, 'center');
    return;
  }

  api.text(ctx, 'GPU page 0', 295, 382, 42, C.muted);
  api.text(ctx, 'GPU page 1', 1050, 382, 42, C.muted);
  if (done) {
    for (const x of [295, 1050]) drawPage(ctx, api, x, 450, 'Free', C.muted, 0);
  } else {
    const name = resumed ? 'Background' : 'Urgent';
    const color = resumed ? C.cyan : C.yellow;
    drawPage(ctx, api, 295, 450, name, color, history);
    drawPage(ctx, api, 1050, 450, reserved ? name + ' · reserved' : 'Released by background',
      reserved ? color : C.muted, 0, Number(reserved));
  }
  let status = 'Background paused';
  if (reserved) status = 'Urgent can run with two pages';
  if (resumed) status = 'Urgent finished   ·   background resumes';
  if (done) status = reached('growth-limit', 0.80)
    ? pool + ' pages × ' + pageSize + ' positions = ' + pool * pageSize + ' positions'
    : 'Both replies finished   ·   one pause';
  api.text(ctx, status, 960, 799, 46, C.ink, 'center');
}

function drawReservedSlot(ctx, state, api) {
  const { C } = api;
  const written = cueProgress(state, 'growth-write', 0.40, 0.45) > 0;
  if (cueProgress(state, 'growth-cancel', 0.58, 0.63) > 0) {
    const released = cueProgress(state, 'growth-release', 0.74, 0.81) >= 1;
    const shared = cueProgress(state, 'growth-shared', 0.83, 0.88) > 0;
    api.text(ctx, 'After a cancellation', 960, 355, 45, C.ink, 'center');
    drawPage(ctx, api, 274, 431, released ? 'Private page · free' : 'Private page · in use',
      released ? C.muted : C.yellow, released ? 0 : 1);
    if (shared) drawPage(ctx, api, 1051, 431, 'Shared page · still referenced', C.cyan, pageSize);
    const status = shared ? 'Another request still uses the shared page'
      : released ? 'Last access finished · private page returned' : 'Suppress late output while the pass finishes';
    api.text(ctx, status, 960, 746, 42, C.ink, 'center');
    return;
  }
  api.text(ctx, 'Position 17', 960, 355, 45, C.ink, 'center');
  api.rect(ctx, 751, 405, 418, 225, C.panel, C.yellow, 10);
  if (written) {
    for (const [i, label] of ['Key', 'Value'].entries()) {
      const x = 789 + i * 181;
      api.rect(ctx, x, 460, 159, 117, C.yellow + '22', C.yellow, 5);
      api.text(ctx, label, x + 79, 536, 42, C.yellow, 'center');
    }
  } else api.text(ctx, 'Reserved', 960, 536, 48, C.yellow, 'center');
  api.text(ctx, written ? 'Following pass consumes the token and writes its state' : 'Space set aside for the next output',
    960, 746, 42, C.ink, 'center');
}

export function drawProjectedGrowth(ctx, scene, state, api) {
  api.focus.target('projected-growth-mechanism', () => {
    if (state.beat === 2) drawReservedSlot(ctx, state, api);
    else drawProjection(ctx, state, api);
  });
}

export default {
  id: 'projected-growth',
  draw: drawProjectedGrowth,
  cues: ['projected-growth-b1', 'growth-next', 'projected-growth-b2', 'growth-preempt',
    'growth-reserve', 'growth-resume', 'growth-done', 'growth-limit', 'projected-growth-b3', 'growth-write',
    'growth-cancel', 'growth-release', 'growth-shared'],
};
