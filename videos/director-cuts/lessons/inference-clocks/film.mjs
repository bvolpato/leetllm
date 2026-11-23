import assert from 'node:assert/strict';

// The article's server trace. Whitespace is part of the emitted text.
const tokens = ['at', ' dawn', ' too', '.'];
const originalTimes = [320, 355, 392, 428];
const phases = { queue: 70, tokenize: 10, prefill: 230, sample: 10 };
const gaps = originalTimes.slice(1).map((time, i) => time - originalTimes[i]);
const afterFirst = originalTimes.map((time) => time - originalTimes[0]);
const meanGap = afterFirst.at(-1) / gaps.length;

function replay(queue) {
  const prefillStart = queue + phases.tokenize;
  const prefillEnd = prefillStart + phases.prefill;
  const first = prefillEnd + phases.sample;
  const times = [first];
  for (const gap of gaps) times.push(times.at(-1) + gap);
  return { queue, prefillStart, prefillEnd, first, times };
}

const queued = replay(phases.queue);
const immediate = replay(0);

const beats = [
  {
    id: 'cursor',
    say: 'Watch the cursor after “at.” Each time another token leaves the server, a mark appears below. Could we move that first word earlier and keep the spacing between all four marks?',
    hold: 1.1,
  },
  {
    id: 'before-at',
    say: 'Back up to arrival. In the striped section, the request spends seventy milliseconds waiting in the queue. Then the server tokenizes the prompt. The long blue stretch is prefill. Here the model processes those four prompt tokens. At the far edge it samples the first word.',
    hold: 0.85,
  },
  {
    id: 'lift-the-queue',
    say: 'Keep that trace. Underneath it, try the same request with an empty queue. Keep every processing step the same length. Look where the words land.',
    hold: 1.15,
  },
  {
    id: 'first-clock',
    say: 'The first word now leaves at two hundred fifty milliseconds. Measure from server arrival to that first mark. That’s time to first token. Even the period moved seventy milliseconds earlier.',
    hold: 0.9,
  },
  {
    id: 'register-the-cursors',
    say: 'Now put zero on the word “at” in each trace. Follow the next step. The model takes “at” as input to produce “dawn.” Then it takes “dawn” to produce “too.” Look where the two periods line up.',
    hold: 1.2,
  },
  {
    id: 'same-spacing',
    say: 'Four tokens leave three gaps. Thirty-five, thirty-seven, thirty-six milliseconds. On either run, that averages thirty-six milliseconds per token after the first. Look at the periods. Both land a hundred and eight milliseconds after “at.”',
    hold: 2.7,
  },
];

const color = {
  paper: '#f1eff8', ink: '#24223f', muted: '#595675', grid: '#cdc9dd',
  indigo: '#433db8', edge: '#7771d4', prefill: '#ccc8fa',
  copper: '#a04129', orange: '#f4a880', output: '#fff9e7',
};
const clamp = (p) => Math.max(0, Math.min(1, p));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);
const absoluteX = (ms) => 128 + ms * 3.77;
const relativeX = (ms) => 642 + ms * 10.6;

function transition(clock, beat, phrase, seconds) {
  if (clock.index !== beat) return Number(clock.index > beat);
  return ease(clock.reveal(phrase, seconds));
}

function label(ctx, str, x, y, size, fill, family = 'Sans', align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function box(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function stroke(ctx, x, y, xx, yy, fill, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(xx, yy);
  ctx.lineWidth = width;
  ctx.strokeStyle = fill;
  ctx.stroke();
}

function layer(ctx, opacity, draw) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, opacity);
  draw();
  ctx.restore();
}

