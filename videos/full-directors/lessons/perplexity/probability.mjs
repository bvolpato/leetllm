import {
  ink,
  red,
  teal,
  gold,
  dim,
  rule,
  cream,
  blue,
  mint,
  ochre,
  light,
  mix,
  fix,
  sum,
  surprise,
  loss,
  cat,
  cue,
  afterPhrase,
  center,
} from './studio.mjs';

const openingShares = [
  ['on', 0.5],
  ['under', 0.3],
  ['near', 0.15],
  ['other', 0.05],
];
export { openingShares };

function probabilityRail(p, x, y, w, selected) {
  let left = x;
  for (const [i, [word, prob]] of openingShares.entries()) {
    const width = prob * w,
      col = [blue, teal, gold, dim][i];
    p.rect(left + 1, y, width - 2, 82, col);
    for (let j = 0; j < Math.round(100 * prob); j++)
      p.line(left + (j * w) / 100, y + (j % 5 === 0 ? 51 : 68), left + (j * w) / 100, y + 82, '#ffffff7a', 2);
    p.text(word, left + width / 2, y - 26, 42, ink, center);
    p.mono(
      Math.round(prob * 100) + '%',
      left + width / 2,
      y + 134,
      40,
      selected === word ? teal : ink,
      center,
    );
    left += width;
  }
}
export function cover(p, c) {
  const lift = cue(c, 1, 'Lift the cover', 1.1),
    seek = cue(c, 1, 'Follow the loupe', 1.4);
  p.ground();
  p.heading('Which share belongs to this page?');
  p.stock(116, 224, 1688, 300);
  p.impression('The cat sat', 230, 435, 140);
  const x = 1010;
  p.impression('under', x + 10, 435, 144, teal);
  p.fade(1 - lift, () => {
    const y = 284 - lift * 150;
    p.rect(x - 21, y + 8, 460, 200, '#302b223a');
    p.rect(x - 28, y, 460, 200, '#b8774e');
    for (let i = 0; i < 35; i++) p.line(x - 21 + i * 13, y + 12, x - 21 + i * 13, y + 187, '#e2aa724f', 3);
    p.rect(x + 153, y - 16, 84, 18, '#856145');
  });
  const start = 154,
    width = 1588;
  probabilityRail(p, start, 688, width, seek ? 'under' : null);
  if (seek) {
    const segment = openingShares[0][1] + openingShares[1][1] / 2;
    const lx = mix(x + 175, start + width * segment, seek),
      ly = mix(414, 805, seek);
    p.fade(seek, () => {
      p.line(lx + 57, ly + 60, lx + 141, ly + 144, '#504a40', 24);
      p.ctx.save();
      p.ctx.beginPath();
      p.ctx.arc(lx, ly, 84, 0, 2 * Math.PI);
      p.ctx.clip();
      p.ctx.translate(lx, ly);
      p.ctx.scale(1.6, 1.6);
      p.ctx.translate(-lx, -ly);
      p.rect(0, 0, 1920, 1080, '#f5ecd1');
      p.stock(116, 224, 1688, 300);
      p.impression('under', x + 10, 435, 144, teal);
      probabilityRail(p, start, 688, width, 'under');
      p.ctx.restore();
      p.circle(lx, ly, 84, null, '#41473f', 10);
      p.circle(lx, ly, 76, null, '#d7b579', 4);
    });
  }
}
export function prefixes(p, c) {
  p.ground();
  p.heading('Read the words the page supplied');
  const b = c.beat.beatIndex;
  const count = b === 0 ? 1 : 1 + Number(cue(c, 1, 'then the') > 0.35) + Number(cue(c, 1, 'then mat') > 0.35);
  const x = [220, 480, 710, 920, 1130, 1376],
    words = ['The', 'cat', 'sat', ...cat.words];
  p.stock(118, 220, 1684, 230);
  words.forEach((word, i) =>
    p.impression(word, x[i], 375, 100, i === count + 2 ? red : i < count + 2 ? ink : '#aca68e'),
  );
  p.line(217, 410, x[count + 1] + 118, 410, teal, 5);
  p.text('Context for “' + cat.words[count - 1] + '”', 217, 506, 36, teal);
  for (let i = 0; i < count; i++) {
    const left = 138 + i * 554;
    p.stock(left, 586, 520, 252);
    p.text('After “… ' + words[i + 2] + '”', left + 26, 637, 32, dim);
    p.serif(cat.words[i], left + 26, 735, 72, ink);
    p.mono(fix(cat.probs[i], 2), left + 485, 735, 60, teal, { align: 'right' });
    p.rect(left + 26, 773, 465, 21, '#dddac9');
    p.rect(left + 26, 773, 465 * cat.probs[i], 21, teal);
  }
}
export function curve(p, c) {
  p.ground(true);
  p.heading('The cost of a thin share', true);
  const toward = cue(c, 2, 'Move the probe', 3.5);
  const prob = mix(0.8, 0.02, toward),
    nll = surprise(prob);
  const px = (v) => 180 + v * 900,
    py = (v) => 748 - 98 * v;
  for (let i = 0; i <= 4; i++) {
    p.line(180, py(i), 1080, py(i), '#62767b', 2);
    p.mono(i, 146, py(i) + 11, 31, light, { align: 'right' });
  }
  p.text('Loss in nats', 160, 242, 38, light);
  p.line(180, 748, 1080, 748, mint, 3);
  p.mono('0', 180, 797, 32, light, center);
  p.mono('1', 1080, 797, 32, light, center);
  p.text('Probability of “mat”', 620, 856, 37, light, center);
  for (let i = 11; i <= 1000; i++) {
    const a = (i - 1) / 1000,
      b = i / 1000;
    p.line(px(a), py(surprise(a)), px(b), py(surprise(b)), mint, 5);
  }
  p.line(px(prob), py(nll), px(prob), 748, ochre, 3);
  p.circle(px(prob), py(nll), 13, ochre);
  p.stock(1190, 277, 560, 500);
  p.text('Observed word', 1238, 350, 38, dim);
  p.impression('mat', 1238, 472, 116);
  p.mono('p = ' + fix(prob, 3), 1238, 545, 44, teal);
  p.rect(1238, 573, 457, 25, '#d6d5c4');
  p.rect(1238, 573, 457 * prob, 25, teal);
  p.mono(fix(nll) + ' nats', 1238, 674, 46, red);
  if (c.beat.beatIndex === 1) {
    for (const [v, phrase, offset] of [
      [0.1, 'At one tenth', 31],
      [0.01, 'At one hundredth', 46],
    ]) {
      p.fade(cue(c, 1, phrase), () => {
        const y = py(surprise(v));
        p.circle(px(v), y, 9, ochre);
        p.mono(fix(v, 2) + ' → ' + fix(surprise(v), 2) + ' nats', px(v) + offset, y + 8, 30, cream);
      });
    }
  }
  p.fade(cue(c, 2, 'Dividing by the natural log'), () =>
    p.text(fix(nll / Math.LN2) + ' bits', 1238, 737, 38, dim),
  );
  if (c.beat.beatIndex === 3) {
    p.text('Other tokens share 98%', 1226, 858, 42, mint);
  }
}
export function mean(p, c) {
  p.ground();
  p.heading('Three losses, one length');
  const ns = cat.probs.map(surprise),
    total = sum(ns),
    scale = 425;
  const gather = cue(c, 1, 'Set the three lengths', 1.7),
    cut = cue(c, 1, 'Cut the total', 0.9);
  const totaled = afterPhrase(c, 1, 'three point two one nine nats', false);
  const averaged = afterPhrase(c, 1, 'one point zero seven three nats', false);
  const exponentiated = afterPhrase(c, 2, 'obtain perplexity', false);
  const solved = afterPhrase(c, 2, 'two point nine two', false);
  const colors = [blue, red, teal];
  let start = 0;
  cat.words.forEach((w, i) => {
    const sx = 195,
      sy = 295 + i * 174,
      dx = 195 + start * scale,
      dy = 382;
    const x = mix(sx, dx, gather),
      y = mix(sy, dy, gather),
      width = ns[i] * scale;
    p.rect(x, y, width, 65, colors[i]);
    p.rect(x, y + 57, width, 8, '#23343b37');
    p.text(w, x, y - 16, 40, colors[i]);
    if (gather < 0.97)
      p.fade(1 - gather, () =>
        p.mono('−ln(' + fix(cat.probs[i], 2) + ') ≈ ' + fix(ns[i]), x + width + 35, y + 49, 37, ink),
      );
    start += ns[i];
  });
  p.fade(gather, () => p.bracket(195, 485, total * scale, totaled ? fix(total) + ' nats in all' : '', ink));
  p.fade(cut, () => {
    const each = (total * scale) / 3;
    for (let i = 0; i < 3; i++) {
      p.rect(195 + i * each + 2, 610, each - 4, 67, '#b2c6af');
      if (averaged) p.mono(fix(total / 3), 195 + (i + 0.5) * each, 660, 43, ink, center);
    }
    p.text('Mean loss per target', 195, 739, 38, dim);
  });
  if (exponentiated) {
    const value = solved ? ' ≈ ' + fix(Math.exp(total / 3), 2) : '';
    p.serif('Perplexity: exp(' + fix(total / 3) + ')' + value, 195, 829, 56, teal);
  }
  if (afterPhrase(c, 2, 'same average surprise', false))
    p.text('Effective branching factor', 1125, 829, 35, dim);
  if (c.beat.beatIndex === 3) {
    p.text('Same score from reciprocal shares', 195, 236, 37, dim);
    p.mono('Cube root of (2 × 10 × 1.25)', 195, 306, 43, ink);
  }
}

