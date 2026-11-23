import { callPlan, characterPlan, previewForHistory } from './arithmetic.mjs';
import {
  budgetCuePositions,
  budgetEvents,
  freshRoutes,
  restoreSource,
  restoreSummary,
  leafCues,
  mergeCues,
  pages,
  registry,
  routes,
} from './fixtures.mjs';
import { compareRun, legacyRuns } from './manual.mjs';
import { track } from './construction.mjs';
import assert from 'node:assert/strict';
export const scanTrack = track(
  {
    index: 0,
  },
  [
    [
      0,
      0.25,
      {
        index: 1,
      },
    ],
    [
      0,
      0.48,
      {
        index: 2,
      },
    ],
    [
      0,
      0.72,
      {
        index: 3,
      },
    ],
    [
      1,
      0.08,
      {
        index: 4,
      },
    ],
    [
      1,
      0.58,
      {
        index: 5,
      },
    ],
  ],
);
export const treeTrack = track(
  {
    count: 0,
  },
  [...leafCues, ...mergeCues],
);
export const completionTrack = track(
  {
    record: 'printed text',
  },
  [
    [
      1,
      0.08,
      {
        record: {
          ready: 'false',
          content: '2026-09-30',
        },
      },
    ],
    [
      1,
      0.5,
      {
        record: {
          ready: true,
          content: '2026-09-30 [manual-v12/p6]',
        },
      },
    ],
  ],
);
export const budgetTrack = track(
  {
    count: 0,
  },
  budgetEvents.map((_, i) => [
    ...budgetCuePositions[i],
    {
      count: i + 1,
    },
  ]),
);
export const lineageTrack = track(
  {
    sourceIds: [],
  },
  [
    [
      0,
      0.06,
      {
        sourceIds: ['manual-v12/p6'],
      },
    ],
    [
      0,
      0.32,
      {
        sourceIds: ['manual-v12/p6', 'manual-v12/p6'],
      },
    ],
    [
      0,
      0.54,
      {
        sourceIds: ['manual-v12/p6', 'manual-v12/p6', 'manual-v12/p6'],
      },
    ],
    [
      1,
      0.3,
      {
        sourceIds: ['manual-v12/p6', 'manual-v12/p6', 'manual-v12/p6', 'bulletin-v13/p2'],
      },
    ],
  ],
);
export function inspectFor(key) {
  return pages.filter((page) => page.text.toLowerCase().includes(key.toLowerCase()));
}
export function visitedFacts(index) {
  return Object.fromEntries(
    pages
      .slice(0, index + 1)
      .filter((page) => page.field)
      .map((page) => [
        page.field,
        {
          value: page.value,
          sourceId: page.id,
        },
      ]),
  );
}
export function boundedSlice(index, limit = 96) {
  const page = pages[index];
  assert(page && page.text.length <= limit, 'Selected page exceeds the toy character cap');
  return {
    text: page.text,
    sourceId: page.id,
    used: page.text.length,
    limit,
  };
}
export function retainedFacts() {
  const required = Object.fromEntries(
    pages.filter((page) => page.field).map((page) => [page.field, page.value]),
  );
  const candidate = {
    condition: required.condition,
  };
  return {
    required,
    candidate,
    missing: Object.keys(required).filter((key) => candidate[key] !== required[key]),
  };
}
export function complete(record) {
  return (
    record !== null &&
    typeof record === 'object' &&
    !Array.isArray(record) &&
    record.ready === true &&
    typeof record.content === 'string' &&
    record.content.trim().length > 0
  );
}
export function budgetTrace(count, events = budgetEvents) {
  const entries = {},
    cap = {
      calls: 4,
      cost: 10,
    };
  let chargedCalls = 0,
    chargedCost = 0;
  for (const event of events.slice(0, count)) {
    if (event.type === 'reserve') {
      assert(!entries[event.id], 'Reservation ID must be unique');
      const admitted =
        chargedCalls + event.calls <= cap.calls && chargedCost + event.cost <= cap.cost;
      entries[event.id] = {
        ...event,
        status: admitted ? 'reserved' : 'queued',
        charged: admitted ? event.cost : 0,
      };
      if (admitted) {
        chargedCalls += event.calls;
        chargedCost += event.cost;
      }
    } else {
      const entry = entries[event.id];
      assert(
        entry && entry.status !== 'queued',
        'Dispatch or reconciliation requires an admitted reservation',
      );
      if (event.type === 'dispatch') {
        assert.equal(entry.status, 'reserved');
        entry.status = 'in flight';
      } else if (event.type === 'timeout') {
        assert.equal(entry.status, 'in flight');
        entry.status = 'unknown';
      } else if (event.type === 'settle') {
        assert(['in flight', 'unknown'].includes(entry.status));
        assert(event.cost >= 0 && event.cost <= entry.cost);
        chargedCost -= entry.charged - event.cost;
        entry.charged = event.cost;
        entry.status = 'settled';
      } else throw new Error('Unknown budget event');
    }
  }
  return {
    entries,
    cap,
    chargedCalls,
    chargedCost,
    availableCalls: cap.calls - chargedCalls,
    availableCost: cap.cost - chargedCost,
  };
}
export function budgetEventCount(state) {
  const fallback = budgetTrack.sample(state).snapshot.count;
  if (state.cueTiming !== 'provider-words' || !state.cues) return fallback;
  const progress = (id) => state.cues[id]?.progress ?? 0;
  if (state.beat >= 2) return budgetEvents.length;
  if (state.beat === 1) {
    if (progress('queued-child') >= 1) return 10;
    if (progress('known-outcome') >= 1) return 9;
    if (progress('known-outcome') >= 0.32) return 8;
    if (progress('known-outcome') > 0) return 7;
    if (progress('timeout-child-a') >= 1) return 6;
    if (progress('admit-child-a') >= 0.55) return 5;
    return progress('admit-child-a') > 0 ? 4 : 3;
  }
  let count = 0;
  if ((state.cues['reserve-root']?.progress ?? 0) > 0) count = 1;
  if ((state.cues['dispatch-root']?.progress ?? 0) > 0) count = 2;
  if (state.cues['settle-root']?.phase === 'after') count = 3;
  return count;
}
export function adjudicate(
  sourceIds,
  claim = {
    scope: 'legacy-token',
    expiry: '2026-09-30',
  },
) {
  const ids = [...new Set(sourceIds)].filter(
    (id) => registry[id]?.applicable && registry[id].scope === claim.scope,
  );
  const records = ids.map((id) => registry[id]);
  const support = records.some((record) => record.expiry === claim.expiry),
    oppose = records.some((record) => record.expiry !== claim.expiry);
  return {
    ids,
    records,
    verdict:
      support && oppose
        ? 'conflict'
        : support
          ? 'supported in fixture'
          : oppose
            ? 'contradicted'
            : 'needs evidence',
  };
}
export function chooseRoute(
  rows = routes,
  limits = {
    recall: 0.9,
    cost: 0.3,
    latency: 12,
  },
) {
  const checked = rows.map((row) => ({
    ...row,
    passes: [
      row.recall >= limits.recall && row.recall <= 1,
      row.cost >= 0 && row.cost <= limits.cost,
      row.latency >= 0 && row.latency <= limits.latency,
    ],
  }));
  const eligible = checked
    .filter(
      (row) =>
        [row.recall, row.cost, row.latency].every(Number.isFinite) && row.passes.every(Boolean),
    )
    .sort((a, b) => a.cost - b.cost || a.latency - b.latency);
  return {
    checked,
    choice: eligible[0]?.id ?? 'HOLD',
  };
}
export function sampleModel(sceneId, state) {
  const beat = state.beat,
    p = state.beatP,
    position = beat + p;
  if (sceneId === 'inspect-source') {
    const { index } = scanTrack.sample(state).snapshot;
    return {
      index,
      facts: visitedFacts(index),
      page: pages[index],
    };
  }
  if (sceneId === 'split-merge')
    return {
      ...treeTrack.sample(state).snapshot,
      inspectMerged: position >= 2,
      ...retainedFacts(),
    };
  if (sceneId === 'completion') {
    const { record } = completionTrack.sample(state).snapshot;
    return {
      record,
      accepted: complete(record),
    };
  }
  if (sceneId === 'shared-budget') return budgetTrace(budgetEventCount(state));
  if (sceneId === 'source-lineage') {
    const { sourceIds } = lineageTrack.sample(state).snapshot;
    return {
      sourceIds,
      ...adjudicate(sourceIds),
    };
  }
  if (sceneId === 'complexity-and-choice') {
    const n = position < 0.3 ? 4 : position < 0.65 ? 8 : 16;
    return {
      screen: position < 1 ? 'growth' : 'routes',
      n,
      scan: n,
      pairs: (n * (n - 1)) / 2,
      ...chooseRoute(),
    };
  }
  if (sceneId === 'external-source')
    return {
      selected: position >= 1,
      ...boundedSlice(5),
    };
  return {
    expiry: pages[5].value,
  };
}
export function validateModel() {
  assert.equal(characterPlan().calls, 31);
  assert.equal(characterPlan().total, 407);
  assert.equal(characterPlan(256).calls, 63);
  assert.throws(() => characterPlan(64), /merge cannot fit/);
  const historyRaw = Array.from(
    {
      length: 20,
    },
    (_, i) => 'incident log line ' + i,
  ).join('\n');
  assert.equal(historyRaw.length, 409);
  assert.equal(previewForHistory(historyRaw).length, 40);
  for (let n = 0; n < 50; n++) assert(previewForHistory(historyRaw, n).length <= n);
  assert.equal(characterPlan(512).minimumMerge, 89);
  assert.deepEqual(
    inspectFor('expires').map((page) => page.id),
    ['manual-v12/p6'],
  );
  assert.equal(boundedSlice(4).used, 40);
  assert.deepEqual(
    legacyRuns.jobs.map((date) => compareRun(date, pages[5].value)),
    ['Before expiry', 'After expiry'],
  );
  assert.equal(compareRun('2026-11-12', restoreSummary.expiry), 'After expiry');
  assert.equal(compareRun('2026-11-12', restoreSource.expiry), 'Before expiry');
  assert.equal(compareRun('2026-11-16', restoreSource.expiry), 'After expiry');
  assert.equal(adjudicate(['manual-v12/p6', 'export-note/p2']).verdict, 'supported in fixture');
  assert.equal(chooseRoute(freshRoutes).choice, 'Direct');
  assert.equal(
    chooseRoute(freshRoutes, {
      recall: 0.9,
      cost: 0.2,
      latency: 12,
    }).choice,
    'HOLD',
  );
  assert.deepEqual(
    inspectFor('audit logging').map((page) => page.id),
    ['manual-v12/p5'],
  );
  assert.equal(visitedFacts(4).expiry, undefined);
  assert.equal(visitedFacts(5).expiry.sourceId, 'manual-v12/p6');
  assert.equal(
    sampleModel('inspect-source', {
      beat: 1,
      beatP: 0.579999,
    }).facts.expiry,
    undefined,
  );
  assert.equal(
    sampleModel('inspect-source', {
      beat: 1,
      beatP: 0.58,
    }).facts.expiry.value,
    '2026-09-30',
  );
  assert.throws(() => boundedSlice(5, 10));
  assert.deepEqual(callPlan(8), {
    leafCalls: 8,
    mergeCalls: 7,
    total: 15,
  });
  for (const record of [
    null,
    [],
    'printed',
    {
      ready: 'false',
      content: 'date',
    },
    {
      ready: true,
      content: '',
    },
    {
      ready: true,
      content: 12,
    },
  ])
    assert.equal(complete(record), false);
  assert(
    complete({
      ready: true,
      content: 'candidate',
    }),
  );
  assert.equal(budgetTrace(1).entries.Root.status, 'reserved');
  assert.equal(budgetTrace(2).entries.Root.status, 'in flight');
  assert.equal(budgetTrace(6).entries['Child A'].charged, 3);
  assert.equal(budgetTrace(6).entries['Child A'].status, 'unknown');
  const final = budgetTrace(10);
  assert.equal(final.entries['Child C'].status, 'queued');
  assert.equal(final.availableCalls, 1);
  assert.equal(final.availableCost, 3.5);
  const childA = sampleModel('shared-budget', {
    beat: 1,
    beatP: 0.02,
  });
  assert.equal(childA.entries['Child A'].status, 'reserved');
  assert.equal(childA.entries['Child A'].charged, 3);
  const timedOut = sampleModel('shared-budget', {
    beat: 1,
    beatP: 0.15,
  });
  assert.equal(timedOut.entries['Child A'].status, 'unknown');
  assert.equal(timedOut.entries['Child A'].charged, 3);
  const reconciled = sampleModel('shared-budget', {
    beat: 1,
    beatP: 0.43,
  });
  assert.equal(reconciled.entries['Child B'].status, 'settled');
  assert.equal(reconciled.entries['Child B'].charged, 2);
  const queued = sampleModel('shared-budget', {
    beat: 1,
    beatP: 0.5,
  });
  assert.equal(queued.entries['Child C'].status, 'queued');
  assert.equal(queued.entries['Child C'].charged, 0);
  assert.equal(queued.availableCalls, 1);
  assert.equal(queued.availableCost, 3.5);
  assert.throws(() =>
    budgetTrace(1, [
      {
        type: 'dispatch',
        id: 'unreserved',
      },
    ]),
  );
  for (let count = 0; count <= 10; count++) {
    const s = budgetTrace(count);
    assert(s.chargedCalls <= 4 && s.chargedCost <= 10);
    assert.equal(
      s.chargedCost,
      Object.values(s.entries).reduce((n, row) => n + row.charged, 0),
    );
  }
  assert.equal(adjudicate([]).verdict, 'needs evidence');
  assert.equal(adjudicate(['manual-v12/p6', 'manual-v12/p6']).ids.length, 1);
  for (const [progress, reports] of [
    [0.2, 1],
    [0.4, 2],
    [0.7, 3],
  ]) {
    const lineage = sampleModel('source-lineage', {
      beat: 0,
      beatP: progress,
    });
    assert.equal(lineage.sourceIds.length, reports);
    assert.equal(lineage.ids.length, 1);
  }
  assert.equal(adjudicate(['manual-v11/p6']).verdict, 'needs evidence');
  assert.equal(adjudicate(['bulletin-v13/p2']).verdict, 'contradicted');
  assert.equal(adjudicate(['manual-v12/p6', 'bulletin-v13/p2']).verdict, 'conflict');
  assert.equal(chooseRoute().choice, 'REPL only');
  assert.equal(chooseRoute([routes[0], routes[2]]).choice, 'HOLD');
  for (const tracker of [scanTrack, treeTrack, completionTrack, budgetTrack, lineageTrack])
    for (let beat = 0; beat < 2; beat++)
      assert.deepEqual(
        tracker.sample({
          beat,
          beatP: 1,
        }),
        tracker.sample({
          beat: beat + 1,
          beatP: 0,
        }),
      );
  assert.equal(
    treeTrack.sample({
      beat: 1,
      beatP: 0.71,
    }).snapshot.count,
    15,
  );
  assert.deepEqual(retainedFacts().missing, ['expiry']);
  for (const id of [
    'inspect-source',
    'split-merge',
    'completion',
    'shared-budget',
    'source-lineage',
    'external-source',
    'complexity-and-choice',
  ])
    for (let beat = 0; beat < 2; beat++)
      assert.deepEqual(
        sampleModel(id, {
          beat,
          beatP: 1,
        }),
        sampleModel(id, {
          beat: beat + 1,
          beatP: 0,
        }),
      );
  return true;
}
