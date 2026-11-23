import { decomposition, deliverUntilStop } from '../arithmetic.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawCommit(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const d = decomposition();
  {
    if (currentBeat === 0) {
      api.focus.target('commit-after-rejection-the-bird-sang-nearby', () =>
        originalText(
          ctx,
          api,
          'After rejection: The bird sang nearby',
          960,
          285,
          40,
          themeColors.ink,
          'center',
        ),
      );
      components.tokenRow({
        values: ['sang', 'nearby'],
        centerX: 960,
        y: 440,
        width: 320,
        gap: 100,
        height: 100,
        fontSize: 35,
        fill: themeColors.panel,
        stroke: themeColors.green,
        textColor: themeColors.ink,
      });
      const trimmed = state.cues ? api.focus.progress('trim-state', 0) > 0 : progress >= 0.4;
      api.focus.target('commit-readout', () =>
        originalText(
          ctx,
          api,
          trimmed
            ? 'Retained computed state: 1 position'
            : 'Verification computed state: 3 proposed positions',
          960,
          625,
          30,
          themeColors.blue,
          'center',
        ),
      );
      api.focus.target('verified-kv-positions', () =>
        components.tokenRow({
          values: trimmed
            ? ['sang', 'removed: softly', 'removed: today']
            : ['sang', 'softly', 'today'],
          centerX: 960,
          y: 680,
          width: 400,
          gap: 40,
          height: 80,
          fontSize: 27,
          fill: themeColors.panel,
          stroke: trimmed ? themeColors.yellow : themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      api.focus.target('commit-retained-kv-sang', () =>
        originalCard(ctx, api, 'Retained KV: sang', 300, 850, 560, themeColors.blue),
      );
      api.focus.target('commit-pending-state-nearby', () =>
        originalCard(ctx, api, 'Pending state: nearby', 1080, 850, 590, themeColors.yellow),
      );
    } else if (currentBeat === 1) {
      api.focus.target('commit-if-all-proposals-survive', () =>
        originalText(ctx, api, 'If all proposals survive', 960, 285, 42, themeColors.ink, 'center'),
      );
      components.tokenRow({
        values: ['sang', 'softly', 'today', 'EOS'],
        centerX: 960,
        y: 440,
        width: 250,
        gap: 50,
        height: 100,
        fontSize: 34,
        fill: themeColors.panel,
        stroke: themeColors.green,
        textColor: themeColors.ink,
      });
      api.focus.target('commit-bonus-eos-sampled-from-target-row-4', () =>
        originalCard(
          ctx,
          api,
          'Bonus EOS sampled from target row 4',
          430,
          680,
          1060,
          themeColors.yellow,
        ),
      );
      api.focus.target('commit-committed-text-sang-softly-today-eos', () =>
        originalText(
          ctx,
          api,
          'Committed text: sang softly today + EOS',
          960,
          845,
          33,
          themeColors.green,
          'center',
        ),
      );
      api.focus.target('commit-computed-kv-sang-softly-today-bonus-eos-is-pending', () =>
        originalText(
          ctx,
          api,
          'Computed KV: sang softly today; bonus EOS is pending',
          960,
          900,
          30,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('commit-apply-ending-rules-before-delivering-any-later-material', () =>
        originalText(
          ctx,
          api,
          'Apply ending rules before delivering any later material',
          960,
          945,
          32,
          themeColors.muted,
          'center',
        ),
      );
    } else {
      const verified = ['sang', 'EOS', 'today'],
        count = Math.floor(verified.length * api.phase(progress, 0.12, 0.72) + 1e-9),
        delivery = deliverUntilStop(verified.slice(0, count));
      api.focus.target('commit-separate-stopping-fixture-verified-block', () =>
        originalText(
          ctx,
          api,
          'Separate stopping fixture · verified block',
          960,
          285,
          40,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('verified-emitted-block', () =>
        components.tokenRow({
          values: verified,
          centerX: 960,
          y: 440,
          width: 340,
          gap: 65,
          height: 100,
          fontSize: 34,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
        }),
      );
      api.focus.target('commit-readout-2', () =>
        originalText(
          ctx,
          api,
          `Positions inspected in order: ${count}/3`,
          960,
          650,
          32,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('commit-readout-3', () =>
        originalCard(
          ctx,
          api,
          'Delivered text: ' + (delivery.delivered.join(' ') || 'pending'),
          400,
          740,
          1120,
          themeColors.green,
        ),
      );
      api.focus.target('commit-readout-4', () =>
        originalText(
          ctx,
          api,
          delivery.stopped
            ? 'EOS reached · no later token delivered'
            : 'Inspect the next emitted position before delivery',
          960,
          900,
          31,
          delivery.stopped ? themeColors.pink : themeColors.muted,
          'center',
        ),
      );
      if (delivery.discarded.length)
        api.focus.target('commit-readout-5', () =>
          originalText(
            ctx,
            api,
            'Suppressed after stop: ' + delivery.discarded.join(' '),
            960,
            980,
            30,
            themeColors.pink,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'commit',
  draw: drawCommit,
  cues: [
    'computed-chain',
    'trim-state',
    'pending-correction',
    'target-bonus',
    'pending-bonus-state',
    'ordered-stopping',
    'stop-at-eos',
  ],
};
