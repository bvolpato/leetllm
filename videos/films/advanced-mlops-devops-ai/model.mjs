import { base, candidate, tracks } from './fixtures.mjs';
import { digest, mix, motion, timedProgress } from './arithmetic.mjs';
import { featureImpact, featureWindowState } from './features.mjs';
export function decide({ latency, quality }) {
  return latency === null || !Number.isFinite(latency) || latency > 850
    ? 'ROLLBACK'
    : quality === null || !Number.isFinite(quality) || quality < 0.82
      ? 'REVIEW'
      : 'CONTINUE';
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q =
      id === 'intro'
        ? step > 0
          ? 1
          : timedProgress(state.beatP, 21.266, 11.9, 14.1)
        : id === 'vectors'
          ? step === 0
            ? 0
            : timedProgress(state.beatP, 22.466, 0.7, 4.7)
          : motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      base,
      candidate,
      hashes: [digest(base), digest(candidate)],
      features: featureImpact(q),
    };
  if (id === 'vectors') {
    const p = step === 0 ? 0 : q,
      a = [mix(3, 0.6, p), mix(4, 0.8, p)],
      z = [mix(2, 1, p), 0];
    return {
      step,
      q,
      a,
      z,
      scores: [a[0], z[0]],
      winner: a[0] > z[0] ? 'A' : a[0] < z[0] ? 'B' : 'TIE',
    };
  }
  if (id === 'time')
    return {
      step,
      q,
      ...featureWindowState(state),
    };
  if (id === 'budget') {
    const variant = step === 0 ? 'BASELINE' : 'CANDIDATE',
      tokens = step === 0 ? 620 : 790,
      quality = step === 0 ? 0.84 : 0.87,
      latency = step === 0 ? 820 : 970,
      increase = tokens / 620 - 1;
    return {
      step,
      q,
      variant,
      tokens,
      quality,
      latency,
      increase,
      pass: quality > 0.84 && increase <= 0.15 && latency <= 1000,
    };
  }
  if (id === 'shadow') {
    const assignments = [
      {
        subject: 'Conversation A',
        bucket: 14,
        release: 'CONTROL',
      },
      {
        subject: 'Conversation B',
        bucket: 0,
        release: 'CANDIDATE',
      },
    ];
    return {
      step,
      q,
      assignments,
      ramp: step === 0 ? 10 : 25,
    };
  }
  if (id === 'controller') {
    const latency = 910,
      quality = 0.79,
      generation = step === 0 || q < 0.2 ? 12 : q < 0.4 ? 13 : 14,
      observed = 12;
    return {
      step,
      q,
      latency,
      quality,
      decision: decide({
        latency,
        quality,
      }),
      generation,
      observed,
      applies: generation === observed,
      latencyChecked: step > 0 || q >= 0.25,
      qualityChecked: step > 0 || q >= 0.5,
      selected: step > 0 || q >= 0.7,
      commandArrived: step > 0 && q >= 0.7,
      compared: step > 0 && q >= 0.82,
      command: 'rollback-12',
      release: 'candidate-C',
      currentRelease: generation === 13 ? 'baseline-B' : 'candidate-C',
    };
  }
  const repaired = step > 0 && q > 0.4;
  return {
    step,
    q,
    runtime: 'BASELINE',
    desired: repaired ? 'BASELINE' : 'CANDIDATE',
    reconciled: repaired,
    served: step > 0 && q > 0.7 ? 'BASELINE' : 'AWAITING ACK',
  };
}
