import { sampleModel } from '../model.mjs';
import { revisionPresentation } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawRevisions(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const r = revisionPresentation(modelState.b, state.beatP ?? 0, state.cues),
      seconds = r.seconds;
    api.focus.target('revision-post', () => {
      card(
        ctx,
        api,
          'Handout P17 · scope S3 · ' + (r.revision === 7 ? 'original content' : 'edited content'),
        170,
        270,
        1580,
        themeColors.blue,
        90,
      );
      teaching.changeCue(
        {
          x: 1370,
          y: 283,
          width: 340,
          height: 65,
          from: 7,
          to: r.revision,
          progress: 1,
          emphasis: r.revision === 8 ? 0.45 : 0,
          color: themeColors.yellow,
        },
        (v) => text(ctx, api, 'revision ' + v.value.toFixed(0), 1540, 325, 30, v.color, 'center'),
      );
    });
    if (modelState.b === 0) {
      const worker = api.focus.target('revision-receipt', () =>
        card(
          ctx,
          api,
          r.receipt
            ? 'Receipt W7 · P17 / rev7 / S3\nRecommendation: ALLOW'
            : 'Worker W7 evaluates\nP17 / rev7 / S3',
          170,
          450,
          530,
          r.receipt ? themeColors.yellow : themeColors.muted,
          140,
        ),
      );
      const gate = api.focus.target('revision-gate', () =>
        card(
          ctx,
          api,
          r.fresh
              ? 'Fresh evaluation · rev8/S3\nRecommends BLOCK'
            : r.compared
              ? 'rev7 ≠ rev8\nSTALE RECEIPT'
              : 'Revision gate\nawaiting worker result',
          870,
          450,
          450,
          r.fresh ? themeColors.green : r.compared ? themeColors.pink : themeColors.muted,
          140,
        ),
      );
      const output = api.focus.target('revision-output', () =>
        card(
          ctx,
          api,
          r.committed ? 'D8 · rev8 · S3\nBLOCK · persisted' : 'P17 rev' + r.revision + '\ndecision pending',
          1470,
          450,
          350,
          r.committed ? themeColors.green : themeColors.muted,
          140,
        ),
      );
      if (r.receipt && !r.fresh)
        teaching.transfer({
          source: {
            shape: worker,
            opacity: 1,
          },
          target: {
            shape: gate,
            opacity: 1,
          },
          progress: Math.max(0, Math.min(1, (seconds - 3.1) / 1.8)),
          color: themeColors.yellow,
          particle: false,
        });
      if (r.compared)
        text(ctx, api, r.committed ? 'Revision 8 has its own decision' : 'Late ALLOW leaves rev8 pending', 960, 680, 35, r.committed ? themeColors.ink : themeColors.pink, 'center');
      [
        'Content revision ' + r.revision,
        'Policy scope S3',
        r.checks[2] ? 'Precondition satisfied' : 'Precondition pending',
      ].forEach((label, i) =>
        api.focus.target(`revision-check-${i}`, () =>
          card(
            ctx,
            api,
            (r.checks[i] ? '✓ ' : '') + label,
            170 + i * 560,
            760,
            500,
            r.checks[i] ? themeColors.green : themeColors.muted,
            80,
          ),
        ),
      );
      if (r.emitted)
        teaching.transfer({
          source: {
            shape: gate,
            opacity: 1,
          },
          target: {
            shape: output,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.green,
          particle: false,
        });
      api.focus.target('revision-atomic-write', () =>
        text(
          ctx,
          api,
          r.emitted
            ? 'Atomic write: D8 + downstream event E8'
            : 'D8 + event E8 · transaction pending',
          960,
          945,
          r.emitted ? 36 : 29,
          r.emitted ? themeColors.green : themeColors.muted,
          'center',
        ),
      );
    } else {
      const lift = state.cues ? api.focus.progress('revision-appeal', 1) : 1;
      const original = api.focus.target('revision-original', () =>
        card(
          ctx,
          api,
            'D8 · rev8 · S3\nBLOCK · original',
          1470,
          450 - 40 * lift,
          350,
          themeColors.blue,
          140,
        ),
      );
      const appeal = api.focus.target('revision-appeal', () =>
        card(
          ctx,
          api,
            r.appeal ? 'Appeal A1 · authorized\nClassroom context for D8' : 'Appeal authorization pending',
          170,
          450,
          610,
          r.appeal ? themeColors.yellow : themeColors.muted,
          140,
        ),
      );
      const correction = api.focus.target('revision-correction', () =>
        card(
          ctx,
          api,
          r.linked ? 'Correction C8 → D8\nEnforcement: ALLOW' : 'Correction pending',
          1050,
          600,
          700,
          r.linked ? themeColors.green : themeColors.muted,
          140,
        ),
      );
      if (r.linked)
        api.focus.target('revision-correction-link', () => {
          teaching.transfer({
            source: {
              shape: original,
              opacity: 1,
            },
            target: {
              shape: correction,
              opacity: 1,
            },
            progress: 1,
            color: themeColors.green,
            particle: false,
          });
          teaching.transfer({
            source: {
              shape: appeal,
              opacity: 1,
            },
            target: {
              shape: correction,
              opacity: 1,
            },
            progress: 1,
            color: themeColors.yellow,
            particle: false,
          });
        });
      const cache = api.focus.target('revision-cache', () =>
        card(
          ctx,
          api,
          r.invalidated
            ? 'Cache key P17/rev8/S3/D8\nINVALIDATED by C8'
            : 'Cache key P17/rev8/S3/D8\nBLOCK from original D8',
          170,
          790,
          610,
          r.invalidated ? themeColors.pink : themeColors.blue,
          150,
        ),
      );
      const effect = api.focus.target('revision-remedy', () =>
        card(
          ctx,
          api,
          r.remedied ? 'Effect E-C8 applied\nRestore post P17' : 'Downstream correction pending',
          1050,
          790,
          700,
          r.remedied ? themeColors.green : themeColors.muted,
          150,
        ),
      );
      if (r.invalidated)
        teaching.transfer({
          source: {
            shape: correction,
            opacity: 1,
          },
          target: {
            shape: cache,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.pink,
          particle: false,
        });
      if (r.remedied)
        teaching.transfer({
          source: {
            shape: correction,
            opacity: 1,
          },
          target: {
            shape: effect,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.green,
          particle: false,
        });
      if (r.related)
        api.focus.target('revision-related', () =>
          api.focus.target('revision-fresh', () =>
            card(
              ctx,
              api,
              r.fresh
                ? 'P18 · similar text → EVALUATE FRESH'
                : 'P18 · similar text retrieved · action pending',
              425,
              960,
              1070,
              r.fresh ? themeColors.yellow : themeColors.cyan,
              65,
            ),
          ),
        );
    }
  }
}
export default {
  id: 'revisions',
  draw: drawRevisions,
  cues: [
    'revision-edited',
    'revision-late-receipt',
    'revision-checks',
    'revision-commit',
    'revision-appeal',
    'revision-original',
    'revision-correction',
    'revision-invalidate',
    'revision-remedy',
    'revision-exact-key',
    'revision-related',
    'revision-fresh',
  ],
};
