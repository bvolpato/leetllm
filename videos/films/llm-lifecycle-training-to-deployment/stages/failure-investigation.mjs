import { weightMemory } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';

function drawReply(ctx, api, cue) {
  const { C } = api;
  const complete = cue.started('trace-complete');
  const reply = JSON.stringify({ eligible: true });
  const raw = complete ? reply : reply.slice(0, reply.indexOf(':') + 1);
  api.text(ctx, 'Raw reply', 160, 350, 43, C.cyan);
  api.text(ctx, raw, 160, 508, 83, C.ink, 'left', 'mono');
  api.line(ctx, 160, 568, 1750, 568, C.muted, 2);
  if (complete) {
    api.text(ctx, 'After the adapter', 160, 717, 43, C.cyan);
    if (cue.after('trace-object')) api.text(ctx, '{}', 160, 870, 83, C.pink, 'left', 'mono');
  } else {
    api.text(ctx, 'Completion status', 160, 717, 43, C.cyan);
    if (cue.after('trace-limit')) api.text(ctx, 'Output limit reached', 160, 852, 67, C.yellow);
  }
}

function drawCheckpointOutputs(ctx, api, cue) {
  const { C } = api;
  api.text(ctx, 'Does a stale 42-day key meet a 30-day minimum?', 160, 314, 53, C.ink);
  api.text(ctx, 'Same prompt, chat template and decoding settings', 160, 389, 38, C.cyan);
  api.text(ctx, 'Original', 160, 525, 47, C.muted);
  api.text(ctx, 'Compressed', 160, 747, 47, C.muted);
  api.line(ctx, 160, 623, 1750, 623, C.muted, 2);
  if (cue.started('trace-original')) api.text(ctx, 'Eligible.', 650, 525, 65, C.ink);
  if (cue.after('trace-original')) api.text(ctx, 'End of reply', 1000, 525, 40, C.muted);
  if (cue.started('trace-repeat')) {
    const count = 1 + Math.floor(2 * cue.progress('trace-repeat'));
    for (let i = 0; i < count; i++)
      api.text(ctx, 'Eligible.', 650 + i * 350, 747, 65, i ? C.pink : C.ink);
  }
}

function drawFirstToken(ctx, api, cue) {
  const { C } = api;
  const firstTokenMs = 200;
  const queueMs = 150;
  const x = (ms) => 180 + (1560 * ms) / firstTokenMs;
  api.text(ctx, 'Server receives request', x(0), 411, 43, C.ink);
  api.text(ctx, 'First token', x(firstTokenMs), 411, 43, C.ink, 'right');
  api.text(ctx, '0 ms', x(0), 625, 42, C.ink);
  api.text(ctx, firstTokenMs + ' ms', x(firstTokenMs), 625, 42, C.ink, 'right');
  api.rect(ctx, x(0), 472, x(firstTokenMs) - x(0), 70, C.panel, C.muted, 5);
  const queued = queueMs * cue.progress('trace-queue');
  if (queued > 0) api.rect(ctx, x(0), 472, x(queued) - x(0), 70, C.yellow, undefined, 5);
  if (cue.after('trace-queue'))
    api.text(ctx, 'Queue   ' + queueMs + ' ms', x(queueMs / 2), 519, 39, C.bg, 'center');
  const computeMs = firstTokenMs - queueMs;
  const active = computeMs * cue.progress('trace-prefill');
  if (active > 0) api.rect(ctx, x(queueMs), 472, x(active) - x(0), 70, C.cyan, undefined, 5);
  if (cue.after('trace-prefill'))
    api.text(
      ctx,
      'Prefill + first generation step   ' + computeMs + ' ms',
      x(firstTokenMs),
      767,
      43,
      C.cyan,
      'right',
    );
}

function drawCapacity(ctx, api, cue) {
  const { C } = api;
  const memory = weightMemory();
  const capacity = 48;
  const x = (gib) => 165 + (1560 * gib) / memory.twoRequestSubtotal;
  const weightEnd = x(memory.bytes[2]);
  api.text(ctx, 'INT4 weights', x(0), 388, 47, C.blue);
  api.text(ctx, memory.bytes[2].toFixed(1) + ' GiB', x(0), 460, 57, C.ink);
  api.rect(ctx, x(0), 515, weightEnd - x(0), 65, C.blue, undefined, 4);
  const cacheEnd = x(
    memory.bytes[2] + 2 * memory.cachePerRequest * cue.progress('trace-cache-size'),
  );
  if (cacheEnd > weightEnd) {
    api.rect(ctx, weightEnd, 515, cacheEnd - weightEnd, 65, C.cyan, undefined, 4);
    api.text(ctx, 'Two live caches', weightEnd, 388, 47, C.cyan);
    api.text(ctx, 2 * memory.cachePerRequest + ' GiB', weightEnd, 460, 57, C.ink);
  }
  api.line(ctx, x(capacity), 490, x(capacity), 615, C.yellow, 5);
  api.text(ctx, capacity + ' GiB device', x(capacity), 682, 41, C.yellow, 'center');
  if (cue.after('trace-subtotal'))
    api.text(
      ctx,
      memory.twoRequestSubtotal.toFixed(1) + ' GiB required before overhead',
      x(0),
      843,
      55,
      C.ink,
    );
}

export function drawFailureInvestigation(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  api.focus.target('failure-investigation-mechanism', () => {
    if (state.beat === 0) drawReply(ctx, api, cue);
    else if (state.beat === 1) drawCheckpointOutputs(ctx, api, cue);
    else if (cue.started('trace-memory')) drawCapacity(ctx, api, cue);
    else drawFirstToken(ctx, api, cue);
  });
}

export default {
  id: 'failure-investigation',
  draw: drawFailureInvestigation,
  cues: [
    'trace-limit',
    'trace-complete',
    'trace-object',
    'trace-original',
    'trace-repeat',
    'trace-queue',
    'trace-prefill',
    'trace-memory',
    'trace-cache-size',
    'trace-subtotal',
  ],
};
