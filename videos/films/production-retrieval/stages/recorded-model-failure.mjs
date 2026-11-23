import { prEvent } from '../construction.mjs';
import { answerFromEvidence, requestPath } from '../model.mjs';
import { card, centeredText, extensionFooter, panel, wrapLines } from '../defaults.mjs';
export function drawRecordedModelFailure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('recorded-model-failure-mechanism', () => {
    centeredText(
      ctx,
      api,
      'Published Qwen3-1.7B example · no new model execution',
      960,
      280,
      31,
      themeColors.yellow,
    );
    const entries = [
      {
        x: 110,
        age: 10,
        title: '10 days',
        detail: 'Recorded: allows rotation',
        color: themeColors.green,
      },
      {
        x: 740,
        age: 15,
        title: '15 days',
        detail: 'Recorded: “less than fourteen days”',
        color: themeColors.pink,
      },
      {
        x: 1370,
        age: 10,
        title: 'Session-only evidence',
        detail: 'Recorded: 48 hours vs 30 idle days',
        color: themeColors.pink,
      },
    ];
    if (currentBeat === 0) {
      card(
        ctx,
        api,
        'Chat template · thinking off · sampling off · 80-token cap',
        240,
        410,
        1440,
        140,
        themeColors.cyan,
        32,
      );
      centeredText(
        ctx,
        api,
        'These are recorded article observations, not a new inference run',
        960,
        770,
        31,
        themeColors.muted,
      );
    } else
      entries.forEach((r, i) => {
        card(ctx, api, r.title, r.x, 365, 460, 100, r.color, 30);
        panel(ctx, api, r.x, 520, 460, 280, r.color);
        if (currentBeat > 1 || done(['ten', 'fifteen', 'session'][i], 1)) {
          wrapLines(ctx, api, r.detail, 25).forEach((v, j) =>
            centeredText(ctx, api, v, r.x + 230, 575 + j * 45, 28, r.color),
          );
          centeredText(ctx, api, 'Unknown labels = ∅', r.x + 230, 755, 27, themeColors.cyan);
        } else centeredText(ctx, api, 'Recorded reply held', r.x + 230, 650, 28, themeColors.muted);
      });
    if (currentBeat === 2) {
      const age = done('denial', 2) ? 15 : 10,
        result = answerFromEvidence(
          {
            intent: 'rotation_eligibility',
            staleDays: age,
            signalHours: 48,
          },
          requestPath().packed,
        );
      centeredText(
        ctx,
        api,
        'Typed rule: ' + age + ' ≤ 14 is ' + (age <= 14) + ' → ' + result.decision + ' · E1',
        960,
        930,
        34,
        age <= 14 ? themeColors.green : themeColors.yellow,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Recorded observations expose citation-identity limits; exact output depends on weights and runtime',
    );
  });
}
export default {
  id: 'recorded-model-failure',
  draw: drawRecordedModelFailure,
  cues: ['pr-scope', 'pr-ten', 'pr-fifteen', 'pr-session', 'pr-typed', 'pr-denial'],
};
