/* A two-leaf contact proof. Positions on the response line up with apertures
   on the target leaf. Closing an aperture never edits the underlying sample. */
const example = {
  rollout: 7,
  promptIds: [101, 102],
  input: [3, 7],
  indexBefore: 0,
  indexAfter: -1,
  expected: 7,
};

const before = example.input.at(example.indexBefore);
const after = example.input.at(example.indexAfter);
const reward = Number(after === example.expected);

// The decoded pieces belong to this small example vocabulary.
const response = [
  { id: 11, text: 'run', source: 'model' },
  { id: 12, text: 'test', source: 'model' },
  { id: 50, text: `got ${before}`, source: 'tool' },
  { id: 51, text: `want ${example.expected}`, source: 'tool' },
  { id: 13, text: 'return', source: 'model' },
  { id: 14, text: `xs[${example.indexAfter}]`, source: 'model' },
];
const mask = response.map(token => Number(token.source === 'model'));
const mistakenMask = response.map((token, i) => token.id === 50 ? 1 : mask[i]);
const selected = bits => response.filter((_, i) => bits[i] === 1);

const beats = [
  {
    id: 'run-test',
    say: 'Watch the index. The model called a test for the last item in this pair. Zero takes us to the first item.',
    hold: 0.8,
  },
  {
    id: 'test-speaks',
    say: 'Got three. Wanted seven. Follow the reply into the response. The test tool put those two tokens there. Now the model can read them.',
    hold: 0.65,
  },
  {
    id: 'patch',
    say: 'The model writes a patch. Minus one picks the last item. Try the same test in a clean copy. Seven. That earns the rollout one point.',
    hold: 0.95,
  },
  {
    id: 'contact-print',
    say: 'Slime hands the trainer all six response tokens and the reward. Each piece of text here represents one example token. Look at the targets this adapter selected.',
    hold: 0.9,
  },
  {
    id: 'extra-target',
    say: 'Under each token is a loss mask bit. A one opens a slot for that token in the policy loss. Five slots are open. Which one belongs to the tool?',
    hold: 2.4,
  },
  {
    id: 'close-slot',
    say: 'Got three came from the test. Set its bit to zero. See what’s left? Two targets for calling the tool, and two for writing the patch.',
    hold: 1.2,
  },
  {
    id: 'still-in-context',
    say: 'Look back from the word return. Both test tokens were in the input when the model chose that word. They stay there after the slots close.',
    hold: 2.8,
  },
];

const p = {
  violet: '#482779', ink: '#302143', muted: '#68566d', paper: '#fff7ea',
  model: '#4c277d', tool: '#b44223', orange: '#ffac7d', light: '#f3eafe',
  film: '#4d327b', edge: '#b49fbc', pale: '#eddcf5', lime: '#ebf6a8',
};
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => clamp(v) ** 2 * (3 - 2 * clamp(v));
const mix = (a, b, t) => a + (b - a) * t;
const rows = ['Model calls the tool', 'Test tool replies', 'Model writes the patch'];
const rowY = i => 333 + 193 * i;
const leftX = [187, 554];
const rightX = [1053, 1425];

function word(ctx, value, x, y, size, color, face = 'Sans', weight = 400, align = 'left') {
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}

