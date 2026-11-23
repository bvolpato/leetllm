import assert from 'node:assert/strict';

const pageSize = 4;

// One decode step ends at the R1 and R2 cache states in the lesson fixture.
const requests = [
  { name: 'Request 1', pages: [11], tail: 1 },
  { name: 'Request 2', pages: [3, 14], tail: 4 },
];
const freePages = [6];

function length({ pages, tail }) {
  return (pages.length - 1) * pageSize + tail;
}

function append(request, free) {
  if (request.tail < pageSize) return { ...request, tail: request.tail + 1 };
  assert.ok(free.length, 'A full tail requires another physical page');
  return { ...request, pages: [...request.pages, free.shift()], tail: 1 };
}

function locations(request) {
  return Array.from({ length: length(request) }, (_, position) => ({
    page: request.pages[Math.floor(position / pageSize)],
    slot: position % pageSize,
  }));
}

const pool = [...freePages];
const next = requests.map((request) => append(request, pool));
const beats = [
  {
    id: 'incoming-pairs',
    say: 'Watch these two pairs drop. Each carries the key and value for one new token. Which request needs another cache page?',
    hold: 1.7,
  },
  {
    id: 'open-slot',
    say: 'Look beside the first token on page eleven. The new pair fits in the empty slot. Now look below it. All eight slots are taken.',
    hold: 1.1,
  },
  {
    id: 'page-six',
    say: 'Keep your eye on the lower pair. The serving engine adds page six to this request. Its first slot catches the ninth token.',
    hold: 1,
  },
  {
    id: 'page-list',
    say: 'Read the lower page list from the left. Three, fourteen, six. FlashInfer follows that order. The engine also supplies the last page length. Here it says one, so the history ends at the orange pair.',
    hold: 1.1,
  },
  {
    id: 'query-reach',
    say: 'Each new token also has a query. Trace the keys each query can attend to. The upper one reaches two. The lower one reaches nine, right up to its own key on page six.',
    hold: 2.2,
  },
];

const ink = '#242046';
const muted = '#554e72';
const coral = '#bc3d24';
const plateWidth = 424;
const pitch = 101;
const rim = 10;
const pageY = [332, 708];
const gap = 31;
const firstLong = 378;
const lastLong = firstLong + 2 * (plateWidth + gap);
// Line up both incoming pairs. Their destinations have different slot indices.
const pageLeft = (row, n) =>
  row === 0 ? lastLong - pitch : firstLong + n * (plateWidth + gap);
const slotLeft = (row, position) =>
  pageLeft(row, Math.floor(position / pageSize)) + rim + pitch * (position % pageSize);

