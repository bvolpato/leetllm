import { transpose } from './arithmetic.mjs';
import { createCueTrack } from 'vizmatic';
export const track = (ids) =>
  Object.fromEntries(
    ids.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: id + '-initial',
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: id + '-' + step,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
export const introOrder = [
  6,
  ...Array.from(
    {
      length: 16,
    },
    (_, i) => i,
  ).filter((i) => i !== 6),
].map((i) => transpose(4)[i]);
export const ids = ['intro', 'sectors', 'tiles', 'banks', 'barrier', 'primitives', 'synthesis'];
export const tracks = track(ids);
export const bits = [0, 1, 0, 1, 1, 0, 0, 1];
export const recordedTiming = Object.freeze({
  naive: [0.33744925, 0.32822976, 0.32808864, 0.33535457, 0.32331136],
  tiled: [0.20233473, 0.18930496, 0.19514015, 0.188888, 0.19616833],
  padded: [0.20093249, 0.19010113, 0.19432801, 0.19465919, 0.19068672],
});
