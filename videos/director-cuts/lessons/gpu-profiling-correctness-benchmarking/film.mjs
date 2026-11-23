import assert from 'node:assert/strict';
import { trace } from '../../../films/gpu-profiling-correctness-benchmarking/trace.mjs';

// The course trace supplies the patch. Give the baseline the same device
// schedule to isolate what a shorter host call can establish.
const runs = [
  { label: 'Baseline', callEnd: trace.hostA, kernelStart: trace.kernelStart, kernelEnd: trace.stop, startEvent: trace.start, stopEvent: trace.stop, ink: '#407ddb', edge: '#194b98' },
  { label: 'Patch', callEnd: trace.hostB, kernelStart: trace.kernelStart, kernelEnd: trace.stop, startEvent: trace.start, stopEvent: trace.stop, ink: '#f16b9c', edge: '#a52559' },
];
const [baseline, patch] = runs;
const callRatio = baseline.callEnd / patch.callEnd;
const returnedEarlier = baseline.callEnd - patch.callEnd;
const kernelTime = run => run.kernelEnd - run.kernelStart;
const eventTime = run => run.stopEvent - run.startEvent;
const gap = patch.kernelStart - patch.startEvent;

const beats = [
  {
    id: 'two-returns',
    say: 'Watch the pink edge. At three microseconds the patch returns from its launch call. The CPU is free to move on. The blue call is still running.',
    hold: 0.9,
  },
  {
    id: 'the-launch-clock',
    say: 'The baseline takes five point four microseconds to return. Divide by three and the launch looks one point eight times faster. Did the GPU finish any sooner?',
    hold: 1.5,
  },
  {
    id: 'beyond-the-call',
    say: 'Pull back. Those little pulses are the launch calls. Look down at the GPU. In these two runs the same kernel starts at ten microseconds, with the same inputs. Follow it to the end.',
    hold: 1.1,
  },
  {
    id: 'the-right-edge',
    say: 'Both right edges land at seventy-five. Each kernel ran for sixty-five microseconds. To compare versions, check both outputs against the same reference. Then time each run by putting two timing events in the same CUDA stream, one before the kernel and one after.',
    hold: 0.8,
  },
  {
    id: 'between-events',
    say: 'Wait for the stop event, then read the interval. See the sliver before either kernel starts? The first event landed at five. Those extra five microseconds count toward the seventy between events.',
    hold: 1.2,
  },
  {
    id: 'register-the-traces',
    say: 'Lay the patch over the baseline. The GPU traces line up edge to edge. Up on the CPU there’s a little blue tip sticking out. The patch gave that time back to the calling thread. Both kernels finished at the same mark.',
    hold: 2.8,
  },
];

const page = '#fbf7f1';
const ink = '#272441';
const soft = '#65647b';
const left = 384;
const right = 1774;
const cpuY = 371;
const gpuY = 668;
const separation = 50;
const height = 84;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const us = n => Number(n.toFixed(1)) + ' µs';

function check() {
  assert.equal(callRatio, 1.8);
  assert.equal(Number(returnedEarlier.toFixed(1)), 2.4);
  for (const run of runs) {
    assert.ok(run.callEnd < run.kernelStart);
    assert.ok(run.startEvent <= run.kernelStart && run.kernelEnd <= run.stopEvent);
    assert.equal(kernelTime(run), 65);
    assert.equal(eventTime(run), 70);
    assert.equal(eventTime(run) - kernelTime(run), gap);
  }
  assert.equal(gap, 5);
  assert.equal(baseline.kernelEnd - patch.kernelEnd, 0);
}

function state(clock) {
  const { index, reveal, elapsed, speechDuration } = clock;
  let time = trace.hostA;
  let zoom = index < 2 ? 0 : 1;
  if (index === 0) {
    // Cut in during the call. The patch finishes in the first second.
    time = Math.min(4.95, 1.9 + Math.min(1.45, elapsed * 1.65) + 1.6 * clamp(elapsed / speechDuration));
  } else if (index === 1) {
    time = lerp(4.95, baseline.callEnd, ease(elapsed / 0.7));
  } else if (index === 2) {
    zoom = ease(reveal('Pull back', 2.1));
    time += (8.5 - baseline.callEnd) * zoom;
    time += (13 - 8.5) * ease(reveal('Look down at the GPU', 1.4));
    time += (trace.stop - 13) * ease(reveal('In these two runs', 5));
  } else {
    time = trace.stop;
  }
  const align = index === 5 ? ease(reveal('Lay the patch', 2.1)) : 0;
  const events = index === 3 ? ease(reveal('putting two timing events', 1.1)) : Number(index > 3);
  return {
    time, zoom, align,
    eventInk: events * (1 - align),
    showRatio: index === 1 ? ease(reveal('Divide by three', 0.8)) : 0,
    showGap: index === 4 ? ease(reveal('See the sliver', 0.65)) : 0,
    showTip: index === 5 ? ease(reveal('Up on the CPU', 0.75)) : 0,
    range: 7 * (80 / 7) ** zoom,
  };
}

