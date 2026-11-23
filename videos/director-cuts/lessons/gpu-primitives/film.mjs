import assert from 'node:assert/strict';

// One ten-pixel scanline from the bill, encoded as (palette entry, run length).
const runs = [
  { color: 'Y', length: 3 },
  { color: 'C', length: 1 },
  { color: 'O', length: 4 },
  { color: 'T', length: 2 },
];
const palette = {
  Y: '#f6be46', C: '#fff1c7', O: '#f16b30', T: '#2e2b42',
  y: '#e3a137', g: '#ffd778', o: '#c74431', r: '#9c3a45',
  n: '#1d2d46', b: '#304461', m: '#405d78', t: '#568997',
  i: '#76acaa', w: '#f5e5ba', k: '#dab786', e: '#f9bd69',
  v: '#60574f', h: '#745b46', s: '#ac8157', a: '#dab789',
};

// In each snapshot, [first, past) identifies the input runs in that lane's sum.
const lengths = runs.map(({ length }) => length);
const stages = [lengths.map((count, lane) => ({ first: lane, past: lane + 1, count }))];
for (let stride = 1; stride < runs.length; stride *= 2) {
  const previous = stages.at(-1);
  stages.push(previous.map((own, lane) => {
    if (lane < stride) return own;
    const left = previous[lane - stride];
    return { first: left.first, past: own.past, count: left.count + own.count };
  }));
}
const inclusive = stages.at(-1).map(({ count }) => count);
const starts = [0, ...inclusive.slice(0, -1)];
const width = inclusive.at(-1);

const beats = [
  { id: 'unpainted-row', say: "One row of this toucan's bill still needs paint. Here's how it arrived. Three yellow pixels, one cream, four orange, and two for the dark tip.", hold: 0.9 },
  { id: 'orange-lane', say: "Give each run of color to a GPU lane. Look at the orange one. Four tells that lane how many pixels to paint. Which pixel should it start on?", hold: 1.65 },
  { id: 'one-lane-left', say: "Look one lane to the left. Each lane with a left neighbor adds that neighbor's count to its own. Watch cream join orange. One plus four gives five. All the lanes read the same starting row.", hold: 0.8 },
  { id: 'two-lanes-left', say: "Keep those sums. This time reach two lanes to the left. Orange picks up three from the yellow lane. Eight counts every pixel from the start through the last orange one. At the tip, four joins six to make ten.", hold: 0.85 },
  { id: 'find-the-edge', say: "Those sums mark the end of each run. That's an inclusive prefix scan. Yellow starts at zero. Each other color starts where the previous one ends. Find the end of cream. Where will orange start?", hold: 1.8 },
  { id: 'paint-the-bill', say: "Let the lanes paint. Orange starts at pixel four and fills through pixel seven. Eight and nine belong to the dark tip. Each lane's starting position counts the pixels before its run. That's its exclusive prefix sum.", hold: 3.25 },
];

// Each entry gives the first occupied column and the pixels on that raster line.
// The bill is a separate layer so both the sprite and its magnification read it.
const plumage = [
  [10, 'nnnn'], [8, 'nbbbmmnn'], [7, 'nbbmmmmbbn'],
  [6, 'nbbbmtteebb'], [6, 'nbbbtewnenn'], [6, 'nbbbbteekww'],
  [6, 'nbmmnbbwwwww'], [6, 'nbmbbnwwwwww'],
  [5, 'nbbbbnwwwww'], [5, 'nbmmmnwwwww'], [4, 'nbmmbbnwwww'],
  [4, 'nbmmmmbnkww'], [3, 'nbmttmmbnkww'], [3, 'nbmttmmnbnkw'],
  [3, 'nbmmtmnbbnkk'], [2, 'nbmmmbbnbnnr'], [2, 'nbmbbnbnnnr'],
  [1, 'nbbbnbnnnnr'], [1, 'nbbnbnnnno'], [0, 'nbbnbnnnn'],
  [0, 'nnbnnnnn'], [-1, 'nbnnn'], [-1, 'nnnn'], [-2, 'nnn'],
];
const billColumn = 16;
const billRow = 5;
const billRows = [
  [2, 16, 'gggggg'], [3, 16, 'YgggggYYo'],
  [4, 16, 'YYgCCOOOOT'], [6, 16, 'yyYOOOOOTT'],
  [7, 16, 'yoooorrTT'], [8, 16, 'ooorrTTT'], [9, 21, 'TT'],
];
const perch = [
  [17, 18, 'a'], [18, 16, 'aas'], [19, 13, 'aassh'],
  [20, 9, 'aaasssh'], [21, 5, 'aaaasssh'], [22, 1, 'aaasssshh'],
  [23, -3, 'aaasssshhh'], [24, -7, 'aaasssshhh'], [25, -11, 'aaasssshhh'],
  [26, -15, 'aaasssshhh'], [27, -19, 'aaasssshhh'], [28, -23, 'aaasssshhh'],
];
const feet = [
  [18, 9, 'i..i'], [19, 9, 't..t'], [20, 8, 'ttiit'],
  [21, 8, 't.t.t'],
];

