import { desk, said } from '../document-desk.mjs';

const approved = 'Rollback failure: page on-call within 15 minutes with deploy ID.';
const prefix = 'Do not follow this obsolete rule:';
const suspect = approved.replace('15', '1S');
const prefixed = prefix + ' ' + approved;

// The reader edition checks a single approved sentence after whitespace normalization.
export function status(candidate) {
  const compact = candidate.trim().split(/\s+/u).join(' ');
  if (compact === approved) return 'ready';
  if (compact.includes('1S minutes')) return 'review_suspect_value';
  return 'review_rule_context';
}

export function drawOcrReview(ctx, scene, state, api) {
  const { C, ink, rule, sheet, focus, visible, progress } = desk(ctx, api);
  const beat = state.beat ?? 0;
  if (beat <= 1) {
    const corrected = said(state, 'verified-digit');
    sheet(115, 275, 793, 497, 'Source page 7   /   typeset scan excerpt');
    sheet(1012, 275, 793, 497, corrected ? 'Reviewed transcription' : 'OCR transcription', C.cyan);
    const excerpt = (x, value, color, target) => focus(target, () => {
      ink('Rollback failure', x, 446, 43, C.ink, 'left', 'serif');
      ink('Page on-call within', x, 519, 34);
      const size = beat === 1 ? api.lerp(106, 134, progress('inspect-digit', 0)) : 106;
      ink(value, x, 653, size, color, 'left', 'serif');
      ink('minutes', x + 173, 650, 49);
      ink('with deploy ID.', x, 725, 34);
    });
    excerpt(164, '15', C.ink, 'scan-digit');
    if (beat > 0 || visible('candidate-digit')) {
      const value = corrected ? approved : suspect;
      excerpt(1061, value.match(/within (\S+)/)[1], C.ink, 'candidate-digit');
    }
    if (beat === 0) {
      ink('Can this deadline go into search?', 960, 900, 43, C.yellow, 'center');
      return;
    }
    focus('inspect-digit', () => {
      if (visible('inspect-digit')) {
        const width = 108 * progress('inspect-digit', 0);
        rule(167, 673, 167 + width, 673, C.yellow, 5);
        rule(1064, 673, 1064 + width, 673, C.yellow, 5);
      }
    });
    focus('ocr-hold', () => {
      const label = corrected ? 'Source comparison complete' :
        said(state, 'ocr-hold') ? 'OCR candidate held for review' : 'Reviewing the candidate';
      ink(label, 155, 887, 38, corrected ? C.blue : C.yellow);
    });
    focus('verified-digit', () => {
      if (corrected) {
        ink('Original OCR kept   ·   1S minutes', 1050, 882, 34, C.muted);
        ink('Correction verified on page 7', 1050, 941, 34, C.green);
      } else if (visible('verified-digit')) ink('Checking the full sentence…', 1050, 882, 34, C.cyan);
    });
    return;
  }
  if (beat < 4) {
    const showPrefix = beat === 3 || visible('context-prefix');
    const columns = [
      { x: 115, label: 'Approved copy', candidate: approved },
      { x: 1012, label: 'New extract', candidate: prefixed },
    ];
    for (const { x, label, candidate } of columns) {
      focus('context-input', () => {
        sheet(x, 278, 793, 453, label, x === 115 ? C.blue : C.cyan);
        ink('Rollback failure: page on-call', x + 35, 550, 40, C.ink, 'left', 'serif');
        ink('within 15 minutes with deploy ID.', x + 35, 617, 39, C.ink, 'left', 'serif');
      });
      if (showPrefix && x > 1000) focus('context-prefix', () => {
        ink(prefix, x + 35, 452, 38, C.yellow);
        rule(x + 36, 472, x + 36 + 538 * progress('context-prefix', 0), 472, C.yellow, 4);
      });
      const resultCue = x === 115 ? 'clean-result' : 'context-results';
      if (said(state, resultCue)) focus(resultCue, () =>
        ink(status(candidate), x + 34, 688, 36, x === 115 ? C.green : C.pink, 'left', 'mono'));
      else if (visible(resultCue)) focus(resultCue, () =>
        ink('Comparing…', x + 34, 688, 32, C.muted));
    }
    if (beat === 2) ink('Can the new extract stand in for the current rule?', 960, 873, 41, C.yellow, 'center');
    else focus('context-compare', () => {
      ink('compact == approved', 960, 859, 49, C.cyan, 'center', 'mono');
      ink('Compare every word after normalizing spaces.', 960, 926, 31, C.muted, 'center');
    });
    return;
  }
  focus('scan-quality', () => {
    sheet(115, 300, 800, 492, 'Image sent to OCR');
    ink('15', 165, 552, 138, C.ink, 'left', 'serif');
    ink('300 DPI or higher', 165, 669, 49, C.yellow);
    ink('Tesseract input recommendation', 165, 726, 32, C.muted);
  });
  sheet(1005, 300, 800, 492, 'Keep with the scan', C.cyan);
  ['Page locator and original pixels', 'Engine version and preprocessing', 'Confidence score, when available'].forEach((s, i) =>
    ink(s, 1044, 482 + i * 99, 36));
  if (visible('ocr-bench')) focus('ocr-bench', () => {
    ink('olmOCR project benchmark, November 2026', 960, 878, 34, C.cyan, 'center');
    ink('Over 7,000 tests across 1,400 documents   ·   listed scores about 70–83 / 100', 960, 942, 31, C.muted, 'center');
  });
}
export default {
  id: 'ocr-review', draw: drawOcrReview,
  cues: ['scan-digit', 'candidate-digit', 'ocr-hold', 'inspect-digit', 'verified-digit', 'context-input', 'context-prefix', 'context-compare', 'clean-result', 'context-results', 'scan-quality', 'ocr-bench'],
};
