import { drawText, note, pill, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainCorpusEvidence(
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
    const names = [
      'C4 / cleaning',
      'Pile / 22 sources',
      'Dolma / inspectable',
      'FineWeb / experiments',
      'DCLM / selected pool',
    ];
    names.forEach((v, i) => {
      const x = 160 + i * 340;
      rectangle(ctx, api, C, x, 400, 300, 240, C.panel, C.blue);
      drawText(ctx, api, C, v.split(' /')[0], x + 150, 465, 34, C.blue);
      drawText(ctx, api, C, v.split(' /')[1], x + 150, 525, 25, C.muted);
      if (beg('evaluate')) {
        drawText(ctx, api, C, 'recipe / data', x + 150, 575, 25, C.cyan);
        drawText(ctx, api, C, 'matched evaluation', x + 150, 620, 24, C.yellow);
      }
    });
    note(
      ctx,
      api,
      C,
      'Source contribution is evaluated under a matched experiment, not inferred from raw size',
    );
  } else if (b === 1) {
    drawText(
      ctx,
      api,
      C,
      'One English stopword gate applied to three authored records',
      960,
      300,
      33,
      C.blue,
    );
    const rows = [
      ['English prose', 'the key and the lock', ['the', 'and'], C.blue],
      ['Code / syntax', 'return a + b', [], C.pink],
      ['Spanish prose', 'gira las llaves', [], C.cyan],
    ];
    rows.forEach(([label, text, words, col], i) => {
      const x = 200 + i * 560;
      rectangle(ctx, api, C, x, 395, 500, 290, C.panel, col);
      drawText(ctx, api, C, label, x + 250, 455, 32, col);
      drawText(ctx, api, C, text, x + 250, 545, 31, C.ink);
      if (beg('copy'))
        drawText(ctx, api, C, 'Listed stopwords: ' + words.length, x + 250, 625, 28, col);
      if (D('copy'))
        pill(
          ctx,
          api,
          C,
          words.length >= 2 ? 'passes this gate' : 'lost by this gate',
          x + 250,
          820,
          450,
          words.length >= 2 ? C.green : C.pink,
        );
    });
    note(
      ctx,
      api,
      C,
      'Authored stopword illustration only · one gate does not decide complete source quality',
    );
  } else {
    const names = ['Organic', 'Translated', 'Synthetic rephrasing'];
    names.forEach((v, i) => {
      const x = 210 + i * 550;
      rectangle(ctx, api, C, x, 395, 440, 220, C.panel, [C.blue, C.cyan, C.pink][i]);
      if (beg('separate')) drawText(ctx, api, C, v, x + 220, 510, 34, [C.blue, C.cyan, C.pink][i]);
    });
    drawText(ctx, api, C, 'Nemotron-CC v2.1: 2.5T added English tokens', 960, 740, 37, C.blue);
    if (D('presentations')) {
      pill(ctx, api, C, 'Unique inventory', 460, 875, 480, C.blue);
      pill(ctx, api, C, 'Repeated presentations', 1360, 875, 650, C.yellow);
    }
    note(
      ctx,
      api,
      C,
      'Category widths are schematic · the card does not supply category totals here',
    );
  }
}
export function drawCorpusEvidenceStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainCorpusEvidence);
}
export default {
  id: 'corpus-evidence',
  draw: drawCorpusEvidenceStage,
  cues: [
    'pt-corpus-evidence-sources',
    'pt-corpus-evidence-evaluate',
    'pt-corpus-evidence-languages',
    'pt-corpus-evidence-copy',
    'pt-corpus-evidence-separate',
    'pt-corpus-evidence-presentations',
  ],
};
