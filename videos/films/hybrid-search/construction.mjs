import { bounded } from './arithmetic.mjs';
import { FUSION_LANES } from './fixtures.mjs';
import { coordinateGeneration, fuse } from './model.mjs';
export function fusionSnapshot(beat, progress) {
  const amount =
    beat === 0
      ? 0
      : beat === 1
        ? Math.max(0, Math.min(2, ((progress - 0.08) / 0.68) * 2))
        : 2 +
          (progress < 0.18
            ? Math.max(0, progress / 0.18)
            : progress < 0.39
              ? 1 + (progress - 0.18) / 0.21
              : 2);
  const received = Math.floor(amount + 1e-9);
  const lanes = FUSION_LANES.map((lane, i) =>
    lane.slice(0, Math.max(0, Math.min(lane.length, received - i * 2))),
  );
  const events = FUSION_LANES.flatMap((lane, laneIndex) =>
    lane.map((id, index) => ({
      id,
      lane: laneIndex,
      rank: index + 1,
      value: 1 / (61 + index),
    })),
  );
  const inFlight =
    beat === 0 || (beat === 1 && received >= 2) || received >= events.length
      ? null
      : {
          ...events[received],
          progress: amount - received,
        };
  return {
    received,
    events: events.slice(0, received),
    result: fuse(lanes),
    inFlight,
  };
}
export function consensusSnapshot(beat, progress) {
  const seconds = progress * [14.878, 17.334, 17.278][beat],
    lanes = [
      ['Garden', 'Cooking'],
      ['Travel', 'Cooking'],
    ];
  const events = lanes.flatMap((lane, laneIndex) =>
    lane.map((id, index) => ({
      id,
      lane: laneIndex,
      rank: index + 1,
      value: 1 / (61 + index),
    })),
  );
  const arrived = beat > 0 ? 4 : Math.max(0, Math.min(4, Math.floor((seconds - 10.7) / 0.75) + 1));
  return {
    seconds,
    lanes,
    events: events.slice(0, arrived),
    arrived,
    cutoff: beat > 1 || (beat === 1 && seconds >= 13.9),
  };
}
export function newQuerySnapshot(beat, progress, cues = {}) {
  const seconds = beat < 2 ? progress * [14.83, 18.03][beat] : null,
    lanes = [
      ['Bread basics', 'Soup'],
      ['Slow bread', 'Bread basics'],
    ];
  const returned =
    beat === 0
      ? 0
      : beat > 1
        ? 4
        : Math.max(0, Math.min(4, Math.floor((seconds - 0.5) / 0.65) + 1));
  const contributed =
    beat === 0 ? 0 : beat > 1 ? 4 : Math.max(0, Math.min(4, Math.floor((seconds - 3.4) / 0.7) + 1));
  const received = lanes.map((lane, i) =>
    lane.slice(0, Math.max(0, Math.min(2, contributed - i * 2))),
  );
  const cue = cues['expand-final-cutoff'],
    cutoffProgress =
      beat < 2
        ? 0
        : cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : bounded(cue.progress)
          : bounded((progress - 0.08) / 0.25);
  return {
    seconds,
    lanes,
    returned,
    contributed,
    result: fuse(received),
    cutoffProgress,
    budget: cutoffProgress >= 0.5 ? 2 : 1,
  };
}
export function coordinateFrame(state) {
  const p = (id) => state.cues?.[id]?.progress ?? 0,
    motion = (id) => Math.max(0, (p(id) - 0.3) / 0.7),
    queryDegrees = Math.round(90 * motion('version-query-rotate')),
    passageDegrees = Math.round(90 * motion('version-passages-rotate')),
    repaired = p('version-fixed-rank') === 1,
    wrong = p('version-wrong-rank') === 1,
    ready = p('version-worksheet') === 1;
  return {
    ...coordinateGeneration(queryDegrees, passageDegrees),
    queryDegrees,
    passageDegrees,
    repaired,
    wrong,
    scoreKnown: repaired || (wrong && passageDegrees === 0) || (ready && queryDegrees === 0),
    worksheet: p('version-worksheet') > 0,
  };
}
