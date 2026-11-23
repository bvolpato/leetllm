import {
  drawText,
  equation,
  note,
  pill,
  tokenCells,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingMainMinhashWork(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  if (b === 0) {
    drawText(ctx, api, C, 'Exact hashing still reads the bytes', 960, 300, 37, C.blue);
    tokenCells(ctx, api, C, ['source A', 'normalize', 'digest'], 330, 450, 450, C.blue);
    if (beg('exact')) {
      pill(ctx, api, C, 'Compare grouped bytes', 960, 730, 900, C.cyan);
      drawText(ctx, api, C, 'Digest collision ≠ string equality', 960, 870, 35, C.yellow);
    }
    note(
      ctx,
      api,
      C,
      'Reading/hash work is proportional to bytes · expected constant lookup does not erase reading cost',
    );
  } else if (b === 1) {
    const shared = [
        'the key',
        'key policy',
        'policy says',
        'says stale',
        'stale accounts',
        'security review',
      ],
      unique = [
        ['accounts need', 'need security'],
        ['accounts require', 'require security'],
      ];
    for (let k = 0; k < 2; k++) {
      const x = 230 + k * 850;
      drawText(ctx, api, C, k ? 'B bigrams' : 'A bigrams', x + 330, 300, 34, k ? C.pink : C.blue);
      [...shared, ...unique[k]].forEach((v, i) =>
        drawText(
          ctx,
          api,
          C,
          v,
          x + 330,
          370 + i * 52,
          28,
          i < 6 && beg('shingles') ? C.cyan : C.muted,
        ),
      );
    }
    if (D('six')) equation(ctx, api, C, 'J(A,B)=6/10=0.6', 960, 855, 45, C.yellow);
    if (beg('minima'))
      drawText(ctx, api, C, '32 salted minima → 8 bands × 4 rows', 960, 945, 32, C.blue);
    note(ctx, api, C, 'The actual executed bigram sets share six entries, with ten in the union');
  } else {
    drawText(ctx, api, C, 'Actual A/B band 1 minima · salts 4…7', 960, 285, 32, C.blue);
    const hashes = ['109f7012a5dd0c28', '0b0b05eb97d540f4', '0dddf4b7179f16b3', '043df96cd35df552'];
    for (let k = 0; k < 2; k++) {
      const x = 220 + k * 860;
      drawText(ctx, api, C, k ? 'B' : 'A', x + 340, 350, 36, k ? C.pink : C.blue);
      hashes.forEach((v, i) => api.text(ctx, v, x + 25, 420 + i * 65, 30, C.cyan, 'left', 'mono'));
    }
    if (D('bands')) {
      pill(ctx, api, C, 'Band matches: 1 and 3', 960, 735, 750, C.yellow);
    }
    if (D('edge'))
      equation(
        ctx,
        api,
        C,
        '0.6\\ge0.5\\quad\\Rightarrow\\quad\\mathrm{edge}',
        960,
        845,
        43,
        C.green,
      );
    if (D('keep')) drawText(ctx, api, C, 'Keep A + C · B lineage → A', 960, 930, 34, C.green);
    note(ctx, api, C, 'Band collision proposes a pair · exact Jaccard earns the verified edge');
  }
}
export function drawMinhashWorkStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainMinhashWork);
}
export default {
  id: 'minhash-work',
  draw: drawMinhashWorkStage,
  cues: [
    'pt-minhash-work-exact',
    'pt-minhash-work-shingles',
    'pt-minhash-work-six',
    'pt-minhash-work-minima',
    'pt-minhash-work-bands',
    'pt-minhash-work-edge',
    'pt-minhash-work-keep',
  ],
};
