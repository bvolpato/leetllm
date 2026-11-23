import { phraseEnded } from '../construction.mjs';
import { drawCustomers, drawQuery } from '../sql-repair.mjs';

export function drawSeamsRecord(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  if (state.beat === 0) {
    const changed = end('seams-include-three', 0, 0.35);
    api.focus.target('seams-customers', () => drawCustomers(ctx, api));
    api.focus.target('seams-query', () =>
      drawQuery(ctx, api, 'open_incidents', changed ? '>=' : '>'),
    );
    api.text(ctx, 'Expected names', 130, 745, 33, C.muted);
    api.text(ctx, '{Ada}', 130, 837, 64, C.ink);
    const result = end('seams-extra-row', 0, 0.75);
    api.focus.target('seams-rows', () => {
      api.text(ctx, 'Returned names', 1020, 745, 33, C.muted);
      api.text(
        ctx,
        changed ? (result ? '{Ada, Ben}' : '?') : '{Ada}',
        1020,
        837,
        64,
        result ? C.yellow : C.ink,
      );
    });
    return;
  }
  const terminalTask = state.beat === 2 && end('seams-switch-task', 2, 0.4);
  const steps = [
    ['Inference engine', 'samples an action', terminalTask ? 'run a test' : 'submit a query'],
    ['Environment', 'executes it', terminalTask ? 'test output' : 'database rows'],
    ['Generator', 'assembles the row', 'IDs   mask   reward   stop'],
    ['Trainer', 'consumes the row', 'compute advantages'],
  ];
  steps.forEach(([name, verb, example], i) => {
    const x = 120 + i * 440;
    api.text(ctx, name, x, 415, 41, C.ink, 'left', 'serif');
    api.text(ctx, verb, x, 510, 31, C.muted);
    api.text(ctx, example, x, 660, 28, i === 2 ? C.cyan : C.blue);
    if (i < 3) api.arrow(ctx, x + 325, 555, x + 405, 555, C.muted, 3);
  });
  api.focus.target('seams-record', () => {
    api.text(ctx, terminalTask ? 'Terminal episode' : 'SQL episode', 125, 278, 39, C.yellow);
    api.text(
      ctx,
      state.beat === 1
        ? 'query-42_0  ·  both SQL turns stay in the same record'
        : 'Step-wise row    /    episode_complete records whether the episode ended',
      960,
      880,
      33,
      C.cyan,
      'center',
      'mono',
    );
  });
}
export default {
  id: 'seams-record',
  draw: drawSeamsRecord,
  cues: ['seams-include-three', 'seams-extra-row', 'seams-handoff', 'seams-switch-task'],
};
