import { permutations, sha, tally } from './arithmetic.mjs';
import {
  accepted,
  editedPassage,
  leakageQuestions,
  normalize,
  quarantineIds,
  records,
  referencePassage,
  referenceRows,
  releaseRows,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function contaminationTrace(beat, progress) {
  const edited = beat > 1 || (beat === 1 && progress >= 0.66);
  const candidate = edited ? editedPassage : referencePassage;
  const words = normalize(candidate).split(' '),
    reference = normalize(referencePassage).split(' ');
  const spans = words
    .slice(0, Math.max(0, words.length - 12))
    .map((_, i) => words.slice(i, i + 13).join(' '));
  const matches = spans.filter((span) => reference.join(' ').includes(span));
  return {
    candidate,
    edited,
    matches,
    detected: matches.length > 0,
  };
}
export function leakageComparison(includeCopy = true) {
  const training = includeCopy ? [records[0], records[2]] : [records[2]];
  const answers = leakageQuestions.map((row) => {
    const matched = training.find((candidate) => normalize(candidate.text) === normalize(row.text));
    const prediction = matched?.label ?? 'standard';
    return {
      ...row,
      prediction,
      matchedId: matched?.id ?? null,
      correct: prediction === row.label,
    };
  });
  return {
    training,
    answers,
    correct: answers.filter((row) => row.correct).length,
    total: answers.length,
  };
}
export function leakageSceneSnapshot(beat, progress) {
  const elapsed = beat === 1 ? progress * 18.626 : beat > 1 ? Infinity : 0;
  const moved =
    beat === 0 ? 0 : beat > 1 ? 1 : Math.max(0, Math.min(1, (elapsed - 0.1) / (2.4375 - 0.1)));
  const clean = moved === 1;
  return {
    elapsed,
    moved,
    clean,
    showResult: beat === 0 || elapsed >= 8.5375,
    comparison: leakageComparison(!clean),
  };
}
export function normalizationStates(value) {
  const unicode = value.normalize('NFKC');
  const lower = unicode.toLocaleLowerCase('en-US');
  return [value, unicode, lower, lower.trim().replace(/\s+/g, ' ')];
}
export function releaseTrace(progress) {
  const stage = Math.min(3, Math.floor(Math.max(0, Math.min(1, progress)) * 4));
  const retained =
    stage === 0
      ? records
      : stage === 1
        ? accepted
        : stage === 2
          ? accepted.filter((row) => !quarantineIds.has(row.id))
          : releaseRows;
  return {
    stage,
    retained,
    excluded: records.filter((row) => !retained.includes(row)),
  };
}
export function fixtureNormalize(text) {
  const nfkc = text.normalize('NFKC');
  assert(/^[\x00-\x7fßẞ\s]*$/u.test(nfkc), 'Outside the illustrated casefold subset');
  return nfkc.toLowerCase().replaceAll('ß', 'ss').trim().replace(/\s+/g, ' ');
}
export function referenceSplit(conversation) {
  const digest = sha(conversation),
    prefix = digest.slice(0, 8),
    bucket = parseInt(prefix, 16) % 100;
  return {
    digest,
    prefix,
    bucket,
    split: bucket < 70 ? 'train' : bucket < 85 ? 'validation' : 'test',
  };
}
export function candidateRejectReason(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return 'not_an_object';
  if (!['ticket_id', 'conversation_id', 'text', 'label'].every((key) => Object.hasOwn(row, key)))
    return 'missing_field';
  if (!Number.isSafeInteger(row.ticket_id) || row.ticket_id <= 0) return 'invalid_ticket_id';
  if (
    typeof row.conversation_id !== 'string' ||
    !row.conversation_id.trim() ||
    row.conversation_id !== row.conversation_id.trim()
  )
    return 'invalid_conversation_id';
  if (typeof row.text !== 'string' || !row.text.trim()) return 'blank_text';
  if (!['standard', 'escalate'].includes(row.label)) return 'invalid_label';
  return null;
}
export function prepareCandidate(input) {
  const counts = new Map(),
    groups = new Map(),
    rejected = [],
    kept = [];
  for (const r of input)
    if (r && Number.isSafeInteger(r.ticket_id))
      counts.set(r.ticket_id, (counts.get(r.ticket_id) ?? 0) + 1);
  for (const raw of input) {
    const reason =
      candidateRejectReason(raw) ?? (counts.get(raw.ticket_id) > 1 ? 'duplicate_ticket_id' : null);
    if (reason) {
      rejected.push({
        ticket_id: raw?.ticket_id ?? null,
        reason,
      });
      continue;
    }
    const text = fixtureNormalize(raw.text),
      row = {
        ticket_id: raw.ticket_id,
        conversation_id: raw.conversation_id,
        text,
        label: raw.label,
        text_sha256: sha(text),
      };
    const g = groups.get(text) ?? [];
    g.push(row);
    groups.set(text, g);
  }
  for (const group of groups.values()) {
    const labels = new Set(group.map((r) => r.label)),
      conversations = new Set(group.map((r) => r.conversation_id));
    const reason =
      labels.size > 1
        ? 'label_conflict'
        : conversations.size > 1
          ? 'cross_conversation_duplicate'
          : null;
    if (reason) {
      rejected.push(
        ...group.map((r) => ({
          ticket_id: r.ticket_id,
          reason,
        })),
      );
      continue;
    }
    group.sort((a, b) => a.ticket_id - b.ticket_id);
    kept.push({
      ...group[0],
      split: referenceSplit(group[0].conversation_id).split,
    });
    rejected.push(
      ...group.slice(1).map((r) => ({
        ticket_id: r.ticket_id,
        reason: 'exact_duplicate',
      })),
    );
  }
  kept.sort((a, b) => a.ticket_id - b.ticket_id);
  rejected.sort(
    (a, b) =>
      String(a.ticket_id).localeCompare(String(b.ticket_id)) || a.reason.localeCompare(b.reason),
  );
  return {
    kept,
    rejected,
  };
}
export function pythonFixtureJSONL(rows) {
  return (
    rows
      .map(
        (row) =>
          '{' +
          Object.keys(row)
            .sort()
            .map((k) => JSON.stringify(k) + ': ' + JSON.stringify(row[k]))
            .join(', ') +
          '}',
      )
      .join('\n') + (rows.length ? '\n' : '')
  );
}
export const referenceCandidate = prepareCandidate(referenceRows);
export const referenceBytes = pythonFixtureJSONL(referenceCandidate.kept);
export const referenceDigest = sha(referenceBytes);
export function candidateInvariants(
  rows,
  rejected,
  {
    bytes = pythonFixtureJSONL(rows),
    expected = referenceCandidate,
    expectedBytes = referenceBytes,
    rawCount = 12,
  } = {},
) {
  const groups = new Map();
  for (const row of rows) {
    const g = groups.get(row.conversation_id) ?? new Set();
    g.add(row.split);
    groups.set(row.conversation_id, g);
  }
  return {
    groups:
      [...groups.values()].every((g) => g.size === 1) &&
      rows.every((r) => referenceSplit(r.conversation_id).split === r.split),
    bytes:
      sha(bytes) === sha(expectedBytes) &&
      sha(pythonFixtureJSONL(rejected)) === sha(pythonFixtureJSONL(expected.rejected)),
    schema: rows.every((r) => candidateRejectReason(r) === null),
    fingerprints: rows.every(
      (r) => r.text === fixtureNormalize(r.text) && r.text_sha256 === sha(r.text),
    ),
    unique:
      new Set(rows.map((r) => r.ticket_id)).size === rows.length &&
      new Set(rows.map((r) => r.text)).size === rows.length,
    counts:
      rows.length === expected.kept.length &&
      rows.length + rejected.length === rawCount &&
      JSON.stringify(tally(rows, 'split')) === JSON.stringify(tally(expected.kept, 'split')) &&
      JSON.stringify(tally(rejected, 'reason')) ===
        JSON.stringify(tally(expected.rejected, 'reason')),
  };
}
export function bandCandidates(a, b, rowsPerBand) {
  assert(
    a.length === b.length &&
      a.length > 0 &&
      Number.isInteger(rowsPerBand) &&
      rowsPerBand > 0 &&
      a.length % rowsPerBand === 0,
    'Complete equal-length bands required',
  );
  const matched = a.map((v, i) => v === b[i]);
  const bands = Array.from(
    {
      length: a.length / rowsPerBand,
    },
    (_, i) => matched.slice(i * rowsPerBand, (i + 1) * rowsPerBand).every(Boolean),
  );
  return {
    matched,
    bands,
    estimate: matched.filter(Boolean).length / a.length,
    candidate: bands.some(Boolean),
  };
}
export function idealCandidateProbability(similarity, bands, rows) {
  assert(
    Number.isFinite(similarity) &&
      similarity >= 0 &&
      similarity <= 1 &&
      Number.isInteger(bands) &&
      bands > 0 &&
      Number.isInteger(rows) &&
      rows > 0,
  );
  return 1 - (1 - similarity ** rows) ** bands;
}
export const minhashCases = Object.freeze(
  permutations(['a', 'b', 'c', 'd']).map((order) => ({
    order,
    a: order.find((x) => x !== 'd'),
    b: order[0],
    match: order[0] !== 'd',
  })),
);
export function shingleComparison(a, b) {
  const left = new Set(a),
    right = new Set(b),
    intersection = [...left].filter((x) => right.has(x)),
    union = [...new Set([...left, ...right])];
  return {
    intersection,
    union,
    score: union.length ? intersection.length / union.length : 0,
  };
}
export const newSceneIds = new Set([
  'contract-semantics',
  'unicode-recipe',
  'group-leakage',
  'minhash-rankings',
  'lsh-bands',
  'cluster-chain',
  'contamination-audit',
  'privacy-spans',
  'corpus-selection',
  'perplexity',
  'synthetic-gates',
  'candidate-builder',
  'candidate-contract',
  'coverage-audit',
  'version-trust',
  'fresh-candidate',
]);
