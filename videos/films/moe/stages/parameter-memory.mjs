import { math, rect, subtitle, text } from '../defaults.mjs';
export function drawParameterMemory(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const fade = api.components.fade;
  {
    const active = api.focus.progress('active-partitions', stage(1, 0.1, 0.85)),
      memory = state.cues
        ? state.cues['parameter-bytes']?.phase === 'after'
          ? 1
          : 0
        : stage(2, 0.1, 0.85);
    const left = 250,
      unit = 72;
    api.focus.target('parameter-memory-hypothetical-parameter-accounting', () =>
      text(
        ctx,
        api,
        'HYPOTHETICAL PARAMETER ACCOUNTING',
        960,
        265,
        30,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('parameter-memory-stored-pool', () =>
      text(ctx, api, 'stored pool', left, 350, 34, themeColors.muted),
    );
    const shared = 3 * unit,
      expertWidth = 2 * unit;
    api.focus.target('parameter-memory-readout-3', () =>
      api.focus.target('parameter-memory-19b-total', () =>
        api.focus.target('stored-parameter-pool', () =>
          rect(ctx, api, left, 400, shared, 105, themeColors.cyan, themeColors.bg, 7),
        ),
      ),
    );
    api.focus.target('parameter-memory-shared', () =>
      text(ctx, api, 'shared', left + shared / 2, 463, 29, themeColors.bg, 'center'),
    );
    for (let i = 0; i < 8; i += 1) {
      const x = left + shared + i * expertWidth;
      api.focus.target('stored-parameter-pool', () =>
        rect(
          ctx,
          api,
          x,
          400,
          expertWidth,
          105,
          i === 0 ? themeColors.blue : i === 2 ? themeColors.yellow : themeColors.panel,
          i === 0 ? themeColors.blue : i === 2 ? themeColors.yellow : themeColors.muted,
          7,
        ),
      );
      api.focus.target('parameter-memory-readout', () =>
        text(
          ctx,
          api,
          `E${i + 1}`,
          x + expertWidth / 2,
          463,
          31,
          i === 0 || i === 2 ? themeColors.bg : themeColors.muted,
          'center',
        ),
      );
    }
    if (!state.cues || state.cues['all-partitions']?.phase === 'after')
      api.focus.target('parameter-memory-19b-total', () =>
        text(ctx, api, '19B total', 1620, 570, 41, themeColors.ink, 'right', 'mono'),
      );
    fade(state.cues ? (active > 0 ? 1 : 0) : active, () => {
      fade(api.phase(active, 0.94, 1), () =>
        api.focus.target('parameter-memory-active-for-one-token', () =>
          text(ctx, api, 'active for one token', left, 630, 34, themeColors.cyan),
        ),
      );
      api.focus.target('active-parameter-pool', () =>
        rect(ctx, api, left, 680, shared, 105, themeColors.cyan, themeColors.bg, 7),
      );
      for (const [j, i] of [0, 2].entries()) {
        const x = api.lerp(
          left + shared + i * expertWidth,
          left + shared + j * expertWidth,
          active,
        );
        const y = api.lerp(525, 680, active);
        api.focus.target('active-parameter-pool', () =>
          rect(
            ctx,
            api,
            x,
            y,
            expertWidth,
            105,
            j === 0 ? themeColors.blue : themeColors.yellow,
            themeColors.bg,
            7,
          ),
        );
        api.focus.target('parameter-memory-readout-2', () =>
          text(ctx, api, `E${i + 1}`, x + expertWidth / 2, y + 63, 31, themeColors.bg, 'center'),
        );
      }
      if (!state.cues || state.cues['active-partitions']?.phase === 'after')
        api.focus.target('parameter-memory-7b-active', () =>
          text(
            ctx,
            api,
            '7B active',
            left + 7 * unit + 200,
            749,
            41,
            themeColors.cyan,
            'left',
            'mono',
          ),
        );
    });
    fade(memory, () => {
      api.focus.target('parameter-memory-readout-3', () =>
        math(
          ctx,
          api,
          String.raw`19\times10^9\times2\;\mathrm{bytes}=38\;\mathrm{GB}`,
          960,
          900,
          45,
          themeColors.ink,
          'center',
        ),
      );
      subtitle(
        ctx,
        api,
        'Raw weight payload. Add cache, workspace, metadata, and placement costs.',
      );
    });
  }
}
export default {
  id: 'parameter-memory',
  draw: drawParameterMemory,
  cues: [
    'stored-parameters',
    'all-partitions',
    'active-partitions',
    'stored-active-bars',
    'parameter-bytes',
    'placement-costs',
  ],
};
