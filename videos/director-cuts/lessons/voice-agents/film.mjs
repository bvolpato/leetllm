import assert from 'node:assert/strict';
import { acknowledge, buildInterruptedReply, chunks, pendingText } from '../../../films/voice-agents/fixtures.mjs';

const { interrupt } = buildInterruptedReply();
const received = chunks.at(-1).endMs;
const confirmed = interrupt.acknowledgedThrough;
const callerLine = 'Wait, page the owner.';
const title = 'Where the handset stopped';

const beats = [
  {
    id: 'cut-in',
    say: 'Incident is open. Wait, page the owner. Alex has cut in. When the agent looks back on this call, where should its own sentence end?',
    hold: 1.1,
  },
  {
    id: 'inside-the-handset',
    say: 'Look inside the handset. All four pieces of the reply are already in the phone’s audio buffer. Read along underneath. The agent has even supplied a reason.',
    hold: 0.8,
  },
  {
    id: 'play-it-back',
    say: 'Slow the call down and watch the phone report playback. The first report covers “Incident is.” The next reaches the end of “open,” five hundred twenty milliseconds into the reply.',
    hold: 0.9,
  },
  {
    id: 'give-alex-the-line',
    say: 'There’s Alex again. Six hundred fifty milliseconds into the reply, the phone detects speech. It mutes the speaker and clears the queue. The server cancels any generation and synthesis still running for this reply.',
    hold: 0.6,
  },
  {
    id: 'find-the-last-word',
    say: 'Follow the blue edge. The piece beginning with “because” ends at eight hundred sixty milliseconds. The server freezes the last playback report. Which whole pieces fit?',
    hold: 2.8,
  },
  {
    id: 'the-next-turn',
    say: '“Incident is open.” That’s the part the phone confirmed playing. The agent can take up Alex’s new request. If the reason comes up later, it still owes Alex that explanation.',
    hold: 2.5,
  },
];

const paper = '#f0e9ee';
const plum = '#302737';
const muted = '#65586a';
const blue = '#195d9a';
const red = '#ad321e';
const darkRed = '#731f24';
const clamp = t => Math.max(0, Math.min(1, t));
const ease = t => { const a = clamp(t); return a * a * (3 - 2 * a); };
const mix = (a, b, t) => a + (b - a) * t;

function label(g, s, x, y, size, color = plum, family = 'Sans', weight = 600, align = 'left') {
  g.fillStyle = color;
  g.font = `${weight} ${size}px "Lesson ${family}"`;
  g.textAlign = align;
  g.fillText(s, x, y);
}

function oval(g, x, y, rx, ry, angle, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  g.fill();
}

function line(g, x1, y1, x2, y2, color, width = 2) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function linear(g, x, y, a, b, stops) {
  const fill = g.createLinearGradient(x, y, a, b);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}

function wall(g) {
  g.fillStyle = linear(g, 50, 60, 1730, 1150, [[0, '#ded1e4'], [0.47, paper], [1, '#faf4ed']]);
  g.fillRect(0, 0, 1920, 1080);
  // The second ink on the left is a coarse halftone printed across the corner.
  g.fillStyle = '#9d81aa';
  g.beginPath();
  for (let y = -10, row = 0; y < 1080; y += 15, row++) {
    for (let x = -8 + (row % 2) * 7; x < 500; x += 15) {
      const radius = clamp((380 - x - 0.29 * y) / 360) * 3.2;
      if (radius < 0.6) break;
      g.moveTo(x + radius, y);
      g.arc(x, y, radius, 0, 2 * Math.PI);
    }
  }
  g.fill();
}

function curl(g) {
  g.beginPath();
  g.moveTo(46, 291);
  g.bezierCurveTo(66, 348, 44, 357, 38, 381);
  for (let i = 0; i < 18; i++) {
    const cy = 381 + i * 13;
    const cx = 38 - 0.00128 * (i * 13) ** 2;
    g.bezierCurveTo(cx - 23, cy - 17, cx - 30, cy + 7, cx - 5, cy + 12);
    g.bezierCurveTo(cx + 27, cy + 21, cx + 29, cy - 1, cx, cy + 13);
  }
  for (const [w, c] of [[8, darkRed], [3, '#d8583c']]) {
    g.lineWidth = w;
    g.strokeStyle = c;
    g.stroke();
  }
}

