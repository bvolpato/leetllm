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
export const ids = ['intro', 'vectors', 'time', 'budget', 'shadow', 'controller', 'reconcile'];
export const tracks = track(ids);
export const base = {
  prompt: 'support@2.8',
  base: 'base@42',
  adapter: 'lora@1.9',
  feature: 'releases@4',
  normalize: 'l2',
};
export const candidate = {
  ...base,
  feature: 'releases@5',
  normalize: 'none',
};
export const FEATURE_TIME_CUES = Object.freeze({
  duration: 21.074,
  tightenStart: 9.225,
  tightenEnd: 10.4375,
});
