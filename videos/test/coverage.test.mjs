import assert from 'node:assert/strict';
import test from 'node:test';
import { articleOutline, scriptHash, validateCoverage } from '../lib/coverage.mjs';

const quiz = (count) =>
  `\`\`\`mastery-quiz\n${JSON.stringify(Array.from({ length: count }, (_, i) => ({ question: `Q${i + 1}` })))}\n\`\`\``;
const article = `# Title\n\n## First idea\n\nText.\n\n### A detail\n\n\`\`\`python\n# Not a heading\n\`\`\`\n\n## Second idea\n\n${quiz(5)}\n`;
const lesson = {
  id: 'demo',
  scenes: [
    { id: 'hook', beats: [{ say: 'Start.' }] },
    { id: 'idea', beats: [{ say: 'Teach.' }] },
  ],
};

const ledger = (overrides = {}) => ({
  version: 1,
  lesson: 'demo',
  promise: 'Teach the idea.',
  framing: ['hook'],
  objectives: [{ id: 'idea', can: 'Explain the idea.', scenes: ['idea'] }],
  sections: [
    { heading: 'First idea', status: 'taught', scenes: ['idea'] },
    {
      heading: 'A detail',
      status: 'article-only',
      reason: 'code-detail',
      note: 'The page shows the code.',
    },
    { heading: 'Second idea', status: 'taught', scenes: ['idea'] },
  ],
  quiz: [1, 2, 3, 4]
    .map((n) => ({ n, status: 'taught', scenes: ['idea'] }))
    .concat({
      n: 5,
      status: 'article-only',
      reason: 'vendor-detail',
      note: 'One product version.',
    }),
  reviews: {
    closed_book: { taught: 4, partial: 1, absent: 0, script: scriptHash(lesson) },
    fact_check: { open_findings: 0, script: scriptHash(lesson) },
  },
  ...overrides,
});
const problems = (overrides) =>
  validateCoverage({ coverage: ledger(overrides), lesson, article }).problems;

test('a complete ledger passes', () => {
  assert.deepEqual(problems({}), []);
});

test('the outline ignores code and reads a two-edition article from its reference edition', () => {
  assert.deepEqual(articleOutline(article).headings, ['First idea', 'A detail', 'Second idea']);
  const twoEditions = `<!-- leetllm: edition:reference:start -->\n## Web\n\n${quiz(2)}\n<!-- leetllm: edition:reference:end -->\n<!-- leetllm: edition:reader:start -->\n## Book\n<!-- leetllm: edition:reader:end -->`;
  assert.deepEqual(articleOutline(twoEditions), { headings: ['Web'], questions: 2 });
});

test('a section dropped without a decision fails', () => {
  const sections = ledger().sections.filter((row) => row.heading !== 'Second idea');
  assert.match(problems({ sections }).join(), /section not accounted for: "Second idea"/);
});

test('a heading that left the article fails', () => {
  const sections = [...ledger().sections, { heading: 'Gone', status: 'taught', scenes: ['idea'] }];
  assert.match(problems({ sections }).join(), /section is not in the article: "Gone"/);
});

test('article-only needs an allowed reason and a note', () => {
  const quizRows = ledger().quiz.map((row) =>
    row.n === 5 ? { n: 5, status: 'article-only', reason: 'too long' } : row,
  );
  const found = problems({ quiz: quizRows }).join();
  assert.match(found, /reason must be one of/);
  assert.match(found, /needs a note/);
});

test('a prerequisite must name its lesson', () => {
  const quizRows = ledger().quiz.map((row) =>
    row.n === 5
      ? { n: 5, status: 'article-only', reason: 'prerequisite', note: 'Taught earlier.' }
      : row,
  );
  assert.match(problems({ quiz: quizRows }).join(), /must name the lesson/);
});

test('teaching under 80% of the quiz fails, by the ledger and by the review', () => {
  const quizRows = ledger().quiz.map((row) =>
    row.n >= 4 ? { n: row.n, status: 'article-only', reason: 'exercise', note: 'Practice.' } : row,
  );
  assert.match(problems({ quiz: quizRows }).join(), /claims 3 of 5/);
  const reviews = {
    ...ledger().reviews,
    closed_book: { taught: 3, partial: 2, absent: 0, script: scriptHash(lesson) },
  };
  assert.match(problems({ reviews }).join(), /found 3 of 5 taught/);
});

test('changing the narration invalidates the recorded reviews', () => {
  const edited = {
    ...lesson,
    scenes: [lesson.scenes[0], { id: 'idea', beats: [{ say: 'Teach something else.' }] }],
  };
  const found = validateCoverage({ coverage: ledger(), lesson: edited, article }).problems.join();
  assert.match(found, /closed-book review is for script/);
  assert.match(found, /fact check is for script/);
});

test('an open fact-check finding fails', () => {
  const reviews = {
    ...ledger().reviews,
    fact_check: { open_findings: 2, script: scriptHash(lesson) },
  };
  assert.match(problems({ reviews }).join(), /2 open finding/);
});

test('a scene with no teaching job fails', () => {
  const padded = {
    ...lesson,
    scenes: [...lesson.scenes, { id: 'filler', beats: [{ say: 'Nice music.' }] }],
  };
  const reviews = {
    closed_book: { taught: 4, partial: 1, absent: 0, script: scriptHash(padded) },
    fact_check: { open_findings: 0, script: scriptHash(padded) },
  };
  const found = validateCoverage({
    coverage: ledger({ reviews }),
    lesson: padded,
    article,
  }).problems.join();
  assert.match(found, /scene "filler" teaches nothing/);
});

test('a removed point needs a reason', () => {
  assert.match(
    problems({ removed: [{ point: 'Something taught before.' }] }).join(),
    /needs a point and a reason/,
  );
});
