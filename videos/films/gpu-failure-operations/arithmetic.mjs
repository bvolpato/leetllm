import {
  INVALID_PROCESS,
  MEMORY_FIELDS,
  STACK_FAILURES,
  admissionChecks,
  gpuReceiptFixtures,
} from './fixtures.mjs';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function readmission(receipts, owner = 'GPU-0/new-process', approval = {}) {
  const current = new Map(receipts.filter((r) => r.owner === owner).map((r) => [r.check, r]));
  const gates = admissionChecks.map((check) => current.get(check)?.status === 'Pass'),
    eligible = gates.every(Boolean),
    approved = approval.workload === true && approval.platform === true;
  return {
    gates,
    eligible,
    approved,
    quarantined: !(eligible && approved),
  };
}
export function ledger(deviceUsed = 39.38) {
  return {
    capacity: 40,
    allocated: 30.1,
    reserved: 36.7,
    free: deviceUsed === null ? null : 40 - deviceUsed,
    reserveGap: 36.7 - 30.1,
    outside: deviceUsed === null ? null : deviceUsed - 36.7,
  };
}
export function diagnosticRun(receipt) {
  const results = receipt.results;
  return {
    id: receipt.id,
    entity: 'GPU-0 / UUID G0',
    version: 'supplied fixture',
    parameters: {
      isolated: true,
      seconds: 30,
      bandwidthMinimum: 16,
    },
    results,
    bandwidth: results.bandwidth === 'Skip' ? null : results.bandwidth === 'Fail' ? 11.2 : 18.4,
    exitStatus: Object.values(results).includes('Fail') ? 1 : 0,
    coverage: covered(results),
  };
}
export function nodeActions(progress) {
  const p = clamp(progress),
    cordoned = p >= 0.2,
    drained = p >= 0.55;
  return {
    node: 'N1',
    workload: 'W9',
    cordoned,
    drained,
    podPresent: !drained,
    ephemeralBlocks: drained ? 0 : 2,
    durableReceipts: ['Q1', 'Q2'],
    newPlacementAllowed: !cordoned,
  };
}
export function covered(results, required = ['pcie', 'bandwidth']) {
  return (
    required.length > 0 &&
    required.every((k) => results[k] === 'Pass') &&
    !Object.values(results).includes('Fail')
  );
}
export function containmentTrace(beat, progress, cues) {
  const q = motion(progress),
    rows = Array.from(
      {
        length: 6,
      },
      (_, i) => ({
        id: 'R' + (i + 3),
        progress: beat > 0 ? 1 : clamp(6 * q - i),
        owner: beat > 0 || 6 * q - i >= 1 ? 'GPU-1/P8' : 'admission queue',
      }),
    );
  const action = cues?.['contain-relaunch'];
  const fatalCue = cues?.['contain-beat-2-focus-1'];
  const fatal = beat > 0 && (fatalCue ? fatalCue.phase !== 'before' : q >= 0.18),
    stopped = beat > 0 && (action ? action.phase !== 'before' : q >= 0.55),
    relaunched = beat > 0 && (action ? action.progress >= 1 : q >= 0.82);
  return {
    rows,
    fatal,
    stopped,
    relaunched,
    existing: [
      {
        id: 'R1',
        owner: 'GPU-0/P17',
      },
      {
        id: 'R2',
        owner: 'GPU-0/P17',
      },
    ],
    process: relaunched
      ? 'P18 · quarantine'
      : stopped
        ? 'P17 · terminated'
        : fatal
          ? 'P17 · unsafe'
          : 'P17 · unready',
  };
}
export function classifyGpuReceipt(row) {
  const required = [
    ...MEMORY_FIELDS,
    'receipt_id',
    'allocator_backend',
    'capacity_gib',
    'oom_request_gib',
    'new_uncorrectable_ecc',
    'stale_processes',
    'new_xids',
    'dcgm_findings',
    'clock_event_reasons',
    'cuda_error',
  ];
  if (!row || typeof row !== 'object' || required.some((k) => !(k in row)))
    throw Error('Missing required normalized fields');
  for (const k of [...MEMORY_FIELDS, 'capacity_gib', 'oom_request_gib']) {
    const v = row[k];
    if (v === null && k !== 'capacity_gib') continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
      throw Error('Finite nonnegative numeric field required: ' + k);
  }
  if (row.capacity_gib <= 0) throw Error('Positive capacity required');
  for (const k of ['new_uncorrectable_ecc', 'stale_processes'])
    if (!Number.isInteger(row[k]) || row[k] < 0) throw Error('Nonnegative integer count required');
  if (!['native', 'cudaMallocAsync', 'unknown'].includes(row.allocator_backend))
    throw Error('Unknown backend');
  if (
    typeof row.receipt_id !== 'string' ||
    !row.receipt_id.trim() ||
    typeof row.cuda_error !== 'string' ||
    !row.cuda_error
  )
    throw Error('Exact identity and CUDA label required');
  if (!Array.isArray(row.new_xids) || row.new_xids.some((x) => !Number.isInteger(x) || x < 0))
    throw Error('Integer Xid codes required');
  for (const k of ['dcgm_findings', 'clock_event_reasons'])
    if (!Array.isArray(row[k]) || row[k].some((x) => typeof x !== 'string'))
      throw Error('Normalized label array required');
  if (
    row.dcgm_findings.some(
      (x) => !['pcie', 'nvlink', 'nvbandwidth', 'nccl', 'memory', 'software'].includes(x),
    )
  )
    throw Error('Decode raw diagnostic status first');
  const [a, r, i, l, u] = MEMORY_FIELDS.map((k) => row[k]);
  for (const [x, y] of [
    [a, r],
    [r, u],
    [u, row.capacity_gib],
    [l, i],
  ])
    if (x !== null && y !== null && x > y + 1e-6) throw Error('Incompatible memory accounting');
  if (a !== null && r !== null && i !== null && i > r - a + 1e-6)
    throw Error('Inactive bytes exceed reserve gap');
  const outside = u === null || r === null ? null : u - r,
    mustRelaunch = INVALID_PROCESS.has(row.cuda_error),
    out = (hypothesis) => ({
      hypothesis,
      mustRelaunch,
      outside,
    });
  if (row.new_uncorrectable_ecc || row.dcgm_findings.includes('memory'))
    return out('device-memory-fault');
  if (row.dcgm_findings.some((x) => ['pcie', 'nvlink', 'nvbandwidth', 'nccl'].includes(x)))
    return out('fabric-fault');
  if (row.new_xids.length) return out('xid-event');
  if (STACK_FAILURES.has(row.cuda_error) || row.dcgm_findings.includes('software'))
    return out('driver-runtime');
  if (mustRelaunch) return out('process-corrupted');
  if (!['success', 'out_of_memory'].includes(row.cuda_error)) return out('unknown-cuda-error');
  if (row.clock_event_reasons.length) return out('clock-limited');
  if (row.stale_processes || (outside !== null && outside >= 4)) return out('outside-pytorch');
  if (MEMORY_FIELDS.some((k) => row[k] === null)) return out('incomplete-memory');
  if (row.cuda_error !== 'out_of_memory') return out('unclassified');
  const request = row.oom_request_gib;
  if (request === null || request === 0) return out('oom-unresolved');
  if (
    row.allocator_backend === 'native' &&
    u + request > row.capacity_gib &&
    i >= request &&
    l < request
  )
    return out('allocator-fragmentation');
  if (a + request > row.capacity_gib) return out('application-capacity');
  return out('oom-unresolved');
}
export function memoryReceipt(row) {
  const r = row.pytorch_reserved_gib,
    a = row.pytorch_allocated_gib,
    u = row.nvml_device_used_gib,
    inactive = row.inactive_split_block_total_gib,
    request = row.oom_request_gib;
  return {
    gap: r === null || a === null ? null : r - a,
    other: r === null || a === null || inactive === null ? null : r - a - inactive,
    outside: u === null || r === null ? null : u - r,
    free: u === null ? null : row.capacity_gib - u,
    deficit: u === null || request === null ? null : request - (row.capacity_gib - u),
  };
}
export function historyRing(events, capacity) {
  if (!Number.isInteger(capacity) || capacity <= 0)
    throw Error('Positive finite ring capacity required');
  return {
    retained: events.slice(-capacity),
    overwritten: events.slice(0, Math.max(0, events.length - capacity)),
    pointer: events.length % capacity,
  };
}
export function gpuIncident(state, event) {
  if (!event || typeof event.key !== 'string' || !event.key) throw Error('Incident key required');
  const records = state.map((r) => ({
      ...r,
    })),
    index = records.findIndex((r) => r.key === event.key);
  if (event.kind === 'fault') {
    if (index < 0)
      records.push({
        key: event.key,
        recurrence: 1,
        quarantined: true,
      });
    else
      records[index] = {
        ...records[index],
        recurrence: records[index].recurrence + 1,
        quarantined: true,
      };
  } else if (event.kind === 'readmit' && index >= 0) {
    const gates = readmission(event.receipts ?? [], event.owner, event.approval);
    if (!gates.quarantined) records[index].quarantined = false;
  } else if (!['quiet', 'unknown', 'readmit'].includes(event.kind))
    throw Error('Unknown incident transition');
  return records;
}
export function freshGpuReceipt(change = {}) {
  return {
    ...gpuReceiptFixtures[0],
    receipt_id: 'fresh-32',
    capacity_gib: 32,
    pytorch_allocated_gib: 20,
    pytorch_reserved_gib: 26,
    inactive_split_block_total_gib: 5,
    largest_inactive_split_block_gib: 0.75,
    nvml_device_used_gib: 29.5,
    oom_request_gib: 3,
    ...change,
  };
}
export function gpuFrame(state) {
  const b = state.beat ?? 0,
    p = clamp(state.beatP ?? 0);
  return {
    b,
    p,
    progress(id, beat) {
      if (b < beat) return 0;
      if (b > beat) return 1;
      const c = state.cues?.[id];
      return c ? clamp(c.progress ?? (c.phase === 'after' ? 1 : 0)) : motion(p);
    },
    started(id, beat) {
      if (b < beat) return false;
      if (b > beat) return true;
      const c = state.cues?.[id];
      return c ? c.phase !== 'before' : p > 0.08;
    },
    completed(id, beat) {
      if (b < beat) return false;
      if (b > beat) return true;
      const c = state.cues?.[id];
      return c ? c.phase === 'after' : p >= 1;
    },
  };
}
