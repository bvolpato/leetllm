import {
  actorMemoryTrace,
  gruResetComparison,
  incidentModel,
} from '../../../films/rnn-memory/model.mjs';
import {
  inputs,
  scalar,
  states,
  wx,
  wh,
  padded,
  cell,
  hidden,
  eventNames,
} from '../../../films/rnn-memory/fixtures.mjs';
import { scalarTrace, mv, sum, norm, sigmoid } from '../../../films/rnn-memory/arithmetic.mjs';
export { inputs, scalar, states, wx, wh, padded, cell, hidden, eventNames, mv, sum, norm };
export const m = incidentModel(),
  dog = actorMemoryTrace('dog'),
  cat = actorMemoryTrace('cat');
const cOld = m.lstm.cOld;
const hOld = [0.4, 0.05];
const joined = [...hOld, 0, 1, 0];
const f = mv(m.lstm.forgetMatrix, joined).map(sigmoid);
const i = [-joined[3], 0].map(sigmoid);
const candidate = [0.5 * joined[3], 0].map(Math.tanh);
const o = [Math.log(4), 0].map(sigmoid);
const kept = f.map((gate, j) => gate * cOld[j]);
const written = i.map((gate, j) => gate * candidate[j]);
const nextCell = kept.map((value, j) => value + written[j]);
const nextHidden = o.map((gate, j) => gate * Math.tanh(nextCell[j]));
export const learnedCell = {
  cOld,
  hOld,
  joined,
  f,
  i,
  candidate,
  o,
  retained: kept,
  written,
  nextCell,
  nextHidden,
};
export const recurrentBias = 1;
export const resetBiasTerms = [-Math.log(9), 0].map((logit) => sigmoid(logit) * recurrentBias);
export const verb = [0];
for (const token of cat.words)
  verb.push(Math.tanh((token === 'chased' ? 0.8 : 0) + 0.9 * verb.at(-1)));
export const identityGRU = gruResetComparison({
  recurrent: [
    [1, 0],
    [0, 1],
  ],
});
export const actionNames = ['ignore', 'rollback', 'escalate'];
export const counts = (words) =>
  words.reduce((bag, w) => {
    const token = w.toLowerCase();
    bag[token] = (bag[token] ?? 0) + 1;
    return bag;
  }, {});
export const retained = (fraction, links) => fraction ** links;
export const blend = (z) => z * 0.8 + (1 - z) * -0.2;
export const orderRetention = 0.6;
export function stackedTerms(order, step) {
  return order.slice(0, step + 1).map((event, i) => inputs[event] * orderRetention ** (step - i));
}
export function creditRun(cutAfter = 0) {
  const trace = scalarTrace(inputs);
  const gradients = Array(inputs.length).fill(0);
  const weightTerms = Array(inputs.length).fill(0);
  let carry = 1;
  for (let t = inputs.length - 1; t >= cutAfter; t--) {
    const local = carry * (1 - trace[t + 1] ** 2);
    gradients[t] = 0.8 * local;
    weightTerms[t] = trace[t] * local;
    carry = 0.5 * local;
  }
  return { trace, gradients, weightTerms, weight: sum(weightTerms) };
}
export const fullRun = creditRun(),
  cutRun = creditRun(2);
export const pitches = 5,
  noteHoles = [3],
  chordHoles = [0, 1, 3, 4];
export const rolls = [
  [noteHoles, chordHoles, []],
  [noteHoles, chordHoles],
];
export const rollInputs = rolls.map((roll) => roll.map((holes) => holes.length / pitches));
export const validTrace = (row, length) => scalarTrace(row.slice(0, length));
export const rollTraces = rollInputs.map((row) => validTrace(row, row.length));
export const fillerEnd = (filler) => scalarTrace([...rollInputs[1], filler]).at(-1);
export const flagged = (h) => h >= 0.5;
export const allowed = (length) => (length * (length + 1)) / 2;
export const codeBits = 2 * 2;
export const addresses = Array.from({ length: 2 ** codeBits }, (_, i) =>
  i.toString(2).padStart(codeBits, '0'),
);
export const segments = [
  [2, 1],
  [3, 4],
];
export function compose([a, b], [d, e]) {
  return [d * a, d * b + e];
}
export const combined = compose(...segments);
export const torchBlocks = (input, hidden) => [
  3 * hidden * input,
  3 * hidden * hidden,
  3 * hidden,
  3 * hidden,
];
export const batchShape = { batch: 4, time: 5, input: 3, hidden: 2, layers: 1, directions: 1 };
export function packedIncident(row, length) {
  let state = [0, 0];
  for (const x of row.slice(0, length)) {
    const input = mv(wx, x),
      memory = mv(wh, state);
    state = input.map((v, j) => Math.tanh(v + memory[j]));
  }
  return state;
}
export const bRows = [
  [1, 0, 0],
  [0, 1, 0],
];
export const fillers = [
  [0, 0, 0],
  [9, -9, 9],
];
