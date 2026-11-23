import {
  drawDecisionMark,
  drawFooter,
  drawHeading,
  drawLine,
  drawTag,
  drawText,
} from '../defaults.mjs';
export function drawExternalJoin(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-external-join-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-external-join-mechanism', () => {
    const rows = [
        {
          id: 'key',
          tenant: 'A',
          grant: 'security',
        },
        {
          id: 'FAQ',
          tenant: 'A',
          grant: 'operations',
        },
        {
          id: 'FAQ',
          tenant: 'B',
          grant: 'operations',
        },
        {
          id: 'missing',
          tenant: 'A',
          grant: null,
        },
      ],
      q = Q('join', 0);
    drawHeading(ctx, api, 'Ranked IDs inside trusted service');
    drawHeading(ctx, api, 'Tenant-qualified policy relation', 1050);
    rows.forEach((r, i) => {
      const y = 365 + i * 130;
      drawTag(
        ctx,
        api,
        r.tenant + ':' + r.id,
        'candidate rank ' + (i + 1),
        170,
        y,
        570,
        themeColors.blue,
      );
      drawTag(
        ctx,
        api,
        r.tenant + ':' + r.id,
        r.grant ?? 'missing policy → ∅',
        1060,
        y,
        640,
        r.grant ? themeColors.yellow : themeColors.pink,
      );
      if (q * 4 >= i + 1) drawLine(ctx, api, 760, y + 48, 1045, y + 48, themeColors.cyan);
      if (currentBeat > 0 && resultComplete('grant', 1))
        drawDecisionMark(
          ctx,
          api,
          r.tenant === 'A' && r.grant === 'operations' && !resultComplete('empty', 1),
          905,
          y + 110,
        );
    });
    if (currentBeat > 0) {
      const empty = resultComplete('empty', 1);
      drawText(
        ctx,
        api,
        empty ? 'Caller groups = ∅' : 'Caller groups = {operations}',
        960,
        925,
        31,
        empty ? themeColors.pink : themeColors.yellow,
        'center',
      );
      if (resultComplete('only', 1))
        drawText(
          ctx,
          api,
          empty ? 'Returned: ∅' : 'Returned: A:FAQ only',
          960,
          975,
          32,
          empty ? themeColors.pink : themeColors.green,
          'center',
        );
    }
    drawFooter(
      ctx,
      api,
      'Resolved user memberships stay outside chunks; freshness and source semantics remain mandatory.',
    );
  });
}
export default {
  id: 'external-join',
  draw: drawExternalJoin,
  cues: [
    'sr-external-join-0',
    'sr-external-join-join',
    'sr-external-join-1',
    'sr-external-join-grant',
    'sr-external-join-only',
    'sr-external-join-empty',
    'sr-external-join-2',
  ],
};
