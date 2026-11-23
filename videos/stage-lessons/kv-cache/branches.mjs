import { Node, rect, to } from 'vizmatic/stage';
import { CONVERSATION, GIB, MIB } from '../../films/kv-cache/model.mjs';
import { blockSize, entries, ForkCache } from './fork-cache.mjs';
import { left, picture, words } from './picture.mjs';

const prefix = ['The', 'fox', 'ran'];
const slotX = slot => -380 + slot * 340;
const blockY = id => -118 + id * 180;
const columnWidth = 292;

function contents(entry) {
  const color = { home: 'blue', away: 'orange', Rain: 'green' }[entry.token] ?? 'teal';
  return new Node().add(
    rect(columnWidth, 132, { radius: 10, fill: 'surface', stroke: color, width: 3 }),
    words(entry.token, 62).moveTo([0, -23]),
    words('K/V ' + entry.tag, 33, color, 'mono').moveTo([0, 36]),
  );
}

// Keep each physical address fixed. Change only the table entry, owner or slot whose state changed.
function blockDisplay(stage, p) {
  let drawn = new Map();
  return (cache, { wants = {}, reads = {}, copying, from, released, finished = false } = {}) => {
    const next = new Map(), entering = [], copies = [];
    function item(key, value, make) {
      const previous = drawn.get(key);
      if (previous?.value === value) {
        next.set(key, previous);
      } else {
        const node = make();
        next.set(key, { value, node });
        entering.push(node);
      }
    }
    for (const [branch, ids] of Object.entries(cache.tables)) {
      const table = branch + ' table [' + ids.join(', ') + ']';
      const x = branch === 'B' ? 45 : -845;
      const color = { A: 'blue', B: 'orange', C: 'green' }[branch];
      item(branch, table, () => left(words(table, 50, color, 'mono'), x, -320));
      const intent = branch === 'A' && finished ? 'finished' : wants[branch];
      if (intent) item(branch + '-intent', intent, () =>
        left(words(intent, 42, color), x + 456, -320));
      const read = reads[branch];
      if (read) item(branch + '-read', read.tag, () =>
        left(words('Read back  ' + read.token + ' (' + read.tag + ')', 39, color, 'mono'), x, -236));
    }
    for (const [id, slots] of cache.blocks.entries()) {
      const y = blockY(id);
      item('id' + id, id, () => left(words('Block ' + id, 58), -845, y - 24));
      const owners = cache.owners(id);
      let label = 'owners  ' + owners.join(' + ');
      if (owners.length === 1) label = 'owner  ' + owners[0];
      if (!owners.length) label = id === released ? 'free' : 'copy for A';
      item('owners' + id, label, () => left(words(label, 36, 'dim', 'mono'), -845, y + 43));
      for (let i = 0; i < blockSize; i++) {
        const x = slotX(i);
        item('slot/' + id + '/' + i, 1, () =>
          rect(columnWidth, 132, { radius: 10, stroke: 'dim', width: 2 }).dash([12, 10]).at(x, y));
        const entry = slots[i];
        if (!entry || id === released) continue;
        item('pair/' + id + '/' + i, entry.tag, () => {
          const node = contents(entry).at(x, id === copying ? blockY(from) : y).zIndex(2);
          if (id === copying) copies.push({ node, x, y });
          return node;
        });
      }
    }
    const leaving = [...drawn].filter(([key, old]) => next.get(key) !== old).map(([, old]) => old.node);
    if (leaving.length) p.hide(leaving, 0.1);
    if (entering.length) p.show(entering, 0.24);
    if (copies.length) stage.play(
      ...copies.map(({ node, x, y }) => to(node, moved => moved.at(x, y))),
      { duration: 0.85 },
    );
    drawn = next;
  };
}

function mark(block, slot) {
  return rect(columnWidth + 16, 148, { radius: 13, stroke: 'yellow', width: 5 })
    .at(slotX(slot), blockY(block)).zIndex(4);
}

function beamBudget(p) {
  const { clock, show, clear, caption } = p;
  const branches = 4;
  const x = -430, width = 1210 / branches;
  function segments(count, y, color) {
    return Array.from({ length: count }, (_, i) =>
      rect(width - 5, 110, { radius: 8, fill: color, stroke: null }).at(x + width * (i + 0.5), y));
  }
  clock.on('beam', () => {
    clear();
    show([
      left(words('4 candidates   /   4,096 prompt tokens', 57), -845, -320),
      left(words('One prompt', 52), -845, -135),
    ]);
  });
  clock.after('payload', () => {
    show(segments(1, -135, 'teal'));
    caption(CONVERSATION / MIB + ' MiB of K/V pairs per prompt.');
  });
  clock.after('private', () => {
    show([left(words('Private copies', 52), -845, 42), ...segments(branches, 42, 'blue')]);
    caption(branches + ' × ' + CONVERSATION / MIB + ' MiB = ' + branches * CONVERSATION / GIB + ' GiB.');
  });
  clock.on('shared', () => {
    show([left(words('Shared copy', 52), -845, 219), ...segments(1, 219, 'teal')]);
    caption('Four readers share the same ' + CONVERSATION / MIB + ' MiB of prompt state.');
  });
}

