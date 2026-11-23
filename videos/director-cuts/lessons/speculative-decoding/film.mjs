import assert from 'node:assert/strict';
import { CHAIN } from '../../../films/speculative-decoding/fixtures.mjs';
import { decomposition } from '../../../films/speculative-decoding/arithmetic.mjs';
import { verifyChain } from '../../../films/speculative-decoding/model.mjs';

const prefix = ['The', 'bird'];
const guesses = CHAIN.map(row => row.words[row.candidate]);
const result = verifyChain();
const cut = prefix.length + result.accepted.length;
const rejectedRow = CHAIN[result.accepted.length];
const law = decomposition(rejectedRow.p, rejectedRow.q);
const replacementIndex = rejectedRow.words.indexOf(result.correction);
const cutoff = law.acceptance[rejectedRow.candidate];
const allWords = [...prefix, ...guesses];
const finalWords = [...prefix, ...result.committed];

const beats = [
  {
    id: 'three-guesses',
    say: 'Watch those purple words run ahead. The reader has just two words, the bird. A small draft model has guessed the next three, one after another.',
    hold: 0.8,
  },
  {
    id: 'one-target-pass',
    say: 'Follow bird down. The target model takes that last word and all three guesses as input in one pass. It saves a key and a value for each position so attention can use them later.',
    hold: 0.7,
  },
  {
    id: 'after-sang',
    say: 'The scores after bird let sang through. Now look one word farther. After sang, the draft gives softly sixty percent. The target gives it thirty. That makes the chance of keeping softly one half.',
    hold: 1,
  },
  {
    id: 'where-the-draw-lands',
    say: 'Where did the random draw land? Eight tenths. We lose softly and today together. The draft chose today after softly. Even its key and value belong to that discarded history.',
    hold: 0.8,
  },
  {
    id: 'the-missing-share',
    say: 'After sang, which word did the draft give too little chance? Nearby. Its share needs to rise from twenty percent to fifty. Here that whole shortfall belongs to one word, so every correction draw gives us nearby.',
    hold: 0.75,
  },
  {
    id: 'under-the-new-word',
    say: 'The reader can see nearby. Look straight down from it. The target cache still ends at sang.',
    hold: 1.25,
  },
  {
    id: 'four-words-deep',
    say: 'On the next pass, the target takes nearby as input. Its key and value fill the gap. Now the next token can attend to all four words.',
    hold: 2.5,
  },
];

const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function cue(clock, beat, phrase, duration) {
  if (clock.index !== beat) return Number(clock.index > beat);
  return ease(clock.reveal(phrase, duration));
}

function state(clock) {
  const write = cue(clock, 1, 'bird down', 1.05);
  const accept = cue(clock, 2, 'The scores', 0.55);
  const sever = cue(clock, 3, 'Eight tenths', 0.95);
  const correct = cue(clock, 4, 'every correction draw', 0.75);
  const incorporate = cue(clock, 6, 'nearby as input', 1.2);
  const slots = allWords.map((original, i) => {
    let word = original;
    let visible = i < prefix.length || clock.index > 0 ? 1
      : ease((clock.elapsed + 0.14 - 0.56 * (i - prefix.length)) / 0.48);
    let stored = i === 0 ? 1 : write;
    let tentative = i >= prefix.length ? 1 : 0;
    if (i >= prefix.length && i < cut) tentative *= 1 - accept;
    if (i >= cut) {
      visible *= 1 - sever;
      stored *= 1 - sever;
      if (i === cut && correct > 0) {
        word = result.correction;
        visible = correct;
        stored = incorporate;
        tentative = 0;
      }
    }
    return { word, visible, stored, tentative };
  });
  return { slots, write, accept, sever, correct, incorporate };
}

