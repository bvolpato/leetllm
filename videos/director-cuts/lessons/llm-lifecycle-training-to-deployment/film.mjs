import assert from 'node:assert/strict';
import { policyDiagnosis, policyShift } from '../../../films/llm-lifecycle-training-to-deployment/arithmetic.mjs';

const old = policyShift(0);
const request = policyShift(1);
const trace = policyDiagnosis(0);
const repaired = policyDiagnosis(2);
const age = request.facts.ageDays;
const eligible = (days, stale, minimum) => stale && days >= minimum;
const verdict = (days, minimum) => eligible(days, request.facts.stale, minimum) ? 'Eligible' : 'Ineligible';

const beats = [
  {
    id: 'rule-change',
    say: 'Watch the blue number. Yesterday a stale service key qualified for rotation at thirty days. Today it needs sixty.',
    hold: 1.2,
  },
  {
    id: 'open-the-reply',
    say: 'Forty-two days is eighteen days short. Why does the app still say eligible? Open the trace for this reply.',
    hold: 1,
  },
  {
    id: 'delivered-passage',
    say: 'Here’s the published rule. Right underneath is the passage the app sent to the language model. Both say sixty days. The model is using checkpoint four, the weights saved from training.',
    hold: 0.8,
  },
  {
    id: 'inspect-the-checker',
    say: 'Follow the reply back one more step. A checker in the app makes the eligibility decision. Look at the comparison it actually ran for our key.',
    hold: 2,
  },
  {
    id: 'edit-the-minimum',
    say: 'Forty-two clears thirty. That explains the answer. Update the checker to use the published minimum. What will happen when we replay the saved request?',
    hold: 1.6,
  },
  {
    id: 'replay',
    say: 'Watch the reply. Now the checker compares forty-two with sixty, and the key falls short. Same passage, same model weights.',
    hold: 1.7,
  },
  {
    id: 'either-side',
    say: 'Try the repaired checker on two stale keys, one day apart. The first is fifty-nine days old. What happens on the day a key turns sixty?',
    hold: 1.6,
  },
  {
    id: 'day-sixty',
    say: 'There it is. Fifty-nine falls short. Sixty qualifies. The rule says at least sixty days, so equality counts.',
    hold: 3,
  },
];

const ink = '#28244e';
const secondary = '#514f75';
const blue = '#363aba';
const teal = '#00695e';
const berry = '#983757';
const glass = { x: 183, y: 94, w: 1554, h: 797 };
const mono = 'Lesson Mono';
const sans = 'Lesson Sans';
const mix = (a, b, p) => a + (b - a) * p;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = value => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

function ramp(clock, beat, phrase, span) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ease(clock.reveal(phrase, span));
}

function gradient(g, x1, y1, x2, y2, stops) {
  const paint = g.createLinearGradient(x1, y1, x2, y2);
  for (const [position, color] of stops) paint.addColorStop(position, color);
  return paint;
}

function shape(g, x, y, w, h, radius, fill) {
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fillStyle = fill;
  g.fill();
}

function line(g, x1, y1, x2, y2, color, width = 2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.stroke();
}

function type(g, value, x, y, size, { color = ink, face = sans, weight = 500, align = 'left' } = {}) {
  g.fillStyle = color;
  g.font = `${weight} ${size}px "${face}"`;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(value), x, y);
}

function faded(g, opacity, paint) {
  if (opacity <= 0) return;
  g.save();
  g.globalAlpha *= opacity;
  paint();
  g.restore();
}

