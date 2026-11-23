import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as secure from '../animations/secure-rag.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const reached = (id) => ({
  id,
  phase: 'after',
  progress: 1,
  reveal: 1,
  active: false,
  strength: 0,
  targets: [],
});
const paint = (beat, cues) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'resolve-principal', title: 'Begin with trusted identity state' },
    {
      t: 8.8,
      duration: 45,
      opacity: 1,
      beat,
      beatP: 0.45,
      cues: {
        'resolve-principal-b2-1': {
          ...reached('resolve-principal-b2-1'),
          phase: 'before',
          progress: 0,
        },
        'resolve-principal-b3-1': {
          ...reached('resolve-principal-b3-1'),
          phase: 'before',
          progress: 0,
        },
        ...cues,
      },
      cueTiming: 'provider-words',
    },
    secure.draw,
  );

test('the first mapping clause establishes both server-side tenant and group, then retains them', () => {
  const cues = Object.fromEntries(
    ['resolve-principal-b1-2', 'resolve-principal-group'].map((id) => [id, reached(id)]),
  );
  for (const beat of [0, 1, 2]) {
    const frame = paint(beat, cues);
    for (const text of ['Tenant A', 'Operations group', 'Trusted principal']) {
      assert(
        frame.labels.some((label) => label.text === text && label.alpha >= 0.9),
        `${text} must be visible during and after mapping`,
      );
    }
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
});

test('the grant clause focuses actual document policy separately from caller membership', () => {
  const cues = Object.fromEntries(
    [
      'resolve-principal-b1-2',
      'resolve-principal-group',
      'resolve-principal-read',
      'resolve-principal-b2-1',
    ].map((id) => [id, reached(id)]),
  );
  const frame = paint(1, cues);
  assert(
    frame.targets.some(
      (target) => target.id === 'document-current-grant' && target.markCounts.shapes > 0,
    ),
  );
  assert(frame.labels.some((label) => label.text === 'R6 current resource grant'));
  assert(frame.labels.some((label) => label.text === 'operations · source policy 42'));
  assert(frame.labels.some((label) => label.text === 'Read R6 · Incident checklist'));
  const input = secure.readAuthorizationInputs();
  assert.equal(input.allowed, true);
  assert.equal(input.resource.recordRevision, input.resource.sourceRevision);
  const revoked = secure.readAuthorizationInputs(secure.CANDIDATES[5], secure.PRINCIPAL, {
    ...secure.POLICY,
    groups: [],
  });
  assert.equal(revoked.allowed, false);
  assert.deepEqual(revoked.caller.groups, ['operations']);
  assert.deepEqual(revoked.resource.currentGrants, []);
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});
