import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/secure-rag.mjs';
registerLessonFonts();
const lesson = parse(
  fs.readFileSync(new URL('../lessons/secure-rag.lesson.yaml', import.meta.url), 'utf8'),
);
function paint(id, beat, changes = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  for (const [b, row] of scene.beats.entries())
    for (const cue of row.visual_cues ?? []) {
      const phase = changes[cue.id] ?? (b < beat ? 'after' : 'before');
      cues[cue.id] = {
        ...cue,
        phase,
        progress: phase === 'after' ? 1 : phase === 'during' ? 0.5 : 0,
      };
    }
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, opacity: 1, cues },
    draw,
  );
}
const texts = (a) => a.labels.map((x) => x.text);
test('removing all caller groups clears the previously successful join decision as well as the returned set', () => {
  const labels = texts(
    paint('external-join', 1, {
      'sr-external-join-grant': 'after',
      'sr-external-join-only': 'after',
      'sr-external-join-empty': 'after',
    }),
  );
  assert(labels.includes('Returned: ∅'));
  assert.equal(labels.filter((x) => x === '✓').length, 0);
  assert.equal(labels.filter((x) => x === '×').length, 4);
});
test('report and buffered-draft revocation change the actual current key grant while preserving source version seven', () => {
  for (const [scene, cue] of [
    ['report-provenance', 'sr-report-provenance-revoke'],
    ['draft-reauthorize', 'sr-draft-reauthorize-revoke'],
  ]) {
    const labels = texts(paint(scene, 1, { [cue]: 'after' }));
    assert(labels.includes('v7 · tenant A'));
    assert(labels.includes('no grant'));
    assert(!labels.includes('security'));
  }
});
test('destination-specific denial stops protected copies at explicit gates before three unauthorized destinations', () => {
  const labels = texts(
    paint('destination-policy', 0, {
      'sr-destination-policy-recipient': 'after',
      'sr-destination-policy-other': 'after',
    }),
  );
  assert.equal(labels.filter((x) => x === 'HOLD').length, 3);
  assert(labels.includes('senior reader'));
  assert(labels.includes('read grant'));
});
test('the fresh question and completed decision clauses keep their own manifests, refusals and replacement admission separate', () => {
  const pending = texts(
    paint('fresh-release', 0, {
      'sr-fresh-release-reader': 'after',
      'sr-fresh-release-report': 'after',
      'sr-fresh-release-draft': 'after',
      'sr-fresh-release-changes': 'after',
      'sr-fresh-release-token': 'after',
    }),
  );
  assert(pending.includes('checklist v1 + FAQ v3'));
  assert(pending.includes('context: FAQ v3 + key v7'));
  assert(!pending.includes('Both old artifacts HELD'));
  const before = texts(
    paint('fresh-release', 2, {
      'sr-fresh-release-rebuild': 'after',
      'sr-fresh-release-report-admit': 'during',
    }),
  );
  assert(before.includes('A:checklist v2'));
  assert(before.includes('A:key v7'));
  assert(!before.includes('Report predicate: ADMIT'));
  const after = texts(
    paint('fresh-release', 2, {
      'sr-fresh-release-rebuild': 'after',
      'sr-fresh-release-report-admit': 'after',
    }),
  );
  assert(after.includes('Report predicate: ADMIT'));
  assert(after.includes('checklist v1 + FAQ v3'));
  assert(after.includes('context: FAQ v3 + key v7'));
});
test('the sequential two-chunk drawing reports the same partial count as its visible revision state', () => {
  const labels = texts(paint('sync-two-chunks', 0, { 'sr-sync-two-chunks-reconcile': 'during' }));
  assert.equal(labels.filter((x) => x === 'revision 2').length, 1);
  assert(labels.includes('Reconciled 1/2 A chunks; serving reads held'));
  assert(!labels.includes('Missed event leaves both A chunks stale'));
});
