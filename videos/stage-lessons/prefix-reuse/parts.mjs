import {
  assertEqual,
  column,
  indicate,
  line,
  place,
  rect,
  row,
  segmentedBar,
  tokens,
} from 'vizmatic/stage';
import { area, heading, label, namedBox, note } from '../kit-narrated.mjs';
import { sampleModel } from '../../films/prefix-reuse/model.mjs';

export const ledger = sampleModel('savings', { beat: 2, beatP: 0.9 });
export const guide = ledger.rows[1].reused;
export const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
assertEqual(ledger.fresh + ledger.reused, ledger.total, 'All input tokens belong to the ledger.');

// Blue identifies stored guide state. Cyan means fresh work. Green means reusable state.
// Pink identifies variable input. A dashed pink segment marks queue time. Yellow directs attention and red marks a failure.
export const color = {
  guide: 'blue',
  fresh: 'cyan',
  read: 'green',
  variable: 'pink',
  focus: 'yellow',
  miss: 'red',
};
const [header, body, foot] = area.rows([1, 7, 1.7], 'normal');
export { body, foot };

export function caption(words, region, options = {}) {
  return place(label(words, { size: 40, ...options }), region, options.align ?? 'center');
}

export function board(s, c, title, lens) {
  const [left, right] = header.columns([1, 1], 'normal');
  const paper = row(
    [
      column(
        [1, 0.76, 0.9].map((fraction) => rect(78 * fraction, 7, { fill: color.guide })),
        { gap: 6, align: 'left' },
      ),
      label('Repository guide', { color: 'blue', size: 36 }),
    ],
    { gap: 'normal' },
  );
  place(paper, left, 'left');
  const rule = line(foot.point('top left'), foot.point('top right'), { stroke: 'dim', width: 2 });
  s.add(heading(title), place(note(lens, { size: 34 }), right, 'right'), rule);
  if (c.id === 'intro') s.add(paper);
  else c.take(paper);
  if (c.id !== 'fresh-budget') c.keep(paper);
}

// Each line is a different reading of the same instrument. Lay them all out before scheduling changes.
export function readings(s, c, initial, steps, region = foot) {
  const entries = [[null, initial, 'dim'], ...steps].map(
    ([cue, words, tint = 'yellow', clearOn]) => ({
      clearOn,
      cue,
      node: caption(words, region, { color: tint, size: 42 }),
    }),
  );
  s.add(entries[0].node);
  entries.slice(1).forEach(({ cue, node }, i) => {
    if (entries[i].clearOn) {
      c.hide(entries[i].clearOn, entries[i].node, { fade: 0.12 });
      c.show(cue, node, { after: true, fade: 0.16 });
    } else {
      c.swap(cue, entries[i].node, node, { after: true, fade: 0.16 });
    }
  });
}

export function gauge(region, name, parts, max, options = {}) {
  const [key, track] = region.columns([1, 4.5], 'wide');
  const legend = place(label(name, { size: options.size ?? 38 }), key, 'left');
  const gauge = segmentedBar(
    parts.map(([name, value, color]) => ({ name, value, color })),
    {
      width: track.width - 12,
      height: options.height ?? 64,
      max,
      labels: false,
      size: 34,
    },
  );
  place(gauge, track);
  return { legend, bar: gauge, nodes: [legend, gauge] };
}

export const inputRates = { ordinary: 1, write: 1.25, read: 0.1 };
export const longWriteRate = 2;

export function priceStrip(values) {
  return place(tokens(['Ordinary', 'Write', 'Read'], {
    size: 40, minWidth: 250, colors: ['cyan', 'blue', 'green'],
    rows: { rate: values }, rowSize: 34,
  }), body.rows(3, 'wide')[0]);
}

export function requestRows(s, region, { showInput = false } = {}) {
  const bands = region.rows(ledger.rows.length, 'normal');
  return ledger.rows.map(({ id, tail, output }, i) => {
    const [barBand, detail] = bands[i].rows([2, 1], 'tight');
    const g = gauge(
      barBand,
      id,
      [
        ['guide', 0, 'blue'],
        ['reuse', 0, 'green'],
        ['pending', showInput ? guide : 0, 'dim'],
        ['computed', 0, 'cyan'],
        ['question', showInput ? tail : 0, 'pink'],
      ],
      guide + Math.max(...ledger.rows.map((r) => r.tail)),
    );
    const [left, right] = detail.columns([3, 2]);
    const tailNote = place(
      note('Question · ' + fmt(tail) + ' tokens', { color: 'pink' }),
      right,
      'right',
    );
    const processed = place(
      note('Prefill · ' + fmt(guide) + ' guide tokens', { color: 'blue' }),
      left,
      'right',
    );
    const reused = place(
      note('Read R1’s state · ' + fmt(guide) + ' tokens', { color: 'green' }),
      left,
      'right',
    );
    s.add(g.nodes, tailNote);
    return { ...g, processed, reused, tail, output };
  });
}
export function guideVersion(cell, version) {
  return place(namedBox('Guide G · v' + version, {
    width: 275, height: 72, color: version === 7 ? 'blue' : 'pink',
  }), cell);
}

export function tenantLanes() {
  const [headers, a, b, record] = body.rows([0.65, 1.5, 1.5, 1], 'tight');
  const columns = (band) => band.columns([1.08, 1, 1.1, 1.15], 'normal');
  const lanes = [a, b].map((band, i) => {
    const id = i ? 'B' : 'A';
    const cells = columns(band);
    const auth = caption('Session ' + id, cells[1]);
    const scope = place(
      namedBox('tenant ' + id, { width: 280, height: 72, color: 'blue' }),
      cells[2],
    );
    return { cells, auth, scope };
  });
  return { headers: columns(headers), lanes, record };
}
export const pointAt = (target) => indicate(target, { color: 'yellow', scale: 1, duration: 0.65 });
