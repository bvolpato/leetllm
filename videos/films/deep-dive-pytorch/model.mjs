import {
  adam,
  address,
  freshBad,
  freshGood,
  next,
  pipelineSlots,
  reset,
  saved,
} from './arithmetic.mjs';
import { RESIDENCY_CUES } from './fixtures.mjs';
import {
  attentionConstruction,
  autogradTrace,
  gatheredCount,
  sampleModel,
  sampleOriginalModel,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateOriginalModel() {
  assert.deepEqual(
    attentionConstruction(2, 0, {
      'attention-cached-position': {
        phase: 'before',
      },
    }).allowed,
    [true, false],
  );
  assert.deepEqual(
    attentionConstruction(2, 0, {
      'attention-cached-position': {
        phase: 'during',
      },
    }).allowed,
    [true, true],
  );
  assert.equal(autogradTrace(1, 0.1).storage, 3);
  assert.equal(autogradTrace(1, 0.5).storage, 4);
  assert.equal(autogradTrace(1, 0.5).checked, false);
  assert.equal(autogradTrace(2, 0.9).storage, 3);
  assert.equal(autogradTrace(2, 0.9).clone, 4);
  const gatherSeconds = (seconds) => seconds / RESIDENCY_CUES.gather.span,
    releaseSeconds = (seconds) => seconds / RESIDENCY_CUES.release.span;
  const atRest = sampleOriginalModel('residency', {
    beat: 0,
    beatP: gatherSeconds(10),
  });
  assert.equal(atRest.computeAllocated, 0);
  assert.equal(atRest.live, 2);
  assert.equal(atRest.received, 0);
  const gatherStart = sampleOriginalModel('residency', {
    beat: 0,
    beatP: gatherSeconds(RESIDENCY_CUES.gather.start),
  });
  assert.equal(gatherStart.computeAllocated, 8);
  assert.equal(gatherStart.received, 0);
  assert.equal(gatherStart.live, 10);
  assert.equal(
    gatheredCount(0, gatherSeconds((RESIDENCY_CUES.gather.start + RESIDENCY_CUES.gather.end) / 2)),
    4,
  );
  const gatherComplete = sampleOriginalModel('residency', {
    beat: 0,
    beatP: gatherSeconds(RESIDENCY_CUES.gather.end),
  });
  assert.equal(gatherComplete.received, 8);
  assert.equal(gatherComplete.live, 10);
  const compute = sampleOriginalModel('residency', {
    beat: 1,
    beatP: 0,
  });
  assert.equal(compute.received, 8);
  assert.equal(compute.computeAllocated, 8);
  assert.equal(compute.live, 10);
  const releaseStart = sampleOriginalModel('residency', {
    beat: 2,
    beatP: releaseSeconds(RESIDENCY_CUES.release.start),
  });
  assert.equal(releaseStart.computeAllocated, 8);
  assert.equal(releaseStart.live, 10);
  assert.equal(
    gatheredCount(
      2,
      releaseSeconds((RESIDENCY_CUES.release.start + RESIDENCY_CUES.release.end) / 2),
    ),
    4,
  );
  const released = sampleOriginalModel('residency', {
    beat: 2,
    beatP: releaseSeconds(RESIDENCY_CUES.release.end),
  });
  assert.equal(released.computeAllocated, 0);
  assert.equal(released.live, 2);
  const retainCue = sampleOriginalModel('residency', {
    beat: 2,
    beatP: releaseSeconds(RESIDENCY_CUES.retain),
  });
  assert(retainCue.retainedVisible);
  assert.equal(retainCue.retainedLive, 10);
  assert.equal(retainCue.live, 2);
  assert(
    !sampleOriginalModel('residency', {
      beat: 2,
      beatP: releaseSeconds(RESIDENCY_CUES.retain - 0.01),
    }).retainedVisible,
  );
  assert.equal(address([1, 0], [3, 1]), 3);
  assert.equal(address([0, 1], [1, 3]), 3);
  const alias = sampleOriginalModel('strides', {
    beat: 2,
    beatP: 0,
  });
  assert.equal(alias.original[1][0], 30);
  assert.equal(alias.transposed[0][1], 30);
  assert.equal(alias.copied[1], 3);
  assert.equal(
    sampleOriginalModel('autograd', {
      beat: 1,
      beatP: 0,
    }).valid,
    false,
  );
  assert(
    Math.abs(
      sampleOriginalModel('autograd', {
        beat: 2,
        beatP: 0,
      }).numerical - 6,
    ) < 1e-9,
  );
  assert.deepEqual(
    sampleOriginalModel('attention', {
      beat: 1,
      beatP: 0,
    }).output,
    [10, 0],
  );
  assert.equal(
    sampleOriginalModel('compile', {
      beat: 1,
      beatP: 0,
    }).graphs,
    1,
  );
  assert.equal(
    sampleOriginalModel('compile', {
      beat: 2,
      beatP: 0,
    }).graphs,
    2,
  );
  assert.deepEqual(
    sampleOriginalModel('compile', {
      beat: 2,
      beatP: 0,
    }).current.output,
    [3, 12],
  );
  for (const beatP of [0.4, 0.75, 0.99]) {
    const later = sampleOriginalModel('compile', {
      beat: 1,
      beatP,
    });
    assert.equal(later.graphs, 2);
    assert.deepEqual(later.current.output, [3, 12]);
  }
  assert.deepEqual(
    sampleOriginalModel('placement', {
      beat: 2,
      beatP: 0,
    }).local,
    [[11], [22]],
  );
  assert.equal(
    sampleOriginalModel('residency', {
      beat: 1,
      beatP: 0,
    }).live,
    10,
  );
  assert.equal(
    sampleOriginalModel('residency', {
      beat: 2,
      beatP: 0,
    }).live,
    10,
  );
  assert.deepEqual(
    adam(
      {
        ...saved,
      },
      -0.25,
    ),
    next,
  );
  assert(Math.abs(next.w - reset.w) > 0.005);
  return true;
}
export function validateModel() {
  validateOriginalModel();
  assert.deepEqual(
    pipelineSlots(2).work.map((w) => [w.stage, w.mb, w.start, w.end]),
    [
      [0, 0, 0, 1],
      [1, 0, 1, 2],
      [0, 1, 1, 2],
      [1, 1, 2, 3],
    ],
  );
  assert.equal(
    sampleModel('live-peak', {
      beat: 2,
      beatP: 0,
    }).subtotal,
    40,
  );
  assert.equal(
    sampleModel('attention-selector', {
      beat: 0,
      beatP: 1,
    }).cells,
    134217728,
  );
  assert.equal(
    sampleModel('tensor-contract', {
      beat: 0,
      beatP: 1,
    }).byte,
    24,
  );
  assert.deepEqual(
    sampleModel('tensor-split', {
      beat: 1,
      beatP: 1,
    }).local,
    [4, 4],
  );
  assert.equal(
    sampleModel('pipeline-scaling', {
      beat: 2,
      beatP: 0,
    }).subtotal,
    20,
  );
  assert(Math.abs(freshGood.w - 0.9852778368987468) < 1e-12);
  assert(Math.abs(freshBad.w - 0.9841137914701475) < 1e-12);
  for (const [id, prop] of [
    ['fresh-correct', 'goodVisible'],
    ['fresh-wrong', 'badVisible'],
  ])
    assert.equal(
      sampleModel('fresh-counter', {
        beat: 1,
        beatP: 1,
        cues: {
          ['pt-' + id]: {
            phase: 'during',
            progress: 0.999,
          },
        },
      })[prop],
      false,
    );
  const restored = sampleModel('fresh-counter', {
    beat: 2,
    beatP: 1,
    cues: {
      'pt-fresh-restored': {
        phase: 'after',
        progress: 1,
      },
    },
  });
  assert.equal(restored.badNow.w, restored.good.w);
  assert.equal(restored.badNow.step, 3);
  return true;
}
