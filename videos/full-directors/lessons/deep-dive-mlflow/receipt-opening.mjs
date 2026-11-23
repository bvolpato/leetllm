// The printer makes a picture of the two replies. The folds open onto the records the lab retained.
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { smoothstep } from 'vizmatic';

const slipHeight = 336;
const ink = '#212f2c';
const green = '#086050';
const clay = '#a54826';
const mono = 'Lesson Mono';
const sans = 'Lesson Sans';
const serif = 'Lesson Serif';
const blend = (a, b, p) => a + (b - a) * p;
const clamp = n => Math.max(0, Math.min(1, n));
const paths = new Map();

function path(c, d, fill, outline, width = 1) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  const p = paths.get(d);
  if (fill) { c.fillStyle = fill; c.fill(p); }
  if (outline) { c.strokeStyle = outline; c.lineWidth = width; c.stroke(p); }
}

function gradient(c, x, y, u, v, stops) {
  const g = c.createLinearGradient(x, y, u, v);
  for (const [stop, color] of stops) g.addColorStop(stop, color);
  return g;
}

function line(c, x, y, u, v, color, w = 2) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(u, v);
  c.strokeStyle = color; c.lineWidth = w; c.stroke();
}

function ellipse(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  c.fillStyle = fill; c.fill();
}

function label(c, s, x, y, size, family = mono, color = ink, weight = 400) {
  c.font = weight + ' ' + size + 'px "' + family + '"';
  c.fillStyle = color; c.fillText(s, x, y);
}

function desk(c, top = 1080, bottom = 1080) {
  c.fillStyle = gradient(c, 100, 0, 1590, 1400, [
    [0, '#e5d9be'], [.35, '#dccdad'], [.78, '#cbb897'], [1, '#c5b294'],
  ]);
  c.fillRect(0, 0, 1920, top);
  if (bottom < 1080) c.fillRect(0, bottom, 1920, 1080 - bottom);
  // A few long fibers show the grain of the counter without crossing the printed ink.
  c.save();
  c.scale(1.15, .86);
  for (let i = 0; i < 24; i++) {
    const y = 7 + i * 57;
    c.beginPath();
    const start = i % 3 === 0 ? -200 : 120 + ((i * 313) % 820);
    c.moveTo(start, y);
    c.bezierCurveTo(start + 310, y - 32, start + 900, y - 14, start + 1470, y - 80);
    c.strokeStyle = i % 3 === 0 ? '#7a644515' : '#fff6dd37';
    c.lineWidth = i % 3 === 0 ? 1.6 : 1.1; c.stroke();
  }
  c.restore();
}

