import { sum } from './arithmetic.mjs';
import { accepted, base, observations, phaseDurations, retained, track } from './fixtures.mjs';
import { fresh, route } from './model.mjs';
export function suggestionPlayback(state) {
  const p = state.beat > 0 ? 1 : Math.max(0, Math.min(1, state.beatP ?? 0));
  const rows = observations.map(({ start, edit, end }, index) => {
    const visible = p >= start,
      complete = p >= end;
    const editing = Math.max(0, Math.min(1, (p - edit) / (end - edit)));
    const inserted = visible ? accepted[index] : 0;
    const present = visible ? Math.round(inserted + (retained[index] - inserted) * editing) : 0;
    return {
      id: 'ABCD'[index],
      visible,
      complete,
      inserted,
      present,
    };
  });
  const shown = rows.filter((row) => row.visible).length;
  return {
    rows,
    shown,
    complete: rows.filter((row) => row.complete).length,
    active: rows.findIndex((row) => row.visible && !row.complete),
    accepted: rows.filter((row) => row.inserted > 0).length,
    inserted: sum(rows.map((row) => row.inserted)),
    present: sum(rows.map((row) => row.present)),
  };
}
export function fimTrace(beat, progress) {
  const seconds = progress * [18.438, 18.034][beat],
    phase = (a, b) => Math.max(0, Math.min(1, (seconds - a) / (b - a)));
  const reorder = beat === 0 ? 0 : phase(0.35, 4.9),
    generated = beat === 0 ? 0 : phase(5.45, 6.5);
  return {
    reorder,
    generated,
    inserted: generated === 1 && seconds >= 16.8,
    returnProgress: beat === 0 ? 0 : phase(16.8, 17.7),
  };
}
export function phases(offset = 0, lane = 'request') {
  let time = offset;
  return phaseDurations.map((duration, i) => {
    const interval = {
      id: lane + '-' + i,
      lane,
      start: time,
      end: time + duration,
    };
    time += duration;
    return interval;
  });
}
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7)),
    current =
      b === 2
        ? {
            ...base,
            policy: 8,
            epoch: 43,
          }
        : base,
    response =
      b === 0
        ? {
            ...base,
            version: 41,
            epoch: 41,
          }
        : base;
  return {
    b,
    p,
    q: b ? 1 : p,
    current,
    response,
    fresh: fresh(response, current),
    assignmentRoute: route('=', false, b === 0),
    timing: {
      immediate: b ? 183 : 183 * p,
      delayed: b ? 333 : null,
    },
    suggestions: suggestionPlayback(state),
  };
}
export const completionCue = (state, id) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.max(0, Math.min(1, cue.progress))
    : 0;
};
export function editorEpochState(state) {
  const b = state.beat ?? 0,
    moved = completionCue(state, 'cc-fresh-move15') >= 1,
    returned = completionCue(state, 'cc-fresh-return12') >= 1,
    denied = b > 0 && completionCue(state, 'cc-fresh-deny') >= 1,
    submitted = b > 0 && completionCue(state, 'cc-fresh-current-request') >= 1,
    painted = b > 0 && completionCue(state, 'cc-fresh-current-paint') >= 1;
  return {
    responseEpoch: 101,
    currentEpoch: submitted ? 104 : returned ? 103 : moved ? 102 : 101,
    cursor: returned || submitted ? 12 : moved ? 15 : 12,
    denied,
    submitted,
    painted,
    answerVisible: b > 0,
  };
}
