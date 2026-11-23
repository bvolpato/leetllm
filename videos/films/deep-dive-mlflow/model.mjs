import { artifactDigest } from './arithmetic.mjs';
import { required } from './fixtures.mjs';
export function citationPass(citations, allowedDocs) {
  return (
    Array.isArray(citations) &&
    citations.length > 0 &&
    citations.every((id) => typeof id === 'string' && allowedDocs.includes(id))
  );
}
export function compareArtifacts({ evaluatedBytes, candidateBytes }, checked = false) {
  const evaluatedDigest =
    typeof evaluatedBytes === 'string' ? artifactDigest(evaluatedBytes) : null;
  const candidateDigest =
    checked && typeof candidateBytes === 'string' ? artifactDigest(candidateBytes) : null;
  const digestMatches = checked
    ? evaluatedDigest !== null && candidateDigest !== null && evaluatedDigest === candidateDigest
    : null;
  return {
    evaluatedBytes,
    candidateBytes,
    evaluatedDigest,
    candidateDigest,
    digestChecked: checked,
    digestMatches,
  };
}
export function releaseAllowed(evidence, identity) {
  return (
    evidence.promote === true && identity.digestChecked === true && identity.digestMatches === true
  );
}
export function assess(rows, expected = required) {
  const counts = new Map();
  for (const row of rows) counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
  const valid = rows.filter(
    (row) => expected.includes(row.id) && counts.get(row.id) === 1 && typeof row.pass === 'boolean',
  );
  const byId = new Map(valid.map((row) => [row.id, row.pass]));
  const missing = expected.filter((id) => !byId.has(id));
  const invalid = rows.filter(
    (row) =>
      !expected.includes(row.id) || counts.get(row.id) !== 1 || typeof row.pass !== 'boolean',
  );
  return {
    rows,
    missing,
    invalid,
    coverage: valid.length / expected.length,
    mean: valid.length ? valid.filter((row) => row.pass).length / valid.length : null,
    promote:
      invalid.length === 0 && missing.length === 0 && expected.every((id) => byId.get(id) === true),
  };
}
export function exporter(arrivals, capacity = 3) {
  let queued = 0,
    sent = 0,
    dropped = 0;
  const states = [];
  for (const incoming of arrivals) {
    if (queued) {
      queued--;
      sent++;
    }
    const accepted = Math.min(capacity - queued, incoming);
    queued += accepted;
    dropped += incoming - accepted;
    states.push({
      queued,
      sent,
      dropped,
    });
  }
  return states;
}
export function exporterReceipts(arrivals, capacity = 3) {
  const queue = [],
    sent = [],
    dropped = [],
    arrived = [],
    states = [];
  let sequence = 0;
  for (const incoming of arrivals) {
    if (queue.length) sent.push(queue.shift());
    const batch = [];
    for (let i = 0; i < incoming; i++) {
      const id = 'T' + ++sequence;
      arrived.push(id);
      batch.push(id);
      if (queue.length < capacity) queue.push(id);
      else dropped.push(id);
    }
    states.push({
      queue: [...queue],
      sentIds: [...sent],
      droppedIds: [...dropped],
      arrivedIds: [...arrived],
      batch,
    });
  }
  return states;
}
export function queueTimeline(capacity, initial, batches) {
  if (!Number.isInteger(capacity) || capacity < 1 || initial.length > capacity)
    throw new RangeError('Queue capacity must contain its initial work');
  const queue = [...initial],
    sent = [],
    dropped = [],
    arrived = [...initial],
    states = [];
  const push = (event) =>
    states.push({
      queue: [...queue],
      sentIds: [...sent],
      droppedIds: [...dropped],
      arrivedIds: [...arrived],
      event,
    });
  push({
    kind: 'initial',
  });
  for (const { arrivals, service } of batches) {
    if (!Number.isInteger(service) || service < 0)
      throw new RangeError('Service count must be a nonnegative integer');
    for (let n = 0; n < service && queue.length; n++) {
      const id = queue.shift();
      sent.push(id);
      push({
        kind: 'sent',
        id,
      });
    }
    for (const id of arrivals) {
      if (arrived.includes(id)) throw new Error('Trace identity cannot arrive twice');
      arrived.push(id);
      if (queue.length < capacity) {
        queue.push(id);
        push({
          kind: 'queued',
          id,
        });
      } else {
        dropped.push(id);
        push({
          kind: 'dropped',
          id,
        });
      }
    }
  }
  return states;
}
export function cacheClockTrace() {
  const registry = {
      support: 17,
      summary: 4,
    },
    cache = new Map(),
    states = [];
  const load = (name, tick, ttl = 3) => {
    const old = cache.get(name),
      refresh = ttl === 0 || !old || tick >= old.expiry;
    if (refresh)
      cache.set(name, {
        value: registry[name],
        expiry: tick + ttl,
      });
    const entry = cache.get(name);
    states.push({
      name,
      tick,
      refresh,
      value: entry.value,
      expiry: entry.expiry,
      registryAtLoad: {
        ...registry,
      },
      entries: [...cache].map(([name, value]) => ({
        name,
        ...value,
      })),
    });
    return Object.freeze({
      name,
      version: entry.value,
    });
  };
  const held = load('support', 0);
  load('summary', 0);
  registry.support = 18;
  registry.summary = 5;
  load('support', 2);
  load('summary', 3);
  load('support', 3);
  load('support', 3, 0);
  return {
    states,
    held,
    registry,
  };
}
