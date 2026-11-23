import assert from 'node:assert/strict';

// Each row belongs to one GPU. One element is one chunk in this small ring.
const inputs = [
  [2, 1, 2, 0],
  [0, 2, 3, 1],
  [1, 0, 4, 2],
  [1, 3, 1, 2],
];
const slot = 2;
const count = inputs.length;
const next = (rank) => (rank + 1) % count;

function runChunk(column) {
  const first = next(column);
  const steps = [{ rank: first, value: inputs[first][column], contributors: [first], copies: [] }];
  for (let hop = 1; hop < count; hop++) {
    const previous = steps.at(-1);
    const rank = next(previous.rank);
    steps.push({
      rank,
      value: previous.value + inputs[rank][column],
      contributors: [...previous.contributors, rank],
      copies: hop === count - 1 ? [rank] : [],
    });
  }
  for (let hop = 1; hop < count; hop++) {
    const previous = steps.at(-1);
    const rank = next(previous.rank);
    steps.push({ ...previous, rank, copies: [...previous.copies, rank] });
  }
  return steps;
}

const chunks = inputs[0].map((_, column) => runChunk(column));
const route = chunks[slot];
const ranks = route.slice(0, count).map(({ rank }) => rank);

function resultAt(rank, column, step) {
  const part = chunks[column][step];
  return part.copies.includes(rank) ? part.value : null;
}

// Keep the unit from rank 3 visible in every partial and every copy.
const units = ranks.flatMap((rank) =>
  Array.from({ length: inputs[rank][slot] }, () => rank),
);

const beats = [
  {
    id: 'a-red-one',
    say: 'That red stroke is one unit of gradient on rank three. Follow it down to the two on rank zero. Both GPUs have a gradient for the same weight, in slot two.',
    hold: 0.75,
  },
  {
    id: 'the-next-neighbor',
    say: 'Three leaves rank zero. At the next GPU it meets three more. Trace the red stroke with your eye. It is still there inside the six.',
    hold: 1,
  },
  {
    id: 'the-last-addend',
    say: 'Rank two has four of its own. When the six gets there, what number should rank two keep?',
    hold: 1.45,
  },
  {
    id: 'the-owner',
    say: "Ten. Each GPU contributed once. Look at the result buffers. The other slots traveled at the same time, and each rank now holds one finished slot. That's reduce-scatter. Who else has the ten?",
    hold: 1.2,
  },
  {
    id: 'back-to-the-start',
    say: 'Look back up at rank three, where the red one started. A copy of the whole ten comes around the ring. Rank two still has its ten. Now rank three does too.',
    hold: 0.95,
  },
  {
    id: 'two-more-copies',
    say: 'Rank three passes a copy to zero. Zero passes a copy to one. Look along the four rows. Each ten carries that same red stroke.',
    hold: 1.1,
  },
  {
    id: 'read-the-buffers',
    say: "That's all-gather. Now read across any result buffer. Four, six, ten, five. Every GPU can use the same four gradients. Together, those two phases give us a sum all-reduce.",
    hold: 2.8,
  },
];

const ink = '#21284c';
const paleInk = '#515b72';
const red = '#c93820';
const paper = '#f7f4ed';
const blues = ['#3a548e', '#5d78ac', '#283c78'];
const lineColor = (rank) => rank === ranks[0] ? red : blues[rank];
const clamp = (n) => Math.min(1, Math.max(0, n));
const smooth = (p) => clamp(p) ** 2 * (3 - 2 * clamp(p));
const mix = (a, b, p) => a + (b - a) * p;
const lanes = [285, 457, 629, 801];
const lane = (rank) => lanes[ranks.indexOf(rank)];
const stops = [355, 563, 763, 976, 1216, 1406, 1555];
const pitch = 9.2;

function beatPosition(clock) {
  const reveal = (phrase, span) => smooth(clock.reveal(phrase, span));
  switch (clock.beat.id) {
    case 'a-red-one':
      return 0.27 + 0.38 * smooth(clock.elapsed / 2.6) + 0.35 * reveal('Follow it down', 2.25);
    case 'the-next-neighbor':
      return 1 + 0.51 * reveal('Three leaves', 1.3) + 0.49 * reveal('At the next GPU', 1.7);
    case 'the-last-addend':
      return 2 + 0.35 * smooth(clock.elapsed / 1.65) + 0.49 * reveal('When the six', 1.7)
        + 0.16 * reveal('should rank two keep', 1.05);
    case 'the-owner':
      return 3;
    case 'back-to-the-start':
      return 3 + 0.25 * smooth(clock.elapsed / 2.2) + 0.75 * reveal('where the red one started', 2.4);
    case 'two-more-copies':
      return 4 + reveal('Rank three passes', 1.9) + reveal('Zero passes', 1.85);
    case 'read-the-buffers':
      return 6;
    default:
      throw new Error('Unknown ring beat');
  }
}

