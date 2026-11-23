import assert from 'node:assert/strict';
import { cleanupFixture, cleanupTransition } from '../../../films/sandbox-execution/model.mjs';

const title = 'Who is still drawing the fish?';
const beats = [
  {
    id: 'cancel',
    say: 'Keep your eye on the tail. I just canceled this run of the sprite maker. Who is still drawing?',
    hold: 1.15,
  },
  {
    id: 'painter',
    say: 'The generated program started a helper to paint the fish. The main process has exited. The helper is still writing those orange pixels to disk.',
    hold: 0.7,
  },
  {
    id: 'still',
    say: 'Watch where the orange stripe stops. Outside the sandbox, the supervisor stops the helper and checks the whole job for live processes. Zero. So why is the fish still here?',
    hold: 1.55,
  },
  {
    id: 'scratch',
    say: 'That picture is a file. It stays on the scratch disk after the last process exits. Scratch is the only storage this job can change. The supervisor replaces it and checks the new volume. Empty.',
    hold: 1.25,
  },
  {
    id: 'new-water',
    say: 'Now we can reuse slot A. See the number change? Run eight gets the empty disk and starts drawing a blue ray.',
    hold: 0.85,
  },
  {
    id: 'late-cleanup',
    say: 'A cleanup retry just arrived for this same slot. Read the run number on it. Seven. The supervisor checks which run owns the slot and skips the old request. Watch eight finish the wing.',
    hold: 2.6,
  },
];

// Pixel coordinates describe the sprites at their native resolution. Each new
// column becomes part of the scratch file when the painter writes it.
const columns = 76;
const rows = 44;
const ink = '#292a4c';
const koiColors = [null, ink, '#a64538', '#f4652f', '#ffa252', '#ffe3b0', '#fff4d7', '#cdb9a8', '#695564', '#ffffe9'];
const rayColors = [null, '#192a54', '#294e99', '#3778be', '#53b0cd', '#a0e5df', '#d6f5e8', '#5774a7', '#344774', '#f4fff4'];

function makeSprite(palette, illustrate) {
  const pixels = Array.from({ length: rows }, () => new Uint8Array(columns));
  function polygon(color, vertices) {
    for (let row = 0; row < rows; row++) {
      const y = row + 0.5;
      const intersections = [];
      for (let i = 0; i < vertices.length; i++) {
        const [ax, ay] = vertices[i];
        const [bx, by] = vertices[(i + 1) % vertices.length];
        if ((ay > y) !== (by > y)) intersections.push(ax + (bx - ax) * (y - ay) / (by - ay));
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        pixels[row].fill(color, Math.max(0, Math.ceil(intersections[i] - 0.5)), Math.min(columns, Math.ceil(intersections[i + 1] - 0.5)));
      }
    }
  }
  function dot(color, x, y, width = 1) {
    pixels[y].fill(color, x, x + width);
  }
  illustrate(polygon, dot);
  return { palette, pixels };
}

