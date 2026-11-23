import { Path2D } from '@napi-rs/canvas';

const title = 'Who Can Cue the Moon?';
const beats = [
  {
    id: 'moonrise',
    say: 'Keep an eye on the sun behind the heron. Nell has asked the theatre assistant for moonrise. Where did the moon come up?',
    hold: 1.6,
  },
  {
    id: 'from-the-booth',
    say: 'On the preview monitor. Now Nell asks the assistant to put that same sky on the main stage. The assistant submits the cue with an approval number. Fourteen.',
    hold: 0.7,
  },
  {
    id: 'two-names',
    say: 'The show controller uses that number to find the stage manager’s approval. The cue and the stage both match. Read the name on the approval. Who’s signed in at the console?',
    hold: 1.8,
  },
  {
    id: 'in-the-auditorium',
    say: 'Kit has approval to run this cue. Nell is signed in. The controller declines her request before it reaches the projector. From the audience, it’s still afternoon.',
    hold: 1.0,
  },
  {
    id: 'another-take',
    say: 'The stage manager approves Nell to run Moonrise on the main stage. Nell asks again, with the new approval number. See who the controller finds this time.',
    hold: 1.5,
  },
  {
    id: 'on-stage',
    say: 'Look up from the monitor. This approval covers the person at the console and the cue she asked to run. Now the audience can see her moon.',
    hold: 3,
  },
];

const session = { operator: 'Nell' };
const cue = { action: 'project', stage: 'Main stage', scene: 'Moonrise', revision: 3 };
const managerRecord = (operator) => ({ ...cue, operator, status: 'approved' });
const approvals = new Map([[14, managerRecord('Kit')], [15, managerRecord('Nell')]]);
const firstRequest = { ...cue, approval: 14 };
const secondRequest = { ...cue, approval: 15 };

// Only the controller can dispatch a cue. It gets the operator from the session.
function decide(call, signedIn, records) {
  const record = records.get(call.approval);
  const sameCue = record && ['action', 'stage', 'scene', 'revision'].every(key => call[key] === record[key]);
  const allowed = Boolean(sameCue && record.status === 'approved' && record.operator === signedIn.operator);
  return { record, output: allowed ? call.scene : null };
}

const first = decide(firstRequest, session, approvals);
const second = decide(secondRequest, session, approvals);

function check() {
  function expect(value, message) { if (!value) throw new Error(message); }
  expect(first.record.operator === 'Kit' && first.output === null, 'Approval 14 belongs to Kit.');
  expect(second.record.operator === 'Nell' && second.output === 'Moonrise', 'Approval 15 covers this cue for Nell.');
  for (const change of [{ stage: 'Studio' }, { revision: 4 }, { approval: 16 }]) {
    expect(decide({ ...secondRequest, ...change }, session, approvals).output === null, 'The approval must cover the request.');
  }
  const live = [first, second].reduce((seen, result) => [...seen, result.output ?? seen.at(-1)], ['Daylight']);
  expect(live.join('/') === 'Daylight/Daylight/Moonrise', 'The projector changes only on dispatch.');
}

const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const p = clamp(x); return p * p * (3 - 2 * p); };
function tint(a, b, t) {
  const rgb = [0, 2, 4].map(i => {
    const c = parseInt(a.slice(i, i + 2), 16);
    return Math.round(c + (parseInt(b.slice(i, i + 2), 16) - c) * t);
  });
  return 'rgb(' + rgb.join(',') + ')';
}

function wash(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [pos, color] of stops) g.addColorStop(pos, color);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

const paths = new Map();
function ink(ctx, d, color) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  ctx.fillStyle = color;
  ctx.fill(paths.get(d));
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function panel(ctx, x, y, w, h, color, r = 0) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function label(ctx, value, x, y, size, color, family = 'Sans', weight = 400, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function star(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r, r);
  ink(ctx, 'M0 -1 Q0 -.18 .72 0 Q.12 .08 0 1 Q-.08 .15 -.72 0 Q-.1 -.1 0 -1Z', '#fff0c0');
  ctx.restore();
}

