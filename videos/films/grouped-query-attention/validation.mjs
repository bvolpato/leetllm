import { dot } from './arithmetic.mjs';
import { HEADS } from './fixtures.mjs';
import { ATTENTION, SNAPSHOTS, TRACKS, chapterModel } from './construction.mjs';
import { cacheBytes, groupSize, kvGroupForQuery, meanVisible, physicalHeads } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const m = chapterModel('roofline');
  assert.equal(m.flops / m.readBytes, 8);
  assert.deepEqual(m.large, [343597383680, 42949672960, 5368709120]);
  assert.deepEqual(physicalHeads(64, 8, 4), {
    queriesPerRank: 16,
    kvPerRank: 2,
    copies: 8,
    replicas: 1,
  });
  assert.deepEqual(physicalHeads(64, 8, 16), {
    queriesPerRank: 4,
    kvPerRank: 1,
    copies: 16,
    replicas: 2,
  });
  assert.equal(physicalHeads(24, 6, 4), null);
  assert.equal(dot(m.absorbed, [1, 2]), 5);
  assert.equal(m.latentNumbers, 576);
  assert.equal(m.latest, 4);
  assert.equal(meanVisible([2, 4, 12]), 6);
  assert.equal(m.endingHeadBytes, 8 * 2 ** 20);
  assert.equal(m.ending.copies * m.endingHeadBytes, 96 * 2 ** 20);
  assert.equal(48 * m.endingHeadBytes, 384 * 2 ** 20);
  assert.equal(groupSize(8, 2), 4);
  assert.deepEqual(
    HEADS.queries
      ? Array.from(
          {
            length: 8,
          },
          (_, head) => kvGroupForQuery(head),
        )
      : [],
    [0, 0, 0, 0, 1, 1, 1, 1],
  );
  assert.equal(
    cacheBytes({
      kvHeads: 8,
    }),
    768,
  );
  assert.equal(
    cacheBytes({
      kvHeads: 2,
    }),
    192,
  );
  assert.equal(
    cacheBytes({
      kvHeads: 1,
    }),
    96,
  );
  assert.ok(ATTENTION[0].weights[0] > ATTENTION[0].weights[1]);
  assert.ok(ATTENTION[1].weights[1] > ATTENTION[1].weights[0]);
  assert.notDeepEqual(ATTENTION[0].output, ATTENTION[1].output);
  for (const [sceneId, snapshots] of Object.entries(SNAPSHOTS)) {
    for (let beat = 0; beat < snapshots.length; beat += 1) {
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0,
        }).snapshot,
        snapshots[beat],
      );
      assert.deepEqual(
        TRACKS[sceneId].sample({
          beat,
          beatP: 0.5,
        }).snapshot,
        snapshots[beat],
      );
      if (beat + 1 < snapshots.length)
        assert.deepEqual(
          TRACKS[sceneId].sample({
            beat,
            beatP: 1,
          }).snapshot,
          snapshots[beat + 1],
        );
    }
  }
  return true;
}
