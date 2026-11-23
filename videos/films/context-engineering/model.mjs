import {
  COMPLETE_TOOL_POLICY,
  allocations,
  answers,
  questions,
  selectionTrack,
  sources,
  tools,
  tracks,
} from './fixtures.mjs';
import { compressionStage } from './arithmetic.mjs';
import { verifyHandoff } from './handoff.mjs';
import { hash, originalArtifact, originalInputs, receipt, verifyReceipt } from './recovery.mjs';
export function findings(records = sources) {
  const trace = records['trace-17'],
    lock = records['lock-check'];
  const result = [];
  if (trace.status >= 400)
    result.push({
      finding: 'Authentication callback error observed',
      source: 'trace-17',
    });
  if (lock.trace === trace.trace && lock.at === trace.at && lock.locked === false)
    result.push({
      finding: 'Migration lock absent for this trace',
      source: 'lock-check',
    });
  return result;
}
export function selectTools(phase, available = tools) {
  const permitted =
    {
      investigate: ['deploy_lookup', 'trace_lookup'],
      propose: ['runbook_search', 'rollback_advisor'],
    }[phase] ?? [];
  return available.filter((id) => permitted.includes(id));
}
export function evaluatePacket(packet) {
  const rows = questions.map((question) => {
    const answer = packet.includes(question.source) ? answers[question.source] : 'unknown';
    return {
      ...question,
      answer,
      pass: answer === question.expected,
    };
  });
  return {
    rows,
    score: rows.filter((row) => row.pass).length,
    criticalPass: rows.filter((row) => row.critical).every((row) => row.pass),
  };
}
export function recoverySnapshot(progress) {
  const seconds = progress * 19.466;
  const checked = findings()[0];
  const shortened = JSON.parse(
    JSON.stringify({
      finding: checked.finding,
    }),
  );
  const compacted = JSON.parse(
    JSON.stringify({
      finding: shortened.finding,
    }),
  );
  const preserved = JSON.parse(JSON.stringify(checked));
  const stage = seconds < 5 ? 0 : seconds < 8.2 ? 1 : seconds < 10.8 ? 2 : seconds < 14 ? 3 : 4;
  const note = stage === 4 ? preserved : stage >= 2 ? compacted : shortened;
  const requested = stage === 0 ? [] : stage === 4 ? [shortened, preserved] : [shortened];
  const lookups = requested.map((item) =>
    Object.hasOwn(item, 'source') ? (sources[item.source] ?? null) : null,
  );
  const record = lookups.at(-1) ?? null;
  return {
    stage,
    note,
    record,
    attempts: lookups.length,
    answered: record !== null,
  };
}
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot;
  const p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.1) / 0.65));
  if (id === 'select') {
    const cue = state.cues?.['select-proposal'];
    const phase =
      step === 1 && cue
        ? cue.phase === 'before'
          ? 'investigate'
          : 'propose'
        : selectionTrack.sample(state).snapshot.phase;
    return {
      step,
      p,
      phase,
      tools: selectTools(phase),
    };
  }
  if (id === 'isolate') {
    const payload = [
      {
        claim: 'auth error',
        source: 'trace-17',
      },
      {
        claim: 'auth error',
        source: 'missing',
      },
      {
        claim: 'trace succeeded',
        source: 'trace-17',
      },
    ][step];
    return {
      step,
      p,
      payload,
      ...verifyHandoff(JSON.stringify(payload)),
    };
  }
  if (id === 'resume') {
    const artifact = step === 2 ? `${originalArtifact} changed` : originalArtifact;
    const inputs = {
      deploy:
        step === 1
          ? JSON.stringify({
              revision: 8,
            })
          : originalInputs.deploy,
    };
    return {
      step,
      p,
      artifactHash: hash(artifact),
      inputHash: hash(inputs.deploy),
      expectedArtifact: receipt.artifact,
      expectedInput: receipt.inputs.deploy,
      ...verifyReceipt(artifact, inputs),
    };
  }
  if (id === 'evaluate') {
    const baseline = evaluatePacket(['D0', 'D1', 'D2', 'D4']);
    const candidate = evaluatePacket(['D0', 'D1', 'D2', 'D3', 'D5']);
    return {
      step,
      p,
      baseline,
      candidate,
      approved: candidate.score >= baseline.score && candidate.criticalPass,
    };
  }
  const verified = findings();
  const wire = JSON.stringify(verified),
    reloaded = JSON.parse(wire);
  const stage = id !== 'compress' ? 3 : compressionStage(step, state.beatP ?? 0);
  const items = allocations.filter(
    (item) =>
      stage === 0 ||
      (stage === 1
        ? item.kind !== 'raw'
        : stage === 2
          ? !['raw', 'unused'].includes(item.kind)
          : ['evidence', 'active', 'findings'].includes(item.kind)),
  );
  const kept = items.reduce((sum, item) => sum + item.units, 0),
    raw = allocations.reduce((sum, item) => sum + item.units, 0);
  const nextRemoval =
    id === 'compress' && step === 2
      ? stage === 1
        ? 'Unused tools'
        : stage === 2
          ? 'Old lock hypothesis'
          : null
      : null;
  return {
    step,
    p,
    stage,
    nextRemoval,
    verified,
    reloaded,
    wire,
    items,
    kept,
    raw,
    removed: raw - kept,
  };
}
export function completeToolIntersection(phase, available = tools) {
  return [...new Set(available)]
    .filter((id) => (COMPLETE_TOOL_POLICY[phase] ?? []).includes(id))
    .sort();
}