export function buildShare(stage, narration) {
  const p = picture(stage, narration, 'share');
  const { clock, show, hide, clear, caption, finish } = p;
  let cache = new ForkCache(prefix), display = blockDisplay(stage, p);
  const wants = {}, reads = {};
  clock.at(0.03, () => display(cache));
  clock.on('fork', () => {
    cache.fork();
    display(cache);
    caption('Two branch tables point to one physical block.');
  });
  beamBudget(p);

  const target = mark(0, 3);
  clock.on('slot', () => {
    clear();
    display = blockDisplay(stage, p);
    display(cache);
    show(target);
  });
  for (const [branch, cue, word] of [['A', 'want-a', 'home'], ['B', 'want-b', 'away']]) {
    clock.on(cue, () => {
      wants[branch] = 'wants ' + word + ' (' + entries[word].tag + ')';
      display(cache, { wants });
    });
  }
  clock.after('unsafe-a', () => {
    cache.append('A', 'home', { unsafe: true });
    display(cache, { wants });
  });
  clock.after('unsafe-b', () => {
    cache.append('B', 'away', { unsafe: true });
    display(cache, { wants });
  });
  clock.on('ask-read', () => caption('Which pair will A read from its fourth slot?', 'yellow'));
  clock.after('bad-read', () => {
    const pair = cache.read('A', 3);
    display(cache, { wants, reads: { A: pair } });
    caption('A reads ' + pair.token + ' (' + pair.tag + '). A wrote home (90).', 'red');
  });
  clock.on('rewind', () => {
    cache = new ForkCache(prefix);
    cache.fork();
    display(cache, { wants });
    hide(target);
    caption('Back at the fork. The fourth slot is empty.');
  });
  let copy;
  clock.on('copy', () => {
    copy = cache.copyTail('A');
    display(cache, { wants, copying: copy, from: 0 });
    caption('The copy holds the same three pairs. Both fourth slots are empty.');
  });
  clock.after('remap', () => {
    cache.moveTail('A', copy);
    display(cache, { wants });
    caption('A now writes through table [1]. B still uses [0].');
  });
  clock.on('safe-a', () => {
    cache.append('A', 'home');
    display(cache, { wants });
  });
  clock.on('safe-b', () => {
    cache.append('B', 'away');
    display(cache, { wants });
  });
  const aRead = mark(1, 3), bRead = mark(0, 3);
  clock.after('read-a', () => {
    reads.A = cache.read('A', 3);
    display(cache, { wants, reads });
    show(aRead);
    caption('A reads ' + reads.A.token + ' from block 1, slot 3.');
  });
  clock.after('read-b', () => {
    reads.B = cache.read('B', 3);
    display(cache, { wants, reads });
    show(bRead);
    caption('B reads ' + reads.B.token + ' from block 0, slot 3.');
  });
  clock.on('name', () => caption('Copy on write'));
  clock.after('total-partial', () => caption('Both histories fit in ' + cache.blocks.length + ' physical blocks.'));
  finish();
}

export function buildClose(stage, narration) {
  const p = picture(stage, narration, 'close');
  const { clock, show, hide, caption, finish } = p;
  const display = blockDisplay(stage, p), cache = new ForkCache(prefix);
  const wants = {}, lastSlot = mark(0, 3);
  clock.at(0.03, () => {
    display(cache);
    show(lastSlot);
  });
  clock.after('straight', () => {
    hide(lastSlot);
    cache.append('A', 'straight');
    display(cache);
    caption('Block 0 is full.');
  });
  clock.on('fork', () => {
    cache.fork();
    display(cache);
  });
  clock.on('wants-a', () => {
    wants.A = 'wants home';
    display(cache, { wants });
  });
  clock.on('wants-b', () => {
    wants.B = 'wants away';
    display(cache, { wants });
  });
  clock.on('ask', () => caption('After both appends, how many physical blocks?', 'yellow'));
  clock.after('tail-a', () => {
    cache.append('A', 'home');
    display(cache, { wants });
    caption('A’s fifth pair goes into slot 0 of its new block.');
  });
  clock.after('tail-b', () => {
    cache.append('B', 'away');
    display(cache, { wants });
  });
  const shared = rect(3 * 340 + columnWidth + 22, 154, {
    radius: 13, stroke: 'yellow', width: 5,
  }).at((slotX(0) + slotX(3)) / 2, blockY(0)).zIndex(4);
  clock.on('back', () => show(shared));
  clock.after('total', () => caption('1 shared block + 2 private tails = ' + cache.blocks.length + ' physical blocks.'));
  clock.on('finish', () => {
    hide(shared);
    display(cache, { finished: true });
    caption('A has finished. B is still decoding.');
  });
  clock.on('done', () => caption('A has no pending reads. Finished prefixes are released.'));
  clock.on('ask-free', () => caption('When A releases [0, 1], which block can a new request take?', 'yellow'));
  clock.after('release', () => {
    cache.retire('A');
    display(cache, { released: 1 });
    caption('Block 1 is free. B still owns blocks 0 and 2.');
  });
  clock.after('reuse', () => {
    cache.admit('C', 1, 'Rain');
    display(cache);
    caption('C starts in block 1. B can still read its own five pairs.');
  });
  finish();
}
