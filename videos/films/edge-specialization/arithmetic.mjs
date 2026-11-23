import { teacherLogits } from './fixtures.mjs';
import { stableSoftmax } from 'vizmatic';
export function divergence(logits, temperature) {
  const p = stableSoftmax(teacherLogits, temperature),
    q = stableSoftmax(logits, temperature);
  return p.reduce((sum, value, i) => sum + value * Math.log(value / q[i]), 0);
}
export function interpolateTrace(trace, minute) {
  const index = Math.max(0, trace.findIndex((point, i) => i && point.minute >= minute) - 1);
  const left = trace[index],
    right = trace[Math.min(index + 1, trace.length - 1)];
  const q =
    right.minute === left.minute ? 0 : (minute - left.minute) / (right.minute - left.minute);
  return left.rate + q * (right.rate - left.rate);
}
export function energyCandidate(name) {
  const [watts, rate] = name === 'A' ? [3.5, 18] : [6, 10];
  const decodeSeconds = 30000 / rate;
  return {
    name,
    watts,
    rate,
    phases: [
      {
        name: 'Retrieval / prefill',
        seconds: 600,
        watts: 4,
      },
      {
        name: 'Decode',
        seconds: decodeSeconds,
        watts,
      },
      {
        name: 'Idle',
        seconds: 28800 - 600 - decodeSeconds,
        watts: 1.2,
      },
    ],
  };
}
export function integrateEnergy(candidate, seconds) {
  let remaining = seconds,
    energy = 0;
  for (const phase of candidate.phases) {
    const duration = Math.min(remaining, phase.seconds);
    energy += (duration * phase.watts) / 3600;
    remaining -= duration;
    if (remaining <= 0) break;
  }
  return energy;
}
export function edgeLoss() {
  const student = [3.2, 2.4, 1.1],
    teacher = [4, 2, 1],
    ps = stableSoftmax(student, 2),
    pt = stableSoftmax(teacher, 2),
    hardShares = stableSoftmax(student, 1),
    hard = -Math.log(hardShares[0]),
    soft = 4 * pt.reduce((a, p, i) => a + p * Math.log(p / ps[i]), 0),
    hidden = [0.3, 0, 0.1].reduce((a, v, i) => a + (v - [0.4, -0.1, 0.2][i]) ** 2, 0) / 3;
  return {
    hard,
    hardShares,
    soft,
    hidden,
    total: 0.2 * hard + 0.8 * soft + 0.2 * hidden,
    pt,
    ps,
    parts: [0.2 * hard, 0.8 * soft, 0.2 * hidden],
  };
}
export function edgeGradients(tau) {
  const pt = stableSoftmax([4, 2, 1], tau),
    ps = stableSoftmax([3.2, 2.4, 1.1], tau),
    g = ps.map((x, i) => (x - pt[i]) / tau);
  return {
    pt,
    ps,
    g,
    scaled: g.map((x) => x * tau * tau),
    limit: [-0.7 / 3, 0.5 / 3, 0.2 / 3],
  };
}
export function edgeRoute(r) {
  if (typeof r.score !== 'number' || !Number.isFinite(r.score) || r.score < 0 || r.score > 1)
    return 'local review';
  if (r.supported === true && r.score >= 0.8) return 'local answer';
  return r.data === 'public' && r.approval === true && r.redaction === true && r.online === true
    ? 'cloud allowed'
    : 'local review';
}
export function edgeDevice(idle = 1) {
  const seconds = [300, 10000 / 20, 21600 - 300 - 10000 / 20],
    watts = [4, 4, idle],
    wh = seconds.map((x, i) => (x * watts[i]) / 3600);
  const payload = (2.4e9 * 4) / 8;
  const memory = [1280, 16, 384, 192];
  const resident = memory.reduce((sum, value) => sum + value, 0);
  const total = wh.reduce((sum, value) => sum + value, 0);
  return {
    payload,
    ceiling: 36e9 / payload,
    memory,
    resident,
    margin: 2048 - resident,
    seconds,
    watts,
    wh,
    total,
    fits: total <= 6.5,
  };
}
export function edgeSharedWeight(input = [2, 4]) {
  const weights = [
      [0.5, 0],
      [0, 0.5],
    ],
    apply = (x) => weights.map((row) => row.reduce((a, v, i) => a + v * x[i], 0)),
    first = apply(input);
  return {
    weights,
    states: [input, first, apply(first)],
  };
}
export function edgeNumeric(row) {
  const clamped = row.map((v) => Math.max(-1, Math.min(1, v))),
    sum = clamped.reduce((a, b) => a + b);
  return {
    clamped,
    logits: [-sum, sum],
    class: sum > 0 ? 1 : 0,
  };
}
