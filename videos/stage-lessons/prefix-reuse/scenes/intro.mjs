import { assertEqual, boxOf, column, dynamic, group, linear, place, polygon, polyline, rect, row, seq, stateGrid } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { board, body, caption, fmt, foot, guide, ledger } from '../parts.mjs';

export default function intro(s, c) {
  const startOfShot = s.root.children.length;
  const second = ledger.rows[1];
  assertEqual(second.fresh, second.tail, 'The completed guide entry leaves only the new question to prefill.');
  board(s, c, 'Does the guide need a second pass?', 'Same model and adapter');
  const [page, , chat] = body.columns([1.04, 0.26, 1.36], 'tight');
  const [firstBubble, cacheBand, nextRequest] = chat.rows([1.24, 1.04, 1.64], 'tight');
  const [nextBubble, status] = nextRequest.rows([2.4, 0.8], 'tight');
  const { left, right, top, bottom } = page;
  const fold = 64;
  const paper = polygon([[left, top], [right - fold, top], [right, top + fold],
    [right, bottom], [left, bottom]], { fill: 'surface', stroke: 'blue', width: 4 });
  const backing = polygon([[left + 12, top + 12], [right - fold + 12, top + 12], [right + 12, top + fold + 12],
    [right + 12, bottom + 12], [left + 12, bottom + 12]], { fill: 'surface', stroke: 'dim', width: 2 });
  const cover = polygon([[left, top], [right - fold, top], [right, top + fold],
    [right, top + 103], [left, top + 103]], { fill: 'blue' });
  const crease = polyline([[right - fold, top], [right - fold, top + fold], [right, top + fold]],
    { stroke: 'bg', width: 4 });
  const inset = page.inset(35);
  const [header, number, , contents] = inset.rows([0.65, 1.05, 1.45, 1.55], 'tight');
  const excerpt = place(column([
    label('“You are the repository', { size: 44 }),
    label('maintenance assistant.”', { size: 44 }),
    note('+ repo notes, tools and examples', { size: 31 }),
  ], { align: 'left', gap: 'tight' }), contents, 'left');
  const pageFace = group(backing, paper, cover, crease,
    place(mono('Repository guide', { size: 38, color: 'bg' }), header, 'left'),
    place(label(fmt(guide) + ' tokens', { size: 82 }), number, 'left'), excerpt);
  const perSquare = 500;
  const positions = guide / perSquare;
  assertEqual(positions, 12, 'Twelve squares cover the full guide.');
  const states = {
    input: { color: 'cyan', fill: 0.6 },
    waiting: { color: 'dim', fill: 0.08 },
    stored: { color: 'blue', fill: 0.78 },
    read: { color: 'green', fill: 0.66 },
  };
  const strip = (x, initial) => stateGrid({
    rows: 1, columns: positions, cell: 38, gap: 9, states, initial,
  }).moveTo([x, cacheBand.cy + 20]);
  const input = strip(page.cx, 'input');
  const cache = strip(chat.cx, 'waiting');
  const above = (words, grid, color) => {
    const bounds = boxOf(grid);
    return note(words, { color, size: 36 }).moveTo([bounds.cx, bounds.top - 34]);
  };
  const scale = above(perSquare + ' guide tokens per square', input, 'cyan');
  const worker = above('Worker cache', cache, 'blue');
  const kv = above('Worker cache · keys and values', cache, 'blue');

  const messages = [firstBubble, nextBubble].map((bubble, i) => {
    const tint = i ? 'pink' : 'dim';
    const { left: x, right: end, top: y, bottom: base } = bubble;
    const frame = polygon([[x, y], [end, y], [end, base - 16], [x + 55, base - 16],
      [x + 28, base], [x + 28, base - 16], [x, base - 16]],
    { fill: 'surface', stroke: tint, width: 4 });
    const [meta, excerpt] = bubble.inset(24).rows([0.8, 1.25], 'tight');
    const tag = place(i ? note('Next question · excerpt', { size: 32, color: tint })
      : row([mono('× FAIL', { size: 32, color: 'red' }), mono('test_checkout', { size: 32 })],
        { gap: 'normal' }), meta, 'left');
    const words = place(label(i ? 'Which tests cover login?' : 'Why did this test fail?', { size: 54 }), excerpt, 'left');
    return { meta, face: group(frame, tag, words) };
  });
  const [old, incoming] = messages;
  const fullLength = place(note(second.tail + ' tokens in full', { size: 32, color: 'pink' }), incoming.meta, 'right');
  const ready = place(note('Guide cached', { size: 32, color: 'blue' }), old.meta, 'right');
  const fresh = caption(second.fresh + ' fresh input tokens', status,
    { align: 'right', size: 38, color: 'cyan' });
  const reused = caption(fmt(second.reused) + ' reused', status,
    { align: 'left', size: 38, color: 'green' });
  const ask = caption('How many input tokens still need prefill?', foot, { color: 'yellow', size: 46 });
  const [outputName, outputTrack, result] = foot.columns([1.05, 1.5, 1.35], 'wide');
  const outLabel = caption('Login answer', outputName, { align: 'right', size: 39 });
  const out = place(stateGrid({
    rows: 1, columns: second.output / 8, cell: 47, gap: 9, initial: 'waiting',
    states: { waiting: { color: 'dim', fill: 0.07 }, emitted: { color: 'cyan', fill: 0.55 } },
  }), outputTrack);
  const outScale = place(note('8 output tokens per square', { size: 28 }), outputTrack, 'bottom');
  const generated = place(mono(second.output + ' generated', { size: 40, color: 'cyan' }), result, 'left');

  const first = 0.52;
  const count = s.value(first);
  const starts = input.cells.map(cell => boxOf(cell).point('center'));
  const ends = cache.cells.map(cell => boxOf(cell).point('center'));
  const packetCount = mono(String(perSquare), { size: 29, color: 'bg' });
  const moving = dynamic(() => {
    const i = Math.floor(count.value);
    if (i >= positions) return [];
    const p = count.value - i;
    const x = starts[i][0] + p * (ends[i][0] - starts[i][0]);
    const arc = Math.sin(Math.PI * p);
    const y = starts[i][1] + 55 * arc;
    const packet = rect(38 + 64 * arc, 38 + 12 * arc, {
      fill: 'cyan', stroke: 'ink', width: 3,
    }).moveTo([x, y]);
    const digitOpacity = Math.max(0, Math.min(1, (arc - 0.4) * 4));
    return [packet, packetCount.moveTo([x, y]).opacity(digitOpacity)];
  });
  s.add(pageFace, old.face, input, scale, cache, worker, moving);
  // The brand cuts directly to a packet in flight. Hold the opening objects at full opacity.
  for (const node of s.root.children.slice(startOfShot)) node.track('opacity').step(0, 1);
  const fillTime = c.cue('entry-ready').start;
  s.play(count.to(positions), { duration: fillTime, ease: linear });
  for (let i = 0; i < positions; i++) {
    const arrival = fillTime * (i + 1 - first) / (positions - first);
    s.at(arrival, () => s.play(cache.change(i, 'stored'), { duration: 0.12 }));
  }
  c.swap('store-guide', worker, kv);
  c.show('entry-ready', ready, { after: true });
  c.show('second-request', incoming.face);
  c.show('new-tail', fullLength, { after: true, lead: 0 });
  c.show('predict-prefill', ask);
  c.hide('fresh-tail', ask, { after: true, lead: 0 });
  c.show('fresh-tail', fresh, { after: true, lead: 0 });
  c.on('read-guide', () => s.play(cache.change(() => true, 'read'), { duration: 0.55 }));
  c.show('read-guide', reused, { after: true, lead: 0 });
  c.show('generate-answer', [outLabel, out, outScale]);
  c.on('generate-answer', () => s.play(seq(...out.cells.map((_, i) => out.change(i, 'emitted'))),
    { duration: 1.55 }), 0.32);
  c.show('output-count', generated, { after: true, lead: 0 });
}
