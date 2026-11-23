import { sentenceWords, tensor, transposeBatch0 } from '../fixtures.mjs';
import { complete, count, event } from '../construction.mjs';
import { indexedWriteFrame, memoryFrame } from '../model.mjs';
import { caption, numberGrid, target, text, wordNames } from '../defaults.mjs';
function drawIndexedWrite(ctx, api, state) {
  const { C } = api;
  const frame = indexedWriteFrame(state);
  const chosen = complete(event(state, 2, 'select-copy-address'));
  const sourceName = frame.addressSource ? 'x[[0], 0, 0]' : 'picked[0, 0, 0]';
  const x = 640,
    width = 840,
    cell = width / 4;
  target(ctx, api, 'independent-memory', () => {
    api.text(ctx, 'picked = x[[0, 1]]', 960, 274, 36, C.ink, 'center', 'mono');
    text(ctx, api, 'Birds  ·  sentence 0, word 0', 960, 365, 33, C.ink, 'center');
    [0, 1, 2, 3].forEach((d) =>
      text(ctx, api, 'feature ' + d, x + (d + 0.5) * cell, 428, 29, C.muted, 'center'),
    );
    for (const [i, row] of [frame.source, frame.picked].entries()) {
      const y = 496 + i * 177;
      const id = i === 0 ? 'source-address' : 'picked-address';
      const color = i === 0 ? C.blue : C.green;
      const write = i === 0 ? frame.sourceWrite : frame.copyWrite;
      const marked = i === 0 ? write > 0 : write > 0 && !complete(frame.rewind);
      target(ctx, api, id, () => {
        text(
          ctx,
          api,
          i === 0 ? 'x  ·  source' : 'picked  ·  retrieved',
          x - 44,
          y + 65,
          34,
          color,
          'right',
        );
        numberGrid(ctx, api, [row], x, y, width, 106, color, 'birds-row-' + i, {
          fontSize: 48,
          highlights: marked ? [{ row: 0, column: 0, fill: C.panel, stroke: C.yellow }] : [],
        });
        if (write > 0 && !complete(write))
          api.arrow(ctx, x + cell / 2, y - 40, x + cell / 2, y - 35 + 30 * write, C.yellow, 5);
      });
    }
  });
  target(ctx, api, 'write-expression', () => {
    if (!chosen) return;
    if (complete(frame.rewind) && !frame.addressSource) {
      text(ctx, api, 'Both first features reset to zero', 960, 847, 30, C.muted, 'center');
      return;
    }
    const wrote = frame.addressSource ? complete(frame.sourceWrite) : complete(frame.copyWrite);
    const status = wrote ? 'After the write' : 'Next write';
    text(ctx, api, status, 960, 847, 30, C.muted, 'center');
    api.text(ctx, sourceName + ' = -1', 960, 925, 45, C.yellow, 'center', 'mono');
  });
}

