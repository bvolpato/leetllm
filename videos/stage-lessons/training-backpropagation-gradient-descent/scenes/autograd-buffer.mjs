import { sampleModel } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { arrow, boxOf, column, decimal, indicate, place, row } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { relay } from '../parts.mjs';
export default function autogradBuffer(s, c) {
  const m = sampleModel('autograd-buffer', { beat: 0, beatP: 0 });
  const [head, body, foot] = area.rows([1, 4, 1], 'loose');
  const [left, mid, right] = body.columns(3, 'loose');
  const source = place(namedBox(`a = ${m.a}`, { width: 250, height: 130, color: 'blue' }), left);
  const [top, bottom] = mid.rows(2, 'loose');
  const slots = [top, bottom].map((r) =>
    place(namedBox('a', { width: 150, height: 100, color: 'cyan' }), r),
  );
  const op = place(column([label('a × a'), mono(String(m.square))], { gap: 'wide' }), right);
  const edges = slots.flatMap((n) => [
    arrow(boxOf(source).point('right'), boxOf(n).point('left'), { stroke: 'dim', pad: 12 }),
    arrow(boxOf(n).point('right'), boxOf(op).point('left'), { stroke: 'dim', pad: 12 }),
  ]);
  const buffer = s.value(0);
  const name = place(label('Both inputs come from a'), head);
  const storage = place(
    row([label('a.grad'), decimal(() => buffer.value, { digits: 0, size: 71, color: 'yellow' })], {
      gap: 'loose',
    }),
    foot,
  );
  const title = heading(c.title);
  s.add(title, name, source, slots, op, edges, storage);
  c.on('buffer-shared', () => s.play(indicate(source, { scale: 1 })));
  c.on('buffer-first', () => relay(s, slots[0], source));
  c.after('buffer-first', () => buffer.set(m.pathContributions[0]));
  c.on('buffer-second', () => relay(s, slots[1], source));
  c.after('buffer-second', () => buffer.set(m.summed));

  const repeat = place(
    mono(`Second backward pass     a = ${m.a}     a × a = ${m.square}`, { size: 48 }),
    head,
  );
  const [header, pytorch, scalar] = body.rows([1, 1.5, 1.5], 'normal');
  const columns = (region) => region.columns([1.7, 1.1, 1.1, 1.1], 'normal');
  const headings = ['Starting a.grad', 'This pass adds', 'Ending a.grad'].map((text, i) =>
    place(label(text), columns(header)[i + 1]),
  );
  function bufferRow(region, engine, initial) {
    const [name, start, gain, end] = columns(region);
    const reading = (value, cell, color) => place(mono(String(value), { size: 72, color }), cell);
    return {
      name: place(label(engine), name),
      values: [reading(initial, start, 'blue'), reading('+' + m.summed, gain, 'ink')],
      pending: reading('?', end, 'yellow'),
      result: reading(initial + m.summed, end, 'yellow'),
    };
  }
  const kept = bufferRow(pytorch, 'PyTorch', m.summed);
  const reset = bufferRow(scalar, 'Article’s scalar engine', 0);
  const nextBatch = place(
    note('Clear once    →    accumulate gradients across micro-batches    →    optimizer step'),
    foot,
  );
  c.swapAll('buffer-again', [repeat, headings, kept.name], { keep: [title] });
  c.show('buffer-kept', [kept.values, kept.pending]);
  c.swap('buffer-repeat', kept.pending, kept.result, { after: true, lead: 0 });
  c.show('buffer-reset', [reset.name, reset.values, reset.pending], { lead: 0 });
  c.swap('buffer-fresh-result', reset.pending, reset.result, { after: true, lead: 0 });
  c.show('buffer-clear', nextBatch);
}
