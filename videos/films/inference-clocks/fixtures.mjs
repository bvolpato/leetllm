import { createCueTrack } from 'vizmatic';
export function buildSceneTracks() {
  const sceneIds = [
    'intro',
    'prefill',
    'decode',
    'first-clock',
    'cadence',
    'delivery',
    'roofline',
    'synthesis',
  ];
  const tracks = Object.fromEntries(
    sceneIds.map((id) => [
      id,
      createCueTrack({
        initial: {
          id: `${id}-initial`,
          snapshot: {
            step: 0,
          },
        },
        cues: [0, 1, 2].map((step) => ({
          id: `${id}-${step}`,
          beat: step,
          at: 0,
          snapshot: {
            step,
          },
        })),
      }),
    ]),
  );
  return {
    sceneIds,
    tracks,
  };
}
export const { sceneIds, tracks } = buildSceneTracks();
export const tokenTimes = Object.freeze([320, 355, 392, 428]);
export const prompt = ['The', 'birds', 'sing', 'softly'];
export const outputs = ['at', 'dawn', 'too', '.'];
export const replyBTimes = Object.freeze([80, 196, 312, 428]);
export const alternateServerTimes = Object.freeze([320, 355, 438, 440]);
