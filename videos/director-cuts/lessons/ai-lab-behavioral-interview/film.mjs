import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';

const title = 'Who held the launch?';
const beats = [
  {
    id: 'we',
    say: '“We held the launch.” In this practice interview, one word makes the interviewer look up. “We? Which part was yours, Nia?”',
    hold: 1.1,
  },
  {
    id: 'what-nia-saw',
    say: '“It was Friday. We were testing a new way to rank support answers. My test reader couldn’t open a private returns note. But look at the search result. You could read a line from the note. Even the citation gave away private text.”',
    hold: 0.7,
  },
  {
    id: 'the-request',
    say: '“Product wanted to try it on five percent of requests before the rush of returns. We’d picked those cases specifically to test permissions. Two failures couldn’t tell us how often this would happen live. I asked Priya to keep the new version at zero. Once someone has read the words, rolling back can’t take them back.”',
    hold: 0.6,
  },
  {
    id: 'whose-work',
    say: '“I wrote the release check. On each build I could run those same two cases. If either one gave back private text, I’d ask to hold the launch. Omar owned the service. He fixed the permission check.”',
    hold: 0.5,
  },
  {
    id: 'the-second-run',
    say: '“I ran both cases again on Omar’s build. Remember where it said ‘Refund pending’? That space came back empty. So did the citation. Both cases passed. Live traffic to the new version was still at zero.”',
    hold: 0.8,
  },
  {
    id: 'whose-call',
    say: '“Priya reviewed the other release checks. Once those passed, she approved sending five percent of requests to the new version. That was her call.”',
    hold: 0.9,
  },
  {
    id: 'follow-up',
    say: 'This time the interviewer has a question just for Nia. “Can you show me the check you wrote?” “Sure. Here are my two runs.”',
    hold: 2.4,
  },
];

// Each output is what the offline reader actually received from a denied note.
const failedRun = { snippet: 'Refund pending', citation: 'Private returns note' };
const repairedRun = { snippet: '', citation: '' };
const fields = ['snippet', 'citation'];
function passed(run) {
  return fields.every(field => run[field] === '');
}
function liveShare(run, otherChecks, approved) {
  return passed(run) && otherChecks && approved ? 5 : 0;
}
function check() {
  assert.equal(passed(failedRun), false);
  for (const field of fields) {
    assert.equal(liveShare({ ...repairedRun, [field]: failedRun[field] }, true, true), 0);
    assert.equal(passed({ [field]: '' }), false);
  }
  assert.equal(passed(repairedRun), true);
  assert.equal(liveShare(repairedRun, false, true), 0);
  assert.equal(liveShare(repairedRun, true, false), 0);
  assert.equal(liveShare(repairedRun, true, true), 5);
  return true;
}

const ink = '#302237';
const paper = '#fff5de';
const vermilion = '#b62f38';
const blue = '#354f83';
const iris = '#5f478a';
const paths = new Map();
const clamp = x => Math.max(0, Math.min(1, x));
function ease(x) {
  const n = clamp(x);
  return n * n * (3 - 2 * n);
}
function shape(c, d, fill, stroke = null, width = 3) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  const path = paths.get(d);
  if (fill) {
    c.fillStyle = fill;
    c.fill(path);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(path);
  }
}
function oval(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
  c.fillStyle = fill;
  c.fill();
}
function text(c, words, x, y, size, options = {}) {
  const { family = 'Sans', color = ink, weight = 600, align = 'center', italic = false } = options;
  c.fillStyle = color;
  c.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(words, x, y);
}
function wash(c, light, shadow) {
  const g = c.createLinearGradient(0, 200, 1600, 1080);
  g.addColorStop(0, light);
  g.addColorStop(1, shadow);
  c.fillStyle = g;
  c.fillRect(0, 0, 1920, 1080);
}
// A single broad window shadow runs behind the figures like a second ink plate.
function room(c, warm = false) {
  wash(c, warm ? '#ffddaa' : '#efe0d4', warm ? '#f0a077' : '#cfb9cc');
  shape(c, 'M0 120 L830 0 H1090 L0 691 Z M1130 0 H1540 L0 982 V732 Z', warm ? '#ffe9c2' : '#fff0df');
  shape(c, 'M1920 165 V212 L686 1080 H615 Z', warm ? '#e6a47f' : '#bbaac2');
  c.save();
  c.globalAlpha = 0.22;
  c.fillStyle = warm ? '#99594a' : '#856982';
  c.beginPath();
  for (let y = 5; y < 1080; y += 13) {
    const extent = 40 + Math.max(0, (y - 360) * 0.32);
    for (let x = (y % 2) * 6; x < extent; x += 13) c.rect(1920 - x, y, 3, 3);
  }
  c.fill();
  c.restore();
}