export function drawViews(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0;
  if (beat >= 2 && beat < 6) return drawIndexedWrite(ctx, api, state);
  const v = memoryFrame({ ...state, beat: beat < 2 ? 0 : 2, beatP: beat === 0 ? 0 : state.beatP });
  if (beat < 2) {
    const sourceRows = sentenceWords[0].map((_, i) => v.source.slice(i * 4, i * 4 + 4));
    text(ctx, api, 'Source · sentence 0 shown', 460, 275, 30, themeColors.blue, 'center');
    wordNames(ctx, api, sentenceWords[0], 195, 370, 100, themeColors.blue);
    numberGrid(ctx, api, sourceRows, 220, 370, 480, 300, themeColors.blue, 'memory-source', {
      highlights:
        v.edit > 0
          ? [
              {
                row: 1,
                column: 0,
                fill: themeColors.panel,
                stroke: themeColors.yellow,
              },
            ]
          : [],
    });
    target(ctx, api, 'shared-memory', () => {
      text(ctx, api, 'Basic slice · x[:,1,:]', 1440, 275, 30, themeColors.green, 'center');
      numberGrid(ctx, api, v.basicView, 1200, 405, 480, 220, themeColors.green, 'basic-view', {
        highlights:
          v.edit > 0
            ? [
                {
                  row: 0,
                  column: 0,
                  fill: themeColors.panel,
                  stroke: themeColors.yellow,
                },
              ]
            : [],
      });
      text(ctx, api, 'migrate · B0', 1175, 470, 27, themeColors.blue, 'right');
      text(ctx, api, 'enjoy · B1', 1175, 580, 27, themeColors.pink, 'right');
      text(
        ctx,
        api,
        complete(v.edit) ? 'One shared address · both windows read 99' : 'slice[0, 0] = 99',
        960,
        745,
        31,
        themeColors.yellow,
        'center',
      );
      numberGrid(
        ctx,
        api,
        [v.source.slice(0, 12)],
        240,
        850,
        1440,
        76,
        themeColors.cyan,
        'shared-buffer',
        {
          fontSize: 28,
        },
      );
      text(
        ctx,
        api,
        'Source buffer  ·  first 12 elements',
        960,
        970,
        26,
        themeColors.muted,
        'center',
      );
      if (v.edit > 0) {
        api.line(ctx, 220, 520, 205, 520, themeColors.yellow, 3);
        api.line(ctx, 205, 520, 205, 790, themeColors.yellow, 3);
        api.line(ctx, 205, 790, 780, 790, themeColors.yellow, 3);
        api.arrow(ctx, 780, 790, 780, 850, themeColors.yellow, 3);
        api.line(ctx, 1200, 460, 1185, 460, themeColors.yellow, 3);
        api.line(ctx, 1185, 460, 1185, 700, themeColors.yellow, 3);
        api.line(ctx, 1185, 700, 1760, 700, themeColors.yellow, 3);
        api.line(ctx, 1760, 700, 1760, 790, themeColors.yellow, 3);
        api.line(ctx, 1760, 790, 780, 790, themeColors.yellow, 3);
      }
    });

    return;
  }
  target(ctx, api, 'flatten-memory', () => {
    text(
      ctx,
      api,
      'Transpose view · shared source buffer',
      480,
      275,
      30,
      themeColors.blue,
      'center',
    );
    numberGrid(ctx, api, transposeBatch0, 250, 350, 460, 360, themeColors.blue, 'flatten-view');
    text(ctx, api, 'New contiguous buffer', 1450, 350, 30, themeColors.green, 'center');
    const n = count(12, v.flatten);
    numberGrid(
      ctx,
      api,
      [v.flattened[0].slice(0, 6).map((value, i) => (i < n ? value : ''))],
      1170,
      420,
      560,
      95,
      themeColors.green,
      'flatten-first',
    );
    numberGrid(
      ctx,
      api,
      [v.flattened[0].slice(6).map((value, i) => (i + 6 < n ? value : ''))],
      1170,
      560,
      560,
      95,
      themeColors.green,
      'flatten-second',
    );
    text(
      ctx,
      api,
      'C index order reads each transposed row',
      1450,
      740,
      27,
      themeColors.green,
      'center',
    );
    text(
      ctx,
      api,
      'Original physical buffer stays fixed',
      960,
      830,
      27,
      themeColors.muted,
      'center',
    );
    numberGrid(
      ctx,
      api,
      [tensor.slice(0, 12)],
      240,
      860,
      1440,
      74,
      themeColors.cyan,
      'flatten-source',
      {
        fontSize: 28,
      },
    );
  });
  caption(
    ctx,
    api,
    'This transposed reshape requires a copy · the conclusion is specific to this array layout',
  );
}
export default {
  id: 'views',
  draw: drawViews,
  cues: [
    'shared-slice-address',
    'edit-shared-value',
    'select-copy-address',
    'edit-independent-copy',
    'rewind-indexed-write',
    'address-source',
    'write-indexed-source',
    'flatten-transposed-view',
  ],
};
