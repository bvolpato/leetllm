import { bar, drawText, note, pill, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainScoreContracts(
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
    drawText(ctx, api, C, 'DataComp-LM label sources', 960, 300, 35, C.blue);
    pill(ctx, api, C, 'OpenHermes', 510, 480, 550, C.blue);
    pill(ctx, api, C, 'Highly rated ELI5', 1410, 480, 550, C.cyan);
    if (beg('dclm')) {
      rectangle(ctx, api, C, 280, 665, 1360, 100, C.panel);
      rectangle(ctx, api, C, 280, 665, 136, 100, C.yellow);
      drawText(ctx, api, C, 'Top 10% documents', 960, 845, 38, C.yellow);
    }
    note(ctx, api, C, 'Token yield depends on the lengths of the selected documents.');
  } else if (b === 1) {
    drawText(ctx, api, C, 'FineWeb-Edu: 460,000 teacher annotations', 960, 310, 35, C.blue);
    bar(ctx, api, C, 260, 460, 1400, 410000, 460000, C.blue, 'Training: 410,000');
    bar(ctx, api, C, 260, 610, 1400, 50000, 460000, C.cyan, 'Validation: 50,000');
    if (D('ccnet')) {
      pill(ctx, api, C, 'CCNet: proximity to Wikipedia reference', 960, 835, 1350, C.yellow);
    }
  } else {
    const records = [
      ['Proof', 120, 0.98],
      ['API docs', 160, 0.92],
      ['Forum', 200, 0.79],
      ['News', 240, 0.63],
      ['Scrape', 280, 0.31],
    ];
    const cutoff = Math.round(P('cut') * 90) / 100;
    const total = records.reduce((n, [, tokens]) => n + tokens, 0);
    const retained = records.filter(([, , score]) => score >= cutoff);
    const kept = retained.reduce((n, [, tokens]) => n + tokens, 0);
    let x = 200;
    drawText(ctx, api, C, 'Token inventory', x, 312, 40, C.ink, 'left');
    drawText(ctx, api, C, 'Score cutoff ' + cutoff.toFixed(2), 1720, 312, 38, C.yellow, 'right');
    for (const [name, tokens, score] of records) {
      const w = tokens * 1.52;
      const present = score >= cutoff;
      const y = present ? 400 : 610;
      const color = present ? C.cyan : C.muted;
      rectangle(ctx, api, C, x, y, w - 8, 158, C.panel, color);
      drawText(ctx, api, C, name, x + (w - 8) / 2, y + 47, 32, color);
      drawText(ctx, api, C, tokens + ' tokens', x + (w - 8) / 2, y + 97, 27, C.ink);
      drawText(ctx, api, C, score.toFixed(2), x + (w - 8) / 2, y + 139, 28, C.yellow);
      x += w;
    }
    if (D('yield'))
      drawText(
        ctx,
        api,
        C,
        kept + ' / ' + total + ' tokens = ' + Math.round((100 * kept) / total) + '%',
        960,
        877,
        54,
        C.cyan,
      );
    if (D('quality'))
      drawText(
        ctx,
        api,
        C,
        'Test the selected sources on the tasks you need.',
        960,
        973,
        34,
        C.ink,
      );
  }
}
export function drawScoreContractsStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainScoreContracts);
}
export default {
  id: 'score-contracts',
  draw: drawScoreContractsStage,
  cues: [
    'pt-score-contracts-dclm',
    'pt-score-contracts-labels',
    'pt-score-contracts-ccnet',
    'pt-score-contracts-records',
    'pt-score-contracts-cut',
    'pt-score-contracts-yield',
    'pt-score-contracts-quality',
  ],
};
