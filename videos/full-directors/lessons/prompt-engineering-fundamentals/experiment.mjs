import { facts } from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import { expectedFields } from '../../../films/prompt-engineering-fundamentals/model.mjs';

export const boundaryIncident = { ...facts, elapsed: 31 };
export const boundaryDecision = expectedFields(boundaryIncident);

export function jsonFields(decision) {
  return Object.entries(decision).map(
    ([key, value]) => JSON.stringify(key) + ': ' + JSON.stringify(value),
  );
}

export function experimentReply(explain) {
  return {
    decision: expectedFields(facts),
    explanation: explain ? `${facts.sourceId} allows ${facts.deadline} minutes.` : '',
  };
}

// The experiment parser has already rejected duplicate keys at every nesting level.
export function decisionForScoring(reply) {
  if (
    !reply ||
    Object.keys(reply).length !== 2 ||
    !Object.hasOwn(reply, 'decision') ||
    !Object.hasOwn(reply, 'explanation') ||
    typeof reply.explanation !== 'string' ||
    !reply.decision ||
    typeof reply.decision !== 'object' ||
    Array.isArray(reply.decision)
  ) {
    throw new Error('Invalid experiment response');
  }
  return reply.decision;
}
