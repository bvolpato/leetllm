import { drainGroups } from '../protocols.mjs';
import { lerp } from '../arithmetic.mjs';
import { progress } from '../phrase-clock.mjs';

const completed = [5, 2, 4, 1, 3].map((index) => ({ id: 'G' + index, index }));
const { taken, handedOff, surplus } = drainGroups(completed, 2);
const x = (index) => 500 + 276 * index;

export function drawQueueHandoff(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  return api.focus.target('handoff-trace', () => {
    if (state.beat < 2) {
      api.text(ctx, 'Groups in completion order', 130, 277, 35, C.ink);
      api.text(ctx, 'Trainer requests 2 groups', 1790, 277, 35, C.yellow, 'right');
      api.text(ctx, 'Queue front', 119, 492, 35, C.blue);
      const drain = p('take-pair');
      const sort = p('sort-pair');
      const delivered = p('deliver-first') === 1;
      api.text(ctx, delivered ? 'To trainer' : 'Selected pair', 119, 731, 35, C.cyan);
      completed.forEach((group, i) => {
        const moving = taken.includes(group);
        const destination = handedOff.indexOf(group);
        const signed = i === 0 ? 1 : -1;
        const tx = moving ? lerp(x(i), x(destination), (1 - Math.cos(Math.PI * sort)) / 2) : x(i);
        const ty = moving ? lerp(470, 703, drain) + signed * 81 * Math.sin(Math.PI * sort) : 470;
        const color = moving && drain > 0 ? C.cyan : C.blue;
        api.rect(ctx, tx - 95, ty - 53, 190, 106, C.panel, color, 8);
        api.text(ctx, group.id, tx, ty + 20, 52, color, 'center');
      });
      const status =
        drain === 1
          ? `${surplus.length} queued   /   new launches open below 4`
          : '5 queued   /   new launches closed at 4';
      api.text(ctx, status, 1750, 623, 33, C.muted, 'right');
      let note = 'Take the front pair. Sort that pair by sample index.';
      if (p('which-first') > 0 && drain === 0) note = 'Which group reaches the trainer first?';
      if (delivered)
        note = `Handoff: ${handedOff.map((g) => g.id).join(' then ')}.   Still queued: ${surplus.map((g) => g.id).join(', ')}.`;
      api.text(ctx, note, 960, 954, 40, C.yellow, 'center');
      return;
    }
    const routes = [
      ['Completed group', 'Completion queue', 'accept-list', C.blue],
      ['Group with an aborted Sample', 'Back to the input buffer', 'return-abort', C.yellow],
      ['Callback returned a non-list', 'Drop result', 'drop-nonlist', C.pink],
    ];
    routes.forEach(([source, destination, id, color], i) => {
      const y = 402 + 182 * i;
      api.text(ctx, source, 145, y, 37, C.ink);
      const moved = p(id);
      api.line(ctx, 796, y - 12, 1175, y - 12, C.muted, 2);
      if (moved > 0) api.circle(ctx, lerp(796, 1175, moved), y - 12, 11, color);
      api.text(ctx, moved === 1 ? destination : '?', 1240, y, 35, moved === 1 ? color : C.muted);
    });
    api.text(
      ctx,
      'The pinned warm worker supports training rollouts.',
      960,
      958,
      35,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'queue-handoff',
  draw: drawQueueHandoff,
  cues: [
    'which-first',
    'take-pair',
    'sort-pair',
    'deliver-first',
    'accept-list',
    'return-abort',
    'drop-nonlist',
  ],
};
