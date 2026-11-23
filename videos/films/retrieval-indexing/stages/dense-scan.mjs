import { picture } from '../picture.mjs';

const passages = 1_000_000;
const dimensions = 1536;
const products = passages * dimensions;
const bytes = products * Float32Array.BYTES_PER_ELEMENT;
const qps = 200;

export function drawDenseScan(ctx, scene, state, api) {
  const p = picture(ctx, state, api);
  const { C, label, box, rule, progress, started, after } = p;
  const cost = state.beat > 0;
  const sweep = cost ? 1 : progress('scan-products');
  const reuse = cost && started('scan-reuse');
  p.target('dense-scan-construction', () => {
    label('1,000,000 passage vectors', 150, 293, 48, C.ink, 'left', 'serif');
    label('1,536 float32 coordinates per row', 150, 362, 38, C.muted);
    for (let i = 0; i < 12; i++) {
      const y = 425 + i * 37;
      box(150, y, 820, 23, C.panel);
      const width = 820 * Math.max(0, Math.min(1, sweep * 12 - i));
      if (width > 0) box(150, y, width, 23, reuse && i === 8 ? C.yellow : C.blue);
    }
    if (!cost) {
      if (after('scan-products')) {
        label(products.toLocaleString('en-US'), 1100, 526, 68, C.yellow);
        label('coordinate multiplications per query', 1100, 595, 35);
      }
      if (after('scan-payload')) {
        label((bytes / 1e9).toFixed(3) + ' GB', 1100, 757, 68, C.green);
        label('of float32 coordinates', 1100, 825, 35);
      }
      return;
    }
    label((bytes / 1e9).toFixed(3) + ' GB per full read', 1080, 340, 46, C.ink);
    label('× ' + qps + ' full reads per second', 1080, 417, 42);
    if (after('scan-traffic'))
      label('= ' + ((bytes * qps) / 1e12).toFixed(4) + ' TB/s', 1080, 520, 65, C.yellow);
    if (reuse) {
      const y = 425 + 8 * 37 + 11.5;
      const branch = 1175;
      const travel = progress('scan-reuse');
      rule(970, y, branch, y, C.yellow, 5);
      for (const [i, offset] of [-70, 70].entries()) {
        rule(branch, y, branch, y + offset, C.yellow, 5);
        const end = branch + 135 * travel;
        rule(branch, y + offset, end, y + offset, C.yellow, 5);
        label('Query ' + (i + 1), 1345, y + offset + 12, 42);
      }
      label('Read a block once. Use it for both queries.', 150, 969, 44, C.yellow);
    }
  });
  return true;
}
export default {
  id: 'dense-scan',
  draw: drawDenseScan,
  cues: ['scan-products', 'scan-payload', 'scan-traffic', 'scan-reuse'],
};
