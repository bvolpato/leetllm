import { cueProgress, heard } from '../construction.mjs';

export function drawDiagnosticEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const rootChanged = heard(state, 1, 'log-root');
  const countChanged = heard(state, 0, 'log-count') && !heard(state, 1, 'log-reset');
  if (state.beat === 3) {
    focus.target('log-detail', () => {
      api.text(ctx, 'What does each rank record?', 160, 295, 43, C.ink);
      const rows = [
        ['A rank never entered', 'Compare call tuples and the earliest local error.'],
        ['All kernels launched', 'Compare per-rank RAS progress counters.'],
        ['Mixed NCCL versions', 'NCCL_DEBUG=WARN'],
      ];
      rows.forEach(([evidence, action], i) => {
        const y = 428 + i * 148;
        api.text(ctx, evidence, 170, y, 39, C.ink);
        api.text(ctx, action, 816, y, 36, C.cyan, 'left', i === 2 ? 'mono' : 'sans');
        api.line(ctx, 172, y + 48, 1740, y + 48, C.muted, 2);
      });
      if (heard(state, 3, 'log-levels'))
        api.text(ctx, 'NCCL_DEBUG_LEVELS=ATTN', 816, 859, 37, C.cyan, 'left', 'mono');
      if (heard(state, 3, 'log-restore'))
        api.text(
          ctx,
          'Restore automatic algorithm and protocol selection.',
          960,
          989,
          34,
          C.ink,
          'center',
        );
    });
    return;
  }
  const baseline = ['sum all-reduce    count 4', 'broadcast    root 0'];
  let variant = baseline;
  let verdict = false;
  if (cueProgress(state, 1, 'log-swap') > 0) {
    variant = [baseline[1], baseline[0]];
    verdict = heard(state, 1, 'log-swap');
  } else if (cueProgress(state, 1, 'log-missing') > 0) {
    variant = [baseline[0], 'missing'];
    verdict = heard(state, 1, 'log-missing');
  } else if (rootChanged) {
    variant = [baseline[0], 'broadcast    root 1'];
    verdict = heard(state, 1, 'log-second');
  } else if (countChanged) {
    variant = ['sum all-reduce    count 3', baseline[1]];
    verdict = heard(state, 1, 'log-first');
  }
  const mismatch = baseline.findIndex((call, i) => call !== variant[i]);
  const scan = verdict ? mismatch : Number(rootChanged && cueProgress(state, 1, 'log-scan') > 0);
  focus.target('log-table', () => {
    const x = [738, 1410];
    for (let seq = 0; seq < 2; seq++)
      api.text(ctx, 'Sequence ' + seq, x[seq], 297, 37, scan === seq ? C.ink : C.muted, 'center');
    for (let rank = 0; rank < 4; rank++) {
      const y = 399 + 109 * rank;
      api.text(ctx, 'Rank ' + rank, 165, y + 12, 35, C.ink);
      const changed = rank === 2;
      const entries = changed ? variant : baseline;
      entries.forEach((entry, seq) => {
        const bad = changed && verdict && seq === mismatch;
        api.rect(ctx, x[seq] - 290, y - 43, 580, 86, C.panel, bad ? C.pink : C.muted, 6);
        api.text(ctx, entry, x[seq], y + 12, 35, bad ? C.pink : C.ink, 'center', 'mono');
      });
    }
    const response = verdict ? String(mismatch) : '?';
    api.text(
      ctx,
      'first_divergence(logs)  →  ' + response,
      960,
      882,
      45,
      C.yellow,
      'center',
      'mono',
    );
  });
  focus.target('log-detail', () => {
    const detail =
      state.beat === 2 && cueProgress(state, 2, 'log-warn') > 0
        ? 'NCCL_DEBUG=WARN    ·    Focus INFO on INIT, NET and GRAPH if needed'
        : 'One communicator   ·   float32   ·   broadcast count 4';
    api.text(ctx, detail, 960, 981, 32, C.muted, 'center', state.beat === 2 ? 'mono' : 'sans');
  });
}
export default {
  id: 'diagnostic-evidence',
  draw: drawDiagnosticEvidence,
  cues: [
    'log-count',
    'log-first',
    'log-reset',
    'log-root',
    'log-scan',
    'log-second',
    'log-missing',
    'log-swap',
    'log-evidence',
    'log-warn',
    'log-progress',
    'log-levels',
    'log-restore',
  ],
};
