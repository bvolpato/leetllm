import { sha } from '../arithmetic.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawVersionConfig(ctx, scene, state, api) {
  const { C } = api;
  const at = cueClock(scene, state);
  const edited = at('set-temperature') === 1;
  const saved = { temperature: 0 };
  const stored = { ...saved, temperature: edited ? 0.7 : saved.temperature };

  api.focus.target('template', () => {
    api.text(ctx, 'MLflow 3.16.1   /   Prompt Registry', 135, 269, 32, C.muted);
    api.text(ctx, 'Prompt v4', 135, 385, 83, C.ink, 'left', 'serif');
    api.text(ctx, 'Use {{evidence}} to choose a route.', 655, 377, 43, C.ink, 'left', 'mono');
  });
  api.line(ctx, 135, 435, 1770, 435, C.muted, 2);
  for (const [target, name, config, x, color] of [
    ['run-copy', 'Saved with the run', saved, 135, C.cyan],
    ['registry-copy', 'In the registry now', stored, 1010, edited ? C.yellow : C.cyan],
  ]) {
    api.focus.target(target, () => {
      api.text(ctx, name, x, 526, 48, C.ink);
      api.text(ctx, 'Temperature', x, 606, 34, C.muted);
      api.text(ctx, config.temperature.toFixed(1), x, 753, 125, color, 'left', 'mono');
      api.text(
        ctx,
        'Config SHA-256   ' + sha(JSON.stringify(config)).slice(0, 12),
        x,
        835,
        31,
        color,
        'left',
        'mono',
      );
    });
  }
  if (at('check-worker') > 0)
    api.text(ctx, 'Compare the worker’s loaded settings with the saved run.', 135, 975, 39, C.ink);
}

export default {
  id: 'version-config',
  draw: drawVersionConfig,
  cues: [
    'saved-template',
    'open-registry',
    'compare-settings',
    'edit-text',
    'ask-temperature',
    'set-temperature',
    'read-run',
    'config-fingerprint',
    'retain-run',
    'check-worker',
  ],
};
