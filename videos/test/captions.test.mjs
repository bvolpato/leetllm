import test from 'node:test';
import assert from 'node:assert/strict';
import { lexicalTokens, paragraphCaptions, timedWordTokens } from '../lib/captions.mjs';

const wordsFor = (text, interval = 0.12, duration = 0.08) =>
  [...text.matchAll(/\S+/gu)].map((match, index) => ({
    text: match[0],
    start: index * interval,
    end: index * interval + duration,
  }));

test('keeps a complete sentence together when it fits a readable paragraph cue', () => {
  const text =
    'A support team wants to search messages about billing, login problems, and deploy policies.';
  const result = paragraphCaptions(wordsFor(text), 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [text],
  );
});

test('keeps a short paragraph with multiple sentences in one cue', () => {
  const text = 'The points form three pairs. Each pair shares a topic.';
  const result = paragraphCaptions(wordsFor(text), 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [text],
  );
});

test('opted-in phrase starts keep predictions visible before answers and begin on spoken words', () => {
  const text =
    'Predict the size. The cache holds five hundred twelve mebibytes, and at best eighty requests fit.';
  const words = wordsFor(text);
  const boundaries = ['five', 'and'].map((word) => lexicalTokens(text).indexOf(word));
  assert.deepEqual(
    paragraphCaptions(words, 4, text).map((cue) => cue.text),
    [text],
  );
  const result = paragraphCaptions(words, 4, text, boundaries);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [
      'Predict the size. The cache holds',
      'five hundred twelve mebibytes,',
      'and at best eighty requests fit.',
    ],
  );
  assert.equal(result.map((cue) => cue.text).join(' '), text);
  for (const [index, boundary] of boundaries.entries()) {
    assert.equal(result[index].end, 4 + words[boundary - 1].end);
    assert.equal(result[index + 1].start, 4 + words[boundary].start);
    assert.ok(result[index].end <= result[index + 1].start);
  }
});

test('phrase boundaries compose with paragraph and sentence limits without losing punctuation or order', () => {
  const first = `Dr. Lee measures 3.14, then ${'checks the evidence carefully '.repeat(8)}and asks for a prediction.`;
  const answer = 'The answer is three hundred twenty. Keep the result.';
  const text = `${first} ${answer}\n\nRead the next paragraph.`;
  const start = lexicalTokens(first).length;
  const result = paragraphCaptions(wordsFor(text), 0, text, [start, start, 0]);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [first, answer, 'Read the next paragraph.'],
  );
  assert.equal(result.map((cue) => cue.text).join(' '), text.replace(/\s+/gu, ' '));
});

test('explicit boundaries reject unrecorded splits and overlapping events instead of delaying or merging answers', () => {
  const words = [
    { text: 'Predict', start: 0.1, end: 0.5 },
    { text: 'then answer', start: 0.7, end: 1.2 },
  ];
  assert.throws(
    () => paragraphCaptions(words, 0, 'Predict then answer.', [2]),
    /requires a separate measured word/,
  );
  assert.deepEqual(paragraphCaptions(words, 0, 'Predict then answer.', [1]), [
    { start: 0.1, end: 0.5, text: 'Predict' },
    { start: 0.7, end: 1.2, text: 'then answer.' },
  ]);
  const overlapping = [{ ...words[0], end: 0.8 }, words[1]];
  assert.throws(
    () => paragraphCaptions(overlapping, 0, 'Predict then answer.', [1]),
    /requires a separate measured word/,
  );
  for (const boundary of [-1, 3, 0.5, NaN, '1']) {
    assert.throws(
      () => paragraphCaptions(words, 0, 'Predict then answer.', [boundary]),
      /Invalid caption boundary/,
    );
  }
  assert.throws(
    () =>
      paragraphCaptions(
        [
          { text: '3', start: 0.1, end: 0.2 },
          { text: '14', start: 0.3, end: 0.5 },
        ],
        0,
        '3.14',
        [1],
      ),
    /requires a separate authored word/,
  );
});