function line(ctx, x0, y0, x1, y1, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function box(ctx, x, y, w, h, color, radius = 0) {
  ctx.fillStyle = color;
  if (radius === 0) {
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function sceneState(clock) {
  function cue(beat, phrase, duration) {
    if (clock.index < beat) return 0;
    if (clock.index > beat) return 1;
    return smooth(clock.reveal(phrase, duration));
  }
  const landing = clock.index > 0 ? 1 : smooth(clock.elapsed / 0.65);
  const pullBack = cue(0, 'The model called a test', 1.85);
  const observation = cue(1, 'Follow the reply', 0.95);
  const patch = cue(2, 'The model writes a patch', 1.0);
  const switchIndex = cue(2, 'Minus one picks', 0.65);
  const cleanRun = cue(2, 'in a clean copy', 0.6);
  const graded = cue(2, 'Seven', 0.5);
  const plate = cue(3, 'Look at the targets', 0.9);
  const close = cue(5, 'Set its bit to zero', 0.85);
  const readBack = cue(6, 'Look back from the word return', 1.05);
  const bits = close === 0 ? mistakenMask : mask;
  return {
    ink: [1, 1, observation, observation, patch, patch],
    landing, pullBack, switchIndex, cleanRun, graded, plate, close, bits,
    focus: cue(5, 'Got three came from the test', 0.35), readBack,
  };
}

function stock(ctx) {
  box(ctx, 0, 0, 1920, 1080, gradient(ctx, 0, 0, 1660, 1080, [
    [0, '#372644'], [0.72, '#24172f'], [1, '#1b1224'],
  ]));
  // The two leaves share a fold and a common baseline.
  box(ctx, 64, 158, 1800, 805, '#160f20', 8);
  box(ctx, 64, 144, 1792, 806, '#a79aab', 7);
  box(ctx, 62, 138, 1792, 806, '#e3d3c2', 6);
  box(ctx, 60, 132, 1792, 805, p.paper, 4);
  box(ctx, 61, 133, 903, 803, gradient(ctx, 61, 165, 968, 165, [
    [0, '#f5e8dc'], [0.17, p.paper], [0.84, '#fff8ec'], [0.96, '#f5ebde'], [1, '#d9c6c6'],
  ]));
  box(ctx, 962, 132, 890, 805, gradient(ctx, 962, 140, 1812, 900, [
    [0, '#b79fb8'], [0.065, '#ecdeed'], [0.6, '#f2e8f4'], [1, '#e2d9eb'],
  ]));
  // The pin-feed edge keeps the line positions in register across the proof.
  for (let y = 168; y < 920; y += 69) {
    box(ctx, 81, y, 20, 24, '#c4b4ae', 5);
    box(ctx, 81, y + 2, 18, 19, '#39283f', 4);
    box(ctx, 83, y + 3, 16, 5, '#221928', 3);
  }
  line(ctx, 119, 133, 119, 934, '#dccdc2', 2);
  line(ctx, 962, 134, 962, 935, '#9c889d', 2);
}

function header(ctx, s) {
  word(ctx, 'slime', 70, 91, 55, '#f1d7f3', 'Serif');
  line(ctx, 234, 45, 214, 98, '#a08caa', 2);
  word(ctx, `Rollout ${example.rollout}`, 260, 85, 42, '#fff5ee');
  if (s.graded > 0) {
    ctx.save();
    ctx.globalAlpha = s.graded;
    ctx.translate(0, (1 - s.graded) * -14);
    word(ctx, 'Clean grader', 1549, 83, 37, '#f4e9f5', 'Sans', 400, 'right');
    box(ctx, 1575, 28, 272, 75, p.lime, 5);
    word(ctx, `reward ${reward.toFixed(1)}`, 1711, 79, 37, p.ink, 'Mono', 400, 'center');
    ctx.restore();
  }
}

// Each piece is inked from left to right. Its label and mask stay at the same position.
function responseLeaf(ctx, s) {
  word(ctx, 'Full response', 153, 237, 77, p.ink, 'Serif');
  line(ctx, 153, 267, 894, 267, '#b0a0aa', 2);
  for (let group = 0; group < 3; group++) {
    const y = rowY(group);
    const alpha = s.ink[group * 2];
    if (!alpha) continue;
    const color = group === 1 ? p.tool : p.model;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 2);
    box(ctx, 154, y - 25, 7, 27, color);
    word(ctx, rows[group], 181, y, 34, color, 'Sans', 600);
    ctx.restore();
    for (let col = 0; col < 2; col++) {
      const i = 2 * group + col;
      const x = leftX[col];
      const piece = response[i];
      const ink = s.ink[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 5, y + 5, 350 * ink, 144);
      ctx.clip();
      word(ctx, piece.text, x, y + 79, 64, color, 'Mono');
      if (s.plate < 1) {
        ctx.globalAlpha = 1 - s.plate;
        word(ctx, `ID ${piece.id}`, x + 1, y + 134, 33, p.muted, 'Mono');
      }
      if (s.plate > 0) {
        ctx.globalAlpha = s.plate;
        const selectedHere = s.bits[i] === 1;
        word(ctx, 'mask', x, y + 132, 35, p.muted);
        box(ctx, x + 99, y + 94, 51, 51, selectedHere ? color : '#dccfc7', 4);
        word(ctx, s.bits[i], x + 124, y + 134, 42, selectedHere ? p.paper : p.ink, 'Mono', 400, 'center');
      }
      ctx.restore();
    }
  }
  // Trace backwards from the first patch token to the observation it could read.
  if (s.readBack > 0) {
    const base = rowY(2) + 58;
    const top = rowY(1) + 85;
    const end = mix(base, top, s.readBack);
    line(ctx, 172, base, 140, base, p.tool, 4);
    line(ctx, 140, base, 140, end, p.tool, 4);
    if (s.readBack > 0.94) {
      line(ctx, 140, top, 784, top, p.tool, 3);
      line(ctx, 784, top - 8, 784, top, p.tool, 3);
    }
  }
}

function testLeaf(ctx, s) {
  const x = 1041;
  word(ctx, 'last.py', x, 234, 69, p.ink, 'Mono');
  line(ctx, x, 267, 1784, 267, '#b0a0b1', 2);
  word(ctx, 'def last(xs):', x, 362, 52, p.ink, 'Mono');
  const index = s.switchIndex > 0.5 ? example.indexAfter : example.indexBefore;
  word(ctx, `return xs[${index}]`, x + 58, 447, 66, p.model, 'Mono');
  line(ctx, x, 501, 1784, 501, '#bcabbf', 2);
  word(ctx, s.cleanRun > 0.5 ? 'Test in a clean copy' : 'Test input', x, 566, 34, p.muted, 'Sans', 600);
  const centers = [1362, 1562];
  word(ctx, 'xs =', x, 714, 60, p.muted, 'Mono');
  word(ctx, '[', 1236, 723, 100, p.muted, 'Mono');
  word(ctx, ',', 1447, 716, 80, p.muted, 'Mono');
  word(ctx, ']', 1670, 723, 100, p.muted, 'Mono');
  // One index cursor moves between the two elements of the same input.
  const cursor = mix(centers[0], centers[1], s.switchIndex) - (1 - s.landing) * 75;
  box(ctx, cursor - 65, 603, 130, 151, '#d6c0e5', 8);
  for (const [i, value] of example.input.entries()) {
    word(ctx, value, centers[i], 718, 118, p.ink, 'Mono', 400, 'center');
  }
  box(ctx, cursor - 62, 746, 124, 8, p.violet, 3);
  const measured = s.cleanRun >= 1 ? after : before;
  if (s.landing > 0 && (s.switchIndex === 0 || s.cleanRun >= 1)) {
    ctx.save();
    ctx.globalAlpha = s.cleanRun >= 1 ? 1 : smooth((s.landing - 0.4) / 0.6);
    const passed = measured === example.expected;
    box(ctx, x, 814, 10, 64, passed ? p.violet : p.tool);
    word(ctx, `got ${measured}   want ${example.expected}`, x + 31, 862, 49, passed ? p.model : p.tool, 'Mono');
    ctx.restore();
  }
}

function shutter(ctx, x, y, width, height) {
  // An opaque blade fills exactly the part of the aperture that has closed.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  box(ctx, x, y, width, height, '#372458');
  for (let d = -height; d < width; d += 18) {
    line(ctx, x + d, y + height, x + d + height, y, '#574374', 3);
  }
  box(ctx, x, y, width, 4, '#2c1d44');
  ctx.restore();
}

function targetsLeaf(ctx, s) {
  const counts = selected(s.bits).length;
  const start = 963;
  const w = 889;
  const h = 805;
  ctx.save();
  ctx.beginPath();
  ctx.rect(start, 132, w, h * s.plate);
  ctx.clip();
  box(ctx, start, 132, w, h, gradient(ctx, start, 132, 1850, 900, [
    [0, '#372453'], [0.09, '#4c3077'], [0.68, '#574086'], [1, '#493373'],
  ]));
  word(ctx, 'Policy targets', 1040, 237, 77, p.paper, 'Serif');
  box(ctx, 1646, 154, 133, 93, '#d9c7eb', 3);
  word(ctx, counts, 1713, 226, 78, '#392455', 'Mono', 400, 'center');
  line(ctx, 1040, 267, 1784, 267, '#aa90c3', 2);
  for (let group = 0; group < 3; group++) {
    const y = rowY(group);
    const isTool = group === 1;
    const ink = isTool ? p.tool : p.model;
    const label = isTool ? 'Observation' : group === 0 ? 'Call' : 'Patch';
    word(ctx, label, 1048, y, 34, isTool ? '#ffc1a2' : '#eee1fc', 'Sans', 600);
    for (let col = 0; col < 2; col++) {
      const i = group * 2 + col;
      const x = rightX[col] - 12;
      const y0 = y + 23;
      const width = 341;
      const height = 105;
      const cover = i === 2 ? s.close : 1 - s.bits[i];
      box(ctx, x - 3, y0 - 3, width + 6, height + 7, '#846ba4', 8);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y0, width, height, 6);
      ctx.clip();
      box(ctx, x, y0, width, height, isTool ? '#ffcca7' : '#f8eddf');
      box(ctx, x, y0, width, 7, isTool ? '#daa183' : '#d1bfd2');
      word(ctx, response[i].text, x + width / 2, y0 + 73, 52, ink, 'Mono', 400, 'center');
      if (cover > 0) shutter(ctx, x, y0, width * cover, height);
      ctx.restore();
      if (i === 2 && s.focus > 0 && s.close < 1) {
        line(ctx, x, y0 + height + 10, x + width * s.focus, y0 + height + 10, '#ffba8e', 6);
      }
    }
  }
  if (s.plate < 1) {
    const edge = 132 + h * s.plate;
    box(ctx, start, edge - 13, w, 13, '#c6a8da');
    line(ctx, start, edge - 14, 1852, edge - 14, '#71598b', 3);
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const s = sceneState(clock);
  ctx.save();
  // Start inside the actual failing test, then open the spread to its response.
  const tight = 1 - s.pullBack;
  const zoom = mix(1, 1.88, tight);
  ctx.scale(zoom, zoom);
  ctx.translate(-895 * tight, -372 * tight);
  stock(ctx);
  header(ctx, s);
  responseLeaf(ctx, s);
  if (s.plate < 1) testLeaf(ctx, s);
  if (s.plate > 0) targetsLeaf(ctx, s);
  ctx.restore();
}

function check() {
  function equal(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${label}: ${JSON.stringify(actual)}`);
    }
  }
  equal([before, after, reward], [3, 7, 1], 'Clean test and reward');
  equal(mask, [1, 1, 0, 0, 1, 1], 'Response mask by producer');
  equal(selected(mistakenMask).map(t => t.id), [11, 12, 50, 13, 14], 'Five open slots');
  equal(selected(mask).map(t => t.id), [11, 12, 13, 14], 'Four model targets');
  const firstPatch = response.findIndex(t => t.text === 'return');
  const prefix = [...example.promptIds, ...response.slice(0, firstPatch).map(t => t.id)];
  equal(prefix, [101, 102, 11, 12, 50, 51], 'Context for the first patch token');
}

export default { title: 'Who wrote “got 3” in rollout 7?', beats, draw, check };
