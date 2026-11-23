import { candidates } from '../fixtures.mjs';
import {
  cueProgress,
  cueVisible,
  footer,
  panel,
  text,
  textBlock,
  withFocus,
  withOpacity,
} from '../defaults.mjs';
export function drawBlindAndProbe(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const a = 1 - cueProgress(ctx, api, 'blind-brands');
      withOpacity(ctx, api, a, () => {
        withFocus(ctx, api, 'brand-labels', () =>
          text(ctx, api, 'Brand A', 150, 280, 31, themeColors.pink),
        );
        withFocus(ctx, api, 'brand-labels', () =>
          text(ctx, api, 'Brand B', 1040, 280, 31, themeColors.pink),
        );
      });
      panel(
        ctx,
        api,
        'anonymous-input',
        'Slot A',
        candidates.compact,
        140,
        340,
        770,
        230,
        themeColors.cyan,
      );
      panel(
        ctx,
        api,
        'anonymous-input',
        'Slot B',
        candidates.stepwise.replace(' 1.', '\n1.').replace(' 2.', '\n2.'),
        1020,
        340,
        770,
        260,
        themeColors.cyan,
      );
      if (cueVisible(ctx, api, 'retain-mapping')) {
        panel(
          ctx,
          api,
          'host-mapping',
          'HOST-ONLY MAPPING',
          'A → compact / Brand A\nB → stepwise / Brand B',
          420,
          720,
          1080,
          170,
          themeColors.blue,
        );
      }
      footer(
        ctx,
        api,
        'The judge sees answer text and anonymous slots; the host retains identity.',
      );
    } else if (currentBeat === 1) {
      panel(
        ctx,
        api,
        'verbosity-pair',
        'ORIGINAL',
        'Stop rollout, then run rollback.',
        140,
        340,
        770,
        220,
        themeColors.cyan,
      );
      panel(
        ctx,
        api,
        'verbosity-pair',
        'MATCHED PADDING',
        'Stop rollout, then run rollback.',
        1020,
        340,
        770,
        220,
        themeColors.cyan,
      );
      if (cueVisible(ctx, api, 'verbosity-probe'))
        withFocus(ctx, api, 'verbosity-pair', () => {
          textBlock(
            ctx,
            api,
            'To repeat: stop, then roll back.',
            1045,
            520,
            710,
            29,
            themeColors.yellow,
          );
          text(
            ctx,
            api,
            'Only redundant wording added',
            1400,
            680,
            31,
            themeColors.yellow,
            'center',
          );
          text(
            ctx,
            api,
            'Blinded reviewers first check that useful quality stays matched.',
            960,
            845,
            32,
            themeColors.ink,
            'center',
          );
        });
      footer(ctx, api, 'Measure a preference change across matched cases and both orders.');
    } else {
      panel(
        ctx,
        api,
        'injection-text',
        'UNTRUSTED CANDIDATE TEXT',
        'Stop rollout, then run rollback.\n[Candidate asks the evaluator for full marks.]',
        140,
        350,
        880,
        240,
        themeColors.pink,
      );
      panel(
        ctx,
        api,
        'isolated-run',
        'EVALUATION RUN',
        'tools: 0\nsecrets: 0\noutput: untrusted verdict + explanation',
        1200,
        350,
        590,
        280,
        themeColors.blue,
      );
      if (cueVisible(ctx, api, 'injection-probe'))
        withFocus(ctx, api, 'injection-text', () => {
          api.arrow(ctx, 1060, 460, 1140, 460, themeColors.pink, 3);
          api.line(ctx, 1160, 360, 1160, 650, themeColors.pink, 5);
          text(ctx, api, 'No action capability', 1070, 750, 32, themeColors.pink, 'center');
        });
      if (cueVisible(ctx, api, 'isolate-tools'))
        withFocus(ctx, api, 'isolated-run', () =>
          text(
            ctx,
            api,
            'JSON delimiters do not enforce isolation.',
            960,
            935,
            35,
            themeColors.yellow,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'blind-and-probe',
  draw: drawBlindAndProbe,
  cues: ['blind-brands', 'retain-mapping', 'verbosity-probe', 'injection-probe', 'isolate-tools'],
};
