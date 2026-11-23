import { C, fmt, sum } from './studio.mjs';
import { budget, peakParts } from './experiments.mjs';

export function diagnosis(p) {
  const { beat, at } = p;
  if (beat <= 2) {
    p.title(
      'Locate the first failed request',
      '80 GB usable on one GPU   /   requested bytes by phase',
    );
    const y0 = 736,
      sc = 4.48,
      second = beat === 2;
    const data = second ? [57, 72, 88] : [95];
    p.line(214, y0 - 80 * sc, 1670, y0 - 80 * sc, C.bad, 4);
    p.text('80 GB', 1697, y0 - 80 * sc + 10, 33, C.bad, 'Mono');
    ['Initialize', 'Forward', 'Backward', 'Update'].forEach((name, i) => {
      const x = 270 + 352 * i;
      const v = data[i];
      p.line(x, y0, x + 224, y0, C.line, 4);
      if (v !== undefined && (!second || i < 2 || at(2, 'Backward requests'))) {
        p.rect(x, y0 - v * sc, 224, v * sc, v > 80 ? C.bad : C.pcb, null, 5);
        p.center(v + ' GB', x + 112, y0 - 23, 37, C.light);
      }
      p.center(name, x + 112, 816, 35, C.sub);
    });
    p.text(
      second ? 'Inspect what coexists during backward.' : 'Inspect construction before sharding.',
      109,
      944,
      46,
      C.ink,
      'Serif',
    );
    return;
  }
  if (beat === 3) {
    p.title(
      'Find the first rank disagreement',
      'Smallest faithful rank group   /   compare the call order',
    );
    for (const r of [0, 1]) {
      const y = 348 + r * 216;
      p.text('Rank ' + r, 109, y + 72, 43, C.ink, 'Serif');
      for (let j = 0; j < 3; j++) {
        const x = 430 + j * 434,
          name = ['Gather 0', 'Forward 0', 'Gather ' + (r + 1)][j];
        p.block(
          x,
          y,
          377,
          105,
          j < 2 ? C.pcb : C.bad,
          j === 2 && !at(3, 'matching collective sequences') ? '…' : name,
          36,
        );
      }
    }
    p.tag('Timeout dump   /   enable the dump and set a positive trace buffer', 110, 903);
    return;
  }
  p.title('Read elapsed time from the critical path', 'Illustrative step trace   /   milliseconds');
  const x = 424,
    scale = 141;
  const lanes = [
    ['Data wait', 0, 1, C.work],
    ['Compute', 1, 7, C.weight],
    ['Collective', 2, 5, C.grad],
    ['Checkpoint', 7, 9, C.opt],
  ];
  const end = beat === 4 ? 9 * at(4, 'Separate data wait', 2.5) : 9;
  for (const [i, [name, start, stop, col]] of lanes.entries()) {
    const y = 279 + 128 * i;
    p.text(name, 100, y + 57, 34);
    p.line(x, y + 65, x + 9 * scale, y + 65, C.line);
    if (end > start) p.block(x + start * scale, y, scale * (Math.min(stop, end) - start), 66, col);
  }
  for (let t = 0; t <= 9; t++) p.text(t + '', x + scale * t, 850, 28, C.sub, 'Mono', 'center');
  if (at(5, 'The step ends at nine')) p.text('9 ms elapsed', 108, 960, 49, C.opt, 'Serif');
  if (at(5, 'Adding the bars gives twelve'))
    p.text('12 ms summed   /   3 ms counted twice', 587, 958, 38, C.grad, 'Mono');
}

