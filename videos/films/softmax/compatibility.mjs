import { COMPLETE_CHAPTERS } from './fixtures.mjs';
import { withSoftmaxCompleteFrame, withSoftmaxOriginalFrame } from './defaults.mjs';
import { paintSoftmaxOriginalIntro } from './stages/intro.mjs';
import { paintSoftmaxOriginalScores } from './stages/scores.mjs';
import { paintSoftmaxOriginalExponentials } from './stages/exponentials.mjs';
import { paintSoftmaxOriginalMass } from './stages/mass.mjs';
import { paintSoftmaxOriginalLoss } from './stages/loss.mjs';
import { paintSoftmaxOriginalGradient } from './stages/gradient.mjs';
import { paintSoftmaxOriginalUpdate } from './stages/update.mjs';
import { paintSoftmaxOriginalTemperature } from './stages/temperature.mjs';
import { paintSoftmaxOriginalTransfer } from './stages/transfer.mjs';
import { paintSoftmaxCompleteGradientChain } from './stages/gradient-chain.mjs';
import { paintSoftmaxCompleteEntropyReference } from './stages/entropy-reference.mjs';
import { paintSoftmaxCompleteSquaredVsCe } from './stages/squared-vs-ce.mjs';
import { paintSoftmaxCompleteLossInputContract } from './stages/loss-input-contract.mjs';
import { paintSoftmaxCompleteTemperatureLimits } from './stages/temperature-limits.mjs';
import { paintSoftmaxCompleteSmoothingEquilibrium } from './stages/smoothing-equilibrium.mjs';
import { paintSoftmaxCompleteTeacherForcing } from './stages/teacher-forcing.mjs';
import { paintSoftmaxCompleteTokenReduction } from './stages/token-reduction.mjs';
import { paintSoftmaxCompleteClassNotPosition } from './stages/class-not-position.mjs';
import { paintSoftmaxCompleteWeightedReduction } from './stages/weighted-reduction.mjs';
import { paintSoftmaxCompleteVocabularyTiles } from './stages/vocabulary-tiles.mjs';
import { paintSoftmaxCompleteEarnedTransfer } from './stages/earned-transfer.mjs';
function selectSoftmaxOriginal(ctx, scene, state, api, C, b, p, cues, colors, xs, amount, starts) {
  switch (scene.id) {
    case 'intro':
      return paintSoftmaxOriginalIntro(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'scores':
      return paintSoftmaxOriginalScores(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'exponentials':
      return paintSoftmaxOriginalExponentials(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'mass':
      return paintSoftmaxOriginalMass(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'loss':
      return paintSoftmaxOriginalLoss(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'gradient':
      return paintSoftmaxOriginalGradient(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'update':
      return paintSoftmaxOriginalUpdate(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'temperature':
      return paintSoftmaxOriginalTemperature(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    case 'transfer':
      return paintSoftmaxOriginalTransfer(
        ctx,
        scene,
        state,
        api,
        C,
        b,
        p,
        cues,
        colors,
        xs,
        amount,
        starts,
      );
    default:
      throw new Error('Unknown softmax scene ' + scene.id);
  }
}
function selectSoftmaxComplete(ctx, scene, state, api, C, m, f, b, colors, xs, started, progress) {
  switch (scene.id) {
    case 'gradient-chain':
      return paintSoftmaxCompleteGradientChain(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'entropy-reference':
      return paintSoftmaxCompleteEntropyReference(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'squared-vs-ce':
      return paintSoftmaxCompleteSquaredVsCe(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'loss-input-contract':
      return paintSoftmaxCompleteLossInputContract(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'temperature-limits':
      return paintSoftmaxCompleteTemperatureLimits(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'smoothing-equilibrium':
      return paintSoftmaxCompleteSmoothingEquilibrium(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'teacher-forcing':
      return paintSoftmaxCompleteTeacherForcing(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'token-reduction':
      return paintSoftmaxCompleteTokenReduction(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'class-not-position':
      return paintSoftmaxCompleteClassNotPosition(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'weighted-reduction':
      return paintSoftmaxCompleteWeightedReduction(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'vocabulary-tiles':
      return paintSoftmaxCompleteVocabularyTiles(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
    case 'earned-transfer':
      return paintSoftmaxCompleteEarnedTransfer(
        ctx,
        scene,
        state,
        api,
        C,
        m,
        f,
        b,
        colors,
        xs,
        started,
        progress,
      );
  }
}
export function drawComplete(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, selectSoftmaxComplete);
}
export function draw(ctx, scene, state, api) {
  if (COMPLETE_CHAPTERS.has(scene.id)) return drawComplete(ctx, scene, state, api);
  withSoftmaxOriginalFrame(ctx, scene, state, api, selectSoftmaxOriginal);
}
