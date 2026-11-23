import { policyCases } from './fixtures.mjs';
import { expectedPolicyAnswer, scorePolicyCase } from './arithmetic.mjs';

// The author supplies the labels independently of the grader.
const expected = [true, true, false, false, false];
export const grades = policyCases.map((row, i) => ({
  ...row,
  pass: scorePolicyCase(row),
  expected: expected[i],
}));

export function drawGradeSheet(ctx, api, { visible, compare = false, comparisons = 0 }) {
  const { C } = api;
  const columns = [125, 410, 575, 950, 1200, 1490, 1720];
  const headers = [
    'Saved case',
    'Age',
    'Answer',
    'Policy',
    'Says job started?',
    'Grade',
    'Expected',
  ];
  headers
    .slice(0, compare ? 7 : 6)
    .forEach((name, i) => api.text(ctx, name, columns[i], 355, 31, C.muted));
  api.line(ctx, 125, 390, 1810, 390, C.muted, 2);
  grades.forEach((row, i) => {
    const y = 453 + i * 87;
    const graded = i < visible;
    const fields = [
      row.key,
      row.age + ' d',
      row.decision === 'eligible' ? 'Eligible' : 'Ineligible',
      row.policy,
      row.action ? 'Yes' : 'No',
    ];
    const reference = expectedPolicyAnswer(row);
    const wrong = [
      false,
      false,
      row.decision !== reference.decision,
      row.policy !== reference.policy,
      row.action !== reference.action,
    ];
    fields.forEach((value, j) => {
      const highlight = graded && wrong[j];
      api.text(ctx, String(value), columns[j], y, 36, highlight ? C.pink : C.ink);
      if (highlight)
        api.line(ctx, columns[j], y + 12, columns[j] + [0, 0, 124, 57, 54][j], y + 12, C.pink, 3);
    });
    api.text(
      ctx,
      graded ? (row.pass ? 'Pass' : 'Reject') : '·',
      columns[5],
      y,
      35,
      graded ? (row.pass ? C.green : C.pink) : C.muted,
    );
    if (compare)
      api.text(
        ctx,
        row.expected ? 'Pass' : 'Reject',
        columns[6],
        y,
        35,
        i < comparisons ? C.cyan : C.muted,
      );
  });
}