const koi = makeSprite(koiColors, (p, dot) => {
  // The translucent rays in the tail fan out from its narrow base.
  p(1, [[45,22],[53,22],[57,18],[62,13],[71,8],[74,8],[71,15],[67,21],[63,25],[68,26],[73,29],[75,33],[68,34],[59,32],[52,29],[46,28]]);
  p(3, [[48,24],[54,23],[59,18],[65,13],[72,9],[69,15],[62,23],[58,25],[65,26],[72,30],[74,32],[68,33],[59,30],[53,28],[48,27]]);
  p(4, [[52,25],[58,22],[63,16],[69,12],[65,17],[61,22],[58,25]]);
  p(5, [[53,25],[60,24],[67,19],[64,23],[59,26]]);
  p(2, [[55,26],[60,26],[71,31],[66,30],[59,28]]);
  p(5, [[54,26],[59,27],[68,32],[62,30]]);
  // Dorsal and pelvic fins sit behind the body.
  p(1, [[13,15],[18,10],[24,6],[25,9],[30,5],[31,9],[37,7],[39,13],[44,18],[33,18]]);
  p(3, [[15,15],[22,9],[24,8],[24,11],[30,7],[30,11],[36,9],[39,14],[42,17]]);
  p(4, [[20,13],[24,10],[22,15]]);
  p(4, [[27,12],[30,9],[29,14]]);
  p(1, [[31,29],[43,29],[47,35],[48,38],[42,37],[35,34]]);
  p(4, [[34,30],[42,31],[46,36],[40,34]]);
  p(1, [[3,23],[5,21],[6,18],[12,15],[17,14],[22,12],[31,12],[38,14],[44,17],[49,21],[54,23],[56,25],[54,28],[48,28],[43,31],[37,32],[31,34],[20,34],[14,32],[8,30],[5,27],[3,26]]);
  p(7, [[4,24],[7,19],[13,16],[22,14],[31,13],[38,15],[44,18],[50,22],[55,24],[54,27],[47,27],[41,30],[31,33],[21,33],[14,31],[8,29],[6,26]]);
  p(5, [[5,23],[8,19],[14,16],[23,13],[31,13],[37,15],[43,18],[49,22],[53,24],[48,26],[42,28],[32,31],[22,32],[15,30],[9,28],[6,26]]);
  p(6, [[7,22],[11,18],[17,16],[25,14],[31,14],[38,16],[44,20],[40,23],[31,24],[23,27],[14,27],[9,25]]);
  p(3, [[8,19],[14,16],[21,14],[25,13],[23,16],[20,17],[20,20],[16,21],[15,24],[12,23],[11,21],[8,21]]);
  p(4, [[10,19],[16,16],[21,15],[18,17],[15,17],[14,19]]);
  p(2, [[16,21],[20,19],[18,22],[15,24]]);
  p(3, [[24,17],[28,16],[29,13],[33,14],[34,16],[38,16],[40,18],[38,21],[34,22],[33,25],[28,27],[24,26],[24,23],[21,22],[22,19]]);
  p(4, [[25,19],[29,17],[31,14],[33,15],[30,18],[27,19]]);
  p(2, [[24,23],[28,24],[33,21],[36,21],[32,25],[28,27],[24,26]]);
  p(1, [[34,17],[36,16],[39,17],[38,19],[35,20],[32,19]]);
  p(8, [[34,17],[37,17],[36,18],[34,18]]);
  p(3, [[40,21],[42,19],[45,19],[48,22],[53,23],[54,25],[50,26],[46,25],[43,27],[39,27],[38,24]]);
  p(2, [[43,26],[47,24],[50,25],[47,27],[42,29],[39,28]]);
  // A few scales, a gill and a near-side fin give the body its turn.
  for (const [x,y] of [[19,25],[22,27],[27,22],[30,20],[30,24],[34,24],[36,22],[40,24],[44,22]]) {
    dot(4, x, y, 2);
    dot(7, x + 2, y - 1);
  }
  p(8, [[18,21],[19,22],[18,26],[15,28],[16,26]]);
  p(1, [[19,27],[24,27],[29,31],[33,36],[32,38],[26,37],[22,34]]);
  p(3, [[20,28],[24,28],[29,33],[32,37],[27,36],[23,33]]);
  p(4, [[21,28],[24,29],[30,35],[26,33]]);
  p(6, [[7,21],[9,20],[12,20],[13,22],[12,24],[9,24],[7,23]]);
  dot(1, 9, 20, 2); dot(1, 8, 21, 4); dot(1, 8, 22, 4); dot(1, 9, 23, 2); dot(9, 9, 21);
  dot(2, 4, 25, 3); dot(8, 3, 27, 2); dot(8, 2, 28);
});

