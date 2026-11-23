import { kl } from './arithmetic.mjs';
import { INITIAL, LEARNING_CUES, POLICY_CASES, RELEASE_LIMITS, TEACHER } from './fixtures.mjs';
import { phase } from './construction.mjs';
import { stableSoftmax } from 'vizmatic';
const dot = (row, h) => row.reduce((sum, weight, i) => sum + weight * h[i], 0);

export function projectionFixture(progress = 0, fresh = false) {
  const held = [1, 2];
  const initial = [
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  const firstTarget = [1, 3, 2];
  const gradient = initial.map((row, i) =>
    held.map((v) => 2 * (dot(row, held) - firstTarget[i]) * v),
  );
  const A = initial.map((row, i) =>
    row.map((weight, j) => weight - progress * 0.1 * gradient[i][j]),
  );
  const h = fresh ? [2, 1] : held;
  const target = fresh ? [2, 3, 2] : firstTarget;
  const output = A.map((row) => dot(row, h));
  return {
    h,
    A,
    gradient,
    target,
    output,
    error: output.map((v, i) => v - target[i]),
    sse: output.reduce((s, v, i) => s + (v - target[i]) ** 2, 0),
  };
}
export function releaseChecks(candidate) {
  return {
    accuracy: candidate.accuracy >= RELEASE_LIMITS.accuracy,
    policy: candidate.errors / candidate.policyCases <= RELEASE_LIMITS.policy,
    latency: candidate.latency <= RELEASE_LIMITS.latency,
    cost: candidate.monthlyCost <= RELEASE_LIMITS.monthlyCost,
  };
}
export function policySelection() {
  const rules = new Map(POLICY_CASES.map(({ prompt, rule }) => [prompt, rule]));
  const seen = new Set();
  return [
    'disabled prod key restore',
    '  Disabled prod key  restore  ',
    'expired admin restore',
  ].map((raw) => {
    const prompt = raw.trim().toLowerCase().split(/\s+/).join(' ');
    if (seen.has(prompt)) return { raw, prompt, outcome: 'skip' };
    seen.add(prompt);
    const reply = '7 days';
    const rule = rules.get(prompt);
    return { raw, prompt, reply, rule, outcome: reply === rule ? 'keep' : 'reject' };
  });
}
export function jointFixture() {
  const q0 = [0.8, 0.2],
    p0 = [0.5, 0.5],
    q1 = [
      [0.9, 0.1],
      [0.2, 0.8],
    ],
    p1 = [
      [0.5, 0.5],
      [0.4, 0.6],
    ],
    q = q0.flatMap((v, i) => q1[i].map((x) => v * x)),
    p = p0.flatMap((v, i) => p1[i].map((x) => v * x));
  return {
    q0,
    p0,
    q1,
    p1,
    q,
    p,
    forward: kl(q, p),
    reverse: kl(p, q),
    conditional: q1.map((row, i) => kl(row, p1[i])),
    first: kl(q0, p0),
  };
}
export function objectiveSnapshot(beat, progress, cues) {
  const terms = stableSoftmax(TEACHER).map((v, i) => v * Math.log(v / stableSoftmax(INITIAL)[i]));
  const cue = cues?.['objective-b1-2'];
  const count =
    beat > 0
      ? 4
      : cue
        ? cue.phase === 'before'
          ? Math.min(2, Math.floor(progress * 4))
          : cue.phase === 'after'
            ? 4
            : 2 + Math.min(2, Math.floor(cue.progress * 2 + 1e-9))
        : Math.min(4, Math.floor(progress * 4 + 1e-9));
  return {
    terms,
    count,
    total: terms.slice(0, count).reduce((a, b) => a + b, 0),
  };
}
export function studentTrace(count = 40) {
  let logits = [...INITIAL];
  const target = stableSoftmax(TEACHER);
  return Array.from(
    {
      length: count + 1,
    },
    (_, step) => {
      const probs = stableSoftmax(logits),
        value = {
          step,
          logits: [...logits],
          probs,
          loss: kl(target, probs),
        };
      logits = logits.map((v, i) => v - 0.8 * (probs[i] - target[i]));
      return value;
    },
  );
}
export function learningSnapshot(beat, progress, cues, time) {
  const trace = studentTrace(),
    teacher = stableSoftmax(TEACHER),
    base = trace[12],
    next = trace[13],
    seconds =
      progress *
      (beat === 1 ? LEARNING_CUES.updateBeatDuration : LEARNING_CUES.predictionBeatDuration);
  const lower = cues?.['distill-cat-lower'],
    positive = cues?.['distill-cat-positive'];
  const amount =
    beat < 2
      ? 0
      : lower
        ? lower.phase === 'after'
          ? phase(time, lower.end, lower.end + 0.9)
          : 0
        : phase(seconds, LEARNING_CUES.lowerAt, LEARNING_CUES.lowerUntil);
  const step =
    beat === 0
      ? 0
      : beat === 1
        ? seconds < 0.875
          ? 0
          : 1 + Math.floor(11 * phase(seconds, 1.3, 5.7))
        : amount === 1
          ? 13
          : 12;
  const logits =
      beat < 2 ? trace[step].logits : base.logits.map((v, i) => v + (next.logits[i] - v) * amount),
    probs = stableSoftmax(logits);
  return {
    step,
    current: {
      step,
      logits,
      probs,
      loss: kl(teacher, probs),
    },
    base,
    next,
    gradient: base.probs[2] - teacher[2],
    showGradient:
      beat >= 2 && (positive ? positive.phase === 'after' : seconds >= LEARNING_CUES.gradientAt),
    amount,
  };
}
export function prefixSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [17.784, 15.288, 20.264][beat];
  const reference = ['bird', 'in', 'the', 'garden'],
    visited = ['dog', 'near', 'the', 'gate'];
  const referenceCount =
    beat > 0 ? 4 : [1.65, 5.35, 6.05, 6.8].filter((at) => seconds >= at).length;
  const visitedCount =
    beat === 0 ? 0 : beat > 1 ? 4 : [2.36, 3.76, 4.35, 4.95].filter((at) => seconds >= at).length;
  const feedback = beat === 0 ? 0 : beat > 1 ? 1 : phase(seconds, 5.56, 8.7);
  return {
    seconds,
    reference: reference.slice(0, referenceCount),
    visited: visited.slice(0, visitedCount),
    referenceCount,
    visitedCount,
    feedback,
    words: ['in', 'near', 'beside'],
    referenceTeacher: [0.65, 0.2, 0.15],
    visitedTeacher: [0.1, 0.55, 0.35],
  };
}
