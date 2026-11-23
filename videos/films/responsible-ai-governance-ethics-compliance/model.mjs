import { digest, phase, sum } from './arithmetic.mjs';
import {
  evidenceNames,
  manifest,
  originalEvents,
  ownershipEstimateAt,
  ownershipEvidenceAt,
  proposal,
  tracks,
  workflows,
} from './fixtures.mjs';
import { cueProgress, governancePermission } from './construction.mjs';
import { createHmac } from 'node:crypto';
export function triage(flags) {
  if (
    !Array.isArray(flags) ||
    flags.length !== 4 ||
    Array.from(flags).some((value) => typeof value !== 'boolean')
  )
    return 'Facts review';
  if (flags[0] || flags[1]) return 'Specialized risk review';
  if (flags[2] || flags[3]) return 'Interaction + effect review';
  return 'Baseline review';
}
export function riskErrors(row, asOf = '2026-11-06') {
  const errors = ['owner', 'control', 'residual'].filter(
    (key) => typeof row[key] !== 'string' || !row[key].trim(),
  );
  if (
    !Array.isArray(row.evidence) ||
    !row.evidence.length ||
    row.evidence.some((x) => typeof x !== 'string' || !x.trim())
  )
    errors.push('evidence');
  const date =
    typeof row.reviewDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.reviewDate)
      ? Date.parse(row.reviewDate + 'T00:00:00.000Z')
      : NaN;
  const valid =
    Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === row.reviewDate;
  if (!valid) errors.push('valid review date');
  else if (row.reviewDate <= asOf) errors.push('review due');
  if (!row.reviewDate)
    errors.splice(
      errors.indexOf('evidence') < 0 ? errors.length : errors.indexOf('evidence'),
      0,
      'reviewDate',
    );
  return errors;
}
export function ownershipSnapshot(beat, progress) {
  const evidenceAttached = beat > 1 || (beat === 1 && progress >= ownershipEvidenceAt);
  const residual =
    beat > 1 || (beat === 1 && progress >= ownershipEstimateAt)
      ? {
          likelihood: 2,
          impact: 5,
        }
      : null;
  const inherent = {
    likelihood: 4,
    impact: 5,
  };
  const row = {
    owner: 'Release owner',
    control: 'Authorization G7',
    evidence: evidenceAttached ? ['Attack report A7', 'Replay R7'] : [],
    residual: residual ? 'Reviewed likelihood 2 / impact 5' : null,
    reviewDate: '2026-12-01',
  };
  return {
    row,
    errors: riskErrors(row),
    inherent,
    residual,
    inherentScore: inherent.likelihood * inherent.impact,
    residualScore: residual ? residual.likelihood * residual.impact : null,
  };
}
export function evaluate(attacks, benign) {
  const complete = (values) =>
      Array.isArray(values) &&
      values.length > 0 &&
      Array.from(values).every((value) => typeof value === 'boolean'),
    asr = complete(attacks) ? sum(attacks.map(Number)) / attacks.length : null,
    frr = complete(benign) ? sum(benign.map(Number)) / benign.length : null,
    reasons = [];
  if (asr === null || frr === null) reasons.push('Coverage incomplete');
  if (Array.isArray(attacks) && attacks.some((value) => value === true))
    reasons.push('Forbidden effect');
  if (frr !== null && frr > 0.1) reasons.push('Legitimate friction');
  return {
    asr,
    frr,
    reasons,
    ready: !reasons.length,
  };
}
export function chain(events) {
  let previous = 'GENESIS';
  return events.map((event) => {
    const item = {
      event: event.event,
      value: event.value,
      previous,
    };
    const hash = digest(item);
    previous = hash;
    return {
      ...item,
      hash,
    };
  });
}
export function verify(events, anchor) {
  let previous = 'GENESIS';
  for (const event of events) {
    if (
      event.previous !== previous ||
      event.hash !==
        digest({
          event: event.event,
          value: event.value,
          previous,
        })
    )
      return false;
    previous = event.hash;
  }
  return previous === anchor;
}
export const originalChain = chain(originalEvents);
export const anchor = originalChain.at(-1).hash;
export function auditSnapshot(b, p) {
  const altered = originalEvents.map((value) => ({
    ...value,
  }));
  if (b > 0) altered[1].value = 'Approved';
  const rebuilt = chain(altered),
    recomputedCount = b === 0 ? 0 : b === 2 ? 3 : p < 0.3 ? 0 : p < 0.44 ? 1 : p < 0.58 ? 2 : 3,
    current =
      b === 0
        ? originalChain
        : originalChain.map((value, i) =>
            i < recomputedCount
              ? rebuilt[i]
              : {
                  ...value,
                  value: altered[i].value,
                },
          );
  let previous = 'GENESIS';
  const nodeChecks = current.map((value) => {
    const valid =
      value.previous === previous &&
      value.hash ===
        digest({
          event: value.event,
          value: value.value,
          previous: value.previous,
        });
    previous = value.hash;
    return valid;
  });
  return {
    current,
    recomputedCount,
    recomputed: b > 0 && recomputedCount === 3,
    anchor,
    internallyValid: verify(current, current.at(-1).hash),
    anchorMatches: current.at(-1).hash === anchor,
    nodeChecks,
  };
}
export function requiredReviews(value) {
  return [
    'Release',
    ...(value.untrusted ? ['Security'] : []),
    ...(value.target > 10 ? ['Exception'] : []),
  ];
}
export function oversight(value, receipts) {
  const required = requiredReviews(value),
    matching = required.filter(
      (name) => receipts[name] && receipts[name].binding === digest(value),
    );
  const denied = matching.some((name) => receipts[name].decision === 'DENIED');
  const all = required.every(
    (name) => receipts[name]?.binding === digest(value) && receipts[name].decision === 'APPROVED',
  );
  return {
    required,
    matching,
    denied,
    eligible: all && !denied,
    status: denied
      ? 'Denial · appeal available'
      : all
        ? 'Executor may revalidate'
        : 'Held for required review',
  };
}
function reviewedArtifacts(candidate, deployment) {
  const binding = digest(deployment);
  return Object.fromEntries(
    evidenceNames.map((name) => [
      name,
      {
        candidate,
        manifest: binding,
        artifactRef: `${candidate}/${binding}/${name}`,
        accepted: true,
      },
    ]),
  );
}

