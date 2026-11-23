import { readiness, recoveryReady, STABLE } from '../model.mjs';
import { capacityRuler } from '../receipts.mjs';

export function drawCapacity(ctx, scene, state, api) {
  const { C, focus } = api;
  const answering = ['during', 'after'].includes(focus.cue('ready-workers')?.phase);
  const added = answering ? 1 : focus.progress('add-workers', 0);
  const later = state.beat > 0 && (added > 0 || answering);
  const receipt = readiness[later ? 1 : 0];
  const ready = recoveryReady(receipt);
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);

  focus.target('stable-capacity', () => {
    write('Readiness receipt ' + receipt.id, 160, 266, 33, C.muted);
    write('STABLE  ' + STABLE.slice(0, 12), 1750, 266, 33, C.blue, 'right');
    write('Traffic returning to stable', 160, 398, 57);
    capacityRuler(ctx, api, receipt, 120, 552, readiness[0].capacity, later ? added : 1);
    write('Workers healthy   ·   conversation state compatible', 160, 815, 34);
    const done = focus.cue(later ? 'ready-workers' : 'capacity-gap')?.phase === 'after';
    const verdict = ready
      ? 'Ready for all ' + receipt.demand + ' supplied requests/s'
      : 'Capacity gap ' + (receipt.demand - receipt.capacity) + ' requests/s';
    write(
      done ? verdict : 'Can these workers carry the returning load?',
      960,
      953,
      43,
      done ? (ready ? C.green : C.pink) : C.yellow,
      'center',
    );
  });
}
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: ['capacity-gap', 'add-workers', 'ready-workers'],
};
