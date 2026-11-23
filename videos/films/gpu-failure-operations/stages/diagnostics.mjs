import { suppliedDiagnostics } from '../fixtures.mjs';
import { diagnosticRun, gpuFrame } from '../arithmetic.mjs';
import { diagram } from '../incident-diagram.mjs';

const runs = suppliedDiagnostics.map(diagnosticRun);
const measureCues = ['diagnostics-skip', 'diagnostics-fail', 'diagnostics-both-pass'];
const verdictCues = ['gpu-result-diagnostic-incomplete', 'diagnostics-below', 'diagnostics-beat-2-focus-1'];

export function drawDiagnosticsStage(ctx, scene, state, api) {
  const f = gpuFrame(state);
  const { C } = api;
  const { label, block, line } = diagram(ctx, api);
  const { entity, version, parameters } = runs[0];
  const plotX = 535, scale = 40;
  const threshold = plotX + parameters.bandwidthMinimum * scale;

  api.focus.target('diagnostics-run-provenance', () => {
    label('Isolated GPU pair', 150, 257, 54);
    label(entity + '    ·    ' + parameters.seconds + ' s per run    ·    ' + version, 150, 325, 30, C.muted);
  });
  api.focus.target('diagnostics-plugin-results', () => {
    label('Run', 150, 435, 32);
    label('PCIe lanes', 280, 435, 32);
    label('Peer bandwidth', plotX, 435, 39);
    label('Result', 1450, 435, 32);
    label('Exit', 1700, 435, 32);
    label(parameters.bandwidthMinimum + ' GB/s minimum', threshold, 435, 32, C.yellow, 'center');

    runs.forEach((run, i) => {
      const y = 516 + i * 136;
      const cue = measureCues[i];
      label(String(i + 1), 155, y + 30, 43);
      if (!f.started(cue, 1)) return;
      label('16 / 16', 280, y + 30, 38, C.green);
      const measured = f.completed(cue, 1);
      if (run.bandwidth === null) {
        if (measured) label('Peer unavailable', plotX, y + 30, 35, C.muted);
      } else {
        const width = scale * run.bandwidth * f.progress(cue, 1);
        if (width > 0) block(plotX, y, width, 40, C.cyan);
        if (measured) label(run.bandwidth.toFixed(1) + ' GB/s', plotX, y + 83, 35);
      }
      const decided = f.completed(verdictCues[i], 1);
      if ((run.bandwidth === null && measured) || decided) {
        const tone = run.coverage ? C.green : run.bandwidth === null ? C.yellow : C.pink;
        label(run.results.bandwidth, 1450, y + 30, 39, tone);
      }
      if (decided) label(String(run.exitStatus), 1700, y + 30, 39);
    });
    line(threshold, 463, threshold, 841, C.yellow, 3);
  });

  api.focus.target('diagnostics-run-result', () => {
    const i = measureCues.findLastIndex(cue => f.started(cue, 1));
    if (i >= 0 && f.completed(verdictCues[i], 1)) {
      const run = runs[i];
      const status = run.coverage ? 'Both required tests passed' : run.bandwidth === null
        ? 'Bandwidth still needs a measurement' : 'Bandwidth below the required minimum';
      label('Run ' + (i + 1) + '   ·   ' + status, 960, 990, 43, run.coverage ? C.green : C.ink, 'center');
    } else label('Required tests   ·   PCIe lanes and peer bandwidth', 960, 990, 36, C.muted, 'center');
  });
}

export default {
  id: 'diagnostics',
  draw: drawDiagnosticsStage,
  cues: ['diagnostics-beat-1-focus-1', ...measureCues, ...verdictCues],
};
