export function bf16(value) {
  const storage = new DataView(new ArrayBuffer(4));
  storage.setFloat32(0, value);
  const bits = storage.getUint32(0),
    rounded = (bits + 0x7fff + ((bits >>> 16) & 1)) >>> 0;
  storage.setUint32(0, (rounded & 0xffff0000) >>> 0);
  return storage.getFloat32(0);
}
export function bankAddress(lane, k = 0, stride = 32) {
  return {
    word: stride * lane + k,
    bank: (stride * lane + k) % 32,
  };
}
export function registerDemand(rows, columns) {
  return {
    flops: 2 * rows * columns,
    bytes: 4 * (rows + columns),
    ratio: (2 * rows * columns) / (4 * (rows + columns)),
    accumulators: rows * columns,
  };
}
