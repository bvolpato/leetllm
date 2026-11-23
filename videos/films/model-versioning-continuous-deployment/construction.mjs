import { bucket, clamp, motion } from './arithmetic.mjs';
import { CUES, canaryConversation, ids, promptBytes, stableConversation } from './fixtures.mjs';
import {
  CANDIDATE,
  STABLE,
  authorize,
  candidate,
  corrected,
  enqueue,
  liveGate,
  liveInventory,
  offlineGate,
  readiness,
  recoveryReady,
  registry,
  releaseId,
  report,
  route,
  stable,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          beat: 0,
        },
      },
      cues: Array.from(
        {
          length: id === 'live' ? 3 : 2,
        },
        (_, beat) => ({
          id: id + '-' + beat,
          beat,
          at: 0,
          snapshot: {
            beat,
          },
        }),
      ),
    }),
  ]),
);
export function presentationCue(id, beat, progress) {
  const elapsed = clamp(progress) * CUES[id].span;
  if (id === 'identity')
    return {
      edited: beat > 0 && elapsed >= CUES.identity.edit,
    };
  if (id === 'registry')
    return {
      promote: beat > 0 && elapsed >= CUES.registry.promote,
      restore: beat > 0 && elapsed >= CUES.registry.restore,
      stale: beat > 0 && elapsed >= CUES.registry.stale,
    };
  return {
    stage:
      beat === 1 ? (elapsed < CUES.live.experience ? 0 : elapsed < CUES.live.useful ? 1 : 2) : 0,
    decisionVisible: beat !== 1 || elapsed >= CUES.live.decision,
  };
}
export function stickySnapshot(beat, p) {
  const assignments = new Map(),
    q = clamp((p - 0.04) / 0.2),
    threshold = beat ? 10 + Math.round(90 * q * q * (3 - 2 * q)) : 10,
    turns = beat ? 3 : Math.max(1, Math.ceil(3 * motion(p)));
  for (let turn = 0; turn < turns; turn++) {
    route(stableConversation, 10, assignments);
    route(canaryConversation, 10, assignments);
  }
  if (beat) route(stableConversation, threshold, assignments);
  if (beat && p >= 0.34) route('new-thread', threshold, assignments);
  return {
    threshold,
    turns,
    assignments: [...assignments].map(([id, target]) => ({
      id,
      bucket: bucket(id),
      target,
    })),
  };
}
export function sampleModel(id, state) {
  const { beat } = tracks[id].sample(state).snapshot,
    q = motion(beat > state.beat ? 0 : state.beatP),
    base = {
      beat,
      q,
    };
  if (id === 'identity') {
    const { edited } = presentationCue(id, beat, state.beatP),
      current = edited ? corrected : candidate;
    return {
      ...base,
      edited,
      stable,
      candidate: current,
      currentId: releaseId(current),
      stableId: STABLE,
      originalCandidate: CANDIDATE,
      promptBytes: promptBytes[edited ? 2 : 1],
    };
  }
  if (id === 'registry') {
    const r = registry(),
      cue = presentationCue(id, beat, state.beatP);
    let error = null;
    if (beat) {
      const original = {
        ...r.aliases.get('production'),
      };
      if (cue.promote) r.move('production', CANDIDATE, original);
      if (cue.restore) r.move('production', STABLE, r.aliases.get('production'));
      if (cue.stale)
        try {
          r.move('production', CANDIDATE, original);
        } catch (e) {
          error = e.message.split('\n')[0];
        }
    }
    return {
      ...base,
      records: r.records.size,
      aliases: Object.fromEntries(r.aliases),
      events: r.events,
      error,
    };
  }
  if (id === 'offline') {
    const evidence = {
      ...report,
      evaluator: beat === 0 ? report.evaluator : 'claim-eval-v3',
    };
    return {
      ...base,
      evidence,
      ...offlineGate(evidence),
    };
  }
  if (id === 'shadow') {
    const requests = Array.from(
        {
          length: 3,
        },
        (_, i) => ({
          id: 'shadow-' + (i + 1),
          tool: 'read policy',
        }),
      ),
      submitted = beat ? Math.floor(clamp((state.beatP - 0.04) / 0.24) * 3) : 0,
      queue = enqueue(requests.slice(0, submitted));
    return {
      ...base,
      submitted,
      checks: [
        {
          tool: 'read policy',
          allowed: authorize('read policy'),
        },
        {
          tool: 'deploy application',
          allowed: authorize('deploy application'),
        },
      ],
      ...queue,
      visible: false,
    };
  }
  if (id === 'sticky')
    return {
      ...base,
      ...stickySnapshot(beat, state.beatP),
    };
  if (id === 'live') {
    const kind = ['incomplete', 'complete', 'unsafe'][beat],
      rows = liveInventory(kind);
    return {
      ...base,
      kind,
      first: rows[0].id,
      last: rows.at(-1).id,
      ...presentationCue(id, beat, state.beatP),
      ...liveGate(rows),
    };
  }
  if (id === 'recovery') {
    const promoted = beat > 0,
      r = registry(promoted ? STABLE : CANDIDATE);
    const promotionApplied = promoted && q >= 0.02;
    if (promotionApplied) r.move('production', CANDIDATE, r.aliases.get('production'));
    const failure = q >= (promoted ? 0.15 : 0.25),
      recovered = q >= (promoted ? 0.4 : 0.55),
      aborted = new Set();
    if (failure) aborted.add(CANDIDATE);
    if (recovered)
      r.move(
        promoted ? 'production' : 'canary',
        STABLE,
        r.aliases.get(promoted ? 'production' : 'canary'),
      );
    const assignments = new Map([[canaryConversation, CANDIDATE]]),
      assigned = recovered
        ? route(canaryConversation, 0, assignments, aborted)
        : promoted && !promotionApplied
          ? STABLE
          : CANDIDATE;
    return {
      ...base,
      promoted,
      promotionApplied,
      failure,
      recovered,
      assigned,
      exposure: failure ? 0 : promoted ? (promotionApplied ? 100 : 0) : 10,
      aliases: Object.fromEntries(r.aliases),
      events: r.events,
      aborted,
      kind: promoted ? 'Production rollback drill' : 'Canary abort drill',
    };
  }
  if (id === 'capacity') {
    const receipt = readiness[beat ? 1 : 0];
    return {
      ...base,
      receipt,
      ready: recoveryReady(receipt),
      gap: Math.max(0, receipt.demand - receipt.capacity),
      accepted: Math.min(receipt.capacity, receipt.demand),
    };
  }
  return {
    ...base,
    stableId: STABLE,
    candidateId: CANDIDATE,
  };
}
