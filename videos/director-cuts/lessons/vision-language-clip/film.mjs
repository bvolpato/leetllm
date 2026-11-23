import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadImage } from '@napi-rs/canvas';
import { dotProduct, normalizeVector } from 'vizmatic';

const photograph = await loadImage(fileURLToPath(new URL('./bicycle.svg', import.meta.url)));

// The published film supplies these features for its bicycle, dog and bowl example.
const imageVector = [0.95, 0.05, 0];
const temperature = 0.2;
const prompts = {
  bicycle: { label: 'a red bicycle', vector: [0.91, 0.08, 0.01] },
  dog: { label: 'a dog in a park', vector: [0.06, 0.89, 0.04] },
  bowl: { label: 'a bowl of oranges', vector: [0.02, 0.09, 0.90] },
};

function compare(ids) {
  const image = normalizeVector(imageVector);
  const matches = ids.map((id) => {
    const cosine = dotProduct(image, normalizeVector(prompts[id].vector));
    return { id, cosine, weight: Math.exp(cosine / temperature) };
  });
  const total = matches.reduce((sum, match) => sum + match.weight, 0);
  const scores = Object.fromEntries(matches.map((m) => [m.id, { ...m, share: m.weight / total }]));
  return { scores, total, count: matches.length };
}

const all = compare(['bowl', 'bicycle', 'dog']);
const two = compare(['bowl', 'dog']);
const solo = compare(['bowl']);

const beats = [
  {
    id: 'through-the-spokes',
    say: 'You can see the brickwork through the spokes. How did this picture get a hundred percent for a bowl of oranges?',
    hold: 1.2,
  },
  {
    id: 'the-other-choices',
    say: 'Put the other two descriptions back. The bicycle takes nearly all the share. Look how little is left for the bowl.',
    hold: 1,
  },
  {
    id: 'one-picture-three-phrases',
    say: 'CLIP trains two encoders on paired pictures and descriptions so matching pairs point in similar directions. One turns the picture into a vector. The other gives each phrase a vector in the same space. These three-number vectors are our example.',
    hold: 0.85,
  },
  {
    id: 'the-match',
    say: "Scale each vector to length one and take their dot product. That's the cosine. The bicycle description scores almost one. The bowl barely clears zero. Keep an eye on that small number.",
    hold: 1.1,
  },
  {
    id: 'the-share',
    say: "Softmax gives each description a weight. Here we divide its cosine by the temperature, point two, then exponentiate. The bowl's weight is about one point one five. Divide that weight by the sum of all three and you get the bowl's share.",
    hold: 1.2,
  },
  {
    id: 'take-them-away',
    say: "Take the bicycle out. The dog and the bowl now share the total between them. Take the dog out too. What's left to divide by?",
    hold: 1.8,
  },
  {
    id: 'the-last-description',
    say: "The bowl's own weight. That fraction is exactly one. The bowl still has a cosine of point zero two seven. It gets a hundred percent because it's the only description left.",
    hold: 3.2,
  },
];

const ink = '#1f302f';
const muted = '#485c5c';
const orange = '#a03e21';
const lerp = (a, b, p) => a + (b - a) * p;
const clamp = (p) => Math.max(0, Math.min(1, p));
const ease = (p) => p * p * (3 - 2 * p);
const percentage = (n) => n === 1 ? '100%' : (n * 100).toFixed(1) + '%';
const vectorText = (v) => '[' + v.map((x) => x.toFixed(2)).join('  ') + ']';

function type(ctx, content, x, y, size, options = {}) {
  const { color = ink, family = 'Sans', weight = 400, align = 'left', italic = false } = options;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillText(content, x, y);
}

function lightTable(ctx) {
  const light = ctx.createLinearGradient(0, 1050, 1750, 100);
  light.addColorStop(0, '#c6ddda');
  light.addColorStop(0.42, '#e5eeea');
  light.addColorStop(0.72, '#f7f3e9');
  light.addColorStop(1, '#f5eee2');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1920, 1080);
}

