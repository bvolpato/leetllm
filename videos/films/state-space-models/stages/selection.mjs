import { selectiveCoefficients } from '../arithmetic.mjs';
import { xs } from '../fixtures.mjs';
import { selectionSnapshot } from '../model.mjs';
import { card, cueDone, cueMotion, equation, text } from '../defaults.mjs';
export function drawSelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    if (currentBeat === 3) {
      api.focus.target('zero-input-check', () => {
        text(
          ctx,
          api,
          'Start both trials at h = 1, with A = −1',
          960,
          305,
          47,
          themeColors.ink,
          'center',
        );
        text(ctx, api, 'Carried state', 480, 420, 36, themeColors.blue);
        text(ctx, api, 'Input write', 1280, 420, 36, themeColors.pink);
        const origin = 470, width = 590;
        text(ctx, api, 'Start = 1', origin + width, 486, 32, themeColors.ink, 'center');
        api.line(ctx, origin + width, 500, origin + width, 820, themeColors.muted, 3);
        for (const [i, input] of [0, 4].entries()) {
          const id = i ? 'probe-four' : 'probe-zero';
          const q = cueMotion(state, id, 3, i ? 0.46 : 0.08, i ? 0.62 : 0.18);
          if (i && !q) continue;
          const { a, write } = selectiveCoefficients(input);
          const y = 525 + 200 * i;
          text(ctx, api, 'input ' + input, 165, y + 56, 46, themeColors.ink);
          api.line(ctx, origin, y + 86, 1650, y + 86, themeColors.muted, 2);
          if (q > 0) api.rect(ctx, origin, y, width * a * q, 65, themeColors.blue);
          const written = i ? cueMotion(state, 'probe-write', 3, 0.6, 0.71) : 0;
          if (written > 0)
            api.rect(ctx, origin + width * a, y, width * write * written, 65, themeColors.pink);
          if (i ? cueDone(state, 'probe-write', 3, 0.71) : cueDone(state, id, 3, 0.18))
            text(
              ctx,
              api,
              'h ≈ ' + (a + write).toFixed(3),
              1690,
              y + 54,
              42,
              themeColors.green,
              'center',
            );
        }
      });
      return;
    }
    const v = selectionSnapshot(currentBeat, progress);
    const reached = (id) => state.cues?.[id] && state.cues[id].phase !== 'before';
    if (currentBeat === 1 && state.cues) {
      v.complete = state.cues['ssm-selective-state']?.phase === 'after';
      v.read = state.cues['ssm-selective-readout']?.phase === 'after';
    }
    if (currentBeat === 2 && state.cues?.['decay-and-replace']) {
      v.complete = state.cues['decay-and-replace'].phase === 'after';
      v.read = v.complete;
    }
    const compare =
      currentBeat === 1 &&
      (state.cues
        ? (reached('selective-carry') || reached('selective-write')) &&
          (!reached('selective-readout') ||
            state.cues['selective-write']?.active ||
            state.cues['selective-carry']?.active)
        : progress >= 0.1 && progress < 0.65);
    api.focus.target('selection-readout', () =>
      text(
        ctx,
        api,
        'Activation ' + v.x + ' · step ' + (v.index + 1) + ' of 4',
        960,
        285,
        43,
        themeColors.yellow,
        'center',
      ),
    );
    if (compare) {
      [selectiveCoefficients(xs[1]), selectiveCoefficients(v.x)].forEach((row, i) => {
        const x = 150 + i * 890;
        api.rect(
          ctx,
          x,
          325,
          730,
          110,
          themeColors.panel,
          i ? themeColors.yellow : themeColors.muted,
          12,
        );
        text(
          ctx,
          api,
          `${i ? 'current' : 'reference'} activation x = ${row.x}`,
          x + 20,
          351,
          23,
          i ? themeColors.yellow : themeColors.muted,
        );
        api.focus.target('selection-retention-comparison', () =>
          text(
            ctx,
            api,
            `Δ ${row.delta.toFixed(3)} · retention ${row.a.toFixed(3)}`,
            x + 20,
            387,
            26,
            themeColors.blue,
          ),
        );
        api.focus.target('selection-write-comparison', () =>
          text(ctx, api, `write ${row.write.toFixed(3)}`, x + 20, 422, 26, themeColors.pink),
        );
      });
    } else
      api.focus.target('selection-readout-2', () =>
        text(
          ctx,
          api,
          'Δ = ' +
            v.delta.toFixed(3) +
            ' · retention exp(−Δ) = ' +
            v.a.toFixed(3) +
            ' · read coefficient C = ' +
            v.c.toFixed(3),
          960,
          365,
          30,
          themeColors.muted,
          'center',
        ),
      );
    const old = api.focus.target('selection-old', () =>
        card(ctx, api, 'old ' + v.old.toFixed(3), 160, 470, 400, themeColors.blue),
      ),
      carry = api.focus.target('selection-carry', () =>
        card(ctx, api, 'carry ' + v.carry.toFixed(3), 760, 470, 400, themeColors.blue),
      ),
      result = api.focus.target('selection-result', () =>
        card(
          ctx,
          api,
          v.complete ? 'new ' + v.h.toFixed(3) : 'sum pending',
          1360,
          470,
          400,
          v.complete ? themeColors.green : themeColors.muted,
        ),
      );
    api.connect(ctx, old, carry, {
      color: themeColors.blue,
    });
    api.connect(ctx, carry, result, {
      color: v.complete ? themeColors.green : themeColors.muted,
    });
    const write = api.focus.target('selection-write', () =>
      card(ctx, api, 'write ' + v.write.toFixed(3), 760, 730, 400, themeColors.pink),
    );
    api.connect(ctx, write, result, {
      color: themeColors.pink,
    });
    const activation = api.focus.target('selection-activation', () =>
      card(ctx, api, 'activation x = ' + v.x, 160, 730, 400, themeColors.yellow),
    );
    api.connect(ctx, activation, write, {
      color: themeColors.yellow,
    });
    api.focus.target('selection-readout-3', () =>
      text(
        ctx,
        api,
        v.old.toFixed(3) + ' × ' + v.a.toFixed(3),
        660,
        635,
        30,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('selection-b-x-x', () =>
      text(ctx, api, 'Δ × B(x) × x', 960, 885, 30, themeColors.pink, 'center'),
    );
    const readout = api.focus.target('selection-readout-4', () =>
      card(
        ctx,
        api,
        v.read ? 'C × new = ' + v.y.toFixed(3) : 'Readout waiting',
        1360,
        730,
        400,
        v.read ? themeColors.cyan : themeColors.muted,
      ),
    );
    api.connect(ctx, result, readout, {
      color: v.read ? themeColors.cyan : themeColors.muted,
    });
    api.focus.target('selection-equation', () =>
      equation(
        ctx,
        api,
        String.raw`h_t=e^{-\Delta_t}h_{t-1}+\Delta_tB_tx_t`,
        960,
        990,
        48,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'selection',
  draw: drawSelection,
  cues: [
    'selective-coefficients',
    'input-activation',
    'selective-carry',
    'selective-write',
    'selective-readout',
    'ssm-selective-state',
    'ssm-selective-readout',
    'preserve-evidence',
    'decay-and-replace',
  ],
};
