import { appear, dot, place, rect, to } from 'vizmatic/stage';
import { label, mono } from '../kit-narrated.mjs';
import { normalizeUrl } from '../../films/ai-lab-coding-interview-python-systems/arithmetic.mjs';
import { BOARD } from './parts.mjs';

export function traceFrontier(parents, claimOrder) {
  const origin = 'https://repo.example';
  const seen = new Set(
    ['/start', ...parents.map((parent) => parent.path)].map((path) => origin + path),
  );
  const rows = parents.map(() => []);
  for (const index of claimOrder) {
    const parent = parents[index];
    rows[index] = parent.links.map((raw, item) => {
      const url = normalizeUrl(raw, origin + parent.path);
      const admitted = url?.origin === origin && !seen.has(url.href);
      if (admitted) seen.add(url.href);
      return { raw, path: url && url.pathname + url.search, admitted, parent: index, item };
    });
  }
  return { rows, queue: rows.flat().filter((link) => link.admitted) };
}

export function bufferedFrontier(parents, returnOrder) {
  const returned = new Map(returnOrder.map((i) => [parents[i].path, parents[i].links]));
  const slots = parents.map(({ path }) => ({ path, links: returned.get(path) }));
  return traceFrontier(
    slots,
    slots.map((_, i) => i),
  );
}

export function frontierBoard(parents) {
  const [head, body] = BOARD.rows([0.65, 4.5], 'normal');
  const widths = [1.28, 2.3, 1.5, 1.92];
  const [nameHead, linksHead, , queueHead] = head.columns(widths, 'normal');
  const [nameArea, linksArea, handoff, queueArea] = body.columns(widths, 'normal');
  const inputs = [
    place(label('Parent order', { size: 36 }), nameHead),
    place(label('Callback links', { size: 40 }), linksHead),
  ];
  const colors = ['blue', 'cyan'];
  const names = nameArea.rows(2, 'wide');
  const lists = linksArea.rows(2, 'wide');
  const rows = lists.map((region, i) => {
    const cells = region.rows(2, 'tight');
    const marker = [names[i].left + 4, names[i].cy];
    inputs.push(
      place(mono(i + 1 + '  ' + parents[i].path, { size: 43, color: colors[i] }), names[i]),
    );
    for (const cell of cells) {
      inputs.push(
        place(
          rect(cell.width, 108, {
            stroke: 'grid',
            fill: null,
            width: 3,
            radius: 12,
          }),
          cell,
        ),
      );
    }
    const items = parents[i].links.map((raw, j) =>
      place(mono(raw, { size: 43, color: colors[i] }), cells[j]),
    );
    return { cells, items, marker };
  });
  const queueCells = queueArea.rows(3, 'wide');
  const fixed = [...inputs, place(label('Next queue', { size: 40 }), queueHead)];
  queueCells.forEach((cell, i) => {
    fixed.push(
      place(rect(cell.width, 116, { stroke: 'grid', fill: null, width: 3, radius: 12 }), cell),
    );
    if (i === 0)
      fixed.push(mono('front', { size: 31, color: 'dim' }).moveTo([cell.cx, cell.cy - 85]));
  });
  const cursor = dot(10, 'yellow').moveTo(rows[0].marker);
  const queueTiles = (trace) =>
    trace.queue.map((child) =>
      mono(child.path, { size: 44, color: colors[child.parent] }).moveTo([
        handoff.cx,
        rows[child.parent].cells[child.item].cy,
      ]),
    );
  function enqueue(s, tile, slot) {
    const cell = queueCells[slot];
    s.play(appear(tile, { duration: 0.16 }));
    s.play(to(tile, (node) => node.moveTo([handoff.cx, cell.cy]), { duration: 0.34 }));
    s.play(to(tile, (node) => node.moveTo(cell.point('center')), { duration: 0.46 }));
  }
  function skip(parent, item) {
    return place(
      mono('skip  ' + parents[parent].links[item], { size: 37, color: 'dim' }),
      rows[parent].cells[item],
    );
  }
  return {
    fixed,
    inputs,
    rows,
    cursor,
    queueTiles,
    enqueue,
    skip,
    nextParent: () => to(cursor, (node) => node.moveTo(rows[1].marker), { duration: 0.5 }),
  };
}
