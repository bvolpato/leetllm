import { createHash } from 'node:crypto';
export const sha = (text) => createHash('sha256').update(text).digest('hex');
export function supportBinding(question, passage) {
  return sha(
    JSON.stringify({
      chunk: passage.chunkId,
      corpus: passage.corpusVersion,
      document: passage.documentId,
      question,
      region: passage.region,
      section: passage.section,
      text_sha256: sha(passage.text),
    }),
  );
}
export function supportReceiptFixture(question, passage, label, receiptId) {
  return {
    receiptId,
    bindingSha256: supportBinding(question, passage),
    questionSha256: sha(question),
    corpusVersion: passage.corpusVersion,
    chunkId: passage.chunkId,
    chunkTextSha256: sha(passage.text),
    label,
    method: 'human_review',
    adjudicatorId: 'policy-reviewer-17',
    validationRecordId: 'human-review-protocol-v2',
  };
}
