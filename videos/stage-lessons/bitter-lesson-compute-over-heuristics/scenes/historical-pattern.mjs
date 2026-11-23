import { barChart, column, line, neuralNet, place, rect, to, tree } from 'vizmatic/stage';
import { chip, heading, label, note } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';

export default function history(s, c) {
  const [subject, main, foot] = BODY.rows([0.8, 3.3, 1], 'wide');
  const [left, right] = main.columns([1.3, 1], 'loose');
  const title = heading(c.title);
  const name = (text) => place(label(text, { size: 56 }), subject);
  const caption = (text) => place(label(text, { size: 42 }), foot);
  const branch = {
    id: 'board',
    label: '',
    children: ['A', 'B', 'C'].map((move) => ({
      id: move,
      label: move,
      children: [1, 2].map((n) => ({ id: move + n, label: '' })),
    })),
  };
  const moves = (region, color) =>
    place(
      tree(branch, {
        width: region.width - 125,
        levelGap: 118,
        shown: 1,
        radius: 31,
        labelSize: 35,
        edgeColor: 'dim',
        nodeColor: color,
      }),
      region,
    );
  const chess = moves(left, 'blue');
  const evaluation = place(
    column(
      [
        note('How Deep Blue scores a position', { size: 36 }),
        label('Expert-designed features', { size: 48, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const deeper = caption('Each new level adds possible replies');
  s.add(title, name('Deep Blue  ·  chess  ·  1997'), chess, evaluation);
  c.on('deep-search', () =>
    s.play(chess.grow(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], { duration: 1.4 })),
  );
  c.show('deep-search', deeper);

  const network = place(
    neuralNet([3, 4, 2], {
      width: left.width - 160,
      height: left.height - 130,
      radius: 28,
      edgeColor: 'dim',
      colors: ['dim', 'blue', 'green'],
    }),
    left,
  );
  const hand = place(
    column(
      [note('SIFT descriptor', { size: 38 }), label('Local changes in brightness', { size: 47 })],
      { gap: 'normal' },
    ),
    right,
  );
  const shades = ['#232830', '#30353c', '#bcc1ca', '#dbe0e8'];
  const cellSize = 54;
  const patch = Array.from({ length: 6 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => {
      const edge = x < 3 + Math.floor(y / 3) ? 0 : 2;
      return rect(cellSize - 2, cellSize - 2, {
        fill: shades[edge + ((x + y) % 2)],
        stroke: null,
      }).moveTo([left.cx + (x - 3.5) * cellSize, left.cy + (y - 2.5) * cellSize]);
    }),
  ).flat();
  const learned = place(
    column(
      [
        note('AlexNet filters', { size: 38 }),
        label('Trained on images', { color: 'green', size: 52 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const filters = caption('Training changes the weights within each filter');
  const vision = name('Computer vision');
  c.swapAll('vision', [vision, patch, hand], { keep: [title] });
  c.swap('learn-filters', [hand, patch], [learned, network, filters]);
  c.on(
    'learn-filters',
    () => {
      s.play(
        ...network.links.flat(2).map((edge, i) =>
          to(
            edge,
            (node) => {
              node.set('strokeWidth', i % 3 === 0 ? 5 : 1);
              node.set('opacity', i % 3 === 0 ? 1 : 0.25);
            },
            { duration: 1.25 },
          ),
        ),
      );
      s.play(network.forward({ color: 'green', duration: 1.2 }));
    },
    0.4,
  );

  const base = place(
    column(
      [
        note('Base network training', { size: 38 }),
        label('5–6 days', { color: 'blue', size: 95 }),
        label('2 GTX 580 GPUs', { size: 46 }),
      ],
      { align: 'center', gap: 'wide' },
    ),
    left,
  );
  const [models, prediction] = right.columns([1, 1], 'wide');
  const modelSlots = models.inset('wide').rows(7, 12);
  const combine = place(chip('Average', { size: 43, color: 'green' }), prediction);
  const ensemble = modelSlots.flatMap((slot) => {
    const bar = rect(slot.width * 0.65, slot.height * 0.85, { fill: 'blue', radius: 8 }).moveTo(
      slot.point('center'),
    );
    const edge = line(
      [slot.cx + slot.width * 0.325, slot.cy],
      [prediction.cx - combine.bounds().width / 2, prediction.cy],
      { stroke: 'blue', width: 3 },
    );
    return [edge, bar];
  });
  const combined = caption('2012 winning entry  ·  predictions from seven networks');
  c.swapAll('base-cost', [name('Training AlexNet'), base], { keep: [title] });
  c.show('ensemble', [...ensemble, combine, combined]);

  const speech = name('Speech recognition');
  const method = (text) => place(chip(text, { size: 47, color: 'blue' }), main);
  const sound = method('Expert rules for speech sounds');
  const hmm = method('Hidden Markov model');
  const deep = method('Deep neural network');
  const [input, , output] = main.columns([1, 1.35, 1], 'wide');
  const sequence = [
    place(label('Recording  →', { size: 52 }), input),
    place(label('→  Words', { size: 52 }), output),
  ];
  c.swapAll('speech', [speech, ...sequence, sound], { keep: [title] });
  c.swap('speech-model', sound, hmm);
  c.swap('speech-net', hmm, deep);

  const go = moves(left, 'green');
  const [policyName, plot] = right.rows([0.7, 1.9], 'wide');
  const policy = place(
    barChart(
      ['A', 'B', 'C'].map((move) => ({
        label: 'Move ' + move,
        color: 'green',
        value: 1 / 3,
      })),
      { width: plot.width - 120, height: 175, max: 1, showValues: false, labelSize: 37 },
    ),
    plot,
  );
  const preferences = place(note('Example move preferences', { size: 39 }), policyName);
  const value = caption('Value estimate  ·  how promising is the position after C?');
  c.swapAll('self-play', [name('AlphaZero  ·  self-play  ·  2017'), go, policy, preferences], {
    keep: [title],
  });
  c.on('move-policy', () => s.play(policy.update([0.1, 0.2, 0.7], { duration: 1 })));
  c.on('follow-move', () => {
    s.play(go.path('C', { color: 'green', duration: 0.6 }));
    s.play(go.grow(['C1', 'C2'], { duration: 1.1 }));
  });
  c.show('position-value', value);
}
