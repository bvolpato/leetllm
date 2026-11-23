import { desk, said } from '../document-desk.mjs';
import { RULES, SOURCE_BYTES, SOURCE_TEXT, sentence, sourcePdf } from '../fixtures.mjs';
import { evidenceRecord, sha } from '../model.mjs';

const textRecord = evidenceRecord('pdf', sentence(RULES[0]));
const revisions = {
  6: { text: textRecord.text.replace('15 minutes', '30 minutes'), bytes: sourcePdf(SOURCE_TEXT.replace('15 minutes', '30 minutes')) },
  7: { text: textRecord.text, bytes: SOURCE_BYTES },
};
const short = (value) => value.slice(0, 12);

export function drawProvenanceRecord(ctx, scene, state, api) {
  const { C, ink, rule, sheet, focus, visible } = desk(ctx, api);
  const beat = state.beat ?? 0;
  if (beat === 3) {
    const normalized = 'Rollback failure: page on-call within 15 minutes.';
    focus('identity-contract', () => {
      ink('A shorter sentence from three documents', 125, 263, 36, C.muted);
      ink(normalized, 125, 357, 55, C.ink, 'left', 'serif');
      const locators = [['runbook.pdf', 'page 7'], ['scan.png', 'page 1'], ['runbook.html', '#rollback']];
      locators.forEach(([file, loc], i) => {
        const y = 492 + i * 103;
        ink(file, 165, y, 40);
        ink(loc, 660, y, 37, C.blue);
        if (visible('normalization-hash')) focus('normalization-hash', () =>
          ink('text   ' + short(sha(normalized)), 1134, y, 37, C.cyan));
        rule(140, y + 29, 1750, y + 29, C.muted, 1);
      });
    });
    if (visible('markdown-whitespace')) focus('markdown-whitespace', () => {
      ink('Markdown command', 165, 842, 37, C.yellow);
      ink('Keep fences, indentation and trailing spaces.', 660, 842, 37);
      ink('Only line endings change in this adapter.', 660, 912, 31, C.muted);
    });
    return;
  }
  const opened = beat > 0 || visible('open-citation');
  const revision = beat >= 2 || said(state, 'verify-source') ? 7 : 6;
  const page = revisions[revision];
  const extract = textRecord.text.split(' within ');
  const actual = page.text.split(' within ');
  focus('cite-record', () => {
    sheet(113, 282, 801, 536, 'Stored extract   /   release-runbook.pdf');
    ink('Revision 7   ·   page 7', 150, 430, 38, C.blue);
    focus('reviewed-words', () => {
      ink(extract[0], 150, 520, 39, C.ink, 'left', 'serif');
      ink('within ' + extract[1], 150, 578, 34, C.ink);
    });
    ink('Extract SHA-256', 150, 700, 27, C.muted);
    ink(short(textRecord.extractChecksum), 150, 759, 39, C.cyan);
  });
  if (opened) focus('open-citation', () => {
    sheet(1005, 282, 801, 536, 'Page opened by the citation', C.cyan);
    focus(revision === 6 ? 'wrong-edition' : 'verify-source', () =>
      ink('Revision ' + revision + '   ·   page 7', 1042, 430, 38, C.blue));
    focus('reviewed-words', () => {
      ink(actual[0], 1042, 520, 39, C.ink, 'left', 'serif');
      ink('within ' + actual[1], 1042, 578, 34);
    });
    ink('File SHA-256', 1042, 700, 27, C.muted);
    ink(short(sha(page.bytes)), 1042, 759, 39, C.cyan);
  });
  if (beat === 0) ink('Would you fix the saved words or the link?', 960, 934, 41, C.yellow, 'center');
  else if (beat === 1) focus('bind-source', () => {
    focus('verify-source', () => ink(revision === 7 ? 'Citation bound to revision 7   /   Operations   /   Rollback' :
      visible('bind-source') ? 'Opening the immutable revision 7 file…' : 'Stored revision 7   /   opened revision 6',
      960, 934, 37, revision === 7 ? C.green : C.yellow, 'center'));
  });
  else {
    focus('parser-settings', () =>
      ink('Extraction record   /   ' + textRecord.parser + ' ' + textRecord.parserVersion + ' + parser settings', 960, 880, 32, C.cyan, 'center'));
    if (visible('quote-policy')) focus('quote-policy', () =>
      ink('Show the quote → check page access', 513, 965, 35, C.yellow, 'center'));
    if (visible('tool-policy')) focus('tool-policy', () =>
      ink('Send an alert → check tool permission', 1405, 965, 35, C.yellow, 'center'));
  }
}
export default {
  id: 'provenance-record', draw: drawProvenanceRecord,
  cues: ['cite-record','open-citation','wrong-edition','bind-source','verify-source','parser-settings','reviewed-words','quote-policy','tool-policy','identity-contract','normalization-hash','markdown-whitespace'],
};
