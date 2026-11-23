import { overflowReroute, queueExample, spokenProgress } from '../construction.mjs';
import { drawQueues, drawReturn, queueCaption } from '../queues.mjs';

export function drawDroplessWork(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const original = overflowReroute(0);
  const fixed = queueExample(original.routes, original.token, original.gates);
  const all = queueExample(original.routes, original.token, original.gates, 1, true);
  const changed = queueExample(overflowReroute(1).routes, original.token, original.gates, 1, true);
  const restore = spokenProgress(api, state, 'execute-tail', 0);
  const move = spokenProgress(api, state, 'move-four', 2);
  const moving = move > 0 && move < 1;
  const resultReady = spokenProgress(api, state, 'compare-returns', 2, 0.78, 0.96) === 1;
  const model = move === 1 ? changed : restore === 1 ? all : fixed;
  const note =
    beat === 1
      ? 'E4 returns [5, 0]. With the same gate, what is t4’s new first coordinate?'
      : move === 1
        ? 'Same token and gates  ·  one different learned function'
        : '';
  queueCaption(
    ctx,
    api,
    move > 0
      ? 'Reroute just one assignment'
      : 'Same eight tokens  ·  same sixteen selected assignments',
    note,
  );
  drawQueues(ctx, api, move > 0 ? changed : model, {
    previous: move > 0 ? all : undefined,
    move,
    boundary: restore === 0 ? fixed.slots : undefined,
    boundaryLabel: fixed.slots + ' slots',
    markOverflow: restore === 0,
    workRows:
      restore > 0 && !moving
        ? model.loads.map((n) => api.lerp(Math.min(n, fixed.slots), n, restore))
        : undefined,
  });
  drawReturn(ctx, api, model, {
    resolved: !moving && (restore === 0 || restore === 1),
    showOutput: move === 0 ? restore === 0 || restore === 1 : move === 1 && resultReady,
    previousOutput: restore === 1 ? (move > 0 ? all.output : fixed.output) : undefined,
  });
}

export default {
  id: 'dropless-work',
  draw: drawDroplessWork,
  cues: ['execute-tail', 'hot-queue', 'alternative-expert', 'move-four', 'compare-returns'],
};
