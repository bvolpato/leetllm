import { clamp, deficit, reserveWholePages } from './arithmetic.mjs';
import { MT_NEW_IDS, MULTITENANT_REQUESTS } from './fixtures.mjs';
import { mtEvent } from './construction.mjs';
import { privateHistory } from './page-pool.mjs';
import assert from 'node:assert/strict';
export function multiTenantConstructionModel(scene, state = {}) {
  assert(MT_NEW_IDS.has(scene), 'Unknown construction scene ' + scene);
  if (scene === 'boundary-close') {
    const after = (id) => state.cues?.[id]?.phase === 'after';
    const retired = after('close-last-read');
    const reassigned = after('close-grant-page');
    const written = after('close-write');
    return {
      scene,
      retired,
      reassigned,
      written,
      history: privateHistory({ bTokens: written ? 33 : 32, retired, reassigned }),
    };
  }
  const b = state.beat ?? 0,
    e = (beat, sentence) => mtEvent(scene, state, beat, sentence),
    done = (beat, sentence) => e(beat, sentence) === 1,
    span = e(b),
    base = {
      scene,
      b,
      span,
    };
  if (scene === 'sharing-contract')
    return {
      ...base,
      weightGB: (72e9 * 2) / 1e9,
      copiesTB: (72e9 * 2 * 100) / 1e12,
      weightVisible: done(1, 0),
      copiesVisible: done(1, 1),
      laneProgress: e(0),
    };
  if (scene === 'stream-clocks') {
    const named = (name) => {
        const c = state.cues?.['mt-stream-clocks-' + name];
        return c
          ? c.phase === 'after'
            ? 1
            : c.phase === 'before'
              ? 0
              : clamp(c.progress ?? 0)
          : e(0);
      },
      first = named('first'),
      bundle = named('bundle'),
      terminal = named('terminal');
    return {
      ...base,
      firstVisible: first === 1,
      bundleVisible: bundle === 1,
      terminalVisible: terminal === 1,
      events: [
        {
          id: 'arrival',
          at: 0,
          tokens: 0,
        },
        {
          id: 'first',
          at: 100,
          tokens: 1,
        },
        {
          id: 'bundle',
          at: 220,
          tokens: 4,
        },
        {
          id: 'terminal',
          at: 240,
          tokens: 0,
        },
      ],
      clock:
        b > 0
          ? 240
          : terminal > 0
            ? 220 + 20 * terminal
            : bundle > 0
              ? 100 + 120 * bundle
              : 100 * first,
      gap: 220 - 100,
      gapVisible: done(1, 0),
      elapsed: 240 - 100,
      elapsedVisible: done(1, 1),
      tpot: (240 - 100) / 4,
      tpotVisible: done(1, 2),
      overhead: 240 - 220,
      overheadVisible: done(1, 3),
    };
  }
  if (scene === 'goodput-contract') {
    const gates = [
        [0, 2],
        [0, 3],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      rows = MULTITENANT_REQUESTS.map((r, i) => ({
        ...r,
        pass: r.complete && r.first <= 800 && r.gap <= 120,
        checked: done(...gates[i]),
      }));
    return {
      ...base,
      rows,
      passed: rows.filter((r) => r.pass).length,
      total: rows.length,
      summaryVisible: done(1, 3),
    };
  }
  if (scene === 'trusted-envelope')
    return {
      ...base,
      fields: [
        ['principal', 'Alice'],
        ['tenant', 'A'],
        ['request / attempt', 'A-1 / attempt-1'],
        ['policy', 'acl-v1'],
        ['model / adapter', 'base-v3 / docs-v2'],
        ['deadline / output cap', 'resolved by policy'],
      ],
      issuerChecks: ['issuer', 'audience', 'expiry', 'operation'],
      fieldProgress: e(0),
      spoof: b === 1 && e(1) > 0,
      denied: done(1, 3) || b > 1,
      localDenial: done(2, 1),
    };
  if (scene === 'admission-dimensions') {
    const changed = done(1, 2);
    return {
      ...base,
      demandPages: 5,
      availablePages: changed ? 5 : 4,
      memoryPass: changed,
      checked: done(1, 0),
      otherChecks: {
        rate: true,
        quota: true,
        concurrency: true,
        permission: true,
      },
      limits: [
        ['Arrival rate', 'requests / minute'],
        ['Token window', 'tokens / window'],
        ['Period quota', 'declared units'],
        ['Concurrency', 'outstanding requests'],
        ['Context / output', 'positions / sequence'],
        ['Worker KV', 'physical pages'],
      ],
      assemblyProgress: e(2),
    };
  }
  if (scene === 'admission-race') {
    const atomic = b > 0,
      first = atomic && done(1, 1),
      second = atomic && done(1, 2);
    return {
      ...base,
      atomic,
      requests: [
        {
          id: 'G1 / r1',
          amount: 700,
        },
        {
          id: 'G2 / r2',
          amount: 700,
        },
      ],
      badPromise: 1400,
      badExcess: 400,
      badResultVisible: !atomic && done(0, 3),
      available: atomic ? (first ? 300 : 1000) : 1000,
      held: atomic && first ? 700 : 0,
      first,
      second,
      admitted: atomic && first ? 1 : 0,
      restarted: atomic,
    };
  }
  if (scene === 'idempotency-binding') {
    const reserved = b > 1 && done(2, 1),
      settled = b > 1 && done(2, 3),
      balance = settled
        ? {
            available: 850,
            held: 0,
            settled: 350,
          }
        : reserved
          ? {
              available: 500,
              held: 700,
              settled: 0,
            }
          : {
              available: 1200,
              held: 0,
              settled: 0,
            };
    return {
      ...base,
      sameAccepted: done(0, 2),
      conflict: done(0, 3),
      completionDuplicate: done(1, 2),
      completionReplay: done(1, 3),
      completionConflict: done(1, 4),
      balance,
      reserved,
      settled,
      replayed: done(2, 4),
      total: 1200,
      actual: 200 + 150,
    };
  }
  if (scene === 'dispatch-commit')
    return {
      ...base,
      committed: done(0, 2),
      intentReady: done(0, 3),
      unsafeGPU: b === 1 && done(1, 0),
      rolledBack: b === 1 && done(1, 1),
      missingRecord: b === 1 && done(1, 2),
      definiteFailure: b === 2 && done(2, 1),
      uncertain: b === 2 && done(2, 2),
      reserve: 700,
    };
  if (scene === 'kv-byte-shape') {
    const bytes = 2 * 80 * 8 * 128 * 2;
    return {
      ...base,
      factors: [
        ['K and V', 2],
        ['Layers', 80],
        ['KV heads', 8],
        ['Head width', 128],
        ['Bytes/value', 2],
      ],
      bytes,
      perMiB: bytes / 2 ** 20,
      totalGiB: (bytes * 4000) / 2 ** 30,
      bytesVisible: done(0, 2),
      mibVisible: done(1, 0),
      gibVisible: done(1, 1),
      placementProgress: e(2),
    };
  }
  if (scene === 'kv-growth') {
    const pages = reserveWholePages(16n, 1n),
      huge = 2n ** 54n + 1n,
      exact = reserveWholePages(huge, 0n),
      rounded = BigInt(Math.ceil(Number(huge) / 16));
    return {
      ...base,
      input: 16,
      output: 1,
      pages: Number(pages),
      slots: Number(pages) * 16,
      outputShown: done(0, 2),
      reservationShown: done(0, 3),
      pageMiB: 5,
      pageBytesVisible: done(1, 0),
      huge: String(huge),
      exact: String(exact),
      rounded: String(rounded),
      integerVisible: done(2, 1),
      contextRejected: done(2, 2),
    };
  }
  if (scene === 'physical-references') {
    const aRetired = done(1, 1),
      bRetired = done(3, 1);
    const pages = [
      { id: 'P1', content: 'A’s private suffix', readers: aRetired ? [] : ['A'] },
      {
        id: 'P0',
        content: 'Public handbook',
        readers: [...(aRetired ? [] : ['A']), ...(bRetired ? [] : ['B'])],
      },
      { id: 'P2', content: 'B’s private suffix', readers: bRetired ? [] : ['B'] },
    ];
    return {
      ...base,
      pages,
      aRetired,
      bRetired,
      counted: done(1, 0),
      hostClosed: done(2, 1),
      logical: pages.reduce((total, page) => total + page.readers.length, 0),
      physical: pages.filter((page) => page.readers.length > 0).length,
    };
  }
  if (scene === 'remote-kv') {
    const lookup = 18,
      transfer = 42,
      recompute = 45,
      deadline = 70;
    return {
      ...base,
      lookup,
      transfer,
      recompute,
      deadline,
      remote: lookup + transfer,
      spare: deadline - recompute,
    };
  }
  if (scene === 'iteration-boundary')
    return {
      ...base,
      iteration: Math.min(3, Math.floor(e(0) * 4)),
      membershipVisible: done(0, 1),
      chunkProgress: e(1),
      chunks: Array.from(
        {
          length: 6,
        },
        (_, i) => ({
          id: 'P' + (i + 1),
          prefill: i % 2 === 0,
        }),
      ),
      decodeSlots: Math.round(3 * e(2, 0)),
      promptSlots: Math.round(5 * e(2, 1)),
    };
  if (scene === 'work-cost')
    return {
      ...base,
      served: deficit(3).served,
      jobs: deficit(3).jobs,
      credit: deficit(3).credit,
      workVisible: done(0, 1),
      chunksVisible: done(0, 2),
      ratioVisible: done(0, 3),
      backlogged: b === 2 && !done(2, 0),
      idle: b === 2 && done(2, 0),
    };
  if (scene === 'extra-work') {
    const retired = b > 1 || (b === 1 && done(1, 2));
    return {
      ...base,
      proposals: [
        {
          id: 'p1',
          accepted: true,
        },
        {
          id: 'p2',
          accepted: false,
        },
        {
          id: 'p3',
          accepted: false,
        },
      ],
      verifiedPositions: 3,
      acceptedProposals: 1,
      verification: done(0, 0),
      countsVisible: done(0, 1),
      selected: b > 0,
      retired,
      refs: retired ? 0 : 1,
      newAdmission: retired,
      preemptions: b > 1 ? 3 : 1,
    };
  }
  if (scene === 'adapter-revisions')
    return {
      ...base,
      request: 'A-1',
      pinned: 'docs-v2',
      alias: b > 0 && done(1, 0) ? 'docs-v3' : 'docs-v2',
      newRequest: b > 0 && done(1, 1) ? 'docs-v3' : null,
      oldKV: 'docs-v2',
      allSlotsPinned: b === 2,
      waitVisible: b === 2 && done(2, 3),
      lowRankVisible: b === 0 && done(0, 1),
    };
  if (scene === 'reader-before-ranking') {
    const documents = [
        {
          id: 'A-public',
          tenant: 'A',
          reader: 'Alice',
          score: 0.8,
        },
        {
          id: 'A-private',
          tenant: 'A',
          reader: 'Carol',
          score: 0.95,
        },
        {
          id: 'B-secret',
          tenant: 'B',
          reader: 'Bob',
          score: 0.99,
        },
      ],
      allowed = documents.filter((r) => r.tenant === 'A' && r.reader === 'Alice'),
      wrong = b === 1;
    return {
      ...base,
      documents,
      allowed,
      ranked: [...allowed].sort((a, z) => z.score - a.score),
      global: [...documents].sort((a, z) => z.score - a.score).slice(0, 1),
      wrong,
      empty: wrong && done(1, 0),
      filterReady: b === 0 && done(0, 3),
      denyBeforeExternal: done(1, 2),
    };
  }
  if (scene === 'prefix-trust')
    return {
      ...base,
      key: [
        'A',
        'Alice',
        'acl-v1',
        'base-v3',
        'docs-v2',
        'tokenizer-v3',
        'kv-layout-v1',
        '[1,5,9]',
      ],
      callerSalt: b === 1 ? 'B/bob' : null,
      authenticated: 'A/Alice',
      authorizedGroup: 'A/Alice',
      readAllowed: b !== 1,
      acl: b > 1 && done(2, 0) ? 'acl-v2' : 'acl-v1',
      oldEntry: 'acl-v1',
      miss: b > 1 && done(2, 0),
    };
  if (scene === 'runtime-trust')
    return {
      ...base,
      separateProcesses: b > 0 || done(0, 2),
      computeInstances: [
        {
          id: 'CI1',
          parent: 'GI1',
        },
        {
          id: 'CI2',
          parent: 'GI1',
        },
        {
          id: 'CI3',
          parent: 'GI2',
        },
      ],
      sharedParentMemory: done(1, 2),
      hostBoundary: b > 1 && done(2, 0),
    };
  if (scene === 'usage-and-bill') {
    const gpuSeconds = 4 * 0.2,
      total = (gpuSeconds * 2) / 3600;
    return {
      ...base,
      request: 'A-1',
      attempt: 'attempt-1',
      transport: ['msg-7', 'msg-8'],
      generated: 120,
      delivered: 90,
      generatedExample: b === 1 && done(1, 0),
      billPolicy: b === 1 && done(1, 1),
      gpuSeconds,
      total,
      nodeSeconds: 0.2,
      nodeRate: 8,
      a: total * 0.25,
      bShare: total * 0.75,
      hourlyVisible: done(3, 0),
      consistentVisible: done(3, 1),
      allocVisible: done(2, 1),
      tariffVisible: done(2, 2),
    };
  }
  if (scene === 'rollout-and-streams')
    return {
      ...base,
      old: 'base-v3 / docs-v2',
      next: 'base-v4 / docs-v3',
      newRouting: done(0, 0),
      oldRetained: done(0, 1),
      shadowAuthorized: done(1, 1),
      sequence: [101, 102],
      beforeOutput: b === 2 && !done(2, 1),
      resumeOrError: b === 2 && done(2, 2),
      liveRefs: done(2, 3) ? 0 : 1,
    };
  if (scene === 'incident-evidence')
    return {
      ...base,
      leakPathVisible: b === 0 && !done(0, 1),
      contained: b > 0 || done(0, 1),
      memoryDemand: 5,
      availablePages: 4,
      diagnosed: b === 1 && done(1, 1),
      addedCapacity: b === 1 && done(1, 3),
      metrics: [
        'queue age',
        'admitted work',
        'active sequences',
        'KV occupancy',
        'preemptions',
        'adapter misses',
        'stage latency',
      ],
    };
  if (scene === 'fresh-design-gate') {
    const reserved = done(1, 0),
      pageAnswer = done(1, 2),
      ackLost = b >= 2 && done(2, 0),
      usageKnown = b >= 2 && done(2, 2),
      retired =
        b === 3 &&
        (state.cues?.['mt-fresh-design-gate-retired']
          ? state.cues['mt-fresh-design-gate-retired'].phase === 'after'
          : mtEvent(scene, state, 3) === 1),
      settlementAmountKnown = retired && usageKnown && done(3, 0),
      settled = settlementAmountKnown && done(3, 1),
      released = settled,
      replayed = settled && done(3, 2),
      total = 1500,
      input = 240,
      outputCap = 360,
      actualOutput = 90,
      reservedPositions = input + outputCap,
      actual = input + actualOutput,
      pages = Number(reserveWholePages(BigInt(input), BigInt(outputCap))),
      balance = {
        held: reserved && !settled ? reservedPositions : 0,
        settled: settled ? actual : 0,
      };
    balance.available = total - balance.held - balance.settled;
    assert.equal(balance.available + balance.held + balance.settled, total);
    return {
      ...base,
      tenant: 'C',
      request: 'C/request9',
      attempt: 'attempt2',
      input,
      outputCap,
      actualOutput,
      total,
      reserved,
      pageAnswer,
      pages,
      reservedPositions,
      actual,
      refund: reservedPositions - actual,
      balance,
      ackLost,
      usageKnown,
      retired,
      settlementAmountKnown,
      settled,
      released,
      replayed,
      physicalReusable: retired,
      pagesHeld: pageAnswer && !retired ? pages : 0,
    };
  }
  throw Error('Missing model ' + scene);
}
