import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'old',
    snapshot: 0,
  },
  cues: [
    {
      id: 'fresh',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
    {
      id: 'changed',
      beat: 2,
      at: 0,
      snapshot: 2,
    },
  ],
});
export const base = {
  document: 'scope.py',
  version: 42,
  cursor: 23,
  selection: {
    start: 23,
    end: 23,
  },
  policy: 7,
  epoch: 42,
};
export const accepted = [18, 4, 42, 0];
export const retained = [0, 4, 35, 0];
export const observations = [
  {
    start: 0.2,
    edit: 0.258,
    end: 0.316,
  },
  {
    start: 0.329,
    edit: 0.35,
    end: 0.394,
  },
  {
    start: 0.408,
    edit: 0.433,
    end: 0.472,
  },
  {
    start: 0.487,
    edit: 0.5,
    end: 0.55,
  },
];
export const phaseDurations = [12, 55, 28, 78, 10];