const people = {
  nia: { skin: '#bb795b', shade: '#96543f', coat: '#d24c49', hem: '#a7323c', hair: '#372836' },
  omar: { skin: '#c8916e', shade: '#ac7059', coat: '#798e91', hem: '#526e79', hair: '#3d333c' },
  priya: { skin: '#ab6851', shade: '#8d5140', coat: '#466591', hem: '#324874', hair: '#312737' },
  interviewer: { skin: '#e1ab8c', shade: '#c48977', coat: '#5e527b', hem: '#4c405d', hair: '#ded3c3' },
};
function head(c, who, p, blink, speaking) {
  if (who === 'nia') {
    oval(c, -90, -145, 49, 46, p.hair);
    oval(c, -105, -115, 45, 43, p.hair);
    shape(c, 'M-121 -150 Q-114 -182 -85 -179 M-136 -122 Q-134 -146 -111 -151 M-125 -99 Q-116 -122 -100 -121', null, '#704958', 3);
    shape(c, 'M-92 -95 Q-85 -126 -69 -140', null, '#e48665', 8);
  }
  if (who === 'priya') {
    shape(c, 'M-97 34 Q-118 -38 -97 -118 Q-76 -180 5 -168 Q83 -164 73 -73 L53 32 Q5 52 -97 34 Z', p.hair, ink);
  }
  shape(c, 'M-78 -87 Q-84 -153 -12 -159 Q39 -167 62 -117 Q71 -104 68 -78 Q69 -58 85 -38 Q91 -29 75 -26 L68 -24 Q73 -9 65 -7 Q69 5 59 16 Q48 37 16 34 L-4 60 L-57 40 L-52 -7 Q-72 -15 -78 -87 Z', p.skin, ink, 3.8);
  shape(c, 'M-51 -17 Q-34 19 11 31 L-4 58 L-56 40 Z', p.shade);
  if (who === 'nia') {
    shape(c, 'M-68 -30 Q-102 -39 -100 -90 Q-109 -127 -76 -153 Q-53 -179 -8 -173 Q16 -182 42 -162 Q73 -159 71 -120 Q65 -108 54 -112 Q52 -137 34 -132 Q27 -106 5 -110 Q-2 -89 -22 -94 Q-24 -67 -49 -61 L-54 -34 Z', p.hair, ink, 3.7);
    shape(c, 'M-73 -123 Q-69 -153 -42 -154 M-54 -128 Q-46 -151 -26 -150 M-26 -136 Q-21 -153 -2 -152', null, '#805361', 2.5);
  } else if (who === 'omar') {
    shape(c, 'M-75 -40 Q-101 -58 -92 -120 Q-83 -162 -39 -167 Q-26 -191 2 -177 Q36 -201 61 -175 Q87 -170 71 -135 Q49 -105 3 -114 Q-28 -109 -51 -89 L-57 -42 Z', p.hair, ink);
    shape(c, 'M-55 -123 Q-31 -150 -4 -144 M-10 -153 Q19 -170 37 -161', null, '#8e8383', 4);
    shape(c, 'M-60 -40 Q-38 -21 -28 -1 Q-6 16 14 12 Q37 -1 48 -9 Q57 -16 66 -6 L64 10 Q40 48 13 43 Q-39 35 -52 2 Z', '#65535a');
    shape(c, 'M-7 19 l6 8 M4 21 l5 7 M18 24 l4 5 M-22 11 l6 7', null, '#ac9693', 2.4);
  } else if (who === 'priya') {
    shape(c, 'M-97 26 Q-114 -72 -89 -126 Q-66 -183 -5 -172 Q62 -184 75 -121 Q55 -136 42 -126 Q19 -97 -28 -99 Q-21 -63 -42 -33 L-56 34 Z', p.hair, ink);
    shape(c, 'M-81 -5 Q-86 -57 -65 -97 M-72 4 Q-68 -51 -53 -66 M-14 -148 Q18 -159 45 -143', null, '#71505c', 3);
  } else {
    shape(c, 'M-82 -25 Q-104 -70 -96 -122 Q-99 -140 -79 -151 Q-61 -181 -24 -173 Q12 -194 48 -167 Q79 -164 73 -138 Q52 -114 17 -116 Q-19 -122 -42 -87 L-55 -32 Z', p.hair, ink, 3.5);
    shape(c, 'M-77 -111 Q-72 -143 -43 -149 M-52 -125 Q-23 -163 15 -155 M-44 -116 Q-18 -143 11 -140', null, '#b0a29c', 3);
  }
  oval(c, -51, -47, 16, 22, p.skin, -0.2);
  shape(c, 'M-59 -52 Q-50 -61 -44 -48 L-51 -41', null, p.shade, 3);
  if (who === 'nia' || who === 'priya') {
    oval(c, -53, -29, 5.8, 5.8, '#ffda8b');
  }
  shape(c, 'M13 -82 Q33 -95 53 -86', null, p.hair, 6);
  c.save();
  c.translate(39, -64);
  c.scale(1, Math.max(0.08, 1 - blink));
  shape(c, 'M-21 2 Q-8 -17 14 -5 L20 -1 Q4 11 -14 8 Z', paper, ink, 2.4);
  oval(c, 8, -1, 6.2, 8, ink);
  c.restore();
  c.save();
  c.translate(45, -1);
  c.scale(1, 0.15 + speaking * 1.35);
  shape(c, 'M0 0 Q9 3 20 -2 Q17 15 7 7 Z', ink);
  c.restore();
  shape(c, 'M45 -1 Q54 3 65 -3', null, ink, 2.8);
  if (who === 'nia') {
    shape(c, 'M-52 -62 L4 -66 M1 -73 Q18 -83 58 -77 L62 -67 Q62 -42 41 -40 Q12 -37 5 -59 Z M61 -69 L72 -68', null, '#802d37', 6.5);
  }
}
function portrait(c, who, x, y, scale, face, seconds, tilt = 0, speaking = 0) {
  const p = people[who];
  c.save();
  c.translate(x, y);
  c.scale(scale * face, scale);
  shape(c, 'M-57 31 Q-71 46 -92 58 Q-134 84 -148 142 L-173 265 L163 265 Q143 172 123 113 Q106 63 57 54 L14 36 L-21 56 Z', p.coat, ink, 4);
  shape(c, 'M-85 74 Q-114 115 -124 172 L-133 265 L-173 265 L-149 139 Q-136 93 -85 74 Z', p.hem);
  shape(c, 'M73 100 Q88 136 84 170 M79 162 Q57 187 57 228', null, p.hem, 4);
  if (who === 'nia') {
    shape(c, 'M-58 31 Q-57 65 -16 72 Q6 70 22 48 L14 37 Q-17 56 -58 31 Z', ink);
    for (let n = 0; n < 5; n++) {
      c.save(); c.translate(n * 7, n * 2.5);
      shape(c, 'M-104 84 L-110 95', null, '#f8aa86', 2.5);
      c.restore();
    }
  } else if (who === 'omar') {
    shape(c, 'M-59 31 L-17 53 L-39 84 L-75 50 Z M-15 53 L13 36 L48 51 L3 83 Z', '#d1c6a9', ink, 2.6);
    shape(c, 'M-14 57 L-3 253', null, p.hem, 3);
    for (const cy of [93, 123, 153, 183]) oval(c, -10 + (cy - 93) / 30, cy, 2.5, 2.5, ink);
  } else {
    shape(c, 'M-57 32 Q-26 60 18 37 L34 48 L12 149 L-25 113 Z', paper);
    shape(c, 'M-55 32 L-73 57 L-53 75 L-62 87 L9 159 M20 39 L50 53 L35 79 L46 84 L12 154', null, p.hem, 3.5);
  }
  const blink = Math.max(0, 1 - Math.abs(((seconds + (who === 'nia' ? 1.1 : 3.2)) % 6.3) - 4) / 0.12);
  c.rotate(tilt);
  head(c, who, p, blink, speaking);
  c.restore();
}

