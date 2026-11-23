import { QUEUE_EVENTS, ids } from './fixtures.mjs';
import { clamp, graphCost, motion, pipeline, schedule, sum } from './arithmetic.mjs';
import { sampleRuntimeChapter } from './construction.mjs';
import assert from 'node:assert/strict';
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
export const tracks = track(ids);
export function queueState(events) {
  const slots = Array.from(
    {
      length: 4,
    },
    (_, id) => ({
      id,
      state: 'FREE',
      request: null,
      worker: null,
      result: null,
      lastReleased: null,
    }),
  );
  const accepted = new Set(),
    completed = new Map(),
    released = new Set(),
    history = [];
  for (const e of events) {
    const slot = slots[e.slot];
    assert(slot, 'Unknown slot');
    if (e.type === 'publish') {
      assert.equal(slot.state, 'FREE', 'Publication requires a released slot');
      assert(
        Number.isInteger(e.request) && e.request >= 1 && e.request <= 6 && !accepted.has(e.request),
        'Request must be admitted once',
      );
      Object.assign(slot, {
        state: 'PUBLISHED',
        request: e.request,
        worker: null,
        result: null,
      });
      accepted.add(e.request);
    } else if (e.type === 'claim') {
      assert.equal(slot.state, 'PUBLISHED', 'Claim requires a published descriptor');
      assert(/^W[0-3]$/.test(e.worker));
      Object.assign(slot, {
        state: 'CLAIMED',
        worker: e.worker,
      });
    } else if (e.type === 'complete') {
      assert.equal(slot.state, 'CLAIMED', 'Completion requires a claim');
      assert.equal(e.worker, slot.worker, 'Only the owner completes');
      slot.state = 'COMPLETED';
      slot.result = pipeline([slot.request]).result;
      completed.set(slot.request, slot.result);
    } else if (e.type === 'release') {
      assert.equal(slot.state, 'COMPLETED', 'Release waits for completion and reader finish');
      released.add(slot.request);
      Object.assign(slot, {
        state: 'FREE',
        lastReleased: slot.request,
        request: null,
        worker: null,
        result: null,
      });
    } else throw new Error('Unknown queue event');
    history.push({
      ...e,
      request: e.request ?? slot.request ?? slot.lastReleased,
    });
  }
  return {
    slots,
    history,
    accepted: accepted.size,
    completed: completed.size,
    released: released.size,
    owned: slots.filter((x) => x.state !== 'FREE').length,
    pending: 6 - accepted.size,
    results: [...completed.entries()],
    last: history.at(-1) ?? null,
  };
}
export function sampleOriginalRuntime(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      ...pipeline([1, 2, 3, 4]),
      stage: step === 0 ? Math.min(3, Math.floor(q * 4)) : 3,
    };
  if (id === 'schedule')
    return {
      step,
      q,
      safe: step === 0,
      times: schedule(step === 0),
      time: step === 0 ? 10 * q : 10,
    };
  if (id === 'events')
    return {
      step,
      q,
      recordedFirst: step === 0,
      waitFor: step === 0 ? 3 : 0,
    };
  if (id === 'graphs')
    return {
      step,
      q,
      ...graphCost(step === 0 ? 0 : Math.round(4000 * q)),
    };
  if (id === 'pointers') {
    const updated = step > 0 && q > 0.4;
    return {
      step,
      q,
      updated,
      captured: 'A',
      binding: 'B',
      a: updated ? [0, 0, 0, 0] : [1, 2, 3, 4],
      replacement: [0, 0, 0, 0],
      actual: pipeline(updated ? [0, 0, 0, 0] : [1, 2, 3, 4]).result,
      required: 4,
    };
  }
  if (id === 'padding') {
    const values = [1, 2, 3, 4, 5, 6, 0, 0],
      affine = values.map((x) => 2 * x + 1),
      outputs = affine.map((x) => x * x),
      p = state.beatP ?? 0,
      transformed = step === 0 ? 'input-only' : p < 0.28 ? 'affine' : 'squared',
      masked = step > 0 && p >= 0.62,
      total =
        transformed === 'squared' && p >= 0.44
          ? sum(outputs.filter((_, i) => !masked || i < 6))
          : null;
    return {
      step,
      q,
      values,
      affine,
      outputs,
      transformed,
      masked,
      total,
      reference: pipeline(values.slice(0, 6)).result,
    };
  }
  const events = QUEUE_EVENTS.filter(
    (e) => e.beat < step || (e.beat === step && e.at <= clamp(state.beatP)),
  );
  return {
    step,
    q,
    ...queueState(events),
  };
}
export function sampleModel(id, state) {
  return tracks[id] ? sampleOriginalRuntime(id, state) : sampleRuntimeChapter(id, state);
}
