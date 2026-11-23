import { place } from 'vizmatic/stage';
import { heading, mono } from '../../kit-narrated.mjs';
import { nonlinearTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { networkMap } from '../network.mjs';

export default function networkTransfer(s, c) {
  const m = nonlinearTrace(3, 7, 0.025);
  const p = networkMap(s, m);
  const terms = `${m.nextOut[0]} × ${m.nextHidden[0]} + ${m.nextOutBias}`;
  const readout = (answer, color) =>
    place(mono(`${terms} = ${answer} ms`, { size: 56, color }), p.resultArea);
  const pending = readout('?', 'yellow');
  const result = readout(m.nextPrediction.toFixed(1), 'blue');
  const update = (parameter, value, gradient, next) =>
    `${parameter}   ${value} − ${m.rate} × (${gradient}) = ${next}`;
  const weightStep = place(
    mono(update('Upper weights', m.weights[0], m.gradWeights[0], m.nextWeights[0]), { size: 46 }),
    p.resultArea,
  );
  const biasStep = p.question(update('Active biases', m.biases[0], m.gradZ[0], m.nextBiases[0]));
  s.add(heading(c.title), p.base, p.oldW);
  c.show('transfer-forward', [p.gates, p.oldV]);
  c.show('transfer-output', [p.oldOutput, p.residual]);
  c.show('transfer-gradients', p.outputGrads, { after: true });
  c.show('transfer-gradients', p.pulses);
  c.on('transfer-gradients', p.arrive);
  c.on('transfer-back', p.pass);
  c.show('transfer-back', p.reached, { after: true });
  c.swap('transfer-bias', p.residual, p.gradBias);
  c.swap(
    'transfer-weights',
    [p.outputGrads, p.reached, p.pulses, p.oldW, p.oldV, p.oldGates, p.oldOutput, p.gradBias],
    [p.nextW, weightStep],
  );
  c.show('transfer-bias-step', biasStep);
  c.show('transfer-hidden', p.nextGates, { after: true });
  c.show('transfer-product', p.nextV);
  c.swap('transfer-prediction', [weightStep, biasStep], pending);
  c.swap('transfer-result', pending, result, { after: true });
  c.show('transfer-loss', p.loss, { after: true });
}
