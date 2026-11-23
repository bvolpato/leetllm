import { weighted } from './arithmetic.mjs';
import { rates } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function auditSelectionState(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const rows = ['assistant', 'control'].map((arm) => {
    const tickets = [1, 1, 0, 0].map((resolved, i) => ({
      id: (arm === 'assistant' ? 'A' : 'C') + (i + 1),
      resolved: !!resolved,
      included: arm === 'assistant' || !resolved || p < [0.25, 0.65][i],
    }));
    const admitted = tickets.filter((ticket) => ticket.included);
    return {
      arm,
      tickets,
      included: admitted.length,
      rate: admitted.filter((ticket) => ticket.resolved).length / admitted.length,
    };
  });
  return {
    rows,
  };
}
export function standardizationState(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * 20.424;
  const mix = beat > 0 ? 1 : Math.max(0, Math.min(1, (elapsed - 6.3) / 6));
  const assistantWeight = 0.1 + 0.6 * mix,
    controlWeight = 0.9 - 0.2 * mix;
  return {
    mix,
    assistantWeight,
    controlWeight,
    assistant: weighted(rates.assistant, assistantWeight),
    control: weighted(rates.control, controlWeight),
  };
}
export function causalTicketLedger() {
  const rows = [];
  for (const [risk, arm, count, success, propensity] of [
    ['low', 'assistant', 10, 9, 0.1],
    ['low', 'control', 90, 72, 0.1],
    ['high', 'assistant', 90, 45, 0.9],
    ['high', 'control', 10, 4, 0.9],
  ]) {
    for (let i = 0; i < count; i++)
      rows.push({
        id: `${arm === 'assistant' ? 'A' : 'C'}-${risk}-${i + 1}`,
        risk,
        arm,
        resolved: i < success,
        propensity,
      });
  }
  return rows;
}
export function standardizedFixture(lowAssistantSuccess = 9) {
  const a = [lowAssistantSuccess / 10, 45 / 90],
    c = [72 / 90, 4 / 10],
    weights = [0.7, 0.3];
  const assistant = a.reduce((sum, v, i) => sum + v * weights[i], 0),
    control = c.reduce((sum, v, i) => sum + v * weights[i], 0);
  const varianceParts = [
    (weights[0] ** 2 * a[0] * (1 - a[0])) / 10,
    (weights[0] ** 2 * c[0] * (1 - c[0])) / 90,
    (weights[1] ** 2 * a[1] * (1 - a[1])) / 90,
    (weights[1] ** 2 * c[1] * (1 - c[1])) / 10,
  ];
  const variance = varianceParts.reduce((a, b) => a + b, 0),
    se = Math.sqrt(variance),
    difference = assistant - control;
  return {
    assistant,
    control,
    difference,
    varianceParts,
    variance,
    se,
    interval: [difference - 1.96 * se, difference + 1.96 * se],
  };
}
export function effectAtMix(lowShare, effects = [0.04, 0.16]) {
  assert(lowShare >= 0 && lowShare <= 1);
  return lowShare * effects[0] + (1 - lowShare) * effects[1];
}
export function responseTypePairing(harmed) {
  assert(Number.isInteger(harmed) && harmed >= 0 && harmed <= 22);
  const counts = {
    always: 68 - harmed,
    helped: 10 + harmed,
    harmed,
    never: 22 - harmed,
  };
  return {
    counts,
    assistantSuccess: counts.always + counts.helped,
    controlSuccess: counts.always + counts.harmed,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  };
}
export function weightedTicketFixture({ stabilize = 1, clip = Infinity } = {}) {
  assert(stabilize > 0 && clip > 0);
  const tickets = causalTicketLedger();
  return ['assistant', 'control'].map((arm) => {
    const owned = tickets
      .filter((t) => t.arm === arm)
      .map((t) => ({
        ...t,
        weight:
          Math.min(clip, 1 / (arm === 'assistant' ? t.propensity : 1 - t.propensity)) * stabilize,
      }));
    const mass = owned.reduce((s, t) => s + t.weight, 0),
      successMass = owned.reduce((s, t) => s + t.weight * Number(t.resolved), 0),
      squares = owned.reduce((s, t) => s + t.weight * t.weight, 0);
    return {
      arm,
      tickets: owned,
      observed: owned.length,
      mass,
      successMass,
      rate: successMass / mass,
      ess: (mass * mass) / squares,
      groups: ['low', 'high'].map((risk) => {
        const g = owned.filter((t) => t.risk === risk);
        return {
          risk,
          count: g.length,
          weight: g[0].weight,
          mass: g.reduce((s, t) => s + t.weight, 0),
          successMass: g.reduce((s, t) => s + t.weight * Number(t.resolved), 0),
        };
      }),
    };
  });
}
export function instrumentFixture(firstStage = 0.4, direct = 0, tau = 0.1) {
  assert(firstStage > 0 && firstStage <= 1);
  const mediated = tau * firstStage,
    outcomeDifference = mediated + direct;
  return {
    firstStage,
    direct,
    tau,
    mediated,
    outcomeDifference,
    ratio: outcomeDifference / firstStage,
    bypassBias: direct / firstStage,
  };
}
export function monotoneCompliance(without = 0.3, withFlag = 0.7) {
  assert(without >= 0 && without <= withFlag && withFlag <= 1);
  return {
    always: without,
    compliers: withFlag - without,
    never: 1 - withFlag,
    defiers: 0,
  };
}
export function policyValueFixture({ rewardShift = 0.05, estimatedPropensity = null } = {}) {
  const rows = causalTicketLedger().map((t) => {
    const base = t.risk === 'low' ? 0.9 : 0.5,
      q = base + rewardShift,
      e = estimatedPropensity ?? t.propensity,
      ratio = t.arm === 'assistant' ? 1 / e : 0;
    assert(e > 0 && e < 1);
    return {
      ...t,
      q,
      ratio,
      residual: t.arm === 'assistant' ? Number(t.resolved) - q : 0,
      correction: ratio * (t.arm === 'assistant' ? Number(t.resolved) - q : 0),
    };
  });
  const baseline = rows.reduce((s, t) => s + t.q, 0) / rows.length,
    correction = rows.reduce((s, t) => s + t.correction, 0) / rows.length,
    ips = rows.reduce((s, t) => s + t.ratio * Number(t.resolved), 0) / rows.length;
  return {
    rows,
    baseline,
    correction,
    dr: baseline + correction,
    ips,
    groupCorrections: ['low', 'high'].map((risk) =>
      rows.filter((t) => t.risk === risk).reduce((s, t) => s + t.correction, 0),
    ),
  };
}
export function clickExposureFixture(usedExamination = 0.2) {
  assert(usedExamination > 0 && usedExamination <= 1);
  const examination = 0.2,
    relevance = 0.6,
    click = examination * relevance;
  return {
    examination,
    relevance,
    click,
    usedExamination,
    weight: 1 / usedExamination,
    corrected: click / usedExamination,
  };
}
export function replayReplacementFixture(returned = 2, { freezeDownstream = false } = {}) {
  const doubled = freezeDownstream ? 4 : 2 * returned;
  return {
    returned,
    doubled,
    threshold: 6,
    success: doubled >= 6,
    downstreamRecomputed: !freezeDownstream,
  };
}
export function freshAuditFixture(progress = 1) {
  const p = Math.max(0, Math.min(1, progress)),
    removed = Math.floor(8 * p);
  const arms = ['assistant', 'control'].map((arm) => {
    const full = Array.from(
        {
          length: 20,
        },
        (_, i) => ({
          id: (arm === 'assistant' ? 'A' : 'C') + (i + 1),
          resolved: i < 8,
          arm,
        }),
      ),
      selected = full.filter((t, i) => arm === 'control' || !t.resolved || i >= removed),
      successes = selected.filter((t) => t.resolved).length;
    return {
      arm,
      full,
      selected,
      successes,
      count: selected.length,
      rate: successes / selected.length,
    };
  });
  return {
    arms,
    removed,
    difference: arms[0].rate - arms[1].rate,
  };
}
export function junctionPathOpen(kind, conditioned = false) {
  assert(['chain', 'fork', 'collider'].includes(kind));
  return kind === 'collider' ? conditioned : !conditioned;
}