function check() {
  assert.deepEqual(result.accepted, ['sang']);
  assert.deepEqual(result.discarded, ['softly', 'today']);
  assert.equal(cutoff, 0.5);
  assert.ok(rejectedRow.uniform > cutoff);
  assert.deepEqual(law.residual, [0, 1, 0]);
  assert.equal(rejectedRow.q[replacementIndex], 0.2);
  assert.equal(rejectedRow.p[replacementIndex], 0.5);
  assert.deepEqual(finalWords, ['The', 'bird', 'sang', 'nearby']);
  // The same slots drive the type above the surface and the cache underneath.
  const held = index => state({ index, elapsed: 30, reveal: () => 1 }).slots;
  const stored = index => held(index).filter(s => s.stored === 1).map(s => s.word);
  assert.deepEqual(stored(0), ['The']);
  assert.deepEqual(stored(1), allWords);
  assert.deepEqual(stored(3), finalWords.slice(0, cut));
  assert.deepEqual(held(5).filter(s => s.visible === 1).map(s => s.word), finalWords);
  assert.deepEqual(stored(5), finalWords.slice(0, cut));
  assert.deepEqual(stored(6), finalWords);
  return true;
}

const ink = '#152d52';
const violet = '#6740bc';
const coral = '#b83f39';
const muted = '#526273';
const startX = 238;
const pitch = 313;
const span = 287;
const center = i => startX + i * pitch + span / 2;
const tokenY = 288;
const pct = n => Math.round(n * 100) + '%';

function label(ctx, value, x, y, size, color = ink, options = {}) {
  const { align = 'left', face = 'Sans', weight = 500, italic = false } = options;
  ctx.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}
function stroke(ctx, points, color, width = 2, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
  ctx.restore();
}
function face(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}
function rgba(a, b, t, alpha = 1) {
  const c = a.map((v, i) => Math.round(lerp(v, b[i], t)));
  return 'rgba(' + c.join(',') + ',' + alpha + ')';
}
function group(ctx, first, last, name, color, opacity = 1) {
  if (opacity <= 0) return;
  const x = startX + first * pitch, w = (last - first) * pitch + span;
  ctx.save();
  ctx.globalAlpha *= opacity;
  label(ctx, name, x, 128, 35, color, { weight: 600 });
  stroke(ctx, [[x, 157], [x, 147], [x + w, 147], [x + w, 157]], color, 2);
  ctx.restore();
}

function background(ctx) {
  const wash = ctx.createLinearGradient(0, 0, 1440, 1080);
  wash.addColorStop(0, '#f8f8ff');
  wash.addColorStop(0.52, '#f4f2fc');
  wash.addColorStop(1, '#e5e4f2');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);
}

// An exploded two-row view of the cache. Each folded strip is one vector.
// The facets distinguish vector entries schematically and have no numerical scale.
const cacheColors = [
  { ridge: [127, 222, 233], valley: [30, 127, 167], edge: [26, 91, 134] },
  { ridge: [136, 185, 243], valley: [50, 98, 164], edge: [34, 65, 124] },
];
const proposalGlass = { ridge: [201, 176, 248], valley: [119, 91, 188], edge: [91, 62, 151] };

