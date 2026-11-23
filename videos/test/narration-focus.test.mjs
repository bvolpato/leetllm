import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

const cue = {
  id: 'move',
  start: 1,
  end: 2,
  targets: ['dot'],
  color: 'cyan',
  active: true,
  strength: 1,
  progress: 0.5,
  reveal: 1,
  phase: 'during',
};
function render(x, cues = { move: cue }) {
  const canvas = createCanvas(1920, 1080);
  let shape;
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { title: 'Measured focus' },
    { t: 2, duration: 10, opacity: 0.8, cues, cueTiming: 'provider-words' },
    (ctx, scene, state, api) => {
      api.rect(ctx, 800, 400, 100, 100, api.C.blue);
      shape = api.focus.target('group', () =>
        api.focus.target('dot', () => api.circle(ctx, x, 400, 20, api.C.cyan)),
      );
    },
  );
  return { audit, shape };
}
test('actual moving geometry follows its semantic ID, preserves anchors and retains checked paint alpha', () => {
  const first = render(300),
    next = render(600);
  assert.equal(first.shape.auditId, 1);
  assert.equal(first.audit.targets.find((part) => part.id === 'dot').x, 280);
  assert.equal(next.audit.targets.find((part) => part.id === 'dot').x, 580);
  assert(Math.abs(first.audit.shapes[1].alpha - 0.8) < 0.01);
  assert(first.audit.shapes[0].alpha < 0.5);
  assert.equal(first.audit.paths.length, 4);
  assert.deepEqual(layoutIssues(first.audit), []);
});
test('a cue cannot silently highlight an absent object', () => {
  const { audit } = render(300, { move: { ...cue, targets: ['absent'] } });
  assert(
    audit.issues.some(
      (issue) => issue.type === 'missing-focus-target' && issue.target === 'absent',
    ),
  );
});
test('shared graph targets select individual nodes and links while returning live painted descriptors', () => {
  const canvas = createCanvas(1920, 1080);
  let graph;
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { title: 'Graph focus' },
    {
      t: 2,
      duration: 10,
      opacity: 1,
      cues: { move: { ...cue, targets: ['output'] } },
      cueTiming: 'provider-words',
    },
    (ctx, scene, state, api) => {
      graph = api.teaching.flowGraph({
        nodes: [
          {
            id: 'a',
            label: 'Input',
            x: 250,
            y: 400,
            width: 200,
            height: 100,
            focusTarget: 'input',
          },
          {
            id: 'b',
            label: 'Output',
            x: 900,
            y: 400,
            width: 200,
            height: 100,
            focusTarget: 'output',
          },
        ],
        edges: [{ from: 'a', to: 'b', focusTarget: 'route' }],
      });
    },
  );
  assert.equal(graph.nodes.b.auditId, 1);
  assert.deepEqual(
    audit.targets.map((part) => part.id),
    ['route', 'input', 'output'],
  );
  assert.equal(audit.connectors[0].targetRef, graph.nodes.b);
  assert.deepEqual(layoutIssues(audit), []);
});
