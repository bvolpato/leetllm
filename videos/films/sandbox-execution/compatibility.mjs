import { sandboxCueProgress } from './defaults.mjs';
import { paintSubjectIntroLegacy } from './stages/subject-intro.mjs';
import { paintEvidenceLoopLegacy } from './stages/evidence-loop.mjs';
import { paintSeparatedAuthorityLegacy } from './stages/separated-authority.mjs';
import { paintExecutionBoundariesLegacy } from './stages/execution-boundaries.mjs';
import { paintControlsByFailureLegacy } from './stages/controls-by-failure.mjs';
import { paintTeardownLifecycleLegacy } from './stages/teardown-lifecycle.mjs';
import { paintWasmBoundaryLegacy } from './stages/wasm-boundary.mjs';
import { paintEvaluateTwoAxesLegacy } from './stages/evaluate-two-axes.mjs';
import { paintSubjectIntro } from './stages/subject-intro.mjs';
import { paintEvidenceLoop } from './stages/evidence-loop.mjs';
import { paintFeedbackContract } from './stages/feedback-contract.mjs';
import { paintSeparatedAuthority } from './stages/separated-authority.mjs';
import { paintExecutionBoundaries } from './stages/execution-boundaries.mjs';
import { paintControlsByFailure } from './stages/controls-by-failure.mjs';
import { paintPreparedDependencies } from './stages/prepared-dependencies.mjs';
import { paintTeardownLifecycle } from './stages/teardown-lifecycle.mjs';
import { paintWasmBoundary } from './stages/wasm-boundary.mjs';
import { paintActualWasmHost } from './stages/actual-wasm-host.mjs';
import { paintWasmFailureMatrix } from './stages/wasm-failure-matrix.mjs';
import { paintEvaluateTwoAxes } from './stages/evaluate-two-axes.mjs';
import { paintEarnedParserCase } from './stages/earned-parser-case.mjs';
function drawLegacySandbox(ctx, scene, state, api) {
  const { C: themeColors, components: c, phase, teaching: t } = api;
  const currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    routeProgress = phase(beatProgress, 0.05, 0.9);
  if (scene.id === 'subject-intro') {
    return paintSubjectIntroLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'evidence-loop') {
    return paintEvidenceLoopLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'separated-authority') {
    return paintSeparatedAuthorityLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'execution-boundaries') {
    return paintExecutionBoundariesLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'controls-by-failure') {
    return paintControlsByFailureLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'teardown-lifecycle') {
    return paintTeardownLifecycleLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'wasm-boundary') {
    return paintWasmBoundaryLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else if (scene.id === 'evaluate-two-axes') {
    return paintEvaluateTwoAxesLegacy(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      phase,
      t,
      currentBeat,
      beatProgress,
      routeProgress,
    );
  } else {
    throw new Error(`Unknown sandbox-execution scene: ${scene.id}`);
  }
}
function drawSandboxUpgrade(ctx, scene, state, api) {
  const { C: themeColors, components: c } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    id = scene.id;
  if (id === 'evaluate-two-axes' && currentBeat < 3) return false;
  const on = (n) => sandboxCueProgress(ctx, api, id, n) > 0,
    done = (n) => sandboxCueProgress(ctx, api, id, n) >= 1;
  if (id === 'subject-intro') {
    paintSubjectIntro(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'evidence-loop') {
    paintEvidenceLoop(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'feedback-contract') {
    paintFeedbackContract(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'separated-authority') {
    paintSeparatedAuthority(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'execution-boundaries') {
    paintExecutionBoundaries(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'controls-by-failure') {
    paintControlsByFailure(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'prepared-dependencies') {
    paintPreparedDependencies(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'teardown-lifecycle') {
    paintTeardownLifecycle(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'wasm-boundary') {
    paintWasmBoundary(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'actual-wasm-host') {
    paintActualWasmHost(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'wasm-failure-matrix') {
    paintWasmFailureMatrix(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'evaluate-two-axes') {
    paintEvaluateTwoAxes(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else if (id === 'earned-parser-case') {
    paintEarnedParserCase(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      currentBeat,
      beatProgress,
      id,
      on,
      done,
    );
    return true;
  } else return false;
}
export function drawSandboxScene(ctx, scene, state, api) {
  if (drawSandboxUpgrade(ctx, scene, state, api)) return;
  return drawLegacySandbox(ctx, scene, state, api);
}
