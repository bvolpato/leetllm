import { policyDesk, thresholdTrial } from '../policy-desk.mjs';

export function drawCapacity(ctx, scene, state, api) {
  const cue = (id) => api.focus.progress(id, 0);
  const middle = cue('policy-middle');
  const low = cue('policy-low');
  const restore = cue('choose-feasible');
  const seats = cue('sixth-seat') === 1 ? 6 : cue('fifth-seat') === 1 ? 5 : 4;
  let selected = null;
  const known = [0.8];
  if (middle === 1) known.push(0.5);
  if (low === 1) known.push(0.2);
  let prompt = 'A missed review costs $120. An unnecessary review costs $18.';
  if (middle === 1 && low === 0) prompt = 'V4 adds $18. Catching V3 removes $120.';
  if (low === 1) prompt = 'Which cut has the lowest bill while using at most four slots?';
  if (restore === 1) {
    selected = 0.5;
    prompt = 'Freeze the 0.50 cut for the next four-slot batch.';
  }
  if (seats === 5) {
    selected = cue('five-seat-cut') === 1 ? 0.5 : null;
    prompt = selected === null
      ? 'With five slots, can the desk use the $36 cut?'
      : 'With five slots, keep 0.50. The 0.20 queue needs six.';
  }
  if (seats === 6) {
    selected = cue('six-seat-cut') === 1 ? 0.2 : null;
    prompt = selected === null
      ? 'Six slots are available for these same eight requests.'
      : 'With six slots, 0.20 saves $102 on these eight requests.';
  }
  policyDesk(ctx, api, {
    ...thresholdTrial(api, 0.8, [
      ['policy-middle', 0.5],
      ['policy-low', 0.2],
      ['choose-feasible', 0.5],
      ['final-replay', 0.2],
      ['five-seat-cut', 0.5],
      ['six-seat-trial', 0.2],
    ]),
    seats,
    known,
    selected,
    prompt,
  });
}

export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: [
    'policy-queues', 'policy-middle', 'policy-low', 'choose-feasible',
    'fifth-seat', 'final-replay', 'five-seat-cut', 'sixth-seat', 'six-seat-trial', 'six-seat-cut',
  ],
};
