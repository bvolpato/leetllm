import { edgeState, executeGraph } from '../model.mjs';
import { drawEdgeCard, drawEdgeRectangle, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawDiagnosticEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('diagnostic-evidence', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-diagnostic-evidence-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Distinguish an observed symptom from a candidate boundary cost'
        : currentBeat === 1
          ? 'Test the allocation hypothesis against termination evidence'
          : 'Reproduce the exact offline dependency boundary',
    );
    if (currentBeat === 0) {
      drawEdgeCard(
        ctx,
        api,
        'Supplied symptom: 6 W / 5 tokens per second',
        150,
        350,
        1600,
        themeColors.pink,
        90,
      );
      const graph = executeGraph(['npu', 'cpu', 'npu']);
      graph.spans.forEach((span, i) => {
        const width = (span.end - span.start) * 60;
        drawEdgeRectangle(
          ctx,
          api,
          190 + span.start * 60,
          530,
          width,
          95,
          span.device === 'boundary'
            ? themeColors.pink
            : span.device === 'cpu'
              ? themeColors.blue
              : themeColors.green,
        );
      });
      drawEdgeText(
        ctx,
        api,
        'Earlier supplied graph: boundaries are a hypothesis to profile',
        960,
        700,
        29,
        themeColors.yellow,
        'center',
      );
      const items = ['tokenizer IDs', 'retrieved M7', 'template', 'sampling', 'converted output'];
      items.forEach((v, i) =>
        drawEdgeCard(
          ctx,
          api,
          v,
          150 + i * 325,
          820,
          300,
          done('citation') ? themeColors.green : themeColors.blue,
          90,
        ),
      );
    } else if (currentBeat === 1) {
      const positions = Math.floor(q * 8192),
        mib = (2 * 24 * 4 * 64 * positions * 2) / 2 ** 20,
        scale = 1500 / 256;
      drawEdgeRectangle(ctx, api, 180, 470, mib * scale, 120, themeColors.cyan);
      drawEdgeText(
        ctx,
        api,
        'Illustrative same GQA layout: ' + positions + ' cached positions',
        180,
        390,
        30,
        themeColors.blue,
      );
      drawEdgeText(ctx, api, mib.toFixed(1) + ' MiB KV payload', 180, 665, 32, themeColors.cyan);
      drawEdgeRow(
        ctx,
        api,
        ['OS termination record', 'peak overlap', 'retained sessions', 'watchdog / unsupported op'],
        150,
        795,
        1600,
        100,
        themeColors.yellow,
      );
      drawEdgeText(
        ctx,
        api,
        'Increasing KV is one hypothesis; an OS record determines the next investigation',
        960,
        950,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      const files = ['model weights', 'tokenizer', 'template', 'modality assets', 'runtime'],
        checked = Math.floor(q * 5);
      files.forEach((v, i) => {
        const y = 370 + i * 105;
        drawEdgeText(
          ctx,
          api,
          (i < checked ? '✓ ' : '□ ') + v,
          220,
          y,
          31,
          i === 1 ? themeColors.pink : themeColors.blue,
        );
        if (i === 1)
          drawEdgeText(
            ctx,
            api,
            'lazy network dependency? reproduce with networking disabled',
            710,
            y,
            28,
            themeColors.yellow,
          );
      });
      drawEdgeRow(
        ctx,
        api,
        ['rate timestamps', 'thermal + power', 'ambient + charging', 'workload + output'],
        150,
        900,
        1600,
        80,
        themeColors.cyan,
      );
    }
    note('No new device diagnosis is asserted; these are explicit candidate experiments');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'diagnostic-evidence',
  draw: drawDiagnosticEvidence,
  cues: [
    'edge-diagnostic-evidence-op-0',
    'edge-diagnostic-evidence-boundaries',
    'edge-diagnostic-evidence-citation',
    'edge-diagnostic-evidence-op-1',
    'edge-diagnostic-evidence-termination',
    'edge-diagnostic-evidence-op-2',
    'edge-diagnostic-evidence-aligned',
    'edge-diagnostic-evidence-offline',
  ],
};
