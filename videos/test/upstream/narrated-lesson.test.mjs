import test from 'node:test';
import assert from 'node:assert/strict';
import { fadeIn, text } from 'vizmatic/stage';
import { compileNarratedLesson, narratedLesson } from '../../lib/narrated-lesson.mjs';
import { compileStageLesson, estimatedTimeline, sceneWindows } from '../../lib/stage-lesson.mjs';

const lesson = {
  id: 'small',
  title: 'Small',
  source: 'small.md',
  scenes: [
    {
      id: 'first',
      title: 'First',
      visual: 'One word.',
      beats: [
        {
          say: 'Look at this word on the screen. The answer is 3.5 seconds.',
          hold: 0.3,
          visual_cues: [
            { id: 'word', phrase: 'this word', targets: ['word'], color: 'yellow' },
            { id: 'answer', phrase: 'The answer is 3.5 seconds', targets: ['answer'] },
          ],
        },
      ],
    },
    {
      id: 'second',
      title: 'Second',
      visual: 'One more word.',
      beats: [{ say: 'Now read the naïve second word.' }, { say: 'And then it ends.', hold: 0.6 }],
    },
  ],
};
const timeline = estimatedTimeline(lesson, 30);
const visibleText = (compiled, time) =>
  new Set(
    compiled
      .frame(time)
      .ops.filter((op) => op.kind === 'path' && (op.fillAlpha ?? 0) > 0.01)
      .map((op) => op.node?.parent?.source)
      .filter(Boolean),
  );
const film = (first, second = (s) => s.add(text('second'))) =>
  narratedLesson({ id: 'small', scenes: { first, second } });
const both = (s, c) => {
  s.add(text('title').at(0, -200));
  c.show('word', text('word'));
  c.show('answer', text('answer').at(0, 200), { after: true });
};

test('a narrated lesson has the scene windows and the length of its narration', async () => {
  const starts = [];
  const { compiled, duration } = await compileStageLesson(
    film(
      (s, c) => {
        both(s, c);
        starts.push(c.start);
      },
      (s, c) => {
        s.add(text('second'));
        starts.push(c.start);
      },
    ),
    lesson,
    timeline,
  );
  const windows = sceneWindows(timeline);
  assert.equal(duration, timeline.duration);
  assert(Math.abs(compiled.duration - timeline.duration) < 1e-6);
  // Each scene has 0.4 seconds before its first word, as a scene of the course has.
  assert(Math.abs(starts[0] - (windows[0].from + 0.4)) < 1e-6);
  assert(Math.abs(starts[1] - (windows[1].from + 0.4)) < 1e-6);
});

test('a cue starts a change at its phrase, and a result waits for its whole clause', async () => {
  const { compiled } = await compileNarratedLesson(film(both), lesson, timeline);
  const [word, answer] = timeline.scenes[0].visualCues;
  assert.equal(word.id, 'word');
  assert(!visibleText(compiled, word.start - 0.2).has('word'));
  assert(visibleText(compiled, word.start + 0.3).has('word'));
  assert(!visibleText(compiled, answer.end - 0.001).has('answer'), 'the result is early');
  assert(visibleText(compiled, answer.end + 0.35).has('answer'));
});

test('a declared cue that drives nothing stops the compile', async () => {
  const unused = film((s, c) => {
    s.add(text('title'));
    c.show('word', text('word').at(0, 100));
  });
  await assert.rejects(
    compileNarratedLesson(unused, lesson, timeline),
    /cues drive nothing.*first\/answer/,
  );
});

test('a cue id that the lesson file does not declare stops the compile', async () => {
  const unknown = film((s, c) => {
    both(s, c);
    c.show('this word', text('again').at(0, 300));
  });
  await assert.rejects(
    compileNarratedLesson(unknown, lesson, timeline),
    /declares no cue "this word".*word, answer/,
  );
});

test('a play that ends after its scene stops the compile', async () => {
  const late = film((s, c) => {
    both(s, c);
    const slow = text('slow').at(0, 300);
    c.on('word', () => s.play(fadeIn(slow), { duration: 60 }));
  });
  await assert.rejects(compileNarratedLesson(late, lesson, timeline), /run past its narration/);
});

test('a lesson with a scene that is not rebuilt compiles as a draft only', async () => {
  const partial = narratedLesson({ id: 'small', scenes: { first: both } });
  const draft = await compileNarratedLesson(partial, lesson, timeline);
  assert.deepEqual(draft.pending, ['second']);
  assert.deepEqual(draft.built, ['first']);
  await assert.rejects(compileStageLesson(partial, lesson, timeline), /not rebuilt yet: second/);
});

test('swapAll changes the whole picture at a beat and keeps what the scene names', async () => {
  const scene = (s, c) => {
    const title = text('title').at(0, -300),
      old = text('old'),
      late = text('late').at(0, 200),
      next = text('next');
    s.add(title, old);
    c.swapAll(1, next, { keep: [title] });
    // A node that comes after the call is not a part of the picture that leaves.
    c.show(1, late, { lead: -0.2 });
  };
  const { compiled } = await compileNarratedLesson(film(both, scene), lesson, timeline);
  const start = sceneWindows(timeline)[1].from + timeline.scenes[1].beats[1].start;
  const before = visibleText(compiled, start - 0.3),
    after = visibleText(compiled, start + 0.8);
  assert(before.has('old') && before.has('title') && !before.has('next'));
  assert(after.has('next') && after.has('title') && after.has('late') && !after.has('old'));
});

test('a beat index in the place of a cue id stops with the name of the right call', async () => {
  const wrong = film((s, c) => {
    both(s, c);
    c.on(0, () => {});
  });
  await assert.rejects(compileNarratedLesson(wrong, lesson, timeline), /use c\.onBeat\(0, build\)/);
});
