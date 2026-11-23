export function schedule(prefill = 9, budget = 6) {
  const out = [];
  for (let step = 0; step < 3; step++) {
    const r0Decode = 1,
      r1Prefill = Math.min(prefill, budget - r0Decode),
      r1Decode = prefill === 0 ? 1 : 0;
    prefill -= r1Prefill;
    out.push({
      step,
      r0Decode,
      r1Prefill,
      r1Decode,
      left: prefill,
      used: r0Decode + r1Prefill + r1Decode,
      unused: budget - r0Decode - r1Prefill - r1Decode,
    });
  }
  return out;
}
export function references(tables) {
  const out = new Map();
  for (const table of Object.values(tables))
    for (const slot of table) out.set(slot, (out.get(slot) ?? 0) + 1);
  return out;
}
export function vvTouchAllocate(queue, refs, touch, allocate = true) {
  const free = [...queue],
    counts = {
      ...refs,
    };
  if ((counts[touch] ?? 0) === 0) {
    const at = free.indexOf(touch);
    if (at < 0) throw Error('zero-ref touched block absent');
    free.splice(at, 1);
  }
  counts[touch] = (counts[touch] ?? 0) + 1;
  let allocated = null;
  if (allocate) {
    if (!free.length) throw Error('no free block');
    allocated = free.shift();
    counts[allocated] = (counts[allocated] ?? 0) + 1;
  }
  return {
    free,
    refs: counts,
    allocated,
  };
}
export function vvReleaseRequest(tables, hashes, who) {
  const next = Object.fromEntries(Object.entries(tables).filter(([id]) => id !== who)),
    refs = references(tables),
    free = [];
  for (const slot of [...tables[who]].reverse()) {
    refs.set(slot, refs.get(slot) - 1);
    if (refs.get(slot) === 0) {
      if (hashes.has(slot)) free.push(slot);
      else free.unshift(slot);
    }
  }
  return {
    tables: next,
    refs,
    free,
  };
}
