import { SEARCH_TEXT, exception, policy } from './fixtures.mjs';
import {
  clamp,
  fuse,
  mix,
  motion,
  searchWords,
  sourceDigest,
  sum,
  wordCount,
} from './arithmetic.mjs';
import { tracks } from './construction.mjs';
import assert from 'node:assert/strict';
export function apply(events) {
  let state = 'PENDING',
    emitted = 0;
  const seen = new Set();
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    if (event.draft !== 2 || event.revision !== 2 || state !== 'PENDING') continue;
    state = event.accept ? 'CHECKED' : 'BLOCKED';
    if (event.accept) emitted++;
  }
  return {
    state,
    emitted,
  };
}
export function publicationTeachingState(step, progress, cues) {
  const acceptance = cues?.['publish-current-accept'],
    replay = cues?.['publish-replayed-event'];
  const accepted = step > 0 && (acceptance ? acceptance.phase !== 'before' : progress >= 0.45);
  const replayed = accepted && (replay ? replay.phase !== 'before' : progress >= 0.45);
  const stale = {
      id: 1,
      draft: 1,
      revision: 1,
      accept: true,
    },
    current = {
      id: 2,
      draft: 2,
      revision: 2,
      accept: true,
    };
  const events = [
    stale,
    ...(accepted ? [current] : []),
    ...(replayed
      ? [
          {
            ...current,
          },
        ]
      : []),
  ];
  return {
    accepted,
    replayed,
    events,
    ...apply(events),
  };
}
export function fusionTeachingState(step, progress, cues) {
  const addition = cues?.['fusion-beat-1-focus-1'],
    rewrite = cues?.['fusion-beat-2-focus-2'];
  const phraseProgress = (cue, fallback) =>
    cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
  const rewritten = step > 0 && (!rewrite || rewrite.phase !== 'before');
  const lists = [
    ['Policy', 'Exception'],
    ['Exception', 'Policy'],
    ['Exception', 'Policy'],
  ].slice(0, rewritten ? 3 : 2);
  const inputs = lists.flatMap((list, branch) =>
    list.map((doc, rank) => ({
      doc,
      branch,
      rank: rank + 1,
      value: 1 / (61 + rank),
    })),
  );
  const count =
    step === 0
      ? addition
        ? Math.ceil(4 * phraseProgress(addition, progress))
        : Math.min(4, Math.floor(progress * 5))
      : step === 1
        ? 4 +
          (rewrite
            ? Math.ceil(2 * phraseProgress(rewrite, progress))
            : Math.min(2, Math.floor(progress * 3)))
        : 6;
  const active = inputs.slice(0, count),
    scores = {
      Policy: 0,
      Exception: 0,
    };
  for (const row of active) scores[row.doc] += row.value;
  return {
    lists,
    inputs,
    active,
    scores,
    count,
  };
}
export function capacityTrace(beat, progress) {
  const seconds = progress * [22.106, 24.578][beat],
    phase = (a, b) => clamp((seconds - a) / (b - a)),
    time =
      seconds < 3.49
        ? 0.37 * phase(0.7, 3.49)
        : seconds < 7.85
          ? 0.37 + 1.93 * phase(3.49, 7.85)
          : 2.3 + 0.2 * phase(7.85, 8.6);
  const bytesPerPosition = 2 * 32 * 8 * 128 * 2,
    resident = 600 * 1.93,
    gib = (resident * 1560 * bytesPerPosition) / 2 ** 30;
  return {
    seconds,
    time,
    kvLive: time >= 0.37 && time < 2.3,
    inflight: 1500 * phase(9.18, 11.4),
    resident: 1158 * phase(10.43, 12.7),
    factors: [0.1, 1.93, 2.99, 3.96, 4.59].map((at) => seconds >= at),
    bytesPerPosition,
    gib,
    positionCount: seconds >= 6.5,
    memoryReady: seconds >= 8.7,
    decodeReady: seconds >= 10.94,
    memoryDevices: Math.ceil(gib / 12),
    decodeDevices: Math.ceil((600 * 120) / 6000),
  };
}
export function capacityTeachingState(beat, progress, cues) {
  const state = capacityTrace(beat, progress),
    comparison = cues?.['capacity-beat-2-focus-1'];
  if (beat === 1 && comparison) {
    const comparing = comparison.phase !== 'before';
    state.memoryReady = comparing;
    state.decodeReady = comparing;
  }
  return state;
}
export function economicsTrace(beat, progress) {
  const seconds = progress * [19.754, 25.034][beat],
    routes = sampleModel('economics', {
      beat: 0,
      beatP: 0,
    }).routes;
  const shares = routes.map((row, i) =>
    beat > 0 ? row.share : row.share * clamp((seconds - (6.67 + i * 0.75)) / 1.2),
  );
  const contributions = routes.map((row, i) => row.cost * shares[i]);
  return {
    seconds,
    routes,
    shares,
    contributions,
    mean: sum(contributions),
    complete: beat > 0 || seconds >= 10.5,
    checks: beat > 0 ? [1.5, 2.65, 4.45].map((at) => seconds >= at) : [false, false, false],
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      policy,
      exception,
    };
  if (id === 'eligible')
    return {
      step,
      q,
      filtered: step > 0,
      selected:
        step === 0 ? ['Private roadmap', 'Obsolete policy@1'] : ['Current policy@2', 'Exception@1'],
    };
  if (id === 'fusion')
    return {
      step,
      q,
      ...fusionTeachingState(step, q, state.cues),
    };
  if (id === 'packing') {
    const budget = step === 0 ? 18 : wordCount(exception) + wordCount(policy),
      passages = [
        {
          id: 'Exception',
          text: exception,
        },
        {
          id: 'Policy',
          text: policy,
        },
      ],
      selected = [];
    let used = 0;
    for (const row of passages) {
      const words = wordCount(row.text);
      if (used + words <= budget) {
        selected.push({
          ...row,
          words,
        });
        used += words;
      }
    }
    return {
      step,
      q,
      budget,
      selected,
      used,
      complete: selected.length === 2,
    };
  }
  if (id === 'publish')
    return {
      step,
      q,
      ...publicationTeachingState(step, q, state.cues),
    };
  if (id === 'latency') {
    const p = clamp(state.beatP / 0.25),
      finish = p * p * (3 - 2 * p);
    return {
      step,
      q,
      time: step === 0 ? 800 * q : step === 1 ? 800 + 180 * finish : 980,
    };
  }
  if (id === 'capacity') {
    const qps = 600,
      resident = qps * 1.93,
      inflight = qps * 2.5,
      bytesPerPosition = 2 * 32 * 8 * 128 * 2,
      gib = (resident * 1560 * bytesPerPosition) / 2 ** 30;
    return {
      step,
      q,
      resident,
      inflight,
      gib,
      memoryDevices: Math.ceil(gib / 12),
      decodeDevices: Math.ceil((qps * 120) / 6000),
    };
  }
  const routes = [
      {
        name: 'Full synthesis',
        share: 0.6,
        cost: 0.0097,
      },
      {
        name: 'Valid answer cache',
        share: 0.3,
        cost: 0.0003,
      },
      {
        name: 'Structured lookup',
        share: 0.1,
        cost: 0.001,
      },
    ],
    mean = sum(routes.map((r) => r.share * r.cost));
  return {
    step,
    q,
    routes,
    mean,
  };
}
export function validateOriginalModel() {
  assert.equal(capacityTrace(0, 3 / 22.106).kvLive, false);
  assert.equal(capacityTrace(0, 5 / 22.106).kvLive, true);
  assert.equal(capacityTrace(0, 8.1 / 22.106).kvLive, false);
  assert.equal(capacityTrace(1, 1).bytesPerPosition, 131072);
  assert.equal(capacityTrace(0, 1).resident, 1158);
  assert(Math.abs(economicsTrace(0, 1).mean - 0.00601) < 1e-12);
  assert.equal(wordCount(policy), 12);
  assert.equal(wordCount(exception), 15);
  assert.equal(
    sampleModel('packing', {
      beat: 0,
      beatP: 0.5,
    }).complete,
    false,
  );
  assert.equal(
    sampleModel('packing', {
      beat: 1,
      beatP: 0.5,
    }).used,
    27,
  );
  assert.deepEqual(fuse([['A', 'A', 'B']]), fuse([['A', 'B']]));
  assert.equal(
    apply([
      {
        id: 1,
        draft: 1,
        revision: 1,
        accept: true,
      },
    ]).state,
    'PENDING',
  );
  assert.equal(
    apply([
      {
        id: 2,
        draft: 2,
        revision: 2,
        accept: true,
      },
      {
        id: 2,
        draft: 2,
        revision: 2,
        accept: true,
      },
    ]).emitted,
    1,
  );
  for (const p of [0, 0.25, 0.5, 0.75, 0.99]) {
    const f = sampleModel('fusion', {
      beat: 1,
      beatP: p,
    });
    for (const doc of ['Policy', 'Exception'])
      assert.equal(
        f.scores[doc],
        f.active.filter((row) => row.doc === doc).reduce((a, row) => a + row.value, 0),
      );
  }
  for (const phase of ['before', 'during', 'after']) {
    const bound = capacityTeachingState(1, 9.4 / 24.578, {
      'capacity-beat-2-focus-1': {
        phase,
      },
    });
    assert.equal(bound.memoryReady, phase !== 'before');
    assert.equal(bound.decodeReady, phase !== 'before');
    assert.equal(bound.memoryDevices, Math.ceil(bound.gib / 12));
    assert.equal(bound.memoryDevices, 19);
    assert.equal(bound.decodeDevices, Math.ceil((600 * 120) / 6000));
    assert.equal(bound.decodeDevices, 12);
  }
  for (const [acceptance, replay, emitted, receipts] of [
    ['before', 'before', 0, 1],
    ['during', 'before', 1, 2],
    ['after', 'during', 1, 3],
    ['after', 'after', 1, 3],
  ]) {
    const published = publicationTeachingState(1, 0, {
      'publish-current-accept': {
        phase: acceptance,
      },
      'publish-replayed-event': {
        phase: replay,
      },
    });
    assert.equal(published.emitted, emitted);
    assert.equal(published.events.length, receipts);
    assert.equal(published.state, emitted ? 'CHECKED' : 'PENDING');
    if (published.replayed) assert.deepEqual(published.events[1], published.events[2]);
  }
  for (const [phase, progress, count] of [
    ['before', 0, 4],
    ['during', 0.5, 5],
    ['after', 1, 6],
  ]) {
    const fused = fusionTeachingState(1, 0, {
      'fusion-beat-2-focus-2': {
        phase,
        progress,
      },
    });
    assert.equal(fused.count, count);
    assert.equal(fused.lists.length, phase === 'before' ? 2 : 3);
    for (const doc of ['Policy', 'Exception'])
      assert.equal(
        fused.scores[doc],
        fused.active.filter((row) => row.doc === doc).reduce((a, row) => a + row.value, 0),
      );
    assert.equal(fused.scores.Exception > fused.scores.Policy, phase !== 'before');
  }
  const c = sampleModel('capacity', {
    beat: 0,
    beatP: 0.5,
  });
  assert.equal(c.inflight, 1500);
  assert.equal(c.resident, 1158);
  assert.equal(c.memoryDevices, 19);
  assert.equal(c.decodeDevices, 12);
  assert(
    Math.abs(
      sampleModel('economics', {
        beat: 0,
        beatP: 0.5,
      }).mean - 0.00601,
    ) < 1e-12,
  );
  assert.equal(
    sampleModel('latency', {
      beat: 0,
      beatP: 0.99,
    }).time,
    800,
  );
  assert.equal(
    sampleModel('latency', {
      beat: 1,
      beatP: 0,
    }).time,
    800,
  );
  const checking = sampleModel('latency', {
    beat: 1,
    beatP: 0.1,
  }).time;
  assert(checking > 800 && checking < 980);
  assert.equal(
    sampleModel('latency', {
      beat: 1,
      beatP: 0.3,
    }).time,
    980,
  );
  return true;
}
export function lexicalScores(query, documents) {
  const counts = documents.map((d) => {
      const c = {};
      for (const word of searchWords(d.text)) c[word] = (c[word] ?? 0) + 1;
      return c;
    }),
    lengths = counts.map((c) => sum(Object.values(c))),
    average = sum(lengths) / counts.length;
  return documents.map((d, i) => {
    const terms = [...new Set(searchWords(query))].map((term) => {
      const df = counts.filter((c) => c[term]).length,
        tf = counts[i][term] ?? 0,
        idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5)),
        den = tf + 1.2 * (0.25 + (0.75 * lengths[i]) / average);
      return {
        term,
        df,
        tf,
        idf,
        den,
        value: (idf * tf * 2.2) / den,
      };
    });
    return {
      ...d,
      terms,
      length: lengths[i],
      score: sum(terms.map((t) => t.value)),
    };
  });
}
export function strictPublication(events) {
  let status = 'pending',
    emitted = 0;
  const seen = new Set();
  const decisions = [];
  for (const event of events) {
    let reason;
    if (
      !Number.isInteger(event.id) ||
      event.id < 0 ||
      !Number.isInteger(event.revision) ||
      event.revision < 0 ||
      typeof event.accepted !== 'boolean'
    )
      reason = 'malformed';
    else if (event.request !== 'request-a') reason = 'wrong request';
    else if (seen.has(event.id)) reason = 'duplicate';
    else {
      seen.add(event.id);
      if (event.draft !== 'draft-2' || event.revision !== 2) reason = 'stale';
      else if (status !== 'pending' || event.kind !== 'check') reason = 'inert';
      else {
        status = event.accepted ? 'checked' : 'blocked';
        emitted += Number(event.accepted);
        reason = status;
      }
    }
    decisions.push({
      event,
      reason,
      status,
      emitted,
    });
  }
  return {
    status,
    emitted,
    decisions,
  };
}
export function checkedClocks({
  plan = 40,
  retrieve = 260,
  rerank = 90,
  pack = 20,
  first = 430,
  claim = 100,
  check = 80,
  dependent = false,
} = {}) {
  const begin = dependent ? plan + retrieve : Math.max(plan, retrieve),
    draft = begin + rerank + pack + first;
  return {
    begin,
    draft,
    checked: draft + claim + check,
  };
}
export function searchCapacity() {
  const rate = 600,
    resident = rate * 1.93,
    bytesPerPosition = 2 * 32 * 8 * 128 * 2,
    gib = (resident * 1560 * bytesPerPosition) / 2 ** 30;
  return {
    rate,
    inflight: rate * 2.5,
    resident,
    bytesPerPosition,
    gib,
    memory: Math.ceil(gib / 12),
    decode: Math.ceil((rate * 120) / 6000),
  };
}
export function searchMetrics(ranked, gold, k) {
  if (!(k > 0)) throw Error('K must be positive');
  if (!gold.length)
    return {
      recall: null,
      ndcg: null,
    };
  const unique = [...new Set(ranked)].slice(0, k),
    dcg = sum(unique.map((x, i) => (gold.includes(x) ? 1 / Math.log2(i + 2) : 0))),
    ideal = sum(
      Array.from(
        {
          length: Math.min(k, gold.length),
        },
        (_, i) => 1 / Math.log2(i + 2),
      ),
    );
  return {
    unique,
    recall: unique.filter((x) => gold.includes(x)).length / gold.length,
    dcg,
    ideal,
    ndcg: dcg / ideal,
  };
}
export function quoteReceipt(
  text,
  revision,
  {
    start = 0,
    end = text.length,
    quote = text.slice(start, end),
    current = revision,
    authorized = true,
    published = true,
  } = {},
) {
  return {
    revision,
    start,
    end,
    quote,
    length: text.length,
    current,
    authorized,
    published,
    exact: text.slice(start, end) === quote,
    complete: start === 0 && end === text.length,
    valid:
      authorized &&
      published &&
      current === revision &&
      start === 0 &&
      end === text.length &&
      text.slice(start, end) === quote,
  };
}
export function searchRoutePlan(query) {
  const text = query.toLowerCase().replaceAll('service-account', 'service account'),
    fresh = ['latest', 'current', 'right now'].some((x) => text.includes(x)),
    live = ['build-', 'job status', 'quota remaining'].some((x) => text.includes(x)),
    policy = ['policy', 'migration', 'exception'].some((x) => text.includes(x));
  return {
    routes: [
      ...(live ? ['authorized live API'] : []),
      ...(policy || !live ? ['authorized hybrid search'] : []),
    ],
    current: fresh || policy,
  };
}
export function freshSearchState(stage) {
  const current = {
      policy: 2,
      exception: 2,
    },
    text = stage === 0 ? SEARCH_TEXT.exception : SEARCH_TEXT.fresh,
    revision = stage === 0 ? 1 : 2,
    end = stage === 1 ? text.indexOf(' recorded') : text.length;
  const quotes = [
    {
      id: 'policy',
      ...quoteReceipt(SEARCH_TEXT.policy, 2, {
        current: current.policy,
      }),
      digest: sourceDigest(SEARCH_TEXT.policy),
    },
    {
      id: 'exception',
      ...quoteReceipt(text, revision, {
        end,
        current: current.exception,
      }),
      digest: sourceDigest(text),
    },
  ];
  return {
    current,
    quotes,
    valid: quotes.every((q) => q.valid),
  };
}
export function sharedFleet(progress) {
  const q = clamp(progress),
    workers = Array.from(
      {
        length: 19,
      },
      (_, i) => ({
        id: i,
        x: 180 + (i % 5) * 130,
        y: 535 + Math.floor(i / 5) * 82,
      }),
    ),
    roles = Array.from(
      {
        length: 12,
      },
      (_, i) => ({
        worker: i,
        x: mix(1050 + (i % 5) * 130, workers[i].x, q),
        y: workers[i].y,
      }),
    );
  return {
    workers,
    roles,
    physicalCount: 19,
  };
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(searchWords(SEARCH_TEXT.policy).length, 12);
  assert.equal(searchWords(SEARCH_TEXT.exception).length, 15);
  assert.equal(SEARCH_TEXT.fresh.length, 124);
  assert.equal(quoteReceipt(SEARCH_TEXT.fresh, 2).valid, true);
  assert.equal(
    quoteReceipt(SEARCH_TEXT.fresh, 2, {
      end: SEARCH_TEXT.fresh.indexOf(' recorded'),
    }).valid,
    false,
  );
  assert.equal(
    quoteReceipt(SEARCH_TEXT.exception, 1, {
      current: 2,
    }).valid,
    false,
  );
  assert.equal(checkedClocks().checked, 980);
  assert.equal(
    checkedClocks({
      dependent: true,
    }).draft,
    840,
  );
  assert.equal(searchCapacity().memory, 19);
  assert.equal(searchCapacity().decode, 12);
  assert.equal(
    strictPublication([
      {
        id: 1,
        revision: 2,
        request: 'request-a',
        draft: 'draft-2',
        kind: 'check',
        accepted: 1,
      },
    ]).emitted,
    0,
  );
  assert.equal(searchMetrics(['Policy', 'FAQ'], ['Policy', 'Exception'], 2).recall, 0.5);
  return true;
}
