import {
  drawText,
  equation,
  line,
  note,
  pill,
  rectangle,
  tokenCells,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingMainTokenizerChoice(
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
    drawText(ctx, api, C, 'Separate untied vocabulary matrices', 960, 290, 36, C.blue);
    for (let k = 0; k < 2; k++) {
      const x = 330 + k * 850;
      rectangle(ctx, api, C, x, 390, 420, 300, C.panel, k ? C.cyan : C.blue);
      for (let i = 1; i < 8; i++)
        line(ctx, api, C, x, 390 + i * 37.5, x + 420, 390 + i * 37.5, C.border, 1);
      for (let i = 1; i < 5; i++) line(ctx, api, C, x + i * 84, 390, x + i * 84, 690, C.border, 1);
      drawText(ctx, api, C, k ? 'Output V×d' : 'Input V×d', x + 210, 750, 34, k ? C.cyan : C.blue);
    }
    if (D('matrix'))
      equation(ctx, api, C, '2\\times V\\times d\\times\\mathrm{bytes}', 960, 890, 50, C.yellow);
    note(
      ctx,
      api,
      C,
      'Schematic matrix cells · tying input and output weights changes this storage count',
    );
  } else if (b === 1) {
    const types = ['Byte BPE', 'WordPiece', 'Unigram'],
      parts = [
        ['256 byte values', 'ordered adjacent merges'],
        ['learned vocabulary', 'greedy longest match'],
        ['piece probabilities', 'prune candidates'],
      ];
    types.forEach((v, i) => {
      const x = 230 + i * 550;
      drawText(ctx, api, C, v, x + 225, 340, 38, [C.blue, C.cyan, C.pink][i]);
      parts[i].forEach((v, j) =>
        pill(ctx, api, C, v, x + 225, 490 + j * 180, 480, [C.blue, C.cyan, C.pink][i]),
      );
    });
    if (D('algorithms'))
      drawText(
        ctx,
        api,
        C,
        'Pre-tokenization constrains where a merge may occur',
        960,
        910,
        34,
        C.yellow,
      );
    note(
      ctx,
      api,
      C,
      'The SentencePiece library supports both BPE and Unigram.',
    );
  } else {
    drawText(ctx, api, C, 'Same text · frozen tokenizer contract', 960, 300, 37, C.blue);
    tokenCells(
      ctx,
      api,
      C,
      ['normalization', 'merge ranks', 'revision', 'special IDs'],
      200,
      440,
      390,
      C.cyan,
    );
    if (D('freeze'))
      pill(ctx, api, C, 'Shard token IDs bound to this identity', 960, 740, 1150, C.green);
    if (D('space'))
      drawText(ctx, api, C, '“ word” can include its leading space', 960, 900, 37, C.yellow);
    note(ctx, api, C, 'Measure exact compression on target languages, code and deployment text');
  }
}
export function drawTokenizerChoiceStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainTokenizerChoice);
}
export default {
  id: 'tokenizer-choice',
  draw: drawTokenizerChoiceStage,
  cues: [
    'pt-tokenizer-choice-matrix',
    'pt-tokenizer-choice-algorithms',
    'pt-tokenizer-choice-freeze',
    'pt-tokenizer-choice-space',
  ],
};
