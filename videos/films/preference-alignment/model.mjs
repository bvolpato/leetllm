import { prefBound, prefLerp, prefLoss, sigmoid } from './arithmetic.mjs';
import { ALIGNMENT_TOKEN_FIXTURE, EXAMPLE } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function dpoExample() {
  const chosenRatio = EXAMPLE.chosen.policy - EXAMPLE.chosen.reference;
  const rejectedRatio = EXAMPLE.rejected.policy - EXAMPLE.rejected.reference;
  const margin = chosenRatio - rejectedRatio;
  const probability = 1 / (1 + Math.exp(-EXAMPLE.beta * margin));
  return {
    chosenRatio,
    rejectedRatio,
    margin,
    probability,
    loss: -Math.log(probability),
  };
}
export function twoLogitState(logits = [0, 0], beta = EXAMPLE.beta) {
  const margin = logits[0] - logits[1]; // The two reference logits are both zero.
  const preferenceProbability = sigmoid(beta * margin);
  const gradientSize = beta * (1 - preferenceProbability);
  const gradient = [-gradientSize, gradientSize];
  const exp = logits.map(Math.exp),
    probabilities = exp.map((value) => value / exp.reduce((a, b) => a + b, 0));
  return {
    logits: [...logits],
    margin,
    preferenceProbability,
    loss: -Math.log(preferenceProbability),
    gradient,
    probabilities,
  };
}
export function twoLogitTrace(updates = 6, stepSize = 0.4, beta = EXAMPLE.beta) {
  const states = [twoLogitState([0, 0], beta)];
  for (let i = 0; i < updates; i++) {
    const current = states.at(-1);
    states.push(
      twoLogitState(
        current.logits.map((value, index) => value - stepSize * current.gradient[index]),
        beta,
      ),
    );
  }
  return states;
}
export function alignmentSoftmax(logits) {
  const max = Math.max(...logits),
    exp = logits.map((v) => Math.exp(v - max)),
    sum = exp.reduce((a, v) => a + v, 0);
  return exp.map((v) => v / sum);
}
export function alignmentGae(rewards, values, gamma = 1, lambda = 0.5) {
  assert.equal(values.length, rewards.length + 1);
  let next = 0;
  const advantages = new Array(rewards.length),
    residuals = rewards.map((r, i) => r + gamma * values[i + 1] - values[i]);
  for (let i = rewards.length - 1; i >= 0; i--) {
    next = residuals[i] + gamma * lambda * next;
    advantages[i] = next;
  }
  return {
    residuals,
    advantages,
  };
}
export function alignmentClipping(ratio, advantage, epsilon = 0.2) {
  const clippedRatio = Math.min(1 + epsilon, Math.max(1 - epsilon, ratio)),
    raw = ratio * advantage,
    clipped = clippedRatio * advantage;
  return {
    ratio,
    advantage,
    clippedRatio,
    raw,
    clipped,
    surrogate: Math.min(raw, clipped),
  };
}
export function alignmentBudget(parameters = 70e9, critic = true) {
  const roles = [
    {
      id: 'actor',
      bytes: 16,
      trainable: true,
    },
    {
      id: 'critic',
      bytes: 16,
      trainable: true,
    },
    {
      id: 'reference',
      bytes: 2,
      trainable: false,
    },
    {
      id: 'reward',
      bytes: 2,
      trainable: false,
    },
  ].map((r) => ({
    ...r,
    gb: (parameters * r.bytes) / 1e9,
    present: r.id !== 'critic' || critic,
  }));
  return {
    roles,
    total: roles.filter((r) => r.present).reduce((sum, r) => sum + r.gb, 0),
    full: (parameters * 36) / 1e9,
    saved: critic ? 0 : 16 / 36,
  };
}
export function alignmentReduction(progress = 0) {
  const q = prefBound(progress),
    rows = [
      {
        id: 'chosen',
        count: 4,
        sum: 0.4,
      },
      {
        id: 'rejected',
        count: 2,
        sum: 0.3,
      },
    ].map((row) => {
      const weight = prefLerp(1, 1 / row.count, q);
      return {
        ...row,
        contribution: row.sum / row.count,
        weight,
        score: row.sum * weight,
      };
    });
  return {
    progress: q,
    rows,
    margin: rows[0].score - rows[1].score,
  };
}
export function alignmentTilt(reference = [0.5, 0.5], rewards = [Math.log(3), 0], beta = 1) {
  assert(beta > 0);
  const masses = reference.map((v, i) => v * Math.exp(rewards[i] / beta)),
    partition = masses.reduce((a, v) => a + v, 0);
  return {
    reference,
    rewards,
    beta,
    masses,
    partition,
    probabilities: masses.map((v) => v / partition),
  };
}
export function alignmentWilson(wins, total, z = 1.96) {
  const rate = wins / total,
    denom = 1 + (z * z) / total,
    center = (rate + (z * z) / (2 * total)) / denom,
    half = (z * Math.sqrt((rate * (1 - rate)) / total + (z * z) / (4 * total * total))) / denom;
  return {
    wins,
    total,
    rate,
    lower: center - half,
    upper: center + half,
  };
}
export function alignmentRelease(wins = 222, total = 400, growth = 20) {
  const interval = alignmentWilson(wins, total),
    winPass = interval.lower > 0.5,
    lengthPass = growth < 20;
  return {
    ...interval,
    growth,
    winPass,
    lengthPass,
    eligible: winPass && lengthPass,
  };
}
export function alignmentGroup(rewards = [1, 0, 0.5, 1]) {
  const mean = rewards.reduce((a, v) => a + v, 0) / rewards.length,
    variance = rewards.reduce((a, v) => a + (v - mean) ** 2, 0) / rewards.length,
    std = Math.sqrt(variance);
  return {
    rewards,
    mean,
    variance,
    std,
    advantages: rewards.map((v) => (std === 0 ? 0 : (v - mean) / std)),
  };
}
export function alignmentTokenScores(boost = 0, excludedPerturbation = 0, includeEos = true) {
  const f = structuredClone(ALIGNMENT_TOKEN_FIXTURE),
    selected = f.mask.map((v, i) => Boolean(v && i >= f.prompt && (includeEos || i !== 4)));
  f.chosenPolicy[1][1] += boost;
  f.chosenPolicy[2][2] += boost;
  f.chosenPolicy[0][2] += excludedPerturbation;
  f.chosenPolicy[4][0] += excludedPerturbation;
  const terms = (rows, ids) =>
      ids.map((id, i) => (i && selected[i] ? Math.log(alignmentSoftmax(rows[i - 1])[id]) : null)),
    score = (rows, ids) => terms(rows, ids).reduce((a, v) => a + (v ?? 0), 0);
  const chosen = score(f.chosenPolicy, f.chosenIds),
    chosenRef = score(f.chosenReference, f.chosenIds),
    rejected = score(f.rejectedPolicy, f.rejectedIds),
    rejectedRef = score(f.rejectedReference, f.rejectedIds),
    margin = chosen - chosenRef - rejected + rejectedRef;
  return {
    fixture: f,
    selected,
    chosen,
    chosenRef,
    rejected,
    rejectedRef,
    margin,
    loss: prefLoss(0.1 * margin),
    chosenTerms: terms(f.chosenPolicy, f.chosenIds),
    rejectedTerms: terms(f.rejectedPolicy, f.rejectedIds),
  };
}
