import { clamp, smooth, storyAt } from './arithmetic.mjs';
import { CASES, tracks } from './fixtures.mjs';
export function sampleModel(sceneId, state) {
  if (!tracks[sceneId]) throw new Error(`unknown behavioral-interview scene: ${sceneId}`);
  const held = tracks[sceneId].sample({
    beat: state.beat ?? 0,
    beatP: state.beatP ?? 0,
  });
  const step = held.snapshot.step,
    p = clamp(state.beatP ?? 0),
    q = smooth(p);
  let time = step * 3 + q * 3;
  if (sceneId === 'timeline' && state.cues) {
    const cue = (id) => state.cues[id]?.progress ?? 0;
    if ((state.beat ?? 0) === 0) time = 2.7 * cue('timeline-beat-1-focus-1');
    else
      time =
        cue('timeline-approved') >= 1
          ? 6
          : cue('timeline-approved') > 0
            ? 4.6 + 0.2 * cue('timeline-approved')
            : cue('timeline-cases-pass') > 0
              ? 3.6 + cue('timeline-cases-pass')
              : 2.7 + 0.9 * cue('timeline-repair');
  }
  const story = storyAt(time);
  const revealedCases = step ? Math.round(q * CASES.length) : 0;
  const traffic = story.candidateTraffic;
  const allocation = {
    candidate: traffic,
    priorVersion: 100 - traffic,
  };
  const latencyCue = state.cues?.['canary-latency-comparison'];
  const p95Visible = latencyCue ? latencyCue.phase !== 'before' : step === 1 || q >= 0.45;
  return {
    step,
    q,
    time,
    phase: story.phase,
    story,
    revealedCases,
    allocation,
    p95Visible,
    p95Ms: 420,
    latencyLimit: 500,
    caseNames: CASES,
    roles: [
      {
        id: 'candidate',
        label: 'you · reproduce + release check',
        color: '#79aaff',
      },
      {
        id: 'service',
        label: 'service owner · repair authorization',
        color: '#63deec',
      },
      {
        id: 'release',
        label: 'release owner · approve stage',
        color: '#8cdeb5',
      },
    ],
    evidence: [
      {
        id: 'cases',
        label: 'two targeted access checks',
        value: 'pass on candidate',
      },
      {
        id: 'latency',
        label: 'declared canary window',
        value: '420 / 500 ms',
      },
      {
        id: 'incidents',
        label: 'incident-rate evidence',
        value: 'unknown',
      },
    ],
  };
}
