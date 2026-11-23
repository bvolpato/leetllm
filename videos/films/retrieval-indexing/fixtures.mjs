export const DOCS = Object.freeze({
  d1: 'Soup recipe. Make a pot with beans, carrots, and onions. Simmer until tender.',
  d2: 'Cook beans and vegetables together until soft.',
  d3: 'Change the color of a garden sign in settings.',
  d4: 'Soup lunch menu. Tomato soup with bread is served daily.',
});
export const QUERY = 'How do I make soup?';
export const FIXTURE_RERANK_SCORES = {
  d1: 0.92,
  d2: 0.89,
  d4: 0.08,
};
export const GAP_IDS = Object.freeze([12, 20, 25]);
export const RELEVANT = Object.freeze(['d1', 'd2']);
export const CREDENTIAL_ROWS = [
  {
    id: 'd1',
    text: 'Create replacement key → deploy → revoke old key',
    v: [1, 0.4, 0],
    relevant: true,
  },
  {
    id: 'd2',
    text: 'Generate new credential before disabling the previous',
    v: [0.9, 0.9, 0],
    relevant: true,
  },
  {
    id: 'd3',
    text: 'Change a project display name',
    v: [0, 0.2, 1],
    relevant: false,
  },
  {
    id: 'd4',
    text: 'API key quota dashboard · usage limits',
    v: [0.4, 0, 0.3],
    relevant: false,
  },
];
