import { heading } from '../../kit-narrated.mjs';
import { nonlinearTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { networkMap } from '../network.mjs';

export default function nonlinearRequest(s, c) {
  const p = networkMap(s, nonlinearTrace());
  const question = p.question('Which hidden weight receives the error?');
  s.add(heading(c.title), p.base);
  c.show('network-weights', p.oldW);
  c.show('network-h', p.gates);
  c.show('network-output-weights', p.oldV);
  c.show('network-y', p.oldOutput);
  c.show('network-residual', p.residual);
  c.swap('network-question', p.residual, question);
  c.swap('network-out-grad', question, p.gradBias);
  c.show('network-out-grad', p.outputGrads);
  c.show('network-incoming', p.pulses);
  c.on('network-incoming', p.arrive);
  c.on('network-backward', p.pass);
  c.show('network-gradient-result', p.reached);
  c.swap(
    'network-parameters',
    [p.pulses, p.reached, p.outputGrads, p.gradBias, p.oldW, p.oldGates, p.oldV, p.oldOutput],
    p.nextW,
  );
  c.show('network-recompute', p.nextGates);
  c.show('network-product', p.nextV);
  c.show('network-update', p.nextOutput);
  c.show('network-loss-result', p.loss);
}