// The origin is at the steel tear bar. The green lid, cast shell and plinth share this datum.
function printer(c, feeding) {
  const base = 'M-349 108 Q-350 88 -330 85 L300 65 Q328 65 342 48 L399 -19 L393 167 Q392 184 380 200 L336 246 Q320 263 293 265 L-292 269 Q-344 267 -349 226 Z';
  const shell = 'M-357 68 Q-359 40 -344 8 L-299 -66 Q-284 -92 -253 -95 L280 -112 Q350 -114 376 -83 Q399 -55 399 -14 L398 147 Q398 168 383 185 L344 227 Q329 245 294 246 L-298 251 Q-348 249 -355 211 Z';
  const face = 'M-355 65 Q-349 98 -307 100 L284 96 Q314 95 330 78 L328 202 Q327 228 300 233 L-302 237 Q-342 235 -349 204 Z';
  const lid = 'M-323 41 L-280 -51 Q-271 -70 -247 -73 L257 -88 Q292 -89 310 -70 Q321 -56 322 -35 L325 57 Q322 81 291 83 L-295 88 Q-333 87 -323 41 Z';
  // The cord passes behind the cover. Its small highlight follows the outside of the bend.
  const cord = 'M339 -59 C465 -80 458 -166 590 -173 S781 -111 896 -186';
  path(c, cord, null, '#5c574632', 12);
  path(c, cord, null, '#46514a', 8);
  path(c, cord, null, '#7c8174', 2);

  c.save();
  c.translate(3, 13); c.scale(.99, .98);
  c.shadowColor = '#48392072'; c.shadowBlur = 24; c.shadowOffsetY = 16;
  path(c, base, '#72665089');
  c.restore();
  for (const x of [-274, 238]) {
    c.fillStyle = '#354039'; c.beginPath(); c.roundRect(x, 253, 57, 22, 8); c.fill();
  }
  path(c, base, gradient(c, 0, 90, 6, 269, [[0, '#414d46'], [.73, '#35433f'], [1, '#273732']]), '#43483b', 2);
  path(c, shell, gradient(c, -300, 0, 380, 218, [[0, '#f0ecdb'], [.64, '#d9d7be'], [1, '#a7ac99']]), '#747966', 2.7);
  path(c, face, gradient(c, 0, 95, 0, 240, [[0, '#d7d7c1'], [.16, '#e9e7d3'], [.8, '#e1deca'], [1, '#c4c6b0']]));
  path(c, 'M-345 116 Q-330 129 -302 129 L287 125 Q314 124 330 110 L392 40', null, '#9ca48d', 2.1);
  path(c, 'M-339 119 Q-326 131 -301 132 L283 128 Q308 128 319 123', null, '#f8f4e2', 2);

  path(c, lid, gradient(c, -300, -75, 280, 106, [[0, '#597a68'], [.47, '#416958'], [1, '#294d43']]), '#384e41', 3.4);
  path(c, 'M-314 34 L-273 -46 Q-265 -63 -246 -65 L244 -79 Q280 -80 294 -68', null, '#a3b29a', 2.6);
  path(c, 'M-304 76 Q-197 82 291 72 Q310 70 312 55', null, '#22463b', 3.2);
  // A smoky inspection window exposes the wound roll and its spindle behind the feed.
  const window = 'M-237 -43 Q-230 -59 -213 -61 L205 -72 Q228 -72 236 -58 L244 -33 L-245 -24 Z';
  path(c, window, gradient(c, -20, -71, -16, -25, [[0, '#183a33'], [.6, '#386053'], [1, '#25473e']]), '#28473e', 2);
  c.save(); c.clip(paths.get(window));
  path(c, 'M-217 -44 Q-218 -53 -204 -55 L197 -64 Q212 -63 218 -44 L214 -33 L-215 -24 Z',
    gradient(c, 0, -64, 0, -27, [[0, '#6e8675'], [.34, '#afbaa1'], [.6, '#9aa88f'], [1, '#698171']]));
  for (let x = -198; x < 196; x += 33) line(c, x, -49 - (x+198)*.023, x-2, -30 - (x+198)*.023, '#77907b38', 1);
  ellipse(c, 207, -46, 12, 18, '#a6b59a'); ellipse(c, 208, -45, 8, 12, '#80947f');
  ellipse(c, 209, -45, 4, 6, '#405c4d');
  path(c, 'M-256 -57 L147 -77 L186 -77 L-219 -46 Z', '#d5e1bf42');
  c.restore();
  // The dark recessed spindle and its polished edge give the paper a visible origin.
  path(c, 'M-280 -7 Q-279 -16 -266 -16 L244 -16 Q258 -16 264 -8 L273 9 Q276 18 263 20 L-278 20 Q-292 19 -287 9 Z', '#19362e', '#6e8b75', 2.3);
  path(c, 'M-270 -3 H249 L257 7 H-274 Z', '#111e1a');
  line(c, -265, -5, 246, -5, '#849481', 3);
  // A knurled feed key and the round status lens sit together in the lid.
  c.save(); c.translate(214, 45); c.transform(1, 0, -.22, .66, 0, 0);
  c.fillStyle = '#213c34'; c.beginPath(); c.roundRect(-40, -17, 80, 36, 14); c.fill();
  c.fillStyle = '#d89045'; c.beginPath(); c.roundRect(-37, -16, 74, 29, 12); c.fill();
  for (let i = -22; i <= 22; i += 8) line(c, i, -9, i, 4, '#995f34', 2);
  line(c, -23, -11, 22, -11, '#f4c382', 2); c.restore();
  ellipse(c, 149, 45, 8, 5, '#193a32'); ellipse(c, 149, 44, 4.3, 2.5, feeding ? '#ffce79' : '#a6bf9b');
  // The roll-release catch, foot screws and side vents articulate the depth of the molding.
  path(c, 'M-55 137 Q-52 132 -43 132 H48 Q57 132 53 139 L45 151 Q41 155 34 155 H-42 Q-52 155 -55 148 Z', '#a4ac97');
  path(c, 'M-42 136 H43 L38 142 H-39 Z', '#64766a');
  for (const x of [-303, 280]) {
    ellipse(c, x, 200, 5, 5, '#a4aa96'); line(c, x - 2.5, 201.5, x + 2.5, 198.5, '#7d8978', 1.5);
  }
  for (let i = 0; i < 6; i++) {
    const x = 347 + i * 6.6;
    line(c, x, 147 - i * 7.1, x, 161 - i * 7.1, '#687b6e', 3.6);
  }
}