const ray = makeSprite(rayColors, (p, dot) => {
  // The ray faces the top of the image. Its snout projects ahead of the wings.
  p(1, [[2,6],[6,7],[14,10],[22,12],[28,12],[32,13],[35,12],[37,10],[38,7],[41,6],[44,7],[45,10],[48,12],[52,13],[60,11],[69,7],[74,5],[73,9],[68,17],[62,22],[56,24],[50,25],[45,29],[42,31],[39,31],[37,33],[34,35],[29,37],[23,39],[17,39],[12,37],[10,35],[15,37],[21,37],[27,36],[32,34],[36,30],[37,28],[33,27],[28,25],[22,24],[16,21],[11,17],[6,12]]);
  p(2, [[4,8],[13,11],[22,13],[28,13],[33,14],[37,12],[39,9],[40,7],[43,8],[44,11],[47,13],[52,14],[61,12],[72,7],[69,13],[63,19],[58,22],[51,24],[46,26],[42,30],[39,29],[35,26],[28,24],[21,23],[16,20],[10,15]]);
  p(3, [[5,8],[16,12],[22,13],[29,13],[34,15],[38,12],[39,10],[43,10],[44,13],[48,14],[53,15],[62,12],[71,8],[66,15],[58,19],[49,21],[45,25],[41,28],[37,25],[32,22],[24,22],[17,19],[10,14]]);
  p(4, [[6,9],[17,12],[23,13],[29,13],[33,15],[32,17],[27,15],[21,15],[15,13]]);
  p(4, [[50,15],[56,14],[61,12],[69,10],[63,14],[57,16],[52,17]]);
  p(8, [[32,16],[36,14],[38,14],[39,17],[37,20],[38,23],[41,27],[37,25],[34,21]]);
  p(8, [[46,14],[49,16],[47,22],[43,26],[41,28],[43,22]]);
  p(4, [[38,13],[39,10],[40,8],[43,8],[44,11],[42,12],[41,16],[40,19],[38,17]]);
  p(5, [[39,9],[41,7],[43,8],[43,9]]);
  dot(1, 36, 13, 2); dot(6, 37, 12); dot(1, 44, 13, 2); dot(6, 44, 12);
  for (const [x,y] of [[12,12],[16,14],[19,14],[19,17],[22,15],[23,19],[25,17],[27,15],[28,20],[30,18],[32,20],[34,17],[36,22],[37,18],[40,22],[41,18],[43,20],[45,17],[47,19],[49,16],[51,20],[53,17],[55,18],[57,15],[59,16],[62,14],[65,13]]) dot(5,x,y);
});

const fixture = cleanupFixture();
const first = fixture.old;
const next = fixture.newer;

function startRun(lease, name, painted) {
  return {
    lease,
    live: ['main', 'painter'],
    file: { name, painted },
  };
}

function paint(state, through) {
  if (!state.live.includes('painter') || !state.file) return state;
  const painted = Math.min(columns, Math.max(state.file.painted, Math.floor(through)));
  return { ...state, file: { ...state.file, painted } };
}

function exitProcess(state, name) {
  return { ...state, live: state.live.filter(process => process !== name) };
}

// The supervisor addresses one runtime and generation before doing any cleanup.
function applyCleanup(state, target, type) {
  const current = state.lease;
  if (target.runtimeId !== current.runtimeId || target.generation !== current.generation) return state;
  if (type === 'terminated' && state.live.length) return state;
  if (type === 'reset-ok' && state.file) return state;
  return { ...state, lease: cleanupTransition(current, { type, runtimeId: target.runtimeId, generation: target.generation }) };
}

function replaceScratch(state) {
  if (state.lease.status !== 'terminated') return state;
  return { ...state, file: null };
}

const started = startRun(first, 'koi', 48);
const cancelSent = applyCleanup(started, first, 'cancel');
const withHelper = exitProcess(cancelSent, 'main');
const quiet = applyCleanup(exitProcess(paint(withHelper, 69), 'painter'), first, 'terminated');
const empty = replaceScratch(quiet);
const available = applyCleanup(empty, first, 'reset-ok');
const newRun = startRun(next, 'ray', 0);

function openSlot(state, newState) {
  assert.equal(state.lease.status, 'reusable');
  assert.equal(state.lease.slot, newState.lease.slot);
  assert.ok(newState.lease.generation > state.lease.generation);
  return newState;
}

const admitted = openSlot(available, newRun);
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => clamp(value) ** 2 * (3 - 2 * clamp(value));

function frameState(clock) {
  const { index, elapsed, progress, reveal } = clock;
  switch (index) {
    case 0: {
      const state = elapsed < 0.26 ? started : elapsed < 0.68 ? cancelSent : withHelper;
      return paint(state, 48 + 11 * progress);
    }
    case 1:
      return paint(withHelper, 59 + 7 * progress);
    case 2: {
      const stop = reveal('where the orange stripe', 1.1);
      return stop < 1 ? paint(withHelper, 66 + 3 * stop) : quiet;
    }
    case 3:
      if (reveal('replaces it', 0.25) < 1) return quiet;
      return reveal('checks the new volume', 0.55) < 1 ? empty : available;
    case 4: {
      const begin = reveal('See the number change', 0.35);
      if (begin < 1) return available;
      return paint(admitted, 38 * reveal('Run eight', 3.8));
    }
    default: {
      const state = paint(admitted, 38 + 38 * Math.min(1, elapsed / clock.speechDuration));
      return reveal('checks which run', 0.25) < 1 ? state : applyCleanup(state, first, 'cancel');
    }
  }
}

