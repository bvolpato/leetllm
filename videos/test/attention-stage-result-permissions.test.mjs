import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { pathBounds, ringCenter, unionBounds } from 'vizmatic/stage';
import definition from '../stage-lessons/attention.film.mjs';
import { makeLessonTimeline, makeSceneTimeline, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { compileStageLesson, estimatedTimeline } from '../lib/stage-lesson.mjs';
import { captionsForBeat, paragraphPolicy } from '../lib/teaching-captions.mjs';

const lesson = await readLesson(
  fileURLToPath(new URL('../stage-lessons/attention.lesson.yaml', import.meta.url)),
  fileURLToPath(new URL('../../', import.meta.url)),
);
const resultTake = JSON.parse(
  await readFile(new URL('./fixtures/attention-result-take.json', import.meta.url)),
);
const estimated = estimatedTimeline(lesson, 60);
const scenes = estimated.scenes.map((timing, index) => {
  if (timing.id !== resultTake.scene) return timing;
  const scene = lesson.scenes[index];
  assert.equal(
    scene.beats[resultTake.beat].say,
    resultTake.say,
    'Renew the recorded result after its wording changes.',
  );
  const sounds = [...timing.sounds];
  sounds[resultTake.beat] = {
    beatIndex: resultTake.beat,
    words: resultTake.words,
    duration: resultTake.duration,
  };
  return {
    ...makeSceneTimeline(
      scene,
      sounds.map((sound) => sound.duration),
      estimated.fps,
    ),
    sounds,
  };
});
const timeline = { ...estimated, ...makeLessonTimeline(scenes, estimated.intro.duration) };
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const cases = JSON.parse(
  await readFile(new URL('./fixtures/attention-stage-result-permissions.json', import.meta.url)),
);

function spoken(sceneId, beat, phrase) {
  const scene = lesson.scenes.find((entry) => entry.id === sceneId);
  const timing = timeline.scenes.find((entry) => entry.id === sceneId);
  const [cue] = resolveSceneCues(
    {
      ...scene,
      beats: scene.beats.map((entry, i) => ({
        ...entry,
        visual_cues: i === beat ? [{ id: 'probe', phrase, targets: ['picture'] }] : [],
      })),
    },
    timing,
  );
  return { start: timing.start + cue.start, end: timing.start + cue.end };
}

const visible = (time) =>
  compiled
    .frame(time)
    .ops.filter(
      (op) =>
        op.kind === 'path' &&
        op.path.length &&
        Math.max(op.fillAlpha ?? 0, op.strokeAlpha ?? 0) > 0.01,
    );
const texts = (time) =>
  new Set(
    visible(time)
      .map((op) => op.node?.parent?.source)
      .filter(Boolean),
  );

test('the opening highlights sing on its spoken word and waits to point out Birds', () => {
  const verb = spoken('hook', 0, 'sing');
  const question = spoken('hook', 0, 'who sings');
  const answer = spoken('hook', 1, 'The birds are singing');
  const color = (time, word) => visible(time).find((op) => op.node?.parent?.source === word)?.fill;
  for (const time of [0, 1 / 30, 0.2, 0.4, verb.start - 0.001]) {
    const before = texts(time);
    for (const word of ['Birds', 'in', 'the', 'garden']) {
      assert(before.has(word), `Missing "${word}" at lesson time ${time}.`);
    }
    assert(!before.has('sing'), 'Keep the verb off screen until the reader reaches it.');
  }
  const during = verb.start + (verb.end - verb.start) / 2;
  assert(texts(during).has('sing') && !texts(during).has('softly'));
  assert.notDeepEqual(color(during, 'sing'), color(during, 'garden'));
  assert(!texts(question.start - 0.001).has('Who sings?'));
  assert(texts(question.end).has('Who sings?'));
  assert.deepEqual(color(answer.end - 0.001, 'Birds'), color(answer.end - 0.001, 'garden'));
  assert.notDeepEqual(color(answer.end + 0.9, 'Birds'), color(answer.end + 0.9, 'garden'));
});

test('the opening caption lets the viewer add the two pieces before it gives their sum', () => {
  const timing = timeline.scenes.find((scene) => scene.id === 'hook');
  const adding = spoken('hook', 3, 'Add those pieces');
  const total = spoken(
    'hook',
    3,
    'The first number that comes back to sing is about one point four two',
  );
  const captions = captionsForBeat(timing, paragraphPolicy)(timing.beats[3], 3);
  const pieces = texts(adding.start);
  assert(pieces.has('0.84') && pieces.has('0.58'));
  const answer = captions.find((caption) => caption.text.includes('one point four two'));
  assert(answer);
  assert(Math.abs(answer.start - total.start) < 0.0011, 'The total appears in an earlier caption.');
  assert(!texts(total.end - 0.001).has('0.84 + 0.58 ≈ 1.42'));
  assert(texts(total.end + 0.35).has('0.84 + 0.58 ≈ 1.42'));
});

test('the sentence shows how far back Birds is from sing on the spoken count', () => {
  const subject = spoken('hook', 1, 'The birds are singing');
  assert(
    !texts(subject.end + 0.9).has('Who sings?'),
    'Clear the question once Birds is identified.',
  );
  const count = spoken('hook', 1, 'Count back from sing');
  const distance = spoken('hook', 1, 'Four positions');
  const cut = spoken('hook', 1, 'keep just two tokens');
  const timing = timeline.scenes.find((scene) => scene.id === 'hook');
  const captions = captionsForBeat(timing, paragraphPolicy)(timing.beats[1], 1);
  const prompt = captions.find((c) => c.start <= count.end - 0.01 && count.end - 0.01 < c.end);
  assert.equal(prompt?.text, 'Count back from sing.');
  assert(!texts(distance.end - 0.001).has('4'));
  const marked = visible(distance.end + 0.35);
  const bounds = (label) =>
    marked
      .filter((op) => op.node?.parent?.source === label)
      .map((op) => pathBounds(op.path))
      .reduce(unionBounds, null);
  const centerX = (box) => box.x + box.width / 2;
  const afterCut = texts(cut.start + 0.4);
  for (const [offset, word] of ['sing', 'garden', 'the', 'in', 'Birds'].entries()) {
    const token = bounds(word);
    const mark = bounds(String(offset));
    assert(token && mark, 'Missing word or offset for ' + word);
    assert(
      Math.abs(centerX(mark) - centerX(token)) < 10 && mark.y > token.y + token.height,
      'Place the count under ' + word,
    );
    assert(!afterCut.has(String(offset)), 'Clear the count when the words move.');
  }
});

test('each dot product keeps its operands in view until its spoken answer', () => {
  const timing = timeline.scenes.find((scene) => scene.id === 'score');
  const captions = timing.beats.flatMap(captionsForBeat(timing, paragraphPolicy));
  const first = spoken('score', 2, 'Against the birds key');
  const captionAt = (t) => captions.find((c) => c.start <= t && t < c.end)?.text ?? '';
  assert.doesNotMatch(captionAt(first.end), /gives point six|one point oh five/i);

  const birds = spoken('score', 2, 'gives point six');
  const question = spoken('score', 2, 'What score do you get');
  const sing = spoken('score', 3, 'One point oh five');
  assert(sing.start - question.end >= 2 - 0.001);
  for (const [setup, answer, row, result] of [
    [first.end, birds, '[0.8,\\ 0.2]', '0.60'],
    [question.start, sing, '[0.3,\\ 0.9]', '1.05'],
  ]) {
    for (const t of [setup, (setup + answer.end) / 2, answer.end - 0.001]) {
      const frame = texts(t);
      assert(frame.has('[0.5,\\ 1] \\cdot') && frame.has(row + ' = ?'));
      assert(!frame.has(row + ' = ' + result));
    }
    assert(texts(answer.end + 0.35).has(row + ' = ' + result));
  }
  assert.match(captionAt(birds.start + 0.01), /gives point six/i);
  assert.doesNotMatch(captionAt(question.end - 0.01), /one point oh five/i);
  assert.match(captionAt(sing.start + 0.01), /one point oh five/i);
});

for (const entry of cases) {
  const { beat, phrase, expected } = entry;
  if (entry.id === 'blend-operands') continue; // The output stacks are checked as geometry below.
  test(entry.scene + ' reveals ' + entry.id + ' after its spoken result', () => {
    const { end } = spoken(entry.scene, beat, phrase);
    if (entry.id === 'answer-full') {
      const timing = timeline.scenes.find((scene) => scene.id === resultTake.scene);
      const recordedEnd =
        timing.start + timing.beats[resultTake.beat].start + resultTake.words.at(-1).end;
      assert(
        Math.abs(end - recordedEnd) < 0.001,
        'The result must follow the final recorded word.',
      );
    }
    const before = texts(end - 0.001);
    const after = texts(end + 0.35);
    for (const label of expected) {
      assert(!before.has(label), 'Premature result: ' + label);
      assert(after.has(label), 'Missing earned result: ' + label);
    }
  });
}

test('the projected query stays open on screen and in the setup caption', () => {
  const timing = timeline.scenes.find((entry) => entry.id === 'your-turn');
  const captions = captionsForBeat(timing, paragraphPolicy)(timing.beats[0], 0);
  const answer = spoken('your-turn', 0, 'The new query is two point five three point five');
  const setup = spoken('your-turn', 0, 'Multiply that row by the same query matrix');
  const matrix = '[1,\\ 3] \\, \\begin{bmatrix} 1 & 0.5 \\\\ 0.5 & 1 \\end{bmatrix} =';
  for (const t of [setup.start + 0.5, setup.end - 0.001, answer.end - 0.001]) {
    const frame = texts(t);
    assert(frame.has(matrix) && frame.has('[?, ?]'));
    assert(!frame.has('[2.5, 3.5]'));
  }
  const resultCaptions = captions.filter((caption) => caption.text.includes('two point five'));
  assert.equal(resultCaptions.length, 1);
  assert(Math.abs(resultCaptions[0].start - answer.start) < 0.0011);
  assert(!texts(answer.end + 0.35).has('[?, ?]'));
});

test('head two keeps both weighted sums visible while viewers choose the larger coordinate', () => {
  const timing = timeline.scenes.find((s) => s.id === 'heads');
  const captions = timing.beats.flatMap(captionsForBeat(timing, paragraphPolicy));
  const shares = spoken(
    'heads',
    2,
    'Now sing gives sixty seven percent to birds and thirty three to itself',
  );
  const question = spoken('heads', 2, 'Which output coordinate is larger');
  const answer = spoken('heads', 3, 'The second');
  const output = spoken('heads', 3, 'The output is point three three point six seven');
  const result = cases.find((entry) => entry.id === 'head2-output').expected[0];
  const first = '\\text{First}\\quad 0.67 \\times 0 + 0.33 \\times 1';
  const second = '\\text{Second}\\quad 0.67 \\times 1 + 0.33 \\times 0';
  for (const [phrase, cue] of [
    ['sixty seven percent', shares],
    ['The second.', answer],
    ['point three three, point six seven', output],
  ]) {
    const caption = captions.find((c) => c.text.includes(phrase));
    assert(
      caption && Math.abs(caption.start - cue.start) < 0.0011,
      'Early or missing caption: ' + phrase,
    );
  }
  assert(answer.start - question.end >= 1.99);
  const color = (time, term) => visible(time).find((op) => op.node?.parent?.source === term)?.fill;
  for (const time of [question.end, answer.start - 0.01, answer.end - 0.001]) {
    const frame = texts(time);
    for (const label of [
      'Which output coordinate is larger?',
      'birds 67%',
      'sing 33%',
      first,
      second,
    ]) {
      assert(frame.has(label), 'Missing operand or question: ' + label);
    }
    assert.deepEqual(color(time, first), color(time, second));
    assert(!frame.has(result));
  }
  assert.notDeepEqual(color(answer.end + 0.4, first), color(answer.end + 0.4, second));
  assert(!texts(output.end - 0.001).has(result));
  const complete = texts(output.end + 0.35);
  assert(complete.has(result) && !complete.has(first) && !complete.has(second));
});

test('the two raw score gaps can be compared without giving away the next result', () => {
  const timing = timeline.scenes.find((scene) => scene.id === 'your-turn');
  const captions = captionsForBeat(timing, paragraphPolicy)(timing.beats[1], 1);
  const captionAt = (time) => captions.find((c) => c.start <= time && time < c.end).text;
  const sing = spoken('your-turn', 1, 'Sing scores three point nine');
  assert.doesNotMatch(captionAt(sing.start + 0.01), /point four five|one point two/i);
  const oldGap = spoken('your-turn', 1, 'With the old query sing led by point four five');
  const newGap = spoken('your-turn', 1, 'Now it leads by one point two');
  assert.doesNotMatch(captionAt(newGap.start - 0.01), /one point two/i);
  assert.match(captionAt(newGap.start + 0.01), /one point two/i);
  const leadBars = (time) => {
    const ops = visible(time);
    const singColor = ops.find((op) => op.node?.parent?.source === 'sing').fill;
    return ops
      .filter((op) => op.strokeAlpha > 0.01 && String(op.stroke) === String(singColor))
      .map((op) => op.path[0].p);
  };
  assert(!texts(oldGap.end - 0.001).has('0.45'));
  assert.equal(leadBars(oldGap.end - 0.001).length, 0);
  const comparing = texts(newGap.end - 0.001);
  for (const label of ['0.60', '1.05', '= 2.70', '= 3.90', '0.45']) assert(comparing.has(label));
  assert(!comparing.has('1.20'));
  assert.equal(leadBars(newGap.end - 0.001).length, 1);
  const both = texts(newGap.end + 0.35);
  assert(both.has('0.45') && both.has('1.20'));
  const bars = leadBars(newGap.end + 0.4);
  assert.equal(bars.length, 2);
  const [oldBar, newBar] = bars;
  assert.equal(oldBar[0], newBar[0], 'Both leads must start at the same zero.');
  const ratio = (newBar.at(-2) - newBar[0]) / (oldBar.at(-2) - oldBar[0]);
  assert(Math.abs(ratio - 1.2 / 0.45) < 0.001, 'Both leads must use the same scale.');
});

test('the tile totals stay visible while the viewer chooses the divisor', () => {
  const divide = spoken('flash', 6, 'Divide the weighted sum by the mass');
  const answer = spoken('flash', 6, 'The output is about one point five one');
  const timing = timeline.scenes.find((scene) => scene.id === 'flash');
  const result = cases.find((entry) => entry.id === 'online-output').expected[0];
  const choices = ['Which divisor?', 'Total mass', '2.277 ÷ 1.503', 'Value count', '2.277 ÷ 3'];
  for (const time of [
    timing.start + timing.beats[5].end,
    divide.start - 0.05,
    divide.end - 0.001,
  ]) {
    const frame = texts(time);
    for (const label of ['1.503', '2.277', ...choices]) {
      assert(frame.has(label), 'Missing input or divisor choice: ' + label);
    }
    assert(!frame.has(result));
  }
  for (const time of [divide.end + 0.4, answer.end - 0.001]) {
    const frame = texts(time);
    assert(!frame.has('2.277 ÷ 3') && frame.has('2.277 ÷ 1.503'));
    assert(!frame.has(result));
  }
  assert(texts(answer.end + 0.35).has(result));
  const captions = captionsForBeat(timing, paragraphPolicy)(timing.beats[6], 6);
  const firstAnswer = captions.find((caption) => caption.text.includes('one point five one'));
  assert(firstAnswer, 'The result caption is missing.');
  assert(
    Math.abs(firstAnswer.start - answer.start) < 0.0011,
    'The caption gives away the quotient.',
  );
});

const filledShapes = (ops) => ops.filter((op) => !op.node?.parent?.source && op.fillAlpha > 0.01);

test('both sources contribute to both output stacks only after the operands are spoken', () => {
  const { scene, beat, phrase } = cases.find((entry) => entry.id === 'blend-operands');
  const { start, end } = spoken(scene, beat, phrase);
  const sourcePieces = (time) => {
    const ops = visible(time);
    const colors = ['Birds', 'sing'].map((name) =>
      String(ops.find((op) => op.node?.parent?.source === name).fill),
    );
    return colors.map((color) => filledShapes(ops).filter((op) => String(op.fill) === color));
  };
  for (const t of [start + 0.01, (start + end) / 2, end - 0.001]) {
    assert.deepEqual(
      sourcePieces(t).map((pieces) => pieces.length),
      [0, 0],
    );
  }
  assert.deepEqual(
    sourcePieces(end + 0.9).map((pieces) => pieces.length),
    [2, 2],
  );
  const labels = texts(end + 0.9);
  for (const contribution of ['0.60', '0.70', '0.30', '1.40']) assert(labels.has(contribution));
});

test('the viewer can add both stacks before the caption and picture give the totals', () => {
  const timing = timeline.scenes.find((scene) => scene.id === 'your-turn');
  const { beat, phrase, expected: totals } = cases.find((entry) => entry.id === 'answer-full');
  const answer = spoken('your-turn', beat, phrase);
  const captions = timing.beats.flatMap(captionsForBeat(timing, paragraphPolicy));
  const answerCaption = captions.find((c) => c.text.toLowerCase().includes('one point three'));
  assert(answerCaption);
  assert(
    Math.abs(answerCaption.start - answer.start) < 0.0011,
    'The caption gives away the totals.',
  );

  const question = spoken('your-turn', 2, 'What are the two totals from left to right');
  assert(answer.start - question.end >= 1.99, 'Leave two seconds to add the pieces.');
  for (const time of [question.end, answer.start - 0.01, answer.end - 0.001]) {
    const frame = texts(time);
    for (const piece of ['0.60', '0.70', '0.30', '1.40']) assert(frame.has(piece));
    for (const total of totals) assert(!frame.has(total));
    const slots = new Set(
      visible(time)
        .map((op) => op.node?.parent)
        .filter((n) => n?.source === '?'),
    );
    assert.equal(slots.size, 2);
  }
  const solved = texts(answer.end + 0.35);
  assert(!solved.has('?'));
  for (const total of totals) assert(solved.has(total));
});

test('equal values keep the output point and its coordinates hidden through the prediction', () => {
  const question = spoken('learn', 2, 'where will the gold output point land');
  const answer = spoken('learn', 3, 'The gold point lands where the rings meet at three minus one');
  const ringsMeet = spoken('learn', 2, 'The two rings meet');
  const lower = spoken('learn', 3, 'Give Birds its old logit back');
  const explanation = spoken('learn', 3, 'Both routes deliver the same vector');
  const label = 'Output  [3.00, -1.00]';
  const solved = visible(answer.end + 0.35);
  const gold = solved.find((op) => op.node?.parent?.source === label)?.fill;
  assert(gold);
  const goldPoint = (ops) => filledShapes(ops).find((op) => String(op.fill) === String(gold));
  const point = goldPoint(solved);
  assert(point);
  const [x0, y0] = ringCenter(point.path[0]);
  assert(texts(ringsMeet.end).has('Birds 42%'));
  for (const t of [question.start, question.end + 0.1, answer.start - 0.01, answer.end - 0.001]) {
    const ops = visible(t);
    const frame = new Set(ops.map((op) => op.node?.parent?.source));
    assert(
      frame.has('Birds 66%') && frame.has('sing 34%'),
      'The shares must change before the prediction.',
    );
    assert(!ops.some((op) => op.node?.parent?.source?.startsWith('Output  [')));
    assert(!goldPoint(ops));
  }
  for (const t of [lower.end + 0.6, explanation.start]) {
    const frame = visible(t);
    assert(frame.some((op) => op.node?.parent?.source === label));
    const current = goldPoint(frame);
    assert(current, 'Keep the gold point visible as the shares change back.');
    const [x, y] = ringCenter(current.path[0]);
    assert(Math.hypot(x - x0, y - y0) < 0.5, 'The output point moved as the shares changed back.');
  }
  assert(texts(explanation.start).has('Birds 42%'));
  assert.equal(lesson.scenes.find((s) => s.id === 'learn').beats[2].hold, 2);
  assert.equal(lesson.scenes.find((s) => s.id === 'your-turn').beats[0].hold, 5);
});
