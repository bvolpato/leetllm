import { assertEqual, boxOf, dot, dynamic, indicate, line, place, row, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  CONTEXT_COUNTS,
  CONTEXT_EVENTS,
  CONTEXT_WORDS,
  CORPUS,
} from '../../../films/embeddings/fixtures.mjs';

export default function neighbors(s, c) {
  const [source, counts] = area.columns([1.45, 1], 'loose');
  const left = source.rows([0.85, 1, 1, 1, 1, 1.2], 'normal');
  const right = counts.rows([0.85, 1, 1, 1, 1, 1.2], 'normal');
  const words = CORPUS.map((sentence, i) => {
    const nodes = sentence
      .split(' ')
      .map((w) => label(w, { size: 43, color: w === 'bank' ? 'blue' : 'ink' }));
    place(row(nodes, { gap: 'tight' }), left[i + 1], 'left');
    return nodes;
  });
  const totals = CONTEXT_WORDS.map(() => s.value(0));
  const colors = ['cyan', 'cyan', 'green', 'green'];
  const bins = CONTEXT_WORDS.map((word, j) => {
    const [name, tally, value] = right[j + 1].columns([1.5, 1.2, 0.7], 'normal');
    const sockets = tally.columns(2, 'normal').map((r) => r.point('center'));
    const rail = line(tally.point('left'), tally.point('right'), { stroke: 'grid', width: 4 });
    const count = dynamic(() =>
      place(mono(String(Math.round(totals[j].value)), { size: 54, color: colors[j] }), value),
    );
    return {
      sockets,
      nodes: [place(label(word, { size: 46, color: colors[j] }), name, 'left'), rail, count],
    };
  });
  const running = CONTEXT_WORDS.map(() => 0);
  s.add(
    heading(c.title),
    place(note('Four sentences  ·  center word in blue'), left[0], 'left'),
    place(note('Tracked neighbor'), right[0], 'left'),
    place(note('Pairs'), right[0], 'right'),
    words,
    bins.map((b) => b.nodes),
    place(note('Window extends four positions either side of bank.'), left[5], 'left'),
  );
  CONTEXT_EVENTS.forEach((event, i) => {
    const cue = 'pair-' + i;
    const word = words[event.sentenceIndex][event.token];
    const origin = boxOf(word).point('bottom');
    const mark = dot(12, colors[event.column]).moveTo([origin[0], origin[1] + 17]);
    const index = running[event.column]++;
    c.show(cue, mark, { fade: 0.1 });
    c.on(cue, () =>
      s.play(
        to(mark, (n) => n.moveTo(bins[event.column].sockets[index])),
        { duration: 0.75 },
      ),
    );
    c.on(cue, () => totals[event.column].set(index + 1), 0.75);
  });
  assertEqual(running, CONTEXT_COUNTS, 'observed bank pairs');
  const total = place(
    label(running.reduce((a, b) => a + b, 0) + ' observed pairs', { color: 'yellow' }),
    right[5],
    'left',
  );
  c.show('counts', total);
  c.on('objectives', () => s.play(indicate(total, { color: 'yellow', scale: 1 })));
}
