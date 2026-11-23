import assert from 'node:assert/strict';
import {
  FRESH_FIXTURE,
  FRESH_MOUNTED,
  FRESH_REPAIRED,
} from '../../../films/docker-containerization-reproducible-ai/fixtures.mjs';
import { score, visibleFixture } from '../../../films/docker-containerization-reproducible-ai/model.mjs';

const beats = [
  {
    id: 'blue-reel',
    say: 'Each window is a request in our test file. When its prediction matches the expected answer, the window lights up. How many can you count?',
    hold: 1.15,
  },
  {
    id: 'image-copy',
    say: 'Five matches from the file we built into the Docker image. Look at request three oh five. The expected answer is approved. So is the saved prediction.',
    hold: 0.8,
  },
  {
    id: 'cover',
    say: 'Start a fresh container from the same image. Watch what lands over the blue file. The scorer opens the same path again. Keep your eye on three oh five.',
    hold: 1.1,
  },
  {
    id: 'four',
    say: 'Four. That prediction now says escalated. The gold file lives on the host. A Docker bind mount puts the host directory at this path inside the container. The blue copy is still underneath. Which copy would you repair?',
    hold: 0.8,
  },
  {
    id: 'restore',
    say: 'Check the version of that row we committed to Git. It says approved. The mount is read-only inside the container. On the host, we can put the committed value back.',
    hold: 1.2,
  },
  {
    id: 'read-again',
    say: 'The words match again. Why does the counter still say four? That was the last run. Start another container with the same image and the repaired host file.',
    hold: 1.1,
  },
  {
    id: 'fifth-window',
    say: 'Five again. We used the same image all three times. That fifth match came back from the file on the host.',
    hold: 3.2,
  },
];

const request = 305;
const imageView = visibleFixture(FRESH_FIXTURE);
const hostView = visibleFixture(FRESH_FIXTURE, FRESH_MOUNTED);
const repairedView = visibleFixture(FRESH_FIXTURE, FRESH_REPAIRED);
const selected = view => view.rows.find(row => row.id === request);

function check() {
  assert.deepEqual([imageView, hostView, repairedView].map(v => [v.source, v.report.matches, v.report.total]), [
    ['image', 5, 7], ['mount', 4, 7], ['mount', 5, 7],
  ]);
  assert.ok([hostView, repairedView].every(v => v.storedRows === FRESH_FIXTURE));
  assert.deepEqual(hostView.rows.filter((row, i) => row.prediction !== FRESH_FIXTURE[i].prediction).map(row => row.id), [request]);
  assert.equal(selected(hostView).prediction, 'escalated');
  assert.equal(selected(repairedView).prediction, selected(imageView).prediction);
  assert.deepEqual(FRESH_REPAIRED, FRESH_FIXTURE);
}

const tau = 2 * Math.PI;
const limit = x => Math.max(0, Math.min(1, x));
function ease(x) {
  const t = limit(x);
  return t * t * (3 - 2 * t);
}

const center = { x: 562, y: 524 };
const radius = 344;
const focusIndex = imageView.rows.findIndex(row => row.id === request);
const step = tau / imageView.rows.length;
const imageColors = { bright: '#7dafbf', mid: '#488295', dark: '#295564', ink: '#092d3c', text: '#f0f6eb' };
const hostColors = { bright: '#f1c278', mid: '#da9e50', dark: '#9b602c', ink: '#583e28', text: '#412c24' };
const cream = '#f4ebce';
const enamel = '#253f41';

function gradient(ctx, x1, y1, x2, y2, stops) {
  const fill = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([at, color]) => fill.addColorStop(at, color));
  return fill;
}

