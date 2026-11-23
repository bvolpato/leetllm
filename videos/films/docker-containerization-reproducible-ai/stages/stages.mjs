import { focusTarget, imageLayer, line, note, pill, text } from '../defaults.mjs';
export function drawStages(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    old = (id) => state.cues?.[id],
    OP = (id) => {
      const x = old(id);
      return !x || x.phase === 'before' ? 0 : x.phase === 'after' ? 1 : x.progress;
    },
    OD = (id) => old(id)?.phase === 'after';
  focusTarget(ctx, api, 'stages-construction', () => {
    const q = OP('stages-environment'),
      installed = OD('stages-install'),
      files = OD('stages-files'),
      user = OD('stages-user'),
      command = OD('stages-command');
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Install into the builder’s explicit environment'
        : currentBeat === 1
          ? 'COPY the same environment path'
          : 'Select process identity and command',
      960,
      285,
      36,
      themeColors.yellow,
    );
    line(ctx, api, 150, 485, 810, 485, themeColors.blue);
    line(ctx, api, 1110, 485, 1770, 485, themeColors.cyan);
    text(ctx, api, 'Builder filesystem', 480, 450, 34, themeColors.blue);
    text(ctx, api, 'Independent runtime filesystem', 1440, 450, 33, themeColors.cyan);
    imageLayer(ctx, api, 200, 750, 540, 'Python base · user space', themeColors.blue);
    imageLayer(ctx, api, 1160, 750, 540, 'Same compatible Python base', themeColors.cyan);
    focusTarget(ctx, api, 'builder-install', () => {
      pill(
        ctx,
        api,
        installed ? '/opt/venv · ready' : '/opt/venv · created',
        480,
        535,
        530,
        themeColors.blue,
        75,
        31,
      );
      text(ctx, api, 'requirements.txt → pip --require-hashes', 480, 720, 25, themeColors.muted);
    });
    focusTarget(ctx, api, 'runtime-environment', () => {
      if (q > 0) {
        const x = 480 + (1440 - 480) * q,
          y = 640;
        pill(ctx, api, '/opt/venv', x, y, 340, themeColors.yellow, 70, 31);
      }
      if (q === 0) text(ctx, api, 'environment copy pending', 1440, 600, 28, themeColors.muted);
      if (q === 1) text(ctx, api, 'PATH re-declared in runtime', 1440, 720, 27, themeColors.cyan);
    });
    focusTarget(ctx, api, 'runtime-files', () => {
      pill(
        ctx,
        api,
        files ? 'scorer + three eval rows' : 'application inputs pending',
        1440,
        535,
        570,
        files ? themeColors.green : themeColors.muted,
        65,
        27,
      );
    });
    focusTarget(ctx, api, 'runtime-user', () => {
      text(
        ctx,
        api,
        user ? 'appuser · UID 10001' : 'process user pending',
        1440,
        905,
        29,
        user ? themeColors.yellow : themeColors.muted,
      );
    });
    focusTarget(ctx, api, 'runtime-command', () => {
      pill(
        ctx,
        api,
        command ? 'python → scorer script' : 'entrypoint pending',
        1440,
        955,
        630,
        command ? themeColors.green : themeColors.muted,
        60,
        28,
      );
    });
    note(ctx, api, 'A selected COPY transfers files; a new base has its own environment settings');
  });
}
export default {
  id: 'stages',
  draw: drawStages,
  cues: ['stages-install', 'stages-environment', 'stages-files', 'stages-user', 'stages-command'],
};
