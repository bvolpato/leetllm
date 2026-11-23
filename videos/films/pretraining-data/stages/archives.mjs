import { drawText, line, note, pill, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainArchives(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (b === 0) {
    const rows = [
      ['warc', 'WARC', 'HTTP response + raw HTML', C.blue],
      ['wat', 'WAT', 'Computed metadata', C.yellow],
      ['wet', 'WET', 'Already extracted text', C.cyan],
    ];
    pill(ctx, api, C, 'Source P1 / one crawl', 960, 305, 600, C.blue);
    rows.forEach(([key, label, body, col], i) => {
      const y = 450 + i * 155;
      rectangle(ctx, api, C, 260, y - 40, 1400, 110, C.panel, col);
      drawText(ctx, api, C, label, 390, y + 12, 35, col);
      if (beg(key)) drawText(ctx, api, C, body, 1030, y + 12, 32, col);
    });
    note(
      ctx,
      api,
      C,
      'Selecting WET inherits an extractor · WARC preserves bytes for a new extraction',
    );
  } else if (b === 1) {
    const source = ['web prose', 'long argument', 'reference', 'code + tests', 'forum answer'];
    source.forEach((v, i) => {
      const x = 160 + i * 330;
      rectangle(ctx, api, C, x, 370, 290, 240, C.panel, i === 3 ? C.pink : C.blue);
      drawText(ctx, api, C, v, x + 150, 440, 30, i === 3 ? C.pink : C.blue);
      if (P('identity')) {
        drawText(ctx, api, C, 'snapshot / source', x + 150, 525, 24, C.cyan);
        drawText(ctx, api, C, 'retained span', x + 150, 575, 24, C.cyan);
      }
    });
    pill(ctx, api, C, 'Stars measure popularity', 960, 800, 720, C.yellow);
    note(ctx, api, C, 'License, structure and curation decisions remain attached to each source');
  } else {
    drawText(ctx, api, C, 'Source page', 290, 310, 37, C.blue, 'left');
    drawText(ctx, api, C, 'Extracted text', 1080, 310, 37, C.cyan, 'left');
    ['def add(a, b):', '    return a + b', 'The cat sat on the mat.'].forEach((v, i) => {
      api.text(ctx, v, 290, 460 + i * 115, 36, i === 1 ? C.pink : C.ink, 'left', 'mono');
      if (beg('inspect'))
        api.text(ctx, v, 1080, 460 + i * 115, 36, i === 1 ? C.pink : C.ink, 'left', 'mono');
    });
    if (D('inspect')) {
      line(ctx, api, C, 1080, 589, 1166, 589, C.yellow, 4);
      drawText(ctx, api, C, '4 spaces retained', 1380, 825, 34, C.yellow);
    }
  }
}
export function drawArchivesStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainArchives);
}
export default {
  id: 'archives',
  draw: drawArchivesStage,
  cues: [
    'pt-archives-warc',
    'pt-archives-wat',
    'pt-archives-wet',
    'pt-archives-identity',
    'pt-archives-inspect',
  ],
};
