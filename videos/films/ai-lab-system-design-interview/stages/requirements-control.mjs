import { spokenResult, systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, header, line } from '../defaults.mjs';
export function drawRequirementsControl(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('requirements-control', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-requirements-control-mechanism', () => {
    const missing =
      currentBeat === 1 && spokenResult(state, 'requirements-policy-missing', 1, 0.78);
    header(ctx, api, 'R-105 · same caller and first-token promise');
    chapterCard(ctx, api, 'Control policy P7', 130, 365, 560, themeColors.yellow);
    chapterCard(ctx, api, 'Serving request R-105', 1040, 365, 710, themeColors.blue);
    if (currentBeat === 0) {
      chapterCard(ctx, api, 'Streaming output promise', 130, 510, 560, themeColors.cyan);
      chapterCard(ctx, api, 'Hard spend policy', 130, 650, 560, themeColors.yellow);
      const hosted = !spokenResult(state, 'requirements-host', 0, 0.55);
      chapterCard(
        ctx,
        api,
        hosted ? 'Hosted provider boundary' : 'Changed requirement: self-hosted',
        1040,
        510,
        710,
        themeColors.cyan,
      );
      if (!hosted) {
        for (let i = 0; i < 3; i++)
          chapterCard(
            ctx,
            api,
            'Queued ' + (i + 1),
            1040 + i * 245,
            650,
            220,
            themeColors.blue,
            70,
            25,
          );
        chapterCard(
          ctx,
          api,
          'Local GPU worker · admission owner',
          1040,
          780,
          710,
          themeColors.yellow,
        );
      }
    } else if (currentBeat === 1) {
      ['Entitlement E3', 'Model route A', 'Quota bucket Q8'].forEach((v, i) =>
        chapterCard(
          ctx,
          api,
          progress > (i + 0.3) / 3 ? v : 'Policy field pending',
          130,
          490 + i * 120,
          560,
          progress > (i + 0.3) / 3 ? themeColors.cyan : themeColors.muted,
          80,
        ),
      );
      chapterCard(
        ctx,
        api,
        missing ? 'Required policy unavailable' : 'Version P7 · authorized route',
        1040,
        535,
        710,
        themeColors.yellow,
      );
      chapterCard(
        ctx,
        api,
        missing
          ? 'Private data and beta route blocked'
          : 'Check key, reserve budget, attempt admission',
        1040,
        690,
        710,
        missing ? themeColors.pink : themeColors.cyan,
        100,
        27,
      );
    } else {
      const rows = [
        ['Employee documents', 'Versioned source index D9'],
        ['Repository actions', 'Durable task T47 + sandbox'],
        ['Quality changes', 'Candidate C2 + release gate'],
      ];
      rows.forEach(([need, owner], i) => {
        const ready = progress > (i + 0.2) / 3,
          y = 505 + i * 130;
        chapterText(ctx, api, need, 400, y + 38, 29, themeColors.blue, 'center');
        if (ready) {
          line(ctx, api, 710, y + 25, 1000, y + 25, themeColors.cyan, 4);
          chapterCard(ctx, api, owner, 1040, y, 710, themeColors.cyan, 80);
        }
      });
    }
    const x = 710 + 240 * progress;
    if (!missing) chapterCard(ctx, api, 'P7', x, 375, 70, themeColors.yellow, 55, 23);
    chapterText(
      ctx,
      api,
      currentBeat === 1
        ? missing
          ? 'Required evidence is missing'
          : 'The gateway applies P7 to this request'
        : 'Which part of the service takes on the new requirement?',
      960,
      925,
      32,
      themeColors.yellow,
      'center',
    );
  });
}
export default {
  id: 'requirements-control',
  draw: drawRequirementsControl,
  cues: [
    'sd-requirements-control-0-operation',
    'sd-requirements-control-0-result',
    'requirements-host',
    'sd-requirements-control-1-operation',
    'requirements-policy-missing',
    'sd-requirements-control-1-result',
    'sd-requirements-control-2-operation',
    'sd-requirements-control-2-result',
  ],
};
