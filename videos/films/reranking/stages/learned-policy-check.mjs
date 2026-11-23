import {
  codeText,
  coreText,
  cueDone,
  cueVisible,
  focusTargets,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawLearnedPolicyCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'actual-model',
        'model-allow',
        'changed-request',
        'model-deny',
        'limit-512',
        'append-condition',
        'same-input-ids',
        'same-score',
        'immutable-model',
        'no-speed-inference',
        'downstream-repair',
      ],
      () => {
        if (currentBeat === 0) {
          coreText(ctx, api, 'Article’s MiniLM run · raw logits', 150, 310, 34, themeColors.ink);
          const rows = [
            [
              'day 10 · audit active',
              9.13,
              'Rank 1   AUTH-14   ·   permits this request',
              themeColors.green,
            ],
            [
              'day 15 · audit disabled',
              8.56,
              'Rank 1   AUTH-14   ·   denies this request',
              themeColors.pink,
            ],
          ];
          rows.forEach(([name, val, label, color], i) => {
            if (i === 1 && !cueVisible(ctx, api, 'changed-request')) return;
            const y = 450 + i * 235,
              visible = cueDone(ctx, api, i ? 'model-deny' : 'model-allow');
            coreText(ctx, api, name, 150, y, 32, color);
            rectangle(ctx, api, 150, y + 45, 1400, 65, themeColors.muted, 'transparent');
            if (visible) {
              api.rect(ctx, 150, y + 45, (val / 10) * 1400, 65, themeColors.blue, undefined, 0);
              coreText(ctx, api, val.toFixed(2), 1600, y + 90, 37, themeColors.blue);
              coreText(ctx, api, label, 150, y + 165, 31, themeColors.blue);
            }
          });
        } else if (currentBeat === 1) {
          coreText(
            ctx,
            api,
            'Actual checkpoint maximum: 512 positions',
            150,
            310,
            34,
            themeColors.yellow,
          );
          const same = cueVisible(ctx, api, 'same-input-ids');
          for (let r = 0; r < 2; r++) {
            const y = 440 + r * 230;
            coreText(
              ctx,
              api,
              r ? 'Filler + late audit requirement' : 'Permissive filler × 80',
              150,
              y - 40,
              31,
              r ? themeColors.pink : themeColors.blue,
            );
            for (let i = 0; i < 32; i++)
              api.rect(ctx, 160 + i * 42, y, 39, 70, themeColors.blue, undefined, 0);
            coreText(ctx, api, '512 token IDs', 1530, y + 45, 31, themeColors.blue);
            if (r && cueVisible(ctx, api, 'append-condition')) {
              line(ctx, api, 1500, y - 25, 1500, y + 115, themeColors.pink, 3);
              coreText(
                ctx,
                api,
                'audit clause beyond cutoff',
                960,
                y + 145,
                31,
                themeColors.pink,
                'center',
              );
            }
          }
          if (same)
            coreText(
              ctx,
              api,
              'Retained input IDs are identical: shape [2, 512]',
              960,
              935,
              33,
              themeColors.green,
              'center',
            );
          if (cueVisible(ctx, api, 'same-score'))
            coreText(
              ctx,
              api,
              'Same rounded logit: 3.06',
              960,
              990,
              34,
              themeColors.blue,
              'center',
            );
        } else {
          coreText(ctx, api, 'Weights revision', 150, 350, 31, themeColors.muted);
          codeText(
            ctx,
            api,
            '233902d25c440f23af6f7d6e94d2946bac0bee0a',
            150,
            430,
            27,
            themeColors.blue,
          );
          coreText(
            ctx,
            api,
            'Bind tokenizer, wrapper and exact input too.',
            150,
            535,
            33,
            themeColors.ink,
          );
          if (cueVisible(ctx, api, 'no-speed-inference')) {
            line(ctx, api, 150, 630, 1750, 630, themeColors.muted, 2);
            coreText(
              ctx,
              api,
              'Recorded here: logits and retained input',
              150,
              715,
              33,
              themeColors.green,
            );
            coreText(
              ctx,
              api,
              'Measure serving latency on the deployment workload.',
              150,
              795,
              33,
              themeColors.pink,
            );
          }
          if (cueVisible(ctx, api, 'downstream-repair'))
            coreText(
              ctx,
              api,
              'Correct relevant denial → unsupported “allow” → interpretation repair',
              960,
              945,
              32,
              themeColors.pink,
              'center',
            );
        }
      },
    );
  }
}
export default {
  id: 'learned-policy-check',
  draw: drawLearnedPolicyCheck,
  cues: [
    'actual-model',
    'model-allow',
    'changed-request',
    'model-deny',
    'limit-512',
    'append-condition',
    'same-input-ids',
    'same-score',
    'immutable-model',
    'no-speed-inference',
    'downstream-repair',
  ],
};
