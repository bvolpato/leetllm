import { boxOf, column, dot, dynamic, line, pictogram, place } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';

export const [context, drawing, verdict] = area.rows([1, 5.2, 1], 'normal');

// The plug belongs to the host reader. Closing it retracts the lead from the resource.
export function referenceRow(s, region, { resource, contents, holder, handle, art }) {
  const [left, , right] = region.columns([3.3, 2, 3.3], 'normal');
  const device = pictogram(art, { size: 86, color: 'cyan' });
  const process = pictogram('process', { size: 86, color: 'pink' });
  const item = place(
    column([device, label(resource, { size: 43, color: 'cyan' }), mono(contents, { size: 33 })], {
      gap: 'tight',
      align: 'center',
    }),
    left,
  );
  const reader = place(
    column([process, label(holder, { size: 43, color: 'pink' }), label(handle, { size: 33 })], {
      gap: 'tight',
      align: 'center',
    }),
    right,
  );
  const socket = boxOf(device).point('right');
  const end = boxOf(process).point('left');
  const pin = s.value(0);
  const lead = dynamic(() => {
    const tip = [socket[0] + pin.value * (end[0] - socket[0]) * 0.78, socket[1]];
    return [line(tip, end, { stroke: 'pink', width: 7 }), dot(12, 'pink').moveTo(tip)];
  });
  const port = dot(18, 'cyan').moveTo(socket);
  const caption = [(socket[0] + end[0]) / 2, socket[1] + 49];
  const open = label('OPEN', { size: 36, color: 'pink' }).moveTo(caption);
  const closed = label('CLOSED', { size: 36, color: 'dim' }).moveTo(caption);
  const connection = [port, lead, reader, open];
  const close = (c, cue) => {
    c.after(cue, () => s.play(pin.to(1, { duration: 0.55 })));
    c.swap(cue, open, closed, { after: true, lead: -0.55 });
  };
  return { item, connection, closedState: [item, reader, port, lead, closed], close };
}

export function diskRow(s, region) {
  return referenceRow(s, region, {
    resource: 'A’s scratch disk',
    contents: 'output.csv   1,99',
    holder: 'Exporter',
    handle: 'scratch reader',
    art: 'disk',
  });
}
