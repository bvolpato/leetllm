import { within } from './arithmetic.mjs';
import { FORECAST_CUE_AT, errors, quietPeriodReveal, residualCues } from './fixtures.mjs';
import { smoothstep } from 'vizmatic';
import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { sampleNarrationCues } from '../../lib/narration-cues.mjs';
import { estimatedTimeline } from '../../lib/stage-lesson.mjs';

const storyboardTimings = new WeakMap();

function forecastClock(scene, state) {
  if (state.cues) return state;
  let timing = storyboardTimings.get(scene);
  if (!timing) {
    timing = estimatedTimeline({ id: 'forecasting', scenes: [scene] }).scenes[0];
    storyboardTimings.set(scene, timing);
  }
  const beat = timing.beats[state.beat ?? 0];
  const time = beat.start + (beat.until - beat.start) * (state.beatP ?? 0);
  return { cues: sampleNarrationCues(timing.visualCues, time) };
}

export function timedForecastScene(id, paint) {
  const prefix = `fc-${id}-`;
  return {
    id,
    cues: Object.keys(FORECAST_CUE_AT).filter((cue) => cue.startsWith(prefix)),
    draw(ctx, scene, state, api) {
      const clock = forecastClock(scene, state);
      const progress = (name) => operationProgress(clock, prefix + name);
      const after = (name) => resultAfter(clock, prefix + name);
      return paint(ctx, api, { beat: state.beat ?? 0, progress, after }, state);
    },
  };
}
export function residualSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * residualCues.beatSpans[Math.min(beat, 1)];
  const collected =
    beat < 1
      ? 0
      : beat > 1
        ? errors.length
        : Math.floor(
            errors.length *
              Math.max(
                0,
                Math.min(
                  1,
                  (seconds - residualCues.addStart) / (residualCues.addEnd - residualCues.addStart),
                ),
              ),
          );
  return {
    bars: errors.map((value, index) => ({
      value,
      height: Math.abs(value) * 10,
      opacity: beat > 0 ? 1 : smoothstep((seconds - residualCues.values[index]) / 0.25),
      collected: index < collected,
    })),
    collected,
    absoluteSum: errors.slice(0, collected).reduce((sum, value) => sum + Math.abs(value), 0),
    signedMeanVisible: beat > 1 || (beat === 1 && seconds >= residualCues.signedMean),
    absoluteVisible: beat > 1 || (beat === 1 && seconds >= residualCues.absoluteIntro),
    divisionVisible: beat > 1 || (beat === 1 && seconds >= residualCues.addEnd),
    meanVisible: beat > 1 || (beat === 1 && seconds >= residualCues.mean),
  };
}
export function quietPeriodRevealOpacity(beat, progress) {
  if (beat < quietPeriodReveal.beat) return 0;
  if (beat > quietPeriodReveal.beat) return 1;
  return smoothstep(
    (progress - quietPeriodReveal.start) / (quietPeriodReveal.end - quietPeriodReveal.start),
  );
}
export function forecastCueProgress(state, id) {
  if (!(id in FORECAST_CUE_AT)) throw Error('Unknown forecasting cue ' + id);
  if (state.cues) {
    if (!state.cues[id]) throw Error('Missing current-scene forecasting cue ' + id);
    return within(state.cues[id].progress ?? 0);
  }
  const beat = state.beat ?? 0,
    at = FORECAST_CUE_AT[id];
  return beat > at ? 1 : beat < at ? 0 : within(state.beatP ?? 0);
}
