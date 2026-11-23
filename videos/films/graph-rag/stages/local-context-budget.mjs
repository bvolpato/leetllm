import { CONTEXT_CANDIDATES } from '../fixtures.mjs';
import { packContext } from '../model.mjs';
import { arrow, bookGraph, card, connector, dot, footer, line, text } from '../defaults.mjs';
export function drawLocalContextBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.['local-context-budget-' + id]?.phase === 'after';
  api.focus.target('local-context-budget-mechanism', () => {
    if (currentBeat > 0 && currentBeat < 5) {
      const id = scene.id,
        C = api.C;
      const cue = (name) => state.cues?.[id + '-' + name];
      const p = (name) => cue(name)?.progress ?? 0;
      const second = currentBeat >= 3 && p('new-score') > 0;
      const ranked = CONTEXT_CANDIDATES.map((item) =>
        second && item.id === 'report' ? { ...item, score: 0.99 } : item,
      ).sort((a, b) => b.score - a.score);
      const packed = packContext(ranked, 90);
      const names = { relation: 'Dependency', text: 'Policy note', report: 'Cache report' };
      const colors = { relation: C.cyan, text: C.blue, report: C.yellow };
      const write = (s, x, y, z, col, align = 'left') => text(ctx, api, id, s, x, y, z, col, align);
      write('Space for evidence', 240, 258, 39, C.ink);
      const x = 240,
        y = 306,
        w = 1440,
        h = 150;
      api.rect(ctx, x, y, w, h, C.panel, C.muted, 6);
      let used = 0;
      for (const item of ranked.filter((row) => packed.accepted.includes(row.id))) {
        const action = second
          ? 'place-report'
          : item.id === 'relation'
            ? 'place-edge'
            : 'pack-first';
        const fraction = Math.min(1, p(action) / 0.9);
        const n = item.tokens * fraction;
        if (n > 0)
          api.rect(ctx, x + (used * w) / 90, y, (n * w) / 90, h, colors[item.id], undefined, 4);
        if (fraction === 1) {
          const label = { relation: 'relationship', text: 'text unit', report: 'report' }[item.id];
          write(
            label + ' · ' + item.tokens,
            x + ((used + n / 2) * w) / 90,
            y + 87,
            36,
            C.bg,
            'center',
          );
        }
        used += n;
      }
      write('0', x, 510, 30, C.muted);
      write('90 tokens', x + w, 510, 30, C.muted, 'right');
      write('Candidate', 240, 617, 30, C.muted);
      write('Score', 650, 617, 30, C.muted);
      write('Tokens', 850, 617, 30, C.muted);
      ranked.forEach((item, i) => {
        const baseline = 690 + i * 84;
        write(names[item.id], 240, baseline, 36, colors[item.id]);
        write(item.score.toFixed(2), 650, baseline, 36, C.ink);
        write(String(item.tokens), 850, baseline, 36, C.ink);
      });
      if (second ? done('report-budget') : done('pack-total'))
        write('Used ' + packed.used + ' · remaining ' + packed.remaining, 1080, 706, 38, C.ink);
      const label = second
        ? done('report-budget')
          ? 'Only the report fits in this order.'
          : 'With the report ranked first, what fits?'
        : done('pack-reject')
          ? 'Report 80 > remaining 5 → not admitted'
          : p('pack-first') > 0
            ? 'Will the report fit?'
            : 'Take whole items in descending score order.';
      write(label, 960, 968, 40, C.ink, 'center');
    } else if (currentBeat === 0) {
      dot(ctx, api, 'local-context-budget', 'Query', 210, 560, themeColors.yellow, 85);
      dot(ctx, api, 'local-context-budget', 'Entity', 760, 560, themeColors.blue, 100);
      connector(ctx, api, 315, 560, 640, 560, Math.min(1, progress * 4));
      [
        ['Relations', 1290, 330, themeColors.cyan],
        ['Text units', 1640, 530, themeColors.blue],
        ['Reports', 1290, 740, themeColors.green],
        ['Claims', 1640, 870, themeColors.yellow],
      ].forEach(([v, x, y, col]) => {
        if (v === 'Claims') {
          api.path(
            ctx,
            [
              {
                x: 870,
                y: 560,
              },
              {
                x: 920,
                y: 560,
              },
              {
                x: 920,
                y: 950,
              },
              {
                x: 1640,
                y: 950,
              },
            ],
            {
              color: col,
              width: 3,
            },
          );
          arrow(ctx, api, 1640, 950, 1640, 930, col, 3);
        } else connector(ctx, api, 870, 560, x - 130, y, Math.min(1, progress * 3), col);
        card(ctx, api, 'local-context-budget', v, x - 110, y - 42, 220, 84, col, 27);
      });
      footer(
        ctx,
        api,
        'local-context-budget',
        'Local search begins with semantically related entities; optional claim records are covariates',
      );
    } else {
      bookGraph(ctx, api, 'local-context-budget', {
        y: 500,
      });
      text(
        ctx,
        api,
        'local-context-budget',
        'Supported path contributes ranker features',
        960,
        740,
        36,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'local-context-budget',
        'B1 · B1 · B1 is three slots, one source',
        960,
        855,
        35,
        themeColors.yellow,
        'center',
      );
      footer(
        ctx,
        api,
        'local-context-budget',
        'Deduplicate for coverage; neither proximity nor diversified top-k establishes support or statistical sampling',
      );
    }
  });
}
export default {
  id: 'local-context-budget',
  draw: drawLocalContextBudget,
  cues: [
    'local',
    'place-edge',
    'pack-first',
    'pack-total',
    'pack-reject',
    'new-score',
    'place-report',
    'report-budget',
    'bridge',
  ].map((name) => 'local-context-budget-' + name),
};
