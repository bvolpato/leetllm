import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';

const animation = await import(
  process.env.SUPPORT_ANIMATION_PATH
    ? pathToFileURL(process.env.SUPPORT_ANIMATION_PATH)
    : new URL('../animations/design-conversational-ai-support-bot.mjs', import.meta.url)
);
const lesson = parse(
  fs.readFileSync(
    new URL('../lessons/design-conversational-ai-support-bot.lesson.yaml', import.meta.url),
    'utf8',
  ),
);
registerLessonFonts();

function paint(id, beat, changes = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  for (const [index, b] of scene.beats.entries())
    for (const cue of b.visual_cues ?? []) {
      const requested = changes[cue.id] ?? (index < beat ? 'after' : 'before');
      const phase = requested === 'almost' ? 'during' : requested;
      const progress =
        phase === 'after' ? 1 : requested === 'almost' ? 0.95 : phase === 'during' ? 0.5 : 0;
      cues[cue.id] = {
        ...cue,
        phase,
        progress,
        reveal: progress,
        active: phase === 'during',
        strength: 0,
      };
    }
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.8, t: 1, duration: 90, opacity: 1, cues, cueTiming: 'provider-words' },
    animation.draw,
  );
  return audit.labels.filter((l) => l.alpha > 0.8).map((l) => l.text);
}

test('the age-only replay retains the original exact confirmation until a separately declared rewind', () => {
  const replay = { 'maya-expired': 'after', 'maya-replay': 'after', 'maya-eligible': 'after' };
  const labels = paint('fresh-case', 1, replay);
  assert(labels.includes('Exact confirmation remains present'));
  assert(labels.includes('30 ≤ 30 · policy eligibility passes'));
  assert(!labels.includes('Ask for exact confirmation'));
  assert(!labels.includes('1 PENDING · 0 APPLIED CREDITS'));
  const rewind = paint('fresh-case', 1, {
    ...replay,
    'maya-rewind': 'after',
    'maya-confirm': 'after',
  });
  assert(rewind.includes('Ask for exact confirmation'));
  assert(!rewind.includes('Exact confirmation remains present'));
  assert(!rewind.includes('1 PENDING · 0 APPLIED CREDITS'));
});

test('the queue acknowledgement and expiry conclusion wait for their completed clauses', () => {
  assert(!paint('fresh-case', 1, { 'maya-expired': 'during' }).some((x) => x.includes('31 > 30')));
  assert(paint('fresh-case', 1, { 'maya-expired': 'after' }).some((x) => x.includes('31 > 30')));
  const matched = {
    'maya-expired': 'after',
    'maya-replay': 'after',
    'maya-eligible': 'after',
    'maya-rewind': 'after',
    'maya-confirm': 'after',
    'maya-match': 'after',
  };
  assert(
    !paint('fresh-case', 1, { ...matched, 'maya-pending': 'during' }).includes(
      '1 PENDING · 0 APPLIED CREDITS',
    ),
  );
  assert(
    paint('fresh-case', 1, { ...matched, 'maya-pending': 'after' }).includes(
      '1 PENDING · 0 APPLIED CREDITS',
    ),
  );
});

test('the final tuple match remains pending until the full comparison clause completes', () => {
  const replay = {
    'maya-expired': 'after',
    'maya-replay': 'after',
    'maya-eligible': 'after',
    'maya-rewind': 'after',
    'maya-confirm': 'after',
  };
  assert.equal(
    paint('fresh-case', 1, { ...replay, 'maya-match': 'almost' }).filter((x) => x === 'MATCH')
      .length,
    5,
  );
  assert.equal(
    paint('fresh-case', 1, { ...replay, 'maya-match': 'after' }).filter((x) => x === 'MATCH')
      .length,
    6,
  );
});

test('charges can build in partial bars without disclosing their completed amount or reserve pair', () => {
  const partial = paint('ticket-budget', 1, { 'first-bill': 'during', 'reserve-bill': 'during' });
  assert(!partial.includes('$0.004070'));
  assert(!partial.some((x) => x.includes('0.009500 + $0.009925')));
  assert(partial.some((x) => x.includes('Constructing charge')));
  const complete = paint('ticket-budget', 1, { 'first-bill': 'after', 'reserve-bill': 'after' });
  assert(complete.includes('$0.004070'));
  assert(complete.some((x) => x.includes('0.009500 + $0.009925')));
});

test('unresolved reservation and fallback totals keep their own completed result boundaries', () => {
  for (const [id, text] of [
    ['unknown-reserve', 'Unknown usage · hold $0.009500'],
    ['fallback-bill', 'Fallback charge · $0.006950'],
    ['fallback-total', 'Reserved + observed = $0.016450 · do not release the unknown hold'],
  ]) {
    assert(!paint('ticket-budget', 2, { [id]: 'during' }).includes(text), id);
    assert(paint('ticket-budget', 2, { [id]: 'after' }).includes(text), id);
  }
});