// Give each contextual vector a recognizable silhouette. These are drawing
// profiles for this fixture, not measured tensors from the probability model.
const folds = {
  The:    [[19, 38, 65, 50, 26, 41, 30, 17], [52, 38, 22, 18, 34, 52, 61, 38]],
  bird:   [[25, 21, 18, 30, 42, 62, 71, 49], [26, 45, 61, 45, 25, 21, 35, 48]],
  sang:   [[22, 38, 55, 69, 72, 49, 31, 19], [38, 54, 43, 27, 17, 29, 46, 57]],
  softly: [[63, 55, 39, 21, 14, 18, 29, 43], [18, 30, 43, 56, 66, 52, 34, 24]],
  today:  [[26, 38, 29, 24, 35, 51, 63, 48], [59, 42, 28, 33, 42, 31, 24, 17]],
  nearby: [[20, 22, 33, 51, 73, 70, 45, 23], [27, 56, 64, 46, 29, 20, 17, 25]],
};
function footprint(ctx, x, y, width, focus) {
  const d = 52, h = 60;
  stroke(ctx, [[x, y], [x + width, y], [x + width + d, y - h],
    [x + d, y - h], [x, y]], focus ? '#758bb0' : '#c2bfd3', focus ? 3 : 2, [9, 8]);
}
function foldedVector(ctx, x, y, level, word, tentative, growth) {
  if (growth <= 0) return;
  const base = cacheColors[level];
  const tone = key => rgba(base[key], proposalGlass[key], tentative);
  const profile = folds[word][level];
  const d = 52, h = 60, top = y - 16 * growth;
  const shade = ctx.createLinearGradient(0, y - h, 0, y + 16);
  shade.addColorStop(0, 'rgba(40,46,92,0.08)');
  shade.addColorStop(1, 'rgba(40,46,92,0)');
  ctx.save();
  ctx.globalAlpha *= Math.min(1, growth * 3);
  face(ctx, [[x + 6, y + 3], [x + span + 6, y + 3], [x + span + 31, y + 17],
    [x + 28, y + 17]], shade);
  const sheen = ctx.createLinearGradient(x, y, x + d, y - h);
  sheen.addColorStop(0, tone('ridge'));
  sheen.addColorStop(1, rgba(base.ridge.map(v => Math.min(255, v + 30)), [225, 213, 251], tentative));
  const width = span / profile.length;
  for (let j = 0; j < profile.length; j++) {
    const left = x + j * width, mid = left + width * 0.55, right = left + width;
    const peak = top - profile[j] * growth;
    // A continuous pleat shares its edge with the next element.
    face(ctx, [[left, top], [mid, peak], [mid + d, peak - h], [left + d, top - h]], sheen);
    face(ctx, [[mid, peak], [right + 0.3, top], [right + d + 0.3, top - h], [mid + d, peak - h]], tone('valley'));
    face(ctx, [[left, top], [mid, peak], [right + 0.3, top], [right + 0.3, y], [left, y]], tone('edge'));
    stroke(ctx, [[mid, peak], [mid + d, peak - h]], 'rgba(255,255,255,.55)', 1.3);
  }
  face(ctx, [[x + span, top], [x + span + d, top - h], [x + span + d, y - h],
    [x + span, y]], tone('edge'));
  ctx.restore();
}

function paintedCache(ctx, s, clock) {
  label(ctx, 'Target cache', 95, 491, 47, ink, { weight: 600 });
  const cacheY = [674, 855];
  cacheY.forEach((y, level) => {
    label(ctx, level ? 'Values' : 'Keys', 75, y - 28, 39, muted);
    s.slots.forEach((slot, i) => {
      const x = startX + i * pitch;
      const pending = i === cut && s.correct > 0 && s.incorporate < 1;
      if (slot.stored < 1) footprint(ctx, x, y, span, pending);
      if (i < cut || s.correct > 0) {
        foldedVector(ctx, x, y, level, slot.word, slot.tentative, slot.stored);
      } else {
        ctx.save();
        ctx.translate(0, 48 * s.sever);
        ctx.globalAlpha *= 1 - s.sever;
        foldedVector(ctx, x, y, level, slot.word, slot.tentative, slot.stored);
        ctx.restore();
      }
    });
  });
  if (clock.index === 1) {
    const a = s.write;
    ctx.save();
    ctx.globalAlpha = a;
    const x = startX + pitch, end = startX + 4 * pitch + span;
    stroke(ctx, [[x, 882], [x, 895], [end, 895], [end, 882]], muted, 2);
    label(ctx, 'One target pass', (x + end) / 2, 944, 36, ink, { align: 'center' });
    ctx.restore();
  }
}

