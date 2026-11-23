import { ciDone, codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawRow,
} from '../defaults.mjs';
export function drawTtlReads(ctx, scene, state, api) {
  api.focus.target('ci-ttl-reads-trace', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = codingChapterState('ttl-reads', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      drawHeading(
        ctx,
        api,
        currentBeat === 1
          ? 'One scan samples time once and mutates a copied key list'
          : currentBeat === 0
            ? 'All public read paths share expires_at ≤ now'
            : 'Unread expired storage is distinct from a readable value',
      );
      drawChapterText(
        ctx,
        api,
        'sampled now: 15.000 s',
        960,
        365,
        31,
        themeColors.yellow,
        'center',
      );
      const entries =
        currentBeat === 2
          ? [
              {
                key: 'unread',
                value: 'old',
                deadline: 14,
              },
            ]
          : modelState.entries;
      const rows = [
        ['key', 'stored value', 'deadline'],
        ...entries.map((x) => [
          x.key,
          x.value,
          x.deadline === null ? 'None' : x.deadline.toFixed(3),
        ]),
      ];
      teaching.grid({
        x: 220,
        y: 420,
        width: 1480,
        height: rows.length * 95,
        rows: rows.length,
        columns: 3,
        labels: rows,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.ink,
        fontSize: 29,
      });
      if (currentBeat === 0) {
        const zero = ciDone(state, 'ci-ttl-reads-zero');
        drawChapterCard(
          ctx,
          api,
          zero
            ? 'Separate TTL 0 s at t = 10 s: read now → missing'
            : 'Separate TTL 0 s at t = 10 s: immediate read?',
          230,
          725,
          1460,
          65,
          zero ? themeColors.green : themeColors.yellow,
          26,
        );
        ['get', 'scan', 'CAS extension'].forEach((v, i) =>
          drawChapterCard(ctx, api, v, 240 + i * 530, 820, 450, 90, themeColors.blue, 29),
        );
        drawFooter(
          ctx,
          api,
          modelState.removed
            ? 'task:1 is physically removed at equality'
            : 'deadline comparison is shared by every public read',
        );
      } else if (currentBeat === 1) {
        drawRow(ctx, api, ['task:1', 'task:2'], 370, 790, 1180, 85, themeColors.yellow);
        drawChapterText(
          ctx,
          api,
          modelState.permanent
            ? 'overwrite task:1 → ready / no deadline'
            : modelState.removed
              ? 'copied key task:1 inspected → expired row removed'
              : 'copied key list → safe deletion during scan',
          960,
          965,
          29,
          modelState.permanent ? themeColors.green : themeColors.yellow,
          'center',
        );
      } else {
        drawChapterCard(
          ctx,
          api,
          q > 0.35 ? 'next read → missing + remove' : 'lazy entry remains allocated',
          220,
          725,
          680,
          95,
          themeColors.pink,
          29,
        );
        drawChapterCard(
          ctx,
          api,
          'monotonic clock: unspecified origin',
          1080,
          725,
          620,
          95,
          themeColors.yellow,
          27,
        );
        drawFooter(ctx, api, 'Portable durable timestamps need a separate declared clock contract');
      }
    }
  });
}
export default {
  id: 'ttl-reads',
  draw: drawTtlReads,
  cues: [
    'ci-ttl-reads-0-build',
    'ci-ttl-reads-zero',
    'ci-ttl-reads-1-build',
    'ci-ttl-reads-scan',
    'ci-ttl-reads-overwrite',
    'ci-ttl-reads-2-build',
  ],
};