function heron(ctx, night) {
  const feather = tint('323237', '201e3a', night);
  ctx.save();
  ctx.translate(590, 366);
  ctx.scale(1.31, 1.31);
  ink(ctx, 'M-13 -56 L-10 -49 L-11 -25 L-9 -3 L3 -1 L5 1 L-15 0 L-15 -23Z M12 -58 L16 -54 L11 -28 L19 -10 L29 -9 L31 -7 L16 -8 L7 -27Z', feather);
  ink(ctx, 'M-74 -66 Q-57 -68 -42 -80 Q-23 -96 -1 -91 Q12 -87 15 -93 Q20 -103 3 -112 Q-9 -118 -4 -133 Q1 -147 18 -150 L36 -151 L46 -145 L91 -140 L46 -137 Q38 -133 26 -135 Q11 -138 8 -130 Q6 -125 19 -117 Q46 -99 35 -80 Q29 -70 18 -64 Q-8 -46 -44 -63 L-67 -58 L-57 -65Z', feather);
  ink(ctx, 'M-58 -68 Q-23 -96 0 -86 Q-14 -72 -49 -66 L-33 -76Z', tint('65534d', '4f496b', night));
  ink(ctx, 'M43 -144 L91 -140 L43 -140Z', tint('f0b552', 'dfbd8e', night));
  ink(ctx, 'M17 -150 Q-1 -156 -17 -145 Q3 -151 13 -146 L-8 -141 L17 -145Z', feather);
  oval(ctx, 32, -144, 2.1, 2.1, '#ffddb3');
  ctx.restore();
}

function rushes(ctx, x, y, s, color, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * flip, s);
  ink(ctx, 'M0 0 Q-2 -29 -22 -50 Q-7 -40 4 -8 Q-3 -52 9 -80 Q1 -50 9 -8 Q15 -54 33 -65 Q18 -43 12 -8 Q30 -32 45 -33 Q26 -21 16 0Z', color);
  ink(ctx, 'M2 0 Q-8 -45 -5 -94 L-3 -94 Q-6 -46 6 0Z M13 0 Q25 -36 24 -72 L26 -72 Q28 -38 16 0Z', color);
  oval(ctx, -4, -92, 3.7, 12, color);
  oval(ctx, 25, -75, 3.2, 10, color);
  ctx.restore();
}

const stars = [[101,73,5],[181,125,3],[272,50,4],[389,93,6],[498,48,4],[617,95,3],[723,51,6],[887,110,4],[995,51,7],[1085,101,3],[1134,40,5]];
// Both surfaces use the same projection artwork in a 1200 by 420 field.
function marsh(ctx, x, y, w, h, night) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w / 1200, h / 420);
  ctx.beginPath();
  ctx.rect(0, 0, 1200, 420);
  ctx.clip();
  wash(ctx, 0, 0, 1200, 420, [
    [0, tint('df8863', '25295f', night)], [.66, tint('ffd99a', '6767a6', night)],
    [1, tint('f8c182', 'd196ad', night)],
  ]);
  ctx.save();
  ctx.globalAlpha = 1 - night;
  oval(ctx, 805 - night * 150, 110 + night * 210, 57, 57, '#fff0a8');
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = night;
  for (const [sx, sy, r] of stars) star(ctx, sx, sy, r);
  ctx.translate(805, 102 + (1 - night) * 160);
  ink(ctx, 'M27 -55 C-40 -70 -76 -2 -44 40 C-15 78 46 67 62 18 C13 44 -29 -12 27 -55Z', '#fff2c5');
  ctx.restore();

  ink(ctx, 'M-8 243 Q83 202 148 223 Q232 239 284 212 Q376 181 434 203 Q475 211 508 198 Q625 153 699 189 Q759 211 854 184 Q928 157 1002 185 Q1117 208 1205 170 L1205 332 L-8 332Z', tint('e4a576', '8881a6', night));
  ink(ctx, 'M-5 268 Q140 255 226 262 Q330 267 402 240 Q490 211 573 237 Q665 258 756 237 Q882 198 974 219 Q1081 247 1210 207 L1210 335 L-5 335Z', tint('bb7d67', '62608a', night));
  ink(ctx, 'M-5 249 Q68 239 105 249 Q142 258 184 253 Q229 251 277 274 Q311 283 391 280 L451 285 L0 302Z M1205 233 Q1131 224 1064 252 Q1029 265 956 269 L875 285 L1205 289Z', tint('93605a', '454561', night));
  wash(ctx, 0, 286, 1200, 134, [[0,tint('f0bc88','8785af',night)],[1,tint('c58c75','585985',night)]]);
  for (let i = 0; i < 14; i++) {
    const py = 291 + i * 8.4;
    const half = 7 + (i % 5) * 8 + i * 1.7;
    oval(ctx, 805 + 17 * Math.sin(i * 2.1), py, half, 1.4 + (i % 3) * .45, tint('ffe3aa', 'd4c6d2', night));
  }
  const near = tint('594248', '30314e', night);
  ink(ctx, 'M-6 352 Q105 329 174 344 Q229 356 356 353 L388 359 Q269 369 173 364 L110 372 L0 371Z M358 377 Q454 366 501 367 Q530 359 570 363 Q610 351 640 360 Q676 364 728 362 L774 369 Q699 378 631 377 Q548 386 462 380Z', near);
  heron(ctx, night);
  rushes(ctx, 539, 368, .56, near);
  rushes(ctx, 650, 364, .37, near, -1);
  rushes(ctx, 129, 347, .77, near);
  const foreground = tint('3a343c','24243e',night);
  ink(ctx, 'M0 405 Q73 378 100 388 Q157 382 195 397 Q238 410 348 408 L394 421 L0 425Z M875 425 Q991 399 1040 406 Q1104 377 1200 389 L1200 425Z', foreground);
  rushes(ctx, 55, 400, 1.15, foreground);
  rushes(ctx, 1048, 410, .84, foreground, -1);
  rushes(ctx, 1143, 395, 1.08, foreground);
  ctx.restore();
}

