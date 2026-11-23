import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as presentation from '../animations/ai-lab-technical-presentation.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (id, phase = 'after') => ({
  id,
  phase,
  progress: phase === 'before' ? 0 : 1,
  reveal: phase === 'before' ? 0 : 1,
  active: false,
  strength: 0,
  targets: [],
});
const ids = [
  'argument-problem-detail',
  'argument-constraint-detail',
  'argument-decision-detail',
  'argument-claims-1',
  'argument-alternative-downside',
  'argument-evidence-detail',
];
const paint = (reached) => {
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'argument', title: 'Write the argument before choosing the slides' },
    {
      t: 10,
      duration: 45,
      opacity: 1,
      beat: 1,
      beatP: 0.4,
      cueTiming: 'provider-words',
      cues: Object.fromEntries(
        ids.map((id) => [id, cue(id, reached.includes(id) ? 'after' : 'before')]),
      ),
    },
    presentation.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
};
test('the concrete problem, constraint and decision appear at their clauses and retain the same project', () => {
  const empty = paint([]),
    source = presentation.sampleModel('argument', { beat: 0, beatP: 0.3 });
  assert(!empty.labels.some((x) => x.text === `${source.project.sources} source integrations`));
  const frame = paint(ids.slice(0, 3));
  for (const text of [
    `${source.project.sources} source integrations`,
    'credential + pagination logic',
    'tenant-safe lookup',
    `p95 below ${source.project.latencyTargetMs} ms`,
    'one connector contract',
    'source-specific adapters',
  ])
    assert(
      frame.labels.some((x) => x.text === text),
      text,
    );
});
test('the service-split alternative and its downside are visible as separate actual claims', () => {
  const frame = paint(['argument-claims-1', 'argument-alternative-downside']);
  for (const text of [
    'separate adapter service',
    'independent release + isolation',
    'remote calls',
    'another operational boundary',
  ])
    assert(
      frame.labels.some((x) => x.text === text),
      text,
    );
  assert(frame.targets.some((x) => x.id === 'argument-alternative' && x.markCounts.shapes > 0));
  assert(frame.targets.some((x) => x.id === 'argument-limit' && x.markCounts.shapes > 0));
});
test('the evidence claim refers to the same repeated cursor and trace used by the later failure demonstration', () => {
  const page = presentation.paginationSnapshot(1, 1),
    frame = paint(ids);
  assert(page.duplicate && !page.complete && !page.canRequest);
  assert(frame.labels.some((x) => x.text === `repeated cursor ${page.nextCursor}`));
  assert(frame.labels.some((x) => x.text === `${page.requestId} · ${page.sourceId}`));
});