function type(ctx, text, x, y, size, options = {}) {
  const { color = ink, family = 'Sans', weight = 400, align = 'left' } = options;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(text, x, y);
}

function line(ctx, points, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function field(ctx, x, s) {
  const wash = ctx.createLinearGradient(0, 0, 270, 1080);
  wash.addColorStop(0, page);
  wash.addColorStop(0.58, '#fdfbf8');
  wash.addColorStop(1, '#e9e6e8');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);

  type(ctx, 'triad_f32', 100, 99, 60, { family: 'Mono' });
  type(ctx, 'Constructed timing traces', 104, 164, 31, { color: soft });
  runs.forEach((run, i) => {
    const at = 1185 + i * 347;
    ctx.fillStyle = run.ink;
    ctx.fillRect(at, 86, 44, 29);
    line(ctx, [[at - 10, 115], [at, 115], [at, 86], [at + 44, 86], [at + 44, 115], [at + 59, 115]], run.edge, 4);
    type(ctx, run.label, at + 76, 103, 40, { color: run.edge });
  });

  line(ctx, [[96, 213], [1824, 213]], '#c4bfca');
  line(ctx, [[96, 515], [1824, 515]], '#d4cfda');
  line(ctx, [[left, 841], [right, 841]], '#88859b', 3);

  const tick = s.range < 11 ? 1 : s.range < 24 ? 2 : s.range < 48 ? 5 : 10;
  for (let time = 0; time <= s.range + 0.001; time += tick / 2) {
    const major = Math.abs(time / tick - Math.round(time / tick)) < 0.001;
    const at = x(time);
    if (major) {
      line(ctx, [[at, 237], [at, 840]], '#e1dce2', 1.5);
      type(ctx, String(time), at, 882, 33, { color: soft, family: 'Mono', align: 'center' });
    }
    line(ctx, [[at, 841], [at, major ? 853 : 847]], '#88859b', major ? 2.4 : 1.7);
  }
  type(ctx, 'Time (µs)', 100, 878, 35, { color: soft });
  for (const [label, sub, y] of [['CPU', 'Launch call', cpuY], ['GPU', 'Kernel', gpuY]]) {
    type(ctx, label, 95, y - 19, 74, { family: 'Serif' });
    type(ctx, sub, 101, y + 47, 34, { color: soft });
  }
}

