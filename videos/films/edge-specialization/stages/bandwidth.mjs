import { cueProgress, fieldDrawing } from '../field-drawing.mjs';

const activeBillion = 3.8,
  reads = 18,
  bandwidth = 50;
const sizeGB = (bits) => (activeBillion * bits) / 8;

export function drawBandwidth(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api),
    { C, text, line, rect, target } = p;
  const b = state.beat ?? 0;
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const progress8 = cue('lay-reads', 0, 0.61, 0.79),
    progress4 = cue('four-work', 1, 0.62, 0.77);
  const show4 = cue('pack-four', 1, 0.38, 0.47) > 0;
  const overflow = cue('spill-read', 1, 0.02, 0.15) === 1;
  const x = (gb) => 225 + gb * 21;
  const crossing = Math.floor(bandwidth / sizeGB(8)) + 1;
  text('1 request   /   3.8B active weights per step   /   18 steps', 152, 258, 38);
  const limit = x(bandwidth);
  line(limit, 359, limit, 785, C.pink, 4);
  text('50 GB available in one second', limit, 327, 36, C.pink, 'center');
  function stream(bits, y, count, fullLabel, rateLabel) {
    const size = sizeGB(bits);
    const color = bits === 8 ? C.blue : C.cyan;
    text(
      bits + '-bit weights' + (fullLabel ? '   /   ' + size.toFixed(1) + ' GB per read' : ''),
      x(0),
      y - 34,
      36,
      color,
    );
    for (let i = 0; i < reads; i++) {
      const fraction = Math.max(0, Math.min(1, count - i));
      if (!fraction) break;
      const w = 21 * size * fraction;
      const marked = bits === 8 && overflow && i + 1 === crossing;
      rect(x(i * size), y, Math.max(1, w - 2), 76, marked ? C.yellow : color);
      if (bits === 8 && fraction === 1 && (i === 0 || i === reads - 1 || marked))
        text(i + 1, x((i + 0.5) * size), y + 51, 30, C.bg, 'center');
    }
    if (rateLabel)
      text(
        bandwidth +
          ' / ' +
          size.toFixed(1) +
          '   ≈   ' +
          (bandwidth / size).toFixed(1) +
          ' steps/s at most',
        x(0),
        y + 131,
        37,
        C.ink,
      );
  }
  target('bus-eight', () =>
    stream(
      8,
      450,
      1 + (reads - 1) * progress8,
      cue('eight-read', 0, 0.36, 0.53) === 1,
      cue('eight-rate', 1, 0.18, 0.35) === 1,
    ),
  );
  if (show4)
    target('bus-four', () =>
      stream(
        4,
        675,
        1 + (reads - 1) * progress4,
        cue('four-read', 1, 0.49, 0.61) === 1,
        cue('four-rate', 1, 0.73, 0.84) === 1,
      ),
    );
  if (b === 2) {
    target('bus-work', () => {
      const intensity = 16 / 4;
      text(
        '2 FLOPs / weight   ÷   0.5 byte / weight' +
          (cue('intensity', 2, 0.3, 0.41) === 1 ? '   =   ' + intensity + ' FLOPs/byte' : ''),
        960,
        906,
        41,
        C.ink,
        'center',
      );
      if (cue('work-rate', 2, 0.44, 0.56) === 1)
        text(
          '50 GB/s × ' +
            intensity +
            ' FLOPs/byte   =   ' +
            bandwidth * intensity +
            ' GFLOP/s of matrix work',
          960,
          987,
          38,
          C.yellow,
          'center',
        );
    });
  } else {
    const note = !show4
      ? 'Each block is one full read. Which read crosses the line?'
      : progress4 === 1
        ? '18 reads × 1.9 GB   =   ' + (reads * sizeGB(4)).toFixed(1) + ' GB'
        : 'Same eighteen steps   /   two weights in each byte';
    text(note, 960, 955, 43, C.ink, 'center');
  }
}
export default {
  id: 'bandwidth',
  draw: drawBandwidth,
  cues: [
    'eight-read',
    'lay-reads',
    'spill-read',
    'eight-rate',
    'pack-four',
    'four-read',
    'four-work',
    'four-rate',
    'matrix-work',
    'intensity',
    'work-rate',
  ],
};
