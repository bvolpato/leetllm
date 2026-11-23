import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { INITIAL, TEACHER, WORDS } from '../../../films/distillation/fixtures.mjs';

// One aligned next-token row at temperature one, using the original film's update.
function softmax(scores) {
  const weights = scores.map(score => Math.exp(score - Math.max(...scores)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map(weight => weight / total);
}

const target = softmax(TEACHER);
const steps = [[...INITIAL]];
const finalStep = 40;
for (let i = 0; i < finalStep; i++) {
  const scores = steps[i];
  const probabilities = softmax(scores);
  steps.push(scores.map((score, j) => score + 0.8 * (target[j] - probabilities[j])));
}

const clamp = n => Math.max(0, Math.min(1, n));
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const rank = row => WORDS.map((word, i) => ({ word, p: row[i] }))
  .sort((a, b) => b.p - a.p).map(entry => entry.word);
const percent = value => (100 * value).toFixed(1) + '%';

const beats = [
  {
    id: 'turn-the-page',
    say: "Watch the last word. Now the student picks bird, just like its teacher. Would you stop training here?",
    hold: 1.5,
  },
  {
    id: 'unfold-the-row',
    say: "Open the page. The teacher and its smaller student both read “The child saw a.” Each has four possible next words. The wider the picture, the more probability that model gives the word.",
    hold: 0.9,
  },
  {
    id: 'second-choice',
    say: "Compare the two dogs. The teacher puts dog ahead of cat. The student still has them the other way around. Could you tell that from the word bird alone?",
    hold: 1.3,
  },
  {
    id: 'fit-the-scores',
    say: "Give the student the teacher’s whole row. Dog falls about five percentage points short of its target. Cat runs about twelve points over. Raise the raw score for dog and lower it for cat. Then turn all four scores back into probabilities.",
    hold: 1.0,
  },
  {
    id: 'pass',
    say: "Watch the blue patch beside the pink one. Let the student practice on this sentence a few more times.",
    hold: 1.4,
  },
  {
    id: 'registered',
    say: "Dog has passed cat. Bird still finishes the sentence. By learning from the teacher’s probabilities, the student picked up its second choice too. That’s token-level distillation.",
    hold: 3.0,
  },
];

// Each printed vignette has its own cut-paper color, dark ink and paper highlights.
const inks = [
  { field: '#efb24e', wash: '#e5a340', dark: '#603125', light: '#fff0ba' },
  { field: '#86b6d9', wash: '#76a6ce', dark: '#203f61', light: '#e0eff0' },
  { field: '#e5a1b4', wash: '#d48eaa', dark: '#58304d', light: '#ffe2d4' },
  { field: '#acc79b', wash: '#97b98c', dark: '#305746', light: '#e7edc3' },
];
const paper = '#f7efd9';
const black = '#352e36';
const secondary = '#675c59';

const plates = [
  [
    // A kingfisher in profile. The shoulder cuts follow the long flight feathers.
    ['dark', 'M22 135 Q70 132 116 137 Q166 135 224 118 L224 122 Q161 144 112 143 Q57 138 22 140Z'],
    ['dark', 'M117 121 Q114 129 116 135 L126 137 L113 138 L109 135 L110 123Z M130 119 L131 134 L141 134 L128 139 L125 136 L123 121Z'],
    ['dark', 'M40 125 L73 99 Q82 71 109 60 Q119 30 136 21 Q157 12 174 26 L181 38 L220 47 L178 53 Q174 100 146 122 Q124 136 99 126 L78 117 L45 134 L60 119Z'],
    ['light', 'M151 54 Q162 60 176 51 Q170 77 156 87 L144 82Z'],
    ['wash', 'M73 103 Q104 65 141 62 Q146 79 118 102 L67 122 L83 107Z'],
    ['dark', 'M78 109 Q111 78 136 69 Q117 89 87 109Z M84 112 Q116 90 132 84 Q119 101 84 115Z'],
    ['light', 'M126 38 Q145 24 160 28 L166 31 Q145 32 124 42Z M152 41 Q161 33 171 40 Q165 52 152 41Z'],
    ['dark', 'M159 40 Q162 36 166 40 Q166 45 162 45 Q159 44 159 40Z'],
    ['light', 'M147 100 L155 92 L150 103Z M140 108 L150 100 L144 110Z M133 113 L142 107 L138 116Z'],
  ],
  [
    // The hound is mid-stride. Its blue saddle and hanging ear separate the torso and head.
    ['dark', 'M64 105 Q61 118 46 129 L31 141 L24 140 Q22 137 27 133 L41 119 L47 100Z M139 99 Q138 115 141 120 L154 135 L151 140 L144 137 L129 122 L123 104Z'],
    ['light', 'M15 55 Q35 74 54 70 Q78 61 101 68 Q122 73 140 57 Q149 42 158 36 Q167 28 179 34 L191 49 L215 48 L222 53 Q223 64 208 68 L188 69 Q179 84 162 97 L154 116 L166 134 Q169 140 157 139 L141 120 L144 101 Q124 114 100 106 L84 101 L70 115 L66 138 L55 140 Q49 139 54 134 L56 111 L59 98 Q41 92 47 78 Q27 76 14 61Z'],
    ['dark', 'M14 54 Q31 66 47 66 L59 65 L54 76 Q31 76 14 60Z M52 73 Q81 57 104 69 Q107 81 97 88 Q85 81 78 92 Q59 99 51 89 Q46 82 52 73Z'],
    ['dark', 'M152 40 Q168 27 175 37 Q176 48 173 59 Q171 74 160 79 Q150 81 148 70 Q144 58 152 40Z M210 48 L222 50 Q226 56 218 60 L212 57Z'],
    ['dark', 'M180 47 Q184 43 187 47 Q186 51 182 51Z M188 63 Q200 66 211 60 Q201 69 188 66Z'],
    ['dark', 'M145 100 L154 92 L149 104Z M75 103 L82 95 L80 102Z M57 133 L65 132 L65 138 L55 140Z M155 132 L163 131 L166 136 L163 139Z'],
    ['light', 'M152 62 Q151 52 158 43 Q154 53 154 63Z'],
  ],
  [
    // A seated cat with one continuous curled tail and cut-out whiskers.
    ['dark', 'M97 79 Q87 71 89 56 L86 28 L106 39 Q118 33 130 39 L147 25 L144 53 Q151 66 139 78 Q144 90 154 101 Q167 116 158 133 Q182 138 189 124 Q195 112 190 103 Q187 94 193 91 Q202 90 207 104 Q219 135 190 147 Q172 154 146 147 L85 147 Q70 148 74 141 Q77 136 85 136 L87 117 Q85 98 97 79Z'],
    ['wash', 'M96 81 Q103 86 113 84 Q104 96 99 109 L94 136 L86 139 L91 107Z M120 137 Q116 118 131 111 Q146 107 151 125 Q145 116 135 118 Q123 120 126 135Z'],
    ['light', 'M92 36 L102 44 L94 47Z M135 44 L143 33 L141 47Z M95 58 Q103 52 111 60 Q102 65 95 58Z M121 59 Q129 50 138 55 Q132 64 121 59Z'],
    ['dark', 'M102 55 L105 56 L104 62 L102 62Z M129 55 L132 54 L131 61 L129 61Z'],
    ['light', 'M111 66 L120 65 L116 71Z M108 78 L116 73 L121 76 L116 76Z M93 66 L63 59 L94 64Z M95 70 L64 70 L94 68Z M139 63 L167 54 L140 66Z M140 69 L173 65 L140 71Z'],
    ['wash', 'M119 41 L116 53 L111 42Z M128 42 L123 51 L123 42Z M94 123 L104 95 L99 129Z'],
  ],
  [
    ['dark', 'M91 107 Q65 107 61 91 Q43 92 45 75 Q32 68 46 54 Q43 39 62 37 Q65 20 84 27 Q94 10 111 19 Q126 2 143 20 Q164 14 173 33 Q194 30 191 51 Q209 57 199 76 Q207 93 185 99 Q175 115 156 105 Q146 115 130 108 L131 131 L141 146 L102 146 L111 134 L112 106Z'],
    ['light', 'M116 121 L115 89 L84 64 L113 81 L106 51 L121 81 L139 48 L130 81 L161 64 L130 91 L125 126Z'],
    ['wash', 'M68 49 L76 38 L73 50Z M80 58 L89 45 L86 58Z M147 35 L155 27 L152 36Z M163 58 L177 44 L173 56Z M169 75 L183 63 L178 75Z M67 72 L57 63 L64 75Z'],
  ],
];
const paths = plates.map(plate => plate.map(([color, definition]) => [color, new Path2D(definition)]));

function label(ctx, text, x, y, size, family, color = black, align = 'left', weight = '400') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function page(ctx) {
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 1080);
  const binding = ctx.createLinearGradient(0, 0, 110, 0);
  binding.addColorStop(0, '#5a4251');
  binding.addColorStop(0.13, '#694f60');
  binding.addColorStop(0.16, '#cebfab');
  binding.addColorStop(0.31, '#eee3ca');
  binding.addColorStop(1, paper);
  ctx.fillStyle = binding;
  ctx.fillRect(0, 0, 110, 1080);
  ctx.fillStyle = 'rgba(121,91,73,.16)';
  for (let i = 0; i < 410; i++) {
    const x = 31 + ((i * 1061 + i * i * 17) % 1885);
    const y = (i * 587 + 23 * i * i) % 1080;
    ctx.fillRect(x, y, 1 + i % 5, 1.3);
  }
}

function vignette(ctx, i, x, y, w, h, hero = false, subjectX = .5) {
  const ink = inks[i];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  ctx.fillStyle = ink.field;
  ctx.fillRect(0, 0, w, h);
  // Wide windows expose more of the landscape around the same cutout.
  ctx.fillStyle = ink.wash;
  ctx.beginPath();
  ctx.moveTo(0, h * .82);
  ctx.bezierCurveTo(w * .34, h * .56, w * .49, h * .97, w, h * .67);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  if (hero) {
    ctx.save();
    ctx.fillStyle = ink.light;
    ctx.globalAlpha = .57;
    ctx.beginPath();
    ctx.arc(w * .32, h * .35, h * .19, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Small cuts in the plate follow the slope of the ground.
  ctx.strokeStyle = ink.dark;
  ctx.lineWidth = hero ? 2.5 : 1.8;
  ctx.globalAlpha = .32;
  ctx.beginPath();
  for (let k = 0; k < Math.floor(w / 15); k++) {
    const px = ((k * 113 + 73) % 1103) / 1103 * w;
    const py = h * (.84 + ((k * 37 + 3) % 29) / 200);
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px - 4, py - 5, px - 11, py - 6);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  const scale = Math.min(h / 174, w / 209) * (hero ? 1.05 : 1);
  ctx.translate(w * subjectX - 120 * scale, h * .84 - 145 * scale);
  ctx.scale(scale, scale);
  for (const [color, path] of paths[i]) {
    ctx.fillStyle = ink[color];
    ctx.fill(path);
  }
  ctx.restore();
}

function headingText(ctx, word, unfold) {
  const x = 143;
  label(ctx, 'Student’s top word', x, mix(233, 57, unfold), mix(38, 34, unfold), 'Sans', secondary);
  label(ctx, 'The child saw a', x, mix(392, 129, unfold), mix(105, 64, unfold), 'Serif');
  label(ctx, word + '.', x - 5, mix(611, 236, unfold), mix(220, 121, unfold), 'Serif', inks[WORDS.indexOf(word)].dark);
}

function heading(ctx, student, unfold, showRunnerUp) {
  const [winner, second] = rank(student);
  headingText(ctx, winner, unfold);
  const x = mix(972, 1050, unfold), y = mix(152, 44, unfold);
  const w = mix(813, 735, unfold), h = mix(662, 199, unfold);
  vignette(ctx, WORDS.indexOf(winner), x, y, w, h, true);
  if (showRunnerUp > 0) {
    // A marginal illustration follows the rank that the saved word leaves out.
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h * showRunnerUp);
    ctx.clip();
    const i = WORDS.indexOf(second);
    vignette(ctx, i, x, y, w, h, false, .77);
    label(ctx, 'Student’s second choice', x + 27, y + 58, 33, 'Sans', inks[i].dark);
    label(ctx, second, x + 25, y + 153, 96, 'Serif', inks[i].dark);
    ctx.restore();
  }
}

function turnPage(ctx, elapsed) {
  const t = ease(clamp(elapsed / 1.75));
  const before = rank(softmax(steps[3]))[0], after = rank(softmax(steps[4]))[0];
  headingText(ctx, t < .5 ? before : after, 0);
  const x = 972, y = 152, w = 813, h = 662;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  vignette(ctx, WORDS.indexOf(before), x - t * w, y, w, h, true);
  vignette(ctx, WORDS.indexOf(after), x + (1 - t) * w, y, w, h, true);
  if (t > 0 && t < 1) {
    const edge = x + (1 - t) * w;
    const fold = ctx.createLinearGradient(edge - 18, 0, edge + 14, 0);
    fold.addColorStop(0, 'rgba(67,46,57,0)');
    fold.addColorStop(.50, 'rgba(67,46,57,.24)');
    fold.addColorStop(.59, '#f7efd9');
    fold.addColorStop(1, 'rgba(247,239,217,0)');
    ctx.fillStyle = fold;
    ctx.fillRect(edge - 18, y, 32, h);
  }
  ctx.restore();
}

const rowX = 143, rowWidth = 1642;
function strip(ctx, row, y, name, update, emphasis) {
  const student = update !== null;
  label(ctx, name, rowX, y - 22, 51, 'Serif');
  label(ctx, student ? 'Update ' + update : 'Next-word probability', rowX + rowWidth, y - 22,
    35, 'Sans', secondary, 'right');
  let x = rowX;
  const h = 138;
  row.forEach((p, i) => {
    const w = rowWidth * p;
    vignette(ctx, i, x, y, w, h);
    if (i > 0) {
      ctx.fillStyle = paper;
      ctx.fillRect(x - 2, y, 4, h);
    }
    const mid = x + w / 2;
    label(ctx, WORDS[i], mid, y + h + 41, 42, 'Serif', black, 'center');
    label(ctx, percent(p), mid, y + h + 81, 35, 'Mono', inks[i].dark, 'center');
    if ((i === 1 || i === 2) && emphasis > 0) {
      ctx.globalAlpha = emphasis;
      ctx.fillStyle = inks[i].dark;
      ctx.fillRect(x + 3, y + h - 7, w - 6, 7);
      ctx.globalAlpha = 1;
    }
    x += w;
  });
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  page(ctx);
  if (index === 0) {
    turnPage(ctx, elapsed);
    return;
  }

  const unfold = index === 1 ? ease(reveal('Open the page', 1.8)) : 1;
  let step = 4;
  if (index === 3 && reveal('Then turn all four scores', 0.5) === 1) step = 5;
  if (index === 4) {
    const t = reveal('Let the student', 4.2);
    step = 5 + Math.floor(3 * clamp(t * 2))
      + Math.floor((finalStep - 8) * ease(clamp(t * 2 - 1)));
  }
  if (index >= 5) step = finalStep;
  const student = softmax(steps[step]);
  const emphasis = index < 2 ? 0 : index === 2 ? reveal('Compare the two dogs') : 1;
  const runnerUp = index < 2 ? 0 : index === 2 ? reveal('The student still', .6) : 1;
  heading(ctx, student, unfold, runnerUp);
  ctx.save();
  ctx.translate(0, (1 - unfold) * 795);
  strip(ctx, target, 345, 'Teacher', null, emphasis);
  strip(ctx, student, 650, 'Student', step, emphasis);
  ctx.restore();
}

function check() {
  assert.deepEqual(WORDS, ['bird', 'dog', 'cat', 'tree']);
  assert.deepEqual(rank(target), ['bird', 'dog', 'cat', 'tree']);
  assert.equal(rank(softmax(steps[3]))[0], 'cat');
  assert.deepEqual(rank(softmax(steps[4])), ['bird', 'cat', 'dog', 'tree']);
  const loss = row => target.reduce((total, p, j) => total + p * Math.log(p / row[j]), 0);
  let previous = Infinity;
  for (const scores of steps) {
    const row = softmax(scores);
    assert.ok(Math.abs(row.reduce((s, p) => s + p, 0) - 1) < 1e-12);
    assert.ok(loss(row) < previous);
    previous = loss(row);
  }
  assert.ok(steps[5][1] > steps[4][1] && steps[5][2] < steps[4][2]);
  assert.ok(softmax(steps[6])[1] < softmax(steps[6])[2]);
  assert.ok(softmax(steps[7])[1] > softmax(steps[7])[2]);
  const end = softmax(steps.at(-1));
  assert.deepEqual(rank(end), rank(target));
  assert.equal(percent(end[1]), '26.6%');
  assert.equal(percent(target[1]), '26.7%');
}

export default { title: 'The words behind bird', beats, draw, check };
