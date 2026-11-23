import { arrow, card, text } from '../defaults.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawR1Pipeline(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'center') =>
    text(ctx, api, s, x, y, size, color, align);
  const target = (name, draw) => api.focus.target(name, draw);

  if (state.beat === 2) {
    target('final-rl', () => {
      label('Final reinforcement learning', 155, 295, 57, C.ink, 'left');
      label('Reasoning tasks', 155, 470, 42, C.blue, 'left');
      label('Check the answer', 155, 552, 47, C.ink, 'left');
    });
    label('General tasks', 900, 470, 42, C.blue, 'left');
    const whole = cue('r1-harmlessness').started;
    target('response', () => {
      api.rect(ctx, 885, 508, 780, 267, C.panel, whole ? C.pink : C.muted, 14);
      label('Reasoning text', 921, 585, 43, C.ink, 'left');
      target('summary', () => {
        const helpful = cue('r1-helpfulness').started;
        api.rect(ctx, 910, 637, 730, 105, C.bg, helpful ? C.green : C.muted, 8);
        label('Final summary', 941, 705, 41, helpful ? C.green : C.ink, 'left');
        if (helpful) label('Helpfulness', 1598, 705, 34, C.green, 'right');
      });
      if (whole) label('Harmlessness across the whole response', 1275, 865, 38, C.pink);
    });
    return;
  }

  const reasoning = cue('tt-r1-pipeline-0');
  target('reasoning-run', () => {
    card(ctx, api, 'V3-Base weights', 140, 295, 470, 125, C.blue, 45);
    if (reasoning.started) {
      label('Cold-start SFT → reasoning RL', 909, 308, 33, C.ink);
      arrow(ctx, api, 635, 357, 682 + 483 * reasoning.p, 357, C.muted);
    }
    if (reasoning.done) card(ctx, api, 'Reasoning checkpoint', 1210, 295, 560, 125, C.pink, 42);
  });

  if (state.beat === 0 && cue('r1-language').started && !cue('tt-r1-data-edge').started)
    target('language-reward', () =>
      label(
        'Language consistency improved readability at some cost to performance',
        960,
        602,
        39,
        C.yellow,
      ),
    );

  const data = cue('tt-r1-data-edge');
  const weights = cue('tt-r1-weight-reset');
  if (data.started) {
    target('examples', () => {
      arrow(ctx, api, 1490, 440, 1490, 480 + 93 * data.p, C.green);
      const reasoningLabel = cue('tt-r1-pipeline-1').done
        ? '600k reasoning examples'
        : 'Filtered reasoning examples';
      card(ctx, api, reasoningLabel, 1200, 603, 580, 115, C.green, 37);
    });
    if (cue('r1-weight-question').started && !weights.started)
      target('weight-question', () =>
        label('Which weights start the second run?', 610, 676, 48, C.yellow),
      );
  }

  if (weights.started) {
    target('weight-start', () => {
      arrow(ctx, api, 375, 440, 375, 480 + 93 * weights.p, C.blue);
      card(ctx, api, 'Second supervised run', 140, 603, 520, 115, C.blue, 39);
    });
    target('mixture', () => {
      const mix = cue('tt-r1-pipeline-1');
      if (!mix.started) return;
      arrow(ctx, api, 1160, 661, 1080 - 375 * mix.p, 661, C.green);
      if (cue('r1-epochs').done) label('2 passes through the mix', 400, 805, 36, C.blue);
    });
    const general = cue('r1-general');
    if (general.started) {
      target('general-examples', () => {
        card(
          ctx,
          api,
          general.done ? '200k general examples' : 'General examples',
          905,
          825,
          550,
          100,
          C.cyan,
          37,
        );
        arrow(ctx, api, 878, 858, 836 - 154 * general.p, 833 - 115 * general.p, C.cyan);
      });
    }
  }
}

export default { id: 'r1-pipeline', draw: drawR1Pipeline };
