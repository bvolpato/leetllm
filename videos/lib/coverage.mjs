// Checks a lesson's coverage ledger against its article and its narration. See TEACHING_STANDARD.md.
// This proves that a decision exists for every heading and question, and that recorded reviews
// match the current script. It cannot prove that a decision is right.
import { createHash } from 'node:crypto';

export const ARTICLE_ONLY_REASONS = Object.freeze([
  'code-detail',
  'vendor-detail',
  'reference-table',
  'beyond-promise',
  'prerequisite',
  'exercise',
]);
export const MINIMUM_TAUGHT = 0.8;

/** The headings and quiz questions of an article. A two-edition article uses its reference edition. */
export function articleOutline(markdown) {
  const reference = markdown.match(
    /edition:reference:start -->([\s\S]*?)<!-- leetllm: edition:reference:end/,
  );
  const body = reference ? reference[1] : markdown;
  const quizBlock = body.match(/```mastery-quiz\n([\s\S]*?)\n```/);
  if (!quizBlock) throw new Error('The article has no mastery quiz');
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const headings = [...prose.matchAll(/^#{2,3} +(.+?)\s*$/gm)].map((match) => match[1]);
  return { headings, questions: JSON.parse(quizBlock[1]).length };
}

/** A hash of what the viewer hears, by scene. A change to any spoken line changes it. */
export function scriptHash(lesson) {
  const spoken = lesson.scenes.map((scene) => [scene.id, scene.beats.map((beat) => beat.say)]);
  return createHash('sha256').update(JSON.stringify(spoken)).digest('hex').slice(0, 16);
}

function checkRow(row, label, sceneIds, problems) {
  if (row.status === 'taught') {
    if (!Array.isArray(row.scenes) || row.scenes.length === 0)
      problems.push(`${label}: a taught row must name its scenes`);
    for (const id of row.scenes ?? [])
      if (!sceneIds.has(id)) problems.push(`${label}: unknown scene "${id}"`);
    return;
  }
  if (row.status !== 'article-only') {
    problems.push(`${label}: status must be taught or article-only`);
    return;
  }
  if (!ARTICLE_ONLY_REASONS.includes(row.reason))
    problems.push(`${label}: reason must be one of ${ARTICLE_ONLY_REASONS.join(', ')}`);
  if (typeof row.note !== 'string' || !row.note.trim())
    problems.push(`${label}: an article-only row needs a note`);
  if (row.reason === 'prerequisite' && !row.lesson)
    problems.push(`${label}: a prerequisite row must name the lesson that teaches it`);
}

/** Every problem with a ledger, plus a summary. An empty problem list means the ledger is complete. */
export function validateCoverage({ coverage, lesson, article }) {
  const problems = [];
  const sceneIds = new Set(lesson.scenes.map((scene) => scene.id));
  const outline = articleOutline(article);
  if (coverage.version !== 1) problems.push('version must be 1');
  if (coverage.lesson !== lesson.id) problems.push(`lesson must be ${lesson.id}`);
  if (typeof coverage.promise !== 'string' || !coverage.promise.trim())
    problems.push('a promise is required');

  const objectives = coverage.objectives ?? [];
  if (objectives.length === 0) problems.push('at least one objective is required');
  for (const objective of objectives) {
    if (!objective.id || !objective.can)
      problems.push('each objective needs an id and a "can" statement');
    if (!objective.scenes?.length)
      problems.push(`objective ${objective.id}: name the scenes that teach it`);
    for (const id of objective.scenes ?? [])
      if (!sceneIds.has(id)) problems.push(`objective ${objective.id}: unknown scene "${id}"`);
  }

  const sections = coverage.sections ?? [];
  const listed = sections.map((row) => row.heading);
  for (const heading of outline.headings)
    if (!listed.includes(heading)) problems.push(`section not accounted for: "${heading}"`);
  for (const row of sections) {
    if (!outline.headings.includes(row.heading))
      problems.push(`section is not in the article: "${row.heading}"`);
    checkRow(row, `section "${row.heading}"`, sceneIds, problems);
  }
  for (const heading of new Set(listed))
    if (
      listed.filter((item) => item === heading).length >
      outline.headings.filter((item) => item === heading).length
    )
      problems.push(`section listed too often: "${heading}"`);

  const quiz = coverage.quiz ?? [];
  for (let n = 1; n <= outline.questions; n += 1) {
    const rows = quiz.filter((row) => row.n === n);
    if (rows.length !== 1) problems.push(`quiz question ${n} needs exactly one row`);
  }
  for (const row of quiz) {
    if (!Number.isInteger(row.n) || row.n < 1 || row.n > outline.questions)
      problems.push(`quiz question ${row.n} is not in the article`);
    checkRow(row, `quiz question ${row.n}`, sceneIds, problems);
  }
  const claimedTaught = quiz.filter((row) => row.status === 'taught').length;
  if (claimedTaught / outline.questions < MINIMUM_TAUGHT)
    problems.push(
      `the ledger claims ${claimedTaught} of ${outline.questions} quiz questions as taught, below ${MINIMUM_TAUGHT * 100}%`,
    );

  for (const row of coverage.removed ?? [])
    if (!row.point || !row.reason) problems.push('each removed point needs a point and a reason');

  const used = new Set([...objectives, ...sections, ...quiz].flatMap((row) => row.scenes ?? []));
  const framing = new Set(coverage.framing ?? []);
  if (framing.size > 2) problems.push('framing allows only an opening hook and a close');
  for (const id of framing) if (!sceneIds.has(id)) problems.push(`framing: unknown scene "${id}"`);
  for (const id of sceneIds)
    if (!used.has(id) && !framing.has(id))
      problems.push(`scene "${id}" teaches nothing in the ledger`);

  const hash = scriptHash(lesson);
  const closedBook = coverage.reviews?.closed_book,
    factCheck = coverage.reviews?.fact_check;
  if (!closedBook) problems.push('no closed-book review is recorded');
  else {
    if (closedBook.script !== hash)
      problems.push(
        `the closed-book review is for script ${closedBook.script}, and the current script is ${hash}`,
      );
    const total = (closedBook.taught ?? 0) + (closedBook.partial ?? 0) + (closedBook.absent ?? 0);
    if (total !== outline.questions)
      problems.push(`the closed-book review covers ${total} of ${outline.questions} questions`);
    if ((closedBook.taught ?? 0) / outline.questions < MINIMUM_TAUGHT)
      problems.push(
        `the closed-book review found ${closedBook.taught} of ${outline.questions} taught, below ${MINIMUM_TAUGHT * 100}%`,
      );
  }
  if (!factCheck) problems.push('no fact check is recorded');
  else {
    if (factCheck.script !== hash)
      problems.push(
        `the fact check is for script ${factCheck.script}, and the current script is ${hash}`,
      );
    if (factCheck.open_findings !== 0)
      problems.push(`the fact check has ${factCheck.open_findings} open finding(s)`);
  }

  const taughtSections = sections.filter((row) => row.status === 'taught').length;
  return {
    problems,
    summary: {
      script: hash,
      sections: `${taughtSections}/${outline.headings.length}`,
      quiz: `${claimedTaught}/${outline.questions}`,
      removed: coverage.removed?.length ?? 0,
    },
  };
}
