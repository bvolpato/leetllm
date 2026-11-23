import { segmentTerms, slimeSentenceWeights } from './fixtures.mjs';
import { clamp, momentumTrace, phase, sum } from './arithmetic.mjs';
import { chooseSlimeCarrier, drainGroups } from './protocols.mjs';
import { progress } from './phrase-clock.mjs';
export function slimeSentenceProgress(id, state, beat, sentence) {
  const weights = slimeSentenceWeights[id]?.[beat];
  if (!weights || weights[sentence] === undefined)
    throw new RangeError(`Unknown slime sentence ${id}/${beat}/${sentence}`);
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const cue = state.cues?.[`sl-${id}-b${beat}-s${sentence}`];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : clamp(cue.progress ?? 0);
  if (state.cues) return 0;
  const before = sum(weights.slice(0, sentence));
  return clamp(((state.beatP ?? 0) * sum(weights) - before) / weights[sentence]);
}
export function sampleSlimeChapter(id, state, scene) {
  if (!slimeSentenceWeights[id]) throw new RangeError(`Unknown slime chapter ${id}`);
  const b = state.beat ?? 0,
    g = (beat, sentence) =>
      scene
        ? progress(scene, state, `sl-${id}-b${beat}-s${sentence}`)
        : slimeSentenceProgress(id, state, beat, sentence),
    done = (beat, sentence) => g(beat, sentence) >= 1;
  const base = {
    id,
    b,
    q: phase(state.beatP ?? 0),
  };
  if (id === 'incident-receipt')
    return {
      ...base,
      patch: g(0, 2),
      rewardReady: done(0, 2),
      altered: b > 0 && done(1, 1),
      receiptCount: b ? 3 : Math.floor(g(0, 3) * 3),
      dated: done(2, 1),
    };
  if (id === 'sample-checks')
    return {
      ...base,
      checks: b === 0 ? Math.floor(g(0, 1) * 5 + g(0, 2)) : 6,
      selected: b ? Math.floor(g(1, 2) * 4) : 0,
      nllReady: done(1, 3),
      mutation: b === 2 ? Math.min(8, Math.floor(g(2, 0) * 9)) : -1,
    };
  if (id === 'native-append') {
    const p = b === 0 ? (g(0, 1) + g(0, 2)) / 2 : g(1, 0),
      count = Math.min(5, Math.floor(p * 5 + 1e-8));
    return {
      ...base,
      count: b > 1 ? 5 : count,
      resultReady: done(1, 3),
      rejected: b === 2 && done(2, 1),
    };
  }
  if (id === 'identity-groups')
    return {
      ...base,
      segments: b ? [2, 1, 3] : [1, 1, 1].map((v, i) => (g(0, Math.min(i, 2)) > 0 ? v : 0)),
      countReady: done(1, 1),
      identityZero: b === 2 && done(2, 1),
    };
  if (id === 'step-denominator') {
    const move = b === 0 ? g(0, 3) : b === 1 ? g(1, 0) : 1,
      split = b === 1 && done(1, 3) ? 1 : move < 1 / 3 ? 1 : move < 2 / 3 ? 2 : 3;
    return {
      ...base,
      split,
      move,
      terms: [1, 3, 5, 7],
      denominator: 4,
      parts: [segmentTerms.slice(0, split), segmentTerms.slice(split)],
      resultReady: done(1, 1),
      derivativeReady: done(1, 2),
      wrongReady: done(1, 3),
      rawReady: done(2, 1),
    };
  }
  if (id === 'bundle-map') {
    const mode = b === 0 ? 0 : b === 1 ? (done(1, 3) ? 2 : done(1, 2) ? 1 : 0) : 2;
    return {
      ...base,
      mode,
      count: [10, 6, 4][mode],
      offset: [4, 0, 4][mode],
      countReady: b === 2 || done(1, mode + 1),
      movement: b ? g(1, mode + 1) : g(0, 1),
      placeholder: b === 2 && done(2, 1),
    };
  }
  if (id === 'router-session')
    return {
      ...base,
      turn: b ? 2 : 1 + Math.min(1, Math.floor(g(0, 2))),
      route: g(b, 0),
      attached: b > 0 && done(1, 1),
      accepted: b === 2 ? Math.min(4, Math.floor(g(2, 1) * 4)) : 0,
    };
  if (id === 'round-boundaries') {
    const changed = (b === 1 && done(1, 2)) || b > 1,
      grade = changed ? 14 : 8,
      elapsed = b === 0 ? g(0, 0) * 12 : b === 1 ? g(1, changed ? 2 : 0) * (grade + 4) : grade + 4;
    return {
      ...base,
      grade,
      elapsed,
      total: grade + 4,
      totalReady: b > 1 || done(1, changed ? 2 : 1),
    };
  }
  if (id === 'async-future')
    return {
      ...base,
      start: g(0, 1),
      wait: g(0, 2),
      knownComplete: done(0, 2),
      background: b ? g(1, 0) : 0,
      update: b > 0 ? g(1, 1) : 0,
      versions: b === 2 && done(2, 1),
    };
  if (id === 'queue-handoff') {
    const groups = [
        {
          id: 'G5',
          index: 5,
        },
        {
          id: 'G2',
          index: 2,
        },
        {
          id: 'G4',
          index: 4,
        },
        {
          id: 'G1',
          index: 1,
        },
        {
          id: 'G3',
          index: 3,
        },
      ],
      p = g(1, 1);
    return {
      ...base,
      ...drainGroups(groups, 2),
      drain: p,
      sort: g(1, 2),
      callback: g(0, 1),
      aborted: g(0, 2),
      dropped: g(0, 3),
      countsReady: done(1, 1),
    };
  }
  if (id === 'sync-dispatch') {
    const mode =
      b === 0 ? (g(0, 1) < 1 ? 0 : g(0, 2) < 1 ? 1 : g(0, 3) < 0.5 ? 2 : 3) : b === 1 ? 2 : 3;
    const inputs = [
      {
        delta: true,
        disk: true,
      },
      {
        disk: true,
      },
      {
        colocated: true,
      },
      {},
    ][Math.max(0, mode)];
    return {
      ...base,
      mode,
      inputs,
      carrier: chooseSlimeCarrier(inputs),
      progress: b === 0 ? g(0, Math.min(3, mode + 1)) : g(b, 0),
      outcomeReady: b === 0 ? (mode < 2 ? done(0, mode + 1) : done(0, 3)) : done(b, 1),
    };
  }
  if (id === 'broadcast-lifecycle')
    return {
      ...base,
      gather: g(0, 1),
      broadcast: g(0, 2),
      postprocess: g(1, 2),
      resume: g(1, 3),
      interrupted: b === 2,
      rebuilt: g(2, 1),
    };
  if (id === 'disk-retention')
    return {
      ...base,
      publish: g(0, 0),
      pull: g(0, 1),
      stages: b ? Math.min(7, Math.floor(g(1, 1) * 7 + 1e-8)) : 0,
      wrongVersion: b === 1 && done(1, 3),
      retain: g(2, 1),
      states: b === 2 ? Math.floor(g(2, 2) * 5) : 0,
    };
  if (id === 'delta-record')
    return {
      ...base,
      bits: b ? Math.floor(g(1, 0) * 8 + 1e-8) : 0,
      xorReady: done(1, 1),
      first: g(1, 2),
      overwrite: b === 2 ? g(2, 0) : 0,
      receipt: g(2, 3),
    };
  if (id === 'agent-hook')
    return {
      ...base,
      hook: g(0, 0),
      scheduler: g(0, 1),
      fields: b ? Math.min(6, Math.floor(g(1, 0) * 6)) : 0,
      graded: done(1, 2),
      completed: done(1, 3),
      observation: g(2, 2),
    };
  if (id === 'application-experiment')
    return {
      ...base,
      receipt: b ? Math.floor(g(1, 0) * 7) : 0,
      intervene: g(1, 1),
      comparable: b > 1 ? false : g(1, 1) === 0,
      proofLayers: b === 2 ? Math.min(3, Math.floor(g(2, 2) * 3)) : 0,
    };
  if (id === 'failure-diagnosis')
    return {
      ...base,
      trace: b === 0 ? g(0, 0) : b === 1 ? g(1, 0) : g(2, 0),
      reveal: b === 0 ? done(0, 1) : b === 1 ? done(1, 1) : done(2, 1),
      localOnly: b === 1 && done(1, 2),
    };
  if (id === 'retained-serving')
    return {
      ...base,
      failure: g(0, 1),
      restored: g(1, 0),
      slots: b ? Math.floor(g(1, 1) * 5) : 0,
      reattach: g(2, 0),
      repartition: g(2, 1),
      rayLost: b === 2 && done(2, 3),
    };
  if (id === 'debug-replay')
    return {
      ...base,
      dump: g(0, 1),
      inspect: g(1, 0),
      trusted: b > 1 || done(1, 2),
      compare: g(2, 0),
      result: done(2, 1),
    };
  if (id === 'project-scope')
    return {
      ...base,
      licence: g(0, 3),
      terms: g(0, 4),
      fix: g(1, 0),
      scope: g(1, 2),
      historic: b === 2,
    };
  if (id === 'source-route')
    return {
      ...base,
      stage:
        b === 0
          ? Math.min(3, Math.floor((g(0, 0) + g(0, 1) + g(0, 2)) * 1.33))
          : b === 1
            ? 3 + Math.floor(g(1, 0) + g(1, 1) + g(1, 2))
            : 6 + Math.min(2, Math.floor(g(2, 0) + g(2, 1))),
      travel: g(b, 0),
    };
  if (id === 'fresh-replay') {
    const start = {
        weight: 2,
        velocity: 0.1,
        step: 20,
      },
      reference = momentumTrace(start, [0.3, -0.4]),
      skipped = momentumTrace(start, [-0.4]);
    const events = ['replay-original-first', 'replay-original-second'].map(
      (key) => state.cues?.[key],
    );
    const replay =
        b !== 2
          ? 0
          : events.every(Boolean)
            ? sum(
                events.map((cue) =>
                  cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : clamp(cue.progress),
                ),
              )
            : g(2, 0) * 2,
      count = Math.floor(replay + 1e-8);
    return {
      ...base,
      start,
      reference,
      skipped,
      replay,
      count,
      current: b === 2 ? reference[Math.min(2, count)] : skipped[0],
      skipReady: done(1, 1),
      firstReady: done(1, 2),
      finalReady: done(1, 3),
      repaired: done(2, 1),
    };
  }
  return base;
}
