import test from 'node:test';
import assert from 'node:assert/strict';
import {
  policyObjective,
  parseAttackBatch,
  auditCounts,
  judgeAudit,
  budgetProbability,
  chapterFrame,
  releaseAudit,
} from '../animations/constitutional-ai.mjs';

test('policy drift changes the objective without changing the reward fixture', () => {
  const loose = policyObjective(0.2),
    tight = policyObjective(1);
  assert.equal(loose.reward, tight.reward);
  assert.equal(loose.kl, tight.kl);
  assert(loose.objective > loose.referenceObjective);
  assert(tight.objective < tight.referenceObjective);
  assert(Math.abs(loose.objective - 0.0814510485956485) < 1e-12);
});

test('strict batch rejection never records target attempts', () => {
  for (const value of [null, [], [''], ['same', 'same'], [1], ['a', 'b', 'c', 'd', 'e']]) {
    assert.deepEqual(parseAttackBatch(value), { accepted: false, targetAttempts: 0 });
  }
  assert.deepEqual(parseAttackBatch(['one', 'two']), { accepted: true, targetAttempts: 2 });
});

test('unknown judgments retain bounds and cannot become clean defenses', () => {
  const unknown = auditCounts([{ cohort: 'attack', outcome: 'review' }]);
  assert.equal(unknown.asr, null);
  assert.deepEqual(unknown.attackBounds, [0, 1]);
  const release = releaseAudit();
  assert.equal(release.asr, 1 / 5);
  assert.deepEqual(release.attackBounds, [1 / 7, 3 / 7]);
  assert.equal(release.frr, 2 / 8);
  assert.equal(release.helpfulness, 5 / 8);
});

test('inclusive judge thresholds retain middle abstentions and false negatives', () => {
  const result = judgeAudit([
    { id: 'a', truth: 1, probability: 0.8 },
    { id: 'b', truth: 1, probability: 0.2 },
    { id: 'c', truth: 1, probability: 0.5 },
  ]);
  assert.deepEqual(
    result.decisions.map((x) => x.decision),
    ['flag', 'clear', 'review'],
  );
  assert.deepEqual([result.tp, result.fn, result.review], [1, 1, 1]);
  assert.equal(budgetProbability(10, false), 0.1);
  assert(Math.abs(budgetProbability(10) - 0.6513215599) < 1e-12);
});

const cue = (phase) => ({ phase, progress: phase === 'before' ? 0 : 1 });
test('changed drift weight precedes its spoken answer', () => {
  const state = {
    beat: 1,
    beatP: 1,
    cues: {
      'policy-rl-2': cue('after'),
      'policy-changed-answer': cue('before'),
      'policy-base-objective': cue('after'),
      'policy-penalty': cue('after'),
    },
  };
  const pending = chapterFrame('policy-rl', state);
  assert.equal(pending.changed, true);
  assert.equal(pending.changedAnswer, false);
  state.cues['policy-changed-answer'] = cue('after');
  assert.equal(chapterFrame('policy-rl', state).changedAnswer, true);
});

test('third user input does not reveal the assistant disclosure and release question withholds its answer', () => {
  const turn = {
    beat: 0,
    beatP: 1,
    cues: Object.fromEntries(
      ['turn-one', 'turn-two', 'turn-three'].map((id) => [id, cue('after')]),
    ),
  };
  turn.cues['turn-answer'] = cue('before');
  turn.cues['multi-turn-1'] = cue('before');
  assert.equal(chapterFrame('multi-turn', turn).pairs, 3);
  assert.equal(chapterFrame('multi-turn', turn).disclosed, false);
  const release = {
    beat: 3,
    beatP: 1,
    cues: { 'release-transfer': cue('after'), 'release-answer': cue('before') },
  };
  assert.equal(chapterFrame('evaluate', release).answer, false);
  release.cues['release-answer'] = cue('after');
  assert.equal(chapterFrame('evaluate', release).answer, true);
});