test('phrase starts retain attached signs and opening quotes with the answer', () => {
  for (const [text, boundary, expected] of [
    ['−5 is the result.', 0, ['−5 is the result.']],
    ['− 5 is the result.', 0, ['− 5 is the result.']],
    ['Predict first. “Answer now.”', 2, ['Predict first.', '“Answer now.”']],
    ['Predict first. “ Answer now.”', 2, ['Predict first.', '“ Answer now.”']],
    ['Predict first. − 5 is the result.', 2, ['Predict first.', '− 5 is the result.']],
    ['Predict the amount: −5 is the result.', 3, ['Predict the amount:', '−5 is the result.']],
    ['Predict the amount: − 5 is the result.', 3, ['Predict the amount:', '− 5 is the result.']],
  ]) {
    const words = wordsFor(text);
    const captions = paragraphCaptions(words, 0, text, [boundary]);
    assert.deepEqual(
      captions.map((cue) => cue.text),
      expected,
    );
    assert.equal(captions.map((cue) => cue.text).join(' '), text);
    assert.equal(
      captions.at(-1).start,
      words[timedWordTokens(words, text)[boundary].wordIndex].start,
    );
  }
});

test('keeps explicit blank-line paragraphs in separate cues and normalizes within each paragraph', () => {
  const transcript = 'The first line\ncontinues here.\n\n  A second\tparagraph remains together.  ';
  const result = paragraphCaptions(wordsFor(transcript), 0, transcript);
  assert.deepEqual(
    result.map((cue) => cue.text),
    ['The first line continues here.', 'A second paragraph remains together.'],
  );
});

test('splits a long paragraph only between complete sentences', () => {
  const sentences = [
    'The observer follows each measured change across the screen, connecting the visible result to the operation that produced it.',
    'The second explanation traces how the same operation changes the next state and why that difference matters to the learner.',
    'The final explanation ties the displayed evidence back to the original question and leaves the learner with a usable rule.',
  ];
  const text = sentences.join(' ');
  const result = paragraphCaptions(wordsFor(text), 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [sentences.slice(0, 2).join(' '), sentences[2]],
  );
});

test('uses the duration limit for long spoken paragraphs and preserves sentence boundaries', () => {
  const sentences = [
    'Follow the first result.',
    'Watch the second result.',
    'Compare the third result.',
    'Check the final result.',
  ];
  const text = sentences.join(' ');
  const words = wordsFor(text, 2, 0.5);
  const result = paragraphCaptions(words, 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [sentences.slice(0, 3).join(' '), sentences[3]],
  );
  assert.ok(result.every((cue) => cue.text.endsWith('.')));
});

test('keeps a single long sentence intact when it exceeds both defaults', () => {
  const text = `Dr. Lee measures 3.14 before ${Array.from({ length: 85 }, (_, index) => `carefully measured stage ${index + 1}`).join(', ')} and uses the full calculation to finish the explanation.`;
  const result = paragraphCaptions(wordsFor(text, 0.5, 0.2), 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [text],
  );
});

test('does not treat decimals, common abbreviations, or quoted punctuation as sentence breaks', () => {
  const first =
    'Dr. Lee records the ratio 3.14 and explains the careful measurement step by step for every learner following the demonstration closely.';
  const second =
    '“The decimal stays together,” she says, “while the complete result remains visible through the end of this extended example and can be checked against every intermediate value in the demonstration.”';
  const text = `${first} ${second}`;
  const result = paragraphCaptions(wordsFor(text), 0, text);
  assert.deepEqual(
    result.map((cue) => cue.text),
    [first, second],
  );
});

test('keeps numbered figure and section references inside a long sentence', () => {
  for (const reference of ['Fig. 3', 'No. 2']) {
    const text = `The explanation refers to ${reference} while ${Array.from({ length: 70 }, (_, index) => `carefully checked detail ${index + 1}`).join(', ')} completes the same sentence.`;
    assert.deepEqual(
      paragraphCaptions(wordsFor(text), 0, text).map((cue) => cue.text),
      [text],
    );
  }
});

