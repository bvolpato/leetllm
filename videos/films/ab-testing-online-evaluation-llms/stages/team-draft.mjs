import { clamp, mix, sum } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { draftClicks, draftConstruction } from '../model.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawTeamDraft(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'team-draft'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-team-draft-mechanism', () => {
    const a = [
        'retry-budget-guide',
        'rate-limit-reference',
        'idempotency-guide',
        'backoff-examples',
        'gateway-runbook',
      ],
      b = [
        'rate-limit-reference',
        'retry-budget-guide',
        'timeout-runbook',
        'backoff-examples',
        'auth-migration',
      ],
      short = (v) => v.replace('-reference', '').replace('-guide', '').replace('-examples', '');
    if (B < 2) {
      constructionText(ctx, api, 'Ranker A', 260, 280, 32, themeColors.blue);
      constructionText(ctx, api, 'Ranker B', 1470, 280, 32, themeColors.cyan);
      [a, b].forEach((list, j) =>
        list.forEach((v, i) =>
          box(
            ctx,
            api,
            short(v),
            j ? 1320 : 170,
            325 + i * 100,
            430,
            75,
            j ? themeColors.cyan : themeColors.blue,
            25,
          ),
        ),
      );
      const draft = draftConstruction(a, b),
        position =
          B === 0
            ? 0
            : cueProgress('rate', 1) + 2 * cueProgress('retry', 1) + 2 * cueProgress('timeout', 1),
        n = Math.min(5, Math.floor(position)),
        travel = position - n;
      constructionText(ctx, api, 'One displayed list', 960, 280, 31, themeColors.yellow, 'center');
      draft.rows
        .slice(0, n)
        .forEach((r, i) =>
          box(
            ctx,
            api,
            `${i + 1}. ${short(r.id)} · ${r.owner}`,
            675,
            325 + i * 100,
            570,
            75,
            r.owner === 'A' ? themeColors.blue : themeColors.cyan,
            26,
          ),
        );
      if (n < 5 && travel > 0) {
        const row = draft.rows[n],
          left = row.owner === 'A',
          input = left ? a : b,
          sourceY = 362.5 + 100 * input.indexOf(row.id),
          targetY = 362.5 + 100 * n,
          corridor = left ? 638 : 1282,
          points = [
            {
              x: left ? 610 : 1310,
              y: sourceY,
            },
            {
              x: corridor,
              y: sourceY,
            },
            {
              x: corridor,
              y: targetY,
            },
            {
              x: left ? 665 : 1255,
              y: targetY,
            },
          ],
          lengths = points.slice(1).map((z, i) => Math.hypot(z.x - points[i].x, z.y - points[i].y)),
          total = sum(lengths);
        let distance = travel * total,
          at = points[0];
        for (let i = 0; i < lengths.length; i++) {
          if (distance <= lengths[i]) {
            const q = lengths[i] ? distance / lengths[i] : 0;
            at = {
              x: mix(points[i].x, points[i + 1].x, q),
              y: mix(points[i].y, points[i + 1].y, q),
            };
            break;
          }
          distance -= lengths[i];
        }
        api.path(ctx, points, {
          color: left ? themeColors.blue : themeColors.cyan,
          width: 3,
        });
        api.circle(ctx, at.x, at.y, 8, left ? themeColors.blue : themeColors.cyan);
      }
      constructionText(
        ctx,
        api,
        'Seen IDs: ' + n + ' / 5',
        960,
        842,
        26,
        themeColors.muted,
        'center',
      );
      if (resultComplete('clicks', 1)) {
        const clicked = ['retry-budget-guide', 'idempotency-guide', 'timeout-runbook'],
          counts = draftClicks(draft, clicked);
        draft.rows.forEach((r, i) => {
          if (clicked.includes(r.id))
            constructionText(
              ctx,
              api,
              'clicked',
              1185,
              373 + i * 100,
              22,
              themeColors.green,
              'center',
            );
        });
        box(
          ctx,
          api,
          `Clicks: A ${counts.A} · B ${counts.B} → one A query win`,
          510,
          870,
          1100,
          70,
          themeColors.green,
          31,
        );
      }
    } else {
      const draft = draftConstruction(['shared'], ['shared', 'b-only-1', 'b-only-2'], 3, ['A']),
        n = N(3, cueProgress('exhaust', 2));
      constructionText(ctx, api, 'Local exhaustion rule', 240, 295, 33, themeColors.yellow);
      box(ctx, api, ['A list', 'shared / exhausted'], 200, 380, 550, 135, themeColors.blue, 30);
      box(
        ctx,
        api,
        ['B list', 'shared / b-only-1 / b-only-2'],
        1030,
        380,
        680,
        135,
        themeColors.cyan,
        29,
      );
      draft.rows
        .slice(0, n)
        .forEach((r, i) =>
          box(
            ctx,
            api,
            r.id + ' · ' + (r.owner ?? 'neutral'),
            230 + i * 530,
            665,
            480,
            100,
            r.owner ? themeColors.cyan : themeColors.muted,
            30,
          ),
        );
    }
    caption(
      ctx,
      api,
      B === 0
        ? 'Shared leading IDs stay neutral; seen IDs cannot enter twice'
        : B === 2
          ? 'This continuation differs from the paper’s stopping rule'
          : 'Every retained result keeps its contributing ranker identity',
    );
  });
}
export default {
  id: 'team-draft',
  draw: drawTeamDraft,
  cues: [
    'oa-team-draft-0',
    'oa-team-draft-neutral',
    'oa-team-draft-seen',
    'oa-team-draft-1',
    'oa-team-draft-pick',
    'oa-team-draft-list',
    'oa-team-draft-clicks',
    'oa-team-draft-rate',
    'oa-team-draft-retry',
    'oa-team-draft-timeout',
    'oa-team-draft-2',
    'oa-team-draft-exhaust',
  ],
};