// Each lit cell has three emitters with a narrow unlit seam between cells.
const glyphs = {
  a: [0, 0, 14, 1, 15, 17, 15],
  t: [4, 4, 31, 4, 4, 4, 3],
  d: [1, 1, 15, 17, 17, 17, 15],
  w: [0, 0, 17, 17, 21, 21, 10],
  n: [0, 0, 30, 17, 17, 17, 17],
  o: [0, 0, 14, 17, 17, 17, 14],
  '.': [0, 0, 0, 0, 0, 6, 6],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

function terminal(ctx, output, readout, value) {
  const face = ctx.createLinearGradient(0, 0, 1700, 385);
  face.addColorStop(0, '#302675');
  face.addColorStop(0.44, '#393192');
  face.addColorStop(1, '#211d58');
  box(ctx, 0, 0, 1920, 354, face);
  for (let y = 1; y < 354; y += 5) box(ctx, 0, y, 1920, 1, '#bbb4ff0b');
  const x0 = 105, y0 = 141, pitch = 15;
  label(ctx, 'Prompt', x0, 91, 32, '#d3cdfb');
  label(ctx, 'The birds sing softly', x0 + 146, 91, 39, color.output, 'Mono');
  for (const [i, char] of [...output].entries()) {
    const x = x0 + i * 6 * pitch;
    glyphs[char].forEach((bits, row) => {
      for (let col = 0; col < 5; col++) {
        if (!(bits & (1 << (4 - col)))) continue;
        const left = x + col * pitch, top = y0 + row * pitch;
        box(ctx, left, top, 14, 14, color.output);
        box(ctx, left, top, 3, 14, '#ffdbb7');
        box(ctx, left + 11, top, 3, 14, '#d2ebfa');
      }
    });
  }
  box(ctx, x0 + output.length * 6 * pitch + 3, y0, 15, 7 * pitch, '#ffb997');
  label(ctx, 'Server output', x0, 311, 34, '#dedaf9');
  stroke(ctx, 1347, 79, 1347, 282, '#8880bd', 2);
  label(ctx, readout, 1400, 130, 35, '#dedaf9');
  label(ctx, `${Math.round(value)}`, 1394, 249, 109, color.output, 'Mono');
  const width = ctx.measureText(String(Math.round(value))).width;
  label(ctx, 'ms', 1413 + width, 249, 46, '#dedaf9', 'Mono');
  box(ctx, 0, 354, 1920, 7, '#181437');
  box(ctx, 0, 361, 1920, 6, '#bcb6d7');
}

function scale(ctx, relative, amount) {
  const x = relative ? relativeX : absoluteX;
  const max = relative ? 110 : 440;
  const step = relative ? 5 : 10;
  layer(ctx, amount, () => {
    label(ctx, relative ? 'Time since first token' : 'Time since server arrival', 128, 423, 38, color.ink, 'Sans', 'left', 600);
    for (let t = 0; t <= max; t += step) {
      const xx = x(t), large = !relative && t % 100 === 0;
      stroke(ctx, xx, 487, xx, large ? 934 : 497, large ? color.grid : '#bdb8d1', large ? 2 : 1.5);
      if (large) label(ctx, t === 0 ? '0 ms' : String(t), xx, 476, 34, color.muted, 'Mono', t === 0 ? 'left' : 'center');
    }
    if (relative) {
      for (const t of afterFirst) {
        stroke(ctx, x(t), 487, x(t), 934, color.grid, 2);
        label(ctx, t === 0 ? '0 ms' : String(t), x(t), 476, 35, color.muted, 'Mono', 'center');
      }
    }
    stroke(ctx, x(0), 487, x(max), 487, '#aaa5c2');
  });
}

function dimension(ctx, left, right, y, text, ink, size = 33) {
  stroke(ctx, left, y, right, y, ink, 2);
  for (const x of [left, right]) stroke(ctx, x, y - 8, x, y + 8, ink, 3);
  label(ctx, text, (left + right) / 2, y + size + 7, size, ink, 'Mono', 'center');
}

function phaseBand(ctx, trace, xx, y, named) {
  const start = xx(0), queueEnd = xx(trace.queue);
  const top = y - 20, h = 48;
  const queueWidth = queueEnd - start;
  if (queueWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(start, top, queueWidth, h);
    ctx.clip();
    box(ctx, start, top, queueWidth, h, '#f6dacb');
    for (let x = start - h; x < queueEnd; x += 15)
      stroke(ctx, x, top + h, x + h, top, '#d88c68', 4);
    if (queueWidth > 230 && named > 0) {
      const mid = (queueEnd + start) / 2;
      layer(ctx, named, () => {
        box(ctx, mid - 112, top + 5, 224, 38, '#f6dacb');
        label(ctx, `Queue ${Math.round(trace.queue)} ms`, mid, y + 15, 32, '#77351f', 'Mono', 'center');
      });
    }
    ctx.restore();
  }
  const before = xx(trace.prefillStart), after = xx(trace.prefillEnd);
  box(ctx, queueEnd, top, before - queueEnd, h, color.edge);
  box(ctx, before, top, after - before, h, color.prefill);
  box(ctx, after, top, xx(trace.first) - after, h, color.edge);
  layer(ctx, named, () => label(ctx, `Prefill   ${phases.prefill} ms`, (before + after) / 2, y + 15, 32, '#322d77', 'Mono', 'center'));
}

function traceRow(ctx, trace, y, state, name) {
  const { zoom, named, seen, firstMeasure, tracing, decodeTime } = state;
  const xx = (ms) => mix(absoluteX(ms), relativeX(ms - trace.first), zoom);
  layer(ctx, 1 - clamp(zoom * 2), () => {
    if (tracing) {
      layer(ctx, 0.35, () => phaseBand(ctx, trace, xx, y, named));
      ctx.save();
      ctx.beginPath();
      ctx.rect(xx(0), y - 22, xx(seen) - xx(0), 52);
      ctx.clip();
      phaseBand(ctx, trace, xx, y, named);
      ctx.restore();
      stroke(ctx, xx(seen), y - 59, xx(seen), y + 44, color.copper, 5);
    } else {
      phaseBand(ctx, trace, xx, y, named);
    }
    if (firstMeasure > 0) layer(ctx, firstMeasure, () =>
      dimension(ctx, xx(0), xx(trace.first), y + 62, `${Math.round(trace.first)} ms to first token`, color.indigo));
  });
  label(ctx, name, 128, y - 72, 40, color.ink, 'Sans', 'left', 600);
  layer(ctx, zoom, () => label(ctx, `${Math.round(trace.first)} ms to first token`, 128, y + 11, 34, color.muted, 'Mono'));
  const readTo = Math.min(seen, trace.first + decodeTime);
  if (readTo >= trace.first)
    stroke(ctx, xx(trace.first), y + 6, xx(Math.min(readTo, trace.times.at(-1))), y + 6, color.indigo, 6);
  for (const [i, time] of trace.times.entries()) {
    const x = xx(time);
    // A timestamp is the left edge of this insertion cursor.
    layer(ctx, time <= readTo ? 1 : 0.26 * zoom, () => {
      box(ctx, x, y - 17, 10, 47, color.indigo);
      box(ctx, x + 10, y - 17, 4, 47, '#9d96df');
      label(ctx, tokens[i].trim(), x + 5, y - 34, 50, color.ink, 'Mono', 'center');
    });
  }
}

// The scrub head visits real boundaries in the trace. The narrator can pause at
// any one of them without changing a duration printed on the time axis.
function replayTime(clock) {
  if (clock.index === 0)
    return Math.min(queued.times.at(-1), queued.first - 4 + 27 * clock.elapsed);
  if (clock.index === 1) {
    return queued.times.at(-1) * (1 - clock.reveal('Back up to arrival', 0.7))
      + phases.queue * clock.reveal('In the striped section', 2.2)
      + phases.tokenize * clock.reveal('Then the server', 0.7)
      + phases.prefill * clock.reveal('The long blue stretch', 3.7)
      + phases.sample * clock.reveal('At the far edge', 0.8);
  }
  if (clock.index === 2) return Math.min(queued.times.at(-1), queued.first + 78 * clock.elapsed);
  return Infinity;
}

function draw(ctx, clock) {
  const fork = transition(clock, 2, 'Underneath it', 1);
  const cut = transition(clock, 2, 'with an empty queue', 1.65);
  const zoom = transition(clock, 4, 'put zero', 1.5);
  const named = transition(clock, 1, 'Back up to arrival', 0.65);
  const measure = transition(clock, 0, 'move that first word earlier', 0.6);
  const earlier = transition(clock, 3, 'Even the period', 0.75);
  const gapLabels = transition(clock, 5, 'Four tokens', 0.65);
  const average = transition(clock, 5, 'On either run', 0.5);
  const lower = replay(phases.queue * (1 - cut));
  const seen = replayTime(clock);
  let decodeTime = Infinity;
  if (clock.index === 4 && zoom > 0) {
    decodeTime = gaps[0] * clock.reveal('The model takes', 2.5)
      + gaps[1] * clock.reveal('Then it takes', 2)
      + gaps[2] * clock.reveal('Look where', 1);
  }
  const output = tokens.slice(0, queued.times.filter((t) => t <= Math.min(seen, queued.first + decodeTime)).length).join('');
  box(ctx, 0, 0, 1920, 1080, color.paper);
  if ((clock.index === 0 && !measure) || clock.index === 1) terminal(ctx, output, 'Server clock', seen);
  else if (average > 0) terminal(ctx, output, 'Mean token gap', meanGap);
  else if (zoom > 0) terminal(ctx, output, 'Since first token', Math.min(decodeTime, afterFirst.at(-1)));
  else terminal(ctx, output, 'First token', lower.first);

  scale(ctx, false, 1 - clamp(zoom * 2.25));
  scale(ctx, true, clamp((zoom - 0.4) / 0.6));

  const topY = mix(683, 600, fork), bottomY = mix(683, 832, fork);
  const guide = clamp((zoom - 0.54) / 0.46);
  layer(ctx, guide, () => {
    for (const t of queued.times) {
      const x = relativeX(t - queued.first);
      box(ctx, x, topY + 30, 10, bottomY - topY - 116, '#e1dcf4');
    }
  });

  const state = { zoom, named, seen, firstMeasure: clock.index === 1 ? 0 : measure, tracing: clock.index === 1, decodeTime };
  traceRow(ctx, queued, topY, state, 'Queued request');
  layer(ctx, fork, () => traceRow(ctx, lower, bottomY, state, cut === 1 ? 'Empty queue' : 'Replay'));

  layer(ctx, earlier * (1 - zoom), () => {
    const left = absoluteX(immediate.times.at(-1)), right = absoluteX(queued.times.at(-1));
    stroke(ctx, right, topY + 30, right, 681, color.edge, 2);
    stroke(ctx, left, 681, left, bottomY - 92, color.edge, 2);
    dimension(ctx, left, right, 681, `${queued.times.at(-1) - immediate.times.at(-1)} ms earlier`, color.indigo, 34);
  });

  layer(ctx, gapLabels, () => {
    for (let i = 0; i < gaps.length; i++) {
      const x = relativeX(queued.times[i] - queued.first);
      const next = relativeX(queued.times[i + 1] - queued.first);
      dimension(ctx, x + 6, next + 6, 701, `${gaps[i]} ms`, color.indigo, 37);
    }
  });
}

function check() {
  assert.deepEqual(queued.times, originalTimes);
  assert.deepEqual(immediate.times, [250, 285, 322, 358]);
  assert.deepEqual(queued.times.map((t, i) => t - immediate.times[i]), [70, 70, 70, 70]);
  for (const trace of [queued, replay(35), immediate]) {
    assert.equal(trace.prefillEnd - trace.prefillStart, 230);
    assert.deepEqual(trace.times.map((t) => t - trace.first), [0, 35, 72, 108]);
  }
  assert.equal(meanGap, 36);
  assert.equal(tokens.join(''), 'at dawn too.');
  for (const char of tokens.join('')) assert.ok(glyphs[char]);
}

export default { title: 'What moves when a request skips the queue?', beats, draw, check };
