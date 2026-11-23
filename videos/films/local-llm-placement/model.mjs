import { outputs, receipt, tests } from './fixtures.mjs';
import { tracks } from './construction.mjs';
import assert from 'node:assert/strict';
export function cache(tokens, sequences, capped = true) {
  const sliding =
    (2 * 40 * 8 * 256 * (capped ? Math.min(tokens, 1024) : tokens) * sequences * 2) / 1e9;
  const full = (2 * 8 * 1 * 512 * tokens * sequences * 2) / 1e9;
  return {
    sliding,
    full,
    total: sliding + full,
  };
}
export function memory(tokens, capped) {
  const kv = cache(tokens, 4, capped),
    weights = 7.6,
    workspace = 2,
    total = weights + workspace + kv.total;
  return {
    ...kv,
    kv: kv.total,
    weights,
    workspace,
    total,
    limit: 19.2,
    capacity: 24,
    fits: total <= 19.2,
  };
}
export function place(budget) {
  const gpuBlocks = Math.max(0, Math.min(32, Math.floor((budget - 3.2 + 1e-10) / 0.3))),
    blocks = [];
  let value = [1, 0.5];
  for (let i = 0; i < 32; i++) {
    const input = value;
    value = [0.98 * input[0] + 0.01 * input[1], 0.02 * input[0] + 0.99 * input[1]];
    blocks.push({
      id: `B${i + 1}`,
      device: i >= 32 - gpuBlocks ? 'GPU' : 'CPU',
      input,
      output: value,
    });
  }
  const boundaries = blocks.slice(1).filter((block, i) => block.device !== blocks[i].device).length;
  return {
    budget,
    gpuBlocks,
    cpuBlocks: 32 - gpuBlocks,
    blocks,
    boundaries,
    output: value,
    deviceWeightGB: gpuBlocks * 0.3,
    hostWeightGB: (32 - gpuBlocks) * 0.3,
  };
}
export function stream(mode) {
  const payloads =
    mode === 0
      ? [
          {
            name: 'Device read',
            gb: 7.6,
            rate: 500,
          },
        ]
      : mode === 1
        ? [
            {
              name: 'Device read',
              gb: 5.6,
              rate: 500,
            },
            {
              name: 'Host transfer',
              gb: 2,
              rate: 25,
            },
          ]
        : [
            {
              name: 'Storage read',
              gb: 7.6,
              rate: 5,
            },
          ];
  let cursor = 0;
  const spans = payloads.map((item) => {
    const start = cursor;
    cursor += item.gb / item.rate;
    return {
      ...item,
      start,
      end: cursor,
      seconds: item.gb / item.rate,
    };
  });
  return {
    spans,
    total: cursor,
    payload: spans.reduce((sum, span) => sum + span.gb, 0),
  };
}
export function rates(receipt) {
  assert(receipt.done === true);
  const { prompt, cached, promptNs, output, outputNs } = receipt;
  for (const value of [prompt, cached, promptNs, output, outputNs])
    if (value !== undefined) assert(Number.isSafeInteger(value) && value >= 0);
  assert(cached === undefined || prompt === undefined || cached <= prompt);
  const rate = (count, ns) => (count > 0 && ns > 0 ? (count * 1e9) / ns : null);
  return {
    uncached: prompt !== undefined && cached !== undefined ? prompt - cached : null,
    prefill: prompt !== undefined && cached !== undefined ? rate(prompt - cached, promptNs) : null,
    output: rate(output, outputNs),
  };
}
export function evaluate(values) {
  const rows = tests.map((test, i) => ({
    id: test.id,
    critical: test.critical,
    text: values[i],
    pass: test.check(values[i]),
  }));
  return {
    rows,
    score: rows.filter((row) => row.pass).length,
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.12) / 0.6));
  if (id === 'intro' || id === 'retention') {
    const tokens = id === 'retention' && step === 1 ? 32768 : 16384,
      capped = step !== 2;
    const budget = memory(tokens, capped);
    if (id === 'intro' && step === 0)
      return {
        step,
        p,
        tokens,
        capped,
        ...budget,
        kv: 0,
        workspace: 0,
        total: budget.weights,
        fits: true,
      };
    return {
      step,
      p,
      tokens,
      capped,
      ...budget,
    };
  }
  if (id === 'pools') {
    const unified = step === 2,
      hostCapacity = 32,
      deviceCapacity = unified ? 32 : 24,
      other = unified ? 10 : 0,
      deviceRequest = unified ? 24 : 28,
      hostRequest = step === 1 ? 8 : 0;
    return {
      step,
      p,
      unified,
      hostCapacity,
      deviceCapacity,
      other,
      deviceRequest,
      hostRequest,
      deviceFit: deviceRequest + other <= deviceCapacity,
      hostFit: hostRequest <= hostCapacity,
    };
  }
  if (id === 'placement') {
    const placement = place(step === 0 ? 16 : 8),
      move = step === 0 ? 0 : step === 1 ? Math.min(1, p / 0.35) : 1,
      execution = step === 1 ? Math.max(0, (p - 0.35) / 0.65) : p,
      processed = step === 2 ? 32 : Math.floor(32 * execution + 1e-9);
    return {
      step,
      p,
      move,
      ...placement,
      processed,
      current: processed ? placement.blocks[processed - 1].output : [1, 0.5],
    };
  }
  if (id === 'transfers') {
    const path = stream(step);
    return {
      step,
      p,
      ...path,
      elapsed: path.total * p,
    };
  }
  if (id === 'timings') {
    const current =
      step === 2
        ? {
            ...receipt,
            outputNs: undefined,
          }
        : receipt;
    return {
      step,
      p,
      receipt: current,
      ...rates(current),
      inflated: (receipt.prompt * 1e9) / receipt.promptNs,
    };
  }
  const baseline = evaluate(outputs.baseline),
    candidate = evaluate(outputs.candidate),
    criticalPass = candidate.rows.filter((row) => row.critical).every((row) => row.pass);
  const evaluated =
    step === 0 ? Math.min(tests.length, Math.floor(tests.length * p + 1e-9)) : tests.length;
  return {
    step,
    p,
    baseline,
    candidate,
    evaluated,
    approved: candidate.score >= baseline.score && criticalPass,
    memory: memory(16384, true),
    placement: place(8),
    rates: rates(receipt),
  };
}
export function admission(sessions) {
  const kv = cache(32768, sessions, true),
    total = 7.6 + 2 + kv.total;
  return {
    sessions,
    kv: kv.total,
    total,
    limit: 16,
    fits: total <= 16,
  };
}
export function layerFlag(blocks, n) {
  assert(Number.isInteger(blocks) && blocks > 0 && Number.isInteger(n) && n >= 0);
  const start = Math.max(0, blocks - n + 1),
    hidden = Array.from(
      {
        length: blocks,
      },
      (_, i) => ({
        i,
        gpu: i >= start,
      }),
    );
  return {
    hidden,
    outputGpu: n > 0,
    hiddenGpu: hidden.filter((x) => x.gpu).length,
    inputGpu: false,
  };
}
export function replayRows(kind) {
  const scenarios = {
    context: [
      {
        context: 16384,
        sessions: 4,
        total: memory(16384, true).total,
      },
      {
        context: 32768,
        sessions: 4,
        total: memory(32768, true).total,
      },
    ],
    sessions: [4, 8].map((sessions) => ({
      context: 16384,
      sessions,
      total: 7.6 + 2 + cache(16384, sessions).total,
    })),
  };
  return scenarios[kind];
}

export function prefillRequest(temporaryGB) {
  const deviceGB = 24;
  const weightsGB = 7.6;
  const cacheGB = cache(16384, 4, true).total;
  const liveGB = weightsGB + cacheGB;
  const freeGB = deviceGB - liveGB;
  return { weightsGB, cacheGB, liveGB, freeGB, deviceGB, temporaryGB, fits: temporaryGB <= freeGB };
}

export function releaseCases() {
  const rows = [
    { id: 'Owner', before: true, after: true },
    { id: 'Severity', before: true, after: true },
    {
      id: 'Rollback',
      before: tests[0].check(outputs.baseline[0]),
      after: tests[0].check(outputs.candidate[0]),
      protected: true,
    },
    { id: 'Runbook', before: false, after: true },
    { id: 'Service', before: false, after: true },
  ];
  const passes = rows.filter((row) => row.after).length;
  const lost = rows.find((row) => row.protected && row.before && !row.after);
  return { rows, passes, lost, promote: passes >= 4 && !lost };
}
