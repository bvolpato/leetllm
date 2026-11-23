import { arrow, boxOf, draw, recolor, place, seq } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { sampleModel } from '../../../films/prefix-reuse/model.mjs';
import { board, body, pointAt, readings } from '../parts.mjs';

export default function causalKeys(s, c) {
  const [old, edited] = [0, 1].map((beat) => sampleModel('causal-keys', { beat, beatP: 0.9 }));
  board(s, c, 'A key carries the history before it', 'Identity · SHA-256 prefixes');
  const [names, ...cols] = body.columns([0.44, 1, 1, 1], 'normal');
  const nameRows = names.rows(4);
  const storedLabel = place(note('Stored', { size: 35 }), nameRows[1], 'left');
  const editedLabel = place(note('Edited', { size: 35 }), nameRows[2], 'left');
  const blocks = [],
    keys = [],
    previous = [],
    updated = [];
  cols.forEach((col, i) => {
    const [first, second, revised, third] = col.rows(4);
    blocks.push(
      place(
        namedBox(old.oldBlocks[i], { width: col.width * 0.82, height: 92, color: 'blue' }),
        first,
      ),
    );
    previous.push(place(mono(old.keys[i].slice(0, 10), { color: 'blue' }), second));
    keys.push(place(mono(edited.keys[i].slice(0, 10), { color: i ? 'pink' : 'blue' }), revised));
    updated.push(
      place(
        note(['Same instructions', 'Block changed', 'Parent key changed'][i], {
          color: i ? 'pink' : 'green',
        }),
        third,
      ),
    );
  });
  const replacement = place(
    namedBox(edited.newBlocks[1], { width: cols[1].width * 0.82, height: 92, color: 'pink' }),
    cols[1].rows(4)[0],
  );
  const edges = blocks.slice(1).map((b, i) =>
    arrow(boxOf(blocks[i]).point('right'), boxOf(b).point('left'), {
      pad: 8,
      stroke: 'blue',
      width: 4,
    }),
  );
  s.add(blocks, previous, storedLabel);
  c.show('edit-guide', editedLabel);
  c.on('history-chain', () => s.play(pointAt(previous[0])));
  c.on('chained-hash', () => s.play(seq(...edges.map((e) => draw(e)))));
  c.swap('edit-guide', blocks[1], replacement);
  c.after('edit-guide', () => s.play(recolor(previous[1], 'dim')));
  c.show('instruction-survives', [keys[0], updated[0]], { after: true });
  c.show('guide-digest', [keys[1], updated[1]], { after: true });
  c.after('propagated-key', () => s.play(recolor(previous[2], 'dim')));
  c.show('propagated-key', keys[2], { after: true });
  c.show('propagated-key', updated[2], { after: true });
  readings(s, c, 'Each block has a parent key.', [
    ['actual-digest', 'key = SHA-256([parent key, block])'],
    ['computation-contract', 'Namespace · model, adapter, positions, conditioning', 'blue'],
  ]);
}
