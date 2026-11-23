import { bounded } from './arithmetic.mjs';
import { BASE, GRADIENT_CONTRIBUTIONS, SHARDS } from './fixtures.mjs';
export function perRank(stage, devices = 4) {
  if (![0, 1, 2, 3].includes(stage) || !Number.isInteger(devices) || devices < 1)
    throw new RangeError('invalid stage or device count');
  return {
    weights: stage >= 3 ? BASE.weights / devices : BASE.weights,
    gradients: stage >= 2 ? BASE.gradients / devices : BASE.gradients,
    optimizer: stage >= 1 ? BASE.optimizer / devices : BASE.optimizer,
  };
}
export function pipelineVisibleTicks(progress, ticks) {
  if (!Number.isInteger(ticks) || ticks < 1)
    throw new RangeError('positive integer tick count required');
  return Math.min(ticks, Math.floor(bounded(progress) * ticks) + 1);
}
export function contextAttentionConstruction(progress) {
  const update = bounded(progress),
    mass = 1 + 3 * update,
    weighted = 2 + 30 * update;
  return {
    update,
    mass,
    weighted,
    output: weighted / mass,
    complete: update === 1,
  };
}
export function reduceScatter(contributions = GRADIENT_CONTRIBUTIONS) {
  if (
    contributions.length !== 4 ||
    contributions.some((row) => row.length !== 4 || row.some((x) => !Number.isFinite(x)))
  )
    throw new RangeError('four finite four-shard contributions required');
  return SHARDS.map((_, column) => contributions.reduce((sum, row) => sum + row[column], 0));
}
export function parameterSyncPosition(rank, shard, progress) {
  const q = bounded(progress * 4 - rank),
    sourceX = 1210 + shard * 155,
    targetY = 700 + rank * 65;
  const outward = bounded(q / 0.18),
    descent = bounded((q - 0.18) / 0.64),
    inward = bounded((q - 0.82) / 0.18);
  return {
    x: sourceX + 65 * (outward - inward),
    y: 465 + (targetY - 465) * descent,
    visible: q > 0,
    settled: q === 1,
  };
}
export function stageSnapshot(stage, beat, progress) {
  const spans =
      stage === 0
        ? [19.366, 11.158, 18.654]
        : stage === 1
          ? [18.742, 11.398, 9.342]
          : stage === 2
            ? [9.91, 9.598, 13.11]
            : [11.35, 17.686, 10.566],
    seconds = bounded(progress) * spans[beat];
  const q =
    beat > 0
      ? 1
      : bounded((seconds - [0, 1.7375, 1.2125, 1.45][stage]) / [1, 2.8, 2.3, 3.25][stage]);
  const prior = stage
      ? perRank(stage - 1)
      : {
          weights: 0,
          gradients: 0,
          optimizer: 0,
        },
    target = perRank(stage);
  const current = Object.fromEntries(
    Object.keys(BASE).map((name) => [
      name,
      stage === 0
        ? BASE[name] *
          bounded(
            (seconds -
              {
                weights: 1.875,
                gradients: 3.3125,
                optimizer: 4.7375,
              }[name]) /
              0.7,
          )
        : prior[name] + (target[name] - prior[name]) * q,
    ]),
  );
  if (stage === 0 && beat > 0) Object.assign(current, BASE);
  return {
    seconds,
    q,
    current,
    total: Object.values(current).reduce((a, v) => a + v, 0),
  };
}
export function capacitySnapshot(beat, progress) {
  const seconds = bounded(progress) * [21.07, 12.838, 20.19][beat],
    recompute = beat > 0 ? 1 : bounded((seconds - 15.8125) / 3.5),
    production = beat > 1 ? 1 : beat === 1 ? bounded((seconds - 10.9625) / 0.85) : 0;
  const activation =
      (3 - 1.5 * recompute + 3 * production) * (beat > 0 ? 1 : bounded((seconds - 8.025) / 0.7)),
    gather = 1.5 * (beat > 0 ? 1 : bounded((seconds - 9.95) / 0.7)),
    workspace = 0.5 * (beat > 0 ? 1 : bounded((seconds - 10.65) / 0.6)),
    peak = 2 + activation + gather + workspace,
    capacity = 6;
  return {
    seconds,
    recompute,
    production,
    parts: [activation, gather, workspace],
    peak,
    capacity,
    fits: peak <= capacity,
    stepMs: 80 + 14 * recompute + 36 * production,
  };
}
export function recipeLedger(parametersB = 70, ranks = 16, stage = 3) {
  if (!(parametersB > 0) || !Number.isInteger(ranks) || ranks < 1 || ![0, 1, 2, 3].includes(stage))
    throw new RangeError('positive recipe and valid shard group required');
  const full = {
    weights: 2 * parametersB,
    gradients: 2 * parametersB,
    optimizer: 12 * parametersB,
  };
  const parts = {
    weights: full.weights / (stage >= 3 ? ranks : 1),
    gradients: full.gradients / (stage >= 2 ? ranks : 1),
    optimizer: full.optimizer / (stage >= 1 ? ranks : 1),
  };
  return {
    full,
    parts,
    total: Object.values(parts).reduce((a, b) => a + b, 0),
  };
}
export function adamContinuation() {
  let m = 0,
    v = 0;
  const states = [];
  [1, 1, -1].forEach((g, i) => {
    m = 0.5 * m + 0.5 * g;
    v = 0.5 * v + 0.5 * g * g;
    states.push({
      g,
      m,
      v,
      step: i + 1,
      delta: (-0.1 * (m / (1 - 0.5 ** (i + 1)))) / Math.sqrt(v / (1 - 0.5 ** (i + 1))),
    });
  });
  return {
    states,
    resumed: states[2].delta,
    reset: 0.1,
  };
}
export function pipelineSchedule(stages = 4, microbatches = 8, oneFOneB = true) {
  const seq = Array.from(
    {
      length: stages,
    },
    (_, i) => {
      if (!oneFOneB)
        return [
          ...Array.from(
            {
              length: microbatches,
            },
            (_, j) => ['F', j],
          ),
          ...Array.from(
            {
              length: microbatches,
            },
            (_, j) => ['B', j],
          ),
        ];
      const warm = Math.min(microbatches, stages - i - 1),
        out = Array.from(
          {
            length: warm,
          },
          (_, j) => ['F', j],
        );
      for (let j = 0; j < microbatches - warm; j++) out.push(['F', warm + j], ['B', j]);
      for (let j = microbatches - warm; j < microbatches; j++) out.push(['B', j]);
      return out;
    },
  );
  const idx = Array(stages).fill(0),
    done = new Set(),
    events = [],
    live = Array(stages).fill(0),
    maxLive = Array(stages).fill(0);
  let tick = 0;
  while (idx.some((i) => i < 2 * microbatches)) {
    const ready = [];
    for (let i = 0; i < stages; i++) {
      const op = seq[i][idx[i]];
      if (!op) continue;
      const [k, j] = op;
      if (k === 'F' && (i === 0 || done.has('F:' + (i - 1) + ':' + j)))
        ready.push({
          stage: i,
          kind: k,
          microbatch: j,
          tick,
        });
      if (
        k === 'B' &&
        done.has('F:' + i + ':' + j) &&
        (i === stages - 1 || done.has('B:' + (i + 1) + ':' + j))
      )
        ready.push({
          stage: i,
          kind: k,
          microbatch: j,
          tick,
        });
    }
    if (!ready.length) throw new Error('pipeline dependency deadlock');
    for (const e of ready) {
      idx[e.stage]++;
      done.add(e.kind + ':' + e.stage + ':' + e.microbatch);
      live[e.stage] += e.kind === 'F' ? 1 : -1;
      maxLive[e.stage] = Math.max(maxLive[e.stage], live[e.stage]);
      events.push({
        ...e,
        live: live[e.stage],
      });
    }
    if (++tick > 1000) throw new Error('unbounded pipeline');
  }
  return {
    events,
    ticks: tick,
    maxLive,
    warmup: Array.from(
      {
        length: stages,
      },
      (_, i) => Math.min(microbatches, stages - i - 1),
    ),
    idle: (stages - 1) / (microbatches + stages - 1),
  };
}
export function onlineAttention(
  blocks = [
    {
      score: 0,
      value: 2,
    },
    {
      score: Math.log(3),
      value: 10,
    },
  ],
) {
  let maximum = -Infinity,
    mass = 0,
    weighted = 0;
  return blocks.map((block) => {
    const next = Math.max(maximum, block.score),
      old = maximum === -Infinity ? 0 : Math.exp(maximum - next),
      fresh = Math.exp(block.score - next);
    mass = mass * old + fresh;
    weighted = weighted * old + fresh * block.value;
    maximum = next;
    return {
      maximum,
      mass,
      weighted,
      output: weighted / mass,
    };
  });
}
