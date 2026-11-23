import { cosineSimilarity, orderAudit } from './arithmetic.mjs';
import { FIXTURE_PAGE_LIMIT, FIXTURE_RETRY_LIMIT, RESERVED_TASK } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function screenTask(text, reference = RESERVED_TASK) {
  const words = (value) =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}_]+/gu) ?? [];
  const windows = (tokens) => tokens.slice(4).map((_, i) => tokens.slice(i, i + 5).join(' '));
  const tokens = words(text);
  const referenceTokens = words(reference);
  const index = windows(referenceTokens);
  const matches = windows(tokens).flatMap((span, start) => {
    const referenceStart = index.indexOf(span);
    return referenceStart < 0 ? [] : [{ span, start, referenceStart }];
  });
  return { tokens, referenceTokens, matches };
}

const checks = [
  (row) => typeof row.id === 'string' && row.seed === 'S12',
  (row) => screenTask(row.text).matches.length === 0,
  (row) => runSearchFixture(row).accepted,
  (row, pool, cutoff) => pool.every((ref) => cosineSimilarity(ref, row.vector) < cutoff),
  (row) => {
    const audit = orderAudit(...row.votes);
    return audit.stable && audit.forwardA > 0.5;
  },
];

export function admissionEvidence(row) {
  return checks.map((check) => check(row, [[1, 0]], 0.95));
}

function countBeforeFailure(row, pool, cutoff) {
  const failure = checks.findIndex((check) => !check(row, pool, cutoff));
  return failure === -1 ? checks.length : failure;
}

export function passedGateCount(row) {
  return countBeforeFailure(row, [[1, 0]], 0.95);
}

export function screenCandidates(rows, references = [[1, 0]], cutoff = 0.95) {
  const pool = [...references];
  return rows.map((row) => {
    const passedGates = countBeforeFailure(row, pool, cutoff);
    if (passedGates === checks.length) pool.push(row.vector);
    return { ...row, passedGates };
  });
}
export function runSearchFixture(candidate) {
  if (typeof candidate?.run !== 'function')
    throw new TypeError('candidate must provide an executable run(fetchPage) implementation');
  const trace = [];
  let firstPageThrottled = false;
  const fetchPage = (request) => {
    let response;
    if (request.limit > FIXTURE_PAGE_LIMIT)
      response = {
        status: 413,
        items: [],
        nextCursor: null,
        error: 'page limit is 100',
      };
    else if (request.cursor === null && !firstPageThrottled) {
      firstPageThrottled = true;
      response = {
        status: 429,
        items: [],
        nextCursor: null,
        error: 'temporary rate limit',
      };
    } else if (request.cursor === null)
      response = {
        status: 200,
        items: ['Ada', 'Grace'],
        nextCursor: 'page-2',
      };
    else if (request.cursor === 'page-2')
      response = {
        status: 200,
        items: ['Linus'],
        nextCursor: null,
      };
    else
      response = {
        status: 400,
        items: [],
        nextCursor: null,
        error: 'unknown cursor',
      };
    trace.push({
      request: {
        ...request,
      },
      response,
    });
    return response;
  };
  const result = candidate.run(fetchPage);
  const requests = trace.map((event) => event.request);
  const pageLimit = requests.every((request) => request.limit <= FIXTURE_PAGE_LIMIT);
  const expectedItems = JSON.stringify(result.items) === JSON.stringify(['Ada', 'Grace', 'Linus']);
  const cursorSequence = requests.map((request) => request.cursor);
  const attemptsPerCursor = new Map();
  for (const { request } of trace)
    attemptsPerCursor.set(request.cursor, (attemptsPerCursor.get(request.cursor) ?? 0) + 1);
  const retryCount = trace.filter((event) => event.response.status === 429).length;
  const retriedThrottledCursor = trace.some(
    (event, i) => event.response.status === 429 && requests[i + 1]?.cursor === event.request.cursor,
  );
  const checks = {
    pageLimit,
    followedCursor:
      result.complete &&
      expectedItems &&
      JSON.stringify(cursorSequence) === JSON.stringify([null, null, 'page-2']),
    boundedRetry:
      retryCount === 1 &&
      retriedThrottledCursor &&
      [...attemptsPerCursor.values()].every((attempts) => attempts <= FIXTURE_RETRY_LIMIT + 1),
  };
  return {
    result,
    checks,
    accepted: Object.values(checks).every(Boolean),
    requests,
    trace,
    retryCount,
  };
}
export function verifier(candidate) {
  return runSearchFixture(candidate);
}

export function checkSupportLog(candidate) {
  const event = { request_id: 'R17', customer_email: 'reader@example.invalid' };
  const { record, emailRequest } = candidate.log(event);
  const fields = Object.keys(record);
  const allowed =
    emailRequest === 'declined' &&
    fields.length === 1 && fields[0] === 'request_id' && record.request_id === event.request_id;
  return { answer: candidate.answer, fields, emailRequest, allowed };
}
export function syntheticRelease(
  values,
  floors = {
    common: 0.9,
    rare: 0.8,
    unsafe: 0.01,
  },
) {
  assert(
    [...Object.values(values), ...Object.values(floors)].every(
      (v) => Number.isFinite(v) && v >= 0 && v <= 1,
    ),
    'rates and floors must be probabilities',
  );
  return {
    passes: [
      values.common >= floors.common,
      values.rare >= floors.rare,
      values.unsafe <= floors.unsafe,
    ],
    release:
      values.common >= floors.common &&
      values.rare >= floors.rare &&
      values.unsafe <= floors.unsafe,
  };
}
