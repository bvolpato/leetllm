import { fmt, mc, vec } from '../arithmetic.mjs';
import { BLENDED_OUTPUT, ROUTER_LOGITS, ROUTING } from '../fixtures.mjs';
import { moeCue } from '../construction.mjs';
import { moeValidatedRoute } from '../model.mjs';
import {
  arrow,
  footer,
  matrix,
  mechanismText,
  proportionStrip,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawRouterContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    Q = (id) => moeCue(state, id, 'settle'),
    cueProgress = (i) => moeCue(state, 'router-contract-op-' + i, 'progress'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-router-contract-mechanism', () => {
    if (currentBeat === 0) {
      mechanismText(
        ctx,
        api,
        'Same full logits · exact versus rounded arithmetic',
        960,
        290,
        34,
        themeColors.yellow,
      );
      matrix(ctx, api, cols, [ROUTER_LOGITS], 340, 365, 240);
      const exact = resultComplete('exact-gates'),
        output = resultComplete('exact-output'),
        rounded = resultComplete('rounded-output');
      if (exact) {
        proportionStrip(ctx, api, cols, ROUTING.weights, 280, 545, 600, [
          themeColors.blue,
          themeColors.yellow,
        ]);
        mechanismText(
          ctx,
          api,
          'Exact gates ' + vec(ROUTING.weights),
          580,
          665,
          30,
          themeColors.blue,
        );
      }
      if (output)
        tag(ctx, api, 'Exact y starts ' + vec(BLENDED_OUTPUT), 1280, 585, 680, themeColors.cyan);
      if (rounded) {
        proportionStrip(ctx, api, cols, [2 / 3, 1 / 3], 280, 755, 600, [
          themeColors.blue,
          themeColors.yellow,
        ]);
        tag(ctx, api, 'Rounded y starts [4/3, 1]', 1280, 795, 680, themeColors.yellow);
      }
      footer(
        ctx,
        api,
        'Four coordinates in the executable fixture; the original plane shows coordinates 1 and 2.',
      );
    } else if (currentBeat === 1) {
      const step = cueProgress(1),
        shift = resultComplete('stable-shift');
      mechanismText(
        ctx,
        api,
        'Finite vector → finite projection → stable exponentials',
        960,
        290,
        35,
        themeColors.yellow,
      );
      matrix(ctx, api, cols, [['x0', 'x1', 'x2', 'x3']], 230, 390, 140);
      arrow(ctx, api, 800, 455, 980, 455);
      matrix(
        ctx,
        api,
        cols,
        [shift ? ROUTER_LOGITS.map((x) => x - Math.max(...ROUTER_LOGITS)) : ROUTER_LOGITS],
        1020,
        390,
        155,
      );
      if (shift) {
        mechanismText(
          ctx,
          api,
          'Subtract max = −0.65 from every score',
          1280,
          580,
          31,
          themeColors.cyan,
        );
        const masses = ROUTER_LOGITS.map((x) => Math.exp(x + 0.65));
        masses.forEach((v, i) => {
          ctx.save();
          ctx.globalAlpha *= Q('stable-shift');
          rectangle(ctx, api, 1070, 650 + i * 65, 500 * v, 38, cols[i]);
          ctx.restore();
          mechanismText(
            ctx,
            api,
            'exp(' + fmt(ROUTER_LOGITS[i] + 0.65) + ')',
            830,
            678 + i * 65,
            27,
            cols[i],
          );
        });
      }
      const probes = [true, 1.5].map((k) => {
        try {
          moeValidatedRoute(
            [1, 0, 0, 0],
            ROUTER_LOGITS.map((z) => [z, 0, 0, 0]),
            k,
          );
          return 'accepted';
        } catch {
          return 'rejected';
        }
      });
      tag(
        ctx,
        api,
        resultComplete('router-contract-op-1')
          ? 'k=true: ' + probes[0] + '; k=1.5: ' + probes[1]
          : 'Probe k = true / 1.5',
        490,
        600,
        650,
        resultComplete('router-contract-op-1') ? themeColors.pink : themeColors.yellow,
      );
      footer(
        ctx,
        api,
        'Dimension and finite-number checks apply before dispatch; stable arithmetic preserves ratios.',
      );
    } else {
      const tied = resultComplete('tie-order'),
        normalized = resultComplete('normalized');
      mechanismText(
        ctx,
        api,
        'Equal scores need a deterministic tie rule',
        960,
        290,
        35,
        themeColors.yellow,
      );
      matrix(ctx, api, cols, [[0, 0, 0, 0]], 360, 380, 240);
      for (let i = 0; i < 4; i++) {
        const x = 480 + i * 240;
        rectangle(
          ctx,
          api,
          x - 75,
          550,
          150,
          120,
          tied && i < 2 ? cols[i] : themeColors.panel,
          cols[i],
        );
        mechanismText(ctx, api, 'E' + i, x, 625, 35, tied && i < 2 ? themeColors.bg : cols[i]);
      }
      if (tied)
        mechanismText(
          ctx,
          api,
          'Chosen IDs [0, 1] in this implementation',
          960,
          755,
          35,
          themeColors.cyan,
        );
      if (normalized) {
        proportionStrip(ctx, api, cols, [0.5, 0.5], 580, 830, 760, [
          themeColors.blue,
          themeColors.pink,
        ]);
        mechanismText(ctx, api, '0.5 + 0.5 = 1', 960, 960, 34, themeColors.green);
      }
      footer(
        ctx,
        api,
        'Checkpoint-specific selection and weighting rules define the learned function.',
      );
    }
  });
}
export default {
  id: 'router-contract',
  draw: drawRouterContract,
  cues: [
    'mo-router-contract-op-0',
    'mo-exact-gates',
    'mo-exact-output',
    'mo-rounded-output',
    'mo-router-contract-op-1',
    'mo-stable-shift',
    'mo-router-contract-op-2',
    'mo-tie-order',
    'mo-normalized',
  ],
};