const paper = '#e1f0ed';
const ink = '#1e3545';
const quiet = '#4a676e';
const line = '#85a7a6';
const accent = '#ba4925';
const sprite = { x: -6, y: 121, cell: 34 };
const magnifier = { x: 969, y: 221, cell: 84 };
const laneXs = [1044, 1273, 1502, 1731];
const bandUnit = 20;
const upper = 654;
const lower = 781;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function text(ctx, value, x, y, size, { align = 'left', color = ink, mono = false, weight = 500 } = {}) {
  ctx.font = `${weight} ${size}px "Lesson ${mono ? 'Mono' : 'Sans'}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

function stroke(ctx, points, color, weight = 2) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function withAlpha(ctx, opacity, draw) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(opacity);
  draw();
  ctx.restore();
}

function background(ctx) {
  const light = ctx.createLinearGradient(0, 0, 1920, 800);
  light.addColorStop(0, '#c2e4e4');
  light.addColorStop(0.65, paper);
  light.addColorStop(1, '#f3f4e8');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
  // Sparse intersections keep the source bitmap's pitch visible in the open field.
  for (let x = sprite.x; x < 940; x += sprite.cell) {
    for (let y = sprite.y % sprite.cell; y < 1080; y += sprite.cell) {
      ctx.fillStyle = 'rgba(46,97,105,0.15)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function raster(ctx, x, y, row) {
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '.') continue;
    ctx.fillStyle = palette[row[i]];
    ctx.fillRect(sprite.x + (x + i) * sprite.cell, sprite.y + y * sprite.cell, sprite.cell, sprite.cell);
  }
}

function blankCell(ctx, x, y, cell) {
  ctx.fillStyle = '#d4e3dc';
  ctx.fillRect(x, y, cell, cell);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, cell, cell);
  ctx.clip();
  for (let d = 0; d < cell * 2; d += cell / 4) {
    stroke(ctx, [[x + d - cell, y + cell], [x + d, y]], '#b2c8c1', Math.max(1, cell / 35));
  }
  ctx.restore();
}

function decodedRow(ctx, x, y, cell, paint) {
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    for (let j = 0; j < run.length; j++) {
      const left = x + (starts[i] + j) * cell;
      blankCell(ctx, left, y, cell);
      const fill = clamp(paint * run.length - j);
      if (fill > 0) {
        ctx.fillStyle = palette[run.color];
        ctx.fillRect(left, y, fill * cell, cell);
      }
    }
  }
}

function toucan(ctx, develop, paint, finish) {
  ctx.save();
  // When the work is done the camera leaves the registers and settles on the sprite.
  ctx.translate(490 * finish, -25 * finish);
  ctx.scale(1 + 0.05 * finish, 1 + 0.05 * finish);
  for (const [y, x, row] of perch) raster(ctx, x, y, row);
  for (const [y, x, row] of feet) raster(ctx, x, y, row);
  plumage.forEach(([x, row], y) => raster(ctx, x, y, row));
  for (const [y, x, row] of billRows) {
    withAlpha(ctx, 0.22, () => raster(ctx, x, y, row));
    const length = Math.max(0, Math.ceil(develop * width) - (x - billColumn));
    raster(ctx, x, y, row.slice(0, length));
  }
  decodedRow(ctx, sprite.x + billColumn * sprite.cell, sprite.y + billRow * sprite.cell, sprite.cell, paint);
  ctx.restore();
}

function detail(ctx, develop, paint, edges, focus, showIndices, endsOpacity, litRun) {
  const sx = sprite.x + (billColumn + width) * sprite.cell;
  const sy = sprite.y + billRow * sprite.cell;
  const { x, y, cell } = magnifier;
  const size = width * cell;
  stroke(ctx, [[sx + 5, sy], [x - 12, y]], line);
  stroke(ctx, [[sx + 5, sy + sprite.cell], [x - 12, y + cell]], line);
  text(ctx, 'Bill pixels', x, 90, 49, { weight: 600 });
  withAlpha(ctx, showIndices, () => {
    for (let i = 0; i < width; i++) text(ctx, i, x + (i + 0.5) * cell, y - 64, 39, { align: 'center', mono: true });
  });
  // Slivers of the adjacent raster lines identify the magnification after the cut in.
  withAlpha(ctx, 0.45, () => {
    for (const [row, top] of [[billRow - 1, y - 31], [billRow + 1, y + cell]]) {
      const pixels = billRows.find(([r]) => r === row)[2];
      for (let i = 0; i < width; i++) {
        ctx.fillStyle = palette[pixels[i]];
        withAlpha(ctx, i < Math.ceil(develop * width) ? 1 : 0.22, () => ctx.fillRect(x + i * cell, top, cell, 31));
      }
    }
  });
  decodedRow(ctx, x, y, cell, paint);
  for (let i = 0; i <= width; i++) stroke(ctx, [[x + i * cell, y], [x + i * cell, y + cell]], '#78918d', 1.5);
  stroke(ctx, [[x, y], [x + size, y]], quiet, 2);
  stroke(ctx, [[x, y + cell], [x + size, y + cell]], quiet, 2);
  if (litRun !== null) {
    const left = x + cell * starts[litRun];
    const right = x + cell * inclusive[litRun];
    stroke(ctx, [[left + 2, y - 7], [left + 2, y - 18], [right - 2, y - 18], [right - 2, y - 7]], ink, 4);
  }
  withAlpha(ctx, endsOpacity, () => {
    for (const n of edges) {
      const xx = x + n * cell;
      const selected = focus && n === starts[2];
      stroke(ctx, [[xx, y + cell + 1], [xx, y + cell + 45]], selected ? accent : ink, selected ? 5 : 3);
      text(ctx, n, xx, y + cell + 67, selected ? 49 : 41, { mono: true, align: 'center', color: selected ? accent : ink });
    }
  });
}

function pixels(ctx, interval, x, y) {
  let pos = x;
  for (let run = interval.first; run < interval.past; run++) {
    for (let j = 0; j < runs[run].length; j++) {
      ctx.fillStyle = palette[runs[run].color];
      ctx.fillRect(pos, y, bandUnit, 30);
      ctx.strokeStyle = 'rgba(37,53,68,0.48)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pos + 0.75, y + 0.75, bandUnit - 1.5, 28.5);
      pos += bandUnit;
    }
  }
}

function register(ctx, interval, x, y) {
  pixels(ctx, interval, x - interval.count * bandUnit / 2, y);
  // When a result becomes the next input, carry its number around to the upper side.
  const labelOffset = mix(-55, 65, clamp((y - upper) / (lower - upper)));
  text(ctx, interval.count, x, y + labelOffset, 63, { mono: true, align: 'center' });
}

function snapshot(ctx, stage, y) {
  stage.forEach((span, lane) => register(ctx, span, laneXs[lane], y));
}

function exchange(ctx, level, t, inspectLane, emphasis) {
  const source = stages[level - 1];
  const result = stages[level];
  const stride = 2 ** (level - 1);
  if (inspectLane !== null) {
    // Trace just the two reads for the sum that the voice is following.
    withAlpha(ctx, emphasis, () => {
      const to = laneXs[inspectLane];
      const from = laneXs[inspectLane - stride];
      const sourceY = upper + 38;
      const destY = lower - 9;
      stroke(ctx, [[from, sourceY], [from, sourceY + 8], [to - 19, destY - 8], [to - 19, destY]], quiet, 3.5);
      stroke(ctx, [[to, sourceY], [to, destY]], quiet, 3.5);
    });
  }
  snapshot(ctx, source, upper);

  result.forEach((span, lane) => {
    const dest = laneXs[lane] - span.count * bandUnit / 2;
    const left = lane >= stride ? source[lane - stride] : null;
    const own = source[lane];
    function copy(part, from, to, travel) {
      const start = laneXs[from] - part.count * bandUnit / 2;
      const px = mix(start, to, travel);
      const py = mix(upper, lower, travel);
      withAlpha(ctx, Math.min(1, travel * 5), () => pixels(ctx, part, px, py));
    }
    if (left) copy(left, lane - stride, dest, ease((t - 0.24) / 0.76));
    copy(own, lane, dest + (left?.count ?? 0) * bandUnit, ease(t / 0.62));
    withAlpha(ctx, ease((t - 0.7) / 0.3), () => {
      text(ctx, span.count, laneXs[lane], lower + 65, 63, { mono: true, align: 'center' });
    });
  });
}

function lanes(ctx, clock) {
  const { index, reveal } = clock;
  const title = ['Run lengths', 'Run lengths', 'Read one lane left', 'Read two lanes left', 'Run ends', 'Run starts'][index];
  text(ctx, title, magnifier.x, 447, 48, { weight: 600 });
  laneXs.forEach((x, i) => text(ctx, `Lane ${i}`, x, 531, 39, { align: 'center', color: quiet }));

  if (index < 2) {
    stages[0].forEach((span, i) => {
      const enter = index === 0 ? ease((clock.elapsed - i * 0.08) / 0.48) : 1;
      withAlpha(ctx, enter, () => register(ctx, span, laneXs[i], upper + 15 * (1 - enter)));
    });
    if (index === 1) {
      withAlpha(ctx, reveal('Look at the orange one'), () => {
        const x = laneXs[2];
        stroke(ctx, [[x - 52, upper + 42], [x + 52, upper + 42]], accent, 5);
      });
    }
    return;
  }
  if (index === 2) {
    exchange(ctx, 1, reveal('Each lane with a left neighbor', 1.5), 2, reveal('Watch cream join orange'));
    return;
  }
  if (index === 3) {
    const lift = ease(reveal('Keep those sums', 0.85));
    if (lift < 1) {
      withAlpha(ctx, 1 - lift, () => snapshot(ctx, stages[0], upper));
      snapshot(ctx, stages[1], mix(lower, upper, lift));
    } else {
      const tip = reveal('At the tip') > 0;
      exchange(ctx, 2, reveal('reach two lanes to the left', 1.6), tip ? 3 : 2, tip ? reveal('At the tip') : reveal('Orange picks up three'));
    }
    return;
  }
  if (index === 4) {
    const lift = ease(reveal('Those sums mark the end', 0.85));
    withAlpha(ctx, 1 - lift, () => snapshot(ctx, stages[1], upper));
    snapshot(ctx, stages[2], mix(lower, upper, lift));
    return;
  }

  runs.forEach((run, i) => {
    const x = laneXs[i];
    pixels(ctx, stages[0][i], x - run.length * bandUnit / 2, upper);
    text(ctx, starts[i], x, upper - 55, 63, { align: 'center', mono: true, color: i === 2 ? accent : ink });
  });
}

function draw(ctx, clock) {
  background(ctx);
  const { index, reveal } = clock;
  const develop = index === 0 ? ease(clock.elapsed / 1.15) : 1;
  const paint = index === 5 ? ease(reveal('Let the lanes paint', 1.2)) : 0;
  const finish = index === 5 ? ease(clamp((clock.elapsed - clock.speechDuration) / 1.15)) : 0;
  toucan(ctx, develop, paint, finish);

  let ends = index === 5 ? 1 : 0;
  let zero = index === 5;
  let focus = index === 5;
  if (index === 4) {
    ends = ease((reveal('mark the end of each run', 1.3) - 0.78) / 0.22);
    zero = reveal('Yellow starts at zero') > 0;
    focus = reveal('Find the end of cream') > 0;
  }
  const indices = index === 0 ? 0 : index === 1 ? reveal('Which pixel should it start on') : 1;
  let litRun = null;
  if (index === 5 && reveal('Orange starts at pixel four') > 0) {
    litRun = reveal('Eight and nine') > 0 ? 3 : 2;
    if (reveal("Each lane's starting position") > 0) litRun = null;
  }
  withAlpha(ctx, 1 - ease(finish * 2), () => {
    detail(ctx, develop, paint, zero ? [0, ...inclusive] : inclusive, focus, indices, ends, litRun);
    lanes(ctx, clock);
  });
}

function check() {
  assert.deepEqual(stages.map(stage => stage.map(x => x.count)), [[3,1,4,2], [3,4,5,6], [3,4,8,10]]);
  assert.deepEqual(starts, [0,3,4,8]);
  // Reconstruct the scanline by lane address, detecting overlaps and holes.
  const bitmap = Array(width).fill(null);
  for (const [lane, run] of runs.entries()) {
    for (let p = starts[lane]; p < starts[lane] + run.length; p++) {
      assert.equal(bitmap[p], null);
      bitmap[p] = run.color;
    }
    assert.equal(starts[lane] + run.length, inclusive[lane]);
  }
  assert.equal(bitmap.join(''), 'YYYCOOOOTT');
  for (const stage of stages) {
    for (const span of stage) {
      assert.equal(span.count, lengths.slice(span.first, span.past).reduce((a, b) => a + b, 0));
    }
  }
  for (const row of [billRow - 1, billRow + 1]) {
    const [, x, pixels] = billRows.find(([y]) => y === row);
    assert.equal(x, billColumn);
    assert.equal(pixels.length, width);
  }
}

export default { title: 'Where does the orange start? A GPU prefix scan', beats, draw, check };
