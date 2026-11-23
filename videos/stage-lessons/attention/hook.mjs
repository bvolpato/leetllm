import {
  arrow,
  draw,
  fadeIn,
  fadeOut,
  lagged,
  line,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { row } from '../kit.mjs';
import { WORDS, f2, midMono, midProse, pct } from '../../films/attention/defaults.mjs';
import { OUTPUT, V, WEIGHTS } from '../../films/attention/model.mjs';

export function buildHook(stage, narration, { show, leave }) {
  const hook = narration.scene('hook');
  const wordNodes = WORDS.map((word) => text(word, { font: 'text-serif', size: 100 }));
  row(wordNodes, 0, 18);
  const verbIndex = WORDS.indexOf('sing');
  const sources = [wordNodes[0], wordNodes[verbIndex]];
  const colors = ['blue', 'teal'];
  const subjectArc = arrow([sources[1].center[0], -83], [sources[0].center[0], -83], {
    bend: 320,
    tip: 25,
    width: 6,
    stroke: 'yellow',
  });
  const subjectQuestion = midProse('Who sings?', 0, 230, 77, 'yellow');
  const countedWords = wordNodes.slice(0, verbIndex + 1).reverse();
  const offsets = countedWords.map((word, i) =>
    midMono(String(i), word.center[0], 111, 62, 'dim'),
  );
  offsets[0].color(colors[1]);
  offsets.at(-1).color(colors[0]);
  const countLabel = midProse(
    'Positions back from sing',
    (sources[0].center[0] + sources[1].center[0]) / 2,
    222,
    52,
  );
  const phrase = wordNodes.slice(0, verbIndex);
  const first = phrase[0].left[0];
  const last = phrase.at(-1).right[0];
  const readerY = 80;
  const reader = rect(58, 9, { radius: 4, fill: 'teal', stroke: null }).at(first - 24, readerY);
  hook.at(0, () => {
    stage.camera.at((first + last) / 2, 0).set('sx', 1.65);
    stage.add(...phrase, reader);
    stage.play(to(reader, (n) => n.at(first + 30, readerY)), {
      duration: hook.cue('sentence').start - hook.start,
      ease: (t) => t,
    });
  });
  hook.on('sentence', () => {
    stage.play(
      to(reader, (n) => n.at(last - 24, readerY)),
      to(stage.camera, (camera) => camera.at(0, 0).set('sx', 1)),
      { duration: hook.span('sentence') },
    );
  });
  sources[1].color(colors[1]);
  hook.on('reaches-sing', () =>
    stage.play(fadeIn(sources[1]), to(reader, (n) => n.at(sources[1].center[0], readerY)), {
      duration: 0.15,
    }),
  );
  hook.on('after-verb', () =>
    stage.play(lagged(wordNodes.slice(verbIndex + 1).map((word) => fadeIn(word)), { lag: 0.35 }), {
      duration: hook.span('after-verb'),
    }),
  );
  hook.on('subject-question', () => stage.play(fadeIn(subjectQuestion), { duration: 0.3 }));
  hook.after('subject', () => {
    stage.remove(subjectQuestion, reader);
    stage.play(
      draw(subjectArc),
      to(sources[0], (n) => n.color('blue')),
      { duration: 0.8 },
    );
  });
  hook.on('count-back', () => {
    stage.add(countLabel, offsets[0]);
    stage.play(lagged(offsets.slice(1, -1).map((n) => fadeIn(n)), { lag: 1 }), {
      duration: hook.span('count-back'),
    });
  });
  hook.after('four-back', () => stage.play(fadeIn(offsets.at(-1)), { duration: 0.23 }));

  const ys = [-115, 115];
  hook.on('two-tokens', () => {
    stage.play(
      fadeOut([subjectArc, countLabel, ...offsets, ...wordNodes.filter((n) => !sources.includes(n))]),
      { duration: 0.24 },
    );
    stage.play(...sources.map((n, i) => to(n, (t) => t.moveTo([-660, ys[i]]))), {
      duration: 0.65,
      ease: smoother,
    });
  });

  const left = -340;
  const unit = 450;
  const heading = midProse('First number in each value', 135, -330, 64);
  const ticks = [0, 1, 2].flatMap((tick) => [
    line([left + unit * tick, 209], [left + unit * tick, 230], { stroke: 'dim', width: 3 }),
    midMono(String(tick), left + unit * tick, 266, 44, 'dim'),
  ]);
  const scale = line([left, 214], [left + unit * 2, 214], { stroke: 'dim', width: 3 });
  const tracks = V.map(([value], i) =>
    rect(value * unit, 56, {
      fill: 'surface',
      stroke: colors[i],
      width: 3,
      radius: 4,
    }).at(left + (value * unit) / 2, ys[i]),
  );
  const shares = WEIGHTS[1].map((w, i) =>
    midMono(`${pct(w)} of ${V[i][0]}`, left + 177, ys[i] - 69, 51, colors[i]),
  );
  const pieces = WEIGHTS[1].map((w, i) => {
    const width = V[i][0] * w * unit;
    return rect(width, 56, { fill: colors[i], stroke: null, radius: 4 }).at(
      left + width / 2,
      ys[i],
    );
  });
  const amounts = WEIGHTS[1].map((w, i) => midMono(f2(w * V[i][0]), 752, ys[i], 72, colors[i]));
  const question = midProse(
    'Which word supplies more of the first output number?',
    0,
    407,
    62,
    'yellow',
  );
  show(hook, 'first-number', [heading, scale, ...ticks]);
  show(hook, 'birds-input', tracks[0]);
  show(hook, 'sing-input', tracks[1]);
  show(hook, 'birds-share', shares[0]);
  show(hook, 'sing-share', shares[1]);
  show(hook, 'contribution-question', question, 0.3);
  hook.after('birds-piece', () => stage.play(fadeIn([pieces[0], amounts[0]]), { duration: 0.4 }));
  hook.after('sing-piece', () => stage.play(fadeIn([pieces[1], amounts[1]]), { duration: 0.4 }));
  const parts = WEIGHTS[1].map((share, i) => share * V[i][0]);
  const join = left + parts[0] * unit;
  const end = left + OUTPUT[1][0] * unit;
  const joined = [
    line([left, 340], [join, 340], { stroke: colors[0], width: 29 }),
    line([join, 340], [end, 340], { stroke: colors[1], width: 29 }),
  ];
  const total = midMono(
    `${f2(parts[0])} + ${f2(parts[1])} ≈ ${f2(OUTPUT[1][0])}`,
    0,
    437,
    59,
    'yellow',
  );
  hook.on('add-pieces', () => {
    stage.play(fadeOut(question), { duration: 0.2 });
    stage.play(draw(joined[0]), { duration: 0.45 });
    stage.play(draw(joined[1]), { duration: 0.45 });
  });
  hook.after('first-total', () => stage.play(fadeIn(total), { duration: 0.3 }));
  leave(hook, [
    heading,
    scale,
    ...ticks,
    ...tracks,
    ...shares,
    ...pieces,
    ...amounts,
    ...joined,
    total,
  ]);
  narration
    .scene('vectors')
    .at(0.05, () =>
      stage.play(
        ...sources.map((n, i) => to(n, (t) => t.scale(0.61).moveTo([630 + i * 174, -461]))),
        { duration: 0.8, ease: smoother },
      ),
    );
  return { wordNodes };
}
