import { complete, cueProgress, pyP } from '../construction.mjs';
import { confidenceState } from '../model.mjs';
import { code, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawConfidenceContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    rows = confidenceState(state),
    progress = pyP(state, 'confidence-contract');
  pyMark(api, 'confidence-contract', () => {
    if (currentBeat === 0) {
      text(ctx, api, 'Current label scorer', 520, 310, 38, api.C.blue, 'center');
      code(
        ctx,
        api,
        ['prompt: str', 'expected: str', 'prediction: str', 'extra confidence: ignored'],
        200,
        420,
        34,
        90,
      );
      text(ctx, api, 'Separate future numeric helper', 1380, 310, 37, api.C.cyan, 'center');
      rail(ctx, api, 1090, 410, 600, 'True · bool', api.C.cyan, 110, 45);
      if (complete(state, 'py-confidence-bool')) {
        text(ctx, api, 'isinstance(True, int) → True', 1390, 640, 31, api.C.yellow, 'center', true);
        text(ctx, api, 'True + 1 → 2', 1390, 740, 40, api.C.yellow, 'center', true);
      }
      text(
        ctx,
        api,
        'The helper requires an explicit Boolean rejection.',
        960,
        930,
        33,
        api.C.muted,
        'center',
      );
    } else if (currentBeat === 3) {
      const marked = cueProgress(state, 'endpoint-digit', 3, 0.1, 0.25);
      const decode = cueProgress(state, 'endpoint-float', 3, 0.28, 0.42);
      const checked = cueProgress(state, 'endpoint-accept', 3, 0.52, 0.63) === 1;
      const c = api.C;
      text(ctx, api, 'JSON number in the file', 192, 327, 37, c.muted);
      text(ctx, api, 'Decoded float', 1060, 327, 37, c.muted);
      text(ctx, api, 'Helper', 1510, 327, 37, c.muted);
      const rawNumbers = ['1.0000000000000000', '1.0000000000000001'];
      rawNumbers.forEach((raw, i) => {
        const y = 480 + i * 205;
        const value = JSON.parse(raw);
        const valid = Number.isFinite(value) && 0 <= value && value <= 1;
        text(ctx, api, raw.slice(0, -1), 685, y, 48, c.ink, 'right', true);
        text(ctx, api, raw.at(-1), 685, y, 48, marked > 0 ? c.yellow : c.ink, 'left', true);
        if (marked > 0) api.line(ctx, 685, y + 16, 685 + 29 * marked, y + 16, c.yellow, 4);
        if (decode > 0) api.line(ctx, 765, y - 18, 765 + 245 * decode, y - 18, c.cyan, 4);
        if (decode === 1) {
          const literal = Number.isInteger(value) ? value.toFixed(1) : String(value);
          text(ctx, api, literal, 1060, y, 59, c.cyan, 'left', true);
        }
        if (checked) text(ctx, api, valid ? 'accept' : 'reject', 1510, y, 43, valid ? c.green : c.pink);
      });
      if (checked) text(ctx, api, '0.0 ≤ decoded value ≤ 1.0', 1060, 864, 33, c.ink, 'left', true);
    } else {
      const headings = ['JSON source', 'Python value · type', 'type → range → finite', 'decision'];
      headings.forEach((v, i) =>
        text(ctx, api, v, [180, 480, 1000, 1550][i], 280, 29, api.C.muted),
      );
      const comparingNonfinite = currentBeat === 2 && !complete(state, 'py-confidence-huge');
      rows.forEach((r, i) => {
        const y = 330 + i * 72;
        const isNonfinite = r.decoded === 'nan' || r.decoded === 'inf';
        const valueColor = comparingNonfinite && isNonfinite ? api.C.yellow : api.C.cyan;
        text(ctx, api, r.raw, 180, y, 32, api.C.blue, 'left', true);
        text(ctx, api, r.decoded + ' · ' + r.type, 480, y, 28, valueColor, 'left', true);
        const gate = r.stage;
        const stage =
          gate === 'pending'
            ? 'await type'
            : gate === 'type-stop'
              ? 'type stops'
              : gate === 'range-pending'
                ? 'await range'
                : gate === 'finite-pending'
                  ? 'await result'
                  : gate === 'range-stop'
                    ? 'range stops'
                    : 'all checks pass';
        text(ctx, api, stage, 1000, y, 28, gate.includes('stop') ? api.C.pink : api.C.muted);
        if (gate === 'accepted' || gate.includes('stop'))
          text(
            ctx,
            api,
            r.accepted ? 'accept' : r.error,
            1550,
            y,
            28,
            r.accepted ? api.C.green : api.C.pink,
            'left',
            true,
          );
      });
      if (currentBeat === 2) {
        const huge = complete(state, 'py-confidence-huge');
        if (huge)
          text(
            ctx,
            api,
            '10**400 > 1 → reject before float conversion',
            960,
            965,
            31,
            api.C.yellow,
            'center',
            true,
          );
        else
          text(
            ctx,
            api,
            complete(state, 'py-confidence-overflow')
              ? '1e400 → inf · valid JSON number, invalid probability'
              : 'NaN and Infinity are accepted Python decoder extensions.',
            960,
            965,
            29,
            api.C.muted,
            'center',
          );
      } else stripe(ctx, api, 180, 950, 1560, progress, api.C.cyan);
    }
  });
}
export default {
  id: 'confidence-contract',
  draw: drawConfidenceContract,
  cues: [
    'py-confidence-contract-0',
    'py-confidence-bool',
    'py-confidence-contract-1',
    'py-confidence-type',
    'py-confidence-range',
    'py-confidence-valid',
    'py-confidence-reject',
    'py-confidence-contract-2',
    'py-confidence-json',
    'py-confidence-overflow',
    'py-confidence-huge',
    'endpoint-digit',
    'endpoint-float',
    'endpoint-accept',
  ],
};
