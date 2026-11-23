import assert from 'node:assert/strict';
import { gpuReceiptFixtures } from '../../../films/gpu-failure-operations/fixtures.mjs';

// The eight lengths are visible at 01:18 in the original cut. Their positions
// and the tensor lifetimes below form one possible layout of a native segment.
const receipt = gpuReceiptFixtures.find(row => row.receipt_id === 'r-7812');
const toUnits = gib => Math.round(gib * 100);
const gib = units => (units / 100).toFixed(2);
const gaps = [88, 86, 84, 82, 80, 78, 62, 50];
const live = [52, 26, 38, 32, 24, 36, 30, 28, 66];
const request = toUnits(receipt.oom_request_gib);
const deviceFree = toUnits(receipt.capacity_gib - receipt.nvml_device_used_gib);
const blocks = [];
let end = 0;
function append(size, inactive) {
  blocks.push({ start: end, end: end + size, size, inactive });
  end += size;
}
gaps.forEach((size, i) => {
  append(live[i], false);
  append(size, true);
});
append(live.at(-1), false);

const leftGap = blocks[1];
const separator = blocks[2];
const rightGap = blocks[3];
const total = gaps.reduce((a, b) => a + b, 0);

// The replay uses one mapped segment in one native pool and stream, with
// completed frees and default splitting. All widths use hundredths of a GiB.
function inactiveRuns(released) {
  const runs = [];
  for (const block of blocks) {
    if (!block.inactive && block !== released) continue;
    const previous = runs.at(-1);
    if (previous?.end === block.start) {
      previous.end = block.end;
    } else {
      runs.push({ start: block.start, end: block.end });
    }
  }
  return runs;
}
const fit = runs => runs.find(run => run.end - run.start >= request);
const joined = fit(inactiveRuns(separator));
const available = joined.end - joined.start;
const remaining = available - request;

const beats = [
  { id: 'miss', say: 'Follow the orange edge. This GPU worker needs one and a half gibibytes for its next tensor. Is there room?', hold: 1.4 },
  { id: 'overlap', say: 'It runs into a live tensor. The empty stretch on the left is the largest inactive block in the snapshot. It ends at point eight eight gibibytes.', hold: 0.9 },
  { id: 'all-eight', say: 'There are more gaps to the right. All eight belong to the allocator. Together they hold over six gibibytes. Try the same width against a gap in the middle. How about the last one?', hold: 1.5 },
  { id: 'capture', say: 'Every gap is too short. And at the instant of failure, the device has only point six two gibibytes free for new allocations. Save the snapshot while the worker still responds. A restart would erase that layout.', hold: 0.9 },
  { id: 'last-use', say: 'Let’s replay one possible layout. These two gaps share a segment and a stream. Follow the thin purple stripe down. The tensor’s last use finishes and its block is freed. Look at the space underneath.', hold: 1.2 },
  { id: 'join', say: 'The allocator can now merge three neighbors. The gap on the left, the newly freed block, and the gap on the right make one block two gibibytes wide. Try the original request again.', hold: 1.4 },
  { id: 'land', say: 'It fits, with half a gibibyte left over. That’s how fragmentation could explain the failure. In the saved snapshot, look for a live tensor like the one that kept these gaps apart.', hold: 2.5 },
];

const paper = '#f7f2e9';
const ink = '#302339';
const muted = '#68596a';
const violet = '#653fa5';
const orange = '#bb3714';
const chart = { x: 236, right: 1820, top: 260 };
const clamp = x => Math.min(1, Math.max(0, x));
const smooth = x => { const v = clamp(x); return v * v * (3 - 2 * v); };
const mix = (a, b, t) => a + (b - a) * t;

