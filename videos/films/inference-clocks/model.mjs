import { capacityFixture, deliveryState, metrics } from './arithmetic.mjs';
import { outputs, prompt, tokenTimes, tracks } from './fixtures.mjs';
import { clamp, icCompleted, icProgress, progress } from './construction.mjs';
import { passage, spoken } from './trace.mjs';

export function decodeHistory(state) {
  const step = state.beat;
  const take = ['take-at', 'take-dawn', 'take-too'][step];
  const emit = ['emit-dawn', 'emit-too', 'emit-period'][step];
  const feed = passage(state, step, take, 0.12, 0.48);
  const consumed = step + Number(spoken(state, step, take, 0.48));
  const emitted = step + 1 + Number(spoken(state, step, emit, 0.55));
  return {
    feed,
    consumed,
    emitted,
    cached: [...prompt, ...outputs.slice(0, consumed)],
    prediction: outputs[emitted - 1],
  };
}

export function synthesisState(beat, beatP) {
  const elapsed = clamp(beatP) * [19.73, 18.914, 17.648][beat];
  const phase = (start, end) => clamp((elapsed - start) / (end - start));
  const promptCount = beat > 0 ? 4 : Math.min(4, Math.floor(phase(3.375, 7.2125) * 4 + 1e-9));
  const generated = beat > 0 ? 4 : [7.3, 8.5, 9.5, 10.5].filter((at) => elapsed >= at).length;
  const consumed = Math.max(0, generated - 1);
  const server = tokenTimes.slice(0, generated).map((time, i) => ({
    id: `T${i + 1}`,
    time,
  }));
  const buffered = beat > 1 ? 1 : beat === 1 ? phase(8.7375, 9.65) : 0;
  const client =
    beat === 0
      ? []
      : tokenTimes.map((time, i) => ({
          id: `T${i + 1}`,
          time: i < 2 ? time + 30 : time + 30 + (470 - time - 30) * buffered,
        }));
  const focus =
    beat === 0
      ? elapsed < 7.3
        ? 'prefill'
        : elapsed < 10.9875
          ? 'decode'
          : elapsed < 13.525
            ? 'cache'
            : elapsed < 15.0375
              ? 'first'
              : 'gaps'
      : beat === 1
        ? elapsed < 5.8
          ? 'client-first'
          : elapsed < 10.0625
            ? 'buffer'
            : 'boundary'
        : elapsed < 6.5
          ? 'identity'
          : elapsed < 7.5125
            ? 'boundary'
            : elapsed < 8.6875
              ? 'outputs'
              : elapsed < 10.9875
                ? 'cache'
                : 'all';
  return {
    elapsed,
    promptCount,
    generated,
    consumed,
    server,
    client,
    buffered,
    focus,
    cached: promptCount + consumed,
    serverMetrics: metrics(0, tokenTimes),
    clientTtft: 350 - -30,
    clientEvents: buffered === 1 ? 3 : 4,
  };
}
export function sampleModel(sceneId, state) {
  const sampled = tracks[sceneId].sample(state).snapshot;
  const step = sampled.step,
    p = progress(state.beatP ?? 0);
  if (sceneId === 'synthesis')
    return {
      step,
      p,
      ...synthesisState(step, state.beatP ?? 0),
    };
  if (sceneId === 'decode') return { step, p, ...decodeHistory(state) };
  if (sceneId === 'prefill')
    return {
      step,
      p,
      cached: step === 0 ? [] : prompt,
      prediction: step === 0 ? null : outputs[0],
    };
  if (sceneId === 'first-clock') {
    const restore = Math.min(1, p / 0.55);
    const queue = step === 0 ? 70 : step === 1 ? 70 * (1 - p) : 70 * restore;
    const durations = [queue, 10, 230, 10];
    let cursor = 0;
    const spans = ['Queue', 'Tokenization', 'Prefill', 'First-logit work'].map((name, i) => {
      const span = {
        name,
        start: cursor,
        duration: durations[i],
        end: cursor + durations[i],
      };
      cursor = span.end;
      return span;
    });
    const constructionClock = step === 0 ? cursor * p : cursor;
    const clientExtra = step === 2 ? Math.round(30 * clamp((p - 0.55) / 0.45)) : 0;
    return {
      step,
      p,
      spans,
      constructionClock,
      clientExtra,
      serverFirst: cursor,
      clientSend: -clientExtra,
      serverArrival: 0,
      clientFirst: cursor + clientExtra,
      serverTtft: cursor,
      clientTtft: cursor + 2 * clientExtra,
    };
  }
  if (sceneId === 'delivery') {
    const clock = step === 1 ? 385 + 85 * p : 470,
      buffered = deliveryState(clock),
      events =
        step === 0
          ? tokenTimes.map((time, i) => ({
              time: time + 30,
              ids: ['T' + (i + 1)],
            }))
          : buffered.events;
    const gaps = events.slice(1).map((event, i) => event.time - events[i].time);
    return {
      step,
      p,
      clock,
      buffer: step === 0 ? [] : buffered.buffer,
      planned: step === 0 ? events : buffered.planned,
      events,
      gaps,
      server: metrics(0, tokenTimes),
      lastIntervalAverage: gaps.at(-1) / events.at(-1).ids.length,
    };
  }
  if (sceneId === 'roofline') {
    const rows = step === 0 ? 1 : step === 1 ? 1 + Math.floor(31 * p + 1e-9) : 32;
    const weightBytes = 16 * 2,
      flops = 2 * rows * 16,
      intensity = flops / weightBytes;
    return {
      step,
      p,
      rows,
      weightBytes,
      flops,
      intensity,
      bandwidth: 10,
      compute: 200,
      roof: Math.min(200, 10 * intensity),
      ridge: 20,
    };
  }
  const cursor =
    sceneId === 'intro' ? (step === 0 ? 320 * p : step === 1 ? 320 + 108 * p : 428) : 428;
  const arrived = tokenTimes
    .map((time, i) => ({
      id: `T${i + 1}`,
      time,
    }))
    .filter((token) => token.time <= cursor);
  return {
    step,
    p,
    cursor,
    arrived,
    ...metrics(0, tokenTimes),
  };
}
export function quantizedCapacityFrame(state) {
  const f = capacityFixture(),
    b = state.beat ?? 0,
    known = (id) => b > 1 || (b === 1 && icCompleted(state, id));
  return {
    device: known('ic-cap-device'),
    weights: known('ic-cap-weights'),
    reserve: known('ic-cap-reserve'),
    pool: known('ic-cap-pool'),
    positions: known('ic-cap-positions'),
    oneByteChunks:
      b > 0 ? 8 : Math.min(8, Math.floor(icProgress(state, 'ic-one-byte-row') * 8 + 1e-9)),
    twoUsers: b > 1 ? 53 : b === 1 ? Math.floor(icProgress(state, 'ic-cap-53') * 53 + 1e-9) : 0,
    oneUsers: b > 1 ? 107 : b === 1 ? Math.floor(icProgress(state, 'ic-cap-107') * 107 + 1e-9) : 0,
    twoResult: known('ic-cap-53'),
    oneResult: known('ic-cap-107'),
    perUser: f.kvOnly.perUser,
    poolBytes: f.kvOnly.pool,
  };
}
export function inferenceCapacityAnswerVisible(state) {
  return (
    (state.beat ?? 0) > 2 || ((state.beat ?? 0) === 2 && icCompleted(state, 'ic-capacity-answer'))
  );
}
