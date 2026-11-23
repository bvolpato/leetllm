import { sampleMlflowVisual } from '../construction.mjs';
import { legacyCard, legacyText } from '../defaults.mjs';
export function drawLineage(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleMlflowVisual('lineage', state),
    currentBeat = modelState.b;
  const route = (a, z, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress: modelState.q,
      color,
      particle: {
        radius: 6,
        fill: color,
      },
      margin: 3,
    });
  {
    legacyText(
      ctx,
      api,
      'Reconstruct selected run R8 from its exact input records',
      960,
      280,
      34,
      themeColors.yellow,
      'center',
    );
    const records = ['Code C8', 'Data D4', 'Prompt P17'],
      run = api.focus.target('lineage-run-r8', () =>
        legacyCard(ctx, api, 'Run R8', 710, 445, 410, themeColors.yellow, 110),
      );
    records.forEach((label, i) => {
      const source = api.focus.target('lineage-label', () =>
        legacyCard(
          ctx,
          api,
          label,
          120,
          350 + i * 170,
          350,
          i < modelState.attached ? themeColors.blue : themeColors.muted,
        ),
      );
      const progress = currentBeat ? 1 : Math.max(0, Math.min(1, modelState.q * 4 - i));
      if (progress > 0)
        teaching.transfer({
          source: {
            shape: source,
            opacity: 1,
          },
          target: {
            shape: run,
            opacity: 1,
          },
          progress,
          color: themeColors.blue,
          particle: {
            radius: 8,
            fill: themeColors.blue,
          },
        });
      legacyText(
        ctx,
        api,
        i < modelState.attached ? label + ' attached' : 'await ' + label,
        915,
        625 + i * 60,
        27,
        i < modelState.attached ? themeColors.blue : themeColors.muted,
        'center',
      );
    });
    if (currentBeat > 0) {
      const model = api.focus.target('lineage-logged-model-m3', () =>
          legacyCard(ctx, api, 'Logged model M3', 1390, 360, 410, themeColors.cyan),
        ),
        registry = api.focus.target('lineage-registry-version-3', () =>
          legacyCard(ctx, api, 'Registry version 3', 1390, 615, 410, themeColors.green),
        );
      route(run, model, themeColors.cyan);
      teaching.transfer({
        source: {
          shape: model,
          opacity: 1,
        },
        target: {
          shape: registry,
          opacity: 1,
        },
        progress: currentBeat > 1 ? 1 : Math.max(0, Math.min(1, (modelState.q - 0.3) / 0.5)),
        color: themeColors.green,
        particle: {
          radius: 8,
          fill: themeColors.green,
        },
      });
    }
    if (currentBeat === 2) {
      api.focus.target('lineage-request-t104-model-m3-prompt-p17-index-i8', () =>
        legacyCard(
          ctx,
          api,
          'Request T104 · model M3 · prompt P17 · index I8',
          350,
          835,
          1220,
          themeColors.pink,
          85,
        ),
      );
      legacyText(
        ctx,
        api,
        'Retain T104 inputs + expectations as case RET-104',
        960,
        970,
        31,
        themeColors.pink,
        'center',
      );
    } else
      legacyText(
        ctx,
        api,
        'Run inputs → logged model → resolved registry version',
        960,
        970,
        29,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'lineage',
  draw: drawLineage,
  cues: [
    'lineage-beat-1-focus-1',
    'lineage-beat-1-focus-2',
    'mf-sentence-lineage-0-0',
    'mf-sentence-lineage-0-1',
    'mf-sentence-lineage-0-2',
    'mf-sentence-lineage-0-3',
    'lineage-beat-2-focus-1',
    'lineage-beat-2-focus-2',
    'mf-sentence-lineage-1-0',
    'mf-sentence-lineage-1-1',
    'mf-sentence-lineage-1-2',
    'mf-sentence-lineage-1-3',
    'lineage-beat-3-focus-1',
    'lineage-beat-3-focus-2',
    'mf-sentence-lineage-2-0',
    'mf-sentence-lineage-2-1',
    'mf-sentence-lineage-2-2',
  ],
};
