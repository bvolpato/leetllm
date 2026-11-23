import { mix } from '../arithmetic.mjs';
import { rowFrame } from '../model.mjs';
import { box, code, footer, mark, rowObject, text } from '../defaults.mjs';
export function drawRowValues(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    modelState = rowFrame(state);
  if (currentBeat === 0) {
    mark(api, 'json-source', () =>
      rowObject(
        ctx,
        api,
        150,
        310,
        modelState.raw,
        'one JSONL line · expanded view',
        api.C.blue,
        840,
        29,
      ),
    );
    mark(api, 'python-row', () => {
      if (modelState.decoded === 1) {
        text(ctx, api, 'row · dict', 1120, 350, 40, api.C.cyan);
        code(ctx, api, ['"prompt" → "Access request 102 status?"'], 1060, 435, 26);
        code(ctx, api, ['"expected" → "blocked"'], 1060, 525, 32);
        code(ctx, api, ['"prediction" → " ESCALATED "'], 1060, 615, 30);
        text(ctx, api, 'keys · str', 1060, 705, 28, api.C.muted);
        text(ctx, api, 'values · str', 1440, 705, 28, api.C.muted);
      } else text(ctx, api, 'row = ?', 1300, 730, 43, api.C.muted, 'center', true);
    });
    mark(api, 'loads-call', () =>
      code(ctx, api, ['import json', 'row = json.loads(line)'], 180, 825, 40, 70, 1),
    );
  } else {
    mark(api, 'raw-values', () => {
      text(ctx, api, 'row["prediction"]', 180, 310, 34, api.C.blue, 'left', true);
      text(ctx, api, JSON.stringify(modelState.raw), 180, 380, 46, api.C.ink, 'left', true);
      text(
        ctx,
        api,
        'row["expected"] = ' + JSON.stringify(modelState.rawExpected),
        180,
        470,
        32,
        api.C.muted,
        'left',
        true,
      );
    });
    mark(api, 'normalize-code', () =>
      code(
        ctx,
        api,
        [
          'prediction = row["prediction"]',
          'prediction = prediction.strip()',
          'prediction = prediction.lower()',
          'expected = row["expected"].strip().lower()',
        ],
        180,
        595,
        32,
        65,
        currentBeat === 1 ? (modelState.lower > 0 ? 2 : 1) : -1,
      ),
    );
    mark(api, 'normalized-prediction', () => {
      const width = mix(600, 490, modelState.strip);
      box(ctx, api, 1160, 330, width, 165, api.C.cyan);
      text(ctx, api, JSON.stringify(modelState.value), 1185, 428, 37, api.C.cyan, 'left', true);
      text(ctx, api, 'prediction · str', 1160, 555, 31, api.C.muted);
      if (currentBeat === 1 && modelState.strip > 0 && modelState.strip < 1) {
        text(ctx, api, '␠', 1120 - 80 * modelState.strip, 660, 40, api.C.yellow, 'center', true);
        text(ctx, api, 'ESCALATED', 1410, 660, 36, api.C.cyan, 'center', true);
        text(ctx, api, '␠', 1710 + 60 * modelState.strip, 660, 40, api.C.yellow, 'center', true);
        text(ctx, api, 'strip() builds a new string', 1410, 740, 27, api.C.muted, 'center', true);
      }
      if (currentBeat === 1 && modelState.lower > 0 && modelState.lower < 1) {
        const k = Math.floor(modelState.lower * modelState.stripped.length);
        const building = modelState.normalized.slice(0, k) + modelState.stripped.slice(k);
        text(ctx, api, building, 1410, 660, 37, api.C.cyan, 'center', true);
        text(ctx, api, 'lower() builds a new string', 1410, 740, 27, api.C.muted, 'center', true);
      }
    });
    if (currentBeat === 2) {
      mark(api, 'equality-code', () =>
        code(ctx, api, ['is_correct = prediction == expected'], 180, 885, 39, 60, 0),
      );
      mark(api, 'comparison', () => {
        text(
          ctx,
          api,
          JSON.stringify(modelState.normalized) +
            ' == ' +
            JSON.stringify(modelState.normalizedExpected),
          1450,
          684,
          39,
          api.C.ink,
          'center',
          true,
        );
        text(
          ctx,
          api,
          modelState.equal === null ? 'Boolean = ?' : modelState.equal ? 'True' : 'False',
          1450,
          810,
          64,
          modelState.equal === null ? api.C.muted : api.C.yellow,
          'center',
          true,
        );
      });
    } else
      footer(ctx, api, 'Each string method returns a new value. The original row stays visible.');
  }
}
export default {
  id: 'row-values',
  draw: drawRowValues,
  cues: [
    'decode-row',
    'loads-name',
    'strip-label',
    'lower-label',
    'compare-labels',
    'compare-expression',
  ],
};
