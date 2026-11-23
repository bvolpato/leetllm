import { coreScenes } from './fixtures.mjs';
import { withPretrainingMainFrame } from './defaults.mjs';
import { drawOriginal } from './legacy-compatibility.mjs';
import { paintPretrainingMainIntro } from './stages/intro.mjs';
import { paintPretrainingMainInventoryPlan } from './stages/inventory-plan.mjs';
import { paintPretrainingMainArchives } from './stages/archives.mjs';
import { paintPretrainingMainProseGates } from './stages/prose-gates.mjs';
import { paintPretrainingMainScoreContracts } from './stages/score-contracts.mjs';
import { paintPretrainingMainCorpusEvidence } from './stages/corpus-evidence.mjs';
import { paintPretrainingMainMinhashWork } from './stages/minhash-work.mjs';
import { paintPretrainingMainLshChain } from './stages/lsh-chain.mjs';
import { paintPretrainingMainExposureSchedule } from './stages/exposure-schedule.mjs';
import { paintPretrainingMainDecontamination } from './stages/decontamination.mjs';
import { paintPretrainingMainPrivacy } from './stages/privacy.mjs';
import { paintPretrainingMainTokenizerChoice } from './stages/tokenizer-choice.mjs';
import { paintPretrainingMainBpeWork } from './stages/bpe-work.mjs';
import { paintPretrainingMainPackingWork } from './stages/packing-work.mjs';
import { paintPretrainingMainLabelLayout } from './stages/label-layout.mjs';
import { paintPretrainingMainRestartConsistency } from './stages/restart-consistency.mjs';
import { paintPretrainingMainAnnealSynthetic } from './stages/anneal-synthetic.mjs';
import { paintPretrainingMainFreshCorpus } from './stages/fresh-corpus.mjs';
import { paintPretrainingMainMixture } from './stages/mixture.mjs';
import { paintPretrainingMainBoundaries } from './stages/boundaries.mjs';
import { paintPretrainingMainLineage } from './stages/lineage.mjs';
import { paintPretrainingMainTransfer } from './stages/transfer.mjs';
function selectPretrainingMain(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (scene.id === 'intro') {
    return paintPretrainingMainIntro(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'inventory-plan') {
    return paintPretrainingMainInventoryPlan(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'archives') {
    return paintPretrainingMainArchives(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'prose-gates') {
    return paintPretrainingMainProseGates(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'score-contracts') {
    return paintPretrainingMainScoreContracts(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'corpus-evidence') {
    return paintPretrainingMainCorpusEvidence(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'minhash-work') {
    return paintPretrainingMainMinhashWork(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'lsh-chain') {
    return paintPretrainingMainLshChain(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'exposure-schedule') {
    return paintPretrainingMainExposureSchedule(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'decontamination') {
    return paintPretrainingMainDecontamination(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'privacy') {
    return paintPretrainingMainPrivacy(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'tokenizer-choice') {
    return paintPretrainingMainTokenizerChoice(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'bpe-work') {
    return paintPretrainingMainBpeWork(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'packing-work') {
    return paintPretrainingMainPackingWork(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'label-layout') {
    return paintPretrainingMainLabelLayout(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'restart-consistency') {
    return paintPretrainingMainRestartConsistency(
      ctx,
      scene,
      state,
      api,
      C,
      c,
      b,
      p,
      cue,
      P,
      D,
      beg,
    );
  } else if (scene.id === 'anneal-synthetic') {
    return paintPretrainingMainAnnealSynthetic(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'fresh-corpus') {
    return paintPretrainingMainFreshCorpus(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'mixture') {
    return paintPretrainingMainMixture(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'boundaries') {
    return paintPretrainingMainBoundaries(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'lineage') {
    return paintPretrainingMainLineage(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  } else if (scene.id === 'transfer') {
    return paintPretrainingMainTransfer(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  }
}
export function draw(ctx, scene, state, api) {
  if (!coreScenes.has(scene.id)) return drawOriginal(ctx, scene, state, api);
  withPretrainingMainFrame(ctx, scene, state, api, selectPretrainingMain);
}