// A translucent monitor shell surrounds a single uninterrupted debugger session.
function monitor(g) {
  g.fillStyle = gradient(g, 100, 0, 1590, 1080, [[0, '#f7c9a3'], [.6, '#ecaa90'], [1, '#b27b8b']]);
  g.fillRect(-240, -180, 2400, 1460);
  shape(g, 238, 929, 1440, 190, 66, '#74617f');
  shape(g, 293, 976, 1329, 114, 42, '#484071');
  g.save();
  g.shadowColor = '#64466088';
  g.shadowOffsetY = 18;
  g.shadowBlur = 36;
  shape(g, 68, 13, 1784, 1024, 127,
    gradient(g, 170, 0, 1700, 1030, [[0, '#c2baf4'], [.24, '#9695df'], [.68, '#aaa4e5'], [1, '#7063af']]));
  g.restore();
  g.save();
  g.beginPath();
  g.roundRect(77, 20, 1766, 1006, 121);
  g.clip();
  for (let i = 0; i < 20; i++) {
    const x = 1154 + i * 42;
    line(g, x, 802, x - 91, 1045, '#4c498229', 15);
    line(g, x + 7, 802, x - 84, 1045, '#ebe4ff3b', 4);
  }
  for (let i = 0; i < 16; i++) {
    line(g, 66, 428 + i * 29, 116, 410 + i * 29, '#f2eaff44', 4);
  }
  g.restore();
  shape(g, 137, 54, 1646, 897, 107,
    gradient(g, 340, 50, 1200, 964, [[0,'#d5d3fe'], [.1,'#7670b1'], [.75,'#6860a6'], [1,'#e5daff']]));
  shape(g, 148, 62, 1624, 876, 99,
    gradient(g, 440, 67, 1370, 920, [[0,'#36315e'], [.44,'#45416b'], [.92,'#645c92'], [1,'#9589bd']]));
  shape(g, 172, 82, 1576, 827, 80, '#22233c');
  // Perforations expose the darker interior under the lilac resin.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 19; col++) {
      const x = 219 + col * 13 + (row % 2) * 6;
      const y = 965 + row * 10;
      shape(g, x, y + 1.8, 6, 4, 2, '#c7bef1');
      shape(g, x, y, 6, 3.5, 2, '#554c87');
    }
  }
  shape(g, 1580, 970, 53, 10, 5, '#5e558d');
  shape(g, 1582, 972, 47, 5, 2.5, '#b9f2cd');
}

function onGlass(g) {
  const { x, y, w, h } = glass;
  g.beginPath();
  g.roundRect(x, y, w, h, 66);
  g.clip();
  g.fillStyle = gradient(g, x, y, x + w, y + h, [[0, '#e5f0fc'], [.52, '#f4f5fb'], [1, '#e8e5fa']]);
  g.fillRect(x, y, w, h);
}

function glassFinish(g) {
  for (let y = glass.y + 3; y < glass.y + glass.h; y += 5) {
    g.fillStyle = '#4a488907';
    g.fillRect(glass.x, y, glass.w, 1);
  }
  g.fillStyle = gradient(g, 0, glass.y, 0, glass.y + 56, [[0,'#2c255132'], [1,'#2c255100']]);
  g.fillRect(glass.x, glass.y, glass.w, 56);
}

// The file icon is drawn on a coarse pixel grid, including its bevel and cut teeth.
function keyPixel(x, y) {
  const dx = Math.abs(x - 25);
  const dy = Math.abs(y - 9);
  if (Math.abs(x - 27) <= 3 && Math.abs(y - 7) <= 3 && Math.abs(x - 27) + Math.abs(y - 7) <= 5) return false;
  const bow = dx <= 9 && dy <= 8 && dx + dy <= 13;
  const along = y - x;
  const across = x + y;
  const stem = along >= -12 && along <= 23 && across >= 30 && across <= 34;
  const teeth = across >= 34 && across <= 39 && ((along > 7 && along <= 11) || (along >= 18 && along <= 23));
  return bow || stem || teeth;
}

const keyCells = [];
for (let y = 0; y < 33; y++) {
  for (let x = 0; x < 36; x++) {
    if (!keyPixel(x, y)) continue;
    const bright = !keyPixel(x, y - 1) || !keyPixel(x - 1, y);
    const dark = !keyPixel(x, y + 1) || !keyPixel(x + 1, y);
    const face = (x + y < 32) ? '#81c9fa' : '#4d90db';
    keyCells.push({x, y, color: bright ? '#b5ecff' : dark ? '#384b9c' : face});
  }
}

function key(g) {
  const u = 11;
  g.save();
  g.translate(282, 226);
  for (const {x,y} of keyCells) {
    g.fillStyle = '#b9b8d4';
    g.fillRect((x + 1.3) * u, (y + 2.1) * u, u + 1, u + 1);
  }
  for (const {x,y} of keyCells) {
    g.fillStyle = '#272963';
    g.fillRect(x*u-3, y*u-3, u+8, u+9);
  }
  for (const {x,y,color} of keyCells) {
    g.fillStyle = color;
    g.fillRect(x*u, y*u, u+.15, u+.15);
  }
  g.restore();
}

