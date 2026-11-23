// Scene `real-payload`: scale the same state to an 8k prompt, and see what it costs.
//
// The picture: the slab of `kv-state`. Its sides grow to the production shape and the row of
// factors follows. Then the same payload takes three more forms. It splits into two rank shards
// and becomes 512 blocks, plus 8 that are reserved and empty. It crosses one path, two links and a
// shared bottleneck as bars on a clock. Last, reservations of that size go into a pool of 8 GiB
// until one of them has to wait.
import {
  assertEqual,
  beside,
  boxOf,
  clamp,
  column,
  commas,
  dynamic,
  grid,
  indicate,
  line,
  linear,
  place,
  rect,
  row,
  smoothstep,
  text,
} from 'vizmatic/stage';
import { cacheShape, productionPayload } from '../../../films/inference-data-plane/fixtures.mjs';
import { area, chip, display, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  RESERVED_DASH,
  SIDE,
  SLAB,
  block,
  factorRow,
  pool,
  slab,
  slot,
  spans,
} from '../parts.mjs';

const KIB = 1024,
  MIB = 1024 ** 2,
  GIB = 1024 ** 3;
/** The production shape of the article. The model of the lesson has its product and its tokens. */
const SHAPE = { tensors: 2, layers: 80, kvHeads: 8, headWidth: 128, bytes: 2 };
if (Object.values(SHAPE).reduce((a, b) => a * b, 1) !== productionPayload.bytesPerToken)
  throw new Error('real-payload: the production shape and the model disagree');
/** The row of this scene: the five factors of one token, in the order of the voice. */
const ROW = [
  { key: 'tensors', name: 'tensors', side: SIDE.tensors },
  { key: 'layers', name: 'layers', side: SIDE.layers, widest: '80' },
  { key: 'kvHeads', name: 'KV heads', side: SIDE.heads },
  { key: 'headWidth', name: 'head width', side: SIDE.width, widest: '128' },
  { key: 'bytes', name: 'bytes', side: SIDE.bytes },
];
const RANK = [COLOR.state, COLOR.other];

/** The blocks of the prompt, the blocks reserved for the output, and the pool of the last beat. */
const PROMPT_BLOCKS = productionPayload.promptTokens / productionPayload.blockTokens;
const OUTPUT_BLOCKS = productionPayload.outputCap / productionPayload.blockTokens;
const RESERVE_MIB = ((PROMPT_BLOCKS + OUTPUT_BLOCKS) * productionPayload.blockBytes) / MIB;
const EXTRA_BLOCKS = Math.ceil(
  (productionPayload.promptTokens + 1 + productionPayload.outputCap) /
    productionPayload.blockTokens,
);
const SLACK_POSITIONS =
  EXTRA_BLOCKS * productionPayload.blockTokens -
  productionPayload.promptTokens -
  1 -
  productionPayload.outputCap;
const POOL_MIB = 8 * 1024;
const ADMITTED = Math.floor(POOL_MIB / RESERVE_MIB);
/** The path of the article: 25 decimal gigabytes in one second. */
const PATH_GBPS = 25;
const TRANSFER_MS = (productionPayload.bytes / (PATH_GBPS * 1e9)) * 1000;
const REQUESTS = 40;

