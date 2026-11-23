import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';
import { lexicalTokens, paragraphCaptions } from '../lib/captions.mjs';
import { captionBoundaryTokens } from '../lib/narration-cues.mjs';
import { estimatedTimeline } from '../lib/stage-lesson.mjs';
import { rebuildScript } from '../tools/lib/stage-rebuild.mjs';

const lesson = parse(await readFile(rebuildScript('agent-orchestration'), 'utf8'));
const timeline = estimatedTimeline(lesson);

function checkOpenings(sceneId, beatIndex, phrases, { ceilMs = false } = {}) {
  const scene = timeline.scenes.find((entry) => entry.id === sceneId);
  const beat = scene.beats[beatIndex];
  const { words } = scene.sounds[beatIndex];
  const offset = scene.start + beat.start;
  const captions = paragraphCaptions(
    words,
    offset,
    beat.say,
    captionBoundaryTokens(scene)[beatIndex],
  );
  assert.equal(captions.map((cue) => cue.text).join(' '), beat.say);
  for (const phrase of phrases) {
    const tokens = lexicalTokens(phrase);
    const first = words.findIndex((_, i) =>
      tokens.every((token, j) => words[i + j]?.text === token),
    );
    assert.notEqual(first, -1, phrase);
    const opening = offset + words[first].start;
    const expected = ceilMs ? Math.ceil(opening * 1000) / 1000 : opening;
    const cue = captions.find((entry) => entry.start <= expected && expected < entry.end);
    assert.equal(cue?.start, expected, phrase);
    assert.ok(cue.text.startsWith(phrase), phrase);
  }
}

test('the choice of specialists, parallel code or one agent follows each work case', () => {
  checkOpenings('subject-intro', 3, [
    'Independent semantic research',
    'can benefit from specialists',
    'Independent deterministic ETL',
    'needs parallel code',
    'Coupled edits',
    'often fit one scoped agent',
  ]);
});

test('the barrier question, failed contract and cross-tenant rejection have their own openings', () => {
  checkOpenings('validated-join', 0, ['Should the request proceed']);
  checkOpenings('validated-join', 1, [
    'while the state contract fails',
    'Reject the cross-tenant result',
  ]);
});

test('capstone captions separate the prediction and each repair from its premise', () => {
  checkOpenings('transfer', 3, [
    'Predict the owner',
    'The join rejects',
    'For this example',
    'Refresh the health receipt',
    'Compare every receipt',
    'If the target has moved',
    'If health instead returns twice',
    'reject the duplicate',
  ]);
});

test('withheld numbers, decisions and replay results start at their spoken words', () => {
  const cases = [
    [
      'parallel-clock',
      1,
      ['Policy finishes first', 'then evaluation', 'then health', 'three and a half seconds'],
    ],
    ['typed-receipts', 2, ['can conflict']],
    ['superstep-join', 1, ['raise an invalid-concurrent-graph-update error']],
    [
      'superstep-join',
      2,
      [
        'holds merge until all finish',
        'trigger a partial merge',
        'then health triggers another',
        'never completes',
        'raises for missing evidence',
        'the invocation fails',
      ],
    ],
    [
      'validated-join',
      3,
      [
        'two percent',
        'point zero four percent',
        'point four times',
        'minus one',
        'passes a simple upper-bound-only comparison',
        'require different proposal digests',
      ],
    ],
    ['checkpoint-retry', 2, ['two hundred ten', 'beyond its sixty-second limit']],
    ['single-writer', 2, ['one effect', 'return the earlier result']],
    [
      'topology-ownership',
      0,
      ['A supervisor retains conversation ownership', 'A handoff moves active control'],
    ],
    [
      'topology-ownership',
      1,
      [
        'call the health specialist',
        'tool and',
        'keep the manager’s conversation',
        'use a handoff',
      ],
    ],
    [
      'transfer',
      3,
      [
        'get the intended revision',
        'refresh evaluation and policy',
        'rebuild the proposal for fresh review',
      ],
    ],
  ];
  for (const [scene, beat, phrases] of cases) checkOpenings(scene, beat, phrases, { ceilMs: true });
});
