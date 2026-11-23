import { cueProgress, detailNote, detailTag, detailText, progressArrow } from '../defaults.mjs';
export function drawResearchCheckpoint(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  const tick = (i, total, progress) => Math.max(0, Math.min(1, progress * total - i));
  api.focus.target('research-checkpoint-mechanism', () => {
    if (currentBeat === 0) {
      const progress = cueProgress(ctx, api, 'job-queued'),
        states = ['queued', 'planning', 'researching'];
      states.forEach((v, i) => {
        const x = 350 + i * 610;
        detailTag(ctx, api, v, x, 330, i === 2 ? themeColors.cyan : themeColors.blue, 510);
        if (i < 2)
          progressArrow(
            ctx,
            api,
            x + 280,
            330,
            x + 330,
            330,
            themeColors.cyan,
            tick(i, 2, progress),
          );
      });
      if (progress) {
        detailTag(ctx, api, 'source-batch-2 · 2 of 6 steps', 960, 505, themeColors.yellow, 1280);
      }
      if (cueProgress(ctx, api, 'job-roundtrip')) {
        detailTag(
          ctx,
          api,
          'JSON serialize → reconstruct same state',
          960,
          675,
          themeColors.cyan,
          1390,
        );
        detailText(ctx, api, 'researching / source-batch-2 / 2 / 6', 960, 770, 31, themeColors.ink);
      }
      if (resultComplete('job-cancel'))
        detailText(
          ctx,
          api,
          'cancelled-by-caller → terminal resume rejected',
          960,
          925,
          35,
          themeColors.pink,
        );
      detailNote(
        ctx,
        api,
        'Actual mini-lab is an in-memory serialization round-trip; it is not durable storage or a research worker',
      );
    } else if (currentBeat === 1) {
      detailTag(
        ctx,
        api,
        'Required storage transaction: current fencing token = 8',
        960,
        300,
        themeColors.yellow,
        1600,
      );
      const proposals = [
        {
          owner: 'A · expired',
          token: 7,
          steps: 3,
        },
        {
          owner: 'B · current',
          token: 8,
          steps: 3,
        },
      ];
      proposals.forEach((v, i) => {
        const x = 500 + i * 920;
        detailTag(
          ctx,
          api,
          'Worker ' + v.owner,
          x,
          475,
          i ? themeColors.cyan : themeColors.pink,
          740,
        );
        detailText(
          ctx,
          api,
          'proposed token ' + v.token + ' / checkpoint write',
          x,
          580,
          29,
          themeColors.ink,
        );
        if (cueProgress(ctx, api, 'worker-fence')) {
          progressArrow(
            ctx,
            api,
            x,
            640,
            x,
            735,
            i ? themeColors.cyan : themeColors.pink,
            cueProgress(ctx, api, 'worker-fence'),
          );
          detailText(
            ctx,
            api,
            resultComplete('worker-fence')
              ? v.token === 8
                ? 'ACCEPT current token'
                : 'REJECT stale token'
              : 'Checkpoint write pending',
            x,
            815,
            34,
            resultComplete('worker-fence')
              ? v.token === 8
                ? themeColors.green
                : themeColors.pink
              : themeColors.muted,
          );
        }
      });
      if (cueProgress(ctx, api, 'job-reconcile'))
        detailText(
          ctx,
          api,
          'In-flight remote result → reconcile observed outcome',
          960,
          940,
          33,
          themeColors.yellow,
        );
      detailNote(
        ctx,
        api,
        'Illustrative ownership contract; destination-enforced operation keys are a separate requirement',
      );
    } else {
      const limits = [
        ['Steps', 2, 6, true],
        ['Sources', null, 12, false],
        ['Elapsed seconds', null, 300, false],
      ];
      limits.forEach(([name, n, max, implemented], i) => {
        const y = 360 + i * 190;
        detailText(ctx, api, name, 390, y, 33, themeColors.blue);
        detailText(
          ctx,
          api,
          n === null ? 'Not enforced by this mini-lab' : n + ' / ' + max,
          1140,
          y,
          31,
          implemented ? themeColors.green : themeColors.yellow,
        );
        if (implemented && resultComplete('budget-limits'))
          detailText(ctx, api, 'implemented', 1660, y, 28, themeColors.green);
        if (!implemented && cueProgress(ctx, api, 'job-other-limits'))
          detailText(ctx, api, 'required', 1660, y, 28, themeColors.yellow);
      });
      if (resultComplete('job-browser'))
        detailText(
          ctx,
          api,
          'Browser disconnect ≠ server cancellation record',
          960,
          945,
          35,
          themeColors.pink,
        );
      detailNote(
        ctx,
        api,
        'Preserve checkpoint, budget use and uncertain-operation receipts after cancellation',
      );
    }
  });
  return;
}
export default {
  id: 'research-checkpoint',
  draw: drawResearchCheckpoint,
  cues: [
    'checkpoint-proof',
    'job-queued',
    'job-roundtrip',
    'job-cancel',
    'worker-fence',
    'job-persist',
    'job-old-writer',
    'job-reconcile',
    'budget-limits',
    'job-other-limits',
    'job-browser',
  ],
};