function wordLine(ctx, s, clock) {
  const acceptedEnd = s.correct > 0.8 ? cut : s.accept > 0.55 ? cut - 1 : prefix.length - 1;
  group(ctx, 0, acceptedEnd, 'Output', ink);
  const firstDraft = Math.max(prefix.length, acceptedEnd + 1);
  if (s.sever < 1) group(ctx, firstDraft, allWords.length - 1, 'Draft', violet, 1 - s.sever);
  s.slots.forEach((slot, i) => {
    if (!slot.visible || (clock.index === 4 && i === cut)) return;
    const x = center(i);
    ctx.save();
    ctx.globalAlpha *= slot.visible;
    const drop = i >= cut && !s.correct ? 28 * s.sever : 0;
    const y = tokenY + drop + (1 - slot.visible) * 14;
    const textColor = rgba([21, 45, 82], [103, 64, 188], slot.tentative);
    label(ctx, slot.word, x, y, slot.word.length > 5 ? 98 : 107, textColor, {
      face: 'Serif', align: 'center', italic: slot.tentative > 0.5,
    });
    ctx.restore();
  });
}

function sampler(ctx, clock, s) {
  const detail = cue(clock, 2, 'After sang', 0.5);
  if (detail <= 0 || s.sever === 1) return;
  const x = startX + cut * pitch, width = 510, y = 425;
  const cutX = x + width * cutoff, uX = x + width * rejectedRow.uniform;
  ctx.save();
  ctx.globalAlpha = detail * (1 - s.sever);
  const candidate = rejectedRow.candidate;
  const caption = 'Draft ' + pct(rejectedRow.q[candidate]) + '   Target ' + pct(rejectedRow.p[candidate]);
  label(ctx, caption, x, 356, 41, violet, { weight: 600 });
  const showInterval = cue(clock, 2, 'That makes', 0.5);
  ctx.globalAlpha *= showInterval;
  ctx.fillStyle = '#d4cadd';
  ctx.fillRect(x, y, width, 13);
  ctx.fillStyle = '#3c6991';
  ctx.fillRect(x, y, width * cutoff, 13);
  stroke(ctx, [[cutX, y - 4], [cutX, y + 19]], ink, 3);
  label(ctx, 'Keep below ' + cutoff.toFixed(2), x, y + 57, 39, ink);
  if (clock.index === 3) {
    const drop = ease((clock.elapsed + 0.08) / 0.45);
    ctx.globalAlpha *= drop;
    face(ctx, [[uX, y - 3], [uX - 11, y - 22], [uX + 11, y - 22]], coral);
    label(ctx, 'Draw ' + rejectedRow.uniform.toFixed(2), uX, y - 28, 37, coral, { align: 'center', weight: 600 });
  }
  ctx.restore();
}

function gap(ctx, clock, s) {
  const x = center(cut);
  if (clock.index === 4) {
    const a = cue(clock, 4, 'Nearby', 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    const y = lerp(389, tokenY, s.correct);
    label(ctx, result.correction, x, y, 98, rgba([69, 103, 130], [21, 45, 82], s.correct),
      { face: 'Serif', align: 'center' });
    ctx.globalAlpha *= 1 - s.correct;
    label(ctx, 'Draft ' + pct(rejectedRow.q[replacementIndex]) + '   Target ' + pct(rejectedRow.p[replacementIndex]),
      x, 451, 41, ink, { align: 'center' });
    ctx.restore();
  }
  if (s.correct > 0 && s.incorporate < 1) {
    ctx.save();
    ctx.globalAlpha = ease((s.correct - 0.8) / 0.2) * (1 - s.incorporate);
    stroke(ctx, [[x, tokenY + 30], [x, 570]], '#6383aa', 3, [6, 10]);
    face(ctx, [[x, 579], [x - 9, 562], [x + 9, 562]], '#6383aa');
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const s = state(clock);
  background(ctx);
  ctx.save();
  // The gaze drops from the line of type to its stored state on "Follow bird down."
  const descent = cue(clock, 1, 'Follow', 0.95);
  ctx.translate(0, 84 * (1 - descent));
  paintedCache(ctx, s, clock);
  wordLine(ctx, s, clock);
  sampler(ctx, clock, s);
  gap(ctx, clock, s);
  ctx.restore();
}

export default { title: 'Which words survive a speculative pass?', beats, draw, check };
