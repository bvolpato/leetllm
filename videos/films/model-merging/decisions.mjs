export const tasks = ['Code', 'Math', 'Chat'];
export const policy = { floors: [90, 85, 84], specialists: [93, 88, 87.5], margin: 1 };
export const initialScores = [92.4, 82.1, 87];

export function scoreReport(math = initialScores[1]) {
  const scores = [initialScores[0], math, initialScores[2]];
  const rows = tasks.map((task, i) => {
    const floor = policy.floors[i];
    const source = policy.specialists[i];
    const retained = source - policy.margin;
    const score = scores[i];
    return { task, score, floor, source, retained, pass: score >= floor && score >= retained };
  });
  return {
    rows,
    macro: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    clear: rows.every((row) => row.pass),
  };
}

export const pathScreen = { maxLoss: 0.3, minScore: 84 };
const ridgeLosses = [0.18, 0.2, 0.61, 0.23, 0.19];
const lowLosses = [0.18, 0.12, 0.09, 0.12, 0.19];
const scores = [88, 86, 70, 85, 89];
export const samples = ridgeLosses.map((loss, i) => {
  const alpha = i / (ridgeLosses.length - 1);
  const chord = (1 - alpha) * ridgeLosses[0] + alpha * ridgeLosses.at(-1);
  return {
    alpha,
    loss,
    low: lowLosses[i],
    score: scores[i],
    chord,
    barrier: loss - chord,
    pass: loss <= pathScreen.maxLoss && scores[i] >= pathScreen.minScore,
  };
});

export const taskRows = [
  [0.1, -0.5, 0.02, 0.8],
  [-0.1, 1.1, 0.01, -0.6],
  [0.04, -0.4, 0.03, 0.7],
];
export const trimmedRows = taskRows.map((row) => {
  const keep = row
    .map((v, i) => i)
    .sort((a, b) => Math.abs(row[b]) - Math.abs(row[a]))
    .slice(0, 2);
  return row.map((v, i) => (keep.includes(i) ? v : 0));
});
export function electedColumn(index) {
  const values = trimmedRows.map((row) => row[index]);
  const sum = values.reduce((a, b) => a + b, 0);
  const aligned = values.filter((v) => v !== 0 && Math.sign(v) === Math.sign(sum));
  const total = aligned.reduce((a, b) => a + b, 0);
  return { values, sum, aligned, total, mean: aligned.length ? total / aligned.length : 0 };
}

export function progress(state, id) {
  const cue = state.cues?.[id];
  if (cue?.phase === 'after') return 1;
  return cue?.phase === 'during' ? cue.progress : 0;
}
export function after(state, id) {
  return state.cues?.[id]?.phase === 'after';
}
export function started(state, id) {
  const phase = state.cues?.[id]?.phase;
  return phase === 'during' || phase === 'after';
}
export function signed(value, places = 2) {
  return (value < 0 ? '−' : value > 0 ? '+' : '') + Math.abs(value).toFixed(places);
}
