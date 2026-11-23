import { shards } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawCollective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    if (currentBeat === 0) {
      const count = Math.min(2, Math.floor(3 * phaseForBeat(0))),
        sum = result.total.map((v, i) => (i < count ? v : '·')),
        gather = [...result.left, ...result.right].map((v, i) => (i < 2 * count ? v : '·'));
      api.focus.target('collective-all-reduce-sums-all-gather-concatenates', () =>
        drawOriginalText(
          ctx,
          api,
          'All-reduce sums; all-gather concatenates',
          960,
          285,
          40,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('collective-all-reduce-1-4-16-1', () =>
        drawOriginalCard(
          ctx,
          api,
          'All-reduce: [1, 4] + [16, 1]',
          350,
          430,
          1220,
          themeColors.blue,
        ),
      );
      api.focus.target('collective-readout', () =>
        drawOriginalCard(
          ctx,
          api,
          'Every GPU receives [' + sum.join(', ') + ']',
          350,
          555,
          1220,
          themeColors.cyan,
        ),
      );
      api.focus.target('collective-all-gather-1-4-6-5', () =>
        drawOriginalCard(ctx, api, 'All-gather: [1, 4] | [6, 5]', 350, 755, 1220, themeColors.blue),
      );
      api.focus.target('collective-readout-2', () =>
        drawOriginalText(
          ctx,
          api,
          'Every GPU receives [' + gather.join(', ') + ']',
          960,
          945,
          35,
          themeColors.cyan,
          'center',
        ),
      );
    } else if (currentBeat === 1) {
      api.focus.target('collective-reduce-scatter-sums-then-partitions-the-result', () =>
        drawOriginalText(
          ctx,
          api,
          'Reduce-scatter sums, then partitions the result',
          960,
          285,
          39,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('collective-1-4-16-1-17-5', () =>
        drawOriginalCard(ctx, api, '[1, 4] + [16, 1] = [17, 5]', 420, 440, 1080, themeColors.blue),
      );
      api.focus.target('collective-readout-3', () =>
        drawOriginalCard(
          ctx,
          api,
          progress > 0.42 ? 'GPU 0 receives [17]' : 'GPU 0: awaiting partition',
          280,
          740,
          600,
          themeColors.cyan,
        ),
      );
      api.focus.target('collective-readout-4', () =>
        drawOriginalCard(
          ctx,
          api,
          progress > 0.66 ? 'GPU 1 receives [5]' : 'GPU 1: awaiting partition',
          1060,
          740,
          600,
          themeColors.pink,
        ),
      );
    } else {
      api.focus.target('collective-smaller-local-work-can-expose-communication-cost', () =>
        drawOriginalText(
          ctx,
          api,
          'Smaller local work can expose communication cost',
          960,
          285,
          38,
          themeColors.ink,
          'center',
        ),
      );
      const groups = [1, 2, 4],
        local = [4, 2, 1],
        comm = [0, 1.3, 1.8];
      groups.forEach((count, i) => {
        const x = 360 + i * 550;
        api.focus.target('collective-costs', () =>
          api.rect(ctx, x, 810 - local[i] * 85, 230, local[i] * 85, themeColors.blue),
        );
        if (comm[i])
          api.focus.target('collective-costs', () =>
            api.rect(ctx, x, 810 - (local[i] + comm[i]) * 85, 230, comm[i] * 85, themeColors.pink),
          );
        api.focus.target('collective-readout-5', () =>
          drawOriginalText(
            ctx,
            api,
            count + ' GPU' + (count > 1 ? 's' : ''),
            x + 115,
            885,
            32,
            themeColors.ink,
            'center',
          ),
        );
      });
      api.focus.target('collective-local-compute', () =>
        drawOriginalText(ctx, api, 'Local compute', 350, 365, 29, themeColors.blue),
      );
      api.focus.target('collective-communication', () =>
        drawOriginalText(ctx, api, 'Communication', 1240, 365, 29, themeColors.pink),
      );
      api.focus.target('collective-authored-normalized-costs-measure-the-actual-links-an', () =>
        drawOriginalText(
          ctx,
          api,
          'Authored normalized costs; measure the actual links and workload',
          960,
          945,
          29,
          themeColors.muted,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'collective',
  draw: drawCollective,
  cues: [
    'all-reduce-contract',
    'all-gather-contract',
    'distinct-ownership',
    'global-reduction',
    'partition-result',
    'communication-cost',
    'local-compute',
  ],
};
