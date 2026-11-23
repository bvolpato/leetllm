import { covered } from '../arithmetic.mjs';
import {
  constructionArrow,
  constructionBox,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionDiagnosticPlan(
  ctx,
  scene,
  state,
  api,
  C,
  f,
  b,
  p,
  show,
  prog,
  done,
  original,
) {
  if (b === 0) {
    constructionHeading(ctx, api, C, 'Declare the question and installed run-level coverage');
    const rows = [
      ['1', 'readiness', 'deployment /software'],
      ['2', 'failure epilogue', 'PCIe /memory /NVLink'],
      ['3', 'administrator post-mortem', 'nvbandwidth /NCCL /stress'],
      ['4', 'extended post-mortem', 'longer memory /pulse'],
    ];
    rows.forEach(([n, a, z], i) => {
      const y = 360 + i * 145;
      constructionBox(ctx, api, C, 'Level ' + n, 280, y, 180, 85, C.yellow, 33);
      constructionText(ctx, api, C, a, 470, y + 10, 28, C.cyan);
      constructionText(ctx, api, C, z, 1120, y + 10, 28, C.ink);
    });
    constructionNote(
      ctx,
      api,
      C,
      'Inspected run table · exact availability depends on version, device, driver and plugins.',
    );
  } else if (b === 1) {
    constructionHeading(
      ctx,
      api,
      C,
      'Run provenance and active probe bind to the required topology',
    );
    constructionBox(ctx, api, C, 'Fresh run D7   /   GPU 0 ↔ GPU 1', 960, 370, 1100, 90, C.blue, 33);
    constructionBox(ctx, api, C, 'selected fabric probe', 400, 620, 620, 110, C.cyan, 32);
    constructionBox(ctx, api, C, 'peer path under isolated load', 1450, 620, 650, 110, C.cyan, 30);
    const q = prog('gpu-diagnostic-probe', 1);
    constructionArrow(ctx, api, C, 740, 620, 1090, 620, C.cyan);
    api.circle(ctx, 780 + 260 * q, 620, 14, C.yellow);
    if (show('gpu-diagnostic-setup', 1))
      constructionText(
        ctx,
        api,
        C,
        'Executable missing  /  interpret the setup failure',
        960,
        870,
        33,
        C.pink,
        'center',
      );
    constructionNote(
      ctx,
      api,
      C,
      'Keep the version, entities, parameters, timestamps, outcomes and exit status together.',
    );
  } else {
    constructionHeading(ctx, api, C, 'Execute the actual diagnostic-coverage predicate');
    const phase = show('gpu-diagnostic-extra-fail', 2)
        ? 2
        : show('gpu-diagnostic-pass-input', 2)
          ? 1
          : 0,
      results =
        phase === 0
          ? {
              pcie: 'Pass',
              nvbandwidth: 'Skip',
            }
          : phase === 1
            ? {
                pcie: 'Pass',
                nvbandwidth: 'Pass',
              }
            : {
                pcie: 'Pass',
                nvbandwidth: 'Pass',
                memory: 'Fail',
              },
      complete = covered(results, ['pcie', 'nvbandwidth']),
      resultShown =
        phase === 0
          ? done('gpu-result-diagnostic-required-false', 2)
          : phase === 1 ? done('gpu-diagnostic-required-pass', 2) : done('gpu-diagnostic-extra-false', 2);
    Object.entries(results).forEach(([name, status], i) => {
      constructionBox(ctx, api, C, name, 550, 410 + i * 150, 650, 90, C.blue, 32);
      constructionArrow(
        ctx,
        api,
        C,
        910,
        410 + i * 150,
        1010,
        410 + i * 150,
        status === 'Pass' ? C.green : C.pink,
      );
      constructionBox(
        ctx,
        api,
        C,
        status,
        1360,
        410 + i * 150,
        500,
        90,
        status === 'Pass' ? C.green : C.pink,
        35,
      );
    });
    constructionText(
      ctx,
      api,
      C,
      (resultShown ? 'coverage ' + complete : 'coverage pending') +
        ' · quarantine remains an independent state',
      960,
      945,
      34,
      resultShown ? (complete ? C.green : C.pink) : C.muted,
      'center',
    );
    constructionNote(
      ctx,
      api,
      C,
      'Declare a nonempty plan. Each required check needs a result from this run.',
    );
  }
}
export function drawDiagnosticPlanStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionDiagnosticPlan);
}
export default {
  id: 'diagnostic-plan',
  draw: drawDiagnosticPlanStage,
  cues: [
    'diagnostic-plan-0',
    'diagnostic-plan-1',
    'gpu-diagnostic-probe',
    'gpu-diagnostic-setup',
    'diagnostic-plan-2',
    'gpu-diagnostic-pass-input',
    'gpu-diagnostic-required-pass',
    'gpu-diagnostic-extra-false',
    'gpu-diagnostic-extra-fail',
    'gpu-result-diagnostic-required-false',
  ],
};
