import { approval } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { verifyNote } from '../model.mjs';
import { allocationStrip, card, text } from '../defaults.mjs';
export function drawCompaction(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('compaction', state),
    currentBeat = modelState.step;
  if (state.cues && currentBeat < 2) {
    modelState.note =
      api.focus.progress('correct-note', 0) > 0
        ? {
            ...approval,
          }
        : {
            approved: true,
            source: 'D1',
          };
    modelState.valid = verifyNote(modelState.note);
    modelState.missing = Object.keys(approval).filter(
      (key) => modelState.note[key] !== approval[key],
    );
  }
  {
    api.focus.target('compaction-original-source-d1-approved-true-actor-incident-lead', () =>
      text(
        ctx,
        api,
        'Original source D1: approved = true · actor = incident lead',
        140,
        270,
        30,
        themeColors.yellow,
      ),
    );
    if (currentBeat < 2) {
      const fields = [
        ['approved', String(modelState.note.approved)],
        ['actor', modelState.note.actor ?? 'missing'],
        ['source', modelState.note.source],
      ];
      fields.forEach(([key, value], i) => {
        api.focus.target('compaction-readout', () =>
          card(ctx, api, key, 200, 370 + i * 130, 440, themeColors.muted),
        );
        api.focus.target('note-' + key, () => {
          card(
            ctx,
            api,
            value,
            900,
            370 + i * 130,
            790,
            value === 'missing' ? themeColors.pink : themeColors.green,
          );
          if (key === 'actor' && currentBeat === 1 && value !== 'missing') {
            const p = api.focus.progress('correct-note', modelState.p);
            api.rect(ctx, 660, 500, 230, 88, themeColors.panel, themeColors.muted, 1);
            text(ctx, api, 'D1 actor', 775, 555, 25, themeColors.yellow, 'center');
            api.circle(
              ctx,
              api.lerp(775, 1130, p),
              610,
              10,
              themeColors.yellow,
              themeColors.yellow,
              1,
            );
          }
        });
      });
      api.focus.target('compaction-readout-3', () =>
        text(
          ctx,
          api,
          modelState.valid
            ? 'Field values match the required source record'
            : `Coverage check fails: ${modelState.missing.join(', ')}`,
          960,
          880,
          32,
          modelState.valid ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
    } else {
      api.focus.target('source-note', () =>
        card(
          ctx,
          api,
          'D1 · verified compact note\n4 units · original source retained',
          390,
          370,
          1140,
          themeColors.yellow,
          130,
        ),
      );
      allocationStrip(ctx, api, 'compaction', modelState.kept, 660);
    }
    api.focus.target('compaction-checked-fields-illustrate-coverage-semantic-summaries', () =>
      text(
        ctx,
        api,
        'Checked fields illustrate coverage · semantic summaries need content review',
        960,
        975,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'compaction',
  draw: drawCompaction,
  cues: [
    'source-note',
    'missing-actor',
    'coverage-check',
    'correct-note',
    'needed-note',
    'retained-exchange',
  ],
};
