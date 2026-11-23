import { dynamic, fadeIn, line, place, polygon, polyline, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { newest, source } from '../packet.mjs';

function chatMessage(region, author, words, color) {
  const { left, right, top, bottom } = region.inset('normal');
  const x = left + 44;
  const y = (top + bottom) / 2;
  return [
    polygon([[left, top], [right, top], [right, bottom - 24], [left + 72, bottom - 24],
      [left + 36, bottom], [left + 36, bottom - 24], [left, bottom - 24]], {
      fill: 'surface', stroke: color, width: 4,
    }),
    label(author, { size: 37, color, anchor: 'left' }).at(x, y - 55),
    label(words, { size: 58, anchor: 'left' }).at(x, y + 22),
  ];
}

export default function intro(s, c) {
  const [request, archive] = area.columns([1.15, 1], 'wide');
  const [requestLabel, thread] = request.rows([1, 7], 'normal');
  const [archiveLabel, file] = archive.rows([1, 7], 'normal');
  const [earlier, later] = thread.rows(2, 'tight');
  const opened = s.value(0), signed = s.value(0);
  const checked = s.value(0), selected = s.value(0);
  const pocket = file.inset('normal');
  const left = pocket.left, right = pocket.right;
  const lip = pocket.cy + pocket.height * 0.12;
  const leftEdge = left + 28, rightEdge = right - 28;

  const folder = dynamic(() => {
    const top = lip - 100 - opened.value * (lip - pocket.top - 100);
    const edge = Math.min(top + pocket.height * 0.64, pocket.bottom - 10);
    const textX = leftEdge + 42;
    const nodes = [
      rect(pocket.width, pocket.bottom - lip + 70, {
        fill: 'surface', stroke: 'yellow', width: 4, radius: 12,
      }).moveTo([pocket.cx, (lip + pocket.bottom - 70) / 2]),
      polygon([[leftEdge, top], [rightEdge - 50, top], [rightEdge, top + 50],
        [rightEdge, edge], [leftEdge, edge]], { fill: 'ink', stroke: null }),
      polyline([[rightEdge - 50, top], [rightEdge - 50, top + 50], [rightEdge, top + 50]],
        { stroke: 'bg', width: 3 }),
      mono(source.source + '   /   v' + source.version, { size: 36, color: 'bg', anchor: 'left' }).at(textX, top + 54),
    ];
    if (opened.value === 1) nodes.push(
      label('“I approve the rollback.”', { size: 48, color: 'bg', anchor: 'left' }).at(textX, top + 160),
      line([textX, top + 294], [rightEdge - 42, top + 294], { stroke: 'bg', width: 3 }),
    );
    if (signed.value) nodes.push(label('Signed by the ' + source.actor, {
      size: 40, color: 'bg', anchor: 'left',
    }).at(textX, top + 250));
    nodes.push(
      polygon([[left, lip], [left + pocket.width * 0.37, lip], [left + pocket.width * 0.43, lip + 32],
        [right, lip + 32], [right, pocket.bottom], [left, pocket.bottom]], {
        fill: 'surface', stroke: 'yellow', width: 5,
      }),
      label('Archived decision', { size: 56, color: 'yellow' }).at(pocket.cx, (lip + pocket.bottom) / 2 + 12),
    );
    return nodes;
  });
  const focus = dynamic(() => {
    const checkX = later.right - 103, checkY = later.cy - 55;
    const nodes = [];
    if (checked.value) nodes.push(polyline([[checkX - 30, checkY], [checkX - 10, checkY + 20],
      [checkX + 28, checkY - 22]], { stroke: 'green', width: 9 }));
    if (selected.value) nodes.push(line([earlier.left + 46, earlier.cy - 68],
      [earlier.left + 46, earlier.cy + 48], { stroke: 'blue', width: 6 }));
    return nodes;
  });
  const first = [
    heading(c.title),
    place(label('In the assistant’s request', { size: 46, color: 'cyan' }), requestLabel, 'left'),
    place(label('Outside the request', { size: 46, color: 'yellow' }), archiveLabel, 'left'),
    ...chatMessage(earlier, 'Deploy owner', 'Please roll back the canary.', 'blue'),
    ...chatMessage(later, 'On-call engineer', newest.text, 'green'),
    folder, focus,
  ];
  s.add(...first);
  s.play(fadeIn(first, { duration: 0 }));
  c.on('read-completion', () => checked.set(1));
  c.on('read-request', () => selected.set(1));
  c.on('open-record', () => s.play(opened.to(1, { duration: 0.85 })));
  c.on('read-signature', () => signed.set(1));
}