function curtain(ctx, mirrored) {
  ctx.save();
  if (mirrored) { ctx.translate(1920, 0); ctx.scale(-1, 1); }
  ink(ctx, 'M175 -8 L520 -8 Q496 58 437 113 Q382 163 300 183 C286 225 306 330 309 396 Q309 471 329 540 Q274 559 184 537Z', '#7a3544');
  ink(ctx, 'M228 -6 L479 -6 Q426 93 290 176 Q352 116 381 66 Q318 137 285 147 Q330 84 351 15 Q315 84 266 125Z', '#a85459');
  ink(ctx, 'M256 -6 L291 -6 Q304 89 281 159 Q295 113 315 89 Q304 149 280 178 L273 199 Q295 320 279 526 L254 539 Q272 345 256 211 Q246 355 231 532 L209 531 Q236 343 235 191Z', '#5b2d40');
  ink(ctx, 'M266 210 Q267 272 285 345 Q290 378 287 424 Q279 378 267 348 Q257 327 254 292Z M296 220 Q304 334 303 377 Q314 491 320 532 L299 535 Q302 450 294 395Z', '#9c4c54');
  ink(ctx, 'M237 172 Q265 177 300 161 L301 173 Q268 190 236 184Z', '#d39077');
  ctx.restore();
}

function theatre(ctx, night) {
  wash(ctx, -60, -100, 2050, 1280, [[0,'#352a37'],[.55,'#4b3440'],[1,'#171825']]);
  // The painted flats, stage lip and gathered side drapes frame the live projection.
  ink(ctx, 'M81 568 L81 -12 L1839 -12 L1839 568 L1773 568 L1773 40 L147 40 L147 568Z', '#744a4a');
  ink(ctx, 'M108 565 L108 -10 L1812 -10 L1812 565 L1797 565 L1797 10 L123 10 L123 565Z', '#c38770');
  panel(ctx, 151, -10, 1618, 560, '#302335');
  marsh(ctx, 210, 13, 1500, 525, night);
  curtain(ctx, false);
  curtain(ctx, true);
  ink(ctx, 'M150 -5 H1770 V34 Q1698 49 1615 29 Q1531 50 1436 29 Q1344 50 1245 28 Q1151 46 1050 28 Q957 46 864 28 Q761 48 664 29 Q558 49 469 29 Q373 49 293 29 Q216 44 150 32Z', '#662f40');
  panel(ctx, 145, 537, 1630, 13, '#dc9674');
  wash(ctx, 120, 550, 1680, 77, [[0,'#774a49'],[1,'#493440']]);
  label(ctx, 'Main stage', 960, 605, 42, '#ffe6c8', 'Serif', 400, 'center');
  for (let row = 0; row < 2; row++) {
    const width = 119 + row * 17;
    for (let i = -1; i < 17; i++) {
      const x = i * width + row * 63;
      panel(ctx, x, 627 + row * 33 + Math.abs(i - 7) * 2, width - 7, 63, row ? '#382c3b' : '#61404b', 24);
    }
  }
}

