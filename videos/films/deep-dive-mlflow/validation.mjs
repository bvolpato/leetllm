import { artifactDigest } from './arithmetic.mjs';
import { ARTIFACT_FIXTURE, required } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import { assess, compareArtifacts, exporter, releaseAllowed } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(
    assess([
      {
        id: 'A',
        pass: true,
      },
      {
        id: 'C',
        pass: true,
      },
    ]).promote,
    false,
  );
  assert.equal(
    assess(
      required.map((id) => ({
        id,
        pass: true,
      })),
    ).promote,
    true,
  );
  assert.equal(
    assess(
      required.map((id) => ({
        id,
        pass: id === 'C',
      })),
    ).mean,
    1 / 3,
  );
  const t = sampleModel('trace', {
    beat: 0,
    beatP: 0,
  });
  assert.equal(t.own, 35);
  assert(t.children.reduce((a, v) => a + v, 0) + t.nested.reduce((a, v) => a + v, 0) > t.root);
  assert.equal(
    sampleModel('alias', {
      beat: 1,
      beatP: 0,
    }).loaded,
    17,
  );
  assert.equal(
    sampleModel('alias', {
      beat: 2,
      beatP: 0,
    }).loaded,
    18,
  );
  assert.equal(
    sampleModel('synthesis', {
      beat: 0,
      beatP: 0.02,
    }).promotionReady,
    false,
  );
  assert.deepEqual(
    sampleModel('synthesis', {
      beat: 0,
      beatP: 0.02,
    }).evidence.missing,
    ['B', 'C'],
  );
  assert.equal(
    sampleModel('synthesis', {
      beat: 0,
      beatP: 0.5,
    }).evidence.rows.length,
    2,
  );
  assert.equal(
    sampleModel('synthesis', {
      beat: 0,
      beatP: 0.95,
    }).promotionReady,
    true,
  );
  assert.equal(
    artifactDigest('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  assert.throws(() => artifactDigest(null), /UTF-8 text bytes/);
  const passing = assess(
    required.map((id) => ({
      id,
      pass: true,
    })),
  );
  const pending = compareArtifacts(ARTIFACT_FIXTURE);
  assert.equal(pending.candidateDigest, null);
  assert.equal(pending.digestMatches, null);
  assert.equal(releaseAllowed(passing, pending), false);
  const matching = compareArtifacts(ARTIFACT_FIXTURE, true);
  assert.equal(matching.evaluatedDigest.length, 64);
  assert.equal(matching.candidateDigest, matching.evaluatedDigest);
  assert.equal(releaseAllowed(passing, matching), true);
  assert.equal(
    releaseAllowed(
      assess([
        {
          id: 'A',
          pass: true,
        },
        {
          id: 'C',
          pass: true,
        },
      ]),
      matching,
    ),
    false,
  );
  assert.equal(
    releaseAllowed(
      assess(
        required.map((id) => ({
          id,
          pass: id !== 'B',
        })),
      ),
      matching,
    ),
    false,
  );
  for (const candidateBytes of ['prompt=P19;index=I9;model=M3', '', null]) {
    const changed = {
        ...ARTIFACT_FIXTURE,
        candidateBytes,
      },
      mismatch = compareArtifacts(changed, true);
    assert.equal(mismatch.digestMatches, false);
    assert.equal(releaseAllowed(passing, mismatch), false);
    for (let beat = 0; beat < 3; beat++)
      for (let i = 0; i <= 100; i++) {
        assert.equal(
          sampleModel(
            'synthesis',
            {
              beat,
              beatP: i / 100,
            },
            changed,
          ).promotionReady,
          false,
        );
      }
  }
  assert.equal(
    releaseAllowed(
      passing,
      compareArtifacts(
        {
          ...ARTIFACT_FIXTURE,
          evaluatedBytes: null,
        },
        true,
      ),
    ),
    false,
  );
  const beforeCheck = sampleModel('synthesis', {
    beat: 0,
    beatP: 0.68,
  });
  const afterCheck = sampleModel('synthesis', {
    beat: 0,
    beatP: 0.7,
  });
  assert.equal(beforeCheck.evidence.coverage, 1);
  assert.equal(beforeCheck.digestMatches, null);
  assert.equal(beforeCheck.promotionReady, false);
  assert.equal(afterCheck.digestMatches, true);
  assert.equal(afterCheck.promotionReady, true);
  exporter([2, 3, 2, 0]).forEach((s, i) => {
    assert(s.queued <= 3);
    assert.equal(
      s.sent + s.queued + s.dropped,
      [2, 3, 2, 0].slice(0, i + 1).reduce((a, v) => a + v, 0),
    );
  });
  return true;
}