export function packageDecision(
  current,
  reviews,
  unsafe,
  accessibility,
  legalSignoff,
  candidate = 'C17',
) {
  const expected = digest(current),
    matching = evidenceNames.filter(
      (name) =>
        reviews?.[name]?.candidate === candidate &&
        reviews[name]?.manifest === expected &&
        typeof reviews[name]?.artifactRef === 'string' &&
        reviews[name].artifactRef.trim() &&
        reviews[name]?.accepted === true,
    ),
    reasons = [];
  if (matching.length !== evidenceNames.length)
    reasons.push(`${evidenceNames.length - matching.length} evidence gaps`);
  if (legalSignoff !== true) reasons.push('Required legal signoff missing');
  if (!Number.isSafeInteger(unsafe) || unsafe < 0) reasons.push('Unsafe-effect count unverified');
  else if (unsafe > 0) reasons.push(`${unsafe} unsafe effect`);
  if (!Number.isSafeInteger(accessibility) || accessibility < 0)
    reasons.push('Access-finding count unverified');
  else if (accessibility > 0) reasons.push(`${accessibility} access finding`);
  return {
    expected,
    matching,
    reasons,
    ready: !reasons.length,
  };
}

export function pathComparison(extraWeb = 0, repaired = 0) {
  const web = Array(20 + extraWeb).fill(false);
  const screen = Array.from({ length: 8 }, (_, i) => i >= repaired && i < 4);
  const total = web.length + screen.length;
  const blocked = screen.filter(Boolean).length;
  const rates = [web, screen].map((cases) => cases.filter(Boolean).length / cases.length);
  return {
    web,
    screen,
    rates,
    blocked,
    total,
    aggregate: blocked / total,
    investigation: rates.some((rate) => rate > 0.25),
  };
}

