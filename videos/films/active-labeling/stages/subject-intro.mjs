import { rawText } from '../fixtures.mjs';
import { phase, ramp, sampleModel, smooth } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('subject-intro', state);
  {
    if (beat < 2) {
      text(
        ctx,
        api,
        'One source trace · two proposed answers',
        960,
        275,
        32,
        themeColors.ink,
        'center',
      );
      api.focus.target('answer-a', () =>
        card(
          ctx,
          api,
          beat > 0 || progress >= 0.17
            ? 'A · approval cited\nAuthorized canary'
            : 'Answer A\nInspect the approval evidence',
          160,
          350,
          620,
          beat > 0 || progress >= 0.17 ? themeColors.green : themeColors.muted,
          135,
          31,
        ),
      );
      api.focus.target('answer-b', () =>
        card(
          ctx,
          api,
          beat > 0 || progress >= 0.35
            ? 'B · claims rollout done\nUnauthorized action'
            : 'Answer B\nInspect the proposed action',
          1140,
          350,
          620,
          beat > 0 || progress >= 0.35 ? themeColors.pink : themeColors.muted,
          135,
          31,
        ),
      );
      if (state.cues?.['prefer-a'] || beat > 0 || progress >= 0.62)
        api.focus.reveal('prefer-a', () =>
          api.focus.target('review-preference', () =>
            card(ctx, api, 'Reviewer preference: A', 650, 560, 620, themeColors.yellow, 90, 31),
          ),
        );
      if (beat === 1) {
        const source = api.focus.target('reserved-source', () =>
          components.panel(
            {
              x: 160,
              y: 730,
              width: 620,
              height: 170,
              fill: themeColors.panel,
              stroke: themeColors.pink,
              scope: 'label',
              padding: 18,
            },
            () => {
              text(ctx, api, 'Source trace · attack-014', 190, 775, 30, themeColors.ink);
              if (progress >= 0.09) text(ctx, api, rawText, 190, 825, 27, themeColors.pink);
              if (progress >= 0.23)
                text(ctx, api, 'Reserved safety-evaluation family', 190, 875, 27, themeColors.pink);
            },
          ),
        );
        if (state.cues?.['block-training'] || progress >= 0.52)
          api.focus.reveal('block-training', () =>
            api.focus.target('training-boundary', () =>
              text(
                ctx,
                api,
                'Training admission: blocked',
                960,
                690,
                30,
                themeColors.pink,
                'center',
              ),
            ),
          );
        if (progress >= 0.66) {
          const uses = card(
            ctx,
            api,
            'Permitted uses\nEvaluation + incident review',
            1140,
            750,
            620,
            themeColors.blue,
            135,
            29,
          );
          const amount = smooth(ramp(progress, 0.66, 0.8)),
            x = 830 + 70 * amount;
          const packet = card(ctx, api, 'attack-014', x, 770, 180, themeColors.pink, 80, 25);
          api.connect(ctx, source, packet, {
            color: themeColors.pink,
            width: 3,
            gap: 12,
          });
          api.connect(ctx, packet, uses, {
            color: themeColors.blue,
            width: 3,
            gap: 12,
          });
        }
      }
      text(
        ctx,
        api,
        beat === 0
          ? 'Compare the answers using the application’s approval rule.'
          : 'A useful judgment keeps its source permissions and lineage.',
        960,
        990,
        29,
        themeColors.ink,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Follow a separate, permitted training trace',
        960,
        290,
        36,
        themeColors.ink,
        'center',
      );
      const labels = [
        'trace-204\nPermitted source',
        'Clean the trace\nRetain lineage',
        'Apply the rubric',
        'Select + release',
      ];
      const nodes = labels.map((label, i) =>
        api.focus.target('permitted-trace', () =>
          card(
            ctx,
            api,
            label,
            120 + i * 450,
            500,
            330,
            [themeColors.green, themeColors.blue, themeColors.yellow, themeColors.cyan][i],
            140,
            28,
          ),
        ),
      );
      nodes.slice(0, -1).forEach((node, i) =>
        api.connect(ctx, node, nodes[i + 1], {
          color: themeColors.blue,
          width: 3,
          gap: 14,
        }),
      );
      text(
        ctx,
        api,
        'Spend review effort on useful examples and preserve the evidence behind each label.',
        960,
        820,
        30,
        themeColors.ink,
        'center',
      );
    }
  }
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'compare-answers',
    'unsafe-answer',
    'prefer-a',
    'source-permission',
    'block-training',
    'permitted-path',
  ],
};
