import { fused, jointScores, passageNames, reranked } from '../credential-shortlist.mjs';
import { picture } from '../picture.mjs';

const words = [
  '[CLS]',
  'rotate',
  'API',
  'key',
  '[SEP]',
  'create',
  'replacement',
  'key',
  'revoke',
  'old',
  'key',
  '[SEP]',
];
const widths = [118, 127, 94, 96, 118, 137, 205, 96, 142, 90, 96, 118];
const xOf = (i) => 175 + widths.slice(0, i).reduce((sum, w) => sum + w + 9, 0);
const isTail = (i) => i >= 8 && i <= 10;

function attentionPath(p, from, to, y, rail, fraction) {
  if (fraction <= 0) return;
  const color = p.C.cyan;
  p.rule(from, y, from, rail, color, 4);
  const tip = from + (to - from) * fraction;
  p.rule(from, rail, tip, rail, color, 4);
  if (fraction < 1) {
    p.dot(tip, rail, 6, color);
    return;
  }
  p.rule(to, rail, to, y, color, 4);
  const wing = y + Math.sign(rail - y) * 12;
  p.rule(to - 8, wing, to, y, color, 4);
  p.rule(to + 8, wing, to, y, color, 4);
}

function pair(p, matrix) {
  const { C, label, rule, box, target, progress, started, after } = p;
  const join = matrix ? 1 : progress('joint-input');
  const trimmed = matrix && started('joint-tail');
  const visible = words.flatMap((_, i) => (trimmed && isTail(i) ? [] : [i]));
  target('joint-strip', () => {
    const y = matrix ? 281 : 475;
    if (!matrix) {
      label('Query words', 175, 340, 35, C.cyan);
      label('Passage d1  ·  two excerpts from the rotation guide', xOf(5), 340, 35, C.green);
    } else label('Joint input   ·   ' + visible.length + ' positions', 175, 243, 37);
    for (const i of visible) {
      const special = words[i].startsWith('[');
      const color = special ? C.muted : i < 5 ? C.cyan : C.green;
      const ty = y + (i >= 5 ? 145 * (1 - join) : 0);
      const x = trimmed && i === words.length - 1 ? xOf(8) : xOf(i);
      box(x, ty, widths[i], 69, C.panel, color);
      label(words[i], x + widths[i] / 2, ty + 46, 28, color, 'center');
    }
    if (!matrix && started('joint-attention')) {
      const rotate = xOf(1) + widths[1] / 2;
      const revoke = xOf(8) + widths[8] / 2;
      const travel = progress('joint-attention') * 2;
      attentionPath(p, rotate, revoke, y - 8, y - 57, Math.min(1, travel));
      attentionPath(p, revoke, rotate, y + 77, y + 127, Math.max(0, travel - 1));
    }
    if (!matrix && started('joint-head')) {
      const x = xOf(0) + widths[0] / 2;
      rule(x, y + 75, x, y + 163, C.yellow, 4);
      label('Pair score from [CLS]', x - 57, y + 224, 41, C.yellow);
    }
    if (trimmed) label('Removed words   ·   revoke   old   key', xOf(8), 413, 32, C.pink);
    else if (matrix && after('joint-trim')) label('Budget: 9 positions', xOf(8), 413, 32, C.yellow);
  });
  if (!matrix) {
    label('One joint input per candidate passage', 175, 934, 40, C.ink);
    return;
  }
  target('joint-matrix', () => {
    const n = visible.length,
      side = 37;
    const filled = Math.floor(progress('joint-matrix') * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const color = visible[i] < 5 === visible[j] < 5 ? C.blue : C.cyan;
        box(205 + j * side, 472 + i * side, side - 4, side - 4, i < filled ? color : C.panel);
      }
    }
    label('One attention head  ·  one layer', 205, 987, 32, C.muted);
    label(n + ' input positions', 840, 581, 49);
    label('× ' + n + ' positions each can attend to', 840, 662, 43, C.cyan);
    if (after('joint-total')) label(n * n + ' attention entries', 840, 809, 58, C.yellow);
  });
}

function admission(p) {
  const { C, label, rule, box, target, progress, started, after } = p;
  const wide = after('joint-widen');
  const depth = wide ? 3 : 2;
  const order = reranked(depth);
  const fusedIds = fused().map(([id]) => id);
  label('Fused order', 145, 303, 40);
  label('Pairs sent to the reranker', 800, 303, 40);
  label('Score', 1670, 303, 40, C.muted, 'center');
  target('joint-admission', () => {
    label('Cutoff   ' + depth, 570, 383, 33, C.yellow);
    fusedIds.forEach((id, i) => {
      const y = 453 + i * 152;
      const admitted = i < depth;
      const t = i < 2 ? progress('joint-two') : progress('joint-new-pair');
      label(id + '   ' + passageNames[id], 145, y + 38, 36);
      rule(595, y + 22, 745, y + 22, C.panel, 5);
      if (t > 0) rule(595, y + 22, 595 + 150 * t, y + 22, C.cyan, 5);
      if (admitted && t === 1) {
        box(790, y - 17, 680, 76, C.panel, C.cyan);
        label('rotation query  +  ' + id, 830, y + 35, 34, C.cyan);
      } else if (!admitted) label('Outside cutoff', 830, y + 35, 34, C.muted);
      if (i === depth - 1) rule(140, y + 90, 750, y + 90, C.yellow, 4);
    });
  });
  target('joint-out', () => {
    let scored = [];
    if (after('joint-score-two')) scored = after('joint-third') ? order : reranked(2);
    fusedIds.forEach((id, i) => {
      const value = scored.includes(id) ? jointScores[id].toFixed(2) : '·';
      label(value, 1670, 493 + i * 152, 44, scored.includes(id) ? C.ink : C.muted, 'center');
    });
    label('Returned order', 145, 911, 38, C.muted);
    if (scored.length) label(scored.join('   →   '), 575, 913, 50, C.green);
  });
  target('joint-question', () => {
    const question = after('joint-third')
      ? 'The same scorer can finally compare all three passages.'
      : wide
        ? 'One additional query–passage pair.'
        : started('joint-ask')
          ? 'Where would you change the pipeline to admit d2?'
          : 'Supplied scores for this example';
    label(question, 145, 1013, 31, C.ink);
  });
}

export function drawJointReranker(ctx, scene, state, api) {
  const p = picture(ctx, state, api);
  if (state.beat < 2) pair(p, state.beat === 1);
  else admission(p);
}
export default {
  id: 'joint-reranker',
  draw: drawJointReranker,
  cues: [
    'joint-input',
    'joint-attention',
    'joint-head',
    'joint-matrix',
    'joint-total',
    'joint-trim',
    'joint-tail',
    'joint-two',
    'joint-score-two',
    'joint-ask',
    'joint-widen',
    'joint-new-pair',
    'joint-third',
  ],
};
