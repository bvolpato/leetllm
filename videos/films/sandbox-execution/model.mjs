import { FRESH_REPORT_XML, WASM_FUEL_CUES } from './fixtures.mjs';
import { addI32, bounded, memoryAccess, parseReport, passAtK } from './arithmetic.mjs';
import { CANDIDATE_PAIRS, REPORT } from './construction.mjs';
import assert from 'node:assert/strict';
export function evidenceSnapshot(beat, progress) {
  const seconds = bounded(progress) * [9.814, 11.166, 12.886][beat];
  const inspected = beat < 2 ? 0 : [1.34, 2.2, 3.3, 4.6].filter((at) => seconds >= at).length;
  const seen = new Set(),
    decisions = REPORT.slice(0, inspected).map((test) => {
      const tag = test.children.find(
        (child) => child.namespace === 'urn:junit' && ['failure', 'error'].includes(child.tag),
      )?.tag;
      const key = test.className + '::' + test.name;
      const decision = !tag
        ? 'skip: no failure/error'
        : seen.has(key)
          ? 'duplicate: keep first'
          : 'retain ' + tag;
      if (tag) seen.add(key);
      return {
        id: test.id,
        key,
        tag,
        decision,
      };
    });
  return {
    seconds,
    records: REPORT,
    inspected,
    decisions,
    rows: repairedParser(REPORT.slice(0, inspected)).rows,
    failed: beat === 1 && seconds >= 3.84,
    checked: beat === 2 && seconds >= 5.65,
  };
}
export function runtimeBoundarySnapshot(beat, progress) {
  const seconds = bounded(progress) * [14.494, 12.846, 15.262][beat];
  const phase = (from, to) => bounded((seconds - from) / (to - from));
  const progressByRuntime =
    beat === 0
      ? [phase(1.01, 8.56), 0, 0, 0]
      : beat === 1
        ? [1, phase(0.675, 3.525), phase(4.45, 7.5125), 0]
        : [1, 1, 1, phase(3.575, 7.075)];
  return {
    seconds,
    progressByRuntime,
    restrictedProbe: beat === 2 && seconds >= 9.55,
    probeProgress: beat === 2 ? phase(9.55, 11.1) : 0,
    decisions: ['container', 'gvisor', 'microvm', 'wasm'].map((runtime) =>
      runtimeAccess(runtime, '/host/credentials'),
    ),
    request: {
      id: 'R1',
      path: '/work/report.xml',
      bytes: 128,
    },
    restrictedPath: '/host/credentials',
  };
}
export function runtimeAccess(runtime, path) {
  const capabilities = {
    container: {
      paths: ['/work/report.xml'],
      gate: 'namespace mount',
      layer: 2,
    },
    gvisor: {
      paths: ['/work/report.xml'],
      gate: 'Sentry filesystem',
      layer: 1,
    },
    microvm: {
      paths: ['/work/report.xml'],
      gate: 'attached volume',
      layer: 2,
    },
    wasm: {
      paths: ['/work/report.xml'],
      gate: 'linked host import',
      layer: 1,
    },
  };
  const capability = capabilities[runtime];
  return {
    allowed: capability.paths.includes(path),
    gate: capability.gate,
    layer: capability.layer,
  };
}
export function evaluationSnapshot(beat, progress) {
  const seconds = bounded(progress) * [10.078, 12.15, 13.222][beat];
  const count =
    beat === 0
      ? 0
      : beat > 1
        ? 10
        : Math.min(10, Math.floor(11 * bounded((seconds - 3.8875) / 3.9)));
  const pairs = CANDIDATE_PAIRS.slice(0, count),
    successful = pairs.filter((pair) => pair.successful).length;
  return {
    seconds,
    pairs,
    successful,
    complete: count === 10,
    revealRatio: beat > 1 || (beat === 1 && seconds >= 8.45),
    poolVisible:
      beat > 1
        ? 5
        : beat === 1
          ? Math.min(5, Math.floor(6 * bounded((seconds - 0.9625) / 1.6)))
          : 0,
    probes:
      beat === 2
        ? [1.7375, 3.1125, 9.9125, 11.4375].map((at) => seconds >= at)
        : [false, false, false, false],
  };
}
export function initialParser(cases) {
  try {
    const rows = cases.map((test) => {
      if (!Object.hasOwn(test.attributes, 'status')) {
        const error = new Error("'status'");
        error.name = 'KeyError';
        throw error;
      }
      return test.attributes.status;
    });
    return {
      status: 'passed',
      rows,
    };
  } catch (error) {
    return {
      status: 'failed',
      error: `${error.name}: ${error.message}`,
    };
  }
}
export function repairedParser(cases) {
  const rows = [],
    seen = new Set();
  for (const test of cases) {
    const tags = test.children
      .filter((child) => (child.namespace ?? '') === (test.namespace ?? 'urn:junit'))
      .map((child) => child.tag);
    const outcome = tags.includes('skipped')
      ? null
      : tags.find((tag) => tag === 'failure' || tag === 'error');
    if (!outcome) continue;
    if (!test.className?.trim() || !test.name?.trim())
      throw new Error('A failing case needs classname and name');
    const key = `${test.className}::${test.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(`${key} · ${outcome}`);
  }
  return {
    status: 'passed',
    rows,
  };
}
export function repairTrace() {
  const first = initialParser(REPORT),
    repaired = repairedParser(REPORT);
  return {
    first,
    repaired,
    byteLimitedExcerpt:
      '<testcase name="rejectsFailure"><failure>expected child</failure></testcase>',
  };
}
export function repairSceneSnapshot(beat) {
  const trace = repairTrace();
  if (beat < 1)
    return {
      stage: 'contract',
      status: 'expected rows',
      repaired: false,
    };
  if (beat < 2)
    return {
      stage: 'failure',
      status: trace.first.error,
      repaired: false,
    };
  return {
    stage: 'repair',
    status: `passed · ${trace.repaired.rows.length} unique failures`,
    repaired: true,
  };
}
export function authorityFlow() {
  const artifact = {
    base: 'rev-18',
    tree: 'candidate-tree-7',
    image: 'worker@sha256:abc',
    grader: 'tests-v4',
  };
  const fingerprint = JSON.stringify(artifact);
  return {
    supervisor: ['policy', 'provision', 'timeout', 'freeze artifact'],
    worker: ['candidate', 'dependencies', 'bounded output'],
    validator: ['expected outputs', 'test rules', 'signed result'],
    artifact,
    fingerprint,
    sameArtifact: fingerprint === JSON.stringify(artifact),
  };
}
export function runtimeProbe() {
  const controls = [
    {
      attempt: 'Read host credential',
      boundary: 'Secret omitted + filesystem scope',
      outcome: 'denied',
    },
    {
      attempt: 'Open external socket',
      boundary: 'Network policy',
      outcome: 'denied',
    },
    {
      attempt: 'Write past scratch cap',
      boundary: 'Filesystem quota',
      outcome: 'ENOSPC · process continues',
    },
    {
      attempt: 'Create task past limit',
      boundary: 'Task quota',
      outcome: 'EAGAIN · existing tasks continue',
    },
    {
      attempt: 'Run beyond wall budget',
      boundary: 'Supervisor watchdog',
      outcome: 'terminate + verify cleanup',
    },
  ];
  return controls;
}
export function cleanupTransition(state, event) {
  if (event.type === 'cancel' && state.status === 'running')
    return {
      ...state,
      status: 'cancellation-requested',
    };
  if (
    event.type === 'terminated' &&
    state.status === 'cancellation-requested' &&
    event.runtimeId === state.runtimeId &&
    event.generation === state.generation
  )
    return {
      ...state,
      status: 'terminated',
    };
  if (
    event.type === 'reset-ok' &&
    state.status === 'terminated' &&
    event.runtimeId === state.runtimeId &&
    event.generation === state.generation
  )
    return {
      ...state,
      status: 'reusable',
    };
  if (event.type === 'timeout' || event.type === 'identity-mismatch')
    return {
      ...state,
      status: 'quarantined',
    };
  return state;
}
export function cleanupFixture() {
  const old = {
    runtimeId: 'worker-A/g7',
    slot: 'A',
    generation: 7,
    status: 'running',
  };
  const newer = {
    runtimeId: 'worker-A/g8',
    slot: 'A',
    generation: 8,
    status: 'running',
  };
  const requested = cleanupTransition(old, {
    type: 'cancel',
  });
  const lateOld = cleanupTransition(newer, {
    type: 'terminated',
    runtimeId: old.runtimeId,
    generation: old.generation,
  });
  const terminated = cleanupTransition(requested, {
    type: 'terminated',
    runtimeId: old.runtimeId,
    generation: old.generation,
  });
  return {
    old,
    newer,
    requested,
    lateOld,
    terminated,
    reusable: cleanupTransition(terminated, {
      type: 'reset-ok',
      runtimeId: old.runtimeId,
      generation: old.generation,
    }),
    lost: cleanupTransition(requested, {
      type: 'timeout',
    }),
  };
}
export function wasmFixture() {
  const fuelLimit = 100,
    workloadSteps = 132,
    memoryLimitPages = 1,
    requestedPages = 2;
  const imports = new Set(['write_result']);
  return {
    fuelLimit,
    workloadSteps,
    consumedFuel: Math.min(workloadSteps, fuelLimit),
    fuelRemaining: Math.max(0, fuelLimit - workloadSteps),
    executedSteps: Math.min(workloadSteps, fuelLimit),
    trapBeforeStep: fuelLimit + 1,
    remainingSteps: Math.max(0, workloadSteps - fuelLimit),
    memoryLimitPages,
    requestedPages,
    memoryGrowth: requestedPages > memoryLimitPages ? -1 : 1,
    allowedImports: [...imports],
    secretReadLinked: imports.has('read_secret'),
  };
}
export function wasmSnapshot(beat, beatP = 1) {
  const fixture = wasmFixture();
  const elapsed = Math.max(0, Math.min(1, beatP)) * WASM_FUEL_CUES.beatSpan;
  const progressToTrap = Math.max(
    0,
    Math.min(
      1,
      (elapsed - WASM_FUEL_CUES.consumeStart) /
        (WASM_FUEL_CUES.exhaustion - WASM_FUEL_CUES.consumeStart),
    ),
  );
  const trapped = beat >= 2 || (beat === 1 && elapsed >= WASM_FUEL_CUES.exhaustion);
  const consumedFuel =
    beat <= 0
      ? 0
      : trapped
        ? fixture.consumedFuel
        : Math.floor(fixture.fuelLimit * progressToTrap + 1e-9);
  return {
    ...fixture,
    consumedFuel,
    fuelRemaining: fixture.fuelLimit - consumedFuel,
    executedSteps: consumedFuel,
    trapped,
  };
}
export function validateModel() {
  validateSandboxUpgrade();
  const trace = repairTrace();
  assert.equal(trace.first.status, 'failed');
  assert.equal(trace.first.error, "KeyError: 'status'");
  assert.deepEqual(trace.repaired.rows, [
    'ReportParser::rejectsFailure · failure',
    'ReportParser::handlesError · error',
  ]);
  assert.equal(repairSceneSnapshot(0).repaired, false);
  assert.equal(repairSceneSnapshot(1).status, "KeyError: 'status'");
  assert.equal(repairSceneSnapshot(2).repaired, true);
  assert.equal(parseReport().length, 4);
  assert.equal(evidenceSnapshot(2, 1).inspected, 4);
  assert.deepEqual(evidenceSnapshot(2, 1).rows, trace.repaired.rows);
  assert.equal(evidenceSnapshot(2, 2.3 / 12.886).decisions[1].decision, 'duplicate: keep first');
  assert.equal(
    repairedParser(
      parseReport(
        '<testsuite xmlns="urn:junit"><testcase classname="A" name="nested"><wrapper><failure/></wrapper></testcase><testcase classname="A" name="foreign"><failure xmlns="urn:other"/></testcase></testsuite>',
      ),
    ).rows.length,
    0,
  );
  assert.equal(CANDIDATE_PAIRS.length, 10);
  assert.equal(CANDIDATE_PAIRS.filter((pair) => pair.successful).length, 7);
  assert.equal(new Set(CANDIDATE_PAIRS.map((pair) => pair.ids.join('/'))).size, 10);
  assert.equal(evaluationSnapshot(1, 1).successful, 7);
  assert(runtimeBoundarySnapshot(2, 1).progressByRuntime.every((p) => p === 1));
  for (const runtime of ['container', 'gvisor', 'microvm', 'wasm']) {
    assert(runtimeAccess(runtime, '/work/report.xml').allowed);
    assert(!runtimeAccess(runtime, '/host/credentials').allowed);
  }
  const flow = authorityFlow();
  assert(
    flow.sameArtifact &&
      flow.supervisor.includes('timeout') &&
      flow.validator.includes('expected outputs'),
  );
  const probes = runtimeProbe();
  assert.equal(probes[2].outcome, 'ENOSPC · process continues');
  assert.equal(probes[3].outcome, 'EAGAIN · existing tasks continue');
  const cleanup = cleanupFixture();
  assert.equal(cleanup.lateOld.status, 'running');
  assert.equal(cleanup.reusable.status, 'reusable');
  assert.equal(cleanup.lost.status, 'quarantined');
  const wasm = wasmFixture();
  assert.equal(wasm.workloadSteps, 132);
  assert.equal(wasm.executedSteps, 100);
  assert.equal(wasm.consumedFuel, 100);
  assert.equal(wasm.fuelRemaining, 0);
  assert.equal(wasm.trapBeforeStep, 101);
  assert.equal(wasm.remainingSteps, 32);
  assert(wasm.memoryGrowth === -1 && !wasm.secretReadLinked);
  assert.equal(wasmSnapshot(0, 1).consumedFuel, 0);
  assert.equal(
    wasmSnapshot(1, WASM_FUEL_CUES.consumeStart / WASM_FUEL_CUES.beatSpan).consumedFuel,
    0,
  );
  assert.equal(wasmSnapshot(1, 3.59375 / WASM_FUEL_CUES.beatSpan).consumedFuel, 50);
  const beforeExhaustion = wasmSnapshot(
    1,
    (WASM_FUEL_CUES.exhaustion - 0.001) / WASM_FUEL_CUES.beatSpan,
  );
  assert(beforeExhaustion.consumedFuel < 100 && !beforeExhaustion.trapped);
  for (const seconds of [
    WASM_FUEL_CUES.exhaustion,
    5.2125,
    6.7125,
    10.968,
    WASM_FUEL_CUES.beatSpan,
  ]) {
    const held = wasmSnapshot(1, seconds / WASM_FUEL_CUES.beatSpan);
    assert.equal(held.consumedFuel, 100);
    assert.equal(held.fuelRemaining, 0);
    assert.equal(held.executedSteps, 100);
    assert.equal(held.trapped, true);
  }
  assert.equal(wasmSnapshot(2, 0).executedSteps, 100);
  assert(Math.abs(passAtK(5, 2, 2) - 0.7) < 1e-12);
  assert.equal(passAtK(5, 0, 2), 0);
  assert.equal(passAtK(5, 5, 2), 1);
}
export const parserIdentities = (xml) =>
  repairedParser(parseReport(xml)).rows.map((row) => row.split(' · ')[0]);
export function resourceFixture() {
  return {
    cpuQuota: 50,
    cpuPeriod: 100,
    cpuEquivalent: 0.5,
    scratchMiB: 64,
    memoryMiB: 512,
    tasks: 64,
    wallSeconds: 30,
  };
}
export function verdictAxes({
  functional = false,
  enforcedDeny = false,
  terminated = false,
  reset = false,
} = {}) {
  return {
    functional: !!functional,
    network: enforcedDeny ? 'deny observed' : 'unmeasured',
    slot: terminated && reset ? 'reusable' : 'quarantined',
  };
}
export function validateSandboxUpgrade() {
  assert.deepEqual(parserIdentities(FRESH_REPORT_XML), ['payments::retry']);
  assert.deepEqual(
    parserIdentities(
      '<testsuite><testcase classname="A" name="x"><failure/></testcase></testsuite>',
    ),
    ['A::x'],
  );
  assert.throws(
    () => parserIdentities('<testsuite><testcase name="x"><failure/></testcase></testsuite>'),
    /classname/,
  );
  assert.throws(() => parserIdentities('<testsuite>'));
  const old = {
    runtimeId: 'worker-7',
    generation: 7,
    status: 'terminated',
  };
  assert.equal(
    cleanupTransition(old, {
      type: 'reset-ok',
      runtimeId: 'worker-6',
      generation: 6,
    }).status,
    'terminated',
  );
  assert.equal(
    cleanupTransition(old, {
      type: 'reset-ok',
      runtimeId: 'worker-7',
      generation: 7,
    }).status,
    'reusable',
  );
  assert.equal(addI32(41), 42);
  assert.equal(addI32(2 ** 31 - 1), -(2 ** 31));
  assert.equal(memoryAccess(65532), 'read permitted');
  assert.equal(memoryAccess(65534), 'MEMORY_OUT_OF_BOUNDS');
  assert.equal(
    verdictAxes({
      functional: true,
      enforcedDeny: true,
    }).slot,
    'quarantined',
  );
}
