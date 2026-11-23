import { dense, fused, passageNames, sparse } from '../credential-shortlist.mjs';
import { picture } from '../picture.mjs';

export function drawFusionRanks(ctx, scene, state, api) {
  const { C, label, box, rule, target, progress, started, after } = picture(ctx, state, api);
  const constant = after('fusion-zero') ? 0 : 60;
  const ordered = fused(constant);
  const depth = after('fusion-depth') && !after('fusion-reset') ? 3 : 2;
  const showCut = after('fusion-cut');
  const changingOrder = constant === 0 && !after('fusion-compare');
  const votes = (rank) => (rank ? 1 / (constant + rank) : 0);
  const xStart = 1000;
  const px = constant === 0 ? 330 : 15300;

  target('rank-table', () => {
    label('API key rotation', 140, 265, 52, C.ink, 'left', 'serif');
    label('Fusion constant   ' + constant, 1775, 260, 36, C.yellow, 'right');
    label('Passage', 140, 375, 34, C.muted);
    label('Word search', 610, 375, 32, C.blue, 'center');
    label('Dense search', 845, 375, 32, C.green, 'center');
    label('Sum of rank votes', xStart, 375, 34, C.ink);
  });
  ['d1', 'd4', 'd2'].forEach((id, i) => {
    const y = 426 + i * 144;
    const sr = sparse.indexOf(id) + 1,
      dr = dense.indexOf(id) + 1;
    const cue = 'fusion-' + id;
    const p = progress(cue);
    target('rank-' + id, () => {
      rule(135, y - 22, 1775, y - 22, C.panel, 3);
      label(id + '   ' + passageNames[id], 140, y + 45, 39);
      label(sr ? '#' + sr : 'absent', 610, y + 45, 36, sr ? C.blue : C.muted, 'center');
      label('#' + dr, 845, y + 45, 36, C.green, 'center');
      if (started('fusion-rule')) {
        const terms = (sr ? '1/' + (constant + sr) : '0') + '  +  1/' + (constant + dr);
        label(terms, xStart, y + 20, 32, C.ink);
      }
      if (p > 0) {
        const first = votes(sr) * px;
        if (sr) box(xStart, y + 40, first * Math.min(1, p * 2), 27, C.blue);
        const second = sr ? Math.max(0, p * 2 - 1) : p;
        if (second > 0) box(xStart + first, y + 40, votes(dr) * px * second, 27, C.green);
        if (after(cue))
          label(
            (votes(sr) + votes(dr)).toFixed(constant ? 6 : 3),
            1775,
            y + 61,
            36,
            C.ink,
            'right',
          );
      }
    });
  });

  target('rank-cut', () => {
    if (showCut) {
      if (constant === 60 && depth === 2) rule(130, 684, 1780, 684, C.yellow, 4);
      label('Reranker input  ·  ' + depth + ' slots', 140, 901, 38, C.yellow);
      if (!changingOrder) {
        ordered.slice(0, depth).forEach(([id], i) => {
          box(760 + 275 * i, 843, 215, 78, C.panel, C.yellow);
          label(id, 867 + 275 * i, 896, 43, C.ink, 'center');
        });
      }
    } else {
      label('Reranker input', 140, 900, 37, C.muted);
      for (let i = 0; i < 2; i++) box(760 + 275 * i, 843, 215, 78, C.panel, C.muted);
    }
  });
  target('rank-question', () => {
    const note = started('fusion-engine')
      ? 'Elasticsearch requires a fusion constant of at least 1.'
      : started('fusion-predict') && !showCut
        ? 'Which passage gets left behind?'
        : after('fusion-depth') && !after('fusion-reset')
          ? 'Same votes. One more place at the cutoff.'
          : constant === 0
            ? 'Same lane rankings. First place now earns a full point.'
            : 'One vote per passage ID in each returned list.';
    label(note, 140, 1006, 32, C.ink);
  });
}

export default {
  id: 'fusion-ranks',
  draw: drawFusionRanks,
  cues: [
    'fusion-lists',
    'fusion-rule',
    'fusion-missing',
    'fusion-d1',
    'fusion-d4',
    'fusion-d2',
    'fusion-predict',
    'fusion-cut',
    'fusion-depth',
    'fusion-reset',
    'fusion-zero',
    'fusion-compare',
    'fusion-engine',
  ],
};
