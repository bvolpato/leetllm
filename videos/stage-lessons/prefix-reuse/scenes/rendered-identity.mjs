import { beside, par, place, tokens, row, pictogram, seq, to } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { board, body, pointAt, readings } from '../parts.mjs';

export default function renderedIdentity(s, c) {
  board(s, c, 'Which version reached the tokenizer?', 'Rendering · escaped control characters');
  const [a, b] = body.rows(2, 'wide');
  const inputRow = (region, name) => {
    const cells = region.columns([1, 1.3, 1.5, 1, 1.5, 1.3], 'tight');
    const words = ['role', 'policy', '\\n', 'retain', 'tools'];
    const chips = words.map((word, i) => place(namedBox(word, {
      width: cells[i + 1].width - 12, height: 76, color: 'blue', font: 'mono',
    }), cells[i + 1]));
    const guideLabel = beside(note('Inside guide', { color: 'blue' }), chips[2], 'under', 'normal');
    const label = place(note(name, { size: 38 }), cells[0], 'left');
    return { chips, cells, nodes: [label, ...chips, guideLabel] };
  };
  const stored = inputRow(a, 'Stored');
  const input = inputRow(b, 'Input');
  const ending = input.chips[2];
  const altered = place(namedBox('\\r\\n', {
    width: input.cells[3].width - 12, height: 76, color: 'pink', font: 'mono',
  }), input.cells[3]);
  const lists = [a, b].map((band, i) => {
    const [name, first, second] = band.columns([0.7, 1.6, 1.6], 'normal');
    const title = place(note(i ? 'Input' : 'Stored', { size: 38 }), name, 'left');
    const message = (region, text, role, color) => place(namedBox(text, {
      width: region.width - 30, height: 100, size: 44, sub: role, subSize: 30, color,
    }), region);
    const question = message(first, 'Which test failed?', 'User', 'blue');
    const answer = message(second, 'Checkout.', 'Assistant', 'pink');
    const object = (json) => place(mono(json, { size: 48 }), band);
    return { title, question, answer, distance: second.cx - first.cx,
      original: object(i ? '{"line":8,"file":"cart.py"}' : '{"file":"cart.py","line":8}') };
  });
  const sorted = place(mono('{"file":"cart.py","line":8}', { size: 48 }), b);
  const names = lists.map(list => list.title);
  const messages = lists.flatMap(list => [list.question, list.answer]);
  const lower = lists[1];
  const imageRows = ['server', 'database'].map((art, i) =>
    place(
      row(
        [
          tokens(['<image>'], { size: 48, label: i ? 'Input' : 'Stored' }),
          pictogram(art, { size: 124, color: 'blue', accent: i ? 'pink' : 'green' }),
        ],
        { gap: 'loose' },
      ),
      i ? b : a,
    ),
  );
  s.add(stored.nodes, input.nodes);
  c.on('render-pipeline', () => s.play(...input.chips.map(pointAt)));
  c.swap('render-edit', ending, altered);
  c.swap('render-repair', altered, ending);
  c.swap('render-object', [stored.nodes, input.nodes], [...names, ...lists.map(list => list.original)]);
  c.swap('render-sort', lower.original, sorted, { after: true });
  c.swap('render-array', [lists[0].original, sorted], messages);
  c.on('render-reverse', () => {
    const move = (dx, dy) => par(
      to(lower.question, node => node.shift(dx, dy)),
      to(lower.answer, node => node.shift(-dx, -dy)),
    );
    s.play(seq(move(0, -66), move(lower.distance, 0), move(0, 66)), { duration: 1.1 });
  });
  c.swap(
    'render-placeholder',
    [...names, ...messages],
    imageRows.map((r) => r.nodes[0]),
  );
  c.show('render-image', imageRows[0].nodes[1], { after: true, fade: 0.2 });
  c.show('render-database', imageRows[1].nodes[1], { after: true, fade: 0.2 });
  readings(s, c, 'Source guide → renderer → serialized input → tokenizer', [
    ['render-edit', 'The first difference is inside the guide.', 'red', 'render-repair'],
    ['render-eligible', 'Stored and incoming text match again.', 'green'],
    ['render-object', 'Same fields and values'],
    ['render-array', 'Read the messages from left to right.'],
    ['render-reverse', 'The lower conversation now starts with the answer.', 'yellow'],
    ['render-placeholder', 'Compare the image content behind the placeholder.'],
  ]);
}
