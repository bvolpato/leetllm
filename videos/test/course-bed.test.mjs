import assert from 'node:assert/strict';
import test from 'node:test';
import { courseBedPolicy } from '../lib/course-bed.mjs';

test('course themes distinguish operational films, math, and projects independent of their article directories', () => {
  const operations = courseBedPolicy('continuous-batching', 'fundamentals/continuous-batching-request-scheduling/content.md');
  assert.equal(operations.palette, 'low');
  assert.equal(operations.group, 'Inference & Production Scale');
  assert.equal(courseBedPolicy('rope').palette, 'warm');
  assert.equal(courseBedPolicy('agent-architectures').palette, 'open');
  assert.deepEqual(courseBedPolicy('continuous-batching'), operations);
});

test('new lessons use their source topics, a stable seed and a quiet default', () => {
  assert.equal(courseBedPolicy('new-agent', 'agents/new/content.md').palette, 'open');
  assert.equal(courseBedPolicy('new-service', 'llmops/new/content.md').palette, 'low');
  assert.equal(courseBedPolicy('new-topic', 'other/new/content.md').palette, 'warm');
  assert.notEqual(courseBedPolicy('first').seed, courseBedPolicy('second').seed);
  assert.equal(courseBedPolicy('first').seed, courseBedPolicy('first', 'new-topic/x').seed);
});

test('lesson-first scores start at zero with the same palette and dialogue limits', () => {
  const stock = courseBedPolicy('estimation');
  assert.equal(stock.introSeconds, 4);
  assert.deepEqual(courseBedPolicy('estimation', '', 0), { ...stock, introSeconds: 0 });
  assert.throws(() => courseBedPolicy('estimation', '', -1), /Invalid intro duration/);
});