export function recompute(p) {
  const { beat, clock } = p;
  const cases = [
    [0, 3, 'three units of activations'],
    [3, 1.5, 'cuts the saved activations in half'],
    [1.5, 4.5, 'four and a half units'],
    [4.5, 4.5, null],
  ];
  const [from, to, cue] = cases[beat - 1];
  const said = (phrase) => clock.elapsed >= clock.wordCue(phrase).end;
  const progress = cue ? Math.min(1, Math.max(0, (clock.elapsed - clock.wordCue(cue).end) / 0.65)) : 1;
  const parts = peakParts(from + (to - from) * progress);
  const colors = [C.weight, C.opt, C.work, C.act];
  const names = ['Model shards', 'Gather', 'Workspace', 'Saved activations'];
  const limit = 6;
  p.title(
    'What is live at the same instant?',
    'One rank   /   four-way full shard   /   capacity 6 units',
  );
  const start = 152;
  let x = start;
  const sc = 182,
    y = 421;
  const cap = start + limit * sc;
  p.measure(x, y - 25, 1600, limit, sc, 'unit');
  for (const [i, v] of parts.entries()) {
    if (v) p.ribbon(x, y, sc * v, 138, colors[i], 1);
    x += sc * v;
  }
  p.line(cap, y - 41, cap, y + 152, C.bad, 4);
  for (let i = 0; i < 4; i++) {
    const x = 117 + i * 446;
    p.rect(x, 704, 39, 39, colors[i], null, 4);
    p.text(names[i], x + 54, 736, 31);
    const value = i === 3 ? (progress === 1 ? to : progress === 0 && from > 0 ? from : null) : parts[i];
    p.text(value === null ? '—' : fmt(value) + ' units', x + 54, 790, 36, colors[i], 'Mono');
  }
  const total = sum(peakParts(to));
  const difference = total - limit;
  const showDifference = progress === 1 && (
    (beat === 1 && said('six-unit limit')) ||
    (beat === 2 && said('Five and a half units fit')) ||
    (beat === 4 && said('Two and a half units over'))
  );
  if (showDifference) {
    const resultColor = difference > 0 ? C.bad : C.ok;
    const y = 597;
    p.line(cap, y, x, y, resultColor, 4);
    p.line(cap, y - 10, cap, y + 10, resultColor, 4);
    p.line(x, y - 10, x, y + 10, resultColor, 4);
    p.text(fmt(Math.abs(difference)) + ' units ' + (difference > 0 ? 'over' : 'free'),
      (cap + x) / 2, 650, 37, resultColor, 'Mono', 'center');
    if (beat !== 4 || said('add up to eight and a half'))
      p.text(fmt(total) + ' units requested', 152, 650, 43, resultColor, 'Serif');
  } else if (beat === 3 && said('four and a half units')) {
    p.text('How far past the limit?', 152, 650, 44, C.sub, 'Serif');
  }
}