function type(ctx, value, x, y, size, color = ink, align = 'left', family = 'Sans', weight = 500) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

function stroke(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function sheet(ctx) {
  const light = ctx.createLinearGradient(0, 0, 1460, 1080);
  light.addColorStop(0, '#fcfaf5');
  light.addColorStop(0.58, paper);
  light.addColorStop(1, '#eeeae1');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);

  type(ctx, 'One gradient around the ring', 62, 84, 73, ink, 'left', 'Serif', 500);
  type(ctx, 'NCCL', 1855, 87, 38, ink, 'right', 'Mono', 600);
  stroke(ctx, 62, 145, 1858, 145, '#a9a9ac', 1.5);

}

function score(ctx, outputAlpha) {
  // The lanes stay on the same sheet through both phases.
  for (const y of lanes) stroke(ctx, 347, y, 1581, y, '#d1ced0', 1.5);
  ctx.save();
  ctx.setLineDash([2.5, 10]);
  for (const x of stops.slice(1)) stroke(ctx, x, 223, x, 853, '#c9c7cc', 1.4);
  ctx.restore();
  type(ctx, 'Local gradients', 62, 184, 31);
  type(ctx, 'Slot 2', 353, 184, 34, ink, 'left', 'Serif', 600);
  type(ctx, 'one stroke per unit', 455, 184, 26, paleInk);
  ctx.save();
  ctx.globalAlpha = outputAlpha;
  type(ctx, 'Result buffers', 1616, 184, 31);
  ctx.restore();
}

function drawBuffer(ctx, rank, step, isResult) {
  const y = lane(rank);
  const x = isResult ? 1616 : 62;
  const w = 60;
  type(ctx, 'Rank ' + rank, x, y - 54, 34);
  for (let column = 0; column < count; column++) {
    const value = isResult ? resultAt(rank, column, step) : inputs[rank][column];
    const focused = column === slot;
    const cellX = x + column * w;
    const finished = isResult && value !== null;
    ctx.fillStyle = focused && finished ? ink
      : focused ? '#e5e5e8'
      : finished ? '#dfdfdd' : '#eeece6';
    ctx.fillRect(cellX, y - 27, w - 2, 55);
    if (value === null) {
      stroke(ctx, cellX + 22, y, cellX + 36, y, '#9f9fa9', 2.4);
    } else {
      const color = focused && finished ? '#fffdf6' : focused && rank === ranks[0] && !isResult ? red
        : focused ? ink : paleInk;
      type(ctx, value, cellX + (w - 2) / 2, y + 1, focused ? 41 : 37, color, 'center', 'Mono', focused ? 700 : 500);
    }
    if (focused) stroke(ctx, cellX + 1, y + 28, cellX + w - 3, y + 28, ink, 3);
  }
}

function reductionHeight(unit, step) {
  const rank = units[unit];
  const group = route[step];
  const joined = group.contributors.includes(rank);
  const from = units.indexOf(rank);
  const ordinal = joined ? unit : unit - from;
  const size = joined ? group.value : inputs[rank][slot];
  return lane(joined ? group.rank : rank) + (ordinal - (size - 1) / 2) * pitch;
}

// Flat tangents at both ends keep each ribbon horizontal as it enters a rank.
function ribbonSegment(ctx, x0, x1, y0, y1, fraction, color, width) {
  if (fraction <= 0) return;
  const samples = Math.max(2, Math.ceil(32 * fraction));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i <= samples; i++) {
    const p = fraction * i / samples;
    ctx.lineTo(mix(x0, x1, p), mix(y0, y1, smooth(p)));
  }
  ctx.stroke();
}

function drawRoute(ctx, phase, tail) {
  // A unit stays in its home lane until a neighbor brings a partial sum.
  for (let unit = units.length - 1; unit >= 0; unit--) {
    const rank = units[unit];
    const color = lineColor(rank);
    const width = rank === ranks[0] ? 7.8 : 4.3;

    for (let hop = 0; hop < count - 1; hop++) {
      // A local addend waits on its own row before the partial sum reaches it.
      if (ranks.indexOf(rank) > hop && phase < hop + 1) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ribbonSegment(ctx, stops[hop], stops[hop + 1], reductionHeight(unit, hop),
          reductionHeight(unit, hop + 1), 1, color, width);
        ctx.restore();
      }
      const fraction = clamp(phase - hop);
      ribbonSegment(ctx, stops[hop], stops[hop + 1], reductionHeight(unit, hop),
        reductionHeight(unit, hop + 1), fraction, color, width);
    }

    // Every earlier recipient retains its copy while the newest recipient forwards.
    const offset = (unit - (units.length - 1) / 2) * pitch;
    for (let hop = count - 1; hop < route.length - 1; hop++) {
      const fraction = clamp(phase - hop);
      const old = route[hop];
      for (const holder of old.copies) {
        ribbonSegment(ctx, stops[hop], stops[hop + 1], lane(holder) + offset,
          lane(holder) + offset, fraction, color, width);
      }
      ribbonSegment(ctx, stops[hop], stops[hop + 1], lane(old.rank) + offset,
        lane(route[hop + 1].rank) + offset, fraction, color, width);
    }
    if (phase >= 6) {
      for (const holder of route.at(-1).copies) {
        ribbonSegment(ctx, stops.at(-1), 1585, lane(holder) + offset,
          lane(holder) + offset, tail, color, width);
      }
    }
  }
}

