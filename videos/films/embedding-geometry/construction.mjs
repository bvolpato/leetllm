import { SNAPSHOTS } from './fixtures.mjs';
import { createCueTrack } from 'vizmatic';
export function makeTrack(sceneId, snapshots) {
  return createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
}
export const TRACKS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