function ease(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

function since(clock, index, phrase, span) {
  if (clock.index === index) return ease(clock.reveal(phrase, span));
  return Number(clock.index > index);
}

function label(ctx, value, x, y, size, color, opts = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${opts.weight ?? 500} ${size}px "${opts.font ?? 'Lesson Sans'}"`;
  ctx.textAlign = opts.align ?? 'left';
  ctx.fillText(value, x, y);
  ctx.restore();
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (!index) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function background(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1740, 1080, [
    [0, '#f6f1ff'], [0.48, '#ebe8fb'], [1, '#d2dcf1'],
  ]);
  ctx.fillRect(0, 0, 1920, 1080);
}

// The four deep sockets belong to one physical page. Its ID is printed on the edge.
function page(ctx, x, y, id, selected) {
  const w = plateWidth;
  const h = 126;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = '#35325744';
  ctx.shadowBlur = 19;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 13;
  polygon(ctx, [[18, 0], [w + 18, 0], [w, h + 51], [0, h + 51]], '#555279');
  ctx.shadowColor = 'transparent';
  polygon(ctx, [[w + 18, 0], [w + 18, 51], [w, h + 51], [w, h]], '#363658');
  ctx.fillStyle = gradient(ctx, 0, h, 2, h + 51, [[0, '#555b87'], [1, '#3c4168']]);
  ctx.fillRect(0, h - 1, w, 53);
  if (selected > 0) {
    ctx.save();
    ctx.globalAlpha = selected;
    ctx.fillStyle = '#352b77';
    ctx.fillRect(0, h - 1, w, 53);
    ctx.fillStyle = '#c4bdff';
    ctx.fillRect(0, h + 46, w, 6);
    ctx.restore();
  }
  label(ctx, `page ${id}`, 14, h + 39, 40, '#ffffff', { font: 'Lesson Mono' });
  ctx.save();
  ctx.transform(1, 0, -18 / h, 1, 18, 0);
  ctx.fillStyle = gradient(ctx, 0, 0, w, h, [[0, '#b3bcdf'], [0.45, '#d2d7f2'], [1, '#a4adcf']]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fbfbff';
  ctx.fillRect(1, 0, w - 2, 3);
  for (let i = 0; i < pageSize; i++) {
    const left = rim + i * pitch;
    ctx.fillStyle = '#666a91';
    ctx.fillRect(left, 9, pitch - 6, 106);
    ctx.fillStyle = '#9b9ec0';
    ctx.fillRect(left + 3, 15, pitch - 9, 100);
    for (let k = 0; k < 5; k++) {
      line(ctx, left + 20 + k * 11, 61, left + 10 + k * 11, 76, '#b6b9d4', 3);
    }
  }
  ctx.restore();
  ctx.restore();
}

// Each token exposes two bands of vector components. The two requests have distinct payloads.
const oldColors = ['#34376f', '#525a9b', '#8e9bd3', '#b3c5f3', '#d6e7ff'];
const newColors = ['#70213e', '#a33643', '#c85048', '#ffb687', '#ffdfab'];
function token(ctx, x, y, row, position, isNew) {
  ctx.save();
  ctx.transform(1, 0, -18 / 126, 1, x + 18, y);
  const w = pitch - 6;
  const h = 105;
  ctx.shadowColor = isNew ? '#733a4d42' : '#28245045';
  ctx.shadowOffsetY = 5;
  ctx.shadowBlur = 6;
  ctx.fillStyle = isNew ? '#8b3240' : '#383965';
  ctx.fillRect(0, 6, w, h);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = gradient(ctx, 0, 0, w, h, isNew
    ? [[0, '#ffb176'], [0.5, '#ff8c68'], [1, '#f67763']]
    : [[0, '#656ac1'], [0.5, '#585aa1'], [1, '#414c87']]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = isNew ? '#ffeac4' : '#b7c8f3';
  ctx.fillRect(0, 0, w, 3);
  label(ctx, `t${position}`, 9, 37, 33, isNew ? '#541c32' : '#fff5ff', {
    weight: 600, font: 'Lesson Mono',
  });
  const palette = isNew ? newColors : oldColors;
  for (let band = 0; band < 2; band++) {
    const top = 49 + band * 27;
    ctx.fillStyle = isNew ? '#753544' : '#414a79';
    ctx.fillRect(8, top, w - 16, 19);
    for (let channel = 0; channel < 6; channel++) {
      const code = 13 * (row + 1) + 17 * (position + 1) + 29 * (band + 1);
      const shade = (code * (channel + 3) + channel * channel + band) % palette.length;
      ctx.fillStyle = palette[shade];
      ctx.fillRect(10 + channel * 13, top + 2, 11, 15);
    }
  }
  ctx.restore();
}

function readRange(ctx, row, extent) {
  const request = next[row];
  if (extent <= 0) return;
  const y = pageY[row] + 208;
  const start = slotLeft(row, 0);
  const current = Math.ceil(extent) - 1;
  const stop = slotLeft(row, current) + (extent - current) * (pitch - 6);
  line(ctx, start, y - 15, start, y, ink, 4);
  line(ctx, start, y, stop, y, ink, 5);
  line(ctx, stop, y + 2, stop, y - 19, coral, 7);
  if (extent >= length(request)) {
    label(ctx, `${length(request)} keys`, (start + stop) / 2, y + 48, 42, ink, { align: 'center' });
  }
}

function laneLabel(ctx, row, written, allocated) {
  const old = requests[row];
  const history = written ? next[row] : old;
  const count = allocated ? next[row].pages.length : old.pages.length;
  const x = row === 0 ? 752 : 89;
  const y = pageY[row] + 46;
  label(ctx, old.name, x, y, 56, ink, { font: 'Lesson Serif' });
  label(ctx, `${length(history)} token${length(history) === 1 ? '' : 's'}`, x, y + 56, 40, muted);
  label(ctx, `${count} page${count === 1 ? '' : 's'}`, x, y + 101, 35, muted);
}

function draw(ctx, clock) {
  const descent = ease(clock.elapsed / 2.1);
  const approach = clock.index === 0 ? descent : 1;
  const upperDrop = since(clock, 1, 'Look beside', 1.5);
  const pageSlide = since(clock, 2, 'Keep your eye', 2.25);
  const lowerDrop = since(clock, 2, 'adds page six', 1.1);
  let pageFocus = [0, 0, 0];
  if (clock.index === 3) {
    const turns = ['Three', 'fourteen', 'six'].map((phrase) => ease(clock.reveal(phrase, 0.25)));
    pageFocus = [turns[0] - turns[1], turns[1] - turns[2], turns[2]];
  }
  const span = since(clock, 4, 'Trace the keys', 3.5);
  background(ctx);
  label(ctx, 'FlashInfer', 88, 125, 76, ink, { font: 'Lesson Serif' });
  label(ctx, 'Paged decode', 91, 181, 40, muted);
  label(ctx, '4 slots per page', 1800, 128, 37, muted, { align: 'right' });

  for (let row = 0; row < requests.length; row++) {
    const old = requests[row];
    const target = next[row];
    const y = pageY[row];
    const drop = row === 0 ? upperDrop : lowerDrop;
    const written = drop >= 1;
    laneLabel(ctx, row, written, row === 0 || pageSlide >= 1);
    for (const [p, id] of target.pages.entries()) {
      const fresh = !old.pages.includes(id);
      if (fresh && pageSlide <= 0) continue;
      const x = pageLeft(row, p);
      ctx.save();
      if (fresh) {
        ctx.globalAlpha = Math.min(1, pageSlide * 3);
        ctx.translate(250 * (1 - pageSlide), 40 * (1 - pageSlide));
      }
      page(ctx, x, y, id, row === 1 ? pageFocus[p] : 0);
      ctx.restore();
    }
    for (let pos = 0; pos < length(old); pos++) {
      token(ctx, slotLeft(row, pos), y + 8, row, pos, false);
    }
    const pos = length(old);
    const restX = slotLeft(row, pos);
    const entryRise = row === 0 ? 60 : 7;
    const lift = (1 - drop) * (146 + (1 - approach) * entryRise);
    const incomingX = restX + (1 - approach) * 92;
    if (drop < 1) {
      ctx.save();
      ctx.globalAlpha = 0.44 * (1 - drop);
      ctx.setLineDash([4, 8]);
      line(ctx, restX + 54, y + 23, restX + 54, y - 33, coral, 3);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(incomingX + 48, y + 58 - lift);
    const magnification = 1 + 0.78 * (1 - approach);
    ctx.scale(magnification, magnification);
    token(ctx, -48, -50, row, pos, true);
    ctx.restore();
    if (row === 0 && clock.index === 0) {
      const appear = since(clock, 0, 'Each carries', 0.4);
      ctx.save();
      ctx.globalAlpha = appear;
      for (const [i, name] of ['key', 'value'].entries()) {
        const yy = y + 8 - lift + 59 + 27 * i;
        line(ctx, incomingX + 108, yy, incomingX + 184, yy + (i ? 11 : -11), coral, 2);
        label(ctx, name, incomingX + 198, yy + (i ? 22 : -2), 39, ink);
      }
      ctx.restore();
    }
    if (row === 1 && clock.index === 3) {
      const showTail = ease(clock.reveal('the last page length', 0.6));
      const x = pageLeft(row, target.pages.length - 1) + rim;
      const end = x + target.tail * pitch - 6;
      const baseline = y + 207;
      ctx.save();
      ctx.globalAlpha = showTail;
      line(ctx, x, baseline - 14, x, baseline, coral, 4);
      line(ctx, x, baseline, end, baseline, coral, 4);
      line(ctx, end, baseline, end, baseline - 14, coral, 4);
      label(ctx, `${target.tail} valid slot`, x, baseline + 44, 38, ink);
      ctx.restore();
    }
    if (clock.index === 4) readRange(ctx, row, Math.min(length(target), span * length(next[1])));
  }
}

function check() {
  assert.deepEqual(requests.map(length), [1, 8]);
  assert.deepEqual(next.map(length), [2, 9]);
  assert.deepEqual(next.map(({ pages }) => pages), [[11], [3, 14, 6]]);
  assert.deepEqual(next.map(({ tail }) => tail), [2, 1]);
  assert.deepEqual(pool, []);
  assert.deepEqual(next.map((r) => locations(r).at(-1)), [{ page: 11, slot: 1 }, { page: 6, slot: 0 }]);
  const keys = next.map(locations);
  assert.deepEqual(keys.map((row) => row.length), [2, 9]);
  assert.equal(keys[1].filter(({ page }) => page === 6).length, 1);
  assert.equal(new Set(keys.flat().map(({ page, slot }) => `${page}/${slot}`)).size, 11);
  assert.equal(slotLeft(0, length(requests[0])), slotLeft(1, length(requests[1])));
}

export default { title: 'Where the ninth token lands', beats, draw, check };