function cutter(c) {
  path(c, 'M-280 10 L263 10 L257 18 L-283 18 Z', '#a8ae9a', '#566b5e', 1.6);
  line(c, -278, 10, 261, 10, '#ede8d0', 2.2);
  for (let x = -276; x < 254; x += 10) line(c, x, 11, x + 3, 14, '#718173', 1.4);
}

function paperEdge(height) {
  const p = new Path2D();
  p.moveTo(-252, 6);
  for (let x = -252; x < 252; x += 12) {
    p.lineTo(x + 6, 3 + 2 * Math.cos(x * .018)); p.lineTo(x + 12, 6 + 2 * Math.cos(x * .018));
  }
  p.bezierCurveTo(249, height * .38, 257, height * .76, 248, height - 3);
  for (let x = 248; x > -244; x -= 12) {
    p.lineTo(x - 6, height - 5 + 2 * Math.cos(x * .021)); p.lineTo(x - 12, height - 1 + 2 * Math.cos(x * .021));
  }
  p.lineTo(-252, height - 4); p.bezierCurveTo(-258, height * .81, -247, height * .2, -252, 6);
  p.closePath(); return p;
}

function dashed(c, y, color) {
  c.save(); c.setLineDash([7, 6]); line(c, -206, y, 206, y, color, 1.8); c.restore();
}

function returnMark(c, x, y) {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  path(c, 'M-24 -4 L0 -15 L24 -4 L24 19 L0 31 L-24 19 Z M-24 -4 L0 8 L24 -4 M0 8 V31', null, green, 3.7);
  path(c, 'M13 -21 C10 -35 -11 -35 -20 -23 M-20 -33 V-22 H-9', null, green, 3.7);
  c.restore();
}

