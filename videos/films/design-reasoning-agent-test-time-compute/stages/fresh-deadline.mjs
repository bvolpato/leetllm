import { freshDeadline } from '../model.mjs';
import { beatCue } from '../construction.mjs';
import { drawLedger } from '../ledger-picture.mjs';

export function drawFreshDeadline(ctx, scene, state, api) {
  const held = freshDeadline(state);
  const pendingA = held.reservations.find((r) => r.id === 'A');
  const receipt = !pendingA;
  const parts = [
    { id: 'C', value: 900 },
    { id: 'B', value: held.reservations.find((r) => r.id === 'B').value, held: true },
    { id: 'A', value: receipt ? held.spent - 900 : pendingA.value, held: !receipt },
  ];
  if (held.settled) parts.push({ ...held.reservations.find((r) => r.id === 'D'), held: true });
  const verdict = held.deadline
    ? 'Deadline reached   /   dispatch closed'
    : held.settled
      ? 'D admitted'
      : receipt
        ? 'A settled   /   compare D with the free space'
        : held.reveal
          ? 'D waits for capacity'
          : 'Can D start now?';
  drawLedger(ctx, api, {
    cap: 6000,
    parts,
    freeLabel: held.reveal,
    request: {
      id: 'D',
      value: 1500,
      visible: beatCue(state, 'ra-fresh-deadline-0-4', 0, 0.57).started,
    },
    verdict,
    note: held.deadline
      ? 'Usage outstanding     B 2,000  +  D 1,500  =  3,500 held'
      : receipt
        ? 'A reserved 2,000    -    A used 1,400    =    600 released'
        : beatCue(state, 'ra-fresh-deadline-0-6', 0, 0.74).started
          ? 'Next receipt     A used 1,400 of its 2,000'
          : null,
    detail: held.returnC
      ? 'To release owner     C  /  Hold the canary at 10%'
      : 'C   /   completed advisory   /   evidence checked',
  });
}

export default {
  id: 'fresh-deadline',
  draw: drawFreshDeadline,
  cues: [
    'ra-fresh-deadline-0-0',
    'ra-fresh-deadline-0-1',
    'ra-fresh-deadline-0-2',
    'ra-fresh-deadline-0-3',
    'ra-fresh-deadline-0-4',
    'ra-fresh-deadline-0-5',
    'ra-fresh-deadline-0-6',
    'ra-fresh-deadline-0-7',
    'ra-fresh-deadline-1-0',
    'deadline-receipt',
    'ra-fresh-deadline-1-1',
    'ra-fresh-deadline-1-2',
    'ra-fresh-deadline-1-3',
    'ra-fresh-deadline-1-4',
    'ra-fresh-deadline-1-5',
  ],
};
