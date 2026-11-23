import { clamp, motion, transpose } from './arithmetic.mjs';
import { bits } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function compact() {
  let offset = 0;
  const offsets = bits.map((bit) => {
    const at = offset;
    offset += bit;
    return at;
  });
  return {
    bits,
    offsets,
    count: offset,
    indexes: bits.flatMap((bit, i) => (bit ? [i] : [])),
  };
}
export function compactProgress(count) {
  assert(
    Number.isInteger(count) && count >= 0 && count <= bits.length,
    'visible scan lanes must be in range',
  );
  const result = compact();
  return {
    visible: count,
    offsets: result.offsets.map((value, i) => (i < count ? value : '·')),
    indexes: result.indexes.filter((index) => index < count),
    count: result.count,
  };
}
export function sharedTileSnapshot(beat, progress) {
  const q = motion(progress),
    entries = transpose(4).filter(
      (entry) => beat === 0 || entry.source.every((coordinate) => coordinate < 3),
    );
  const loaded = Math.floor(entries.length * clamp(q / 0.4)),
    arrived = Math.floor(16 * clamp((q - 0.4) / 0.15)),
    ready = arrived === 16;
  const read = ready ? Math.floor(entries.length * clamp((q - 0.58) / 0.42)) : 0;
  return {
    entries,
    loaded,
    arrived,
    ready,
    read,
    phase:
      loaded < entries.length ? 'PRODUCER WRITES' : !ready ? 'BLOCK BARRIER' : 'TRANSPOSED READ',
  };
}
