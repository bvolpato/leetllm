import { cloneChecks } from './fixtures.mjs';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function cloneReadiness(receipts, clone = 'clone-A') {
  const current = new Map(receipts.filter((r) => r.clone === clone).map((r) => [r.check, r]));
  const checks = cloneChecks.map((check) => current.get(check)?.status === 'Pass');
  return {
    checks,
    ready: checks.every(Boolean),
  };
}
export function overlay(base, upper) {
  return {
    ...base,
    ...upper,
  };
}
export function networkDecision({ publicAddress, allowlisted, job, method, operation }) {
  const scoped = job === 'J4' && method === 'GET' && operation === '/summarize';
  return {
    connect: publicAddress && allowlisted,
    inject: publicAddress && allowlisted && scoped,
  };
}
export function networkTrace(beat, progress) {
  beat = Math.min(beat, 1);
  const seconds = progress * [24.386, 23.522][beat];
  const rebound = beat === 0 && seconds >= 22.6,
    resolved = beat > 0 || seconds >= 15.6;
  const checked = beat > 0 || seconds >= 16.5,
    scoped = beat === 1 && seconds >= 12.7;
  const decision = networkDecision({
    publicAddress: !rebound,
    allowlisted: true,
    job: 'J4',
    method: 'GET',
    operation: '/summarize',
  });
  return {
    seconds,
    rebound,
    resolved,
    checked,
    scoped,
    decision,
    attempt: rebound ? 2 : 1,
    request: beat === 0 ? 'J4/R1' : 'J4/R2',
    opaque: beat === 1 && seconds >= 2.5,
    injected: beat === 1 && scoped && decision.inject && seconds >= 15.8,
    connected: checked && decision.connect && (beat > 0 || seconds >= 18.9),
    audited: beat === 1 && seconds >= 21.9,
  };
}
export function cowSnapshot(step, p) {
  const base = [10, 20, 30, 40, 50, 60],
    allocated = step > 0 || p >= 0.34,
    written = step > 0 || p >= 0.55,
    privatePage = allocated
      ? {
          id: 'A-private-2',
          value: written ? 99 : 30,
        }
      : null,
    basePages = base.map((value, i) => ({
      id: 'base-' + i,
      value,
    })),
    refsA = basePages.map((page) => page.id),
    refsB = basePages.map((page) => page.id);
  if (written) refsA[2] = privatePage.id;
  const pages = new Map(
    [...basePages, ...(privatePage ? [privatePage] : [])].map((page) => [page.id, page]),
  );
  return {
    base,
    basePages,
    refsA,
    refsB,
    privatePage,
    allocated,
    written,
    privatePages: Number(allocated),
    a: refsA.map((id) => pages.get(id).value),
    b: refsB.map((id) => pages.get(id).value),
    residentBytes: pages.size * 4096,
    copyProgress: step > 0 ? 1 : clamp((p - 0.34) / 0.21),
  };
}
export function capacitySnapshot(step, p) {
  const q = motion(p),
    privateMiB = step === 0 ? Math.round(mix(50, 200, q)) : 200,
    poolMiB = 224 * 1024,
    capacity = Math.floor(poolMiB / privateMiB),
    slotGroups = Array.from(
      {
        length: 72,
      },
      (_, i) => Math.max(0, Math.min(64, capacity - i * 64)),
    ),
    now = 8 * q,
    burstJobs = step === 0 ? 0 : Math.floor(3840 * clamp((now - 3) / 1.6)),
    running = Math.min(128, burstJobs),
    queued = Math.max(0, burstJobs - running);
  return {
    privateMiB,
    poolMiB,
    capacity,
    slotGroups,
    sessions: 3840,
    cores: 128,
    meanCores: 3840 * 0.03,
    burstCores: 3840,
    now,
    burstJobs,
    running,
    queued,
    queueGroups: Array.from(
      {
        length: 12,
      },
      (_, i) => Math.max(0, Math.min(320, queued - i * 320)),
    ),
  };
}
export function sandboxPages(base, writes = []) {
  const copies = {
    A: {},
    B: {},
  };
  for (const { clone, index, value } of writes) {
    if (!Number.isInteger(index) || index < 0 || index >= base.length)
      throw Error('page out of range');
    copies[clone][index] = value;
  }
  const a = base.map((v, i) => copies.A[i] ?? v),
    b = base.map((v, i) => copies.B[i] ?? v),
    privateCount = Object.values(copies).reduce((n, x) => n + Object.keys(x).length, 0);
  return {
    base: [...base],
    copies,
    a,
    b,
    privateCount,
    totalPages: base.length + privateCount,
    kib: (base.length + privateCount) * 4,
  };
}
export function sandboxReadiness(observations) {
  const names = ['clock', 'kernel randomness', 'application state', 'network', 'control'];
  const observed = new Map(observations.map((x) => [x.name, x]));
  return {
    names,
    checks: names.map(
      (n) => observed.get(n)?.generation === 4 && observed.get(n)?.status === 'Pass',
    ),
    ready: names.every(
      (n) => observed.get(n)?.generation === 4 && observed.get(n)?.status === 'Pass',
    ),
  };
}
export function sandboxAck(bytes, { arrival = [], deadline = 2, maxBytes = 64 } = {}) {
  let line = '';
  for (let i = 0; i < bytes.length; i++) {
    if ((arrival[i] ?? 0) >= deadline)
      return {
        status: 'deadline',
        consumed: i,
        line,
      };
    if (line.length >= maxBytes)
      return {
        status: 'length',
        consumed: i,
        line,
      };
    line += bytes[i];
    if (bytes[i] === '\n') {
      const m = /^OK ([0-9]+)\n$/.exec(line),
        port = m ? Number(m[1]) : NaN;
      return m && port >= 2 ** 30 && port < 2 ** 31
        ? {
            status: 'valid',
            port,
            consumed: i + 1,
            leftover: bytes.slice(i + 1),
            line,
          }
        : {
            status: 'invalid',
            consumed: i + 1,
            line,
          };
    }
  }
  return {
    status: 'eof',
    consumed: bytes.length,
    line,
  };
}
export function sandboxCapacity({
  totalGiB = 256,
  reservedGiB = 32,
  privateMiB = 50,
  cores = 128,
  sessionsPerCore = 30,
  duty = 0.03,
} = {}) {
  const poolMiB = (totalGiB - reservedGiB) * 1024,
    sessions = cores * sessionsPerCore;
  return {
    poolMiB,
    fullSlots: Math.floor(poolMiB / 2048),
    privateSlots: Math.floor(poolMiB / privateMiB),
    sessions,
    mean: sessions * duty,
    admitted: Math.min(cores, sessions),
    queued: Math.max(0, sessions - cores),
  };
}
export function sandboxRetirement({
  noticeGeneration = 4,
  actualGeneration = 4,
  cancelled = true,
  refs = 0,
} = {}) {
  const retired = cancelled && noticeGeneration === actualGeneration;
  return {
    retired,
    refs,
    free: retired && refs === 0,
  };
}
export function sandboxReconcile(owner, observation) {
  const same =
    observation.tenant === owner.tenant &&
    observation.id === owner.id &&
    observation.generation === owner.generation;
  return {
    sameOwner: same,
    free:
      same &&
      !observation.running &&
      observation.refs === 0 &&
      !observation.mounted &&
      !observation.network,
  };
}