function check() {
  assert.equal(withHelper.lease.status, 'cancellation-requested');
  assert.deepEqual(withHelper.live, ['painter']);
  assert.ok(paint(withHelper, 65).file.painted > started.file.painted);
  assert.equal(applyCleanup(withHelper, first, 'terminated'), withHelper);
  assert.equal(replaceScratch(withHelper), withHelper);
  assert.deepEqual(quiet.live, []);
  assert.deepEqual(quiet.lease, fixture.terminated);
  assert.equal(paint(quiet, columns).file.painted, 69);
  assert.equal(applyCleanup(quiet, first, 'reset-ok'), quiet);
  assert.throws(() => openSlot(quiet, newRun));
  assert.equal(available.file, null);
  assert.deepEqual(available.lease, fixture.reusable);
  const painting = paint(admitted, 52);
  assert.equal(applyCleanup(painting, first, 'cancel'), painting);
  assert.equal(applyCleanup(painting, next, 'cancel').lease.status, 'cancellation-requested');
  assert.equal(paint(painting, columns).file.painted, columns);
  for (const sprite of [koi, ray]) {
    assert.ok(sprite.pixels.some(row => row.slice(48, 69).some(Boolean)));
    assert.ok(sprite.pixels.some(row => row.slice(69).some(Boolean)));
  }
}

const colors = {
  wall: '#f2ede9', paper: '#faf7f3', divider: '#c4bfca', text: '#302c48',
  soft: '#5a576c', live: '#156151', liveLight: '#c6e6d7', orange: '#bb4728',
};
function write(ctx, text, x, y, size, { color = colors.text, face = 'Sans', weight = 500, align = 'left' } = {}) {
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function line(ctx, points, color, width) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// The preview reads the current file. Its checkerboard belongs to the editor.
const pixel = 16;
const left = 49;
const top = 164;
const width = columns * pixel;
const height = rows * pixel;
function preview(ctx, state) {
  const tint = ['#e1e5ef', '#d6dcea'];
  rect(ctx, left, top, width, height, tint[0]);
  for (let r = 0; r < rows / 2; r++) {
    for (let c = r % 2; c < columns / 2; c += 2) rect(ctx, left + 32*c, top + 32*r, 32, 32, tint[1]);
  }
  if (state.file) {
    const sprite = state.file.name === 'koi' ? koi : ray;
    const extent = state.file.painted;
    for (const [r, row] of sprite.pixels.entries()) {
      for (let c = 0; c < extent;) {
        const index = row[c];
        let end = c + 1;
        while (end < extent && row[end] === index) end++;
        if (index) rect(ctx, left + pixel*c, top + pixel*r, pixel*(end-c), pixel, sprite.palette[index]);
        c = end;
      }
    }
  }
  ctx.strokeStyle = '#898799';
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, width, height);
}

