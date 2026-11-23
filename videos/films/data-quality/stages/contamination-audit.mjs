import { editedPassage, fingerprint, normalize, referencePassage } from '../fixtures.mjs';

const words = (text) =>
  normalize(text)
    .replace(/[.,!?]/g, '')
    .split(' ');
const lockedWords = words(referencePassage);
const embedded = 'notes ' + referencePassage + ' archive';
function compare(passage) {
  const tokens = words(passage);
  const starts = [];
  for (let i = 0; i + lockedWords.length <= tokens.length; i++) {
    if (lockedWords.every((word, j) => tokens[i + j] === word)) starts.push(i);
  }
  return { tokens, whole: fingerprint(passage) === fingerprint(referencePassage), starts };
}
const inside = compare(embedded);
const rewritten = compare(editedPassage);

export function drawContaminationAudit(ctx, scene, state, api) {
  const { C, focus, text, rect, line } = api;
  const p = focus.progress;
  const wrapped = p('audit-wrap') > 0;
  const whole = p('audit-whole') > 0;
  const scanning = p('audit-window') > 0;
  const shift = p('audit-shift');
  const rewrite = p('audit-paraphrase') > 0;
  const retested = p('audit-retest') > 0;
  const history = p('audit-history') > 0;
  const unavailable = p('audit-unavailable') > 0;
  const untested = p('audit-untested') > 0;
  const behavior = p('audit-behavior') > 0;
  const x = (i) => 117 + 112 * i;
  const word = (value, i, y, col) => text(ctx, value, x(i) + 55, y, 29, col, 'center');
  focus.target('passage-comparison', () => {
    text(ctx, 'Locked answer', 135, 270, 32, C.cyan);
    lockedWords.forEach((value, i) => word(value, i + 1, 352, C.ink));
    line(ctx, x(1), 382, x(14) - 4, 382, C.cyan, 3);
    text(
      ctx,
      unavailable ? 'Model C' : rewrite ? 'Training document B' : 'Training document A',
      135,
      468,
      32,
      C.blue,
    );
    if (unavailable) {
      rect(ctx, 135, 495, 1650, 115, C.panel, C.muted, 4);
      if (behavior) {
        text(ctx, 'Training text', 180, 540, 31, C.muted);
        text(ctx, 'Unavailable', 180, 590, 38, C.ink);
        text(ctx, 'Model behavior', 990, 540, 31, C.cyan);
        text(ctx, 'Word probabilities → membership score', 990, 590, 35, C.ink);
      } else {
        text(ctx, 'Training snapshot unavailable', 960, 572, 44, C.ink, 'center');
      }
    } else if (rewrite) {
      text(ctx, editedPassage, 960, 559, 49, C.ink, 'center', 'serif');
    } else {
      const tokens = wrapped ? inside.tokens : lockedWords;
      tokens.forEach((value, i) => {
        const edge = wrapped && (i === 0 || i === tokens.length - 1);
        word(value, wrapped ? i : i + 1, 551, edge ? C.blue : C.ink);
      });
      if (scanning) {
        const pos = shift * inside.starts[0];
        const left = x(pos);
        const right = x(pos + lockedWords.length) - 2;
        for (const [railY, tipY] of [[498, 510], [580, 568]]) {
          line(ctx, left, railY, right, railY, C.yellow, 3);
          line(ctx, left, railY, left, tipY, C.yellow, 3);
          line(ctx, right, railY, right, tipY, C.yellow, 3);
        }
        text(
          ctx,
          `Words ${shift === 1 ? '2–14' : shift === 0 ? '1–13' : '…'}`,
          960,
          632,
          30,
          C.yellow,
          'center',
        );
      }
    }
    const y = 724;
    text(ctx, unavailable ? 'Training source' : 'Training document', 140, y, 30, C.muted);
    text(ctx, 'Whole message', 845, y, 30, C.muted);
    text(ctx, '13-word window', 1370, y, 30, C.muted);
    line(ctx, 140, y + 20, 1780, y + 20, C.muted, 2);
    const result = (shown, value) => (shown ? (value ? 'Match' : 'No match') : '?');
    const row = (label, cy, doc, exactShown, spanShown) => {
      text(ctx, label, 140, cy, 35, C.ink);
      text(
        ctx,
        result(exactShown, doc.whole),
        845,
        cy,
        37,
        exactShown && doc.whole ? C.yellow : C.ink,
      );
      text(
        ctx,
        result(spanShown, doc.starts.length > 0),
        1370,
        cy,
        37,
        spanShown && doc.starts.length ? C.yellow : C.ink,
      );
    };
    if (wrapped)
      row('A   ·   answer inside a longer note', 814, inside, whole, p('audit-window-match') === 1);
    if (rewrite) row('B   ·   rewritten advice', 895, rewritten, retested, retested);
    if (unavailable) {
      text(ctx, 'C   ·   no training snapshot', 140, 980, 35, C.ink);
      for (const col of [845, 1370]) text(ctx, untested ? 'Not run' : '?', col, 980, 37, C.yellow);
    } else if (history)
      text(
        ctx,
        'GPT-3    ·    initial filter: 13 words    ·    later audit: generally 8–13 on non-synthetic tasks',
        960,
        1000,
        30,
        C.muted,
        'center',
      );
    else if (retested)
      text(
        ctx,
        'Review the words, their context and the dated source.',
        960,
        1000,
        35,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'contamination-audit',
  draw: drawContaminationAudit,
  cues: [
    'audit-wrap',
    'audit-whole',
    'audit-window',
    'audit-shift',
    'audit-window-match',
    'audit-paraphrase',
    'audit-retest',
    'audit-history',
    'audit-unavailable',
    'audit-untested',
    'audit-behavior',
  ],
};
