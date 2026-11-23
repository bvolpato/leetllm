import {
  assertEqual,
  boxOf,
  connector,
  dynamic,
  group,
  line,
  place,
  rect,
  to,
  unitChart,
} from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../kit-narrated.mjs';
import { causalTicketLedger, responseTypePairing } from '../../films/causality/model.mjs';

// Cyan and pink track the two workflows. Green and red track the outcome of a ticket.
// Yellow identifies the current measurement or operation. Dim marks preserve context.
export const ARM = ['Assistant', 'Control'];
export const COLORS = ['cyan', 'pink'];
export const tickets = causalTicketLedger();
export const arms = ARM.map((name) => tickets.filter((t) => t.arm === name.toLowerCase()));
export const cells = arms.map((arm) =>
  ['low', 'high'].map((risk) => arm.filter((t) => t.risk === risk)),
);
export const tally = (list) => list.filter((t) => t.resolved).length;
export const rate = (list) => tally(list) / list.length;
export const raw = arms.map(rate);
export const pct = (v, digits = 0) => (100 * v).toFixed(digits) + '%';
export const diff = (v, digits = 0) =>
  (v > 0 ? '+' : '') + (100 * v).toFixed(digits).replace('-', '−') + ' pp';
export const nfmt = (n) => String(Number(n.toFixed(3))).replace('-', '−');
export const point = (r, u, v) => [r.left + r.width * u, r.top + r.height * v];
export const at = (node, r, u, v) => node.moveTo(point(r, u, v));
const [body, foot] = area.rows([8, 1], 'normal');
const [left, right] = body.columns([1.67, 1], 'loose');
const [lh, plot] = left.rows([1, 9], 'normal');
const [rh, measure] = right.rows([1, 9], 'normal');
export { plot, measure, foot };

export function frame(s, title, source, comparison) {
  s.add(
    heading(title),
    place(label(source, { size: 37 }), lh, 'left'),
    place(label(comparison, { size: 37 }), rh, 'left'),
    line(lh.point('bottom left'), lh.point('bottom right'), { stroke: 'dim', width: 2 }),
    line(rh.point('bottom left'), rh.point('bottom right'), { stroke: 'dim', width: 2 }),
    line(foot.point('top left'), foot.point('top right'), { stroke: 'grid', width: 2 }),
  );
}

// Each measurement has a fixed origin and scale. The value sits above its track.
export function scales(s, rows, region = measure) {
  return region.rows(rows.length, 'normal').map((band, i) => {
    const { name, color = 'yellow', value = 0, max = 1 } = rows[i];
    const length = band.width * 0.94,
      x = band.left,
      y = point(band, 0, 0.8)[1];
    const level = s.value(value);
    const nameNode = label(name, { color, size: 34 })
      .moveTo(point(band, 0, 0.21))
      .alignTo(point(band, 0, 0.21), 'left');
    const track = rect(length, 21, { fill: 'surface', stroke: 'grid', width: 2, radius: 3 }).at(
      x + length / 2,
      y,
    );
    const fill = dynamic(() => {
      const w = length * Math.max(0, Math.min(1, level.value / max));
      return w > 0.01 ? rect(w, 20, { fill: color, stroke: null, radius: 3 }).at(x + w / 2, y) : [];
    });
    const spot = point(band, 0.94, 0.52);
    return {
      nodes: [nameNode, track, fill],
      level,
      observed(value) {
        const w = (length * value) / max;
        return {
          fill: rect(w, 20, { fill: color, stroke: null, radius: 3 }).at(x + w / 2, y),
          tick: rect(5, 40, { fill: 'dim', stroke: null }).at(x + w, y),
          name: note(pct(value) + ' observed').at(x + w, y + 47),
        };
      },
      read: (words) => mono(words, { size: 42, color }).moveTo(spot).alignTo(spot, 'right'),
    };
  });
}
export function caption(words, color = 'ink') {
  return place(label(words, { size: 34, color }), foot, 'left');
}
export function captions(s, c, first, changes) {
  const notes = [first, ...changes.map((e) => e[1])].map((words) => caption(words));
  s.add(notes[0]);
  changes.forEach(([cue, , after], i) =>
    c.swap(cue, notes[i], notes[i + 1], after ? { after: true, lead: 0 } : {}),
  );
}

