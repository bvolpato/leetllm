import { bandwidthPoint, revisedCapacityRows } from '../arithmetic.mjs';
import { sceneClock } from '../clock.mjs';
import { GiB, hardware, pool } from '../fixtures.mjs';

const rows = revisedCapacityRows();
const chosen = rows.filter((r) => r.eligible).at(-1);
const weightMs = (hardware.weights / hardware.bandwidth) * 1000;
const original = bandwidthPoint(1);
const xOf = (i) => 590 + 275 * i;

function oneConversation(ctx, api, clock) {
  const { C } = api;
  const x = 420,
    width = 1280;
  const oldLive = original.kvRead / GiB;
  const oldReserved = original.reserved / GiB;
  const units = width / oldReserved;
  const scale = 1 - clock.progress('premise') / 2;
  for (const [i, factor] of [1, scale].entries()) {
    const y = 455 + i * 225;
    const live = oldLive * factor;
    const reserved = oldReserved * factor;
    api.text(ctx, i === 0 ? 'Original' : 'New cache', 140, y + 52, 35);
    api.rect(ctx, x, y, width, 76, C.panel, C.muted, 0);
    api.rect(ctx, x, y, units * live, 76, C.cyan, undefined, 0);
    api.rect(ctx, x + units * live, y, units * (reserved - live), 76, C.yellow, undefined, 0);
    if (i === 0 || clock.after('payload')) {
      api.text(ctx, live + ' GiB live', x, y + 140, 35, C.cyan);
    }
    if (i === 0 || clock.after('allowance')) {
      api.text(ctx, reserved + ' GiB reserved in total', 1710, y + 140, 35, C.yellow, 'right');
    }
  }
  api.text(
    ctx,
    '4,096 prompt positions and 1,024 possible output positions in both cases',
    140,
    971,
    35,
    C.muted,
  );
}

export function drawFreshResource(ctx, scene, state, api) {
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const beat = state.beat ?? 0;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const bar = (x, bottom, height, color) => {
    if (height > 0) api.rect(ctx, x - 71, bottom - height, 142, height, color, undefined, 0);
  };
  const selected = beat === 3 && clock.after('selection');
  focus.target('case-inputs', () => {
    label(
      '32 GiB replica   /   12 GiB weights   /   4 GiB runtime   /   16 GiB cache pool',
      140,
      240,
      34,
    );
    if (beat === 0) {
      label('One conversation', 140, 361, 40, C.ink);
      oneConversation(ctx, api, clock);
    } else {
      label(
        'Each conversation    0.25 GiB live    +    0.0625 GiB for its answer',
        140,
        306,
        32,
        C.muted,
      );
    }
  });
  if (beat === 0) return;

  label('Batch size', 140, 387, 36, C.muted);
  rows.forEach((row, i) => {
    const selectedColumn = selected && row.batch === chosen.batch;
    label(String(row.batch), xOf(i), 386, 46, selectedColumn ? C.green : C.ink, 'center');
    if (selectedColumn) api.line(ctx, xOf(i) - 46, 402, xOf(i) + 46, 402, C.green, 5);
  });

  focus.target('memory-bars', () => {
    const bottom = 585,
      scale = 8;
    const current = clock.progress('memory');
    const allowance = clock.progress('candidate');
    label('KV reservation', 140, 493, 38);
    label('16 GiB pool', 140, 549, 34, C.yellow);
    rows.forEach((row, i) => {
      const live = row.kvRead * current;
      const extra = (row.reserved - row.kvRead) * allowance;
      const x = xOf(i);
      bar(x, bottom, live * scale, C.cyan);
      bar(x, bottom - live * scale, extra * scale, C.yellow);
      if (clock.after('candidate')) {
        label(row.reserved + ' GiB', x, 634, 34, C.ink, 'center');
      }
    });
    const edge = bottom - (pool / GiB) * scale;
    api.line(ctx, 445, edge, 1815, edge, C.yellow, 4);
  });

  focus.target('time-bars', () => {
    const bottom = 864,
      scale = 3.65;
    const weights = weightMs * clock.progress('weight-time');
    const live = clock.progress('time');
    label('Time per step', 140, 772, 38);
    if (clock.progress('target') > 0) label('38 ms limit', 140, 828, 34, C.yellow);
    rows.forEach((row, i) => {
      const x = xOf(i);
      bar(x, bottom, weights * scale, C.blue);
      bar(x, bottom - weights * scale, (row.ms - weightMs) * live * scale, C.cyan);
      if (clock.after('time')) {
        const failedNeighbor = beat === 3 && clock.after('reject') && row.batch === 32;
        const color = failedNeighbor
          ? C.pink
          : selected && row.batch === chosen.batch
            ? C.green
            : C.ink;
        label(row.ms + ' ms', x, 915, 34, color, 'center');
      }
    });
    if (clock.progress('target') > 0) {
      const edge = bottom - 38 * scale;
      api.line(ctx, 445, edge, 1815, edge, C.yellow, 4);
    }
  });

  focus.target('batch-choice', () => {
    let note = 'Assumed bandwidth  ·  500 GiB/s';
    if (clock.after('predict')) note = 'Which is the largest listed batch that clears both limits?';
    if (selected) {
      note =
        'Batch ' +
        chosen.batch +
        '   ·   (12 + ' +
        chosen.kvRead +
        ') GiB ÷ 500 GiB/s = ' +
        chosen.ms +
        ' ms';
      if (clock.after('rate')) note += '   ·   ' + chosen.tps.toFixed(0) + ' modeled tokens/s';
    }
    if (beat === 3 && clock.after('cost')) {
      note =
        'At batch ' +
        chosen.batch +
        '   ·   $2/hour ÷ ' +
        ((chosen.tps * 3600) / 1e6).toFixed(1) +
        ' million tokens/hour ≈ $' +
        chosen.costPerMillion.toFixed(4) +
        ' per million tokens';
    }
    if (beat === 3 && clock.after('trial')) {
      note = `Try batch ${chosen.batch}   ·   ${chosen.reserved} GiB reserved   ·   ${chosen.ms} ms per step`;
    }
    label(note, 140, 1010, 37, selected ? C.green : C.ink);
  });
}
export default { id: 'fresh-resource', draw: drawFreshResource };
