import { assertEqual, line, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../kit-narrated.mjs';
import { ARM, COLORS, cells, tally } from './parts.mjs';

const [body] = area.rows([8, 1], 'normal');
const sides = body.columns(2, 'wide');
const rows = 10;
export const observedMix = cells.map(([easy, hard]) => easy.length / (easy.length + hard.length));

// A column holds ten tickets. Within each risk group the green height is its observed
// resolution rate. Changing column width changes how much each original ticket counts.
export function riskBoard(s, title, { pooled = false, mix = observedMix } = {}) {
  s.add(heading(title));
  const panels = sides.map((side, i) => {
    const [name, riskNames, field, arithmetic, reading] = side.rows([0.85, 0.62, 4.8, 0.83, 0.92], 'tight');
    s.add(place(label(ARM[i], { size: 47, color: COLORS[i] }), name));
    s.add(rect(field.width + 4, field.height + 4, {
      fill: null, stroke: 'grid', width: 2,
    }).moveTo(field.point()));

    const marks = cells[i].flatMap((group, risk) => {
      const columns = group.length / rows;
      const greenRows = tally(group) / columns;
      assertEqual(Number.isInteger(greenRows), true, 'Whole tickets in each risk column');
      const seen = [0, 0];
      return group.map((ticket) => {
        const rank = seen[Number(ticket.resolved)]++;
        const blockHeight = ticket.resolved ? greenRows : rows - greenRows;
        return {
          ticket, risk, columns,
          column: Math.floor(rank / blockHeight),
          row: ticket.resolved ? rows - 1 - rank % blockHeight : rank % blockHeight,
          node: rect(1, 1, { fill: ticket.resolved ? 'green' : 'red', stroke: null }),
        };
      });
    });
    // Pool from the bottom up, keeping tickets in their risk-sorted slots whenever possible.
    const successes = tally(marks.map((mark) => mark.ticket));
    const easyColumns = cells[i][0].length / rows;
    const poolSlots = [[], []];
    for (const mark of marks) {
      const col = mark.column + (mark.risk ? easyColumns : 0);
      const slot = (rows - 1 - mark.row) * rows + col;
      if ((slot < successes) === mark.ticket.resolved) mark.pooledSlot = slot;
      else poolSlots[Number(slot < successes)].push(slot);
    }
    for (const mark of marks) {
      mark.pooledSlot ??= poolSlots[Number(mark.ticket.resolved)].shift();
    }

    function position(node, mark, easyShare, total, pool) {
      const share = mark.risk ? 1 - easyShare : easyShare;
      const width = field.width * (pool ? 1 / rows : total * share / mark.columns);
      const start = field.left + (pool || !mark.risk ? 0 : field.width * easyShare * total);
      const column = pool ? mark.pooledSlot % rows : mark.column;
      const row = pool ? rows - 1 - Math.floor(mark.pooledSlot / rows) : mark.row;
      return node.set('sx', width - 2).set('sy', field.height / rows - 2)
        .at(start + (column + 0.5) * width, field.top + (row + 0.5) * field.height / rows);
    }

    const names = ['Easy', 'Hard'].map((word) => label(word, { size: 32 }));
    const riskX = (risk, easy, total) =>
      field.left + field.width * total * (risk ? (1 + easy) / 2 : easy / 2);
    const divider = line([0, -field.height / 2], [0, field.height / 2], { stroke: 'ink', width: 3 });
    const moveDivider = (node, easy, total) => node.at(field.left + field.width * easy * total, field.cy);
    moveDivider(divider, mix[i], 1);
    names.forEach((n, g) => n.at(riskX(g, mix[i], 1), riskNames.cy));
    for (const mark of marks) s.add(position(mark.node, mark, mix[i], 1, pooled));
    if (!pooled) s.add(names, divider);

    return {
      riskLabels: [...names, divider],
      equation: (words) => place(mono(words, { size: 38 }), arithmetic),
      reading: (words) => place(label(words, { size: 44, color: COLORS[i] }), reading),
      guide: (share) => line(
        [field.left + share * field.width, field.top - 6],
        [field.left + share * field.width, field.bottom + 6],
        { stroke: 'yellow', width: 5, dash: [14, 10] },
      ),
      changes(easy, total) {
        return [
          ...marks.map((m) => to(m.node, (n) => position(n, m, easy, total, false))),
          ...names.map((name, g) => to(name, (n) => n.at(riskX(g, easy, total), riskNames.cy))),
          to(divider, (n) => moveDivider(n, easy, total)),
        ];
      },
    };
  });
  return {
    panels,
    riskLabels: panels.flatMap((p) => p.riskLabels),
    equations: (words) => panels.map((p, i) => p.equation(words[i])),
    readings: (words) => panels.map((p, i) => p.reading(words[i])),
    guides: (share) => panels.map((p) => p.guide(share)),
    move(shares, totals = [1, 1]) {
      s.play(...panels.flatMap((p, i) => p.changes(shares[i], totals[i])), { duration: 1.2 });
    },
  };
}
