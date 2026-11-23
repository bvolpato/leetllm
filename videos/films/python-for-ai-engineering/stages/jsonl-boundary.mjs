import { exactMatch, mix } from '../arithmetic.mjs';
import { boundaryFrame } from '../model.mjs';
import { box, mark, text } from '../defaults.mjs';

export function drawJsonlBoundary(ctx, scene, state, api) {
  const { beat, cases, parsed, checked, decoderSucceeded, schemaRejected, error } =
    boundaryFrame(state);
  const baseline = cases[0].parsed.row;
  const x = [185, 740, 1110, 1510];
  const headings = ['After "prediction":', 'json.loads', 'Field check', 'exact_match'];
  headings.forEach((h, i) => text(ctx, api, h, x[i], 295, 33, api.C.muted, 'left', i > 0));
  const cell = (value, col, y, color = api.C.ink) =>
    text(ctx, api, value, x[col], y, 35, color, 'left', true);
  const ending = (i) => cases[i].raw.split('"prediction":').at(-1);
  // The cursor records how far this input traveled through the program.
  function trace(y, end, color) {
    api.line(ctx, x[0], y, x[3] + 60, y, api.C.muted, 1);
    if (end > x[0]) api.line(ctx, x[0], y, end, y, color, 4);
    api.circle(ctx, end, y, 6, color);
  }
  cell(ending(0), 0, 405, api.C.blue);
  cell('dict', 1, 405);
  cell('str', 2, 405);
  cell(exactMatch(baseline.expected, baseline.prediction) ? 'True' : 'False', 3, 405, api.C.pink);
  trace(427, x[3] + 60, api.C.blue);

  const rowY = beat === 2 ? 657 : 532;
  box(ctx, api, 145, rowY - 68, 1625, 100, api.C.yellow);
  cell(ending(1), 0, 532);
  mark(api, 'decoded-number', () =>
    cell(decoderSucceeded || beat === 2 ? 'dict' : '?', 1, 532, api.C.cyan),
  );
  cell(schemaRejected || beat === 2 ? 'int' : '·', 2, 532, api.C.cyan);
  cell(schemaRejected || beat === 2 ? 'unreached' : '·', 3, 532, api.C.muted);
  const numberEnd = beat === 0 ? mix(x[0], x[1], parsed) : mix(x[1], x[2], checked);
  trace(551, numberEnd, schemaRejected || beat === 2 ? api.C.pink : api.C.cyan);
  if (beat === 2) {
    cell(ending(2), 0, 657);
    cell(error ? 'stopped' : '?', 1, 657, error ? api.C.pink : api.C.cyan);
    cell('·', 2, 657, api.C.muted);
    cell('·', 3, 657, api.C.muted);
    trace(678, mix(x[0], x[1], parsed), error ? api.C.pink : api.C.cyan);
  }

  text(
    ctx,
    api,
    beat === 1 ? 'isinstance(row["prediction"], str)' : 'row = json.loads(line)',
    185,
    805,
    42,
    api.C.ink,
    'left',
    true,
  );
  mark(api, 'boundary-error', () => {
    const result = error ?? (beat === 0 && decoderSucceeded ? 'row["prediction"]  →  7' : '…');
    text(ctx, api, result, 185, 925, 40, error ? api.C.pink : api.C.cyan, 'left', true);
  });
}
export default {
  id: 'jsonl-boundary',
  draw: drawJsonlBoundary,
  cues: ['parse-number', 'reject-number', 'syntax-error'],
};