function receipt(c, row, chosen, open, run, trace, retrieval, point) {
  const retrievedBaseline = 566;
  const bottomMargin = 46;
  const recordHeight = 259 + 98 * run + 52 * trace;
  const h = blend(slipHeight, blend(recordHeight, retrievedBaseline + bottomMargin, retrieval), open);
  const paper = paperEdge(h);
  c.save(); c.shadowColor = '#51452e4c'; c.shadowBlur = 14; c.shadowOffsetX = 6; c.shadowOffsetY = 12;
  c.fillStyle = '#ece7d6'; c.fill(paper); c.restore();
  c.save(); c.clip(paper);
  c.fillStyle = gradient(c, -250, 25, 248, h - 90, [[0, '#fffcec'], [.38, '#fbf6e4'], [.83, '#f9f2de'], [1, '#eee4cb']]);
  c.fillRect(-264, 0, 528, h);
  // The slight roll at each torn edge catches light even when the two sheets are still.
  c.fillStyle = gradient(c, 0, 0, 0, 34, [[0, '#ad9c7959'], [.24, '#fffdf244'], [.58, '#fffaf126'], [1, '#fffaf100']]);
  c.fillRect(-255, 0, 510, 34);
  c.fillStyle = gradient(c, 0, h - 20, 0, h, [[0, '#b39a6a00'], [.68, '#aa906035'], [1, '#fffbea77']]);
  c.fillRect(-256, h - 20, 512, 20);

  const header = blend(88, 65, open);
  label(c, 'Reply ' + row.name.split(' ').at(-1), -207, header, blend(49, 39, open), sans, ink, 600);
  c.save(); c.translate(171, header - 17); c.scale(.82, .82); returnMark(c, 0, 0); c.restore();
  if (chosen > 0) {
    c.save(); c.globalAlpha *= chosen;
    c.beginPath(); c.moveTo(-206, header + 8); c.quadraticCurveTo(-154, header + 12, -206 + 120 * chosen, header + 7);
    c.strokeStyle = clay; c.lineWidth = 3; c.stroke(); c.restore();
  }
  dashed(c, header + 24, '#738276');
  label(c, row.reply, -209, blend(218, 162, open), blend(104, 79, open), serif);
  const y = blend(289, 217, open);
  label(c, 'Source', -204, y, 32, sans, '#45584e');
  label(c, row.citations.join(', '), -57, y, 42, mono, green);
  line(c, -58, y + 11, 181, y + 11, '#8b9987', 1.7);

  if (open > 0) {
    c.save();
    c.beginPath(); c.rect(-249, y + 25, 498, h - y - 29); c.clip();
    c.globalAlpha *= open;
    const foldY = 247;
    c.fillStyle = gradient(c, 0, foldY - 3, 0, foldY + 17, [[0, '#8f7b5511'], [.17, '#87765245'], [.42, '#fffbee'], [1, '#fffbee00']]);
    c.fillRect(-256, foldY - 3, 512, 20);
    if (run > 0) {
      c.save(); c.globalAlpha *= run;
      label(c, 'Run', -202, 292, 29, sans); label(c, row.run, -88, 292, 29); c.restore();
    }
    if (trace > 0) {
      c.save(); c.globalAlpha *= trace; path(c, 'M-191 306 v18 h15', null, '#778778', 2);
      label(c, 'Trace', -162, 334, 29, sans); label(c, row.trace, -46, 334, 29); c.restore();
    }
    if (retrieval > 0) {
      c.save(); c.globalAlpha *= retrieval;
      label(c, 'Retrieval input', -203, 389, 33, sans, green, 600);
      const parts = row.key.split(' '), tail = parts.pop();
      const word = tail.replace(/\?$/u, '');
      label(c, parts.join(' '), -205, 440, 40, serif);
      label(c, word, -207, 505, 69, serif);
      const suffixX = -207 + c.measureText(word).width;
      label(c, tail.slice(word.length), suffixX, 505, 69, serif, clay);
      if (point > 0) {
        // Each bracket spans exactly the final character position, including B's empty one.
        c.save(); c.beginPath(); c.rect(suffixX - 4, 510, 45 * point, 13); c.clip();
        c.strokeStyle = clay; c.lineWidth = 3.5; c.beginPath();
        c.moveTo(suffixX - 3, 511); c.lineTo(suffixX - 3, 516); c.quadraticCurveTo(suffixX + 15, 518, suffixX + 38, 515); c.lineTo(suffixX + 38, 510); c.stroke(); c.restore();
      }
      dashed(c, 528, '#8c9787');
      label(c, 'Retrieved', -204, retrievedBaseline, 31, sans);
      label(c, '[' + row.retrieved.join(', ') + ']', -20, retrievedBaseline, 31, mono, green);
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

// The camera rests in two poses while the slips feed. The cord and cast shadow fit
// inside these device-pixel rows. Each canvas retains only its last opaque strip.
const printerStrips = new WeakMap();

function drawPrinterOnDesk(c, sweep, inspect, feeding, x, y, scale) {
  const resting = inspect === 0 && (sweep === 0 || sweep === 1)
    && c.canvas.width === 1920 && c.canvas.height === 1080;
  const strip = resting && printerStrips.get(c);
  if (strip && strip.sweep === sweep && strip.feeding === feeding) {
    desk(c, strip.top, strip.top + strip.image.height);
    c.drawImage(strip.image, 0, strip.top);
    return;
  }

  desk(c);
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.translate(x, y); c.scale(scale, scale);
  printer(c, feeding);
  c.restore();
  if (resting) {
    const top = sweep === 0 ? 240 : 320;
    const bottom = sweep === 0 ? 1010 : 870;
    const image = createCanvas(1920, bottom - top);
    const pixels = c.getImageData(0, top, image.width, image.height);
    image.getContext('2d').putImageData(pixels, 0, 0);
    printerStrips.set(c, {sweep, feeding, image, top});
  }
}

function curve(p) { return smoothstep(clamp(p)); }

export function drawReceiptOpening(c, k, replies) {
  const b = k.beat.beatIndex;
  const cue = (beat, phrase, duration) => b < beat ? 0 : b > beat ? 1 : k.reveal(phrase, duration);
  const first = cue(0, 'Both replies', 1.9);
  const second = cue(0, 'You want to check', 1.6);
  const selected = cue(1, 'Replay B', .3);
  const inspect = curve(cue(1, 'In this local lab', 1.05));
  const run = cue(1, 'an MLflow run', .3);
  const trace = cue(1, 'links to a trace', .34);
  const retrieval = cue(1, 'Open the retrieval step', .42);
  const point = cue(1, 'Look all the way', .55);
  const leave = curve(cue(2, 'Keep B on the left', .78));

  // The first sheet clears the single slot before the second one moves.
  const sweep = curve((first - .53) / .47);
  const feedA = .046 + .954 * clamp(first / .48);
  const feedB = clamp(second / .83);
  const detach = curve((second - .83) / .17);
  const feedX = 965 + 287 * sweep, feedY = 547 - 13 * sweep;
  const lens = 1.48 - .48 * sweep;
  const printerY = feedY + inspect * 880;
  const feeding = feedB < 1 && (first > 0 || second > 0);
  drawPrinterOnDesk(c, sweep, inspect, feeding, feedX + 80 * inspect, printerY, lens);
  c.lineCap = 'round'; c.lineJoin = 'round';

  for (const [i, row] of replies.slice(0, 2).entries()) {
    const feed = i ? feedB : feedA;
    if (feed <= 0) continue;
    const parked = i ? detach : sweep;
    // The thermal head exposes scan lines only as the stock leaves the slot.
    const stepped = Math.floor(feed * 90) / 90;
    const fed = feed === 1 ? 1 : .45 * feed + .55 * stepped;
    const size = blend(lens, i ? 1.12 : 1.22, parked);
    const tilt = (i ? .023 : -.087) * parked;
    const x = blend(feedX, i ? 1288 : 508, parked);
    const bottom = blend(feedY + 12 * lens, i ? 529 : 683, parked)
      - (i ? 15 : 87) * Math.sin(Math.PI * parked);
    const closeX = i ? blend(1337, 497, leave) : blend(583, -490, leave);
    const closeScale = 1.29;
    c.save();
    if (parked < .001 && inspect === 0) {
      c.beginPath(); c.rect(0, 0, 1920, feedY + 10 * lens); c.clip();
    }
    c.translate(blend(x, closeX, inspect), blend(bottom - slipHeight * fed * size, 95, inspect));
    c.rotate(tilt * (1 - inspect));
    const scale = blend(size, closeScale, inspect);
    c.scale(scale, scale);
    receipt(c, row, i ? selected : 0, inspect, run, trace, retrieval, point);
    c.restore();
  }
  if (inspect === 0) {
    c.save(); c.translate(feedX, feedY); c.scale(lens, lens); cutter(c); c.restore();
  }
}
