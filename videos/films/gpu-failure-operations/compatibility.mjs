import { GPU_CONSTRUCTED } from './fixtures.mjs';
import { withGpuConstructionFrame, withGpuLegacyFrame } from './defaults.mjs';
import { paintGpuLegacyIntro } from './stages/intro.mjs';
import { paintGpuLegacyFragments } from './stages/fragments.mjs';
import { paintGpuLegacyOwnership } from './stages/ownership.mjs';
import { paintGpuLegacyContain } from './stages/contain.mjs';
import { paintGpuLegacyDiagnostics } from './stages/diagnostics.mjs';
import { paintGpuLegacySoak } from './stages/soak.mjs';
import { paintGpuLegacyReadmit } from './stages/readmit.mjs';
import { paintGpuConstructionIntro } from './stages/intro.mjs';
import { paintGpuConstructionReceiptContract } from './stages/receipt-contract.mjs';
import { paintGpuConstructionMemoryContract } from './stages/memory-contract.mjs';
import { paintGpuConstructionFragments } from './stages/fragments.mjs';
import { paintGpuConstructionHistoryConstruction } from './stages/history-construction.mjs';
import { paintGpuConstructionFaultConstruction } from './stages/fault-construction.mjs';
import { paintGpuConstructionAsyncConstruction } from './stages/async-construction.mjs';
import { paintGpuConstructionContainmentContract } from './stages/containment-contract.mjs';
import { paintGpuConstructionDiagnosticPlan } from './stages/diagnostic-plan.mjs';
import { paintGpuConstructionAutomationContract } from './stages/automation-contract.mjs';
import { paintGpuConstructionAnalyzerConstruction } from './stages/analyzer-construction.mjs';
import { paintGpuConstructionEventConstruction } from './stages/event-construction.mjs';
import { paintGpuConstructionMixedConstruction } from './stages/mixed-construction.mjs';
import { paintGpuConstructionSoak } from './stages/soak.mjs';
import { paintGpuConstructionCanaryConstruction } from './stages/canary-construction.mjs';
import { paintGpuConstructionReadmit } from './stages/readmit.mjs';
import { paintGpuConstructionEarnedGpuTransfer } from './stages/earned-gpu-transfer.mjs';
function selectGpuLegacy(ctx, scene, state, api, C, c, t, s, b) {
  if (scene.id === 'intro') {
    return paintGpuLegacyIntro(ctx, scene, state, api, C, c, t, s, b);
  } else if (scene.id === 'fragments') {
    return paintGpuLegacyFragments(ctx, scene, state, api, C, c, t, s, b);
  } else if (scene.id === 'ownership') {
    return paintGpuLegacyOwnership(ctx, scene, state, api, C, c, t, s, b);
  } else if (scene.id === 'contain') {
    return paintGpuLegacyContain(ctx, scene, state, api, C, c, t, s, b);
  } else if (scene.id === 'diagnostics') {
    return paintGpuLegacyDiagnostics(ctx, scene, state, api, C, c, t, s, b);
  } else if (scene.id === 'soak') {
    return paintGpuLegacySoak(ctx, scene, state, api, C, c, t, s, b);
  } else {
    return paintGpuLegacyReadmit(ctx, scene, state, api, C, c, t, s, b);
  }
}
function selectGpuConstruction(ctx, scene, state, api, C, f, b, p, show, prog, done, original) {
  if (scene.id === 'intro') {
    return paintGpuConstructionIntro(
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
    );
  } else if (scene.id === 'receipt-contract') {
    return paintGpuConstructionReceiptContract(
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
    );
  } else if (scene.id === 'memory-contract') {
    return paintGpuConstructionMemoryContract(
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
    );
  } else if (scene.id === 'fragments') {
    return paintGpuConstructionFragments(
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
    );
  } else if (scene.id === 'history-construction') {
    return paintGpuConstructionHistoryConstruction(
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
    );
  } else if (scene.id === 'fault-construction') {
    return paintGpuConstructionFaultConstruction(
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
    );
  } else if (scene.id === 'async-construction') {
    return paintGpuConstructionAsyncConstruction(
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
    );
  } else if (scene.id === 'containment-contract') {
    return paintGpuConstructionContainmentContract(
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
    );
  } else if (scene.id === 'diagnostic-plan') {
    return paintGpuConstructionDiagnosticPlan(
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
    );
  } else if (scene.id === 'automation-contract') {
    return paintGpuConstructionAutomationContract(
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
    );
  } else if (scene.id === 'analyzer-construction') {
    return paintGpuConstructionAnalyzerConstruction(
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
    );
  } else if (scene.id === 'event-construction') {
    return paintGpuConstructionEventConstruction(
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
    );
  } else if (scene.id === 'mixed-construction') {
    return paintGpuConstructionMixedConstruction(
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
    );
  } else if (scene.id === 'soak') {
    return paintGpuConstructionSoak(ctx, scene, state, api, C, f, b, p, show, prog, done, original);
  } else if (scene.id === 'canary-construction') {
    return paintGpuConstructionCanaryConstruction(
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
    );
  } else if (scene.id === 'readmit') {
    return paintGpuConstructionReadmit(
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
    );
  } else if (scene.id === 'earned-gpu-transfer') {
    return paintGpuConstructionEarnedGpuTransfer(
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
    );
  }
}
export function draw(ctx, scene, state, api) {
  if (GPU_CONSTRUCTED.has(scene.id))
    return withGpuConstructionFrame(ctx, scene, state, api, selectGpuConstruction);
  withGpuLegacyFrame(ctx, scene, state, api, selectGpuLegacy);
}