function monitor(ctx, night) {
  panel(ctx, 68, 605, 680, 319, '#181b28', 19);
  panel(ctx, 70, 601, 680, 312, '#53515a', 18);
  panel(ctx, 79, 607, 662, 296, '#242530', 11);
  label(ctx, 'Cue preview', 112, 655, 37, '#f2e6da');
  marsh(ctx, 104, 674, 612, 211, night);
  ink(ctx, 'M306 911 H497 L509 943 L569 955 L568 966 L234 966 L234 955 L294 943Z', '#232532');
  panel(ctx, 251, 955, 298, 5, '#54505b', 2);
}

function controls(ctx, state) {
  const { lookup, result, issued, newRecord, submitted } = state;
  const screen = submitted ? '#eee4d7' : '#47404c';
  const titleInk = submitted ? '#423b48' : '#e1cfc1';
  panel(ctx, 795, 631, 1015, 310, '#252433', 9);
  panel(ctx, 799, 624, 1007, 304, '#a79591', 9);
  panel(ctx, 803, 629, 999, 295, screen, 6);
  label(ctx, 'Show controller', 847, 687, 37, titleInk, 'Sans', 600);
  ctx.fillStyle = submitted ? '#b3a29d' : '#71636c';
  ctx.fillRect(847, 707, 909, 2);

  if (!submitted) {
    label(ctx, 'Moonrise', 847, 809, 88, '#ffe6c4', 'Serif');
    label(ctx, 'Preview only', 850, 873, 38, '#e1cfc1');
    return;
  }
  const call = newRecord ? secondRequest : firstRequest;
  const decision = newRecord ? second : first;
  label(ctx, 'Moonrise   /   ' + call.stage, 1753, 686, 33, '#554553', 'Sans', 400, 'right');
  if (issued && !newRecord) {
    label(ctx, 'Stage manager approved', 848, 758, 34, '#60535b');
    label(ctx, second.record.operator, 846, 837, 77, '#352d40', 'Serif');
    label(ctx, 'New approval  ' + secondRequest.approval, 849, 894, 37, '#494461');
    return;
  }
  if (!lookup) {
    label(ctx, 'Approval ' + call.approval, 848, 807, 75, '#483750', 'Serif');
    label(ctx, 'Requested by ' + session.operator, 850, 872, 38, '#655461');
    return;
  }

  label(ctx, 'Signed in', 848, 758, 34, '#60535b');
  label(ctx, 'Approval ' + call.approval + ' names', 1320, 758, 34, '#60535b');
  ctx.fillStyle = '#c7b7ac';
  ctx.fillRect(1273, 739, 2, 100);
  label(ctx, session.operator, 846, 834, 77, '#352d40', 'Serif');
  label(ctx, decision.record.operator, 1317, 834, 77, '#352d40', 'Serif');
  if (!result) return;
  const sent = decision.output !== null;
  const c = sent ? '#30446a' : '#903d45';
  // An underline connects each verdict to the two fields that decided it.
  panel(ctx, 849, 844, 116, 4, c, 2);
  panel(ctx, 1320, 844, decision.record.operator === 'Kit' ? 86 : 116, 4, c, 2);
  label(ctx, sent ? 'Cue sent to projector' : 'Request declined', 849, 898, 36, c, 'Sans', 600);
}

