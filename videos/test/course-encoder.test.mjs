import assert from 'node:assert/strict';
import test from 'node:test';
import { selectCourseEncoder } from '../render.mjs';

test('the course keeps one strict encoder for its intro and scenes', async () => {
  for (const actual of ['libx264', 'videotoolbox']) {
    const engine = {
      resolveH264Encoder: async (requested) => {
        assert.equal(requested, 'videotoolbox');
        return actual;
      },
    };
    assert.deepEqual(await selectCourseEncoder('videotoolbox', engine), {
      h264Encoder: actual,
      requireH264Encoder: true,
    });
  }
  assert.deepEqual(await selectCourseEncoder('videotoolbox', {}), {
    h264Encoder: 'libx264',
    requireH264Encoder: true,
  });
  await assert.rejects(selectCourseEncoder('invalid', {}), /--h264-encoder/);
});
