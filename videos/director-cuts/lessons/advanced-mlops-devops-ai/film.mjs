import assert from 'node:assert/strict';
import {
  guardedReleaseTransition,
  releaseFingerprintFixture,
} from '../../../films/advanced-mlops-devops-ai/protocols.mjs';
import {
  RELEASE_RULES,
  ReleaseMetricSample,
  releaseTelemetry,
} from '../../../films/advanced-mlops-devops-ai/telemetry.mjs';

const fingerprints = releaseFingerprintFixture();
const baseline = fingerprints.left.digest;
const candidate = fingerprints.right.digest;
const observed = { release: candidate, generation: 12 };
const restore = guardedReleaseTransition(observed, observed, baseline);
const redeploy = guardedReleaseTransition(restore.pointer, restore.pointer, candidate);
const delayed = guardedReleaseTransition(redeploy.pointer, observed, baseline);
const history = [observed, restore.pointer, redeploy.pointer];

const rule = RELEASE_RULES.find(r => r.key === 'p95_ttft_ms');
const measurement = new ReleaseMetricSample({
  release: observed.release, window: rule.window, value: 910, age: 30, count: 200,
});
const decision = releaseTelemetry(rule, measurement, observed.release);

const beats = [
  {
    id: 'over-the-limit',
    say: 'Watch where the red tip lands. The wait for a first token on candidate C came in over the limit at the ninety-fifth percentile. The controller queues a rollback.',
    hold: 0.65,
  },
  {
    id: 'take-an-impression',
    say: 'Look at what went with it. That square is the release fingerprint, one pixel for each bit. Twelve is the routing generation that served those requests.',
    hold: 0.8,
  },
  {
    id: 'restore-baseline',
    say: 'While the command waits, another controller restores baseline B. Watch the live fingerprint change. Each time traffic switches, the routing generation goes up by one.',
    hold: 0.9,
  },
  {
    id: 'repeat-the-release',
    say: 'Later, the team deploys candidate C again. Recognize the pattern? Those are the very same release bytes. How many times has traffic switched since the command was issued?',
    hold: 1.25,
  },
  {
    id: 'register-the-prints',
    say: 'The old rollback arrives. Lay its fingerprint over the live one. Every bit lines up. Should the command send this traffic back to baseline?',
    hold: 2.0,
  },
  {
    id: 'conditional-write',
    say: 'Read the two generation numbers. Twelve is where we measured the delay. Fourteen is live now. The database checks both fields in the same update that would move traffic. Zero rows match.',
    hold: 0.9,
  },
  {
    id: 'still-serving',
    say: 'Follow the next request. It still routes to C. A rollback for this deployment needs measurements from fourteen.',
    hold: 2.5,
  },
];

const colors = {
  ink: '#24213e', muted: '#55516a', line: '#afabba',
  live: '#2848ae', command: '#a93636', registered: '#282044',
  livePrint: '#305bc9', commandPrint: '#e4675c',
};
const mix = (a, b, t) => a + (b - a) * t;
const bound = t => Math.min(1, Math.max(0, t));
const ease = t => { const p = bound(t); return p * p * (3 - 2 * p); };
const interval = (t, start, end) => ease((t - start) / (end - start));

function cue(clock, index, phrase, span) {
  if (clock.index < index) return 0;
  return clock.index > index ? 1 : ease(clock.reveal(phrase, span));
}

function type(ctx, value, x, y, size, color, family = 'Sans', weight = 400, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}

function line(ctx, x, y, endX, endY, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function fade(ctx, opacity, paint) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  paint();
  ctx.restore();
}

// The plate reads the SHA-256 digest in hexadecimal order, high bit first.
function digestBits(digest) {
  return Array.from(digest, digit => parseInt(digit, 16).toString(2).padStart(4, '0')).join('');
}
const bits = new Map([baseline, candidate].map(hash => [hash, digestBits(hash)]));
const cell = 24;
const plateSize = 16 * cell;
const plateY = 324;
const leftPlate = 649;
const rightPlate = 1271;

function backdrop(ctx) {
  const field = ctx.createLinearGradient(50, 160, 1840, 880);
  field.addColorStop(0, '#fff2e7');
  field.addColorStop(0.44, '#f5eeed');
  field.addColorStop(0.72, '#eceef8');
  field.addColorStop(1, '#dce9fb');
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, 1920, 1080);
  // A single pale exposure bed runs underneath both imprints.
  const light = ctx.createLinearGradient(0, 250, 0, 805);
  light.addColorStop(0, 'rgba(255,255,255,.20)');
  light.addColorStop(0.5, 'rgba(255,255,255,.52)');
  light.addColorStop(1, 'rgba(255,255,255,.12)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 251, 1920, 551);
  line(ctx, 0, 250, 1920, 250, '#c8c3ca');
  line(ctx, 0, 803, 1920, 803, '#c8c3ca');
}

