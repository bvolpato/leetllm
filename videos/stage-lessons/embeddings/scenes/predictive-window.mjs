import { arrow, dot, dynamic, line, place, row } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';

export default function predictiveWindow(s, c) {
  const sentence = ['children', 'read', 'stories', 'each', 'night'];
  const center = 1;
  const radius = 2;
  const neighbors = sentence
    .map((_, i) => i)
    .filter((i) => i !== center && Math.abs(i - center) <= radius);
  const [strip, , method, detail] = area.rows([1.2, 1.2, 0.8, 1.2], 'normal');
  const slots = strip.columns([1.25, 0.85, 1.1, 0.85, 0.95], 'normal');
  const words = sentence.map((word, i) =>
    place(
      label(word, {
        size: 76,
        color: i === center ? 'blue' : neighbors.includes(i) ? 'cyan' : 'dim',
      }),
      slots[i],
    ),
  );
  const gap = place(label('?', { size: 76, color: 'blue' }), slots[center]);
  const slot = slots[center];
  const underline = line([slot.cx - 97, slot.cy + 55], [slot.cx + 97, slot.cy + 55], {
    stroke: 'blue',
    width: 4,
  });
  const offsets = slots.map((region, i) => {
    const offset = i - center;
    const text = offset > 0 ? '+' + offset : String(offset).replace('-', '−');
    return mono(text, { size: 35, color: i === center ? 'blue' : 'dim' }).at(
      region.cx,
      region.top + 15,
    );
  });

  // Each neighbor keeps its own landing point so all three arrowheads remain visible.
  function flow(inward) {
    const color = inward ? 'cyan' : 'blue';
    const progress = s.value(0);
    const paths = neighbors.map((i) => {
      const distance = i - center;
      const port = slot.cx + Math.sign(distance) * (radius + 1 - Math.abs(distance)) * 32;
      const y = slot.cy + 72;
      const [from, to] = inward ? [slots[i].cx, port] : [port, slots[i].cx];
      const span = to - from;
      const bend = 0.58 * span;
      return [
        arrow([from, y], [to, y], { stroke: color, width: 5, tip: 28, bend }),
        dynamic(() => {
          const t = progress.value;
          if (t >= 1) return [];
          return [dot(11, color).at(from + t * span, y + 2 * Math.abs(bend) * t * (1 - t))];
        }),
      ];
    });
    return { paths, progress };
  }

  const inward = flow(true);
  const outward = flow(false);
  const question = place(label('Which word fits the gap?', { size: 56, color: 'yellow' }), detail);
  const cbow = place(label('Continuous bag of words', { size: 56, color: 'cyan' }), method);
  const skip = place(label('Skip-gram', { size: 56, color: 'blue' }), method);
  const excluded = place(label('night is three positions from read', { size: 46 }), detail);
  const scoreLine = (name, expression, region) =>
    place(
      row([label(name, { size: 48 }), mono(expression, { size: 46 })], { gap: 'wide' }),
      region,
    );
  const training = scoreLine('Skip-gram score', 'input[read] · output[stories]', method);
  const similar = scoreLine('Word similarity', 'cosine(input[read], input[write])', detail);

  s.add(
    heading(c.title),
    words.filter((_, i) => i !== center),
    gap,
    underline,
    inward.paths,
    question,
  );
  c.show('cbow', cbow);
  c.on('cbow', () => s.play(inward.progress.to(1, { duration: 1.4 })));
  c.swap('word', [gap, question], words[center], { lead: 0 });
  c.swap('skipgram', [cbow, inward.paths], [skip, outward.paths]);
  c.on('skipgram', () => s.play(outward.progress.to(1, { duration: 1.4 })), 0.4);
  c.show('pairs', offsets.slice(0, -1));
  c.show('night', [offsets.at(-1), excluded]);
  const stories = neighbors.indexOf(sentence.indexOf('stories'));
  c.swap(
    'tables',
    [skip, offsets, excluded, outward.paths.filter((_, i) => i !== stories)],
    training,
  );
  c.hide('compare', outward.paths[stories]);
  c.show('compare', similar);
}
