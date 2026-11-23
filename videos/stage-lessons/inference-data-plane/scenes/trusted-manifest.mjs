// Scene `trusted-manifest`: match interpretation and authority.
//
// The picture: the board, with the state at the prefill worker and a reservation at the decode
// worker. The received attempt changes while the trusted reservation stays fixed.
// Then block 31 crosses to another address and keeps its number. Then the payload takes the rails
// while small descriptors take a channel of their own. Last, two writes overlap in the pool.
import {
  beside,
  between,
  boxOf,
  clamp,
  column,
  dot,
  dynamic,
  fitted,
  grid,
  indicate,
  lerp,
  line,
  linear,
  pictogram,
  place,
  row,
  smoothstep,
  steps,
  text,
  to,
} from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { CELL, COLOR, FIXTURE, FOOT, RESERVED_DASH, block, handoff, slot } from '../parts.mjs';

/** The block of the narration: logical block 31, at address 904 at the source and 118 at the destination. */
const HERO = { logical: 31, source: 904, dest: 118, slot: 13 };
// A delayed manifest and the current manifest describe the same article request.
const FIELDS = [
  ['Request', 'req-8k-017'],
  ['Attempt', '4'],
  ['Tenant', 'tenant-73'],
  ['Model / tokenizer / adapter', 'm42 / t17 / none'],
  ['Token digest / positions', 'tok-bf81 / 0–8191'],
  ['KV format / block size', 'BF16 / hnd-v3 / 16 tokens'],
  ['Required shards', 'ranks 0, 1 / blocks 0–511'],
  ['Reservation', 'd3-lease-772'],
];

