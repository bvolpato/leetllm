import { cueDone, cueProgress } from '../construction.mjs';
import { freshEvidence } from '../model.mjs';
import { chapterText, focusTargets, footer, panel } from '../defaults.mjs';
export function drawFreshEvidence(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const movement = cueProgress(state, 'fresh-repair', 1, 0.2),
      old = freshEvidence(false),
      now = freshEvidence(movement >= 0.999),
      x = 230,
      y = 350,
      w = 690,
      h = 245;
    chapterText(
      ctx,
      api,
      'New frozen query IDs · same labels and tenant context',
      960,
      280,
      29,
      themeColors.blue,
      'center',
    );
    const key = (r) =>
        r.baseline
          ? r.candidate
            ? 'both'
            : 'baselineOnly'
          : r.candidate
            ? 'candidateOnly'
            : 'neither',
      cells = {
        both: [x, y, themeColors.green],
        baselineOnly: [1000, y, themeColors.pink],
        candidateOnly: [x, 665, themeColors.cyan],
        neither: [1000, 665, themeColors.muted],
      };
    focusTargets(ctx, api, ['fresh-population', 'fresh-repair'], () => {
      for (const [name, [cx, cy, color]] of Object.entries(cells)) {
        const inTransit =
          movement > 0 && movement < 0.999 && (name === 'both' || name === 'baselineOnly');
        if (inTransit) {
          api.rect(ctx, cx, cy, w, h, themeColors.panel, 'transparent', 0);
          api.path(
            ctx,
            [
              {
                x: cx + 170,
                y: cy + h,
              },
              {
                x: cx + w,
                y: cy + h,
              },
              {
                x: cx + w,
                y: cy,
              },
              {
                x: cx,
                y: cy,
              },
              {
                x: cx,
                y: cy + h,
              },
              {
                x: cx + 15,
                y: cy + h,
              },
            ],
            color,
            2,
          );
          api.line(ctx, cx + 15, cy + h - 7, cx + 15, cy + h + 7, themeColors.yellow, 3);
          api.line(ctx, cx + 170, cy + h - 7, cx + 170, cy + h + 7, themeColors.yellow, 3);
        } else panel(ctx, api, cx, cy, w, h, color);
        const count = now.counts[name];
        chapterText(
          ctx,
          api,
          `${
            {
              both: 'Both',
              baselineOnly: 'Baseline only',
              candidateOnly: 'Candidate only',
              neither: 'Neither',
            }[name]
          }: ${count}`,
          cx + 20,
          cy + 40,
          28,
          color,
        );
      }
      const positions = new Map(),
        slot = {};
      for (const row of old.rows) {
        const bucket = key(row),
          i = slot[bucket] ?? 0;
        slot[bucket] = i + 1;
        const [cx, cy] = cells[bucket];
        positions.set(row.id, [cx + 30 + (i % 9) * 70, cy + 70 + Math.floor(i / 9) * 58]);
      }
      old.rows.forEach((row) => {
        let [rx, ry] = positions.get(row.id);
        const repaired = [18, 19].includes(Number(row.id.slice(4)));
        if (repaired) {
          const n = 18 + (Number(row.id.slice(4)) - 18),
            tx = x + 30 + (n % 9) * 70,
            ty = y + 70 + Math.floor(n / 9) * 58;
          if (movement < 0.3) {
            ry = api.lerp(ry, 615, movement / 0.3);
          } else if (movement < 0.7) {
            rx = api.lerp(rx, tx, (movement - 0.3) / 0.4);
            ry = 615;
          } else {
            rx = tx;
            ry = api.lerp(615, ty, (movement - 0.7) / 0.3);
          }
        }
        panel(ctx, api, rx, ry, 57, 43, repaired ? themeColors.yellow : cells[key(row)][2]);
        chapterText(
          ctx,
          api,
          row.id.slice(4),
          rx + 28,
          ry + 29,
          22,
          repaired ? themeColors.yellow : themeColors.ink,
          'center',
        );
      });
    });
    focusTargets(ctx, api, ['fresh-candidate', 'fresh-points'], () => {
      if (currentBeat === 1) {
        chapterText(
          ctx,
          api,
          cueDone(state, 'fresh-candidate', 1, 0.5)
            ? 'Baseline 21/40 → candidate 26/40'
            : 'Baseline 21/40 · predict candidate after repair',
          960,
          950,
          32,
          themeColors.yellow,
          'center',
        );
        if (cueDone(state, 'fresh-points', 1, 0.65))
          chapterText(
            ctx,
            api,
            '+12.5 percentage points · one regression remains',
            960,
            1010,
            28,
            themeColors.yellow,
            'center',
          );
      }
    });
    focusTargets(ctx, api, ['fresh-service', 'fresh-hold'], () => {
      if (currentBeat === 2) {
        panel(ctx, api, 310, 910, 1300, 105, themeColors.pink);
        chapterText(
          ctx,
          api,
          cueDone(state, 'fresh-service', 2, 0.35)
            ? 'p95 780 ms PASS · 39/40 = 97.5% FAIL'
            : 'p95 780 ms · one timeout among 40 attempts',
          960,
          955,
          32,
          themeColors.pink,
          'center',
        );
        if (cueDone(state, 'fresh-hold', 2, 0.5))
          chapterText(
            ctx,
            api,
            'HOLD · retrieval gain cannot repair availability',
            960,
            1000,
            29,
            themeColors.pink,
            'center',
          );
      }
    });
    if (currentBeat === 0)
      footer(
        ctx,
        api,
        'Predict the repaired candidate total, net gain and separate release decision',
      );
  }
}
export default {
  id: 'fresh-evidence',
  draw: drawFreshEvidence,
  cues: [
    'fresh-population',
    'fresh-repair',
    'fresh-candidate',
    'fresh-points',
    'fresh-service',
    'fresh-hold',
  ],
};
