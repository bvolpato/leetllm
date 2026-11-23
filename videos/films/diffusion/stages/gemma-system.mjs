import { opProgress } from '../construction.mjs';
import {
  drawConstructionBox,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionRoute,
  drawConstructionRows,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawGemmaSystem(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'gemma-system');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'One token uses a subset of the experts'
        : currentBeat === 1
          ? 'A finished canvas becomes encoder context'
          : 'Internal selection and external commitment are separate',
    );
    if (currentBeat === 0) {
      drawConstructionRows(
        ctx,
        api,
        [
          ['Gemma 4 MoE derivative', '25.2B total / 3.8B active'],
          ['Routed + shared experts', '8 of 128 routed + one shared'],
          ['Modalities', 'Text / image / video → text'],
        ],
        385,
        175,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Google documentation and model card inspected November 7, 2026',
      );
    } else if (currentBeat === 1) {
      drawConstructionBox(
        ctx,
        api,
        'Autoregressive encoder context KV',
        170,
        380,
        1580,
        themeColors.blue,
        110,
        34,
      );
      drawConstructionBox(
        ctx,
        api,
        'Bidirectional decoder: 256-token canvas',
        360,
        690,
        1200,
        themeColors.cyan,
        130,
        36,
      );
      drawConstructionRoute(
        ctx,
        api,
        [
          {
            x: 530,
            y: 520,
          },
          {
            x: 530,
            y: 650,
          },
        ],
        progress,
        themeColors.blue,
      );
      drawConstructionRoute(
        ctx,
        api,
        [
          {
            x: 1420,
            y: 670,
          },
          {
            x: 1420,
            y: 530,
          },
        ],
        progress,
        themeColors.pink,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Finish a block → append to context → next canvas · max 48, typical reported 12–16 steps',
      );
    } else {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Condition A', 'Condition B', 'Sampler stop'],
          ['Average entropy < threshold', 'Two consecutive predictions identical', 'both required'],
          ['Retained low-entropy positions', 'Others renoised', 'still internal'],
        ],
        190,
        410,
        1540,
        270,
        themeColors.cyan,
        28,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Largest reported speed advantage: low to medium batch sizes on one accelerator',
      );
    }
    return;
  }
}
export default {
  id: 'gemma-system',
  draw: drawGemmaSystem,
  cues: ['df-gemma-system-0', 'df-gemma-system-1', 'df-gemma-system-2'],
};
