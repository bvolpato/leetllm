import assert from 'node:assert/strict';
import { reply, intake, observations, dispatch } from './read-path.mjs';
import { approval, transaction, expiry, practice } from './write-path.mjs';
import { evaluation, accounting } from './evaluation.mjs';
import {
  checkMechanism,
  lab,
  repair,
  review,
  saved,
  expiryAt,
  attempts,
  matchingFields,
  audit,
} from './mechanism.mjs';

const scenes = {
  c01: reply,
  c02: intake,
  c03: observations,
  c04: dispatch,
  c05: approval,
  c06: transaction,
  c07: expiry,
  c08: evaluation,
  'c08-budget': accounting,
  c09: practice,
};

function draw(ctx, clock) {
  const { chapterId, beatIndex } = clock.beat;
  function at(beat, phrase, duration = 0) {
    if (beatIndex < beat) return 0;
    if (beatIndex > beat) return 1;
    return clock.reveal(phrase, duration);
  }
  function after(beat, phrase, duration = 0) {
    if (beatIndex !== beat) return Number(beatIndex > beat);
    const { start, end } = clock.wordCue(phrase);
    const spoken = clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    if (!spoken || !duration) return Number(spoken);
    return Math.max(0, Math.min(1, (clock.elapsed - end) / duration));
  }
  ctx.save();
  ctx.scale(2, 2);
  scenes[chapterId](ctx, at, after);
  ctx.restore();
}

function check() {
  checkMechanism();
  assert.deepEqual(matchingFields(saved), [
    lab.packet.account_id,
    lab.packet.scope,
    lab.packet.expires_at,
  ]);
  assert.equal(lab.approval.packet_digest, review);
  assert.equal(expiryAt(saved.expiresAt).count, attempts[2].count);
  assert.deepEqual(
    repair.steps.map((s) => s.effects),
    [0, 0, 1, 1],
  );
  assert.equal(
    audit('duplicate').rows.filter((r) => r.episode === 'grounded_access_draft').length,
    2,
  );
  return true;
}
export default { title: 'Build an Agent Whose Actions Stay Bound', draw, check };
