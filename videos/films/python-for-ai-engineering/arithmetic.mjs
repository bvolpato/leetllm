export const unit = (v) => Math.max(0, Math.min(1, v));
export const ramp = (p, a, z) => unit((p - a) / (z - a));
export const mix = (a, b, p) => a + (b - a) * p;
export const exactMatch = (expected, prediction) =>
  prediction.trim().toLowerCase() === expected.trim().toLowerCase();
export function score(rows) {
  const matches = rows.filter((row) => exactMatch(row.expected, row.prediction)).length;
  return {
    matches,
    total: rows.length,
    fraction: rows.length ? matches / rows.length : 0,
    gate: rows.length > 0 && matches * 3 >= rows.length * 2,
  };
}
export function classifyJsonRow(row, lineNumber) {
  if (!row || typeof row !== 'object' || Array.isArray(row))
    return {
      accepted: false,
      error: 'expected a JSON object',
      lineNumber,
    };
  for (const field of ['prompt', 'expected', 'prediction']) {
    if (!(field in row))
      return {
        accepted: false,
        error: 'missing ' + field,
        lineNumber,
      };
    if (typeof row[field] !== 'string')
      return {
        accepted: false,
        error: field + ' must be a string',
        lineNumber,
      };
    if (!row[field].trim())
      return {
        accepted: false,
        error: field + ' must not be empty',
        lineNumber,
      };
  }
  const selected = Object.fromEntries(
    ['prompt', 'expected', 'prediction'].map((field) => [field, row[field]]),
  );
  return {
    accepted: true,
    row: selected,
    lineNumber,
  };
}
export function parseJsonLine(value, lineNumber) {
  try {
    return {
      decoded: true,
      parsed: classifyJsonRow(JSON.parse(value), lineNumber),
    };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return {
      decoded: false,
      parsed: {
        accepted: false,
        error: 'invalid JSON',
        lineNumber,
      },
    };
  }
}
