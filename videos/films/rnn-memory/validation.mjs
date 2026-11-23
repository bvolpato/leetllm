import { norm } from './arithmetic.mjs';
import { cell, hidden, padded, scalar, states } from './fixtures.mjs';
import { incidentFrame, retentionFrame } from './construction.mjs';
import { incidentModel } from './model.mjs';
import assert from 'node:assert/strict';
export function validateIncidentModel() {
  const m = incidentModel(),
    close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} differs from ${b}`);
  assert.deepEqual(m.discount, [0, 1, 1, 1.5]);
  close(m.reverseDiscount.at(-1), 1.564);
  close(m.weightGradient, 0.3310027, 1e-6);
  close(m.weightTerms[2], 0.238277, 1e-6);
  close(m.inputGradient[0], 0.03122679, 1e-6);
  close(m.inputGradient[2], 0.33265666, 1e-6);
  close(m.lstm.nextCell[0], 0.749337529842);
  close(m.lstm.nextHidden[0], 0.507802852628);
  close(m.gru.beforeHidden[0], 0.746354746);
  close(m.gru.afterHidden[1], 0.346848864, 1e-8);
  close(norm(m.clippedGradient), 5);
  close(m.rawGradient[0] * m.clippedGradient[1] - m.rawGradient[1] * m.clippedGradient[0], 0);
  assert.ok(norm(m.matrixPowers[1]) > norm(m.matrixPowers[0]));
  assert.ok(norm(m.matrixPowers[12]) < 0.006);
  close(m.fresh[2], 0.616490554673);
  close(m.fresh[3], 0.298839919683);
  assert.equal(
    incidentFrame('earned-transfer', {
      beat: 0,
      beatP: 1,
      cues: {},
    }).freshVisible,
    0,
  );
  assert.equal(
    incidentFrame('earned-transfer', {
      beat: 1,
      beatP: 1,
      cues: {
        'fresh-first-result': {
          phase: 'after',
        },
      },
    }).freshVisible,
    1,
  );
}
export function validateModel() {
  validateIncidentModel();
  assert.ok(Math.abs(scalar[3] - 0.7643157) < 1e-6);
  assert.ok(Math.abs(states[3][0] - 0.39) < 0.001);
  assert.ok(Math.abs(cell - 0.8399) < 1e-12);
  assert.ok(hidden < cell);
  assert.ok(0.98 ** 12 > 0.78);
  assert.ok(0.6 ** 12 < 0.003);
  assert.ok(Math.abs(0.95 * 0.8 + 0.05 * -0.2 - 0.75) < 1e-12);
  assert.ok(Math.abs(padded[0] - states[2][0]) > 0.1);
  assert.equal(retentionFrame(0, 1).n, retentionFrame(1, 0).n);
  assert.equal(retentionFrame(1, 1).n, retentionFrame(2, 0).n);
  assert.equal(retentionFrame(1, 0).n, 10);
  assert.equal(retentionFrame(1, 2.376 / 18.41).n, 30);
  for (let beat = 0; beat < 3; beat++) {
    let previous = -1;
    for (let i = 0; i <= 100; i++) {
      const current = retentionFrame(beat, i / 100);
      assert.ok(current.n >= previous);
      assert.equal(current.factors[0], 0.98 ** current.n);
      assert.equal(current.factors[1], 0.5 ** current.n);
      previous = current.n;
    }
  }
  return true;
}