// Each perforation is a real hole. The light table shows through as the film settles.
function transparency(ctx, travel) {
  const rest = 1 - (1 - travel) ** 3;
  ctx.save();
  ctx.translate(lerp(340, 527, rest), lerp(367, 492, rest));
  ctx.rotate(lerp(-0.15, -0.039, rest));
  const w = 1034, h = 788;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 4);
  for (const y of [-375, 330]) {
    for (let i = 0; i < 8; i++) ctx.roundRect(-476 + 123 * i, y, 55, 44, 9);
  }
  ctx.shadowColor = 'rgba(28,45,43,.30)';
  ctx.shadowOffsetY = lerp(27, 9, rest);
  ctx.shadowBlur = lerp(40, 11, rest);
  const stock = ctx.createLinearGradient(-517, 360, 494, -390);
  stock.addColorStop(0, '#6e3b26');
  stock.addColorStop(0.22, '#412823');
  stock.addColorStop(0.76, '#332828');
  stock.addColorStop(1, '#67422f');
  ctx.fillStyle = stock;
  ctx.fill('evenodd');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#211d20';
  ctx.beginPath();
  ctx.roundRect(-499, -326, 998, 652, 8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-492, -321, 984, 642, 5);
  ctx.clip();
  ctx.drawImage(photograph, -492, -328, 984, 656);
  ctx.restore();
  ctx.restore();
}

const left = 1130, right = 1840;
function rule(ctx, y) {
  ctx.fillStyle = '#a6b2a9';
  ctx.fillRect(left, y, right - left, 2);
}

function vectorLine(ctx, label, vector, x, y, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  type(ctx, label, x, y - 41, 29, { color: muted });
  type(ctx, vectorText(vector), x, y, 35, { family: 'Mono' });
  ctx.restore();
}

function candidate(ctx, id, y, visibility, scores, cosineOpacity) {
  if (visibility <= 0) return;
  const score = scores[id];
  ctx.save();
  ctx.globalAlpha = visibility;
  ctx.translate(42 * (1 - visibility), 0);
  type(ctx, prompts[id].label, left, y, 47, { family: 'Serif' });
  if (score) {
    type(ctx, percentage(score.share), right, y, 44, { align: 'right' });
    ctx.globalAlpha *= cosineOpacity;
    type(ctx, 'cosine  ' + score.cosine.toFixed(3), left + 1, y + 36, 28, { family: 'Mono', color: muted });
  }
  ctx.restore();
}

function setup(clock) {
  const { index, reveal } = clock;
  const add = index === 1 ? ease(reveal('Put the other two descriptions back', 0.9)) : Number(index > 1);
  const dropBike = index === 5 ? ease(reveal('Take the bicycle out', 0.65)) : Number(index > 5);
  const dropDog = index === 5 ? ease(reveal('Take the dog out too', 0.65)) : Number(index > 5);
  let active = solo;
  if (add >= 0.5 && dropDog < 0.5) active = dropBike < 0.5 ? all : two;
  return { add, dropBike, dropDog, active };
}