function processMark(ctx, x, y, live, seconds) {
  // Three moving bars mark a process that still receives CPU time.
  rect(ctx, x, y, 36, 36, live ? colors.liveLight : '#dedbe1');
  if (live) {
    const bars = [10, 18, 14];
    const step = Math.floor(seconds * 5) % 3;
    for (let i = 0; i < 3; i++) {
      const h = bars[(step + i) % 3];
      rect(ctx, x + 7 + i*8, y + 27 - h, 5, h, colors.live);
    }
  } else {
    rect(ctx, x + 8, y + 17, 20, 3, colors.soft);
  }
}
function pointer(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (const [i, [px,py]] of [[0,0],[0,42],[10,31],[21,48],[29,43],[18,27],[34,27]].entries()) {
    if (!i) ctx.moveTo(px,py);
    else ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.fillStyle = '#fffefa'; ctx.fill();
  ctx.lineWidth = 3.5; ctx.strokeStyle = colors.text; ctx.stroke();
  ctx.restore();
}
function processTree(ctx, state, clock) {
  const x = 1340;
  write(ctx, 'Processes', x, 342, 45, { weight: 600 });
  const bothGone = state.live.length === 0;
  for (const [j, name] of ['main','painter'].entries()) {
    const y = 421 + j * 91;
    const isLive = state.live.includes(name);
    const indent = j ? 48 : 0;
    if (j) line(ctx, [[x+18,y-73],[x+18,y-15],[x+39,y-15]], colors.divider, 3);
    const activityTime = state.file?.painted === columns ? 0 : clock.seconds;
    processMark(ctx, x+indent, y-32, isLive, activityTime);
    write(ctx, name, x+indent+50, y, 47, { face: 'Mono' });
    write(ctx, isLive ? 'live' : 'exited', 1847, y, 43, { color: isLive ? colors.live : colors.soft, align: 'right' });
  }
  if (bothGone) write(ctx, '0 live processes', x, 590, 43, { color: colors.soft });
}

function action(ctx, state, clock) {
  const status = state.lease.status;
  const newer = state.lease.generation === next.generation;
  let label = 'Cancel run';
  let fill = '#624775';
  if (status === 'cancellation-requested') { label = 'Cancel requested'; fill = '#7c4b44'; }
  if (status === 'terminated') { label = 'Held for reset'; fill = '#5d5971'; }
  if (status === 'reusable') { label = 'Ready for reuse'; fill = colors.live; }
  if (newer) { label = 'Running'; fill = '#28587c'; }
  rect(ctx, 1339, 719, 511, 91, fill);
  if (label === 'Cancel run') {
    rect(ctx, 1377, 753, 21, 21, colors.paper);
    write(ctx, label, 1435, 778, 42, { color: colors.paper, weight: 600 });
  } else write(ctx, label, 1595, 778, 41, { color: colors.paper, align: 'center', weight: 600 });
  if (clock.index === 0 && clock.elapsed < 1.6) {
    ctx.save();
    ctx.globalAlpha = 1 - smooth((clock.elapsed - 0.75)/0.85);
    const press = Math.max(0, 1 - Math.abs(clock.elapsed - 0.26) / 0.25);
    pointer(ctx, 1675, 764 + 8 * press);
    ctx.restore();
  }
}

function lateNotice(ctx, clock) {
  const x = 1338;
  const settled = clock.reveal('checks which run', 0.25) === 1;
  rect(ctx, x, 627, 512, 197, '#eae2da');
  rect(ctx, x, 627, 9, 197, '#996447');
  write(ctx, 'Cleanup retry', x+32, 684, 37, { weight: 600 });
  write(ctx, `Run ${first.generation}`, x+32, 765, 60, {face: 'Mono'});
  if (settled) write(ctx, 'Skipped', 1819, 762, 37, {color:'#77442c', align:'right'});
}

function draw(ctx, clock) {
  const state = frameState(clock);
  rect(ctx, 0, 0, 1920, 1080, colors.wall);
  rect(ctx, 0, 0, 1920, 122, '#342e4d');
  // The icon is a stack of transparent pixel layers in the sprite previewer.
  for (let i = 2; i >= 0; i--) {
    const x = 50 + (2-i)*7, y = 35+i*10;
    rect(ctx, x, y, 44, 32, ['#ffb787','#9181aa','#6e6187'][i]);
    rect(ctx, x+30, y, 14, 10, '#342e4d');
  }
  write(ctx, 'Scratch preview', 132, 82, 60, { color: colors.paper, weight: 600 });
  write(ctx, `Sandbox  /  Slot ${state.lease.slot}`, 1850, 78, 42, { color: colors.paper, face: 'Mono', align: 'right' });
  preview(ctx, state);
  const filename = state.file ? state.file.name + '.rgba' : 'Empty volume';
  write(ctx, filename, left, 940, 48, { face: state.file ? 'Mono' : 'Sans', weight: 600 });
  write(ctx, state.file ? '1 scratch file' : '0 scratch files', left+width, 940, 44, { color: colors.soft, align: 'right' });
  rect(ctx, 1302, 123, 2, 861, colors.divider);
  write(ctx, `Run ${state.lease.generation}`, 1337, 243, 86, {face:'Mono', weight:600});
  processTree(ctx, state, clock);
  if (clock.index === 5) lateNotice(ctx, clock);
  else action(ctx, state, clock);
}

export default { title, beats, draw, check };
