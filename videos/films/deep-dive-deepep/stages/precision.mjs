import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawPrecision(ctx, scene, state, api) {
  const { C } = api;
  const m = sampleModel('precision', state);
  const values = m.width / m.scaleGroups;
  const scaleBytes = m.scaleBytes / m.scaleGroups;
  const bfBytes = m.bf / m.scaleGroups;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const scale = state.beat > 1 ? 1 : (state.cues?.['precision-scale']?.progress ?? 0);
  const wholeRow = state.beat === 2;
  const fmt = (n) => n.toLocaleString('en-US');
  const x = 370;
  const width = 1216;
  const half = x + width / 2;
  const bar = (y, bytes, color) =>
    api.rect(ctx, x, y, (width * bytes) / bfBytes, 78, color, undefined, 0);
  const label = (value, lx, ly, size, color = C.ink) => text(ctx, api, value, lx, ly, size, color);

  api.focus.target('precision-payload', () => {
    label(
      wholeRow
        ? fmt(m.width) + ' values   ·   ' + m.scaleGroups + ' groups'
        : 'One group   ·   ' + values + ' values',
      x,
      285,
      52,
    );
    label('BF16', x, 395, 39, C.blue);
    bar(424, bfBytes, C.blue);
    const bfKnown = state.beat > 0 || done('dep-result-precision-bf16');
    label(bfKnown ? fmt(wholeRow ? m.bf : bfBytes) + ' bytes' : '2 bytes per value', x, 561, 37);
    const showFP = state.beat > 0 || (state.cues?.['precision-fp8']?.progress ?? 0) > 0;
    if (showFP) {
      label('FP8', x, 672, 39, C.cyan);
      bar(701, values, C.cyan);
      api.line(ctx, half, 524, half, 691, C.muted, 2);
      label('Half', half + 20, 621, 30, C.muted);
      if (scale > 0) {
        api.rect(
          ctx,
          half,
          701,
          ((width * scaleBytes) / bfBytes) * scale,
          78,
          C.pink,
          undefined,
          0,
        );
        api.line(ctx, half + (width * scaleBytes) / bfBytes / 2, 790, half + 75, 842, C.pink, 3);
        label(
          wholeRow ? fmt(m.scaleBytes) + ' scale bytes' : scaleBytes + '-byte scale',
          half + 88,
          865,
          38,
          C.pink,
        );
      }
      label(fmt(wholeRow ? m.width : values) + ' value bytes', x, 862, 37, C.cyan);
    }
    if (wholeRow || done('dep-result-precision-total')) {
      const total = wholeRow ? m.fp8 : values + scaleBytes;
      const ratio =
        wholeRow && done('dep-result-precision-ratio')
          ? '    ·    BF16 / FP8 ≈ ' + m.ratio.toFixed(2) + '×'
          : '';
      label('FP8 values and scales   ' + fmt(total) + ' bytes' + ratio, x, 984, 40, C.ink);
    }
  });
}
export default {
  id: 'precision',
  draw: drawPrecision,
  cues: [
    'dep-result-precision-bf16',
    'precision-fp8',
    'precision-scale',
    'dep-result-precision-total',
    'dep-result-precision-ratio',
  ],
};