test('distinguishes U.S. sentence endings from interior names such as U.S. Navy', () => {
  const first =
    'The report covers a carefully documented history of regional policy and the administration responsible for the standards used in our training example across many earlier editions before it reaches the abbreviation U.S.';
  const second =
    'It then explains how the policy changed and follows the evidence through a complete account that gives readers the context they need to understand the result.';
  const transcript = `${first} ${second}`;
  assert.deepEqual(
    paragraphCaptions(wordsFor(transcript), 0, transcript).map((cue) => cue.text),
    [first, second],
  );

  const navy = `The report follows the U.S. Navy ${Array.from({ length: 70 }, (_, index) => `carefully checked detail ${index + 1}`).join(', ')} through the complete example.`;
  assert.deepEqual(
    paragraphCaptions(wordsFor(navy), 0, navy).map((cue) => cue.text),
    [navy],
  );

  const continuation = `The report discusses the U.S. and its ${Array.from({ length: 70 }, (_, index) => `carefully checked detail ${index + 1}`).join(', ')} throughout the same complete sentence.`;
  assert.deepEqual(
    paragraphCaptions(wordsFor(continuation), 0, continuation).map((cue) => cue.text),
    [continuation],
  );
});

test('uses measured first and last word times and applies the intro offset', () => {
  const words = [
    { text: 'A', start: 0.12, end: 0.3 },
    { text: 'slope', start: 0.4, end: 0.9 },
    { text: 'Move', start: 1.2, end: 1.5 },
    { text: 'down', start: 1.6, end: 2 },
  ];
  assert.deepEqual(paragraphCaptions(words, 12.5, 'A slope. Move down!'), [
    { start: 12.62, end: 14.5, text: 'A slope. Move down!' },
  ]);
});

test('uses provider text when no authored transcript is supplied', () => {
  const words = [
    { text: 'A slope.', start: 0.1, end: 0.5 },
    { text: 'Move down.', start: 0.7, end: 1.2 },
  ];
  assert.deepEqual(
    paragraphCaptions(words).map((cue) => cue.text),
    ['A slope. Move down.'],
  );
});

test('merges text when a provider event spans a paragraph boundary and would overlap cues', () => {
  const result = paragraphCaptions(
    [{ text: 'First. Second.', start: 0.4, end: 1.8 }],
    0,
    'First.\n\nSecond.',
  );
  assert.deepEqual(result, [{ start: 0.4, end: 1.8, text: 'First. Second.' }]);
  assert.ok(result.every((cue, index) => index === 0 || result[index - 1].end <= cue.start));
});

test('rejects invalid and backward word timing and mismatched transcript coverage', () => {
  assert.throws(
    () => paragraphCaptions([{ text: 'bad', start: 2, end: 1 }]),
    /Invalid word boundary/,
  );
  assert.throws(
    () =>
      paragraphCaptions([
        { text: 'first', start: 1, end: 2 },
        { text: 'second', start: 0.5, end: 2.5 },
      ]),
    /Invalid word boundary/,
  );
  assert.throws(
    () => paragraphCaptions(wordsFor('A person.'), 0, 'Aperson.'),
    /Transcript does not match/,
  );
  assert.throws(
    () => paragraphCaptions(wordsFor('A person.'), 0, 'A different person.'),
    /Transcript does not match/,
  );
});

test('rounds only selected answer starts forward to a subtitle millisecond', () => {
  const words = [
    { text: 'Predict.', start: 0, end: 0.2 },
    { text: 'No.', start: 0.3012, end: 0.5 },
    { text: 'Continue.', start: 0.6012, end: 0.8 },
  ];
  const captions = paragraphCaptions(words, 1, 'Predict. No. Continue.', [{ ceilMsAt: 1 }, 2]);
  assert.deepEqual(
    captions.map(({ start, end }) => [start, end]),
    [
      [1, 1.2],
      [1.302, 1.5],
      [1 + words[2].start, 1.8],
    ],
  );
});

test('adjacent measured words keep the answer in its own cue at a millisecond boundary', () => {
  const boundary = 1052.9470000000001;
  const words = [
    { text: 'Predict.', start: boundary - 1, end: boundary },
    { text: 'Answer.', start: boundary, end: boundary + 1 },
  ];
  const cues = paragraphCaptions(words, 0, 'Predict. Answer.', [{ ceilMsAt: 1 }]);
  assert.deepEqual(
    cues.map((cue) => cue.text),
    ['Predict.', 'Answer.'],
  );
  assert.equal(cues[1].start, boundary);
});
