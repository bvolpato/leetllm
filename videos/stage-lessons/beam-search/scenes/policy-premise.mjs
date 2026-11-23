import { assertEqual, column, group, line, linear, place, polygon, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLORS, LOGITS, PROBABILITIES, WORDS } from '../parts.mjs';
import { drawWord, massStrip } from '../ruler.mjs';

export default function policyPremise(s, c) {
  const [promptLine, stripRegion, outputs, guideLine] = area
    .inset('normal')
    .rows([1.15, 2.6, 1.65, 0.75], 'normal');
  const bar = stripRegion.inset('wide');
  const x = (p) => bar.left + p * bar.width;
  const u = 0.75;
  const sample = drawWord(WORDS, PROBABILITIES, u);
  const mode = WORDS[LOGITS.indexOf(Math.max(...LOGITS))];
  assertEqual(sample, 'revoke', 'word at the sampled rank');
  const prompt = place(label('The first step in rotating a key is ___', { size: 68 }), promptLine);
  const masses = massStrip(bar, PROBABILITIES, COLORS, 116);
  const firstEnd = PROBABILITIES[0];
  const secondEnd = firstEnd + PROBABILITIES[1];
  const tape = group(
    ...masses,
    ...[firstEnd / 2, (firstEnd + secondEnd) / 2].map((p, i) =>
      label(WORDS[i], { size: 60, color: 'surface' }).moveTo([x(p), bar.cy]),
    ),
    ...[0, firstEnd, secondEnd, 1].map((p) =>
      mono(p === 0 || p === 1 ? String(p) : p.toFixed(3), { size: 32 }).moveTo([x(p), bar.cy + 88]),
    ),
  );
  // The pointer travels to the sampled rank. Its tip stays clear of the word under it.
  const pinTop = bar.cy - 110;
  const pin = group(
    line([0, -22], [0, 18], { stroke: 'yellow', width: 8 }),
    polygon(
      [
        [-19, 13],
        [19, 13],
        [0, 42],
      ],
      { fill: 'yellow', stroke: null },
    ),
  ).at(x(0.43), pinTop);
  const rank = mono('0.75', { color: 'yellow', size: 38 }).moveTo([x(u), pinTop - 51]);

  const lanes = outputs.columns(2, 'loose').map((lane) => lane.rows([1, 1.6], 'tight'));
  const names = ['Weighted draw', 'Highest score'].map((name, i) =>
    place(label(name, { size: 40 }), lanes[i][0]),
  );
  const slot = (i, word) =>
    place(
      namedBox(word || '___', {
        width: 335,
        height: 98,
        size: 52,
        color: word ? COLORS[WORDS.indexOf(word)] : 'dim',
      }),
      lanes[i][1],
    );
  const blanks = [slot(0), slot(1)];
  const sampled = slot(0, sample);
  const greedy = slot(1, mode);
  const scoreCells = stripRegion.columns(4, 'normal');
  const scores = WORDS.map((word, i) =>
    place(
      column(
        [label(word, { size: 52, color: COLORS[i] }), mono(LOGITS[i].toFixed(1), { size: 50 })],
        { align: 'center', gap: 'normal' },
      ),
      scoreCells[i],
    ),
  );
  const guide = place(
    note(
      'Key rotation guide     1. Create a replacement     2. Deploy it     3. Revoke the old key',
      { size: 37 },
    ),
    guideLine,
  );

  const firstPicture = group(heading(c.title), prompt, ...names, ...blanks);
  s.add(firstPicture, tape, pin);
  // Hold the opening artwork at full opacity across the cut from the course mark.
  for (const node of [firstPicture, tape, pin]) node.opacity(1);
  s.play(
    to(pin, (node) => node.at(x(u), pinTop)),
    {
      duration: c.cue('draw-pin').end - c.window.from,
      ease: linear,
    },
  );
  c.show('draw-pin', rank, { after: true });
  c.swap('sample-word', blanks[0], sampled, { after: true });
  c.swap('scores', [tape, pin, rank], scores);
  c.swap('greedy-word', blanks[1], greedy, { after: true });
  c.show('guide-order', guide);
}
