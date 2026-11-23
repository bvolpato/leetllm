import { sampleModel } from '../model.mjs';
import { connectShapes, drawCard, drawLegacyText } from '../defaults.mjs';
export function drawCausalKeys(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('causal-keys', state),
    currentBeat = modelState.step;
  {
    api.focus.target('causal-keys-chained-sha-256-structured-teaching-keys', () =>
      drawLegacyText(
        ctx,
        api,
        'Chained SHA-256 · structured teaching keys',
        120,
        250,
        30,
        themeColors.muted,
      ),
    );
    const rows = [modelState.oldBlocks, modelState.newBlocks];
    rows.forEach((blocks, row) => {
      api.focus.target('causal-keys-readout', () =>
        drawLegacyText(
          ctx,
          api,
          row === 0 ? 'Stored' : currentBeat === 0 ? 'Same request' : 'Edited request',
          120,
          340 + row * 245,
          28,
          themeColors.muted,
        ),
      );
      const nodes = blocks.map((label, i) =>
        api.focus.target('causal-keys-readout-2', () =>
          drawCard(
            ctx,
            api,
            label,
            350 + i * 480,
            300 + row * 245,
            390,
            row === 1 && modelState.changed[i] ? themeColors.pink : themeColors.blue,
          ),
        ),
      );
      nodes
        .slice(0, -1)
        .forEach((node, i) =>
          connectShapes(
            ctx,
            api,
            node,
            nodes[i + 1],
            row === 1 && modelState.changed[i + 1] ? themeColors.pink : themeColors.blue,
            modelState.p,
          ),
        );
      nodes.forEach((node, i) =>
        api.focus.target('causal-keys-readout-3', () =>
          drawLegacyText(
            ctx,
            api,
            row === 1 && !modelState.keyReady[i]
              ? 'digest pending'
              : (row === 0 ? modelState.oldKeys : modelState.keys)[i].slice(0, 12),
            node.x + 195,
            node.y + 145,
            26,
            row === 1 && !modelState.keyReady[i]
              ? themeColors.yellow
              : row === 1 && modelState.changed[i]
                ? themeColors.pink
                : themeColors.muted,
            'center',
          ),
        ),
      );
    });
    api.focus.target('causal-keys-equation', () =>
      api.math(
        ctx,
        String.raw`H_k=\operatorname{hash}(H_{k-1},\mathrm{tokens}_k,\mathrm{scope})`,
        960,
        865,
        40,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('causal-keys-readout-4', () =>
      drawLegacyText(
        ctx,
        api,
        currentBeat === 0
          ? 'Each key includes all preceding history'
          : 'Unchanged tools inherit the edited guide key',
        960,
        965,
        30,
        currentBeat === 0 ? themeColors.muted : themeColors.pink,
        'center',
      ),
    );
  }
}
export default {
  id: 'causal-keys',
  draw: drawCausalKeys,
  cues: [
    'history-chain',
    'chained-hash',
    'edit-guide',
    'propagated-key',
    'actual-digest',
    'computation-contract',
  ],
};
