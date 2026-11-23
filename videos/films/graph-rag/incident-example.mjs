// The texts, query, seed, and reviewed edges come from the article's incident_graph_lab.py.
export const incidentQuery = 'inference-api latency SLO';
export const incidentNotes = [
  {
    id: 1842,
    topic: 'Cache dependency',
    text: 'inference-api depends on redis-cache. Release 2026.06.14 of inference-api ran in us-east-1. Cache evictions and increased p95 latency were observed during the release.',
  },
  {
    id: 2031,
    topic: 'Cache policy',
    text: 'redis-cache in us-east-1 still uses the old maxmemory policy. The config migration is blocked by a compatibility test.',
  },
  {
    id: 3155,
    topic: 'Breach and rollback',
    text: 'inference-api breached the inference latency SLO twelve minutes after deploy. Rollback restored latency.',
  },
];
const terms = (text) => text.toLowerCase().match(/[\w-]+/g) ?? [];
export const lexicalRows = incidentNotes.map((note) => {
  const words = new Set(terms(note.text));
  return { ...note, matches: terms(incidentQuery).filter((word) => words.has(word)) };
});
const dependency = { from: 'inference-api', relation: 'depends_on', to: 'redis-cache', note: 1842 };
const policy = {
  from: 'redis-cache',
  relation: 'uses_policy',
  to: 'old maxmemory policy',
  note: 2031,
};
const prediction = {
  from: 'inference-api',
  relation: 'will_cause',
  to: 'future SLO breach',
  note: 2031,
};
export function incidentSelection({ hops = 0, changedClaim = false, readPolicy = true } = {}) {
  const selected = new Set(
    lexicalRows
      .filter((row) => row.matches.length && (row.id !== 2031 || readPolicy))
      .sort((a, b) => b.matches.length - a.matches.length || b.id - a.id)
      .slice(0, 2)
      .map((row) => row.id),
  );
  let frontier = ['inference-api'];
  for (let i = 0; i < hops; i++) {
    const next = [];
    for (const edge of [dependency, changedClaim ? prediction : policy]) {
      if (frontier.includes(edge.from) && (edge.note !== 2031 || readPolicy)) {
        next.push(edge.to);
        selected.add(edge.note);
      }
    }
    frontier = next;
  }
  return selected;
}