function drawHistory(ctx, selected) {
  const start = 1260;
  const y = 111;
  for (let i = 0; i <= selected; i++) {
    const entry = history[i], x = start + 196 * i;
    const current = i === selected;
    if (i) line(ctx, x - 43, y - 12, x - 13, y - 12, colors.line, 2);
    type(ctx, (entry.release === candidate ? 'C' : 'B') + ' / ' + entry.generation,
      x, y, 38, current ? colors.live : colors.muted, 'Mono');
    if (current) line(ctx, x, y + 16, x + 139, y + 16, colors.live, 4);
  }
}

function plateGuides(ctx, x, tone) {
  const x0 = x - plateSize / 2, y0 = plateY;
  ctx.fillStyle = '#ffffff45';
  ctx.fillRect(x0, y0, plateSize, plateSize);
  for (let i = 0; i <= 16; i++) {
    const offset = i * cell;
    const hairline = i % 4 === 0 ? '#aaa5b57d' : '#aca6b62b';
    line(ctx, x0 + offset, y0, x0 + offset, y0 + plateSize, hairline);
    line(ctx, x0, y0 + offset, x0 + plateSize, y0 + offset, hairline);
  }
  for (const h of [-1, 1]) {
    for (const v of [-1, 1]) {
      const px = x + h * (plateSize / 2 + 8), py = y0 + plateSize / 2 + v * (plateSize / 2 + 8);
      line(ctx, px, py, px - h * 23, py, tone, 2);
      line(ctx, px, py, px, py - v * 23, tone, 2);
    }
  }
}

function printBits(ctx, digest, x, ink) {
  const data = bits.get(digest);
  ctx.fillStyle = ink;
  for (let i = 0; i < data.length; i++) {
    if (data[i] === '1') {
      ctx.fillRect(x - plateSize / 2 + (i % 16) * cell,
        plateY + Math.floor(i / 16) * cell + 0.6, cell, cell - 1.2);
    }
  }
}

// Both pieces of a live row move together behind a vertical aperture.
function flipRow(ctx, progress, prev, next, paint) {
  if (progress === 0 || progress === 1) {
    paint(progress === 1 ? next : prev);
    return;
  }
  const height = 551;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 251, 1920, height);
  ctx.clip();
  ctx.translate(0, -height * progress);
  paint(prev);
  ctx.translate(0, height);
  paint(next);
  ctx.restore();
}

function markGeneration(ctx, generation, x, ink, accent) {
  const align = 'center';
  type(ctx, 'Generation', x, 453, 37, colors.muted, 'Sans', 400, align);
  type(ctx, generation, x, 598, 138, ink, 'Mono', 400, align);
  if (accent > 0) {
    const half = 37 * accent;
    line(ctx, x + 41 - half, 624, x + 41 + half, 624, ink, 7);
  }
}

function fingerprintLabel(ctx, token, x, ink) {
  type(ctx, token.release === candidate ? 'Candidate C' : 'Baseline B', x, 301,
    37, ink, 'Sans', 600, 'center');
  type(ctx, token.release.slice(0, 10) + '…', x, 759, 31, ink, 'Mono', 400, 'center');
}

function latency(ctx, elapsed) {
  const left = 117, width = 700, y = 616;
  // The bar reveals a completed aggregate. Intermediate positions have no readings.
  const toX = ms => left + width * ms / 1000;
  const edge = toX(measurement.value * (0.89 + 0.11 * ease(elapsed / 0.9)));
  const limitX = toX(rule.max);
  type(ctx, 'Wait for first token', left, 385, 47, colors.ink, 'Serif');
  type(ctx, '5-minute p95', left, 439, 35, colors.muted);
  type(ctx, measurement.value, left - 6, 576, 133, colors.command, 'Mono');
  type(ctx, 'ms', left + 256, 573, 54, colors.command);
  ctx.fillStyle = '#d6c9c8';
  ctx.fillRect(left, y, width, 8);
  ctx.fillStyle = colors.commandPrint;
  ctx.fillRect(left, y - 11, edge - left, 30);
  for (let i = 0; i <= 10; i++) {
    line(ctx, toX(i * 100), y + 24, toX(i * 100), y + 33, '#a28f99', 2);
  }
  line(ctx, limitX, y - 49, limitX, y + 51, colors.ink, 4);
  type(ctx, rule.max + ' ms limit', limitX + 11, y + 98, 36, colors.ink, 'Sans', 600, 'right');
}

