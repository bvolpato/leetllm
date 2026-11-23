import { sha, supportBinding, supportReceiptFixture } from './arithmetic.mjs';
import {
  ABSTENTION_TEXT,
  SHIPPING_PASSAGE,
  SHIPPING_QUESTION,
  SHIPPING_EXCEPTION,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  approvedReviewers,
  negated,
  publicationRecords,
  publicationRegistry,
  stop,
  supportCues,
  supportVariants,
} from './fixtures.mjs';
import { track } from './construction.mjs';
import assert from 'node:assert/strict';
const aliases = new Map([
  ['approve', 'review'],
  ['approval', 'review'],
  ['approved', 'review'],
  ['restored', 'restore'],
  ['restores', 'restore'],
  ['restoring', 'restore'],
]);
export function terms(text) {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.map((word) => aliases.get(word) ?? word).filter((word) => !stop.has(word)));
}
export function sharedTerms(question, passage) {
  const available = terms(passage);
  return [...terms(question)].filter((word) => available.has(word));
}
export function similarity(a, b) {
  const x = terms(a),
    y = terms(b);
  return [...x].filter((v) => y.has(v)).length / new Set([...x, ...y]).size;
}
export function publicationDecision(record) {
  const registry = publicationRegistry.get(record.documentId),
    actual = sha(record.text),
    grant = registry?.grant === true && registry.region === record.region,
    matching = registry?.textSha256 === actual;
  return {
    record,
    registry: registry ?? null,
    actual,
    grant,
    matching,
    admitted: grant && matching,
  };
}
export function admissionSnapshot(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [17.094, 18.706][beat],
    mutated = beat === 1 && seconds >= 6.4375;
  const records = publicationRecords.map((r, i) =>
      i === 0 && mutated
        ? {
            ...r,
            text: negated,
          }
        : r,
    ),
    rows = records.map(publicationDecision);
  return {
    seconds,
    mutated,
    rows,
    parserVisible: beat > 0 || seconds >= 1.7,
    registryVisible: beat > 0 || seconds >= 3.2,
    checks: beat > 0 ? 3 : Math.max(0, Math.min(3, Math.floor((seconds - 7.8) / 0.6) + 1)),
    decisions: beat === 0 ? 0 : seconds < 1.2 ? 0 : seconds < 4.2 ? 2 : 3,
    claimedFlag: beat > 0 || seconds >= 12.9375,
    retained: beat > 0 && seconds >= 12.05,
  };
}
export function negationSnapshot(progress) {
  const elapsed = progress * 18.318;
  const insertion = Math.max(0, Math.min(1, (elapsed - 2.1875) / (3.325 - 2.1875)));
  return {
    insertion,
    gap: Math.min(1, 2 * insertion),
    descent: Math.max(0, 2 * insertion - 1),
    inserted: insertion === 1,
  };
}
export function answer(question, passage, receipt) {
  const expected = {
    questionSha256: sha(question),
    chunkTextSha256: sha(passage.text),
    corpusVersion: passage.corpusVersion,
    chunkId: passage.chunkId,
    bindingSha256: supportBinding(question, passage),
  };
  const checks = Object.entries(expected).map(([field, value]) => ({
    field,
    current: value,
    receipt: receipt?.[field] ?? null,
    matches: receipt?.[field] === value,
  }));
  const approvedProtocol = receipt
    ? approvedReviewers.get(`${receipt.method}:${receipt.adjudicatorId}`)
    : undefined;
  const protocolMatches =
    typeof approvedProtocol === 'string' && receipt?.validationRecordId === approvedProtocol;
  const labelValid = ['entailed', 'contradicted', 'unknown'].includes(receipt?.label);
  const receiptIdValid =
    typeof receipt?.receiptId === 'string' && receipt.receiptId.trim().length > 0;
  const bound =
    checks.every((check) => check.matches) && protocolMatches && labelValid && receiptIdValid;
  const deliver = bound && receipt.label === 'entailed';
  return {
    status: deliver ? 'ANSWER' : 'ABSTAIN',
    decisionReason: !receipt
      ? 'missing_review'
      : !bound
        ? 'review_binding_rejected'
        : deliver
          ? 'bound_entailed_review'
          : `supplied_${receipt.label}_review`,
    answer: deliver ? passage.text : ABSTENTION_TEXT,
    citations: deliver
      ? [
          {
            corpusVersion: passage.corpusVersion,
            documentId: passage.documentId,
            chunkId: passage.chunkId,
            section: passage.section,
            span: [0, passage.text.length],
          },
        ]
      : [],
    supportLabel: labelValid ? receipt.label : 'missing',
    supportReceiptId: bound ? receipt.receiptId : null,
    bound,
    checks,
    protocolMatches,
    expected,
  };
}
export function supportSceneSnapshot(progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * 22.546;
  const revealed = supportCues.filter((cue) => elapsed >= cue.at);
  const active = revealed.at(-1)?.id ?? 'entailed';
  const receipt = supportVariants[active];
  return {
    elapsed,
    active,
    receipt,
    response: answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, receipt),
    decisionVisible: revealed.length > 0,
    reviewed: revealed.map((cue) => ({
      id: cue.id,
      response: answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants[cue.id]),
    })),
    bindingProgress: Math.max(0, Math.min(1, (elapsed - 3.7) / (6.5 - 3.7))),
  };
}
export function admit(region) {
  return publicationRecords.filter(
    (record) => record.region === region && publicationDecision(record).admitted,
  );
}
export function research(used, max, cancelled = false) {
  return cancelled ? 'CANCELLED' : used >= max ? 'BUDGET STOP' : 'CAN SEARCH';
}
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  return {
    b,
    p,
    q: b ? 1 : p,
  };
}
export function researchSnapshot(beat, p) {
  const phase =
    beat === 0
      ? p < 0.2
        ? 'plan'
        : p < 0.4
          ? 'search'
          : p < 0.6
            ? 'read'
            : p < 0.75
              ? 'interrupted'
              : 'resumed'
      : p < 0.25
        ? 'verify'
        : p < 0.35
          ? 'search'
          : p < 0.65
            ? 'cancel requested'
            : 'reconciled';
  const used = beat === 0 ? (p < 0.2 ? 0 : p < 0.75 ? 1 : 2) : p < 0.25 ? 2 : 3,
    cancelled = beat === 1 && p >= 0.35;
  return {
    phase,
    used,
    cancelled,
    canSchedule: !cancelled && used < 3,
    worker: phase === 'interrupted' ? 'none' : beat === 0 && p < 0.75 ? 'A' : 'B',
    verified: beat === 1 && p > 0.15 ? 1 : 0,
  };
}
export function readableRankedCandidates(rows, region, limit = 1, filterFirst = true) {
  assert(Number.isSafeInteger(limit) && limit > 0);
  const ranked = [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return filterFirst
    ? ranked.filter((r) => r.region === region).slice(0, limit)
    : ranked.slice(0, limit).filter((r) => r.region === region);
}
export function commitCheckpoint(current, proposed) {
  if (
    current.status === 'cancelled' ||
    proposed.token !== current.token ||
    proposed.steps < current.steps ||
    proposed.steps > current.maxSteps ||
    !Number.isSafeInteger(proposed.steps)
  )
    return {
      accepted: false,
      state: current,
    };
  return {
    accepted: true,
    state: {
      ...current,
      steps: proposed.steps,
      checkpoint: proposed.checkpoint,
    },
  };
}
export function freshShippingAnswer(changed = false) {
  const receipt = supportReceiptFixture(
    SHIPPING_QUESTION,
    SHIPPING_PASSAGE,
    'entailed',
    'shipping-review-v1',
  );
  return answer(changed ? SHIPPING_EXCEPTION : SHIPPING_QUESTION, SHIPPING_PASSAGE, receipt);
}