function weightDetail(ctx, clock, state, division) {
  if (clock.index < 4) return;
  const exponent = clock.index === 4 ? clock.reveal('Here we divide', 0.45) : 1;
  const bowl = all.scores.bowl;
  ctx.save();
  ctx.globalAlpha = exponent * clamp(1 - division * 2);
  type(ctx, 'Bowl weight', left, 843, 34, { color: muted });
  type(ctx, 'exp(' + bowl.cosine.toFixed(4) + ' / ' + temperature + ') ≈ ' + bowl.weight.toFixed(2), left, 899, 42, { family: 'Mono' });
  ctx.restore();

  // The bowl stays fixed in the sum. The fraction bar closes over the surviving terms.
  const inkIn = clamp(division * 2 - 1);
  if (inkIn === 0) return;
  const bikeIn = clamp(1 - 2 * state.dropBike);
  const dogIn = clamp(1 - 2 * state.dropDog);
  const bikeSpace = 1 - ease(clamp(2 * state.dropBike - 1));
  const dogSpace = 1 - ease(clamp(2 * state.dropDog - 1));
  const bowlX = left + 80;
  const bikeX = left + 365;
  const dogX = lerp(left + 335, left + 633, bikeSpace);
  const end = left + 161 + 298 * bikeSpace + 244 * dogSpace;
  const center = (left + end) / 2;
  ctx.save();
  ctx.globalAlpha = inkIn;
  ctx.translate(0, 14 * (1 - inkIn));
  type(ctx, 'Bowl weight', center, 633, 35, { align: 'center', color: muted });
  type(ctx, bowl.weight.toFixed(2), center, 704, 68, { align: 'center', family: 'Mono', color: orange });
  ctx.fillStyle = ink;
  ctx.fillRect(left, 731, end - left, 4);
  function term(id, label, x, strength, plusX) {
    if (strength <= 0) return;
    ctx.save();
    ctx.globalAlpha *= strength;
    if (plusX) type(ctx, '+', plusX, 808, 47, { align: 'center', color: muted });
    type(ctx, all.scores[id].weight.toFixed(2), x, 809, 51, {
      family: 'Mono', align: 'center', color: id === 'bowl' ? orange : ink,
    });
    type(ctx, label, x, 857, 37, { align: 'center', family: 'Serif', italic: true });
    ctx.restore();
  }
  term('bowl', 'bowl', bowlX, 1);
  term('bicycle', 'bicycle', bikeX, bikeIn, left + 200);
  term('dog', 'dog', dogX, dogIn, dogX - 119);
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const state = setup(clock);
  const { add, active } = state;
  lightTable(ctx);
  transparency(ctx, index === 0 ? clamp(elapsed / 0.95) : 1);

  const match = index === 3 ? reveal('take their dot product', 0.48) : Number(index > 3);
  const imageVectorCue = index === 2 ? reveal('One turns the picture', 0.55) : Number(index > 2);
  const textVectorCue = index === 2 ? reveal('The other gives each phrase', 0.55) : Number(index > 2);
  ctx.save();
  ctx.globalAlpha = imageVectorCue * (1 - match);
  type(ctx, 'Example image vector', 70, 963, 38, { color: muted });
  type(ctx, vectorText(imageVector), 491, 963, 39, { family: 'Mono' });
  ctx.restore();

  // The large readout belongs to the bowl. Keep it in place as its competition leaves.
  const lift = 125 * (1 - add);
  type(ctx, 'Prompt share', left, 153 + lift, 37, { weight: 600 });
  type(ctx, active.count + (active.count === 1 ? ' choice' : ' choices'), right, 153 + lift, 34, { align: 'right', color: muted });
  rule(ctx, 180 + lift);
  type(ctx, percentage(active.scores.bowl.share), left - 7, 351 + lift, 167, { family: 'Serif', color: orange });
  type(ctx, prompts.bowl.label, left, 433 + lift, 65, { family: 'Serif', italic: true });

  vectorLine(ctx, 'Example text vector', prompts.bowl.vector, left + 2, 533, textVectorCue * (1 - match));
  ctx.save();
  ctx.globalAlpha = match;
  type(ctx, 'cosine  ' + active.scores.bowl.cosine.toFixed(3), left + 2, 512, 43, { family: 'Mono', color: orange });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = add;
  rule(ctx, 562);
  ctx.restore();
  const division = index === 4 ? reveal('Divide that weight', 0.7) : Number(index > 4);
  const candidatesIn = add * clamp(1 - division * 2);
  candidate(ctx, 'bicycle', 632, candidatesIn, active.scores, match);
  candidate(ctx, 'dog', 735, candidatesIn, active.scores, match);
  weightDetail(ctx, clock, state, division);
}

function check() {
  assert.deepEqual(Object.values(all.scores).map((s) => s.cosine.toFixed(3)), ['0.027', '0.999', '0.119']);
  assert.deepEqual(Object.values(all.scores).map((s) => percentage(s.share)), ['0.8%', '98.0%', '1.2%']);
  for (const state of [all, two, solo]) {
    assert.equal(state.scores.bowl.cosine, all.scores.bowl.cosine);
    assert.equal(state.scores.bowl.weight, all.scores.bowl.weight);
    const sum = Object.values(state.scores).reduce((n, s) => n + s.share, 0);
    assert(Math.abs(sum - 1) < 1e-12);
  }
  assert.equal(percentage(two.scores.bowl.share), '38.7%');
  assert.equal(all.scores.bowl.weight.toFixed(2), '1.15');
  assert.equal(solo.total, solo.scores.bowl.weight);
  assert.equal(solo.scores.bowl.share, 1);
}

export default { title: 'A Hundred Percent for Oranges', beats, draw, check };
