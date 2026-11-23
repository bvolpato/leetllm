import {
  PRUNE_AT,
  RETAIN_AT,
  SNAPSHOTS,
  TRACKS,
  WIDTH_THREE,
  WIDTH_TWO,
  normalizedWinner,
  rawWinner,
  retainedOpenings,
} from './arithmetic.mjs';
import {
  conditionalEdgeExperiment,
  constructionProgress,
  widthWorkSnapshot,
} from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(conditionalEdgeExperiment(0).frontier, ['opened the', 'looked outside']);
  assert.deepEqual(conditionalEdgeExperiment(1).frontier, ['opened a', 'looked outside']);
  assert.equal(conditionalEdgeExperiment(1).raw.text, 'opened a book');
  for (const beat of [1, 2])
    for (const beatP of [0, 0.01, 0.5, 1])
      assert.equal(
        constructionProgress({
          beat,
          beatP,
        }),
        1,
      );
  assert.equal(
    constructionProgress({
      beat: 0,
      beatP: 0,
    }),
    0,
  );
  assert.equal(
    constructionProgress({
      beat: 0,
      beatP: 0.25,
    }),
    1,
  );
  assert.deepEqual(
    widthWorkSnapshot(0).map((v) => v.examined),
    [3, 3],
  );
  assert.deepEqual(
    widthWorkSnapshot(0.99).map((v) => v.examined),
    SNAPSHOTS.width[1].counts,
  );
  for (const progress of [0, 0.25, 0.5, 0.75, 0.99])
    for (const run of widthWorkSnapshot(progress)) assert(run.current.active.length <= run.width);
  assert.ok(Math.abs(SNAPSHOTS.probabilities[0].total - 1) < 1e-12);
  assert.deepEqual(SNAPSHOTS.probabilities[2].choices, [
    ['EOS', 0.85],
    ['again', 0.15],
  ]);
  assert.ok(Math.abs(SNAPSHOTS.probabilities[1].pathProbability - 0.225) < 1e-12);
  assert.deepEqual(
    WIDTH_TWO.history[0].active.map((candidate) => candidate.text),
    ['opened', 'looked'],
  );
  assert.equal(
    WIDTH_TWO.history[0].expansions.find((candidate) => candidate.text === 'slept').status,
    'pruned',
  );
  assert.ok(
    Math.abs(
      WIDTH_THREE.completed.find((candidate) => candidate.text === 'slept').probability - 0.19,
    ) < 1e-12,
  );
  assert.equal(rawWinner(WIDTH_THREE).text, 'slept');
  assert.equal(normalizedWinner(WIDTH_THREE).text, 'opened the door');
  assert.equal(rawWinner(WIDTH_TWO).text, 'opened the door');
  for (const beatP of [0, 1e-9, 0.02, 0.5, 0.999999, 1]) {
    const stopping = TRACKS.stopping.sample({
      beat: 0,
      beatP,
    }).snapshot;
    assert.equal(stopping.width, 3);
    assert.equal(stopping.completed.find((candidate) => candidate.text === 'slept').tokenCount, 2);
    assert.deepEqual(stopping.completed, SNAPSHOTS['length-score'][0].candidates);
  }
  assert.equal(
    TRACKS['search-lattice'].sample({
      beat: 2,
      beatP: 0.999999,
    }).snapshot.width,
    2,
  );
  assert.equal(
    TRACKS['first-beam']
      .sample({
        beat: 2,
        beatP: 0.999999,
      })
      .snapshot.expansions.find((candidate) => candidate.text === 'slept').status,
    'pruned',
  );
  assert.deepEqual(SNAPSHOTS.width[2].raw, ['opened the door', 'slept']);
  assert.deepEqual(SNAPSHOTS.width[2].normalized, ['opened the door', 'opened the door']);
  for (const [sceneId, snapshots] of Object.entries(SNAPSHOTS)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      const start = TRACKS[sceneId].sample({
        beat,
        beatP: 0,
      });
      const middle = TRACKS[sceneId].sample({
        beat,
        beatP: 0.5,
      });
      assert.deepEqual(start.snapshot, snapshots[beat]);
      assert.deepEqual(
        middle.snapshot,
        sceneId === 'first-beam' && beat === 0 ? retainedOpenings : snapshots[beat],
      );
    }
  }
  const firstBeam = (progress) =>
    TRACKS['first-beam']
      .sample({
        beat: 0,
        beatP: progress,
      })
      .snapshot.expansions.map((candidate) => candidate.status);
  assert.deepEqual(firstBeam(0), ['candidate', 'candidate', 'candidate']);
  assert.deepEqual(firstBeam(RETAIN_AT - 1e-9), ['candidate', 'candidate', 'candidate']);
  assert.deepEqual(firstBeam(RETAIN_AT), ['active', 'active', 'candidate']);
  assert.deepEqual(firstBeam(PRUNE_AT - 1e-9), ['active', 'active', 'candidate']);
  assert.deepEqual(firstBeam(PRUNE_AT), ['active', 'active', 'pruned']);
  assert.deepEqual(firstBeam(0.99), ['active', 'active', 'pruned']);
  for (const track of Object.values(TRACKS))
    for (let beat = 0; beat < 2; beat += 1)
      assert.deepEqual(
        track.sample({
          beat,
          beatP: 1,
        }),
        track.sample({
          beat: beat + 1,
          beatP: 0,
        }),
      );
  return true;
}
