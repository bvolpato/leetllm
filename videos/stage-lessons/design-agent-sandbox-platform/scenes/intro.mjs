import {
  boxOf,
  dot,
  fadeIn,
  group,
  indicate,
  line,
  linear,
  pictogram,
  place,
  polygon,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';

export default function scene(s, c) {
  const [status, transfer, caption, foot] = area.rows([1, 3.6, 0.85, 1], 'normal');
  const ends = (region) => region.columns([1, 0.65, 1], 'wide');
  const [source, , destination] = ends(transfer);
  const [guestSlot, , hostSlot] = ends(status);
  const stopped = place(label('Guest A   ·   stopped', { size: 47, color: 'cyan' }), guestSlot);
  const exporter = place(label('Host exporter', { size: 47, color: 'pink' }), hostSlot);

  const paper = place(
    group(
      polygon(
        [
          [-225, -166],
          [148, -166],
          [225, -89],
          [225, 166],
          [-225, 166],
        ],
        {
          fill: 'ink',
          stroke: null,
        },
      ),
      polygon(
        [
          [148, -166],
          [225, -89],
          [148, -89],
        ],
        { fill: 'cyan', stroke: null },
      ),
      mono('output.csv', { size: 43, color: 'bg' }).at(-37, -100),
      line([-180, -48], [180, -48], { stroke: 'bg', width: 3 }),
      mono('id,value', { size: 36, color: 'bg' }).at(0, -5),
      mono('1,99', { size: 68, color: 'bg' }).at(0, 84),
    ),
    source,
  );
  const reader = place(
    group(
      rect(466, 294, { radius: 18, fill: 'surface', stroke: 'pink', width: 5 }),
      line([-230, -50], [230, -50], { stroke: 'pink', width: 3 }),
      mono('Reading output.csv', { size: 34, color: 'pink' }).at(0, -99),
    ),
    destination,
  );
  const y = boxOf(reader).cy + 49;
  const diskPort = [boxOf(paper).right, y];
  const hostPort = [boxOf(reader).left, y];
  const cable = line(diskPort, hostPort, { stroke: 'pink', width: 7 });
  const ports = [dot(12, 'cyan').moveTo(diskPort), dot(12, 'pink').moveTo(hostPort)];
  const record = group(
    rect(161, 79, { fill: 'cyan', stroke: null, radius: 9 }),
    mono('1,99', { size: 48, color: 'bg' }),
  ).moveTo([diskPort[0] + 102, y]);

  const [diskSlot, linkSlot] = ends(caption);
  const disk = place(
    row(
      [
        pictogram('disk', { size: 58, color: 'cyan' }),
        label('A’s scratch disk', { size: 40, color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    diskSlot,
  );
  const open = place(label('Reader open', { size: 39, color: 'pink' }), linkSlot);
  const question = heading(c.title);
  const held = heading('Keep the disk with A');
  const waiting = place(
    label('Next tenant waiting for scratch space', { size: 41, color: 'blue' }),
    foot,
  );
  const shared = place(
    row(
      [
        pictogram('snapshot', { size: 57, color: 'green' }),
        label('Read-only Python image   ·   shared across jobs', { size: 40, color: 'green' }),
      ],
      { gap: 'normal' },
    ),
    foot,
  );

  const opening = [question, stopped, exporter, paper, reader, cable, ...ports, record, disk, open];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(
    to(record, (n) => n.moveTo([boxOf(reader).cx, y]), {
      duration: c.cue('read').end - c.window.from,
      ease: linear,
    }),
  );
  c.show('wait', waiting);
  c.swap('hold', question, held, { after: true, lead: 0 });
  c.on('handle', () => s.play(indicate(open, { color: 'pink', scale: 1.08 })));
  c.swap('base', waiting, shared);
}
