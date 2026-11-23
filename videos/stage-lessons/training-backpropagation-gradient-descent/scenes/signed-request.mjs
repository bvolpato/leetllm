import assert from 'node:assert/strict';
import { dot, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { nonlinearTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { networkMap } from '../network.mjs';
import { latencyStrip, work } from '../latency.mjs';

export default function signedRequest(s, c) {
  const m = nonlinearTrace(-2, 7, 0.025);
  assert.deepEqual(m.gradWeights, [0, 8]);
  assert.deepEqual(m.gradOut, [0, -12]);
  assert(Math.abs(m.nextPrediction - 4.65) < 1e-12);
  const title = heading(c.title);
  const p = networkMap(s, m);
  const question = p.question('Which hidden weight moves, and in which direction?');
  const equation = p.question('Lower weight gradient = (−4) × (−2) = +8');
  const ruler = latencyStrip(s, m.prediction, m.target);
  const [top, bottom] = work.rows(2, 'normal');
  const [caption, calculation] = top.rows(2, 'tight');
  const branch = place(
    label(`Lower weight  ${m.weights[1]} → ${m.nextWeights[1]}      Input  ${m.x}`),
    caption,
  );
  const [oldX, oldY] = ruler.ruler.world(m.prediction);
  const original = [
    dot(9, 'dim').moveTo([oldX, oldY - 12]),
    mono(`before  ${m.prediction} ms`, { color: 'dim', size: 36 }).moveTo([oldX, oldY + 95]),
  ];
  const terms = m.nextOut[1] + ' × ' + m.nextHidden[1] + ' + ' + m.nextOutBias;
  const pending = place(mono(terms + ' = ?', { size: 53 }), calculation);
  const computation = place(
    mono(terms + ' = ' + m.nextPrediction.toFixed(2) + ' ms', {
      color: 'blue',
      size: 53,
    }),
    calculation,
  );
  const [lossFormula, comparison] = bottom.rows(2, 'tight');
  const loss = place(
    mono(`Loss = ½ × (${m.nextPrediction.toFixed(2)} − ${m.target})²`, { size: 46 }),
    lossFormula,
  );
  const score = place(
    mono(`Before  ${m.loss} ms²     After  ≈ ${m.nextLoss.toFixed(2)} ms²`, {
      color: 'yellow',
      size: 52,
    }),
    comparison,
  );
  s.add(title, p.base, p.oldW);
  c.show('signed-gate', [p.gates, p.oldV]);
  c.show('signed-initial', [p.oldOutput, p.residual]);
  c.swap('signed-question', p.residual, question);
  c.show('signed-back', p.pulses);
  c.on('signed-back', p.arrive);
  c.on('signed-pass', p.pass);
  c.swap('signed-gradient', question, equation, { after: true });
  c.show('signed-gradient', [p.reached, p.outputGrads], { after: true });
  c.swap(
    'signed-step',
    [p.pulses, p.reached, p.outputGrads, p.oldW, p.oldGates, p.oldV, p.oldOutput, equation],
    p.nextW,
  );
  c.show('signed-hidden', p.nextGates, { after: true });
  c.show('signed-product', p.nextV);
  c.swapAll('signed-ruler', [ruler.picture, branch, pending], { keep: [title] });
  const reading = c.cue('signed-reading');
  c.on('signed-reading', () =>
    s.play(ruler.model.to(m.nextPrediction, { duration: reading.end - reading.start })),
  );
  c.swap('signed-reading', pending, computation, { after: true });
  c.show('signed-reading', original, { after: true });
  c.show('signed-loss', loss, { lead: 0 });
  c.show('signed-loss', score, { after: true });
}
