import { freshAuthorityDecision, localWriteLedger } from './model.mjs';

const request = Object.freeze({
  user: 'user-26',
  candidate: 'C26',
  suite: 'R73',
  target: 'staging',
  operation: 'OP12',
});
const previousGrant = Object.freeze({ ...request, operation: 'OP11' });
const permits = (attempt, grant) => freshAuthorityDecision(attempt, grant) === 'execute';
const firstRun = localWriteLedger([request], previousGrant, permits);

export function promptCueSnapshot(scene, state) {
  const b = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cue = (id) => state.cues?.[id],
    P = (id) => {
      const c = cue(id);
      return c ? (c.phase === 'before' ? 0 : c.phase === 'after' ? 1 : c.progress) : p;
    },
    D = (id, fallback = false) => {
      const c = cue(id);
      return c ? c.phase === 'after' : fallback;
    };
  const progress = P('pi-' + scene + '-' + b),
    freshMatching = D('pi-fresh-matching', b > 2 || (b === 2 && p > 0.35)),
    freshOne = D('pi-fresh-one', b > 2 || (b === 2 && p > 0.55)),
    freshReplay = D('pi-fresh-replay', b > 2 || (b === 2 && p > 0.85));
  const approval = freshMatching ? request : previousGrant;
  const decision = freshAuthorityDecision(request, approval);
  const attempts = freshReplay ? [request, request] : freshOne ? [request] : [];
  const ledger = localWriteLedger(attempts, approval, permits);
  return {
    b,
    p,
    progress,
    P,
    D,
    fresh: {
      request,
      approval,
      firstRun,
      storeApproval: ledger.approval,
      decision,
      zeroVisible: D('pi-fresh-zero', b > 0),
      matching: freshMatching,
      effectsVisible: freshOne,
      effects: ledger.entries.length,
      entries: ledger.entries,
      added: ledger.added,
      replay: freshReplay,
      replayDecision: freshAuthorityDecision(request, ledger.approval),
    },
  };
}
