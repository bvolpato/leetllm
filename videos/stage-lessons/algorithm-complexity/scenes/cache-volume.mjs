import { assertEqual, column, dot, dynamic, indicate, place, rect } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, CACHE_SHAPE, cacheValueBytes } from '../parts.mjs';
export default function cache(s, c) {
  const [left, right] = PICTURE.columns([3, 2], 'loose');
  const [factors, slabs] = left.rows([2, 5], 'wide');
  const shape = place(
    column(
      [
        label('One token: K and V', { color: 'blue' }),
        mono('32 layers × 8 KV heads', { size: 36 }),
        mono('128 coordinates × 2 bytes', { size: 36 }),
      ],
      { gap: 'tight' },
    ),
    factors,
  );
  const slabRegions = slabs.columns(2, 'loose');
  const heads = slabRegions.map((b, i) => place(label(i ? 'V' : 'K', { color: 'blue' }), b, 'top'));
  const grids = slabRegions.map((b) =>
    b
      .inset('loose')
      .rows(CACHE_SHAPE.layers, 'none')
      .flatMap((r) =>
        r
          .columns(CACHE_SHAPE.kvHeads, 'tight')
          .map((cell) =>
            rect(cell.width, cell.height - 2, { fill: 'blue', stroke: null, opacity: 0.75 }).moveTo(
              cell.point('center'),
            ),
          ),
      ),
  );
  const perToken = cacheValueBytes(1) / CACHE_SHAPE.streams;
  assertEqual(perToken, 131072, 'raw bytes per token');
  assertEqual(cacheValueBytes(1024) / 1024 ** 3, 2, 'two GiB');
  assertEqual(cacheValueBytes(4096) / 1024 ** 3, 8, 'eight GiB');
  const bytes = place(
    mono(perToken.toLocaleString('en-US') + ' bytes per token', { color: 'yellow' }),
    FOOT,
  );
  const kibi = place(mono(perToken / 1024 + ' KiB per token', { color: 'yellow' }), FOOT);
  const [shareHead, shareBody] = right.rows([1, 5], 'wide');
  const groups = shareBody.rows(2, 'wide').flatMap((r) => r.columns(4, 'normal'));
  const groupFrames = groups.map((b) =>
    rect(b.width, b.height, { fill: 'surface', stroke: 'blue', width: 2 }).moveTo(
      b.point('center'),
    ),
  );
  const kv = groups.map((b, i) =>
    place(mono('KV' + (i + 1), { size: 34, color: 'blue' }), b, 'top'),
  );
  const queries = groups.flatMap((b) =>
    b
      .rows([1, 2], 'normal')[1]
      .columns(4, 'tight')
      .map((x) => dot(10, 'cyan').moveTo(x.point('center'))),
  );
  const share = place(label('32 query heads / 8 KV heads', { size: 36 }), shareHead);
  const title = heading(c.title);
  s.add(title, shape, heads[0], grids[0]);
  const [inputs, body] = PICTURE.rows([1, 6], 'normal');
  const [streams, scores] = body.columns([2, 1], 'loose');
  const inputCells = inputs.columns(2, 'loose');
  const length = s.value(1024);
  const lengthLabel = dynamic(() => [
    place(
      mono('16 streams · ' + Math.round(length.value) + ' positions', { color: 'cyan' }),
      inputCells[0],
    ),
  ]);
  const streamRows = streams.rows(CACHE_SHAPE.streams, 'tight');
  const bars = dynamic(() =>
    streamRows.flatMap((b) => {
      const width = (b.width * length.value) / 4096;
      return [
        rect(b.width, b.height, { fill: 'surface', stroke: 'dim', width: 1 }).moveTo(
          b.point('center'),
        ),
        rect(width, b.height, { fill: 'blue', stroke: null }).moveTo([b.left + width / 2, b.cy]),
      ];
    }),
  );
  const [scoreTitle, scorePicture, scoreRead] = scores.rows([1, 4, 1], 'normal');
  const scoreName = place(label('dense prefill score grid', { size: 34 }), scoreTitle);
  const square = dynamic(() => {
    const side = Math.min(scorePicture.width, scorePicture.height),
      unit = side / 16,
      n = Math.ceil((length.value / 4096) * 16),
      origin = [scorePicture.cx - side / 2, scorePicture.cy - side / 2];
    return Array.from({ length: n * n }, (_, i) => {
      const r = Math.floor(i / n),
        k = i % n;
      const width = Math.max(0.1, Math.min(unit - 2, (side * length.value) / 4096 - k * unit - 2));
      const height = Math.max(0.1, Math.min(unit - 2, (side * length.value) / 4096 - r * unit - 2));
      return rect(width, height, {
        fill: r < 4 && k < 4 ? 'blue' : 'pink',
        stroke: null,
        opacity: 0.8,
      }).moveTo([origin[0] + k * unit + width / 2, origin[1] + r * unit + height / 2]);
    });
  });
  const sixteen = place(label('score cells ×16', { color: 'pink' }), scoreRead);
  const two = place(mono('2 GiB raw cache', { color: 'yellow' }), FOOT);
  const eight = place(mono('8 GiB raw cache · context ×4 → cache ×4', { color: 'yellow' }), FOOT);
  c.show('cache-token', [heads[1], grids[1]]);
  c.show('cache-bytes', bytes, { after: true });
  c.swap('cache-token-kibi', bytes, kibi, { after: true });
  c.show('gqa-heads', [groupFrames, kv, share]);
  c.show('gqa-sharing', queries, { stagger: true });
  c.swapAll('cache-streams', [lengthLabel, bars, scoreName, square], { keep: [title] });
  c.show('cache-two', two, { after: true });
  c.hide('cache-grow', two);
  c.on('cache-grow', () => s.play(length.to(4096), { duration: 2.4 }), 0.4);
  c.show('cache-eight', eight, { after: true });
  c.on('cache-endpoint-comparison', () =>
    s.play(indicate(scoreName, { scale: 1, color: 'yellow' }), { duration: 0.8 }),
  );
  c.show('cache-endpoint-comparison', sixteen, { after: true });
}