export default function trustedManifest(s, c) {
  const { blocks } = FIXTURE;
  // Block 31 and the block of its slot change places, so that every block still has a slot.
  const slotOf = (index) =>
    index === HERO.logical ? HERO.slot : index === HERO.slot ? HERO.logical : index;
  const board = handoff(s, { made: blocks, reserved: blocks, hide: [HERO.logical], slotOf });
  const mid = between(board.source.panel, board.dest.panel);
  const panel = { source: boxOf(board.source.panel), dest: boxOf(board.dest.panel) };

  // The hero block: this scene draws it, with its logical number.
  const fly = s.value(0), // 0 to 1: block 31 is on its way to its slot
    lit = s.value(0), // 0 to 1: the voice points at block 31
    named = s.value(0); // 0 to 1: block 31 shows its number
  const hero = dynamic(() => {
    const a = board.source.p(HERO.logical),
      b = board.dest.p(HERO.slot),
      t = smoothstep(fly.value);
    const at = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    return [
      block(at, COLOR.state),
      lit.value > 0 && slot(at, COLOR.mark, { size: CELL + 10, opacity: lit.value }),
      named.value > 0 &&
        text(String(HERO.logical), { font: 'mono', size: 30, color: 'bg' })
          .at(at[0], at[1])
          .opacity(named.value),
    ].filter(Boolean);
  });

  // The reservation comes from the receiver. Only the attempt differs in the delayed message.
  const [tableArea, decision] = area.rows([7, 1], 'normal');
  const [head, ...lines] = tableArea.rows(FIELDS.length + 1, 'tight');
  const cells = (region) => region.columns([1.18, 1.15, 1.15], 'normal');
  const heads = ['Field', 'Received manifest', 'Trusted reservation'].map((name, col) =>
    place(label(name, { color: col === 2 ? COLOR.control : 'ink' }), cells(head)[col], 'left'),
  );
  const delayed = s.value(1);
  const compared = s.value(0);
  function comparisonRow(i, region, size) {
    const [field, value] = FIELDS[i];
    const [name, incoming, expected] = cells(region);
    return [
      place(note(field, { size }), name, 'left'),
      dynamic(() =>
        place(
          mono(i === 1 && delayed.value ? '3' : value, {
            size,
            color: i === 1 && compared.value ? (delayed.value ? COLOR.fail : COLOR.valid) : 'ink',
          }),
          incoming,
          'left',
        ),
      ),
      place(mono(value, { size, color: COLOR.control }), expected, 'left'),
    ];
  }
  const focusLines = tableArea.rows([1, 2, 2, 2], 'normal').slice(1);
  const focus = [0, 7, 1].map((field, i) => comparisonRow(field, focusLines[i], 54));
  const table = FIELDS.map((_, i) => comparisonRow(i, lines[i], 33));
  const status = (words, color) => place(label(words, { color }), decision, 'left');
  const ask = status('Which field would stop this transfer?', COLOR.mark);
  const stale = status('Attempt 3 is stale. Leave the destination untouched.', COLOR.fail);
  const current = status('Attempt 4 matches. The transfer may begin.', COLOR.valid);
  s.add(heading(c.title), heads, focus);
  c.show('manifest-ask', ask);
  c.after('manifest-stale', () => compared.set(1));
  c.swap('manifest-stale', ask, stale, { after: true });
  c.after('manifest-current', () => delayed.set(0));
  c.hide('manifest-current', stale, { after: true });
  c.swap('field-scope', focus, [table.slice(0, 4), table[7]]);
  c.show('field-tokens', table[4]);
  c.show('field-coverage', table.slice(5, 7));
  c.show('manifest-clear', current, { after: true });

  const sender = beside(
    chip('req-8k-017  ·  attempt 4', { color: COLOR.state }),
    board.source.panel,
    'under',
    'normal',
    'left',
  );
  const lease = place(chip('d3-lease-772', { color: COLOR.control }), FOOT, 'top right');
  const boardView = [
    board.names.source,
    board.names.dest,
    board.source.panel,
    board.dest.panel,
    board.cells,
    board.state,
    hero,
    sender,
    lease,
  ];

  // ---- Beat 1: block 31 goes to another address, and keeps its meaning.
  const entry = [
    ['logical block', String(HERO.logical), COLOR.mark],
    ['source address', String(HERO.source), COLOR.state],
    ['destination address', String(HERO.dest), COLOR.control],
  ].map(([words, value, color]) => ({
    name: note(words),
    value: mono(value, { color, size: 52 }),
  }));
  const [entryBand, kitBand] = FOOT.rows([5, 4], 'normal');
  place(
    grid([...entry.map((cell) => cell.name), ...entry.map((cell) => cell.value)], {
      columns: 3,
      gap: ['loose', 'tight'],
      align: 'center',
    }),
    entryBand,
    'top',
  );
  const convert = place(chip('conversion: its own budget, its own check'), mid);
  const kit = [
    chip('KV state', { color: COLOR.valid, stroke: COLOR.valid }),
    chip('last token or hidden state', { dash: RESERVED_DASH }),
    chip('sampling state', { dash: RESERVED_DASH }),
    chip('first-token owner', { dash: RESERVED_DASH }),
  ];
  const kitName = note('to resume, decode needs');
  place(row([kitName, ...kit], { gap: 'normal', align: 'center' }), kitBand, 'top');

  c.swap('manifest-logical', [heads, table, current], [...boardView, entry[0].name, entry[0].value], {
    fade: 0.18,
  });
  c.on('manifest-logical', () =>
    s.play(lit.to(1, { duration: 0.3 }), named.to(1, { duration: 0.3 })),
  );
  c.show('manifest-source', [entry[1].name, entry[1].value]);
  c.show('manifest-dest', [entry[2].name, entry[2].value]);
  c.on('manifest-dest', () => s.play(fly.to(1, { duration: 1.6 })));
  c.on('manifest-differ', () => s.play(indicate(entry[1].value), indicate(entry[2].value)));
  c.show('manifest-convert', convert);
  c.show('manifest-resume', [kitName, kit[0], kit[1]]);
  c.show('manifest-sampling', kit[2]);
  c.show('manifest-owner', kit[3]);

  // ---- Beat 2: the payload takes the rails, and the descriptors take a channel of their own.
  const channelY = board.dest.p(56)[1];
  const channel = line([panel.source.right, channelY], [panel.dest.left, channelY], {
    stroke: COLOR.control,
    width: 2,
    dash: [4, 8],
  });
  const lock = pictogram('lock', { size: 44, color: COLOR.control, accent: COLOR.control });
  const channelName = note('descriptors, metadata', { color: COLOR.control });
  beside(
    row([lock, channelName], { gap: 'tight', align: 'center' }),
    [mid.cx, channelY],
    'above',
    'normal',
  );
  const flow = s.value(0); // 0 to 1: descriptors move on their channel
  const descriptors = dynamic((time) =>
    flow.value > 0
      ? [0, 1, 2].map((index) => {
          const u = (time * 0.35 + index / 3) % 1;
          return dot(6, COLOR.control)
            .at(lerp(panel.source.right, panel.dest.left, u), channelY)
            .opacity(flow.value);
        })
      : null,
  );
  const service = ['authorization', 'placement', 'retry', 'stream ownership'].map((words) =>
    chip(words, { color: COLOR.control, stroke: COLOR.control }),
  );
  const serviceName = note('the service owns');
  const rdma = chip('RDMA moves bytes', { color: COLOR.state, stroke: COLOR.state });
  const memoryProtection = note('memory protection: domains, scoped keys');
  const controls = ['workload identity', 'encryption', 'tenant policy', 'end-to-end integrity'].map(
    (words) => chip(words, { color: COLOR.mark, stroke: COLOR.mark, dash: RESERVED_DASH }),
  );
  const controlsName = note('application guarantees require configured controls');
  const log = mono('log  ·  req-8k-017  ·  transfer submitted', { size: 30, color: 'dim' });
  place(
    column(
      [
        row([serviceName, ...service], { gap: 'normal', align: 'center' }),
        row([rdma, memoryProtection], { gap: 'normal', align: 'center' }),
        row([controlsName, ...controls], { gap: 'tight', align: 'center' }),
        log,
      ],
      {
        gap: 'normal',
      },
    ),
    FOOT,
    'top left',
  );

  c.swap(
    'manifest-buffers',
    [entry.map((cell) => [cell.name, cell.value]), convert, kitName, kit],
    board.rails,
  );
  const carry = c.cue('manifest-logs');
  c.on('manifest-buffers', () =>
    s.play(
      lit.to(0, { duration: 0.3 }),
      named.to(0, { duration: 0.3 }),
      board.sent.to(blocks, {
        duration: carry.start - c.cue('manifest-buffers').start,
        ease: linear,
      }),
    ),
  );
  c.show('manifest-descriptors', [channel, channelName, descriptors]);
  c.on('manifest-descriptors', () => s.play(flow.to(1, { duration: 0.4 })));
  c.show('manifest-service', [serviceName, service], { stagger: true });
  c.show('manifest-protect', lock);
  // A registered region: the border of each pool takes the color of the voice.
  const fence = (color, dash) =>
    [board.source.panel, board.dest.panel].map((node) =>
      to(node, (n) => n.stroke(color, 3).dash(dash), { duration: 0.5 }),
    );
  c.on('manifest-isolate', () => s.play(...fence(COLOR.mark, [14, 10])));
  c.show('manifest-rdma', [rdma, memoryProtection]);
  c.show('manifest-controls', [controlsName, controls], { stagger: true });
  c.show('manifest-logs', log);

  // ---- Beat 3: two writes that nobody ordered, in one region. Then the events of a cancel.
  const first = s.value(0), // the cells that the first write has filled, of rows 0 to 3
    second = s.value(0), // the cells that the second write has filled, of rows 2 to 5
    corrupt = s.value(0), // the evaluated consequence of the overlapping writes
    writer = s.value(0), // 0 to 1: one writer is still active
    reader = s.value(0), // 0 to 1: GPU-reader quiescence is not yet confirmed
    seen = s.value(0); // 0 to 1: the voice points at the cell of that writer
  const SPAN = 32,
    LATE = 44;
  const writes = dynamic((time) => {
    const nodes = [];
    for (let index = 0; index < blocks; index++) {
      const a = index < SPAN ? clamp(first.value - index, 0, 1) : 0,
        b = index >= blocks - SPAN ? clamp(second.value - (index - (blocks - SPAN)), 0, 1) : 0;
      // A cell that both writes fill has bytes of two operations: it is corrupt.
      if (a > 0 && b > 0 && corrupt.value > 0.5) {
        const [x, y] = board.dest.p(index);
        nodes.push(
          block([x, y], COLOR.fail, { opacity: Math.max(a, b) }),
          line([x - 11, y - 11], [x + 11, y + 11], { stroke: 'bg', width: 5 }),
          line([x - 11, y + 11], [x + 11, y - 11], { stroke: 'bg', width: 5 }),
        );
      } else if (a > 0) nodes.push(block(board.dest.p(index), COLOR.state, { opacity: a }));
      else if (b > 0) nodes.push(block(board.dest.p(index), COLOR.other, { opacity: b }));
    }
    if (writer.value > 0) {
      // The late writer: it still writes its cell.
      const beat = 0.5 + 0.5 * Math.sin(time * 9);
      nodes.push(
        block(board.dest.p(LATE), COLOR.fail, { opacity: writer.value * (0.35 + 0.65 * beat) }),
      );
      if (seen.value > 0)
        nodes.push(slot(board.dest.p(LATE), COLOR.mark, { size: CELL + 10, opacity: seen.value }));
    }
    if (reader.value > 0)
      nodes.push(
        slot(board.dest.p(LATE), COLOR.mark, {
          size: CELL + 10,
          dash: RESERVED_DASH,
          opacity: reader.value,
        }),
      );
    return nodes;
  });
  const rowY = (index) => board.dest.p(index * 8)[1];
  const writeNames = [
    beside(
      note('write 1', { color: COLOR.state }),
      [panel.dest.left, (rowY(0) + rowY(1)) / 2],
      'left',
      'normal',
    ),
    beside(
      note('write 2', { color: COLOR.other }),
      [panel.dest.left, (rowY(4) + rowY(5)) / 2],
      'left',
      'normal',
    ),
    beside(
      note('both', { color: COLOR.fail }),
      [panel.dest.left, (rowY(2) + rowY(3)) / 2],
      'left',
      'normal',
    ),
  ];
  const events = fitted(FOOT.width * 0.8, (width) =>
    steps(['cancel requested', 'transport stopped', 'readers quiet', 'buffer reusable'], {
      width,
      height: 84,
      size: 34,
      color: COLOR.mark,
    }),
  );
  const writerLegend = note('Active writer', { color: COLOR.fail });
  const readerLegend = note('GPU reader still holds the buffer', { color: COLOR.mark });
  const accesses = row([writerLegend, readerLegend], { gap: 'wide' });
  place(column([events, accesses], { gap: 'wide' }), FOOT, 'top left');
  const replay = note('Cancellation replay');
  const mode = [note('UCX error mode'), mono('none', { color: COLOR.mark })];
  const errors = [note('errors reported'), mono('0', { color: COLOR.mark })];
  const charged = chip('buffer stays charged', { color: COLOR.control, stroke: COLOR.control });
  place(
    column([replay, row([...mode, ...errors, charged], { gap: 'normal', align: 'center' })], {
      gap: 'wide',
    }),
    FOOT,
    'top left',
  );

  c.swap(
    'manifest-unordered',
    [
      board.rails,
      hero,
      channel,
      channelName,
      descriptors,
      lock,
      serviceName,
      service,
      rdma,
      memoryProtection,
      controlsName,
      controls,
      log,
    ],
    [writes, writeNames[0], writeNames[1], events],
  );
  c.on('manifest-unordered', () => s.play(...fence('gridStrong', null)));
  // The prefill worker keeps its copy. Destination capacity stays charged until accesses stop.
  c.on('manifest-unordered', () =>
    s.play(board.gone.to(1, { duration: 0.4 }), board.kept.to(1, { duration: 0.4 })),
  );
  c.on(
    'manifest-unordered',
    () =>
      s.play(
        first.to(SPAN, { duration: 2.6, ease: linear }),
        second.to(SPAN, { duration: 2.6, ease: linear }),
      ),
    0.4,
  );
  c.after('manifest-overlap', () => corrupt.set(1), 0.04);
  c.show('manifest-overlap', writeNames[2], { after: true, lead: -0.04 });
  c.show('event-cancel', [writerLegend, readerLegend]);
  c.on('event-cancel', () =>
    s.play(
      events.go(0, { duration: 0.3 }),
      writer.to(1, { duration: 0.3 }),
      reader.to(1, { duration: 0.3 }),
    ),
  );
  c.after('event-stopped', () =>
    s.play(events.go(1, { duration: 0.3 }), writer.to(0, { duration: 0.3 })),
  );
  c.hide('event-stopped', writerLegend, { after: true });
  c.after('event-quiet', () =>
    s.play(events.go(2, { duration: 0.3 }), reader.to(0, { duration: 0.3 })),
  );
  c.hide('event-quiet', readerLegend, { after: true });
  c.after('event-reusable', () =>
    s.play(
      events.go(3, { duration: 0.3 }),
      first.to(0, { duration: 0.3 }),
      second.to(0, { duration: 0.3 }),
      board.reserved.to(0, { duration: 0.3 }),
    ),
  );
  // The alternative case has no confirmed stop. Restore its charge before showing its writer.
  c.swap('manifest-reports', [events, writeNames], replay);
  c.show('manifest-mode', mode);
  c.show('manifest-zero', errors, { after: true });
  c.show('manifest-charge', charged, { after: true });
  c.on('manifest-reports', () => s.play(board.reserved.to(blocks, { duration: 0.3 })), 0.4);
  c.on('manifest-reports', () => s.play(writer.to(1, { duration: 0.3 })), 0.7);
  c.on('manifest-missing', () => s.play(seen.to(1, { duration: 0.4 })));
}
