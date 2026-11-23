import { advancedScenes } from './fixtures.mjs';
import { sampleModel } from './model.mjs';
import { card, text } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  advancedScenes.has(scene.id);
  const { C, components: c, teaching: t } = api,
    s = sampleModel(state);
  const link = (a, b, color = C.cyan) =>
    t.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: b,
        opacity: 1,
      },
      color,
      progress: s.q,
      particle: {
        radius: 8,
        fill: C.yellow,
      },
    });
  api.focus.target(
    'synthesis-identity-content-revision-policy-scope-decision-category-reasons-sur',
    () => {
      text(
        ctx,
        api,
        'D8 · post P17 · rev8 · scope S3 · linked correction C8',
        960,
        280,
        34,
        C.blue,
        'center',
      );
      if (!s.b) {
        [
          ['Chat', 'before-send deadline'],
          ['Upload', 'durable pending work'],
          ['Review', 'age + assigned owner'],
        ].forEach(([name, value], i) => {
          card(ctx, api, name, 170 + i * 570, 390, 520, [C.blue, C.cyan, C.yellow][i], 85);
          text(ctx, api, value, 430 + i * 570, 550, 28, C.muted, 'center');
        });
        [
          ['rules', 10000],
          ['classifier', 2000],
          ['judge', 500],
          ['review', 100],
        ].forEach(([name, value], i) => {
          text(ctx, api, name, 310 + i * 430, 700, 28, C.muted, 'center');
          text(ctx, api, value.toLocaleString() + ' / s', 310 + i * 430, 785, 37, C.cyan, 'center');
        });
        text(
          ctx,
          api,
          'Preserve incoming work, exact policy and immutable decision lineage',
          960,
          915,
          31,
          C.blue,
          'center',
        );
      } else {
        const cases = [
          'classroom quote',
          'edited impersonation',
          'malformed scores',
          'stale revision',
          'overload',
        ];
        const progress = api.focus.progress('synthesis-beat-2-focus-1');
        cases.forEach((name, i) => {
          const y = 370 + i * 110;
          card(ctx, api, name, 240, y, 900, i < Math.ceil(progress * 5) ? C.yellow : C.muted, 75);
          text(
            ctx,
            api,
            i < Math.ceil(progress * 5) ? 'Required regression case' : 'Pending case construction',
            1460,
            y + 48,
            27,
            i < Math.ceil(progress * 5) ? C.yellow : C.muted,
            'center',
          );
        });
      }
    },
  );
  text(
    ctx,
    api,
    'Evaluate model quality, deadlines and user remedies as connected contracts',
    960,
    990,
    28,
    C.muted,
    'center',
  );
}
