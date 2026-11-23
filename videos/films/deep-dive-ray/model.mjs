import { features } from './arithmetic.mjs';
import { texts } from './fixtures.mjs';
export function windowTrace(tick) {
  let admitted = 0,
    consumed = 0;
  const pending = [],
    consumedIds = [],
    consumedRecords = [];
  for (let clock = 0; clock <= tick; clock++) {
    const ready = pending.findIndex((task) => task.end <= clock);
    if (ready >= 0) {
      const task = pending[ready];
      consumedIds.push(task.id);
      consumedRecords.push({
        ...task,
        value: features(texts[task.id % 3]),
      });
      pending.splice(ready, 1);
      consumed++;
    }
    while (pending.length < 3 && admitted < 9) {
      const occupied = new Set(
        pending.filter((task) => task.end > clock).map((task) => task.worker),
      );
      const worker = [0, 1, 2].find((slot) => !occupied.has(slot)) ?? 0;
      pending.push({
        id: admitted,
        end: clock + 2 + (admitted % 3),
        worker,
        text: texts[admitted % 3],
      });
      admitted++;
    }
  }
  return {
    admitted,
    consumed,
    pending,
    consumedIds,
    consumedRecords,
    retained: pending.filter((task) => task.end <= tick).length,
  };
}
export function rayResources(total, actors, other = 0) {
  const held = actors.reduce((a, z) => a + z, 0) + other;
  return {
    total,
    held,
    free: total - held,
    childFits: total - held >= 1,
  };
}
export function rayPlacement(capacities, bundles, strategy) {
  const counts = capacities.map(() => 0),
    assignment = [],
    remaining = [...capacities];
  function visit(i) {
    if (i === bundles.length) return true;
    let order = capacities.map((_, j) => j);
    if (strategy.includes('SPREAD')) order.sort((a, z) => counts[a] - counts[z] || a - z);
    for (const j of order) {
      if (remaining[j] < bundles[i]) continue;
      if (strategy === 'STRICT_PACK' && i && j !== assignment[0]) continue;
      if (strategy === 'STRICT_SPREAD' && counts[j]) continue;
      remaining[j] -= bundles[i];
      counts[j]++;
      assignment.push(j);
      if (visit(i + 1)) return true;
      assignment.pop();
      counts[j]--;
      remaining[j] += bundles[i];
    }
    return false;
  }
  const ready = visit(0);
  return {
    ready,
    assignment: ready ? [...assignment] : [],
    used: ready ? capacities.map((v, i) => v - remaining[i]) : capacities.map(() => 0),
  };
}
export function rayObjectLoss({ ownerAlive, copies, lineage, retries = 1 }) {
  return !ownerAlive
    ? {
        status: 'OwnerDiedError',
        usable: false,
      }
    : copies > 0
      ? {
          status: 'fetch surviving copy',
          usable: true,
        }
      : lineage && retries > 0
        ? {
            status: 'replay generating task',
            usable: true,
          }
        : {
            status: 'payload unavailable',
            usable: false,
          };
}
export function rayApplyBatch(ledger, id, delta) {
  const next = {
    count: ledger.count,
    records: {
      ...ledger.records,
    },
  };
  if (Object.hasOwn(next.records, id))
    return {
      ledger: next,
      result: next.records[id],
      changed: false,
    };
  next.count += delta;
  next.records[id] = next.count;
  return {
    ledger: next,
    result: next.count,
    changed: true,
  };
}
export function rayBackpressure(tick) {
  const pending = [],
    consumed = [];
  let submitted = 0;
  for (let t = 0; t <= tick; t++) {
    if (t > 0 && t % 4 === 0) {
      const ready = pending.findIndex((x) => x.end <= t);
      if (ready >= 0) consumed.push(pending.splice(ready, 1)[0]);
    }
    while (pending.length < 3 && submitted < 9) {
      pending.push({
        id: submitted,
        start: t,
        end: t + 1 + (submitted % 3),
      });
      submitted++;
    }
  }
  return {
    submitted,
    consumed,
    pending,
    ready: pending.filter((x) => x.end <= tick),
    tick,
  };
}
