import { sha } from './arithmetic.mjs';
import {
  ABSTENTION_TEXT,
  ADMIN_QUESTION,
  LAB_POLICY,
  NOTE_QUERY,
  PARAPHRASE,
  SHIPPING_EXCEPTION,
  SHIPPING_PASSAGE,
  SHIPPING_QUESTION,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  negated,
  policy,
  publicationRecords,
  supportCues,
  supportVariants,
} from './fixtures.mjs';
import {
  admissionSnapshot,
  admit,
  answer,
  freshShippingAnswer,
  negationSnapshot,
  publicationDecision,
  research,
  researchSnapshot,
  sharedTerms,
  similarity,
  supportSceneSnapshot,
  terms,
} from './model.mjs';
import assert from 'node:assert/strict';
import { managerClaim, reportSources, reportWordCheck, securityClaim } from './report-fixture.mjs';
export function validateModel() {
  assert.deepEqual(
    [SUPPORT_QUESTION, ADMIN_QUESTION, NOTE_QUERY, PARAPHRASE].map(
      (q) => sharedTerms(q, LAB_POLICY).length,
    ),
    [8, 4, 2, 0],
  );
  assert.equal(similarity(policy, policy), 1);
  assert(similarity(policy, negated) > 0.8);
  assert.equal(reportWordCheck(managerClaim, reportSources.us.text), true);
  assert.equal(reportWordCheck(securityClaim, reportSources.us.text), false);
  assert.equal(sharedTerms(SHIPPING_EXCEPTION, SHIPPING_PASSAGE.text).length, 4);
  assert.deepEqual(
    sharedTerms(SHIPPING_QUESTION, SHIPPING_PASSAGE.text),
    sharedTerms(SHIPPING_EXCEPTION, SHIPPING_PASSAGE.text),
  );
  assert.equal(freshShippingAnswer(false).answer, SHIPPING_PASSAGE.text);
  assert.deepEqual(freshShippingAnswer(false).citations[0].span, [0, SHIPPING_PASSAGE.text.length]);
  assert.equal(freshShippingAnswer(true).decisionReason, 'review_binding_rejected');
  assert.deepEqual(freshShippingAnswer(true).citations, []);
  assert.equal(LAB_POLICY.length, 138);
  assert.equal(sha(LAB_POLICY), 'eb9b87d07c79356648462f63b71df1d3251164b2f473d9479f9fa5e2d9eb00d3');
  assert.equal(publicationDecision(publicationRecords[2]).admitted, false);
  assert.equal(
    publicationDecision({
      ...publicationRecords[0],
      text: negated,
    }).admitted,
    false,
  );
  assert.equal(
    publicationDecision({
      ...publicationRecords[2],
      documentId: publicationRecords[0].documentId,
    }).admitted,
    false,
  );
  assert.equal(admissionSnapshot(1, 7 / 18.706).rows[0].matching, false);
  assert.equal(researchSnapshot(0, 0.65).used, 1);
  assert.equal(researchSnapshot(0, 0.8).used, 2);
  assert.equal(researchSnapshot(1, 0.6).canSchedule, false);
  assert.equal(researchSnapshot(1, 0.9).used, 3);
  assert.equal(negationSnapshot(2 / 18.318).insertion, 0);
  assert(negationSnapshot(2.8 / 18.318).insertion > 0);
  assert.equal(negationSnapshot(3.325 / 18.318).inserted, true);
  const slot = 1560 / 9;
  for (let i = 0; i <= 1000; i++) {
    const current = negationSnapshot((2.1875 + (i / 1000) * (3.325 - 2.1875)) / 18.318);
    const wordBottom = 540 + 120 * current.descent + 110;
    const restoredLeft = 180 + (4 + current.gap) * slot;
    const negationRight = 180 + 4 * slot + slot - 8;
    assert(wordBottom <= 660 || restoredLeft >= negationRight);
    if (current.descent > 0) assert.equal(current.gap, 1);
  }
  assert.equal(terms(policy).size, 8);
  assert.equal(terms(negated).size, 9);
  assert.equal(similarity(policy, negated), 8 / 9);
  assert.equal(admit('US').length, 2);
  assert.equal(admit('EU').length, 0);
  const delivered = answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants.entailed);
  assert.equal(delivered.status, 'ANSWER');
  assert.equal(delivered.answer, SUPPORT_PASSAGE.text);
  assert.deepEqual(delivered.citations[0].span, [0, SUPPORT_PASSAGE.text.length]);
  for (const id of ['contradicted', 'unknown', 'missing', 'stale']) {
    const refused = answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants[id]);
    assert.equal(refused.status, 'ABSTAIN');
    assert.equal(refused.answer, ABSTENTION_TEXT);
    assert.deepEqual(refused.citations, []);
  }
  assert.equal(answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants.unknown).bound, true);
  assert.equal(answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants.stale).bound, false);
  for (const [field, value] of Object.entries({
    text: policy + ' Updated.',
    corpusVersion: 'access-policy-corpus-v4',
    documentId: 'other-policy',
    chunkId: 'other-chunk',
    section: 'Other section',
    region: 'EU',
  })) {
    assert.equal(
      answer(
        SUPPORT_QUESTION,
        {
          ...SUPPORT_PASSAGE,
          [field]: value,
        },
        supportVariants.entailed,
      ).status,
      'ABSTAIN',
    );
  }
  assert.equal(
    answer(SUPPORT_QUESTION + ' ', SUPPORT_PASSAGE, supportVariants.entailed).status,
    'ABSTAIN',
  );
  for (const [field, value] of Object.entries({
    receiptId: '',
    bindingSha256: '0'.repeat(64),
    questionSha256: '0'.repeat(64),
    chunkTextSha256: '0'.repeat(64),
    label: 'true',
    method: 'unlisted_method',
    adjudicatorId: 'unlisted-reviewer',
    validationRecordId: 'unapproved-protocol',
  })) {
    assert.equal(
      answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, {
        ...supportVariants.entailed,
        [field]: value,
      }).status,
      'ABSTAIN',
    );
  }
  for (const cue of supportCues) {
    const before = supportSceneSnapshot((cue.at - 0.001) / 22.546),
      after = supportSceneSnapshot((cue.at + 0.001) / 22.546);
    assert.equal(after.active, cue.id);
    assert.equal(after.reviewed.length, supportCues.indexOf(cue) + 1);
    if (cue.id === 'entailed') {
      assert.equal(before.decisionVisible, false);
      assert.equal(after.response.status, 'ANSWER');
    } else {
      assert.notEqual(before.active, after.active);
      assert.equal(after.response.status, 'ABSTAIN');
    }
  }
  for (let i = 0; i <= 100; i++) {
    const snapshot = supportSceneSnapshot(i / 100);
    assert.deepEqual(
      snapshot.response,
      answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, snapshot.receipt),
    );
    assert.equal(snapshot.response.status === 'ANSWER', snapshot.response.citations.length === 1);
  }
  assert.equal(research(3, 3), 'BUDGET STOP');
  assert.equal(research(1, 3, true), 'CANCELLED');
  return true;
}
