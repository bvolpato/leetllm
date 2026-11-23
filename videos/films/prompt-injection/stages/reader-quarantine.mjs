import { REPORT } from '../fixtures.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';
import { reportPage } from '../release-picture.mjs';

export function extractSuite(text) {
  const match = /\beval suite\s+(R[0-9]{1,6})(?![A-Za-z0-9_-])/i.exec(text);
  return match?.[1].toUpperCase() ?? null;
}

export function drawReaderQuarantine(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  const example = begun('reader-id');
  const long = begun('reader-long');
  const excerpt = 'Eval suite ' + (long ? 'R1234567' : 'R42') + ' passed.';
  const suite = extractSuite(excerpt);
  api.focus.target('reader-page', () => {
    reportPage(ctx, api, 120, 286, 720, 335, 'External report   /   Reader', () => {
      text(excerpt, 157, 473, 40);
      text(REPORT.attack, 157, 564, 36, C.yellow);
    });
    text('No tools or release credential', 123, 714, 34, C.blue);
  });
  api.focus.target('reader-crossing', () => {
    api.line(ctx, 1008, 285, 1008, 480, C.cyan, 5);
    api.line(ctx, 1008, 592, 1008, 740, C.cyan, 5);
    if (begun('reader-fields') && !example) {
      const x = 860 + 275 * cueProgress(state.cues, 'reader-fields', 0);
      api.rect(ctx, x, 492, 237, 80, C.panel, C.blue, 5);
      text('suite   R42', x + 28, 548, 38);
    }
  });
  api.focus.target('reader-host', () => {
    text('Application code', 1150, 346, 40);
    text(example ? 'Extracted suite' : 'Validate the evidence', 1150, 442, 31, C.muted);
    if (example && (!long || after('reader-no-id'))) {
      text(suite ?? 'No suite ID', 1150, 552, 53, suite ? C.cyan : C.yellow);
    }
    if (example && begun('reader-source')) {
      text('Source from caller', 1150, 649, 29, C.muted);
      text('report-C17', 1150, 712, 37, C.blue);
    }
  });
  api.focus.target('reader-rule', () => {
    api.line(ctx, 125, 827, 1790, 827, C.muted, 2);
    if (example) {
      text('R + 1–6 digits', 128, 916, 38, C.ink);
      text(
        'The next character cannot be a letter, digit, underscore, or hyphen.',
        128,
        984,
        30,
        C.muted,
      );
    } else if (begun('reader-fields')) text('Only bounded values cross to the host.', 128, 930, 41);
    else if (begun('reader-executor'))
      text('Executor   /   Approved arguments and a narrow credential', 128, 930, 38);
  });
}
export default {
  id: 'reader-quarantine',
  draw: drawReaderQuarantine,
  cues: [
    'reader-text',
    'reader-executor',
    'reader-fields',
    'reader-id',
    'reader-source',
    'reader-long',
    'reader-no-id',
  ],
};