// Stroke and fill a single outline so the balloon's tail belongs to its speaker.
function balloon(c, x, y, w, h, tx, ty, tail, fill = paper) {
  const cx = x + w * tail;
  c.beginPath();
  c.moveTo(x + w * 0.16, y + 5);
  c.bezierCurveTo(x + w * 0.39, y - h * 0.06, x + w * 0.8, y - 2, x + w * 0.88, y + 9);
  c.bezierCurveTo(x + w * 1.04, y + h * 0.14, x + w * 1.03, y + h * 0.77, x + w * 0.89, y + h * 0.91);
  c.quadraticCurveTo(x + w * 0.84, y + h, cx + 35, y + h);
  c.quadraticCurveTo(cx + 25, y + h + 18, tx, ty);
  c.quadraticCurveTo(cx - 17, y + h + 12, cx - 40, y + h);
  c.bezierCurveTo(x - w * 0.05, y + h * 1.04, x - w * 0.03, y + h * 0.83, x + 3, y + h * 0.45);
  c.quadraticCurveTo(x + 3, y + h * 0.13, x + w * 0.16, y + 5);
  c.closePath();
  c.fillStyle = fill; c.fill();
  c.strokeStyle = ink; c.lineWidth = 5; c.stroke();
}
function inkCircle(c, x, y, rx, ry, p) {
  if (p <= 0) return;
  c.beginPath();
  // Draw the overshooting pencil stroke explicitly, including its short overlap.
  for (let i = 0; i <= 90; i++) {
    const a = 3.5 + 6.55 * ease(p) * i / 90;
    const px = x + rx * Math.cos(a);
    const py = y + ry * Math.sin(a) - 0.06 * (px - x);
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.strokeStyle = vermilion;
  c.lineWidth = 7;
  c.stroke();
}
function interview(c, clock) {
  room(c);
  const ask = ease(clock.reveal('one word', 0.62));
  const talking = clock.elapsed < clock.speechDuration ? Math.sin(clock.elapsed * 8.4) ** 2 : 0;
  const firstLine = 1 - clock.reveal('In this practice interview', 0.1);
  const question = clock.reveal('Which part was yours', 0.12);
  portrait(c, 'nia', 374, 656, 2.15, 1, clock.seconds, -0.013, talking * firstLine);
  portrait(c, 'interviewer', 1590, 661, 2.02, -1, clock.seconds, 0.075 - 0.14 * ask, talking * question);
  // The first word is already leaving her mouth as the course chime ends.
  c.save();
  const arrival = ease(clock.elapsed / 0.42);
  c.translate(0, 32 * (1 - arrival));
  balloon(c, 140, 78, 960, 190, 549, 565, 0.55);
  const sentence = 'We held the launch.';
  text(c, sentence, 618, 172, 81, { family: 'Serif', weight: 400 });
  const left = 618 - c.measureText(sentence).width / 2;
  const weWidth = c.measureText('We').width;
  inkCircle(c, left + weWidth / 2, 169, weWidth / 2 + 13, 55, ask);
  c.restore();
  if (ask > 0) {
    c.save(); c.globalAlpha = ask;
    balloon(c, 855, 310, 611, 192, 1431, 616, 0.7, '#efeaf9');
    text(c, 'Which part', 1160, 372, 60, { family: 'Serif', weight: 400 });
    text(c, 'was yours?', 1160, 443, 60, { family: 'Serif', weight: 400 });
    c.restore();
  }
}

const lenses = [
  'M178 335 Q462 286 808 315 Q866 322 867 383 Q860 572 809 669 Q779 737 648 750 Q447 769 287 724 Q171 696 144 584 L119 427 Q104 349 178 335 Z',
  'M1116 315 Q1469 283 1733 329 Q1817 343 1804 431 L1776 589 Q1752 698 1635 728 Q1470 769 1272 746 Q1147 731 1117 663 Q1069 555 1060 392 Q1055 322 1116 315 Z',
];
function eyeReflection(c, x, gaze) {
  c.save();
  c.translate(x, 408);
  shape(c, 'M-126 5 Q-70 -65 19 -56 Q78 -52 122 -3 Q54 46 -15 46 Q-74 45 -126 5 Z', '#ffebca', '#975b52', 5);
  oval(c, 14 + 18 * gaze, -4, 43, 49, '#895758');
  oval(c, 16 + 18 * gaze, -3, 23, 34, ink);
  oval(c, 5 + 18 * gaze, -16, 8.5, 8.5, '#fff2da');
  c.restore();
}
function glasses(c, clock, mode) {
  const rerun = mode === 'rerun';
  const proof = mode === 'proof';
  wash(c, '#bb795b', '#ce8b6a');
  shape(c, 'M0 0 H1492 Q1341 95 1092 66 Q903 130 693 80 Q477 175 387 114 Q258 255 148 247 L0 381 Z', people.nia.hair);
  shape(c, 'M0 0 H716 Q526 114 373 91 Q249 199 141 204 Q95 266 0 279 Z', '#493043');
  shape(c, 'M1015 334 Q1038 536 1119 712 Q1157 789 1079 810 Q1033 832 1016 813', null, '#9d594c', 15);
  shape(c, 'M953 833 Q925 813 894 841 M1018 830 Q1040 809 1063 825', null, '#794743', 11);
  shape(c, 'M717 1000 Q827 966 902 964 Q957 943 1015 964 Q1099 979 1220 956 Q1124 1032 981 1034 Q807 1034 717 1000 Z', '#934e51');
  shape(c, 'M771 994 Q900 997 966 983 Q1071 996 1179 969', null, '#6a4045', 7);
  shape(c, 'M226 258 Q456 152 718 246 Q745 253 713 268 Q475 232 232 279 Z M1157 248 Q1407 143 1658 231 L1704 266 Q1437 232 1163 275 Z', people.nia.hair);
  shape(c, 'M-20 323 L148 362 M845 376 Q956 312 1081 376 M1788 365 L1940 309', null, ink, 42);
  shape(c, 'M-20 319 L148 359 M845 372 Q956 309 1081 372 M1788 361 L1940 305', null, '#bc454c', 25);
  const clear = rerun ? ease(clock.reveal('both cases again', 0.48)) : 0;
  const snippetArrives = rerun ? ease(clock.reveal('Remember where', 0.5)) : ease((clock.elapsed - 0.12) / 0.65);
  const citationArrives = proof ? 1 : rerun ? ease(clock.reveal('That space came back empty', 0.65)) : ease(clock.reveal('a line from the note', 0.6));
  const gaze = -1 + 2 * citationArrives;
  for (const [i, d] of lenses.entries()) {
    const x = i === 0 ? 494 : 1431;
    const key = fields[i];
    const glass = c.createLinearGradient(0, 300, 0, 747);
    glass.addColorStop(0, '#e9c7ac');
    glass.addColorStop(0.68, '#f8ddba');
    glass.addColorStop(1, '#fff3d9');
    shape(c, d, glass);
    c.save();
    c.clip(paths.get(d));
    eyeReflection(c, x, gaze);
    const reflection = c.createLinearGradient(0, 446, 0, 579);
    reflection.addColorStop(0, '#fff5de00');
    reflection.addColorStop(1, '#fff4dc');
    c.fillStyle = reflection;
    c.fillRect(x - 450, 446, 900, 335);
    text(c, key === 'snippet' ? 'Snippet' : 'Citation', x, proof ? 505 : 526, 43, { color: '#6b4852' });
    if (proof) {
      const rowX = x - 277;
      const valueX = rowX + 160;
      text(c, 'Friday', rowX, 583, 39, { align: 'left', color: '#73534e' });
      text(c, failedRun[key], valueX, 583, 47, { align: 'left', family: 'Serif', weight: 400 });
      text(c, 'Rerun', rowX, 660, 39, { align: 'left', color: '#335e4d' });
      text(c, repairedRun[key] === '' ? 'Withheld' : repairedRun[key], valueX, 660, 51, { align: 'left', family: 'Serif', weight: 400, color: '#315f51' });
    }
    c.save();
    const arrival = i === 0 ? snippetArrives : citationArrives;
    const seen = proof ? 0 : rerun ? 1 - clear : arrival;
    if (seen > 0) {
      c.globalAlpha = seen;
      text(c, failedRun[key], x, 620 - 12 * (1 - seen), i ? 57 : 66, { family: 'Serif', weight: 400 });
    }
    c.restore();
    if (rerun && arrival > 0 && repairedRun[key] === '') {
      c.save();
      c.globalAlpha = arrival;
      c.beginPath(); c.moveTo(x - 184, 617); c.lineTo(x - 162, 638); c.lineTo(x - 129, 590);
      c.strokeStyle = '#34614e'; c.lineWidth = 9; c.stroke();
      text(c, 'Withheld', x + 39, 616, 64, { color: '#315f51', family: 'Serif', weight: 400 });
      c.restore();
    }
    shape(c, 'M-110 734 L475 198 H564 L-27 743 Z M987 728 L1575 191 H1644 L1050 738 Z', '#ffffff33');
    c.restore();
    shape(c, d, null, ink, 38);
    shape(c, d, null, '#ae3b44', 23);
    shape(c, d, null, '#e97866', 4);
  }
  // Printed against the dark hair, the test context stays put between runs.
  c.fillStyle = ink;
  c.fillRect(0, 0, 1920, 83);
  const heading = proof ? 'Nia’s release check  /  Offline' : clear >= 1 ? 'Offline rerun  /  Repaired build' : 'Offline test  /  Friday, 09:12';
  text(c, heading, 80, 42, 39, { color: paper, align: 'left', family: 'Mono', weight: 400 });
  text(c, 'Reader access denied', 1840, 42, 39, { color: '#f0bb99', align: 'right' });
  if (rerun && clock.reveal('Live traffic', 0.38) > 0) {
    c.save(); c.globalAlpha = clock.reveal('Live traffic', 0.38);
    c.fillStyle = ink; c.fillRect(1185, 795, 560, 81);
    text(c, 'New version  ·  ' + liveShare(repairedRun, false, false) + '% live', 1465, 835, 39, { color: paper });
    c.restore();
  }
}

function proposal(c, clock) {
  room(c, true);
  const reply = ease(clock.reveal('I asked Priya', 0.55));
  portrait(c, 'nia', 600, 709, 2.8, 1, clock.seconds, reply * -0.025);
  balloon(c, 1091, 86, 679, 210, 1910, 395, 0.8, '#eee7f3');
  text(c, 'Could we try 5%?', 1434, 187, 72, { family: 'Serif', weight: 400 });
  text(c, 'Product', 1428, 342, 39, { color: '#614353' });
  if (reply > 0) {
    c.save(); c.globalAlpha = reply;
    balloon(c, 886, 440, 779, 190, 839, 697, 0.23);
    text(c, 'Hold at 0%.', 1275, 531, 93, { family: 'Serif', weight: 400 });
    c.restore();
  }
}

const cast = [
  { id: 'nia', color: '#df8c76', role: 'Nia', verb: 'I wrote', object: 'the release check.' },
  { id: 'omar', color: '#b5c9bc', role: 'Omar · Service owner', verb: 'I fixed', object: 'access.' },
  { id: 'priya', color: '#a7b8d7', role: 'Priya · Release owner', verb: 'I approved' },
];
function spread(c, clock) {
  const early = clock.index === 3;
  const last = clock.index === 6;
  const fix = early ? ease(clock.reveal('Omar owned the service', 1.1)) : 1;
  const approval = early ? 0 : last ? 1 : ease(clock.reveal('she approved', 0.4));
  const focus = last ? ease(clock.reveal('just for Nia', 0.94)) : 0;
  // The page opens to admit the third speaker. The first two remain in place.
  const third = early ? 0 : last ? 1 : ease(clock.elapsed / 1.25);
  const panelWidth = 960 - 320 * third;
  const revealed = [1, fix, approval];
  c.fillStyle = paper;
  c.fillRect(0, 0, 1920, 1080);
  for (const [i, actor] of cast.entries()) {
    const left = panelWidth * i;
    if (left >= 1920) break;
    const w = i === 2 ? 640 : panelWidth;
    const x = w / 2;
    c.save();
    c.translate(left, 0);
    c.beginPath();
    c.rect(0, 0, w - (i === 2 ? 0 : 7), 1080);
    c.clip();
    c.fillStyle = actor.color;
    c.fillRect(0, 0, w, 1080);
    c.save();
    c.scale(w / 830, 1);
    shape(c, 'M0 459 L830 -98 V-251 L0 277 Z M0 582 L830 9 V-29 L0 546 Z', '#fff5df54');
    c.restore();
    const orientation = i === 2 ? -1 : 1;
    const scale = 1.94 + 0.14 * (w - 640) / 320;
    const headX = x - 37 * orientation;
    c.save();
    c.beginPath(); c.rect(0, 0, w, 840); c.clip();
    portrait(c, actor.id, headX, 668, scale, orientation, clock.seconds);
    c.restore();
    c.fillStyle = ink; c.fillRect(0, 839, w, 5);
    text(c, actor.role, x, 894, 46, { weight: 600 });
    if (revealed[i] > 0) {
      c.save(); c.globalAlpha = revealed[i];
      const bw = Math.min(w * 0.90, 746);
      const fs = bw * 0.101;
      const mouthX = headX + orientation * 89 * scale;
      balloon(c, x - bw / 2, 67, bw, 214, mouthX, 636, i === 2 ? 0.12 : 0.9);
      text(c, actor.verb, x, 132, fs, { family: 'Serif', weight: 400 });
      const object = i === 2 ? 'the ' + liveShare(repairedRun, true, true) + '% canary.' : actor.object;
      text(c, object, x, 214, fs, { family: 'Serif', weight: 400 });
      if (i === 0) inkCircle(c, x, 214, c.measureText(object).width / 2 + 10, fs * 0.67, focus);
      c.restore();
    }
    c.restore();
  }
}
function draw(c, clock) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (clock.index) {
    case 0: interview(c, clock); break;
    case 1: glasses(c, clock, 'friday'); break;
    case 2: proposal(c, clock); break;
    case 4: glasses(c, clock, 'rerun'); break;
    case 6:
      if (clock.reveal('the check you wrote', 0.1) >= 1) glasses(c, clock, 'proof');
      else spread(c, clock);
      break;
    default: spread(c, clock);
  }
  c.restore();
}
export default { title, beats, draw, check };
