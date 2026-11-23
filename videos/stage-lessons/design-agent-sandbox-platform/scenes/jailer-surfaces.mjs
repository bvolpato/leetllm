import {
  arrow,
  boxOf,
  column,
  dot,
  dynamic,
  fadeIn,
  pictogram,
  place,
  rect,
  to,
  zone,
} from 'vizmatic/stage';
import { label, namedBox } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'jailer-surfaces');
  const [top, bottom] = VIEW.rows([2, 1], 'wide');
  const [left, right] = top.columns([1, 1.8], 'loose');
  const guest = zone(
    column([pictogram('process', { size: 65, color: 'cyan' }), label('A execution', { size: 34 })]),
    { title: 'Guest kernel', color: 'cyan', titleSize: 31, padding: 20 },
  );
  const jail = place(
    zone(guest, { title: 'Restricted VMM', color: 'pink', titleSize: 31, padding: 26 }),
    left,
  );
  const names = ['filesystem', 'identity', 'resource controls', 'syscall interfaces'];
  const broad = ['host paths', 'host identity', 'host resources', 'host syscalls'];
  const narrow = ['restricted view', 'user / group', 'cgroup limits', 'syscall filters'];
  const rows = right.rows(4, 'tight');
  const interfaces = rows.map((r, i) => {
    const cols = r.columns([1, 1.5], 'normal');
    return {
      name: place(label(names[i], { size: 31, color: 'pink' }), cols[0]),
      broad: place(namedBox(broad[i], { width: 480, height: 58, size: 31, color: 'dim' }), cols[1]),
      narrow: place(
        namedBox(narrow[i], { width: 480, height: 58, size: 31, color: 'pink' }),
        cols[1],
      ),
    };
  });
  const [sourceRegion, sinkRegion] = bottom.columns([1, 1.8], 'loose');
  const output = place(
    namedBox('guest-driven output', { width: 460, height: 80, color: 'cyan', size: 34 }),
    sourceRegion,
  );
  const buffer = rect(660, 40, { stroke: 'dim', fill: 'surface' });
  const sink = place(
    zone(buffer, { title: 'Bounded host sink · limit', color: 'pink', titleSize: 34, padding: 26 }),
    sinkRegion,
  );
  const bounds = boxOf(buffer);
  const amount = s.value(0);
  const fill = dynamic(() => {
    const width = bounds.width * Math.min(1, amount.value);
    return width > 0
      ? rect(width, bounds.height, { fill: 'yellow', stroke: 'yellow' }).moveTo([
          bounds.left + width / 2,
          bounds.point('center')[1],
        ])
      : [];
  });
  const wires = [
    arrow(boxOf(jail).point('bottom'), boxOf(output).point('top'), { stroke: 'cyan', pad: 10 }),
    arrow(boxOf(output).point('right'), boxOf(sink).point('left'), { stroke: 'cyan', pad: 12 }),
  ];
  const packet = dot(12, 'cyan').moveTo(boxOf(output).point('right'));
  const caption = place(
    label('The host limits how much guest output it buffers', { size: 36 }),
    FOOT,
  );
  const transport = place(
    label('Virtual devices   ·   MMIO or PCI VirtIO transport', { size: 36 }),
    FOOT,
  );
  s.add(
    jail,
    interfaces.map((x) => [x.name, x.broad]),
    output,
    sink,
    fill,
    wires,
    caption,
  );
  for (const [i, item] of interfaces.entries())
    c.swap('narrow', item.broad, item.narrow, { lead: -i * 0.25 });
  c.on('output', () => {
    s.play(
      fadeIn(packet, { duration: 0.1 }),
      to(packet, (n) => n.moveTo(boxOf(sink).point('left')), { duration: 0.7 }),
    );
    s.play(amount.to(1.4, { duration: 1.5 }));
  });
  c.swap('transport', caption, transport);
  c.clear(wires, 0.5, 0.2);
}
