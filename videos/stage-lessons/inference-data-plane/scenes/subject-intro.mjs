import { assertEqual, column, dynamic, fadeIn, lerp, line, linear, place, rect } from 'vizmatic/stage';
import { expectedBlockIds } from '../../../films/inference-data-plane/fixtures.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, FIXTURE } from '../parts.mjs';
import { rankMap } from '../rank-map.mjs';

const RANGES = expectedBlockIds.slice(0, 3).map((id) => id.split(':')[1]);
const LAST = expectedBlockIds.length - 1;
assertEqual(expectedBlockIds[LAST], 'r1:16–23', 'last range in the prompt cache');

export default function subjectIntro(s, c) {
  const [summary, racks, detail, output] = area.rows([2.45, 4.2, 0.7, 0.75], 'normal');
  const [counterBand, chat] = summary.columns([1, 1], 'wide');
  const [prefill, link, decode] = racks.columns([4, 1, 4], 'tight');
  const sent = s.value(LAST - 1);
  const selected = s.value(-1);
  const committed = s.value(0);
  const source = rankMap(prefill, {
    title: 'Prefill worker',
    columns: RANGES,
    blocksPerCell: FIXTURE.segmentBlocks,
    read: () => ({ count: FIXTURE.segmentBlocks }),
  });
  const dest = rankMap(decode, {
    title: 'Decode worker',
    columns: RANGES,
    blocksPerCell: FIXTURE.segmentBlocks,
    read: (i) => ({
      count: i < Math.floor(sent.value) ? FIXTURE.segmentBlocks : 0,
      color: committed.value ? COLOR.valid : COLOR.state,
      outline: selected.value === i ? COLOR.mark : 'gridStrong',
      dashed: i >= Math.floor(sent.value),
    }),
  });
  // Show the transfer between the ports. Source KV stays resident throughout this handoff.
  const wires = [0, 1].map((rank) => {
    const y = source.cells[rank * 3].cy;
    return line([link.left, y], [link.right, y], { stroke: 'gridStrong', width: 3 });
  });
  const packet = dynamic(() => {
    const index = Math.floor(sent.value);
    const fraction = sent.value - index;
    if (fraction <= 0 || index > LAST) return [];
    const x = lerp(link.left + 28, link.right - 28, fraction);
    return Array.from({ length: FIXTURE.segmentBlocks }, (_, i) =>
      rect(12, 12, { fill: COLOR.state, stroke: null, radius: 2 }).at(
        x + ((i % 4) - 1.5) * 16,
        source.cells[index].cy + (Math.floor(i / 4) - 0.5) * 16,
      ),
    );
  });
  const [numberBand, caption] = counterBand.rows([2, 1], 'none');
  const counter = dynamic(() =>
    place(
      mono(`${Math.floor(sent.value) * FIXTURE.segmentBlocks} / ${FIXTURE.blocks}`, {
        size: 108,
        color: committed.value ? COLOR.valid : COLOR.state,
      }),
      numberBand,
      'left',
    ),
  );
  const countLabel = place(label('Cache blocks at decode'), caption, 'left');
  const [question, reply] = chat.rows([1.4, 1], 'normal');
  const prompt = place(
    column(
      [
        note('Maintenance log   ·   03:10   pump stopped'),
        label('“When did the pump stop?”', { size: 48 }),
      ],
      { gap: 'tight', align: 'left' },
    ),
    question,
    'bottom left',
  );
  const empty = place(mono('Waiting for first token…', { color: COLOR.mark }), reply, 'left');
  const at = place(mono('At', { size: 56, color: COLOR.valid }), reply, 'left');
  const finished = place(mono('At 03:10', { size: 56, color: COLOR.valid }), reply, 'left');
  const legend = place(note('One square holds one block of keys and values.'), detail, 'left');
  const queue = place(label('Next prompt queued at prefill', { color: COLOR.other }), output, 'left');
  const ask = place(
    label('Which rank and block range are missing?', { color: COLOR.mark }),
    output,
    'left',
  );
  const check = place(
    label('Transfer stopped   ·   state verified', { color: COLOR.control }),
    output,
    'left',
  );

  const opening = [
    heading(c.title),
    counter,
    countLabel,
    ...prompt.nodes,
    empty,
    ...source.nodes,
    ...dest.nodes,
    ...wires,
    packet,
  ];
  s.add(...opening);
  s.play(fadeIn(opening, { duration: 0 }));
  c.show('intro-read', legend);
  const arrival = c.cue('intro-ship');
  c.on('intro-ship', () =>
    s.play(sent.to(LAST, { duration: arrival.end - arrival.start, ease: linear })),
  );
  c.show('intro-question', ask);
  c.after('intro-answer', () => selected.set(LAST));
  c.on('intro-last', () => s.play(sent.to(LAST + 1, { duration: 1.2, ease: linear })));
  c.hide('intro-last', ask);
  c.show('intro-verify', check, { after: true });
  c.after('intro-commit', () => {
    selected.set(-1);
    committed.set(1);
  });
  c.swap('intro-output', empty, at, { after: true });
  c.swap('intro-next', check, queue);
  c.swap('intro-time', at, finished, { after: true });
}