// Each bell is viewed obliquely. The rows of holes follow the plane of the cap.
function bell(g, x, y, tilt) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  const bellFill = linear(g, 0, -99, 0, 105, [[0, '#ff9171'], [0.15, '#e94f32'], [0.62, '#bf3223'], [1, '#7c2030']]);
  g.fillStyle = bellFill;
  g.beginPath();
  g.moveTo(-103, -43);
  g.bezierCurveTo(-81, -56, -54, -69, -33, -83);
  g.bezierCurveTo(-13, -99, 2, -103, 20, -98);
  g.lineTo(33, 95);
  g.bezierCurveTo(4, 104, -11, 94, -34, 75);
  g.bezierCurveTo(-57, 55, -87, 49, -101, 46);
  g.bezierCurveTo(-111, 24, -113, -13, -103, -43);
  g.fill();
  oval(g, 20, 0, 69, 102, 0, darkRed);
  oval(g, 24, -2, 67, 101, 0, '#f16e4a');
  oval(g, 29, -1, 64, 97, 0, '#962e28');
  oval(g, 32, -2, 61, 94, 0, bellFill);
  for (let r = -4; r <= 4; r++) {
    for (let c = -3; c <= 3; c++) {
      const px = c * 12 + (Math.abs(r) % 2) * 6;
      const py = r * 16;
      if ((px / 44) ** 2 + (py / 71) ** 2 > 1) continue;
      oval(g, px + 32, py, 3.8, 5.8, 0, '#ff9570');
      oval(g, px + 32, py - 1.6, 3.6, 5.4, 0, '#52202a');
    }
  }
  g.restore();
}

function handset(g, detail, lift) {
  g.save();
  g.translate(mix(308, 186, detail), mix(490, 500, detail) - lift * 5);
  g.rotate(mix(-0.28, -0.17, detail) + lift * 0.014);
  const scale = mix(1.2, 1.07, detail);
  g.scale(scale, scale);
  g.lineCap = 'round';
  curl(g);
  function handlePath() {
    g.beginPath();
    g.moveTo(33, -300);
    g.bezierCurveTo(-45, -326, -111, -300, -132, -243);
    g.bezierCurveTo(-188, -90, -171, 108, -101, 234);
    g.bezierCurveTo(-71, 290, -4, 312, 48, 288);
    g.lineTo(46, 211);
    g.bezierCurveTo(-4, 224, -42, 177, -59, 113);
    g.bezierCurveTo(-86, 20, -87, -107, -43, -187);
    g.bezierCurveTo(-23, -222, 2, -222, 41, -222);
    g.closePath();
  }
  g.save();
  g.translate(19, 23);
  g.shadowBlur = 22;
  g.shadowColor = '#70567565';
  handlePath();
  g.fillStyle = '#745b792d';
  g.fill();
  g.restore();
  handlePath();
  g.fillStyle = linear(g, -167, -15, -54, -22, [[0, '#a22d32'], [0.2, '#e34b32'], [0.46, '#fa7550'], [0.72, '#e24931'], [1, '#a12a27']]);
  g.fill();
  g.strokeStyle = '#9c302a';
  g.lineWidth = 2.5;
  g.stroke();
  g.beginPath();
  g.moveTo(-109, -223);
  g.bezierCurveTo(-150, -117, -153, 31, -125, 120);
  g.strokeStyle = '#ffad89';
  g.lineWidth = 6;
  g.stroke();
  bell(g, 0, -249, 0.21);
  bell(g, 33, 249, -0.32);
  g.restore();
}

function arcOfSound(g, x, y, phase, side) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = side === 'ear' ? blue : red;
  g.lineWidth = 5;
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const r = 20 + i * 20 + 6 * Math.sin(phase);
    g.globalAlpha = 0.9 - i * 0.19;
    g.beginPath();
    g.ellipse(0, 0, r * 0.48, r, 0.12, -1.05, 1.05);
    g.stroke();
  }
  g.restore();
}

function slash(g, x, y, color) {
  g.lineCap = 'round';
  line(g, x, y, x + 19, y - 30, color, 7);
  line(g, x + 18, y + 8, x + 46, y - 20, color, 5);
}