const glyphs = {
  A: [
    '.....##......',
    '....#####....',
    '....#####....',
    '...###.###...',
    '...###.###...',
    '...###.###...',
    '..###...###..',
    '..###...###..',
    '.###########.',
    '.###########.',
    '.###.....###.',
    '.###.....###.',
    '####.....####',
    '####.....####',
    '####.....####',
  ],
  B: [
    '#########....',
    '##########...',
    '###.....###..',
    '###......##..',
    '###......##..',
    '###.....###..',
    '#########....',
    '#########....',
    '###.....###..',
    '###......##..',
    '###......##..',
    '###.....###..',
    '##########...',
    '#########....',
  ],
};
export function microtype(token) {
  const cells = [];
  glyphs[token].forEach((row, y) =>
    [...row].forEach((mark, x) => {
      if (mark === '#') cells.push({ x, y, letter: token === 'A' ? 'B' : 'A' });
    }),
  );
  const match = cells.find((c) => c.y === 8 && c.x === (token === 'A' ? 6 : 8));
  match.letter = token;
  return cells;
}
const type = { A: microtype('A'), B: microtype('B') };
export function choices(p, c) {
  p.ground();
  const b = c.beat.beatIndex;
  if (b < 2) {
    p.heading('Split every choice in half');
    const cuts = [4, 8, 16],
      starts = [1, cue(c, 0, 'Split every slice', 1), cue(c, 1, 'Split them once more', 1)];
    for (let i = 0; i < 3; i++)
      p.fade(starts[i], () => {
        const x = 410 + 550 * i,
          y = 484,
          r = 173,
          k = cuts[i];
        for (let j = 0; j < k; j++) {
          const a = -Math.PI / 2 + (2 * Math.PI * j) / k,
            z = a + (2 * Math.PI) / k;
          p.ctx.beginPath();
          p.ctx.moveTo(x, y);
          p.ctx.arc(x, y, r, a, z);
          p.ctx.closePath();
          p.ctx.fillStyle = j === 0 ? red : '#d7c59c';
          p.ctx.fill();
          p.ctx.strokeStyle = cream;
          p.ctx.lineWidth = 5;
          p.ctx.stroke();
        }
        p.mono('1 / ' + k, x, 752, 52, ink, center);
        p.text('PPL ' + k, x, 824, 42, teal, center);
      });
    return;
  }
  if (b < 4) {
    p.heading('An equivalent chance for the cat line');
    cat.words.forEach((word, i) => {
      const x = 155 + 525 * i;
      p.serif(word, x, 390, 100);
      p.rect(x, 440, 455, 52, '#ded9c5');
      p.rect(x, 440, 455 * cat.probs[i], 52, [blue, red, teal][i]);
      p.mono(fix(cat.probs[i], 2), x, 573, 58);
    });
    p.text('Cube root of', 155, 673, 37, dim);
    p.mono('0.50 × 0.10 × 0.80', 155, 743, 55);
    p.fade(cue(c, 2, 'thirty-four percent', 1), () =>
      p.mono('≈ ' + fix(Math.exp(-loss(cat.probs) / 3), 3), 986, 733, 59, teal),
    );
    if (b === 3)
      p.serif('Reciprocal ≈ ' + fix(Math.exp(loss(cat.probs) / 3), 2) + ' choices', 155, 869, 67, teal);
    return;
  }
  p.heading('An alphabet of two');
  p.stock(129, 219, 1662, 614);
  p.line(960, 222, 960, 832, '#c3b89b', 3);
  for (const [index, token] of ['A', 'B'].entries()) {
    const x = 308 + index * 822,
      cells = type[token];
    p.text('Printed ' + token, x - 112, 298, 40, dim);
    for (const cell of cells) {
      const xx = x + cell.x * 35,
        yy = 350 + cell.y * 28;
      p.text(cell.letter, xx, yy, 35, cell.letter === token ? red : ink, { weight: 700, align: 'center' });
      if (b === 5 && cell.letter === token) p.circle(xx, yy - 11, 26, null, red, 3);
    }
    if (b === 5) p.mono('1 match / ' + cells.length, x + 170, 792, 43, teal, center);
  }
  p.fade(cue(c, 5, 'The model put'), () => {
    const probs = ['A', 'B'].map((k) => type[k].filter((v) => v.letter === k).length / type[k].length);
    p.serif(
      'Two observed letters     √(100 × 100) = ' + Math.round(Math.exp(loss(probs) / 2)),
      960,
      932,
      64,
      red,
      center,
    );
  });
}
