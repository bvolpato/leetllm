import { sampleModel } from '../model.mjs';
import { connectShapes, drawCard, drawLegacyText } from '../defaults.mjs';
export function drawIsolation(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('isolation', state),
    currentBeat = modelState.step;
  {
    const rows = [
      {
        title: 'Verified session A',
        ...modelState.a,
        label: 'tenant A',
        version: 'guide 7',
      },
      {
        title: 'Verified session B',
        ...modelState.b,
        label: modelState.clientLabel,
        version: modelState.version,
      },
    ];
    rows.forEach((row, i) => {
      const y = 345 + i * 245;
      const session = api.focus.target('isolation-session', () =>
        drawCard(ctx, api, row.title, 130, y, 410, i ? themeColors.pink : themeColors.blue),
      );
      const scope = api.focus.target('isolation-scope', () =>
        drawCard(
          ctx,
          api,
          `Scope: ${row.scope}`,
          720,
          y,
          450,
          i ? themeColors.pink : themeColors.blue,
        ),
      );
      connectShapes(
        ctx,
        api,
        session,
        scope,
        i ? themeColors.pink : themeColors.blue,
        modelState.p,
      );
      api.focus.target('isolation-readout', () =>
        drawLegacyText(ctx, api, `client label: ${row.label}`, 130, y + 140, 28, themeColors.muted),
      );
      api.focus.target('isolation-readout-2', () =>
        drawLegacyText(
          ctx,
          api,
          `${row.version} · key ${row.key.slice(0, 10)}`,
          1260,
          y + 50,
          27,
          i ? themeColors.pink : themeColors.blue,
        ),
      );
    });
    api.focus.target('isolation-distinct-lookup-keys-authenticated-scope-stays-with-it', () =>
      drawLegacyText(
        ctx,
        api,
        'Distinct lookup keys · authenticated scope stays with its session',
        960,
        940,
        30,
        themeColors.green,
        'center',
      ),
    );
  }
}
export default {
  id: 'isolation',
  draw: drawIsolation,
  cues: [
    'authenticated-scope',
    'scoped-key',
    'untrusted-label',
    'trusted-session',
    'distinct-key',
    'version-key',
    'sharing-authority',
  ],
};
