import { sampleModel } from './model.mjs';
import { text, equation, card } from './defaults.mjs';
export function drawLegacySummary(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    b = s.step;
  const names = [
    'Exact transpose and poisoned outputs',
    'Predicted addresses and counter evidence',
    'Shared-bank mapping and live resources',
    'Runtime safety on recorded shapes',
    'Repeated clean timing under fixed conditions',
  ];
  names
    .slice(0, s.rows)
    .forEach((name, i) =>
      api.focus.target('synthesis-name', () =>
        card(ctx, api, name, 240, 320 + i * 125, 1440, i < 3 ? C.cyan : C.green, 85, 32),
      ),
    );
  text(
    ctx,
    api,
    'One causal change per experiment · source and raw artifacts preserved',
    960,
    1000,
    29,
    C.yellow,
    'center',
  );
}
