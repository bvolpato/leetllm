import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/tool-use.mjs';
registerLessonFonts();
const all = [
  'tu-fresh-suite-denial',
  'tu-fresh-read-repair',
  'tu-fresh-new-score',
  'tu-fresh-delta',
  'tu-fresh-deny-extra',
  'tu-read-resolved-scope',
  'tu-batch-late-invalid',
  'tu-batch-zero-calls',
];
function paint(scene, beat, after) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: scene, title: 'Inspect the current state' },
    {
      beat,
      beatP: 0.99,
      opacity: 1,
      cues: Object.fromEntries(
        all.map((id) => [
          id,
          { phase: after.includes(id) ? 'after' : 'before', progress: after.includes(id) ? 1 : 0 },
        ]),
      ),
    },
    draw,
  );
}
const text = (a) => a.labels.map((l) => l.text).join('\n');
test('repairing suite membership updates the current decision before the separate delta payoff', () => {
  const fixed = paint('fresh-comparison', 1, [
    'tu-fresh-suite-denial',
    'tu-fresh-read-repair',
    'tu-fresh-new-score',
  ]);
  assert(text(fixed).includes('Q1 · score 0.83'));
  assert(!text(fixed).includes('Different suites → comparison held'));
  assert(!text(fixed).includes('+0.03'));
  const result = paint('fresh-comparison', 1, [
    'tu-fresh-suite-denial',
    'tu-fresh-read-repair',
    'tu-fresh-new-score',
    'tu-fresh-delta',
  ]);
  assert(text(result).includes('+0.03'));
  assert.deepEqual([...(result.issues ?? []), ...layoutIssues(result)], []);
});
test('the narrated ads caller cannot receive the search release payload after scope checking', () => {
  const denied = paint('scoped-read', 0, ['tu-read-resolved-scope']);
  assert(text(denied).includes('project: ads'));
  assert(text(denied).includes('not_found_or_not_authorized'));
  assert(!text(denied).includes('status returned only after project match'));
  assert.deepEqual([...(denied.issues ?? []), ...layoutIssues(denied)], []);
});
test('MCP factorization changes the connection geometry during the operation while seven remains withheld', () => {
  const render = (progress) => {
    const canvas = createCanvas(1920, 1080),
      cues = {
        'tu-mcp-direct': { phase: 'after', progress: 1, active: false, strength: 0 },
        'tu-mcp-factor-operation': { phase: 'during', progress, active: false, strength: 0 },
        'tu-mcp-factored': { phase: 'before', progress: 0, active: false, strength: 0 },
      },
      audit = drawFrame(
        canvas.getContext('2d'),
        {},
        { id: 'mcp-integration', title: 'Factor the same integrations' },
        { beat: 0, beatP: 0.5, opacity: 1, cues },
        draw,
      );
    return { audit, pixels: canvas.toBuffer('image/png') };
  };
  const early = render(0.25),
    later = render(0.75);
  assert(
    !early.pixels.equals(later.pixels),
    'the actual host/service paths must evolve during factorization',
  );
  for (const { audit } of [early, later]) {
    assert(!text(audit).includes('= 7 pieces'));
    assert(
      !text(audit).includes('seven adapter owners'),
      'the heading must not supply the withheld component count',
    );
    assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
  }
});
test('the fresh comparison withholds the write-authority answer in its footer until the completed denial', () => {
  for (const [beat, after] of [
    [0, []],
    [1, ['tu-fresh-suite-denial', 'tu-fresh-read-repair', 'tu-fresh-new-score', 'tu-fresh-delta']],
    [2, []],
  ]) {
    const a = paint('fresh-comparison', beat, after);
    assert(
      !text(a).includes('grants neither a promotion role'),
      'the prediction footer must remain neutral before the answer',
    );
    assert.deepEqual([...(a.issues ?? []), ...layoutIssues(a)], []);
  }
  const result = paint('fresh-comparison', 2, ['tu-fresh-deny-extra']);
  assert(text(result).includes('grants neither a promotion role'));
  assert(text(result).includes('Promotion effects: 0'));
});
test('a rejected partial argument displays the UTF-8 length of the actual wire fragment', () => {
  const a = paint('complete-batch', 1, ['tu-batch-late-invalid']),
    wire = a.labels.find((l) => l.text.startsWith('{"release_id":') && !l.text.endsWith('}'))?.text;
  assert.equal(wire, '{"release_id":');
  assert(text(a).includes(Buffer.byteLength(wire, 'utf8') + ' B'));
  assert(text(a).includes('Reject whole batch · 0 dispatches'));
  assert.deepEqual([...(a.issues ?? []), ...layoutIssues(a)], []);
});
test('the separate zero-call response preserves its non-call item while dispatching no service work', () => {
  const a = paint('complete-batch', 2, ['tu-batch-zero-calls']);
  assert(!text(a).includes('status-1'));
  assert(!text(a).includes('status-2'));
  assert(text(a).includes('0 dispatchable calls'));
  assert(text(a).includes('Retained non-call output'));
  assert(text(a).includes('No service operation'));
  assert.deepEqual([...(a.issues ?? []), ...layoutIssues(a)], []);
});
