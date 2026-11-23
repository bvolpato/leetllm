import { localOutputCheck } from '../arithmetic.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

const context = ['FAQ'];
const emailDraft = '[confidential] Email owner@example.com. [source:FAQ]';
const restrictedDraft = emailDraft.replace('[confidential]', '[restricted]');
const sourceDays = 3;

export function drawOutputChecks(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);
  const box = (x, y, w, h, color) => drawRectangle(ctx, api, x, y, w, h, color);

  if (state.beat === 0) {
    const confidential = localOutputCheck(emailDraft, context, context);
    api.focus.target('draft', () => {
      label('Buffered draft', 140, 363, 44, c.blue);
      box(140, 413, 1620, 155, c.blue);
      const redacted = done('output-redact');
      drawText(
        ctx,
        api,
        redacted ? confidential.text : emailDraft,
        186,
        507,
        38,
        redacted ? c.green : c.ink,
        'left',
        'mono',
      );
    });
    api.focus.target('clearance', () => {
      label('Reader clearance   2', 140, 693, 39);
      drawLine(ctx, api, 140, 735, 1760, 735);
      if (done('output-clearance'))
        label(
          'Confidential   /   level 2   /   ' + (confidential.allow ? 'Allow' : 'Hold'),
          140,
          836,
          40,
          c.green,
        );
      if (done('output-restricted')) {
        const restricted = localOutputCheck(restrictedDraft, context, context);
        label(
          'Restricted   /   level 3   /   ' + (restricted.allow ? 'Allow' : 'Hold'),
          1060,
          836,
          40,
          c.pink,
        );
      }
    });
    return;
  }

  const days = done('output-correct') ? sourceDays : 90;
  const cited = done('output-faq') ? 'FAQ' : done('output-unknown') ? 'other' : null;
  const claim = 'Review takes ' + days + ' days.';
  const draft = cited ? claim + ' [source:' + cited + ']' : claim;
  const result = localOutputCheck(draft, context, context);
  function drawDuration(y, duration, color) {
    label('Review takes', 195, y, 48);
    box(533, y - 67, 130, 88, color);
    label(String(duration), 570, y, 52, color);
    label('days.', 694, y, 48);
  }

  api.focus.target('source', () => {
    label('Passage supplied to the model   /   FAQ', 145, 298, 36, c.blue);
    box(145, 337, 1615, 146, c.blue);
    drawDuration(430, sourceDays, c.blue);
  });
  api.focus.target('draft', () => {
    label('Buffered draft', 145, 584, 36, c.muted);
    box(145, 623, 1615, 146, c.muted);
    const compared = done('output-compare');
    drawDuration(716, days, compared ? (days === sourceDays ? c.green : c.pink) : c.ink);
    label(cited ? '[source:' + cited + ']' : '(no citation)', 1280, 716, 38, c.blue);
  });
  api.focus.target('check', () => {
    label('Citation check', 145, 895, 36, c.muted);
    const decided =
      cited === 'FAQ'
        ? done('output-pass')
        : cited
          ? done('output-invalid')
          : done('output-missing');
    if (decided) {
      const explanation = result.allow
        ? 'Pass   /   FAQ was in context'
        : cited
          ? 'Hold   /   Unknown source ID'
          : 'Hold   /   Missing source ID';
      label(explanation, 585, 896, 42, result.allow ? c.green : c.pink);
    } else if (cue('output-question').phase !== 'before') {
      label('Will the citation check pass?', 585, 896, 42, c.yellow);
    }
    if (done('output-correct')) label('The duration now matches the FAQ.', 585, 983, 35, c.green);
  });
}

export default {
  id: 'output-checks',
  draw: drawOutputChecks,
  cues: [
    'output-address',
    'output-redact',
    'output-clearance',
    'output-restricted',
    'output-source',
    'output-missing',
    'output-unknown',
    'output-invalid',
    'output-faq',
    'output-question',
    'output-pass',
    'output-compare',
    'output-correct',
    'output-test',
  ],
};