function bar(p, y, label, s, showResult, includeExtra = true) {
  const start = 465,
    sc = 11.65,
    colors = [C.weight, C.grad, C.opt];
  p.text(label, 105, y + 57, 39, C.ink, 'Serif');
  p.pcb(start - 12, y - 10, 80 * sc + 24, 96);
  p.rect(start, y, 80 * sc, 75, C.bed, null, 5);
  let x = start;
  for (const [i, v] of s.parts.entries()) {
    p.rect(x, y, v * sc, 75, colors[i]);
    x += v * sc;
  }
  if (includeExtra && s.extra) p.rect(x, y, s.extra * sc, 75, C.work);
  p.line(start + 80 * sc, y - 15, start + 80 * sc, y + 86, C.bad, 4);
  if (showResult)
    p.text(
      fmt(s.peak, s.state === budget(70, 24, 3).state ? 1 : 2) + ' GB',
      1789,
      y + 58,
      41,
      s.free < 0 ? C.bad : C.ok,
      'Mono',
      'right',
    );
}
export function sizing(p) {
  const { at, beat } = p;
  const practice = beat >= 4,
    measured = beat >= 6;
  p.title(
    practice ? 'Choose a stage for the 30B run' : 'How many 80 GB cards earn a trial?',
    practice
      ? '30B parameters   /   16 cards   /   18 GB concurrent extras'
      : '70B parameters   /   16 bytes per parameter   /   even full sharding',
  );
  for (const [i, [label, col]] of [
    ['Weights', C.weight],
    ['Gradients', C.grad],
    ['Master + moments', C.opt],
    ['Concurrent extras', C.work],
  ].entries()) {
    const x = [109, 440, 806, 1350][i];
    p.rect(x, 225, 34, 34, col, null, 3);
    p.text(label, x + 52, 254, 32, C.sub);
  }
  const selected = at(1, 'On sixteen cards');
  const xcap = 465 + 80 * 11.65;
  if (beat !== 4) p.text('80 GB', xcap, 339, 31, C.bad, 'Mono', 'center');
  if (!practice) {
    const dock = at(2, 'Put the eighteen next', 1.3),
      add = dock === 1;
    const case16 = budget(70, 16, 3, add ? 18 : 0);
    if (!selected) {
      bar(p, 390, '14 cards', budget(70, 14, 3), true);
      p.tag('State alone fills the card', 109, 703);
      return;
    }
    bar(p, 392, '16 cards', case16, true);
    if (at(2, 'Try twenty-four cards')) bar(p, 552, '24 cards', budget(70, 24, 3, 18), true);
    if (at(2, 'Thirty-two cards')) bar(p, 712, '32 cards', budget(70, 32, 3, 18), true);
    if (!add && at(1, 'eighteen more gigabytes')) {
      p.block(465 + 70 * 11.65 * dock, 631 - 239 * dock, 18 * 11.65, 75, C.work, '+18 GB', 31);
      if (!dock) p.text('Needed at the same instant', 719, 687, 38, C.sub);
    }
    if (add) p.text('8 GB over on 16 cards', 107, 899, 46, C.bad, 'Serif');
    if (beat === 3) p.text('24 is the smallest of these candidates to test.', 688, 900, 41, C.ok);
    return;
  }
  const s2 = budget(30, 16, 2),
    s3 = budget(30, 16, 3, 18);
  if (beat === 4) {
    p.text('Full inventory', 108, 409, 44, C.ink, 'Serif');
    const vals = budget(30, 1, 3).parts;
    for (const [i, v] of vals.entries())
      p.block(468 + i * 415, 356, 379, 99, [C.weight, C.grad, C.opt][i], v + ' GB', 42);
    p.text('ZeRO-2', 107, 633, 48, C.ink, 'Serif');
    p.text('Keep weights, divide gradients and optimizer by 16.', 466, 632, 38);
    p.text('ZeRO-3', 107, 802, 48, C.ink, 'Serif');
    p.text('Divide all three by 16.', 466, 802, 38);
    p.tag('Which layout leaves room for the 18 GB on an 80 GB card?', 110, 942);
    return;
  }
  const trial3 = at(5, 'With stage three'),
    extras = at(5, 'plus eighteen live');
  bar(p, 394, 'ZeRO-2  state', s2, true, false);
  if (trial3)
    bar(p, 589, 'ZeRO-3  ' + (extras ? 'peak' : 'state'), extras ? s3 : budget(30, 16, 3), true);
  if (at(7, 'LoRA changes')) {
    p.text('Frozen base', 111, 831, 43, C.ink, 'Serif');
    p.block(438, 772, 255, 83, C.weight, 'W', 36);
    p.text('Adapter', 831, 831, 43, C.ink, 'Serif');
    p.block(1063, 772, 225, 83, C.weight, 'A, B', 34);
    p.block(1312, 772, 405, 83, C.opt, 'Trainable state', 32);
    p.tag('LoRA changes which parameters receive gradients and optimizer moments.', 110, 945);
  } else if (measured) {
    p.text('48 GB projected', 107, 824, 50, C.ok, 'Serif');
    p.text('Measure the highest rank at the intended shape.', 663, 824, 41);
    p.tag(
      beat === 7
        ? 'Compare useful tokens/s and the first restored update'
        : 'Run forward, backward and the optimizer update',
      110,
      935,
    );
  } else if (trial3)
    p.tag('Stage 2 already exceeds capacity before the concurrent extras.', 110, 902);
}
