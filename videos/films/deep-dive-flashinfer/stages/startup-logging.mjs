import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, header, packet } from '../defaults.mjs';
export function drawStartupLogging(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('startup-logging', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-startup-logging-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 0
        ? 'Same call, different startup state'
        : currentBeat === 1
          ? 'A diagnostic receipt includes its destination'
          : 'Diagnostic graph dump changes the measured path',
    );
    const stages =
      currentBeat === 0
        ? ['compile specialization', 'cache artifact', 'load module', 'warmed call']
        : currentBeat === 1
          ? ['module status', 'API dispatch log', 'tensor destination', 'access policy']
          : ['graph replay', 'stream synchronization', 'write snapshots', 'logging-off rerun'];
    stages.forEach((v, i) => {
      const x = 180 + i * 425;
      extensionCard(
        ctx,
        api,
        v,
        x,
        450,
        360,
        progress > (i + 0.2) / 4 ? themeColors.cyan : themeColors.muted,
        120,
        26,
      );
    });
    const active = Math.min(3, Math.floor(progress * 4));
    packet(ctx, api, 'current step', 220 + active * 425, 700, themeColors.yellow, 250);
    extensionText(
      ctx,
      api,
      currentBeat === 2
        ? 'Level 10 graph dump includes synchronization + disk work'
        : 'Pin release / CUDA / driver / compiler / artifact location',
      960,
      880,
      30,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 2) footer(ctx, api, 'Turn dumping off before timing the warmed requests.');
  });
}
export default {
  id: 'startup-logging',
  draw: drawStartupLogging,
  cues: [
    'fi-startup-logging-0',
    'fi-startup-logging-0-result',
    'fi-startup-logging-1',
    'fi-startup-logging-1-result',
    'fi-startup-logging-2',
    'fi-startup-logging-2-result',
  ],
};