export const STATE = {
  observed: { easy: [0.1, 0.9], split: 0 },
  strata: { easy: [0.1, 0.9], split: 1 },
  deployment: { easy: [0.7, 0.7], split: 1 },
  weighted: { easy: [0.5, 0.5], split: 1 },
};

// Each ticket has one mark. The pooled view sorts by outcome. The split view sorts by risk first.
export function ledger(s, state = STATE.strata) {
  const nodes = [],
    items = [];
  const bands = plot.rows(2, 'wide');
  const widths = state.easy.map((v) => s.value(v)),
    mass = ARM.map((_, i) => s.value(state.total?.[i] ?? 1)),
    split = s.value(state.split);
  bands.forEach((band, i) => {
    const [header, tiles] = band.rows([1, 3], 'normal');
    nodes.push(place(label(ARM[i], { color: COLORS[i], size: 38 }), header, 'left'));
    const w = tiles.width * 0.96,
      h = tiles.height * 0.94,
      x = tiles.left,
      y = tiles.top;
    const byRisk = cells[i].flat();
    const successes = tally(byRisk);
    const free = { resolved: [], unresolved: [] };
    byRisk.forEach((ticket, slot) => {
      const pooledSuccess = slot < successes;
      if (ticket.resolved !== pooledSuccess)
        free[pooledSuccess ? 'resolved' : 'unresolved'].push(slot);
    });
    // Retain tickets that already occupy a compatible pooled slot. Only opposite outcomes exchange places.
    const pooledSlot = new Map(
      byRisk.map((ticket, slot) => [
        ticket,
        ticket.resolved === slot < successes
          ? slot
          : free[ticket.resolved ? 'resolved' : 'unresolved'].shift(),
      ]),
    );
    cells[i].forEach((list, g) => {
      const chart = unitChart(
        [
          { count: tally(list), color: 'green' },
          { count: list.length - tally(list), color: 'red' },
        ],
        { rows: 10, shape: 'square', cell: 1, gap: 0 },
      );
      list.forEach((ticket, index) => {
        const pool = pooledSlot.get(ticket),
          node = chart.marks[index].clone();
        const position = (mark, easy, sep, total) => {
          const step = (w * (g === 0 ? easy : 1 - easy)) / (list.length / 10);
          const gx = (g === 0 ? 0 : w * easy) + (Math.floor(index / 10) + 0.5) * step;
          const px = ((Math.floor(pool / 10) + 0.5) * w) / 10;
          const tx = x + (px * (1 - sep) + gx * sep) * total;
          const ty = y + ((((pool % 10) + 0.5) * (1 - sep) + ((index % 10) + 0.5) * sep) * h) / 10;
          return mark
            .set('sx', Math.max(0.05, (((1 - sep) * w) / 10 + sep * step) * total - 3))
            .set('sy', h / 10 - 3)
            .at(tx, ty);
        };
        position(node, state.easy[i], state.split, state.total?.[i] ?? 1);
        nodes.push(node);
        const exchanges = pool !== byRisk.indexOf(ticket);
        if (exchanges) node.zIndex(1);
        items.push({ i, g, node, position, exchanges });
      });
    });
    nodes.push(
      dynamic(() => {
        if (split.value < 0.02 || mass[i].value < 0.01) return [];
        const edge = x + w * widths[i].value * mass[i].value;
        return line([edge, y - 6], [edge, y + h + 6], {
          stroke: 'ink',
          width: 3,
          opacity: split.value,
        });
      }),
    );
  });
  return {
    nodes,
    observedMarks(arm) {
      return items
        .filter((item) => item.i === arm)
        .map(({ node }) => node.clone().fill('dim').opacity(0.55).zIndex(-1));
    },
    concealOutcomes() {
      s.play(...items.map(({ node }) => to(node, (n) => n.fill('dim'))), { duration: 0.7 });
    },
    missing(i, g, mix) {
      const [, tiles] = bands[i].rows([1, 3], 'normal');
      const w = tiles.width * 0.96,
        h = tiles.height * 0.94,
        width = w * (g === 0 ? mix : 1 - mix);
      return rect(width - 8, h - 8, { fill: null, stroke: 'dim', width: 3, dash: [12, 10] }).at(
        tiles.left + (g === 0 ? 0 : w * mix) + width / 2,
        tiles.top + h / 2,
      );
    },
    move(
      {
        easy = widths.map((v) => v.value),
        sep = split.value,
        total = mass.map((v) => v.value),
        absent = [],
      },
      duration = 1.35,
    ) {
      const anims = [
        split.to(sep),
        ...widths.map((v, i) => v.to(easy[i])),
        ...mass.map((v, i) => v.to(total[i])),
      ];
      const exchanges = sep !== split.value ? items.filter((item) => item.exchanges) : [];
      const travelling = new Set(exchanges.map((item) => item.node));
      const compact = (node) => node.set('sx', 16).set('sy', 12);
      if (exchanges.length)
        s.play(...exchanges.map(({ node }) => to(node, compact)), { duration: duration * 0.17 });
      for (const { i, g, node, position } of items) {
        anims.push(
          to(node, (n) => {
            position(n, easy[i], sep, total[i]).opacity(absent.includes(i * 2 + g) ? 0 : 1);
            if (travelling.has(node)) compact(n);
          }),
        );
      }
      s.play(...anims, { duration: duration * (exchanges.length ? 0.65 : 1) });
      if (exchanges.length)
        s.play(
          ...exchanges.map(({ i, node, position }) =>
            to(node, (n) => position(n, easy[i], sep, total[i])),
          ),
          { duration: duration * 0.18 },
        );
    },
  };
}

