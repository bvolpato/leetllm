import { admissionAt } from '../construction.mjs';

const gateCues = ['check-seed', 'check-index', 'check-client', 'check-novelty', 'compare-orders'];
const gates = ['Candidates', 'Seed', 'Overlap', 'Client test', 'Diversity', 'Judge'];
const reasons = ['No seed', 'Exam wording', 'Limit exceeded', 'Near copy', 'Winner changed'];

export function drawEvaluate(ctx, scene, state, api) {
  const { C, focus } = api;
  const motion = gateCues.map((cue) => focus.progress(cue, 0));
  const signedOff = focus.progress('accept-retry', 0) === 1;
  const done = signedOff ? 5 : motion.slice(0, 4).filter((p) => p === 1).length;
  const trace = admissionAt(
    motion.reduce((sum, p) => sum + p, 0),
    done,
    focus.progress('unstable-winner', 0) === 1,
  );
  const centers = [270, 560, 825, 1100, 1380, 1655];

  gates.forEach((gate, i) => api.text(ctx, gate, centers[i], 295, 33, C.muted, 'center'));
  trace.rows.forEach((row, i) => {
    const position = Math.min(trace.progress, row.passedGates + 1);
    const left = Math.min(4, Math.floor(position));
    const x = api.lerp(centers[left], centers[left + 1], position - left);
    const y = 350 + i * 99;
    const accepted = signedOff && row.passedGates === 5;
    const color = row.failed ? C.pink : accepted ? C.green : C.cyan;
    let detail = row.task;
    if (motion[0] > 0 && motion[0] < 1) detail = 'Seed   ' + (row.seed ?? '—');
    if (row.failed) detail = reasons[row.passedGates];
    if (accepted) detail = 'In proposed shard';
    focus.target('candidate-admission', () => {
      if (x > centers[0] + 137) api.line(ctx, centers[0], y + 20, x - 134, y + 20, C.muted, 2);
      api.rect(ctx, x - 123, y - 24, 246, 82, C.panel, color, 12);
      api.text(ctx, row.id, x, y + 7, 31, color, 'center');
      api.text(ctx, detail, x, y + 44, 24, color, 'center');
    });
  });
  focus.target('admission-count', () => {
    let line = trace.survivors + ' of 6 candidates remain';
    if (focus.progress('judge-queue', 0) > 0 && !motion[4])
      line += '    ·    Which two need a judge?';
    if (signedOff) line = '1 row admitted   ·   retry, then fetch the next page';
    api.text(ctx, line, 960, 979, 41, signedOff ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: [...gateCues, 'judge-queue', 'unstable-winner', 'accept-retry', 'enter-shard'],
};
