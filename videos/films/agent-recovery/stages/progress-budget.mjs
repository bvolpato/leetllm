import { progressSequence } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawProgressBudget(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 8) =>
    api.teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      width: 3,
      progress,
      gap: 28,
      margin: 4,
      particle: {
        radius,
        fill: color,
      },
    });
  {
    const steps = progressSequence();
    if (beat < 2) {
      api.focus.target('progress-budget-evidence-page-identity-drives-progress', () =>
        text(
          ctx,
          api,
          'Evidence page identity drives progress',
          960,
          250,
          38,
          themeColors.ink,
          'center',
        ),
      );
      const count = beat === 0 ? (progress2 < 0.55 ? 1 : 2) : progress2 < 0.12 ? 2 : 3;
      const positions = [190, 760, 1330];
      const resultCards = steps.slice(0, count).map((step, i) => {
        const x = positions[i];
        const color = i === 2 ? themeColors.green : i === 1 ? themeColors.yellow : themeColors.blue;
        const result = api.focus.target('progress-budget-result', () =>
          card(ctx, api, `Call ${step.call}\n${step.page}`, x, 370, 400, color, 145, 30),
        );
        api.focus.target('progress-evidence', () =>
          text(
            ctx,
            api,
            step.gainedEvidence ? 'new relevant evidence' : 'repeat · no new evidence',
            x + 200,
            550,
            27,
            step.gainedEvidence ? themeColors.green : themeColors.yellow,
            'center',
          ),
        );
        api.focus.target('progress-allowance', () =>
          text(
            ctx,
            api,
            `No-progress count ${step.noProgress} / ${step.allowance}`,
            x + 200,
            665,
            26,
            themeColors.muted,
            'center',
          ),
        );
        api.focus.target('hard-call-budget', () =>
          text(
            ctx,
            api,
            `Hard calls left ${step.remaining}`,
            x + 200,
            705,
            27,
            themeColors.cyan,
            'center',
          ),
        );
        return result;
      });
      if (resultCards.length > 1) route(resultCards[0], resultCards[1], themeColors.yellow, 1);
      if (resultCards.length === 3) route(resultCards[1], resultCards[2], themeColors.green, 1);
    } else {
      const routes = [
        ['Schema issue', 'Repair then re-admit', themeColors.yellow],
        ['Transient read', 'Bounded retry', themeColors.cyan],
        ['Unknown write', 'Reconcile state', themeColors.pink],
      ];
      routes.forEach(([a, b, color], i) => {
        const y = 355 + i * 170;
        const source = api.focus.target('progress-budget-source', () =>
          card(ctx, api, a, 250, y, 450, color, 100, 30),
        );
        const target = api.focus.target('progress-budget-target', () =>
          card(ctx, api, b, 1190, y, 470, color, 100, 30),
        );
        route(source, target, color, q);
      });
      api.focus.target('progress-budget-classify-the-failed-boundary-before-choosing-a-r', () =>
        text(
          ctx,
          api,
          'Classify the failed boundary before choosing a route',
          960,
          880,
          34,
          themeColors.ink,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'progress-budget',
  draw: drawProgressBudget,
  cues: [
    'useful-evidence',
    'repeated-page',
    'new-page',
    'finite-calls',
    'schema-route',
    'unknown-write-route',
  ],
};