// Causal graphs keep the action and its outcome at fixed ports.
export const PORT = { cause: [0.5, 0.17], a: [0.18, 0.55], y: [0.83, 0.55], below: [0.5, 0.87] };
export function vertex(name, key, color = 'ink', options = {}) {
  return at(
    namedBox(name, { width: plot.width * 0.285, height: 94, color, ...options }),
    plot,
    ...(Array.isArray(key) ? key : PORT[key]),
  );
}
export function wire(from, toNode, color = 'dim', options = {}) {
  return connector(from, toNode, {
    route: 'straight',
    tip: true,
    gap: 12,
    width: 4,
    color,
    ...options,
  });
}
export function signal(s, c, cue, paths) {
  c.on(cue, () =>
    s.play(...paths.map((edge) => edge.pulse({ color: 'yellow', width: 8, duration: 1.1 }))),
  );
}
export function sharedQueue(action) {
  const queue = vertex('Shared queue', [0.24, 0.87]);
  const other = vertex('Ticket 2 resolution', [0.8, 0.87], 'green', { width: plot.width * 0.37 });
  const into = wire(action, queue);
  const out = wire(queue, other);
  return {
    nodes: [queue, other, into, out],
    trace(s) {
      s.play(into.pulse({ color: 'yellow', width: 8, duration: 0.8 }));
      s.play(out.pulse({ color: 'yellow', width: 8, duration: 0.8 }));
    },
  };
}
export function fork() {
  const a = vertex('Workflow', 'a', 'cyan'),
    y = vertex('Resolution', 'y', 'green'),
    risk = vertex('Risk', 'cause');
  return { a, y, risk, ra: wire(risk, a), ry: wire(risk, y), ay: wire(a, y, 'cyan') };
}
export function ring(node) {
  const b = boxOf(node);
  return rect(b.width + 20, b.height + 20, {
    radius: 18,
    fill: null,
    stroke: 'yellow',
    width: 4,
  }).moveTo(b.point());
}

// The ticket record keeps its fields in place when the workflow or population changes.
export function record(s, fields) {
  return measure.rows(fields.length, 'normal').map((band, i) => {
    const [name, value, color = 'ink'] = fields[i];
    const [top, bottom] = band.rows([1, 1.6], 'tight');
    s.add(place(note(name), top, 'bottom left'));
    const make = (words) => place(mono(words, { size: 37, color }), bottom, 'top left');
    let current = value ? make(value) : null;
    if (current) s.add(current);
    return (c, cue, words, after = false) => {
      const opts = after ? { after: true, lead: 0 } : {};
      if (words === null) {
        c.hide(cue, current, opts);
        current = null;
        return;
      }
      const next = make(words);
      if (current) c.swap(cue, current, next, opts);
      else c.show(cue, next, opts);
      current = next;
    };
  });
}
export function reportRate(s, c, cue, bar, value, words, after = true, duration = 0.8) {
  const next = bar.read(words),
    options = after ? { after: true, lead: 0 } : {};
  if (bar.current) c.swap(cue, bar.current, next, options);
  else c.show(cue, next, options);
  bar.current = next;
  const change = () => s.play(bar.level.to(value, { duration }));
  if (after) c.after(cue, change);
  else c.on(cue, change);
}

