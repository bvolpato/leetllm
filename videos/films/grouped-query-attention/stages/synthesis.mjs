import { TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const snap = {
    ...TRACKS['synthesis'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  {
    const items = [
      {
        key: 'heads',
        label: 'Query heads',
        x: 220,
        color: themeColors.cyan,
      },
      {
        key: 'mapping',
        label: 'KV mapping',
        x: 620,
        color: themeColors.blue,
      },
      {
        key: 'shapes',
        label: 'Cache shape',
        x: 1020,
        color: themeColors.green,
      },
      {
        key: 'bytes',
        label: 'Raw bytes',
        x: 1420,
        color: themeColors.yellow,
      },
    ];
    const painted = items.map((item) => {
      const opacity = snap.active.includes(item.key) ? 1 : 0.6;
      return {
        ...item,
        opacity,
        shape: api.focus.target('summary-' + item.key, () =>
          card(ctx, api, 'synthesis', item.label, item.x, 440, 330, 82, item.color, opacity, 25),
        ),
      };
    });
    painted.slice(0, -1).forEach((item, index) => {
      const next = painted[index + 1];
      components.fade(Math.min(item.opacity, next.opacity), () =>
        api.connect(ctx, item.shape, next.shape, {
          color: next.color,
          gap: 16,
        }),
      );
    });
    const gateLabels = ['Parity check', 'Task quality', 'Latency + throughput'];
    gateLabels.forEach((label, index) =>
      api.focus.target('summary-gate-' + index, () =>
        card(
          ctx,
          api,
          'synthesis',
          label,
          330 + index * 450,
          680,
          400,
          76,
          [themeColors.cyan, themeColors.green, themeColors.pink][index],
          snap.stage >= 2 ? 1 : 0.38,
          25,
        ),
      ),
    );
    api.focus.target('synthesis-equation', () =>
      equation(
        ctx,
        api,
        String.raw`H_q\;\rightarrow\;H_{kv}\;\rightarrow\;\text{per-device bytes}`,
        960,
        860,
        36,
        themeColors.yellow,
      ),
    );
    api.focus.target('synthesis-tie-the-measurement-to-the-exact-model-context-batch-p', () =>
      text(
        ctx,
        api,
        'Tie the measurement to the exact model, context, batch, precision, and serving layout.',
        960,
        930,
        24,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'head-counts',
    'head-mapping',
    'cache-accounting',
    'engine-layout',
    'independent-computation',
    'quality-operations',
  ],
};
