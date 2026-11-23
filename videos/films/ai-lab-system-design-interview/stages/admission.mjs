import { admissionSnapshot, namedSystemCue, spokenResult } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
import { queueScale, queueX } from '../queue-clock.mjs';

function serialQueue(ctx, state, api, sim) {
  const { C, focus } = api;
  const workerX = 1220;
  const row = 373;
  const completed = sim.requestComplete;
  const tokenCount = Math.ceil(sim.remaining).toLocaleString('en-US');

  focus.target('admission-queue', () => {
    text(ctx, api, 'Waiting  ' + sim.waiting.length + ' / 2', 160, 284, 40, C.blue);
    text(ctx, api, 'Worker  ' + sim.usedSlots + ' / 1', workerX, 284, 40, C.cyan);
    api.line(ctx, 160, 314, 1010, 314, C.blue, 3);
    api.line(ctx, workerX, 314, 1760, 314, C.cyan, 3);
    if (sim.waiting.includes('B'))
      card(ctx, api, 'B  ·  10,000 tokens', 605, row, 405, C.blue, 82, 31);
    if (!sim.requestStarted) {
      const x = sim.active === 'B' ? 605 : 160;
      card(
        ctx,
        api,
        'R-104  ·  5,000 tokens',
        x,
        row + 102 * (1 - sim.join),
        405,
        C.yellow,
        82,
        31,
      );
      if (sim.join === 0) text(ctx, api, 'At the door', 160, row + 83, 30, C.muted);
    }
    card(
      ctx,
      api,
      sim.active ? sim.active + '  ·  ' + tokenCount + ' tokens left' : 'Available',
      workerX,
      row,
      540,
      sim.active === 'R-104' ? C.yellow : C.cyan,
      82,
      34,
    );
  });

  const elapsed = Math.round(sim.seconds * 1000);
  const wait = Math.min(elapsed, 160);
  const service = Math.max(0, elapsed - wait);
  focus.target('admission-clock', () => {
    text(ctx, api, 'R-104 queue clock', 160, 645, 36, C.ink);
    if (state.beat === 0)
      text(ctx, api, '20,000 tokens ahead  ÷  125,000 tokens/s', 1760, 645, 36, C.blue, 'right');
    else
      text(
        ctx,
        api,
        'Wait  ' + wait + ' ms     Service  ' + service + ' ms',
        1760,
        645,
        41,
        C.ink,
        'right',
      );
    const y = 762;
    if (wait) api.rect(ctx, queueX(0), y - 52, queueX(wait) - queueX(0), 48, C.blue, undefined, 4);
    if (service)
      api.rect(ctx, queueX(wait), y - 52, queueX(elapsed) - queueX(wait), 48, C.cyan, undefined, 4);
    api.line(ctx, queueX(elapsed), y - 64, queueX(elapsed), y, C.ink, 4);
    queueScale(ctx, api, y);
  });
  focus.target('admission-cache', () => {
    text(ctx, api, 'Cache blocks', 160, 976, 33, C.muted);
    for (let i = 0; i < sim.kvCapacity; i++)
      api.rect(ctx, 417 + i * 68, 933, 55, 50, i < sim.usedKv ? C.cyan : C.panel, C.muted, 4);
    const owner = completed
      ? 'R-104  ·  200 complete  ·  blocks released'
      : sim.usedKv + ' blocks belong to ' + sim.active;
    text(ctx, api, owner, 1760, 976, 33, completed ? C.green : C.ink, 'right');
  });
}

function compare(ctx, state, api, sim) {
  const { C, focus } = api;
  const { comparison, allowed } = sim;
  const build = namedSystemCue(state, 'admission-compare', 2, 0.18);
  const measured = spokenResult(state, 'admission-second-wait', 2, 0.55);
  const overQuota = spokenResult(state, 'admission-quota-response', 3, 0.42);
  const smallMs = Math.round(allowed.estimatedWait * 1000);
  const largeMs = Math.round(comparison.estimatedWait * 1000);
  focus.target('admission-clock', () => {
    const rows = [
      { id: 'R-104', tokens: allowed.queuedTokens, ms: smallMs, ready: true, width: smallMs },
      {
        id: 'R-105',
        tokens: comparison.queuedTokens,
        ms: largeMs,
        ready: measured,
        width: largeMs * build,
      },
    ];
    rows.forEach(({ id, tokens, ms, ready, width }, i) => {
      const y = 382 + i * 177;
      text(
        ctx,
        api,
        id + '  ·  ' + tokens.toLocaleString('en-US') + ' tokens ahead',
        160,
        y - 55,
        37,
        C.ink,
      );
      if (width > 0)
        api.rect(ctx, queueX(0), y - 19, queueX(width) - queueX(0), 42, C.blue, undefined, 4);
      if (ready) text(ctx, api, ms + ' ms', queueX(ms) + 22, y + 12, 34, C.ink);
    });
    const x = queueX(comparison.waitBudgetSeconds * 1000);
    api.line(ctx, x, 345, x, 610, C.yellow, 4);
    queueScale(ctx, api, 620, comparison.waitBudgetSeconds * 1000);
  });
  focus.target('admission-outcome', () => {
    text(ctx, api, 'R-105   /   Shared capacity', 160, 790, 30, C.muted);
    const verdict = comparison.admitted ? 'Admit to queue' : '503  ·  Shared overload';
    text(
      ctx,
      api,
      sim.rejectReady ? verdict : 'Can the wait fit?',
      160,
      861,
      47,
      sim.rejectReady && !comparison.admitted ? C.pink : C.ink,
    );
    if (sim.rejectReady)
      text(
        ctx,
        api,
        comparison.admitted ? 'Joins the waiting queue' : 'No service slot or cache allocated',
        160,
        930,
        31,
        C.ink,
      );
  });
  if (state.beat === 3)
    focus.target('admission-caller', () => {
      text(ctx, api, 'Different team   /   Idle fleet', 1030, 790, 30, C.muted);
      text(
        ctx,
        api,
        overQuota ? '429  ·  Caller limit' : 'Caller quota exhausted',
        1030,
        861,
        47,
        overQuota ? C.yellow : C.ink,
      );
      if (overQuota) text(ctx, api, 'Stopped before the queue', 1030, 930, 31, C.ink);
    });
}

export function drawAdmission(ctx, scene, state, api) {
  const sim = admissionSnapshot(state.beat, state.beatP, state);
  if (state.beat < 2) serialQueue(ctx, state, api, sim);
  else compare(ctx, state, api, sim);
}

export default {
  id: 'admission',
  draw: drawAdmission,
  cues: [
    'admission-ahead',
    'admission-join',
    'admission-question',
    'admission-drain-a',
    'admission-drain-b',
    'admission-wait-stops',
    'admission-drain-own',
    'admission-free',
    'admission-compare',
    'admission-second-wait',
    'admission-verdict',
    'admission-quota-response',
    'admission-capacity-response',
  ],
};