function conversation(g, clock, closing) {
  const speaks = closing ? 1 : ease(clock.reveal('Wait', 0.23));
  const second = closing ? 1 : clock.reveal('open', 0.28);
  handset(g, 0, closing ? 0 : Math.sin(speaks * Math.PI));
  if (speaks < 1) arcOfSound(g, 353, 189, clock.seconds * 6, 'ear');
  if (speaks > 0 && !closing && clock.reveal('Alex has cut in') < 1) arcOfSound(g, 557, 757, clock.seconds * 4, 'mouth');
  const heading = closing ? 'Next turn' : 'Incident hotline  /  4219';
  label(g, heading, 650, 120, 36, muted);
  label(g, closing ? 'Agent  /  saved reply' : 'Agent', 650, 272, 38, blue);
  g.save();
  const prefix = chunks[0].text;
  const wordSize = 115;
  const ink = closing ? blue : plum;
  label(g, prefix, 641, 404, wordSize, ink, 'Serif', 400);
  const offset = g.measureText(prefix + ' ').width;
  g.globalAlpha = second;
  label(g, interrupt.retained.slice(prefix.length).trim(), 641 + offset, 404, wordSize, ink, 'Serif', 400);
  g.restore();
  if (!closing) {
    g.save();
    g.globalAlpha = 1 - speaks;
    const dot = 0.5 + 0.5 * Math.sin(clock.seconds * 5);
    for (let i = 0; i < 3; i++) oval(g, 1510 + i * 26, 400, 6, 6, 0, `rgba(25,93,154,${0.3 + 0.5 * dot})`);
    g.restore();
  }
  if (speaks <= 0) return;
  g.save();
  g.globalAlpha = closing ? ease(clock.reveal('The agent can take up', 0.55)) : speaks;
  g.translate((1 - speaks) * 38, 0);
  if (!closing) slash(g, 588, 626, red);
  label(g, 'Alex', 650, 627, 38, red);
  label(g, callerLine, 641, 742, 99, darkRed, 'Serif', 400);
  g.restore();
}

const waveLeft = 447;
const waveRight = 1800;
const waveY = 438;
const audioX = ms => mix(waveLeft, waveRight, ms / received);
const wordLines = chunks.map(({ text }) => text.trim().split(/ (?=the database$|still running\.$)/));
const audioEnd = cursor => chunks.filter(chunk => chunk.endMs <= cursor).at(-1)?.endChar ?? 0;

function voicePrint(g, clock, cursor, inkAt, tailOpacity) {
  let start = 0;
  for (const [index, chunk] of chunks.entries()) {
    const left = audioX(start) + 9;
    const right = audioX(chunk.endMs) - 9;
    const completed = chunk.endMs <= cursor;
    const lines = wordLines[index];
    g.save();
    g.globalAlpha *= completed ? 1 : tailOpacity;
    // An illustrative waveform. Its envelope follows syllables within each timed chunk.
    const peaks = [3, 2, 6, 7][index];
    for (let x = left; x < right; x += 6.3) {
      const t = (x - left) / (right - left);
      const envelope = Math.pow(Math.abs(Math.sin(Math.PI * t * peaks + 0.22 * Math.sin(t * 13))), 0.62);
      const grain = (1.1 + Math.sin(x * 0.109) ** 2 + Math.sin(x * 0.87) ** 2) / 3.1;
      const level = 4 + 132 * Math.pow(Math.sin(Math.PI * t), 0.38) * envelope * grain;
      const lower = level * (0.73 + 0.19 * Math.cos(x * 0.18));
      line(g, x, waveY - level, x, waveY + lower, x <= audioX(inkAt) ? blue : '#817689', 4.5);
    }
    g.restore();
    const mid = (left + right) / 2;
    if (clock.index !== 4 || !completed) {
      g.save();
      const words = clock.index === 1 ? ease(clock.reveal('Read along', 1.5) * 3 - index * 0.6) : 1;
      g.globalAlpha *= words;
      lines.forEach((word, i) => label(g, word, mid, 662 + i * 52 + 12 * (1 - words), 50, completed ? blue : muted, 'Serif', 400, 'center'));
      g.restore();
    }
    line(g, right + 9, 540, right + 9, 555, '#9c8ca1', 3);
    label(g, String(chunk.endMs), right + 9, 600, 38, muted, 'Mono', 400, 'center');
    start = chunk.endMs;
  }
}

function annotation(g, ms, labelText, color, top, align) {
  const x = audioX(ms);
  line(g, x, top + 19, x, waveY + 76, color, 3);
  oval(g, x, top + 18, 5.4, 5.4, 0, color);
  label(g, labelText, x + (align === 'right' ? -12 : 12), top + 5, 40, color, 'Sans', 600, align);
}

