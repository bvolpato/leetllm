import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, line } from '../defaults.mjs';
export function drawAutomaticEvidence(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('automatic-evidence', state),
    currentBeat = modelState.b;
  {
    const { C } = api,
      id = 'automatic-evidence';
    {
      chapterText(
        ctx,
        api,
        'Eligible → selected → completed assessments',
        960,
        285,
        34,
        C.yellow,
        'center',
      );
      for (let i = 0; i < 8; i++) {
        const x = 160 + i * 205,
          selected = i < modelState.selected,
          assessed = i < modelState.assessed;
        chip(ctx, api, 'T' + (i + 1), x, 405, 175, C.blue, 95);
        if (selected) {
          line(ctx, api, x + 87, 500, x + 87, 555, C.cyan, 4);
          chip(
            ctx,
            api,
            assessed ? 'true' : 'pending',
            x,
            560,
            175,
            assessed ? C.green : C.yellow,
            95,
            24,
          );
        } else chapterText(ctx, api, 'not selected', x + 87, 600, 20, C.muted, 'center');
      }
      if (currentBeat === 1 && modelState.resultReady) {
        chapterText(ctx, api, 'Coverage 3/8 = 37.5%', 530, 790, 37, C.yellow, 'center');
        chapterText(ctx, api, 'Observed mean 3/3 = 100%', 1350, 790, 34, C.green, 'center');
      }
      if (currentBeat === 2) {
        const standard = chip(
          ctx,
          api,
          'Standard judge → Gateway model',
          160,
          795,
          710,
          C.cyan,
          95,
        );
        const code = chip(
          ctx,
          api,
          'Experimental admin job container',
          1030,
          795,
          720,
          modelState.container >= 1 ? C.yellow : C.muted,
          95,
        );
        flow(ctx, api, standard, code, 0, C.muted);
        chapterText(
          ctx,
          api,
          'Separate version / configuration gate',
          960,
          940,
          29,
          C.yellow,
          'center',
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Self-hosted server options documented November 7, 2026'
          : 'Coverage uses all eligible traces. The mean uses completed assessments.',
      );
    }
  }
}
export default {
  id: 'automatic-evidence',
  draw: drawAutomaticEvidence,
  cues: [
    'mf-automatic-evidence-0',
    'mf-sentence-automatic-evidence-0-0',
    'mf-sentence-automatic-evidence-0-1',
    'mf-sentence-automatic-evidence-0-2',
    'mf-sentence-automatic-evidence-0-3',
    'mf-sentence-automatic-evidence-0-4',
    'mf-automatic-evidence-1',
    'mf-sentence-automatic-evidence-1-0',
    'mf-sentence-automatic-evidence-1-1',
    'mf-sentence-automatic-evidence-1-2',
    'mf-sentence-automatic-evidence-1-3',
    'mf-automatic-evidence-2',
    'mf-sentence-automatic-evidence-2-0',
    'mf-sentence-automatic-evidence-2-1',
    'mf-sentence-automatic-evidence-2-2',
    'mf-sentence-automatic-evidence-2-3',
  ],
};