export function pairedOutcomes(start, region = plot) {
  const total = start.total;
  const side = Math.min(region.width, region.height) * 0.081;
  const step = side * 1.16;
  const gridWidth = step * Math.sqrt(total);
  const left = region.cx - gridWidth / 2,
    top = region.cy - gridWidth / 2;
  const marks = [];
  let current = start;
  for (let i = 0; i < total; i++) {
    // Keep assistant success fixed. Transfer control success from an always-resolver to a never-resolver.
    const a = i < start.assistantSuccess;
    const control = (model) =>
      i < model.counts.always ||
      (i >= model.assistantSuccess && i < model.assistantSuccess + model.counts.harmed);
    const color = (v) => (v ? 'green' : 'red');
    const x = left + ((i % 10) + 0.5) * step,
      y = top + (Math.floor(i / 10) + 0.5) * step;
    const half = (offset, value) =>
      rect(side * 0.45, side, { fill: color(value), stroke: null, radius: 3 }).at(x + offset, y);
    marks.push({ a: half(-side * 0.25, a), c: half(side * 0.25, control(start)), control });
  }
  return {
    nodes: marks.flatMap((m) => [m.a, m.c]),
    change(s, model, onExchange = () => {}) {
      const first = s.time;
      const startH = current.counts.harmed;
      const steps = Math.abs(model.counts.harmed - startH);
      const direction = Math.sign(model.counts.harmed - startH);
      for (let step = 1; step <= steps; step++) {
        const next = responseTypePairing(startH + step * direction);
        const changed = marks.filter((mark) => mark.control(current) !== mark.control(next));
        assertEqual(changed.length, 2, 'One control success changes partners per exchange');
        s.at(first + (step * 1.3) / steps, () => {
          for (const mark of changed) mark.c.fill(mark.control(next) ? 'green' : 'red');
          onExchange(next);
        });
        current = next;
      }
    },
  };
}

// Preserve each ticket's slot in both copies so a missing mark always refers to the same ticket.
export function auditLedger(rows, region, { ids = false } = {}) {
  const [names, body] = region.rows([0.65, 4], 'normal');
  const columns = names.columns(2, 'normal');
  const headings = ['Full ledger', 'Audit log'].map((name, i) =>
    place(label(name, { size: 34 }), columns[i]),
  );
  const frames = [...headings],
    full = [],
    audit = [];
  body.rows(2, 'normal').forEach((band, i) => {
    const [name, field] = band.rows([1, 5], 'tight');
    frames.push(place(label(ARM[i], { size: 33, color: COLORS[i] }), name, 'left'));
    field.columns(2, 'normal').forEach((col, k) => {
      const nCol = rows[i].length > 4 ? 5 : 4,
        nRow = Math.ceil(rows[i].length / nCol);
      const positions = col.rows(nRow, 'tight').flatMap((r) => r.columns(nCol, 'tight'));
      rows[i].forEach((t, j) => {
        const cell = positions[j];
        const w = Math.min(cell.width * 0.91, ids ? 94 : 62),
          h = Math.min(cell.height * 0.9, ids ? 54 : 65);
        const slot = rect(w, h, { fill: 'surface', stroke: 'dim', width: 2, radius: 5 }).moveTo(
          cell.point(),
        );
        const tile = rect(w, h, { fill: t.resolved ? 'green' : 'red', stroke: null, radius: 5 });
        const content = group(tile, ...(ids ? [mono(t.id, { size: 29, color: 'bg' })] : [])).moveTo(
          cell.point(),
        );
        (k ? audit : full).push({ arm: i, ticket: t, node: content });
        frames.push(slot);
      });
    });
  });
  return { frames, full: full.map((t) => t.node), audit };
}
