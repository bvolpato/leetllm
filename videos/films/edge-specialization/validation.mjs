import {
  divergence,
  edgeDevice,
  edgeGradients,
  edgeLoss,
  edgeNumeric,
  edgeRoute,
  energyCandidate,
  integrateEnergy,
} from './arithmetic.mjs';
import { bundle, ids, manifest, teacherLogits } from './fixtures.mjs';
import { checkBundle, executeGraph, policyDecision, sampleModel, train } from './model.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function validateModel() {
  edgeValidate();
  const learned = train(60);
  assert(learned.loss < train(0).loss);
  assert(learned.losses.every((loss, i) => i === 0 || loss <= learned.losses[i - 1] + 1e-12));
  for (const tau of [1, 3]) {
    const logits = [0, 0, 0],
      epsilon = 1e-5,
      plus = [epsilon, 0, 0],
      minus = [-epsilon, 0, 0];
    const finite = (divergence(plus, tau) - divergence(minus, tau)) / (2 * epsilon);
    assert(
      Math.abs(
        finite - (stableSoftmax(logits, tau)[0] - stableSoftmax(teacherLogits, tau)[0]) / tau,
      ) < 1e-9,
    );
  }
  assert.deepEqual(
    [
      ['cpu', 'cpu', 'cpu'],
      ['npu', 'cpu', 'npu'],
      ['npu', 'npu', 'npu'],
    ].map((path) => executeGraph(path).total),
    [13, 21, 2.5],
  );
  assert(
    !checkBundle(bundle, {
      ...manifest,
      tokenizer: 'forged',
    }).authenticated,
  );
  assert(!checkBundle(bundle.subarray(0, bundle.length - 1)).accepted);
  assert(policyDecision(['manual'], 'device', 'public').allowed);
  assert(!policyDecision(['manual'], 'cloud', 'public').allowed);
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'training') assert(Math.abs(s.student.reduce((a, b) => a + b) - 1) < 1e-12);
        if (id === 'grounding') assert.equal(s.applies, beat === 1);
        if (id === 'export-runtime') {
          assert.equal(s.output, 2);
          assert.equal(
            s.completed,
            s.spans.filter((span) => span.device !== 'boundary' && span.end <= s.cursor + 1e-9)
              .length,
          );
          assert.deepEqual(s.current, s.completed ? s.results[s.completed - 1] : [2, 1]);
        }
        if (id === 'energy')
          assert(
            s.candidate.phases.every((phase) => phase.seconds >= 0) && s.energy <= s.total + 1e-9,
          );
        if (id === 'updates' && beat === 0) assert(!s.checked.accepted && s.active === 1);
      }
  assert(integrateEnergy(energyCandidate('A'), 28800) < 12);
  assert(
    integrateEnergy(energyCandidate('B'), 28800) > 12 &&
      integrateEnergy(energyCandidate('B'), 28800) < 15,
  );
  assert.equal(
    sampleModel('export-runtime', {
      beat: 1,
      beatP: 0.5,
    }).completed,
    2,
  );
  assert.deepEqual(
    sampleModel('export-runtime', {
      beat: 1,
      beatP: 0.12,
    }).current,
    [2, 1],
  );
  assert.deepEqual(
    sampleModel('export-runtime', {
      beat: 1,
      beatP: 0.88,
    }).current,
    [2],
  );
  return true;
}
export function edgeValidate() {
  assert.equal(edgeDevice().ceiling, 30);
  assert.equal(edgeDevice().margin, 176);
  assert(!edgeDevice().fits && edgeDevice(0.9).fits);
  assert(Math.abs(edgeDevice().total - 6.666666666666667) < 1e-12);
  assert(Math.abs(edgeDevice(0.9).total - 6.088888888888889) < 1e-12);
  assert.equal(edgeNumeric([2, -0.5, -2]).class, 0);
  assert.deepEqual(edgeNumeric([2, -0.5, -2]).clamped, [1, -0.5, -1]);
  assert(Math.abs(edgeLoss().total - 0.2109) < 0.00005);
  for (const tau of [1, 3, 100])
    assert(Math.abs(edgeGradients(tau).g.reduce((a, b) => a + b)) < 1e-12);
  assert.equal(
    edgeRoute({
      score: true,
      supported: true,
    }),
    'local review',
  );
  assert.equal(
    edgeRoute({
      score: 0.8,
      supported: true,
      data: 'restricted',
      online: false,
    }),
    'local answer',
  );
  assert.equal(
    edgeRoute({
      score: 0.79,
      data: 'public',
      approval: true,
      redaction: true,
      online: true,
    }),
    'cloud allowed',
  );
  return true;
}