function text(ctx, value, x, y, size, color = ink, align = 'left', face = 'Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}
function line(ctx, x, y, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function fade(ctx, alpha, paint) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  paint();
  ctx.restore();
}
function bracket(ctx, x, right, y, color) {
  line(ctx, x, y, right, y, color, 3);
  for (const edge of [x, right]) line(ctx, edge, y - 9, edge, y + 9, color, 3);
}

// A band is one tensor's address interval through time. Fine vertical lines
// stay within that interval. An ended band leaves bare paper below it.
function band(ctx, x, w, bottom, inactive, i) {
  const top = chart.top;
  if (bottom <= top) return;
  ctx.fillStyle = inactive ? '#b8a7c8' : [violet, '#7252a1', '#50357f', '#7b54a7'][i % 4];
  ctx.fillRect(x, top, w, bottom - top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, w, bottom - top);
  ctx.clip();
  for (let dx = 9; dx < w; dx += 15) {
    line(ctx, x + dx, top, x + dx, bottom, inactive ? '#cbbbd7' : '#ffffff24', 2);
  }
  line(ctx, x + 2, top, x + 2, bottom, inactive ? '#a28bb7' : '#493365', 4);
  line(ctx, x, bottom - 2, x + w, bottom - 2, inactive ? '#a58ab7' : '#493365', 4);
  ctx.restore();
}
function requestOutline(ctx, x, w, y, h, collision, filled = false) {
  ctx.save();
  ctx.fillStyle = filled ? '#e56531' : 'rgba(255,225,173,0.43)';
  ctx.fillRect(x, y, w, h);
  if (collision) {
    const [lo, hi] = collision;
    ctx.save();
    ctx.beginPath(); ctx.rect(lo, y, hi - lo, h); ctx.clip();
    ctx.fillStyle = '#713245'; ctx.fillRect(lo, y, hi - lo, h);
    for (let dx = -h; dx < hi - lo + h; dx += 17) {
      line(ctx, lo + dx, y + h, lo + dx + h, y, '#ffac7b', 5);
    }
    ctx.restore();
  }
  ctx.strokeStyle = orange; ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = orange;
  ctx.fillRect(x - 5, y - 4, 11, h + 8);
  ctx.fillRect(x + w - 6, y - 4, 11, h + 8);
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const replay = index >= 4;
  const out = index < 2 ? 0 : index === 2 ? smooth(reveal('There are more gaps', 1.6))
    : index === 3 ? 1 : index === 4 ? 1 - smooth(reveal('replay one possible layout', 1.6)) : 0;
  const highlight = index === 0 ? 0 : index === 1 ? smooth(reveal('live tensor', 0.5)) : 1;
  const saved = index === 3 ? smooth(reveal('Save the snapshot', 0.55)) : 0;
  const prepare = index < 4 ? 0 : index === 4 ? smooth(reveal('replay one possible layout', 1.6)) : 1;
  const release = index < 4 ? 0 : index === 4 ? smooth(reveal('last use finishes', 1.55)) : 1;
  const merge = index < 5 ? 0 : index === 5 ? smooth(reveal('merge three neighbors', 1.1)) : 1;
  const allocated = index < 5 ? 0 : index === 5 ? smooth(reveal('Try the original request', 1.05)) : 1;
  const start = mix(13, -8, out);
  const span = mix(311, end + 16, out);
  const scale = (chart.right - chart.x) / span;
  const x = n => chart.x + (n - start) * scale;
  const failedY = mix(mix(636, 521, out), 458, prepare);
  const initialMove = index ? 1 : smooth(elapsed / 1.65);
  const attemptWidth = request * mix(0.08, 1, initialMove);
  const failedHeight = mix(mix(80, 63, out), 40, prepare);
  const freeY = 600;
  const retryY = 697;
  const frontier = mix(failedY + failedHeight + 15, freeY, prepare) + release * 97 + allocated * 103;
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1920, 1080);

  text(ctx, 'GPU memory history', 96, 132, 72, ink, 'left', 'Serif', 600);
  text(ctx, replay ? 'Illustrated replay' : 'OOM · possible layout', 1818, 105, 37, ink, 'right');
  text(ctx, receipt.receipt_id + '   /   PyTorch native', 1818, 152, 28, muted, 'right', 'Mono');
  line(ctx, 96, 184, 1820, 184, '#c3b4bc');
  text(ctx, 'Time ↓', 96, 236, 31, muted);
  text(ctx, 'Address within one segment →', chart.x, 236, 31, muted);

  ctx.save();
  ctx.beginPath(); ctx.rect(chart.x, chart.top, chart.right - chart.x, 816 - chart.top); ctx.clip();
  ctx.fillStyle = '#ebe6ed';
  ctx.fillRect(chart.x, chart.top, chart.right - chart.x, frontier - chart.top);
  for (let tick = 0; tick <= end; tick += 25) {
    line(ctx, x(tick), chart.top, x(tick), frontier, '#d2c9d2', tick % 100 === 0 ? 2 : 1);
  }
  for (let y = chart.top + 32; y < frontier; y += 32) {
    line(ctx, chart.x, y, chart.right, y, '#ddd5dc', 1);
  }
  blocks.forEach((b, i) => {
    if (x(b.end) < chart.x || x(b.start) > chart.right) return;
    const past = chart.top + [60, 96, 42, 116, 62, 92, 48, 106][Math.floor(i / 2) % 8];
    const bottom = b.inactive ? past : (b === separator && release > 0 ? freeY : frontier);
    band(ctx, x(b.start), b.size * scale, bottom, b.inactive, i);
  });
  // The outline marks a failed attempt. Only the successful replay lays
  // down an orange lifetime in the address history.
  const tip = leftGap.start + attemptWidth;
  const collision = tip > separator.start ? [x(separator.start), x(Math.min(separator.end, tip))] : null;
  requestOutline(ctx, x(leftGap.start), attemptWidth * scale, failedY, failedHeight, collision);
  if (merge > 0) {
    fade(ctx, merge, () => {
      const labelY = freeY + 65;
      bracket(ctx, x(joined.start), x(joined.end), labelY, '#493451');
      ctx.fillStyle = '#ebe6ed';
      ctx.fillRect(x(joined.start + 5), labelY - 45, 255, 38);
      text(ctx, gib(available) + ' GiB', x(joined.start + 5), labelY - 11, 34, ink, 'left', 'Mono');
    });
  }
  if (allocated > 0) {
    requestOutline(ctx, x(joined.start), request * scale, retryY, Math.max(2, frontier - retryY), null, true);
    fade(ctx, allocated, () => {
      text(ctx, gib(request) + ' GiB', x(joined.start + 5), retryY + 64, 42, '#2b1720', 'left', 'Mono', 600);
      const restX = x(joined.end - remaining / 2);
      text(ctx, gib(remaining) + ' GiB', restX, retryY + 49, 37, ink, 'center', 'Mono');
      text(ctx, 'left', restX, retryY + 87, 32, muted, 'center');
    });
  }
  ctx.restore();
  line(ctx, chart.x, frontier, chart.right, frontier, '#4e4055', 2);
  fade(ctx, smooth((initialMove - 0.65) / 0.35), () => {
    text(ctx, 'OOM', chart.x - 22, failedY + failedHeight * 0.65, 40, orange, 'right', 'Mono', 600);
  });
  fade(ctx, release, () => text(ctx, 'Free', chart.x - 22, freeY + 11, 34, ink, 'right', 'Mono'));
  fade(ctx, allocated, () => text(ctx, 'Retry', chart.x - 22, retryY + 42, 34, orange, 'right', 'Mono'));
  if (!replay) {
    fade(ctx, clamp(1 - out * 10), () => {
      const lo = x(leftGap.start);
      const mid = (x(separator.start) + x(separator.end)) / 2;
      fade(ctx, smooth((initialMove - 0.6) / 0.4), () => {
        text(ctx, gib(request) + ' GiB request', lo + 15, failedY + failedHeight * 0.67, 37, '#622a1e', 'left', 'Mono', 600);
      });
      fade(ctx, highlight, () => {
        bracket(ctx, lo, x(leftGap.end), frontier + 24, ink);
        text(ctx, gib(leftGap.size) + ' GiB inactive', lo, frontier + 85, 37, ink, 'left', 'Sans', 600);
        line(ctx, mid, frontier + 8, mid, frontier + 47, violet, 3);
        text(ctx, 'live tensor', mid + 16, frontier + 55, 35, violet);
      });
    });
  }
  fade(ctx, clamp((out - 0.96) / 0.04), () => {
    blocks.filter(b => b.inactive).forEach(b => {
      text(ctx, gib(b.size), x((b.start + b.end) / 2), frontier + 54, 30, ink, 'center', 'Mono');
    });
    if (index === 2 || index === 3) {
      const middle = index === 2 ? smooth(reveal('Try the same width', 1.35)) : 1;
      const last = index === 2 ? smooth(reveal('How about the last one', 1.35)) : 1;
      const alpha = index === 2 ? clamp(middle * 8) : 1 - smooth(reveal('the device has only', 0.65));
      // Compare from the right end of each gap. Even at the last address
      // the full request stays in frame and extends into occupied space.
      const hi = mix(mix(leftGap.end, blocks[9].end, middle), blocks.at(-2).end, last);
      const y = frontier + 96;
      fade(ctx, alpha, () => {
        bracket(ctx, x(hi - request), x(hi), y, orange);
        text(ctx, gib(request) + ' GiB', x(hi - request / 2), y + 45, 31, orange, 'center', 'Mono');
      });
    }
    text(ctx, 'Inactive blocks', chart.x, 813, 37, muted);
    text(ctx, gib(total) + ' GiB total', chart.x, 884, 57, ink, 'left', 'Serif', 600);
    if (index === 3) {
      fade(ctx, smooth(reveal('the device has only', 0.6)), () => {
        text(ctx, 'Device free', 1015, 813, 37, muted);
        text(ctx, gib(deviceFree) + ' GiB', 1015, 884, 57, ink, 'left', 'Serif', 600);
      });
      fade(ctx, saved, () => {
        text(ctx, 'Snapshot saved', 1820, 953, 35, violet, 'right', 'Mono');
      });
    }
  });
  if (replay) {
    fade(ctx, clamp((prepare - 0.94) / 0.06) * (1 - merge), () => {
      const center = x((separator.start + separator.end) / 2);
      const labelY = frontier + 66;
      line(ctx, center, freeY + 6, center, labelY - 39, violet, 3);
      text(ctx, release > 0.95 ? 'Block freed' : 'Live tensor', center, labelY, 39, violet, 'center');
      for (const block of [leftGap, separator, rightGap]) {
        text(ctx, gib(block.size) + ' GiB', x((block.start + block.end) / 2), labelY + 49, 33, muted, 'center', 'Mono');
      }
    });
  }
}

function check() {
  assert.equal(receipt.allocator_backend, 'native');
  assert.equal(receipt.cuda_error, 'out_of_memory');
  assert.equal(total, toUnits(receipt.inactive_split_block_total_gib));
  assert.equal(Math.max(...gaps), toUnits(receipt.largest_inactive_split_block_gib));
  assert.equal(deviceFree, 62);
  assert.equal(request, 150);
  assert.ok(total > request && deviceFree < request);
  assert.equal(inactiveRuns().length, 8);
  assert.equal(fit(inactiveRuns()), undefined);
  assert.equal(joined.start, leftGap.start);
  assert.equal(joined.end, rightGap.end);
  assert.equal(available, 200);
  assert.equal(remaining, 50);
  assert.ok(leftGap.start + request > separator.end);
  return true;
}

export default { title: 'Where could the GPU put 1.50 GiB?', beats, draw, check };
