import { comparisonPair, focusTarget, note, pill, text } from '../defaults.mjs';
export function drawComposeGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['dk-compose-gates-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  focusTarget(ctx, api, 'compose-gates-construction', () => {
    text(ctx, api, 'compose.yaml · scorer service', 960, 285, 35, themeColors.yellow);
    if (currentBeat === 0) {
      const writableBind = resultComplete('unprotect') && !resultComplete('mount');
      comparisonPair(
        ctx,
        api,
        'service read_only: true',
        writableBind ? 'bind read_only omitted' : 'bind read_only: true',
        460,
      );
      pill(ctx, api, 'Root filesystem · read-only', 500, 690, 690, themeColors.blue);
      pill(
        ctx,
        api,
        writableBind ? '/app/eval · read-write mount' : '/app/eval · read-only mount',
        1420,
        690,
        690,
        writableBind ? themeColors.yellow : themeColors.cyan,
      );
      if (resultComplete('missing'))
        note(
          ctx,
          api,
          'bind.create_host_path: false preserves missing-source failure',
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      comparisonPair(ctx, api, 'compose config --quiet', 'compose run --build --rm scorer', 450);
      if (resultComplete('config'))
        pill(
          ctx,
          api,
          'configuration parsed · process not run',
          500,
          690,
          760,
          themeColors.yellow,
          100,
          30,
        );
      if (resultComplete('build'))
        pill(
          ctx,
          api,
          'build → create → actual fixture read',
          1420,
          690,
          760,
          themeColors.green,
          100,
          30,
        );
      note(
        ctx,
        api,
        '--rm removes this container; the image and host inputs have different lifetimes',
      );
    } else {
      pill(
        ctx,
        api,
        'Suppose the Compose plugin is unavailable',
        960,
        440,
        1500,
        themeColors.yellow,
        110,
        36,
      );
      if (resultComplete('skipped'))
        pill(
          ctx,
          api,
          'Check script: optional Compose check skipped',
          960,
          685,
          1570,
          themeColors.yellow,
          110,
          32,
        );
      note(
        ctx,
        api,
        'Installed but invalid configuration fails; required missing env_file is a configuration error',
      );
    }
  });
}
export default {
  id: 'compose-gates',
  draw: drawComposeGates,
  cues: [
    'dk-compose-gates-beat0',
    'dk-compose-gates-unprotect',
    'dk-compose-gates-mount',
    'dk-compose-gates-missing',
    'dk-compose-gates-beat1',
    'dk-compose-gates-config',
    'dk-compose-gates-build',
    'dk-compose-gates-beat2',
    'dk-compose-gates-skipped',
  ],
};