export function sampleModel(id, state) {
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'workflow')
    return {
      ...base,
      workflows: workflows.map((value) => ({
        ...value,
        route: triage(value.flags),
      })),
      selected: b === 0 ? 0 : b === 1 ? 2 : 3,
    };
  if (id === 'ownership')
    return {
      ...base,
      ...ownershipSnapshot(b, b > state.beat ? 0 : state.beatP),
    };
  if (id === 'results') {
    const attacks = b === 0 ? [false, false, true] : [false, false, false],
      benign = b === 2 ? [] : b === 0 ? [false, true] : [false, false];
    return {
      ...base,
      attacks,
      benign,
      ...evaluate(attacks, benign),
      upperBound: 1 - 0.05 ** (1 / attacks.length),
    };
  }
  if (id === 'slices') {
    const extra =
      state.beat === 2
        ? Math.floor(20 * cueProgress(state, 'slice-extra'))
        : state.beat === 3
          ? 20 - Math.floor(20 * cueProgress(state, 'slice-reset'))
          : 0;
    const repaired = state.beat === 3 ? Math.floor(4 * cueProgress(state, 'path-repair')) : 0;
    return { ...base, extra, repaired, ...pathComparison(extra, repaired) };
  }
  if (id === 'audit')
    return {
      ...base,
      ...auditSnapshot(b, state.beatP),
    };
  if (id === 'intro') {
    const record = appealReplayFixture().originalRecord;
    return {
      ...base,
      proposal: record.proposal,
      receipts: record.receipts,
      gateReached: b > 0 && (b > 1 || governancePermission(state, 'original-hold')),
      ownerOpened:
        b > 0 ||
        (state.cues?.['intro-beat-1-focus-1']
          ? state.cues['intro-beat-1-focus-1'].phase !== 'before'
          : state.beatP >= 0.62),
      effects: record.effects,
      held: !oversight(record.proposal, record.receipts).eligible,
      replayValid: verify(originalChain, anchor),
    };
  }
  if (id === 'oversight') {
    const receipts = {
      Release: {
        binding: digest(proposal),
        decision: 'APPROVED',
      },
    };
    if (b > 0) {
      receipts.Security = {
        binding: digest(proposal),
        decision: b === 1 ? 'DENIED' : 'APPROVED',
      };
      receipts.Exception = {
        binding: digest(proposal),
        decision: 'APPROVED',
      };
    }
    return {
      ...base,
      proposal,
      receipts,
      effects: [],
      ...oversight(proposal, receipts),
    };
  }
  if (id === 'package') {
    const current =
        b === 2
          ? {
              ...manifest,
              policy: 'G8',
            }
          : manifest,
      reviews = reviewedArtifacts('C17', manifest);
    if (b === 0) delete reviews['Dataset record'];
    const unsafe = b === 0 ? 1 : 0;
    const accessibility = b === 0 ? 1 : 0;
    const legalSignoff = true;
    return {
      ...base,
      current,
      reviews,
      unsafe,
      accessibility,
      legalSignoff,
      ...packageDecision(current, reviews, unsafe, accessibility, legalSignoff),
    };
  }
  return base;
}
export function actorLabel(actor, key = 'local-demo-key-not-for-production') {
  return 'actor-' + createHmac('sha256', key).update(actor, 'utf8').digest('hex').slice(0, 24);
}
export function productCase(state) {
  const convenience = governancePermission(state, 'convenience');
  const safety = governancePermission(state, 'safety-failure');
  const unrelated = governancePermission(state, 'unrelated-assessment');
  const established = governancePermission(state, 'product-inputs');
  const facts = {
    annexI: true,
    safety: safety || unrelated,
    thirdPartyHealthSafety: !unrelated,
  };
  return {
    established,
    convenience,
    safety,
    unrelated,
    facts,
    caseName: unrelated
      ? 'Safety component / unrelated assessment'
      : safety
        ? 'Failure can endanger health / safety'
        : convenience
          ? 'Convenience only'
          : 'Establish both required inputs',
    result: established && (convenience || safety) ? classificationFixture(facts) : null,
  };
}
export function classificationFixture(facts) {
  const productRoute =
    facts.annexI === true && facts.safety === true && facts.thirdPartyHealthSafety === true;
  const exception =
    facts.annexIII === true &&
    facts.noSignificantRisk === true &&
    facts.exceptionCondition === true &&
    facts.profiling !== true;
  return {
    productRoute,
    exception,
    highRisk: productRoute || (facts.annexIII === true && !exception),
  };
}
export function scopeChangeFixture(target = 15) {
  const deployment = { ...manifest, model: 'M29', evaluation: 'E9' };
  const original = {
    candidate: 'C29',
    environment: deployment.environment,
    artifact: deployment.model,
    target: 10,
    policy: deployment.policy,
    evidence: deployment.evaluation,
    untrusted: true,
  };
  const current = {
    ...original,
    target,
  };
  const receipts = Object.fromEntries(
    requiredReviews(original).map((role) => [
      role,
      {
        binding: digest(original),
        decision: 'APPROVED',
      },
    ]),
  );
  return {
    original,
    current,
    receipts,
    deployment: packageDecision(
      deployment,
      reviewedArtifacts(original.candidate, deployment),
      0,
      0,
      true,
      original.candidate,
    ),
    originalDigest: digest(original),
    currentDigest: digest(current),
    ...oversight(current, receipts),
    effects: [],
  };
}
export function appealReplayFixture({
  receiptActuallyPresent = false,
  currentApproval = false,
} = {}) {
  const original = { ...proposal, target: 10 };
  const originalRecord = {
    proposal: original,
    receipts: { Release: { binding: digest(original), decision: 'APPROVED' } },
    outcome: 'HELD',
    reason: 'Security receipt missing',
    effects: [],
  };
  return {
    originalRecord,
    replayDecision: receiptActuallyPresent
      ? 'CORRECT factual read defect'
      : 'UPHOLD missing-receipt hold',
    correctionAddsEffect: false,
    eligibleForRevalidation: currentApproval,
    observedEffects: [],
  };
}
