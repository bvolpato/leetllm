import { incidentNotes, incidentSelection } from '../../../films/graph-rag/incident-example.mjs';
import { walk } from '../../../films/graph-rag/model.mjs';

export const dependsOn = {
  from: 'inference-api',
  relation: 'depends_on',
  to: 'redis-cache',
  source: 1842,
};
export const usesPolicy = {
  from: dependsOn.to,
  relation: 'uses_policy',
  to: 'old maxmemory policy',
  source: 2031,
};
export const forecast = {
  from: dependsOn.from,
  relation: 'will_cause',
  to: 'future SLO breach',
  source: usesPolicy.source,
};

export function sourceSentence(edge) {
  const record = incidentNotes.find((note) => note.id === edge.source);
  return record.text.split('. ')[0] + '.';
}

// The lexical hits stay in context while the reader replays the directed walk.
export function traceIncident(seed, secondEdge, depth, readPolicy) {
  const edges = secondEdge ? [dependsOn, secondEdge] : [dependsOn];
  const available = edges.filter((edge) => depth >= 2 || (depth === 1 && edge.from === seed));
  const records = Object.fromEntries(
    incidentNotes.map(({ id }) => [
      id,
      { allowed: id !== usesPolicy.source || readPolicy, version: 1, currentVersion: 1 },
    ]),
  );
  const { sources } = walk(seed, available, records);
  return {
    seed,
    secondEdge,
    readPolicy,
    traversed: new Set(sources),
    selected: new Set([...incidentSelection({ readPolicy }), ...sources]),
  };
}