export default function realPayload(s, c) {
  const [stage, foot] = area.rows([5, 2], 'wide');

  // ---- Beat 0: the slab grows from the toy to the production shape.
  const payload = slab(s, stage);
  const shape = Object.fromEntries(
    ROW.map((factor) => [factor.key, s.value(cacheShape[factor.key])]),
  );
  const tokens = s.value(cacheShape.positions),
    count = s.value(0), // the factors that the running product holds
    perToken = s.value(0), // 0 to 1: the size of one token shows
    tokensOn = s.value(0); // 0 to 1: the tokens join the product
  const factors = factorRow(
    ROW.map((factor) => ({ ...factor, read: () => shape[factor.key].value })),
    { lit: () => ROW.findIndex((factor) => factor.side === Math.round(payload.lit.value)) },
  );
  const [rowBand, tokenBand] = foot.rows([3, 2], 'normal');
  const resultBed = rect(560, 130, { fill: null, stroke: null });
  place(row([factors.block, resultBed], { gap: 'wide', align: 'top' }), rowBand, 'top');
  const result = dynamic(() => {
    const held = Math.ceil(count.value);
    if (held <= 0) return null;
    const box = boxOf(resultBed);
    const bytes = ROW.slice(0, held).reduce(
      (product, factor) => product * Math.round(shape[factor.key].value),
      1,
    );
    return [
      text(
        `${held < ROW.length ? 'running: ' : '= '}${commas(bytes)}${held >= ROW.length ? ' bytes' : ''}`,
        {
          font: 'mono',
          size: 44,
          color: 'ink',
          anchor: 'left',
        },
      ).at(box.left, box.top + 32),
      perToken.value > 0 &&
        text(`= ${bytes / KIB} KiB per token`, {
          font: 'mono',
          size: 44,
          color: COLOR.mark,
          anchor: 'left',
        })
          .at(box.left, box.top + 98)
          .opacity(perToken.value),
    ].filter(Boolean);
  });
  const tokenBed = rect(170, 60, { fill: null, stroke: null });
  const tokenTimes = label('×', { color: 'dim' }),
    tokenName = note('prompt tokens'),
    totalName = mono(`= ${productionPayload.bytes / GIB} GiB`, { color: COLOR.mark, size: 52 });
  place(
    row([tokenTimes, tokenBed, tokenName, totalName], { gap: 'normal', align: 'center' }),
    tokenBand,
    'top',
  );
  const tokenNumber = dynamic(() => {
    const box = boxOf(tokenBed);
    return tokensOn.value > 0
      ? text(commas(Math.round(tokens.value)), {
          font: 'mono',
          size: 52,
          color: Math.round(payload.lit.value) === SIDE.tokens ? COLOR.mark : 'ink',
        })
          .at(box.cx, box.cy)
          .opacity(tokensOn.value)
      : null;
  });

  s.add(
    heading(c.title),
    payload.sheets,
    payload.tabs,
    factors.names,
    factors.times,
    factors.numbers,
    result,
    tokenNumber,
  );
  const grow = (cue, side, changes) =>
    c.on(cue, () => {
      payload.lit.set(side);
      s.play(...changes());
    });
  c.on('payload-scale', () => s.play(indicate(payload.tabs, { scale: 1.08 })));
  grow('payload-layers', SIDE.layers, () => [
    shape.layers.to(SHAPE.layers, { duration: 0.8 }),
    payload.depth.to(SLAB.production.depth, { duration: 0.8 }),
    payload.off.to(SLAB.production.off, { duration: 0.8 }),
  ]);
  grow('payload-heads', SIDE.heads, () => [
    shape.kvHeads.to(SHAPE.kvHeads, { duration: 0.8 }),
    payload.bands.to(SLAB.production.bands, { duration: 0.8 }),
    payload.band.to(SLAB.production.band, { duration: 0.8 }),
  ]);
  grow('payload-width', SIDE.width, () => [shape.headWidth.to(SHAPE.headWidth, { duration: 0.8 })]);
  grow('payload-bytes', SIDE.bytes, () => []);
  const times = c.cue('payload-times');
  ROW.forEach((factor, index) =>
    c.on(
      'payload-times',
      () => {
        payload.lit.set(factor.side);
        count.set(Math.min(index + 1, ROW.length - 1));
      },
      (index * (times.end - times.start)) / ROW.length,
    ),
  );
  const perTokenCue = c.cue('production-per-token');
  c.after(
    'production-per-token',
    () => {
      payload.lit.set(-1);
      count.set(ROW.length);
      s.play(perToken.to(1, { duration: 0.3 }));
    },
    Math.ceil((perTokenCue.end + 0.04) * 30) / 30 + 1 / 60 - perTokenCue.end,
  );
  c.show('payload-tokens', [tokenTimes, tokenName]);
  grow('payload-tokens', SIDE.tokens, () => [
    tokensOn.to(1, { duration: 0.3 }),
    tokens.to(productionPayload.promptTokens, { duration: 1.6 }),
    payload.w.to(SLAB.production.w, { duration: 1.6 }),
  ]);
  c.show('production-total', totalName, { after: true });

  // ---- Beat 1: two rank shards, and then blocks of 16 tokens.
  const SHARD = { ...SLAB.production, w: 400, cut: 1 };
  const at = payload.measure(SHARD);
  const half = (at.h - at.split) / 2;
  const rankNotes = [0, 1].map((rank) => {
    const words = row(
      [
        label(`rank ${rank}`, { color: RANK[rank] }),
        mono(`${productionPayload.bytes / GIB / 2} GiB`, { color: COLOR.mark }),
      ],
      {
        gap: 'normal',
      },
    );
    return beside(
      words,
      [at.right + 30, at.top + half / 2 + rank * (half + at.split)],
      'right',
      'none',
    );
  });
  c.on('payload-shards', () => {
    payload.lit.set(-1);
    s.play(payload.cut.to(1, { duration: 1 }), payload.w.to(SHARD.w, { duration: 1 }));
  });
  c.show('payload-per-rank', rankNotes, { after: true });

  const [gridSide, readSide] = area.columns([3, 2], 'wide');
  // 32 blocks in a row: the prompt fills 16 rows, and the reserved blocks start the next one.
  const cells = pool(PROMPT_BLOCKS + OUTPUT_BLOCKS + 1, { columns: 32, pitch: 32 });
  const cellsName = label('the prompt, in blocks of 16 tokens');
  const boundaryBed = rect(boxOf(cells.panel).width, 180, { fill: null, stroke: null });
  place(column([cellsName, cells.panel, boundaryBed], { gap: 'normal' }), gridSide, 'left');
  const filled = s.value(0), // the blocks of the prompt that show
    held = s.value(0), // the blocks that are reserved for the output
    extra = s.value(0), // 0 to 1: one real token shifts the future positions by one
    point = s.value(0); // 0 to 1: the voice points at the reserved blocks
  const blockMarks = dynamic(() => {
    const nodes = [];
    for (let index = 0; index < PROMPT_BLOCKS; index++) {
      const here = clamp(filled.value - index, 0, 1);
      nodes.push(
        here > 0
          ? block(cells.p(index), COLOR.state, { size: cells.cell, opacity: here })
          : slot(cells.p(index), 'gridStrong', { size: cells.cell }),
      );
    }
    const positions = productionPayload.blockTokens;
    // The real token occupies block 512, offset 0. The future range follows it without a gap.
    for (let index = 0; index <= OUTPUT_BLOCKS; index++) {
      const here = Math.max(clamp(held.value - index, 0, 1), extra.value);
      if (here <= 0) continue;
      const [x, y] = cells.p(PROMPT_BLOCKS + index);
      const from = clamp(extra.value - index * positions, 0, positions);
      const to = clamp(extra.value + held.value * positions - index * positions, 0, positions);
      nodes.push(slot([x, y], 'gridStrong', { size: cells.cell, opacity: here }));
      if (to > from)
        nodes.push(
          rect(((to - from) / positions) * cells.cell, cells.cell, {
            fill: null,
            stroke: point.value > 0.5 ? COLOR.mark : COLOR.control,
            width: 2,
            dash: [5, 4],
            opacity: here,
          }).at(x - cells.cell / 2 + (((from + to) / positions) * cells.cell) / 2, y),
        );
    }
    if (extra.value > 0) {
      const [x, y] = cells.p(PROMPT_BLOCKS);
      const width = (cells.cell * extra.value) / positions;
      nodes.push(
        rect(width, cells.cell, { fill: COLOR.state, stroke: null }).at(
          x - cells.cell / 2 + width / 2,
          y,
        ),
      );
      // Enlarge the boundary blocks so all 16 positions can be counted.
      const box = boxOf(boundaryBed);
      const rows = [
        {
          block: PROMPT_BLOCKS,
          name: `block ${PROMPT_BLOCKS}`,
          words: `1 real + ${positions - 1} future`,
        },
        {
          block: PROMPT_BLOCKS + 1,
          name: `${PROMPT_BLOCKS + 1}-${PROMPT_BLOCKS + OUTPUT_BLOCKS - 1}`,
          words: `${OUTPUT_BLOCKS - 1} × ${positions} future`,
        },
        {
          block: PROMPT_BLOCKS + OUTPUT_BLOCKS,
          name: `block ${PROMPT_BLOCKS + OUTPUT_BLOCKS}`,
          words: `1 future + ${SLACK_POSITIONS} slack`,
        },
      ];
      rows.forEach((item, rowIndex) => {
        const cy = box.top + 20 + rowIndex * 50;
        nodes.push(
          mono(item.name, { size: 29, anchor: 'left' }).at(box.left, cy).opacity(extra.value),
          note(item.words, { anchor: 'left' })
            .at(box.left + 590, cy)
            .opacity(extra.value),
        );
        for (let offset = 0; offset < positions; offset++) {
          const token = item.block * positions + offset;
          const at = [box.left + 195 + offset * 24, cy];
          const real = token === productionPayload.promptTokens;
          const future =
            token > productionPayload.promptTokens &&
            token <= productionPayload.promptTokens + productionPayload.outputCap;
          nodes.push(
            real
              ? block(at, COLOR.state, { size: 20, opacity: extra.value })
              : slot(at, future ? COLOR.control : 'gridStrong', {
                  size: 20,
                  opacity: extra.value,
                  dash: future ? [4, 3] : null,
                }),
          );
        }
      });
      nodes.push(
        note(
          `blue: token index ${productionPayload.promptTokens} · cyan: future · gray: rounding slack`,
          { anchor: 'left' },
        )
          .at(box.left, box.top + 164)
          .opacity(extra.value),
      );
    }
    return nodes;
  });
  const fact = (value, words, color = 'ink') => [mono(value, { color }), note(words)];
  const facts = {
    prompt: fact(`${PROMPT_BLOCKS} blocks`, 'full prompt blocks', COLOR.state),
    each: fact(`× ${productionPayload.blockBytes / MIB} MiB`, 'each'),
    output: fact(
      `+ ${OUTPUT_BLOCKS} blocks`,
      `reserved: ${(OUTPUT_BLOCKS * productionPayload.blockBytes) / MIB} MiB`,
      COLOR.control,
    ),
    reserve: fact(`= ${commas(RESERVE_MIB)} MiB`, 'to reserve', COLOR.mark),
    more: fact(
      `${EXTRA_BLOCKS} blocks`,
      `${commas((EXTRA_BLOCKS * productionPayload.blockBytes) / MIB)} MiB capacity`,
    ),
    real: fact(`+ ${productionPayload.bytesPerToken / KIB} KiB`, 'of real payload', COLOR.state),
    future: fact(
      `${productionPayload.outputCap} positions`,
      `${(productionPayload.outputCap * productionPayload.bytesPerToken) / MIB} MiB for future output`,
      COLOR.control,
    ),
    slack: fact(
      `${SLACK_POSITIONS} slack slots`,
      `${(SLACK_POSITIONS * productionPayload.bytesPerToken) / MIB} MiB`,
      'dim',
    ),
  };
  place(
    grid(Object.values(facts).flat(), { columns: 2, gap: ['normal', 'normal'] }),
    readSide,
    'left',
  );

  c.swap(
    'payload-blocks',
    [
      payload.sheets,
      payload.tabs,
      rankNotes,
      factors.names,
      factors.times,
      factors.numbers,
      result,
      tokenTimes,
      tokenName,
      tokenNumber,
    ],
    [cells.panel, cellsName, blockMarks],
  );
  // Keep the payload total below the block grid until the grid is readable.
  c.hide('payload-blocks', totalName, { lead: -0.4 });
  const fill = c.cue('payload-512');
  c.on(
    'payload-blocks',
    () =>
      s.play(
        filled.to(PROMPT_BLOCKS - 1, {
          duration: fill.end - c.cue('payload-blocks').start - 0.4,
          ease: linear,
        }),
      ),
    0.4,
  );
  c.after(
    'payload-512',
    () => s.play(filled.to(PROMPT_BLOCKS, { duration: 0.2, ease: linear })),
    0.04,
  );
  c.show('payload-512', facts.prompt, { after: true });
  c.show('payload-5mib', facts.each, { after: true });
  c.on('payload-reserve', () => s.play(held.to(OUTPUT_BLOCKS - 1, { duration: 1.2 })));
  c.after(
    'payload-eight',
    () => s.play(held.to(OUTPUT_BLOCKS, { duration: 0.2, ease: linear })),
    0.04,
  );
  c.show('payload-eight', facts.output, { after: true });
  c.show('payload-2600', facts.reserve, { after: true });
  c.on('payload-future', () => s.play(point.to(1, { duration: 0.3 })));
  const extraInput = place(
    note('Add 1 prompt token', { color: COLOR.state }),
    boundaryBed,
    'top left',
  );
  c.on('payload-extra', () => s.play(point.to(0, { duration: 0.3 })));
  c.show('payload-extra', extraInput);
  c.hide('payload-521', extraInput, { after: true, lead: -0.04, fade: 0.15 });
  c.after('payload-521', () => s.play(extra.to(1, { duration: 0.3, ease: linear })), 0.24);
  c.hide('payload-extra', [facts.output, facts.reserve]);
  c.show('payload-extra', facts.future, { after: true });
  c.show('payload-521', facts.more, { after: true });
  c.show('payload-320', facts.real, { after: true });
  c.show('payload-320', facts.slack, { after: true });

  // ---- Beat 2: the transfer on a clock, for one path, two links and a shared bottleneck.
  const [timeBand, rateBand, limitBand] = area.rows([6, 4, 1.5], 'normal');
  const one = s.value(0), // how far the one path is, in milliseconds
    two = s.value(0), // how far each of two links is
    oneReadout = s.value(0),
    twoReadout = s.value(0),
    demandReadout = s.value(0),
    rateOn = s.value(0),
    carried = s.value(0), // gigabytes in one second that the path carries
    needed = s.value(0); // gigabytes in one second that the requests need
  const ms = (value) => `${value.toFixed(1)} ms`;
  const clock = spans(
    timeBand,
    [
      {
        name: 'one path, 2.5 GiB',
        color: COLOR.state,
        start: () => 0,
        end: () => one.value,
        readout: () => (oneReadout.value > 0.5 ? ms(one.value) : null),
      },
      {
        name: 'rank 0 stream',
        color: RANK[0],
        start: () => 0,
        end: () => two.value,
        readout: () => (twoReadout.value > 0.5 ? ms(two.value) : null),
      },
      {
        name: 'rank 1 stream',
        color: RANK[1],
        start: () => 0,
        end: () => two.value,
        readout: () => (twoReadout.value > 0.5 ? ms(two.value) : null),
      },
    ],
    {
      domain: [0, 120],
      ticks: [0, 30, 60, 90, 120],
      format: (value) => `${value} ms`,
      nameWidth: 360,
    },
  );
  const rate = spans(
    rateBand,
    [
      {
        name: 'the path carries',
        color: COLOR.state,
        start: () => 0,
        end: () => carried.value,
        shown: () => rateOn.value,
        readout: () => `${carried.value.toFixed(0)} GB/s`,
      },
      {
        name: `${REQUESTS} requests/s need`,
        color: COLOR.fail,
        start: () => 0,
        end: () => needed.value,
        shown: () => rateOn.value,
        readout: () => (demandReadout.value > 0.5 ? `${needed.value.toFixed(1)} GB/s` : null),
      },
    ],
    {
      domain: [0, 120],
      ticks: [0, 30, 60, 90, 120],
      format: (value) => `${value} GB/s`,
      nameWidth: 360,
    },
  );
  const limit = place(
    display(
      `Ideal service rate   ${((PATH_GBPS * 1e9) / productionPayload.bytes).toFixed(2)} requests/s`,
      { color: COLOR.mark, size: 52 },
    ),
    limitBand,
  );

  c.swap(
    'payload-link',
    [
      cells.panel,
      cellsName,
      blockMarks,
      ...Object.values(facts)
        .filter((items) => ![facts.prompt, facts.output, facts.reserve].includes(items))
        .flat(),
    ],
    [clock.axis, clock.names[0], clock.marks, rate.axis, rate.names[0], rate.marks],
  );
  // The prompt count stays between the clock rows while the transfer axes arrive.
  c.hide('payload-link', facts.prompt, { lead: -0.4 });
  const run = c.cue('payload-107');
  c.on(
    'payload-link',
    () => s.play(rateOn.to(1, { duration: 0.3 }), carried.to(PATH_GBPS, { duration: 1.2 })),
    0.6,
  );
  const link = c.cue('payload-link');
  c.after('payload-link', () =>
    s.play(one.to(TRANSFER_MS * 0.9, { duration: run.end - link.end, ease: linear })),
  );
  c.after('payload-107', () => s.play(one.to(TRANSFER_MS, { duration: 0.3, ease: linear })), 0.04);
  // Reveal computed readouts after their clauses, beyond the encoder's shutter interval.
  c.after('payload-107', () => oneReadout.set(1), 0.34);
  c.show('payload-two-links', [clock.names[1], clock.names[2]]);
  const pair = c.cue('payload-53');
  c.on(
    'payload-two-links',
    () =>
      s.play(
        two.to(TRANSFER_MS / 2, {
          duration: pair.end - c.cue('payload-two-links').start - 1,
          ease: linear,
        }),
      ),
    1,
  );
  c.after('payload-53', () => twoReadout.set(1), 0.04);
  c.on('payload-shared', () => {
    twoReadout.set(0);
    s.play(two.to(TRANSFER_MS * 0.9, { duration: 1.8 }));
  });
  c.after(
    'payload-shared',
    () => s.play(two.to(TRANSFER_MS, { duration: 0.3, ease: linear })),
    0.04,
  );
  c.after('payload-shared', () => twoReadout.set(1), 0.34);
  c.show('payload-forty', rate.names[1]);
  const demand = c.cue('payload-demand');
  c.on('payload-demand', () =>
    s.play(
      needed.to((REQUESTS * productionPayload.bytes * 0.9) / 1e9, {
        duration: demand.end - demand.start,
        ease: linear,
      }),
    ),
  );
  c.after(
    'payload-demand',
    () =>
      s.play(
        needed.to((REQUESTS * productionPayload.bytes) / 1e9, { duration: 0.3, ease: linear }),
      ),
    0.04,
  );
  c.after('payload-demand', () => demandReadout.set(1), 0.34);
  c.show('payload-max', limit, { after: true, lead: -0.04 });

  // A burst on the serial path. The partially transferred request is still outstanding.
  const [burstHeader, burstGrid, burstScale, burstResult] = area.rows([1, 4, 1, 1], 'normal');
  const burstTitle = place(label(`${REQUESTS} transfers on one shared link`), burstHeader, 'left');
  const burstTime = s.value(0);
  const timeMs = () => Math.floor(burstTime.value);
  const finished = () => Math.floor(timeMs() / TRANSFER_MS);
  assertEqual(Math.floor(1000 / TRANSFER_MS), 9, 'complete serial transfers in the first second');
  const timeMark = dynamic(() =>
    place(mono(`${timeMs()} ms`, { size: 54, color: COLOR.mark }), burstHeader, 'right'),
  );
  const boxes = burstGrid.rows(4, 'normal').flatMap((band) => band.columns(10, 'normal'));
  const batch = dynamic(() =>
    boxes.flatMap((box, i) => {
      const sent = clamp(timeMs() / TRANSFER_MS - i, 0, 1);
      const w = box.width - 12,
        h = box.height * 0.82;
      const fill = sent * (w - 12);
      return [
        rect(w, h, { fill: 'surface', stroke: 'gridStrong', width: 2, radius: 8 }).at(
          box.cx,
          box.cy,
        ),
        fill > 0 &&
          rect(fill, h - 12, {
            fill: sent === 1 ? COLOR.valid : COLOR.state,
            stroke: null,
            radius: 4,
          }).at(box.cx - (w - 12) / 2 + fill / 2, box.cy),
      ].filter(Boolean);
    }),
  );
  const load = place(
    note(
      `One box = 2.5 GiB    ·    ${PATH_GBPS} GB/s shared    ·    ${TRANSFER_MS.toFixed(1)} ms per request`,
      { size: 37 },
    ),
    burstScale,
    'left',
  );
  const ask = place(
    label('How many transfers finish in one second?', { color: COLOR.mark }),
    burstResult,
    'left',
  );
  const burstCount = dynamic(() =>
    place(
      label(`${finished()} complete   ·   ${REQUESTS - finished()} unfinished`, {
        color: COLOR.mark,
      }),
      burstResult,
      'left',
    ),
  );
  const burst = [burstTitle, timeMark, batch, load];
  c.swap(
    'payload-burst',
    [clock.axis, clock.names, clock.marks, rate.axis, rate.names, rate.marks, limit],
    burst,
  );
  c.show('payload-ask', ask);
  c.swap('payload-second', ask, burstCount);
  c.on('payload-second', () =>
    s.play(
      burstTime.to(1000, {
        duration: c.cue('payload-second').end - c.cue('payload-second').start,
        ease: linear,
      }),
    ),
  );

  // ---- Beat 3: reservations of that size in a pool of 8 GiB.
  const [poolBand, laneBand, meterBand] = area.rows([5, 4, 5], 'normal');
  const poolName = label(`cache pool: ${POOL_MIB / 1024} GiB`);
  const poolBed = rect(area.width, 130, { fill: null, stroke: 'gridStrong', width: 2, radius: 10 });
  place(column([poolName, poolBed], { gap: 'tight' }), poolBand, 'left');
  const lane = rect(area.width, 130, { fill: null, stroke: null });
  place(lane, laneBand, 'top');
  const scale = area.width / POOL_MIB;
  const admitted = s.value(0), // the reservations that are in the pool
    waiting = s.value(0), // 0 to 1: the fourth reservation shows in the lane
    attempt = s.value(0), // 0 to 1: the fourth one tries the pool
    cap = s.value(0); // 0 to 1: the voice points at the output part of each reservation
  const reservation = ([left, cy], color, opacity, named) => {
    const width = RESERVE_MIB * scale - 8,
      output = OUTPUT_BLOCKS * (productionPayload.blockBytes / MIB) * scale;
    return [
      rect(width, 114, { fill: 'surface', stroke: color, width: 3, radius: 8, opacity }).at(
        left + 4 + width / 2,
        cy,
      ),
      rect(width - output - 12, 102, {
        fill: color,
        stroke: null,
        radius: 5,
        opacity: 0.28 * opacity,
      }).at(left + 10 + (width - output - 12) / 2, cy),
      // The part for the output cap: reserved, with no bytes yet.
      rect(output, 102, {
        fill: cap.value > 0.5 ? COLOR.mark : COLOR.control,
        stroke: null,
        radius: 3,
        opacity,
      }).at(left + 4 + width - 6 - output / 2, cy),
      named > 0 &&
        text(`${commas(RESERVE_MIB)} MiB`, { font: 'mono', size: 36, color })
          .at(left + 4 + (width - output) / 2, cy)
          .opacity(named * opacity),
    ].filter(Boolean);
  };
  const poolMarks = dynamic(() => {
    const bed = boxOf(poolBed),
      rest = boxOf(lane);
    const nodes = [];
    // The next reservation waits in the lane under the pool. When it is admitted, it goes along
    // the lane to the place under its slot, and then it rises into the pool.
    for (let index = ADMITTED; index >= 0; index--) {
      if (index === ADMITTED && waiting.value <= 0) continue;
      // It shows when the one before it is clear of the lane.
      const here = clamp((admitted.value - index + 0.15) / 0.15, 0, 1);
      if (here <= 0) continue;
      const rise = index < ADMITTED ? clamp(admitted.value - index, 0, 1) : 0;
      const last = index === ADMITTED;
      const along = smoothstep(clamp(rise / 0.5, 0, 1)),
        up = smoothstep(clamp((rise - 0.5) / 0.5, 0, 1));
      const x = bed.left + along * index * RESERVE_MIB * scale,
        y = rest.cy + (bed.cy - rest.cy) * up - (last ? 46 * Math.sin(Math.PI * attempt.value) : 0);
      // The size hides while the reservation passes the border of the pool.
      const named = rise < 0.5 ? 1 : clamp((rise - 0.9) / 0.1, 0, 1);
      nodes.push(
        ...reservation(
          [x, y],
          last && waiting.value > 0.5 ? COLOR.other : COLOR.state,
          here,
          named,
        ),
      );
    }
    return nodes;
  });
  // The scale of the pool: a tick and a number at each second gibibyte, over the bar.
  const scaleMarks = [2, 4, 6].flatMap((gib) => {
    const bed = boxOf(poolBed);
    const x = bed.left + gib * 1024 * scale;
    return [
      line([x, bed.top], [x, bed.top + 16], { stroke: 'dim', width: 2 }),
      text(`${gib} GiB`, { font: 'mono', size: 30, color: 'dim' }).at(x, bed.top - 28),
    ];
  });
  const leftBox = boxOf(poolBed);
  const leftover = beside(
    mono(`${POOL_MIB - ADMITTED * RESERVE_MIB} MiB`, { color: COLOR.mark }),
    [leftBox.right, leftBox.top],
    'above',
    'tight',
    'right',
  );
  const waits = note('the fourth waits', { color: COLOR.other });
  const early = chip('reserve before prefill', { color: COLOR.control, stroke: COLOR.control });
  const capName = chip('the output cap', { color: COLOR.mark, stroke: COLOR.mark });
  place(
    row([rect(RESERVE_MIB * scale, 10, { fill: null, stroke: null }), waits, early, capName], {
      gap: 'wide',
      align: 'center',
    }),
    lane,
    'left',
  );

  // The other bounds: each one is a meter that fills to its limit and stops there.
  const METERS = [
    { name: 'prefill work', cue: 'payload-bounds' },
    { name: 'transfer bytes, queue age', cue: 'payload-bound-transfer' },
    { name: 'decode capacity', cue: 'payload-bound-decode' },
    { name: 'latency, output length', cue: 'payload-credit', unknown: true },
  ];
  const meterBeds = METERS.map(() => rect(380, 34, { fill: null, stroke: null }));
  const meterNames = METERS.map((meter) => note(meter.name));
  const levels = METERS.map(() => s.value(0));
  place(
    grid(
      METERS.flatMap((_, index) => [
        column([meterNames[index], meterBeds[index]], { gap: 'normal' }),
      ]),
      { columns: 4, gap: ['wide', 'normal'] },
    ),
    meterBand,
  );
  const meters = dynamic(() =>
    METERS.flatMap((meter, index) => {
      const here = 1;
      const box = boxOf(meterBeds[index]);
      const width = box.width * 0.75 * levels[index].value;
      return [
        rect(box.width, box.height, {
          fill: null,
          stroke: meter.unknown ? 'dim' : 'gridStrong',
          width: 2,
          radius: 6,
          opacity: here,
          ...(meter.unknown ? { dash: RESERVED_DASH } : {}),
        }).at(box.cx, box.cy),
        width > 1 &&
          rect(width, box.height - 10, {
            fill: COLOR.state,
            stroke: null,
            radius: 4,
            opacity: 0.8 * here,
          }).at(box.left + 5 + width / 2, box.cy),
        // The limit of the bound.
        !meter.unknown &&
          rect(5, box.height + 14, {
            fill: levels[index].value > 0 ? COLOR.mark : 'dim',
            stroke: null,
            radius: 2,
          }).at(box.left + 5 + box.width * 0.75, box.cy),
      ].filter(Boolean);
    }),
  );

  c.swap(
    'payload-pool',
    [burst, burstCount],
    [poolName, poolBed, scaleMarks, poolMarks, meters, meterNames],
  );
  c.on('payload-pool', () => s.play(admitted.to(1, { duration: 1.1 })), 1.2);
  c.on('payload-three', () => s.play(admitted.to(ADMITTED - 0.3, { duration: 2.4, ease: linear })));
  c.after(
    'payload-three',
    () => s.play(admitted.to(ADMITTED, { duration: 0.3, ease: linear })),
    0.04,
  );
  c.show('payload-392', leftover, { after: true });
  c.show('payload-fourth', waits, { after: true, lead: -0.04 });
  c.after(
    'payload-fourth',
    () => s.play(waiting.to(1, { duration: 0.3 }), attempt.to(1, { duration: 1.1 })),
    0.04,
  );
  METERS.forEach((meter, index) =>
    c.on(meter.cue, () =>
      s.play(
        meter.unknown
          ? indicate(meterNames[index], { color: COLOR.mark })
          : levels[index].to(1, { duration: 1.2 }),
      ),
    ),
  );
  c.show('payload-before', early);
  c.show('payload-cap', capName);
  c.on('payload-cap', () => s.play(cap.to(1, { duration: 0.3 })));
}