function valueAtJoin(ctx, hop, opacity) {
  const point = route[hop];
  const x = stops[hop];
  const y = lane(point.rank) - point.value * pitch / 2 - 30;
  ctx.save();
  ctx.globalAlpha = opacity;
  // Mask the faint time ticks behind the numerals.
  ctx.fillStyle = paper;
  ctx.fillRect(x - 28, y - 25, 56, 48);
  type(ctx, point.value, x, y, 44, ink, 'center', 'Mono', 600);
  ctx.restore();
}

function phaseLabel(ctx, from, to, text, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  stroke(ctx, from, 895, to, 895, '#777c90', 1.7);
  for (const x of [from, to]) stroke(ctx, x, 886, x, 896, '#777c90', 1.7);
  type(ctx, text, (from + to) / 2, 928, 32, ink, 'center', 'Serif', 500);
  ctx.restore();
}

function draw(ctx, clock) {
  const phase = Math.min(6, beatPosition(clock));
  const step = Math.floor(phase);
  const closeup = clock.index === 6 ? smooth(clock.reveal('Now read across', 2.4)) : 0;
  const zoom = 2.31 - 0.81 * smooth(phase - 1) - 0.5 * smooth(phase - 2) + 1.31 * closeup;
  const outputAlpha = smooth((phase - 2.84) / 0.16);
  sheet(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 148, 1920, 932);
  ctx.clip();
  const anchor = mix(48, 1874, closeup);
  ctx.translate(anchor, 165);
  ctx.scale(zoom, zoom);
  ctx.translate(-anchor, -165);
  score(ctx, outputAlpha);
  for (const rank of ranks) {
    drawBuffer(ctx, rank, step, false);
    ctx.save();
    ctx.globalAlpha = outputAlpha;
    drawBuffer(ctx, rank, step, true);
    ctx.restore();
  }
  const tail = clock.index === 6 ? 1
    : clock.index === 5 ? smooth(clock.reveal('Look along', 0.7)) : 0;
  drawRoute(ctx, phase, tail);
  for (let hop = 1; hop <= step && hop < count; hop++) valueAtJoin(ctx, hop, 1);
  const reduceLabel = clock.index > 3 ? 1 : clock.index === 3 ? clock.reveal("That's reduce-scatter") : 0;
  const gatherLabel = clock.index === 6 ? 1 : clock.index === 5 ? clock.reveal('Look along') : 0;
  phaseLabel(ctx, stops[0], stops[3] - 6, 'Reduce-scatter', reduceLabel);
  phaseLabel(ctx, stops[3] + 6, stops[6], 'All-gather', gatherLabel);
  ctx.restore();
}

function check() {
  assert.deepEqual(ranks, [3, 0, 1, 2]);
  assert.deepEqual(route.map((step) => step.value), [1, 3, 6, 10, 10, 10, 10]);
  assert.equal(units.filter((rank) => rank === 3).length, 1);
  assert.equal(units.length, route[3].value);
  const sums = inputs[0].map((_, col) => inputs.reduce((sum, row) => sum + row[col], 0));
  assert.deepEqual(sums, [4, 6, 10, 5]);
  for (const [column, steps] of chunks.entries()) {
    assert.deepEqual(steps[3].contributors.toSorted(), [0, 1, 2, 3]);
    assert.deepEqual(steps[3].copies, [column]);
    assert.equal(steps[3].value, sums[column]);
    for (let hop = 4; hop <= 6; hop++) {
      assert.equal(steps[hop].rank, next(steps[hop - 1].rank));
      assert.deepEqual(steps[hop].copies, [...steps[hop - 1].copies, steps[hop].rank]);
      assert.equal(steps[hop].value, steps[3].value);
    }
  }
  for (const rank of ranks) {
    assert.deepEqual(chunks.map((_, col) => resultAt(rank, col, 6)), sums);
  }
}

export default { title: 'One gradient around the ring', beats, draw, check };