// Bring the two retained text chunks from their sound positions into the next turn.
function carryForward(g, t) {
  g.save();
  const size = mix(50, 115, t);
  const y = mix(662, 404, t);
  const prefix = chunks[0].text;
  g.font = `400 ${size}px "Lesson Serif"`;
  const firstWidth = g.measureText(prefix).width;
  const nextWord = chunks[1].text.trim();
  const firstStart = audioX(chunks[0].endMs / 2) - firstWidth / 2;
  const secondStart = audioX((chunks[0].endMs + confirmed) / 2) - g.measureText(nextWord).width / 2;
  const secondEnd = 641 + g.measureText(prefix + ' ').width;
  label(g, prefix, mix(firstStart, 641, t), y, size, blue, 'Serif', 400);
  label(g, nextWord, mix(secondStart, secondEnd, t), y, size, blue, 'Serif', 400);
  g.globalAlpha = ease((t - 0.5) * 2);
  label(g, 'Next turn', 650, 120, 36, muted);
  label(g, 'Agent  /  saved reply', 650, 272, 38, blue);
  g.restore();
}

function inside(g, clock) {
  const { index, elapsed } = clock;
  const detail = index === 1 ? ease(elapsed / 0.75) : 1;
  const holdTime = elapsed - clock.speechDuration;
  const clear = index === 4 ? ease((holdTime - 0.25) / 0.36) : 0;
  const carry = index === 4 ? ease((holdTime - 0.61) / 1.1) : 0;
  handset(g, detail * (1 - carry), 0);
  g.save();
  g.globalAlpha = detail * (1 - clear);
  const stopped = index >= 3;
  label(g, 'Reply audio', waveLeft, 170, 74, plum, 'Serif', 400);
  const firstReport = index === 2 ? ease(clock.reveal('The first report', 0.8)) : 0;
  const nextReport = index === 2 ? ease(clock.reveal('The next', 0.8)) : 0;
  let cursor = 0;
  if (stopped) cursor = confirmed;
  if (index === 2 && firstReport > 0) cursor = nextReport > 0 ? confirmed : chunks[0].endMs;
  const inkAt = index === 2 ? firstReport * chunks[0].endMs + nextReport * (confirmed - chunks[0].endMs) : cursor;
  let tailOpacity = 1;
  if (index === 3) tailOpacity -= 0.62 * ease(clock.reveal('clears the queue', 0.7));
  if (index === 4) tailOpacity = 0.38;
  const next = chunks.find(c => c.endMs > confirmed);
  // Retain the ghost of the cleared buffer for the replay, including its timing marks.
  if (index === 4) {
    const a = ease(clock.reveal('The piece beginning', 0.5));
    const x = audioX(next.endMs);
    line(g, x - 37, 612, x - 37 + 74 * a, 612, plum, 4);
  }
  voicePrint(g, clock, cursor, inkAt, tailOpacity);
  label(g, 'ms', waveLeft, 600, 37, muted, 'Mono', 400);
  if (cursor > 0) annotation(g, cursor, `Played  ${cursor} ms`, blue, 285, 'right');
  if (stopped) {
    annotation(g, interrupt.replyElapsedMs, `Alex  ${interrupt.replyElapsedMs} ms`, red, 228, 'left');
    if (index === 3) {
      slash(g, 370, 794, red);
      label(g, callerLine, waveLeft, 837, 68, darkRed, 'Serif', 400);
    }
  }
  if (index === 4) {
    const x = audioX(confirmed);
    line(g, waveLeft, 720, x, 720, blue, 5);
    line(g, waveLeft, 706, waveLeft, 720, blue, 5);
    line(g, x, 706, x, 720, blue, 5);
    label(g, 'Confirmed by the phone', (waveLeft + x) / 2, 781, 37, blue, 'Sans', 600, 'center');
  }
  g.restore();
  if (index === 4) carryForward(g, carry);
}

function draw(ctx, clock) {
  ctx.save();
  wall(ctx);
  if (clock.index === 0 || clock.index === beats.length - 1) {
    conversation(ctx, clock, clock.index === beats.length - 1);
  } else {
    inside(ctx, clock);
  }
  ctx.restore();
}

function check() {
  assert.equal(chunks.map(c => c.text).join(''), pendingText);
  assert.equal(chunks.map(c => c.text.trim()).join(' '), wordLines.flat().join(' '));
  assert.equal(pendingText.slice(0, audioEnd(confirmed)), interrupt.retained);
  assert.equal(interrupt.retained, 'Incident is open');
  assert.equal(pendingText.slice(0, audioEnd(confirmed - 1)), 'Incident is');
  const next = chunks.find(c => c.endMs > confirmed);
  assert.deepEqual([confirmed, interrupt.replyElapsedMs, next.endMs, received], [520, 650, 860, 1120]);
  const { activeReply } = buildInterruptedReply();
  assert.equal(acknowledge(activeReply, { session: activeReply.session, response: activeReply.response, cursor: next.endMs }), false);
  assert.equal(activeReply.frozenCursor, confirmed);
}

export default { title, beats, draw, check };