function draw(ctx, clock) {
  backdrop(ctx);
  const copy = cue(clock, 0, 'The controller queues', 1.8);
  const switched = cue(clock, 2, 'another controller', 1.15);
  const returned = cue(clock, 3, 'the team deploys', 1.15);
  const overlay = cue(clock, 4, 'Lay its fingerprint', 1.65);
  const numbers = cue(clock, 5, 'Read the two generation numbers', 0.55);
  const result = cue(clock, 5, 'The database checks', 0.65);
  const nextRequest = cue(clock, 6, 'Follow the next request', 1.0);
  const version = Number(switched === 1) + Number(returned === 1);
  const flight = interval(copy, 0.16, 0.91);
  const meter = 1 - interval(copy, 0, 0.22);
  const landed = interval(copy, 0.8, 1);
  const commandX = mix(rightPlate, leftPlate, flight) + (960 - leftPlate) * overlay - nextRequest * 43;
  const liveX = mix(rightPlate, 960, overlay);
  const labelAlpha = 1 - overlay;

  type(ctx, 'Model serving', 107, 119, 68, colors.ink, 'Serif');
  type(ctx, '/ us-west', 565, 116, 37, colors.muted, 'Mono');
  drawHistory(ctx, version);
  fade(ctx, meter, () => type(ctx, 'Latency window', 112, 225, 48, colors.ink, 'Sans', 600));
  fade(ctx, landed, () => {
    type(ctx, result === 1 ? 'Stale rollback' : clock.index >= 4 ? 'Delivered rollback' : 'Queued rollback', 112, 225, 48,
      colors.command, 'Sans', 600);
  });
  type(ctx, 'Live route', 1810, 225, 48, colors.live, 'Sans', 600, 'right');

  fade(ctx, meter, () => latency(ctx, clock.elapsed));

  const paintLive = token => {
    plateGuides(ctx, liveX, colors.live);
    printBits(ctx, token.release, liveX, colors.livePrint);
    fade(ctx, labelAlpha, () => fingerprintLabel(ctx, token, liveX, colors.live));
    markGeneration(ctx, token.generation, 1650 - 55 * overlay, colors.live, numbers);
  };
  if (returned > 0) flipRow(ctx, returned, history[1], history[2], paintLive);
  else flipRow(ctx, switched, history[0], history[1], paintLive);

  fade(ctx, interval(copy, 0.1, 0.36), () => {
    fade(ctx, labelAlpha * landed, () => plateGuides(ctx, commandX, colors.command));
    fade(ctx, 1 - nextRequest, () => {
      ctx.globalCompositeOperation = 'multiply';
      printBits(ctx, observed.release, commandX, colors.commandPrint);
    });
    fade(ctx, landed * labelAlpha, () => {
      fingerprintLabel(ctx, observed, commandX, colors.command);
    });
    if (flight > 0 && flight < 1) {
      const lift = interval(flight, 0, 0.2) * (1 - interval(flight, 0.8, 1));
      const x = mix(1650, 270, interval(flight, 0.18, 0.82));
      type(ctx, observed.generation, x, 598 + lift * 240, 138 - lift * 68,
        colors.command, 'Mono', 400, 'center');
    }
    fade(ctx, landed * (1 - nextRequest * 0.45), () => {
      markGeneration(ctx, observed.generation, 270 + 55 * overlay, colors.command, numbers);
    });
  });

  fade(ctx, overlay, () => {
    type(ctx, 'Candidate C', 960, 301, 37, colors.registered, 'Sans', 600, 'center');
    type(ctx, candidate.slice(0, 10) + '…', 960, 759, 31, colors.registered,
      'Mono', 400, 'center');
    line(ctx, 477, 527, 737, 527, '#a9363688', 2);
    line(ctx, 1183, 527, 1443, 527, '#2848ae88', 2);
  });

  fade(ctx, result * (1 - nextRequest), () => {
    type(ctx, Number(delayed.committed) + ' routing rows updated', 960, 894, 59,
      colors.ink, 'Serif', 400, 'center');
  });
  fade(ctx, nextRequest, () => {
    const routed = delayed.pointer;
    const name = routed.release === candidate ? 'Candidate C' : 'Baseline B';
    type(ctx, 'Next request  →  ' + name + ' / ' + routed.generation, 960, 894, 58,
      colors.live, 'Serif', 400, 'center');
  });
}

function check() {
  assert.equal(decision.valid, true);
  assert.equal(decision.action, 'rollback');
  assert.equal(rule.max, 850);
  for (const [digest, bitmap] of bits) {
    assert.equal(bitmap.length, 256);
    const fromPixels = bitmap.match(/.{4}/g).map(n => parseInt(n, 2).toString(16)).join('');
    assert.equal(fromPixels, digest);
  }
  assert.notEqual(baseline, candidate);
  assert.equal(restore.committed && redeploy.committed, true);
  assert.deepEqual(history.map(row => row.generation), [12, 13, 14]);
  assert.equal(history[0].release, history[2].release);
  assert.equal(delayed.committed, false);
  assert.equal(delayed.audit, null);
  assert.deepEqual(delayed.pointer, redeploy.pointer);
  const latest = redeploy.pointer;
  assert.equal(guardedReleaseTransition(latest, { ...latest, release: baseline }, baseline).committed, false);
  assert.deepEqual(guardedReleaseTransition(latest, latest, baseline).pointer,
    { release: baseline, generation: 15 });
}

export default { title: 'Can this rollback still run?', beats, draw, check };
