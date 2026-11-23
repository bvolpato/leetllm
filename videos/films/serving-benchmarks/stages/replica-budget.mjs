import { cueProgress } from '../construction.mjs';
import { box, footer, text } from '../defaults.mjs';

const fleetRate = 1.5;
const residenceSeconds = 10;
const replicas = 3;
const meanActive = fleetRate * residenceSeconds;
const perReplica = meanActive / replicas;
const demand = 100;

function drawBurst(ctx, api, progress) {
  const { C } = api;
  const extra = 2;
  const settled = progress === 1;
  text(ctx, api, 'One replica during a burst', 250, 340, 49, C.ink, 'left');
  const x = (i) => 310 + i * 165;
  for (let i = 0; i < perReplica; i++) {
    api.rect(ctx, x(i), 565, 104, 124, C.cyan, undefined, 16);
  }
  if (progress > 0) {
    const y = 385 + 180 * progress;
    for (let i = 0; i < extra; i++) {
      api.rect(ctx, x(perReplica + i), y, 104, 124, C.yellow, undefined, 16);
    }
  }
  const last = x(perReplica - 1) + 104;
  api.line(ctx, x(0), 734, last, 734, C.cyan, 3);
  for (const edge of [x(0), last]) api.line(ctx, edge, 722, edge, 746, C.cyan, 3);
  text(ctx, api, 'Average at the tested rate: ' + perReplica, (x(0) + last) / 2, 807, 34, C.cyan);
  text(ctx, api, perReplica + (settled ? extra : 0) + ' open now', 1615, 646, 44, C.ink);
}

export function drawReplicaBudget(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  api.focus.target('replica-budget-mechanism', () => {
    if (beat === 2) {
      drawBurst(
        ctx,
        api,
        cueProgress(state.cues, 'replica-budget-beat-2', api.phase(p, 0.19, 0.35)),
      );
      footer(
        ctx,
        api,
        'Three-replica test  ·  ' + meanActive + ' requests open on average across the fleet',
      );
      return;
    }
    text(
      ctx,
      api,
      fleetRate + ' requests/s × ' + residenceSeconds + ' s = ' + meanActive + ' active on average',
      960,
      310,
      48,
    );
    for (let i = 0; i < replicas; i++) {
      const x = 240 + i * 520;
      api.rect(ctx, x, 420, 420, 250, C.panel, C.blue, 16);
      for (let j = 0; j < perReplica; j++) {
        api.rect(ctx, x + 35 + j * 72, 500, 50, 100, C.cyan, undefined, 8);
      }
      text(ctx, api, 'Replica ' + (i + 1), x + 210, 735, 35, C.blue);
      text(ctx, api, perReplica + ' active on average', x + 210, 804, 30, C.cyan);
    }
    const result = state.cues?.['replicas-twenty'];
    const show = beat === 1 && (result ? result.phase === 'after' : p >= 0.42);
    const label =
      beat === 0
        ? fleetRate / replicas + ' requests/s per replica'
        : demand +
          ' active ÷ ' +
          perReplica +
          ' = ' +
          (show ? demand / perReplica + ' replicas' : '?');
    box(ctx, api, label, 450, 885, 1020, 80, show ? C.green : C.cyan, 34);
  });
}
export default {
  id: 'replica-budget',
  draw: drawReplicaBudget,
  cues: [
    'replica-budget-beat-0',
    'replica-budget-beat-1',
    'replicas-twenty',
    'replica-budget-beat-2',
  ],
};
