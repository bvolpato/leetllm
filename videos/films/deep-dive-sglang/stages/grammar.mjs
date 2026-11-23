import { cueProgress } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawGrammar(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('grammar', state),
    currentBeat = modelState.b;
  {
    api.focus.target('grammar-ticket', () =>
      text(
        ctx,
        api,
        'R42 ticket: Add dark mode to settings',
        960,
        275,
        35,
        themeColors.yellow,
        'center',
      ),
    );
    const travel =
      currentBeat === 2
        ? 1
        : currentBeat === 1
          ? cueProgress(state.cues, 'grammar-close-object', modelState.closing ? 1 : 0)
          : 0;
    api.focus.target('grammar-request-state', () => {
      card(
        ctx,
        api,
        modelState.selected ? 'category: bug selected' : 'category: choose next word',
        180,
        325,
        650,
        modelState.closing ? themeColors.muted : themeColors.blue,
        78,
      );
      card(
        ctx,
        api,
        'closure: only }',
        1120,
        325,
        600,
        modelState.closing ? themeColors.green : themeColors.muted,
        78,
      );
      api.arrow(ctx, 850, 364, 1095, 364, themeColors.cyan, 3);
      api.circle(ctx, 870 + 190 * travel, 364, 9, themeColors.yellow);
    });
    api.focus.target('grammar-table-header', () => {
      text(ctx, api, 'Candidate', 200, 455, 28, themeColors.muted);
      text(ctx, api, 'Raw probability', 675, 455, 28, themeColors.blue, 'center');
      text(ctx, api, 'Legal?', 1050, 455, 28, themeColors.muted, 'center');
      text(ctx, api, 'Sampling probability', 1390, 455, 28, themeColors.cyan, 'center');
    });
    let normalized = 0;
    modelState.labels.forEach((label, i) => {
      const y = 510 + i * 90,
        hasNorm =
          modelState.maskReady &&
          (modelState.allowed[i] ? normalized++ < modelState.normalized : true),
        value = hasNorm ? modelState.probabilities[i] : modelState.masked[i];
      api.focus.target('grammar-candidate', () =>
        api.focus.target(
          label === '42'
            ? 'grammar-invalid-number'
            : label === '}'
              ? 'grammar-closing-brace'
              : 'grammar-other-candidate',
          () =>
            text(
              ctx,
              api,
              label,
              200,
              y,
              32,
              modelState.maskReady && !modelState.allowed[i] ? themeColors.pink : themeColors.ink,
            ),
        ),
      );
      api.focus.target('grammar-raw', () => {
        api.rect(ctx, 500, y - 15, 350, 26, themeColors.panel, themeColors.muted, 2);
        api.rect(
          ctx,
          500,
          y - 15,
          350 * modelState.raw[i],
          26,
          themeColors.blue,
          themeColors.blue,
          2,
        );
        text(ctx, api, modelState.raw[i].toFixed(2), 900, y, 28, themeColors.blue, 'center');
      });
      api.focus.target('grammar-allowed', () =>
        text(
          ctx,
          api,
          modelState.maskReady ? (modelState.allowed[i] ? 'allow' : 'mask') : 'pending',
          1050,
          y,
          27,
          modelState.maskReady && !modelState.allowed[i] ? themeColors.pink : themeColors.muted,
          'center',
        ),
      );
      api.focus.target('grammar-masked', () =>
        api.focus.target('grammar-normalized', () => {
          api.rect(ctx, 1200, y - 15, 350, 26, themeColors.panel, themeColors.muted, 2);
          api.rect(
            ctx,
            1200,
            y - 15,
            Math.max(0.01, 350 * value),
            26,
            modelState.maskReady && !modelState.allowed[i] ? themeColors.pink : themeColors.cyan,
            modelState.maskReady && !modelState.allowed[i] ? themeColors.pink : themeColors.cyan,
            2,
          );
          text(
            ctx,
            api,
            hasNorm ? value.toFixed(3) : value.toFixed(2),
            1665,
            y,
            28,
            themeColors.cyan,
            'center',
          );
        }),
      );
    });
    api.focus.target('grammar-normalizer', () =>
      text(
        ctx,
        api,
        (modelState.maskReady ? 'Legal mass: ' : 'Unmasked total: ') + modelState.mass.toFixed(2),
        590,
        865,
        32,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('grammar-normalization-step', () => {
      if (modelState.normalized) {
        const active = modelState.allowed.findIndex(
          (allowed, i) =>
            allowed &&
            modelState.labels.slice(0, i + 1).filter((_, j) => modelState.allowed[j]).length ===
              Math.min(modelState.normalized, modelState.allowed.filter(Boolean).length),
        );
        equation(
          ctx,
          api,
          modelState.raw[active].toFixed(2) +
            '/' +
            modelState.mass.toFixed(2) +
            '=' +
            modelState.probabilities[active].toFixed(3),
          1390,
          865,
          34,
        );
      } else text(ctx, api, 'Normalize after masking', 1390, 865, 29, themeColors.muted, 'center');
    });
    if (modelState.selected)
      api.focus.target('grammar-selected-category', () =>
        card(ctx, api, 'R42 selected category: bug', 200, 930, 650, themeColors.green, 75),
      );
    if (modelState.complete)
      api.focus.target('grammar-task-verdict', () =>
        card(
          ctx,
          api,
          '{"label":"bug"} · valid JSON\nExpected feature · task mismatch',
          930,
          915,
          790,
          themeColors.pink,
          120,
        ),
      );
    else
      text(
        ctx,
        api,
        'Whole-word vocabulary · each request owns its grammar progress',
        960,
        1040,
        25,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'grammar',
  draw: drawGrammar,
  cues: [
    'grammar-beat-1-focus-1',
    'grammar-mask-number',
    'grammar-beat-2-focus-1',
    'grammar-select-category',
    'grammar-close-object',
    'grammar-beat-3-focus-1',
    'grammar-syntax-and-accuracy',
  ],
};