function box(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function circle(ctx, x, y, r, fill, outline, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, tau);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function path(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(p => ctx.lineTo(...p));
  if (width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  } else {
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function type(ctx, value, x, y, size, color, family = 'Sans', weight = 400, align = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(String(value), x, y);
}

function screw(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  circle(ctx, 0, 1, 10, '#17282a', '#677776', 1.5);
  circle(ctx, 0, -1, 7.5, '#8b9287');
  path(ctx, [[-4, -1], [4, -1]], '#364748', 2.5);
  ctx.restore();
}

function housing(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 440, 1080, [[0, '#697877'], [0.52, '#546766'], [1, '#364d50']]);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  ctx.shadowColor = '#12292ac2';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 29;
  box(ctx, 85, 107, 1750, 803, 76, '#183237');
  ctx.restore();
  box(ctx, 85, 90, 1750, 803, 76,
    gradient(ctx, 148, 88, 1660, 884, [[0, '#496365'], [0.42, '#344f51'], [1, '#294245']]), '#788984', 3);
  box(ctx, 103, 107, 1714, 765, 61, '#00000000', '#82938b58', 2);
  // The circular recess is large enough to leave the image rim visible under the host reel.
  circle(ctx, center.x, center.y, 365, '#152d31', '#9aa69a', 3);
  circle(ctx, center.x, center.y, 353, '#172d30', '#587475', 3);
  for (const [x, y, a] of [[140, 145, 0.6], [1780, 145, -1.1], [140, 838, 1.8], [1780, 838, 0.9]]) {
    screw(ctx, x, y, a);
  }
}

function windowMark(ctx, matched, read) {
  const lit = matched && read;
  box(ctx, -45, -34, 90, 63, 12, '#142e30', '#eee8c07a', 2.5);
  box(ctx, -40, -29, 80, 52, 8, lit
    ? gradient(ctx, 0, -29, 0, 23, [[0, '#fff8dd'], [1, '#d4e5b1']])
    : '#334347');
  if (!read) return;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (matched) {
    path(ctx, [[-18, -2], [-5, 10], [19, -15]], '#254b43', 8);
  } else {
    path(ctx, [[-10, -12], [10, 8]], '#c8c6ad', 6);
    path(ctx, [[10, -12], [-10, 8]], '#c8c6ad', 6);
  }
}

function reel(ctx, { x, y, angle, rows, host, readCount, spotlight }) {
  const c = host ? hostColors : imageColors;
  const r = host ? radius - 15 : radius;
  ctx.save();
  ctx.translate(x, y);
  ctx.save();
  ctx.shadowColor = '#0a191a95';
  ctx.shadowBlur = 13;
  ctx.shadowOffsetX = host ? -6 : 4;
  ctx.shadowOffsetY = 12;
  circle(ctx, 0, 0, r, c.dark);
  ctx.restore();
  circle(ctx, 0, 0, r, gradient(ctx, -r * 0.55, -r, r * 0.85, r, [[0, c.bright], [0.6, c.mid], [1, c.dark]]), c.ink, 2);
  for (const [radius, ink] of [[r - 4, '#f7f0cf8a'], [r - 19, c.dark], [r - 24, '#f3f2cc45'], [166, c.dark]]) {
    circle(ctx, 0, 0, radius, null, ink, 2);
  }

  ctx.save();
  ctx.rotate(angle);
  for (let i = 0; i < rows.length; i++) {
    const a = (i - focusIndex) * step;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    // Short radial cuts and a raised border distinguish the selected window by touch as well as color.
    const spoke = a - step / 2;
    path(ctx, [[172 * Math.cos(spoke), 172 * Math.sin(spoke)], [(r - 24) * Math.cos(spoke), (r - 24) * Math.sin(spoke)]], c.dark, 2);
    ctx.save();
    ctx.translate(247 * dx, 247 * dy);
    if (i === focusIndex && spotlight) {
      box(ctx, -66, -49, 132, 117, 16, '#00000000', c.text, 4);
    }
    const readIndex = (i - focusIndex - 1 + rows.length) % rows.length;
    windowMark(ctx, score([rows[i]]).matches === 1, readIndex < readCount);
    type(ctx, rows[i].id, 0, 48, 32, c.text, 'Mono', 400, 'center');
    ctx.restore();
  }
  ctx.restore();

  circle(ctx, 0, 0, 143, c.dark, '#f1f0cd99', 2);
  circle(ctx, 0, 0, 134, gradient(ctx, -108, -110, 60, 125, [[0, c.mid], [1, c.dark]]), c.ink, 1.5);
  type(ctx, host ? 'Host' : 'Image', 0, -31, 67, c.text, 'Serif', 400, 'center');
  type(ctx, 'eval file', 0, 26, 38, c.text, 'Sans', 400, 'center');
  // The asymmetrical keyway keeps the records registered in the reader.
  box(ctx, -16, 70, 32, 19, 7, '#213437', '#d1c8a2', 2);
  ctx.restore();
}

function countDrum(ctx, previous, next, turn) {
  const x = 1357, y = 161, w = 121, h = 118;
  type(ctx, 'Last run', 1087, 190, 50, cream, 'Serif');
  type(ctx, 'Matches', 1088, 248, 37, '#d2dbc9');
  box(ctx, x - 7, y - 7, w + 14, h + 14, 16, '#152729', '#7e8d83', 3);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 11);
  ctx.clip();
  ctx.fillStyle = gradient(ctx, x, y, x, y + h, [[0, '#9a9a84'], [0.25, '#e6dfbf'], [0.55, '#f4ebce'], [1, '#b7b69b']]);
  ctx.fillRect(x, y, w, h);
  if (turn < 1) type(ctx, previous, x + w / 2, y + h / 2 - turn * h, 91, '#213639', 'Mono', 400, 'center');
  if (turn > 0) type(ctx, next, x + w / 2, y + 1.5 * h - turn * h, 91, '#213639', 'Mono', 400, 'center');
  ctx.restore();
  type(ctx, '/ ' + imageView.report.total, 1505, 219, 70, cream, 'Mono');
}

function projection(ctx, row, light, host, git) {
  // The fixed aperture leads from the reel to a ground-glass enlargement of a single request.
  path(ctx, [[879, 506], [1114, 371], [1114, 703], [879, 542]], gradient(ctx, 879, 0, 1114, 0, [
    [0, '#c9dec32c'], [1, '#e9daaf68'],
  ]));
  path(ctx, [[875, 504], [897, 513], [897, 536], [875, 545]], '#c4bda1');
  box(ctx, 895, 500, 23, 51, 6, '#132b31', '#c4bda1', 2);
  box(ctx, 1083, 336, 637, 386, 36, '#172e31', '#849086', 3);
  box(ctx, 1095, 347, 613, 364, 27, gradient(ctx, 1125, 354, 1664, 707, [
    [0, '#e0d9ba'], [0.52, '#f5edcd'], [1, '#d7d4b5'],
  ]));
  type(ctx, 'Request ' + row.id, 1136, 408, 54, '#304445', 'Serif');
  path(ctx, [[1136, 453], [1664, 453]], '#879587', 2);
  type(ctx, 'Expected', 1136, 514, 36, '#475954');
  type(ctx, row.expected, 1664, 514, 52, '#253b3d', 'Mono', 400, 'right');
  type(ctx, 'Prediction', 1136, 594, 36, '#475954');
  type(ctx, row.prediction, 1664, 594, 52, host ? '#7b471e' : '#28586c', 'Mono', 400, 'right');
  if (git > 0) {
    ctx.save();
    ctx.globalAlpha *= git;
    type(ctx, 'Git copy', 1136, 669, 32, '#475954');
    type(ctx, selected(imageView).prediction, 1664, 669, 38, '#314a43', 'Mono', 400, 'right');
    ctx.restore();
  }
  // A shutter closes during each read. Numbers from the last run remain on the separate drum.
  if (light < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(1095, 347, 613, 364, 27);
    ctx.clip();
    const half = 182 * (1 - light);
    ctx.fillStyle = enamel;
    ctx.fillRect(1095, 347, 613, half);
    ctx.fillRect(1095, 711 - half, 613, half);
    ctx.restore();
  }
  type(ctx, '/app/eval/', 1085, 789, 47, cream, 'Mono');
  type(ctx, 'access_requests.jsonl', 1087, 838, 36, '#c2cdbf', 'Mono');
}

function pictureState(clock) {
  const { index, elapsed, reveal } = clock;
  const state = {
    mount: index >= 3 ? 1 : 0,
    angle: 0, readCount: 7, light: 1, git: 0, edit: index >= 5,
    prior: imageView.report.matches, next: hostView.report.matches, turn: index >= 3 ? 1 : 0,
  };
  if (index === 0) {
    const scan = limit(elapsed / 5.1);
    state.angle = (1 - scan) * tau;
    state.readCount = Math.floor(scan * imageView.rows.length);
    state.prior = '·';
    state.next = imageView.report.matches;
    state.turn = ease((elapsed - clock.speechDuration - 0.28) / 0.34);
    state.light = ease((elapsed - 5.1) / 0.65);
  } else if (index === 2) {
    const travel = reveal('Watch what lands', 1.9);
    const scan = ease(reveal('The scorer opens', 2.4));
    state.mount = ease(travel);
    state.angle = (1 - scan) * tau;
    state.light = 1 - ease(travel * 3) + ease((scan - 0.94) / 0.06);
    state.readCount = Math.floor(scan * hostView.report.total);
    state.turn = ease((scan - 0.94) / 0.06);
  } else if (index === 4) {
    state.git = ease(reveal('the version', 0.48));
    state.edit = reveal('put the committed value back', 0.65) === 1;
  } else if (index === 5) {
    state.git = 1 - ease(reveal('Start another container', 0.4));
    const scan = ease(reveal('Start another container', 3.1));
    state.angle = (1 - scan) * tau;
    state.light = 1 - Math.min(1, Math.min(scan, 1 - scan) * 9);
    state.readCount = scan === 0 ? repairedView.report.total : Math.floor(scan * repairedView.report.total);
    state.prior = hostView.report.matches;
    state.next = repairedView.report.matches;
    state.turn = ease((scan - 0.96) / 0.04);
  } else if (index === 6) {
    state.next = repairedView.report.matches;
  }
  return state;
}

function draw(ctx, clock) {
  const state = pictureState(clock);
  const mounted = state.mount === 1;
  const host = state.edit ? repairedView : hostView;
  // Start close enough to follow a single window. Move to the glass while comparing the two files.
  const opening = clock.index === 0 ? 1 - ease((clock.elapsed - 1.2) / 4.1) : 0;
  let inspection = 0;
  if (clock.index === 3) inspection = ease(clock.reveal('That prediction', 1.7));
  if (clock.index === 4) inspection = 1;
  if (clock.index === 5) inspection = 1 - ease(clock.reveal('Start another container', 1.25));
  const zoom = 1 + opening * 0.82 + inspection * 0.34;
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-(960 - 430 * opening + 188 * inspection), -(540 - 40 * opening - 26 * inspection));
  housing(ctx);
  reel(ctx, {
    ...center, rows: imageView.rows, host: false, angle: clock.index === 0 ? state.angle : 0,
    readCount: clock.index === 0 ? state.readCount : imageView.report.total, spotlight: true,
  });
  if (state.mount > 0) {
    const gap = 1 - state.mount;
    reel(ctx, {
      x: center.x - gap * 940, y: center.y - gap * 290,
      rows: host.rows, host: true, angle: -gap * 0.42 + state.angle,
      readCount: state.readCount, spotlight: true,
    });
  }
  countDrum(ctx, state.prior, state.next, state.turn);
  projection(ctx, selected(mounted ? host : imageView), state.light, mounted, state.git);
  ctx.restore();
}

export default { title: 'Where did the fifth match go?', beats, draw, check };
