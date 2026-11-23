import { arrow, boxOf, column, dot, fadeIn, indicate, place, row, to } from 'vizmatic/stage';
import { chip, label, mono, namedBox, tint } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'kvm-descriptors');

  const [top, bottom, exitsRegion] = VIEW.rows([1, 1.5, 1], 'normal');
  const nodes = ['/dev/kvm', 'VM fd', 'vCPU fd'].map((x) =>
    namedBox(x, { width: 350, height: 90, color: 'dim', font: 'mono' }),
  );
  place(row(nodes, { gap: 'loose' }), top);
  const wires = nodes
    .slice(1)
    .map((n, i) =>
      arrow(boxOf(nodes[i]).point('right'), boxOf(n).point('left'), { stroke: 'pink', pad: 12 }),
    );
  const run = dot(13, 'yellow').moveTo(boxOf(nodes[0]).point('top'));
  const branches = [
    ['return = 0', 'decode current exit', 'green'],
    ['−1 / EINTR', 'shutdown check → retry', 'yellow'],
    ['other error', 'STOP', 'red'],
  ].map(([code, action, color]) =>
    column([chip(code, { color }), label('↓', { color }), label(action, { color, size: 34 })], {
      gap: 'tight',
    }),
  );
  const ret = place(row(branches, { gap: 'loose' }), bottom);
  const branch = dot(12, 'yellow').moveTo(boxOf(nodes[2]).point('bottom'));
  const exitSlots = exitsRegion.columns(4, 'normal');
  const destinations = [
    'MMIO → handler',
    'port I/O → handler',
    'halt → lifecycle policy',
    'unhandled → stop',
  ].map((words, i) =>
    place(
      namedBox(words, {
        width: exitSlots[i].width,
        height: 80,
        size: 31,
        color: i === 3 ? 'red' : 'green',
      }),
      exitSlots[i],
    ),
  );
  const successBottom = boxOf(branches[0]).point('bottom');
  const exitOrigin = [successBottom[0], successBottom[1] + 24];
  const exitWires = destinations.map((node) =>
    arrow(exitOrigin, boxOf(node).point('top'), { stroke: 'green', pad: 10 }),
  );
  const exits = destinations.map(() => dot(10, 'yellow').moveTo(exitOrigin));
  const retry = place(
    label('Only EINTR takes the shutdown-and-retry path', { color: 'yellow' }),
    FOOT,
  );
  s.add(nodes, wires, ret);
  c.on('open', () => s.play(tint(nodes[0], 'pink')));
  c.on('vm', () =>
    s.play(
      fadeIn(run, { duration: 0.1 }),
      to(run, (n) => n.moveTo(boxOf(nodes[1]).point('top')), { duration: 1 }),
      tint(nodes[1], 'pink'),
    ),
  );
  c.on('cpu', () =>
    s.play(
      to(run, (n) => n.moveTo(boxOf(nodes[2]).point('top')), { duration: 1 }),
      tint(nodes[2], 'pink'),
    ),
  );
  c.on('return', () => s.play(indicate(branches[0], { scale: 1, color: 'yellow' })));
  c.show('retry', retry, { after: true });
  c.on('retry', () =>
    s.play(
      fadeIn(branch, { duration: 0.1 }),
      to(branch, (n) => n.moveTo(boxOf(branches[1].nodes[0]).point('top')), { duration: 1.2 }),
    ),
  );
  c.show('exits', [destinations, exitWires]);
  c.on('exits', () =>
    s.play(
      ...exits.map((node) => fadeIn(node, { duration: 0.1 })),
      ...exits.map((node, i) =>
        to(node, (n) => n.moveTo(boxOf(destinations[i]).point('top')), { duration: 1.2 }),
      ),
    ),
  );
  c.clear(exitWires, 0.5, 0.2);
}
