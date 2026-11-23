import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';
import { multiTenantConstructionModel } from '../model.mjs';

function drawPrefix(ctx, state, api) {
  const { C } = api;
  api.rect(ctx, 215, 228, 1490, 655, C.panel, C.muted, 16);
  api.text(ctx, 'Cached prefix', 280, 329, 58, C.ink, 'left', 'serif');
  api.focus.target('remote-reader', () => {
    api.text(ctx, 'Approved reader', 280, 474, 39, C.blue);
    api.text(ctx, 'Alice in workspace A', 804, 474, 45, C.ink);
  });
  api.focus.target('remote-shape', () => {
    for (const [i, [label, value]] of [
      ['Model and adapter', 'base-v3   /   docs-v2'],
      ['Tokens at positions', '[1, 5, 9]   at   [0, 1, 2]'],
      ['Cache layout', 'kv-layout-v1'],
    ].entries()) {
      const y = 581 + i * 100;
      api.text(ctx, label, 280, y, 39, C.cyan);
      api.text(ctx, value, 804, y, 43, C.ink);
    }
  });
  if (resultAfter(state, 'remote-compatible'))
    api.text(ctx, 'Approved for reuse', 1640, 324, 35, C.green, 'right');
}

function drawPaths(ctx, state, api, model) {
  const { C } = api;
  const { lookup, transfer, remote, recompute, deadline, spare } = model;
  const x = (ms) => 452 + ms * 17;
  const lookupP = operationProgress(state, 'remote-lookup');
  const transferP = operationProgress(state, 'remote-transfer');
  const rebuildP = operationProgress(state, 'remote-rebuild');
  const chosen = resultAfter(state, 'mt-remote-kv-b2');
  api.text(ctx, 'Time until Alice can use the prefix', 142, 289, 44, C.ink);
  api.text(ctx, deadline + ' ms deadline', x(deadline), 376, 36, C.pink, 'center');
  api.line(ctx, x(deadline), 400, x(deadline), 835, C.pink, 4);
  api.text(ctx, 'Fetch', 142, 511, 48, C.ink);
  api.text(ctx, 'Rebuild', 142, 746, 48, C.ink);
  for (const y of [450, 685]) api.rect(ctx, x(0), y, x(deadline) - x(0), 84, C.panel, undefined, 0);

  const segment = (start, duration, progress, y, color) => {
    if (progress > 0)
      api.rect(ctx, x(start), y, x(duration * progress) - x(0), 84, color, undefined, 0);
  };
  segment(0, lookup, lookupP, 450, C.blue);
  segment(lookup, transfer, transferP, 450, C.cyan);
  segment(0, recompute, rebuildP, 685, chosen ? C.green : C.muted);
  if (resultAfter(state, 'remote-lookup'))
    api.text(ctx, 'Lookup ' + lookup + ' ms', x(lookup / 2), 504, 32, C.bg, 'center');
  if (resultAfter(state, 'remote-transfer'))
    api.text(
      ctx,
      'Transfer ' + transfer + ' ms',
      x(lookup + transfer / 2),
      504,
      34,
      C.bg,
      'center',
    );
  if (resultAfter(state, 'remote-rebuild'))
    api.text(
      ctx,
      'Local compute   ' + recompute + ' ms',
      x(recompute / 2),
      739,
      36,
      C.bg,
      'center',
    );
  if (resultAfter(state, 'remote-total'))
    api.text(
      ctx,
      lookup + ' + ' + transfer + ' = ' + remote + ' ms',
      x(remote),
      592,
      39,
      C.cyan,
      'right',
    );
  if (resultAfter(state, 'remote-spare')) {
    api.line(ctx, x(recompute), 799, x(deadline), 799, C.green, 3);
    for (const end of [recompute, deadline]) api.line(ctx, x(end), 788, x(end), 810, C.green, 3);
    api.text(ctx, spare + ' ms to spare', x(recompute + spare / 2), 867, 36, C.green, 'center');
  }
}

function drawRemoteReader(ctx, state, api) {
  const { C } = api;
  const timedOut = resultAfter(state, 'remote-timeout');
  const retired = resultAfter(state, 'remote-retire');
  const released = resultAfter(state, 'remote-release');
  api.text(ctx, 'Fetch request', 228, 365, 49, C.ink);
  api.text(
    ctx,
    timedOut ? 'Caller timed out' : 'Waiting for a reply',
    228,
    431,
    40,
    timedOut ? C.pink : C.muted,
  );
  api.focus.target('remote-kv-pages', () => {
    api.text(ctx, 'Remote worker', 228, 614, 49, C.ink);
    api.text(
      ctx,
      retired ? 'Last read finished' : 'Reading page 0',
      228,
      680,
      40,
      retired ? C.green : C.cyan,
    );
    if (!retired) api.line(ctx, 620, 608, 1080, 608, C.cyan, 6);
    api.text(ctx, 'Page 0', 1120, 364, 50, C.ink);
    api.rect(ctx, 1080, 410, 405, 361, C.panel, released ? C.muted : C.cyan, 14);
    for (let i = 0; i < 16; i++)
      api.rect(
        ctx,
        1102 + (i % 4) * 94,
        436 + Math.floor(i / 4) * 80,
        79,
        65,
        released ? C.bg : C.cyan,
        released ? C.muted : undefined,
        5,
      );
    api.text(
      ctx,
      released ? 'Available for reuse' : retired ? 'References: 0' : 'Pinned   ·   1 reader',
      1080,
      848,
      40,
      released ? C.green : C.ink,
    );
  });
}

export function drawRemoteKv(ctx, scene, state, api) {
  const model = multiTenantConstructionModel(scene.id, state);
  api.focus.target('remote-kv-mechanism', () => {
    if (model.b === 0) drawPrefix(ctx, state, api);
    else if (model.b <= 2) drawPaths(ctx, state, api, model);
    else drawRemoteReader(ctx, state, api);
  });
}

export default {
  id: 'remote-kv',
  draw: drawRemoteKv,
  cues: [
    'mt-remote-kv-b0',
    'remote-reader',
    'remote-shape',
    'remote-compatible',
    'mt-remote-kv-b1',
    'remote-lookup',
    'remote-transfer',
    'remote-rebuild',
    'mt-remote-kv-b2',
    'remote-total',
    'remote-spare',
    'mt-remote-kv-b3',
    'remote-timeout',
    'remote-retire',
    'remote-release',
  ],
};
