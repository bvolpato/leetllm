import { facts, hostReviews, lanes, policy } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function compile(facts) {
  assert(['access', 'policy'].includes(facts.task));
  return {
    request: facts.request,
    data: facts.task === 'access' ? 'private' : facts.data,
    context: facts.context,
    schema: true,
    citations: facts.task === 'access' || facts.citations,
    review: facts.risk >= policy.reviewThreshold,
    ceiling: policy.ceiling,
  };
}
export function violations(lane, contract) {
  return [
    ['data', lane.data === 'both' || lane.data === contract.data],
    ['context', lane.capacity >= contract.context],
    ['schema', !contract.schema || lane.schema],
    ['citations', !contract.citations || lane.citations],
    ['review', !contract.review || lane.review],
    ['cost', lane.cost <= contract.ceiling],
  ]
    .filter(([, pass]) => !pass)
    .map(([field]) => field);
}
export function rank(contract, preference = 'cost', registry = lanes) {
  return registry
    .filter((lane) => !violations(lane, contract).length)
    .sort(
      (a, b) => a[preference] - b[preference] || a.latency - b.latency || a.id.localeCompare(b.id),
    );
}
export function retry(failure, published = false) {
  return !published && ['timeout', 'throttle'].includes(failure);
}
export function execute(
  primaryDuration = 940,
  cap = policy.requestCap,
  context = 24000,
  failure = 'timeout',
) {
  const contract = compile({
      ...facts,
      context,
    }),
    candidates = rank(contract),
    spans = [];
  let elapsed = 0,
    spent = 0,
    reason = 'no compatible lane',
    served = null;
  for (const lane of candidates) {
    if (spans.length >= policy.attempts) {
      reason = 'attempt budget exhausted';
      break;
    }
    if (elapsed >= policy.deadline) {
      reason = 'shared deadline exhausted';
      break;
    }
    if (spans.length && lane.latency >= policy.deadline - elapsed) {
      reason = 'known fallback cannot fit';
      continue;
    }
    if (spent + policy.reservation > cap) {
      reason = 'charge reservation denied';
      break;
    }
    const duration = spans.length ? lane.latency : primaryDuration,
      remaining = policy.deadline - elapsed;
    const span = {
      lane,
      start: elapsed,
      end: elapsed + Math.min(duration, remaining),
      charge: lane.cost,
    };
    elapsed = span.end;
    spent += span.charge;
    spans.push(span);
    if (duration >= remaining) {
      reason = 'shared deadline exhausted';
      break;
    }
    if (spans.length === 1 && failure) {
      reason = 'primary pre-output timeout';
      if (!retry(failure)) break;
    } else {
      served = lane;
      reason = 'transport completed';
      break;
    }
  }
  return {
    contract,
    candidates,
    spans,
    elapsed,
    spent,
    reason,
    served,
    remaining: policy.deadline - elapsed,
  };
}
export class Breaker {
  constructor() {
    this.state = 'closed';
    this.failures = 0;
    this.until = 0;
    this.probeUntil = 0;
  }
  fail(now) {
    this.failures++;
    if (this.failures >= 2 || this.state === 'half open') {
      this.state = 'open';
      this.until = now + 10;
    }
  }
  permit(now) {
    if (this.state === 'half open') {
      if (now >= this.probeUntil) {
        this.state = 'open';
        this.until = now + 10;
      }
      return false;
    }
    if (this.state === 'open') {
      if (now < this.until) return false;
      this.state = 'half open';
      this.probeUntil = now + 2.5;
      return true;
    }
    return true;
  }
  success() {
    this.state = 'closed';
    this.failures = 0;
  }
}
export function replyChecks(reply, evidenceIds = ['E1']) {
  const schema =
    reply.schema === policy.schema &&
    reply.status === 'complete' &&
    typeof reply.answer === 'string' &&
    reply.answer.trim().length > 0;
  const citations =
    Array.isArray(reply.citations) &&
    reply.citations.length > 0 &&
    reply.citations.every((id) => evidenceIds.includes(id)) &&
    new Set(reply.citations).size === reply.citations.length;
  const review = reply.review === 'pending';
  return {
    schema,
    citations,
    review,
    accepted: schema && citations && review,
  };
}
export function grantPayloadHash(request) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        subject: request.subject,
        resource: request.resource,
        role: request.role,
      }),
    )
    .digest('hex');
}
export class GrantLedger {
  constructor() {
    this.rows = new Map();
    this.effects = 0;
  }
  execute(request, permit) {
    const review = hostReviews[permit?.reviewReceipt];
    const authorized =
      permit?.actor === 'operator-3' &&
      review &&
      ['tenant', 'subject', 'resource', 'role'].every((field) => request[field] === review[field]);
    if (!authorized)
      return {
        status: 'denied',
        receipt: null,
        effects: this.effects,
      };
    if (typeof request.operation !== 'string' || !request.operation)
      return {
        status: 'invalid identity',
        receipt: null,
        effects: this.effects,
      };
    const key = `${request.tenant}/${request.operation}`,
      payloadHash = grantPayloadHash(request),
      previous = this.rows.get(key);
    if (previous)
      return previous.payloadHash === payloadHash
        ? {
            status: 'reused',
            receipt: previous,
            effects: this.effects,
          }
        : {
            status: 'conflict',
            receipt: null,
            effects: this.effects,
          };
    const receipt = Object.freeze({
      id: `GR-${request.operation.slice(1)}`,
      key,
      payloadHash,
      subject: request.subject,
      resource: request.resource,
      role: request.role,
      reviewReceipt: permit.reviewReceipt,
      state: 'committed',
    });
    this.rows.set(key, receipt);
    this.effects++;
    return {
      status: 'committed',
      receipt,
      effects: this.effects,
    };
  }
}