function stateAt(clock) {
  const i = clock.index;
  const revealAt = (index, phrase, span) => i < index ? 0 : i > index ? 1 : ease(clock.reveal(phrase, span));
  const preview = i === 0 ? ease((clock.elapsed + .18) / 1.8) : 1;
  const submit = revealAt(1, 'Now Nell asks', .28);
  const lookup = revealAt(2, 'uses that number', .32);
  const issued = revealAt(4, 'approves Nell', .35);
  const newRecord = revealAt(4, 'with the new approval number', .35);
  const rerun = revealAt(4, 'the controller finds', .32);
  const firstVerdict = revealAt(3, 'Kit has approval', .2);
  const firstProjection = first.output === cue.scene ? firstVerdict : 0;
  const send = revealAt(5, 'Look up', 2.5);
  const main = second.output === cue.scene ? Math.max(firstProjection, send) : firstProjection;
  const close = revealAt(1, 'to put that same sky', 2.4) * (1 - revealAt(5, 'Look up', 3.1));
  const inHouse = (i === 3 && revealAt(3, 'From the audience', .12) > .5)
    || (i === 5 && revealAt(5, 'Now the audience', .12) > .5);
  return {
    preview, close, inHouse, main, issued: issued > .4, submitted: submit > .4,
    lookup: lookup > .4 && (newRecord <= .4 || rerun > .4),
    newRecord: newRecord > .4,
    result: (firstVerdict > 0 && newRecord <= .4) || (i === 5 && send > 0),
  };
}

function audience(ctx, night) {
  wash(ctx, 0, 0, 1920, 1080, [[0,'#392d38'],[1,'#1c1c2b']]);
  ctx.save();
  ctx.translate(960, 107);
  ctx.scale(1.32, 1.32);
  ctx.translate(-960, 0);
  theatre(ctx, night);
  ctx.restore();
  // An eyeline from the stalls. A rim of reflected projection light catches the hair.
  const near = tint('282431', '1d1c2e', night);
  const rim = tint('97695e', '5d527a', night);
  ctx.save();
  ctx.translate(0, 12);
  ink(ctx, 'M-20 1080 L-20 1050 Q19 1015 89 997 Q104 988 107 961 Q81 942 81 917 Q55 910 51 878 Q47 845 82 831 Q74 788 122 766 Q158 742 208 764 Q252 783 247 841 L257 869 L248 876 Q248 926 218 941 L217 972 Q258 990 298 1025 L334 1080Z', rim);
  ctx.translate(0, 5);
  ink(ctx, 'M-20 1080 L-20 1050 Q19 1015 89 997 Q104 988 107 961 Q81 942 81 917 Q55 910 51 878 Q47 845 82 831 Q74 788 122 766 Q158 742 208 764 Q252 783 247 841 L257 869 L248 876 Q248 926 218 941 L217 972 Q258 990 298 1025 L334 1080Z', near);
  ctx.restore();
  ctx.save();
  ctx.translate(1685, 882);
  ink(ctx, 'M-168 209 Q-132 156 -46 132 L-40 96 Q-65 80 -65 58 L-77 58 L-65 34 Q-77 1 -53 -26 Q-32 -54 16 -48 Q68 -48 83 0 Q94 38 70 74 L58 109 Q55 129 93 141 Q161 163 190 209Z', rim);
  ctx.translate(0, 5);
  ink(ctx, 'M-168 209 Q-132 156 -46 132 L-40 96 Q-65 80 -65 58 L-77 58 L-65 34 Q-77 1 -53 -26 Q-32 -54 16 -48 Q68 -48 83 0 Q94 38 70 74 L58 109 Q55 129 93 141 Q161 163 190 209Z', near);
  ctx.restore();
}

function draw(ctx, clock) {
  const state = stateAt(clock);
  if (state.inHouse) {
    audience(ctx, state.main);
    return;
  }
  ctx.save();
  // Lean over the desk for the comparison, then lift back to the proscenium.
  const zoom = 1 + .072 * state.close;
  ctx.translate(1150, 807);
  ctx.scale(zoom, zoom);
  ctx.translate(-1150, -807);
  theatre(ctx, state.main);
  ink(ctx, 'M-100 757 L1934 690 L2020 858 L-80 1002Z', '#a18e80');
  ink(ctx, 'M-100 774 L1936 704 L2050 904 L-80 1026Z', '#776769');
  wash(ctx, -120, 934, 2190, 230, [[0,'#655a5e'],[.18,'#48434d'],[1,'#292b39']]);
  oval(ctx, 393, 964, 269, 14, '#514853');
  oval(ctx, 1316, 939, 510, 11, '#514853');
  monitor(ctx, state.preview);
  controls(ctx, state);
  ctx.restore();
}

export default { title, beats, draw, check };