function pointer(g, x, y) {
  g.save();
  g.translate(x, y);
  g.scale(2.8, 2.8);
  g.beginPath();
  for (const [i, [px, py]] of [[0,0],[0,20],[5,15],[9,23],[13,21],[9,13],[17,13]].entries()) {
    if (i === 0) g.moveTo(px,py);
    else g.lineTo(px,py);
  }
  g.closePath();
  g.fillStyle = ink;
  g.strokeStyle = '#f8f9ff';
  g.lineWidth = 2;
  g.stroke();
  g.fill();
  g.restore();
}

function cutoff(g, x, y, change, size) {
  g.save();
  g.beginPath();
  g.rect(x - 3, y - size, 420, size * 1.20);
  g.clip();
  const options = {face: mono, weight: 600, color: blue};
  if (change < 1) type(g, old.thresholdDays, x, y - size * 1.3 * change, size, options);
  if (change > 0) type(g, request.thresholdDays, x, y + size * 1.3 * (1-change), size, options);
  type(g, 'days', x + size * 1.46, y, size * .68, {color: secondary});
  g.restore();
}

function answer(g, y, label, answer, size, color) {
  type(g, label, 785, y - size - 8, 38, {color: secondary});
  type(g, answer, 777, y, size, {weight: 700, color});
}

function comparison(g, days, minimum, x, y, size, selected = false, equal = false) {
  const options = {face: mono, weight: 600};
  const cell = size * .60;
  type(g, days, x, y, size, options);
  if (equal) shape(g, x + cell * 2.81, y + 7, cell * 1.27, 7, 3, blue);
  type(g, '≥', x + cell * 2.9, y, size, {...options, color: blue});
  if (selected) shape(g, x + cell * 4.94, y - size * .84, cell * 2.4, size * 1.03, 5, '#cfdaff');
  type(g, minimum, x + cell * 5.1, y, size, {...options, color: selected ? blue : ink});
}