// Time runs horizontally. Each printed pulse rises while its operation is active.
// The two inks carry distinct textures when the runs move into registration.
function pulse(ctx, x, run, version, y, start, end, time) {
  const x0 = x(start), x1 = x(Math.min(time, end));
  const top = y - height / 2, floor = y + height / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  line(ctx, [[left, floor], [right, floor]], '#e8e5ed', 2);
  if (start > 0) line(ctx, [[left, floor], [x(Math.min(time, start)), floor]], run.edge, 3);
  if (time > end) line(ctx, [[x(end), floor], [x(time), floor]], run.edge, 3);
  if (time > start) {
    const width = x1 - x0;
    ctx.fillStyle = run.ink;
    ctx.fillRect(x0, top, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, top, width, height);
    ctx.clip();
    ctx.fillStyle = 'rgba(61,24,105,0.22)';
    if (version === 0) {
      for (let row = 0; row * 10 < height; row++) {
        for (let dot = x0 + (row % 2) * 5; dot < x1 + 2; dot += 10) {
          ctx.fillRect(dot, top + row * 10, 2, 2);
        }
      }
    } else {
      ctx.beginPath();
      for (let stripe = x0 - height; stripe < x1; stripe += 18) {
        ctx.moveTo(stripe, floor);
        ctx.lineTo(stripe + height, top);
      }
      ctx.strokeStyle = 'rgba(128,20,80,0.29)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    const outline = [[x0, floor], [x0, top], [x1, top]];
    if (time >= end) outline.push([x1, floor]);
    line(ctx, outline, run.edge, 4);
  }
  ctx.restore();
}

function durationLabel(ctx, x, y, start, end, run, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  const room = x(end) - x(start);
  const inside = room > 185;
  type(ctx, us(end - start), inside ? (x(start) + x(end)) / 2 : x(end) + 24, y, inside ? 50 : 39, {
    color: inside ? '#161730' : run.edge, align: inside ? 'center' : 'left', family: 'Mono',
  });
  ctx.restore();
}

function streamMarks(ctx, x, s) {
  if (!s.eventInk) return;
  ctx.save();
  ctx.globalAlpha = s.eventInk;
  const start = x(patch.startEvent), end = x(patch.stopEvent);
  const y = 548, mid = (start + end) / 2;
  const caption = us(eventTime(patch)) + ' between events';
  type(ctx, caption, mid, y, 38, { align: 'center' });
  const clearance = ctx.measureText(caption).width / 2 + 19;
  line(ctx, [[start, y + 24], [start, y], [mid - clearance, y]], ink, 4);
  line(ctx, [[mid + clearance, y], [end, y], [end, y + 24]], ink, 4);
  for (const at of [start, end]) {
    ctx.setLineDash([4, 8]);
    line(ctx, [[at, y + 26], [at, 758]], ink, 2);
    ctx.setLineDash([]);
  }
  if (s.showGap > 0) {
    ctx.globalAlpha = s.showGap * s.eventInk;
    ctx.fillStyle = 'rgba(241,173,27,0.32)';
    ctx.fillRect(start, 575, x(patch.kernelStart) - start, 186);
    line(ctx, [[start, 769], [start, 782], [x(patch.kernelStart), 782], [x(patch.kernelStart), 769]], '#875910', 3);
    type(ctx, us(gap) + ' gap', start - 15, 779, 35, { color: '#765114', align: 'right' });
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const s = state(clock);
  const x = t => left + t / s.range * (right - left);
  field(ctx, x, s);
  for (const [baseY, isCPU] of [[cpuY, true], [gpuY, false]]) {
    const labels = [];
    runs.forEach((run, version) => {
      const y = baseY + (version ? 1 : -1) * (1 - s.align) * separation;
      const start = isCPU ? 0 : run.kernelStart;
      const end = isCPU ? run.callEnd : run.kernelEnd;
      pulse(ctx, x, run, version, y, start, end, s.time);
      if (s.time >= end) labels.push({ run, start, end, y });
    });
    for (const { run, start, end, y } of labels) {
      durationLabel(ctx, x, y, start, end, run, 1 - ease(s.align / 0.6));
    }
  }
  if (s.time < patch.kernelStart) {
    type(ctx, 'No kernel yet', left + 27, gpuY + 39, 38, { color: soft, family: 'Serif' });
  }
  if (clock.index < 3 && s.time < trace.stop) {
    const at = x(s.time);
    ctx.setLineDash([5, 9]);
    line(ctx, [[at, 250], [at, 817]], '#706d80', 2.5);
    ctx.setLineDash([]);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(at - 8, 239);
    ctx.lineTo(at + 8, 239);
    ctx.lineTo(at, 250);
    ctx.closePath();
    ctx.fill();
  }
  if (s.showRatio > 0) {
    ctx.save();
    ctx.globalAlpha = s.showRatio;
    type(ctx, callRatio.toFixed(1) + '×', 1750, cpuY - 17, 88, { family: 'Serif', align: 'right' });
    type(ctx, 'launch speedup', 1750, cpuY + 55, 31, { align: 'right', color: soft });
    ctx.restore();
  }
  if (s.time >= trace.stop) {
    for (const t of [patch.kernelStart, patch.kernelEnd]) {
      const at = x(t);
      line(ctx, [[at, 821], [at, 832]], soft, 2);
      type(ctx, us(t), at, 802, 32, { family: 'Mono', align: 'center', color: soft });
    }
  }
  streamMarks(ctx, x, s);
  if (s.align > 0.5) {
    ctx.save();
    ctx.globalAlpha = ease((s.align - 0.5) * 2);
    type(ctx, us(kernelTime(patch)) + ' each', (x(patch.kernelStart) + x(patch.kernelEnd)) / 2, gpuY, 47, {
      family: 'Mono', color: '#ffffff', align: 'center',
    });
    ctx.restore();
  }
  if (s.showTip > 0) {
    ctx.save();
    ctx.globalAlpha = s.showTip;
    const lip = (x(baseline.callEnd) + x(patch.callEnd)) / 2;
    line(ctx, [[lip, cpuY - height / 2 - 6], [lip + 37, cpuY - 79], [lip + 80, cpuY - 79]], baseline.edge, 3.5);
    type(ctx, us(returnedEarlier) + ' earlier return', lip + 96, cpuY - 80, 39, { color: baseline.edge });
    ctx.restore();
  }
}

export default { title: 'Did the GPU finish any sooner?', beats, draw, check };