function draw(g, clock) {
  const change = ease((clock.seconds - .7) / 1.15);
  const inspect = ramp(clock, 1, 'Open the trace', 1.1);
  const delivered = ramp(clock, 2, 'Right underneath', .55);
  const weights = ramp(clock, 2, 'checkpoint four', .4);
  const checker = ramp(clock, 3, 'Follow the reply', .75);
  const select = ramp(clock, 4, 'That explains the answer', .5);
  const edit = ramp(clock, 4, 'Update the checker', .7);
  const toReplay = ramp(clock, 4, 'when we replay', .7);
  const replay = ramp(clock, 5, 'Watch the reply', .75);
  const edges = ramp(clock, 6, 'Try the repaired checker', .85);
  const below = ramp(clock, 6, 'The first is', .55);
  const equal = ramp(clock, 7, 'There it is', .65);
  const underline = ramp(clock, 7, 'at least sixty days', .55);
  const minimum = edit < .55 ? trace.checker.threshold : repaired.checker.threshold;
  const value = replay < .5 ? trace.checker.threshold : repaired.checker.threshold;
  const newAge = equal > .45 ? repaired.boundary[1].age : repaired.boundary[0].age;
  const days = edges > .5 ? newAge : age;

  g.save();
  const zoom = 1 + .056 * inspect;
  g.translate(960, 472);
  g.scale(zoom, zoom);
  g.translate(-960, -472);
  monitor(g);
  g.save();
  onGlass(g);
  type(g, 'Rotation check', 251, 183, 49, {weight: 700});
  faded(g, weights, () => type(g, repaired.weights, 1660, 179, 36, {face: mono, color: secondary, align: 'right'}));
  line(g, 249, 208, 1668, 208, '#8786b2', 3);
  line(g, 727, 266, 727, 804, '#c6c6df', 2);

  key(g);
  type(g, 'Stale service key', 470, 665, 44, {align: 'center', color: secondary});
  type(g, `${days} days`, 469, 768, 91, {align: 'center', weight: 700, color: ink});

  faded(g, 1 - edges, () => {
    const policyY = mix(357, 310, inspect);
    type(g, 'Policy minimum', 785, policyY, 50);
    faded(g, (1 - change) * (.2 + .6 * ease(clock.seconds / .35)), () => {
      shape(g, 1285, policyY - 76, 120, 95, 5, '#c4d0fc');
    });
    cutoff(g, 1297, policyY + 3, change, mix(84, 62, inspect));
    faded(g, delivered, () => {
      type(g, 'Sent to model', 785, 402, 50);
      type(g, `${trace.retrieved.threshold}`, 1297, 405, 62, {face: mono, weight: 600, color: blue});
      type(g, 'days', 1388, 405, 42, {color: secondary});
    });
    faded(g, checker, () => {
      line(g, 783, 440, 1651, 440, '#acaac5', 2);
      type(g, edit < .55 ? 'Running checker · v1' : 'Running checker · v2', 785, 500, 39, {color: secondary});
      comparison(g, age, minimum, 778, 600, 95, select > .2 && toReplay < .8);
      faded(g, edit * (1 - replay), () => {
        const drop = 8 * Math.sin(replay * Math.PI);
        shape(g, 1331, 525, 255, 82, 6, '#575286');
        shape(g, 1331, 519 + drop, 255, 82, 6, '#d0d6fa');
        type(g, 'Replay', 1459, 578 + drop, 47, {align: 'center', weight: 600});
      });
    });
    // While the checker is being edited, the original reply belongs to the last run.
    const label = edit > .05 && replay < .5 ? 'Last reply' : 'App reply';
    answer(g, mix(626, 798, inspect), label, verdict(age, value), mix(121, 98, inspect), value === trace.checker.threshold ? teal : berry);
    if (clock.index === 1) {
      const approach = ease(clock.reveal('Why does the app', .9));
      faded(g, approach * (1 - inspect), () => pointer(g, mix(1440, 1150, approach), mix(690, 606, approach)));
    }
    faded(g, select * (1 - replay), () => pointer(g, mix(1197, 1501, toReplay), mix(590, 578, toReplay)));
  });

  faded(g, edges, () => {
    type(g, 'Checker v2', 784, 313, 52, {weight: 600});
    type(g, 'Minimum 60 days', 785, 374, 42, {color: secondary});
    line(g, 785, 420, 1651, 420, '#acaac5', 2);
    shape(g, 763, 484 + equal * 158, 7, 63, 3, blue);
    for (const [i, sample] of repaired.boundary.entries()) {
      const y = 541 + i * 158;
      const showResult = i ? equal : below;
      comparison(g, sample.age, minimum, 787, y, 67, false, i === 1 && underline > .5);
      faded(g, showResult, () => {
        const word = verdict(sample.age, minimum);
        type(g, word, 1156, y, 65, {weight: 700, color: word === 'Eligible' ? teal : berry});
      });
    }
  });
  glassFinish(g);
  g.restore();
  g.restore();
}

function check() {
  const original = trace.checker.threshold;
  const updated = repaired.checker.threshold;
  assert.deepEqual([age, original, updated, trace.weights], [42, 30, 60, 'checkpoint v4']);
  assert.deepEqual(repaired.boundary.map(sample => sample.age), [59, 60]);
  assert.equal(eligible(age, request.facts.stale, original), true);
  assert.equal(request.thresholdDays - age, 18);
  assert.equal(eligible(age, request.facts.stale, trace.source.threshold), false);
  assert.deepEqual(trace.source, trace.retrieved);
  assert.deepEqual(trace.retrieved, repaired.retrieved);
  assert.equal(trace.weights, repaired.weights);
  assert.equal(updated, repaired.source.threshold);
  assert.equal(verdict(age, original).toLowerCase(), request.checkerDecision);
  assert.equal(verdict(age, updated).toLowerCase(), request.decision);
  for (const {age: days, decision} of repaired.boundary) {
    assert.equal(verdict(days, updated).toLowerCase(), decision);
  }
  assert.equal(eligible(updated, false, updated), false);
}

export default {title: 'Why did a 42-day key pass?', beats, draw, check};
